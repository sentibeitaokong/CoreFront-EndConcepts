/*
 * 示例代码：regExp.md
 * 来源文档：apps/docs/js/advanced/data-types/regExp.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// /^\uD83D/u.test('\uD83D\uDC2A') // false
// /^\uD83D/.test('\uD83D\uDC2A') // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// var s = '𠮷';
//
// /^.$/.test(s) // false
// /^.$/u.test(s) // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// ;/\u{61}/.test('a') / // false
//   a /
//   u.test('a') / // true
//   𠮷 /
//   u.test('𠮷') // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// /a{2}/.test('aa') // true
// /a{2}/u.test('aa') // true
// /𠮷{2}/.test('𠮷𠮷') // false
// /𠮷{2}/u.test('𠮷𠮷') // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// /^\S$/.test('𠮷') // false
// /^\S$/u.test('𠮷') // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// function codePointLength(text) {
//   var result = text.match(/[\s\S]/gu)
//   return result ? result.length : 0
// }
//
// var s = '𠮷𠮷'
//
// s.length // 4
// codePointLength(s) // 2

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// ;/[a-z]/i.test('\u212A') / // false
//   [a - z] /
//   iu.test('\u212A') // true

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// /\,/ // /\,/
// /\,/u // 报错

// ===== 2.1 u 标志 (Unicode 模式) - (ES6) =====
// const r1 = /hello/
// const r2 = /hello/u
//
// r1.unicode // false
// r2.unicode // true

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// var s = 'aaa_aa_a'
// var r1 = /a+/g
// var r2 = /a+/y
//
// r1.exec(s) // ["aaa"]
// r2.exec(s) // ["aaa"]
//
// r1.exec(s) // ["aa"]
// r2.exec(s) // null

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// var s = 'aaa_aa_a'
// var r = /a+_/y
//
// r.exec(s) // ["aaa_"]
// r.exec(s) // ["aa_"]

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// const REGEX = /a/g
//
// // 指定从2号位置（y）开始匹配
// REGEX.lastIndex = 2
//
// // 匹配成功
// const match = REGEX.exec('xaya')
//
// // 在3号位置匹配成功
// match.index // 3
//
// // 下一次匹配从4号位开始
// REGEX.lastIndex // 4
//
// // 4号位开始匹配失败
// REGEX.exec('xaya') // null

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// const REGEX = /a/y
//
// // 指定从2号位置开始匹配
// REGEX.lastIndex = 2
//
// // 不是粘连，匹配失败
// REGEX.exec('xaya') // null
//
// // 指定从3号位置开始匹配
// REGEX.lastIndex = 3
//
// // 3号位置是粘连，匹配成功
// const match = REGEX.exec('xaya')
// match.index // 3
// REGEX.lastIndex // 4

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// ;/b/y.exec('aba')
// // null

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// const REGEX = /a/gy
// 'aaxa'.replace(REGEX, '-') // '--xa'

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// 'a1a2a3'.match(/a\d/y) // ["a1"]
// 'a1a2a3'.match(/a\d/gy) // ["a1", "a2", "a3"]

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// const TOKEN_Y = /\s*(\+|[0-9]+)\s*/y
// const TOKEN_G = /\s*(\+|[0-9]+)\s*/g
//
// tokenize(TOKEN_Y, '3 + 4')
// // [ '3', '+', '4' ]
// tokenize(TOKEN_G, '3 + 4')
// // [ '3', '+', '4' ]
//
// function tokenize(TOKEN_REGEX, str) {
//   let result = []
//   let match
//   while ((match = TOKEN_REGEX.exec(str))) {
//     result.push(match[1])
//   }
//   return result
// }

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// tokenize(TOKEN_Y, '3x + 4')
// // [ '3' ]
// tokenize(TOKEN_G, '3x + 4')
// // [ '3', '+', '4' ]

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// var r = /hello\d/y
// r.sticky // true

// ===== 2.2 y 标志 (粘性匹配 / Sticky) - (ES6) =====
// // ES5 的 source 属性
// // 返回正则表达式的正文
// ;/abc/gi.source /
//   // "abc"
//
//   // ES6 的 flags 属性
//   // 返回正则表达式的修饰符
//   abc /
//   ig.flags
// // 'gi'

// ===== 2.3 s 标志 (dotAll 模式) - (ES9/ES2018) =====
// ;/foo.bar/.test('foo\nbar')
// // false

// ===== 2.3 s 标志 (dotAll 模式) - (ES9/ES2018) =====
// ;/foo[^]bar/.test('foo\nbar')
// // true

// ===== 2.3 s 标志 (dotAll 模式) - (ES9/ES2018) =====
// ;/foo.bar/s.test('foo\nbar') // true

// ===== 2.3 s 标志 (dotAll 模式) - (ES9/ES2018) =====
// const re = /foo.bar/s
// // 另一种写法
// // const re = new RegExp('foo.bar', 's');
//
// re.test('foo\nbar') // true
// re.dotAll // true
// re.flags // 's'

// ===== 2.4 v 修饰符：Unicode 属性类的运算 =====
// // 差集运算（A 减去 B）
// [A--B]
//
// // 交集运算（A 与 B 的交集）
// [A&&B]

// ===== 2.4 v 修饰符：Unicode 属性类的运算 =====
// // 方括号嵌套的例子
// [A--[0-9]]

// ===== 2.4 v 修饰符：Unicode 属性类的运算 =====
// // 十进制字符去除 ASCII 码的0到9
// [\p{Decimal_Number}--[0-9]]
//
// // Emoji 字符去除 ASCII 码字符
// [\p{Emoji}--\p{ASCII}]

// ===== 2.4 v 修饰符：Unicode 属性类的运算 =====
// ;/[\p{Decimal_Number}]/u.test('0') // true

// ===== 2.4 v 修饰符：Unicode 属性类的运算 =====
// ;/[\p{Decimal_Number}--[0-9]]/v.test('0') // false

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_DATE = /(\d{4})-(\d{2})-(\d{2})/

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_DATE = /(\d{4})-(\d{2})-(\d{2})/
//
// const matchObj = RE_DATE.exec('1999-12-31')
// const year = matchObj[1] // 1999
// const month = matchObj[2] // 12
// const day = matchObj[3] // 31

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_DATE = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
//
// const matchObj = RE_DATE.exec('1999-12-31')
// const year = matchObj.groups.year // "1999"
// const month = matchObj.groups.month // "12"
// const day = matchObj.groups.day // "31"

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_OPT_A = /^(?<as>a+)?$/
// const matchObj = RE_OPT_A.exec('')
//
// matchObj.groups.as // undefined
// 'as' in matchObj.groups // true

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE = /(?<chars>a+)|(?<chars>b+)/v

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// let {
//   groups: { one, two },
// } = /^(?<one>.*):(?<two>.*)$/u.exec('foo:bar')
// one // foo
// two // bar

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// let re = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u
//
// '2015-01-02'.replace(re, '$<day>/$<month>/$<year>')
// // '02/01/2015'

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// '2015-01-02'.replace(
//   re,
//   (
//     matched, // 整个匹配结果 2015-01-02
//     capture1, // 第一个组匹配 2015
//     capture2, // 第二个组匹配 01
//     capture3, // 第三个组匹配 02
//     position, // 匹配开始的位置 0
//     S, // 原字符串 2015-01-02
//     groups, // 具名组构成的一个对象 {year, month, day}
//   ) => {
//     let { day, month, year } = groups
//     return `${day}/${month}/${year}`
//   },
// )

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_TWICE = /^(?<word>[a-z]+)!\k<word>$/
// RE_TWICE.test('abc!abc') // true
// RE_TWICE.test('abc!ab') // false

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_TWICE = /^(?<word>[a-z]+)!\1$/
// RE_TWICE.test('abc!abc') // true
// RE_TWICE.test('abc!ab') // false

// ===== 2.5 命名捕获组 (Named Capture Groups) - (ES9/ES2018) =====
// const RE_TWICE = /^(?<word>[a-z]+)!\k<word>!\1$/
// RE_TWICE.test('abc!abc!abc') // true
// RE_TWICE.test('abc!abc!ab') // false

// ===== 2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018) =====
// /\d+(?=%)/.exec('100% of US presidents have been male')  // ["100"]
// /\d+(?!%)/.exec('that’s all 44 of them')                 // ["44"]

// ===== 2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018) =====
// /(?<=\$)\d+/.exec('Benjamin Franklin is on the $100 bill')  // ["100"]
// /(?<!\$)\d+/.exec('it’s worth about €90')                   // ["90"]

// ===== 2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018) =====
// const RE_DOLLAR_PREFIX = /(?<=\$)foo/g
// '$foo %foo foo'.replace(RE_DOLLAR_PREFIX, 'bar')
// // '$bar %foo foo'

// ===== 2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018) =====
// /(?<=(\d+)(\d+))$/.exec('1053') // ["", "1", "053"]
// /^(\d+)(\d+)$/.exec('1053') // ["1053", "105", "3"]

// ===== 2.6 后行断言 (Lookbehind Assertions) - (ES9/ES2018) =====
// /(?<=(o)d\1)r/.exec('hodor')  // null
// /(?<=\1d(o))r/.exec('hodor')  // ["r", "o"]

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// const regexGreekSymbol = /\p{Script=Greek}/u
// regexGreekSymbol.test('π') // true

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// \p{UnicodePropertyName=UnicodePropertyValue}

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// \p{UnicodePropertyName}
// \p{UnicodePropertyValue}

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// const regex = /^\p{Decimal_Number}+$/u
// regex.test('𝟏𝟐𝟑𝟜𝟝𝟞𝟩𝟪𝟫𝟬𝟭𝟮𝟯𝟺𝟻𝟼') // true

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// // 匹配所有数字
// const regex = /^\p{Number}+$/u
// regex.test('²³¹¼½¾') // true
// regex.test('㉛㉜㉝') // true
// regex.test('ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ') // true

// ===== 2.7 Unicode 属性类 (Unicode Property Escapes) \p{...} 和 \P{...} - (ES9/ES2018) =====
// // 匹配所有空格
// \p{White_Space}
//
// // 匹配十六进制字符
// \p{Hex_Digit}
//
// // 匹配各种文字的所有字母，等同于 Unicode 版的 \w
// [\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]
//
// // 匹配各种文字的所有非字母的字符，等同于 Unicode 版的 \W
// [^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]
//
// // 匹配 Emoji
// /\p{Extended_Pictographic}/u
//
// // 匹配所有的箭头字符
// const regexArrows = /^\p{Block=Arrows}+$/u;
// regexArrows.test('←↑→↓↔↕↖↗↘↙⇏⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙⇧⇩') // true

// ===== 2.8 索引匹配 (d 标志 / HasIndices) - (ES2022) =====
// const text = 'zabbcdef'
// const re = /ab/d
// const result = re.exec(text)
//
// result.index // 1
// result.indices // [ [1, 3] ]

// ===== 2.8 索引匹配 (d 标志 / HasIndices) - (ES2022) =====
// const text = 'zabbcdef'
// const re = /ab+(cd)/d
// const result = re.exec(text)
//
// result.indices // [ [ 1, 6 ], [ 4, 6 ] ]

// ===== 2.8 索引匹配 (d 标志 / HasIndices) - (ES2022) =====
// const text = 'zabbcdef'
// const re = /ab+(cd(ef))/d
// const result = re.exec(text)
//
// result.indices // [ [1, 8], [4, 8], [6, 8] ]

// ===== 2.8 索引匹配 (d 标志 / HasIndices) - (ES2022) =====
// const text = 'zabbcdef'
// const re = /ab+(?<Z>cd)/d
// const result = re.exec(text)
//
// result.indices.groups // { Z: [ 4, 6 ] }

// ===== 2.8 索引匹配 (d 标志 / HasIndices) - (ES2022) =====
// const text = 'zabbcdef'
// const re = /ab+(?<Z>ce)?/d
// const result = re.exec(text)
//
// result.indices[1] // undefined
// result.indices.groups['Z'] // undefined

// ===== 3.1 为什么 RegExp 构造函数中 \ 需要双重转义？ =====
// ;/\d+/.test('123') // 字面量
// new RegExp('\\d+').test('123') // 构造函数，需要双斜杠

