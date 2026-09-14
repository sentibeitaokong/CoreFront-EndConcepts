---
name: docs-check
description: 检查 apps/docs 下的 markdown 文档：表格 [width(...)] 与列数是否匹配、内部链接和图片是否存在、中文引号是否被改坏、代码块语法是否回归。提交时会由 husky 自动跑。当用户说「检查文档」「提交前看看」「体检」或改完 apps/docs 里的 .md 想确认没弄坏什么时使用。
---

# 文档体检

挂在 husky 的 pre-commit 上自动跑（见仓库根 `package.json` 的 `lint-staged`），
所以提交时**不需要模型参与**。这个 skill 是给「手动跑」和「报错了怎么修」用的。

## 跑

```bash
# 查当前工作区相对 HEAD 有改动的文档（默认行为）
node .claude/skills/docs-check/scripts/check.mjs

# 查指定文件
node .claude/skills/docs-check/scripts/check.mjs apps/docs/js/basic/closure.md

# 查全仓库
node .claude/skills/docs-check/scripts/check.mjs --all
```

退出码 0 通过，1 有问题。全仓库约 30 秒，单文件毫秒级。

## error 和 warning 的区别

**error 会拦提交，且必须零误报**——只有确定无疑的问题才是 error。有判断余地的一律是
warning，否则你迟早学会忽略这个检查，那它就白做了。

|     | 检查                                      | 修法                                  |
| --- | ----------------------------------------- | ------------------------------------- |
| ✖   | `[width(...)]` 值个数 ≠ 表格列数          | 跑 table-width skill 重算，或手工补齐 |
| ✖   | `[width]` 各值之和 ≠ 100                  | 同上                                  |
| ✖   | `[width]` 有值 < 8                        | 同上（低于 8% 会挤成一条）            |
| ✖   | 内部链接指向不存在的页面                  | 链接写错了，或目标页还没建            |
| ✖   | `/img/x.png` 在 `public/img/` 下不存在    | 图片路径写错了                        |
| ⚠   | 代码块**语法回归**                        | 见下                                  |
| ⚠   | 中文引号 `“ ”` 成批变成直引号             | `git diff` 找出来，改回弯引号         |
| ⚠   | 行首 ASI guard 不见了                     | 见下                                  |
| ⚠   | 新增表格没有 `[width]`、图片 alt 是占位词 | 按提示补                              |

## 两个需要理解的检查

**代码块语法回归是差分的。** 它只报「HEAD 能解析、你改完之后不能」。这不是偷懒——
全仓库 3362 个 js/ts 块里有约 450 个解析不过，但几乎全是**故意**的：演示报错用法的例子
（`await` 用在非 async 里）、API 签名（`new DataView(ArrayBuffer buffer [, 起始位置])`）、
伪代码里的 `···`、`js` 块里画 SVG。全量检查会刷出 300 多条噪音。差分后在你的工作区上是
**零误报**。所以：既有的伪代码块不用管，只有你新写的或改坏的才会被报。

**ASI guard 那条要当回事。** Prettier 会把 `;[1, 10, 2].sort(...)` 改写成
`[(1, 10, 2)].sort(...)`——数组变成逗号表达式，而旁边的注释还写着原来的结果。文档照样渲染，
markdownlint 照样干净，**只有代码错了**。修法是在文档示例里别用行首 `;` 开头的语句，
改用命名变量：`const nums = [1, 10, 2]; nums.sort(...)`。

## 不要做的事

- 不要为了让检查通过而调低阈值或删规则——先确认是不是真问题。
- 不要把这个检查扩成全量语法校验（会 8% 误杀，见上）。
- 表格**最优**宽度这个脚本算不了（要浏览器 + dev server）。它只校验写进文件的
  `[width(...)]` 自洽。要真的重算宽度，用 `table-width` skill。

写文档的格式约定（frontmatter、侧边栏注册、代码块、图片）见 `references/conventions.md`。
