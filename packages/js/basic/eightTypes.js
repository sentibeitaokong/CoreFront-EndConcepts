/*
 * 示例代码：eightTypes.md
 * 来源文档：apps/docs/js/basic/eightTypes.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== ✨ 用法 =====
// typeof 42 // "number"
// typeof 'hello' // "string"
// typeof true // "boolean"
// typeof undefined // "undefined"
// typeof Symbol('id') // "symbol"
// typeof 123n // "bigint"
// typeof {} // "object"
// typeof [] // "object"
// typeof function () {} // "function"

// ===== ✨ 用法 =====
// const arr = []
// const obj = {}
// const now = new Date()
//
// arr instanceof Array // true
// arr instanceof Object // true (因为 Array.prototype 继承自 Object.prototype)
//
// obj instanceof Object // true
// now instanceof Date // true

// ===== ✨ 用法 =====
// const num = 1
// const str = 'hi'
// const arr = []
//
// console.log(arr.constructor === Array) // true
// console.log(str.constructor === String) // true
// console.log(num.constructor === Number) // true

// ===== 🚨 常见问题与陷阱 =====
// function MyClass() {}
// MyClass.prototype.constructor = Array // 手动修改 constructor
// const instance = new MyClass()
//
// console.log(instance.constructor === Array) // true，但 instance 并非数组

// ===== ✨ 用法 =====
// const toString = Object.prototype.toString
//
// toString.call(123) // "[object Number]"
// toString.call('abc') // "[object String]"
// toString.call(true) // "[object Boolean]"
// toString.call(undefined) // "[object Undefined]"
// toString.call(null) // "[object Null]" (正确区分了 null)
// toString.call([]) // "[object Array]" (正确区分了数组)
// toString.call({}) // "[object Object]"
// toString.call(new Date()) // "[object Date]"
// toString.call(/a/) // "[object RegExp]"
// toString.call(new Error()) // "[object Error]"
// toString.call(window) // "[object Window]" (在浏览器中)

// ===== 封装成一个通用的 getType 函数 =====
// function getType(value) {
//   if (value === null) {
//     return 'null'
//   }
//   // 处理原始类型和函数
//   const type = typeof value
//   if (type !== 'object') {
//     return type
//   }
//   // 处理引用类型
//   return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
// }
//
// console.log(getType(null)) // "null"
// console.log(getType([])) // "array"
// console.log(getType(new Date())) // "date"

// ===== 1. 二元 + 运算符 =====
// 1 + '1' // "11" (拼接)
// true + true // 2 (1 + 1)
// 4 + [1, 2, 3] // "41,2,3" (数组转字符串是 "1,2,3")
// 10 + {} // "10[object Object]"

// ===== 2. 数学运算符 (-, *, /, %) =====
// '100' - 10 // 90
// 100 * '2' // 200
// 10 - 'abc' // NaN
// 1 - null // 1 (1 - 0)
// 1 - undefined // NaN (1 - NaN)

// ===== 3. 逻辑非 (!) 和 逻辑运算 =====
// ![] // false (数组是真值，取反为假)
// !!'0' // true (非空字符串是真值)

// ===== 1. 工作原理 =====
// object.is = function (a, b) {
//   // 情况 1: 处理 +0 和 -0
//   // 如果 x 和 y 都是 0，它们通过 `===` 比较会是 true。
//   // 但我们需要区分 +0 和 -0。
//   // 技巧：1 / +0 === Infinity，而 1 / -0 === -Infinity。
//   // 所以，如果它们的倒数不相等，说明一个是 +0，另一个是 -0。
//   if (x === 0 && y === 0) {
//     return 1 / x === 1 / y
//   }
//
//   // 情况 2: 处理 NaN
//   // NaN 是唯一一个不等于自身的值 (NaN !== NaN)。
//   // 所以，如果 x 不等于 x，那么 x 就是 NaN。
//   // 如果 x 和 y 都是 NaN，那么它们应该被认为是相等的。
//   if (x !== x) {
//     return y !== y
//   }
//
//   // 情况 3: 其他所有情况
//   // 对于所有其他值 (包括 null, undefined, string, boolean, object引用等)，
//   // Object.is() 的行为与 === 完全相同。
//   return x === y
// }

// ===== 3.6 零值相等 (SameValueZero) =====
// const map = new Map()
// map.set(+0, '正零')
//
// // 因为 Map 使用 SameValueZero，所以认为 -0 和 +0 是同一个键
// console.log(map.get(-0)) // 输出: "正零"
//
// const set = new Set()
// set.add(NaN)
// set.add(NaN)
// console.log(set.size) // 输出: 1 (去重成功)

// ===== 4.2 运算符优先级 (Operator Precedence) =====
// function Foo() {
//   getName = function () {
//     //1
//     console.log(1)
//   }
//   return this
// }
// Foo.getName = function () {
//   //2
//   console.log(2)
// }
// Foo.prototype.getName = function () {
//   //3
//   console.log(3)
// }
// var getName = function () {
//   //4
//   console.log(4)
// }
// function getName() {
//   //5
//   console.log(5)
// }
// //let foo=new Foo()   默认foo为Foo实例
// Foo.getName() //直接调用Foo构造函数的静态方法getName()=>执行函数2=>返回2
// getName() //函数5直接函数提升,函数4是函数表达式无法提升，覆盖函数5=>执行函数4=>返回4
// Foo().getName() //直接调用Foo函数内部的getName函数=>执行函数1=>getName变量是全局的,等效于window.getName，会覆盖全局的getName方法=>返回1
// getName() //全局getName函数被函数1覆盖=>执行函数1=>返回1
// new Foo.getName() //new Foo.getName()=>new (Foo.getName())=>执行Foo的静态方法getName=>执行函数2=>new 2 => 返回2
// new Foo().getName() // new Foo().getName()=>(new Foo()).getName()=>foo.getName()(实例对象执行的是FOO构造函数的getName原型方法)=>返回3
// new new Foo().getName() //new new Foo().getName()=>new ((new Foo()).getName())=>new (foo.getName())=>new 3=>3
//
// //2 4 1 1 2 3 3

// ===== 5.3 true、false 与数字的比较 =====
// const value = '1'
//
// if (value == true) {
//   // "1" == true -> "1" == 1 -> 1 == 1 -> true
//   console.log('Value is true') // ✅ 执行
// }
//
// const text = 'hello'
// if (text == true) {
//   // "hello" == true -> NaN == 1 -> false
//   console.log('Text is true') // ❌ 不执行
// }

// ===== 5.3 true、false 与数字的比较 =====
// // 正确的方式
// if (value) {
//   console.log('Value is truthy')
// }

// ===== 5.4 空数组与 false 的比较 =====
// if ([]) {
//   console.log('Empty array is truthy') // ✅ 执行
// }
//
// console.log([] == false) // true

// ===== 5.5 null 与 0 的比较 =====
// console.log(null == 0) // false (宽松相等有 null 和 undefined 的特例)
//
// console.log(null > 0) // false (关系比较中，null -> 0)
// console.log(null >= 0) // true (关系比较中，null -> 0)

// ===== 5.5 null 与 0 的比较 =====
// const value = null
//
// if (value === 0) {
//   // ...
// }
// if (value === null) {
//   // ...
// }

