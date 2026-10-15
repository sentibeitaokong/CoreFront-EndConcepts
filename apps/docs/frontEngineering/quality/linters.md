---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 代码规范与提交拦截

## 1. 核心概念与特性

在多人协作的企业级前端项目中，**“靠开发者的个人自觉来维持代码质量”是被无数次证明完全不可行的**。每个人都有自己的编码习惯（缩进、引号、命名），这会导致代码库风格割裂，极易引发 Bug，且 Git 历史记录杂乱无章。

为了解决这一痛点，我们必须引入一套**强制性的自动化约束工具链**，将规范物理落地。

[width(16,53,31)]

| 核心工具        | 核心职责与特性                                                                                   | 在工作流中的作用                               |
| :-------------- | :----------------------------------------------------------------------------------------------- | :--------------------------------------------- |
| **ESLint**      | **语法警察（管逻辑与质量）**。检查代码中潜在的 Bug，如使用了未定义的变量、危险的隐式类型转换等。 | 保证代码能够安全、正确地运行。                 |
| **Prettier**    | **颜值独裁者（管格式与排版）**。强制统一代码的外观，如缩进空格数、单双引号、每行最大长度等。     | 终结团队内部关于代码风格的“**圣战**”。         |
| **Husky**       | **门神（Git Hooks 管理器）**。拦截 Git 原生的生命周期事件（如 `git commit`、`git push`）。       | 确保在烂代码入库前进行物理拦截。               |
| **lint-staged** | **局部检查优化器**。只对被 Git 标记为“**暂存区 (Staged)**”的变动文件运行检查。                   | 极大提升检查速度，避免全量检查旧的烂代码。     |
| **Commitlint**  | **提交记录审查员**。强制校验 `git commit -m` 填写的消息是否符合特定格式。                        | 保证提交日志清晰可读，方便自动生成 Changelog。 |

## 2. 代码规范工程化 (ESLint & Prettier)

### 2.1 职责划分与冲突解决

新手最容易踩的坑就是把 ESLint 和 Prettier 混为一谈。

- 早期的 ESLint 既管逻辑（规则名通常带有 `no-`），也管排版（如 `quotes`, `semi`）。
- 当你引入更专业的 Prettier 时，**两者对排版的要求可能会打架，导致满屏红线**。

**终极解法**：装 `eslint-config-prettier`。注意它**不是一个插件，而是一份“关闭名单”**——把 ESLint 里所有可能与 Prettier 冲突的排版规则（`quotes`、`semi`、`indent` 等）一次性设为 `off`，实现“**逻辑归 ESLint，颜值归 Prettier**”。由于冲突规则在配置层面就被关掉了，ESLint 与 Prettier 之间不会再出现“一边报错、一边改回去”的拉锯。

还有一个常被混淆的包是 `eslint-plugin-prettier`：它反过来把 Prettier 当成一条 ESLint 规则来跑（规则名 `prettier/prettier`），让格式问题也以 ESLint 报错的形式出现。代价是每条格式违规都要走一遍 Prettier 解析，速度更慢，且 `eslint --fix` 与 `prettier --write` 可能反复改同一处。除非你坚持“所有问题必须在同一份报告里看到”，否则**推荐只挂关闭名单，让 Prettier 独立运行**。

### 2.2 核心配置文件示例

**1. ESLint 配置（扁平配置 `eslint.config.js`）**

```js
import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
// eslint-config-prettier 的关闭名单，并显式关掉 prettier/prettier 规则
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { files: ['**/*.{ts,mts,tsx,vue}'] },
  pluginVue.configs['flat/recommended'], // 如果是 Vue 项目
  vueTsConfigs.recommended,
  // 顺序是关键：它靠“后者覆盖前者”关掉前面预设开的排版规则，必须排在语言/框架预设之后
  skipFormatting,
  {
    rules: {
      // 你可以在这里自定义覆盖业务逻辑规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      eqeqeq: 'error', // 强制使用 === 和 !==
    },
  },
)
```

> 非 Vue 项目直接用 `eslint-config-prettier/flat`，导出的就是同一份关闭名单。ESLint 9 起默认使用扁平配置，`.eslintrc.*` 已是 legacy 写法，**v10.0（2026-02）已将其彻底移除**——同批被移除的还有 `.eslintignore` 与 `/* eslint-env */` 注释（后者在新版本里会直接报错），迁移用 `npx @eslint/migrate-config .eslintrc.json`。

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

### 2.3 ESLint 高频配置字段

无论使用旧版 `.eslintrc.*` 还是新的扁平配置 `eslint.config.js`，以下字段都是日常最常打交道的：

[width(22,44,34)]

| 字段             | 作用                                                            | 典型用法                                                            |
| :--------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------ |
| `extends`        | 继承预设规则集，数组内**后者覆盖前者**                          | `['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier']` |
| `plugins`        | 注册插件以启用其规则，仅注册不生效，规则仍需在 `rules` 中开启   | `['@typescript-eslint']`                                            |
| `rules`          | 逐条开关/配置规则，取 `'off'`/`'warn'`/`'error'` 或带选项数组   | `'no-console': 'warn'`                                              |
| `overrides`      | 针对特定文件/目录单独覆盖规则                                   | 对 `*.test.ts` 放开 `no-unused-expressions`                         |
| `ignorePatterns` | 声明不参与检查的文件                                            | `['dist/**', '*.min.js']`                                           |
| `parserOptions`  | 指定解析器与语言特性，TS 项目需切到 `@typescript-eslint/parser` | `{ ecmaVersion: 'latest', sourceType: 'module' }`                   |
| `env`            | 声明全局变量环境，决定 `window`、`process` 等能否直接使用       | `{ browser: true, node: true }`                                     |

> 扁平配置 `eslint.config.js` 用 `languageOptions`、`files`、`ignores` 取代了 `env`、`parserOptions`、`overrides`、`ignorePatterns`，规则写在数组里每个对象的 `rules` 上；继承语义也不再是 `extends` 字段，而是“**按顺序排列配置对象、后者覆盖前者**”。

### 2.4 Stylelint：样式层的规范

ESLint 只管 JS/TS，CSS/Less/SCSS 的风格与错误需要 `stylelint` 兜底：

```json
{
  "extends": ["stylelint-config-standard", "stylelint-config-rational-order"],
  "rules": {
    "color-no-invalid-hex": true,
    "selector-class-pattern": "^[a-z][a-z0-9-]*$"
  }
}
```

- `stylelint-config-standard`：官方标准规则集，拦截无效色值、重复属性等硬错误。
- `stylelint-config-rational-order`：按“**定位 → 盒模型 → 排版 → 视觉**”排序属性，团队无需再争论属性顺序。
- 装 VS Code 的 `stylelint` 插件做编辑器提示，再用 `lint-staged` 的 `stylelint --fix` 在提交前兜底，形成双保险。

## 3. Git 提交规范与自动化拦截实战 (Husky & Commitlint)

### 3.1 安装核心依赖

在项目的根目录执行以下命令，一次性安装这三个工具及其预设规范：

```bash
pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional

```

### 3.2 配置 Commitlint (提交信息规范)

`commitlint` 需要一个配置文件来知道什么是“**合法的提交格式**”。在根目录创建一个名为 `commitlint.config.js` 的文件（或者 `.cjs`, `.mjs`，取决于你的项目类型）：

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

### 3.8 高频落地场景

- **新项目初始化**：`pnpm create vite` 之后补齐 ESLint + Prettier 配置，把 `skipFormatting`（或 `eslint-config-prettier/flat`）这个**关闭格式的配置对象排在数组靠后**，从第一天就避免排版规则打架。
- **存量项目渐进收紧**：不动全量代码，先用 `overrides` 只对 `src/new/**` 开启严格规则，老代码维持 `warn`，逐步迁移而非一次性大爆炸。
- **Monorepo 共享规范**：把 ESLint/Prettier/Stylelint 配置抽成 `packages/eslint-config` 之类的内部包，各子项目 `extends` 它，规范改一处、全仓库生效。
- **编辑器与提交双保险**：装 VS Code 的 ESLint / Prettier / Stylelint 插件做到“**保存即修**”，再用 `lint-staged` 在 `pre-commit` 兜底，防止没装插件的人提交脏代码。
- **CI 全量校验**：本地只查改动文件求快，CI 上再跑一次 `eslint .` 全量扫描，确保没有漏网之鱼。
- **类型规则分层**：用 `@typescript-eslint` 的 `recommended-type-checked` 获取需要类型信息的规则，配合 `parserOptions.project` 指明 `tsconfig`。

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
  - **警告**：这是一个**极其危险**的“**后门**”操作。作为技术规范，团队内部应当严格禁止滥用此命令，否则精心搭建的工程化防线将形同虚设。它仅用于十万火急且确保代码不会引起二次崩溃的线上救火场景。

### 4.4 为什么还要专门用 `commitlint` 规范提交信息？随便写一段描述不行吗？

- **答**：随便写对个人小项目没问题，但对企业级项目是灾难。
  - **自动化发版 (Semantic Versioning)**：规范的提交类型直接决定了自动计算的版本号。如果有 `feat` 提交，次版本号 (Minor) 自动加 1；如果有 `BREAKING CHANGE`，主版本号 (Major) 自动加 1。
  - **自动生成 Changelog**：发布新版本时，工具可以自动抓取所有的 `feat` 和 `fix` 提交，一键生成精美的 `CHANGELOG.md` 更新日志。如果随便乱写，后续溯源或交接工作将无法进行。

### 4.5 为什么 `plugins` 里加了插件，规则却没生效？

- **答**：`plugins` 只是**注册**插件，让 ESLint 认识 `插件名/规则名` 这种规则标识，它不会自动启用任何规则。
  - 必须在 `extends` 里引用插件提供的预设（如 `plugin:react/recommended`），或在 `rules` 里显式写 `'plugin-name/rule-name': 'error'`，规则才真正生效。
  - 另外在扁平配置里 `plugins` 是一个对象（`{ 'plugin-name': plugin }`），而不再是数组。

### 4.6 团队里有人用 VS Code，有人用 WebStorm，怎么保证格式化结果一致？

- **答**：不要让编辑器各自为政，把规则的唯一事实来源锁定在项目根目录。
  - 配置文件：Prettier 会从文件所在目录向上查找 `.prettierrc.*`，任何编辑器与 CI 都读同一份，结果自然一致。
  - VS Code：在 `.vscode/settings.json` 里设置 `"editor.defaultFormatter": "esbenp.prettier-vscode"` 与 `"editor.formatOnSave": true`。
  - WebStorm：在 `Settings → Languages & Frameworks → Prettier` 勾选保存时自动运行，并指向项目内的 Prettier 包。

### 4.7 lint 报错成千上万，一次性修不完怎么办？

- **答**：分步走，切忌为了“**清零**”堆砌 `eslint-disable`，那是把债藏起来而不是还债。
  1. 先用 `--fix` 让工具自动修可自动修复的部分（引号、分号、可推导的类型）。
  2. 对无法自动修复的规则，逐个从 `'error'` 降级为 `'warn'`，先不阻断提交。
  3. 用 `overrides` 按目录逐步收紧，一个模块一个模块地清零。
  4. 清零后把规则重新升回 `'error'`，用 CI 守住不再反弹。

### 4.8 ESLint 检查太慢，如何提速？

- **答**：
  - **只查改动文件**：本地交给 `lint-staged`，不要对全项目跑 `eslint .`。
  - **开启缓存**：`eslint --cache` 会缓存已检查文件的结果，未改动的直接跳过（`.eslintcache` 记得写进 `.gitignore`）。
  - **拆分昂贵规则**：`@typescript-eslint` 中带 `type-checked` 的规则要构建完整类型信息，最慢，可只在 CI 开启。
  - **定位慢规则**：用 `TIMING=1 eslint .` 打印每条规则的耗时，优先优化最慢的那几条。
