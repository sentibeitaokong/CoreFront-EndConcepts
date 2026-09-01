/*
 * 示例代码：classBasic.md
 * 来源文档：apps/docs/js/advanced/class-inheritance/classBasic.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 类的定义和实例化 =====
// function Point(x, y) {
//   this.x = x
//   this.y = y
// }
//
// Point.prototype.toString = function () {
//   return '(' + this.x + ', ' + this.y + ')'
// }
//
// var p = new Point(1, 2)

// ===== 1. 类的定义和实例化 =====
// class Point {
//   constructor(x, y) {
//     this.x = x
//     this.y = y
//   }
//
//   toString() {
//     return '(' + this.x + ', ' + this.y + ')'
//   }
// }

// ===== 1. 类的定义和实例化 =====
// class Point {
//   // ...
// }
//
// typeof Point // "function"
// Point === Point.prototype.constructor // true

// ===== 1. 类的定义和实例化 =====
// class Bar {
//   doStuff() {
//     console.log('stuff')
//   }
// }
//
// const b = new Bar()
// b.doStuff() // "stuff"

// ===== 1. 类的定义和实例化 =====
// class Point {
//   constructor() {
//     // ...
//   }
//
//   toString() {
//     // ...
//   }
//
//   toValue() {
//     // ...
//   }
// }
//
// // 等同于
//
// Point.prototype = {
//   constructor() {},
//   toString() {},
//   toValue() {},
// }

// ===== 1. 类的定义和实例化 =====
// class B {}
// const b = new B()
//
// b.constructor === B.prototype.constructor // true

// ===== 1. 类的定义和实例化 =====
// class Point {
//   constructor() {
//     // ...
//   }
// }
//
// Object.assign(Point.prototype, {
//   toString() {},
//   toValue() {},
// })

// ===== 1. 类的定义和实例化 =====
// Point.prototype.constructor === Point // true

// ===== 1. 类的定义和实例化 =====
// class Point {
//   constructor(x, y) {
//     // ...
//   }
//
//   toString() {
//     // ...
//   }
// }
//
// Object.keys(Point.prototype)
// // []
// Object.getOwnPropertyNames(Point.prototype)
// // ["constructor","toString"]

// ===== 1. 类的定义和实例化 =====
// var Point = function (x, y) {
//   // ...
// }
//
// Point.prototype.toString = function () {
//   // ...
// }
//
// Object.keys(Point.prototype)
// // ["toString"]
// Object.getOwnPropertyNames(Point.prototype)
// // ["constructor","toString"]

// ===== 1.1 constructor() 方法 =====
// class Point {}
//
// // 等同于
// class Point {
//   constructor() {}
// }

// ===== 1.1 constructor() 方法 =====
// class Foo {
//   constructor() {
//     return Object.create(null)
//   }
// }
//
// new Foo() instanceof Foo
// // false

// ===== 1.1 constructor() 方法 =====
// class Foo {
//   constructor() {
//     return Object.create(null)
//   }
// }
//
// Foo()
// // TypeError: Class constructor Foo cannot be invoked without 'new'

// ===== 1.2 类的实例 =====
// class Point {
//   // ...
// }
//
// // 报错
// var point = Point(2, 3)
//
// // 正确
// var point = new Point(2, 3)

// ===== 1.2 类的实例 =====
// class Point {
//   constructor(x, y) {
//     this.x = x
//     this.y = y
//   }
//
//   toString() {
//     return '(' + this.x + ', ' + this.y + ')'
//   }
// }
//
// var point = new Point(2, 3)
//
// point.toString() // (2, 3)
//
// point.hasOwnProperty('x') // true
// point.hasOwnProperty('y') // true
// point.hasOwnProperty('toString') // false
// point.__proto__.hasOwnProperty('toString') // true

// ===== 1.2 类的实例 =====
// var p1 = new Point(2, 3)
// var p2 = new Point(3, 2)
//
// p1.__proto__ === p2.__proto__
// //true

// ===== 1.2 类的实例 =====
// var p1 = new Point(2, 3)
// var p2 = new Point(3, 2)
//
// p1.__proto__.printName = function () {
//   return 'Oops'
// }
//
// p1.printName() // "Oops"
// p2.printName() // "Oops"
//
// var p3 = new Point(4, 2)
// p3.printName() // "Oops"

// ===== 1.3 类实例属性简写 =====
// // 原来的写法
// class IncreasingCounter {
//   constructor() {
//     this._count = 0
//   }
//   get value() {
//     console.log('Getting the current value!')
//     return this._count
//   }
//   increment() {
//     this._count++
//   }
// }

// ===== 1.3 类实例属性简写 =====
// class IncreasingCounter {
//   _count = 0
//   get value() {
//     console.log('Getting the current value!')
//     return this._count
//   }
//   increment() {
//     this._count++
//   }
// }

// ===== 1.3 类实例属性简写 =====
// class foo {
//   bar = 'hello'
//   baz = 'world'
//
//   constructor() {
//     // ...
//   }
// }

// ===== 1.4 取值函数（getter）和存值函数（setter） =====
// class MyClass {
//   constructor() {
//     // ...
//   }
//   get prop() {
//     return 'getter'
//   }
//   set prop(value) {
//     console.log('setter: ' + value)
//   }
// }
//
// let inst = new MyClass()
//
// inst.prop = 123
// // setter: 123
//
// inst.prop
// // 'getter'

// ===== 1.4 取值函数（getter）和存值函数（setter） =====
// class Example {
//   get hello() {
//     return 'world'
//   }
// }
// const obj = new Example()
// var descriptor = Object.getOwnPropertyDescriptor(Example.prototype, 'hello')
//
// console.log('get' in descriptor) // true
// console.log('set' in descriptor) // true
// console.log(obj.hello) //world
// console.log(Object.getOwnPropertyDescriptor(obj, 'hello')) //undefined
// console.log(
//   Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), 'hello'),
// )
// // {
// //     get: [Function: get hello],
// //     set: undefined,
// //         enumerable: false,
// //     configurable: true
// // }

// ===== 1.5 属性表达式 =====
// let methodName = 'getArea'
//
// class Square {
//   constructor(length) {
//     // ...
//   }
//
//   [methodName]() {
//     // ...
//   }
// }

// ===== 1.6 Class 表达式 =====
// const MyClass = class Me {
//   getClassName() {
//     return Me.name
//   }
// }

// ===== 1.6 Class 表达式 =====
// let inst = new MyClass()
// inst.getClassName() // Me
// Me.name // ReferenceError: Me is not defined

// ===== 1.6 Class 表达式 =====
// const MyClass = class {
//   /* ... */
// }

// ===== 1.6 Class 表达式 =====
// let person = new (class {
//   constructor(name) {
//     this.name = name
//   }
//
//   sayName() {
//     console.log(this.name)
//   }
// })('张三')
//
// person.sayName() // "张三"

// ===== 1.7 类的静态方法 =====
// class Foo {
//   static classMethod() {
//     return 'hello'
//   }
// }
//
// Foo.classMethod() // 'hello'
//
// var foo = new Foo()
// foo.classMethod()
// // TypeError: foo.classMethod is not a function

// ===== 1.7 类的静态方法 =====
// class Foo {
//   static bar() {
//     this.baz()
//   }
//   static baz() {
//     console.log('hello')
//   }
//   baz() {
//     console.log('world')
//   }
// }
//
// Foo.bar() // hello

// ===== 1.7 类的静态方法 =====
// class Foo {
//   static classMethod() {
//     return 'hello'
//   }
// }
//
// class Bar extends Foo {}
//
// Bar.classMethod() // 'hello'

// ===== 1.7 类的静态方法 =====
// class Foo {
//   static classMethod() {
//     return 'hello'
//   }
// }
//
// class Bar extends Foo {
//   static classMethod() {
//     return super.classMethod() + ', too'
//   }
// }
//
// Bar.classMethod() // "hello, too"

// ===== 1.8 类的静态属性 =====
// class Foo {}
//
// Foo.prop = 1
// Foo.prop // 1

// ===== 1.8 类的静态属性 =====
// class MyClass {
//   static myStaticProp = 42
//
//   constructor() {
//     console.log(MyClass.myStaticProp) // 42
//   }
// }

// ===== 1.8 类的静态属性 =====
// // 老写法
// class Foo {
//   // ...
// }
// Foo.prop = 1
//
// // 新写法
// class Foo {
//   static prop = 1
// }

// ===== 1.9 静态块 =====
// class C {
//   static x = 234;
//   static y;
//   static z;
// }
//
// try {
//   const obj = doSomethingWith(C.x);
//   C.y = obj.y
//   C.z = obj.z;
// } catch {
//   C.y = ...;
//   C.z = ...;
// }

// ===== 1.9 静态块 =====
// class C {
//   static x = ...;
//   static y;
//   static z;
//
//   static {
//     try {
//       const obj = doSomethingWith(this.x);
//       this.y = obj.y;
//       this.z = obj.z;
//     }
//     catch {
//       this.y = ...;
//       this.z = ...;
//     }
//   }
// }

// ===== 1.9 静态块 =====
// class C {
//   static x = 1
//   static {
//     this.x // 1
//     // 或者
//     C.x // 1
//   }
// }

// ===== 1.9 静态块 =====
// let getX
//
// export class C {
//   #x = 1
//   static {
//     getX = obj => obj.#x
//   }
// }
//
// console.log(getX(new C())) // 1

// ===== 2.1 早期解决方案 =====
// class Widget {
//   // 公有方法
//   foo(baz) {
//     this._bar(baz)
//   }
//
//   // 私有方法
//   _bar(baz) {
//     return (this.snaf = baz)
//   }
//
//   // ...
// }

// ===== 2.1 早期解决方案 =====
// class Widget {
//   foo(baz) {
//     bar.call(this, baz)
//   }
//
//   // ...
// }
//
// function bar(baz) {
//   return (this.snaf = baz)
// }

// ===== 2.1 早期解决方案 =====
// const bar = Symbol('bar')
// const snaf = Symbol('snaf')
//
// export default class myClass {
//   // 公有方法
//   foo(baz) {
//     this[bar](baz)
//   }
//
//   // 私有方法
//   [bar](baz) {
//     return (this[snaf] = baz)
//   }
//
//   // ...
// }

// ===== 2.1 早期解决方案 =====
// const inst = new myClass()
//
// Reflect.ownKeys(myClass.prototype)
// // [ 'constructor', 'foo', Symbol(bar) ]

// ===== 2.2 私有属性的正式写法 =====
// class IncreasingCounter {
//   #count = 0
//   get value() {
//     console.log('Getting the current value!')
//     return this.#count
//   }
//   increment() {
//     this.#count++
//   }
// }

// ===== 2.2 私有属性的正式写法 =====
// const counter = new IncreasingCounter()
// counter.#count // 报错
// counter.#count = 42 // 报错

// ===== 2.2 私有属性的正式写法 =====
// class IncreasingCounter {
//   #count = 0
//   get value() {
//     console.log('Getting the current value!')
//     return this.#myCount // 报错
//   }
//   increment() {
//     this.#count++
//   }
// }
//
// const counter = new IncreasingCounter()
// counter.#myCount // 报错

// ===== 2.2 私有属性的正式写法 =====
// class Point {
//   #x
//
//   constructor(x = 0) {
//     this.#x = +x
//   }
//
//   get x() {
//     return this.#x
//   }
//
//   set x(value) {
//     this.#x = +value
//   }
// }

// ===== 2.2 私有属性的正式写法 =====
// class Foo {
//   #a
//   #b
//   constructor(a, b) {
//     this.#a = a
//     this.#b = b
//   }
//   #sum() {
//     return this.#a + this.#b
//   }
//   printSum() {
//     console.log(this.#sum())
//   }
// }

// ===== 2.2 私有属性的正式写法 =====
// class Counter {
//   #xValue = 0
//
//   constructor() {
//     console.log(this.#x)
//   }
//
//   get #x() {
//     return this.#xValue
//   }
//   set #x(value) {
//     this.#xValue = value
//   }
// }

// ===== 2.2 私有属性的正式写法 =====
// class Foo {
//   #privateValue = 42
//   static getPrivateValue(foo) {
//     return foo.#privateValue
//   }
// }
//
// Foo.getPrivateValue(new Foo()) // 42

// ===== 2.2 私有属性的正式写法 =====
// class FakeMath {
//   static PI = 22 / 7
//   static #totallyRandomNumber = 4
//
//   static #computeRandomNumber() {
//     return FakeMath.#totallyRandomNumber
//   }
//
//   static random() {
//     console.log('I heard you like random numbers…')
//     return FakeMath.#computeRandomNumber()
//   }
// }
//
// FakeMath.PI // 3.142857142857143
// FakeMath.random()
// // I heard you like random numbers…
// // 4
// FakeMath.#totallyRandomNumber // 报错
// FakeMath.#computeRandomNumber() // 报错

// ===== 2.3 in 运算符 =====
// class C {
//   #brand
//
//   static isC(obj) {
//     try {
//       obj.#brand
//       return true
//     } catch {
//       return false
//     }
//   }
// }

// ===== 2.3 in 运算符 =====
// class C {
//   #brand
//
//   static isC(obj) {
//     if (#brand in obj) {
//       // 私有属性 #brand 存在
//       return true
//     } else {
//       // 私有属性 #brand 不存在
//       return false
//     }
//   }
// }

// ===== 2.3 in 运算符 =====
// class A {
//   #foo = 0
//   m() {
//     console.log(#foo in this) // true
//   }
// }

// ===== 2.3 in 运算符 =====
// class A {
//   m() {
//     console.log(#foo in this) // 报错
//   }
// }

// ===== 3.2 不存在提升 =====
// new Foo() // ReferenceError
// class Foo {}

// ===== 3.2 不存在提升 =====
// {
//   let Foo = class {}
//   class Bar extends Foo {}
// }

// ===== 3.3 name 属性 =====
// class Point {}
// Point.name // "Point"

// ===== 3.4 Generator 方法 =====
// class Foo {
//   constructor(...args) {
//     this.args = args
//   }
//   *[Symbol.iterator]() {
//     for (let arg of this.args) {
//       yield arg
//     }
//   }
// }
//
// for (let x of new Foo('hello', 'world')) {
//   console.log(x)
// }
// // hello
// // world

// ===== 3.5 this 的指向 =====
// class Logger {
//   printName(name = 'there') {
//     this.print(`Hello ${name}`)
//   }
//
//   print(text) {
//     console.log(text)
//   }
// }
//
// const logger = new Logger()
// const { printName } = logger
// printName() // TypeError: Cannot read property 'print' of undefined

// ===== 3.5 this 的指向 =====
// class Logger {
//   constructor() {
//     this.printName = this.printName.bind(this)
//   }
//
//   // ...
// }

// ===== 3.5 this 的指向 =====
// class Obj {
//   constructor() {
//     this.getThis = () => this
//   }
// }
//
// const myObj = new Obj()
// myObj.getThis() === myObj // true

// ===== 3.5 this 的指向 =====
// function selfish(target) {
//   const cache = new WeakMap()
//   const handler = {
//     get(target, key) {
//       const value = Reflect.get(target, key)
//       if (typeof value !== 'function') {
//         return value
//       }
//       if (!cache.has(value)) {
//         cache.set(value, value.bind(target))
//       }
//       return cache.get(value)
//     },
//   }
//   const proxy = new Proxy(target, handler)
//   return proxy
// }
//
// const logger = selfish(new Logger())

// ===== 4. new.target 属性 =====
// function Person(name) {
//   if (new.target !== undefined) {
//     this.name = name
//   } else {
//     throw new Error('必须使用 new 命令生成实例')
//   }
// }
//
// // 另一种写法
// function Person(name) {
//   if (new.target === Person) {
//     this.name = name
//   } else {
//     throw new Error('必须使用 new 命令生成实例')
//   }
// }
//
// var person = new Person('张三') // 正确
// var notAPerson = Person.call(person, '张三') // 报错

// ===== 4. new.target 属性 =====
// class Rectangle {
//   constructor(length, width) {
//     console.log(new.target === Rectangle)
//     this.length = length
//     this.width = width
//   }
// }
//
// var obj = new Rectangle(3, 4) // 输出 true

// ===== 4. new.target 属性 =====
// class Rectangle {
//   constructor(length, width) {
//     console.log(new.target === Rectangle)
//     // ...
//   }
// }
//
// class Square extends Rectangle {
//   constructor(length, width) {
//     super(length, width)
//   }
// }
//
// var obj = new Square(3) // 输出 false

// ===== 4. new.target 属性 =====
// class Shape {
//   constructor() {
//     if (new.target === Shape) {
//       throw new Error('本类不能实例化')
//     }
//   }
// }
//
// class Rectangle extends Shape {
//   constructor(length, width) {
//     super()
//     // ...
//   }
// }
//
// var x = new Shape() // 报错
// var y = new Rectangle(3, 4) // 正确

