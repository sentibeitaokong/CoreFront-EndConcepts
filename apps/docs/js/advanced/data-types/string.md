# **JavaScript 字符串 (String)扩展**

字符串是 JavaScript 中用于处理文本的基本数据类型，ES6+ 引入了大量新特性，使字符串处理更强大灵活。

## **1. 字符串基础**

### **1.1 字符串的定义**

- **原始类型**：字符串是原始值，**不可变**。一旦创建就不能改变内容，所有看似"**修改**"的操作实际都是创建了新字符串。
- **字面量**：单引号 (`''`)、双引号 (`""`) 或反引号（`` ` `` - ES6+ 模板字面量）。

```js
let str1 = 'Hello'
let str2 = 'World'
let str3 = `JavaScript` // 模板字面量
```

### **1.2 字符串的基本属性**

- **`length`**：字符串中字符的数量。

```js
'Hello'.length // 5
```

## **2. [字符串的常用方法 (API)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/String)**

### 2.1 字符串静态方法 (String)

这些方法通过 `String.` 直接调用。

#### String.fromCodePoint()

ES5 的 `String.fromCharCode()` 不能识别码点大于 `0xFFFF` 的字符（会溢出）。ES6 的 `String.fromCodePoint()` 可以识别，与 `codePointAt()` 作用相反：

```js
String.fromCharCode(0x20bb7) // "ஷ"

String.fromCodePoint(0x20bb7) // "𠮷"
String.fromCodePoint(0x78, 0x1f680, 0x79) === 'x🚀y' // true（多参数合并）
```

注意：`fromCodePoint` 定义在 `String` 对象上，`codePointAt` 定义在字符串实例上。

#### String.raw()

返回斜杠都被转义的字符串（斜杠前再加一个斜杠），常用于模板字符串处理：

```js
String.raw`Hi\n${2 + 3}!` // "Hi\\n5!"（显示为 "Hi\n5!"）
```

本质上是一个专用于模板字符串的标签函数。写成普通函数时，第一个参数应为含 `raw` 属性（数组）的对象：

```js
String.raw({ raw: ['foo', 'bar'] }, 1 + 2) // "foo3bar"
```

[width(22,13,42,23)]

| 方法                                   | ES 版本 | 描述                                                                                       | 示例                                 |
| -------------------------------------- | ------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| String.raw(callSite, ...substitutions) | ES6     | 作为标签模板函数使用，返回模板字面量的原始字符串形式（未处理转义字符）。                   | String.raw`hi\\n` -> 'hi\\\\n'       |
| String.fromCodePoint(...codePoints)    | ES6     | 根据 Unicode 码点（一个或多个）创建字符串，解决 fromCharCode() 无法处理 4 字节字符的问题。 | String.fromCodePoint(128514) -> '😂' |

### 2.2 字符串原型方法 (String.prototype)

这些方法通过字符串实例 (`myString.method()`) 调用。

#### codePointAt()

JS 内部字符以 UTF-16 存储（每字符 2 字节），4 字节字符（码点大于 `0xFFFF`）会被当作两个字符，`length` 误判为 2。`codePointAt()` 能正确处理 4 字节字符，返回完整码点：

```js
let s = '𠮷a'
s.codePointAt(0) // 134071（0x20BB7）
s.codePointAt(1) // 57271
s.codePointAt(2) // 97
```

参数仍是UTF-16单元位置，所以 `a` 的位置是2而非1。正确遍历 4 字节字符可用 `for...of` 或扩展运算符：

```js
let s = '𠮷a'
for (let ch of s)
  console.log(ch.codePointAt(0).toString(16)) // 20bb7, 61
;[...'𠮷a'].length // 2
```

测试字符是 2 字节还是 4 字节：

```js
function is32Bit(c) {
  return c.codePointAt(0) > 0xffff
}
```

#### normalize()

同一字符可用"**预合成字符**"（`Ǒ`）或"**原字符+重音符号**"（`Ǒ`）两种表示，视觉语义等价但 JS 认为不相等（`length` 也不同）。`normalize()` 将其统一为同一形式：

```js
'Ǒ'.normalize() === 'Ǒ'.normalize() // true
```

`normalize(form)` 的四个参数：`NFC`（默认，标准等价合成）、`NFD`（标准等价分解）、`NFKC`（兼容等价合成）、`NFKD`（兼容等价分解）。

#### includes(), startsWith(), endsWith()

传统上只有 `indexOf` 判断包含。ES6 新增三个布尔值方法：

- `includes()`：是否包含参数字符串
- `startsWith()`：是否在头部
- `endsWith()`：是否在尾部

```js
let s = 'Hello world!'
s.startsWith('Hello') // true
s.endsWith('!') // true
s.includes('o') // true
```

都支持第二个参数 `n`（开始搜索位置）。注意 `endsWith` 针对**前 n 个字符**，其他两个针对从第 n 位到结束：

```js
s.startsWith('world', 6) // true
s.endsWith('Hello', 5) // true
s.includes('Hello', 6) // false
```

#### repeat()

返回将原字符串重复 `n` 次的新字符串：

```js
'x'.repeat(3) // "xxx"
'hello'.repeat(2) // "hellohello"
```

参数为小数会取整；负数或 `Infinity` 报 `RangeError`；`0` 到 `-1` 之间的小数、`NaN` 视为 0；字符串参数先转成数字。

#### padStart()，padEnd()

ES2017 引入字符串补全。`padStart()` 头部补全，`padEnd()` 尾部补全：

```js
'x'.padStart(5, 'ab') // 'ababx'
'x'.padEnd(4, 'ab') // 'xaba'
```

- 第一个参数是补全后的最大长度，第二个参数是补全字符串。
- 原字符串长度 ≥ 最大长度则不生效；补全超出会截断；省略第二个参数默认空格。
- 常见用途：数值补全指定位数 `'1'.padStart(10, '0')`、提示格式 `'12'.padStart(10, 'YYYY-MM-DD')`。

#### trimStart()，trimEnd()

ES2019 新增，行为与 `trim()` 一致，分别消除头部/尾部空白（含空格、tab、换行等），返回新字符串：

```js
const s = '  abc  '
s.trim() // "abc"
s.trimStart() // "abc  "
s.trimEnd() // "  abc"
```

浏览器还部署了别名 `trimLeft()`/`trimRight()`。

#### matchAll()

返回正则表达式在当前字符串的所有匹配的迭代器，详见[《正则的扩展》](/js/advanced/data-types/regExp)。

#### replaceAll()

历史上 `replace()` 只能替换第一个匹配，替换所有需用正则 `g` 修饰符。ES2021 引入 `replaceAll()` 一次性替换所有匹配：

```js
'aabbcc'.replace('b', '_') // 'aa_bcc'
'aabbcc'.replace(/b/g, '_') // 'aa__cc'
'aabbcc'.replaceAll('b', '_') // 'aa__cc'
```

- 用法与 `replace()` 相同，返回新字符串。
- `searchValue` 可以是字符串或**带 g 的正则**；不带 g 的正则会导致 `replaceAll()` 报错（与 `replace()` 不同）。
- `replacement` 字符串支持特殊模式：`$&`（匹配字符串）、`` $` ``（匹配前文本）、`$'`（匹配后文本）、`$n`（第 n 组）、`$$`（美元符号）。
- `replacement` 也可以是函数，返回值替换匹配文本。

```js
'abbc'.replaceAll(/(ab)(bc)/g, '$2$1') // 'bcab'
'aabbcc'.replaceAll('b', () => '_') // 'aa__cc'
```

#### at()

接受整数参数，返回指定位置字符，支持负索引（倒数）：

```js
const str = 'hello'
str.at(1) // "e"
str.at(-1) // "o"
```

超出范围返回 `undefined`。来自数组的 `at()` 方法。

#### toWellFormed()

ES2024 新增，处理 Unicode 代理字符对（surrogates）问题。UTF-16 用 `U+D800`~`U+DFFF` 空字符段表示代理对；字符串里若出现**单个**代理字符（未配对）会导致无法解读。`toWellFormed()` 返回新字符串，将单个代理字符替换为 `U+FFFD`：

```js
'ab\uD800'.toWellFormed() // 'ab�'

const illFormed = 'https://example.com/search?q=\uD800'
encodeURI(illFormed) // 报错
encodeURI(illFormed.toWellFormed()) // 正确
```

[width(16,15,24,23,22)]

| 方法                                 | ES 版本           | 描述                                                                                   | 关键行为/参数                                                            | 示例                                                                          |
| ------------------------------------ | ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| codePointAt(index)                   | ES6               | 正确返回指定索引位置字符的 Unicode 码点，解决 charCodeAt() 无法处理 4 字节字符的问题。 | index: 字符位置（基于 UTF-16 单元），4 字节字符仍需指向其第一个单元。    | '𠮷a'.codePointAt(0) -> 134071 ('𠮷a'.codePointAt(0)).toString(16) -> "20bb7" |
| normalize(form)                      | ES6               | 将 Unicode 字符串的不同表示方法统一为指定形式（Unicode 正规化）。                      | form: NFC(默认), NFD, NFKC, NFKD。                                       | '\\u01D1'.normalize() === '\\u004F\\u030C'.normalize() -> true                |
| includes(substring, position)        | ES6               | 检查字符串是否包含指定子串。                                                           | position: (可选) 开始搜索索引，默认 0。                                  | 'Hello world!'.includes('o') -> true                                          |
| startsWith(prefix, position)         | ES6               | 检查字符串是否以指定前缀开头。                                                         | position: (可选) 视为"开头"的索引，默认 0。                              | 'Hello world!'.startsWith('world', 6) -> true                                 |
| endsWith(suffix, position)           | ES6               | 检查字符串是否以指定后缀结尾。                                                         | position: (可选) 逻辑结束位置（针对前 position 个字符），默认 length。   | 'Hello world!'.endsWith('Hello', 5) -> true                                   |
| repeat(count)                        | ES6               | 将原字符串重复 count 次，返回新字符串。                                                | count: 取整；负数/Infinity 报错；0~-1 之间视为 0；NaN 视为 0。           | 'x'.repeat(3) -> "xxx"                                                        |
| padStart(targetLength, padString)    | ES2017            | 从头部补全，直到达到 targetLength。                                                    | padString: (可选) 补全字符串，默认空格。                                 | '5'.padStart(2, '0') -> "05"                                                  |
| padEnd(targetLength, padString)      | ES2017            | 从尾部补全，直到达到 targetLength。                                                    | padString: (可选) 补全字符串，默认空格。                                 | 'x'.padEnd(4, 'ab') -> "xaba"                                                 |
| trimStart()                          | ES2019            | 消除头部空白符（空格、tab、换行等）。                                                  | 无                                                                       | const s = ' abc '; s.trimStart() -> "abc "                                    |
| trimEnd()                            | ES2019            | 消除尾部空白符。                                                                       | 无                                                                       | const s = ' abc '; s.trimEnd() -> " abc"                                      |
| matchAll(regexp)                     | ES2020            | 返回所有匹配的迭代器。                                                                 | regexp: 必须是带 g 标志的正则。                                          | [...'aabb'.matchAll(/a/g)] -> [['a'], ['a']]                                  |
| replaceAll(searchValue, replacement) | ES2021            | 替换所有匹配的子串。                                                                   | searchValue: 字符串或带 g 的正则；replacement: 字符串（支持 $n）或函数。 | 'aabbcc'.replaceAll('b', '\_') -> "aa\_\_cc"                                  |
| at(index)                            | Stage 3 (ES2024+) | 返回指定位置字符，支持负索引。                                                         | index: 可为负数。                                                        | const str = 'hello'; str.at(-1) -> "o"                                        |
| toWellFormed()                       | ES2024            | 处理代理字符对，将单个代理字符替换为 U+FFFD。                                          | 无                                                                       | "ab\uD800".toWellFormed() -> 'ab'                                             |

## **3. ES6+ 字符串扩展**

### **3.1 模板字面量 (Template Literals)**

- **定义**：使用反引号（`` ` ``）定义字符串。
- **特性**：多行字符串（直接换行）、变量插值 `${expression}`（任意 JS 表达式）、支持函数调用与运算。

传统的字符串拼接写法繁琐：

```js
// 传统写法
'There are <b>' +
  basket.count +
  '</b> items in your basket, <em>' +
  basket.onSale +
  '</em> are on sale!'
  // 模板字符串
  `There are <b>${basket.count}</b> items in your basket, <em>${basket.onSale}</em> are on sale!`
```

多行字符串会保留所有空格和缩进（不想要可用 `trim()`）：

```js
$('#list').html(`
<ul>
  <li>first</li>
  <li>second</li>
</ul>
`)
```

`${}` 内可放入任意表达式、引用对象属性、调用函数：

```js
let x = 1,
  y = 2`${x} + ${y} = ${x + y}` // "1 + 2 = 3"
let obj = { x: 1, y: 2 }`${obj.x + obj.y}` // "3"
```

若大括号内值不是字符串会按规则转字符串(对象调用 `toString`),变量未声明会报错,模板字符串还可嵌套。

### **3.2 标签模板 (Tagged Templates)**

模板字符串可紧跟在一个函数名后面，该函数被调用来处理它，称为"**标签模板**"。

- **参数**：第一个参数是**字符串数组**（插值表达式之间的静态部分），后续参数是**各插值表达式的值**。

```js
let a = 5,
  b = 10
tag`Hello ${a + b} world ${a * b}`
// 等同于
tag(['Hello ', ' world ', ''], 15, 50)
```

标签函数用 rest 参数接收：

```js
function tag(strings, ...values) {
  // strings 是静态字符串数组，values 是插值结果
}
```

**应用一：过滤 HTML，防 XSS**：

```js
let sender = '<script>alert("abc")</script>'
let message = SaferHTML`<p>${sender} has sent you a message.</p>`
// <p>&lt;script&gt;alert("abc")&lt;/script&gt; has sent you a message.</p>
```

**应用二：多语言转换（国际化）**、嵌入其他语言（JSX、Java 等）。

模板字符串数组还有个 `raw` 属性，保存转义前的原始字符串：

```js
tag`First line\nSecond line`
function tag(strings) {
  console.log(strings.raw[0]) // "First line\\nSecond line"
}
```

### **3.3 Unicode 字符串支持**

ES6 允许 `\u{xxxxxx}` 用完整码点表示字符（`\uxxxx` 只支持 `0x0000`~`0xFFFF`）：

```js
'\u{20BB7}' // "𠮷"
'\u{41}\u{42}\u{43}' // "ABC"
'\u{1F680}' === '🚀' // true
```

ES6 为字符串添加了遍历器接口，`for...of` 能正确识别 4 字节字符（传统 `for` 循环不能）：

```js
let text = String.fromCodePoint(0x20bb7)
for (let i of text) console.log(i) // "𠮷"
```

## **4. 常见问题与最佳实践 (FAQ)**

### 4.1 字符串是可变的吗？

**不是**。JS 字符串是**不可变**的原始值，所有看似修改字符串的操作（`replace()`、`toLowerCase()` 等）实际都创建了新字符串并返回。

### 4.2 什么时候用单引号，什么时候用双引号？

都可以，没有功能区别。选择一种并在项目中保持**一致性**即可。多数项目选单引号（避免转义 HTML 属性）。最佳实践：用 ESLint + Prettier 强制统一。

### 4.3 模板字面量有什么性能开销吗？

相比传统字符串拼接，模板字面量在现代引擎中性能**不相上下甚至更好**（引擎能更好优化）。最佳实践：优先使用模板字面量（可读性和便利性更好）。

### 4.4 `slice`、`substring`、`substr` 有什么区别？

[width(44,22,34)]

| 方法                              | 参数            | 负数处理                   |
| :-------------------------------- | :-------------- | :------------------------- |
| `slice(start, end)`               | 起止索引        | 负数从末尾算               |
| `substring(start, end)`           | 起止索引        | 负数当作 0，start>end 交换 |
| `substr(start, length)`（已废弃） | 起始索引 + 长度 | start 负数从末尾算         |

最佳实践：优先用 `slice()`（行为直观、支持负数），避免使用已废弃的 `substr()`。

### 4.5 如何处理字符串中的 HTML 特殊字符？

JS **没有内置**的 HTML 转义函数，需自己实现或借助标签模板：

```js
function escapeHTML(strings, ...values) {
  let str = ''
  strings.forEach((s, i) => {
    str += s
    if (i < values.length) {
      str += String(values[i])
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }
  })
  return str
}
const safeHTML = escapeHTML`<div>${userInput}</div>`
```

### 4.6 为什么 `replaceAll` 是 ES2021 才引入的？之前怎么替换所有匹配项？

之前替换所有匹配需用正则加 `g` 标志：

```js
const str = 'banana'
str.replace(/na/g, 'xx') // 'baxxxxa'（旧方法）
str.replaceAll('na', 'xx') // 'baxxxxa'（新方法）
```

`replaceAll` 让"**不使用正则替换所有匹配**"更方便直观。
