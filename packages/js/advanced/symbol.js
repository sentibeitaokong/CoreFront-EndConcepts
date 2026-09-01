/*
 * 示例代码：symbol.md
 * 来源文档：apps/docs/js/advanced/metaprogramming/symbol.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 创建 Symbol =====
// let s = Symbol()
//
// typeof s
// // "symbol"

// ===== 1.1 创建 Symbol =====
// let s1 = Symbol('foo')
// let s2 = Symbol('bar')
//
// s1 // Symbol(foo)
// s2 // Symbol(bar)
//
// s1.toString() // "Symbol(foo)"
// s2.toString() // "Symbol(bar)"

// ===== 1.1 创建 Symbol =====
// const obj = {
//   toString() {
//     return 'abc'
//   },
// }
// const sym = Symbol(obj)
// sym // Symbol(abc)

// ===== 1.1 创建 Symbol =====
// // 没有参数的情况
// let s1 = Symbol()
// let s2 = Symbol()
//
// s1 === s2 // false
//
// // 有参数的情况
// let s1 = Symbol('foo')
// let s2 = Symbol('foo')
//
// s1 === s2 // false

// ===== 1.1 创建 Symbol =====
// let sym = Symbol('My symbol')
//
// 'your symbol is ' +
//   sym
//   // TypeError: can't convert symbol to string
//   `your symbol is ${sym}`
// // TypeError: can't convert symbol to string

// ===== 1.1 创建 Symbol =====
// let sym = Symbol('My symbol')
//
// String(sym) // 'Symbol(My symbol)'
// sym.toString() // 'Symbol(My symbol)'

// ===== 1.1 创建 Symbol =====
// let sym = Symbol()
// Boolean(sym) // true
// !sym // false
//
// if (sym) {
//   // ...
// }
//
// Number(sym) // TypeError
// sym + 2 // TypeError

// ===== 1.1 创建 Symbol =====
// const sym = Symbol('foo')

// ===== 1.1 创建 Symbol =====
// const sym = Symbol('foo')
//
// String(sym) // "Symbol(foo)"
// sym.toString() // "Symbol(foo)"

// ===== 1.1 创建 Symbol =====
// const sym = Symbol('foo')
//
// sym.description // "foo"

// ===== 1.2 Symbol 作为对象属性 =====
// let mySymbol = Symbol()
//
// // 第一种写法
// let a = {}
// a[mySymbol] = 'Hello!'
//
// // 第二种写法
// let a = {
//   [mySymbol]: 'Hello!',
// }
//
// // 第三种写法
// let a = {}
// Object.defineProperty(a, mySymbol, { value: 'Hello!' })
//
// // 以上写法都得到同样结果
// a[mySymbol] // "Hello!"

// ===== 1.2 Symbol 作为对象属性 =====
// const mySymbol = Symbol()
// const a = {}
//
// a.mySymbol = 'Hello!'
// a[mySymbol] // undefined
// a['mySymbol'] // "Hello!"

// ===== 1.2 Symbol 作为对象属性 =====
// let s = Symbol();
//
// let obj = {
//   [s]: function (arg) { ... }
// };
//
// obj[s](123);

// ===== 1.2 Symbol 作为对象属性 =====
// let obj = {
//   [s](arg) { ... }
// };

// ===== 1.2 Symbol 作为对象属性 =====
// const log = {}
//
// log.levels = {
//   DEBUG: Symbol('debug'),
//   INFO: Symbol('info'),
//   WARN: Symbol('warn'),
// }
// console.log(log.levels.DEBUG, 'debug message')
// console.log(log.levels.INFO, 'info message')

// ===== 1.2 Symbol 作为对象属性 =====
// const COLOR_RED = Symbol()
// const COLOR_GREEN = Symbol()
//
// function getComplement(color) {
//   switch (color) {
//     case COLOR_RED:
//       return COLOR_GREEN
//     case COLOR_GREEN:
//       return COLOR_RED
//     default:
//       throw new Error('Undefined color')
//   }
// }

// ===== 1.3 获取 Symbol 属性 =====
// const obj = {}
// let a = Symbol('a')
// let b = Symbol('b')
//
// obj[a] = 'Hello'
// obj[b] = 'World'
//
// const objectSymbols = Object.getOwnPropertySymbols(obj)
//
// objectSymbols
// // [Symbol(a), Symbol(b)]

// ===== 1.3 获取 Symbol 属性 =====
// const obj = {}
// const foo = Symbol('foo')
//
// obj[foo] = 'bar'
//
// for (let i in obj) {
//   console.log(i) // 无输出
// }
//
// Object.getOwnPropertyNames(obj) // []
// Object.getOwnPropertySymbols(obj) // [Symbol(foo)]

// ===== 1.3 获取 Symbol 属性 =====
// let obj = {
//   [Symbol('my_key')]: 1,
//   enum: 2,
//   nonEnum: 3,
// }
//
// Reflect.ownKeys(obj)
// //  ["enum", "nonEnum", Symbol(my_key)]

// ===== 1.3 获取 Symbol 属性 =====
// let size = Symbol('size')
//
// class Collection {
//   constructor() {
//     this[size] = 0
//   }
//
//   add(item) {
//     this[this[size]] = item
//     this[size]++
//   }
//
//   static sizeOf(instance) {
//     return instance[size]
//   }
// }
//
// let x = new Collection()
// Collection.sizeOf(x) // 0
//
// x.add('foo')
// Collection.sizeOf(x) // 1
//
// Object.keys(x) // ['0']
// Object.getOwnPropertyNames(x) // ['0']
// Object.getOwnPropertySymbols(x) // [Symbol(size)]

// ===== 2.1 Symbol.for() =====
// let s1 = Symbol.for('foo')
// let s2 = Symbol.for('foo')
//
// s1 === s2 // true

// ===== 2.1 Symbol.for() =====
// Symbol.for('bar') === Symbol.for('bar')
// // true
//
// Symbol('bar') === Symbol('bar')
// // false

// ===== 2.2 Symbol.keyFor() =====
// let s1 = Symbol.for('foo')
// Symbol.keyFor(s1) // "foo"
//
// let s2 = Symbol('foo')
// Symbol.keyFor(s2) // undefined

// ===== 2.2 Symbol.keyFor() =====
// function foo() {
//   return Symbol.for('bar')
// }
//
// const x = foo()
// const y = Symbol.for('bar')
// console.log(x === y) // true

// ===== 2.2 Symbol.keyFor() =====
// iframe = document.createElement('iframe')
// iframe.src = String(window.location)
// document.body.appendChild(iframe)
//
// iframe.contentWindow.Symbol.for('foo') === Symbol.for('foo')
// // true

// ===== 3.1 消除魔术字符串 =====
// function getArea(shape, options) {
//   let area = 0
//
//   switch (shape) {
//     case 'Triangle': // 魔术字符串
//       area = 0.5 * options.width * options.height
//       break
//     /* ... more code ... */
//   }
//
//   return area
// }
//
// getArea('Triangle', { width: 100, height: 100 }) // 魔术字符串

// ===== 3.1 消除魔术字符串 =====
// const shapeType = {
//   triangle: 'Triangle',
// }
//
// function getArea(shape, options) {
//   let area = 0
//   switch (shape) {
//     case shapeType.triangle:
//       area = 0.5 * options.width * options.height
//       break
//   }
//   return area
// }
//
// getArea(shapeType.triangle, { width: 100, height: 100 })

// ===== 3.1 消除魔术字符串 =====
// const shapeType = {
//   triangle: Symbol(),
// }

// ===== 3.2 模块的 Singleton 模式 =====
// // mod.js
// function A() {
//   this.foo = 'hello'
// }
//
// if (!global._foo) {
//   global._foo = new A()
// }
//
// module.exports = global._foo

// ===== 3.2 模块的 Singleton 模式 =====
// const a = require('./mod.js')
// console.log(a.foo)

// ===== 3.2 模块的 Singleton 模式 =====
// global._foo = { foo: 'world' }
//
// const a = require('./mod.js')
// console.log(a.foo)

// ===== 3.2 模块的 Singleton 模式 =====
// // mod.js
// const FOO_KEY = Symbol.for('foo')
//
// function A() {
//   this.foo = 'hello'
// }
//
// if (!global[FOO_KEY]) {
//   global[FOO_KEY] = new A()
// }
//
// module.exports = global[FOO_KEY]

// ===== 3.2 模块的 Singleton 模式 =====
// global[Symbol.for('foo')] = { foo: 'world' }
//
// const a = require('./mod.js')

// ===== 3.2 模块的 Singleton 模式 =====
// // mod.js
// const FOO_KEY = Symbol('foo')
//
// // 后面代码相同 ……

// ===== Symbol.hasInstance =====
// class MyClass {
//   [Symbol.hasInstance](foo) {
//     return foo instanceof Array
//   }
// }
//
// ;[1, 2, 3] instanceof new MyClass() // true

// ===== Symbol.hasInstance =====
// class Even {
//   static [Symbol.hasInstance](obj) {
//     return Number(obj) % 2 === 0
//   }
// }
//
// // 等同于
// const Even = {
//   [Symbol.hasInstance](obj) {
//     return Number(obj) % 2 === 0
//   },
// }
//
// 1 instanceof Even // false
// 2 instanceof Even // true
// 12345 instanceof Even // false

// ===== Symbol.isConcatSpreadable =====
// let arr1 = ['c', 'd']
// ;['a', 'b'].concat(arr1, 'e') // ['a', 'b', 'c', 'd', 'e']
// arr1[Symbol.isConcatSpreadable] // undefined
//
// let arr2 = ['c', 'd']
// arr2[Symbol.isConcatSpreadable] = false
// ;['a', 'b'].concat(arr2, 'e') // ['a', 'b', ['c','d'], 'e']

// ===== Symbol.isConcatSpreadable =====
// let obj = { length: 2, 0: 'c', 1: 'd' }
// ;['a', 'b'].concat(obj, 'e') // ['a', 'b', obj, 'e']
//
// obj[Symbol.isConcatSpreadable] = true
// ;['a', 'b'].concat(obj, 'e') // ['a', 'b', 'c', 'd', 'e']

// ===== Symbol.isConcatSpreadable =====
// class A1 extends Array {
//   constructor(args) {
//     super(args)
//     this[Symbol.isConcatSpreadable] = true
//   }
// }
// class A2 extends Array {
//   constructor(args) {
//     super(args)
//   }
//   get [Symbol.isConcatSpreadable]() {
//     return false
//   }
// }
// let a1 = new A1()
// a1[0] = 3
// a1[1] = 4
// let a2 = new A2()
// a2[0] = 5
// a2[1] = 6
// ;[1, 2].concat(a1).concat(a2)
// // [1, 2, 3, 4, [5, 6]]

// ===== Symbol.species =====
// class MyArray extends Array {}
//
// const a = new MyArray(1, 2, 3)
// const b = a.map(x => x)
// const c = a.filter(x => x > 1)
//
// b instanceof MyArray // true
// c instanceof MyArray // true

// ===== Symbol.species =====
// class MyArray extends Array {
//   static get [Symbol.species]() {
//     return Array
//   }
// }

// ===== Symbol.species =====
// static get [Symbol.species]() {
//   return this;
// }

// ===== Symbol.species =====
// class MyArray extends Array {
//   static get [Symbol.species]() {
//     return Array
//   }
// }
//
// const a = new MyArray()
// const b = a.map(x => x)
//
// b instanceof MyArray // false
// b instanceof Array // true

// ===== Symbol.species =====
// class T1 extends Promise {}
//
// class T2 extends Promise {
//   static get [Symbol.species]() {
//     return Promise
//   }
// }
//
// new T1(r => r()).then(v => v) instanceof T1 // true
// new T2(r => r()).then(v => v) instanceof T2 // false

// ===== Symbol.match =====
// String.prototype.match(regexp)
// // 等同于
// regexp[Symbol.match](this)
//
// class MyMatcher {
//   [Symbol.match](string) {
//     return 'hello world'.indexOf(string)
//   }
// }
//
// 'e'.match(new MyMatcher()) // 1

// ===== Symbol.replace =====
// String.prototype.replace(searchValue, replaceValue)
// // 等同于
// searchValue[Symbol.replace](this, replaceValue)

// ===== Symbol.replace =====
// const x = {}
// x[Symbol.replace] = (...s) => console.log(s)
//
// 'Hello'.replace(x, 'World') // ["Hello", "World"]

// ===== Symbol.search =====
// String.prototype.search(regexp)
// // 等同于
// regexp[Symbol.search](this)
//
// class MySearch {
//   constructor(value) {
//     this.value = value
//   }
//   [Symbol.search](string) {
//     return string.indexOf(this.value)
//   }
// }
// 'foobar'.search(new MySearch('foo')) // 0

// ===== Symbol.split =====
// String.prototype.split(separator, limit)
// // 等同于
// separator[Symbol.split](this, limit)

// ===== Symbol.split =====
// class MySplitter {
//   constructor(value) {
//     this.value = value
//   }
//   [Symbol.split](string) {
//     let index = string.indexOf(this.value)
//     if (index === -1) {
//       return string
//     }
//     return [string.substr(0, index), string.substr(index + this.value.length)]
//   }
// }
//
// 'foobar'.split(new MySplitter('foo'))
// // ['', 'bar']
//
// 'foobar'.split(new MySplitter('bar'))
// // ['foo', '']
//
// 'foobar'.split(new MySplitter('baz'))
// // 'foobar'

// ===== Symbol.iterator =====
// const myIterable = {}
// myIterable[Symbol.iterator] = function* () {
//   yield 1
//   yield 2
//   yield 3
// }
//
// ;[...myIterable] // [1, 2, 3]

// ===== Symbol.iterator =====
// class Collection {
//   *[Symbol.iterator]() {
//     let i = 0
//     while (this[i] !== undefined) {
//       yield this[i]
//       ++i
//     }
//   }
// }
//
// let myCollection = new Collection()
// myCollection[0] = 1
// myCollection[1] = 2
//
// for (let value of myCollection) {
//   console.log(value)
// }
// // 1
// // 2

// ===== Symbol.toPrimitive =====
// let obj = {
//   [Symbol.toPrimitive](hint) {
//     switch (hint) {
//       case 'number':
//         return 123
//       case 'string':
//         return 'str'
//       case 'default':
//         return 'default'
//       default:
//         throw new Error()
//     }
//   },
// }
//
// 2 * obj // 246
// 3 + obj // '3default'
// obj == 'default' // true
// String(obj) // 'str'

// ===== Symbol.toStringTag =====
// // 例一
// ;({ [Symbol.toStringTag]: 'Foo' }).toString()
// // "[object Foo]"
//
// // 例二
// class Collection {
//   get [Symbol.toStringTag]() {
//     return 'xxx'
//   }
// }
// let x = new Collection()
// Object.prototype.toString.call(x) // "[object xxx]"

// ===== Symbol.unscopables =====
// Array.prototype[Symbol.unscopables]
// // {
// //   copyWithin: true,
// //   entries: true,
// //   fill: true,
// //   find: true,
// //   findIndex: true,
// //   includes: true,
// //   keys: true
// // }
//
// Object.keys(Array.prototype[Symbol.unscopables])
// // ['copyWithin', 'entries', 'fill', 'find', 'findIndex', 'includes', 'keys']

// ===== Symbol.unscopables =====
// // 没有 unscopables 时
// class MyClass {
//   foo() {
//     return 1
//   }
// }
//
// var foo = function () {
//   return 2
// }
//
// with (MyClass.prototype) {
//   foo() // 1
// }
//
// // 有 unscopables 时
// class MyClass {
//   foo() {
//     return 1
//   }
//   get [Symbol.unscopables]() {
//     return { foo: true }
//   }
// }
//
// var foo = function () {
//   return 2
// }
//
// with (MyClass.prototype) {
//   foo() // 2
// }

