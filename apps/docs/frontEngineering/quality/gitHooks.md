# Git Hooks 与提交规范工具链

代码质量不能只靠「自觉」，需要在提交前「自动化把关」。Git Hooks 提供了在 Git 生命周期节点（提交前、提交时、推送前）执行脚本的钩子，配合 `husky`、`lint-staged`、`commitlint`，能自动完成 lint、格式化、提交信息校验。

**一句话理解**：**「Git Hooks 是『自动门卫』，husky 让它易管理，lint-staged 让它只查改动的文件，commitlint 让提交信息规范化。」**

## 1. Git Hooks 机制

Git 在每个仓库的 `.git/hooks/` 目录下内置了一系列钩子脚本，在特定事件触发时执行。

### 1.1 常见钩子分类

| 钩子            | 触发时机       | 常见用途           |
| --------------- | -------------- | ------------------ |
| `pre-commit`    | 提交前         | 运行 lint、格式化  |
| `commit-msg`    | 提交信息写入前 | 校验提交信息格式   |
| `pre-push`      | 推送到远程前   | 运行测试、安全检查 |
| `post-commit`   | 提交完成后     | 通知、记录         |
| `post-checkout` | 切换分支后     | 重建依赖           |
| `post-merge`    | 合并后         | 重新安装依赖       |

**痛点**：`.git/hooks/` 目录**不会被 Git 跟踪**，无法随仓库共享，团队协作时每个人都要手动配置。`husky` 解决了这个分发问题。

## 2. husky：可管理的 Git Hooks

`husky` 把钩子脚本抽到仓库根目录的 `.husky/` 下，纳入版本管理，团队 clone 后自动生效。

```bash
# 初始化 husky（husky v9 语法）
npx husky init
```

初始化后生成 `.husky/pre-commit` 等文件，内容就是普通的 shell 命令：

```bash
# .husky/pre-commit
pnpm lint-staged
```

`package.json` 中注册 `prepare` 脚本，让依赖安装后自动启用钩子：

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

### 2.1 添加自定义钩子

```bash
# 通过命令行快速创建钩子文件
npx husky add .husky/commit-msg "npx --no -- commitlint --edit \$1"
npx husky add .husky/pre-push "pnpm test"
```

### 2.2 husky v9 与旧版差异

| 版本     | 配置方式                       | 特点                            |
| -------- | ------------------------------ | ------------------------------- |
| husky v4 | `package.json` 里 `husky` 字段 | 配置集中，但需 `core.hooksPath` |
| husky v9 | `.husky/` 目录下的 shell 文件  | 零配置、更透明，推荐            |

## 3. lint-staged：只检查「改动过」的文件

对**整个项目**跑 lint 很慢，`lint-staged` 只对 `git add` 暂存区的文件执行命令，大幅提速：

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": ["eslint --fix", "prettier --write"],
    "*.{css,scss,md}": ["prettier --write"]
  }
}
```

### 3.1 支持数组命令与函数

```javascript
// lint-staged.config.js —— 复杂场景用 JS 配置
export default {
  '*.{js,ts,vue}': ['eslint --fix', 'prettier --write'],
  '*.{css,scss}': filenames => [
    `stylelint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],
}
```

### 3.2 配合 husky

```bash
# .husky/pre-commit
pnpm lint-staged
```

## 4. commitlint：规范提交信息

`commitlint` 校验提交信息是否符合约定（通常用 Conventional Commits 规范）：

```json
// .husky/commit-msg
npx --no -- commitlint --edit $1
```

配置文件 `commitlint.config.js`：

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
}
```

**Conventional Commits 格式**：

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | perf | test | build | ci | chore
```

| type       | 含义      | 示例                           |
| ---------- | --------- | ------------------------------ |
| `feat`     | 新功能    | `feat(login): 新增验证码登录`  |
| `fix`      | 缺陷修复  | `fix(cart): 修复数量计算错误`  |
| `docs`     | 文档      | `docs: 更新 README`            |
| `refactor` | 重构      | `refactor(user): 抽取公共方法` |
| `perf`     | 性能优化  | `perf(list): 虚拟列表优化`     |
| `chore`    | 杂项/依赖 | `chore: 升级依赖`              |

规范化的提交信息能自动生成 changelog、判断版本号（semver）、让 git 历史可读。

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

```text
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

## 8. 常见问题 (FAQ)

### 8.1 为什么我提交时钩子没生效？

检查 `.husky/` 目录是否已生成、`prepare` 脚本是否执行过（`npx husky` 或重新 `pnpm install`）。旧版 husky 还需要确认 `core.hooksPath` 指向 `.husky`。

### 8.2 如何临时跳过钩子？

```bash
git commit --no-verify   # 跳过 pre-commit 和 commit-msg
```

> 慎用，跳过校验可能把未通过 lint 的代码提交上去。

### 8.3 lint-staged 为什么快？

它只对**暂存区的文件**执行命令，而不是全项目扫描。改动 2 个文件就只查 2 个，时间与改动量成正比。

### 8.4 commitlint 和 commitizen 有什么区别？

- `commitlint`：**校验**提交信息是否规范（事后把关）。
- `commitizen`：**引导**你写出规范的提交信息（事前辅助）。
- 二者常搭配使用：commitizen 帮你写规范，commitlint 兜底拦截不规范。

### 8.5 CI 里已经跑 lint 了，还需要 Git Hooks 吗？

需要。Git Hooks 在**本地提交前**即时反馈，CI 是**推送后**的兜底。前者更快、更省 CI 资源；后者无法被绕过（`--no-verify` 能跳过本地钩子）。**本地 + CI 双层防线**才是完整方案。

## 9. 总结

- Git Hooks 是「自动门卫」，husky 让它随仓库共享。
- lint-staged 只查改动文件，commitlint 规范提交信息，commitizen 交互式生成。
- 标准组合：`husky + lint-staged + commitlint`，本地把关 + CI 兜底。
- 规范提交是自动 changelog、自动发版的基石。
