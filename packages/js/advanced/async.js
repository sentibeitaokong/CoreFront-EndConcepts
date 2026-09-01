/*
 * 示例代码：async.md
 * 来源文档：apps/docs/js/advanced/async/async.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 什么是async 函数? =====
// const fs = require('fs')
//
// const readFile = function (fileName) {
//   return new Promise(function (resolve, reject) {
//     fs.readFile(fileName, function (error, data) {
//       if (error) return reject(error)
//       resolve(data)
//     })
//   })
// }
//
// const gen = function* () {
//   const f1 = yield readFile('/etc/fstab')
//   const f2 = yield readFile('/etc/shells')
//   console.log(f1.toString())
//   console.log(f2.toString())
// }

// ===== 1. 什么是async 函数? =====
// const asyncReadFile = async function () {
//   const f1 = await readFile('/etc/fstab')
//   const f2 = await readFile('/etc/shells')
//   console.log(f1.toString())
//   console.log(f2.toString())
// }

// ===== 1. 什么是async 函数? =====
// asyncReadFile()

// ===== 2. 基本用法 =====
// async function getStockPriceByName(name) {
//   const symbol = await getStockSymbol(name)
//   const stockPrice = await getStockPrice(symbol)
//   return stockPrice
// }
//
// getStockPriceByName('goog').then(function (result) {
//   console.log(result)
// })

// ===== 2. 基本用法 =====
// function timeout(ms) {
//   return new Promise(resolve => {
//     setTimeout(resolve, ms)
//   })
// }
//
// async function asyncPrint(value, ms) {
//   await timeout(ms)
//   console.log(value)
// }
//
// asyncPrint('hello world', 50)

// ===== 2. 基本用法 =====
// async function timeout(ms) {
//   await new Promise(resolve => {
//     setTimeout(resolve, ms)
//   })
// }
//
// async function asyncPrint(value, ms) {
//   await timeout(ms)
//   console.log(value)
// }
//
// asyncPrint('hello world', 50)

// ===== 2. 基本用法 =====
// // 函数声明
// async function foo() {}
//
// // 函数表达式
// const foo = async function () {};
//
// // 对象的方法
// let obj = { async foo() {} };
// obj.foo().then(...)
//
// // Class 的方法
// class Storage {
//   constructor() {
//     this.cachePromise = caches.open('avatars');
//   }
//
//   async getAvatar(name) {
//     const cache = await this.cachePromise;
//     return cache.match(`/avatars/${name}.jpg`);
//   }
// }
//
// const storage = new Storage();
// storage.getAvatar('jake').then(…);
//
// // 箭头函数
// const foo = async () => {};

// ===== 3.1 返回 Promise 对象 =====
// async function f() {
//   return 'hello world'
// }
//
// f().then(v => console.log(v))
// // "hello world"

// ===== 3.1 返回 Promise 对象 =====
// async function f() {
//   throw new Error('出错了')
// }
//
// f().then(
//   v => console.log('resolve', v),
//   e => console.log('reject', e),
// )
// //reject Error: 出错了

// ===== 3.2 Promise 对象的状态变化 =====
// async function getTitle(url) {
//   let response = await fetch(url)
//   let html = await response.text()
//   return html.match(/<title>([\s\S]+)<\/title>/i)[1]
// }
// getTitle('https://tc39.github.io/ecma262/').then(console.log)
// // "ECMAScript 2017 Language Specification"

// ===== 3.3 await 命令 =====
// async function f() {
//   // 等同于
//   // return 123;
//   return await 123
// }
//
// f().then(v => console.log(v))
// // 123

// ===== 3.3 await 命令 =====
// class Sleep {
//   constructor(timeout) {
//     this.timeout = timeout
//   }
//   then(resolve, reject) {
//     const startTime = Date.now()
//     setTimeout(() => resolve(Date.now() - startTime), this.timeout)
//   }
// }
//
// ;(async () => {
//   const sleepTime = await new Sleep(1000)
//   console.log(sleepTime)
// })()
// // 1000

// ===== 3.3 await 命令 =====
// function sleep(interval) {
//   return new Promise(resolve => {
//     setTimeout(resolve, interval)
//   })
// }
//
// // 用法
// async function one2FiveInAsync() {
//   for (let i = 1; i <= 5; i++) {
//     console.log(i)
//     await sleep(1000)
//   }
// }
//
// one2FiveInAsync()

// ===== 3.3 await 命令 =====
// async function f() {
//   await Promise.reject('出错了')
// }
//
// f()
//   .then(v => console.log(v))
//   .catch(e => console.log(e))
// // 出错了

// ===== 3.3 await 命令 =====
// async function f() {
//   await Promise.reject('出错了')
//   await Promise.resolve('hello world') // 不会执行
// }

// ===== 3.3 await 命令 =====
// async function f() {
//   try {
//     await Promise.reject('出错了')
//   } catch (e) {}
//   return await Promise.resolve('hello world')
// }
//
// f().then(v => console.log(v))
// // hello world

// ===== 3.3 await 命令 =====
// async function f() {
//   await Promise.reject('出错了').catch(e => console.log(e))
//   return await Promise.resolve('hello world')
// }
//
// f().then(v => console.log(v))
// // 出错了
// // hello world

// ===== 3.4 错误处理 =====
// async function f() {
//   await new Promise(function (resolve, reject) {
//     throw new Error('出错了')
//   })
// }
//
// f()
//   .then(v => console.log(v))
//   .catch(e => console.log(e))
// // Error：出错了

// ===== 3.4 错误处理 =====
// async function f() {
//   try {
//     await new Promise(function (resolve, reject) {
//       throw new Error('出错了')
//     })
//   } catch (e) {}
//   return await 'hello world'
// }

// ===== 3.4 错误处理 =====
// async function main() {
//   try {
//     const val1 = await firstStep()
//     const val2 = await secondStep(val1)
//     const val3 = await thirdStep(val1, val2)
//
//     console.log('Final: ', val3)
//   } catch (err) {
//     console.error(err)
//   }
// }

// ===== 3.4 错误处理 =====
// const superagent = require('superagent')
// const NUM_RETRIES = 3
//
// async function test() {
//   let i
//   for (i = 0; i < NUM_RETRIES; ++i) {
//     try {
//       await superagent.get('http://google.com/this-throws-an-error')
//       break
//     } catch (err) {}
//   }
//   console.log(i) // 3
// }
//
// test()

// ===== 3.5 使用注意点 =====
// async function myFunction() {
//   try {
//     await somethingThatReturnsAPromise()
//   } catch (err) {
//     console.log(err)
//   }
// }
//
// // 另一种写法
//
// async function myFunction() {
//   await somethingThatReturnsAPromise().catch(function (err) {
//     console.log(err)
//   })
// }

// ===== 3.5 使用注意点 =====
// let foo = await getFoo()
// let bar = await getBar()

// ===== 3.5 使用注意点 =====
// // 写法一
// let [foo, bar] = await Promise.all([getFoo(), getBar()])
//
// // 写法二
// let fooPromise = getFoo()
// let barPromise = getBar()
// let foo = await fooPromise
// let bar = await barPromise

// ===== 3.5 使用注意点 =====
// async function dbFuc(db) {
//   let docs = [{}, {}, {}];
//
//   // 报错
//   docs.forEach(function (doc) {
//     await db.post(doc);
//   });
// }

// ===== 3.5 使用注意点 =====
// function dbFuc(db) {
//   //这里不需要 async
//   let docs = [{}, {}, {}]
//
//   // 可能得到错误结果
//   docs.forEach(async function (doc) {
//     await db.post(doc)
//   })
// }

// ===== 3.5 使用注意点 =====
// async function dbFuc(db) {
//   let docs = [{}, {}, {}]
//
//   for (let doc of docs) {
//     await db.post(doc)
//   }
// }

// ===== 3.5 使用注意点 =====
// async function dbFuc(db) {
//   let docs = [{}, {}, {}]
//
//   await docs.reduce(async (_, doc) => {
//     await _
//     await db.post(doc)
//   }, undefined)
// }

// ===== 3.5 使用注意点 =====
// async function dbFuc(db) {
//   let docs = [{}, {}, {}]
//   let promises = docs.map(doc => db.post(doc))
//
//   let results = await Promise.all(promises)
//   console.log(results)
// }
//
// // 或者使用下面的写法
//
// async function dbFuc(db) {
//   let docs = [{}, {}, {}]
//   let promises = docs.map(doc => db.post(doc))
//
//   let results = []
//   for (let promise of promises) {
//     results.push(await promise)
//   }
//   console.log(results)
// }

// ===== 3.5 使用注意点 =====
// const a = () => {
//   b().then(() => c())
// }

// ===== 3.5 使用注意点 =====
// const a = async () => {
//   await b()
//   c()
// }

// ===== 4. async 函数的实现原理 =====
// async function fn(args) {
//   // ...
// }
//
// // 等同于
//
// function fn(args) {
//   return spawn(function* () {
//     // ...
//   })
// }

// ===== 4. async 函数的实现原理 =====
// function spawn(genF) {
//   return new Promise(function (resolve, reject) {
//     const gen = genF()
//     function step(nextF) {
//       let next
//       try {
//         next = nextF()
//       } catch (e) {
//         return reject(e)
//       }
//       if (next.done) {
//         return resolve(next.value)
//       }
//       Promise.resolve(next.value).then(
//         function (v) {
//           step(function () {
//             return gen.next(v)
//           })
//         },
//         function (e) {
//           step(function () {
//             return gen.throw(e)
//           })
//         },
//       )
//     }
//     step(function () {
//       return gen.next(undefined)
//     })
//   })
// }

// ===== 5.1 与其他异步处理方法的比较 =====
// function chainAnimationsPromise(elem, animations) {
//   // 变量ret用来保存上一个动画的返回值
//   let ret = null
//
//   // 新建一个空的Promise
//   let p = Promise.resolve()
//
//   // 使用then方法，添加所有动画
//   for (let anim of animations) {
//     p = p.then(function (val) {
//       ret = val
//       return anim(elem)
//     })
//   }
//
//   // 返回一个部署了错误捕捉机制的Promise
//   return p
//     .catch(function (e) {
//       /* 忽略错误，继续执行 */
//     })
//     .then(function () {
//       return ret
//     })
// }

// ===== 5.1 与其他异步处理方法的比较 =====
// function chainAnimationsGenerator(elem, animations) {
//   return spawn(function* () {
//     let ret = null
//     try {
//       for (let anim of animations) {
//         ret = yield anim(elem)
//       }
//     } catch (e) {
//       /* 忽略错误，继续执行 */
//     }
//     return ret
//   })
// }

// ===== 5.1 与其他异步处理方法的比较 =====
// async function chainAnimationsAsync(elem, animations) {
//   let ret = null
//   try {
//     for (let anim of animations) {
//       ret = await anim(elem)
//     }
//   } catch (e) {
//     /* 忽略错误，继续执行 */
//   }
//   return ret
// }

// ===== 5.2 按顺序完成异步操作 =====
// function logInOrder(urls) {
//   // 远程读取所有URL
//   const textPromises = urls.map(url => {
//     return fetch(url).then(response => response.text())
//   })
//
//   // 按次序输出
//   textPromises.reduce((chain, textPromise) => {
//     return chain.then(() => textPromise).then(text => console.log(text))
//   }, Promise.resolve())
// }

// ===== 5.2 按顺序完成异步操作 =====
// async function logInOrder(urls) {
//   for (const url of urls) {
//     const response = await fetch(url)
//     console.log(await response.text())
//   }
// }

// ===== 5.2 按顺序完成异步操作 =====
// async function logInOrder(urls) {
//   // 并发读取远程URL
//   const textPromises = urls.map(async url => {
//     const response = await fetch(url)
//     return response.text()
//   })
//
//   // 按次序输出
//   for (const textPromise of textPromises) {
//     console.log(await textPromise)
//   }
// }

// ===== 6. 顶层 await =====
// // 报错
// const data = await fetch('https://api.example.com')

// ===== 6. 顶层 await =====
// // awaiting.js
// let output
// async function main() {
//   const dynamic = await import(someMission)
//   const data = await fetch(url)
//   output = someProcess(dynamic.default, data)
// }
// main()
// export { output }

// ===== 6. 顶层 await =====
// // usage.js
// import { output } from './awaiting.js'
//
// function outputPlusValue(value) {
//   return output + value
// }
//
// console.log(outputPlusValue(100))
// setTimeout(() => console.log(outputPlusValue(100)), 1000)

// ===== 6. 顶层 await =====
// // awaiting.js
// let output
// export default (async function main() {
//   const dynamic = await import(someMission)
//   const data = await fetch(url)
//   output = someProcess(dynamic.default, data)
// })()
// export { output }

// ===== 6. 顶层 await =====
// // usage.js
// import promise, { output } from './awaiting.js'
//
// function outputPlusValue(value) {
//   return output + value
// }
//
// promise.then(() => {
//   console.log(outputPlusValue(100))
//   setTimeout(() => console.log(outputPlusValue(100)), 1000)
// })

// ===== 6. 顶层 await =====
// // awaiting.js
// const dynamic = import(someMission)
// const data = fetch(url)
// export const output = someProcess((await dynamic).default, await data)

// ===== 6. 顶层 await =====
// // usage.js
// import { output } from './awaiting.js'
// function outputPlusValue(value) {
//   return output + value
// }
//
// console.log(outputPlusValue(100))
// setTimeout(() => console.log(outputPlusValue(100)), 1000)

// ===== 6. 顶层 await =====
// // import() 方法加载
// const strings = await import(`/i18n/${navigator.language}`)
//
// // 数据库操作
// const connection = await dbConnector()
//
// // 依赖回滚
// let jQuery
// try {
//   jQuery = await import('https://cdn-a.com/jQuery')
// } catch {
//   jQuery = await import('https://cdn-b.com/jQuery')
// }

// ===== 6. 顶层 await =====
// // x.js
// console.log('X1')
// await new Promise(r => setTimeout(r, 1000))
// console.log('X2')
//
// // y.js
// console.log('Y')
//
// // z.js
// import './x.js'
// import './y.js'
// console.log('Z')

