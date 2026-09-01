/*
 * 示例代码：variablesDestructuring.md
 * 来源文档：apps/docs/js/basic/variablesDestructuring.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 基本用法 =====
// let a = 1
// let b = 2
// let c = 3

// ===== 1.1 基本用法 =====
// let [a, b, c] = [1, 2, 3]

// ===== 1.1 基本用法 =====
// let [foo, [[bar], baz]] = [1, [[2], 3]]
// foo // 1
// bar // 2
// baz // 3
//
// let [, , third] = ['foo', 'bar', 'baz']
// third // "baz"
//
// let [x, , y] = [1, 2, 3]
// x // 1
// y // 3
//
// let [head, ...tail] = [1, 2, 3, 4]
// head // 1
// tail // [2, 3, 4]
//
// let [x, y, ...z] = ['a']
// x // "a"
// y // undefined
// z // []

// ===== 1.1 基本用法 =====
// let [foo] = []
// let [bar, foo] = [1]

// ===== 1.1 基本用法 =====
// let [x, y] = [1, 2, 3]
// x // 1
// y // 2
//
// let [a, [b], d] = [1, [2, 3], 4]
// a // 1
// b // 2
// d // 4

// ===== 1.1 基本用法 =====
// // 报错
// let [foo] = 1
// let [foo] = false
// let [foo] = NaN
// let [foo] = undefined
// let [foo] = null
// let [foo] = {}

// ===== 1.1 基本用法 =====
// let [x, y, z] = new Set(['a', 'b', 'c'])
// x // "a"

// ===== 1.1 基本用法 =====
// function* fibs() {
//   let a = 0
//   let b = 1
//   while (true) {
//     yield a
//     ;[a, b] = [b, a + b]
//   }
// }
//
// let [first, second, third, fourth, fifth, sixth] = fibs()
// sixth // 5

// ===== 1.2 默认值 =====
// let [foo = true] = []
// foo // true
//
// let [x, y = 'b'] = ['a'] // x='a', y='b'
// let [x, y = 'b'] = ['a', undefined] // x='a', y='b'

// ===== 1.2 默认值 =====
// let [x = 1] = [undefined]
// x // 1
//
// let [x = 1] = [null]
// x // null

// ===== 1.2 默认值 =====
// function f() {
//   console.log('aaa')
// }
//
// let [x = f()] = [1]

// ===== 1.2 默认值 =====
// let x
// if ([1][0] === undefined) {
//   x = f()
// } else {
//   x = [1][0]
// }

// ===== 1.2 默认值 =====
// let [x = 1, y = x] = [] // x=1; y=1
// let [x = 1, y = x] = [2] // x=2; y=2
// let [x = 1, y = x] = [1, 2] // x=1; y=2
// let [x = y, y = 1] = [] // ReferenceError: y is not defined

// ===== 2.1 简介 =====
// let { foo, bar } = { foo: 'aaa', bar: 'bbb' }
// foo // "aaa"
// bar // "bbb"

// ===== 2.1 简介 =====
// let { bar, foo } = { foo: 'aaa', bar: 'bbb' }
// foo // "aaa"
// bar // "bbb"
//
// let { baz } = { foo: 'aaa', bar: 'bbb' }
// baz // undefined

// ===== 2.1 简介 =====
// let { foo } = { bar: 'baz' }
// foo // undefined

// ===== 2.1 简介 =====
// // 例一
// let { log, sin, cos } = Math
//
// // 例二
// const { log } = console
// log('hello') // hello

// ===== 2.1 简介 =====
// let { foo: baz } = { foo: 'aaa', bar: 'bbb' }
// baz // "aaa"
//
// let obj = { first: 'hello', last: 'world' }
// let { first: f, last: l } = obj
// f // 'hello'
// l // 'world'

// ===== 2.1 简介 =====
// let { foo: foo, bar: bar } = { foo: 'aaa', bar: 'bbb' }

// ===== 2.1 简介 =====
// let { foo: baz } = { foo: 'aaa', bar: 'bbb' }
// baz // "aaa"
// foo // error: foo is not defined

// ===== 2.1 简介 =====
// let obj = {
//   p: ['Hello', { y: 'World' }],
// }
//
// let {
//   p: [x, { y }],
// } = obj
// x // "Hello"
// y // "World"

// ===== 2.1 简介 =====
// let obj = {
//   p: ['Hello', { y: 'World' }],
// }
//
// let {
//   p,
//   p: [x, { y }],
// } = obj
// x // "Hello"
// y // "World"
// p // ["Hello", {y: "World"}]

// ===== 2.1 简介 =====
// const node = {
//   loc: {
//     start: {
//       line: 1,
//       column: 5,
//     },
//   },
// }
//
// let {
//   loc,
//   loc: { start },
//   loc: {
//     start: { line },
//   },
// } = node
// line // 1
// loc // Object {start: Object}
// start // Object {line: 1, column: 5}

// ===== 2.1 简介 =====
// let obj = {}
// let arr = []
//
// ;({ foo: obj.prop, bar: arr[0] } = { foo: 123, bar: true })
//
// obj // {prop:123}
// arr // [true]

// ===== 2.1 简介 =====
// // 报错
// let {
//   foo: { bar },
// } = { baz: 'baz' }

// ===== 2.1 简介 =====
// const obj1 = {}
// const obj2 = { foo: 'bar' }
// Object.setPrototypeOf(obj1, obj2)
//
// const { foo } = obj1
// foo // "bar"

// ===== 2.2 默认值 =====
// var { x = 3 } = {}
// x // 3
//
// var { x, y = 5 } = { x: 1 }
// x // 1
// y // 5
//
// var { x: y = 3 } = {}
// y // 3
//
// var { x: y = 3 } = { x: 5 }
// y // 5
//
// var { message: msg = 'Something went wrong' } = {}
// msg // "Something went wrong"

// ===== 2.2 默认值 =====
// var { x = 3 } = { x: undefined }
// x // 3
//
// var { x = 3 } = { x: null }
// x // null

// ===== 2.3注意点 =====
// // 错误的写法
// let x;
// {x} = {x: 1};
// // SyntaxError: syntax error

// ===== 2.3注意点 =====
// // 正确的写法
// let x
// ;({ x } = { x: 1 })

// ===== 2.3注意点 =====
// ;({} = [true, false])
// ;({} = 'abc')
// ;({} = [])

// ===== 2.3注意点 =====
// let arr = [1, 2, 3]
// let { 0: first, [arr.length - 1]: last } = arr
// first // 1
// last // 3

// ===== 3. 字符串的解构赋值 =====
// const [a, b, c, d, e] = 'hello'
// a // "h"
// b // "e"
// c // "l"
// d // "l"
// e // "o"

// ===== 3. 字符串的解构赋值 =====
// let { length: len } = 'hello'
// len // 5

// ===== 4. 数值和布尔值的解构赋值 =====
// let { toString: s } = 123
// s === Number.prototype.toString // true
//
// let { toString: s } = true
// s === Boolean.prototype.toString // true

// ===== 4. 数值和布尔值的解构赋值 =====
// let { prop: x } = undefined // TypeError
// let { prop: y } = null // TypeError

// ===== 5. 函数参数的解构赋值 =====
// function add([x, y]) {
//   return x + y
// }
//
// add([1, 2]) // 3

// ===== 5. 函数参数的解构赋值 =====
// ;[
//   [1, 2],
//   [3, 4],
// ].map(([a, b]) => a + b)
// // [ 3, 7 ]

// ===== 5. 函数参数的解构赋值 =====
// function move({ x = 0, y = 0 } = {}) {
//   return [x, y]
// }
//
// move({ x: 3, y: 8 }) // [3, 8]
// move({ x: 3 }) // [3, 0]
// move({}) // [0, 0]
// move() // [0, 0]

// ===== 5. 函数参数的解构赋值 =====
// function move({ x, y } = { x: 0, y: 0 }) {
//   return [x, y]
// }
//
// move({ x: 3, y: 8 }) // [3, 8]
// move({ x: 3 }) // [3, undefined]
// move({}) // [undefined, undefined]
// move() // [0, 0]

// ===== 5. 函数参数的解构赋值 =====
// ;[1, undefined, 3].map((x = 'yes') => x)
// // [ 1, 'yes', 3 ]

// ===== 6.1 不能使用圆括号的情况 =====
// // 全部报错
// let [(a)] = [1];
//
// let {x: (c)} = {};
// let ({x: c}) = {};
// let {(x: c)} = {};
// let {(x): c} = {};
//
// let { o: ({ p: p }) } = { o: { p: 2 } };

// ===== 6.1 不能使用圆括号的情况 =====
// // 报错
// function f([(z)]) { return z; }
// // 报错
// function f([z,(x)]) { return x; }

// ===== 6.1 不能使用圆括号的情况 =====
// // 全部报错
// ({ p: a }) = { p: 42 };
// ([a]) = [5];

// ===== 6.1 不能使用圆括号的情况 =====
// // 报错
// [({ p: a }), { x: c }] = [{}, {}];

// ===== 6.2 可以使用圆括号的情况 =====
// ;[b] = [3] // 正确
// ;({ p: d } = {}) // 正确
// ;[parseInt.prop] = [3] // 正确

// ===== 7. 用途 =====
// let x = 1
// let y = 2
//
// ;[x, y] = [y, x]

// ===== 7. 用途 =====
// // 返回一个数组
//
// function example() {
//   return [1, 2, 3]
// }
// let [a, b, c] = example()
//
// // 返回一个对象
//
// function example() {
//   return {
//     foo: 1,
//     bar: 2,
//   }
// }
// let { foo, bar } = example()

// ===== 7. 用途 =====
// // 参数是一组有次序的值
// function f([x, y, z]) { ... }
// f([1, 2, 3]);
//
// // 参数是一组无次序的值
// function f({x, y, z}) { ... }
// f({z: 3, y: 2, x: 1});

// ===== 7. 用途 =====
// let javascriptonData = {
//   id: 42,
//   status: 'OK',
//   data: [867, 5309],
// }
//
// let { id, status, data: number } = javascriptonData
//
// console.log(id, status, number)
// // 42, "OK", [867, 5309]

// ===== 7. 用途 =====
// jQuery.ajax = function (
//   url,
//   {
//     async = true,
//     beforeSend = function () {},
//     cache = true,
//     complete = function () {},
//     crossDomain = false,
//     global = true,
//     // ... more config
//   } = {},
// ) {
//   // ... do stuff
// }

// ===== 7. 用途 =====
// const map = new Map()
// map.set('first', 'hello')
// map.set('second', 'world')
//
// for (let [key, value] of map) {
//   console.log(key + ' is ' + value)
// }
// // first is hello
// // second is world

// ===== 7. 用途 =====
// // 获取键名
// for (let [key] of map) {
//   // ...
// }
//
// // 获取键值
// for (let [, value] of map) {
//   // ...
// }

// ===== 7. 用途 =====
// const { SourceMapConsumer, SourceNode } = require('source-map')

