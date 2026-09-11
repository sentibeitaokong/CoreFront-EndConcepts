# JavaScript **正则表达式 (RegExp)** 及其 **ES6+ 扩展**

正则表达式是一种强大的模式匹配工具，用于处理字符串，包括搜索、替换、验证等。ES6 (ECMAScript 2015) 及其后续版本为 RegExp 带来了显著的增强，使其在处理 Unicode、多行匹配和高级模式匹配方面更加灵活。

## **1. 正则表达式基础**

### **1.1 正则表达式的创建**

#### 1.1.1 **字面量**:

```js
const regex1 = /pattern/flags
```

- **优点**: 性能更好，因为在脚本加载时编译。
- **缺点**: 模式不能动态生成。

#### 1.1.2 **构造函数**:

```js
const regex2 = new RegExp('pattern', 'flags')
```

- **优点**: 模式可以由字符串动态生成。
- **缺点**: 性能稍差，因为在运行时编译。

### **1.2 常用标志 (Flags)**

[width(9,76,15)]

| 标志    | 描述                                                                                      | 示例      |
| :------ | :---------------------------------------------------------------------------------------- | :-------- |
| **`g`** | **全局匹配** (Global)。查找所有匹配，而不是在找到第一个后停止。                           | `/a/g`    |
| **`i`** | **不区分大小写** (Case-insensitive)。                                                     | `/a/i`    |
| **`m`** | **多行匹配** (Multiline)。`^` 和 `$` 匹配每行的开头和结尾，而不是整个字符串的开头和结尾。 | `/^a/m`   |
| **`u`** | **Unicode 模式** (Unicode)。启用 Unicode 相关的特性，正确处理 4 字节 Unicode 字符。       | `/😂/u`   |
| **`y`** | **粘性匹配** (Sticky)。从 `lastIndex` 属性指定的位置开始匹配。                            | `/a/y`    |
| **`s`** | **dotAll 模式** (dotAll)。`.` (点号) 匹配包括换行符在内的**所有**字符。                   | `/a.b/s`  |
| **`d`** | **索引匹配** (Indices)。(ES2022) 匹配结果包含匹配捕获组的开始和结束索引。                 | `/a(b)/d` |

### **1.3 常用模式 (Patterns)**

[width(15,19,49,17)]

| 类别             | 模式          | 描述                                            | 示例         |
| :--------------- | :------------ | :---------------------------------------------- | :----------- |
| **字面字符**     | `a`, `1`, `$` | 直接匹配字符本身；元字符 (如 `$`) 需用 `\` 转义 | `/a1/`       |
| **字符类**       | `[abc]`       | 匹配方括号内的**任意一个**字符                  | `/[abc]/`    |
|                  | `[a-z]`       | 字符范围                                        | `/[a-z]/`    |
|                  | `[0-9]`       | 数字范围，等价于 `\d`                           | `/[0-9]/`    |
|                  | `[^a-z]`      | 取反：匹配**不在**范围内的字符                  | `/[^a-z]/`   |
| **预定义字符类** | `\d`          | 数字 `[0-9]`                                    | `/\d/`       |
|                  | `\D`          | 非数字 `[^0-9]`                                 | `/\D/`       |
|                  | `\w`          | 单词字符 `[a-zA-Z0-9_]`                         | `/\w/`       |
|                  | `\W`          | 非单词字符                                      | `/\W/`       |
|                  | `\s`          | 空白字符 (空格、tab、换行)                      | `/\s/`       |
|                  | `\S`          | 非空白字符                                      | `/\S/`       |
| **量词**         | `?`           | 0 或 1 次                                       | `/a?/`       |
|                  | `*`           | 0 或多次                                        | `/a*/`       |
|                  | `+`           | 1 或多次                                        | `/a+/`       |
|                  | `{n}`         | 恰好 `n` 次                                     | `/a{3}/`     |
|                  | `{n,}`        | 至少 `n` 次                                     | `/a{3,}/`    |
|                  | `{n,m}`       | `n` 到 `m` 次                                   | `/a{1,3}/`   |
| **边界**         | `^`           | 字符串或行的开头                                | `/^a/`       |
|                  | `$`           | 字符串或行的结尾                                | `/a$/`       |
|                  | `\b`          | 单词边界                                        | `/\bcat\b/`  |
|                  | `\B`          | 非单词边界                                      | `/\Bcat/`    |
| **分组与捕获**   | `(pattern)`   | 捕获组，同时分组                                | `/(ab)+/`    |
|                  | `(?:pattern)` | 非捕获组，只分组不捕获                          | `/(?:ab)+/`  |
| **选择**         | `\|`          | 或 (OR)，匹配两侧任意一个                       | `/cat\|dog/` |
| **转义**         | `\`           | 转义元字符，将其作为普通字符匹配                | `/\./`       |

### **1.4 [`RegExp` 实例方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp)**

[width(17,61,22)]

| 方法            | 描述                                                                                                     | 返回值            |
| :-------------- | :------------------------------------------------------------------------------------------------------- | :---------------- |
| **`test(str)`** | 检查字符串中是否存在匹配项。                                                                             | `boolean`         |
| **`exec(str)`** | 执行匹配，返回一个结果数组（包含匹配项、捕获组、索引等）或 `null`。**配合 `g` 标志可循环查找所有匹配**。 | `array` 或 `null` |

### **1.5 `String` 实例与正则相关方法**

[width(32,56,12)]

| 方法                                  | 描述                                                                                                          | 返回值            |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------ | :---------------- |
| **`match(regexp)`**                   | 查找所有匹配项。如果 `regexp` 有 `g` 标志，返回所有匹配的字符串数组；否则，返回 `exec()` 类似的结果。         | `array` 或 `null` |
| **`matchAll(regexp)`**                | (ES2020) 查找所有匹配项，返回一个**迭代器**，每个元素是 `exec()` 类似的结果。`regexp` **必须**带有 `g` 标志。 | `iterator`        |
| **`search(regexp)`**                  | 返回第一个匹配项的索引，未找到返回 `-1`。`regexp` 的 `g` 标志会被忽略。                                       | `number`          |
| **`replace(regexp, replacement)`**    | 替换字符串中的匹配项。`replacement` 可以是字符串或函数。`regexp` 没有 `g` 标志时只替换第一个。                | `string`          |
| **`replaceAll(regexp, replacement)`** | (ES2021) 替换字符串中**所有**匹配 `regexp` 的子串。`regexp` **必须**带有 `g` 标志。                           | `string`          |
| **`split(separator, limit)`**         | 将字符串分割成数组。`separator` 可以是正则表达式。                                                            | `array`           |

## **2. ES6+ 正则表达式扩展**

### **2.1 `u` 标志 (Unicode 模式) - (ES6)**

ES6 对正则表达式添加了 `u` 修饰符，含义为"**Unicode 模式**"，用来正确处理大于 `0xFFFF` 的 Unicode 字符，即正确处理四个字节的 UTF-16 编码：

```js
/^\uD83D/u.test('🐪') // false
/^\uD83D/.test('🐪') // true
```

`🐪` 是一个四字节的 UTF-16 编码，代表一个字符。ES5 会将其识别为两个字符，所以第二行为 `true`；加了 `u` 修饰符后识别为一个字符，所以第一行为 `false`。

一旦加上 `u` 修饰符号，就会修改下面这些正则表达式的行为。

**（1）点字符**

点（`.`）字符含义是除了换行符以外的任意单个字符。对于码点大于 `0xFFFF` 的 Unicode 字符，点字符不能识别，必须加上 `u` 修饰符：

```js
var s = '𠮷'

/^.$/.test(s) // false
/^.$/u.test(s) // true
```

**（2）Unicode 字符表示法**

ES6 新增了使用大括号表示 Unicode 字符，这种表示法在正则表达式中必须加上 `u` 修饰符，才能识别大括号，否则会被解读为量词（匹配 61 个连续的 `u`）：

```js
;/\u{61}/.test('a') // false
;/\u{61}/u.test('a') // true
```

**（3）量词**

使用 `u` 修饰符后，所有量词都会正确识别码点大于 `0xFFFF` 的 Unicode 字符：

```js
/a{2}/.test('aa') // true
/a{2}/u.test('aa') // true
/𠮷{2}/.test('𠮷𠮷') // false
/𠮷{2}/u.test('𠮷𠮷') // true
```

**（4）预定义模式**

`u` 修饰符也影响到预定义模式能否正确识别码点大于 `0xFFFF` 的 Unicode 字符：

```js
/^\S$/.test('𠮷') // false
/^\S$/u.test('𠮷') // true
```

利用这一点，可以写出一个正确返回字符串长度的函数：

```js
function codePointLength(text) {
  var result = text.match(/[\s\S]/gu)
  return result ? result.length : 0
}

var s = '𠮷𠮷'

s.length // 4
codePointLength(s) // 2
```

**（5）i 修饰符**

有些 Unicode 字符的编码不同，但是字型很相近，比如 `K` 与 `K` 都是大写的 `K`：

```js
;/[a-z]/i.test('K') // false
;/[a-z]/iu.test('K') // true
```

**（6）转义**

没有 `u` 修饰符的情况下，正则中没有定义的转义（如逗号的转义 `\,`）无效，而在 `u` 模式会报错：

```js
/\,/ // /\,/
/\,/u // 报错
```

**RegExp.prototype.unicode 属性**

正则实例对象新增 `unicode` 属性，表示是否设置了 `u` 修饰符：

```js
const r1 = /hello/
const r2 = /hello/u

r1.unicode // false
r2.unicode // true
```

### **2.2 `y` 标志 (粘性匹配 / Sticky) - (ES6)**

ES6 还为正则表达式添加了 `y` 修饰符，叫做"**粘连**"（sticky）修饰符。

`y` 修饰符的作用与 `g` 修饰符类似，都是全局匹配，后一次匹配都从上一次匹配成功的下一个位置开始。不同之处在于，`g` 修饰符只要剩余位置中存在匹配即可，而 `y` 修饰符确保匹配必须从剩余的第一个位置开始：

```js
var s = 'aaa_aa_a'
var r1 = /a+/g
var r2 = /a+/y

r1.exec(s) // ["aaa"]
r2.exec(s) // ["aaa"]

r1.exec(s) // ["aa"]
r2.exec(s) // null
```

如果改一下正则表达式，保证每次都能头部匹配，`y` 修饰符就会返回结果了：

```js
var s = 'aaa_aa_a'
var r = /a+_/y

r.exec(s) // ["aaa_"]
r.exec(s) // ["aa_"]
```

`y` 修饰符同样遵守 `lastIndex` 属性，但要求必须在 `lastIndex` 指定的位置发现匹配：

```js
const REGEX = /a/y

REGEX.lastIndex = 2
REGEX.exec('xaya') // null（2 号位置不是 a）

REGEX.lastIndex = 3
const match = REGEX.exec('xaya') // 3 号位置是 a，匹配成功
match.index // 3
REGEX.lastIndex // 4
```

实际上，`y` 修饰符号隐含了头部匹配的标志 `^`：

```js
;/b/y.exec('aba')
// null
```

`y` 修饰符的设计本意，就是让头部匹配的标志 `^` 在全局匹配中都有效。下面 `replace` 的例子中，最后一个 `a` 因为不是出现在下一次匹配的头部，所以不会被替换：

```js
const REGEX = /a/gy
'aaxa'.replace(REGEX, '-') // '--xa'
```

单单一个 `y` 修饰符对 `match` 方法，只能返回第一个匹配，必须与 `g` 修饰符联用，才能返回所有匹配：

```js
'a1a2a3'.match(/a\d/y) // ["a1"]
'a1a2a3'.match(/a\d/gy) // ["a1", "a2", "a3"]
```

`y` 修饰符的一个应用，是从字符串提取 token（词元），确保匹配之间不会有漏掉的字符：

```js
const TOKEN_Y = /\s*(\+|[0-9]+)\s*/y
const TOKEN_G = /\s*(\+|[0-9]+)\s*/g

function tokenize(TOKEN_REGEX, str) {
  let result = []
  let match
  while ((match = TOKEN_REGEX.exec(str))) {
    result.push(match[1])
  }
  return result
}

tokenize(TOKEN_Y, '3 + 4')
// [ '3', '+', '4' ]
tokenize(TOKEN_G, '3 + 4')
// [ '3', '+', '4' ]

tokenize(TOKEN_Y, '3x + 4')
// [ '3' ]（遇到非法字符 x 就停止）
tokenize(TOKEN_G, '3x + 4')
// [ '3', '+', '4' ]（g 会忽略非法字符）
```

**RegExp.prototype.sticky属性**

与 `y` 修饰符相匹配，ES6 的正则实例对象多了 `sticky` 属性，表示是否设置了 `y` 修饰符：

```js
var r = /hello\d/y
r.sticky // true
```

**RegExp.prototype.flags 属性**

ES6 为正则表达式新增了 `flags` 属性，会返回正则表达式的修饰符：

```js
;/abc/gi.source / // "abc"（ES5 的 source 属性返回正文）
  abc /
  gi.flags // "gi"（ES6 的 flags 属性返回修饰符）
```

### **2.3 `s` 标志 (dotAll 模式) - (ES9/ES2018)**

正则表达式中，点（`.`）代表任意的单个字符，但是有两个例外。一个是四字节的 UTF-16 字符，这个可以用 `u` 修饰符解决；另一个是行终止符（line terminator character）。

```js
;/foo.bar/.test('foo\nbar')
// false
```

但很多时候我们希望匹配的是任意单个字符，ES2018 [引入](https://github.com/tc39/proposal-regexp-dotall-flag) `s` 修饰符，使得 `.` 可以匹配任意单个字符：

```js
;/foo.bar/s.test('foo\nbar') // true
```

这被称为 `dotAll` 模式，即点（dot）代表一切字符。正则表达式还引入了一个 `dotAll` 属性，返回是否处在 `dotAll` 模式：

```js
const re = /foo.bar/s

re.test('foo\nbar') // true
re.dotAll // true
re.flags // 's'
```

`/s` 修饰符和多行修饰符 `/m` 不冲突，两者一起使用时，`.` 匹配所有字符，而 `^` 和 `$` 匹配每一行的行首和行尾。

### 2.4 v 修饰符：Unicode 属性类的运算

有时，需要向某个 Unicode 属性类添加或减少字符，即需要对属性类进行运算。[ES2024](https://github.com/tc39/proposal-regexp-v-flag) 增加了 Unicode 属性类的运算功能。

它提供两种形式的运算，一种是差集运算（A 集合减去 B 集合），另一种是交集运算：

```js
// 差集运算（A 减去 B）
[A--B]

// 交集运算（A 与 B 的交集）
[A&&B]
```

A 和 B 要么是字符类（例如 `[a-z]`），要么是 Unicode 属性类（例如 `\p{ASCII}`）。而且这种运算支持方括号之中嵌入方括号：

```js
// 方括号嵌套的例子
[A--[0-9]]
```

这种运算的前提是，正则表达式必须使用新引入的 `v` 修饰符。Unicode 属性类必须搭配 `u` 修饰符使用，`v` 修饰符等于代替 `u`，使用了它就不必再写 `u` 了：

```js
// 十进制字符去除 ASCII 码的 0 到 9
[\p{Decimal_Number}--[0-9]]

// Emoji 字符去除 ASCII 码字符
[\p{Emoji}--\p{ASCII}]
```

看一个实际的例子，`0` 属于十进制字符类：

```js
;/[\p{Decimal_Number}]/u.test('0') // true
```

如果把 `0-9` 从十进制字符类里面去掉，那么 `0` 就不属于这个类了：

```js
;/[\p{Decimal_Number}--[0-9]]/v.test('0') // false
```

### **2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018)**

正则表达式使用圆括号进行组匹配：

```js
const RE_DATE = /(\d{4})-(\d{2})-(\d{2})/

const matchObj = RE_DATE.exec('1999-12-31')
const year = matchObj[1] // 1999
const month = matchObj[2] // 12
const day = matchObj[3] // 31
```

组匹配的一个问题是，每一组的匹配含义不容易看出来，而且只能用数字序号引用，要是组的顺序变了，引用的时候就必须修改序号。

ES2018 引入了[具名组匹配](https://github.com/tc39/proposal-regexp-named-groups)（Named Capture Groups），允许为每一个组匹配指定一个名字：

```js
const RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/

const matchObj = RE_DATE.exec('1999-12-31')
const year = matchObj.groups.year // "1999"
const month = matchObj.groups.month // "12"
const day = matchObj.groups.day // "31"
```

具名组匹配等于为每一组匹配加上了 ID。同时，数字序号（`matchObj[1]`）依然有效。

如果具名组没有匹配，那么对应的 `groups` 对象属性会是 `undefined`（键名始终存在）：

```js
const RE_OPT_A = /^(?<as>a+)?$/
const matchObj = RE_OPT_A.exec('')

matchObj.groups.as // undefined
'as' in matchObj.groups // true
```

如果使用 `|` 运算符，给出两种可选方案，那么同样名称的组匹配可以使用两次；其他情况，同一个名字的组匹配都只能出现一次：

```js
const RE = /(?<chars>a+)|(?<chars>b+)/v
```

**解构赋值和替换**

有了具名组匹配以后，可以使用解构赋值直接从匹配结果上为变量赋值：

```js
let {
  groups: { one, two },
} = /^(?<one>.*):(?<two>.*)$/u.exec('foo:bar')
one // foo
two // bar
```

字符串替换时，使用 `$<组名>` 引用具名组：

```js
let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u

'2015-01-02'.replace(re, '$<day>/$<month>/$<year>')
// '02/01/2015'
```

`replace` 方法的第二个参数也可以是函数，该函数的参数序列如下（具名组匹配新增了最后一个参数：具名组构成的对象）：

```js
'2015-01-02'.replace(
  re,
  (
    matched, // 整个匹配结果 2015-01-02
    capture1, // 第一个组匹配 2015
    capture2, // 第二个组匹配 01
    capture3, // 第三个组匹配 02
    position, // 匹配开始的位置 0
    S, // 原字符串 2015-01-02
    groups, // 具名组构成的一个对象 {year, month, day}
  ) => {
    let { day, month, year } = groups
    return `${day}/${month}/${year}`
  },
)
```

如果要在正则表达式内部引用某个"具名组匹配"，可以使用 `\k<组名>` 的写法；数字引用（`\1`）依然有效，两种语法还可以同时使用：

```js
const RE_TWICE = /^(?<word>[a-z]+)!\k<word>$/
RE_TWICE.test('abc!abc') // true
RE_TWICE.test('abc!ab') // false

const RE_TWICE2 = /^(?<word>[a-z]+)!\1$/
RE_TWICE2.test('abc!abc') // true

const RE_TWICE3 = /^(?<word>[a-z]+)!\k<word>!\1$/
RE_TWICE3.test('abc!abc!abc') // true
```

### **2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018)**

JavaScript 语言的正则表达式，原本只支持先行断言（lookahead）和先行否定断言（negative lookahead），不支持后行断言（lookbehind）和后行否定断言（negative lookbehind）。ES2018 引入[后行断言](https://github.com/tc39/proposal-regexp-lookbehind)，V8 引擎 4.9 版（Chrome 62）已经支持。

- **先行断言**：`x` 只有在 `y` 前面才匹配，写成 `/x(?=y)/`。
- **先行否定断言**：`x` 只有不在 `y` 前面才匹配，写成 `/x(?!y)/`。

```js
/\d+(?=%)/.exec('100% of US presidents have been male') // ["100"]
/\d+(?!%)/.exec('that’s all 44 of them') // ["44"]
```

"**先行断言**"括号之中的部分（`(?=%)`），是不计入返回结果的。

- **后行断言**：`x` 只有在 `y` 后面才匹配，写成 `/(?<=y)x/`。
- **后行否定断言**：`x` 只有不在 `y` 后面才匹配，写成 `/(?<!y)x/`。

```js
/(?<=\$)\d+/.exec('Benjamin Franklin is on the $100 bill') // ["100"]
/(?<!\$)\d+/.exec('it’s worth about €90') // ["90"]
```

下面的例子是使用后行断言进行字符串替换：

```js
const RE_DOLLAR_PREFIX = /(?<=\$)foo/g
'$foo %foo foo'.replace(RE_DOLLAR_PREFIX, 'bar')
// '$bar %foo foo'
```

"**后行断言**"的实现，需要先匹配 `/(?<=y)x/` 的 `x`，然后再回到左边匹配 `y` 的部分。这种"先右后左"的执行顺序，与所有其他正则操作相反，导致了一些不符合预期的行为。

首先，后行断言的组匹配，与正常情况下结果不一样（执行顺序从右到左，第二个括号变贪婪）：

```js
/(?<=(\d+)(\d+))$/.exec('1053') // ["", "1", "053"]
/^(\d+)(\d+)$/.exec('1053') // ["1053", "105", "3"]
```

其次，"**后行断言**"的反斜杠引用，也与通常的顺序相反，必须放在对应的那个括号之前：

```js
/(?<=(o)d\1)r/.exec('hodor') // null
/(?<=\1d(o))r/.exec('hodor') // ["r", "o"]
```

### **2.7 Unicode 属性类 (Unicode Property Escapes) `\p{...}` 和 `\P{...}` - (ES9/ES2018)**

ES2018 [引入](https://github.com/tc39/proposal-regexp-unicode-property-escapes)了 Unicode 属性类，允许使用 `\p{...}` 和 `\P{...}`（`\P` 是 `\p` 的否定形式）代表一类 Unicode 字符：

```js
const regexGreekSymbol = /\p{Script=Greek}/u
regexGreekSymbol.test('π') // true
```

Unicode 属性类的标准形式，需要同时指定属性名和属性值：

```js
\p{UnicodePropertyName=UnicodePropertyValue}
```

但是，对于某些属性，可以只写属性名，或者只写属性值：

```js
\p{UnicodePropertyName}
\p{UnicodePropertyValue}
```

注意，这两种类只对 Unicode 有效，所以使用的时候一定要加上 `u` 修饰符，否则会报错。

由于 Unicode 的各种属性非常多，所以这种新的类的表达能力非常强：

```js
const regex = /^\p{Decimal_Number}+$/u
regex.test('𝟏𝟐𝟑𝟜𝟝𝟞𝟩𝟪𝟫𝟬𝟭𝟮𝟯𝟺𝟻𝟼') // true
```

`\p{Number}` 甚至能匹配罗马数字：

```js
const regex = /^\p{Number}+$/u
regex.test('²³¹¼½¾') // true
regex.test('ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ') // true
```

下面是其他一些例子：

```js
// 匹配所有空格
\p{White_Space}

// 匹配十六进制字符
\p{Hex_Digit}

// 匹配各种文字的所有字母，等同于 Unicode 版的 \w
[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]

// 匹配 Emoji
/\p{Extended_Pictographic}/u

// 匹配所有的箭头字符
const regexArrows = /^\p{Block=Arrows}+$/u
regexArrows.test('←↑→↓↔↕↖↗↘↙⇏⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙⇧⇩') // true
```

### **2.8 索引匹配 (`d` 标志 / HasIndices) - (ES2022)**

组匹配的结果在原始字符串里的开始位置和结束位置，之前并不容易拿到。正则实例的 `exec()` 方法有一个 `index` 属性，可以获取整个匹配结果的开始位置，但组匹配的每个组的开始位置很难拿到。

[ES2022](https://github.com/tc39/proposal-regexp-match-Indices) 新增了 `d` 修饰符，可以让 `exec()`、`match()` 的返回结果添加 `indices` 属性，在该属性上面可以拿到匹配的开始位置和结束位置：

```js
const text = 'zabbcdef'
const re = /ab/d
const result = re.exec(text)

result.index // 1
result.indices // [ [1, 3] ]
```

`indices` 是一个数组，每个成员还是一个数组，包含匹配结果在原始字符串的开始位置和结束位置。注意，开始位置包含在匹配结果之中（第一个字符的位置），而结束位置不包含（是匹配结果的下一个字符）。

如果正则表达式包含组匹配，那么 `indices` 数组就会包含多个成员，提供每个组匹配的开始位置和结束位置：

```js
const text = 'zabbcdef'
const re = /ab+(cd)/d
const result = re.exec(text)

result.indices // [ [ 1, 6 ], [ 4, 6 ] ]
```

如果正则表达式包含具名组匹配，`indices` 属性数组还会有一个 `groups` 属性，可以从该对象获取具名组匹配的开始位置和结束位置：

```js
const text = 'zabbcdef'
const re = /ab+(?<Z>cd)/d
const result = re.exec(text)

result.indices.groups // { Z: [ 4, 6 ] }
```

如果组匹配不成功，`indices` 属性数组的对应成员则为 `undefined`，`indices.groups` 属性对象的对应成员也是 `undefined`：

```js
const text = 'zabbcdef'
const re = /ab+(?<Z>ce)?/d
const result = re.exec(text)

result.indices[1] // undefined
result.indices.groups['Z'] // undefined
```

## **3. 常见问题与最佳实践**

### 3.1 为什么 `RegExp` 构造函数中 `\` 需要双重转义？

- 因为构造函数的第一个参数是**字符串**。字符串内部的 `\` 已经被 JS 引擎解释为转义字符。如果要将 `\` 传递给正则表达式引擎，就需要 `\\`。

```js
;/\d+/.test('123') // 字面量
new RegExp('\\d+').test('123') // 构造函数，需要双斜杠
```

### 3.2 循环使用 `exec()` 查找所有匹配时，为什么有时会无限循环？

- 如果正则表达式有 `g` 标志，`exec()` 会在每次匹配成功后更新 `regex.lastIndex`。如果你的循环条件或模式没有正确更新 `lastIndex`，或者模式不能匹配到空字符串，可能会导致无限循环。
- **解决方案**: 确保 `lastIndex` 被正确管理。`String.prototype.matchAll()` 是一个更现代、更安全的替代方案。

### 3.3 `^` 和 `$` 在 `m` 标志下和没有 `m` 标志下有什么区别？

- **无 `m`**: `^` 匹配整个字符串的开头，`$` 匹配整个字符串的结尾。
- **有 `m`**: `^` 匹配整个字符串的开头**或**每行的开头，`$` 匹配整个字符串的结尾**或**每行的结尾。

### 3.4 正则表达式的性能优化有哪些？

- **预编译**:优先使用字面量创建正则表达式,因为它在脚本加载时编译,而不是每次运行时。
- **避免不必要的回溯**: 编写更精确的模式，避免 `(a|b|c)*` 这种过于宽泛的量词。
- **使用非捕获组 `(?:.)`**:如果你不需要捕获组的内容,使用非捕获组可以提高少量性能
- **先判断后匹配**: 如果只是检查是否存在,`test()` 通常比 `exec()` 或 `match()` 更快。
- **减少量词的贪婪性**: 默认量词是贪婪的（`*`, `+`, `{n,m}`），会尽可能多地匹配。使用 `?` 使其变为非贪婪（`*?`, `+?`, `{n,m}?`）。

### 3.5 什么时候用 `String.prototype.match()`，什么时候用 `RegExp.prototype.exec()`？

- **`match()`**:
  - **无 `g` 标志**: 返回 `exec()` 类似的结果。
  - **有 `g` 标志**: 返回一个包含所有匹配字符串的数组。
- **`exec()`**:
  - **无论是否有 `g` 标志**: 每次只返回一个匹配。**配合 `g` 标志**，可以通过循环迭代所有匹配，同时还能获取捕获组信息和 `lastIndex`。
- **`matchAll()`**: (ES2020) **推荐**，如果你需要所有匹配以及捕获组信息，并且 `g` 标志是强制的。它返回一个迭代器，避免了 `exec` 循环的繁琐。
