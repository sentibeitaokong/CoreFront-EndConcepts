# 编译器核心技术概览

Vue 3 的编译器是整个框架的“静态分析引擎”，它会在编译阶段分析开发者编写的 `<template>`，并将其中动态与静态的部分拆解开，最终生成一棵经过深度优化的 `JavaScript AST`，再转换成高效的渲染函数代码。这种 **“编译时优化 + 运行时轻量更新”** 的设计，让 Vue 3 在保留声明式开发体验的同时，具备了接近原生手写代码的性能。

## 1. 编译器的作用与整体架构

### 1.1 编译器的核心任务

在 Vue 3 中，模板编译是把 `<template>` 字符串转换成渲染函数 `render()` 的过程，整个流程可以拆分成三个关键阶段：

| 阶段                    | 输入           | 输出              | 核心职责                                |
| ----------------------- | -------------- | ----------------- | --------------------------------------- |
| **解析（Parse）**       | 模板字符串     | 模板 AST          | 将模板字符串转换为结构化的抽象语法树    |
| **转换（Transform）**   | 模板 AST       | JavaScript AST    | 对 AST 进行语义分析、指令编译与优化标记 |
| **代码生成（Codegen）** | JavaScript AST | `render` 函数代码 | 将 AST 转换为可执行的渲染函数代码       |

### 1.2 宏观架构：平台无关的编译管道

Vue 3 的编译器被拆分为多个包，通过**核心 + 平台插件**的方式实现跨平台复用：

```
@vue/compiler-core     → 平台无关的核心编译逻辑（解析、转换、代码生成）
@vue/compiler-dom      → 浏览器平台专用的转换与优化（基于 compiler-core）
@vue/compiler-sfc      → 解析 .vue 单文件组件，拆解 template / script / style
@vue/compiler-ssr      → 服务端渲染专用的编译逻辑
```

- **`compiler-core`** 提供了通用的 `baseCompile` 函数，它组合了 parser、transformer 和 codegen 三部分。
- **`compiler-dom`** 在此基础上注入浏览器特有的节点转换（如 `<input v-model>`、`<transition>` 等），最终导出 `compile` 函数。
- 针对小程序、Canvas 等新渲染目标时，只需要基于 `compiler-core` 编写新的平台插件即可，无需重写整个编译器。

## 2. 编译主流程

整个编译过程在 `compiler-core` 的 `baseCompile` 函数中串联起来，其内部大致逻辑如下：

![Logo](/compilerInfo.png)

:::code-group

```typescript [parse.ts]
//编译核心函数
export function baseCompile(
  template: string | RootNode, // 模板可以是字符串，也可以是已经解析好的 AST
  options: CompilerOptions = {},
): CodegenResult {
  // 1. 解析阶段 (Parse)
  // 将模板字符串解析为 基础 AST (RootNode)
  const ast = isString(template) ? baseParse(template, options) : template

  // 2. 转换/优化阶段 (Transform)
  //将模板 AST 转换成javascript AST
  transform(
    ast,
    extend({}, options, {
      // ... 合并内置转换插件
    }),
  )

  // 3. 生成阶段 (Generate)
  // 将转换后的带有 JS 语义的 AST，生成最终的 JS 代码字符串
  return generate(
    ast,
    extend({}, options, {
      // ...
    }),
  )
}
```

:::

## 3. 解析阶段：从字符串到模板 AST

编译器的解析阶段，本质上是一个**手动编写的递归下降解析器**，以**有限状态机**为核心驱动，通过逐个字符扫描模板，将其切分为有意义的 **Token**，并递归构建出一棵描述模板结构的**抽象语法树（AST）**的过程。从理论上看，它可以分为**词法分析**和**语法分析**两个子阶段：

- **词法分析（Lexical Analysis）**：把字符流分割成有意义的 Token（标记）序列。
- **语法分析（Syntax Analysis）**：根据语法规则，将 Token 序列组装成树形结构的 AST。

### 3.1 为什么要将字符流变成 Token 流？

字符串是线性结构，而模板语法具有嵌套和多种结构（元素、属性、插值、注释等）。如果直接操作字符串，逻辑会异常复杂。将字符流变为 `Token` 流，等于对原始信息做了一次结构化拆分，后续的 `AST` 构建就会变得简单清晰。

```js
//简易 Vue 模板词法分析器
function tokenize(template) {
  const tokens = []
  let pos = 0
  const len = template.length

  while (pos < len) {
    const char = template[pos]

    // 1. 插值 {{  }}
    if (char === '{' && template[pos + 1] === '{') {
      const end = template.indexOf('}}', pos)
      const value = template.slice(pos, end + 2) // 包含 {{ 和 }}
      tokens.push({ type: 'interpolation', value })
      pos = end + 2
      continue
    }

    // 2. 注释 <!-- -->
    if (
      char === '<' &&
      template[pos + 1] === '!' &&
      template[pos + 2] === '-' &&
      template[pos + 3] === '-'
    ) {
      const end = template.indexOf('-->', pos)
      const value = template.slice(pos, end + 3)
      tokens.push({ type: 'comment', value })
      pos = end + 3
      continue
    }

    // 3. 标签（开始标签、结束标签、自闭合标签）
    if (char === '<') {
      // 寻找最近的 '>'
      const end = template.indexOf('>', pos)
      const tag = template.slice(pos, end + 1)
      // 简单判断标签类型
      if (tag.startsWith('</')) {
        tokens.push({ type: 'closing-tag', value: tag })
      } else if (tag.endsWith('/>')) {
        tokens.push({ type: 'self-closing-tag', value: tag })
      } else {
        tokens.push({ type: 'opening-tag', value: tag })
      }
      pos = end + 1
      continue
    }

    // 4. 普通文本：收集直到遇到 '<' 或 '{{'
    let text = ''
    while (
      pos < len &&
      template[pos] !== '<' &&
      !(template[pos] === '{' && template[pos + 1] === '{')
    ) {
      text += template[pos]
      pos++
    }
    if (text) {
      tokens.push({ type: 'text', value: text })
    }
  }

  return tokens
}
```

**模板:**

```js
<div class="box">Hello {{ name }} <!-- 注释 --></div>
```

**生成的token：**

```json
[
  { "type": "opening-tag", "value": "<div class=\"box\">" },
  { "type": "text", "value": "Hello " },
  { "type": "interpolation", "value": "{{ name }}" },
  { "type": "text", "value": " " },
  { "type": "comment", "value": "<!-- 注释 -->" },
  { "type": "closing-tag", "value": "</div>" }
]
```

### 3.2 什么是有限状态机？

有限状态机（`Finite State Machine, FSM`）是具有有限个状态的数学模型，它在某个状态下，根据输入（字符）决定转移到哪个新状态。在编译器的词法分析中，状态机非常有用：每一个状态对应一种“当前我们正在处理什么”的上下文。

### 3.3 构造AST

Vue 3 的解析器并没有显式的状态变量，而是通过**函数调用**和**循环分支**来模拟状态。核心函数 `parseChildren` 是一个 `while` 循环，每次根据剩余字符串的开头字符判断“当前处于哪种解析模式”，然后调用对应的解析函数（`parseElement`、`parseInterpolation`、`parseText` 等）。每一个解析函数内部又会根据情况继续调用其他解析函数，形成递归下降。

简单来说，解析器的“状态”由**当前正在执行的解析函数**体现。状态转移则通过**函数返回**和新的**解析函数调用**来实现。

:::code-group

```typescript [parse.ts]
function parseChildren(context: ParserContext, ancestors: ElementNode[]) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    const s = context.source
    let node
    if (startsWith(s, '{{')) {
      node = parseInterpolation(context) // → 插值状态
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors) // → 元素状态
      } else if (startsWith(s, '<!--')) {
        node = parseComment(context) // → 注释状态
      }
    }
    if (!node) {
      node = parseText(context) // → 保持文本状态
    }
    nodes.push(node)
  }
  return nodes
}
```

:::

**输入模板:**

```js
<div class="box">Hello {{ name }} <!-- 注释 --></div>
```

**生成的 AST:**

```json
{
  "type": 1, // NodeTypes.ELEMENT (元素节点)
  "tag": "div",
  "isSelfClosing": false,
  "props": [
    {
      "type": 6, // NodeTypes.ATTRIBUTE (普通属性)
      "name": "class",
      "value": {
        "type": 2, // NodeTypes.TEXT
        "content": "box"
      }
    }
  ],
  "children": [
    {
      "type": 2, // NodeTypes.TEXT (纯文本)
      "content": "Hello "
    },
    {
      "type": 5, // NodeTypes.INTERPOLATION (插值)
      "content": {
        "type": 4, // NodeTypes.SIMPLE_EXPRESSION (简单表达式)
        "isStatic": false,
        "content": "name"
      }
    },
    {
      "type": 2, // NodeTypes.TEXT (空格)
      "content": " "
    },
    {
      "type": 3, // NodeTypes.COMMENT (注释)
      "content": " 注释 "
    }
  ]
}
```

### 3.4 完整流程图

![Logo](/templateToAst.png)

## 4. 转换/优化阶段：语义分析与优化

`transform` 阶段位于解析（`parse`）与代码生成（`generate`）之间，它的输入是模板 AST，输出是 JavaScript AST。这一阶段由 `@vue/compiler-core` 包中的 `transform` 函数统一调度，主要完成三件事：

- **语义分析**：识别模板中的内置指令（`v-if`、`v-for`、`v-on` 等），将它们转化为符合运行时期望的 JavaScript 表达式或属性。
- **编译时优化**：通过静态分析标记出模板中的静态部分与动态部分，应用**静态提升**、**PatchFlag**、**Block Tree** 等技术，为运行时提供精确的更新指引。
- **平台适配**：通过插件机制注入平台相关的节点转换逻辑（如浏览器 DOM 的 `transformStyle`、`transformTransition` 等），使得核心编译器可以跨平台复用。

整个 `transform` 过程基于 **深度优先遍历（DFS）** 和 **插件系统**，每个插件可以定义 `enter` 和 `exit` 两个钩子，在遍历到节点时执行相应的逻辑。

- **`enter` 钩子**：在遍历进入节点时调用，适合初始化操作。
- **`exit` 钩子**：在遍历完子节点、即将退出当前节点时调用，适合收集子节点信息并做最终修改。

### 4.1 深度优先遍历与插件系统

#### 4.1.1 深度优先遍历：从上到下的“探访”

**transform** 阶段由 `transform` 函数启动，它内部调用 `traverseNode` 递归遍历整棵模板 AST，遵循**深度优先**的原则：先访问父节点，再递归访问子节点，最后在离开父节点时做收尾处理。

```typescript
export function transform(root, options) {
  // 1. 创建全局转换上下文 (存放当前节点、父节点、辅助函数等)
  const context = createTransformContext(root, options)

  // 2. 🔥 核心：深度优先遍历并执行插件
  traverseNode(root, context)

  // 3. 🏁 后期处理：静态提升
  if (options.hoistStatic) {
    hoistStatic(root, context)
  }

  // 4. 🏁 后期处理：创建最终的代码生成节点 (Codegen Node)
  if (!options.ssr) {
    createRootCodegen(root, context)
  }

  // 5. 将收集到的辅助函数 (如 _openBlock, _createElementVNode) 挂载到根节点
  root.helpers = [...context.helpers]
}
function traverseNode(node, context) {
  // 获取所有插件
  const nodeTransforms = context.nodeTransforms
  const exitFns = []

  // 进入阶段 (Enter)：执行所有插件，并收集它们的退出函数
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) exitFns.push(onExit)
  }

  // 递归阶段：深度优先处理所有子节点
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
    // ...
  }

  // 退出阶段 (Exit)：倒序执行所有插件的退出函数
  let i = exitFns.length
  while (i--) {
    exitFns[i]() // 在这里计算 PatchFlags，构建 Block
  }
}
```

#### 4.1.2 **插件系统：职责分离的转换单元**

每个转换插件都是一个函数（或有 `enter`/`exit` 两个属性的对象），接收当前节点和 `TransformContext`，可以修改节点、向上下文注入信息，或从上下文中读取状态。

| 插件                  | 作用                                                        |
| --------------------- | ----------------------------------------------------------- |
| `transformOnce`       | 处理 `v-once` 指令，标记为静态内容，只渲染一次              |
| `transformIf`         | 将 `v-if` / `v-else-if` / `v-else` 编译为三元表达式         |
| `transformFor`        | 将 `v-for` 编译为 `renderList` 函数调用                     |
| `transformExpression` | 处理模板中的 JavaScript 表达式，转为合法的 AST 节点         |
| `transformSlotOutlet` | 处理 `<slot>` 元素，转为相应的插槽渲染逻辑                  |
| `transformElement`    | 处理普通元素，生成 `createVNode` 调用的参数，计算 PatchFlag |
| `trackSlotScopes`     | 追踪插槽作用域，确保正确生成插槽函数                        |
| `transformText`       | 合并相邻的文本和插值节点为复合表达式，提升性能              |

平台专属插件（如 `@vue/compiler-dom`）会在此基础上追加浏览器相关转换，如 `transformStyle`、`transformTransition` 等

### 4.2 指令与语法的“降级翻译”

基础 AST 记录的是 Vue 特有的模板语法（如 `v-if`, `v-for`, `@click`），但浏览器 JavaScript 引擎并不认识这些。`transform` 的首要任务就是将模板中的指令编译为标准的 JavaScript 代码。

| 指令/结构                       | 编译行为                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `v-if` / `v-else-if` / `v-else` | 编译为三元表达式 `(condition) ? trueBlock : falseBlock`，并划分 Block 边界        |
| `v-for`                         | 编译为 `_renderList(list, (item, index) => { ... })` 调用，每次循环生成独立 Block |
| `v-on` / `@`                    | 事件绑定转换为 `onXxx` 属性，并标记 `HYDRATE_EVENTS`                              |
| `v-bind` / `:`                  | 动态属性转换为属性值表达式，可能标记 `PROPS` 或 `FULL_PROPS`                      |
| `v-model`                       | 按平台展开为 `:value` + `@input` 等对应绑定                                       |
| `v-show`                        | 编译为 `v-show` 指令，生成条件展示逻辑                                            |
| `v-once`                        | 标记为静态内容，跳过后续变更                                                      |
| `<slot>`                        | 转换为插槽渲染函数调用                                                            |

### 4.3 编译时优化技术

`transform` 阶段的最主要价值在于它能在编译时“看到”模板的静态和动态部分，并注入运行时优化所需的元信息。

#### 4.3.1 静态提升（Static Hoisting)

如果某个节点及其子树完全不依赖于任何响应式数据，则会被标记为“静态”。在代码生成阶段，这些节点的创建逻辑会被**提升到渲染函数外部**，无论组件重新渲染（Re-render）多少次，被提升的节点只在初始化时创建一次。后续渲染直接复用同一个内存地址，极大地降低了内存占用和垃圾回收 (GC) 的压力。

```js
// 编译前模板
;<div>
  <span>静态文本</span>
  <p>{{ msg }}</p>
</div>

// 转换后生成的代码（示意）
const _hoisted_1 = /*#__PURE__*/ _createStaticVNode('<span>静态文本</span>')
export function render(_ctx) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _hoisted_1,
      _createTextVNode(_toDisplayString(_ctx.msg), 1 /* TEXT */),
    ])
  )
}
```

#### 4.3.2 靶向更新标记 (PatchFlags)

对于动态节点，编译器会分析其**哪些部分是动态的**（文本内容、class、style、props等），并用一个位掩码（`PatchFlag`）标记。运行时 diff 时，渲染器看到这个标记，就只对比对应的部分，跳过无关内容。

- 侦测动态文本：遇到 `<div>{{ message }}</div>`，打上 `1 /* TEXT */`。
- 侦测动态类名：遇到 `<div :class="activeClass">`，打上 `2 /* CLASS */`。
- 侦测动态样式：遇到 `<div :style="bgStyle">`，打上 `4 /* STYLE */`。
- 多重特性叠加：如果既有动态文本又有动态类名，则打上 `1 | 2 = 3`。

常见的 `PatchFlag`：

| PatchFlag 常量        | 含义                                   | 触发示例                        |
| --------------------- | -------------------------------------- | ------------------------------- |
| `TEXT` (1)            | 文本内容是动态的                       | `<p>{{ msg }}</p>`              |
| `CLASS` (2)           | class 属性是动态的                     | `<div :class="c">`              |
| `STYLE` (4)           | style 是动态的                         | `<div :style="s">`              |
| `PROPS` (8)           | 除 class / style 以外的 props 是动态的 | `<div :id="id">`                |
| `FULL_PROPS` (16)     | 存在动态 key（需要完整 diff props）    | `<div v-bind="obj">`            |
| `HYDRATE_EVENTS` (32) | 存在需要水合的事件                     | `<div @click="handler">`        |
| `NEED_PATCH` (64)     | 需要递归 patch 子节点                  | 动态子节点，如 `v-for` / `slot` |
| `DYNAMIC_SLOTS` (512) | 动态插槽                               | `<slot name="dynamicName">`     |

#### 4.3.3 块级追踪（Block Tree）

传统的 VNode 树是递归嵌套的，diff 时需要深度遍历整棵树。Block Tree 的核心思想是：**利用** `v-if`、`v-for` **等结构指令作为边界，将模板切分成多个 Block（块）**。每个 Block 在运行时内部维护一个 `dynamicChildren` 数组，记录所有带 `PatchFlag` 的动态后代节点。组件更新时，diff 直接从根 Block 的 `dynamicChildren` 开始，精确地只对比那些动态节点，跳过所有静态部分，从而让 diff 性能与模板大小“解耦”。

```js
// Block 的简化结构
{
  type: Fragment,
  children: [ ... ],
  dynamicChildren: [ /* 仅包含该块内的动态后代节点 */ ]
}
```

#### 4.3.4 事件监听缓存 (Cache Event Handlers)

Vue 3 的编译器在 `transform` 阶段会默认启用 **事件处理函数缓存（Cache Event Handlers）**，这是一项“空间换时间”的编译时优化。它的核心目的是：**让事件处理函数的引用在多次渲染间保持稳定，从而避免不必要的 DOM 更新与子组件重渲染。** 编译器在生成渲染函数时，利用渲染上下文中的 `_cache` 对象来存储首次创建的**包装函数**。

```javascript
// 编译后的代码示意
export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createBlock(
      'button',
      {
        onClick: _cache[0] || (_cache[0] = $event => _ctx.handleClick($event)),
      },
      'Click Me',
    )
  )
}
```

### 4.4 完整流程示例

#### 4.4.1 基础示例

**输入模板：**

```js
<div class="box">Hello {{ name }} <!-- 注释 --></div>
```

**生成的AST：**

```json
{
  "type": 1, // NodeTypes.ELEMENT (元素节点)
  "tag": "div",
  "isSelfClosing": false,
  "props": [
    {
      "type": 6, // NodeTypes.ATTRIBUTE (普通属性)
      "name": "class",
      "value": {
        "type": 2, // NodeTypes.TEXT
        "content": "box"
      }
    }
  ],
  "children": [
    {
      "type": 2, // NodeTypes.TEXT (纯文本)
      "content": "Hello "
    },
    {
      "type": 5, // NodeTypes.INTERPOLATION (插值)
      "content": {
        "type": 4, // NodeTypes.SIMPLE_EXPRESSION (简单表达式)
        "isStatic": false,
        "content": "name"
      }
    },
    {
      "type": 2, // NodeTypes.TEXT (空格)
      "content": " "
    },
    {
      "type": 3, // NodeTypes.COMMENT (注释)
      "content": " 注释 "
    }
  ]
}
```

**生成的Javascipt AST：**

```json
{
  "type": 1, // NodeTypes.ELEMENT (原始元素节点)
  "tag": "div",
  "props": [
    {
      "type": 6, // NodeTypes.ATTRIBUTE (普通属性)
      "name": "class",
      "value": { "type": 2, "content": "box" }
    }
  ],
  // 🔥 经过 Transform 阶段后挂载的生成代码节点
  "codegenNode": {
    "type": 13, // NodeTypes.VNODE_CALL (创建 VNode 的调用)
    "tag": "\"div\"", // 标签名被转成了字符串字面量
    "props": {
      "type": 4, // NodeTypes.SIMPLE_EXPRESSION
      "content": "{ class: \"box\" }",
      "isStatic": true
    },
    "children": [
      // 1. 复合表达式节点 (由 transformText 插件合并生成)
      {
        "type": 8, // NodeTypes.COMPOUND_EXPRESSION
        "children": [
          "Hello ",
          " + ",
          {
            "type": 14, // NodeTypes.JS_CALL_EXPRESSION (函数调用)
            "callee": "_toDisplayString", // 引入运行时辅助函数
            "arguments": [
              {
                "type": 4, // NodeTypes.SIMPLE_EXPRESSION
                "content": "_ctx.name", // 注入了 _ctx 前缀
                "isStatic": false
              }
            ]
          },
          " + ",
          " " // 紧跟在插值后的空格
        ]
      },
      // 2. 注释节点调用
      {
        "type": 13, // NodeTypes.VNODE_CALL
        "callee": "_createCommentVNode",
        "arguments": [
          {
            "type": 2, // NodeTypes.TEXT
            "content": " 注释 "
          }
        ]
      }
    ],
    // 🔥 靶向更新标记 (计算得出只有文本是动态的)
    "patchFlag": "1 /* TEXT */",
    "dynamicProps": null,
    "isBlock": true // 因为是根节点，自动成为 Block 收集动态子节点
  }
}
```

#### 4.4.2 完整流程图

![Logo](/transformInfo.png)

## 5. 代码生成（Codegen）：从 JavaScript AST 到渲染函数

`generate` 阶段负责遍历上一步生成的 JavaScript AST，拼接出最终的渲染函数代码字符串。它会生成 Vue 3 运行时所需要的各种辅助函数调用，例如：

- `openBlock` / `createElementBlock`：开启一个新的 Block，并创建元素 VNode。
- `createVNode`：创建一个普通 VNode。
- `toDisplayString`：将动态值转换为字符串。
- `renderList`：渲染 `v-for` 列表。
- `Fragment`、`Text`、`Comment` 等类型的对应创建函数。

此外，代码生成阶段还会写入**编译优化标记**（PatchFlag）和 Block 的动态节点收集信息，这是下一步要讲的核心优化。

## 6. 总结：编译时“负重前行”，让运行时“轻装上阵”

Vue 3 的编译器并不仅仅是一个模板到渲染函数的“翻译官”，它更像一个**编译时优化器**。它遵循的核心设计哲学是：**把能提前做的工作都在编译阶段完成，尽可能减小运行时的负担**。

- **静态提升** 避免重复创建静态 VNode。
- **PatchFlag** 让运行时 diff 能“靶向更新”，只检查真正变化的部分。
- **Block Tree** 让 diff 过程绕过整个 VNode 树的递归，直接找到所有动态节点。
- **平台无关的插件体系** 让编译器可以无缝扩展至小程序、SSR 等多种渲染目标。
