# 编译转换/优化阶段（Transform）

转换（transform）阶段是 Vue 3 模板编译的第二环，也是整个编译管道的核心优化步骤。它接收解析器产出的模板 AST，通过**深度优先遍历**与**插件系统**，将其转换为携带优化信息的 JavaScript AST，为最终的代码生成（generate）奠定基础。该阶段完成了指令编译、静态提升、PatchFlag 标记和 Block Tree 构建等关键任务。

## 1. transform 阶段概述

- **入口函数**：`transform(ast, options)`
- **核心任务**：将模板 AST 转换为带优化信息的 JavaScript AST
- **技术特点**：
  - 深度优先遍历（enter → children → exit）
  - 插件系统（职责分离的转换单元）
  - 指令编译（`v-if` → 三元表达式、`v-for` → `renderList` 等）
  - 编译时优化（静态提升、PatchFlag、Block Tree）
  - 平台适配（核心插件 + 平台专属插件）

## 2. 核心数据结构

### 2.1 `TransformContext`：转换上下文

转换过程的所有状态都保存在 `TransformContext` 对象中：

:::code-group

```typescript [transform.ts]
interface TransformContext {
  root: RootNode // 根节点
  nodeTransforms: NodeTransform[] // 注册的节点转换插件
  directiveTransforms: Record<string, DirectiveTransform> // 指令转换插件
  helpers: Map<symbol, number> // 辅助函数引用计数
  currentNode: RootNode | TemplateChildNode | null // 当前正在处理的节点
  parent: ParentNode | null // 当前节点的父节点
  childIndex: number // 当前节点在父节点 children 中的索引
  currentBlock: BlockStatement | null // 当前活跃的 Block
  hoists: JSChildNode[] // 静态提升节点数组
  identifiers: Set<string> // 作用域内声明的标识符集合
  scopes: { vFor: number; vSlot: number; vPre: number; vOnce: number } // 作用域计数器
}
```

:::

### 2.2 JavaScript AST 节点类型（转换阶段新增）

转换阶段在模板 AST 的基础上，引入了大量面向 JavaScript 代码生成的节点类型：

:::code-group

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

### 2.3 PatchFlag 常量定义

PatchFlag 是一组位掩码，用于标记动态节点的具体变化类型：

:::code-group

```typescript [patchFlags.ts]
export const enum PatchFlags {
  TEXT = 1, // 动态文本内容
  CLASS = 2, // 动态 class
  STYLE = 4, // 动态 style
  PROPS = 8, // 动态属性（不含 class/style）
  FULL_PROPS = 16, // 需要完整 diff（动态 key，如 v-bind="obj"）
  HYDRATE_EVENTS = 32, // 需要水合的事件
  STABLE_FRAGMENT = 64, // 稳定的 Fragment（子节点顺序不变）
  KEYED_FRAGMENT = 128, // 带 key 的 Fragment
  UNKEYED_FRAGMENT = 256, // 不带 key 的 Fragment
  NEED_PATCH = 512, // 需要递归 patch（存在动态子元素）
  DYNAMIC_SLOTS = 1024, // 动态插槽
  DEV_ROOT_FRAGMENT = 2048, // 开发环境下的根 Fragment
  HOISTED = -1, // 已静态提升
  BAIL = -2, // diff 时需要完全退出优化模式
}
```

:::

## 3. `transform` 函数入口与调度

编译器的顶层入口是 `baseCompile`，它在解析完成后调用 `transform`：

:::code-group

```typescript [compile.ts]
// 基础编译入口
export function baseCompile(
  template: string | RootNode, // 模板可以是字符串，也可以是已经解析好的 AST
  options: CompilerOptions = {}, // 编译配置项
): CodegenResult {
  // 第一步：Parse 解析阶段
  // 如果传入的是字符串模板，就调用 baseParse 生成基础 AST
  const ast = isString(template) ? baseParse(template, options) : template

  // 获取基础的转换插件预设 (如处理 v-if, v-for, 元素的插件)
  //options.prefixIdentifiers代码生成策略开关,直接决定了模板里的变量在编译后变成什么样。
  //prefixIdentifiers: true 通过构建工具在 Node.js 环境下预编译
  //prefixIdentifiers: false 在浏览器里当场编译模板
  const [nodeTransforms, directiveTransforms] = getBaseTransformPreset(
    options.prefixIdentifiers, //默认为true
  )

  // 第二步：Transform 转换与优化阶段
  // 将基础 AST 连同合并后的插件配置交由 transform 处理
  transform(ast, {
    ...options,
    // 合并内部默认插件和用户自定义的插件
    nodeTransforms: [
      ...nodeTransforms,
      ...(options.nodeTransforms || []), //用户自定义插件
    ],
    directiveTransforms: {
      ...directiveTransforms,
      ...(options.directiveTransforms || {}), //用户自定义插件
    },
  })

  // 第三步：Generate 代码生成阶段
  // 此时的 ast 已经被 transform 注入了灵魂 (打上了 PatchFlags 等)
  // 直接交给 generate 生成最终的 JS 渲染函数字符串
  return generate(ast, options)
}
```

:::

### 3.1 获取内置转换插件预设

`getBaseTransformPreset` 返回平台无关的核心插件列表和指令转换映射：

:::code-group

```typescript [compile.ts]
export function getBaseTransformPreset(
  prefixIdentifiers?: boolean,
): [NodeTransform[], Record<string, DirectiveTransform>] {
  return [
    // 节点转换插件数组（按顺序执行）
    [
      transformOnce, // v-once 指令
      transformIf, // v-if / v-else-if / v-else
      transformMemo, // v-memo 指令
      transformFor, // v-for 指令
      transformExpression, // 模板表达式处理
      transformSlotOutlet, // <slot> 插槽出口
      transformElement, // 元素节点处理（生成 codegenNode、计算 PatchFlag）
      trackSlotScopes, // 追踪插槽作用域
      transformText, // 合并相邻文本与插值为复合表达式
    ],
    // 指令转换函数映射
    {
      on: transformOn, // v-on 事件绑定
      bind: transformBind, // v-bind 动态绑定
      model: transformModel, // v-model 双向绑定
    },
  ]
}
```

:::

### 3.2 `transform` 函数：创建上下文并启动遍历

:::code-group

```typescript [transform.ts]
export function transform(root: RootNode, options: TransformOptions) {
  // 1. 创建转换上下文
  const context = createTransformContext(root, options)

  // 2. 深度优先遍历整棵 AST
  traverseNode(root, context)

  // 3. 静态提升：将纯静态节点提取为模块级常量
  if (options.hoistStatic) {
    hoistStatic(root, context)
  }

  // 4. 生成根节点的 codegenNode
  if (!options.ssr) {
    createRootCodegen(root, context)
  }

  // 5. 将 helpers 等信息挂载到根节点
  root.helpers = new Set([...context.helpers.keys()])
  root.components = [...context.components]
  root.directives = [...context.directives]
  root.imports = [...context.imports]
  root.hoists = context.hoists
  root.temps = context.temps
  root.cached = context.cached
}
```

:::

#### 3.2.1 `createTransformContext`: 创建 transform 上下文

`createTransformContext` 是一个工厂函数，它的作用是把外部传入的 options 和内部需要的状态整合在一起，返回一个巨大的 `Context`对象。

:::code-group

```typescript [transform.ts]
export function createTransformContext(
  root: RootNode,
  {
    prefixIdentifiers = false,
    hoistStatic = false,
    nodeTransforms = [],
    directiveTransforms = {},
    // ... 其他编译选项
  }: TransformOptions,
): TransformContext {
  const context: TransformContext = {
    // 1. 静态配置与插件集合
    nodeTransforms, // 所有的节点转换插件
    directiveTransforms, // 所有的指令转换插件
    options: { prefixIdentifiers, hoistStatic }, // 编译开关

    // 2. 动态游标与状态记录 (GPS)
    root, // 根节点引用
    currentNode: root, // 当前正在处理的节点
    parent: null, // 当前节点的父节点
    childIndex: 0, // 当前节点在父节点 children 数组中的索引

    // 收集器：用于最终生成代码
    helpers: new Map(), // 记录需要从 'vue' 导出的辅助函数 (Tree-shaking 基石)
    components: new Set(), // 记录模板中用到的组件名
    directives: new Set(), // 记录用到的自定义指令
    hoists: [], // 存储被静态提升的节点
    imports: [], // 存储需要外部导入的模块
    cached: 0, // 缓存计数器 (用于事件监听缓存)

    // 作用域追踪 (比如是否在 v-for 内部)
    scopes: { vFor: 0, vSlot: 0, vPre: 0, vOnce: 0 },

    // 3. 核心 API 方法 (提供给插件调用)

    // 注册运行时辅助函数
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    },

    // 替换当前节点
    replaceNode(node) {
      // 1. 修改 AST 树上的真实数据
      context.parent!.children[context.childIndex] = context.currentNode = node
    },

    // 删除当前节点
    removeNode(node) {
      const list = context.parent!.children
      // 1. 从父节点的 children 中移除
      const removalIndex = node ? list.indexOf(node) : context.childIndex
      list.splice(removalIndex, 1)

      // 2. 动态修正当前游标，防止遍历崩溃
      if (!node || node === context.currentNode) {
        context.currentNode = null
        context.onNodeRemoved() // 内部修正 childIndex
      }
    },

    onNodeRemoved() {
      // 如果当前节点被删除了，我们要把游标往回退一格
      // 因为数组 splice 后，后面的元素会顶上来，如果不回退，下一次循环就会漏掉一个节点！
      context.childIndex--
    },
  }

  return context
}
```

:::

#### 3.2.2 `traverseNode`: 深度优先遍历器

`traverseNode` 是遍历 AST 的核心函数，它递归访问每个节点，并在进入和退出时调用插件钩子：

:::code-group

```typescript [transform.ts]
export function traverseNode(
  node: RootNode | TemplateChildNode,
  context: TransformContext,
) {
  // 1. 更新当前上下文指针，将当前正在处理的节点存入 context
  context.currentNode = node

  // 2. 获取所有的节点转换插件 (如 transformIf, transformElement)
  const { nodeTransforms } = context

  // 3. 准备一个栈，用于存放所有插件返回的 Exit (退出) 函数
  const exitFns = []

  // 阶段一：Enter (进入阶段) - 自上而下
  for (let i = 0; i < nodeTransforms.length; i++) {
    // 依次执行所有的插件
    const onExit = nodeTransforms[i](node, context)

    // 如果插件返回了一个函数，说明这个插件需要在当前节点及其子节点全都处理完后，再执行一些收尾逻辑
    if (onExit) {
      if (isArray(onExit)) {
        exitFns.push(...onExit)
      } else {
        exitFns.push(onExit)
      }
    }

    // 极其关键的安全防御
    // 某个插件在处理时，可能把当前节点直接删除了 (例如 v-if 分支不满足条件)
    // 如果节点没了，直接 return 停止后续的所有遍历！
    if (!context.currentNode) {
      return
    } else {
      // 如果插件替换了当前节点，我们需要把 node 变量更新为最新的节点，交接给下一个插件
      node = context.currentNode
    }
  }

  // 阶段二：DFS (深度优先递归子节点)
  switch (node.type) {
    case NodeTypes.COMMENT:
      // 注释节点直接引入创建注释的 runtime 函数
      context.helper(CREATE_COMMENT)
      break
    case NodeTypes.INTERPOLATION:
      // 插值节点引入 toDisplayString 函数
      context.helper(TO_DISPLAY_STRING)
      break

    // 下面这三种节点包含子节点，需要递归深入
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context)
      }
      break
    case NodeTypes.IF_BRANCH:
    case NodeTypes.FOR:
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 遍历所有 children
      traverseChildren(node, context)
      break
  }

  // 阶段三：Exit (退出阶段) - 自下而上
  // 递归结束，游标回到当前节点
  context.currentNode = node

  // 重点：倒序执行 Exit 函数！
  // 越早进入的插件，说明它的层级越靠外。越靠外的逻辑，越需要拿到一棵经过深层彻底处理完毕的
  // AST 树才能做最后的下定论（比如生成代码包裹层、计算整个节点的静态属性等）。这就是倒序执行的根本目的。
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}
```

:::

#### 3.2.3 `traverseChildren`: 遍历子节点

```typescript
// 遍历处理父节点下的所有子节点
export function traverseChildren(
  parent: ParentNode,
  context: TransformContext,
) {
  let i = 0 // 定义在外层的游标索引

  // 核心防错回调函数：当有节点被删除时，让游标后退一步
  const nodeRemoved = () => {
    i--
  }

  // 开启正向循环遍历
  for (; i < parent.children.length; i++) {
    const child = parent.children[i]

    // 如果子节点是纯字符串（理论上经过 parse 阶段应该是 TextNode 对象，这里做防御性判断），跳过
    if (isString(child)) continue

    // 更新全局 GPS (上下文指针)
    context.parent = parent // 告诉后面的插件，当前子节点的爹是谁
    context.childIndex = i // 告诉后面的插件，当前子节点排老几
    context.onNodeRemoved = nodeRemoved // 挂载防错回调

    // 递归调用 traverseNode，把子节点当作新的起点继续深入
    traverseNode(child, context)
  }
}
```

## 5. 插件系统：职责分离的转换单元

所有转换逻辑被拆分为一个个**转换插件**，每个插件负责一类特定的编译任务。插件通过 `nodeTransforms` 和 `directiveTransforms` 注册。

### 5.1 内置核心插件一览

| 插件                  | 进入时机   | 核心职责                                                            |
| --------------------- | ---------- | ------------------------------------------------------------------- |
| `transformOnce`       | enter      | 处理 `v-once` 指令，标记静态内容                                    |
| `transformIf`         | exit       | 将 `v-if` / `v-else-if` / `v-else` 编译为三元表达式，创建条件 Block |
| `transformMemo`       | exit       | 处理 `v-memo` 指令                                                  |
| `transformFor`        | exit       | 将 `v-for` 编译为 `renderList` 调用                                 |
| `transformExpression` | enter      | 将模板中的 JavaScript 字符串转为合法的表达式 AST                    |
| `transformSlotOutlet` | exit       | 处理 `<slot>` 及其作用域                                            |
| `transformElement`    | exit       | 生成 `codegenNode`，计算 PatchFlag，收集动态属性                    |
| `trackSlotScopes`     | enter/exit | 追踪插槽作用域信息                                                  |
| `transformText`       | exit       | 合并相邻文本和插值节点为 `COMPOUND_EXPRESSION`                      |

### 5.2 平台插件注入

以 `@vue/compiler-dom` 为例，它在核心插件之上追加了浏览器专属的节点转换：

:::code-group

```typescript [compiler-dom/src/index.ts]
// DOM 平台专属的节点转换插件
export const DOMNodeTransforms: NodeTransform[] = [
  transformStyle, // 处理内联样式绑定
  ...(__DEV__ ? [transformTransition] : []), // 开发环境校验 <Transition>
  ...(__DEV__ ? [validateHtmlNesting] : []), // 开发环境校验 HTML 嵌套
]

// 在 compile 函数中合并
nodeTransforms: [
  ignoreSideEffectTags, // 跳过 <script> 和 <style>
  ...DOMNodeTransforms, // 平台专属
  ...(options.nodeTransforms || []), // 用户自定义
]
```

:::

### 5.3 插件执行示例：`transformElement`

`transformElement` 是产生优化信息的核心插件，它在 `exit` 钩子中分析元素：

:::code-group

```typescript [transforms/transformElement.ts]
const transformElement: NodeTransform = (node, context) => {
  // enter 阶段不处理，直接返回 exit 钩子
  return function postTransformElement() {
    node = context.currentNode!
    if (node.type !== NodeTypes.ELEMENT) return

    const { tag, props, children } = node
    let patchFlag = PatchFlags.NEED_PATCH
    let dynamicProps: string[] | undefined

    // 1. 分析属性，计算 patchFlag
    for (const prop of props) {
      if (prop.type === NodeTypes.DIRECTIVE) {
        const { name, arg } = prop
        if (name === 'bind' && arg) {
          // 动态属性绑定
          patchFlag |= PatchFlags.PROPS
          dynamicProps = dynamicProps || []
          dynamicProps.push(arg)
        } else if (name === 'on') {
          // v-on 事件（由 transformOn 插件处理缓存，此处不标记为动态）
        }
      }
    }

    // 2. 检查子节点中的动态内容
    if (children.some(child => child.type === NodeTypes.INTERPOLATION)) {
      patchFlag |= PatchFlags.TEXT
    }

    // 3. 如果子节点中有动态元素，标记为 NEED_PATCH
    if (children.some(child => child.patchFlag && child.patchFlag > 0)) {
      patchFlag |= PatchFlags.NEED_PATCH
    }

    // 4. 生成 codegenNode（创建 VNode 的调用描述）
    node.codegenNode = createVNodeCall(
      context,
      tag,
      props,
      children,
      patchFlag,
      dynamicProps,
      false,
    )
  }
}
```

:::

## 6. 指令编译实现

### 6.1 `transformIf`：条件编译

`transformIf` 将 `v-if` / `v-else-if` / `v-else` 编译为**三元表达式**，并为每个分支创建独立的 Block：

:::code-group

```typescript [transforms/vIf.ts]
const transformIf: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT || !node.props) return
  // 查找 v-if 指令
  const ifDirective = findDir(node, 'if')
  if (!ifDirective) return

  // 返回 exit 钩子处理
  return function exit() {
    const condition = ifDirective.exp
    const branches = [node] // 当前分支（if）
    let currentBranch = node

    // 收集相邻的 v-else-if 和 v-else 分支
    let next = node.nextSibling
    while (next) {
      if (next.type === NodeTypes.ELEMENT) {
        const elseIfDirective = findDir(next, 'else-if')
        const elseDirective = findDir(next, 'else')
        if (elseIfDirective || elseDirective) {
          branches.push(next)
          currentBranch = next
          next = next.nextSibling
          continue
        }
      }
      break
    }

    // 生成三元表达式链
    node.codegenNode = createConditionalExpression(
      branches.map((branch, i) => {
        // 每个分支生成独立的 Block
        return createBlock(branch, context)
      }),
    )
  }
}
```

:::

### 6.2 `transformFor`：列表编译

`transformFor` 将 `v-for` 编译为 `renderList` 函数调用：

:::code-group

```typescript [transforms/vFor.ts]
const transformFor: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT || !node.props) return
  const forDirective = findDir(node, 'for')
  if (!forDirective) return

  return function exit() {
    // 解析 v-for="item in list" 或 v-for="(item, index) in list"
    const { source, value, key, index } = parseForExpression(forDirective.exp)

    // 生成 renderList 调用的 codegenNode
    node.codegenNode = createForLoopCall(
      context,
      source, // 被遍历的数据源
      value, // 当前项变量名
      key, // key 变量名
      index, // index 变量名
      node, // 循环体（每次循环创建一个子 Block）
    )
  }
}
```

:::

### 6.3 `transformOn`：事件缓存

`transformOn` 负责编译 `v-on` 或 `@` 事件绑定，默认启用**事件处理函数缓存**：

:::code-group

```typescript [transforms/vOn.ts]
const transformOn: DirectiveTransform = (dir, node, context) => {
  const { arg, exp } = dir
  const eventName = parseEventName(arg)

  // 如果启用缓存（默认开启），生成 _cache[x] 包装
  if (context.cacheHandlers) {
    return {
      key: `on${capitalize(eventName)}`,
      value: createCacheExpression(context, `($event) => _ctx.${exp}($event)`),
    }
  }

  // 未启用缓存时，直接返回事件处理函数引用
  return {
    key: `on${capitalize(eventName)}`,
    value: exp,
  }
}
```

:::

## 7. 编译时优化实现

### 7.1 `hoistStatic`：静态提升

`hoistStatic` 将纯静态节点提取为模块级常量，避免在每次渲染中重复创建 VNode：

:::code-group

```typescript [transforms/hoistStatic.ts]
// 静态提升主入口
export function hoistStatic(root: RootNode, context: TransformContext) {
  // 从根节点开始向下“扫描”
  walk(root, context, new Map())
}

function walk(
  node: ParentNode,
  context: TransformContext,
  resultCache: Map<TemplateChildNode, boolean>,
) {
  const children = node.children

  // 遍历所有子节点
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    // 只有元素节点和文本节点才有资格被提升
    if (
      child.type === NodeTypes.ELEMENT &&
      child.codegenNode &&
      child.codegenNode.type === NodeTypes.VNODE_CALL
    ) {
      // 💥 1. 检查整个节点是否是纯静态的
      if (isStaticNode(child.codegenNode, resultCache)) {
        // 把这个静态节点塞进全局的 hoists 数组，并拿到它的索引 (比如 0)
        const hoistedIndex = context.hoists.push(child.codegenNode) - 1

        // 标记这个节点已经被提升了
        child.codegenNode.isHoisted = true

        // 🔮 魔法替换：把原来的巨无霸 AST 节点，直接替换成一个微小的变量标识符
        // 比如 `_hoisted_1` (索引 + 1)
        child.codegenNode = context.helper(
          createSimpleExpression(`_hoisted_${hoistedIndex + 1}`, false),
        )

        // 节点整体都被提升了，它的子节点也不用看了，直接跳过！
        continue
      }

      // 💥 2. 节点不是纯静态的，那它的“属性”能不能单独提升？(Props Hoisting)
      else {
        const codegenNode = child.codegenNode
        const flag = getPatchFlag(codegenNode) // 获取之前打的靶向标记

        // 如果这个节点只有文本是动态的 (TEXT=1)，或者只是需要遍历 (NEED_PATCH)
        // 且它身上有纯静态的属性 (比如 id="app" class="box")
        if (
          (!flag ||
            flag === PatchFlags.TEXT ||
            flag === PatchFlags.NEED_PATCH) &&
          hasStaticProps(codegenNode)
        ) {
          // 把它的静态 props 对象也塞进 hoists 数组
          const hoistedPropsIndex = context.hoists.push(codegenNode.props!) - 1

          // 把原来的 props 替换成变量 `_hoisted_2`
          codegenNode.props = createSimpleExpression(
            `_hoisted_${hoistedPropsIndex + 1}`,
            false,
          )
        }
      }
    }

    // 3. 如果当前节点没被整体提升，那就继续递归检查它的子节点
    if (
      child.type === NodeTypes.ELEMENT ||
      child.type === NodeTypes.FOR ||
      child.type === NodeTypes.IF
    ) {
      walk(child, context, resultCache)
    }
  }
}
```

:::

### 7.2 Block Tree 构建

Block Tree 将模板基于结构指令（`v-if`、`v-for`、`<slot>`）切分为多个 Block，每个 Block 内部扁平收集所有动态后代节点：

:::code-group

```typescript [transform.ts]
// 创建 Block 的辅助函数
function createBlock(
  node: TemplateChildNode,
  context: TransformContext,
): BlockStatement {
  const block: BlockStatement = {
    type: NodeTypes.JS_BLOCK_STATEMENT,
    body: [],
    dynamicChildren: [], // 扁平收集动态节点，不递归展开
  }

  // 将 block 推入上下文栈
  const previousBlock = context.currentBlock
  context.currentBlock = block

  // 处理节点（此时 transformElement 会将动态节点加入 currentBlock.dynamicChildren）
  traverseNode(node, context)

  // 恢复上一个 Block
  context.currentBlock = previousBlock

  return block
}
```

:::

`transformElement` 在 exit 阶段发现节点有 patchFlag 时，会将其加入当前 Block 的 `dynamicChildren`：

```typescript
// 在 transformElement 的 exit 钩子中
if (patchFlag > 0 && context.currentBlock) {
  context.currentBlock.dynamicChildren.push(node)
}
```

### 7.3 `createRootCodegen`：生成根节点

遍历完成后，为根节点创建最终的 `codegenNode`：

:::code-group

```typescript [transform.ts]
function createRootCodegen(root: RootNode, context: TransformContext) {
  const { children } = root
  // 如果只有一个根元素且不是 Fragment，直接使用该元素的 codegenNode
  if (children.length === 1) {
    const child = children[0]
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      root.codegenNode = child.codegenNode
      return
    }
  }
  // 否则创建 Fragment Block
  root.codegenNode = createVNodeCall(
    context,
    FRAGMENT,
    undefined,
    root.children,
    PatchFlags.STABLE_FRAGMENT,
  )
}
```

:::

## 8. 完整流程示例

### 8.1 基础代码示例

**输入模板 AST**（解析阶段产出的简化表示）:

```json
{
  "type": 0,
  "children": [
    {
      "type": 1,
      "tag": "div",
      "props": [
        { "type": 6, "name": "class", "value": { "type": 2, "content": "box" } }
      ],
      "children": [
        { "type": 2, "content": "Hello " },
        { "type": 5, "content": { "type": 4, "content": "name" } },
        { "type": 2, "content": " " }
      ]
    }
  ]
}
```

**经过 transform 阶段后的 JavaScript AST**:

```json
{
  "type": 0,
  "children": [
    /* ...原始 children 保留，每个元素节点增加了 codegenNode */
  ],
  "codegenNode": {
    "type": 13,
    "tag": "\"div\"",
    "props": { "class": "box" },
    "children": [
      {
        "type": 8,
        "children": [
          { "type": 2, "content": "Hello " },
          {
            "type": 5,
            "content": {
              "type": 4,
              "content": "_toDisplayString(_ctx.name)"
            }
          },
          { "type": 2, "content": " " }
        ]
      }
    ],
    "patchFlag": "1 /* TEXT */",
    "dynamicProps": null,
    "dynamicChildren": []
  },
  "hoistedNodes": []
}
```

**关键转换说明**：

- `<div>` 元素被转换为 `VNODE_CALL`（type 13），其 `codegenNode` 将生成 `createElementBlock` 调用。
- 插值 `{{ name }}` 被包裹为 `_toDisplayString(_ctx.name)` 的简单表达式。
- 文本 `"Hello "`、插值、文本 `" "` 被 `transformText` 合并为一个**复合表达式** (`COMPOUND_EXPRESSION`, type 8)。
- `patchFlag` 被设置为 `1 /* TEXT */`，表示该元素仅文本内容是动态的，运行时 diff 只需比对文本，跳过静态属性 `class="box"`。

**最终生成的渲染函数代码**:

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
      [_createTextVNode('Hello ' + _toDisplayString(_ctx.name) + ' ')],
      1 /* TEXT */,
    )
  )
}
```

### 8.2 完整流程图

## 9. 总结

Vue 3 编译器的 transform 阶段通过 **插件化深度优先遍历**，将模板 AST 转换为经过深度优化的 JavaScript AST。其核心贡献包括：

- **插件系统**：职责分离，灵活扩展，平台无关的核心与平台专属插件协同工作。每个插件通过 `enter` 和 `exit` 钩子在恰当的时机介入处理。
- **指令编译**：将 Vue 模板指令（`v-if`、`v-for`、`v-on`、`v-model` 等）转化为简洁的 JavaScript 表达式与属性绑定。
- **静态提升（hoistStatic）**：将纯静态节点提取为模块级常量，仅在初始化时创建一次 VNode，后续渲染直接复用，显著减少运行时开销。
- **PatchFlag 标记**：精准标记动态内容的类型（文本、class、style、props 等），运行时 diff 可根据标记靶向更新，跳过所有静态属性。
- **Block Tree**：以结构指令为边界划分 Block，扁平收集动态节点，使 diff 过程绕过静态子树，仅处理 `dynamicChildren` 数组中的动态节点，实现 diff 性能与模板大小的“解耦”。

这些优化技术协同作用，实现了 Vue 3 “编译时分析，运行时轻量”的核心设计哲学——编译器在构建阶段尽可能多地提取静态信息并注入优化标记，使运行时渲染器能以极低的成本完成精准更新。理解 transform 阶段的工作原理，对于深入掌握 Vue 3 响应式更新机制、编写自定义编译器插件或进行性能调优都具有重要意义。
