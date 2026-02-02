# **JavaScript 字符串 (String)扩展**
字符串是 JavaScript 中用于处理文本的基本数据类型,在 ES6 之前，字符串的操作相对单一；ES6+ 引入了大量新特性，使得字符串处理变得更加强大、灵活和方便。

## **1. 字符串基础**

### **1.1 字符串的定义**

*   **原始类型**: 字符串是原始值，**不可变**。一旦创建，就不能改变其内容。所有看似“修改”字符串的操作，实际上都是创建了一个新的字符串。
*   **字面量**: 使用单引号 (`''`)、双引号 (`""`) 或反引号 (`` `` ` `` - ES6+ 模板字面量)。

```js
let str1 = 'Hello';
let str2 = "World";
let str3 = `JavaScript`; // 模板字面量
```

### **1.2 字符串的基本属性**

*   **`length`**: 字符串中字符的数量。
    ```js
    'Hello'.length; // 5
    ```

## **2. [字符串的常用方法 (API)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/String/String)**

字符串对象的新增方法。
### 1.字符串静态方法 (String)

这些方法通过 String. 直接调用。

#### 1. String.fromCodePoint()

ES5 提供`String.fromCharCode()`方法，用于从 Unicode 码点返回对应字符，但是这个方法不能识别码点大于`0xFFFF`的字符。

```js
String.fromCharCode(0x20BB7)
// "ஷ"
```

上面代码中，`String.fromCharCode()`不能识别大于`0xFFFF`的码点，所以`0x20BB7`就发生了溢出，最高位`2`被舍弃了，最后返回码点`U+0BB7`对应的字符，而不是码点`U+20BB7`对应的字符。

ES6 提供了`String.fromCodePoint()`方法，可以识别大于`0xFFFF`的字符，弥补了`String.fromCharCode()`方法的不足。在作用上，正好与下面的`codePointAt()`方法相反。

```js
String.fromCodePoint(0x20BB7)
// "𠮷"
String.fromCodePoint(0x78, 0x1f680, 0x79) === 'x\uD83D\uDE80y'
// true
```

上面代码中，如果`String.fromCodePoint`方法有多个参数，则它们会被合并成一个字符串返回。

注意，`fromCodePoint`方法定义在`String`对象上，而`codePointAt`方法定义在字符串的实例对象上。

#### 2. String.raw()

ES6 还为原生的 String 对象，提供了一个`raw()`方法。该方法返回一个斜杠都被转义（即斜杠前面再加一个斜杠）的字符串，往往用于模板字符串的处理方法。

```js
String.raw`Hi\n${2+3}!`
// 实际返回 "Hi\\n5!"，显示的是转义后的结果 "Hi\n5!"

String.raw`Hi\u000A!`;
// 实际返回 "Hi\\u000A!"，显示的是转义后的结果 "Hi\u000A!"
```

如果原字符串的斜杠已经转义，那么`String.raw()`会进行再次转义。

```js
String.raw`Hi\\n`
// 返回 "Hi\\\\n"

String.raw`Hi\\n` === "Hi\\\\n" // true
```

`String.raw()`方法可以作为处理模板字符串的基本方法，它会将所有变量替换，而且对斜杠进行转义，方便下一步作为字符串来使用。

`String.raw()`本质上是一个正常的函数，只是专用于模板字符串的标签函数。如果写成正常函数的形式，它的第一个参数，应该是一个具有`raw`属性的对象，且`raw`属性的值应该是一个数组，对应模板字符串解析后的值。

```js
// `foo${1 + 2}bar`
// 等同于
String.raw({ raw: ['foo', 'bar'] }, 1 + 2) // "foo3bar"
```

上面代码中，`String.raw()`方法的第一个参数是一个对象，它的`raw`属性等同于原始的模板字符串解析后得到的数组。

作为函数，`String.raw()`的代码实现基本如下。

```js
String.raw = function (strings, ...values) {
  let output = '';
  let index;
  for (index = 0; index < values.length; index++) {
    output += strings.raw[index] + values[index];
  }

  output += strings.raw[index]
  return output;
}
```
| 方法                                     | ES 版本 | 描述                                                                           | 返回值    | 示例                                   |
|----------------------------------------|-------|------------------------------------------------------------------------------|--------|--------------------------------------|
| String.raw(callSite, ...substitutions) | ES6   | 作为标签模板函数使用，返回模板字面量的原始字符串形式（未处理转义字符）。                                         | string | String.raw`hi\\n` -> 'hi\\\\n'       |
| String.fromCodePoint(...codePoints)    | ES6   | 根据 Unicode 码点（一个或多个）创建字符串。解决了 String.fromCharCode() 无法处理 4 字节 Unicode 字符的问题。 | string | String.fromCodePoint(128514) -> '😂' |

### 2. 字符串原型方法 (String.prototype)

这些方法通过字符串实例 (myString.method()) 调用。

#### 1. codePointAt()

JavaScript 内部，字符以 UTF-16 的格式储存，每个字符固定为`2`个字节。对于那些需要`4`个字节储存的字符（Unicode 码点大于`0xFFFF`的字符），JavaScript 会认为它们是两个字符。

```js
var s = "𠮷";

s.length // 2
s.charAt(0) // ''
s.charAt(1) // ''
s.charCodeAt(0) // 55362
s.charCodeAt(1) // 57271
```

上面代码中，汉字“𠮷”（注意，这个字不是“吉祥”的“吉”）的码点是`0x20BB7`，UTF-16 编码为`0xD842 0xDFB7`（十进制为`55362 57271`），需要`4`个字节储存。对于这种`4`个字节的字符，JavaScript 不能正确处理，字符串长度会误判为`2`，而且`charAt()`方法无法读取整个字符，`charCodeAt()`方法只能分别返回前两个字节和后两个字节的值。

ES6 提供了`codePointAt()`方法，能够正确处理 4 个字节储存的字符，返回一个字符的码点。

```js
let s = '𠮷a';

s.codePointAt(0) // 134071
s.codePointAt(1) // 57271

s.codePointAt(2) // 97
```

`codePointAt()`方法的参数，是字符在字符串中的位置（从 0 开始）。上面代码中，JavaScript 将“𠮷a”视为三个字符，codePointAt 方法在第一个字符上，正确地识别了“𠮷”，返回了它的十进制码点 134071（即十六进制的`20BB7`）。在第二个字符（即“𠮷”的后两个字节）和第三个字符“a”上，`codePointAt()`方法的结果与`charCodeAt()`方法相同。

总之，`codePointAt()`方法会正确返回 32 位的 UTF-16 字符的码点。对于那些两个字节储存的常规字符，它的返回结果与`charCodeAt()`方法相同。

`codePointAt()`方法返回的是码点的十进制值，如果想要十六进制的值，可以使用`toString()`方法转换一下。

```js
let s = '𠮷a';

s.codePointAt(0).toString(16) // "20bb7"
s.codePointAt(2).toString(16) // "61"
```

你可能注意到了，`codePointAt()`方法的参数，仍然是不正确的。比如，上面代码中，字符`a`在字符串`s`的正确位置序号应该是 1，但是必须向`codePointAt()`方法传入 2。解决这个问题的一个办法是使用`for...of`循环，因为它会正确识别 32 位的 UTF-16 字符。

```js
let s = '𠮷a';
for (let ch of s) {
  console.log(ch.codePointAt(0).toString(16));
}
// 20bb7
// 61
```

另一种方法也可以，使用扩展运算符（`...`）进行展开运算。

```js
let arr = [...'𠮷a']; // arr.length === 2
arr.forEach(
  ch => console.log(ch.codePointAt(0).toString(16))
);
// 20bb7
// 61
```

`codePointAt()`方法是测试一个字符由两个字节还是由四个字节组成的最简单方法。

```js
function is32Bit(c) {
  return c.codePointAt(0) > 0xFFFF;
}

is32Bit("𠮷") // true
is32Bit("a") // false
```

####  2. normalize()

许多欧洲语言有语调符号和重音符号。为了表示它们，Unicode 提供了两种方法。一种是直接提供带重音符号的字符，比如`Ǒ`（\u01D1）。另一种是提供合成符号（combining character），即原字符与重音符号的合成，两个字符合成一个字符，比如`O`（\u004F）和`ˇ`（\u030C）合成`Ǒ`（\u004F\u030C）。

这两种表示方法，在视觉和语义上都等价，但是 JavaScript 不能识别。

```js
'\u01D1'==='\u004F\u030C' //false

'\u01D1'.length // 1
'\u004F\u030C'.length // 2
```

上面代码表示，JavaScript 将合成字符视为两个字符，导致两种表示方法不相等。

ES6 提供字符串实例的`normalize()`方法，用来将字符的不同表示方法统一为同样的形式，这称为 Unicode 正规化。

```js
'\u01D1'.normalize() === '\u004F\u030C'.normalize()
// true
```

`normalize`方法可以接受一个参数来指定`normalize`的方式，参数的四个可选值如下。

- `NFC`，默认参数，表示“标准等价合成”（Normalization Form Canonical Composition），返回多个简单字符的合成字符。所谓“标准等价”指的是视觉和语义上的等价。
- `NFD`，表示“标准等价分解”（Normalization Form Canonical Decomposition），即在标准等价的前提下，返回合成字符分解的多个简单字符。
- `NFKC`，表示“兼容等价合成”（Normalization Form Compatibility Composition），返回合成字符。所谓“兼容等价”指的是语义上存在等价，但视觉上不等价，比如“囍”和“喜喜”。（这只是用来举例，`normalize`方法不能识别中文。）
- `NFKD`，表示“兼容等价分解”（Normalization Form Compatibility Decomposition），即在兼容等价的前提下，返回合成字符分解的多个简单字符。

```js
'\u004F\u030C'.normalize('NFC').length // 1
'\u004F\u030C'.normalize('NFD').length // 2
```

上面代码表示，`NFC`参数返回字符的合成形式，`NFD`参数返回字符的分解形式。

不过，`normalize`方法目前不能识别三个或三个以上字符的合成。这种情况下，还是只能使用正则表达式，通过 Unicode 编号区间判断。

####  3. includes(), startsWith(), endsWith()

传统上，JavaScript 只有`indexOf`方法，可以用来确定一个字符串是否包含在另一个字符串中。ES6 又提供了三种新方法。

- **includes()**：返回布尔值，表示是否找到了参数字符串。
- **startsWith()**：返回布尔值，表示参数字符串是否在原字符串的头部。
- **endsWith()**：返回布尔值，表示参数字符串是否在原字符串的尾部。

```js
let s = 'Hello world!';

s.startsWith('Hello') // true
s.endsWith('!') // true
s.includes('o') // true
```

这三个方法都支持第二个参数，表示开始搜索的位置。

```js
let s = 'Hello world!';

s.startsWith('world', 6) // true
s.endsWith('Hello', 5) // true
s.includes('Hello', 6) // false
```

上面代码表示，使用第二个参数`n`时，`endsWith`的行为与其他两个方法有所不同。它针对前`n`个字符，而其他两个方法针对从第`n`个位置直到字符串结束。

####  4. repeat()

`repeat`方法返回一个新字符串，表示将原字符串重复`n`次。

```js
'x'.repeat(3) // "xxx"
'hello'.repeat(2) // "hellohello"
'na'.repeat(0) // ""
```

参数如果是小数，会被取整。

```js
'na'.repeat(2.9) // "nana"
```

如果`repeat`的参数是负数或者`Infinity`，会报错。

```js
'na'.repeat(Infinity)
// RangeError
'na'.repeat(-1)
// RangeError
```

但是，如果参数是 0 到-1 之间的小数，则等同于 0，这是因为会先进行取整运算。0 到-1 之间的小数，取整以后等于`-0`，`repeat`视同为 0。

```js
'na'.repeat(-0.9) // ""
```

参数`NaN`等同于 0。

```js
'na'.repeat(NaN) // ""
```

如果`repeat`的参数是字符串，则会先转换成数字。

```js
'na'.repeat('na') // ""
'na'.repeat('3') // "nanana"
```

####  5. padStart()，padEnd()

ES2017 引入了字符串补全长度的功能。如果某个字符串不够指定长度，会在头部或尾部补全。`padStart()`用于头部补全，`padEnd()`用于尾部补全。

```js
'x'.padStart(5, 'ab') // 'ababx'
'x'.padStart(4, 'ab') // 'abax'

'x'.padEnd(5, 'ab') // 'xabab'
'x'.padEnd(4, 'ab') // 'xaba'
```

上面代码中，`padStart()`和`padEnd()`一共接受两个参数，第一个参数是字符串补全生效的最大长度，第二个参数是用来补全的字符串。

如果原字符串的长度，等于或大于最大长度，则字符串补全不生效，返回原字符串。

```js
'xxx'.padStart(2, 'ab') // 'xxx'
'xxx'.padEnd(2, 'ab') // 'xxx'
```

如果用来补全的字符串与原字符串，两者的长度之和超过了最大长度，则会截去超出位数的补全字符串。

```js
'abc'.padStart(10, '0123456789')
// '0123456abc'
```

如果省略第二个参数，默认使用空格补全长度。

```js
'x'.padStart(4) // '   x'
'x'.padEnd(4) // 'x   '
```

`padStart()`的常见用途是为数值补全指定位数。下面代码生成 10 位的数值字符串。

```js
'1'.padStart(10, '0') // "0000000001"
'12'.padStart(10, '0') // "0000000012"
'123456'.padStart(10, '0') // "0000123456"
```

另一个用途是提示字符串格式。

```js
'12'.padStart(10, 'YYYY-MM-DD') // "YYYY-MM-12"
'09-12'.padStart(10, 'YYYY-MM-DD') // "YYYY-09-12"
```

####  6. trimStart()，trimEnd()

[ES2019](https://github.com/tc39/proposal-string-left-right-trim) 对字符串实例新增了`trimStart()`和`trimEnd()`这两个方法。它们的行为与`trim()`一致，`trimStart()`消除字符串头部的空格，`trimEnd()`消除尾部的空格。它们返回的都是新字符串，不会修改原始字符串。

```js
const s = '  abc  ';

s.trim() // "abc"
s.trimStart() // "abc  "
s.trimEnd() // "  abc"
```

上面代码中，`trimStart()`只消除头部的空格，保留尾部的空格。`trimEnd()`也是类似行为。

除了空格键，这两个方法对字符串头部（或尾部）的 tab 键、换行符等不可见的空白符号也有效。

浏览器还部署了额外的两个方法，`trimLeft()`是`trimStart()`的别名，`trimRight()`是`trimEnd()`的别名。

####  7. matchAll()

`matchAll()`方法返回一个正则表达式在当前字符串的所有匹配，详见[《正则的扩展》](/js/regExp)。

####  8. replaceAll()

历史上，字符串的实例方法`replace()`只能替换第一个匹配。

```js
'aabbcc'.replace('b', '_')
// 'aa_bcc'
```

上面例子中，`replace()`只将第一个`b`替换成了下划线。

如果要替换所有的匹配，不得不使用正则表达式的`g`修饰符。

```js
'aabbcc'.replace(/b/g, '_')
// 'aa__cc'
```

正则表达式毕竟不是那么方便和直观，[ES2021](https://github.com/tc39/proposal-string-replaceall) 引入了`replaceAll()`方法，可以一次性替换所有匹配。

```js
'aabbcc'.replaceAll('b', '_')
// 'aa__cc'
```

它的用法与`replace()`相同，返回一个新字符串，不会改变原字符串。

```js
String.prototype.replaceAll(searchValue, replacement)
```

上面代码中，`searchValue`是搜索模式，可以是一个字符串，也可以是一个全局的正则表达式（带有`g`修饰符）。

如果`searchValue`是一个不带有`g`修饰符的正则表达式，`replaceAll()`会报错。这一点跟`replace()`不同。

```js
// 不报错
'aabbcc'.replace(/b/, '_')

// 报错
'aabbcc'.replaceAll(/b/, '_')
```

上面例子中，`/b/`不带有`g`修饰符，会导致`replaceAll()`报错。

`replaceAll()`的第二个参数`replacement`是一个字符串，表示替换的文本，其中可以使用一些特殊字符串。

- `$&`：匹配的字符串。
- `` $` ``：匹配结果前面的文本。
- `$'`：匹配结果后面的文本。
- `$n`：匹配成功的第`n`组内容，`n`是从1开始的自然数。这个参数生效的前提是，第一个参数必须是正则表达式。
- `$$`：指代美元符号`$`。

下面是一些例子。

```js
// $& 表示匹配的字符串，即`b`本身
// 所以返回结果与原字符串一致
'abbc'.replaceAll('b', '$&')
// 'abbc'

// $` 表示匹配结果之前的字符串
// 对于第一个`b`，$` 指代`a`
// 对于第二个`b`，$` 指代`ab`
'abbc'.replaceAll('b', '$`')
// 'aaabc'

// $' 表示匹配结果之后的字符串
// 对于第一个`b`，$' 指代`bc`
// 对于第二个`b`，$' 指代`c`
'abbc'.replaceAll('b', `$'`)
// 'abccc'

// $1 表示正则表达式的第一个组匹配，指代`ab`
// $2 表示正则表达式的第二个组匹配，指代`bc`
'abbc'.replaceAll(/(ab)(bc)/g, '$2$1')
// 'bcab'

// $$ 指代 $
'abc'.replaceAll('b', '$$')
// 'a$c'
```

`replaceAll()`的第二个参数`replacement`除了为字符串，也可以是一个函数，该函数的返回值将替换掉第一个参数`searchValue`匹配的文本。

```js
'aabbcc'.replaceAll('b', () => '_')
// 'aa__cc'
```

上面例子中，`replaceAll()`的第二个参数是一个函数，该函数的返回值会替换掉所有`b`的匹配。

这个替换函数可以接受多个参数。第一个参数是捕捉到的匹配内容，第二个参数是捕捉到的组匹配（有多少个组匹配，就有多少个对应的参数）。此外，最后还可以添加两个参数，倒数第二个参数是捕捉到的内容在整个字符串中的位置，最后一个参数是原字符串。

```js
const str = '123abc456';
const regex = /(\d+)([a-z]+)(\d+)/g;

function replacer(match, p1, p2, p3, offset, string) {
  return [p1, p2, p3].join(' - ');
}

str.replaceAll(regex, replacer)
// 123 - abc - 456
```

上面例子中，正则表达式有三个组匹配，所以`replacer()`函数的第一个参数`match`是捕捉到的匹配内容（即字符串`123abc456`），后面三个参数`p1`、`p2`、`p3`则依次为三个组匹配。

####  9. at()

`at()`方法接受一个整数作为参数，返回参数指定位置的字符，支持负索引（即倒数的位置）。

```js
const str = 'hello';
str.at(1) // "e"
str.at(-1) // "o"
```

如果参数位置超出了字符串范围，`at()`返回`undefined`。

该方法来自数组添加的`at()`方法，目前还是一个第三阶段的提案，可以参考《数组》一章的介绍。

####  10. toWellFormed()

ES2024 引入了新的字符串方法`toWellFormed()`，用来处理 Unicode 的代理字符对问题（surrogates）。

JavaScript 语言内部使用 UTF-16 格式，表示每个字符。UTF-16 只有16位，只能表示码点在`U+0000`到`U+FFFF`之间的 Unicode 字符。对于码点大于`U+FFFF`的 Unicode 字符（即码点大于16位的字符，`U+10000`到`U+10FFFF`），解决办法是使用代理字符对，即用两个 UTF-16 字符组合表示。

具体来说，UTF-16 规定，`U+D800`至`U+DFFF`是空字符段，专门留给代理字符对使用。只要遇到这个范围内的码点，就知道它是代理字符对，本身没有意义，必须两个字符结合在一起解读。其中，前一个字符的范围规定为`0xD800`到`0xDBFF`之间，后一个字符的范围规定为`0xDC00`到`0xDFFF`之间。举例来说，码点`U+1D306`对应的字符为`𝌆`，它写成 UTF-16 就是`0xD834 0xDF06`。

但是，字符串里面可能会出现单个代理字符对，即`U+D800`至`U+DFFF`里面的字符，它没有配对的另一个字符，无法进行解读，导致出现各种状况。

`.toWellFormed()`就是为了解决这个问题，不改变原始字符串，返回一个新的字符串，将原始字符串里面的单个代理字符对，都替换为`U+FFFD`，从而可以在任何正常处理字符串的函数里面使用。

```js
"ab\uD800".toWellFormed() // 'ab�'
```

上面示例中，`\uD800`是单个的代理字符对，单独使用时没有意义。`toWellFormed()`将这个字符转为`\uFFFD`。

再看下面的例子，`encodeURI()`遇到单个的代理字符对，会报错。

```js
const illFormed = "https://example.com/search?q=\uD800";

encodeURI(illFormed) // 报错
```

`toWellFormed()`将其转换格式后，再使用`encodeURI()`就不会报错了。

```js
const illFormed = "https://example.com/search?q=\uD800";

encodeURI(illFormed.toWellFormed()) // 正确
```

| 方法                                   | ES 版本             | 描述                                                                          | 关键行为/参数                                                                         | 示例                                                                             |
|--------------------------------------|-------------------|-----------------------------------------------------------------------------|---------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| codePointAt(index)                   | ES6               | 正确返回指定索引位置字符的 Unicode 码点。解决了 charCodeAt() 无法处理 4 字节 Unicode 字符（如 emoji）的问题。 | index: 字符位置（基于 UTF-16 单元）。对于 4 字节字符，index 仍需指向其第一个 UTF-16 单元。                   | '𠮷a'.codePointAt(0) -> 134071  ('𠮷a'.codePointAt(0)).toString(16) -> "20bb7" |
| normalize(form)                      | ES6               | 将 Unicode 字符串的不同表示方法（如带重音的预合成字符 vs. 字符+重音符）统一为指定形式，称为 Unicode 正规化。          | form: NFC(默认,标准等价合成), NFD(标准等价分解), NFKC(兼容等价合成), NFKD(兼容等价分解)。                  | '\\u01D1'.normalize() === '\\u004F\\u030C'.normalize() -> true                 |
| includes(substring, position)        | ES6               | 检查字符串是否包含指定子串 substring。                                                    | substring: 要搜索的子串。position: (可选) 从哪个索引开始搜索，默认为 0。                               | 'Hello world!'.includes('o') -> true                                           |
| startsWith(prefix, position)         | ES6               | 检查字符串是否以指定子串 prefix 开头。                                                     | prefix: 要搜索的前缀。position: (可选) 从哪个索引开始视为字符串的“开头”，默认为 0。                          | 'Hello world!'.startsWith('world', 6) -> true                                  |
| endsWith(suffix, position)           | ES6               | 检查字符串是否以指定子串 suffix 结尾。                                                     | suffix: 要搜索的后缀。position: (可选) 逻辑上视为字符串结束的位置，默认为 string.length。                  | 'Hello world!'.endsWith('Hello', 5) -> true                                    |
| repeat(count)                        | ES6               | 将原字符串重复 count 次，返回一个新字符串。                                                   | count: 重复次数。会被取整。负数或 Infinity 报错。0 到 -1 之间的数视为 0。NaN 视为 0。                      | 'x'.repeat(3) -> "xxx"                                                         |
| padStart(targetLength, padString)    | ES2017            | 从字符串头部进行补全，直到字符串达到 targetLength。                                            | targetLength: 补全后的目标长度。padString: (可选) 用来补全的字符串，默认为空格。                          | '5'.padStart(2, '0') -> "05"                                                   |
| padEnd(targetLength, padString)      | ES2017            | 从字符串尾部进行补全，直到字符串达到 targetLength。                                            | targetLength: 补全后的目标长度。padString: (可选) 用来补全的字符串，默认为空格。                          | 'x'.padEnd(4, 'ab') -> "xaba"                                                  |
| trimStart()                          | ES2019            | 消除字符串头部的空白符（空格、tab、换行符等）。                                                   | 无                                                                               | const s = '  abc  '; s.trimStart() -> "abc  "                                  |
| trimEnd()                            | ES2019            | 消除字符串尾部的空白符（空格、tab、换行符等）。                                                   | 无                                                                               | const s = '  abc  '; s.trimEnd() -> "  abc"                                    |
| matchAll(regexp)                     | ES2020            | 返回一个正则表达式在当前字符串中所有匹配的迭代器。                                                   | regexp: 必须是带 g 标志的正则表达式。                                                        | [...'aabb'.matchAll(/a/g)] -> [['a'], ['a']]                                   |
| replaceAll(searchValue, replacement) | ES2021            | 替换字符串中所有匹配 searchValue 的子串。                                                 | searchValue: 搜索模式，可以是字符串或带 g 标志的正则表达式。replacement: 替换文本，可以是字符串（支持 $n 等特殊模式）或函数。 | 'aabbcc'.replaceAll('b', '_') -> "aa__cc"                                      |
| at(index)                            | Stage 3 (ES2024+) | 返回参数指定位置的字符，支持负索引（倒数位置）。                                                    | index: 字符位置，可以是负数。                                                              | const str = 'hello'; str.at(-1) -> "o"                                         |
| toWellFormed()                            | ES2024 | 处理 Unicode 的代理字符对问题，将原始字符串中的单个代理字符对替换为 U+FFFD。                                                    | 无                                                              | "ab\uD800".toWellFormed() -> 'ab'                                        |

## **3. ES6+ 字符串扩展**

ES6 (ECMAScript 2015) 及其后续版本为字符串带来了显著的增强。

#### **2.1 模板字面量 (Template Literals)**

*   **定义**: 使用反引号 (`` ` ``) 定义字符串。
*   **特性**:
    1.  **多行字符串**: 可以直接包含换行符，无需 `\n`。
    2.  **变量插值 (Interpolation)**: 使用 `${expression}` 语法将 JavaScript 表达式嵌入字符串中。
    3.  **支持表达式**: `${}` 中可以是任何有效的 JavaScript 表达式，包括函数调用、算术运算等。

传统的 JavaScript 语言，输出模板通常是这样写的（下面使用了 jQuery 的方法）。

```js
$('#result').append(
  'There are <b>' + basket.count + '</b> ' +
  'items in your basket, ' +
  '<em>' + basket.onSale +
  '</em> are on sale!'
);
```

上面这种写法相当繁琐不方便，ES6 引入了模板字符串解决这个问题。

```js
$('#result').append(`
  There are <b>${basket.count}</b> items
   in your basket, <em>${basket.onSale}</em>
  are on sale!
`);
```

模板字符串（template string）是增强版的字符串，用反引号（&#96;）标识。它可以当作普通字符串使用，也可以用来定义多行字符串，或者在字符串中嵌入变量。

```js
// 普通字符串
`In JavaScript '\n' is a line-feed.`

// 多行字符串
`In JavaScript this is
 not legal.`

console.log(`string text line 1
string text line 2`);

// 字符串中嵌入变量
let name = "Bob", time = "today";
`Hello ${name}, how are you ${time}?`
```

上面代码中的模板字符串，都是用反引号表示。如果在模板字符串中需要使用反引号，则前面要用反斜杠转义。

```js
let greeting = `\`Yo\` World!`;
```

如果使用模板字符串表示多行字符串，所有的空格和缩进都会被保留在输出之中。

```js
$('#list').html(`
<ul>
  <li>first</li>
  <li>second</li>
</ul>
`);
```

上面代码中，所有模板字符串的空格和换行，都是被保留的，比如`<ul>`标签前面会有一个换行。如果你不想要这个换行，可以使用`trim`方法消除它。

```js
$('#list').html(`
<ul>
  <li>first</li>
  <li>second</li>
</ul>
`.trim());
```

模板字符串中嵌入变量，需要将变量名写在`${}`之中。

```js
function authorize(user, action) {
  if (!user.hasPrivilege(action)) {
    throw new Error(
      // 传统写法为
      // 'User '
      // + user.name
      // + ' is not authorized to do '
      // + action
      // + '.'
      `User ${user.name} is not authorized to do ${action}.`);
  }
}
```

大括号内部可以放入任意的 JavaScript 表达式，可以进行运算，以及引用对象属性。

```js
let x = 1;
let y = 2;

`${x} + ${y} = ${x + y}`
// "1 + 2 = 3"

`${x} + ${y * 2} = ${x + y * 2}`
// "1 + 4 = 5"

let obj = {x: 1, y: 2};
`${obj.x + obj.y}`
// "3"
```

模板字符串之中还能调用函数。

```js
function fn() {
  return "Hello World";
}

`foo ${fn()} bar`
// foo Hello World bar
```

如果大括号中的值不是字符串，将按照一般的规则转为字符串。比如，大括号中是一个对象，将默认调用对象的`toString`方法。

如果模板字符串中的变量没有声明，将报错。

```js
// 变量place没有声明
let msg = `Hello, ${place}`;
// 报错
```

由于模板字符串的大括号内部，就是执行 JavaScript 代码，因此如果大括号内部是一个字符串，将会原样输出。

```js
`Hello ${'World'}`
// "Hello World"
```

模板字符串甚至还能嵌套。

```js
const tmpl = addrs => `
  <table>
  ${addrs.map(addr => `
    <tr><td>${addr.first}</td></tr>
    <tr><td>${addr.last}</td></tr>
  `).join('')}
  </table>
`;
```

上面代码中，模板字符串的变量之中，又嵌入了另一个模板字符串，使用方法如下。

```js
const data = [
    { first: '<Jane>', last: 'Bond' },
    { first: 'Lars', last: '<Croft>' },
];

console.log(tmpl(data));
// <table>
//
//   <tr><td><Jane></td></tr>
//   <tr><td>Bond</td></tr>
//
//   <tr><td>Lars</td></tr>
//   <tr><td><Croft></td></tr>
//
// </table>
```

如果需要引用模板字符串本身，在需要时执行，可以写成函数。

```js
let func = (name) => `Hello ${name}!`;
func('Jack') // "Hello Jack!"
```

上面代码中，模板字符串写成了一个函数的返回值。执行这个函数，就相当于执行这个模板字符串了。

#### **2.2 标签模板 (Tagged Templates)**
模板字符串的功能，不仅仅是上面这些。它可以紧跟在一个函数名后面，该函数将被调用来处理这个模板字符串。这被称为“标签模板”功能（tagged template）。

*   **定义**: 在模板字面量前加上一个**标签函数 (tag function)**。
*   **特性**: 标签函数会接收解析后的模板字面量的各个部分，允许你对字符串进行更高级的处理、转换或过滤。
*   **参数**:
    1.  第一个参数是**字符串数组** (所有插值表达式之间的静态字符串部分)。
    2.  后续参数是**插值表达式的值** (与字符串数组交错)。

```js
alert`hello`
// 等同于
alert(['hello'])
```

标签模板其实不是模板，而是函数调用的一种特殊形式。“标签”指的就是函数，紧跟在后面的模板字符串就是它的参数。

但是，如果模板字符里面有变量，就不是简单的调用了，而是会将模板字符串先处理成多个参数，再调用函数。

```js
let a = 5;
let b = 10;

tag`Hello ${ a + b } world ${ a * b }`;
// 等同于
tag(['Hello ', ' world ', ''], 15, 50);
```

上面代码中，模板字符串前面有一个标识名`tag`，它是一个函数。整个表达式的返回值，就是`tag`函数处理模板字符串后的返回值。

函数`tag`依次会接收到多个参数。

```js
function tag(stringArr, value1, value2){
  // ...
}

// 等同于

function tag(stringArr, ...values){
  // ...
}
```

`tag`函数的第一个参数是一个数组，该数组的成员是模板字符串中那些没有变量替换的部分，也就是说，变量替换只发生在数组的第一个成员与第二个成员之间、第二个成员与第三个成员之间，以此类推。

`tag`函数的其他参数，都是模板字符串各个变量被替换后的值。由于本例中，模板字符串含有两个变量，因此`tag`会接受到`value1`和`value2`两个参数。

`tag`函数所有参数的实际值如下。

- 第一个参数：`['Hello ', ' world ', '']`
- 第二个参数: 15
- 第三个参数：50

也就是说，`tag`函数实际上以下面的形式调用。

```js
tag(['Hello ', ' world ', ''], 15, 50)
```

我们可以按照需要编写`tag`函数的代码。下面是`tag`函数的一种写法，以及运行结果。

```js
let a = 5;
let b = 10;

function tag(s, v1, v2) {
  console.log(s[0]);
  console.log(s[1]);
  console.log(s[2]);
  console.log(v1);
  console.log(v2);

  return "OK";
}

tag`Hello ${ a + b } world ${ a * b}`;
// "Hello "
// " world "
// ""
// 15
// 50
// "OK"
```

下面是一个更复杂的例子。

```js
let total = 30;
let msg = passthru`The total is ${total} (${total*1.05} with tax)`;

function passthru(literals) {
  let result = '';
  let i = 0;

  while (i < literals.length) {
    result += literals[i++];
    if (i < arguments.length) {
      result += arguments[i];
    }
  }

  return result;
}

msg // "The total is 30 (31.5 with tax)"
```

上面这个例子展示了，如何将各个参数按照原来的位置拼合回去。

`passthru`函数采用 rest 参数的写法如下。

```js
function passthru(literals, ...values) {
  let output = "";
  let index;
  for (index = 0; index < values.length; index++) {
    output += literals[index] + values[index];
  }

  output += literals[index]
  return output;
}
```

“标签模板”的一个重要应用，就是过滤 HTML 字符串，防止用户输入恶意内容。

```js
let message =
  SaferHTML`<p>${sender} has sent you a message.</p>`;

function SaferHTML(templateData) {
  let s = templateData[0];
  for (let i = 1; i < arguments.length; i++) {
    let arg = String(arguments[i]);

    // Escape special characters in the substitution.
    s += arg.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

    // Don't escape special characters in the template.
    s += templateData[i];
  }
  return s;
}
```

上面代码中，`sender`变量往往是用户提供的，经过`SaferHTML`函数处理，里面的特殊字符都会被转义。

```js
let sender = '<script>alert("abc")</script>'; // 恶意代码
let message = SaferHTML`<p>${sender} has sent you a message.</p>`;

message
// <p>&lt;script&gt;alert("abc")&lt;/script&gt; has sent you a message.</p>
```

标签模板的另一个应用，就是多语言转换（国际化处理）。

```js
i18n`Welcome to ${siteName}, you are visitor number ${visitorNumber}!`
// "欢迎访问xxx，您是第xxxx位访问者！"
```

模板字符串本身并不能取代 Mustache 之类的模板库，因为没有条件判断和循环处理功能，但是通过标签函数，你可以自己添加这些功能。

```js
// 下面的hashTemplate函数
// 是一个自定义的模板处理函数
let libraryHtml = hashTemplate`
  <ul>
    #for book in ${myBooks}
      <li><i>#{book.title}</i> by #{book.author}</li>
    #end
  </ul>
`;
```

除此之外，你甚至可以使用标签模板，在 JavaScript 语言之中嵌入其他语言。

```js
jsx`
  <div>
    <input
      ref='input'
      onChange='${this.handleChange}'
      defaultValue='${this.state.value}' />
      ${this.state.value}
   </div>
`
```

上面的代码通过`jsx`函数，将一个 DOM 字符串转为 React 对象。你可以在 GitHub 找到`jsx`函数的[具体实现](https://gist.github.com/lygaret/a68220defa69174bdec5)。

下面则是一个假想的例子，通过`java`函数，在 JavaScript 代码之中运行 Java 代码。

```js
java`
class HelloWorldApp {
  public static void main(String[] args) {
    System.out.println("Hello World!"); // Display the string.
  }
}
`
HelloWorldApp.main();
```

模板处理函数的第一个参数（模板字符串数组），还有一个`raw`属性。

```js
console.log`123`
// ["123", raw: Array[1]]
```

上面代码中，`console.log`接受的参数，实际上是一个数组。该数组有一个`raw`属性，保存的是转义后的原字符串。

请看下面的例子。

```js
tag`First line\nSecond line`

function tag(strings) {
  console.log(strings.raw[0]);
  // strings.raw[0] 为 "First line\\nSecond line"
  // 打印输出 "First line\nSecond line"
}
```

上面代码中，`tag`函数的第一个参数`strings`，有一个`raw`属性，也指向一个数组。该数组的成员与`strings`数组完全一致。比如，`strings`数组是`["First line\nSecond line"]`，那么`strings.raw`数组就是`["First line\\nSecond line"]`。两者唯一的区别，就是字符串里面的斜杠都被转义了。比如，strings.raw 数组会将`\n`视为`\\`和`n`两个字符，而不是换行符。这是为了方便取得转义之前的原始模板而设计的。

#### **2.3 Unicode 字符串支持**

ES6 增强了对 Unicode 字符的支持

*   **`codePointAt(index)`**: (ES6+) 返回给定位置上字符的**码点 (code point)**。解决了 `charCodeAt()` 无法正确处理 4 字节 Unicode 字符的问题。
*   **`String.fromCodePoint(...codePoints)`**: (ES6+) 根据码点创建字符串。
*   **Unicode 字符转义**: `\u{xxxxxx}` 允许使用完整的 Unicode 码点。
*   **`for...of` 循环**: 可以正确迭代包含 4 字节 Unicode 字符的字符串。

ES6 加强了对 Unicode 的支持，允许采用`\uxxxx`形式表示一个字符，其中`xxxx`表示字符的 Unicode 码点。

```js
"\u0061"
// "a"
```

但是，这种表示法只限于码点在`\u0000`~`\uFFFF`之间的字符。超出这个范围的字符，必须用两个双字节的形式表示。

```js
"\uD842\uDFB7"
// "𠮷"

"\u20BB7"
// " 7"
```

上面代码表示，如果直接在`\u`后面跟上超过`0xFFFF`的数值（比如`\u20BB7`），JavaScript 会理解成`\u20BB+7`。由于`\u20BB`是一个不可打印字符，所以只会显示一个空格，后面跟着一个`7`。

ES6 对这一点做出了改进，只要将码点放入大括号，就能正确解读该字符。

```js
"\u{20BB7}"
// "𠮷"

"\u{41}\u{42}\u{43}"
// "ABC"

let hello = 123;
hell\u{6F} // 123

'\u{1F680}' === '\uD83D\uDE80'
// true
```

上面代码中，最后一个例子表明，大括号表示法与四字节的 UTF-16 编码是等价的。

有了这种表示法之后，JavaScript 共有 6 种方法可以表示一个字符。

```js
'\z' === 'z'  // true
'\172' === 'z' // true
'\x7A' === 'z' // true
'\u007A' === 'z' // true
'\u{7A}' === 'z' // true
```

ES6 为字符串添加了遍历器接口，使得字符串可以被`for...of`循环遍历。

```js
for (let codePoint of 'foo') {
  console.log(codePoint)
}
// "f"
// "o"
// "o"
```

除了遍历字符串，这个遍历器最大的优点是可以识别大于`0xFFFF`的码点，传统的`for`循环无法识别这样的码点。

```js
let text = String.fromCodePoint(0x20BB7);

for (let i = 0; i < text.length; i++) {
  console.log(text[i]);
}
// " "
// " "

for (let i of text) {
  console.log(i);
}
// "𠮷"
```

上面代码中，字符串`text`只有一个字符，但是`for`循环会认为它包含两个字符（都不可打印），而`for...of`循环会正确识别出这一个字符。

## **4. 常见问题与最佳实践 (FAQ)**

*   **Q1: 字符串是可变的吗？**
    *   **不是**。JavaScript 字符串是**不可变**的原始值。所有看似修改字符串的操作（如 `replace()`, `toLowerCase()`），实际上都是创建了一个**新的字符串**并返回。

*   **Q2: 什么时候用单引号，什么时候用双引号？**
    *   都可以，没有功能上的区别。选择一种并在项目中保持**一致性**。大多数项目会选择单引号，因为可以避免在 HTML 属性中转义。
    *   **最佳实践**: 使用 ESLint 和 Prettier 强制统一风格。

*   **Q3: 模板字面量有什么性能开销吗？**
    *   相比传统的字符串拼接，模板字面量在大多数现代 JavaScript 引擎中，性能**不相上下，甚至更好**。因为引擎可以更好地优化模板字面量的创建。
    *   **最佳实践**: 优先使用模板字面量，它提供了更好的可读性和便利性。

*   **Q4: `slice`, `substring`, `substr` 有什么区别？**
    *   **`slice(startIndex, endIndex)`**:
        *   `startIndex` (包含): 负数表示从末尾开始算。
        *   `endIndex` (不包含): 负数表示从末尾开始算。
    *   **`substring(startIndex, endIndex)`**:
        *   `startIndex`, `endIndex`: 负数会被当作 0。如果 `startIndex > endIndex`，两者会被交换。
    *   **`substr(startIndex, length)`**:
        *   `startIndex`: 负数表示从末尾开始算。
        *   `length`: 提取的字符数量。

    **最佳实践**: 优先使用 `slice()`，因为它行为更直观，且支持负数参数。`substr()` 已被废弃，应避免使用。

*   **Q5: 如何处理字符串中的 HTML 特殊字符（如 `<` 转义为 `&lt;`）？**
    *   JavaScript **没有内置**的 HTML 转义函数。需要自己实现或使用第三方库。
    *   **标签模板**可以很方便地实现 HTML 转义。
    ```js
    function escapeHTML(strings, ...values) {
      let str = '';
      strings.forEach((s, i) => {
        str += s;
        if (i < values.length) {
          str += String(values[i]).replace(/&/g, '&amp;')
                                  .replace(/</g, '&lt;')
                                  .replace(/>/g, '&gt;')
                                  .replace(/"/g, '&quot;')
                                  .replace(/'/g, '&#039;');
        }
      });
      return str;
    }

    const userInput = '<script>alert("XSS")</script>';
    const safeHTML = escapeHTML`<div>${userInput}</div>`;
    console.log(safeHTML);
    ```

*   **Q6: 为什么 `replaceAll` 是 ES2021 才引入的？之前怎么替换所有匹配项？**
    *   之前替换所有匹配项需要使用正则表达式，并加上 `g` 标志 (global)。
    ```js
    const str = 'banana';
    // 旧方法
    str.replace(/na/g, 'xx'); // 'baxxxxa'
    // 新方法
    str.replaceAll('na', 'xx'); // 'baxxxxa'
    ```
    `replaceAll` 使得不使用正则表达式替换所有匹配项变得更加方便。
