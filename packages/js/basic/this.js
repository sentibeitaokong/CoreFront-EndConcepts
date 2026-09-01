/*
 * 示例代码：this.md
 * 来源文档：apps/docs/js/basic/this.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 2.1 默认绑定 (Default Binding) =====
// function foo() {
//   // 函数体运行在严格模式下
//   'use strict'
//   console.log(this.a)
// }
//
// var a = 2
//
// foo() // TypeError: Cannot read property 'a' of undefined

// ===== 2.1 默认绑定 (Default Binding) =====
// function foo() {
//   // 函数体运行在非严格模式下
//   console.log(this.a)
// }
//
// var a = 2
//
// ;(function () {
//   'use strict'
//   foo() // 2 (foo 的默认绑定不受影响，this 仍然指向全局对象)
// })()

// ===== 2.2 隐式绑定 (Implicit Binding) =====
// function foo() {
//   console.log(this.a)
// }
//
// var obj = {
//   a: 2,
//   foo: foo,
// }
//
// obj.foo() // 2 (this 指向 obj)

// ===== 2.3 显式绑定 (Explicit Binding) =====
// function foo() {
//   console.log(this.a)
// }
//
// var obj = {
//   a: 2,
// }
//
// foo.call(obj) // 2 (调用 foo 时，强制将 this 绑定到 obj)

// ===== 2.4 new 绑定 =====
// function foo(a) {
//   this.a = a
// }
//
// var bar = new foo(2) // bar 被绑定到 foo() 调用中的 this
// console.log(bar.a) // 2

// ===== 2.4 new 绑定 =====
// function myNew() {
//   // 1. 创建一个空对象
//   var obj = new Object()
//
//   // 2. 获得构造函数
//   var Con = [].shift.call(arguments)
//
//   // 3. 链接到原型
//   obj.__proto__ = Con.prototype
//
//   // 4. 绑定 this 并执行构造函数
//   var ret = Con.apply(obj, arguments)
//
//   // 5. 优先返回构造函数返回的对象，否则返回新创建的对象
//   return ret instanceof Object ? ret : obj
// }

// ===== 3. 优先级 =====
// function foo() {
//   console.log(this.a)
// }
//
// var obj1 = {
//   a: 2,
//   foo: foo,
// }
//
// var obj2 = {
//   a: 3,
//   foo: foo,
// }
//
// obj1.foo() // 2
// obj2.foo() // 3
//
// //隐式绑定>显式绑定
// obj1.foo.call(obj2) // 3
// obj2.foo.call(obj1) // 2

// ===== 3. 优先级 =====
// function foo(something) {
//   this.a = something
// }
//
// var obj1 = {
//   foo: foo,
// }
//
// var obj2 = {}
//
// obj1.foo(2)
// console.log(obj1.a) // 2
//
// obj1.foo.call(obj2, 3)
// console.log(obj2.a) // 3
//
// var bar = new obj1.foo(4)
// console.log(obj1.a) // 2
// console.log(bar.a) // 4    //new绑定>隐式绑定

// ===== 3. 优先级 =====
// function foo(something) {
//   this.a = something
// }
//
// var obj1 = {}
//
// var bar = foo.bind(obj1)
// bar(2)
// console.log(obj1.a) // 2
//
// var baz = new bar(3)
// console.log(obj1.a) // 2
// console.log(baz.a) // 3    //new绑定>硬绑定

// ===== 3. 优先级 =====
// if (!Function.prototype.bind) {
//   Function.prototype.bind = function (oThis) {
//     if (typeof this !== 'function') {
//       // 可能的与 ECMAScript 5 内部的 IsCallable 函数最接近的东西，
//       throw new TypeError(
//         'Function.prototype.bind - what ' +
//           'is trying to be bound is not callable',
//       )
//     }
//
//     var aArgs = Array.prototype.slice.call(arguments, 1),
//       fToBind = this,
//       fNOP = function () {},
//       fBound = function () {
//         return fToBind.apply(
//           this instanceof fNOP && oThis ? this : oThis, //new绑定>硬绑定的关键  // [!code highlight]
//           aArgs.concat(Array.prototype.slice.call(arguments)),
//         )
//       }
//     fNOP.prototype = this.prototype
//     fBound.prototype = new fNOP()
//
//     return fBound
//   }
// }

// ===== 3. 优先级 =====
// function foo(p1, p2) {
//   this.val = p1 + p2
// }
//
// // 在这里使用 `null` 是因为在这种场景下我们不关心 `this` 的硬绑定
// // 而且反正它将会被 `new` 调用覆盖掉！
// var bar = foo.bind(null, 'p1')
//
// var baz = new bar('p2')
//
// baz.val // p1p2

// ===== 4.1 被忽略的 this =====
// function foo(a, b) {
//   console.log('a:' + a + '，b:' + b)
// }
//
// // 使用 apply "展开"数组
// foo.apply(null, [2, 3]) // a:2，b:3
//
// // 使用 bind 进行柯里化
// var bar = foo.bind(null, 2)
// bar(3) // a:2，b:3

// ===== 4.1 被忽略的 this =====
// function foo(a, b) {
//   console.log('a:' + a + ', b:' + b)
// }
//
// // 我们的 DMZ 空对象
// var ø = Object.create(null)
//
// // 将数组散开作为参数
// foo.apply(ø, [2, 3]) // a:2, b:3
//
// // 用 `bind(..)` 进行 currying
// var bar = foo.bind(ø, 2)
// bar(3) // a:2, b:3

// ===== 4.2 间接引用 =====
// function foo() {
//   console.log(this.a)
// }
//
// var a = 2
// var o = { a: 3, foo: foo }
// var p = { a: 4 }
//
// o.foo() // 3 (隐式绑定)
// ;(p.foo = o.foo)() // 2 (赋值表达式的返回值是函数本身，应用默认绑定)

// ===== 4.3 软绑定 (Soft Binding) =====
// if (!Function.prototype.softBind) {
//   Function.prototype.softBind = function (obj) {
//     var fn = this
//     var curried = [].slice.call(arguments, 1)
//     var bound = function () {
//       return fn.apply(
//         !this || this === (window || global) ? obj : this,
//         curried.concat.apply(curried, arguments),
//       )
//     }
//     bound.prototype = Object.create(fn.prototype)
//     return bound
//   }
// }

// ===== 4.3 软绑定 (Soft Binding) =====
// function foo() {
//   console.log('name:' + this.name)
// }
//
// var obj = { name: 'obj' },
//   obj2 = { name: 'obj2' },
//   obj3 = { name: 'obj3' }
//
// var fooOBJ = foo.softBind(obj)
//
// // 默认绑定，应用软绑定
// fooOBJ() // name: obj
//
// // 隐式绑定，正常工作
// obj2.foo = foo.softBind(obj)
// obj2.foo() // name: obj2
//
// // 显式绑定，正常工作
// fooOBJ.call(obj3) // name: obj3
//
// // 绑定丢失，退回软绑定
// setTimeout(obj2.foo, 10) // name: obj

// ===== 5. this 词法 (Lexical this) =====
// function foo() {
//   // 返回一个箭头函数
//   return a => {
//     // this 继承自 foo()
//     console.log(this.a)
//   }
// }
//
// var obj1 = { a: 2 }
// var obj2 = { a: 3 }
//
// var bar = foo.call(obj1) // foo 的 this 绑定到 obj1
// bar.call(obj2) // 2 (bar 的 this 仍然是 obj1，而不是 obj2)

// ===== 5. this 词法 (Lexical this) =====
// function foo() {
//   var self = this // 词法捕获 this
//   setTimeout(function () {
//     console.log(self.a) // self 继承了 foo() 的 this 绑定
//   }, 100)
// }
//
// var obj = { a: 2 }
// foo.call(obj) // 2

