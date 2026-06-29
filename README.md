# Core Front-End Concepts

前端核心概念学习与实践仓库。项目以 VitePress 文档站为主入口，系统整理 HTML、CSS、JavaScript、TypeScript、网络与浏览器、数据结构与算法、设计模式、前端工程化等内容；同时包含一个 Vue3 组件库 `xb-element` 和一套用于学习 Vue 内部机制的 mini Vue 实现。

在线访问：[Core Front-End Concepts](https://sentibeitaokong.github.io/CoreFront-EndConcepts/)

## 项目内容

- **基础知识文档**：HTML、CSS、JavaScript、TypeScript、正则表达式、Git。
- **网络与浏览器**：HTTP、HTTPS、DNS、TCP/UDP、CDN、浏览器缓存、渲染流程、安全等。
- **数据结构与算法**：数组、链表、栈、队列、树、图、哈希表，以及排序、搜索、双指针、滑动窗口、递归、回溯、贪心、动态规划等算法专题。
- **设计模式**：创建型、结构型、行为型模式，以及 MVC、MVVM 等架构模式。
- **前端工程化**：Monorepo、模块化、包管理、测试、Lint、CI/CD、性能监控等。
- **组件库实践**：`packages/xbElement` 提供 Vue3 组件库源码、构建配置和文档演示。
- **Vue 原理实践**：`packages/vue` 按模块拆分 `reactivity`、`runtime-core`、`runtime-dom`、`compiler-core`、`shared` 等学习实现。

## 技术栈

- 文档站：VitePress、Vue 3、TypeScript
- 工程化：pnpm workspace、Turbo、Vite、Vitest、ESLint、Prettier、Husky、lint-staged
- 组件库：Vue 3、Vite library mode、Rollup、unplugin-dts、PostCSS
- 发布与质量：Changesets、Unlighthouse、Commitlint

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
│       └── typescript/
├── packages/
│   ├── html/                  # 原生 HTML/CSS/浏览器 API 示例
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

| 命令                | 说明                                         |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | 通过 Turbo 执行各 workspace 的开发命令       |
| `pnpm build`        | 通过 Turbo 执行各 workspace 的构建命令       |
| `pnpm docs:dev`     | 先构建 `xb-element`，再启动 VitePress 文档站 |
| `pnpm docs:build`   | 先构建 `xb-element`，再构建 VitePress 文档站 |
| `pnpm docs:preview` | 本地预览 VitePress 构建产物                  |
| `pnpm docs:clean`   | 清理文档站缓存                               |
| `pnpm test`         | 执行 mini Vue 与 `xb-element` 测试           |
| `pnpm test:vue`     | 执行 `packages/vue` 相关测试                 |
| `pnpm test:xb`      | 执行 `packages/xbElement` 测试               |
| `pnpm type-check`   | 通过 Turbo 执行类型检查                      |
| `pnpm xb:build`     | 构建 `xb-element`                            |
| `pnpm xb:test`      | 测试 `xb-element`                            |
| `pnpm monitor:lh`   | 使用 Unlighthouse 检查线上/预览站点质量      |

## 组件库开发

`xb-element` 位于 `packages/xbElement`，当前以源码和文档示例共同维护：

```bash
pnpm --filter xb-element dev
pnpm --filter xb-element build
pnpm --filter xb-element test
pnpm --filter xb-element type-check
```

组件示例主要放在 `apps/docs/components`，文档站启动前会先执行 `xb-element` 构建，确保示例可引用最新产物。

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
- 涉及组件库能力变更时，同步更新源码、示例和对应文档。
- 提交前建议执行 `pnpm type-check` 与相关测试命令。

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
