---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 环境配置与打包选型(Configuration & Build Tools)

## 1. 核心概念与生态变迁

目前前端界构建 Vue.js 应用的工具链，同样经历了深刻的世代交替，大致可以划分为**三大流派**：

| 流派分类 | 核心代表工具 | 架构理念与痛点解决 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **传统重装步兵 (SPA)** | **Vue CLI (`@vue/cli`)** | 曾经的官方唯一指定脚手架。基于 **Webpack**，为你把复杂的 loader 和打包配置封装成了高度可扩展的插件系统。 | 维护历史包袱沉重的 Vue 2 时代老旧企业级系统。（⚠️ **官方现已正式宣布进入维护模式！** 强烈建议新项目不要再使用！） |
| **现代极速游骑兵 (SPA)** | **Vite / create-vue** | 由 Vue 作者尤雨溪亲手打造并引发前端构建革命的工具。利用浏览器原生 ESM 和 Go 语言编写的 **esbuild**。冷启动速度从几分钟降维打击到几十毫秒！ | **目前 99% 中小型 Vue 业务项目（后台管理、B端单页应用）的绝对首选。** |
| **全栈正规军 (SSR/SSG)** | **Nuxt.js** | Vue 生态中最强大的企业级全栈框架。基于 Vite 和底层引擎 Nitro，提供了开箱即用的前端自动路由、服务端渲染 (SSR)、静态生成 (SSG) 以及全栈 API 开发能力。 | 重度依赖 SEO（搜索引擎排名）的官网、电商网站、极其复杂的 C 端大型应用。 |

## 2. 现代首选：基于 Vite 搭建 Vue (SPA) 配置实战

既然 Vue CLI 已经完成了它的历史使命，我们就聚焦于当下最轻量、最爽快的 **Vite + Vue 3** 组合。

### 2.1 初始化与插件安装

```bash
# 1. 瞬间创建一个带 TypeScript 和周边生态的 Vue 项目 (推荐使用官方 create-vue)
npm create vue@latest

# 或者使用 Vite 纯粹的底层模板
npm create vite@latest my-vue-app -- --template vue-ts

cd my-vue-app
npm install
```

在 Vite 中，Vite 本身是框架无关的，它能极其完美地支持 Vue 单文件组件 (`.vue` SFC)，全靠底层的专属插件来进行 AST 解析与编译。

### 2.2 `vite.config.ts` 核心配置解析

以下为你展示一个**企业级完整版的 Vue Vite 配置**，涵盖了路径别名、代理、按需引入和构建优化。

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue' // 官方 Vue 插件 (提供核心的单文件组件编译和热更新能力)
import vueJsx from '@vitejs/plugin-vue-jsx' // 如果你习惯像 React 那样写 JSX/TSX，需要引入这个插件
import path from 'path'

export default defineConfig({
  plugins: [
    // 1. 挂载 Vue 核心能力
    vue({
      // 可以在这里配置 reactivityTransform 等实验性特性
    }),
    vueJsx()
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
    // 默认使用 esbuild 极速压缩代码
    minify: 'esbuild',
    rollupOptions: {
      // 代码分割 (Code Splitting)：把庞大的第三方库单独抽离，防止首屏白屏
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 将 Vue 核心源码单独打成一个 vendor 包，享受极佳的浏览器长缓存
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor-vue'
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

### 3.1 官方为什么突然抛弃了大家用了好几年的 Vue CLI？
*   **答**：这是时代车轮滚滚向前的结果，也是尤雨溪对自己生态的一次“革命”。
    *   **Webpack 的原罪**：Vue CLI 底层深度绑定 Webpack。随着项目代码量增加，构建依赖图谱变得极其庞大，`npm run serve` 冷启动动辄需要几十秒，修改一行代码热更新要等 5 秒。
    *   **Vite 的降维打击**：Vite 在开发环境下彻底抛弃了“打包”这个概念，直接利用现代浏览器原生的 ES Modules 特性。浏览器请求什么文件，Vite 就动态编译什么文件。这使得冷启动时间永远保持在毫秒级，彻底改变了前端开发体验。

### 3.2 既然有全栈框架 Nuxt.js，那我是不是以后所有项目都不应该用 Vite 单页应用了？
*   **答**：**绝对不是！请拒绝无脑跟风全栈！**
    *   **Nuxt.js 的沉重代价**：Nuxt 主要是为了**服务端渲染 (SSR)** 诞生的。这意味着你要维护一个 Node.js 运行时环境。在 SSR 下，组件的 `setup` 会在 Node 端和浏览器端各跑一次，如果你在顶层无脑调用 `window.document`，你的服务会直接崩溃。心智负担和运维成本直线飙升。
    *   **架构选型黄金法则**：
        1. 如果你做的是**内部后台管理系统 (B端)**、各种 SaaS 仪表盘：不需要 SEO，此时**绝对、一定、必须选择 Vite + Vue SPA**！开发极速，完全不需要考虑服务端生命周期。
        2. 如果你做的是**电商前台、内容资讯网站**：强依赖百度/谷歌的蜘蛛抓取 (SEO) 和极致的首屏加载速度，此时**必须咬牙上 Nuxt.js**。

### 3.3 在 `<script setup>` 里，为什么导入的组件不需要像以前那样在 `components` 选项里注册就能直接用？
*   **答**：这涉及到一个极其核心的底层编译知识点：**Vite 插件与单文件组件 (SFC) 编译器 (`@vue/compiler-sfc`) 的魔法**。
    *   **旧时代 (Options API)**：由于导出的只是一个普通的 JS 配置对象，Vue 运行时必须根据你写的 `components: { MyButton }` 去找到对应的组件进行解析。
    *   **新时代 (Script Setup 宏)**：`<script setup>` 本质上是构建时的一个语法糖宏 (Macro)。当 Vite 处理 `.vue` 文件时，底层编译器会将整个 `<script setup>` 里的内容编译成组件的 `setup()` 函数。你在顶层作用域导入的任何变量、函数、组件，**编译器在编译模板时，会自动把它们闭包引入到渲染函数 (Render Function) 中**。省去了手动注册的繁琐，这也是 Vue 3 极度顺滑的原因。

### 3.4 `vite.config.ts` 里配了路径别名 (`@`)，为什么在 VS Code 写代码时依然没有提示，按住 Ctrl 也无法跳转？
*   **答**：这是典型的前端工具链“分权管控”导致的错位。
    *   **根本原因**：`vite.config.ts` 仅仅是用来指导 **Vite 打包工具**如何在物理硬盘上找到文件并进行处理的。但是，你在 VS Code 里写代码时的智能提示、报错红线、模板引用的类型推导，是由 **TypeScript 语言服务器 (Volar 插件)** 全权接管的！TS 服务器根本不认识 Vite 里配的别名。
    *   **解药**：你**必须在 TS 的老巢里也报备一次**。打开根目录的 `tsconfig.json`（如果在现代 create-vue 项目中，通常是在 `tsconfig.app.json`），在 `compilerOptions` 里面加上一模一样的路径映射：

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
