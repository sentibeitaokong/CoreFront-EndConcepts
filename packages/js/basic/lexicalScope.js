/*
 * 示例代码：lexicalScope.md
 * 来源文档：apps/docs/js/basic/lexicalScope.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 全局作用域 (Global Scope) =====
// const globalVar = 'I am global'
//
// function check() {
//   console.log(globalVar) // ✅ 可以访问
// }

// ===== 1.2 函数作用域 (Function Scope) =====
// function myFunction() {
//   var secret = '123'
//   console.log(secret) // ✅ 内部可访问
// }
//
// console.log(secret) // ❌ 报错: ReferenceError

// ===== 1.3 块级作用域 (Block Scope) - ES6 新增 =====
// if (true) {
//   let blockLet = 'Locked'
//   var blockVar = 'Leaked'
// }
//
// console.log(blockVar) // ✅ 输出 "Leaked" (var 穿透了)
// console.log(blockLet) // ❌ 报错: ReferenceError (let 被锁住了)

// ===== 2.1 词法作用域 (Lexical Scope) =====
// let value = 1
//
// function foo() {
//   console.log(value)
// }
//
// function bar() {
//   let value = 2
//   foo() // 在这里调用 foo
// }
//
// bar() // 输出: 1
// // 原因：foo 定义在全局，它的上级是全局作用域（value=1），而不是 bar 的作用域。

// ===== 2.3 作用域的高级应用——闭包 (Closure) =====
// function createCounter() {
//   let count = 0 // 这个变量被“封闭”在闭包里
//
//   return function () {
//     count++
//     console.log(count)
//   }
// }
//
// const myCounter = createCounter() // createCounter 执行完毕，本该销毁 count
// myCounter() // 1 - 但 myCounter 依然持有对 count 的引用
// myCounter() // 2

// ===== 3.1 什么是“变量遮蔽” (Variable Shadowing)？ =====
// let name = 'Outer'
//
// function show() {
//   let name = 'Inner' // 遮蔽了外部的 name
//   console.log(name) // "Inner"
// }

// ===== 3.5 面试题：作用域链查找 =====
// var a = 10
// function test() {
//   console.log(a)
//   var a = 20
// }
// test()

