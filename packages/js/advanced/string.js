/*
 * 示例代码：string.md
 * 来源文档：apps/docs/js/advanced/data-types/string.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 字符串的定义 =====
// let str1 = 'Hello'
// let str2 = 'World'
// let str3 = `JavaScript` // 模板字面量

// ===== String.fromCodePoint() =====
// String.fromCharCode(0x20bb7)
// // "ஷ"

// ===== String.fromCodePoint() =====
// String.fromCodePoint(0x20bb7)
// // "𠮷"
// String.fromCodePoint(0x78, 0x1f680, 0x79) === 'x\uD83D\uDE80y'
// // true

// ===== String.raw() =====
// String.raw`Hi\n${2 + 3}!`
// // 实际返回 "Hi\\n5!"，显示的是转义后的结果 "Hi\n5!"
//
// String.raw`Hi\u000A!`
// // 实际返回 "Hi\\u000A!"，显示的是转义后的结果 "Hi\u000A!"

// ===== String.raw() =====
// String.raw`Hi\\n`
// // 返回 "Hi\\\\n"
//
// String.raw`Hi\\n` === 'Hi\\\\n' // true

// ===== String.raw() =====
// // `foo${1 + 2}bar`
// // 等同于
// String.raw({ raw: ['foo', 'bar'] }, 1 + 2) // "foo3bar"

// ===== String.raw() =====
// String.raw = function (strings, ...values) {
//   let output = ''
//   let index
//   for (index = 0; index < values.length; index++) {
//     output += strings.raw[index] + values[index]
//   }
//
//   output += strings.raw[index]
//   return output
// }

// ===== codePointAt() =====
// var s = '𠮷'
//
// s.length // 2
// s.charAt(0) // ''
// s.charAt(1) // ''
// s.charCodeAt(0) // 55362
// s.charCodeAt(1) // 57271

// ===== codePointAt() =====
// let s = '𠮷a'
//
// s.codePointAt(0) // 134071
// s.codePointAt(1) // 57271
//
// s.codePointAt(2) // 97

// ===== codePointAt() =====
// let s = '𠮷a'
//
// s.codePointAt(0).toString(16) // "20bb7"
// s.codePointAt(2).toString(16) // "61"

// ===== codePointAt() =====
// let s = '𠮷a'
// for (let ch of s) {
//   console.log(ch.codePointAt(0).toString(16))
// }
// // 20bb7
// // 61

// ===== codePointAt() =====
// let arr = [...'𠮷a'] // arr.length === 2
// arr.forEach(ch => console.log(ch.codePointAt(0).toString(16)))
// // 20bb7
// // 61

// ===== codePointAt() =====
// function is32Bit(c) {
//   return c.codePointAt(0) > 0xffff
// }
//
// is32Bit('𠮷') // true
// is32Bit('a') // false

// ===== normalize() =====
// '\u01D1' === '\u004F\u030C' //false
//
// '\u01D1'.length // 1
// '\u004F\u030C'.length // 2

// ===== normalize() =====
// '\u01D1'.normalize() === '\u004F\u030C'.normalize()
// // true

// ===== normalize() =====
// '\u004F\u030C'.normalize('NFC').length // 1
// '\u004F\u030C'.normalize('NFD').length // 2

// ===== includes(), startsWith(), endsWith() =====
// let s = 'Hello world!'
//
// s.startsWith('Hello') // true
// s.endsWith('!') // true
// s.includes('o') // true

// ===== includes(), startsWith(), endsWith() =====
// let s = 'Hello world!'
//
// s.startsWith('world', 6) // true
// s.endsWith('Hello', 5) // true
// s.includes('Hello', 6) // false

// ===== repeat() =====
// 'x'.repeat(3) // "xxx"
// 'hello'.repeat(2) // "hellohello"
// 'na'.repeat(0) // ""

// ===== repeat() =====
// 'na'.repeat(2.9) // "nana"

// ===== repeat() =====
// 'na'.repeat(Infinity)
// // RangeError
// 'na'.repeat(-1)
// // RangeError

// ===== repeat() =====
// 'na'.repeat(-0.9) // ""

// ===== repeat() =====
// 'na'.repeat(NaN) // ""

// ===== repeat() =====
// 'na'.repeat('na') // ""
// 'na'.repeat('3') // "nanana"

// ===== padStart()，padEnd() =====
// 'x'.padStart(5, 'ab') // 'ababx'
// 'x'.padStart(4, 'ab') // 'abax'
//
// 'x'.padEnd(5, 'ab') // 'xabab'
// 'x'.padEnd(4, 'ab') // 'xaba'

// ===== padStart()，padEnd() =====
// 'xxx'.padStart(2, 'ab') // 'xxx'
// 'xxx'.padEnd(2, 'ab') // 'xxx'

// ===== padStart()，padEnd() =====
// 'abc'.padStart(10, '0123456789')
// // '0123456abc'

// ===== padStart()，padEnd() =====
// 'x'.padStart(4) // '   x'
// 'x'.padEnd(4) // 'x   '

// ===== padStart()，padEnd() =====
// '1'.padStart(10, '0') // "0000000001"
// '12'.padStart(10, '0') // "0000000012"
// '123456'.padStart(10, '0') // "0000123456"

// ===== padStart()，padEnd() =====
// '12'.padStart(10, 'YYYY-MM-DD') // "YYYY-MM-12"
// '09-12'.padStart(10, 'YYYY-MM-DD') // "YYYY-09-12"

// ===== trimStart()，trimEnd() =====
// const s = '  abc  '
//
// s.trim() // "abc"
// s.trimStart() // "abc  "
// s.trimEnd() // "  abc"

// ===== replaceAll() =====
// 'aabbcc'.replace('b', '_')
// // 'aa_bcc'

// ===== replaceAll() =====
// 'aabbcc'.replace(/b/g, '_')
// // 'aa__cc'

// ===== replaceAll() =====
// 'aabbcc'.replaceAll('b', '_')
// // 'aa__cc'

// ===== replaceAll() =====
// String.prototype.replaceAll(searchValue, replacement)

// ===== replaceAll() =====
// // 不报错
// 'aabbcc'.replace(/b/, '_')
//
// // 报错
// 'aabbcc'.replaceAll(/b/, '_')

// ===== replaceAll() =====
// // $& 表示匹配的字符串，即`b`本身
// // 所以返回结果与原字符串一致
// 'abbc'.replaceAll('b', '$&')
// // 'abbc'
//
// // $` 表示匹配结果之前的字符串
// // 对于第一个`b`，$` 指代`a`
// // 对于第二个`b`，$` 指代`ab`
// 'abbc'.replaceAll('b', '$`')
// // 'aaabc'
//
// // $' 表示匹配结果之后的字符串
// // 对于第一个`b`，$' 指代`bc`
// // 对于第二个`b`，$' 指代`c`
// 'abbc'.replaceAll('b', `$'`)
// // 'abccc'
//
// // $1 表示正则表达式的第一个组匹配，指代`ab`
// // $2 表示正则表达式的第二个组匹配，指代`bc`
// 'abbc'.replaceAll(/(ab)(bc)/g, '$2$1')
// // 'bcab'
//
// // $$ 指代 $
// 'abc'.replaceAll('b', '$$')
// // 'a$c'

// ===== replaceAll() =====
// 'aabbcc'.replaceAll('b', () => '_')
// // 'aa__cc'

// ===== replaceAll() =====
// const str = '123abc456'
// const regex = /(\d+)([a-z]+)(\d+)/g
//
// function replacer(match, p1, p2, p3, offset, string) {
//   return [p1, p2, p3].join(' - ')
// }
//
// str.replaceAll(regex, replacer)
// // 123 - abc - 456

// ===== at() =====
// const str = 'hello'
// str.at(1) // "e"
// str.at(-1) // "o"

// ===== toWellFormed() =====
// 'ab\uD800'.toWellFormed() // 'ab�'

// ===== toWellFormed() =====
// const illFormed = 'https://example.com/search?q=\uD800'
//
// encodeURI(illFormed) // 报错

// ===== toWellFormed() =====
// const illFormed = 'https://example.com/search?q=\uD800'
//
// encodeURI(illFormed.toWellFormed()) // 正确

// ===== 3.1 模板字面量 (Template Literals) =====
// $('#result').append(
//   'There are <b>' +
//     basket.count +
//     '</b> ' +
//     'items in your basket, ' +
//     '<em>' +
//     basket.onSale +
//     '</em> are on sale!',
// )

// ===== 3.1 模板字面量 (Template Literals) =====
// $('#result').append(`
//   There are <b>${basket.count}</b> items
//    in your basket, <em>${basket.onSale}</em>
//   are on sale!
// `)

// ===== 3.1 模板字面量 (Template Literals) =====
// // 普通字符串
// ;`In JavaScript '\n' is a line-feed.`
// // 多行字符串
// `In JavaScript this is
//  not legal.`
//
// console.log(`string text line 1
// string text line 2`)
//
// // 字符串中嵌入变量
// let name = 'Bob',
//   time = 'today'
// ;`Hello ${name}, how are you ${time}?`

// ===== 3.1 模板字面量 (Template Literals) =====
// let greeting = `\`Yo\` World!`

// ===== 3.1 模板字面量 (Template Literals) =====
// $('#list').html(`
// <ul>
//   <li>first</li>
//   <li>second</li>
// </ul>
// `)

// ===== 3.1 模板字面量 (Template Literals) =====
// $('#list').html(
//   `
// <ul>
//   <li>first</li>
//   <li>second</li>
// </ul>
// `.trim(),
// )

// ===== 3.1 模板字面量 (Template Literals) =====
// function authorize(user, action) {
//   if (!user.hasPrivilege(action)) {
//     throw new Error(
//       // 传统写法为
//       // 'User '
//       // + user.name
//       // + ' is not authorized to do '
//       // + action
//       // + '.'
//       `User ${user.name} is not authorized to do ${action}.`,
//     )
//   }
// }

// ===== 3.1 模板字面量 (Template Literals) =====
// let x = 1
// let y = 2
//
// ;`${x} + ${y} = ${x + y}`
// // "1 + 2 = 3"
//
// `${x} + ${y * 2} = ${x + y * 2}`
// // "1 + 4 = 5"
//
// let obj = { x: 1, y: 2 }
// ;`${obj.x + obj.y}`
// // "3"

// ===== 3.1 模板字面量 (Template Literals) =====
// function fn() {
//   return 'Hello World'
// }
//
// ;`foo ${fn()} bar`
// // foo Hello World bar

// ===== 3.1 模板字面量 (Template Literals) =====
// // 变量place没有声明
// let msg = `Hello, ${place}`
// // 报错

// ===== 3.1 模板字面量 (Template Literals) =====
// ;`Hello ${'World'}`
// // "Hello World"

// ===== 3.1 模板字面量 (Template Literals) =====
// const tmpl = addrs => `
//   <table>
//   ${addrs
//     .map(
//       addr => `
//     <tr><td>${addr.first}</td></tr>
//     <tr><td>${addr.last}</td></tr>
//   `,
//     )
//     .join('')}
//   </table>
// `

// ===== 3.1 模板字面量 (Template Literals) =====
// const data = [
//   { first: '<Jane>', last: 'Bond' },
//   { first: 'Lars', last: '<Croft>' },
// ]
//
// console.log(tmpl(data))
// // <table>
// //
// //   <tr><td><Jane></td></tr>
// //   <tr><td>Bond</td></tr>
// //
// //   <tr><td>Lars</td></tr>
// //   <tr><td><Croft></td></tr>
// //
// // </table>

// ===== 3.1 模板字面量 (Template Literals) =====
// let func = name => `Hello ${name}!`
// func('Jack') // "Hello Jack!"

// ===== 3.2 标签模板 (Tagged Templates) =====
// alert`hello`
// // 等同于
// alert(['hello'])

// ===== 3.2 标签模板 (Tagged Templates) =====
// let a = 5
// let b = 10
//
// tag`Hello ${a + b} world ${a * b}`
// // 等同于
// tag(['Hello ', ' world ', ''], 15, 50)

// ===== 3.2 标签模板 (Tagged Templates) =====
// function tag(stringArr, value1, value2) {
//   // ...
// }
//
// // 等同于
//
// function tag(stringArr, ...values) {
//   // ...
// }

// ===== 3.2 标签模板 (Tagged Templates) =====
// tag(['Hello ', ' world ', ''], 15, 50)

// ===== 3.2 标签模板 (Tagged Templates) =====
// let a = 5
// let b = 10
//
// function tag(s, v1, v2) {
//   console.log(s[0])
//   console.log(s[1])
//   console.log(s[2])
//   console.log(v1)
//   console.log(v2)
//
//   return 'OK'
// }
//
// tag`Hello ${a + b} world ${a * b}`
// // "Hello "
// // " world "
// // ""
// // 15
// // 50
// // "OK"

// ===== 3.2 标签模板 (Tagged Templates) =====
// let total = 30
// let msg = passthru`The total is ${total} (${total * 1.05} with tax)`
//
// function passthru(literals) {
//   let result = ''
//   let i = 0
//
//   while (i < literals.length) {
//     result += literals[i++]
//     if (i < arguments.length) {
//       result += arguments[i]
//     }
//   }
//
//   return result
// }
//
// msg // "The total is 30 (31.5 with tax)"

// ===== 3.2 标签模板 (Tagged Templates) =====
// function passthru(literals, ...values) {
//   let output = ''
//   let index
//   for (index = 0; index < values.length; index++) {
//     output += literals[index] + values[index]
//   }
//
//   output += literals[index]
//   return output
// }

// ===== 3.2 标签模板 (Tagged Templates) =====
// let message = SaferHTML`<p>${sender} has sent you a message.</p>`
//
// function SaferHTML(templateData) {
//   let s = templateData[0]
//   for (let i = 1; i < arguments.length; i++) {
//     let arg = String(arguments[i])
//
//     // Escape special characters in the substitution.
//     s += arg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
//
//     // Don't escape special characters in the template.
//     s += templateData[i]
//   }
//   return s
// }

// ===== 3.2 标签模板 (Tagged Templates) =====
// let sender = '<script>alert("abc")</script>' // 恶意代码
// let message = SaferHTML`<p>${sender} has sent you a message.</p>`
//
// message
// // <p>&lt;script&gt;alert("abc")&lt;/script&gt; has sent you a message.</p>

// ===== 3.2 标签模板 (Tagged Templates) =====
// i18n`Welcome to ${siteName}, you are visitor number ${visitorNumber}!`
// // "欢迎访问xxx，您是第xxxx位访问者！"

// ===== 3.2 标签模板 (Tagged Templates) =====
// // 下面的hashTemplate函数
// // 是一个自定义的模板处理函数
// let libraryHtml = hashTemplate`
//   <ul>
//     #for book in ${myBooks}
//       <li><i>#{book.title}</i> by #{book.author}</li>
//     #end
//   </ul>
// `

// ===== 3.2 标签模板 (Tagged Templates) =====
// jsx`
//   <div>
//     <input
//       ref='input'
//       onChange='${this.handleChange}'
//       defaultValue='${this.state.value}' />
//       ${this.state.value}
//    </div>
// `

// ===== 3.2 标签模板 (Tagged Templates) =====
// java`
// class HelloWorldApp {
//   public static void main(String[] args) {
//     System.out.println("Hello World!"); // Display the string.
//   }
// }
// `
// HelloWorldApp.main()

// ===== 3.2 标签模板 (Tagged Templates) =====
// console.log`123`
// // ["123", raw: Array[1]]

// ===== 3.2 标签模板 (Tagged Templates) =====
// tag`First line\nSecond line`
//
// function tag(strings) {
//   console.log(strings.raw[0])
//   // strings.raw[0] 为 "First line\\nSecond line"
//   // 打印输出 "First line\nSecond line"
// }

// ===== 3.3 Unicode 字符串支持 =====
// '\u0061'
// // "a"

// ===== 3.3 Unicode 字符串支持 =====
// '\uD842\uDFB7'
// // "𠮷"
//
// '\u20BB7'
// // " 7"

// ===== 3.3 Unicode 字符串支持 =====
// '\u{20BB7}'
// // "𠮷"
//
// '\u{41}\u{42}\u{43}'
// // "ABC"
//
// let hello = 123
// hello // 123
//
// '\u{1F680}' === '\uD83D\uDE80'
// // true

// ===== 3.3 Unicode 字符串支持 =====
// '\z' === 'z' // true
// '\172' === 'z' // true
// '\x7A' === 'z' // true
// '\u007A' === 'z' // true
// '\u{7A}' === 'z' // true

// ===== 3.3 Unicode 字符串支持 =====
// for (let codePoint of 'foo') {
//   console.log(codePoint)
// }
// // "f"
// // "o"
// // "o"

// ===== 3.3 Unicode 字符串支持 =====
// let text = String.fromCodePoint(0x20bb7)
//
// for (let i = 0; i < text.length; i++) {
//   console.log(text[i])
// }
// // " "
// // " "
//
// for (let i of text) {
//   console.log(i)
// }
// // "𠮷"

