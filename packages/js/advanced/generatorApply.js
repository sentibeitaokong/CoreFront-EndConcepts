/*
 * 示例代码：generatorApply.md
 * 来源文档：apps/docs/js/advanced/async/generatorApply.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.2 回调函数 =====
// fs.readFile('/etc/passwd', 'utf-8', function (err, data) {
//   if (err) throw err
//   console.log(data)
// })

// ===== 1.3 Promise =====
// fs.readFile(fileA, 'utf-8', function (err, data) {
//   fs.readFile(fileB, 'utf-8', function (err, data) {
//     // ...
//   })
// })

// ===== 1.3 Promise =====
// var readFile = require('fs-readfile-promise')
//
// readFile(fileA)
//   .then(function (data) {
//     console.log(data.toString())
//   })
//   .then(function () {
//     return readFile(fileB)
//   })
//   .then(function (data) {
//     console.log(data.toString())
//   })
//   .catch(function (err) {
//     console.log(err)
//   })

// ===== 2.1 协程 =====
// function* asyncJob() {
//   // ...其他代码
//   var f = yield readFile(fileA)
//   // ...其他代码
// }

// ===== 2.2 协程的 Generator 函数实现 =====
// function* gen(x) {
//   var y = yield x + 2
//   return y
// }
//
// var g = gen(1)
// g.next() // { value: 3, done: false }
// g.next() // { value: undefined, done: true }

// ===== 2.3 Generator 函数的数据交换和错误处理 =====
// function* gen(x) {
//   var y = yield x + 2
//   return y
// }
//
// var g = gen(1)
// g.next() // { value: 3, done: false }
// g.next(2) // { value: 2, done: true }

// ===== 2.3 Generator 函数的数据交换和错误处理 =====
// function* gen(x) {
//   try {
//     var y = yield x + 2
//   } catch (e) {
//     console.log(e)
//   }
//   return y
// }
//
// var g = gen(1)
// g.next()
// g.throw('出错了')
// // 出错了

// ===== 2.4 异步任务的封装 =====
// var fetch = require('node-fetch')
//
// function* gen() {
//   var url = 'https://api.github.com/users/github'
//   var result = yield fetch(url)
//   console.log(result.bio)
// }

// ===== 2.4 异步任务的封装 =====
// var g = gen()
// var result = g.next()
//
// result.value
//   .then(function (data) {
//     return data.json()
//   })
//   .then(function (data) {
//     g.next(data)
//   })

// ===== 3.1 参数的求值策略 =====
// var x = 1
//
// function f(m) {
//   return m * 2
// }
//
// f(x + 5)

// ===== 3.1 参数的求值策略 =====
// f(x + 5)
// // 传值调用时，等同于
// f(6)

// ===== 3.1 参数的求值策略 =====
// f(x + 5)(
//   // 传名调用时，等同于
//   x + 5,
// ) * 2

// ===== 3.1 参数的求值策略 =====
// function f(a, b) {
//   return b
// }
//
// f(3 * x * x - 2 * x - 1, x)

// ===== 3.2 Thunk 函数的含义 =====
// function f(m) {
//   return m * 2
// }
//
// f(x + 5)
//
// // 等同于
//
// var thunk = function () {
//   return x + 5
// }
//
// function f(thunk) {
//   return thunk() * 2
// }

// ===== 3.3 JavaScript 语言的 Thunk 函数 =====
// // 正常版本的readFile（多参数版本）
// fs.readFile(fileName, callback)
//
// // Thunk版本的readFile（单参数版本）
// var Thunk = function (fileName) {
//   return function (callback) {
//     return fs.readFile(fileName, callback)
//   }
// }
//
// var readFileThunk = Thunk(fileName)
// readFileThunk(callback)

// ===== 3.3 JavaScript 语言的 Thunk 函数 =====
// // ES5版本
// var Thunk = function (fn) {
//   return function () {
//     var args = Array.prototype.slice.call(arguments)
//     return function (callback) {
//       args.push(callback)
//       return fn.apply(this, args)
//     }
//   }
// }
//
// // ES6版本
// const Thunk = function (fn) {
//   return function (...args) {
//     return function (callback) {
//       return fn.call(this, ...args, callback)
//     }
//   }
// }

// ===== 3.3 JavaScript 语言的 Thunk 函数 =====
// var readFileThunk = Thunk(fs.readFile)
// readFileThunk(fileA)(callback)

// ===== 3.3 JavaScript 语言的 Thunk 函数 =====
// function f(a, cb) {
//   cb(a)
// }
// const ft = Thunk(f)
//
// ft(1)(console.log) // 1

// ===== 3.4 Thunkify 模块 [bash] =====
// $ npm install thunkify

// ===== 3.4 Thunkify 模块 =====
// var thunkify = require('thunkify')
// var fs = require('fs')
//
// var read = thunkify(fs.readFile)
// read('package.json')(function (err, str) {
//   // ...
// })

// ===== 3.4 Thunkify 模块 =====
// function thunkify(fn) {
//   return function () {
//     var args = new Array(arguments.length)
//     var ctx = this
//
//     for (var i = 0; i < args.length; ++i) {
//       args[i] = arguments[i]
//     }
//
//     return function (done) {
//       var called
//
//       args.push(function () {
//         if (called) return
//         called = true
//         done.apply(null, arguments)
//       })
//
//       try {
//         fn.apply(ctx, args)
//       } catch (err) {
//         done(err)
//       }
//     }
//   }
// }

// ===== 3.4 Thunkify 模块 =====
// function f(a, b, callback) {
//   var sum = a + b
//   callback(sum)
//   callback(sum)
// }
//
// var ft = thunkify(f)
// var print = console.log.bind(console)
// ft(1, 2)(print)
// // 3

// ===== 3.5 Generator 函数的流程管理 =====
// function* gen() {
//   // ...
// }
//
// var g = gen()
// var res = g.next()
//
// while (!res.done) {
//   console.log(res.value)
//   res = g.next()
// }

// ===== 3.5 Generator 函数的流程管理 =====
// var fs = require('fs')
// var thunkify = require('thunkify')
// var readFileThunk = thunkify(fs.readFile)
//
// var gen = function* () {
//   var r1 = yield readFileThunk('/etc/fstab')
//   console.log(r1.toString())
//   var r2 = yield readFileThunk('/etc/shells')
//   console.log(r2.toString())
// }

// ===== 3.5 Generator 函数的流程管理 =====
// var g = gen()
//
// var r1 = g.next()
// r1.value(function (err, data) {
//   if (err) throw err
//   var r2 = g.next(data)
//   r2.value(function (err, data) {
//     if (err) throw err
//     g.next(data)
//   })
// })

// ===== 3.6 Thunk 函数的自动流程管理 =====
// function run(fn) {
//   var gen = fn()
//
//   function next(err, data) {
//     var result = gen.next(data)
//     if (result.done) return
//     result.value(next)
//   }
//
//   next()
// }
//
// function* g() {
//   // ...
// }
//
// run(g)

// ===== 3.6 Thunk 函数的自动流程管理 =====
// var g = function* () {
//   var f1 = yield readFileThunk('fileA')
//   var f2 = yield readFileThunk('fileB')
//   // ...
//   var fn = yield readFileThunk('fileN')
// }
//
// run(g)

// ===== 4.1 基本用法 =====
// var gen = function* () {
//   var f1 = yield readFile('/etc/fstab')
//   var f2 = yield readFile('/etc/shells')
//   console.log(f1.toString())
//   console.log(f2.toString())
// }

// ===== 4.1 基本用法 =====
// var co = require('co')
// co(gen)

// ===== 4.1 基本用法 =====
// co(gen).then(function () {
//   console.log('Generator 函数执行完成')
// })

// ===== 4.3 基于 Promise 对象的自动执行 =====
// var fs = require('fs')
//
// var readFile = function (fileName) {
//   return new Promise(function (resolve, reject) {
//     fs.readFile(fileName, function (error, data) {
//       if (error) return reject(error)
//       resolve(data)
//     })
//   })
// }
//
// var gen = function* () {
//   var f1 = yield readFile('/etc/fstab')
//   var f2 = yield readFile('/etc/shells')
//   console.log(f1.toString())
//   console.log(f2.toString())
// }

// ===== 4.3 基于 Promise 对象的自动执行 =====
// var g = gen()
//
// g.next().value.then(function (data) {
//   g.next(data).value.then(function (data) {
//     g.next(data)
//   })
// })

// ===== 4.3 基于 Promise 对象的自动执行 =====
// function run(gen) {
//   var g = gen()
//
//   function next(data) {
//     var result = g.next(data)
//     if (result.done) return result.value
//     result.value.then(function (data) {
//       next(data)
//     })
//   }
//
//   next()
// }
//
// run(gen)

// ===== 4.4 co 模块的源码 =====
// function co(gen) {
//   var ctx = this
//
//   return new Promise(function (resolve, reject) {})
// }

// ===== 4.4 co 模块的源码 =====
// function co(gen) {
//   var ctx = this
//
//   return new Promise(function (resolve, reject) {
//     if (typeof gen === 'function') gen = gen.call(ctx)
//     if (!gen || typeof gen.next !== 'function') return resolve(gen)
//   })
// }

// ===== 4.4 co 模块的源码 =====
// function co(gen) {
//   var ctx = this
//
//   return new Promise(function (resolve, reject) {
//     if (typeof gen === 'function') gen = gen.call(ctx)
//     if (!gen || typeof gen.next !== 'function') return resolve(gen)
//
//     onFulfilled()
//     function onFulfilled(res) {
//       var ret
//       try {
//         ret = gen.next(res)
//       } catch (e) {
//         return reject(e)
//       }
//       next(ret)
//     }
//   })
// }

// ===== 4.4 co 模块的源码 =====
// function next(ret) {
//   if (ret.done) return resolve(ret.value)
//   var value = toPromise.call(ctx, ret.value)
//   if (value && isPromise(value)) return value.then(onFulfilled, onRejected)
//   return onRejected(
//     new TypeError(
//       'You may only yield a function, promise, generator, array, or object, ' +
//         'but the following object was passed: "' +
//         String(ret.value) +
//         '"',
//     ),
//   )
// }

// ===== 4.5 处理并发的异步操作 =====
// // 数组的写法
// co(function* () {
//   var res = yield [Promise.resolve(1), Promise.resolve(2)]
//   console.log(res)
// }).catch(onerror)
//
// // 对象的写法
// co(function* () {
//   var res = yield {
//     1: Promise.resolve(1),
//     2: Promise.resolve(2),
//   }
//   console.log(res)
// }).catch(onerror)

// ===== 4.5 处理并发的异步操作 =====
// co(function* () {
//   var values = [n1, n2, n3]
//   yield values.map(somethingAsync)
// })
//
// function* somethingAsync(x) {
//   // do something async
//   return y
// }

// ===== 4.6 实例：处理 Stream =====
// const co = require('co')
// const fs = require('fs')
//
// const stream = fs.createReadStream('./les_miserables.txt')
// let valjeanCount = 0
//
// co(function* () {
//   while (true) {
//     const res = yield Promise.race([
//       new Promise(resolve => stream.once('data', resolve)),
//       new Promise(resolve => stream.once('end', resolve)),
//       new Promise((resolve, reject) => stream.once('error', reject)),
//     ])
//     if (!res) {
//       break
//     }
//     stream.removeAllListeners('data')
//     stream.removeAllListeners('end')
//     stream.removeAllListeners('error')
//     valjeanCount += (res.toString().match(/valjean/gi) || []).length
//   }
//   console.log('count:', valjeanCount) // count: 1120
// })

