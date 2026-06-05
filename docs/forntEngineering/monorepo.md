# Monorepo 架构

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

## 3. 企业级架构的核心诉求

### 3.1 优势拓展

- **研发物料收敛**：不仅共享组件，连 TypeScript 配置、ESLint 规则、Prettier 格式化标准甚至 Tailwind 配置都封装为独立的 NPM 包（如 `@xunbei-vue/eslint-config`），实现全团队零配置复用。
- **依赖防腐与锁定**：严格使用 `pnpm` 锁定环境，利用 `corepack` 杜绝团队成员包管理器版本不一致导致的幽灵依赖冲突。
- **发版闭环管控**：引入自动化变更集（Changesets），根据 Git 提交记录自动计算版本号（SemVer）、生成 CHANGELOG，并统一触发 npm push。

### 3.2 挑战与解法

- **构建时间爆炸**：通过 Turborepo 的物理级缓存和任务并发拓扑图（DAG），将整体构建耗时压缩到极致。
- **包边界混乱**：严格限制 `package.json` 的 `exports` 字段，禁止跨包引用深层未暴露的文件，保证架构的清晰。

## 4. 企业级主流工具链生态

构建企业级架构，你需要一套经得起时间考验的“王牌组合”：

- **包管理与拓扑寻址：** `pnpm` (结合 Workspace 协议实现本地软链同步)。
- **智能任务调度与缓存：** `Turborepo` (Vercel 出品，云端/本地双重缓存)。
- **模块化构建引擎：** `Vite` (业务应用与文档站) + `Rollup` / `esbuild` (底层组件库构建)。
- **版本发布流：** `@changesets/cli` (处理 Monorepo 多包联动发版的标准工具)。

## 5. 企业级 Monorepo 项目架构

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

### 5.1 环境准备

确保已安装 Node.js（>=18）和 pnpm。若未安装 pnpm：

```bash
npm install -g pnpm
```

### 5.2 初始化仓库

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

### 5.3 配置pnpm 工作区

创建 `pnpm-workspace.yaml`，声明工作空间中包的存放位置：

:::code-group

```yaml [pnpm-workspace.yaml]
packages:
  - 'apps/*' 。       # 存放具体的业务应用 (如 web, api)
  - 'packages/*'     # 存放公共包 (如 ui, utils, 配置文件)
```

:::

### 5.4 创建子包

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

### 5.5 统一 TypeScript 配置

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

### 5.7 统一 ESLint 配置

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

### 5.8 集成 Turborepo

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

### 5.9 添加 .gitignore

```
node_modules/
dist/
.turbo/
*.log
```

### 5.10 运行与验证

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
