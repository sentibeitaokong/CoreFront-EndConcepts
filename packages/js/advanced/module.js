/*
 * 示例代码：module.md
 * 来源文档：apps/docs/js/advanced/modules/module.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. Module定义 =====
// // CommonJS模块
// let { stat, exists, readfile } = require('fs')
//
// // 等同于
// let _fs = require('fs')
// let stat = _fs.stat
// let exists = _fs.exists
// let readfile = _fs.readfile

// ===== 1. Module定义 =====
// // ES6模块
// import { stat, exists, readFile } from 'fs'

// ===== 1.1 export 命令 =====
// // profile.js
// export var firstName = 'Michael'
// export var lastName = 'Jackson'
// export var year = 1958

// ===== 1.1 export 命令 =====
// // profile.js
// var firstName = 'Michael'
// var lastName = 'Jackson'
// var year = 1958
//
// export { firstName, lastName, year }

// ===== 1.1 export 命令 =====
// export function multiply(x, y) {
//   return x * y
// }

// ===== 1.1 export 命令 =====
// function v1() { ... }
// function v2() { ... }
//
// export {
//   v1 as streamV1,
//   v2 as streamV2,
//   v2 as streamLatestVersion
// };

// ===== 1.1 export 命令 =====
// // 报错
// export 1;
//
// // 报错
// var m = 1;
// export m;

// ===== 1.1 export 命令 =====
// // 写法一
// export var m = 1
//
// // 写法二
// var m = 1
// export { m }
//
// // 写法三
// var n = 1
// export { n as m }

// ===== 1.1 export 命令 =====
// // 报错
// function f() {}
// export f;
//
// // 正确
// export function f() {};
//
// // 正确
// function f() {}
// export {f};

// ===== 1.1 export 命令 =====
// export var foo = 'bar'
// setTimeout(() => (foo = 'baz'), 500)

// ===== 1.1 export 命令 =====
// function foo() {
//   export default 'bar' // SyntaxError
// }
// foo()

// ===== 1.2 import 命令 =====
// // main.js
// import { firstName, lastName, year } from './profile.js'
//
// function setName(element) {
//   element.textContent = firstName + ' ' + lastName
// }

// ===== 1.2 import 命令 =====
// import { lastName as surname } from './profile.js'

// ===== 1.2 import 命令 =====
// import { a } from './xxx.js'
//
// a = {} // Syntax Error : 'a' is read-only;

// ===== 1.2 import 命令 =====
// import { a } from './xxx.js'
//
// a.foo = 'hello' // 合法操作

// ===== 1.2 import 命令 =====
// import { myMethod } from 'util'

// ===== 1.2 import 命令 =====
// foo()
//
// import { foo } from 'my_module'

// ===== 1.2 import 命令 =====
// // 报错
// import { 'f' + 'oo' } from 'my_module';
//
// // 报错
// let module = 'my_module';
// import { foo } from module;
//
// // 报错
// if (x === 1) {
//   import { foo } from 'module1';
// } else {
//   import { foo } from 'module2';
// }

// ===== 1.2 import 命令 =====
// import 'lodash'

// ===== 1.2 import 命令 =====
// import 'lodash'
// import 'lodash'

// ===== 1.2 import 命令 =====
// import { foo } from 'my_module'
// import { bar } from 'my_module'
//
// // 等同于
// import { foo, bar } from 'my_module'

// ===== 1.2 import 命令 =====
// require('core-js/modules/es6.symbol')
// require('core-js/modules/es6.promise')
// import React from 'React'

// ===== 1.3 export default 命令 =====
// // export-default.js
// export default function () {
//   console.log('foo')
// }

// ===== 1.3 export default 命令 =====
// // import-default.js
// import customName from './export-default'
// customName() // 'foo'

// ===== 1.3 export default 命令 =====
// // export-default.js
// export default function foo() {
//   console.log('foo');
// }
//
// // 或者写成
//
// function foo() {
//   console.log('foo');
// }
//
// export default foo;

// ===== 1.3 export default 命令 =====
// // 第一组
// export default function crc32() {
//   // 输出
//   // ...
// }
//
// import crc32 from 'crc32' // 输入
//
// // 第二组
// export function crc32() {
//   // 输出
//   // ...
// }
//
// import { crc32 } from 'crc32' // 输入

// ===== 1.3 export default 命令 =====
// // modules.js
// function add(x, y) {
//   return x * y
// }
// export { add as default }
// // 等同于
// // export default add;
//
// // app.js
// import { default as foo } from 'modules'
// // 等同于
// // import foo from 'modules';

// ===== 1.3 export default 命令 =====
// // 正确
// export var a = 1;
//
// // 正确
// var a = 1;
// export default a;
//
// // 错误
// export default var a = 1;

// ===== 1.3 export default 命令 =====
// // 正确
// export default 42;
//
// // 报错
// export 42;

// ===== 1.3 export default 命令 =====
// import _ from 'lodash'

// ===== 1.3 export default 命令 =====
// import _, { each, forEach } from 'lodash'

// ===== 1.3 export default 命令 =====
// export default function (obj) {
//   // ···
// }
//
// export function each(obj, iterator, context) {
//   // ···
// }
//
// export { each as forEach }

// ===== 1.3 export default 命令 =====
// // MyClass.js
// export default class { ... }
//
// // main.js
// import MyClass from 'MyClass';
// let o = new MyClass();

// ===== 1.4 export 与 import 的复合写法 =====
// export { foo, bar } from 'my_module'
//
// // 可以简单理解为
// import { foo, bar } from 'my_module'
// export { foo, bar }

// ===== 1.4 export 与 import 的复合写法 =====
// // 接口改名
// export { foo as myFoo } from 'my_module'
//
// // 整体输出
// export * from 'my_module'

// ===== 1.4 export 与 import 的复合写法 =====
// export { default } from 'foo'

// ===== 1.4 export 与 import 的复合写法 =====
// export { es6 as default } from './someModule';
//
// // 等同于
// import { es6 } from './someModule';
// export default es6;

// ===== 1.4 export 与 import 的复合写法 =====
// export { default as es6 } from './someModule'

// ===== 1.4 export 与 import 的复合写法 =====
// import * as someIdentifier from 'someModule'

// ===== 1.4 export 与 import 的复合写法 =====
// export * as ns from 'mod'
//
// // 等同于
// import * as ns from 'mod'
// export { ns }

// ===== 2.1 模块的整体加载 =====
// // circle.js
//
// export function area(radius) {
//   return Math.PI * radius * radius
// }
//
// export function circumference(radius) {
//   return 2 * Math.PI * radius
// }

// ===== 2.1 模块的整体加载 =====
// // main.js
//
// import { area, circumference } from './circle'
//
// console.log('圆面积：' + area(4))
// console.log('圆周长：' + circumference(14))

// ===== 2.1 模块的整体加载 =====
// import * as circle from './circle'
//
// console.log('圆面积：' + circle.area(4))
// console.log('圆周长：' + circle.circumference(14))

// ===== 2.1 模块的整体加载 =====
// import * as circle from './circle'
//
// // 下面两行都是不允许的
// circle.foo = 'hello'
// circle.area = function () {}

// ===== 2.2 模块的继承 =====
// // circleplus.js
//
// export * from 'circle'
// export var e = 2.71828182846
// export default function (x) {
//   return Math.exp(x)
// }

// ===== 2.2 模块的继承 =====
// // circleplus.js
//
// export { area as circleArea } from 'circle'

// ===== 2.2 模块的继承 =====
// // main.js
//
// import * as math from 'circleplus'
// import exp from 'circleplus'
// console.log(exp(math.e))

// ===== 2.3 跨模块常量 =====
// // constants.js 模块
// export const A = 1
// export const B = 3
// export const C = 4
//
// // test1.js 模块
// import * as constants from './constants'
// console.log(constants.A) // 1
// console.log(constants.B) // 3
//
// // test2.js 模块
// import { A, B } from './constants'
// console.log(A) // 1
// console.log(B) // 3

// ===== 2.3 跨模块常量 =====
// // constants/db.js
// export const db = {
//   url: 'http://my.couchdbserver.local:5984',
//   admin_username: 'admin',
//   admin_password: 'admin password',
// }
//
// // constants/user.js
// export const users = ['root', 'admin', 'staff', 'ceo', 'chief', 'moderator']

// ===== 2.3 跨模块常量 =====
// // constants/index.js
// export { db } from './db'
// export { users } from './users'

// ===== 2.3 跨模块常量 =====
// // script.js
// import { db, users } from './constants/index'

// ===== 2.4 import 属性 =====
// // 静态导入
// import configData from './config-data.json' with { type: 'json' }
//
// // 动态导入
// const configData = await import('./config-data.json', {
//   with: { type: 'json' },
// })

// ===== 2.4 import 属性 =====
// const response = await fetch('./config.json')
// const json = await response.json()

// ===== 2.4 import 属性 =====
// export { default as config } from './config-data.json' with { type: 'json' }

// ===== 3.1 定义 =====
// // 报错
// if (x === 2) {
//   import MyModual from './myModual'
// }

// ===== 3.1 定义 =====
// const path = './' + fileName
// const myModual = require(path)

// ===== 3.1 定义 =====
// import(specifier)

// ===== 3.1 定义 =====
// const main = document.querySelector('main')
//
// import(`./section-modules/${someVariable}.js`)
//   .then(module => {
//     module.loadPageInto(main)
//   })
//   .catch(err => {
//     main.textContent = err.message
//   })

// ===== 3.1 定义 =====
// async function renderWidget() {
//   const container = document.getElementById('widget')
//   if (container !== null) {
//     // 等同于
//     // import("./widget").then(widget => {
//     //   widget.render(container);
//     // });
//     const widget = await import('./widget.js')
//     widget.render(container)
//   }
// }
//
// renderWidget()

// ===== 3.2 应用场景 =====
// button.addEventListener('click', event => {
//   import('./dialogBox.js')
//     .then(dialogBox => {
//       dialogBox.open()
//     })
//     .catch(error => {
//       /* Error handling */
//     })
// })

// ===== 3.2 应用场景 =====
// if (condition) {
//   import('moduleA').then(...);
// } else {
//   import('moduleB').then(...);
// }

// ===== 3.2 应用场景 =====
// import(f())
// .then(...);

// ===== 3.3 注意点 =====
// import('./myModule.js').then(({ export1, export2 }) => {
//   // ...·
// })

// ===== 3.3 注意点 =====
// import('./myModule.js').then(myModule => {
//   console.log(myModule.default)
// })

// ===== 3.3 注意点 =====
// import('./myModule.js').then(({ default: theDefault }) => {
//   console.log(theDefault)
// })

// ===== 3.3 注意点 =====
// Promise.all([
//   import('./module1.js'),
//   import('./module2.js'),
//   import('./module3.js'),
// ]).then(([module1, module2, module3]) => {})

// ===== 3.3 注意点 =====
// async function main() {
//   const myModule = await import('./myModule.js')
//   const { export1, export2 } = await import('./myModule.js')
//   const [module1, module2, module3] = await Promise.all([
//     import('./module1.js'),
//     import('./module2.js'),
//     import('./module3.js'),
//   ])
// }
// main()

// ===== 4.1 import.meta.url =====
// new URL('data.txt', import.meta.url)

// ===== 4.2 import.meta.scriptElement =====
// // HTML 代码为
// // <script type="module" src="my-module.js" data-foo="abc"></script>
//
// // my-module.js 内部执行下面的代码
// import.meta.scriptElement.dataset.foo
// // "abc"

