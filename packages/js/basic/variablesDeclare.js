/*
 * 示例代码：variablesDeclare.md
 * 来源文档：apps/docs/js/basic/variablesDeclare.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 基本用法 =====
// var a // 声明 a，值为 undefined
// var b = 10 // 声明 b 并赋值为 10
// var c = 1,
//   d = 2 // 同时声明多个变量

// ===== 1.2 变量提升 (Hoisting) =====
// console.log(myVar) // 输出: undefined (不会报错)
// var myVar = 5
// console.log(myVar) // 输出: 5

// ===== 1.2 变量提升 (Hoisting) =====
// var myVar // 1. 声明被提升到顶部，初始化为 undefined
// console.log(myVar) // 2. 执行打印
// myVar = 5 // 3. 执行赋值
// console.log(myVar) // 4. 执行打印

// ===== 1.3 允许重复声明 (Re-declaration) =====
// var user = 'Alice'
// var user = 'Bob' // 合法，不会报错
// console.log(user) // "Bob"

// ===== 1.4 挂载到全局对象 (Global Object Property) =====
// var myGlobal = 'Hello'
// console.log(window.myGlobal) // 输出: "Hello"
//
// let myLet = 'World'
// console.log(window.myLet) // 输出: undefined (let 不会挂载)

// ===== 1.5 循环中的闭包问题 (The Loop Problem) =====
// for (var i = 0; i < 3; i++) {
//   // 这里的 i 是全局的（或函数级的），并在每次循环中被修改
//   setTimeout(function () {
//     console.log('Value:', i)
//   }, 100)
// }
// // 输出结果:
// // Value: 3
// // Value: 3
// // Value: 3

// ===== 1.5 循环中的闭包问题 (The Loop Problem) =====
// for (var i = 0; i < 3; i++) {
//   ;(function (lockedIndex) {
//     setTimeout(function () {
//       console.log('Value:', lockedIndex)
//     }, 100)
//   })(i)
// }
// // 输出: 0, 1, 2

// ===== 1.6 隐式全局变量 (Implicit Globals) =====
// function mistake() {
//   var a = 1 // 局部变量
//   b = 2 // 漏写了 var/let/const -> 变成了全局变量！
// }
// mistake()
// console.log(b) // 2 (污染了全局环境)

// ===== 2.1 基本用法 =====
// {
//   let a = 10
//   var b = 1
// }
//
// a // ReferenceError: a is not defined.
// b // 1

// ===== 2.1 基本用法 =====
// for (let i = 0; i < 10; i++) {
//   // ...
// }
//
// console.log(i)
// // ReferenceError: i is not defined

// ===== 2.1 基本用法 =====
// var a = []
// for (var i = 0; i < 10; i++) {
//   a[i] = function () {
//     console.log(i)
//   }
// }
// a[6]() // 10

// ===== 2.1 基本用法 =====
// var a = []
// for (let i = 0; i < 10; i++) {
//   a[i] = function () {
//     console.log(i)
//   }
// }
// a[6]() // 6

// ===== 2.1 基本用法 =====
// for (let i = 0; i < 3; i++) {
//   let i = 'abc'
//   console.log(i)
// }
// // abc
// // abc
// // abc

// ===== 2.2 不存在变量提升 =====
// // var 的情况
// console.log(foo) // 输出undefined
// var foo = 2
//
// // let 的情况
// console.log(bar) // 报错ReferenceError
// let bar = 2

// ===== 2.3 暂时性死区 =====
// var tmp = 123
//
// if (true) {
//   tmp = 'abc' // ReferenceError
//   let tmp
// }

// ===== 2.3 暂时性死区 =====
// if (true) {
//   // TDZ开始
//   tmp = 'abc' // ReferenceError
//   console.log(tmp) // ReferenceError
//
//   let tmp // TDZ结束
//   console.log(tmp) // undefined
//
//   tmp = 123
//   console.log(tmp) // 123
// }

// ===== 2.3 暂时性死区 =====
// typeof x // ReferenceError
// let x

// ===== 2.3 暂时性死区 =====
// typeof undeclared_variable // "undefined"

// ===== 2.3 暂时性死区 =====
// function bar(x = y, y = 2) {
//   return [x, y]
// }
//
// bar() // 报错

// ===== 2.3 暂时性死区 =====
// function bar(x = 2, y = x) {
//   return [x, y]
// }
// bar() // [2, 2]

// ===== 2.3 暂时性死区 =====
// // 不报错
// var x = x
//
// // 报错
// let x = x
// // ReferenceError: x is not defined

// ===== 2.4 不允许重复声明 =====
// // 报错
// function func() {
//   let a = 10
//   var a = 1
// }
//
// // 报错
// function func() {
//   let a = 10
//   let a = 1
// }

// ===== 2.4 不允许重复声明 =====
// function func(arg) {
//   let arg
// }
// func() // 报错
//
// function func(arg) {
//   {
//     let arg
//   }
// }
// func() // 不报错

// ===== 3.1 基本用法 =====
// const PI = 3.1415
// PI // 3.1415
//
// PI = 3
// // TypeError: Assignment to constant variable.

// ===== 3.2 必须初始化 =====
// const foo
// // SyntaxError: Missing initializer in const declaration

// ===== 3.2 必须初始化 =====
// if (true) {
//   const MAX = 5
// }
//
// MAX // Uncaught ReferenceError: MAX is not defined

// ===== 3.3 不存在变量提升，存在暂时性死区 =====
// if (true) {
//   console.log(MAX) // ReferenceError
//   const MAX = 5
// }

// ===== 3.4 不允许重复声明 =====
// var message = 'Hello!'
// let age = 25
//
// // 以下两行都会报错
// const message = 'Goodbye!'
// const age = 30

// ===== 3.5 本质 =====
// const foo = {}
//
// // 为 foo 添加一个属性，可以成功
// foo.prop = 123
// foo.prop // 123
//
// // 将 foo 指向另一个对象，就会报错
// foo = {} // TypeError: "foo" is read-only

// ===== 3.5 本质 =====
// const a = []
// a.push('Hello') // 可执行
// a.length = 0 // 可执行
// a = ['Dave'] // 报错

// ===== 3.5 本质 =====
// const foo = Object.freeze({})
//
// // 常规模式时，下面一行不起作用；
// // 严格模式时，该行会报错
// foo.prop = 123

// ===== 3.5 本质 =====
// var constantize = obj => {
//   Object.freeze(obj)
//   Object.keys(obj).forEach((key, i) => {
//     if (typeof obj[key] === 'object') {
//       constantize(obj[key])
//     }
//   })
// }

// ===== 4. 顶层对象的属性 =====
// window.a = 1
// a // 1
//
// a = 2
// window.a // 2

// ===== 4. 顶层对象的属性 =====
// var a = 1
// // 如果在 Node 的 REPL 环境，可以写成 global.a
// // 或者采用通用方法，写成 this.a
// window.a // 1
//
// let b = 1
// window.b // undefined

// ===== 5. globalThis 对象 =====
// // 方法一
// typeof window !== 'undefined'
//   ? window
//   : typeof process === 'object' &&
//       typeof require === 'function' &&
//       typeof global === 'object'
//     ? global
//     : this
//
// // 方法二
// var getGlobal = function () {
//   if (typeof self !== 'undefined') {
//     return self
//   }
//   if (typeof window !== 'undefined') {
//     return window
//   }
//   if (typeof global !== 'undefined') {
//     return global
//   }
//   throw new Error('unable to locate global object')
// }

