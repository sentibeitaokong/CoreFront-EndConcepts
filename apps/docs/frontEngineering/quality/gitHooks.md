# Git Hooks 与提交规范工具链

代码质量不能只靠「自觉」，需要在提交前「自动化把关」。Git Hooks 提供了在 Git 生命周期节点（提交前、提交时、推送前）执行脚本的钩子，配合 `husky`、`lint-staged`、`commitlint`，能自动完成 lint、格式化、提交信息校验。

**一句话理解**：**「Git Hooks 是『自动门卫』，husky 让它易管理，lint-staged 让它只查改动的文件，commitlint 让提交信息规范化。」**

## 1. Git Hooks 机制

Git 在每个仓库的 `.git/hooks/` 目录下内置了一系列钩子脚本，在特定事件触发时执行。

### 1.1 常见钩子分类

[width(26,26,48)]

| 钩子                 | 触发时机             | 常见用途             |
| -------------------- | -------------------- | -------------------- |
| `pre-commit`         | 提交前               | 运行 lint、格式化    |
| `commit-msg`         | 提交信息写入前       | 校验提交信息格式     |
| `pre-push`           | 推送到远程前         | 运行测试、安全检查   |
| `post-commit`        | 提交完成后           | 通知、记录           |
| `prepare-commit-msg` | 提交信息编辑器打开前 | 预填模板、追加分支号 |
| `post-checkout`      | 切换分支后           | 重建依赖             |
| `post-merge`         | 合并后               | 重新安装依赖         |
| `pre-rebase`         | 变基操作前           | 阻止对已推送分支变基 |

**痛点**：`.git/hooks/` 目录**不会被 Git 跟踪**，无法随仓库共享，团队协作时每个人都要手动配置。`husky` 解决了这个分发问题。

### 1.2 客户端钩子与服务端钩子

按执行位置，钩子分为两类，理解这一区分是排查“**为什么本地没拦住**”的关键：

- **客户端钩子 (Client-side)**：在开发者本机执行。常见的有 `pre-commit`、`commit-msg`、`prepare-commit-msg`、`pre-push`、`pre-rebase`、`post-merge`、`post-checkout`。它们只受本机控制，因此可以用 `git commit --no-verify` 或 `git push --no-verify` 跳过。
- **服务端钩子 (Server-side)**：在远端仓库执行，不随仓库分发，需在 Git 服务端（如 GitLab、Gitea 的 hooks 目录）配置。常见的有 `pre-receive`、`update`、`post-receive`，它们**无法被客户端绕过**，常用于最终的质量闸门。

`--no-verify` 只对客户端钩子生效：`git commit --no-verify` 跳过 `pre-commit` 与 `commit-msg`，`git push --no-verify` 跳过 `pre-push`，但对服务端钩子无能为力。因此真正严格的红线应放在 CI 或服务端钩子上。

## 2. husky：可管理的 Git Hooks

`husky` 把钩子脚本抽到仓库根目录的 `.husky/` 下，纳入版本管理，团队 clone 后自动生效。

先安装核心工具：

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional
```

初始化 husky（husky v9 语法）：

```bash
npx husky init
```

初始化后生成 `.husky/pre-commit` 等文件，内容就是普通的 shell 命令：

:::code-group

```bash [.husky/pre-commit]
pnpm lint-staged
```

:::

`package.json` 中注册 `prepare` 脚本，让依赖安装后自动启用钩子（v9 写 `husky`，v8 才是 `husky install`）：

:::code-group

```json [package.json]
{
  "scripts": {
    "prepare": "husky"
  }
}
```

:::

### 2.1 添加自定义钩子

husky v9 移除了 `husky add` 命令，直接创建文件即可，文件内容就是普通的 shell 命令：

```bash
# 校验提交信息
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
# 推送前跑单测
echo 'pnpm test' > .husky/pre-push
```

### 2.2 husky v9 与旧版差异

[width(13,35,52)]

| 版本     | 配置方式                       | 特点                            |
| -------- | ------------------------------ | ------------------------------- |
| husky v4 | `package.json` 里 `husky` 字段 | 配置集中，但需 `core.hooksPath` |
| husky v9 | `.husky/` 目录下的 shell 文件  | 零配置、更透明，推荐            |

## 3. lint-staged：只检查「改动过」的文件

对**整个项目**跑 lint 很慢，`lint-staged` 只对 `git add` 暂存区的文件执行命令，大幅提速：

```json
{
  "lint-staged": {
    "*.{js,ts,vue,tsx,jsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss,less,html,md}": ["prettier --write"]
  }
}
```

> 不要在命令里写 `eslint . --fix`。`lint-staged` 会把暂存文件列表追加到命令末尾，`.` 会让 ESLint 扫描整个项目，完全失去增量检查的意义；写 `eslint --fix` 即可。

### 3.1 支持数组命令与函数

:::code-group

```javascript [lint-staged.config.js]
export default {
  '*.{js,ts,vue}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss}': filenames => [
    `stylelint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],
}
```

:::

### 3.2 配合 husky

:::code-group

```bash [.husky/pre-commit]
pnpm lint-staged
```

:::

### 3.3 高频 CLI 参数与配置项

[width(24,46,30)]

| 参数/配置          | 作用                                              | 典型场景                   |
| ------------------ | ------------------------------------------------- | -------------------------- |
| `--concurrent <n>` | 并发执行的子任务数量，默认取 CPU 核数             | 大仓库上控制内存占用       |
| `--no-stash`       | 关闭自动 stash 未暂存改动，避免隐式副作用         | 频繁遇到未暂存改动被还原时 |
| `--diff <range>`   | 只对与指定分支/提交有差异的文件执行，而非仅暂存区 | CI 中校验整个 PR 的改动    |
| `--relative`       | 传给命令的文件名使用相对于当前目录的路径          | 命令对绝对路径敏感时       |
| `--allow-empty`    | 即使没有匹配文件也返回 0，不阻断提交              | 暂存区恰好没有匹配的文件   |

## 4. commitlint：规范提交信息

`commitlint` 校验提交信息是否符合约定（通常用 Conventional Commits 规范）。

:::code-group

```bash [.husky/commit-msg]
npx --no -- commitlint --edit "$1"
```

:::

配置文件 `commitlint.config.js`（按项目模块类型也可用 `.cjs` / `.mjs`）：

:::code-group

```javascript [commitlint.config.js]
export default {
  // 继承官方推荐的 Angular 团队提交规范
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档修改
        'style', // 代码格式修改（不影响逻辑）
        'refactor', // 重构（既不修复 bug 也不增加新功能）
        'perf', // 性能优化
        'test', // 增加测试
        'build', // 打包产物修改
        'ci', // CI 配置变动
        'chore', // 构建过程或辅助工具变动
        'revert', // 回滚某个 commit
      ],
    ],
    'subject-case': [0], // 允许 subject 使用大写或小写（不强制限制）
  },
}
```

:::

**Conventional Commits 格式**：

```markdown
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert
```

[width(16,14,70)]

| type       | 含义      | 示例                           |
| ---------- | --------- | ------------------------------ |
| `feat`     | 新功能    | `feat(login): 新增验证码登录`  |
| `fix`      | 缺陷修复  | `fix(cart): 修复数量计算错误`  |
| `docs`     | 文档      | `docs: 更新 README`            |
| `style`    | 格式调整  | `style: 统一缩进`              |
| `refactor` | 重构      | `refactor(user): 抽取公共方法` |
| `perf`     | 性能优化  | `perf(list): 虚拟列表优化`     |
| `test`     | 测试      | `test: 补充登录单测`           |
| `build`    | 构建/产物 | `build: 调整打包入口`          |
| `ci`       | 持续集成  | `ci: 增加缓存步骤`             |
| `chore`    | 杂项/依赖 | `chore: 升级依赖`              |
| `revert`   | 回滚      | `revert: 回滚 3a1f2c0`         |

## 5. commitizen：交互式生成提交信息

手动记 type 容易忘，`commitizen` 提供交互式命令行，引导你填出规范提交：

```bash
pnpm add -D commitizen cz-conventional-changelog
```

```json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  },
  "scripts": {
    "commit": "cz"
  }
}
```

```bash
pnpm commit   # 进入交互式选择 type、scope、subject
```

## 6. 自动生成 changelog 与版本号

配合 `standard-version` 或 `conventional-changelog`，能从规范的提交历史自动生成 changelog 并提升版本号：

```json
{
  "scripts": {
    "release": "standard-version"
  }
}
```

```bash
pnpm release   # 自动：升版本号 → 生成 CHANGELOG.md → 打 tag
```

版本号判定规则（semver）：`feat` → 次版本 +1，`fix` → 补丁版本 +1，`BREAKING CHANGE` → 主版本 +1。

## 7. 完整工具链协同

```markdown
git commit
→ pre-commit 钩子触发
→ lint-staged 对暂存文件执行 eslint --fix + prettier
→ 生成提交信息（commitizen 交互式）
→ commit-msg 钩子触发
→ commitlint 校验格式
→ 提交成功
→（发布时）standard-version 生成 changelog + 版本号
```

```bash
# 常用组合安装
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional commitizen cz-conventional-changelog standard-version
```

### 7.1 高频落地场景

- **提交前只 lint 改动文件**：`pre-commit` 挂 `lint-staged`，配置 `*.{js,ts,vue}` 跑 `eslint --fix` + `prettier --write`，项目再大也只处理暂存区，耗时与改动量成正比。
- **提交信息规范校验**：`commit-msg` 挂 `commitlint --edit $1`，强制 `feat/fix/docs` 前缀，配合 `standard-version` 或 Changesets 自动生成 Changelog 与版本号。
- **推送前跑单测**：`pre-push` 挂 `pnpm test`，把明显失败的用例拦在本地，避免污染远端 CI 队列、浪费流水线额度。
- **切换分支 / 合并后重装依赖**：`post-checkout`、`post-merge` 里判断 `pnpm-lock.yaml` 是否变化，变了才执行 `pnpm install`，避免依赖与代码不匹配。
- **预处理提交信息**：`prepare-commit-msg`预填模板或自动追加分支号(如`JIRA-123`),让提交历史结构统一。
- **保护主干**：`pre-rebase` 阻止对已推送分支执行变基，避免把团队共享的提交历史改写掉。

### 7.2 实战演练与验证

[width(17,44,39)]

| 测试场景              | 操作                                                                        | 预期结果                                                              |
| :-------------------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| ❌ 错误的代码风格     | 故意声明一个未使用变量，`git add .` 后执行 `git commit -m "feat: add test"` | Husky 拦截提交，终端提示 ESLint 报错，**提交失败**                    |
| ❌ 错误的提交信息     | 修复代码并重新暂存，执行 `git commit -m "随便改了一点代码"`                 | `commitlint` 提示缺少合法的类型前缀（如 `feat`、`fix`），**提交失败** |
| ✅ 完全符合规范的提交 | 执行 `git commit -m "feat: 增加用户登录接口"`                               | `lint-staged` 与 `commitlint` 均通过，成功生成 Commit 记录            |

## 8. 常见问题 (FAQ)

### 8.1 为什么我提交时钩子没生效？

检查 `.husky/` 目录是否已生成、`prepare` 脚本是否执行过（重新 `pnpm install`，或手动跑 `npx husky`）。v9 的 `prepare` 写 `"husky"`，v8 才是 `"husky install"`；旧版还需要确认 `core.hooksPath` 指向 `.husky`。同事 clone 后完全不触发，基本就是 `prepare` 没跑或 `.husky/` 没生成。

### 8.2 如何临时跳过钩子？

```bash
git commit -m "fix: emergency hotfix" --no-verify
```

> 这是应急「后门」：`--no-verify` 会跳过 `pre-commit` 与 `commit-msg` 等客户端钩子，团队应严格限制使用，仅用于线上救火且已确认代码不会引起二次故障的场景。

### 8.3 lint-staged 为什么快？

它只对**暂存区的文件**执行命令，而不是全项目扫描。改动 2 个文件就只查 2 个，时间与改动量成正比。注意命令里不要写 `.`（如 `eslint . --fix`），否则会把全项目重新拖进来。

### 8.4 commitlint 和 commitizen 有什么区别？

- `commitlint`：**校验**提交信息是否规范（事后把关）。
- `commitizen`：**引导**你写出规范的提交信息（事前辅助）。
- 二者常搭配使用：commitizen 帮你写规范，commitlint 兜底拦截不规范。

### 8.5 CI 里已经跑 lint 了，还需要 Git Hooks 吗？

需要。Git Hooks 在**本地提交前**即时反馈，CI 是**推送后**的兜底。前者更快、更省 CI 资源；后者无法被绕过（`--no-verify` 能跳过本地钩子）。**本地 + CI 双层防线**才是完整方案。

### 8.6 为什么我用了 `--no-verify`，某个检查还是把提交拦下了？

`--no-verify` 只能跳过**客户端**钩子（`pre-commit`、`commit-msg`、`pre-push`）。如果拦截发生在推送之后（例如服务端的 `pre-receive`、`update` 钩子，或 CI 流水线），本地参数完全无效。判断拦截来源很简单：报错由本地终端输出，就是客户端钩子；由远端返回，就是服务端或 CI。

### 8.7 lint-staged 失败后，我未 `git add` 的改动不见了？

`lint-staged` 默认会把未暂存的改动临时 `git stash` 起来，只让工具看到暂存区内容，跑完再自动恢复。若中途异常退出（如被 `Ctrl+C` 打断），stash 可能没来得及恢复。用 `git stash list` 找到对应记录后 `git stash pop` 即可；若频繁遇到，可加 `--no-stash` 关闭这一行为（代价是工具会看到工作区的全部改动）。

### 8.8 团队规范的“**红线**”应该放在本地钩子还是 CI？

本地钩子是**提速工具**，不是**强制手段**——任何人一个 `--no-verify` 就能绕过。合理的分工是：本地放快速反馈类检查（格式化、改动文件 lint、提交信息格式），CI 或服务端钩子放不可绕过的红线（全量测试、类型检查、构建成功）。两者职责不同，不能互相替代。
