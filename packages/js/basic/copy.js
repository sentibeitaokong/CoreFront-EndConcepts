/*
 * 示例代码：copy.md
 * 来源文档：apps/docs/js/basic/copy.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 赋值 (Assignment) =====
// let a = 100
// let b = a // b 得到了 100 这个值的副本
//
// b = 200 // 修改 b
// console.log(a) // 100 (a 完全不受影响)

// ===== 1. 赋值 (Assignment) =====
// let objA = { name: 'Alice' }
// let objB = objA // objB 得到了 objA 持有的内存地址
//
// objB.name = 'Bob' // 通过 objB 修改了堆内存中的对象
// console.log(objA.name) // 'Bob' (objA 也受到了影响，因为它们指向同一个对象)

// ===== 1. 赋值 (Assignment) =====
//     Stack(栈)                    Heap(堆)
//     -----------------        -----------------------------
//     objA  (addr123) ------>  | { name: 'Alice' }           |
//                              | (被修改为 'Bob')            |
//     objB  (addr123) ------>  |                             |
//     -----------------        -----------------------------

// ===== 2.1 Object.assign() =====
// let a = {
//   name: 'javascript',
//   book: {
//     title: "You Don't Know JS",
//     price: '45',
//   },
// }
// let b = Object.assign({}, a)
// console.log(b)
// // {
// // 	name: "javascript",
// // 	book: {title: "You Don't Know JS", price: "45"}
// // }
//
// a.name = 'change'
// a.book.price = '55'
// console.log(a)
// // {
// // 	name: "change",
// // 	book: {title: "You Don't Know JS", price: "55"}
// // }
//
// console.log(b)
// // {
// // 	name: "javascript",
// // 	book: {title: "You Don't Know JS", price: "55"}
// // }

// ===== 2.2 Spread(展开语法) =====
// let a = {
//   name: 'javascript',
//   book: {
//     title: "You Don't Know JS",
//     price: '45',
//   },
// }
// let b = { ...a }
// console.log(b)
// // {
// // 	name: "javascript",
// // 	book: {title: "You Don't Know JS", price: "45"}
// // }
//
// a.name = 'change'
// a.book.price = '55'
// console.log(a)
// // {
// // 	name: "change",
// // 	book: {title: "You Don't Know JS", price: "55"}
// // }
//
// console.log(b)
// // {
// // 	name: "javascript",
// // 	book: {title: "You Don't Know JS", price: "55"}
// // }

// ===== 2.3 Array.prototype.slice()和Array.prototype.concat() =====
// let a = [0, '1', [2, 3]]
// //let b = a.concat();
// let b = a.slice(1)
// console.log(b)
// // ["1", [2, 3]]
//
// a[1] = '99'
// a[2][0] = 4
// console.log(a)
// // [0, "99", [4, 3]]
//
// console.log(b)
// //  ["1", [4, 3]]

// ===== 缺陷 =====
// const original = {
//   num: 1,
//   str: 'hello',
//   undef: undefined,
//   func: () => {},
//   date: new Date(),
//   regex: /a/g,
//   sub: { a: 1 },
// }
//
// const copied = JSON.parse(JSON.stringify(original))
//
// console.log(copied)
// /*
// Output:
// {
//   "num": 1,
//   "str": "hello",
//   "date": "2023-10-27T...", // 变成了字符串！
//   "regex": {},             // 变成了空对象！
//   "sub": { "a": 1 }
// }
// // func 和 undef 属性直接消失了！
// */

// ===== 代码示例 =====
// const original = {
//   date: new Date(),
//   regex: /a/g,
//   map: new Map([['a', 1]]),
//   set: new Set([1, 2]),
//   details: { nested: true },
// }
// original.circular = original // 循环引用
//
// const copied = structuredClone(original)
//
// console.log(copied.date instanceof Date) // true
// console.log(copied.map.get('a')) // 1
// console.log(copied.details === original.details) // false
// console.log(copied.circular === copied) // true (循环引用被正确处理)

// ===== 3.3 Lodash _.cloneDeep() =====
// // 需要先安装 lodash: npm install lodash
// const _ = require('lodash')
//
// const original = {
//   func: () => console.log('hello'),
//   // ... 其他各种复杂类型
// }
//
// const copied = _.cloneDeep(original)
//
// copied.func() // 'hello' (函数也被拷贝了)

