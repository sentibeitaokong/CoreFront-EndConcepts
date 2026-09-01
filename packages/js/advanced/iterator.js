/*
 * 示例代码：iterator.md
 * 来源文档：apps/docs/js/advanced/async/iterator.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. Iterator（遍历器）的概念 =====
// var it = makeIterator(['a', 'b'])
//
// it.next() // { value: "a", done: false }
// it.next() // { value: "b", done: false }
// it.next() // { value: undefined, done: true }
//
// function makeIterator(array) {
//   var nextIndex = 0
//   return {
//     next: function () {
//       return nextIndex < array.length
//         ? { value: array[nextIndex++], done: false }
//         : { value: undefined, done: true }
//     },
//   }
// }

// ===== 1. Iterator（遍历器）的概念 =====
// function makeIterator(array) {
//   var nextIndex = 0
//   return {
//     next: function () {
//       return nextIndex < array.length
//         ? { value: array[nextIndex++] }
//         : { done: true }
//     },
//   }
// }

// ===== 1. Iterator（遍历器）的概念 =====
// var it = idMaker()
//
// it.next().value // 0
// it.next().value // 1
// it.next().value // 2
// // ...
//
// function idMaker() {
//   var index = 0
//
//   return {
//     next: function () {
//       return { value: index++, done: false }
//     },
//   }
// }

// ===== 1. Iterator（遍历器）的概念 =====
// interface Iterable {
//   [Symbol.iterator]() : Iterator,
// }
//
// interface Iterator {
//   next(value?: any) : IterationResult,
// }
//
// interface IterationResult {
//   value: any,
//   done: boolean,
// }

// ===== 1.1 默认 Iterator 接口 =====
// const obj = {
//   [Symbol.iterator]: function () {
//     return {
//       next: function () {
//         return {
//           value: 1,
//           done: true,
//         }
//       },
//     }
//   },
// }

// ===== 1.1 默认 Iterator 接口 =====
// let arr = ['a', 'b', 'c']
// let iter = arr[Symbol.iterator]()
//
// iter.next() // { value: 'a', done: false }
// iter.next() // { value: 'b', done: false }
// iter.next() // { value: 'c', done: false }
// iter.next() // { value: undefined, done: true }

// ===== 1.1 默认 Iterator 接口 =====
// class RangeIterator {
//   constructor(start, stop) {
//     this.value = start
//     this.stop = stop
//   }
//
//   [Symbol.iterator]() {
//     return this
//   }
//
//   next() {
//     var value = this.value
//     if (value < this.stop) {
//       this.value++
//       return { done: false, value: value }
//     }
//     return { done: true, value: undefined }
//   }
// }
//
// function range(start, stop) {
//   return new RangeIterator(start, stop)
// }
//
// for (var value of range(0, 3)) {
//   console.log(value) // 0, 1, 2
// }

// ===== 1.1 默认 Iterator 接口 =====
// function Obj(value) {
//   this.value = value
//   this.next = null
// }
//
// Obj.prototype[Symbol.iterator] = function () {
//   var iterator = { next: next }
//
//   var current = this
//
//   function next() {
//     if (current) {
//       var value = current.value
//       current = current.next
//       return { done: false, value: value }
//     }
//     return { done: true }
//   }
//   return iterator
// }
//
// var one = new Obj(1)
// var two = new Obj(2)
// var three = new Obj(3)
//
// one.next = two
// two.next = three
//
// for (var i of one) {
//   console.log(i) // 1, 2, 3
// }

// ===== 1.1 默认 Iterator 接口 =====
// let obj = {
//   data: ['hello', 'world'],
//   [Symbol.iterator]() {
//     const self = this
//     let index = 0
//     return {
//       next() {
//         if (index < self.data.length) {
//           return {
//             value: self.data[index++],
//             done: false,
//           }
//         }
//         return { value: undefined, done: true }
//       },
//     }
//   },
// }

// ===== 1.1 默认 Iterator 接口 =====
// NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]
// // 或者
// NodeList.prototype[Symbol.iterator] = [][Symbol.iterator]
//
// ;[...document.querySelectorAll('div')] // 可以执行了

// ===== 1.1 默认 Iterator 接口 =====
// let iterable = {
//   0: 'a',
//   1: 'b',
//   2: 'c',
//   length: 3,
//   [Symbol.iterator]: Array.prototype[Symbol.iterator],
// }
// for (let item of iterable) {
//   console.log(item) // 'a', 'b', 'c'
// }

// ===== 1.1 默认 Iterator 接口 =====
// let iterable = {
//   a: 'a',
//   b: 'b',
//   c: 'c',
//   length: 3,
//   [Symbol.iterator]: Array.prototype[Symbol.iterator],
// }
// for (let item of iterable) {
//   console.log(item) // undefined, undefined, undefined
// }

// ===== 1.1 默认 Iterator 接口 =====
// var obj = {}
//
// obj[Symbol.iterator] = () => 1
//
// ;[...obj] // TypeError: [] is not a function

// ===== 1.1 默认 Iterator 接口 =====
// var $iterator = ITERABLE[Symbol.iterator]()
// var $result = $iterator.next()
// while (!$result.done) {
//   var x = $result.value
//   // ...
//   $result = $iterator.next()
// }

// ===== 1.2 调用 Iterator 接口的场合 =====
// let set = new Set().add('a').add('b').add('c')
//
// let [x, y] = set
// // x='a'; y='b'
//
// let [first, ...rest] = set
// // first='a'; rest=['b','c'];

// ===== 1.2 调用 Iterator 接口的场合 =====
// // 例一
// var str = 'hello'
// ;[...str] //  ['h','e','l','l','o']
//
// // 例二
// let arr = ['b', 'c']
// ;['a', ...arr, 'd']
// // ['a', 'b', 'c', 'd']

// ===== 1.2 调用 Iterator 接口的场合 =====
// let arr = [...iterable]

// ===== 1.2 调用 Iterator 接口的场合 =====
// let generator = function* () {
//   yield 1
//   yield* [2, 3, 4]
//   yield 5
// }
//
// var iterator = generator()
//
// iterator.next() // { value: 1, done: false }
// iterator.next() // { value: 2, done: false }
// iterator.next() // { value: 3, done: false }
// iterator.next() // { value: 4, done: false }
// iterator.next() // { value: 5, done: false }
// iterator.next() // { value: undefined, done: true }

// ===== 2. 字符串的 Iterator 接口 =====
// var someString = 'hi'
// typeof someString[Symbol.iterator]
// // "function"
//
// var iterator = someString[Symbol.iterator]()
//
// iterator.next() // { value: "h", done: false }
// iterator.next() // { value: "i", done: false }
// iterator.next() // { value: undefined, done: true }

// ===== 2. 字符串的 Iterator 接口 =====
// var str = new String('hi')
//
// ;[...str] // ["h", "i"]
//
// str[Symbol.iterator] = function () {
//   return {
//     next: function () {
//       if (this._first) {
//         this._first = false
//         return { value: 'bye', done: false }
//       } else {
//         return { done: true }
//       }
//     },
//     _first: true,
//   }
// }
//
// ;[...str] // ["bye"]
// str // "hi"

// ===== 3. Iterator 接口与 Generator 函数 =====
// let myIterable = {
//   [Symbol.iterator]: function* () {
//     yield 1
//     yield 2
//     yield 3
//   },
// }
// ;[...myIterable] // [1, 2, 3]
//
// // 或者采用下面的简洁写法
//
// let obj = {
//   *[Symbol.iterator]() {
//     yield 'hello'
//     yield 'world'
//   },
// }
//
// for (let x of obj) {
//   console.log(x)
// }
// // "hello"
// // "world"

// ===== 4. 遍历器对象的 return()，throw() =====
// function readLinesSync(file) {
//   return {
//     [Symbol.iterator]() {
//       return {
//         next() {
//           return { done: false }
//         },
//         return() {
//           file.close()
//           return { done: true }
//         },
//       }
//     },
//   }
// }

// ===== 4. 遍历器对象的 return()，throw() =====
// // 情况一
// for (let line of readLinesSync(fileName)) {
//   console.log(line)
//   break
// }
//
// // 情况二
// for (let line of readLinesSync(fileName)) {
//   console.log(line)
//   throw new Error()
// }

// ===== 5.1 数组 =====
// const arr = ['red', 'green', 'blue']
//
// for (let v of arr) {
//   console.log(v) // red green blue
// }
//
// const obj = {}
// obj[Symbol.iterator] = arr[Symbol.iterator].bind(arr)
//
// for (let v of obj) {
//   console.log(v) // red green blue
// }

// ===== 5.1 数组 =====
// const arr = ['red', 'green', 'blue']
//
// arr.forEach(function (element, index) {
//   console.log(element) // red green blue
//   console.log(index) // 0 1 2
// })

// ===== 5.1 数组 =====
// var arr = ['a', 'b', 'c', 'd']
//
// for (let a in arr) {
//   console.log(a) // 0 1 2 3
// }
//
// for (let a of arr) {
//   console.log(a) // a b c d
// }

// ===== 5.1 数组 =====
// let arr = [3, 5, 7]
// arr.foo = 'hello'
//
// for (let i in arr) {
//   console.log(i) // "0", "1", "2", "foo"
// }
//
// for (let i of arr) {
//   console.log(i) //  "3", "5", "7"
// }

// ===== 5.2 Set 和 Map 结构 =====
// var engines = new Set(['Gecko', 'Trident', 'Webkit', 'Webkit'])
// for (var e of engines) {
//   console.log(e)
// }
// // Gecko
// // Trident
// // Webkit
//
// var es6 = new Map()
// es6.set('edition', 6)
// es6.set('committee', 'TC39')
// es6.set('standard', 'ECMA-262')
// for (var [name, value] of es6) {
//   console.log(name + ': ' + value)
// }
// // edition: 6
// // committee: TC39
// // standard: ECMA-262

// ===== 5.2 Set 和 Map 结构 =====
// let map = new Map().set('a', 1).set('b', 2)
// for (let pair of map) {
//   console.log(pair)
// }
// // ['a', 1]
// // ['b', 2]
//
// for (let [key, value] of map) {
//   console.log(key + ' : ' + value)
// }
// // a : 1
// // b : 2

// ===== 5.2 Set 和 Map 结构 =====
// let arr = ['a', 'b', 'c']
// for (let pair of arr.entries()) {
//   console.log(pair)
// }
// // [0, 'a']
// // [1, 'b']
// // [2, 'c']

// ===== 5.3 类似数组的对象 =====
// // 字符串
// let str = 'hello'
//
// for (let s of str) {
//   console.log(s) // h e l l o
// }
//
// // DOM NodeList对象
// let paras = document.querySelectorAll('p')
//
// for (let p of paras) {
//   p.classList.add('test')
// }
//
// // arguments对象
// function printArgs() {
//   for (let x of arguments) {
//     console.log(x)
//   }
// }
// printArgs('a', 'b')
// // 'a'
// // 'b'

// ===== 5.3 类似数组的对象 =====
// for (let x of 'a\uD83D\uDC0A') {
//   console.log(x)
// }
// // 'a'
// // '\uD83D\uDC0A'

// ===== 5.3 类似数组的对象 =====
// let arrayLike = { length: 2, 0: 'a', 1: 'b' }
//
// // 报错
// for (let x of arrayLike) {
//   console.log(x)
// }
//
// // 正确
// for (let x of Array.from(arrayLike)) {
//   console.log(x)
// }

// ===== 5.4 对象 =====
// let es6 = {
//   edition: 6,
//   committee: 'TC39',
//   standard: 'ECMA-262',
// }
//
// for (let e in es6) {
//   console.log(e)
// }
// // edition
// // committee
// // standard
//
// for (let e of es6) {
//   console.log(e)
// }
// // TypeError: es6[Symbol.iterator] is not a function

// ===== 5.4 对象 =====
// for (var key of Object.keys(someObject)) {
//   console.log(key + ': ' + someObject[key])
// }

// ===== 5.4 对象 =====
// const obj = { a: 1, b: 2, c: 3 }
//
// function* entries(obj) {
//   for (let key of Object.keys(obj)) {
//     yield [key, obj[key]]
//   }
// }
//
// for (let [key, value] of entries(obj)) {
//   console.log(key, '->', value)
// }
// // a -> 1
// // b -> 2
// // c -> 3

// ===== 5.5 与其他遍历语法的比较 =====
// for (var index = 0; index < myArray.length; index++) {
//   console.log(myArray[index])
// }

// ===== 5.5 与其他遍历语法的比较 =====
// myArray.forEach(function (value) {
//   console.log(value)
// })

// ===== 5.5 与其他遍历语法的比较 =====
// for (var index in myArray) {
//   console.log(myArray[index])
// }

// ===== 5.5 与其他遍历语法的比较 =====
// for (let value of myArray) {
//   console.log(value)
// }

// ===== 5.5 与其他遍历语法的比较 =====
// for (var n of fibonacci) {
//   if (n > 1000) break
//   console.log(n)
// }

// ===== 6. 遍历器对象的工具方法 =====
// const arr = ['a', '', 'b', '', 'c', '', 'd', '', 'e']
//
// arr
//   .values() // creates an iterator
//   .filter(x => x.length > 0)
//   .drop(1)
//   .take(3)
//   .map(x => `=${x}=`)
//   .toArray()
// // ['=b=', '=c=', '=d=']

