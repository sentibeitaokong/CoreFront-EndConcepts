# npm 包发布与 Changesets 工程化

**核心本质**：发布 npm 包不仅仅是执行 `npm publish`。在企业级工程中，它是一套涵盖版本号管理、变更记录（Changelog）、构建产物过滤、入口配置、Monorepo 多包联动以及回滚策略的完整标准体系。

**解决目标**：告别手动修改版本号引起的冲突与混乱，实现自动化、规范化、可追溯的包发布流水线。

## 1. 发布前置检查清单

高质量的 npm 包在发布前必须满足以下基准要求：

- **基础元信息**：明确的 `name`、`version`、`description`、`license`(开源许可证)。
- **入口与产物**：正确配置 `exports`、`main`、`module`、`types`，并通过 `files` 字段设置白名单拦截垃圾文件。
- **依赖声明**：严格区分 `dependencies`（运行时必须）、`peerDependencies`（宿主环境提供）与 `devDependencies`（开发期使用）。
- **安全与控制**：私有包务必配置 `publishConfig.access = "restricted"` 和正确的 `registry`。
- **自动化防线**：在 `prepublishOnly` 钩子中强制执行测试与构建。

## 2. package.json 核心发布字段

```json
{
  "name": "@acme/button", // 包名带 scope，配合私有源使用
  "version": "1.2.3", // 由 Changesets 统一计算并改写，不要手改
  "type": "module", // 让 Node 把 .js 按 ESM 解析
  "files": ["dist"], // 上传白名单：只发产物，源码与测试不进包
  "main": "./dist/index.cjs", // 老工具与 Node 的兜底入口（CJS）
  "module": "./dist/index.mjs", // 打包工具的 ESM 入口，非官方规范，Node 不认
  "types": "./dist/index.d.ts", // 类型声明入口，缺了调用方就没有提示
  "exports": {
    ".": {
      "types": "./dist/index.d.ts", // 条件顺序敏感，types 必须排第一
      "import": "./dist/index.mjs", // ESM 使用者走这里
      "require": "./dist/index.cjs" // CJS 使用者走这里
    },
    "./style.css": "./dist/style.css" // 显式放行的子路径，未声明的外部一律 import 不到
  },
  "sideEffects": ["**/*.css"], // 含独立 CSS 时不能写 false，否则样式会被摇掉
  "publishConfig": { "access": "public" }, // scope 包默认私有，公开发布要显式声明
  "scripts": { "prepublishOnly": "pnpm test && pnpm build" } // 发布前最后一道防线
}
```

## 3. SemVer 语义化版本与 dist-tag 策略

版本号格式：`MAJOR.MINOR.PATCH`。

[width(18,61,21)]

| 版本级别         | 触发场景                                                 | 示例           |
| ---------------- | -------------------------------------------------------- | -------------- |
| **`major`**      | 破坏性变更，不向下兼容旧 API（如删除属性、改默认行为）。 | `2.0.0`        |
| **`minor`**      | 向下兼容的新能力（如新增组件、新增可选参数）。           | `1.3.0`        |
| **`patch`**      | 向下兼容的问题修复（如修复样式、处理边界 Bug）。         | `1.2.4`        |
| **`prerelease`** | 灰度与内测版本。通常配合特定 `tag` 使用。                | `1.3.0-beta.0` |

### 3.1 流量路由：dist-tag 策略

`dist-tag` 决定了用户执行 `npm install` 时默认拉取哪个版本。

[width(13,22,65)]

| tag      | 用途               | 发布与提升                                                                                                                           |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `latest` | 默认稳定版本       | `npm publish`（不传 `--tag`，默认就打上 `latest`）                                                                                   |
| `beta`   | 外部或内部试用版本 | `npm publish --tag beta`，用户需显式 `pnpm add pkg@beta`；测稳后 `npm dist-tag add @acme/button@1.3.0 latest` 直接提升，不必重新发布 |
| `alpha`  | 更早期的实验版本   | `npm publish --tag alpha`                                                                                                            |
| `next`   | 下一代大版本预览   | `npm publish --tag next`                                                                                                             |

### 3.2 `npm publish` 的高频参数

[width(20,44,36)]

| 参数              | 作用                                             | 场景                                |
| ----------------- | ------------------------------------------------ | ----------------------------------- |
| `--access public` | 发布 scoped 包（`@scope/name`）时声明为公开      | 首次发布开源的 scoped 包            |
| `--tag beta`      | 指定 dist-tag，不占用 `latest`                   | 预发、灰度、内测                    |
| `--dry-run`       | 只打印将要发布的文件与结果，不真正上传           | 检查 `files` 白名单是否漏打包       |
| `--otp <code>`    | 传入双因素认证的一次性验证码                     | 账号开了 2FA，在 CI 外手动发布      |
| `--provenance`    | 生成并上传构建来源证明（需 CI 与 npm 9.5+ 支持） | 提升供应链安全，配合 GitHub Actions |

## 4. Changesets 核心机制与开发流

**解决痛点**：在 Monorepo 中，手动维护互相依赖的多包版本号极易冲突且无法生成可靠的 Changelog。`Changesets` 将版本计算推迟到发布前夕。

### 4.1 初始化Changesets

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

**初始化后会生成：**

```markdown
.changeset/
config.json
```

**典型配置：**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- **`access`：** 发布包的默认可见性，`public` 为公开、`restricted` 为私有，等价于命令行加 `npm publish --access public`。
- **`baseBranch`：** 主分支名，Changesets 用它比对变更、生成版本 PR 的目标基线。
- **`updateInternalDependencies`：** 当内部包被升版时，依赖它的兄弟包版本号自动更新的粒度（通常 `patch`）。
- **`ignore`：** 声明不参与发布的包名数组；注意它只影响版本计算，真正阻止误发还必须给该包设置 `"private": true`。
- **`commit`：** 是否让 `changeset version` 自动提交；流程交给 CI 时通常保持 `false`。

### 4.2 写入变更集 (PR 阶段)

开发完成时执行 `pnpm changeset`，通过交互式命令行生成 Markdown 意图文件，将其与代码一同提交入库。

```md
---
'@acme/button': minor
'@acme/theme': patch
---

Add loading state for Button and fix theme token fallback.
```

### 4.3 统一计算版本 (发布前夕)

执行 `pnpm changeset version`。工具会自动消耗掉所有的意图文件，集中更新相关包的 `version` 和内部依赖，并自动生成 `CHANGELOG.md`。

### 4.4 构建并发布 (出库阶段)

依次执行构建和发布命令，将版本发生变化的包推送到远程仓库。

```bash
pnpm -r build
pnpm changeset publish
```

### 4.5 预发布（Prerelease）模式

需要连续发多个 beta 版本时，逐个手动改版本号既繁琐又易错，Changesets 提供了进入预发布模式的能力：

```bash
pnpm changeset pre enter beta   # 进入 beta 预发布模式
pnpm changeset version          # 版本号自动变成 1.3.0-beta.0、1.3.0-beta.1 ...
pnpm changeset publish --tag beta
pnpm changeset pre exit         # 发布正式版前退出预发布模式
```

- **自动递增序号：** 进入模式后，每次 `changeset version` 都会在 prerelease 号上自增，无需手写。
- **`changeset status`：** 在 CI 或本地查看“**当前有哪些待发布的变更**”，用于判断是否需要升版。
- **退出后归位：** `pre exit` 后再执行一次 `version`，即可把版本提升为正式版并打回 `latest`。

## 5. Monorepo 版本拓扑策略

在 `.changeset/config.json` 中，可根据业务形态定义包的连动策略：

[width(12,53,35)]

| 策略            | 表现形式                                                                                       | 适用场景                                           |
| --------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Independent** | 各包独立升版。                                                                                 | 工具库、SDK、松耦合的多包项目。                    |
| **Fixed**       | 所有包强制保持同一版本号。<br/>`"fixed": [["@acme/*"]]`                                        | 生态强绑定组件库（如核心包、图标、主题同步发版）。 |
| **Linked**      | 发生发布的包保持版本一致，未变更的包不发布。<br/>`"linked": [["@acme/button", "@acme/theme"]]` | 存在业务耦合，但不需全体绑架发布的业务线基建包。   |

## 6. 自动化部署 (GitHub Actions)

借助 `@changesets/action`，可在 `main` 分支上自动创建 Version PR，合并该 PR 后自动触发 NPM 发布。

```yaml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm -r test
      - run: pnpm -r build

      - name: Version or publish
        uses: changesets/action@v1
        with:
          publish: pnpm changeset publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 7. 事故处理与回滚策略

> **架构师铁律**：npm 对包的删除与重发有严格限制（同一版本号终身不可复用）。永远不要试图 `unpublish` 撤回问题版本，正确做法是**向前修正**。

### 7.1 立刻切回 dist-tag

```bash
npm dist-tag add @acme/button@1.2.2 latest
```

让默认安装重新指向上一个稳定版本。

### 7.2 标记问题版本废弃

```bash
npm deprecate @acme/button@1.2.3 "This version contains a regression. Please upgrade to 1.2.4."
```

### 7.3 发布修复版本

```bash
pnpm changeset
pnpm changeset version
pnpm -r build
pnpm changeset publish
```

不要尝试删除后重发同版本。npm 对删除和重发都有严格限制，企业内网 registry 也应遵守不可变版本原则。

## 8. 常见问题 (FAQ)

### 8.1 `pnpm changeset` 和 `changeset version` 分别在什么时候执行？

`changeset` 在开发/提 PR 阶段执行，生成一个描述“**这次改了哪个包、是 major/minor/patch**”的 Markdown 意图文件，需与代码一起提交；`changeset version` 在发布前夕执行，统一消耗这些意图文件、批量改写 `version` 和内部依赖、生成 `CHANGELOG.md`。前者只记录意图，后者才真正动版本号。

### 8.2 为什么 `npm publish` 报 `EPRIVATE` 或提示需要付费？

scoped 包（`@scope/name`）默认按私有发布，而 npm 的私有包是收费的。开源或免费发布需显式声明公开：命令加 `--access public`，或在 `package.json` 里写 `"publishConfig": { "access": "public" }`。

### 8.3 我明明配置了 `ignore`，为什么包还是被发布了？

`.changeset/config.json` 的 `ignore` 只影响版本计算与 `changeset status`，并不能阻止 `npm publish`。要让一个包彻底不可发布，必须在它的 `package.json` 里设置 `"private": true`，否则批量发布时仍会被推上去。

### 8.4 发错了版本，可以 `npm unpublish` 撤回吗？

不建议。npm 对删除有严格的时间与次数限制（发布超过 72 小时或已被他人依赖后基本无法删除），且同一版本号终身不可复用。正确做法是向前修正：用 `npm deprecate` 标记问题版本，再发布一个修复的 patch 版本。

### 8.5 怎么确认 `files` 白名单没有漏打包文件？

发布前用 `npm publish --dry-run` 预览本次会包含哪些文件，它会列出 tarball 内容而不真正上传。`files` 是白名单，未匹配的目录（如 `src`、测试）会被自动排除，但 `README`、`LICENSE`、`package.json` 等始终包含。

### 8.6 Monorepo 里只想发布某一个包，该怎么做？

Changesets 以“**有变更意图 + 版本被提升**”为准，不会无差别发布所有包。若只想动单个包，用 `pnpm changeset` 时只勾选该包；发布时 `changeset publish` 也只会推送版本号发生变化的包。对外部依赖它的兄弟包，按 `updateInternalDependencies` 策略决定是否连带升版。
