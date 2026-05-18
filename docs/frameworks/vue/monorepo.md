# Monorepo 架构解读与创建指南

Monorepo（单一仓库）是一种将多个项目或包集中存放在一个版本控制仓库中的开发策略。

## 1. 什么是 Monorepo？

**Monorepo** (Monolithic Repository) 是一种软件开发的版本控制策略，指**将多个独立的项目（或模块、包）存放在同一个代码仓库（Repository）中管理**。

它的对立面是传统的 **Polyrepo (Multirepo)** 架构，即每个项目或模块都有自己独立的代码仓库。

> **💡 举个例子：**
> 假设你有一个电商产品，包含：买家 Web 端、卖家后台管理系统、移动端 H5，以及一个公共的 UI 组件库。
>
> - **Polyrepo 模式：** 你会在 Git 上建 4 个仓库，分别维护。组件库更新后需要发布到 npm，其他三个项目再分别拉取更新。
> - **Monorepo 模式：** 你只建 1 个 Git 仓库，里面包含这 4 个项目。组件库的修改可以被其他三个项目实时感知，无需发布即可本地联调。

## 2. Monorepo 的优势与挑战

### 2.1 优势

- **代码共享更容易**：提取公共代码（如 UI 组件、工具函数、类型定义）变得极其容易。各个子项目通过 workspace 互相引用，就像引用本地文件一样简单。
- **原子提交**：当修改公共组件并同时修改调用该组件的业务项目时，可以在一个 Git Commit 或一个 PR 中完成。避免了跨仓库提 PR 的时间差导致的构建失败。
- **统一构建与测试**：可以一键运行所有包的构建、测试和 lint，提升开发效率。
- **统一依赖管理**：共享同一份依赖锁定文件（如 `pnpm-lock.yaml`），避免版本冲突和重复安装。
- **便于重构**：影响多个包的改动可以同步进行，编译器/类型检查能立即暴露不兼容之处。

### 2.2 挑战(劣势)

- **仓库体积庞大**：检出速度、CI/CD 耗时可能增加。
- **权限控制复杂**：难以按包粒度设置访问权限（可由工具辅助解决）。
- **构建工具要求高**：需要支持缓存、增量构建的工具来保持性能。
- **依赖地狱风险**：若不对依赖严格约束，可能出现版本混乱。

## 3. 主流 Monorepo 工具链生态

现代 Monorepo 架构通常由 **“包管理器” + “构建/任务调度工具”** 组合而成。

### 3.1 包管理器 (负责依赖安装和 Workspace 管理)

- **pnpm (首选)：** 目前最流行的选择。原生支持 `workspace`，依靠软硬链接机制，安装速度极快，且天然解决幽灵依赖问题。
- **Yarn (v1/Berry)：** 最早普及 Workspace 概念的包管理器，成熟稳定。

### 3.2 任务调度工具 (负责拓扑排序执行任务、缓存)

- **Turborepo：** 由 Vercel 推出，基于 Go/Rust 编写。**极速、零配置缓存、上手极其简单**。目前在中小型和大型前端 Monorepo 中极受欢迎。
- **Nx：** 极其强大且功能丰富的工具，提供大量的代码生成器和插件。适合超大型的、跨语言的复杂企业级 Monorepo。
- **Rush：** 微软出品，专为超大型仓库设计，注重严格的依赖隔离和发布流程。
- **Lerna：** 曾经的王者，主要负责包的发布和版本管理。现已被 Nx 团队接管并集成了 Nx 的缓存能力。

> 推荐组合：**pnpm + Turborepo**（快速、易用）或 **Nx + pnpm**（大型项目）。

## 4. 项目实践：Monorepo + Turborepo + TypeScript + ESLint

```
my-monorepo/
├── apps/
│   └── web/
│       ├── src/
│       │   └── index.ts          # 应用入口，引用 shared 包
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   └── index.ts          # 公共库的导出
│       ├── package.json
│       └── tsconfig.json
├── turbo.json                    # Turborepo 任务编排配置
├── pnpm-workspace.yaml           # pnpm 工作空间定义
├── tsconfig.base.json            # TypeScript 基础配置，所有包继承
├── .eslintrc.js                  # 共享 ESLint 配置
├── package.json                  # 根 package.json（包含 turbo 脚本）
├── .gitignore                    # git 忽略提交文件
└── pnpm-lock.yaml                # 依赖锁定文件（自动生成）
```

### 4.1 环境准备

确保已安装 Node.js（>=18）和 pnpm。若未安装 pnpm：

```bash
npm install -g pnpm
```

### 4.2 初始化仓库

```bash
mkdir my-monorepo && cd my-monorepo
git init
pnpm init
```

根目录不需要发布，设为私有，在根 `package.json` 中设置 `private: true`，防止根包被意外发布：

:::code-group

```json [package.json]
{
  "name": "my-monorepo",
  "private": true
}
```

:::

### 4.3 配置pnpm 工作区

创建 `pnpm-workspace.yaml`，声明工作空间中包的存放位置：

:::code-group

```yaml [pnpm-workspace.yaml]
packages:
  - 'apps/*' 。       # 存放具体的业务应用 (如 web, api)
  - 'packages/*'     # 存放公共包 (如 ui, utils, 配置文件)
```

:::

### 4.4 创建子包

分别创建公共库和应用库的目录并初始化：

```bash
# 公共库 shared
mkdir -p packages/shared
cd packages/shared
pnpm init
# 修改 package.json name 为 "@my-monorepo/shared"

# 应用 web
mkdir -p ../../apps/web
cd ../../apps/web
pnpm init
# 修改 name 为 "@my-monorepo/web"

```

**创建公共库子包基本代码**

:::code-group

```typescript [packages/shared/src/index.ts]
export const hello = (name: string) => `Hello, ${name}!`
```

:::

**修改公共库子包package.json名称**

:::code-group

```json [packages/shared/package.json]
{
  "name": "@my-monorepo/shared",
  "version": "1.0.0",
  "main": "src/index.ts", // 开发时直接指向源文件（TypeScript 支持）
  "types": "src/index.ts"
}
```

:::

**应用库子包引入公共库子包函数并调用**

:::code-group

```typescript [apps/web/src/index.ts]
import { hello } from '@my-monorepo/shared'

console.log(hello('World'))
```

:::

**应用库子包添加公共库子包依赖**

```bash
pnpm --filter @my-monorepo/web add @my-monorepo/shared -D
```

:::code-group

```json [apps/web/package.json]
{
  "name": "@my-monorepo/web",
  "version": "1.0.0",
  "dependencies": {
    "@my-monorepo/shared": "workspace:*"
  }
}
```

:::

`workspace:*` 是 pnpm 协议，表示使用当前工作空间中的本地包，而不是从 npm 下载。

### 4.5 统一 TypeScript 配置

在根目录创建 `tsconfig.base.json`，包含通用编译器选项：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**公共库子包创建自己的 `tsconfig.json`，通过 `extends` 继承基础配置：**

:::code-group

```json [packages/shared/tsconfig.json]
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

:::

**应用库子包创建`tsconfig.json`,并通过 `extends` 继承基础配置：**

:::code-group

```json [apps/web/tsconfig.json]
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

:::

### 4.7 统一 ESLint 配置

**在根目录安装 ESLint 及相关插件：**

```bash
pnpm add -Dw eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier
```

**创建根 `.eslintrc.js`：**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // 若使用了 Prettier，确保 ESLint 不检查格式
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
  },
}
```

**公共库子包引入eslint，并通过 `extends` 继承基础配置**

:::code-group

```js [packages/shared/.eslintrc.js]
module.exports = {
  extends: '../../.eslintrc.js',
}
```

:::

**应用库子包引入eslint，并通过 `extends` 继承基础配置**

:::code-group

```js [apps/web/.eslintrc.js]
module.exports = {
  extends: '../../.eslintrc.js',
}
```

:::

**在根 `package.json` 中添加 lint 脚本：**

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx"
  }
}
```

### 4.8 集成 Turborepo

**安装 Turborepo：**

```bash
pnpm add -Dw turbo
```

**创建 `turbo.json`，定义任务管线：**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"], //拓扑依赖声明。告诉 Turbo，在打包一个应用（如 web）之前，必须先把它依赖的公共库（如 ui 和 utils）的 build 命令执行完毕。
      "outputs": ["dist/**"] //定义产物缓存目录。第二次打包时，如果代码没变，Turbo 会直接从缓存里把 dist 闪现出来，实现 0秒打包。
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

**在根 `package.json` 中添加 turbo 快捷脚本：**

```json
{
  "scripts": {
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

**为公共库子包的`package.json`文件添加运行脚本**

:::code-group

```json[packages/shared/package.json]
{
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  }
}
```

:::

**为应用库子包的`package.json`文件添加运行脚本**

:::code-group

```json [apps/web/package.json]
{
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  }
}
```

:::

### 4.9 添加 .gitignore

```
node_modules/
dist/
.turbo/
*.log
```

### 4.10 运行与验证

```bash
# 安装所有依赖（已执行过）
pnpm install

# 全局 lint
pnpm lint

# 全局类型检查
pnpm type-check

# 构建所有包
pnpm build

# 运行应用（需要时配置 ts-node 或 tsx）
```
