# `Compiler` (编译器)

`Compiler` 是 Vue 3 核心架构中负责将声明式的 HTML 模板（Template）转换为 JavaScript 渲染函数（Render Function）的编译引擎。与 Vue 2 不同，Vue 3 的编译器不仅仅是一个语法转换工具，更是一个极其强大的**静态分析与优化器**。它通过在构建阶段注入“编译时提示”（Compile-Time Hinting），极大地降低了运行时的 Diff 开销。

## 1. 编译器的作用与设计动机

### 1.1 为什么需要 Compiler？

- **平台转化**：浏览器原生无法执行带有 `v-if`、`v-for` 或 `{{ }}` 插值的 HTML 模板，必须将其翻译成底层的 `createElementVNode` (即 `h` 函数) 调用。
- **性能降维打击**：在编译阶段分析出哪些节点是静态的，哪些是动态的，并打上 `PatchFlag`，让运行时的更新直接跳过无意义的比对。
- **跨平台解耦**：将核心编译逻辑（`@vue/compiler-core`）与浏览器特定逻辑（`@vue/compiler-dom`）抽离，方便将 Vue 渲染到小程序或原生 App 等其他平台。

### 1.2 Vue 2 与 Vue 3 编译器的简单对比

| 特性             | Vue 2 编译器                     | Vue 3 编译器                               |
| ---------------- | -------------------------------- | ------------------------------------------ |
| 核心架构         | 耦合了部分 HTML 解析与平台逻辑   | 严格分离 `compiler-core` 与 `compiler-dom` |
| 静态节点处理     | 仅标记静态根节点                 | 彻底的**静态提升**（Static Hoisting）      |
| 动态节点追踪     | 无，运行时需全量递归整棵树       | 引入 **PatchFlag** 与 **Block Tree**       |
| 事件处理         | 每次 Render 重新生成内联事件函数 | **事件缓存**（Cache Handlers）             |
| 源码组织与拓展性 | 面条式逻辑，难以拓展             | 插件化机制（基于 Visitor 访问者模式）      |

## 2. 核心实现：`baseCompile` 大管家

### 2.1 编译器主入口

:::code-group

```typescript [compile.ts]
import { baseParse } from './parse'
import { transform } from './transform'
import { generate } from './codegen'

// 编译器的核心主流程：Parse -> Transform -> Generate
export function baseCompile(
  template: string | RootNode,
  options: CompilerOptions = {},
): CodegenResult {
  // 1. 解析阶段：将字符串模板解析为基础的 模板 AST
  const ast = isString(template) ? baseParse(template, options) : template

  // 2. 转换阶段：遍历 AST 并进行极致的静态分析与性能优化
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset()
  transform(
    ast,
    extend({}, options, {
      prefixIdentifiers,
      nodeTransforms: [
        ...nodeTransforms,
        ...(options.nodeTransforms || []), // 注入自定义节点转换插件
      ],
      directiveTransforms: extend(
        {},
        directiveTransforms,
        options.directiveTransforms || {}, // 注入自定义指令转换插件
      ),
    }),
  )

  // 3. 生成阶段：将优化后的 JavaScript AST 转换为 Render 函数代码字符串
  return generate(ast, extend({}, options, { prefixIdentifiers }))
}
```

:::

## 3. 编译三部曲：核心阶段拆解

### 3.1 `Parse` (解析阶段)

通过有限状态机（FSM）逐字扫描字符串，生成基础模板 AST。

:::code-group

```typescript [parse.ts]
// 解析入口
export function baseParse(content: string, options: ParserOptions): RootNode {
  // 创建解析上下文（包含当前解析的游标位置、源码等信息）
  const context = createParserContext(content, options)

  // 返回根节点，核心在于 parseChildren 函数去递归解析
  return createRoot(
    parseChildren(context, TextModes.DATA, []),
    getSelection(context, context.cursor),
  )
}

function parseChildren(context, mode, ancestors) {
  const nodes = []
  // 当字符串没有被解析完时，不断循环
  while (!isEnd(context, mode, ancestors)) {
    const s = context.source
    let node = undefined

    // 遇到插值 {{ }}
    if (s.startsWith('{{')) {
      node = parseInterpolation(context, mode)
    }
    // 遇到元素标签 <div
    else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }
    // 默认作为普通文本解析
    if (!node) {
      node = parseText(context, mode)
    }
    pushNode(nodes, node)
  }
  return nodes
}
```

:::

### 3.2 `Transform` (转换阶段)

利用洋葱模型（深度优先）遍历 AST，注入 PatchFlag、生成 Block 并处理指令。

:::code-group

```typescript [transform.ts]
export function transform(root: RootNode, options: TransformOptions) {
  // 创建转换上下文，用于维护状态和存储辅助函数
  const context = createTransformContext(root, options)

  // 深度优先遍历 AST
  traverseNode(root, context)

  // 静态提升逻辑处理
  if (options.hoistStatic) {
    hoistStatic(root, context)
  }

  // 注入需要在 render 函数中引入的 helper 助手函数
  root.helpers = [...context.helpers.keys()]
}

function traverseNode(node, context) {
  context.currentNode = node
  // 执行所有的节点转换插件 (前置处理)
  const exitFns = []
  for (let i = 0; i < context.nodeTransforms.length; i++) {
    const onExit = context.nodeTransforms[i](node, context)
    if (onExit) exitFns.push(onExit)
  }

  // 递归遍历子节点
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      traverseChildren(node, context)
      break
  }

  // 执行所有的退出回调 (后置处理：此时子节点已全部处理完毕)
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
```

:::

### 3.3 `Generate` (生成阶段)

将处理好的 AST 拼接为最终的可执行 JS 字符串。

:::code-group

```typescript [codegen.ts]
export function generate(ast, options): CodegenResult {
  const context = createCodegenContext(ast, options)
  const { push, newline, indent, deindent } = context

  // 1. 生成模块的 import 导入语句
  genFunctionPreamble(ast, context)

  // 2. 拼接 render 函数的签名
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`export function render(${signature}) {`)
  indent()

  // 3. 生成 return 语句及内部的 VNode 嵌套调用
  push(`return `)
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(`null`)
  }

  deindent()
  push(`}`)

  return {
    ast,
    code: context.code, // 最终返回的字符串代码
    map: context.map ? context.map.toJSON() : undefined,
  }
}
```

:::

## 4. 完整流程示例

### 4.1 基础转换示例

```html
<!-- 源码模板 Template -->
<div>
  <p>Static Text</p>
  <span>{{ msg }}</span>
</div>
```

```javascript
// 编译后的 Render 函数代码
import {
  createElementVNode as _createElementVNode,
  toDisplayString as _toDisplayString,
  openBlock as _openBlock,
  createElementBlock as _createElementBlock,
} from 'vue'

// 静态提升，脱离 Render 函数作用域
const _hoisted_1 = /*#__PURE__*/ _createElementVNode(
  'p',
  null,
  'Static Text',
  -1 /* HOISTED */,
)

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _hoisted_1,
      _createElementVNode(
        'span',
        null,
        _toDisplayString(_ctx.msg),
        1 /* TEXT */,
      ),
    ])
  )
}
```

### 4.2 完整流程图

## 5. 核心优化机制与工具函数

### `PatchFlags` (靶向更新标记)

通过位运算（Bitwise operations）枚举，标记节点的动态属性，使运行时可以直接跳过静态内容的 Diff。

```typescript
export const enum PatchFlags {
  // 动态文本节点
  TEXT = 1,
  // 动态 class
  CLASS = 1 << 1,
  // 动态 style
  STYLE = 1 << 2,
  // 动态属性
  PROPS = 1 << 3,
  // 含有动态 key，需进行全量 diff
  FULL_PROPS = 1 << 4,
  // 静态节点标记（退出 Diff）
  HOISTED = -1,
  // 退出靶向更新，执行完整 diff（常用于包含不可预测子节点的场景）
  BAIL = -2,
}
```

### `createVNodeCall` (构建 VNode 节点)

在 `transform` 阶段使用的工具函数，用于将 AST 节点转换为可生成 `createElementVNode` 或 `createBlock` 调用的 JS AST 节点。

```typescript
export function createVNodeCall(
  context,
  tag,
  props,
  children,
  patchFlag, // 注入收集到的 PatchFlag
  dynamicProps, // 注入具体的动态属性数组
  isBlock = false, // 是否作为 Block 根节点
) {
  if (context) {
    // 将需要的 helper 注册到上下文中
    context.helper(isBlock ? OPEN_BLOCK : CREATE_ELEMENT_VNODE)
  }
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    isBlock,
  }
}
```

### `Block Tree` (动静分离与收集)

渲染器配套的机制：`openBlock` 初始化一个全局数组，随后的所有拥有 PatchFlag 的子节点在创建时，会自动收集进这个数组中。

```typescript
// packages/runtime-core/src/vnode.ts (运行时配合逻辑)
export const blockStack: (VNode[] | null)[] = []
export let currentBlock: VNode[] | null = null

export function openBlock(disableTracking = false) {
  blockStack.push((currentBlock = disableTracking ? null : []))
}

export function setupBlock(vnode: VNode) {
  // 将收集到的动态子节点挂载到 block 根节点的 dynamicChildren 属性上
  vnode.dynamicChildren =
    isBlockTreeEnabled > 0 ? currentBlock || (EMPTY_ARR as any) : null
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
  return vnode
}
```

## 6. Vue 2 与 Vue 3 编译产物对比

| 对比维度         | Vue 2 `render` 函数                       | Vue 3 `render` 函数                                |
| ---------------- | ----------------------------------------- | -------------------------------------------------- |
| 帮助函数来源     | 挂载在组件实例的 `this` 上 (`this._c` 等) | 利用 ES6 `import` 显式导入 (`_createElementVNode`) |
| 树的遍历方式     | 层级递归，全量比对                        | **Block Tree** 扁平化，仅遍历动态节点数组          |
| 节点比较方式     | 全量对比 `props`、`class` 等              | 依据 **PatchFlag** 执行靶向位运算更新              |
| 静态节点生命周期 | 每次 Render 重新执行 `_v` 创建虚拟节点    | **静态提升 (Hoisting)**，全局只创建一次，纯复用    |
| Typescript 支持  | 难以推导（依赖 `this` 隐式上下文）        | 天然友好（纯函数输入输出）                         |

## 7. 总结

`Compiler` 是 Vue 3 实现性能飞跃的幕后推手。它的核心价值在于通过 `Parse`、`Transform`、`Generate` 三个阶段，将开发者的声明式代码，转换为**高度优化的、携带具体执行指令的命令式代码**。

- **设计亮点**：基于插件化（Plugin-based）架构的 `Transform` 阶段，使得指令扩展、节点优化规则非常容易抽离和维护。
- **性能优化**：PatchFlag 靶向更新、Block Tree 动静分离、Static Hoisting 静态提升、Cache Handlers 事件缓存四大神技，完美做到了“编译时提示运行时”。
- **架构分离**：解耦的 `compiler-core` 与 `compiler-dom` 让 Vue 3 成为一个真正意义上的跨端渐进式框架。
