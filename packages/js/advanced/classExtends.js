/*
 * 示例代码：classExtends.md
 * 来源文档：apps/docs/js/advanced/class-inheritance/classExtends.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. Class继承核心语法 =====
// class Point {}
//
// class ColorPoint extends Point {}

// ===== 1. Class继承核心语法 =====
// class Point {
//   /* ... */
// }
//
// class ColorPoint extends Point {
//   constructor(x, y, color) {
//     super(x, y) // 调用父类的constructor(x, y)
//     this.color = color
//   }
//
//   toString() {
//     return this.color + ' ' + super.toString() // 调用父类的toString()
//   }
// }

// ===== 1. Class继承核心语法 =====
// class Point {
//   /* ... */
// }
//
// class ColorPoint extends Point {
//   constructor() {}
// }
//
// let cp = new ColorPoint() // ReferenceError

// ===== 1. Class继承核心语法 =====
// class Foo {
//   constructor() {
//     console.log(1)
//   }
// }
//
// class Bar extends Foo {
//   constructor() {
//     super()
//     console.log(2)
//   }
// }
//
// const bar = new Bar()
// // 1
// // 2

// ===== 1. Class继承核心语法 =====
// class Point {
//   constructor(x, y) {
//     this.x = x
//     this.y = y
//   }
// }
//
// class ColorPoint extends Point {
//   constructor(x, y, color) {
//     this.color = color // ReferenceError
//     super(x, y)
//     this.color = color // 正确
//   }
// }

// ===== 1. Class继承核心语法 =====
// class ColorPoint extends Point {}
//
// // 等同于
// class ColorPoint extends Point {
//   constructor(...args) {
//     super(...args)
//   }
// }

// ===== 1. Class继承核心语法 =====
// let cp = new ColorPoint(25, 8, 'green')
//
// cp instanceof ColorPoint // true
// cp instanceof Point // true

// ===== 1.1 私有属性和私有方法的继承 =====
// class Foo {
//   #p = 1
//   #m() {
//     console.log('hello')
//   }
// }
//
// class Bar extends Foo {
//   constructor() {
//     super()
//     console.log(this.#p) // 报错
//     this.#m() // 报错
//   }
// }

// ===== 1.1 私有属性和私有方法的继承 =====
// class Foo {
//   #p = 1
//   getP() {
//     return this.#p
//   }
// }
//
// class Bar extends Foo {
//   constructor() {
//     super()
//     console.log(this.getP()) // 1
//   }
// }

// ===== 1.2 静态属性和静态方法的继承 =====
// class A {
//   static hello() {
//     console.log('hello world')
//   }
// }
//
// class B extends A {}
//
// B.hello() // hello world

// ===== 1.2 静态属性和静态方法的继承 =====
// class A {
//   static foo = 100
// }
// class B extends A {
//   constructor() {
//     super()
//     B.foo--
//   }
// }
//
// const b = new B()
// B.foo // 99
// A.foo // 100

// ===== 1.2 静态属性和静态方法的继承 =====
// class A {
//   static foo = { n: 100 }
// }
//
// class B extends A {
//   constructor() {
//     super()
//     B.foo.n--
//   }
// }
//
// const b = new B()
// B.foo.n // 99
// A.foo.n // 99

// ===== 1.3 super 关键字 =====
// class A {}
//
// class B extends A {
//   constructor() {
//     super()
//   }
// }

// ===== 1.3 super 关键字 =====
// class A {
//   constructor() {
//     console.log(new.target.name)
//   }
// }
// class B extends A {
//   constructor() {
//     super()
//   }
// }
// new A() // A
// new B() // B

// ===== 1.3 super 关键字 =====
// class A {
//   name = 'A'
//   constructor() {
//     console.log('My name is ' + this.name)
//   }
// }
//
// class B extends A {
//   name = 'B'
// }
//
// const b = new B() // My name is A

// ===== 1.3 super 关键字 =====
// class A {}
//
// class B extends A {
//   m() {
//     super(); // 报错
//   }
// }

// ===== 1.3 super 关键字 =====
// class A {
//   p() {
//     return 2
//   }
// }
//
// class B extends A {
//   constructor() {
//     super()
//     console.log(super.p()) // 2
//   }
// }
//
// let b = new B()

// ===== 1.3 super 关键字 =====
// class A {
//   constructor() {
//     this.p = 2
//   }
// }
//
// class B extends A {
//   get m() {
//     return super.p
//   }
// }
//
// let b = new B()
// b.m // undefined

// ===== 1.3 super 关键字 =====
// class A {}
// A.prototype.x = 2
//
// class B extends A {
//   constructor() {
//     super()
//     console.log(super.x) // 2
//   }
// }
//
// let b = new B()

// ===== 1.3 super 关键字 =====
// class A {
//   constructor() {
//     this.x = 1
//   }
//   print() {
//     console.log(this.x)
//   }
// }
//
// class B extends A {
//   constructor() {
//     super()
//     this.x = 2
//   }
//   m() {
//     super.print()
//   }
// }
//
// let b = new B()
// b.m() // 2

// ===== 1.3 super 关键字 =====
// class A {
//   constructor() {
//     this.x = 1
//   }
// }
//
// class B extends A {
//   constructor() {
//     super()
//     this.x = 2
//     super.x = 3
//     console.log(super.x) // undefined
//     console.log(this.x) // 3
//   }
// }
//
// let b = new B()

// ===== 1.3 super 关键字 =====
// class Parent {
//   static myMethod(msg) {
//     console.log('static', msg)
//   }
//
//   myMethod(msg) {
//     console.log('instance', msg)
//   }
// }
//
// class Child extends Parent {
//   static myMethod(msg) {
//     super.myMethod(msg)
//   }
//
//   myMethod(msg) {
//     super.myMethod(msg)
//   }
// }
//
// Child.myMethod(1) // static 1
//
// var child = new Child()
// child.myMethod(2) // instance 2

// ===== 1.3 super 关键字 =====
// class A {
//   constructor() {
//     this.x = 1
//   }
//   static print() {
//     console.log(this.x)
//   }
// }
//
// class B extends A {
//   constructor() {
//     super()
//     this.x = 2
//   }
//   static m() {
//     super.print()
//   }
// }
//
// B.x = 3
// B.m() // 3

// ===== 1.3 super 关键字 =====
// class A {}
//
// class B extends A {
//   constructor() {
//     super();
//     console.log(super); // 报错
//   }
// }

// ===== 1.3 super 关键字 =====
// class A {}
//
// class B extends A {
//   constructor() {
//     super()
//     console.log(super.valueOf() instanceof B) // true
//   }
// }
//
// let b = new B()

// ===== 1.3 super 关键字 =====
// var obj = {
//   toString() {
//     return 'MyObject: ' + super.toString()
//   },
// }
//
// obj.toString() // MyObject: [object Object]

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// class A {}
//
// class B extends A {}
//
// B.__proto__ === A // true
// B.prototype.__proto__ === A.prototype // true

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// class A {}
//
// class B {}
//
// // B 的实例继承 A 的实例
// Object.setPrototypeOf(B.prototype, A.prototype)
//
// // B 继承 A 的静态属性
// Object.setPrototypeOf(B, A)
//
// const b = new B()

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// Object.setPrototypeOf = function (obj, proto) {
//   obj.__proto__ = proto
//   return obj
// }

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// Object.setPrototypeOf(B.prototype, A.prototype)
// // 等同于
// B.prototype.__proto__ = A.prototype
//
// Object.setPrototypeOf(B, A)
// // 等同于
// B.__proto__ = A

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// B.prototype = Object.create(A.prototype)
// // 等同于
// B.prototype.__proto__ = A.prototype

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// class B extends A {}

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// class A extends Object {}
//
// A.__proto__ === Object // true
// A.prototype.__proto__ === Object.prototype // true

// ===== 1.4 类的 prototype 属性和\_\_proto\_\_属性 =====
// class A {}
//
// A.__proto__ === Function.prototype // true
// A.prototype.__proto__ === Object.prototype // true

// ===== 1.5 类实例的 \_\_proto\_\_ 属性 =====
// var p1 = new Point(2, 3)
// var p2 = new ColorPoint(2, 3, 'red')
//
// p2.__proto__ === p1.__proto__ // false
// p2.__proto__.__proto__ === p1.__proto__ // true

// ===== 1.5 类实例的 \_\_proto\_\_ 属性 =====
// p2.__proto__.__proto__.printName = function () {
//   console.log('Ha')
// }
//
// p1.printName() // "Ha"

// ===== 2. 原生构造函数的继承 =====
// function MyArray() {
//   Array.apply(this, arguments)
// }
//
// MyArray.prototype = Object.create(Array.prototype, {
//   constructor: {
//     value: MyArray,
//     writable: true,
//     configurable: true,
//     enumerable: true,
//   },
// })

// ===== 2. 原生构造函数的继承 =====
// var colors = new MyArray()
// colors[0] = 'red'
// colors.length // 0
//
// colors.length = 0
// colors[0] // "red"

// ===== 2. 原生构造函数的继承 =====
// var e = {}
//
// Object.getOwnPropertyNames(Error.call(e))
// // [ 'stack' ]
//
// Object.getOwnPropertyNames(e)
// // []

// ===== 2. 原生构造函数的继承 =====
// class MyArray extends Array {
//   constructor(...args) {
//     super(...args)
//   }
// }
//
// var arr = new MyArray()
// arr[0] = 12
// arr.length // 1
//
// arr.length = 0
// arr[0] // undefined

// ===== 2. 原生构造函数的继承 =====
// class VersionedArray extends Array {
//   constructor() {
//     super()
//     this.history = [[]]
//   }
//   commit() {
//     this.history.push(this.slice())
//   }
//   revert() {
//     this.splice(0, this.length, ...this.history[this.history.length - 1])
//   }
// }
//
// var x = new VersionedArray()
//
// x.push(1)
// x.push(2)
// x // [1, 2]
// x.history // [[]]
//
// x.commit()
// x.history // [[], [1, 2]]
//
// x.push(3)
// x // [1, 2, 3]
// x.history // [[], [1, 2]]
//
// x.revert()
// x // [1, 2]

// ===== 2. 原生构造函数的继承 =====
// class ExtendableError extends Error {
//   constructor(message) {
//     super()
//     this.message = message
//     this.stack = new Error().stack
//     this.name = this.constructor.name
//   }
// }
//
// class MyError extends ExtendableError {
//   constructor(m) {
//     super(m)
//   }
// }
//
// var myerror = new MyError('ll')
// myerror.message // "ll"
// myerror instanceof Error // true
// myerror.name // "MyError"
// myerror.stack
// // Error
// //     at MyError.ExtendableError
// //     ...

// ===== 2. 原生构造函数的继承 =====
// class NewObj extends Object {
//   constructor() {
//     super(...arguments)
//   }
// }
// var o = new NewObj({ attr: true })
// o.attr === true // false

// ===== 3. Mixin 模式的实现 =====
// const a = {
//   a: 'a',
// }
// const b = {
//   b: 'b',
// }
// const c = { ...a, ...b } // {a: 'a', b: 'b'}

// ===== 3. Mixin 模式的实现 =====
// function mix(...mixins) {
//   class Mix {
//     constructor() {
//       for (let mixin of mixins) {
//         copyProperties(this, new mixin()) // 拷贝实例属性
//       }
//     }
//   }
//
//   for (let mixin of mixins) {
//     copyProperties(Mix, mixin) // 拷贝静态属性
//     copyProperties(Mix.prototype, mixin.prototype) // 拷贝原型属性
//   }
//
//   return Mix
// }
//
// function copyProperties(target, source) {
//   for (let key of Reflect.ownKeys(source)) {
//     if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
//       let desc = Object.getOwnPropertyDescriptor(source, key)
//       Object.defineProperty(target, key, desc)
//     }
//   }
// }

// ===== 3. Mixin 模式的实现 =====
// class DistributedEdit extends mix(Loggable, Serializable) {
//   // ...
// }

