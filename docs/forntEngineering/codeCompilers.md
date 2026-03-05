---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 代码编译器 (Code Compilers: Babel, SWC, tsc)

## 1. 核心概念与特性

在前端工程化中，**代码编译器（Compiler / Transpiler）** 扮演着“高级翻译官”的角色。由于前端标准（ECMAScript 规范）的迭代速度永远快于浏览器厂商的实现速度，加上 TypeScript、JSX 等非标准语法的普及，我们必须依靠编译器将开发者编写的“现代高阶代码”转换为浏览器能够安全执行的“向下兼容代码”。

| 编译器 | 核心架构与语言 | 核心特性与行业地位 |
| :--- | :--- | :--- |
| **Babel** | JavaScript 编写 | **前端编译界的泰斗。** 拥有极其庞大、细致的插件生态（Plugin）。能够实现最深度的 AST（抽象语法树）定制操作。缺点是受限于 JS 单线程，编译极其缓慢。 |
| **SWC** | Rust 编写 | **极速编译的新世代王者。** 全称 Speedy Web Compiler。利用 Rust 的多线程和底层性能，编译速度比 Babel 快 20 倍以上。目前已被 Next.js、Parcel 选为默认引擎。 |
| **tsc** | TypeScript 编写 | **官方标准类型检查器。** 它的核心价值是强大的**静态类型系统分析**。虽然它也能编译降级 JS 代码，但在现代工程中，它的“编译”工作正逐渐被剥离给 SWC/esbuild。 |

## 2. 核心工作原理与机制

无论使用哪种编译器，它们将高阶代码转换为低阶代码的底层机制都是相通的。这通常包含三个绝对核心的步骤：

### 2.1 编译的三步曲：Parse -> Transform -> Generate

1.  **Parse (解析阶段)**：
    *   **词法分析 (Lexical Analysis)**：将源代码字符串拆解成一个个基础的词法单元（Tokens）。例如把 `let x = 1` 拆成 `let`, `x`, `=`, `1`。
    *   **语法分析 (Syntactic Analysis)**：将 Tokens 根据语言的语法规则，组装成一棵极其重要的数据结构 —— **AST (抽象语法树, Abstract Syntax Tree)**。
2.  **Transform (转换阶段)**：
    *   这是编译器的核心！编译器遍历这棵 AST，插件（Plugins）会在这个阶段介入。例如，遇到“箭头函数”的 AST 节点，插件会将其替换为“普通 function”的 AST 节点。
3.  **Generate (生成阶段)**：
    *   将深度修改后的新 AST，重新转换（打印）回标准的字符串代码，同时生成用于调试的 Source Map 文件。

### 2.2 编译与 Polyfill (垫片) 的本质区别

这是高级面试必考点。编译器处理新特性时分为两个维度：
*   **语法层 (Syntax)**：比如箭头函数 `() => {}`、可选链 `?.`、`let/const`。Babel/SWC 可以通过 AST 将其改写为 `function` 和 `var`。这叫**编译转换**。
*   **API 层 (Built-ins)**：比如 `Promise`、`Array.prototype.includes`、`Map`。旧浏览器里根本没有这些对象，AST 怎么改写都没用。这就需要引入 **Polyfill (垫片)**，通过向全局环境注入自定义代码来模拟这些原生 API。（Babel 中通常依赖 `core-js` 来实现）。

## 3. 实战配置与工程化应用

### 3.1 Babel 的标准配置 (`.babelrc` 或 `babel.config.js`)

Babel 的核心设计是“微内核”，它自己什么都不干，所有功能全靠 Presets（预设，即插件的集合）和 Plugins（插件）实现。

```js
// babel.config.js
module.exports = {
  // Presets 是插件的合集，按从后向前的顺序执行
  presets: [
    [
      '@babel/preset-env', // 智能处理 ES6+ 语法降级
      {
        targets: "> 0.25%, not dead", // 根据目标浏览器动态决定需要降级哪些语法
        useBuiltIns: "usage",         // 极其重要：按需按实际使用情况引入 Polyfill
        corejs: 3                     // 指定 core-js 版本
      }
    ],
    '@babel/preset-react',      // 解析 JSX 语法
    '@babel/preset-typescript'  // 仅仅剥离 TS 类型注解，不做类型检查！
  ],
  // Plugins 是具体的小功能，按从前向后的顺序执行
  plugins: [
    ['@babel/plugin-transform-runtime'] // 提取公共的 Babel 辅助函数，缩减打包体积
  ]
};
```

### 3.2 SWC 的极速替代配置 (`.swcrc`)

如果想在项目中用 SWC 替换掉缓慢的 Babel，配置逻辑高度相似，但由于底层是 Rust，执行速度有质的飞跃。

```json
// .swcrc
{
  "jsc": {
    "parser": {
      "syntax": "typescript", // 开启 TS 解析支持
      "tsx": true             // 支持 React JSX
    },
    "transform": {
      "react": {
        "runtime": "automatic" // 自动导入 React 运行时
      }
    },
    "target": "es2015", // 语法降级目标
    "loose": false
  },
  "env": {
    "targets": "> 0.25%, not dead", // 类似 preset-env 的智能降级
    "mode": "usage",                // 类似 useBuiltIns，按需按目标注入 polyfill
    "coreJs": "3"
  },
  "minify": true // SWC 也附带了极其强悍的压缩功能，可替代 Terser
}
```

### 3.3 tsc 在现代工程中的职能剥离

过去，`tsc` 既负责“检查类型”，又负责“输出编译后的 JS”。
但在现代工程化（如 Vite 体系）中，这被认为是低效的。现代标准做法是：**编译降级交给 esbuild 或 SWC（极快），类型检查交给 tsc（精准）。**

```json
// tsconfig.json 现代推荐配置
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    // 强制单文件编译模式，配合 SWC/Babel 使用时必须开启！
    "isolatedModules": true, 
    // tsc 只做静态检查，禁止它输出任何 JS 文件！把输出工作交给打包工具。
    "noEmit": true,
    "strict": true
  }
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然 Vite(esbuild) 和 SWC 这么快，为什么还要在构建流程中执行 `tsc --noEmit`？
*   **答**：
    *   `esbuild`、`SWC` 和 `@babel/preset-typescript` 在处理 TypeScript 时，采取的是**“暴力擦除”策略 (Type Erasure)**。它们只负责把代码里的 `: string`, `interface` 等类型代码当成注释一样物理删除，然后直接编译成 JS。**它们绝对不会去检查你的类型写得对不对。**
    *   如果你写了 `const a: number = 'hello'`，SWC 会光速编译通过，并在运行时导致 Bug。
    *   因此，必须在 CI/CD 或打包前，通过运行 `tsc --noEmit` 来专门执行严谨的**静态类型检查**，这是保证代码质量的最后防线。

### 4.2 什么是 `isolatedModules: true`？为什么用 Babel/SWC 编译 TS 时必须开启它？
*   **答**：
    *   **原理机制**：官方的 `tsc` 是具备“全工程感知”能力的，它知道整个项目所有文件之间的类型关系。但 Babel 和 SWC 是**单文件编译器 (Single-file compilation)**，它们一次只能瞎子摸象般地处理一个文件，不认识其他文件。
    *   **触发问题**：如果你写了 `export { MyInterface } from './types'`。Babel 在编译当前文件时，根本不知道 `MyInterface` 到底是一个可以执行的变量（需要保留），还是一个类型（需要擦除）。
    *   **解决方案**：开启 `isolatedModules: true` 后，TS 会强迫开发者在导出类型时显式使用 `export type { MyInterface }`。这样 Babel/SWC 一看到 `type` 关键字，就能安全地将其擦除了。

### 4.3 `core-js` 是什么？如果在 Babel 中不配置它会怎样？
*   **答**：
    *   `core-js` 是 JavaScript 标准库的 Polyfill（垫片）的终极合集，它包含了诸如 `Promise`, `Set`, `Array.from` 等所有现代 API 的底层实现。
    *   如果在 Babel 中只配置了语法转换，不配置 Polyfill，那么你的箭头函数会被转成普通的 `function`，但如果你代码里用到了 `new Promise()`，在老旧的 IE 浏览器或低版本微信内置浏览器中，会直接报 `Promise is not defined` 致命错误导致页面白屏。

### 4.4 很多巨型老项目想提速，可以直接把 Babel 一键替换成 SWC 吗？
*   **答**：**极高风险，通常不能一键替换。**
    *   Babel 发展了 10 年，很多老企业级项目中不仅使用了标准的降级，还手写了大量**自定义的 Babel AST 插件**（例如：在编译期自动向所有函数注入埋点代码、针对特定的自研组件库做 AST 按需引入解析）。
    *   SWC 虽然快，但它的 AST 插件是用 Rust 编写的（WASM 方式也在发展中）。要将历史遗留的 JS 版 AST 插件等价重写为 Rust 版，成本极高且存在不可预知的边缘兼容问题。对于背着沉重历史包袱的项目，继续优化 Babel 缓存通常是更稳妥的选择。
