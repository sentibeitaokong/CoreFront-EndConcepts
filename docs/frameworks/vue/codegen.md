# 代码生成阶段（Generate）

代码生成阶段是 Vue 3 模板编译的最后一环，将经过 `transform` 处理后挂载了 `codegenNode`、`helpers` 和 `hoists` 的抽象语法树（AST），翻译成最终可以在浏览器中执行的 JavaScript 渲染函数字符串。它本质上是一个**从 AST 到字符串的递归下降翻译器**。

## 1. generate 阶段概述

- **入口函数**：`generate(ast, options)`
- **核心任务**：将 JavaScript AST 转换为可执行的渲染函数代码字符串
- **技术特点**：
  - 递归下降翻译器（`genNode` 根据节点类型分派到具体生成函数）
  - 字符串拼接驱动（通过 `CodegenContext.push` 逐步构建代码）
  - 按需导入辅助函数（`generateImports` 生成 `import { ... } from "vue"` 语句）
  - 优化信息直接注入（`PatchFlag`、`dynamicProps` 作为数字和数组参数写入调用）
  - 静态提升常量前置声明（`hoists` 提取为模块级 `const`，放在函数外部）
  - Block Tree 代码生成（`openBlock` / `createElementBlock` 配合，实现扁平化 diff）
  - 事件缓存表达式生成（`_cache[x]` 保持事件处理函数引用稳定）

## 2. 核心数据结构

### 2.1 `CodegenContext`: 上下文管理器

为了把树形结构转化为带有完美缩进、格式规整的线性字符串,Vue设计了一个极其轻量但高效的字符串拼接器。

:::code-group

```typescript [codegen.ts]
interface CodegenContext {
  code: string // 正在构建的代码字符串
  preamble: string // 前置代码（静态常量声明等）
  source: string // 原始模板，用于 Source Map
  indentLevel: number // 当前缩进级别
  push(code: string): void // 向 code 追加字符串
  indent(): void // 增加一级缩进
  deindent(): void // 减少一级缩进
  newline(): void // 换行并追加缩进
  helper(key: symbol): string // 获取辅助函数的别名（如 _openBlock）
  pushScope(): void // 进入新的作用域
  popScope(): void // 退出作用域
}
```

:::

### 2.2 `CodegenResult`: 编译器最终产物

`generate` 函数的返回值：

:::code-group

```typescript [codegen.ts]
interface CodegenResult {
  code: string // 最终生成的 JavaScript 渲染函数的主体代码字符串。
  ast: RootNode // 经过 parse 解析、transform 转换并最终用于生成代码的 完整抽象语法树根节点
  preamble: string // 辅助函数导入 + 前置常量声明
  map?: SourceMap // Source Map（源码映射）对象(可选)
}
```

:::

## 3. `generate` 入口函数

`generate` 函数创建上下文后，按顺序调用各步骤，最终返回结果：

:::code-group

```typescript [codegen.ts]
export function generate(
  ast: RootNode,
  options: CodegenOptions = {},
): CodegenResult {
  // 1. 创建代码生成上下文（工作台）
  const context = createCodegenContext(ast, options)
  const { push, indent, deindent } = context

  // 2. 生成前置代码（引入 helper 辅助函数、静态提升变量等）
  genFunctionPreamble(ast, context)

  // 3. 生成函数签名
  const functionName = `render`
  const args = ['_ctx', '_cache']
  const signature = `export function ${functionName}(${args.join(', ')}) {`

  push(signature)
  indent() // 进入函数体，缩进级别 +1

  // 4. 生成函数体（核心执行）
  push(`return `)
  if (ast.codegenNode) {
    // 将整个 AST 树交由 genNode 进行递归降维翻译
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  // 5. 收尾闭合
  deindent() // 退出函数体，缩进级别 -1
  push(`}`)

  // 6. 返回生成的最终代码
  return {
    ast,
    code: context.code,
    map: context.map ? context.map.toJSON() : undefined,
  }
}
```

:::

### 3.1 `createCodegenContext`: 创建代码生成上下文

`createCodegenContext` 负责初始化代码缓冲区、缩进级别和作用域等状态。

:::code-group

```typescript [codegen.ts]
import { helperNameMap } from './runtimeHelpers'
function createCodegenContext(ast, options) {
  // 1. 默认配置初始化
  const {
    mode = 'function', // 编译模式：'function' (默认浏览器) 或 'module' (构建工具)
    prefixIdentifiers = mode === 'module', //标识符前缀决定了模板里的变量（比如 {{ msg }}）怎么转换：
    runtimeGlobalName = `Vue`, //运行时全局变量名
    runtimeModuleName = `vue`, //运行时模块名
  } = options

  // 2. 核心状态与方法
  const context = {
    mode,
    runtimeGlobalName,
    runtimeModuleName,
    prefixIdentifiers,
    code: '', // 终极产物：所有拼接的代码都在这里
    indentLevel: 0, // 追踪当前缩进级别

    // 将内部常量转换为实际的运行时函数名 (如将 Symbol 转换为 "_createVNode")
    helper(key) {
      return `_${helperNameMap[key]}`
    },

    // 最核心的拼接方法：无脑向 code 字符串后追加内容
    push(code) {
      context.code += code
    },

    // 增加缩进：级别 +1，并立刻换行补齐前置空格
    indent() {
      context.indentLevel++
      context.newline()
    },

    // 减少缩进：级别 -1，并默认换行补齐前置空格
    deindent(withoutNewLine = false) {
      context.indentLevel--
      if (!withoutNewLine) {
        context.newline()
      }
    },

    // 换行逻辑：敲一个回车，并根据当前的缩进级别补齐空格
    newline() {
      context.code += '\n' + `  `.repeat(context.indentLevel)
    },
  }

  return context
}
```

```typescript [runtimeHelpers.ts]
// 1. 定义唯一 Symbol 标记
export const OPEN_BLOCK = Symbol('openBlock')
export const CREATE_BLOCK = Symbol('createBlock')
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock')
export const CREATE_VNODE = Symbol('createVNode')
export const TO_DISPLAY_STRING = Symbol('toDisplayString')
export const RENDER_LIST = Symbol('renderList')
export const WITH_DIRECTIVES = Symbol('withDirectives')
// ... 几十个类似标记

// 2. 建立从 Symbol 到真实函数名的映射表
export const helperNameMap: any = {
  [OPEN_BLOCK]: 'openBlock',
  [CREATE_BLOCK]: 'createBlock',
  [CREATE_ELEMENT_BLOCK]: 'createElementBlock',
  [CREATE_VNODE]: 'createVNode',
  [TO_DISPLAY_STRING]: 'toDisplayString',
  [RENDER_LIST]: 'renderList',
  [WITH_DIRECTIVES]: 'withDirectives',
  // ...
}
```

:::

### 3.2 `genFunctionPreamble`: 前置代码生成器

它的核心任务只有两件事：“引入运行时工具库” 和 “声明静态常量”。

:::code-group

```typescript [codegen.ts]
function genFunctionPreamble(ast, context) {
  const {
    push,
    newline,
    runtimeGlobalName,
    runtimeModuleName,
    prefixIdentifiers,
  } = context

  // 准备弹药：注入运行时 Helpers
  if (ast.helpers.length > 0) {
    // 场景 A：Module 模式 (针对 Vite/Webpack 等构建工具)
    // 目标产物: import { createVNode as _createVNode } from "vue"
    if (prefixIdentifiers) {
      const imports = ast.helpers
        .map(s => `${helperNameMap[s]} as _${helperNameMap[s]}`)
        .join(', ')
      push(`import { ${imports} } from "${runtimeModuleName}"\n`)
    }
    // 场景 B：Function 模式 (针对浏览器直接 <script> 引入)
    // 目标产物: const { createVNode: _createVNode } = Vue
    else {
      const helpers = ast.helpers
        .map(s => `${helperNameMap[s]}: _${helperNameMap[s]}`)
        .join(', ')
      push(`const { ${helpers} } = ${runtimeGlobalName}\n`)
    }
  }
  newline() // 换行，保持代码整洁

  // 性能外挂：生成静态提升 (Hoists)
  if (ast.hoists.length > 0) {
    // 遍历所有在 transform 阶段被标记为纯静态的节点
    ast.hoists.forEach((hoistNode, i) => {
      if (hoistNode) {
        // 声明全局常量名，按索引递增，如：_hoisted_1, _hoisted_2
        push(`const _hoisted_${i + 1} = `)
        // 核心魔法：将静态节点丢给 genNode，递归拼接出创建该节点的 JS 代码
        genNode(hoistNode, context)
        newline()
      }
    })
  }
  newline()
}
```

:::

### 3.3 `genNode`：节点生成核心

`genNode` 是代码生成阶段的总调度函数，根据 AST 节点的类型分派到对应的生成函数：

:::code-group

```typescript [codegen.ts]
// 极简版 genNode 核心调度器
import { NodeTypes } from './ast'

function genNode(node, context) {
  // 1. 如果是最基础的纯字符串，直接让 context 拼接写入，结束战斗
  if (typeof node === 'string') {
    context.push(node)
    return
  }
  // 2. 核心分发：根据 AST 节点的类型 (type)，派发给专属的“子生成器”
  switch (node.type) {
    // 第一类：基础文本与插值
    case NodeTypes.TEXT:
      // 处理纯文本：将文本转化为可执行的 JS 字符串包裹
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      // 处理简单表达式：如 {{ msg }} 里面的 msg
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      // 处理双大括号插值：生成 _toDisplayString(msg)
      genInterpolation(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      // 处理复合表达式：如把文本和变量连起来 "Hello " + msg
      genCompoundExpression(node, context)
      break

    // 第二类：虚拟 DOM 与函数调用 (最核心)
    case NodeTypes.VNODE_CALL:
      // 处理元素节点：生成 _createVNode("div", null, ...)
      genVNodeCall(node, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      // 处理通用的 JS 函数调用：如运行时 helper 的执行
      genCallExpression(node, context)
      break

    //第三类：JS 语言结构 (v-if / v-for 的底层)
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      // 处理三元表达式：这是 v-if 编译后的最终形态 (condition ? true : false)
      genConditionalExpression(node, context)
      break
    case NodeTypes.JS_ARRAY_EXPRESSION:
      // 处理 JS 数组结构：这是 v-for 编译后的最终形态
      genArrayExpression(node, context)
      break
    case NodeTypes.JS_OBJECT_EXPRESSION:
      // 处理 JS 对象结构：用于生成动态的 style 或 class 对象
      genObjectExpression(node, context)
      break
  }
}
```

```typescript [ast.ts]
export const enum NodeTypes {
  // ... 模板 AST 的节点类型 (0~12)
  VNODE_CALL = 13, // VNode 创建调用（createVNode / createElementBlock）
  JS_CALL_EXPRESSION = 14, // 通用 JavaScript 函数调用表达式
  JS_OBJECT_EXPRESSION = 15, // JavaScript 对象字面量
  JS_PROPERTY = 16, // 对象属性键值对
  JS_ARRAY_EXPRESSION = 17, // 数组表达式
  JS_FUNCTION_EXPRESSION = 18, // 函数表达式（箭头函数等）
  JS_CONDITIONAL_EXPRESSION = 19, // 三元表达式（由 v-if 生成）
  JS_CACHE_EXPRESSION = 20, // 缓存表达式（_cache[x]）
  JS_BLOCK_STATEMENT = 21, // 块语句
  JS_TEMPLATE_LITERAL = 22, // 模板字符串
  JS_IF_STATEMENT = 23, // if 语句（SSR 用）
  JS_ASSIGNMENT_EXPRESSION = 24, // 赋值表达式
  JS_SEQUENCE_EXPRESSION = 25, // 逗号表达式
  JS_RETURN_STATEMENT = 26, // 返回语句
}
```

:::

## 4. 各节点生成函数极简实现

所有的生成函数都遵循一个铁律：**它们不返回任何东西，而是直接调用 `context.push()` 将代码字符串拼接到全局的上下文中。**

### 4.1 基础文本与插值生成器

这是最基础的节点，负责处理普通的文本和双大括号。

#### 4.1.1 `genText` (处理纯文本)

:::code-group

```typescript [codegen.ts]
function genText(node, context) {
  // 纯文本不能直接输出，必须用引号包裹，并处理换行符等转义字符
  // 所以直接借用 JSON.stringify 来实现安全的字符串化
  context.push(JSON.stringify(node.content))
}
```

:::

#### 4.1.2 `genExpression` (处理简单表达式)

比如<span v-pre>{{ msg }}</span>里面的 msg，或者动态属性 `:class="isActive"` 里面的 `isActive`。

:::code-group

```typescript [codegen.ts]
function genExpression(node, context) {
  // 表达式通常是变量名或简单的 JS 语句，不需要加引号，直接拼接
  // 在 module 模式下，这里的 node.content 可能在 transform 阶段已经被处理成了 "_ctx.msg"
  context.push(node.content)
}
```

:::

#### 4.1.3 `genInterpolation` (处理插值语法)

将 <span v-pre>{{ msg }}</span> 转换为 `_toDisplayString(msg)`。

:::code-group

```typescript [codegen.ts]
function genInterpolation(node, context) {
  const { push, helper } = context
  // 1. 拼接辅助函数名和左括号： "_toDisplayString("
  push(`${helper(TO_DISPLAY_STRING)}(`)

  // 2. 递归生成括号里面的内容（通常派发给 genExpression）
  genNode(node.content, context)

  // 3. 闭合右括号： ")"
  push(`)`)
}
```

:::

#### 4.1.4 `genCompoundExpression`: 处理复合表达式

将Hello <span v-pre>{{ msg }}</span> ! 处理成`'"Hello " + _toDisplayString(msg) + " !"'`

:::code-group

```typescript [codegen.ts]
function genCompoundExpression(node, context) {
  const { push } = context

  // 遍历复合表达式的所有子元素
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    // 1. 如果子元素是纯字符串（通常是 "+" 或者空格）
    if (typeof child === 'string') {
      push(child)
    }
    // 2. 如果子元素是一个 AST 节点（比如 Text 节点、Interpolation 插值节点）
    else {
      // 核心魔法：原路退回给 genNode 总调度中心，让它去寻找对应的子车间处理
      genNode(child, context)
    }
  }
}
```

:::

### 4.2 核心虚拟 DOM 生成器（重中之重）

这是 Vue 渲染能力的核心，负责将 HTML 标签转化为 `_createVNode` 函数调用。

#### 4.2.1 `genVNodeCall` (处理元素节点)

以 `<div>文本</div>` 转化为 `_createVNode("div", null, "文本", -1)` 为例。

:::code-group

```typescript [codegen.ts]
function genVNodeCall(node, context) {
  const { push, helper } = context
  const { tag, props, children, patchFlag, dynamicProps, isBlock } = node

  // 1. 判断是创建普通 VNode 还是 Block 节点
  const callHelper = isBlock ? CREATE_BLOCK : CREATE_VNODE
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(), `)
  }
  push(`${helper(callHelper)}(`) // 例如拼出 "_createVNode("

  // 2. 递归生成标签名、属性、子节点
  const args = [tag, props, children, patchFlag, dynamicProps]

  // 优化机制：去掉尾部多余的 null 参数（例如如果没有 patchFlag 等，后面的参数不用传）
  while (args.length > 0 && args[args.length - 1] == null) {
    args.pop()
  }

  // 3. 遍历参数列表，用逗号分隔并递归生成
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (i > 0) push(`, `) // 多个参数之间加逗号

    if (arg) {
      genNode(arg, context) // 核心魔法：递归！把属性和子节点反向抛给调度中心
    } else {
      push(`null`) // 空参数用 null 占位
    }
  }

  // 4. 闭合括号
  push(`)`)
  if (isBlock) {
    push(`)`) // 闭合 openBlock 造成的额外括号
  }
}
```

:::

#### 4.2.2 `genCallExpression`: 处理函数调用生成器

把这些 AST 节点完美地“打印”成符合 JavaScript 语法的标准函数调用字符串。

:::code-group

```typescript [codegen.ts]
function genCallExpression(node, context) {
  const { push } = context
  const callee = node.callee // 调用的函数名 (如: '_createVNode')
  const args = node.arguments // 传递的参数数组 (如: ['div', null, 'msg'])

  // 1. 打印函数名 (Callee)
  // 如果是普通字符串标识符直接 push，如果是复杂结构（闭包/其他函数产物）则丢回 genNode 递归
  if (typeof callee === 'string') {
    push(callee)
  } else {
    genNode(callee, context)
  }

  // 2. 打印左括号
  push(`(`)

  // 3. 打印参数列表 (Arguments)
  // 借助通用的 genNodeList 方法，把数组里的参数逐个打印出来，并用逗号拼接
  genNodeList(args, context)

  // 4. 打印右括号
  push(`)`)
}

/**
 * 辅助车间：专门负责打印数组列表，并用逗号分隔
 */
function genNodeList(nodes, context) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]

    // 处理单个参数的降维打印
    if (typeof node === 'string') {
      push(node)
    } else if (Array.isArray(node)) {
      // 数组类型的参数需要额外加上中括号（如子节点数组）
      genNodeListAsArray(node, context)
    } else {
      genNode(node, context) // 对象节点，甩手交给总调度器处理
    }

    // 核心魔法：如果当前参数不是最后一个，补充逗号分隔符
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}
//数组列表生成器
function genNodeListAsArray(nodes, context) {
  const { push } = context

  // 1. 打印数组的左中括号
  push(`[`)

  // 2. 核心魔法：复用 genNodeList 处理内部元素
  // 它会自动遍历 nodes 数组，递归解析每个节点，并在元素之间完美插入 ", "
  genNodeList(nodes, context)

  // 3. 打印数组的右中括号
  push(`]`)
}
```

:::

### 4.3 JavaScript 逻辑结构生成器

经过 Transform 阶段，`v-if` 和 `v-for` 等指令已经被降维成了纯粹的 JS 语法结构。

#### 4.3.1 `genConditionalExpression` (处理三元表达式 / v-if)

将条件分支转化为 `A ? B : C`。

:::code-group

```typescript [codegen.ts]
function genConditionalExpression(node, context) {
  const { push, indent, deindent } = context

  // 1. 生成判断条件
  genNode(node.test, context)

  // 2. 拼接问号并换行缩进
  push(` ? `)
  indent()

  // 3. 递归生成条件为真时的逻辑
  genNode(node.consequent, context)

  // 4. 恢复缩进，拼接冒号并再次缩进
  deindent(true) // 退回缩进但不换行
  push(`\n`)
  push(`  : `) // 加上冒号和空格
  indent()

  // 5. 递归生成条件为假时的逻辑 (else 分支)
  genNode(node.alternate, context)

  // 6. 收尾退回缩进
  deindent(true)
}
```

:::

#### 4.3.2 `genArrayExpression` (处理数组 / v-for 产物)

将节点转化为 `[ item1, item2 ]`。

:::code-group

```typescript [codegen.ts]
function genArrayExpression(node, context) {
  const { push } = context

  push(`[`)
  // 遍历数组内的所有元素
  for (let i = 0; i < node.elements.length; i++) {
    if (i > 0) push(`, `) // 元素之间加逗号

    const el = node.elements[i]
    // 递归生成数组内部的每一项
    if (typeof el === 'string') {
      push(el)
    } else {
      genNode(el, context)
    }
  }
  push(`]`)
}
```

:::

#### 4.3.3 `genObjectExpression` (处理对象 / 动态 Class 与 Style)

将节点转化为 `{ key: value, ... }`。

:::code-group

```typescript [codegen.ts]
function genObjectExpression(node, context) {
  const { push } = context

  push(`{ `)
  // 遍历对象的属性列表
  for (let i = 0; i < node.properties.length; i++) {
    const prop = node.properties[i]
    if (i > 0) push(`, `)

    // 递归生成 Key
    genNode(prop.key, context)
    push(`: `)
    // 递归生成 Value
    genNode(prop.value, context)
  }
  push(` }`)
}
```

:::

## 5. 完整流程示例

### 5.1 基础代码示例

**输入模板:**

```html
<div class="box">Hello {{ name }}</div>
```

**经过 `parse` 和 `transform` 后的 JavaScript AST（简化）**

```json
{
  "type": 0, // NodeTypes.ROOT (AST 的根节点)
  "children": [
    // ... 原始的解析子节点，此处省略
  ],

  // 核心看点 1：全局收集的 Helpers 集合
  // Transform 阶段所有的插件在这里“交接”了它们需要的运行时方法
  "helpers": [
    "Symbol(openBlock)", // 用于开启区块 (Block) 追踪
    "Symbol(createElementBlock)", // 用于创建基础元素区块
    "Symbol(toDisplayString)" // 用于处理 {{ name }} 插值转字符串
  ],
  "components": [],
  "directives": [],
  "hoists": [], // 如果有多个静态节点会被收集到这里
  "temps": 0,
  "cached": 0,

  // 核心看点 2：专为代码生成准备的 codegenNode
  "codegenNode": {
    "type": 13, // NodeTypes.VNODE_CALL (创建虚拟节点的函数调用)
    "tag": "\"div\"",
    "props": {
      "type": 4, // NodeTypes.SIMPLE_EXPRESSION
      "content": "{ class: \"box\" }",
      "isStatic": true
    },
    "children": [
      // transformText 插件生成的复合表达式
      {
        "type": 8, // NodeTypes.COMPOUND_EXPRESSION
        "children": [
          "Hello ",
          " + ",
          {
            "type": 14, // NodeTypes.JS_CALL_EXPRESSION (JS 函数调用)
            // 注意这里：直接引用了全局 helpers 里的 Symbol
            "callee": "Symbol(toDisplayString)",
            "arguments": [
              {
                "type": 4, // NodeTypes.SIMPLE_EXPRESSION
                "content": "_ctx.name", // transformExpression 注入的作用域前缀
                "isStatic": false
              }
            ]
          }
        ]
      }
    ],
    "patchFlag": "1 /* TEXT */", // 靶向标记：仅文本是动态的
    "dynamicProps": null,
    "isBlock": true // 由于是根节点，自动晋升为 Block，触发 openBlock 和 createElementBlock
  }
}
```

**生成的`render`函数**

```javascript
import {
  toDisplayString as _toDisplayString,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from 'vue'

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createElementBlock(
      'div',
      { class: 'box' },
      ['Hello ' + _toDisplayString(_ctx.name)],
      1 /* TEXT */,
    )
  )
}
```

### 5.2 完整流程图

![Logo](/generate.png)

## 6. 总结

代码生成阶段是 Vue 3 编译器的最后一步，它通过递归遍历 JavaScript AST，将结构化的节点翻译成可执行的 JavaScript 代码。其核心要点如下：

- **生成渲染函数框架**：定义 `render` 函数及其参数 `_ctx`（组件上下文）和 `_cache`（渲染缓存）。
- **生成静态提升常量**：将纯静态节点提取为模块级常量，仅在初始化时创建一次，后续渲染直接复用，降低内存与 GC 开销。
- **生成 VNode 创建调用**：递归翻译 AST 节点，生成 `createVNode` / `createElementBlock` 等核心调用，并将 `tag`、`props`、`children` 等参数按序输出。
- **注入优化信息**：将 PatchFlag 作为数字参数（如 `1 /* TEXT */`）写入调用，同时输出 `dynamicProps` 数组，为运行时 diff 提供靶向更新指引。
- **生成辅助函数导入**：根据 `helpers` 集合按需从 `vue` 导入所需运行时辅助函数，每个函数使用别名（如 `_toDisplayString`）以避免命名冲突，同时支持 Tree-shaking。
- **处理 Block Tree**：生成 `(_openBlock(), _createElementBlock(...))` 结构，使运行时能够跳过静态子树，直接定位到动态节点。
- **处理事件缓存**：生成 `_cache[x] || (_cache[x] = ($event) => _ctx.handler($event))` 表达式，确保事件处理函数引用在多次渲染间保持稳定，避免子组件无意义重渲染。
