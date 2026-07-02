# Monorepo 任务缓存与版本策略

Monorepo 的价值不只是“把多个项目放到一个仓库”。真正让它适合企业级协作的，是任务调度器能够理解包之间的依赖拓扑，只重跑受影响的任务，并把可复用产物缓存起来。

## 1. Monorepo 中的依赖拓扑

假设仓库结构如下：

```txt
apps/
  admin
  web
packages/
  ui
  utils
  eslint-config
```

依赖关系可能是：

```txt
admin -> ui -> utils
web   -> ui -> utils
ui    -> eslint-config
```

这张图决定了任务执行顺序。`ui` 构建前必须先保证 `utils` 构建完成；`admin` 和 `web` 可以在 `ui` 完成后并行构建。

包管理器负责 workspace 依赖解析：

```json
{
  "dependencies": {
    "@acme/ui": "workspace:*",
    "@acme/utils": "workspace:^"
  }
}
```

任务调度器负责在这张依赖图上执行 `build`、`test`、`lint`、`typecheck` 等任务。

## 2. pnpm filter 的拓扑能力

pnpm 自带基础的拓扑过滤能力，适合轻量 Monorepo。

只构建某个包：

```bash
pnpm --filter @acme/ui build
```

构建某个包及其依赖：

```bash
pnpm --filter @acme/ui... build
```

构建依赖某个包的所有下游：

```bash
pnpm --filter ...@acme/utils build
```

基于 Git diff 选择变更包：

```bash
pnpm --filter "...[origin/main]" test
```

pnpm 的过滤适合包选择，但它不负责跨机器缓存和复杂任务产物复用。大型仓库通常会引入 Turborepo 或 Nx。

## 3. Turborepo 任务管道

`turbo.json` 用来声明任务之间的依赖、输入、输出和缓存策略。

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".vitepress/dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

关键字段：

| 字段         | 作用                                                |
| ------------ | --------------------------------------------------- |
| `dependsOn`  | 声明任务依赖，`^build` 表示先执行上游依赖包的 build |
| `outputs`    | 声明可缓存的产物路径                                |
| `inputs`     | 声明影响缓存命中的输入文件                          |
| `cache`      | 是否启用缓存                                        |
| `persistent` | 长驻任务，例如 dev server                           |

## 4. 任务缓存原理

任务缓存的核心是哈希。调度器会把影响任务结果的因素合并成一个 hash：

- 当前包的源码。
- `package.json` 脚本和依赖声明。
- 锁文件，例如 `pnpm-lock.yaml`。
- 任务配置，例如 `turbo.json`。
- 环境变量白名单。
- 上游依赖包的输出 hash。

如果 hash 没变，调度器就可以跳过真实执行，直接恢复上次产物。

```txt
cache key = hash(source + package.json + lockfile + env + upstream outputs)
```

这就是为什么 Monorepo 中修改 `packages/utils` 会让 `ui`、`admin`、`web` 的相关任务失效，而只修改 `apps/admin` 页面通常不会影响 `apps/web`。

## 5. 本地缓存与远程缓存

### 5.1 本地缓存

本地缓存保存在开发者机器或 CI 工作目录中。优点是接入简单，缺点是 CI 容器每次重新创建时缓存可能丢失。

```bash
pnpm turbo build
```

第二次执行时，未变化的包会命中缓存。

### 5.2 远程缓存

远程缓存把任务产物上传到共享服务。一个人在 CI 或本地构建过，其他人和后续 CI 都可以复用。

```bash
pnpm turbo login
pnpm turbo link
```

企业自建环境可以使用私有远程缓存服务，避免构建产物和路径信息进入外部平台。

## 6. 缓存边界与环境变量

构建结果可能受环境变量影响。如果没有把关键变量纳入 hash，缓存可能错误复用。

```json
{
  "globalEnv": ["NODE_ENV", "VITE_API_BASE_URL"],
  "tasks": {
    "build": {
      "env": ["VITE_PUBLIC_PATH"],
      "outputs": ["dist/**"]
    }
  }
}
```

原则：

- 影响产物内容的变量必须进入 hash。
- 密钥类变量不应进入前端产物。
- dev server、watch、preview 等长驻任务不要缓存。

## 7. 依赖拓扑下的任务执行顺序

`dependsOn: ["^build"]` 是 Monorepo 中最重要的规则之一。

```txt
packages/utils build
  -> packages/ui build
    -> apps/admin build
    -> apps/web build
```

如果没有这条规则，应用可能在依赖包尚未生成 `dist` 或类型声明时就开始构建，导致偶发失败。

对于纯源码引用的仓库，也可以选择不构建上游包，而是让应用构建器直接编译 workspace 源码。但这种模式需要统一 TS、Vite、打包器配置，否则容易出现开发环境能跑、生产构建失败。

## 8. 版本策略

Monorepo 的版本策略通常分三类。

### 8.1 Fixed / Locked

所有包使用同一个版本号：

```txt
@acme/ui@2.4.0
@acme/utils@2.4.0
@acme/theme@2.4.0
```

适合强绑定产品套件。优点是用户心智简单，缺点是一个小包 patch 也可能带动整个生态发版。

### 8.2 Independent

每个包独立版本：

```txt
@acme/ui@3.1.0
@acme/utils@1.8.2
@acme/theme@2.0.4
```

适合工具包、SDK、多业务共享仓库。优点是发布影响面小，缺点是依赖矩阵更复杂。

### 8.3 Hybrid

强相关包固定版本，弱相关包独立版本。例如 UI 核心、主题、图标固定，工具函数和 ESLint 配置独立。

Changesets 的 `fixed` 和 `linked` 可以表达这类关系。

## 9. 内部依赖更新策略

Changesets 中常见配置：

```json
{
  "updateInternalDependencies": "patch"
}
```

含义是：当上游内部包发布新版本时，下游依赖范围至少按 patch 级别更新，保证发布到 npm 后仍能解析到正确版本。

内部依赖建议：

- 开发期使用 `workspace:*` 或 `workspace:^`。
- 发布时由 Changesets 转换为真实 semver。
- 公共库不要依赖未声明的根目录依赖，避免幻影依赖。

## 10. affected 构建策略

大型仓库不应每次 CI 都全量构建。更合理的流程：

```bash
pnpm turbo build --filter="...[origin/main]"
pnpm turbo test --filter="...[origin/main]"
```

它会选择从 `origin/main` 到当前分支发生变化的包，以及受影响的下游包。

适用场景：

- PR 检查只跑受影响包。
- main 分支发布前跑全量校验。
- 修改共享底层包时自动扩大检查范围。

## 11. 常见问题

### 11.1 为什么任务明明没变却没有命中缓存？

检查 `outputs` 是否声明正确、任务是否写入了未声明产物、环境变量是否变化、lockfile 是否变化、脚本是否包含时间戳或随机数。

### 11.2 为什么命中了缓存但产物不对？

通常是 `inputs` 或 `env` 声明过窄，导致影响产物的文件没有进入 hash。例如构建读取了根目录 `.env.production`，但缓存配置没有把它纳入输入。

### 11.3 是否所有任务都应该缓存？

不是。`build`、`test`、`typecheck` 通常适合缓存；`dev`、`preview`、`watch`、发布任务、部署任务不应该缓存。发布和部署必须真实执行，不能从缓存恢复。
