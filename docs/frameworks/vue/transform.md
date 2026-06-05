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
  root.helpers = new Set([...context.helpers.keys()]) //需要的辅助函数
  root.components = [...context.components] //模板中使用的自定义组件名称
  root.directives = [...context.directives] //模板中使用的自定义指令
  root.imports = [...context.imports] //需要外部引入的模块资源
  root.hoists = context.hoists //被静态提升（Static Hoisting）的 AST 节点数组。
  root.temps = context.temps //模板编译时需要的临时变量的数量。
  root.cached = context.cached //事件监听缓存（Cache Handlers）所需的缓存槽位数量
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

- **Enter（进入阶段）**： 自上而下。在深入子节点之前，依次执行配置好的 `nodeTransforms` 插件。此时插件可以对节点进行初步的改造（例如 `v-if` 的初步识别）。
- **Exit（退出阶段）**： 自下而上。当该节点的所有子节点都遍历完毕后，倒序执行插件在 `Enter` 阶段返回的收尾函数。这使得外层节点可以根据子节点的最终状态（例如子节点是否包含动态数据）来决定自己的编译结果（如计算 `PatchFlags`）。

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

:::code-group

```typescript [transform.ts]
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

:::

#### 3.2.4 `hoistStatic`：静态提升

`hoistStatic` 将纯静态节点提取为模块级常量，避免在每次渲染中重复创建 VNode：

:::code-group

```typescript [hoistStatic.ts]
// 导入节点类型常量
import { NodeTypes } from '../ast'

//静态提升入口函数
export function hoistStatic(root, context) {
  // 从根节点开始向下递归扫描
  walk(root, context)
}

//核心扫描引擎
function walk(node, context) {
  const children = node.children
  // 遍历当前节点的所有子节点
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    // 只有普通元素节点 (且已经生成了 codegenNode) 才有资格被提升
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      const codegenNode = child.codegenNode
      // 策略一：全量节点提升 (Full Element Hoisting)
      // 检查：如果这整个节点连同它的子节点全都是纯静态的
      if (isStaticNode(codegenNode)) {
        // 1. 把这个静态节点的生成逻辑，塞进 context.hoists 这个全局“储物箱”里
        // push 返回的是新长度，减 1 就是它在数组里的索引 (比如 0, 1, 2...)
        const hoistedIndex = context.hoists.push(codegenNode) - 1

        // 2. 打上标记，告诉后面的程序这个节点已经被提走了
        codegenNode.isHoisted = true

        // 3. 偷天换日：用一个极简的变量名替换掉原本庞大的生成逻辑！
        // 比如替换成 "_hoisted_1"
        child.codegenNode = {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: `_hoisted_${hoistedIndex + 1}`, // 生成变量名
          isStatic: false,
        }
        // 核心优化：既然这个节点整体都被提升了，那它内部的子节点就没必要再看了，直接跳过！
        continue
      }
      // 策略二：静态属性提升 (Props Hoisting)
      // 如果走到这里，说明节点本身不是纯静态的 (比如 <div>{{ msg }}</div>)
      // 但是，我们还要压榨最后一点性能：它的属性(Props)有没有可能是纯静态的？
      else {
        // 获取靶向更新标记
        const patchFlag = codegenNode.patchFlag

        // 如果这个节点只是文本是动态的 (TEXT=1)，且它身上有静态属性 (比如 class="box" id="app")
        if (patchFlag === 1 /* TEXT */ && hasStaticProps(codegenNode)) {
          // 1. 把纯静态的 props 对象塞进 hoists 储物箱
          const hoistedPropsIndex = context.hoists.push(codegenNode.props) - 1

          // 2. 偷天换日：把原来的 props 替换成变量引用 "_hoisted_2"
          codegenNode.props = {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: `_hoisted_${hoistedPropsIndex + 1}`,
          }
        }
      }
    }
    // 递归深入
    // 如果当前子节点是一个包含 children 的节点，且没有被全量提升，则继续向下扫描
    if (child.children && child.children.length > 0) {
      walk(child, context)
    }
  }
}

// 模拟检查节点是否纯静态的辅助函数
function isStaticNode(node) {
  // 在真实源码中，这会有一套复杂的递归校验逻辑
  // 简而言之：没有动态绑定、没有 v-if/v-for，且所有子节点也都是静态的，就是 true
  return true
}

// 模拟检查节点是否有静态属性的辅助函数
function hasStaticProps(node) {
  return node.props && node.props.type !== NodeTypes.JS_CALL_EXPRESSION
}
```

:::

#### 3.2.5 `createRootCodegen`：生成根节点

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

## 4. 插件系统：职责分离的转换单元

所有转换逻辑被拆分为一个个**转换插件**，每个插件负责一类特定的编译任务。插件通过 `nodeTransforms` 和 `directiveTransforms` 注册。

### 4.1 内置核心插件一览

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

### 4.2 平台插件注入

以 `@vue/compiler-dom` 为例，它在核心插件之上追加了浏览器专属的节点转换：

:::code-group

```typescript [compiler-dom/src/index.ts]
// DOM 平台专属的节点转换插件
import { baseCompile, CompilerOptions, CodegenResult } from '@vue/compiler-core'
import { parserOptions } from './parserOptions'
import { transformStyle } from './transforms/transformStyle'
import { transformVHtml } from './transforms/vHtml'
import { transformVText } from './transforms/vText'
import { transformModel } from './transforms/vModel'
import { transformOn } from './transforms/vOn'
import { transformShow } from './transforms/vShow'

// 1. 浏览器专属的节点转换插件 (Node Transforms)
export const DOMNodeTransforms = [
  transformStyle, // 处理 <style> 标签和内联 style 属性
  ...(__DEV__ ? [transformTransition] : []), // 开发环境校验 <Transition>
  ...(__DEV__ ? [validateHtmlNesting] : []), // 开发环境校验 HTML 嵌套
]

// 2. 浏览器专属的指令转换插件 (Directive Transforms)
export const DOMDirectiveTransforms = {
  cloak: noopDirectiveTransform, // 处理 v-cloak (直接移除)
  html: transformVHtml, // 处理 v-html (转成 innerHTML)
  text: transformVText, // 处理 v-text (转成 textContent)
  model: transformModel, // DOM 专属 v-model (能识别 input/checkbox/select 并生成不同事件)
  on: transformOn, // DOM 专属 v-on (能处理 .stop, .prevent 等键盘/鼠标事件修饰符)
  show: transformShow, // 处理 v-show (配合运行时控制 display 属性)
}

// 3. 面向 Web 平台的 compile 入口函数
export function compile(
  template: string,
  options: CompilerOptions = {},
): CodegenResult {
  // 调用核心包的 baseCompile
  return baseCompile(template, {
    // 注入解析器配置 (告诉 Parser 哪些是 HTML 原生标签，哪些是 SVG 标签)
    ...parserOptions,
    // 注入用户自定义配置
    ...options,

    // 🔥 核心注入：合并 DOM 专属节点插件和用户自定义节点插件
    nodeTransforms: [
      ignoreSideEffectTags, // 跳过 <script> 和 <style>
      ...DOMNodeTransforms,
      ...(options.nodeTransforms || []),
    ],

    // 🔥 核心注入：合并 DOM 专属指令插件和用户自定义指令插件
    directiveTransforms: {
      ...DOMDirectiveTransforms,
      ...(options.directiveTransforms || {}),
    },
  })
}
```

:::

### 4.3 插件执行示例

#### 4.3.1 `transformElement`：VNode 的缔造者与靶向打标机

**地位**：它是整个 Transform 阶段最重磅、最核心的插件。

**职责**：将基础的 HTML 元素节点转换为真正生成 VNode 的代码，并在此时**计算 PatchFlags**。

:::code-group

```typescript [transformElement.ts]
import { createVNodeCall } from './vnodeCall'
export const transformElement = (node, context) => {
  // 1. 如果不是元素节点 (Element 或 Component)，直接跳过，不归我管
  if (node.type !== 1 /* NodeTypes.ELEMENT */) {
    return
  }

  // 2. 核心：返回 Exit (退出) 回调函数
  // 必须等待内部的文本、v-if、v-for 全都处理完毕后，才能执行！
  return function postTransformElement() {
    const { tag, props, children } = node
    // 准备收集用来生成 VNode 的四个核心参数
    let vnodeTag = `"${tag}"` // 标签名
    let vnodeProps // 属性 AST
    let vnodeChildren // 子节点 AST
    let vnodePatchFlag = 0 // 靶向更新标记 (初始为 0，纯静态)
    let dynamicPropNames // 动态属性名数组

    // 步骤 A：分析 Props (属性)
    if (props.length > 0) {
      // 真实源码这里会调用一个非常复杂的 buildProps 函数
      // 它会遍历解析 v-bind, :class, :style 等，并返回聚合结果
      const propsBuildResult = buildProps(node, context)
      vnodeProps = propsBuildResult.props
      // 累加属性级别的 PatchFlag (比如发现了 :id="xxx"，就会打上 8 /* PROPS */)
      vnodePatchFlag |= propsBuildResult.patchFlag
      dynamicPropNames = propsBuildResult.dynamicProps
    }

    // 步骤 B：分析 Children (子节点)
    if (children.length > 0) {
      vnodeChildren = children
      // 场景 1：如果只有一个子节点，且是动态文本 (比如 <div>{{ msg }}</div>)
      if (
        children.length === 1 &&
        children[0].type === NodeTypes.INTERPOLATION
      ) {
        // 累加文本级别的 PatchFlag
        vnodePatchFlag |= 1 /* TEXT */
      }
      // 场景 2：有多个子节点，并且里面包含动态节点
      else if (hasDynamicChildren(children)) {
        // 累加子节点需要深度遍历的比对标记
        vnodePatchFlag |= 16 /* FULL_PROPS */ // (此处为简化示例)
      }
    }
    // 步骤 C：打包生成 codegenNode
    // 只有当有动态标记时，才需要把 patchFlag 转化为字符串传递
    const patchFlagStr = vnodePatchFlag > 0 ? String(vnodePatchFlag) : undefined
    // 调用我们熟悉的 createVNodeCall，把收集到的所有情报装箱！
    node.codegenNode = createVNodeCall(
      context,
      vnodeTag,
      vnodeProps,
      vnodeChildren,
      patchFlagStr,
      dynamicPropNames,
      undefined, // directives (这里省略)
      false, // isBlock (通常由外层的 transformIf/For 决定，这里简写为 false)
    )
  }
}

// 模拟检查是否有动态子节点的辅助函数
function hasDynamicChildren(children) {
  // 只要子节点里有插值表达式、或者子节点身上带有 patchFlag，就说明是动态的
  return children.some(
    c => c.type === NodeTypes.INTERPOLATION || c.codegenNode?.patchFlag,
  )
}
```

:::

#### 4.3.2 `transformExpression`：JS 表达式的翻译官

**职责**：处理插值或指令属性 `:id="xxx"` 内部的 JavaScript 表达式。

**核心动作**：为变量加上 `_ctx.` 前缀（当 `prefixIdentifiers` 开启时）。

:::code-group

```typescript [transformExpression.ts]
// 假设有一份全局变量白名单 (如 Math, Date, isNaN 等)
const isGloballyWhitelisted = name => ['Math', 'Date', 'console'].includes(name)

//转换插件入口：分发处理插值和指令中的表达式
export const transformExpression: NodeTransform = (node, context) => {
  // 1. 处理文本插值: {{ message }}
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content, context)
  }
  // 2. 处理元素节点上的动态指令: <div :id="dynamicId" v-if="isShow">
  else if (node.type === NodeTypes.ELEMENT) {
    for (let i = 0; i < node.props.length; i++) {
      const dir = node.props[i]
      // 如果是指令，并且指令带有表达式值 (不能是没有值的 v-cloak)
      if (dir.type === NodeTypes.DIRECTIVE && dir.exp) {
        dir.exp = processExpression(dir.exp, context)
      }
    }
  }
}

//核心魔法：处理具体的 JS 表达式并注入 _ctx 前缀
function processExpression(node, context) {
  // 1. 拦截器：如果在 CDN 浏览器直接运行模式下 (没有开启前缀)，或者表达式为空，直接原样返回
  if (!context.options.prefixIdentifiers || !node.content.trim()) {
    return node
  }
  // 核心逻辑：判断变量是不是全局对象 (Math, Date) 或者局部变量 (v-for 里的 item)
  // 如果都不是，说明它是组件 data/setup 里的响应式数据，需要加前缀
  if (
    !isGloballyWhitelisted(node.content) &&
    !context.identifiers[node.content]
  ) {
    node.content = `_ctx.${node.content}`
  }

  return node
}
```

:::

[//]: # '**工作成果**：将开发者写的 `{{ msg }}` 安全地转化为 `{{ _ctx.msg }}`，实现无 `with` 语句的极速变量寻址。'

#### 4.3.3 `transformText`：文本碎片的缝合怪

**职责**：将相邻的纯文本节点（TEXT）和插值节点（INTERPOLATION）合并。

**痛点**：开发者经常写 `<p>Hello {{ name }} !</p>`。在基础 AST 中，这会被解析为 3 个节点（Text, Interpolation, Text）。如果不合并，渲染器要创建 3 个 VNode，极其浪费。

:::code-group

```typescript [transformText.ts]
import { isText } from './utils'
export const transformText: NodeTransform = (node, context) => {
  // 注意：文本合并必须在 Exit 阶段执行！
  // 因为要等子节点的 v-if 等结构被处理完毕后，剩下的纯文本才会露出来。
  return () => {
    const children = node.children
    let currentContainer = undefined // 容器

    // 遍历当前节点的所有子节点
    for (let i = 0; i < children.length; i++) {
      const child = children[i]

      if (isText(child)) {
        // 如果遇到一个文本/插值节点，向后看一眼
        for (let j = i + 1; j < children.length; j++) {
          const next = children[j]
          if (isText(next)) {
            // 发现相邻的也是文本！启动合并！
            if (!currentContainer) {
              // 创建复合表达式节点 (NodeTypes.COMPOUND_EXPRESSION = 8)
              currentContainer = children[i] = {
                type: NodeTypes.COMPOUND_EXPRESSION,
                children: [child],
              }
            }
            // 把后面的文本塞进复合节点，用 " + " 号连接
            currentContainer.children.push(` + `, next)
            // 把后面的节点从原树上删掉
            children.splice(j, 1)
            j--
          } else {
            // 遇到非文本节点，中断合并
            currentContainer = undefined
            break
          }
        }
      }
    }
  }
}
```

```typescript [utils.ts]
// 检查给定的 AST 节点是否属于文本类型的节点
export function isText(
  node: TemplateChildNode,
): node is TextNode | InterpolationNode | CompoundExpressionNode {
  return (
    node.type === NodeTypes.INTERPOLATION || // 5: 插值节点
    node.type === NodeTypes.TEXT || // 2: 纯文本节点
    node.type === NodeTypes.COMPOUND_EXPRESSION // 8: 复合表达式节点
  )
}
```

:::

**工作成果**：将多个离散的文本碎片组合成 `"Hello " + _toDisplayString(_ctx.name) + " !"` 这样的单一复合表达式。

## 5. 指令编译实现

### 5.1 `transformIf`：条件分支的重组者

**职责**：处理 `v-if`、`v-else-if` 和 `v-else` 编译为**三元表达式**，并为每个分支创建独立的 Block：

**痛点**：在基础 AST 中，`<div v-if="ok">` 和 `<div v-else>` 是两个平级的兄弟节点。如果不把它们合并，在生成 JS 三元表达式时就会无从下手。

:::code-group

```typescript [vIf.ts]
import { NodeTypes } from '../ast'

//转换插件入口
export const transformIf = (node, context) => {
  // 1. 只处理元素节点
  if (node.type !== NodeTypes.ELEMENT) return

  // 2. 寻找节点身上是否有 v-if / v-else-if / v-else 指令
  const dir = findDir(node, /^(if|else|else-if)$/)
  if (!dir) return

  // 3. 进入核心处理逻辑，并返回 Exit (退出阶段) 的回调函数
  return processIf(node, dir, context)
}

//核心逻辑：结构重组
function processIf(node, dir, context) {
  // 🥇 场景 A：遇到 v-if (开疆拓土)
  if (dir.name === 'if') {
    // 1. 把当前的元素节点包装成一个 "分支 (branch)"
    const branch = createIfBranch(node, dir)

    // 2. 创建一个全新的 IF 容器节点 (NodeTypes.IF = 9)
    const ifNode = {
      type: NodeTypes.IF,
      branches: [branch], // 把刚才的分支塞进去，作为第一顺位
    }

    // 3. 结构突变：把原 AST 树上的当前元素，直接替换成这个庞大的 IF 容器！
    context.replaceNode(ifNode)

    // 4. 返回 Exit 回调：等待内部所有分支处理完毕后，生成最终的三元表达式代码
    return () => {
      // 这里的逻辑会生成类似： condition ? vnode1 : vnode2
      ifNode.codegenNode = createCodegenNodeForBranch(
        ifNode.branches,
        0,
        context,
      )
    }
  }

  // 场景 B：遇到 v-else-if 或 v-else (投靠大哥)
  else {
    // 1. 既然我是 else，那我前面一定有一个 v-if。我去 context 里找我的兄弟们！
    const siblings = context.parent.children

    // 2. 找到紧挨着我的前一个节点 (真实源码这里会跳过前方的空白文本和注释)
    let i = siblings.indexOf(node)
    const sibling = siblings[i - 1]

    // 3. 校验大哥身份：前一个节点必须是我们刚刚创建的那个 IF 容器！
    if (sibling && sibling.type === NodeTypes.IF) {
      // 4. 认祖归宗：把我自己也包装成一个分支，塞进大哥的 branches 数组里
      sibling.branches.push(createIfBranch(node, dir))

      // 5. 结构突变：既然我已经存进了大哥的肚子里，那这棵 AST 树上就不需要我了。自杀！
      context.removeNode()
    } else {
      // 如果前面没有 v-if，直接报错：v-else 缺少对应的 v-if！
      context.onError(createCompilerError('v-else 缺少相邻的 v-if'))
    }
    // else 节点不需要在 Exit 阶段做什么，所有的代码生成都由大哥 (v-if) 负责
    return () => {}
  }
}

// 模拟创建分支对象的辅助函数
function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    condition: dir.exp, // 条件表达式 (比如 "ok")，v-else 的 condition 为 undefined
    children: [node], // 原始节点
  }
}
```

:::

**工作成果**：将散落的 DOM 节点聚合成一个带有 `branches` 的逻辑块，并在 Exit 阶段将其转化为 JavaScript 的 `ok ? _createVNode(...) : _createCommentVNode(...)` 三元表达式结构。

### 5.2 `transformFor`：循环列表的展开者

**职责**：`transformFor` 将 `v-for` 编译为 `renderList` 函数调用：

**核心动作**：将普通的元素转化为生成数组的映射函数。

:::code-group

```typescript [transforms/vFor.ts]
export const transformFor: NodeTransform = (node, context) => {
  if (node.type !== NodeTypes.ELEMENT) return

  const dir = findDir(node, 'for')
  if (!dir) return

  // 1. 解析 v-for="item in list" 里面的变量 (item, list)
  const parseResult = parseForExpression(dir.exp)
  const { source, valueAlias, keyAlias } = parseResult

  // 2. 创建一个全新的 FOR 节点 (NodeTypes.FOR = 11)
  const forNode = {
    type: NodeTypes.FOR,
    source, // list
    valueAlias, // item
    keyAlias, // index
    children: [node], // 把原节点包裹在内部
  }

  // 3. 替换原节点
  context.replaceNode(forNode)

  // 4. Exit 阶段收尾
  return () => {
    // 构造最终的代码生成节点：调用 renderList 函数
    forNode.codegenNode = createCallExpression(context.helper(RENDER_LIST), [
      source,
      createFunctionExpression(
        // 生成形如 (item, index) => createVNode(...) 的回调函数
        createForLoopParams(parseResult),
        // ...
      ),
    ])
  }
}
```

:::

**工作成果**：为最终的 `renderList(list, (item) => {...})` 函数调用准备好所有参数。

### 5.3 `transformOn`：事件缓存

`transformOn` 负责编译 `v-on` 或 `@` 事件绑定，默认启用**事件处理函数缓存**：

:::code-group

```typescript [transforms/vOn.ts]
export const transformOn: DirectiveTransform = (dir, node, context) => {
  // dir 就是当前遍历到的指令节点，包含指令名(name)、参数(arg)和表达式(exp)
  const { arg, exp, modifiers } = dir

  // 🏷️ 1. 处理事件名称 (Event Name)
  let eventName: ExpressionNode
  if (arg.type === NodeTypes.SIMPLE_EXPRESSION) {
    if (arg.isStatic) {
      // 静态事件名：比如 @click="..."
      // 核心操作：将 'click' 首字母大写并加上 'on' 前缀 -> 'onClick'
      const eventString = arg.content
      eventName = createSimpleExpression(toHandlerKey(eventString), true)
    } else {
      // 动态事件名：比如 @[eventName]="..."
      // 构造形如 `toHandlerKey(eventName)` 的运行时调用
      eventName = createCompoundExpression([
        `${context.helperString(TO_HANDLER_KEY)}(`,
        arg,
        `)`,
      ])
    }
  }

  // 📦 2. 处理事件回调函数 (Event Handler)
  let expNode = exp // 比如 "count++" 或者 "handleClick"

  // 2.1 检查是否是简单的成员引用 (Member Expression)
  // 比如 @click="foo" 或 @click="foo.bar" 都是标准的函数引用
  const isMemberExp = isMemberExpression(expNode.content)

  // 2.2 检查是否是内联语句 (Inline Statement)
  // 比如 @click="count++" 或 @click="foo($event)"
  const isInlineStatement = !(isMemberExp || isFnPointer)

  // 2.3 封装函数表达式
  if (isInlineStatement) {
    // 如果是内联语句，编译器会主动给它包一层形如 `$event => { ... }` 的匿名函数
    expNode = createCompoundExpression([`$event => {`, expNode, `}`])
  }

  // 🚀 3. 性能优化：事件监听缓存 (Cache Handlers)
  let ret = {
    props: [createObjectProperty(eventName, expNode)], // 默认结果：{ onClick: handler }
  }

  // 触发缓存的条件：
  // 1. 开启了前缀标识符 (构建工具环境下)
  // 2. 没有开启 SSR (SSR 不需要交互缓存)
  // 3. 开发者开启了 cacheHandlers 优化选项
  // 4. 不能是动态事件名 (动态事件名无法安全缓存)
  if (
    context.prefixIdentifiers &&
    !context.ssr &&
    context.options.cacheHandlers &&
    !hasDynamicKey
  ) {
    if (isMemberExp) {
      // 如果本来就是函数引用 (如 @click="foo")
      // 即使是静态引用，如果在组件更新时 foo 的引用变了怎么办？
      // Vue 的做法非常绝：缓存一个返回执行 foo 的闭包！
      // 缓存结构：_cache[1] || (_cache[1] = (...args) => (_ctx.foo && _ctx.foo(...args)))
      expNode = createCacheExpression(context, expNode)
    } else {
      // 如果是内联语句 (如 @click="count++")，直接缓存之前包裹好的 `$event => { ... }`
      // 缓存结构：_cache[2] || (_cache[2] = $event => { _ctx.count++ })
      expNode = createCacheExpression(context, expNode)
    }

    // 更新返回值
    ret.props[0].value = expNode
  }

  return ret
}
```

:::

## 6. 核心函数解析

### 6.1 `createBlock`: 创建 Block 节点

Block Tree 将模板基于结构指令（`v-if`、`v-for`、`<slot>`）切分为多个 Block，每个 Block 内部扁平收集所有动态后代节点：

:::code-group

```typescript [vnode.ts]
// 🌐 全局状态变量：追踪当前正在活动的 Block
// 这是一个栈，用于处理多层级 Block 嵌套 (比如 v-if 里面还有 v-for)
const blockStack = []
// 指向当前正在收集动态节点的那个 Block 数组
let currentBlock = null

//1. 开启一个 Block (通常在 createBlock 之前调用)
export function openBlock() {
  blockStack.push((currentBlock = []))
}

//2. 关闭并退出当前 Block
export function closeBlock() {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}

//3. 核心大招：创建 Block 节点
export function createBlock(
  type, // 标签名
  props, // 属性
  children, // 子节点
  patchFlag, // 靶向标记
  dynamicProps, // 动态属性名
) {
  // 步骤 A：先创建一个普通的 VNode
  // 在底层，createBlock 其实就是对 createVNode 的一层包装
  const vnode = createVNode(type, props, children, patchFlag, dynamicProps)

  // 步骤 B：收网！将收集到的动态节点挂载到自己身上
  // 这也是 openBlock 和 createBlock 必须连用的原因。
  // 在 createVNode 执行时，它深层的动态子节点早就被收集进 currentBlock 数组里了！
  vnode.dynamicChildren = currentBlock || []

  // 步骤 C：善后处理，关闭当前 Block 栈
  closeBlock()

  // 步骤 D：如果自己也是别人家的孩子 (Block 嵌套)
  // 如果当前不仅是一个 Block，而且还身处于外层更庞大的 Block 中
  // 那么把这个新的 Block 节点也作为一个“动态子节点”丢给外层 Block 去追踪！
  if (currentBlock) {
    currentBlock.push(vnode)
  }
  // 返回最终带有 dynamicChildren 的终极 VNode
  return vnode
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

### 6.2 `createVNodeCall`: 打包封装机制

:::code-group

```typescript [ast.ts]
//1. 按需注册运行时辅助函数；2. 返回一个标准化的 JSON 对象。
//创建一个用于生成 createVNode/createBlock 代码的 AST 节点
import {
  CREATE_ELEMENT_VNODE,
  CREATE_BLOCK,
  CREATE_VNODE,
  OPEN_BLOCK,
  WITH_DIRECTIVES,
} from './runtimeHelpers'
export function createVNodeCall(
  context, // 转换上下文 (用于注册全局 Helper)
  tag, // 标签名
  props, // 属性
  children, // 子节点
  patchFlag, // 靶向标记
  dynamicProps, // 动态属性
  directives, // 自定义指令
  isBlock = false, // 默认不是 Block
  isComponent = false, // 默认不是组件
) {
  // 💉 第一步：智能按需注入运行时辅助函数 (Tree-Shaking 基石)
  if (context) {
    if (isBlock) {
      // 如果这是一个 Block 节点 (如根节点、v-if 分支)
      // 向顶部作用域注册 _openBlock 和 _createBlock 辅助函数
      context.helper(OPEN_BLOCK)
      context.helper(isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK)
    } else {
      // 如果只是普通的虚拟节点
      // 向顶部作用域注册 _createVNode 辅助函数
      context.helper(isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE)
    }

    // 如果节点上挂载了 v-show 等自定义指令，按需注册 _withDirectives 函数
    if (directives) {
      context.helper(WITH_DIRECTIVES)
    }
  }

  // 第二步：返回标准化的 JSON 对象
  return {
    type: 13, // NodeTypes.VNODE_CALL
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    isComponent,
  }
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

## 7. 完整流程示例

### 7.1 基础代码示例

**输入模板**:

```js
<div class="box" v-if="ok">Hello {{ name }} <!-- 注释 --></div>
```

**生成的AST**:

```json
{
  "type": 1, // NodeTypes.ELEMENT (元素节点)
  "tag": "div",
  "props": [
    {
      "type": 6, // NodeTypes.ATTRIBUTE (普通静态属性)
      "name": "class",
      "value": {
        "type": 2, // NodeTypes.TEXT
        "content": "box"
      }
    },
    {
      "type": 7, // NodeTypes.DIRECTIVE (Vue 特有指令)
      "name": "if", // 指令名 (抹去了 v- 前缀)
      "exp": {
        "type": 4, // NodeTypes.SIMPLE_EXPRESSION (简单的 JS 表达式)
        "content": "ok", // 指令绑定的具体值
        "isStatic": false // 这是一个响应式变量，并非静态字符串
      },
      "modifiers": []
    }
  ],
  "children": [
    {
      "type": 2, // NodeTypes.TEXT (纯文本)
      "content": "Hello "
    },
    {
      "type": 5, // NodeTypes.INTERPOLATION (插值表达式)
      "content": {
        "type": 4, // NodeTypes.SIMPLE_EXPRESSION
        "content": "name",
        "isStatic": false
      }
    },
    {
      "type": 2, // NodeTypes.TEXT (空格文本)
      "content": " "
    },
    {
      "type": 3, // NodeTypes.COMMENT (注释节点)
      "content": " 注释 "
    }
  ]
}
```

**经过 transform 阶段后的 JavaScript AST**:

```json
{
  "type": 9, // NodeTypes.IF (全新的条件控制流节点)
  "branches": [
    {
      "type": 10, // NodeTypes.IF_BRANCH (IF 逻辑分支)
      "condition": {
        "type": 4,
        "content": "_ctx.ok", // transformExpression 注入了作用域前缀
        "isStatic": false
      },
      "children": [
        /* 原始的 div 节点被转移到了这里 */
      ]
    }
  ],
  // 🔥 终极生成的 JavaScript 逻辑指令节点
  "codegenNode": {
    "type": 19, // NodeTypes.JS_CONDITIONAL_EXPRESSION (JavaScript 三元运算符指令)
    "test": {
      "type": 4, // 对应三元运算符的条件部分: _ctx.ok ? ... : ...
      "content": "_ctx.ok",
      "isStatic": false
    },
    "consequent": {
      // 对应三元运算符的为真 (true) 分支
      "type": 13, // NodeTypes.VNODE_CALL (创建 VNode 的调用指令)
      "tag": "\"div\"",
      "props": {
        "type": 4,
        "content": "{ class: \"box\" }",
        "isStatic": true // 静态属性对象，后续可被 hoistStatic 静态提升
      },
      "children": [
        // 📦 复合表达式节点 (transformText 插件合并相邻文本/插值生成)
        {
          "type": 8, // NodeTypes.COMPOUND_EXPRESSION
          "children": [
            "Hello ",
            " + ",
            {
              "type": 14, // NodeTypes.JS_CALL_EXPRESSION
              "callee": "_toDisplayString", // 运行时格式化辅助函数
              "arguments": [
                {
                  "type": 4,
                  "content": "_ctx.name", // 变量注入前缀
                  "isStatic": false
                }
              ]
            },
            " + ",
            " "
          ]
        },
        // 📦 注释节点调用指令
        {
          "type": 13, // NodeTypes.VNODE_CALL
          "callee": "_createCommentVNode",
          "arguments": [{ "type": 2, "content": " 注释 " }]
        }
      ],
      "patchFlag": "1 /* TEXT */", // 靶向标记：仅文本动态更新
      "isBlock": true // 🚨 关键突变：v-if 的分支必须升级为 Block (区块) 以收集内部动态节点！
    },
    "alternate": {
      // 对应三元运算符的为假 (false) 分支
      "type": 13, // NodeTypes.VNODE_CALL
      "callee": "_createCommentVNode", // 默认生成一个空注释节点作为占位符
      "arguments": [
        "\"v-if\"",
        "true" // true 标记这是一个 v-if 的备用占位符
      ]
    }
  }
}
```

### 7.2 完整流程图

![Logo](/transformResource.png)

## 8. 总结

Vue 3 编译器的 transform 阶段通过 **插件化深度优先遍历**，将模板 AST 转换为经过深度优化的 JavaScript AST。其核心贡献包括：

- **插件系统**：职责分离，灵活扩展，平台无关的核心与平台专属插件协同工作。每个插件通过 `enter` 和 `exit` 钩子在恰当的时机介入处理。
- **指令编译**：将 Vue 模板指令（`v-if`、`v-for`、`v-on`、`v-model` 等）转化为简洁的 JavaScript 表达式与属性绑定。
- **静态提升（hoistStatic）**：将纯静态节点提取为模块级常量，仅在初始化时创建一次 VNode，后续渲染直接复用，显著减少运行时开销。
- **PatchFlag 标记**：精准标记动态内容的类型（文本、class、style、props 等），运行时 diff 可根据标记靶向更新，跳过所有静态属性。
- **Block Tree**：以结构指令为边界划分 Block，扁平收集动态节点，使 diff 过程绕过静态子树，仅处理 `dynamicChildren` 数组中的动态节点，实现 diff 性能与模板大小的“解耦”。
