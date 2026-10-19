---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 代码规范：ESLint、Prettier 与 Stylelint

在多人协作的企业级前端项目中，**“靠开发者的个人自觉来维持代码质量”是被无数次证明完全不可行的**。每个人都有自己的编码习惯(缩进、引号、命名)，这会导致代码库风格割裂，极易引发Bug，且 Git历史记录杂乱无章。

为了解决这一痛点，我们必须引入一套**强制性的自动化约束工具链**，将规范物理落地。

## 1. 核心概念与特性

[width(16,53,31)]

| 核心工具      | 核心职责与特性                                                                                   | 在工作流中的作用                            |
| :------------ | :----------------------------------------------------------------------------------------------- | :------------------------------------------ |
| **ESLint**    | **语法警察（管逻辑与质量）**。检查代码中潜在的 Bug，如使用了未定义的变量、危险的隐式类型转换等。 | 保证代码能够安全、正确地运行。              |
| **Prettier**  | **颜值独裁者（管格式与排版）**。强制统一代码的外观，如缩进空格数、单双引号、每行最大长度等。     | 终结团队内部关于代码风格的“**圣战**”。      |
| **Stylelint** | **样式警察（管 CSS 生态）**。检查无效色值、重复属性，并强制属性书写顺序。                        | 让 CSS / Less / SCSS 与 JS 共用同一套规范。 |

## 2. 代码规范工程化 (ESLint & Prettier)

### 2.1 职责划分与冲突解决

新手最容易踩的坑是把 ESLint 和 Prettier 混为一谈。早期 ESLint 既管逻辑（规则名多带 `no-`）也管排版（`quotes`、`semi`），引入 Prettier 后两者的排版要求会互相打架，导致满屏红线。

**终极解法**：装 `eslint-config-prettier`。它**不是插件，而是一份“关闭名单”**，把 ESLint 中所有可能与 Prettier 冲突的排版规则一次性设为 `off`：**逻辑归 ESLint，颜值归 Prettier**。

```js
import skipFormatting from 'eslint-config-prettier/flat'

export default [
  /* 语言/框架预设放前面 */
  skipFormatting, // 关闭名单必须排在预设之后，靠后者覆盖前者生效
]
```

### 2.2 核心配置文件示例

:::code-group

```js [eslint.config.js]
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

```js [.prettierrc.js]
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

:::

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

### 2.5 高频落地场景

- **新项目初始化**：`pnpm create vite` 之后补齐 ESLint + Prettier 配置，把 `skipFormatting`（或 `eslint-config-prettier/flat`）这个**关闭格式的配置对象排在数组靠后**，从第一天就避免排版规则打架。
- **存量项目渐进收紧**：不动全量代码，先用 `overrides` 只对 `src/new/**` 开启严格规则，老代码维持 `warn`，逐步迁移而非一次性大爆炸。
- **Monorepo 共享规范**：把 ESLint/Prettier/Stylelint 配置抽成 `packages/eslint-config` 之类的内部包，各子项目 `extends` 它，规范改一处、全仓库生效。
- **编辑器与提交双保险**：装 VS Code 的 ESLint / Prettier / Stylelint 插件做到“**保存即修**”；提交前的兜底交给 [Git Hooks 工具链](/frontEngineering/quality/gitHooks) 里的 `lint-staged`，防止没装插件的人提交脏代码。
- **CI 全量校验**：本地只查改动文件求快，CI 上再跑一次 `eslint .` 全量扫描，确保没有漏网之鱼。
- **类型规则分层**：用 `@typescript-eslint` 的 `recommended-type-checked` 获取需要类型信息的规则，配合 `parserOptions.project` 指明 `tsconfig`。

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 为什么 `plugins` 里加了插件，规则却没生效？

`plugins` 只是**注册**插件，让 ESLint 认识 `插件名/规则名` 这种规则标识，它不会自动启用任何规则。

- 必须在 `extends` 里引用插件提供的预设（如 `plugin:react/recommended`），或在 `rules` 里显式写 `'plugin-name/rule-name': 'error'`，规则才真正生效。
- 另外在扁平配置里 `plugins` 是一个对象（`{ 'plugin-name': plugin }`），而不再是数组。

### 3.2 团队里有人用 VS Code，有人用 WebStorm，怎么保证格式化结果一致？

不要让编辑器各自为政，把规则的唯一事实来源锁定在项目根目录：

- **配置文件**：Prettier 会从文件所在目录向上查找 `.prettierrc.*`，任何编辑器与 CI 都读同一份，结果自然一致。
- **VS Code**：在 `.vscode/settings.json` 里设置 `"editor.defaultFormatter": "esbenp.prettier-vscode"` 与 `"editor.formatOnSave": true`。
- **WebStorm**：在 `Settings → Languages & Frameworks → Prettier` 勾选保存时自动运行，并指向项目内的 Prettier 包。

### 3.3 lint 报错成千上万，一次性修不完怎么办？

分步走，切忌为了“**清零**”堆砌 `eslint-disable`，那是把债藏起来而不是还债：

- 先用 `--fix` 让工具自动修可自动修复的部分（引号、分号、可推导的类型）。
- 对无法自动修复的规则，逐个从 `'error'` 降级为 `'warn'`，先不阻断提交。
- 用 `overrides` 按目录逐步收紧，一个模块一个模块地清零。
- 清零后把规则重新升回 `'error'`，用 CI 守住不再反弹。

### 3.4 ESLint 检查太慢，如何提速？

- **只查改动文件**：本地交给 `lint-staged`，不要对全项目跑 `eslint .`。
- **开启缓存**：`eslint --cache` 会缓存已检查文件的结果，未改动的直接跳过（`.eslintcache` 记得写进 `.gitignore`）。
- **拆分昂贵规则**：`@typescript-eslint` 中带`type-checked`的规则要构建完整类型信息，最慢，可只在 CI 开启。
- **定位慢规则**：用 `TIMING=1 eslint .` 打印每条规则的耗时，优先优化最慢的那几条。
