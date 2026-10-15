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

- **构建单包**：`pnpm --filter @acme/ui build`
- **构建单包及所有前置依赖**：`pnpm --filter @acme/ui... build`
- **构建受该包影响的所有下游**：`pnpm --filter ...@acme/utils build`
- **基于 Git 变更触发**：`pnpm --filter "...[origin/main]" test`

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
      "outputs": ["dist/**"] // 声明缓存产物路径
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false, // dev/watch 等长驻任务严禁缓存
      "persistent": true
    }
  }
}
```

[width(18,82)]

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

- **缓存失效排查**：如果“**明明没改代码却没命中缓存**”，请重点检查是否引入了未被追踪的环境变量、时间戳注入或全局 lockfile 的变动。

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

### 2.4 `turbo.json` 高频字段与常用 CLI

不同版本对根节点的命名不同：**Turborepo 1.x 用 `pipeline`，2.0 起更名为 `tasks`**。老配置升级后如果没有同步改名，任务定义会被静默忽略，表现为“**什么都没跑**”。

[width(26,74)]

| 字段                       | 作用                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `tasks`（旧称 `pipeline`） | 任务定义根节点，键名对应 `package.json` 中的脚本名。                               |
| `dependsOn`                | 任务依赖，`^build` 指上游依赖包、`build` 指同包前置任务、`$ENV` 表示环境变量变化。 |
| `inputs`                   | 参与缓存 hash 计算的源文件，默认只跟踪包内文件，跨目录输入需显式声明。             |
| `outputs`                  | 可缓存的产物路径，留空 `[]` 表示不落盘产物（如 lint）。                            |
| `cache`                    | 是否启用缓存，`false` 用于 dev / watch 等长驻或非幂等任务。                        |
| `persistent`               | 标记长驻进程（dev server），通常与 `cache: false` 搭配使用。                       |
| `env` / `globalEnv`        | 分别声明任务级与全局的环境变量，未声明的变量不会进入 hash。                        |
| `globalDependencies`       | 全局输入文件，如 `tsconfig.json`、`.env`，变更即让所有任务缓存失效。               |
| `passThroughEnv`           | 透传但不参与 hash 的环境变量，适合只影响日志、不影响产物的变量。                   |

常用 CLI 参数同样高频：

- **`--filter=@acme/ui`**：只跑指定包及匹配范围内的任务。
- **`--filter="...[origin/main]"`**：只跑受本次变更影响的任务，是 CI 精准构建的主力参数。
- **`--dry` / `--graph`**：不真正执行，先查看任务图与缓存命中情况，排查缓存问题必用。
- **`--force`**：忽略缓存，强制重新执行。
- **`--no-cache`**：本次运行既不读也不写缓存。
- **`--continue`**：某个任务失败后继续执行其余任务，适合 CI 一次性暴露全部错误。
- **`--summarize`**：输出本次运行摘要，便于在 CI 中归档排查。

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

[width(23,22,55)]

| 策略模式               | 版本特征                        | 适用场景与优劣                                                                                      |
| ---------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Fixed (强绑定)**     | 全局统一版本（如均是 `v2.0.0`） | 适合核心生态套件（如 React 全家桶）。**优点**：用户心智极简。**缺点**：小改动会导致无辜包被迫升级。 |
| **Independent (解耦)** | 各包独立版本                    | 适合中台 SDK、工具库集合。**优点**：爆炸半径极小。**缺点**：团队管理版本矩阵的复杂度高。            |
| **Linked (混合编队)**  | 强关联包同步升级，松散包独立    | 兼顾灵活性与秩序，是目前最受推崇的企业实践。                                                        |

## 5. 内部依赖更新转换

开发期使用 `workspace:*` 占位，发布时应配置工具自动将其转换为具体的 semver 版本。

```json
// .changeset/config.json
{
  "updateInternalDependencies": "patch" // 上游更新时，下游依赖至少以 patch 级别跟进
}
```

### 5.1 Changesets 高频命令与配置

Changesets 的工作流是“**先记录意图，再统一消费**”：开发者在 PR 中生成 changeset 文件，合并后在发布流程里消费。

[width(31,69)]

| 命令                            | 作用                                                          |
| ------------------------------- | ------------------------------------------------------------- |
| `pnpm changeset`                | 交互式选择受影响包与 bump 级别，生成待提交的 changeset 文件。 |
| `pnpm changeset status`         | 预览相对 `baseBranch` 的待发布版本，可在 CI 中直接做校验。    |
| `pnpm changeset version`        | 消费 changeset 文件，改写各包版本号并生成 CHANGELOG。         |
| `pnpm changeset publish`        | 将版本已变更且未发布的包推送到 registry，并打上 tag。         |
| `pnpm changeset pre enter beta` | 进入预发布模式，后续版本号带 `beta` 后缀；`pre exit` 退出。   |

`.changeset/config.json` 的高频字段：

[width(23,77)]

| 字段                         | 作用                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| `access`                     | 发布可见性，`restricted`（私有）或 `public`（公开包必填）。         |
| `baseBranch`                 | 主分支名，`changeset status` 以它为参照计算待发布内容。             |
| `updateInternalDependencies` | 内部依赖的更新粒度，`patch` 表示上游升级时下游至少跟进一个 patch。  |
| `fixed` / `linked`           | 声明固定版本组与联动版本组，分别对应第 4 节的 Fixed / Linked 策略。 |
| `ignore`                     | 让指定包不参与 `version` / `status`；注意它**不能阻止发布**。       |
| `privatePackages`            | 控制私有包是否参与 version 与发布流程。                             |
| `commit`                     | `changeset version` 之后是否自动提交改动。                          |

## 6. Affected 策略

大型仓库中，全量执行耗时极长。CI 阶段必须采用精准打击模式。

**PR 拦截与合并策略：**

- **PR 检查**：仅校验当前变更及其直接受损的下游。
-

```bash
pnpm turbo build --filter="...[origin/main]"
pnpm turbo test --filter="...[origin/main]"
```

- **发布主线**：在 `main` 分支发布前，执行一次包含兜底的全量构建，防止意外的全局破坏。
- **非幂等任务隔离**：类似 `publish`、`deploy` 必须真实执行，严禁配置 `outputs` 被缓存拦截。

### 6.1 高频落地场景

- **只构建受影响的包**：CI 中用 `--filter="...[origin/main]"` 把构建范围收缩到本次改动及其下游，仓库越大收益越明显。
- **上游升级后只重跑下游**：把 `dependsOn` 配成 `^build`，改了 `packages/utils` 只触发依赖它的包重建，未受影响的包直接吃缓存。
- **独立发版公共库**：工具库、SDK 采用 Independent 策略逐包 bump，一次改动只发布单个包，爆炸半径最小。
- **PR 预览环境精准构建**：按影响范围构建并部署预览，避免每个 PR 都全量跑一遍。
- **CI 与本地共享缓存**：接入远程缓存后，同一提交在本地构建过的产物，CI 可直接命中，反之亦然。
- **发布流水线校验变更集**：CI 中执行 `changeset status`，保证改动公共包时提交了对应的 changeset 文件。

## 7. 常见问题 (FAQ) 与高级避坑指南

### 7.1 为什么任务明明没变却没有命中缓存？

检查 `outputs` 是否声明正确、任务是否写入了未声明产物、环境变量是否变化、lockfile 是否变化、脚本是否包含时间戳或随机数。

### 7.2 为什么命中了缓存但产物不对？

通常是 `inputs` 或 `env` 声明过窄，导致影响产物的文件没有进入 hash。例如构建读取了根目录 `.env.production`，但缓存配置没有把它纳入输入。

### 7.3 是否所有任务都应该缓存？

不是。`build`、`test`、`typecheck` 通常适合缓存；`dev`、`preview`、`watch`、发布任务、部署任务不应该缓存。发布和部署必须真实执行，不能从缓存恢复。

### 7.4 `pipeline` 和 `tasks` 有什么区别？

`pipeline` 是 Turborepo 1.x 的写法，2.0 起统一更名为 `tasks`，二者语义一致。新项目直接用 `tasks` 即可；老仓库升级后如果没有同步改名，任务定义会被忽略，表现为“**什么都没跑**”。

### 7.5 `.changeset/config.json` 里的 `ignore` 能阻止包被发布吗？

不能。`ignore` 只在 `version` 和 `status` 阶段生效，`publish` 依然会尝试推送它。真正不想发布的包必须在该包的 `package.json` 中写 `"private": true`。

### 7.6 公共库怎么做独立发版？

把发版策略设为 Independent，让每个包维护自己的版本号，再配合 `changeset` 逐包记录 bump 级别。强关联的包可以用 config 中的 `fixed` / `linked` 成组联动，兼顾灵活与秩序。

### 7.7 预发布版本（beta / rc）怎么发？

先用 `pnpm changeset pre enter beta` 进入预发布模式，此后的 `changeset version` 会产出带 `beta` 后缀的版本号；发布完成后执行 `pnpm changeset pre exit` 退出预发布模式。
