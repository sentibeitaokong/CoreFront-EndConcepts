# Core Front-End Concepts

前端核心概念学习与实践仓库。项目以 VitePress 文档站为主入口，系统整理 HTML、CSS、JavaScript、TypeScript、网络与浏览器、Web 安全、性能优化、Vue / React、数据结构与算法、设计模式、前端工程化等内容；同时包含一个 Vue3 组件库 `xb-element` 和一套用于学习 Vue 内部机制的 mini Vue 实现。

在线访问：[Core Front-End Concepts](https://sentibeitaokong.github.io/CoreFront-EndConcepts/)

## 项目内容

- **基础知识文档**：HTML、CSS、JavaScript、TypeScript、正则表达式、Git。
- **网络与浏览器**：OSI、IP、DNS、CDN、TCP/UDP、HTTP/HTTPS、实时通信、API 设计、缓存策略、浏览器渲染、Performance API、Web Components 等。
- **Web 安全体系**：XSS、CSRF、同源策略、CORS、CSP、SRI、HSTS、ClickJacking、SameSite Cookie、JWT / Cookie / Session、OAuth2 / OIDC、供应链安全等。
- **性能优化专题**：Core Web Vitals、首屏优化、资源加载、图片优化、JS/CSS 执行优化、虚拟列表、Bundle 分析和性能监控。
- **现代框架体系**：Vue 基础、Vue Router、Pinia、SSR、KeepAlive、Teleport、Transition、Suspense、Vue 核心设计与源码；React 基础、Hooks、Router、Redux、Portals、HOC、性能优化等。
- **数据结构与算法**：数组、链表、栈、队列、树、图、哈希表，以及排序、搜索、双指针、滑动窗口、递归、回溯、贪心、动态规划等算法专题。
- **设计模式**：创建型、结构型、行为型模式，以及 MVC、MVVM 等架构模式。
- **前端工程化**：模块化、组件化、包管理、npm 发布、Webpack、Vite、Rspack、Turbopack、Rollup、Source Map、Lint、测试、错误处理、监控、CI/CD、Monorepo 等。
- **组件库实践**：`packages/xbElement` 提供 Vue3 组件库源码、构建配置、类型声明、测试用例和文档演示。
- **Vue 原理实践**：`packages/vue` 按模块拆分 `reactivity`、`runtime-core`、`runtime-dom`、`compiler-core`、`shared` 等学习实现。

## 技术栈

- 文档站：VitePress、Vue 3、TypeScript、Mermaid、Algolia DocSearch
- 工程化：pnpm workspace、Turbo、Vite、Vitest、ESLint、Prettier、Husky、lint-staged
- 组件库：Vue 3、Vite library mode、Rollup、unplugin-dts、PostCSS
- 发布与质量：Changesets、Unlighthouse、Commitlint、Sentry、markdownlint

## 目录结构

```text
.
├── apps/
│   └── docs/                 # VitePress 文档站
│       ├── .vitepress/        # 文档站配置与主题
│       ├── components/        # 组件库文档示例
│       ├── css/               # CSS 基础
│       ├── dataStructuresAndAlgorithms/
│       ├── designPatterns/
│       ├── frontEngineering/
│       ├── html/
│       ├── js/
│       ├── networkAndBrowsers/
│       ├── performanceOptimization/
│       ├── regexp/
│       ├── typescript/
│       └── webSecurity/
├── packages/
│   ├── html/                  # 原生 HTML/CSS/浏览器 API 示例
│   ├── js/                    # JavaScript 运行机制与手写示例
│   ├── xbElement/             # Vue3 组件库
│   └── vue/                   # mini Vue 学习实现
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 快速开始

环境要求：

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `11.2.2`

安装依赖：

```bash
pnpm install
```

启动文档站：

```bash
pnpm docs:dev
```

构建文档站：

```bash
pnpm docs:build
```

预览构建产物：

```bash
pnpm docs:preview
```

## 常用脚本

| 命令                      | 说明                                         |
| ------------------------- | -------------------------------------------- |
| `pnpm dev`                | 通过 Turbo 执行各 workspace 的开发命令       |
| `pnpm build`              | 通过 Turbo 执行各 workspace 的构建命令       |
| `pnpm docs:dev`           | 先构建 `xb-element`，再启动 VitePress 文档站 |
| `pnpm docs:dev-only`      | 直接启动 VitePress 文档站                    |
| `pnpm docs:build`         | 先构建 `xb-element`，再构建 VitePress 文档站 |
| `pnpm docs:build-only`    | 直接构建 VitePress 文档站                    |
| `pnpm docs:build-analyze` | 构建文档站并生成 bundle 分析报告             |
| `pnpm docs:preview`       | 本地预览 VitePress 构建产物                  |
| `pnpm docs:preview:ci`    | 以固定地址和端口预览文档站构建产物           |
| `pnpm docs:clean`         | 清理文档站缓存                               |
| `pnpm docs:rebuild`       | 清理缓存后重新构建文档站                     |
| `pnpm docs:lint`          | 检查 Markdown 文档格式                       |
| `pnpm test`               | 执行 mini Vue 与 `xb-element` 测试           |
| `pnpm test:vue`           | 执行 `packages/vue` 相关测试                 |
| `pnpm test:xb`            | 执行 `packages/xbElement` 测试               |
| `pnpm type-check`         | 通过 Turbo 执行类型检查                      |
| `pnpm xb:build`           | 构建 `xb-element`                            |
| `pnpm xb:test`            | 测试 `xb-element`                            |
| `pnpm monitor:lh`         | 使用 Unlighthouse 检查线上/预览站点质量      |

## 组件库开发

`xb-element` 位于 `packages/xbElement`，当前以源码和文档示例共同维护：

```bash
pnpm --filter xb-element dev
pnpm --filter xb-element build
pnpm --filter xb-element test
pnpm --filter xb-element type-check
```

组件示例主要放在 `apps/docs/components`，对应文档位于 `apps/docs/frameworks/vue/components`。文档站启动前会先执行 `xb-element` 构建，确保示例可引用最新产物。

当前组件覆盖 Button、Progress、Collapse、Tooltip、Dropdown、Message、Input、Switch、Select、Form、Icon；组件库输出 ES、UMD、CSS 和类型声明，适合用来学习组件 API 设计、样式变量、Hooks、浮层定位、表单校验和类库打包流程。

## mini Vue 模块

`packages/vue` 用于拆解 Vue 核心能力，主要模块包括：

- `reactivity`：响应式系统
- `runtime-core`：组件、VNode、渲染器、调度器等运行时核心
- `runtime-dom`：DOM 平台渲染适配
- `compiler-core`：模板编译核心
- `shared`：跨模块共享工具
- `vue`：聚合入口

相关测试位于 `packages/vue/**/__tests__`，可通过 `pnpm test:vue` 执行。

## 文档编写约定

- 文档内容统一放在 `apps/docs` 下，按主题目录归类。
- 新增组件演示时，将 Vue 示例放在 `apps/docs/components/<ComponentName>`。
- 新增组件文档时，将 Markdown 放在 `apps/docs/frameworks/vue/components`，并在 VitePress 侧边栏中补充入口。
- 新增专题文档时，优先沿用已有目录命名与链接风格，并同步更新首页、简介页或 README 中的内容索引。
- 涉及组件库能力变更时，同步更新源码、示例和对应文档。
- 提交前建议执行 `pnpm docs:lint`、`pnpm type-check` 与相关测试命令。

## 文档站能力

- 支持 Algolia DocSearch 搜索、页面最后更新时间、编辑链接、站点地图和 Mermaid 图表。
- 支持组件示例预览、图片放大、任务列表和脚注等 Markdown 扩展。
- 生产构建可通过 `SENTRY_UPLOAD=true` 与 `SENTRY_AUTH_TOKEN` 上传 sourcemap，也可通过 `BUNDLE_ANALYZE=true` 生成构建体积分析报告。

## 发布

组件库发布使用 Changesets：

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

`release` 会执行测试、构建并发布 `xb-element`。发布前请确认 npm registry、版本变更和变更日志符合预期。

## License

MIT
