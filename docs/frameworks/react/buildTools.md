---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 环境配置与打包选型(Configuration & Build Tools)

## 1. 核心概念与生态变迁

目前前端界构建 React 应用的工具链，大致分为**三大流派**：

| 流派分类 | 核心代表工具 | 架构理念与痛点解决 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **传统重装步兵 (SPA)** | **Create React App (CRA)** | 曾经的官方唯一指定脚手架。基于 **Webpack**，为你把极其复杂的 React 打包配置完全封装成了一个黑盒。 | 维护历史包袱沉重的老旧企业级后台系统。（⚠️ **官方现已正式宣布停止维护并将其淘汰！** 新项目绝对不要再用！） |
| **现代极速游骑兵 (SPA)** | **Vite** | 抛弃沉重的 Webpack，利用浏览器原生 ESM 和 Go 语言编写的 **esbuild**。冷启动速度从几分钟降维打击到几十毫秒！ | **目前 90% 中小型 React 业务项目（后台管理、B端单页应用）的绝对首选。** |
| **全栈正规军 (SSR/SSG)** | **Next.js** | React 官方现在**唯一强推**的企业级全栈框架。它不仅包揽了底层配置（目前底层在使用 Rust 写的 Turbopack 替代 Webpack），还提供了开箱即用的前端路由、服务端渲染 (SSR)、静态生成 (SSG) 以及甚至写后端 API 的能力。 | 重度依赖 SEO（搜索引擎排名）的官网、电商网站、极其复杂的 C 端大型应用。 |

## 2. 现代首选：基于 Vite 搭建 React (SPA) 配置实战

既然 CRA 已死，我们就聚焦于当下最轻量、最爽快的 **Vite + React** 组合。

### 2.1 初始化与插件安装

```bash
# 1. 瞬间创建一个带 TypeScript 的 React + Vite 项目
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
```

在 Vite 中，React 并不像原生 JS 那样开箱即用，它极度依赖一个核心插件来处理 JSX 语法和至关重要的 **Fast Refresh（极速热更新，让你改代码后不刷新页面就能保留之前的状态）**。

### 2.2 `vite.config.ts` 核心配置解析

默认生成的配置文件极其精简，以下为你展示一个**企业级完整版的 React Vite 配置**，涵盖了路径别名、代理和 CSS 配置。

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 官方 React 插件 (使用 Babel 处理 Fast Refresh)
// 如果你追求极致编译速度，可以使用 @vitejs/plugin-react-swc (使用 Rust 写的 SWC 引擎，但在处理复杂的旧版 HOC 时可能偶尔有边缘 bug)
import path from 'path'

export default defineConfig({
  plugins: [
    // 1. 挂载 React 核心能力
    react({
      // 如果你在用一些旧的 CSS-in-JS 库，可以在这里注入 Babel 插件
      // babel: { plugins: ['babel-plugin-styled-components'] }
    })
  ],

  // 2. 极度重要的路径别名：让你告别 '../../../../utils' 这种地狱路径
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'components': path.resolve(__dirname, './src/components')
    }
  },

  // 3. 本地开发服务器调优
  server: {
    port: 3000,
    open: true, // 启动后自动开浏览器
    // 跨域代理终极解法：开发时前端模拟转发请求，骗过浏览器的同源策略
    proxy: {
      '/api': {
        target: 'https://backend.prod.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // 4. 生产环境构建优化
  build: {
    // 默认使用 esbuild 极速压缩代码 (比 Webpack 的 Terser 快几十倍)
    minify: 'esbuild',
    rollupOptions: {
      // 代码分割 (Code Splitting)：把庞大的第三方库单独抽离，防止首屏白屏
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 将 React 核心源码单独打成一个 vendor 包，享受极佳的浏览器长缓存
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }
            return 'vendor-others'
          }
        }
      }
    }
  }
})
```
*(💡 TypeScript 警告：要在 Vite 中使用 `path` 模块，你需要执行 `npm i -D @types/node` 补充 Node 的类型声明！)*

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 官方为什么突然抛弃了大家用了好几年的 Create React App (CRA)？
*   **答**：这是时代车轮滚滚向前的结果。
    *   **Webpack 的原罪**：CRA 底层被 Webpack 死死绑架。随着项目稍微变大，`npm start` 冷启动动辄需要三十秒，热更新要等 5 秒，极其摧残开发者心智。而 Vite 通过 Bundleless 架构把这个时间缩减到了几十毫秒。
    *   **配置黑盒的傲慢**：CRA 把 Webpack 配置深度隐藏（隐藏在 `react-scripts` 里）。只要你想配个最简单的 `@` 路径别名或者加个 Less 支持，你就必须执行不可逆的 `npm run eject`（把几百行天书一样的 Webpack 核心代码弹射出来糊你一脸），或者强行引入第三方的 `craco` 去打猴子补丁。这不仅不符合现代工程化灵活配置的诉求，甚至成为了架构灾难。
    *   **官方倒向全栈**：React 团队现在的愿景已经超越了单页应用 (SPA)，他们极力推崇 Server Components (RSC) 等服务端技术。由于 CRA 纯粹是一个前端打包器，无法承载这些面向未来的架构，官方最终决定将其打入冷宫，转而推荐使用 Next.js 或 Remix 这种自带服务端能力的全栈框架。

### 3.2 既然官方推 Next.js，那我是不是以后所有项目都不应该用 Vite 了，全上 Next.js？
*   **答**：**绝对不是！请拒绝被官方“PUA”！**
    *   **Next.js 的沉重代价**：Next.js 是为了**服务端渲染 (SSR)** 诞生的。这意味着你要维护一个 Node.js 服务器来跑前端代码！一旦上了 SSR，你必须极其痛苦地区分这段代码是跑在服务端还是浏览器端（比如服务端根本没有 `window` 或 `localStorage`，如果你直接在组件顶层用，程序直接物理崩溃）。且运维部署成本直线飙升。
    *   **架构选型黄金法则**：
        1. 如果你做的是**内部后台管理系统 (B端)**、各种 SaaS 仪表盘：这类项目根本不需要 SEO，用户也不在乎多等一秒的白屏，但对表格、图表的交互极其复杂。此时**绝对、一定、必须选择 Vite + React SPA**！这能为你省去无数个心智负担极重的 SSR 报错！
        2. 如果你做的是**电商前台、新闻官网、面向 C 端的营销页面**：首屏加载速度直接影响转化率，百度/谷歌的蜘蛛必须能爬到页面内容 (SEO)。此时你别无选择，**只能咬牙上 Next.js**。

### 3.3 在 Vite + React 里，我写了 JSX，为什么还要 `import React from 'react'`？有时候不写好像也不报错？
*   **答**：这涉及到一个极其核心的底层编译知识点：**New JSX Transform (全新的 JSX 转换机制)**。
    *   **旧时代 (React 16 及以前)**：由于你写的 JSX `<div />` 本质上是 `React.createElement('div')` 的语法糖。既然底层用到了 `React` 这个变量，你就**必须**在每个文件顶部写死 `import React from 'react'`，否则报错 `React is not defined`。
    *   **新时代 (React 17+ 配合 Vite/Babel)**：编译器变得极度聪明！如果它在配置中检测到了新的转换模式，当它编译 JSX 时，它会**自动且悄悄地**在打包产物里帮你引入特殊的函数（`import { jsx as _jsx } from 'react/jsx-runtime'`），彻底代替了 `React.createElement`。
    *   **结论**：在现代 Vite 配置下，只要你用的是 React 17 及以上版本，**绝大多数时候你完全不需要再手动写 `import React` 了！** 除非你需要显式用到 React 挂在它自己身上的原生 API，比如 `import React, { useState, useEffect } from 'react'`（不过现在大家也习惯直接解构不挂名字了）。

### 4.4 `vite.config.ts` 里配了路径别名 (`@`)，为什么在写代码时依然没有提示，按住 Ctrl 也无法跳转？
*   **答**：这是典型的前端工具链“分权管控”导致的错位。
    *   **根本原因**：`vite.config.ts` 仅仅是用来指导 **Vite 打包工具**如何在物理硬盘上找到文件并打包的。但是，你在 VS Code 里写代码时的智能提示、报错红线、文件跳转，是由 **TypeScript 语言服务器 (Language Server)** 全权接管的！TS 服务器根本不认识 Vite 是老几。
    *   **解药**：你**必须在 TS 的老巢里也报备一次**。打开根目录的 `tsconfig.json`（或 `tsconfig.app.json`），在 `compilerOptions` 里面加上一模一样的路径映射，才能打通 VS Code 的奇经八脉：
    ```json
    {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"],
          "components/*": ["src/components/*"]
        }
      }
    }
    ```
