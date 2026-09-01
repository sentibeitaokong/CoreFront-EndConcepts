/*
 * 示例代码：eventLoop.md
 * 来源文档：apps/docs/js/advanced/async/eventLoop.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 5.1 浏览器的事件循环 =====
// console.log(1)
// setTimeout(() => {
//   console.log(2)
//   Promise.resolve().then(() => {
//     console.log(3)
//   })
// })
//
// new Promise((resolve, reject) => {
//   console.log(4)
//   resolve(5)
// }).then(data => {
//   console.log(data)
// })
//
// setTimeout(() => {
//   console.log(6)
// })
//
// console.log(7)
// // 1 4 7  5 2 3 6

// ===== Node.js 中的执行顺序示例 =====
// console.log('Start') // 同步任务
//
// setTimeout(() => {
//   console.log('setTimeout 0') // 宏任务 (timers 阶段)
// }, 0)
//
// setImmediate(() => {
//   console.log('setImmediate') // 宏任务 (check 阶段)
// })
//
// process.nextTick(() => {
//   console.log('process.nextTick 1') // 微任务 (优先级最高)
// })
//
// Promise.resolve().then(() => {
//   console.log('Promise 1') // 微任务
// })
//
// process.nextTick(() => {
//   console.log('process.nextTick 2') // 微任务 (优先级最高)
// })
//
// Promise.resolve().then(() => {
//   console.log('Promise 2') // 微任务
// })
//
// console.log('End') // 同步任务

// ===== Node.js 中的执行顺序示例 =====
// Start
// End
// process.nextTick 1
// process.nextTick 2
// Promise 1
// Promise 2
// setTimeout 0
// setImmediate

// ===== Node.js 中的执行顺序示例 =====
// const fs = require('fs')
//
// fs.readFile(__filename, () => {
//   console.log('readFile callback') // I/O 相关的宏任务
//
//   setTimeout(() => {
//     console.log('setTimeout in readFile') // 宏任务
//   }, 0)
//
//   setImmediate(() => {
//     console.log('setImmediate in readFile') // 宏任务
//   })
//
//   process.nextTick(() => {
//     console.log('process.nextTick in readFile') // 微任务
//   })
// })
//
// console.log('Start')

// ===== Node.js 中的执行顺序示例 =====
// Start
// readFile callback
// process.nextTick in readFile // 在 I/O 回调执行后，立即清空微任务
// setImmediate in readFile   // 在 I/O 回调内部，setImmediate 优先于 setTimeout(0)
// setTimeout in readFile

// ===== 6.2 如果微任务队列一直有新任务加入，会发生什么？ =====
// // 危险！不要在生产环境运行
// Promise.resolve().then(function microtask() {
//   console.log('Microtask running...')
//   Promise.resolve().then(microtask) // 无限地添加新的微任务
// })

// ===== 6.4 async/await 在事件循环中是如何工作的？ =====
// async function async1() {
//   console.log('2. async1 start')
//   await async2() // await 后面的代码会进入微任务队列
//   console.log('6. async1 end')
// }
// async function async2() {
//   console.log('3. async2')
// }
//
// console.log('1. script start')
// async1()
// console.log('4. script end')
//
// // 输出: 1, 2, 3, 4, 6
// // 5. then's log is missing in the example

