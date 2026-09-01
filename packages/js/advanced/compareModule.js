/*
 * 示例代码：compareModule.md
 * 来源文档：apps/docs/js/advanced/modules/compareModule.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 传统方法 [html] =====
// <!-- 页面内嵌的脚本 -->
// <script type="application/javascript">
//   // module code
// </script>
//
// <!-- 外部脚本 -->
// <script type="application/javascript" src="path/to/myModule.js"></script>

// ===== 1.1 传统方法 [html] =====
// <script src="path/to/myModule.js" defer></script>
// <script src="path/to/myModule.js" async></script>

// ===== 1.2 加载规则 [html] =====
// <script type="module" src="./foo.js"></script>

// ===== 1.2 加载规则 [html] =====
// <script type="module" src="./foo.js"></script>
// <!-- 等同于 -->
// <script type="module" src="./foo.js" defer></script>

// ===== 1.2 加载规则 [html] =====
// <script type="module" src="./foo.js" async></script>

// ===== 1.2 加载规则 [html] =====
// <script type="module">
//   import utils from './utils.js'
//
//   // other code
// </script>

// ===== 1.2 加载规则 [html] =====
// <script type="module">
//   import $ from './jquery/src/jquery.js'
//   $('#message').text('Hi from jQuery!')
// </script>

// ===== 1.2 加载规则 =====
// import utils from 'https://example.com/js/utils.js'
//
// const x = 1
//
// console.log(x === window.x) //false
// console.log(this === undefined) // true

// ===== 1.2 加载规则 =====
// const isNotModuleScript = this !== undefined

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // lib.js
// var counter = 3
// function incCounter() {
//   counter++
// }
// module.exports = {
//   counter: counter,
//   incCounter: incCounter,
// }

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // main.js
// var mod = require('./lib')
//
// console.log(mod.counter) // 3
// mod.incCounter()
// console.log(mod.counter) // 3

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // lib.js
// var counter = 3
// function incCounter() {
//   counter++
// }
// module.exports = {
//   get counter() {
//     return counter
//   },
//   incCounter: incCounter,
// }

// ===== 2. ES6 模块与 CommonJS 模块的差异 [bash] =====
// $ node main.js
// 3
// 4

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // lib.js
// export let counter = 3
// export function incCounter() {
//   counter++
// }
//
// // main.js
// import { counter, incCounter } from './lib'
// console.log(counter) // 3
// incCounter()
// console.log(counter) // 4

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // m1.js
// export var foo = 'bar'
// setTimeout(() => (foo = 'baz'), 500)
//
// // m2.js
// import { foo } from './m1.js'
// console.log(foo)
// setTimeout(() => console.log(foo), 500)

// ===== 2. ES6 模块与 CommonJS 模块的差异 [bash] =====
// $ babel-node m2.js
//
// bar
// baz

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // lib.js
// export let obj = {}
//
// // main.js
// import { obj } from './lib'
//
// obj.prop = 123 // OK
// obj = {} // TypeError

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // mod.js
// function C() {
//   this.sum = 0
//   this.add = function () {
//     this.sum += 1
//   }
//   this.show = function () {
//     console.log(this.sum)
//   }
// }
//
// export let c = new C()

// ===== 2. ES6 模块与 CommonJS 模块的差异 =====
// // x.js
// import { c } from './mod'
// c.add()
//
// // y.js
// import { c } from './mod'
// c.show()
//
// // main.js
// import './x'
// import './y'

// ===== 2. ES6 模块与 CommonJS 模块的差异 [bash] =====
// $ babel-node main.js
// 1

// ===== 3.1 概述 =====
// {
//    "type": "module"
// }

// ===== 3.1 概述 [bash] =====
// # 解释成 ES6 模块
// $ node my-app.js

// ===== 3.2 package.json 的 main 字段 =====
// // ./node_modules/es-module-package/package.json
// {
//   "type": "module",
//   "main": "./src/index.js"
// }

// ===== 3.2 package.json 的 main 字段 =====
// // ./my-app.mjs
//
// import { something } from 'es-module-package'
// // 实际加载的是 ./node_modules/es-module-package/src/index.js

// ===== 3.3 package.json 的 exports 字段 =====
// // ./node_modules/es-module-package/package.json
// {
//   "exports": {
//     "./submodule": "./src/submodule.js"
//   }
// }

// ===== 3.3 package.json 的 exports 字段 =====
// import submodule from 'es-module-package/submodule'
// // 加载 ./node_modules/es-module-package/src/submodule.js

// ===== 3.3 package.json 的 exports 字段 =====
// // ./node_modules/es-module-package/package.json
// {
//   "exports": {
//     "./features/": "./src/features/"
//   }
// }
//
// import feature from 'es-module-package/features/x.js';
// // 加载 ./node_modules/es-module-package/src/features/x.js

// ===== 3.3 package.json 的 exports 字段 =====
// // 报错
// import submodule from 'es-module-package/private-module.js'
//
// // 不报错
// import submodule from './node_modules/es-module-package/private-module.js'

// ===== 3.3 package.json 的 exports 字段 =====
// {
//   "exports": {
//     ".": "./main.js"
//   }
// }
//
// // 等同于
// {
//   "exports": "./main.js"
// }

// ===== 3.3 package.json 的 exports 字段 =====
// {
//   "main": "./main-legacy.cjs",
//   "exports": {
//     ".": "./main-modern.cjs"
//   }
// }

// ===== 3.3 package.json 的 exports 字段 =====
// {
//   "type": "module",
//   "exports": {
//     ".": {
//       "require": "./main.cjs",
//       "default": "./main.js"
//     }
//   }
// }

// ===== 3.3 package.json 的 exports 字段 =====
// {
//   "exports": {
//     "require": "./main.cjs",
//     "default": "./main.js"
//   }
// }

// ===== 3.3 package.json 的 exports 字段 =====
// {
//   // 报错
//   "exports": {
//     "./feature": "./lib/feature.js",
//     "require": "./main.cjs",
//     "default": "./main.js"
//   }
// }

// ===== 3.4 CommonJS 模块加载 ES6 模块 =====
// ;(async () => {
//   await import('./my-app.mjs')
// })()

// ===== 3.5 ES6 模块加载 CommonJS 模块 =====
// // 正确
// import packageMain from 'commonjs-package'
//
// // 报错
// import { method } from 'commonjs-package'

// ===== 3.5 ES6 模块加载 CommonJS 模块 =====
// import packageMain from 'commonjs-package'
// const { method } = packageMain

// ===== 3.5 ES6 模块加载 CommonJS 模块 =====
// // cjs.cjs
// module.exports = 'cjs'
//
// // esm.mjs
// import { createRequire } from 'module'
//
// const require = createRequire(import.meta.url)
//
// const cjs = require('./cjs.cjs')
// cjs === 'cjs' // true

// ===== 3.6 同时支持两种格式的模块 =====
// import cjsModule from '../index.js'
// export const foo = cjsModule.foo

// ===== 3.6 同时支持两种格式的模块 =====
// "exports"：{
//   "require": "./index.js"，
//   "import": "./esm/wrapper.js"
// }

// ===== 3.7 Node.js 的内置模块 =====
// // 整体加载
// import EventEmitter from 'events'
// const e = new EventEmitter()
//
// // 加载指定的输出项
// import { readFile } from 'fs'
// readFile('./foo.txt', (err, source) => {
//   if (err) {
//     console.error(err)
//   } else {
//     console.log(source)
//   }
// })

// ===== 3.8 加载路径 =====
// // ES6 模块中将报错
// import { something } from './index'

// ===== 3.8 加载路径 =====
// import './foo.mjs?query=1' // 加载 ./foo 传入参数 ?query=1

// ===== 4. 循环加载 =====
// // a.js
// var b = require('b')
//
// // b.js
// var a = require('a')

// ===== 4.1 CommonJS 模块的加载原理 =====
// {
//   id: '...',
//   exports: { ... },
//   loaded: true,
//   ...
// }

// ===== 4.2 CommonJS 模块的循环加载 =====
// exports.done = false
// var b = require('./b.js')
// console.log('在 a.js 之中，b.done = %j', b.done)
// exports.done = true
// console.log('a.js 执行完毕')

// ===== 4.2 CommonJS 模块的循环加载 =====
// exports.done = false
// var a = require('./a.js')
// console.log('在 b.js 之中，a.done = %j', a.done)
// exports.done = true
// console.log('b.js 执行完毕')

// ===== 4.2 CommonJS 模块的循环加载 =====
// exports.done = false

// ===== 4.2 CommonJS 模块的循环加载 =====
// var a = require('./a.js')
// var b = require('./b.js')
// console.log('在 main.js 之中, a.done=%j, b.done=%j', a.done, b.done)

// ===== 4.2 CommonJS 模块的循环加载 [bash] =====
// $ node main.js
//
// 在 b.js 之中，a.done = false
// b.js 执行完毕
// 在 a.js 之中，b.done = true
// a.js 执行完毕
// 在 main.js 之中, a.done=true, b.done=true

// ===== 4.2 CommonJS 模块的循环加载 =====
// exports.done = true

// ===== 4.2 CommonJS 模块的循环加载 =====
// var a = require('a') // 安全的写法
// var foo = require('a').foo // 危险的写法
//
// exports.good = function (arg) {
//   return a.foo('good', arg) // 使用的是 a.foo 的最新值
// }
//
// exports.bad = function (arg) {
//   return foo('bad', arg) // 使用的是一个部分加载时的值
// }

// ===== 4.3 ES6 模块的循环加载 =====
// // a.mjs
// import { bar } from './b'
// console.log('a.mjs')
// console.log(bar)
// export let foo = 'foo'
//
// // b.mjs
// import { foo } from './a'
// console.log('b.mjs')
// console.log(foo)
// export let bar = 'bar'

// ===== 4.3 ES6 模块的循环加载 [bash] =====
// $ node --experimental-modules a.mjs
// b.mjs
// ReferenceError: foo is not defined

// ===== 4.3 ES6 模块的循环加载 =====
// // a.mjs
// import { bar } from './b'
// console.log('a.mjs')
// console.log(bar())
// function foo() {
//   return 'foo'
// }
// export { foo }
//
// // b.mjs
// import { foo } from './a'
// console.log('b.mjs')
// console.log(foo())
// function bar() {
//   return 'bar'
// }
// export { bar }

// ===== 4.3 ES6 模块的循环加载 [bash] =====
// $ node --experimental-modules a.mjs
// b.mjs
// foo
// a.mjs
// bar

// ===== 4.3 ES6 模块的循环加载 =====
// // a.mjs
// import { bar } from './b'
// console.log('a.mjs')
// console.log(bar())
// const foo = () => 'foo'
// export { foo }

// ===== 4.3 ES6 模块的循环加载 =====
// // even.js
// import { odd } from './odd'
// export var counter = 0
// export function even(n) {
//   counter++
//   return n === 0 || odd(n - 1)
// }
//
// // odd.js
// import { even } from './even'
// export function odd(n) {
//   return n !== 0 && even(n - 1)
// }

// ===== 4.3 ES6 模块的循环加载 =====
// $ babel-node
// > import * as m from './even.js';
// > m.even(10);
// true
// > m.counter
// 6
// > m.even(20)
// true
// > m.counter
// 17

// ===== 4.3 ES6 模块的循环加载 =====
// // even.js
// var odd = require('./odd')
// var counter = 0
// exports.counter = counter
// exports.even = function (n) {
//   counter++
//   return n == 0 || odd(n - 1)
// }
//
// // odd.js
// var even = require('./even').even
// module.exports = function (n) {
//   return n != 0 && even(n - 1)
// }

// ===== 4.3 ES6 模块的循环加载 [bash] =====
// $ node
// > var m = require('./even');
// > m.even(10)
// TypeError: even is not a function

