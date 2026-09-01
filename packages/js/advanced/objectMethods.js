/*
 * 示例代码：object.md
 * 来源文档：apps/docs/js/advanced/data-types/object.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 属性的简洁表示法 =====
// const foo = 'bar'
// const baz = { foo }
// baz // {foo: "bar"}
//
// // 等同于
// const baz = { foo: foo }

// ===== 1.1 属性的简洁表示法 =====
// function f(x, y) {
//   return { x, y }
// }
//
// // 等同于
//
// function f(x, y) {
//   return { x: x, y: y }
// }
//
// f(1, 2) // Object {x: 1, y: 2}

// ===== 1.1 属性的简洁表示法 =====
// const o = {
//   method() {
//     return 'Hello!'
//   },
// }
//
// // 等同于
//
// const o = {
//   method: function () {
//     return 'Hello!'
//   },
// }

// ===== 1.1 属性的简洁表示法 =====
// let birth = '2000/01/01'
//
// const Person = {
//   name: '张三',
//
//   //等同于birth: birth
//   birth,
//
//   // 等同于hello: function ()...
//   hello() {
//     console.log('我的名字是', this.name)
//   },
// }

// ===== 1.1 属性的简洁表示法 =====
// function getPoint() {
//   const x = 1
//   const y = 10
//   return { x, y }
// }
//
// getPoint()
// // {x:1, y:10}

// ===== 1.1 属性的简洁表示法 =====
// let ms = {}
//
// function getItem(key) {
//   return key in ms ? ms[key] : null
// }
//
// function setItem(key, value) {
//   ms[key] = value
// }
//
// function clear() {
//   ms = {}
// }
//
// module.exports = { getItem, setItem, clear }
// // 等同于
// module.exports = {
//   getItem: getItem,
//   setItem: setItem,
//   clear: clear,
// }

// ===== 1.1 属性的简洁表示法 =====
// const cart = {
//   _wheels: 4,
//
//   get wheels() {
//     return this._wheels
//   },
//
//   set wheels(value) {
//     if (value < this._wheels) {
//       throw new Error('数值太小了！')
//     }
//     this._wheels = value
//   },
// }

// ===== 1.1 属性的简洁表示法 =====
// let user = {
//   name: 'test',
// }
//
// let foo = {
//   bar: 'baz',
// }
//
// console.log(user, foo)
// // {name: "test"} {bar: "baz"}
// console.log({ user, foo })
// // {user: {name: "test"}, foo: {bar: "baz"}}

// ===== 1.1 属性的简洁表示法 =====
// const obj = {
//   f() {
//     this.foo = 'bar'
//   },
// }
//
// new obj.f() // 报错

// ===== 1.2 属性名表达式 =====
// // 方法一
// obj.foo = true
//
// // 方法二
// obj['a' + 'bc'] = 123

// ===== 1.2 属性名表达式 =====
// var obj = {
//   foo: true,
//   abc: 123,
// }

// ===== 1.2 属性名表达式 =====
// let propKey = 'foo'
//
// let obj = {
//   [propKey]: true,
//   ['a' + 'bc']: 123,
// }

// ===== 1.2 属性名表达式 =====
// let lastWord = 'last word'
//
// const a = {
//   'first word': 'hello',
//   [lastWord]: 'world',
// }
//
// a['first word'] // "hello"
// a[lastWord] // "world"
// a['last word'] // "world"

// ===== 1.2 属性名表达式 =====
// let obj = {
//   ['h' + 'ello']() {
//     return 'hi'
//   },
// }
//
// obj.hello() // hi

// ===== 1.2 属性名表达式 =====
// // 报错
// const foo = 'bar';
// const bar = 'abc';
// const baz = { [foo] };
//
// // 正确
// const foo = 'bar';
// const baz = { [foo]: 'abc'};

// ===== 1.2 属性名表达式 =====
// const keyA = { a: 1 }
// const keyB = { b: 2 }
//
// const myObject = {
//   [keyA]: 'valueA',
//   [keyB]: 'valueB',
// }
//
// myObject // Object {[object Object]: "valueB"}

// ===== 1.3 方法的 name 属性 =====
// const person = {
//   sayName() {
//     console.log('hello!')
//   },
// }
//
// person.sayName.name // "sayName"

// ===== 1.3 方法的 name 属性 =====
// const obj = {
//   get foo() {},
//   set foo(x) {},
// }
//
// obj.foo.name
// // TypeError: Cannot read property 'name' of undefined
//
// const descriptor = Object.getOwnPropertyDescriptor(obj, 'foo')
//
// descriptor.get.name // "get foo"
// descriptor.set.name // "set foo"

// ===== 1.3 方法的 name 属性 =====
// new Function().name // "anonymous"
//
// var doSomething = function () {
//   // ...
// }
// doSomething.bind().name // "bound doSomething"

// ===== 1.3 方法的 name 属性 =====
// const key1 = Symbol('description')
// const key2 = Symbol()
// let obj = {
//   [key1]() {},
//   [key2]() {},
// }
// obj[key1].name // "[description]"
// obj[key2].name // ""

// ===== 1. 可枚举性 =====
// let obj = { foo: 123 }
// Object.getOwnPropertyDescriptor(obj, 'foo')
// //  {
// //    value: 123,
// //    writable: true,    //可读写(读取和修改改数据)
// //    enumerable: true,  //可枚举(for循环遍历)
// //    configurable: true  //可扩展(新增和删除)
// //  }

// ===== 1. 可枚举性 =====
// Object.getOwnPropertyDescriptor(Object.prototype, 'toString').enumerable
// // false
//
// Object.getOwnPropertyDescriptor([], 'length').enumerable
// // false

// ===== 1. 可枚举性 =====
// Object.getOwnPropertyDescriptor(
//   class {
//     foo() {}
//   }.prototype,
//   'foo',
// ).enumerable
// // false

// ===== 2. 属性的遍历 =====
// Reflect.ownKeys({ [Symbol()]: 0, b: 0, 10: 0, 2: 0, a: 0 })
// // ['2', '10', 'b', 'a', Symbol()]

// ===== 1.5 super 关键字 =====
// const proto = {
//   foo: 'hello',
// }
//
// const obj = {
//   foo: 'world',
//   find() {
//     return super.foo
//   },
// }
//
// Object.setPrototypeOf(obj, proto)
// obj.find() // "hello"

// ===== 1.5 super 关键字 =====
// // 报错
// const obj = {
//   foo: super.foo
// }
//
// // 报错
// const obj = {
//   foo: () => super.foo
// }
//
// // 报错
// const obj = {
//   foo: function () {
//     return super.foo
//   }
// }

// ===== 1.5 super 关键字 =====
// const proto = {
//   x: 'hello',
//   foo() {
//     console.log(this.x)
//   },
// }
//
// const obj = {
//   x: 'world',
//   foo() {
//     super.foo()
//   },
// }
//
// Object.setPrototypeOf(obj, proto)
//
// obj.foo() // "world"

// ===== 1. 解构赋值 =====
// let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 }
// x // 1
// y // 2
// z // { a: 3, b: 4 }

// ===== 1. 解构赋值 =====
// let { ...z } = null // 运行时错误
// let { ...z } = undefined // 运行时错误

// ===== 1. 解构赋值 =====
// let { ...x, y, z } = someObject; // 句法错误
// let { x, ...y, ...z } = someObject; // 句法错误

// ===== 1. 解构赋值 =====
// let obj = { a: { b: 1 } }
// let { ...x } = obj
// obj.a.b = 2
// x.a.b // 2

// ===== 1. 解构赋值 =====
// let o1 = { a: 1 }
// let o2 = { b: 2 }
// o2.__proto__ = o1
// let { ...o3 } = o2
// o3 // { b: 2 }
// o3.a // undefined

// ===== 1. 解构赋值 =====
// const o = Object.create({ x: 1, y: 2 })
// o.z = 3
//
// let { x, ...newObj } = o
// let { y, z } = newObj
// x // 1
// y // undefined
// z // 3

// ===== 1. 解构赋值 =====
// let { x, ...{ y, z } } = o;
// // SyntaxError: ... must be followed by an identifier in declaration contexts

// ===== 1. 解构赋值 =====
// function baseFunction({ a, b }) {
//   // ...
// }
// function wrapperFunction({ x, y, ...restConfig }) {
//   // 使用 x 和 y 参数进行操作
//   // 其余参数传给原始函数
//   return baseFunction(restConfig)
// }

// ===== 2. 扩展运算符 =====
// let z = { a: 3, b: 4 }
// let n = { ...z }
// n // { a: 3, b: 4 }

// ===== 2. 扩展运算符 =====
// let foo = { ...['a', 'b', 'c'] }
// foo
// // {0: "a", 1: "b", 2: "c"}

// ===== 2. 扩展运算符 =====
// {...{}, a: 1}
// // { a: 1 }

// ===== 2. 扩展运算符 =====
// // 等同于 {...Object(1)}
// {...1} // {}

// ===== 2. 扩展运算符 =====
// // 等同于 {...Object(true)}
// {...true} // {}
//
// // 等同于 {...Object(undefined)}
// {...undefined} // {}
//
// // 等同于 {...Object(null)}
// {...null} // {}

// ===== 2. 扩展运算符 =====
// {...'hello'}
// // {0: "h", 1: "e", 2: "l", 3: "l", 4: "o"}

// ===== 2. 扩展运算符 =====
// class C {
//   p = 12
//   m() {}
// }
//
// let c = new C()
// let clone = { ...c }
//
// clone.p // ok
// clone.m() // 报错

// ===== 2. 扩展运算符 =====
// let aClone = { ...a }
// // 等同于
// let aClone = Object.assign({}, a)

// ===== 2. 扩展运算符 =====
// // 写法一
// const clone1 = {
//   __proto__: Object.getPrototypeOf(obj),
//   ...obj,
// }
//
// // 写法二
// const clone2 = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)
//
// // 写法三
// const clone3 = Object.create(
//   Object.getPrototypeOf(obj),
//   Object.getOwnPropertyDescriptors(obj),
// )

// ===== 2. 扩展运算符 =====
// let ab = { ...a, ...b }
// // 等同于
// let ab = Object.assign({}, a, b)

// ===== 2. 扩展运算符 =====
// let aWithOverrides = { ...a, x: 1, y: 2 }
// // 等同于
// let aWithOverrides = { ...a, ...{ x: 1, y: 2 } }
// // 等同于
// let x = 1,
//   y = 2,
//   aWithOverrides = { ...a, x, y }
// // 等同于
// let aWithOverrides = Object.assign({}, a, { x: 1, y: 2 })

// ===== 2. 扩展运算符 =====
// let newVersion = {
//   ...previousVersion,
//   name: 'New Name', // Override the name property
// }

// ===== 2. 扩展运算符 =====
// let aWithDefaults = { x: 1, y: 2, ...a }
// // 等同于
// let aWithDefaults = Object.assign({}, { x: 1, y: 2 }, a)
// // 等同于
// let aWithDefaults = Object.assign({ x: 1, y: 2 }, a)

// ===== 2. 扩展运算符 =====
// const obj = {
//   ...(x > 1 ? { a: 1 } : {}),
//   b: 2,
// }

// ===== 2. 扩展运算符 =====
// let a = {
//   get x() {
//     throw new Error('not throw yet')
//   },
// }
//
// let aWithXGetter = { ...a } // 报错

// ===== Object.is() =====
// Object.is('foo', 'foo')
// // true
// Object.is({}, {})
// // false

// ===== Object.is() =====
// ;+0 === -0 //true
// NaN === NaN // false
//
// Object.is(+0, -0) // false
// Object.is(NaN, NaN) // true

// ===== Object.is() =====
// Object.defineProperty(Object, 'is', {
//   value: function (x, y) {
//     if (x === y) {
//       // 针对+0 不等于 -0的情况
//       return x !== 0 || 1 / x === 1 / y
//     }
//     // 针对NaN的情况
//     return x !== x && y !== y
//   },
//   configurable: true,
//   enumerable: false,
//   writable: true,
// })

// ===== Object.assign() =====
// const target = { a: 1 }
//
// const source1 = { b: 2 }
// const source2 = { c: 3 }
//
// Object.assign(target, source1, source2)
// target // {a:1, b:2, c:3}

// ===== Object.assign() =====
// const target = { a: 1, b: 1 }
//
// const source1 = { b: 2, c: 2 }
// const source2 = { c: 3 }
//
// Object.assign(target, source1, source2)
// target // {a:1, b:2, c:3}

// ===== Object.assign() =====
// const obj = { a: 1 }
// Object.assign(obj) === obj // true

// ===== Object.assign() =====
// typeof Object.assign(2) // "object"

// ===== Object.assign() =====
// Object.assign(undefined) // 报错
// Object.assign(null) // 报错

// ===== Object.assign() =====
// let obj = { a: 1 }
// Object.assign(obj, undefined) === obj // true
// Object.assign(obj, null) === obj // true

// ===== Object.assign() =====
// const v1 = 'abc'
// const v2 = true
// const v3 = 10
//
// const obj = Object.assign({}, v1, v2, v3)
// console.log(obj) // { "0": "a", "1": "b", "2": "c" }

// ===== Object.assign() =====
// Object(true) // {[[PrimitiveValue]]: true}
// Object(10) //  {[[PrimitiveValue]]: 10}
// Object('abc') // {0: "a", 1: "b", 2: "c", length: 3, [[PrimitiveValue]]: "abc"}

// ===== Object.assign() =====
// Object.assign(
//   { b: 'c' },
//   Object.defineProperty({}, 'invisible', {
//     enumerable: false,
//     value: 'hello',
//   }),
// )
// // { b: 'c' }

// ===== Object.assign() =====
// Object.assign({ a: 'b' }, { [Symbol('c')]: 'd' })
// // { a: 'b', Symbol(c): 'd' }

// ===== Object.assign() =====
// const obj1 = { a: { b: 1 } }
// const obj2 = Object.assign({}, obj1)
//
// obj1.a.b = 2
// obj2.a.b // 2

// ===== Object.assign() =====
// const target = { a: { b: 'c', d: 'e' } }
// const source = { a: { b: 'hello' } }
// Object.assign(target, source)
// // { a: { b: 'hello' } }

// ===== Object.assign() =====
// Object.assign([1, 2, 3], [4, 5])
// // [4, 5, 3]

// ===== Object.assign() =====
// const source = {
//   get foo() {
//     return 1
//   },
// }
// const target = {}
//
// Object.assign(target, source)
// // { foo: 1 }

// ===== Object.assign() =====
// class Point {
//   constructor(x, y) {
//     Object.assign(this, { x, y })
//   }
// }

// ===== Object.assign() =====
// Object.assign(SomeClass.prototype, {
//   someMethod(arg1, arg2) {
//     ···
//   },
//   anotherMethod() {
//     ···
//   }
// });
//
// // 等同于下面的写法
// SomeClass.prototype.someMethod = function (arg1, arg2) {
//   ···
// };
// SomeClass.prototype.anotherMethod = function () {
//   ···
// };

// ===== Object.assign() =====
// function clone(origin) {
//   return Object.assign({}, origin)
// }

// ===== Object.assign() =====
// function clone(origin) {
//   let originProto = Object.getPrototypeOf(origin)
//   return Object.assign(Object.create(originProto), origin)
// }

// ===== Object.assign() =====
// const merge = (target, ...sources) => Object.assign(target, ...sources)

// ===== Object.assign() =====
// const merge = (...sources) => Object.assign({}, ...sources)

// ===== Object.assign() =====
// const DEFAULTS = {
//   logLevel: 0,
//   outputFormat: 'html',
// }
//
// function processContent(options) {
//   options = Object.assign({}, DEFAULTS, options)
//   console.log(options)
//   // ...
// }

// ===== Object.assign() =====
// const DEFAULTS = {
//   url: {
//     host: 'example.com',
//     port: 7070,
//   },
// }
//
// processContent({ url: { port: 8000 } })
// // {
// //   url: {port: 8000}
// // }

// ===== Object.keys() =====
// var obj = { foo: 'bar', baz: 42 }
// Object.keys(obj)
// // ["foo", "baz"]

// ===== Object.keys() =====
// let { keys, values, entries } = Object
// let obj = { a: 1, b: 2, c: 3 }
//
// for (let key of keys(obj)) {
//   console.log(key) // 'a', 'b', 'c'
// }
//
// for (let value of values(obj)) {
//   console.log(value) // 1, 2, 3
// }
//
// for (let [key, value] of entries(obj)) {
//   console.log([key, value]) // ['a', 1], ['b', 2], ['c', 3]
// }

// ===== Object.values() =====
// const obj = { foo: 'bar', baz: 42 }
// Object.values(obj)
// // ["bar", 42]

// ===== Object.values() =====
// const obj = { 100: 'a', 2: 'b', 7: 'c' }
// Object.values(obj)
// // ["b", "c", "a"]

// ===== Object.values() =====
// const obj = Object.create({}, { p: { value: 42 } })
// Object.values(obj) // []

// ===== Object.values() =====
// const obj = Object.create(
//   {},
//   {
//     p: {
//       value: 42,
//       enumerable: true,
//     },
//   },
// )
// Object.values(obj) // [42]

// ===== Object.values() =====
// Object.values({ [Symbol()]: 123, foo: 'abc' })
// // ['abc']

// ===== Object.values() =====
// Object.values('foo')
// // ['f', 'o', 'o']

// ===== Object.values() =====
// Object.values(42) // []
// Object.values(true) // []

// ===== Object.entries() =====
// const obj = { foo: 'bar', baz: 42 }
// Object.entries(obj)
// // [ ["foo", "bar"], ["baz", 42] ]

// ===== Object.entries() =====
// Object.entries({ [Symbol()]: 123, foo: 'abc' })
// // [ [ 'foo', 'abc' ] ]

// ===== Object.entries() =====
// let obj = { one: 1, two: 2 }
// for (let [k, v] of Object.entries(obj)) {
//   console.log(`${JSON.stringify(k)}: ${JSON.stringify(v)}`)
// }
// // "one": 1
// // "two": 2

// ===== Object.entries() =====
// const obj = { foo: 'bar', baz: 42 }
// const map = new Map(Object.entries(obj))
// map // Map { foo: "bar", baz: 42 }

// ===== Object.entries() =====
// // Generator函数的版本
// function* entries(obj) {
//   for (let key of Object.keys(obj)) {
//     yield [key, obj[key]]
//   }
// }
//
// // 非Generator函数的版本
// function entries(obj) {
//   let arr = []
//   for (let key of Object.keys(obj)) {
//     arr.push([key, obj[key]])
//   }
//   return arr
// }

// ===== Object.fromEntries() =====
// Object.fromEntries([
//   ['foo', 'bar'],
//   ['baz', 42],
// ])
// // { foo: "bar", baz: 42 }

// ===== Object.fromEntries() =====
// // 例一
// const entries = new Map([
//   ['foo', 'bar'],
//   ['baz', 42],
// ])
//
// Object.fromEntries(entries)
// // { foo: "bar", baz: 42 }
//
// // 例二
// const map = new Map().set('foo', true).set('bar', false)
// Object.fromEntries(map)
// // { foo: true, bar: false }

// ===== Object.fromEntries() =====
// Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'))
// // { foo: "bar", baz: "qux" }

// ===== Object.hasOwn() =====
// const foo = Object.create({ a: 123 })
// foo.b = 456
//
// Object.hasOwn(foo, 'a') // false
// Object.hasOwn(foo, 'b') // true

// ===== Object.hasOwn() =====
// const obj = Object.create(null)
//
// obj.hasOwnProperty('foo') // 报错
// Object.hasOwn(obj, 'foo') // false

// ===== Object.getOwnPropertyDescriptors() =====
// const obj = {
//   foo: 123,
//   get bar() {
//     return 'abc'
//   },
// }
//
// Object.getOwnPropertyDescriptors(obj)
// // { foo:
// //    { value: 123,
// //      writable: true,
// //      enumerable: true,
// //      configurable: true },
// //   bar:
// //    { get: [Function: get bar],
// //      set: undefined,
// //      enumerable: true,
// //      configurable: true } }

// ===== Object.getOwnPropertyDescriptors() =====
// function getOwnPropertyDescriptors(obj) {
//   const result = {}
//   for (let key of Reflect.ownKeys(obj)) {
//     result[key] = Object.getOwnPropertyDescriptor(obj, key)
//   }
//   return result
// }

// ===== Object.getOwnPropertyDescriptors() =====
// const source = {
//   set foo(value) {
//     console.log(value)
//   },
// }
//
// const target1 = {}
// Object.assign(target1, source)
//
// Object.getOwnPropertyDescriptor(target1, 'foo')
// // { value: undefined,
// //   writable: true,
// //   enumerable: true,
// //   configurable: true }

// ===== Object.getOwnPropertyDescriptors() =====
// const source = {
//   set foo(value) {
//     console.log(value)
//   },
// }
//
// const target2 = {}
// Object.defineProperties(target2, Object.getOwnPropertyDescriptors(source))
// Object.getOwnPropertyDescriptor(target2, 'foo')
// // { get: undefined,
// //   set: [Function: set foo],
// //   enumerable: true,
// //   configurable: true }

// ===== Object.getOwnPropertyDescriptors() =====
// const shallowMerge = (target, source) =>
//   Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))

// ===== Object.getOwnPropertyDescriptors() =====
// const clone = Object.create(
//   Object.getPrototypeOf(obj),
//   Object.getOwnPropertyDescriptors(obj),
// )
//
// // 或者
//
// const shallowClone = obj =>
//   Object.create(
//     Object.getPrototypeOf(obj),
//     Object.getOwnPropertyDescriptors(obj),
//   )

// ===== Object.getOwnPropertyDescriptors() =====
// const obj = {
//   __proto__: prot,
//   foo: 123,
// }

// ===== Object.getOwnPropertyDescriptors() =====
// const obj = Object.create(prot)
// obj.foo = 123
//
// // 或者
//
// const obj = Object.assign(Object.create(prot), {
//   foo: 123,
// })

// ===== Object.getOwnPropertyDescriptors() =====
// const obj = Object.create(
//   prot,
//   Object.getOwnPropertyDescriptors({
//     foo: 123,
//   }),
// )

// ===== Object.getOwnPropertyDescriptors() =====
// let mix = object => ({
//   with: (...mixins) =>
//     mixins.reduce(
//       (c, mixin) => Object.create(c, Object.getOwnPropertyDescriptors(mixin)),
//       object,
//     ),
// })
//
// // multiple mixins example
// let a = { a: 'a' }
// let b = { b: 'b' }
// let c = { c: 'c' }
// let d = mix(c).with(a, b)
//
// d.c // "c"
// d.b // "b"
// d.a // "a"

// ===== Object.getOwnPropertyDescriptors() =====
// // es5 的写法
// const obj = {
//   method: function() { ... }
// };
// obj.__proto__ = someOtherObj;
//
// // es6 的写法
// var obj = Object.create(someOtherObj);
// obj.method = function() { ... };

// ===== Object.getOwnPropertyDescriptors() =====
// Object.defineProperty(Object.prototype, '__proto__', {
//   get() {
//     let _thisObj = Object(this)
//     return Object.getPrototypeOf(_thisObj)
//   },
//   set(proto) {
//     if (this === undefined || this === null) {
//       throw new TypeError()
//     }
//     if (!isObject(this)) {
//       return undefined
//     }
//     if (!isObject(proto)) {
//       return undefined
//     }
//     let status = Reflect.setPrototypeOf(this, proto)
//     if (!status) {
//       throw new TypeError()
//     }
//   },
// })
//
// function isObject(value) {
//   return Object(value) === value
// }

// ===== Object.getOwnPropertyDescriptors() =====
// Object.getPrototypeOf({ __proto__: null })
// // null

// ===== Object.setPrototypeOf() =====
// // 格式
// Object.setPrototypeOf(object, prototype)
//
// // 用法
// const o = Object.setPrototypeOf({}, null)

// ===== Object.setPrototypeOf() =====
// function setPrototypeOf(obj, proto) {
//   obj.__proto__ = proto
//   return obj
// }

// ===== Object.setPrototypeOf() =====
// let proto = {}
// let obj = { x: 10 }
// Object.setPrototypeOf(obj, proto)
//
// proto.y = 20
// proto.z = 40
//
// obj.x // 10
// obj.y // 20
// obj.z // 40

// ===== Object.setPrototypeOf() =====
// Object.setPrototypeOf(1, {}) === 1 // true
// Object.setPrototypeOf('foo', {}) === 'foo' // true
// Object.setPrototypeOf(true, {}) === true // true

// ===== Object.setPrototypeOf() =====
// Object.setPrototypeOf(undefined, {})
// // TypeError: Object.setPrototypeOf called on null or undefined
//
// Object.setPrototypeOf(null, {})
// // TypeError: Object.setPrototypeOf called on null or undefined

// ===== Object.getPrototypeOf() =====
// Object.getPrototypeOf(obj)

// ===== Object.getPrototypeOf() =====
// function Rectangle() {
//   // ...
// }
//
// const rec = new Rectangle()
//
// Object.getPrototypeOf(rec) === Rectangle.prototype
// // true
//
// Object.setPrototypeOf(rec, Object.prototype)
// Object.getPrototypeOf(rec) === Rectangle.prototype
// // false

// ===== Object.getPrototypeOf() =====
// // 等同于 Object.getPrototypeOf(Number(1))
// Object.getPrototypeOf(1)
// // Number {[[PrimitiveValue]]: 0}
//
// // 等同于 Object.getPrototypeOf(String('foo'))
// Object.getPrototypeOf('foo')
// // String {length: 0, [[PrimitiveValue]]: ""}
//
// // 等同于 Object.getPrototypeOf(Boolean(true))
// Object.getPrototypeOf(true)
// // Boolean {[[PrimitiveValue]]: false}
//
// Object.getPrototypeOf(1) === Number.prototype // true
// Object.getPrototypeOf('foo') === String.prototype // true
// Object.getPrototypeOf(true) === Boolean.prototype // true

// ===== Object.getPrototypeOf() =====
// Object.getPrototypeOf(null)
// // TypeError: Cannot convert undefined or null to object
//
// Object.getPrototypeOf(undefined)
// // TypeError: Cannot convert undefined or null to object

