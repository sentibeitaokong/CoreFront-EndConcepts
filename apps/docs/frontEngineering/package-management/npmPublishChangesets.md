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

---

## 2. package.json 核心发布字段

```json
{
  "name": "@acme/button",
  "version": "1.2.3",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./style.css": "./dist/style.css"
  },
  "sideEffects": ["**/*.css"],
  "publishConfig": { "access": "public" },
  "scripts": { "prepublishOnly": "pnpm test && pnpm build" }
}
```

| 字段                 | 核心作用与避坑指南                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **`files`**          | 上传白名单。只填需要发布的目录（如 `dist`），极大减少包体积。                                  |
| **`exports`**        | 现代包入口路由。未在此处声明的路径，外部业务代码严格禁止 `import`。                            |
| **`types`**          | TypeScript 声明文件入口，缺失会导致调用方无代码提示。                                          |
| **`sideEffects`**    | 影响打包器 Tree Shaking。若包含独立 CSS 文件，**绝不能**粗暴设为 `false`，需填入样式文件路径。 |
| **`prepublishOnly`** | 真正发布前执行，适合作为最后防线。                                                             |

## 3. SemVer 语义化版本与 dist-tag 策略

版本号格式：`MAJOR.MINOR.PATCH`。

| 版本级别         | 触发场景                                                 | 示例           |
| ---------------- | -------------------------------------------------------- | -------------- |
| **`major`**      | 破坏性变更，不向下兼容旧 API（如删除属性、改默认行为）。 | `2.0.0`        |
| **`minor`**      | 向下兼容的新能力（如新增组件、新增可选参数）。           | `1.3.0`        |
| **`patch`**      | 向下兼容的问题修复（如修复样式、处理边界 Bug）。         | `1.2.4`        |
| **`prerelease`** | 灰度与内测版本。通常配合特定 `tag` 使用。                | `1.3.0-beta.0` |

### 3.1 流量路由：dist-tag 策略

`dist-tag` 决定了用户执行 `npm install` 时默认拉取哪个版本。

| tag      | 用途               |
| -------- | ------------------ |
| `latest` | 默认稳定版本       |
| `beta`   | 外部或内部试用版本 |
| `alpha`  | 更早期的实验版本   |
| `next`   | 下一代大版本预览   |

- **常规发布**：默认打上 `latest` 标签。
- **内测发布**：`npm publish --tag beta`（用户需显式执行 `pnpm add pkg@beta` 安装）。
- **版本提升**：若 beta 测试稳定，直接执行 `npm dist-tag add @acme/button@1.3.0 latest` 提升标签，而非重新打包发布。

## 4. Changesets 核心机制与开发流

**解决痛点**：在 Monorepo 中，手动维护互相依赖的多包版本号极易冲突且无法生成可靠的 Changelog。`Changesets` 将版本计算推迟到发布前夕。

### 4.1 初始化Changesets

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

**初始化后会生成：**

```txt
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

## 5. Monorepo 版本拓扑策略

在 `.changeset/config.json` 中，可根据业务形态定义包的连动策略：

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
