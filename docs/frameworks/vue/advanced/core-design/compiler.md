# 模板编译器(Compiler)

Vue 的模板编译器负责将 `.vue` 文件中的 `<template>` 块转换为高效的 JavaScript 渲染函数（`render`）。它是 Vue 实现“编译时 + 运行时”混合架构的关键部分，通过静态分析和优化，大幅提升运行时性能。

## 1. 编译器概述

### 1.1 定位与作用

- **输入**：Vue 模板字符串（或 `.vue` 文件中的 `template` 内容）。
- **输出**：一个 `render` 函数（JavaScript 代码字符串或可执行函数）。
- **核心价值**：
  - 将声明式模板转换为命令式渲染逻辑。
  - 通过编译时优化（静态提升、`PatchFlags`、`Block` 树）减少运行时开销。
  - 提供开发时的错误提示和警告。

### 1.2 编译流程总览

模板字符串 → `Parse` → `AST` → `Transform` → 优化的 `AST`→ `Generate` → `render` 函数

Vue 3 的编译器设计为**平台无关的核心**（`@vue/compiler-core`） + **平台特定扩展**（`@vue/compiler-dom` 用于浏览器，`@vue/compiler-sfc` 用于单文件组件）。

## 2. 核心模块与源码结构

| 包名                 | 作用                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `@vue/compiler-core` | 平台无关的编译器核心：解析器、转换器、代码生成器的基础实现。          |
| `@vue/compiler-dom`  | DOM 平台的编译器插件，添加 DOM 特定的转换（如 `v-html`、`v-model`）。 |
| `@vue/compiler-sfc`  | 解析 `.vue` 单文件组件，提取 template、script、style，并调用编译器。  |
| `@vue/shared`        | 共享工具函数（如常量、类型判断）。                                    |

## 3. 阶段一：Parse（解析）

### 3.1 目标

将模板字符串转换为**抽象语法树（`AST`）**。`AST` 是一个树形结构的 `JavaScript` 对象，每个节点描述了模板的一部分（元素、属性、文本、插值等）。

**示例：**

模板：

```html
<div v-if="visible" class="container">{{ message }}</div>
```

AST语法树：

```json
{
  "type": "Root",
  "children": [
    {
      "type": "Element",
      "tag": "div",
      "props": [
        {
          "name": "v-if",
          "value": { "content": "visible" },
          "type": "Directive"
        },
        {
          "name": "class",
          "value": { "content": "container" },
          "type": "Attribute"
        }
      ],
      "children": [
        {
          "type": "Interpolation",
          "content": { "type": "SimpleExpression", "content": "message" }
        }
      ]
    }
  ]
}
```

### 3.2 解析器实现

解析器采用**有限状态机**，逐个字符扫描模板。核心函数位于 `compiler-core/src/parse.ts`：

```ts
export function parse(template: string, options: ParserOptions = {}): RootNode {
  const context = createParserContext(template, options)
  const children = parseChildren(context, TextModes.DATA, [])
  return createRoot(children)
}
```

- `parseChildren` 是主循环，根据当前模式（`TextModes.DATA`、`TextModes.RCDATA`、`TextModes.ATTRIBUTE_VALUE` 等）调用不同的解析函数。
- 遇到**标签符**时尝试解析元素标签（`parseElement`）或注释（`parseComment`）。
- 遇到**双括号**时解析插值（`parseInterpolation`）。
- 否则解析文本（`parseText`）。

### 3.3 AST 节点类型

Vue 的 `AST` 节点类型定义在 `compiler-core/src/ast.ts`，主要类型：

| 类型                 | 说明                                    | 示例             |
| -------------------- | --------------------------------------- | ---------------- |
| `RootNode`           | 根节点，包含 `children`                 | 整个模板         |
| `ElementNode`        | 元素节点，含 `tag`、`props`、`children` | `<div>`          |
| `TextNode`           | 纯文本节点                              | `hello`          |
| `InterpolationNode`  | 插值节点                                |                  |
| `AttributeNode`      | 静态属性节点                            | `class="box"`    |
| `DirectiveNode`      | 指令节点（`v-` 开头）                   | `v-if="visible"` |
| `CommentNode`        | 注释节点                                | `<!-- 注释 -->`  |
| `IfNode` / `ForNode` | 结构指令节点（`v-if` / `v-for`）        | 用于后续转换     |

### 3.4 位置追踪

每个节点都包含 `loc` 属性，记录源码中的起始、结束位置和行/列号，用于错误提示和 `source map`。

## 4. 阶段二：Transform（转换）

### 4.1 目标

遍历 AST，应用一系列**转换插件**，完成语义分析、优化和代码生成准备。

### 4.2 转换器架构

转换器位于 `compiler-core/src/transform.ts`，核心函数：

```typescript
export function transform(root: RootNode, options: TransformOptions) {
  const context = createTransformContext(root, options)
  traverseNode(root, context)
  // 后处理：创建根级别的 codegenNode 等
  createRootCodegen(root, context)
  root.helpers = [...context.helpers]
  root.components = [...context.components]
  root.directives = [...context.directives]
  // ...
}
```

- `traverseNode` 深度优先遍历 AST，对每个节点调用对应的转换函数。
- 转换函数通过 `context` 对象访问和修改 AST。

### 4.3 内置转换插件（`compiler-core` 基础插件）

| 插件名                | 作用                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `transformElement`    | 将元素节点转换为 `createVNode` 调用，处理 props 和 children。          |
| `transformExpression` | 处理插值表达式，包装为 `_toDisplayString`，并标记动态表达式。          |
| `transformIf`         | 将 `v-if` / `v-else-if` / `v-else` 转换为三元表达式结构。              |
| `transformFor`        | 将 `v-for` 转换为 `_l` 函数调用（渲染列表）。                          |
| `transformText`       | 合并相邻的文本节点和插值节点，减少 VNode 数量。                        |
| `transformOnce`       | 处理 `v-once` 指令，标记节点为静态。                                   |
| `transformModel`      | 处理 `v-model` 指令，生成对应的 props 和 events（在 DOM 插件中增强）。 |

### 4.4 优化技术（在转换中实现）

**静态提升（Hoist Static）**

- **原理**：遍历 AST，识别不依赖响应式数据的纯静态节点（元素、文本、属性）。将这些节点提升到渲染函数外部，只创建一次，多次渲染复用。
- **实现**：`hoistStatic` 函数在转换完成后执行，遍历节点，将符合条件的节点替换为 `createVNode` 调用，并存入 `context.hoists` 数组。

```vue
<!--模板-->
<template>
  <div>
    <h1>Welcome to Vue 3</h1>
    <!-- 静态节点 -->
    <p>{{ dynamicText }}</p>
    <!-- 动态节点 -->
  </div>
</template>
```

```js
// 编译后的渲染函数（简化）
import { createVNode, openBlock, createBlock, toDisplayString } from 'vue'

// 静态节点被提升到函数外部，只创建一次,后续直接复用
const _hoisted_1 = createVNode('h1', null, 'Welcome to Vue 3', -1 /* HOISTED */)

export function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock('div', null, [
      _hoisted_1, // 直接引用提升的节点
      createVNode('p', null, toDisplayString(_ctx.dynamicText), 1 /* TEXT */),
    ])
  )
}
```

**PatchFlags**

- **原理**：为每个动态节点标记更新类型（`TEXT`、`CLASS`、`STYLE`、`PROPS` 等）。运行时根据标志快速更新对应属性，无需深度比较。
- **实现**：在 `transformElement` 中分析元素的 props 和 children，如果检测到动态绑定，则计算并存储 `PatchFlags`。

```vue
<!--模板-->
<template>
  <div :class="dynamicClass" :style="dynamicStyle" @click="handler">
    {{ dynamicText }}
  </div>
</template>
```

```js
//编译后的渲染函数（简化）
import { createVNode, openBlock, createBlock, toDisplayString } from 'vue'

export function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock(
      'div',
      {
        class: _ctx.dynamicClass,
        style: _ctx.dynamicStyle,
        onClick:
          _cache[0] ||
          (_cache[0] = (...args) => _ctx.handler && _ctx.handler(...args)),
        //13 标志值   通过位运算&表示TEXT, CLASS, STYLE, PROPS都可能发生变化
      },
      toDisplayString(_ctx.dynamicText),
      13 /* TEXT, CLASS, STYLE, PROPS */,
      ['onClick'],
    )
  )
}
```

**Block 树与动态子节点收集**

- **原理**：识别模板中的结构性指令（`v-if`、`v-for`、`v-slot`）和根节点，将这些边界内的动态子节点收集到数组，生成 `openBlock` / `createBlock` 调用，`openBlock()` 会在内部维护一个动态节点数组,`createBlock()` 将当前块及其收集的动态子节点关联起来。
- **实现**：`transformElement` 在生成 `codegenNode` 时，如果节点是 Block 根或包含结构指令，则设置 `isBlock: true`，并将动态子节点收集到 `dynamicChildren` 数组。

```vue
<!--模板-->
<template>
  <div>
    <h1>Static Title</h1>
    <div v-if="show">
      <p>{{ dynamicContent }}</p>
    </div>
  </div>
</template>
```

```js
//编译后的渲染函数（简化）
import { createVNode, openBlock, createBlock, toDisplayString } from 'vue'

const _hoisted_1 = createVNode('h1', null, 'Static Title', -1)

export function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock('div', null, [
      _hoisted_1,
      _ctx.show
        ? (openBlock(),
          createBlock('div', { key: 0 }, [
            createVNode(
              'p',
              null,
              toDisplayString(_ctx.dynamicContent),
              1 /* TEXT */,
            ),
          ]))
        : createCommentVNode('v-if', true),
    ])
  )
}
```

**事件处理函数缓存**

- **原理**：将内联事件处理函数（如 `@click="() => handle(item)"`）存储到 `_cache` 对象中，避免每次渲染创建新函数。
- **实现**：`transformOn` 插件会生成 `_cache[index] || (_cache[index] = function)` 形式的代码。

```html
<!--模板：-->
<template>
  <button @click="count++">Increment</button>
  <ChildComponent @custom="() => handle(item)" />
</template>
```

```js
//编译后的渲染函数（简化）
import { createVNode, openBlock, createBlock } from 'vue'

export function render(_ctx, _cache) {
  return (
    openBlock(),
    createBlock('div', null, [
      createVNode(
        'button',
        {
          onClick: _cache[0] || (_cache[0] = $event => _ctx.count++),
        },
        'Increment',
      ),
      createVNode(
        _ctx.ChildComponent,
        {
          onCustom: _cache[1] || (_cache[1] = () => _ctx.handle(_ctx.item)),
        },
        null,
        8 /* PROPS */,
        ['onCustom'],
      ),
    ])
  )
}
```

## 5. 阶段三：Generate（代码生成）

### 5.1 目标

将优化后的 `AST` 转换为 `JavaScript` 代码字符串（即 `render` 函数）。

### 5.2 代码生成器实现

位于 `compiler-core/src/codegen.ts`，核心函数：

```typescript
export function generate(ast: RootNode, options: CodegenOptions = {}): CodegenResult {
  const context = createCodegenContext(ast, options)
  const { push, indent, deindent } = context

  // 生成前置导入（如果需要在模块中）
  genModulePreamble(ast, context)

  // 生成渲染函数
  push(`function render(_ctx, _cache) {`)
  indent()
  push(`with (_ctx) {`)
  indent()
  // 生成静态提升的节点
  if (ast.hoists.length) {
    push(`const ${getStaticHoistPrefix(ast)} = [`)
    // ... 逐个生成 hoisted 节点
    push(`]`)
  }
  // 生成返回的 VNode
  push(`return `)
  genNode(ast.codegenNode, context)
  deindent()
  push(`}`)
  deindent()
  push(`}`)

  return { code: context.code, ast, ... }
}
```

- `genNode` 根据节点类型递归调用不同的生成函数（`genElement`、`genInterpolation`、`genIf` 等）。
- 输出格式可以是 **函数表达式**（默认）或 **模块导入**（配合 `prefixIdentifiers` 选项用于 SSR 等）。

### 5.3 生成的代码示例

输入模板：

```html
<div id="app">
  <h1>{{ title }}</h1>
  <button @click="increment">{{ count }}</button>
</div>
```

生成的 `render` 函数（简化后）：

```javascript
import {
  createVNode as _createVNode,
  openBlock as _openBlock,
  createBlock as _createBlock,
  toDisplayString as _toDisplayString,
} from 'vue'

const _hoisted_1 = { id: 'app' }

export function render(_ctx, _cache) {
  return (
    _openBlock(),
    _createBlock('div', _hoisted_1, [
      _createVNode('h1', null, _toDisplayString(_ctx.title), 1 /* TEXT */),
      _createVNode(
        'button',
        {
          onClick: _cache[0] || (_cache[0] = $event => _ctx.increment()),
        },
        _toDisplayString(_ctx.count),
        1 /* TEXT */,
      ),
    ])
  )
}
```

## 6. 平台特定扩展

### 6.1 `@vue/compiler-dom`

- 基于 `compiler-core` 添加 DOM 特有的指令转换：`v-html`、`v-text`、`v-model`、`v-show` 等。
- 提供 `compile` 方法，内部调用 `baseCompile` 并传入 DOM 专属的转换选项。

### 6.2 `@vue/compiler-sfc`

- 用于解析 `.vue` 单文件组件，提取 `<template>`、`<script>`、`<style>` 块。
- 内部调用 `compiler-dom` 的 `compile` 方法编译模板。
- 同时处理 `<script setup>` 语法糖、CSS 变量注入等。

## 7. 编译器 API

### 7.1 直接使用编译器

```javascript
import { compile } from '@vue/compiler-dom'

const { code } = compile('<div>{{ msg }}</div>', {
  mode: 'module', // 或 'function'
  prefixIdentifiers: true, // 用于 SSR 和作用域分析
  hoistStatic: true, // 开启静态提升
  cacheHandlers: true, // 开启事件缓存
})
```

### 7.2 在 Vue 项目中

- 使用 `vue-loader`（Webpack）或 `@vitejs/plugin-vue`（Vite）时，编译在构建时完成。
- 也可以使用 Vue 的运行时版本 + 运行时编译器（`vue/dist/vue.esm-browser.js`），在浏览器中动态编译模板（不推荐生产环境）。

## 8. 编译时优化与运行时协作

| 优化技术       | 编译时生成                                               | 运行时使用                                       |
| -------------- | -------------------------------------------------------- | ------------------------------------------------ |
| **静态提升**   | 将静态 VNode 提升为常量，标记 `PatchFlags.HOISTED` (-1)  | 直接复用常量，不参与 diff。                      |
| **PatchFlags** | 为动态 VNode 生成标志位（如 `1 /* TEXT */`）             | `patchElement` 根据标志快速更新，跳过无用比较。  |
| **Block 树**   | 生成 `openBlock` / `createBlock`，收集 `dynamicChildren` | 更新时直接遍历 `dynamicChildren`，跳过静态子树。 |
| **缓存事件**   | 生成 `_cache[index] = fn` 代码                           | 组件多次渲染时复用相同函数引用。                 |

## 9. 开发工具与调试

- **`AST` 查看器**：Vue 官方提供了 [Template Explorer](https://template-explorer.vuejs.org/)，可实时查看模板编译后的 AST、渲染函数等。
- **`Source Map`**：编译器支持生成 source map，方便调试渲染函数（与原始模板对应）。
- **编译警告**：当模板存在潜在错误（如 `v-for` 缺少 `key`、属性拼写错误）时，编译器会发出警告。

## 10. 扩展编译器

Vue 3 编译器设计为可扩展的，开发者可以：

- 编写自定义转换插件（例如支持新的指令语法）。
- 自定义代码生成策略（例如输出不同格式）。
- 创建自定义平台渲染器（`createRenderer` 配合自定义 nodeOps），编译器也可以针对新平台生成对应的代码。

## 11. 总结

| 方面             | 说明                                                                |
| ---------------- | ------------------------------------------------------------------- |
| **核心流程**     | Parse → Transform → Generate                                        |
| **关键优化**     | 静态提升、PatchFlags、Block 树、缓存事件处理函数                    |
| **模块化**       | `compiler-core` 提供基础，`compiler-dom` 和 `compiler-sfc` 平台扩展 |
| **与运行时关系** | 编译生成的 `render` 函数配合渲染器 + 响应式系统，实现高效更新       |
| **使用方式**     | 构建时预编译（推荐）或运行时动态编译                                |
