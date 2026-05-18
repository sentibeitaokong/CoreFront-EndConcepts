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

## 2. 编译流程三步曲

整个编译过程在 `compiler-core` 的 `baseCompile` 函数中串联起来，其内部大致逻辑如下：

![Logo](/compilerInfo.png)

:::code-group

```typescript [parse.ts]
//编译核心函数
export function baseCompile(
  template: string,
  options: CompilerOptions = {},
): CodegenResult {
  // 1. 解析阶段 (Parse)
  // 将模板字符串解析为 基础 AST (RootNode)
  const ast = isString(template) ? baseParse(template, options) : template

  // 3. 生成阶段 (Generate)
  // 将转换后的带有 JS 语义的 AST，生成最终的 JS 代码字符串
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

### 2.1 解析（Parse）：从字符串到模板 AST

编译器的解析阶段，本质上是一个**手动编写的递归下降解析器**，以**有限状态机**为核心驱动，通过逐个字符扫描模板，将其切分为有意义的 **Token**，并递归构建出一棵描述模板结构的**抽象语法树（AST）**的过程。从理论上看，它可以分为**词法分析**和**语法分析**两个子阶段：

- **词法分析（Lexical Analysis）**：把字符流分割成有意义的 Token（标记）序列。
- **语法分析（Syntax Analysis）**：根据语法规则，将 Token 序列组装成树形结构的 AST。

#### 1. 为什么要将字符流变成 Token 流？

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

#### 2. 什么是有限状态机？

有限状态机（`Finite State Machine, FSM`）是具有有限个状态的数学模型，它在某个状态下，根据输入（字符）决定转移到哪个新状态。在编译器的词法分析中，状态机非常有用：每一个状态对应一种“当前我们正在处理什么”的上下文。

#### 3. 构造AST

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
  "type": "ROOT",
  "children": [
    {
      "type": "ELEMENT",
      "tag": "div",
      "props": [
        {
          "type": "ATTRIBUTE",
          "name": "class",
          "value": { "content": "box" }
        }
      ],
      "children": [
        { "type": "TEXT", "content": "Hello " },
        {
          "type": "INTERPOLATION",
          "content": {
            "type": "SIMPLE_EXPRESSION",
            "content": "name"
          }
        },
        { "type": "TEXT", "content": " " },
        { "type": "COMMENT", "content": " 注释 " }
      ]
    }
  ]
}
```

#### 4. 完整流程示例

![Logo](/templateToAst.png)

### 2.2 转换（Transform）：语义分析与优化

`transform` 是编译器的核心优化阶段，它的职责是**对模板 AST 进行语义分析，并转化成 JavaScript AST**。它采用**深度优先遍历 + 插件体系**的架构，提供了进入和退出节点的两个钩子：

- **`enter` 钩子**：在遍历进入节点时调用，适合初始化操作。
- **`exit` 钩子**：在遍历完子节点、即将退出当前节点时调用，适合收集子节点信息并做最终修改。

在 `transform` 阶段，所有内置转换（如 `v-if`、`v-for`、`v-on`、`v-model` 等指令编译）以及平台特定优化插件，都是通过这一套 **转换插件** 机制注入的。典型插件包括：

- `transformElement`：处理元素节点，生成 `createVNode` 调用的参数。
- `transformExpression`：将模板中的 JavaScript 表达式转换为合法的 AST 节点。
- `vIf` / `vFor` / `vSlot`：结构性指令的处理逻辑。
- `compileDOM` 中的 `transformStyle`、`transformTransition` 等。

经过 `transform` 后，原来的模板 AST 会被替换为一棵全新的 **JavaScript AST**，其节点类型对应 JavaScript 代码结构（函数调用、对象字面量、表达式等）。

### 2.3 代码生成（Codegen）：从 JavaScript AST 到渲染函数

`generate` 阶段负责遍历上一步生成的 JavaScript AST，拼接出最终的渲染函数代码字符串。它会生成 Vue 3 运行时所需要的各种辅助函数调用，例如：

- `openBlock` / `createElementBlock`：开启一个新的 Block，并创建元素 VNode。
- `createVNode`：创建一个普通 VNode。
- `toDisplayString`：将动态值转换为字符串。
- `renderList`：渲染 `v-for` 列表。
- `Fragment`、`Text`、`Comment` 等类型的对应创建函数。

此外，代码生成阶段还会写入**编译优化标记**（PatchFlag）和 Block 的动态节点收集信息，这是下一步要讲的核心优化。

## 3. 编译时核心优化技术

Vue 3 编译器的“灵魂”在于它会在编译阶段对模板做大量的静态分析，并将这些分析结果“告诉”运行时，让运行时的 diff 和更新操作可以尽可能地偷懒。

### 3.1 静态节点提升（Static Hoisting）

如果一个节点及其子树完全不依赖任何响应式数据（即纯静态），编译器会把它从渲染函数内部提升到模块作用域，使之成为全局常量。

```html
<!-- 模板 -->
<div>
  <span class="logo">My App</span>
  <p>{{ message }}</p>
</div>
```

编译后生成的代码结构（示意）：

```javascript
// 静态节点被提升为常量，只创建一次
const _hoisted_1 = /*#__PURE__*/ _createStaticVNode(
  '<span class="logo">My App</span>',
)

function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createElementBlock('div', null, [
      _hoisted_1,
      _createTextVNode(_toDisplayString(_ctx.message), 1 /* TEXT */),
    ])
  )
}
```

这样无论组件重渲染多少次，`<span class="logo">My App</span>` 的 VNode 都只会被创建一次，后续 diff 直接复用同一个引用。

### 3.2 动态节点标记（PatchFlag）

对于动态节点，编译器会分析出**它到底在哪些方面是动态的**，并用一个位掩码（bitmask）来标记。运行时渲染器看到这个标记，就知道只需要对比该节点对应的部分，其余部分可以完全跳过。

常见的 PatchFlag：

| PatchFlag 常量        | 含义                                   | 触发示例                    |
| --------------------- | -------------------------------------- | --------------------------- |
| `TEXT` (1)            | 文本内容是动态的                       | `<p>{{ msg }}</p>`          |
| `CLASS` (2)           | class 属性是动态的                     | `<div :class="c">`          |
| `STYLE` (4)           | style 是动态的                         | `<div :style="s">`          |
| `PROPS` (8)           | 除 class / style 以外的 props 是动态的 | `<div :id="id">`            |
| `FULL_PROPS` (16)     | 存在动态 key（需要完整 diff props）    | `<div v-bind="obj">`        |
| `HYDRATE_EVENTS` (32) | 存在需要水合的事件                     | `<div @click="handler">`    |
| `NEED_PATCH` (64)     | 需要递归 patch 子节点                  | 动态子节点，如 v-for / slot |
| `DYNAMIC_SLOTS` (512) | 动态插槽                               | `<slot name="dynamicName">` |

例如模板 `<div :id="id" :class="c">{{ msg }}</div>` 对应的 PatchFlag 可能是 `1 | 2 | 8 = 11`，运行时 diff 看到这个标志，就会**只比对 id、class 和文本内容**，完全忽略 `<div>` 这个元素标签、静态属性、以及没有变化的子节点。

### 3.3 块级追踪（Block Tree）

PatchFlag 只能标记单个节点，但真实组件的模板结构远比单个节点复杂。为了让 diff 过程能**直接定位到所有动态节点**，而不需要递归遍历整个 VNode 树，Vue 3 引入了 **Block Tree** 的概念。

- 编译器会基于 `v-if`、`v-for` 等结构性指令把模板划分为若干个 **Block**。每个 Block 内部会记录一个动态节点数组（`dynamicChildren`），其中收集了所有带 PatchFlag 的后代节点。
- 在组件更新时，diff 算法不再是递归遍历旧的 VNode 树，而是直接操作当前 Block 的 `dynamicChildren`，**只对记录在案的那些动态节点执行 diff**。那些没有被记录的静态节点（或没有变化的动态分支），会被完全跳过。

```javascript
// Block 的结构（简化示意）
{
  type: Fragment,
  children: [ /* ... */ ],
  dynamicChildren: [
    // 只包含该 Block 内的所有动态后代节点
    { ... }, // 动态文本
    { ... }, // 动态属性
  ]
}
```

这种设计让 Vue 3 的 diff 性能**与模板大小“解耦”**：一个庞大而多数为静态的组件，在更新时 diff 的成本只取决于它内部有几个真正动态的节点，而几乎与整体模板的大小无关。

## 4. 指令编译与转换钩子概览

`transform` 阶段的插件体系是编译器的扩展核心。编译器内置了许多转换插件来编译指令，例如：

- **`v-if` / `v-else` / `v-else-if`**：会被编译为三元表达式（`condition ? node : otherNode`），并据此划分 Block 边界。
- **`v-for`**：会被编译为 `renderList` 调用，并以 `v-for` 的每一次循环作为一个子 Block，提升列表 diff 性能。
- **`v-on`**：事件绑定被编译为 `onClick` 等 props，PatchFlag 中会带有 `HYDRATE_EVENTS` 标记。
- **`v-model`**：根据平台和目标元素类型，展开为对应的属性和事件绑定（如 `:value` + `@input`）。

用户自定义的编译器插件也可以通过 `nodeTransforms` 和 `directiveTransforms` 参数注入，完全复用 Vue 编译器的能力。

## 5. 总结：编译时“负重前行”，让运行时“轻装上阵”

Vue 3 的编译器并不仅仅是一个模板到渲染函数的“翻译官”，它更像一个**编译时优化器**。它遵循的核心设计哲学是：**把能提前做的工作都在编译阶段完成，尽可能减小运行时的负担**。

- **静态提升** 避免重复创建静态 VNode。
- **PatchFlag** 让运行时 diff 能“靶向更新”，只检查真正变化的部分。
- **Block Tree** 让 diff 过程绕过整个 VNode 树的递归，直接找到所有动态节点。
- **平台无关的插件体系** 让编译器可以无缝扩展至小程序、SSR 等多种渲染目标。

正是这种“动静分离”的编译策略，让 Vue 3 在保持声明式开发体验的同时，拥有了可与手写优化代码相媲美的性能表现。
