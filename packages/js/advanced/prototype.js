/*
 * 示例代码：prototype.md
 * 来源文档：apps/docs/js/advanced/class-inheritance/prototype.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 什么是构造函数? =====
// // 定义一个构造函数
// function Car(make, model, year) {
//   // `this` 在这里指向一个新创建的空对象
//
//   // 为新对象添加属性
//   this.make = make
//   this.model = model
//   this.year = year
//
//   // 为新对象添加方法
//   this.getDetails = function () {
//     return `${this.year} ${this.make} ${this.model}`
//   }
//
//   // `new` 操作符会隐式地 return this
// }
//
// // 使用 new 关键字调用构造函数，创建实例
// const myCar = new Car('Toyota', 'Corolla', 2021)
//
// // 访问实例的属性和方法
// console.log(myCar.make) // "Toyota"
// console.log(myCar.getDetails()) // "2021 Toyota Corolla"

// ===== 1.2 new的实现原理 =====
// function myNew() {
//   // 1、创建一个空的对象
//   var obj = new Object(),
//     // 2、获得构造函数，同时删除 arguments 中第一个参数
//     Con = [].shift.call(arguments)
//   // 3、链接到原型，obj 可以访问构造函数原型中的属性
//   Object.setPrototypeOf(obj, Con.prototype)
//   // 4、绑定 this 实现继承，obj 可以访问到构造函数中的属性
//   var ret = Con.apply(obj, arguments)
//   // 5、优先返回构造函数返回的对象
//   return ret instanceof Object ? ret : obj
// }

// ===== 1.3 构造函数、实例和原型的关系 =====
// function Car(make, model) {
//   this.make = make
//   this.model = model
// }
//
// // 将共享的方法添加到原型上
// Car.prototype.getDetails = function () {
//   return `${this.year} ${this.make} ${this.model}` // 注意：这里的 year 可能会是 undefined
// }
//
// Car.prototype.setYear = function (year) {
//   this.year = year
// }
//
// const car1 = new Car('Honda', 'Civic')
// const car2 = new Car('Ford', 'Focus')
//
// // car1 和 car2 共享同一个 getDetails 和 setYear 方法
// console.log(car1.getDetails === car2.getDetails) // true

// ===== 2.2 __proto__ (对象的原型链接) / Object.getPrototypeOf() =====
// function Person(name, age) {
//   this.name = name
//   this.age = age
// }
//
// // 将共享的方法添加到 Person 的原型对象上
// Person.prototype.sayHello = function () {
//   console.log(`Hello, I'm ${this.name}`)
// }
//
// Person.prototype.species = 'Homo sapiens'
//
// const person1 = new Person('Alice', 30)
// const person2 = new Person('Bob', 25)
//
// person1.sayHello() // "Hello, I'm Alice"
//
// // 验证关系
// console.log(person1.__proto__ === Person.prototype) // true
// console.log(person1.sayHello === person2.sayHello) // true (两个实例共享同一个 sayHello 函数)

// ===== 2.3 constructor 属性 =====
// function Parent(age) {
//   this.age = age
// }
//
// var p = new Parent(50)
// p.constructor === Parent // true
// p.constructor === Object // false

// ===== 2.3 constructor 属性 =====
// function Foo() {
//   this.value = 42
// }
// Foo.prototype = {
//   method: function () {},
// }
//
// function Bar() {}
//
// // 设置 Bar 的 prototype 属性为 Foo 的实例对象
// Bar.prototype = new Foo()
// Bar.prototype.foo = 'Hello World'
//
// Bar.prototype.constructor === Object
// // true
//
// // 修正 Bar.prototype.constructor 为 Bar 本身
// Bar.prototype.constructor = Bar
//
// var test = new Bar() // 创建 Bar 的一个新实例
// console.log(test)

// ===== 2.3 constructor 属性 =====
// function Type() {}
// var types = [1, 'muyiy', true, Symbol(123)]
//
// for (var i = 0; i < types.length; i++) {
//   types[i].constructor = Type
//   types[i] = [
//     types[i].constructor,
//     types[i] instanceof Type,
//     types[i].toString(),
//   ]
// }
//
// console.log(types.join('\n'))
// // function Number() { [native code] }, false, 1
// // function String() { [native code] }, false, muyiy
// // function Boolean() { [native code] }, false, true
// // function Symbol() { [native code] }, false, Symbol(123)

// ===== 3.1 什么是原型链 =====
// function Parent(age) {
//   this.age = age
// }
// var p = new Parent(50)
//
// p // Parent {age: 50}
// p.__proto__ === Parent.prototype // true
// p.__proto__.__proto__ === Object.prototype // true
// p.__proto__.__proto__.__proto__ === null // true

