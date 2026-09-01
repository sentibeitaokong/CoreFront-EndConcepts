/*
 * 示例代码：function.md
 * 来源文档：apps/docs/js/advanced/data-types/function.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 基本用法 =====
// function log(x, y) {
//   y = y || 'World'
//   console.log(x, y)
// }
//
// log('Hello') // Hello World
// log('Hello', 'China') // Hello China
// log('Hello', '') // Hello World

// ===== 1.1 基本用法 =====
// if (typeof y === 'undefined') {
//   y = 'World'
// }

// ===== 1.1 基本用法 =====
// function log(x, y = 'World') {
//   console.log(x, y)
// }
//
// log('Hello') // Hello World
// log('Hello', 'China') // Hello China
// log('Hello', '') // Hello

// ===== 1.1 基本用法 =====
// function Point(x = 0, y = 0) {
//   this.x = x
//   this.y = y
// }
//
// const p = new Point()
// p // { x: 0, y: 0 }

// ===== 1.1 基本用法 =====
// function foo(x = 5) {
//   let x = 1 // error
//   const x = 2 // error
// }

// ===== 1.1 基本用法 =====
// // 不报错
// function foo(x, x, y) {
//   // ...
// }
//
// // 报错
// function foo(x, x, y = 1) {
//   // ...
// }
// // SyntaxError: Duplicate parameter name not allowed in this context

// ===== 1.1 基本用法 =====
// let x = 99
// function foo(p = x + 1) {
//   console.log(p)
// }
//
// foo() // 100
//
// x = 100
// foo() // 101

// ===== 1.2 与解构赋值默认值结合使用 =====
// function foo({ x, y = 5 }) {
//   console.log(x, y)
// }
//
// foo({}) // undefined 5
// foo({ x: 1 }) // 1 5
// foo({ x: 1, y: 2 }) // 1 2
// foo() // TypeError: Cannot read property 'x' of undefined

// ===== 1.2 与解构赋值默认值结合使用 =====
// function foo({ x, y = 5 } = {}) {
//   console.log(x, y)
// }
//
// foo() // undefined 5

// ===== 1.2 与解构赋值默认值结合使用 =====
// function fetch(url, { body = '', method = 'GET', headers = {} }) {
//   console.log(method)
// }
//
// fetch('http://example.com', {})
// // "GET"
//
// fetch('http://example.com')
// // 报错

// ===== 1.2 与解构赋值默认值结合使用 =====
// function fetch(url, { body = '', method = 'GET', headers = {} } = {}) {
//   console.log(method)
// }
//
// fetch('http://example.com')
// // "GET"

// ===== 1.2 与解构赋值默认值结合使用 =====
// function f({ a, b = 'world' } = { a: 'hello' }) {
//   console.log(b)
// }
//
// f() // world

// ===== 1.2 与解构赋值默认值结合使用 =====
// // 写法一
// function m1({ x = 0, y = 0 } = {}) {
//   return [x, y]
// }
//
// // 写法二
// function m2({ x, y } = { x: 0, y: 0 }) {
//   return [x, y]
// }
//
// // 函数没有参数的情况
// m1() // [0, 0]
// m2() // [0, 0]
//
// // x 和 y 都有值的情况
// m1({ x: 3, y: 8 }) // [3, 8]
// m2({ x: 3, y: 8 }) // [3, 8]
//
// // x 有值，y 无值的情况
// m1({ x: 3 }) // [3, 0]
// m2({ x: 3 }) // [3, undefined]
//
// // x 和 y 都无值的情况
// m1({}) // [0, 0];
// m2({}) // [undefined, undefined]
//
// m1({ z: 3 }) // [0, 0]
// m2({ z: 3 }) // [undefined, undefined]

// ===== 1.3 参数默认值的位置 =====
// // 例一
// function f(x = 1, y) {
//   return [x, y];
// }
//
// f() // [1, undefined]
// f(2) // [2, undefined]
// f(, 1) // 报错
// f(undefined, 1) // [1, 1]
//
// // 例二
// function f(x, y = 5, z) {
//   return [x, y, z];
// }
//
// f() // [undefined, 5, undefined]
// f(1) // [1, 5, undefined]
// f(1, ,2) // 报错
// f(1, undefined, 2) // [1, 5, 2]

// ===== 1.3 参数默认值的位置 =====
// function foo(x = 5, y = 6) {
//   console.log(x, y)
// }
//
// foo(undefined, null)
// // 5 null

// ===== 1.4 arguments对象 =====
// function logArgs() {
//   console.log(arguments)
// }
//
// logArgs('hello', 'world', 123)
// // 输出: Arguments(3) ['hello', 'world', 123, callee: ƒ, Symbol(Symbol.iterator): ƒ]

// ===== 1. 它是 "类数组" 而非真数组 =====
// function tryArrayMethods() {
//   // 这会报错: arguments.forEach is not a function
//   // arguments.forEach(arg => console.log(arg));
// }

// ===== 1. 它是 "类数组" 而非真数组 =====
// function toArray() {
//   // ES6+ 推荐方式 (最简洁)
//   const argsArray1 = [...arguments]
//   console.log(argsArray1)
//
//   // ES6+ 推荐方式
//   const argsArray2 = Array.from(arguments)
//   console.log(argsArray2)
//
//   // 传统 ES5 方式
//   const argsArray3 = Array.prototype.slice.call(arguments)
//   console.log(argsArray3)
// }
//
// toArray(1, 2, 3) // 输出三次 [1, 2, 3]

// ===== 2. 与函数参数的"绑定"关系 (非严格模式下) =====
// function testBinding(a, b) {
//   console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1
//
//   // 修改命名参数
//   a = 100
//   console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=100
//
//   // 修改 arguments
//   arguments[1] = 200
//   console.log(`修改 arguments[1] 后: b=${b}, arguments[1]=${arguments[1]}`) // 修改 arguments[1] 后: b=200, arguments[1]=200
// }
//
// testBinding(1, 2)

// ===== 2. 与函数参数的"绑定"关系 (非严格模式下) =====
// //严格模式
// function testStrictBinding(a, b) {
//   'use strict'
//   console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1
//
//   // 修改命名参数
//   a = 100
//   console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=1
// }
//
// testStrictBinding(1, 2)
//
// //参数默认值
// function testDefaultBinding(a = 5, b = 6) {
//   console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1
//
//   // 修改命名参数
//   a = 100
//   console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=1
// }
//
// testDefaultBinding(1, 2)

// ===== 3. arguments.callee (已废弃) =====
// // 以前的写法，现在不推荐
// const factorial = function (n) {
//   if (n <= 1) {
//     return 1
//   }
//   // 使用 arguments.callee 实现匿名递归
//   return n * arguments.callee(n - 1)
// }

// ===== 1.5 函数的 length 属性 =====
// ;(function (a) {})
//   .length(
//     // 1
//     function (a = 5) {},
//   )
//   .length(
//     // 0
//     function (a, b, c = 5) {},
//   ).length // 2

// ===== 1.5 函数的 length 属性 =====
// ;(function (...args) {}).length // 0

// ===== 1.5 函数的 length 属性 =====
// ;(function (a = 0, b, c) {}).length(
//   // 0
//   function (a, b = 1, c) {},
// ).length // 1

// ===== 1.6 作用域 =====
// var x = 1
//
// function f(x, y = x) {
//   console.log(y)
// }
//
// f(2) // 2

// ===== 1.6 作用域 =====
// let x = 1
//
// function f(y = x) {
//   let x = 2
//   console.log(y)
// }
//
// f() // 1

// ===== 1.6 作用域 =====
// function f(y = x) {
//   let x = 2
//   console.log(y)
// }
//
// f() // ReferenceError: x is not defined

// ===== 1.6 作用域 =====
// var x = 1
//
// function foo(x = x) {
//   // ...
// }
//
// foo() // ReferenceError: Cannot access 'x' before initialization

// ===== 1.6 作用域 =====
// let foo = 'outer'
//
// function bar(func = () => foo) {
//   let foo = 'inner'
//   console.log(func())
// }
//
// bar() // outer

// ===== 1.6 作用域 =====
// function bar(func = () => foo) {
//   let foo = 'inner'
//   console.log(func())
// }
//
// bar() // ReferenceError: foo is not defined

// ===== 1.6 作用域 =====
// var x = 1
// function foo(
//   x,
//   y = function () {
//     x = 2
//   },
// ) {
//   var x = 3
//   y()
//   console.log(x)
// }
//
// foo() // 3
// x // 1

// ===== 1.6 作用域 =====
// var x = 1
// function foo(
//   x,
//   y = function () {
//     x = 2
//   },
// ) {
//   x = 3
//   y()
//   console.log(x)
// }
//
// foo() // 2
// x // 1

// ===== 1.7 应用 =====
// function throwIfMissing() {
//   throw new Error('Missing parameter')
// }
//
// function foo(mustBeProvided = throwIfMissing()) {
//   return mustBeProvided
// }
//
// foo()
// // Error: Missing parameter

// ===== 1.7 应用 =====
// function foo(optional = undefined) { ··· }

// ===== 1. 基本用法 =====
// var f = v => v
//
// // 等同于
// var f = function (v) {
//   return v
// }

// ===== 1. 基本用法 =====
// var f = () => 5
// // 等同于
// var f = function () {
//   return 5
// }
//
// var sum = (num1, num2) => num1 + num2
// // 等同于
// var sum = function (num1, num2) {
//   return num1 + num2
// }

// ===== 1. 基本用法 =====
// var sum = (num1, num2) => {
//   return num1 + num2
// }

// ===== 1. 基本用法 =====
// // 报错
// let getTempItem = id => { id: id, name: "Temp" };
//
// // 不报错
// let getTempItem = id => ({ id: id, name: "Temp" });

// ===== 1. 基本用法 =====
// let foo = () => {
//   a: 1
// }
// foo() // undefined

// ===== 1. 基本用法 =====
// let fn = () => void doesNotReturn()

// ===== 1. 基本用法 =====
// const full = ({ first, last }) => first + ' ' + last
//
// // 等同于
// function full(person) {
//   return person.first + ' ' + person.last
// }

// ===== 1. 基本用法 =====
// const isEven = n => n % 2 === 0
// const square = n => n * n

// ===== 1. 基本用法 =====
// // 普通函数写法
// ;[1, 2, 3].map(function (x) {
//   return x * x
// })
//
// // 箭头函数写法
// ;[1, 2, 3].map(x => x * x)

// ===== 1. 基本用法 =====
// // 普通函数写法
// var result = values.sort(function (a, b) {
//   return a - b
// })
//
// // 箭头函数写法
// var result = values.sort((a, b) => a - b)

// ===== 1. 基本用法 =====
// const numbers = (...nums) => nums
//
// numbers(1, 2, 3, 4, 5)
// // [1,2,3,4,5]
//
// const headAndTail = (head, ...tail) => [head, tail]
//
// headAndTail(1, 2, 3, 4, 5)
// // [1,[2,3,4,5]]

// ===== 2. 使用注意点 =====
// function foo() {
//   setTimeout(() => {
//     console.log('id:', this.id)
//   }, 100)
// }
//
// var id = 21
//
// foo.call({ id: 42 })
// // id: 42

// ===== 2. 使用注意点 =====
// function Timer() {
//   this.s1 = 0
//   this.s2 = 0
//   // 箭头函数
//   setInterval(() => this.s1++, 1000)
//   // 普通函数
//   setInterval(function () {
//     this.s2++
//   }, 1000)
// }
//
// var timer = new Timer()
//
// setTimeout(() => console.log('s1: ', timer.s1), 3100)
// setTimeout(() => console.log('s2: ', timer.s2), 3100)
// // s1: 3
// // s2: 0

// ===== 2. 使用注意点 =====
// var handler = {
//   id: '123456',
//
//   init: function () {
//     document.addEventListener(
//       'click',
//       event => this.doSomething(event.type),
//       false,
//     )
//   },
//
//   doSomething: function (type) {
//     console.log('Handling ' + type + ' for ' + this.id)
//   },
// }

// ===== 2. 使用注意点 =====
// // ES6
// function foo() {
//   setTimeout(() => {
//     console.log('id:', this.id)
//   }, 100)
// }
//
// // ES5
// function foo() {
//   var _this = this
//
//   setTimeout(function () {
//     console.log('id:', _this.id)
//   }, 100)
// }

// ===== 2. 使用注意点 =====
// function foo() {
//   return () => {
//     return () => {
//       return () => {
//         console.log('id:', this.id)
//       }
//     }
//   }
// }
//
// var f = foo.call({ id: 1 })
//
// var t1 = f.call({ id: 2 })()() // id: 1
// var t2 = f().call({ id: 3 })() // id: 1
// var t3 = f()().call({ id: 4 }) // id: 1

// ===== 2. 使用注意点 =====
// function foo() {
//   setTimeout(() => {
//     console.log('args:', arguments)
//   }, 100)
// }
//
// foo(2, 4, 6, 8)
// // args: [2, 4, 6, 8]

// ===== 2. 使用注意点 =====
// ;(function () {
//   return [(() => this.x).bind({ x: 'inner' })()]
// }).call({ x: 'outer' })
// // ['outer']

// ===== 3. 不适用场合 =====
// const cat = {
//   lives: 9,
//   jumps: () => {
//     this.lives--
//   },
// }

// ===== 3. 不适用场合 =====
// globalThis.s = 21
//
// const obj = {
//   s: 42,
//   m: () => console.log(this.s),
// }
//
// obj.m() // 21

// ===== 3. 不适用场合 =====
// globalThis.s = 21
// globalThis.m = () => console.log(this.s)
//
// const obj = {
//   s: 42,
//   m: globalThis.m,
// }
//
// obj.m() // 21

// ===== 3. 不适用场合 =====
// var button = document.getElementById('press')
// button.addEventListener('click', () => {
//   this.classList.toggle('on')
// })

// ===== 4. 嵌套的箭头函数 =====
// function insert(value) {
//   return {
//     into: function (array) {
//       return {
//         after: function (afterValue) {
//           array.splice(array.indexOf(afterValue) + 1, 0, value)
//           return array
//         },
//       }
//     },
//   }
// }
//
// insert(2).into([1, 3]).after(1) //[1, 2, 3]

// ===== 4. 嵌套的箭头函数 =====
// let insert = value => ({
//   into: array => ({
//     after: afterValue => {
//       array.splice(array.indexOf(afterValue) + 1, 0, value)
//       return array
//     },
//   }),
// })
//
// insert(2).into([1, 3]).after(1) //[1, 2, 3]

// ===== 4. 嵌套的箭头函数 =====
// const pipeline =
//   (...funcs) =>
//   val =>
//     funcs.reduce((a, b) => b(a), val)
//
// const plus1 = a => a + 1
// const mult2 = a => a * 2
// const addThenMult = pipeline(plus1, mult2)
//
// addThenMult(5)
// // 12

// ===== 4. 嵌套的箭头函数 =====
// const plus1 = a => a + 1
// const mult2 = a => a * 2
//
// mult2(plus1(5))
// // 12

// ===== 4. 嵌套的箭头函数 =====
// // λ演算的写法
// fix = λf.(λx.f(λv.x(x)(v)))(λx.f(λv.x(x)(v)))
//
// // ES6的写法
// var fix = f => (x => f(v => x(x)(v)))
//                (x => f(v => x(x)(v)));

// ===== 2.2 rest 参数 =====
// function add(...values) {
//   let sum = 0
//
//   for (var val of values) {
//     sum += val
//   }
//
//   return sum
// }
//
// add(2, 5, 3) // 10

// ===== 2.2 rest 参数 =====
// // arguments变量的写法
// function sortNumbers() {
//   return Array.from(arguments).sort()
// }
//
// // rest参数的写法
// const sortNumbers = (...numbers) => numbers.sort()

// ===== 2.2 rest 参数 =====
// function push(array, ...items) {
//   items.forEach(function (item) {
//     array.push(item)
//     console.log(item)
//   })
// }
//
// var a = []
// push(a, 1, 2, 3)

// ===== 2.2 rest 参数 =====
// // 报错
// function f(a, ...b, c) {
//   // ...
// }

// ===== 2.2 rest 参数 =====
// ;(function (a) {})
//   .length(
//     // 1
//     function (...a) {},
//   )
//   .length(
//     // 0
//     function (a, ...b) {},
//   ).length // 1

// ===== 2.3 严格模式 =====
// function doSomething(a, b) {
//   'use strict'
//   // code
// }

// ===== 2.3 严格模式 =====
// // 报错
// function doSomething(a, b = a) {
//   'use strict';
//   // code
// }
//
// // 报错
// const doSomething = function ({a, b}) {
//   'use strict';
//   // code
// };
//
// // 报错
// const doSomething = (...a) => {
//   'use strict';
//   // code
// };
//
// const obj = {
//   // 报错
//   doSomething({a, b}) {
//     'use strict';
//     // code
//   }
// };

// ===== 2.3 严格模式 =====
// // 报错
// function doSomething(value = 070) {
//   'use strict';
//   return value;
// }

// ===== 2.3 严格模式 =====
// 'use strict'
//
// function doSomething(a, b = a) {
//   // code
// }

// ===== 2.3 严格模式 =====
// const doSomething = (function () {
//   'use strict'
//   return function (value = 42) {
//     return value
//   }
// })()

// ===== 2.4 name 属性 =====
// function foo() {}
// foo.name // "foo"

// ===== 2.4 name 属性 =====
// var f = function () {}
//
// // ES5
// f.name // ""
//
// // ES6
// f.name // "f"

// ===== 2.4 name 属性 =====
// const bar = function baz() {}
//
// // ES5
// bar.name // "baz"
//
// // ES6
// bar.name // "baz"

// ===== 2.4 name 属性 =====
// new Function().name // "anonymous"

// ===== 2.4 name 属性 =====
// function foo() {}
// foo
//   .bind({})
//   .name(
//     // "bound foo"
//
//     function () {},
//   )
//   .bind({}).name // "bound "

// ===== 3.1 什么是尾调用？ =====
// function f(x) {
//   return g(x)
// }

// ===== 3.1 什么是尾调用？ =====
// // 情况一
// function f(x) {
//   let y = g(x)
//   return y
// }
//
// // 情况二
// function f(x) {
//   return g(x) + 1
// }
//
// // 情况三
// function f(x) {
//   g(x)
// }

// ===== 3.1 什么是尾调用？ =====
// function f(x) {
//   g(x)
//   return undefined
// }

// ===== 3.1 什么是尾调用？ =====
// function f(x) {
//   if (x > 0) {
//     return m(x)
//   }
//   return n(x)
// }

// ===== 3.2 尾调用优化 =====
// function f() {
//   let m = 1
//   let n = 2
//   return g(m + n)
// }
// f()
//
// // 等同于
// function f() {
//   return g(3)
// }
// f()
//
// // 等同于
// g(3)

// ===== 3.2 尾调用优化 =====
// function addOne(a) {
//   var one = 1
//   function inner(b) {
//     return b + one
//   }
//   return inner(a)
// }

// ===== 3.3 尾递归 =====
// function factorial(n) {
//   if (n === 1) return 1
//   return n * factorial(n - 1)
// }
//
// factorial(5) // 120

// ===== 3.3 尾递归 =====
// function factorial(n, total) {
//   if (n === 1) return total
//   return factorial(n - 1, n * total)
// }
//
// factorial(5, 1) // 120

// ===== 3.3 尾递归 =====
// function Fibonacci(n) {
//   if (n <= 1) {
//     return 1
//   }
//
//   return Fibonacci(n - 1) + Fibonacci(n - 2)
// }
//
// Fibonacci(10) // 89
// Fibonacci(100) // 超时
// Fibonacci(500) // 超时

// ===== 3.3 尾递归 =====
// function Fibonacci2(n, ac1 = 1, ac2 = 1) {
//   if (n <= 1) {
//     return ac2
//   }
//
//   return Fibonacci2(n - 1, ac2, ac1 + ac2)
// }
//
// Fibonacci2(100) // 573147844013817200000
// Fibonacci2(1000) // 7.0330367711422765e+208
// Fibonacci2(10000) // Infinity

// ===== 3.4 递归函数的改写 =====
// function tailFactorial(n, total) {
//   if (n === 1) return total
//   return tailFactorial(n - 1, n * total)
// }
//
// function factorial(n) {
//   return tailFactorial(n, 1)
// }
//
// factorial(5) // 120

// ===== 3.4 递归函数的改写 =====
// function currying(fn, n) {
//   return function (m) {
//     return fn.call(this, m, n)
//   }
// }
//
// function tailFactorial(n, total) {
//   if (n === 1) return total
//   return tailFactorial(n - 1, n * total)
// }
//
// const factorial = currying(tailFactorial, 1)
//
// factorial(5) // 120

// ===== 3.4 递归函数的改写 =====
// function factorial(n, total = 1) {
//   if (n === 1) return total
//   return factorial(n - 1, n * total)
// }
//
// factorial(5) // 120

// ===== 3.5 严格模式 =====
// function restricted() {
//   'use strict'
//   restricted.caller // 报错
//   restricted.arguments // 报错
// }
// restricted()

// ===== 3.6 尾递归优化的实现 =====
// function sum(x, y) {
//   if (y > 0) {
//     return sum(x + 1, y - 1)
//   } else {
//     return x
//   }
// }
//
// sum(1, 100000)
// // Uncaught RangeError: Maximum call stack size exceeded(…)

// ===== 3.6 尾递归优化的实现 =====
// function trampoline(f) {
//   while (f && f instanceof Function) {
//     f = f()
//   }
//   return f
// }

// ===== 3.6 尾递归优化的实现 =====
// function sum(x, y) {
//   if (y > 0) {
//     return sum.bind(null, x + 1, y - 1)
//   } else {
//     return x
//   }
// }

// ===== 3.6 尾递归优化的实现 =====
// trampoline(sum(1, 100000))
// // 100001

// ===== 3.6 尾递归优化的实现 =====
// function tco(f) {
//   var value
//   var active = false
//   var accumulated = []
//
//   return function accumulator() {
//     accumulated.push(arguments)
//     if (!active) {
//       active = true
//       while (accumulated.length) {
//         value = f.apply(this, accumulated.shift())
//       }
//       active = false
//       return value
//     }
//   }
// }
//
// var sum = tco(function (x, y) {
//   if (y > 0) {
//     return sum(x + 1, y - 1)
//   } else {
//     return x
//   }
// })
//
// sum(1, 100000)
// // 100001

