---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 前端工程化 (Front-end Engineering)

## 1. 前端工程化的核心理念

前端工程化并不是特指某一项技术（比如 Webpack 或者 React），而是一套**方法论**。它的终极目标是：**将前端开发流程从“手工作坊”升级为“现代工业流水线”**。

在没有工程化的时代，前端开发可能就是写几个 HTML/CSS/JS 文件，然后通过 FTP 拖拽到服务器上。而现代前端应用极其复杂，我们需要工程化来解决以下痛点：
*   **代码难以维护：** 几万行代码挤在一个文件里，全局变量冲突。
*   **重复劳动多：** 手动压缩图片、手动压缩代码、手动处理 CSS 兼容性前缀。
*   **团队协作难：** 每个人的代码风格各异，合并代码时冲突不断，容易引发低级 Bug。
*   **发布风险高：** 缺少自动化测试，一上线就出故障。

### 1.1 工程化的四大支柱

业界公认的前端工程化包含以下四个核心维度：

*  **模块化 / 组件化 (Modularization & Componentization)**
*  **规范化 (Standardization)**
*  **自动化 (Automation)**
*  **流程化 (Workflow & CI/CD)**

## 2. 深入工程化四大支柱

### 2.1 模块化与组件化：物理结构的拆分

这是工程化的基础。将庞大的系统拆分成职责单一、可复用的小块。

#### JS 模块化演进
JS 早期没有模块系统，导致了严重的全局变量污染。它的演进路线是：
*   **IIFE (立即执行函数)：** 早期利用闭包隔离作用域的黑科技。
*   **CommonJS：** Node.js 采用的规范，使用 `require()` 和 `module.exports`（同步加载）。
*   **AMD / CMD：** 浏览器端的异步加载规范（RequireJS / SeaJS），现已被淘汰。
*   **ES Modules (ESM)：** **当今的绝对标准！** ES6 官方推出的模块系统，使用 `import` 和 `export`。支持静态分析和 Tree-shaking。

#### CSS 模块化
解决 CSS 全局污染的痛点：
*   **BEM 命名规范：** `Block__Element--Modifier`（纯约定，无强制力）。
*   **CSS Modules：** 编译时自动将类名加上哈希值后缀，实现局部作用域。
*   **CSS-in-JS：** 将 CSS 写在 JS 里（如 Styled-components），在 React 生态中流行。
*   **原子化 CSS：** 如 Tailwind CSS，提供极细粒度的 utility classes。

#### UI 组件化
在 Vue / React 等框架的加持下，将 UI 视图及其对应的逻辑、样式封装为一个独立单元（Component），实现跨页面的高度复用。

### 2.2 规范化：团队协作的基石

规范化旨在抹平开发者之间的个体差异，让整个项目的代码看起来像是同一个人写的。

#### 代码质量规范 (ESLint + TypeScript)
*   **ESLint：** 用于发现代码中的**逻辑错误**（例如使用了未定义的变量、使用了 `==` 而不是 `===`）并强制执行最佳实践。
*   **TypeScript：** 为 JS 提供**静态类型检查**，在编译阶段就能拦截大量的类型错误（例如 `undefined.property`），是大型项目重构的定海神针。

#### 代码格式规范 (Prettier)
*   **Prettier：** 专注于**代码排版长相**的“独裁者”。它不在乎你的逻辑，只负责统一换行、缩进、单双引号、尾随逗号等格式。彻底终结“Tabs vs Spaces”的圣战。

#### Git 提交规范 (Husky + commitlint)
*   **痛点：** 杂乱无章的 Git 提交信息（如：`fix bug`、`update`）让后续追溯和自动生成 Changelog 成为灾难。
*   **解决方案：** 强制遵守 Conventional Commits 规范（如 `feat: 新增登录`，`fix: 修复弹窗`）。结合 **Husky**（Git Hooks 工具）拦截不合规的提交。

### 2.3 自动化：释放生产力

把所有不需要创造力、重复性的枯燥工作全部交给机器。

#### 构建与打包构建 (Build Tools)
将开发者编写的高级代码（ES6+、TS、Sass、Vue/React 单文件组件）转换成浏览器能够直接运行的兼容级 HTML/CSS/JS。
*   **Webpack：** 曾经的绝对霸主。强大的 Loader 和 Plugin 生态，适合极其复杂的巨型应用。缺点是随着项目增大，冷启动极慢。
*   **Vite：** 新生代王者。在开发环境下利用浏览器原生的 ESM 特性进行按需编译，**启动速度达到毫秒级**。生产环境下底层使用 Rollup 打包。

#### 自动化测试 (Automated Testing)
在代码提交或发布前自动运行，防止新代码破坏老功能。
*   **单元测试 (Unit Test)：** 测试单一函数或组件的逻辑。主流工具：**Jest, Vitest**。
*   **端到端测试 (E2E Test)：** 模拟真实用户在浏览器中的点击、输入行为。主流工具：**Cypress, Playwright**。

### 2.4 流程化：打通上线的最后一公里

#### CI/CD (持续集成与持续部署)
将本地代码合并到主干、运行测试、打包构建、发布到服务器的过程完全自动化。
*   **常用平台：** GitHub Actions, GitLab CI/CD, Jenkins。
*   **工作流示例：**
    1.  开发者提交代码并 Push 到远程 `develop` 分支。
    2.  触发 CI Pipeline，在云端服务器上自动执行 `npm install`。
    3.  自动执行 `npm run lint` 和 `npm run test`。
    4.  测试通过后，自动执行 `npm run build`。
    5.  利用 SSH 或 Docker 将打包后的 `dist` 目录自动推送到测试/生产服务器。

## 3. 典型工程化配置示例

一个配置良好的现代前端项目，其核心命脉都在 `package.json` 的脚本中。

```json
{
  "name": "my-engineered-project",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",                   // 本地开发启动 (利用 Vite 的极速冷启动)
    "build": "vue-tsc && vite build",// 生产环境打包 (包含 TS 类型检查)
    "lint": "eslint src/**/*.{ts,vue} --fix", // 自动化检查并修复代码逻辑规范
    "format": "prettier --write \"src/**/*.{js,ts,vue,css,scss}\"", // 自动化代码排版
    "test": "vitest",                // 运行单元测试
    "prepare": "husky install"       // 项目安装依赖后，自动初始化 Git Hooks 拦截器
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"         // 性能优化神器：只对 Git 暂存区的文件进行 Lint
  },
  // lint-staged 配置：当开发者执行 git commit 时触发
  "lint-staged": {
    "*.{js,ts,vue}": [
      "eslint --fix",   // 修复逻辑错误
      "prettier --write" // 统一格式排版
    ]
  }
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 Webpack 和 Vite 的底层核心区别是什么？应该选哪个？
*   **答**：
    *   **Webpack (Bundle-based)**：采用“先打包，后启动”的策略。它会递归抓取所有文件，构建依赖图并打包成 bundle 后才交给浏览器。项目越大，冷启动越慢。
    *   **Vite (ESM-based)**：采用“按需动态编译”。它直接启动本地服务器，当浏览器请求某个特定路由文件时，Vite 才去编译那个文件返回。冷启动速度永远是毫秒级。
    *   **选择建议**：新项目请闭眼选择 Vite。只有当维护极其庞大且重度依赖 Webpack 独有底层 Plugin 的祖传老项目时，才继续使用 Webpack。

### 4.2 已经用了 Prettier 格式化，为什么还会和 ESLint 报红线冲突？
*   **答**：
    *   **原因**：因为早期的 ESLint 既管“代码逻辑”也管了一部分“代码长相”（比如要求必须用单引号）。当你用 Prettier 把代码格式化为双引号时，ESLint 就会认为你违反了规则而报错。
    *   **避坑指南**：必须安装 `eslint-config-prettier` 插件，并在 ESLint 配置文件中将其放在 `extends` 数组的**最后一位**。它的唯一作用就是**暴力关闭所有可能与 Prettier 发生冲突的 ESLint 格式规则**，实现完美分工。

### 4.3 为什么要强制使用 Husky 拦截 Git 提交？靠开发者自觉不行吗？
*   **答**：
    *   **永远不要考验人性的弱点**。团队人数一多，必定会有为了赶进度而无视规范的开发者，随意写出带有隐患的代码并强行 `git commit -m "update"` 推送上去。
    *   **Husky 的作用**：它能在开发者敲下回车键的一瞬间进行物理拦截。如果 ESLint 报错或者 Commit 描述不符合规范，终端会直接拒绝提交（Commit failed）。这是防止代码库变成“屎山”的最后一道物理防线。

### 4.4 Monorepo 是什么？和普通项目有什么区别？
*   **答**：
    *   **传统 Multirepo**：一个项目对应一个 Git 仓库。如果公司有三个端（PC端、H5端、小程序端）要共用一套自研组件库，需要频繁发布 npm 包才能联调，极其痛苦。
    *   **Monorepo (单体仓库)**：将多个相关联的项目/包放在**同一个 Git 仓库**中管理。借助 `pnpm workspaces` 工具，可以实现跨项目的本地依赖硬链接。你在公共包里改了一行代码，业务系统瞬间就能热更新生效，开发体验得到了降维打击般的提升。目前 Vue 3、React 的源码均采用此架构。
