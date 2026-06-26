---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 代码规范与提交拦截

## 1. 核心概念与特性

在多人协作的企业级前端项目中，**“靠开发者的个人自觉来维持代码质量”是被无数次证明完全不可行的**。每个人都有自己的编码习惯（缩进、引号、命名），这会导致代码库风格割裂，极易引发 Bug，且 Git 历史记录杂乱无章。

为了解决这一痛点，我们必须引入一套**强制性的自动化约束工具链**，将规范物理落地。

| 核心工具        | 核心职责与特性                                                                                   | 在工作流中的作用                               |
| :-------------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **ESLint**      | **语法警察（管逻辑与质量）**。检查代码中潜在的 Bug，如使用了未定义的变量、危险的隐式类型转换等。 | 保证代码能够安全、正确地运行。                 |
| **Prettier**    | **颜值独裁者（管格式与排版）**。强制统一代码的外观，如缩进空格数、单双引号、每行最大长度等。     | 终结团队内部关于代码风格的“圣战”。             |
| **Husky**       | **门神（Git Hooks 管理器）**。拦截 Git 原生的生命周期事件（如 `git commit`、`git push`）。       | 确保在烂代码入库前进行物理拦截。               |
| **lint-staged** | **局部检查优化器**。只对被 Git 标记为“暂存区 (Staged)”的变动文件运行检查。                       | 极大提升检查速度，避免全量检查旧的烂代码。     |
| **Commitlint**  | **提交记录审查员**。强制校验 `git commit -m` 填写的消息是否符合特定格式。                        | 保证提交日志清晰可读，方便自动生成 Changelog。 |

## 2. 代码规范工程化 (ESLint & Prettier)

### 2.1 职责划分与冲突解决

新手最容易踩的坑就是把 ESLint 和 Prettier 混为一谈。

- 早期的 ESLint 既管逻辑（规则名通常带有 `no-`），也管排版（如 `quotes`, `semi`）。
- 当你引入更专业的 Prettier 时，**两者对排版的要求可能会打架，导致满屏红线**。

**终极解法**：安装 `eslint-config-prettier` 插件。它的唯一作用就是**暴力关闭所有可能与 Prettier 发生冲突的 ESLint 排版规则**，实现“逻辑归 ESLint，颜值归 Prettier”。

### 2.2 核心配置文件示例

**1. ESLint 配置 (`.eslintrc.js`)**

```js
module.exports = {
  env: { browser: true, es2021: true, node: true },
  // 继承推荐规范，注意 prettier 必须放在数组最后一位！
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // 如果是 Vue 项目
    'prettier', // 覆盖并关闭前面的冲突规则
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    // 你可以在这里自定义覆盖业务逻辑规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn',
    eqeqeq: 'error', // 强制使用 === 和 !==
  },
}
```

**2. Prettier 配置 (`.prettierrc.js`)**

```js
module.exports = {
  printWidth: 80, // 单行代码字符数限制
  tabWidth: 2, // 缩进空格数
  useTabs: false, // 坚决不用 Tab，统一用空格
  semi: true, // 语句末尾强制加分号
  singleQuote: true, // 强制使用单引号
  trailingComma: 'none', // 对象/数组末尾不加多余的逗号
  arrowParens: 'avoid', // 箭头函数单参数时省略括号 x => x
}
```

## 3. Git 提交规范与自动化拦截实战 (Husky & Commitlint)

### 3.1 安装核心依赖

在项目的根目录执行以下命令，一次性安装这三个工具及其预设规范：

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

```

### 3.2 配置 Commitlint (提交信息规范)

`commitlint` 需要一个配置文件来知道什么是“合法的提交格式”。在根目录创建一个名为 `commitlint.config.js` 的文件（或者 `.cjs`, `.mjs`，取决于你的项目类型）：

```javascript
// commitlint.config.js
module.exports = {
  // 继承官方推荐的 Angular 团队提交规范
  extends: ['@commitlint/config-conventional'],
  // 你可以在这里自定义规则，比如强制使用特定前缀，或修改最大长度
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
        'chore', // 构建过程或辅助工具变动
        'revert', // 回滚某个 commit
        'build', // 打包产物修改
      ],
    ],
    'subject-case': [0], // 允许 subject 使用大写或小写（不强制限制）
  },
}
```

### 3.3 配置 lint-staged (局部校验)

如果每次提交都全量扫描整个项目的 ESLint，随着项目变大，提交会变得极其缓慢。`lint-staged` 的作用是**只扫描本次 Git 暂存区（Staged）里被修改过的文件**。

在根目录的 `package.json` 中添加以下配置：

```json
{
  // ... 其他配置
  "lint-staged": {
    "*.{js,ts,vue,tsx,jsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss,less,html,md}": ["prettier --write"]
  }
}
```

### 3.4 初始化 Husky 并植入 Git Hooks

Husky v9 提供了一键初始化的命令。在终端执行：

```bash
npx husky init

```

这条命令会自动做三件事：

- 在项目根目录创建一个 `.husky` 文件夹。
- 在 `package.json` 的 `scripts` 里自动添加一条 `"prepare": "husky"`（确保团队其他人 `pnpm install` 后自动启用 Husky）。
- 自动生成一个默认的 `.husky/pre-commit` 文件。

### 3.5 挂载钩子逻辑 (Hook 核心)

我们需要修改 Husky 监听到的动作。

#### 配置 `pre-commit` (提交前校验代码)

打开 `.husky/pre-commit` 文件，将其内容修改为触发 `lint-staged`：

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 提交前执行 lint-staged 拦截
npx lint-staged

```

#### 创建 `commit-msg` (校验提交信息)

在终端执行以下命令，创建一个监听 commit message 的钩子：

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg

```

_(如果你用的是 Windows，直接在 `.husky` 文件夹下手动新建一个没有后缀名的 `commit-msg` 文件，并把 `npx --no -- commitlint --edit $1` 粘贴进去即可。)_

### 3.6 实战演练与验证

现在，你的本地卡点流水线已经搭建完毕。我们来测试一下：

#### ❌ 测试 1：错误的代码风格

- 故意写一段报错的 TypeScript 代码（比如声明了未使用变量）。
- 执行 `git add .` 和 `git commit -m "feat: add test"`。
- **预期结果**：Husky 拦截提交，终端飘红，提示 ESLint 报错，**提交失败**。

#### ❌ 测试 2：错误的提交信息

- 修复代码错误，重新 `git add .`。
- 执行 `git commit -m "随便改了一点代码"`。
- **预期结果**：Husky 触发 `commitlint`，提示缺少合法的类型前缀（如 feat, fix 等），**提交失败**。

#### ✅ 测试 3：完全符合规范的提交

- 执行 `git commit -m "feat: 增加用户登录接口"`。
- **预期结果**：`lint-staged` 检查代码通过，`commitlint` 检查信息前缀规范通过，成功生成 Commit 记录。

### 3.7 **工作流原理解析**

- 开发者执行 `git commit -m "feat: 新增登录弹窗"`。
- **Husky 的 `pre-commit` 钩子触发** -> 唤起 `lint-staged`。
- `lint-staged` 找出你刚刚修改过的 `.vue` 和 `.js` 文件，挨个执行 ESLint 和 Prettier。如果报错，**提交被强行阻断**。
- 如果代码没问题，**Husky 的 `commit-msg` 钩子触发** -> 唤起 `commitlint` 检查你的提交信息文本。如果格式不对（比如写成了 `update: login`），**提交再次被阻断**。
- 全部绿灯，代码才被允许真正进入本地 Git 仓库。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么我的同事克隆了项目，他 `git commit` 时完全没有触发 Husky 拦截？

- **答**：这是使用 Husky 最常见的新手坑。
  - **原因**：Git Hooks 是存在于本地 `.git/hooks` 隐藏目录下的文件，这个目录是**不会被推送到远程代码仓库的**。同事 clone 代码后，他的电脑上并没有这些物理钩子文件。
  - **解法**：必须在 `package.json` 的 `scripts` 字段中配置 `"prepare": "husky install"`。`prepare` 是 npm 的内置生命周期脚本，当你的同事执行 `npm install` 安装依赖完毕后，它会自动运行，将项目中预设的钩子写入他的本地 `.git` 目录中，使拦截生效。

### 4.2 配置了 `lint-staged`，为什么它还是去检查了整个项目的所有文件，导致极其缓慢？

- **答**：这是配置命令不当导致的。
  - **错误写法**：`"*.js": ["eslint . --fix"]`。注意那个 `.`。`lint-staged` 底层的机制是，它会把找出的变更文件列表，作为参数追加到你的命令后面。如果写了 `.`，命令就变成了 `eslint . --fix file1.js file2.js`，这会让 ESLint 去扫描整个目录 (`.`)，完全失去了 lint-staged 的意义。
  - **正确写法**：`"*.js": ["eslint --fix"]`。这样它只会精确地执行 `eslint --fix file1.js file2.js`。

### 4.3 有时候遇到紧急线上 Bug 需要修，ESLint 报错但我不想改，怎么强行绕过拦截提交代码？

- **答**：
  - 你可以使用 Git 原生提供的 `--no-verify` 参数（简写为 `-n`）来跳过所有的 `pre-commit` 和 `commit-msg` 钩子。
  - **命令**：`git commit -m "fix: emergency hotfix" --no-verify`
  - **警告**：这是一个**极其危险**的“后门”操作。作为技术规范，团队内部应当严格禁止滥用此命令，否则精心搭建的工程化防线将形同虚设。它仅用于十万火急且确保代码不会引起二次崩溃的线上救火场景。

### 4.4 为什么还要专门用 `commitlint` 规范提交信息？随便写一段描述不行吗？

- **答**：随便写对个人小项目没问题，但对企业级项目是灾难。
  - **自动化发版 (Semantic Versioning)**：规范的提交类型直接决定了自动计算的版本号。如果有 `feat` 提交，次版本号 (Minor) 自动加 1；如果有 `BREAKING CHANGE`，主版本号 (Major) 自动加 1。
  - **自动生成 Changelog**：发布新版本时，工具可以自动抓取所有的 `feat` 和 `fix` 提交，一键生成精美的 `CHANGELOG.md` 更新日志。如果随便乱写，后续溯源或交接工作将无法进行。
