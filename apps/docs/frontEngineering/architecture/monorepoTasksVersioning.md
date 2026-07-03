# Monorepo 任务缓存与版本策略

Monorepo 的核心价值不仅在于“**多项目同仓管理**”，更在于通过任务调度器理解包的依赖拓扑，实现**受影响任务的精准重跑**与**可复用产物的高效缓存**，这是企业级协作的基础保障。

## 1. 依赖拓扑与基础过滤机制

包管理器通过声明解析依赖网络（例如 `apps/web` 依赖 `packages/ui`，`packages/ui` 依赖 `packages/utils`）。

```json
// packages/ui/package.json
{
  "dependencies": {
    "@acme/utils": "workspace:*" 
  }
}

```

### 1.1 pnpm 原生 filter (基础版)

轻量级仓库可直接使用 pnpm 的过滤指令：

* **构建单包**：`pnpm --filter @acme/ui build`
* **构建单包及所有前置依赖**：`pnpm --filter @acme/ui... build`
* **构建受该包影响的所有下游**：`pnpm --filter ...@acme/utils build`
* **基于 Git 变更触发**：`pnpm --filter "...[origin/main]" test`

pnpm 的过滤适合包选择，但它不负责跨机器缓存和复杂任务产物复用。大型仓库通常会引入 Turborepo 或 Nx。

## 2. 任务管道与缓存计算 (Turborepo 架构)

### 2.1 任务管道声明

`turbo.json`用来声明任务之间的依赖、输入、输出和缓存策略。

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // 核心：强制先执行上游依赖的 build
      "outputs": ["dist/**"]    // 声明缓存产物路径
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,           // dev/watch 等长驻任务严禁缓存
      "persistent": true
    }
  }
}
```

| 字段         | 作用                                                |
| ------------ | --------------------------------------------------- |
| `dependsOn`  | 声明任务依赖，`^build` 表示先执行上游依赖包的 build |
| `outputs`    | 声明可缓存的产物路径                                |
| `inputs`     | 声明影响缓存命中的输入文件                          |
| `cache`      | 是否启用缓存                                        |
| `persistent` | 长驻任务，例如 dev server                           |

### 2.2 缓存 Hash 计算原理

调度器并非魔法，而是基于严格的散列算法计算任务的“**唯一指纹**”（Cache Key）。一旦 Hash 匹配，直接恢复历史产物。

**Cache Key 构成要素：**
`hash(当前源码 + package.json/lockfile + turbo配置 + 声明的环境变量 + 上游依赖的输出hash)`

* **缓存失效排查**：如果“**明明没改代码却没命中缓存**”，请重点检查是否引入了未被追踪的环境变量、时间戳注入或全局 lockfile 的变动。

### 2.3 环境变量边界

未声明的环境变量可能导致缓存被错误复用。影响构建结果的变量必须显式入参：

```json
{
  "globalEnv": ["NODE_ENV"], // 影响所有任务
  "tasks": {
    "build": { "env": ["VITE_API_URL"] } // 仅影响当前任务
  }
}

```

## 3. 本地与远程缓存协同

### 3.1 本地缓存

默认开启，存储于开发者本机或单个 CI 容器内（`node_modules/.cache/turbo`）。缺点是 CI 容器销毁即丢失。

```bash
pnpm turbo build
```

### 3.2 远程缓存

将产物上传至云端共享（支持私有化部署 Vercel Remote Cache 兼容服务）。实现“**一人构建，全团队及全 CI 链路复用**”的降维打击。

```bash
pnpm turbo login
pnpm turbo link
```

## 4. 版本发布策略矩阵

在 Monorepo 体系中，需根据业务属性选择发版策略（通常结合 Changesets 实现）：

| 策略模式 | 版本特征 | 适用场景与优劣 |
| --- | --- | --- |
| **Fixed (强绑定)** | 全局统一版本（如均是 `v2.0.0`） | 适合核心生态套件（如 React 全家桶）。**优点**：用户心智极简。**缺点**：小改动会导致无辜包被迫升级。 |
| **Independent (解耦)** | 各包独立版本 | 适合中台 SDK、工具库集合。**优点**：爆炸半径极小。**缺点**：团队管理版本矩阵的复杂度高。 |
| **Linked (混合编队)** | 强关联包同步升级，松散包独立 | 兼顾灵活性与秩序，是目前最受推崇的企业实践。 |

## 5. 内部依赖更新转换

开发期使用 `workspace:*` 占位，发布时应配置工具自动将其转换为具体的 semver 版本。

```json
// .changeset/config.json
{
  "updateInternalDependencies": "patch" // 上游更新时，下游依赖至少以 patch 级别跟进
}

```

## 6. Affected 策略

大型仓库中，全量执行耗时极长。CI 阶段必须采用精准打击模式。

**PR 拦截与合并策略：**

* **PR 检查**：仅校验当前变更及其直接受损的下游。
* 
```bash
pnpm turbo build --filter="...[origin/main]"
pnpm turbo test --filter="...[origin/main]"
```

* **发布主线**：在 `main` 分支发布前，执行一次包含兜底的全量构建，防止意外的全局破坏。
* **非幂等任务隔离**：类似 `publish`、`deploy` 必须真实执行，严禁配置 `outputs` 被缓存拦截。

## 7. 常见问题 (FAQ) 与高级避坑指南

### 7.1 为什么任务明明没变却没有命中缓存？

检查 `outputs` 是否声明正确、任务是否写入了未声明产物、环境变量是否变化、lockfile 是否变化、脚本是否包含时间戳或随机数。

### 7.2 为什么命中了缓存但产物不对？

通常是 `inputs` 或 `env` 声明过窄，导致影响产物的文件没有进入 hash。例如构建读取了根目录 `.env.production`，但缓存配置没有把它纳入输入。

### 7.3 是否所有任务都应该缓存？

不是。`build`、`test`、`typecheck` 通常适合缓存；`dev`、`preview`、`watch`、发布任务、部署任务不应该缓存。发布和部署必须真实执行，不能从缓存恢复。
