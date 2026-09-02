# 正则表达式

JavaScript 环境下使用正则表达式的实例和技巧。

## 1. 基础匹配

### 1.1 纯文本查找

最简单的用法：直接匹配一段文本。这里的 `/Ben/` 效果等同于查找字符串 `'Ben'`。

```js
const text =
  'Hello, my name is Ben. Please visit my website at http://www.forta.com/'
const n = text.match(/Ben/)
```

**结果:** `["Ben"]`

### 1.2 全局匹配 (g)

正则默认只匹配第一个结果。加上 `g` 标志可以匹配所有出现的结果。

```js
const text =
  'Hello, my name is Ben. Please visit my website at http://www.forta.com/'
const n = text.match(/my/g)
```

**结果:** `["my", "my"]`

### 1.3 忽略大小写 (i)

使用 `i` 标志进行不区分大小写的匹配。

```js
const text =
  'Hello, my name is Ben. Please visit my website at http://www.forta.com/'
const n = text.match(/ben/i)
```

**结果:** `["Ben"]`

## 2. 元字符的使用

### 2.1 匹配任意字符 (.)

`.`（点）是元字符，可以匹配除换行符外的任意单个字符。

```js
const text = 'sales1.xls\nsales2.xls\nsales3.xls'
const n = text.match(/sales./g)
```

**结果:** `["sales1", "sales2", "sales3"]`

### 2.2 匹配特殊字符本身 (\\)

要匹配 `.`、`*`、`?` 等元字符本身，需要在其前面加上 `\`（反斜杠）进行转义。

```js
const text = 'na1.xls\nsa1.xls\nca1.xls'
const n = text.match(/.a.\.xls/g)
```

**结果:** `["na1.xls", "sa1.xls", "ca1.xls"]`

## 3. 字符集 `[]`

### 3.1 匹配多个字符中的一个

`[abc]` 匹配 `a`、`b`、`c` 中的任意一个。

```js
const text = 'na1.xls\nsa1.xls\nca1.xls'
const n = text.match(/[ns]a.\.xls/g)
```

**结果:** `["na1.xls", "sa1.xls"]`

### 3.2 使用字符区间

`[0-9]` 匹配 0 到 9 的任意数字，`[a-z]` 匹配任意小写字母。

```js
const text = 'na1.xls\nsa2.xls'
const n = text.match(/[ns]a[0-9]\.xls/g)
```

**结果:** `["na1.xls", "sa2.xls"]`

### 3.3 取非匹配 (^)

在字符集内部使用 `^` 表示匹配**除了**该集合内字符以外的任何字符。

```js
const text = 'na1.xls\nsam.xls'
const n = text.match(/[ns]a[^0-9]\.xls/g)
```

**结果:** `["sam.xls"]`（因为 `m` 不是数字）

## 4. 预定义元字符

| 元字符 | 描述                     | 等价于           |
| :----- | :----------------------- | :--------------- |
| `\d`   | 匹配任意数字             | `[0-9]`          |
| `\D`   | 匹配任意非数字           | `[^0-9]`         |
| `\w`   | 匹配字母、数字、下划线   | `[a-zA-Z0-9_]`   |
| `\W`   | 匹配非字母、数字、下划线 | `[^a-zA-Z0-9_]`  |
| `\s`   | 匹配任意空白字符         | `[ \t\n\r\f\v]`  |
| `\S`   | 匹配任意非空白字符       | `[^ \t\n\r\f\v]` |

**示例：**

```js
// 匹配 myArray[0]
const text = 'var myArray=new Array(); if(myArray[0]==0){...}'
const n = text.match(/myArray\[\d\]/)
```

**结果:** `["myArray[0]"]`

## 5. 量词

量词用来指定前面的元素重复出现的次数。

### 5.1 匹配一次或多次 (+)

```js
const text = 'Send personal email to ben@forta.com.'
const n = text.match(/\w+@\w+\.\w+/g)
```

**结果:** `["ben@forta.com"]`

### 5.2 匹配零次或多次 (\*)

```js
const text = 'Hello .ben@forta.com is my email address.'
const n = text.match(/\w*[\w.]*@[\w.]+\.\w+/g)
```

**结果:** `[".ben@forta.com"]`

### 5.3 匹配零次或一次 `(?)`

```js
const text = 'http://www.forta.com/ and https://www.forta.com/'
const n = text.match(/https?:\/\/[\w./]+/g)
```

**结果:** `["http://www.forta.com/", "https://www.forta.com/"]`

### 5.4 指定重复次数 `{n,m}`

- `{n}`: 恰好 n 次
- `{n,}`: 至少 n 次
- `{n,m}`: 至少 n 次，至多 m 次

```js
// 匹配十六进制颜色
const text1 = 'BGCOLOR="#336633"'
const color = text1.match(/#[0-9a-fA-F]{6}/g)
// 结果: ["#336633"]
```

```js
// 匹配日期
const text2 = '4/8/03\n10-6-2004'
const date = text2.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g)
// 结果: ["4/8/03", "10-6-2004"]
```

### 5.5 防止过度匹配（贪婪 vs 懒惰）

默认量词是「贪婪的」，会尽可能多地匹配；在其后加上 `?` 可变为「懒惰」模式，进行最小化匹配。

```js
const text =
  'This offer is not available to customers living in <B>AK</B> and <B>HI</B>'

// 贪婪匹配（错误）：一次性匹配到最后一个 </B>
const greedy = text.match(/<[Bb]>.*<\/[Bb]>/g)
// 结果: ["<B>AK</B> and <B>HI</B>"]

// 懒惰匹配（正确）：逐个匹配每个标签
const lazy = text.match(/<[Bb]>.*?<\/[Bb]>/g)
// 结果: ["<B>AK</B>", "<B>HI</B>"]
```

> **原理**：贪婪量词会先尝试匹配尽可能多的字符，只有在后面无法匹配时才「回溯」缩短；懒惰量词则相反，先尝试最少，不够再逐步加长。

## 6. 边界匹配

边界匹配的是「位置」而不是字符。

### 6.1 单词边界 (`\b`, `\B`)

- `\b`: 匹配单词的开头或结尾（即单词字符 `\w` 与非单词字符 `\W` 之间的位置）。
- `\B`: 匹配非单词边界的位置。

```js
const text = 'The cat scattered his food.'
const n = text.match(/\bcat\b/g) // 只匹配独立的单词 "cat"，不会匹配 "scattered"
// 结果: ["cat"]
```

### 6.2 字符串边界 (^, $)

- `^`: 匹配字符串的开头。
- `$`: 匹配字符串的结尾。

```js
const text = '<?xml version="1.0" ?>'
const n = text.match(/^\s*<\?xml.*\?>/g) // 确保 XML 声明在文件最开始
```

### 6.3 分行匹配模式 `(m)`

使用 `m` 标志，可以让 `^` 和 `$` 也匹配每一行的开头和结尾。

> **注意：** JavaScript 正则表达式没有 `(?m)` 内联语法，`m` 只能作为标志写在正则之外 `/.../m`。

```js
const text = '// comment 1\nvar a = 1;\n// comment 2'
const n = text.match(/^\s*\/\/.*$/gm)
```

**结果:** `["// comment 1", "// comment 2"]`

## 7. 分组与回溯引用

### 7.1 子表达式 ()

使用 `()` 将表达式分组，作为一个整体来应用量词或进行捕获。

```js
// 匹配连续两个或更多的 &nbsp;
const text1 = 'Windows&nbsp;&nbsp;2000'
const n1 = text1.match(/(&nbsp;){2,}/)
// 结果: ["&nbsp;&nbsp;"]
```

```js
// 匹配 IP 地址（简化版）
const text2 = 'Pinging 12.159.46.200'
const n2 = text2.match(/(\d{1,3}\.){3}\d{1,3}/g)
// 结果: ["12.159.46.200"]
```

### 7.2 回溯引用 `(\1, \2, ...)`

`\1` 引用第一个捕获组 `()` 匹配到的**内容**，用于「再次匹配相同的内容」。

```js
// 查找重复的单词
const text1 = 'words here are are repeated'
const n1 = text1.match(/[ ]+(\w+)[ ]+\1/g)
// 结果: [" are are"]
```

```js
// 匹配配对的 HTML 标签
const text2 = '<H1>Welcome</H1>...<H2>Invalid</H3>'
const n2 = text2.match(/<[Hh]([1-6])>.*?<\/[Hh]\1>/g)
// 结果: ["<H1>Welcome</H1>"]
```

### 7.3 非捕获分组 (?:...)

如果只是想把表达式作为一个整体、而不需要捕获内容，用 `(?:...)`。它不占用捕获组编号，也不参与反向引用，效率更高。

```js
const text = 'http://www.forta.com/ https://www.forta.com/'
const n = text.match(/(?:https?):\/\//g)
// 结果: ["http://", "https://"]
// 对比 /(https?):\/\//g 会多捕获 "http"、"https" 两组
```

### 7.4 命名分组 `(?<name>...)`

用 `(?<name>...)` 给捕获组起一个名字，可读性更好。回溯引用时用 `\k<name>`，替换时用 `$<name>`。

```js
const text = '2024-09-02'
const re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
const m = text.match(re)

m.groups.year // "2024"
m.groups.month // "09"
m.groups.day // "02"

// 反向引用命名分组
const text2 = 'abc abc'
text2.match(/(?<word>\w+)\s+\k<word>/) // ["abc abc", "abc"]

// 替换时引用
text.replace(re, '$<month>/$<day>/$<year>') // "09/02/2024"
```

### 7.5 在 `replace` 中使用回溯引用 ($1, $2, ...)

在 `replace` 方法的第二个参数中，`$n` 代表第 `n` 个捕获组的内容。

```js
// 格式化电话号码
const text1 = '313-555-1234'
const n1 = text1.replace(/(\d{3})-(\d{3})-(\d{4})/, '($1) $2-$3')
// 结果: "(313) 555-1234"
```

```js
// 将邮件地址转为链接
const text2 = 'Hello, ben@forta.com is my email address'
const n2 = text2.replace(/([\w.]+@[\w.]+\.\w+)/, '<a href="mailto:$1">$1</a>')
// 结果: 'Hello, <a href="mailto:ben@forta.com">ben@forta.com</a> is my email address'
```

## 8. 前后查找 (Lookaround)

环视只匹配一个「位置」，断言该位置前面或后面的内容符合某种模式，但被断言的内容**不会**成为最终匹配结果的一部分。

> **注意：** JavaScript 在 ES2018 之后才支持向后查找（lookbehind）。

- **`(?=...)`（正向前瞻）**: 匹配其后紧跟着 `...` 的位置。
- **`(?!...)`（负向前瞻）**: 匹配其后**不**是 `...` 的位置。
- **`(?<=...)`（正向后顾）**: 匹配其前是 `...` 的位置。
- **`(?<!...)`（负向后顾）**: 匹配其前**不**是 `...` 的位置。

```js
// 提取协议名（正向前瞻）
const text1 = 'http://www.forta.com/'
const n1 = text1.match(/.+(?=:)/g)
// 结果: ["http"]
```

```js
// 提取不带 '$' 符号的数字（负向后顾）
const text2 = 'I paid $30 for 100 apples'
const n2 = text2.match(/\b(?<!\$)\d+\b/g)
// 结果: ["100"]
```

```js
// 千位分隔符（正向后顾 + 正向前瞻）
const text3 = '1234567'
const n3 = text3.replace(/(?<=\d)(?=(\d{3})+(?!\d))/g, ',')
// 结果: "1,234,567"
```

## 9. 标志详解

标志写在正则字面量之外（如 `/regex/gmi`），或作为 `RegExp` 构造函数的第二个参数（如 `new RegExp('regex', 'g')`）。

| 标志 | 名称                     | 说明                                                   | 支持版本 |
| :--- | :----------------------- | :----------------------------------------------------- | :------- |
| `g`  | Global（全局）           | 查找所有匹配项，而不是找到第一个就停止。               | 所有     |
| `i`  | Case-Insensitive（忽略） | 忽略大小写匹配。                                       | 所有     |
| `m`  | Multiline（多行）        | 使 `^` 和 `$` 匹配每一行的开头和结尾。                 | 所有     |
| `s`  | Dot All（单行）          | 允许 `.` 匹配包括换行符在内的所有字符。                | ES2018   |
| `u`  | Unicode（Unicode 模式）  | 启用完整的 Unicode 匹配，支持 `\u{...}` 与 `\p{...}`。 | ES2015   |
| `y`  | Sticky（粘性）           | 只从 `lastIndex` 处开始匹配，不向前搜索。              | ES2015   |
| `d`  | hasIndices（索引）       | 匹配结果中附带 `indices` 数组，记录每个捕获组的位置。  | ES2022   |

### 9.1 `u` 标志与 Unicode 属性转义

`u` 标志让正则按 Unicode 码点（code point）而非 UTF-16 编码单元处理字符串，正确处理 emoji 等代理对；同时启用 `\p{...}` 属性转义。

```js
// 没有 u：按 16 位编码单元计数，emoji 被拆成两个单元
'😀'.match(/^.$/) // null（因为 😀 占两个编码单元）
'😀'.match(/^.$/u) // ["😀"]

// Unicode 属性转义（必须配合 u）
'😀'.match(/\p{Emoji}/u) // ["😀"]
'你好'.match(/\p{Script=Han}/u) // ["你"]
'abc'.match(/\p{Letter}+/u) // ["abc"]
```

### 9.2 `y` 标志（粘性匹配）

`y` 要求匹配必须从 `lastIndex` 位置开始，不会跳过不匹配的字符向后搜索。

```js
const re = /foo/y
re.lastIndex = 3
re.exec('xfoofoo') // ["foo"]（从索引 3 开始匹配）

re.lastIndex = 4
re.exec('xfoofoo') // null（索引 4 是 'o'，不是 'foo'，且不向前搜索）
```

### 9.3 `d` 标志（匹配索引）

```js
const re = /(?<a>a)(?<b>b)/d
const m = re.exec('ab')
m.indices // [[0, 2], [0, 1], [1, 2]]  整体与各分组的位置
m.indices.groups // { a: [0, 1], b: [1, 2] }
```

## 10. 常见陷阱

### 10.1 `exec` 与 `lastIndex` 状态

带 `g` 或 `y` 标志的正则是「有状态」的：`exec` 每次调用会更新 `lastIndex`，多次调用返回不同的匹配，直到返回 `null` 后重置为 0。

```js
const re = /a/g
const text = 'a a'

re.exec(text) // ["a"], lastIndex 变为 1
re.exec(text) // ["a"], lastIndex 变为 3
re.exec(text) // null,  lastIndex 重置为 0
```

因此**不要在循环外复用同一个带 `g` 标志的正则去 `test` 不同字符串**，容易因为 `lastIndex` 残留而得到错误结果：

```js
const re = /a/g
re.test('a') // true, lastIndex = 1
re.test('a') // false！因为从索引 1 开始找不到 'a'
```

需要时手动 `re.lastIndex = 0` 重置，或改用 `String.prototype.match` / `search`。

### 10.2 `replace` 的回调函数

`replace` 的第二个参数除了字符串，还可以是回调函数，参数依次为：完整匹配、各捕获组、匹配位置、原字符串。

```js
const text = '313-555-1234'
const result = text.replace(
  /(\d{3})-(\d{3})-(\d{4})/,
  (match, p1, p2, p3, offset, str) => {
    return `${p1}.${p2}.${p3}`
  },
)
// 结果: "313.555.1234"
```

### 10.3 回溯与 ReDoS

正则引擎用「回溯」来尝试不同的匹配路径。当存在多个贪婪量词嵌套时（如 `(a+)+$`、`(a|aa)+$`），对特定输入会触发「灾难性回溯」，导致 CPU 长时间占用甚至卡死。

```js
// 危险示例：不要在生产环境对不可信输入执行这类正则
const bad = /(a+)+$/
bad.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaa!') // 回溯次数随长度指数增长
```

**规避方法**：避免量词嵌套（`(a+)+`）、用字符类替代多分支重叠（`a|aa` → `a{1,2}`）、对长输入设置超时或长度上限。
