# apps/docs 写文档的约定

从现有 376 个文件里统计出来的实际写法，不是理想规范。新写页面照这个来，就跟你已有的东西一致。

## 新页面

1. **路径**：`apps/docs/<大类>/<子类>/<名字>.md`，**文件名 camelCase**（`executionContextAndStack.md`、`basicPrimitiveType.md`）。
2. **frontmatter 看情况**，全仓库只有 119/376 有：
   - `js/basic`、`frameworks/*`、`dataStructuresAndAlgorithms/*` → 写
     ```
     ---
     outline: [2, 3]
     ---
     ```
     （别抄那行 `# 这个页面将显示 h2 和 h3 标题` 的注释——它在 `[2,4]` 的文件里也是这句，是错的。）
   - `designPatterns/**`、`css/basic/**`、`js/advanced/**` → 不写，直接 `# 标题` 开头。
3. **正文**：`# 中文标题`，紧跟 1–2 句说人话的概括（常有 `**一句话理解**：` 这类开头）。
4. **标题编号**：`## 1. 标题` / `### 1.1 标题`。约 92% 的 H2 是这个形式。
5. **交叉链接**：根绝对、不带扩展名 —— `[作用域](/js/basic/lexicalScope)`。
   「相关阅读」用 GitHub alert：`> [!TIP] 相关阅读`。
6. **注册侧边栏**：`apps/docs/.vitepress/config.mts` 的 `sidebar` 数组（约 1040 行，纯手工，
   没有任何自动生成）。加一行 `{text: '中文标题', link: '/js/basic/closure'}` 到正确的
   `items` 里。**数组顺序就是显示顺序**，没有 order/sort 字段。`link` 带前导斜杠、不带 `.md`。
   长条目 prettier 会拆成多行，不用手写多行格式。

## 代码块

- 常用语言：`js`(2043) > `javascript`(479) > `css`(340) > `typescript`(312) > `jsx`(253)。
  **`js` 是首选写法**，别写 `javascript`。
- 多版本对比用 `:::code-group`，每个 fence 带上文件名做 tab 标签：
  ` ```js [main.js] ` —— **方括号前有一个空格**（348/360 是这个形式）。
- 可折叠的进阶内容用 `:::details 标题`。行内提示用 `> [!NOTE]` / `> [!TIP]`。
- 代码块里**别用行首 `;` 开头的语句**，Prettier 会把它改写成别的语义（见 SKILL.md）。

## 表格

- 需要控制列宽时，在表格**上一行**（中间可空一行）写独立的一行 `[width(20,80)]`，值个数必须
  等于列数，和为 100，每个 ≥ 8。全仓库 289 处在用。
- AnyBlock **只支持 `[width]` 这一个特性**——`[col]`/`[tabs]`/`[fold]` 等一律没用过，别引入。
- 分隔行统一左对齐：`| :--- | :--- |`。
- 宽度不是随手写的估计值，要实测（用 `table-width` skill）。

## 图片

- 全部放 `apps/docs/public/img/`，引用一律根绝对：`![中文描述](/img/scopeChain2.png)`。
  （现有 206 处引用里相对路径、CDN、导入都是零。）
- **alt 必须是描述内容的中文短语**，不是 `Logo` 这种占位词。
- 点击放大由 `vitepress-plugin-lightbox` 自动处理，markdown 里不用写任何东西。

## 格式

- `.prettierrc`：`semi: false`、`singleQuote: true`、`arrowParens: 'avoid'`。
  Prettier 会重排表格的管道对齐。
- `.markdownlint-cli2.jsonc`：`default: true` 但关掉了 18 条，其中影响写法的：
  - **MD013 行长**关 → 正文写成很长的一行，不换行。
  - **MD033 内联 HTML** 关 → 表格里可以用 `<br>`。
  - **MD041 首行必须 H1** 关 → 允许 frontmatter 开头，也允许没有 frontmatter。
  - **MD024** 改成 `siblings_only` → 同一个父标题下可以有重复的子标题
    （`### get()` / `### set()` 这种）。
