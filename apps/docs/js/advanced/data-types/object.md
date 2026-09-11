---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 对象的扩展

对象（object）是 JavaScript 最重要的数据结构。

## 1. 对象字面量增强

### 1.1 属性的简洁表示法

ES6 允许在大括号里面，直接写入变量和函数，作为对象的属性和方法。这样的书写更加简洁。

```js
const foo = 'bar'
const baz = { foo }
baz // {foo: "bar"}

// 等同于
const baz = { foo: foo }
```

属性名就是变量名，属性值就是变量值。函数返回值、CommonJS 模块导出用起来很方便：

```js
function f(x, y) {
  return { x, y }
}
f(1, 2) // Object {x: 1, y: 2}

function getPoint() {
  const x = 1
  const y = 10
  return { x, y }
}
getPoint() // {x:1, y:10}
```

除了属性简写，方法也可以简写：

```js
const o = {
  method() {
    return 'Hello!'
  },
}

// 等同于
const o = {
  method: function () {
    return 'Hello!'
  },
}
```

属性的取值器（getter）和赋值器（setter），事实上也是采用这种写法：

```js
const cart = {
  _wheels: 4,

  get wheels() {
    return this._wheels
  },

  set wheels(value) {
    if (value < this._wheels) {
      throw new Error('数值太小了！')
    }
    this._wheels = value
  },
}
```

简洁写法在打印对象时也很有用：

```js
let user = {
  name: 'test',
}

let foo = {
  bar: 'baz',
}

console.log(user, foo)
// {name: "test"} {bar: "baz"}
console.log({ user, foo })
// {user: {name: "test"}, foo: {bar: "baz"}}
```

注意，简写的对象方法不能用作构造函数，会报错：

```js
const obj = {
  f() {
    this.foo = 'bar'
  },
}

new obj.f() // 报错
```

### 1.2 属性名表达式

JavaScript 定义对象的属性，有两种方法：直接用标识符，或用表达式（放在方括号内）。

```js
// 方法一
obj.foo = true

// 方法二
obj['a' + 'bc'] = 123
```

ES5 中字面量定义对象只能用标识符，ES6 允许把表达式放在方括号内：

```js
let propKey = 'foo'

let obj = {
  [propKey]: true,
  ['a' + 'bc']: 123,
}
```

表达式还可以用于定义方法名：

```js
let obj = {
  ['h' + 'ello']() {
    return 'hi'
  },
}

obj.hello() // hi
```

注意，属性名表达式与简洁表示法，不能同时使用，会报错：

```js
// 报错
const foo = 'bar'
const baz = { [foo] }

// 正确
const foo = 'bar'
const baz = { [foo]: 'abc' }
```

注意，属性名表达式如果是一个对象，默认情况下会自动将对象转为字符串 `[object Object]`，这一点要特别小心：

```js
const keyA = { a: 1 }
const keyB = { b: 2 }

const myObject = {
  [keyA]: 'valueA',
  [keyB]: 'valueB',
}

myObject // Object {[object Object]: "valueB"}
```

`[keyA]` 和 `[keyB]` 得到的都是 `[object Object]`，所以 `[keyB]` 会把 `[keyA]` 覆盖掉。

### 1.3 方法的 name 属性

函数的 `name` 属性返回函数名，对象方法也是函数，因此也有 `name` 属性：

```js
const person = {
  sayName() {
    console.log('hello!')
  },
}

person.sayName.name // "sayName"
```

如果对象的方法使用了取值函数（`getter`）和存值函数（`setter`），则 `name` 属性在该方法属性的描述对象的 `get` 和 `set` 属性上面，返回值是方法名前加上 `get` 和 `set`：

```js
const obj = {
  get foo() {},
  set foo(x) {},
}

obj.foo.name
// TypeError: Cannot read property 'name' of undefined

const descriptor = Object.getOwnPropertyDescriptor(obj, 'foo')

descriptor.get.name // "get foo"
descriptor.set.name // "set foo"
```

有两种特殊情况：`bind` 方法创造的函数，`name` 属性返回 `bound` 加上原函数的名字；`Function` 构造函数创造的函数，`name` 属性返回 `anonymous`。

```js
new Function().name // "anonymous"

var doSomething = function () {
  // ...
}
doSomething.bind().name // "bound doSomething"
```

如果对象的方法是一个 Symbol 值，那么 `name` 属性返回的是这个 Symbol 值的描述：

```js
const key1 = Symbol('description')
const key2 = Symbol()
let obj = {
  [key1]() {},
  [key2]() {},
}
obj[key1].name // "[description]"
obj[key2].name // ""
```

### 1.4 属性的可枚举性和遍历

#### 1.4.1 可枚举性

对象的每个属性都有一个描述对象（Descriptor），用来控制该属性的行为。`Object.getOwnPropertyDescriptor` 方法可以获取该属性的描述对象：

```js
let obj = { foo: 123 }
Object.getOwnPropertyDescriptor(obj, 'foo')
//  {
//    value: 123,
//    writable: true,    //可读写(读取和修改改数据)
//    enumerable: true,  //可枚举(for循环遍历)
//    configurable: true  //可扩展(新增和删除)
//  }
```

描述对象的 `enumerable` 属性，称为"**可枚举性**"，如果该属性为 `false`，就表示某些操作会忽略当前属性。

目前，有四个操作会忽略 `enumerable` 为 `false` 的属性：

- `for...in` 循环：只遍历对象自身的和继承的可枚举的属性。
- `Object.keys()`：返回对象自身的所有可枚举的属性的键名。
- `JSON.stringify()`：只串行化对象自身的可枚举的属性。
- `Object.assign()`：忽略 `enumerable` 为 `false` 的属性，只拷贝对象自身的可枚举的属性。

其中，只有 `for...in` 会返回继承的属性，其他三个方法都会忽略继承的属性。引入"**可枚举**"的最初目的，就是让某些属性可以规避掉 `for...in` 操作。比如，对象原型的 `toString` 方法，以及数组的 `length` 属性，`enumerable` 都是 `false`，因此不会被遍历到：

```js
Object.getOwnPropertyDescriptor(Object.prototype, 'toString').enumerable
// false

Object.getOwnPropertyDescriptor([], 'length').enumerable
// false
```

另外，ES6 规定，所有 Class 的原型的方法都是不可枚举的：

```js
Object.getOwnPropertyDescriptor(
  class {
    foo() {}
  }.prototype,
  'foo',
).enumerable
// false
```

总的来说，操作中引入继承的属性会让问题复杂化，大多数时候只关心对象自身的属性。所以尽量不要用 `for...in` 循环，而用 `Object.keys()` 代替。

#### 1.4.2 属性的遍历

ES6 一共有 5 种方法可以遍历对象的属性：

[width(42,10,14,12,22)]

| 方法                                    | 继承属性 | 不可枚举属性 | Symbol 属性 | 返回值                          |
| :-------------------------------------- | :------: | :----------: | :---------: | :------------------------------ |
| **`for...in`**                          |    ✅    |      ❌      |     ❌      | 逐个迭代键名                    |
| **`Object.keys(obj)`**                  |    ❌    |      ❌      |     ❌      | 字符串键名数组                  |
| **`Object.getOwnPropertyNames(obj)`**   |    ❌    |      ✅      |     ❌      | 字符串键名数组                  |
| **`Object.getOwnPropertySymbols(obj)`** |    ❌    |      ✅      |     ✅      | Symbol 键名数组                 |
| **`Reflect.ownKeys(obj)`**              |    ❌    |      ✅      |     ✅      | 所有键名数组（字符串 + Symbol） |

> 前两种只拿到**可枚举**属性；`for...in` 是唯一会把**继承**属性也算进来的方法。

```js
Reflect.ownKeys({ [Symbol()]: 0, b: 0, 10: 0, 2: 0, a: 0 })
// ['2', '10', 'b', 'a', Symbol()]
```

### 1.5 super 关键字

`this` 关键字总是指向函数所在的当前对象，ES6 又新增了另一个类似的关键字 `super`，指向当前对象的原型对象：

```js
const proto = {
  foo: 'hello',
}

const obj = {
  foo: 'world',
  find() {
    return super.foo
  },
}

Object.setPrototypeOf(obj, proto)
obj.find() // "hello"
```

注意，`super` 关键字表示原型对象时，只能用在对象的方法之中，用在其他地方都会报错：

```js
// 报错
const obj = {
  foo: super.foo,
}

// 报错
const obj = {
  foo: () => super.foo,
}

// 报错
const obj = {
  foo: function () {
    return super.foo
  },
}
```

目前，只有对象方法的简写法可以让 JavaScript 引擎确认定义的是对象的方法。

JavaScript 引擎内部，`super.foo` 等同于 `Object.getPrototypeOf(this).foo`（属性）或 `Object.getPrototypeOf(this).foo.call(this)`（方法）：

```js
const proto = {
  x: 'hello',
  foo() {
    console.log(this.x)
  },
}

const obj = {
  x: 'world',
  foo() {
    super.foo()
  },
}

Object.setPrototypeOf(obj, proto)

obj.foo() // "world"
```

`super.foo` 指向原型对象 `proto` 的 `foo` 方法，但绑定的 `this` 还是当前对象 `obj`，因此输出 `world`。

### 1.6 对象的扩展运算符

《数组的扩展》一章中，已经介绍过扩展运算符（`...`）。ES2018 将这个运算符[引入](https://github.com/sebmarkbage/ecmascript-rest-spread)了对象。

#### 1.6.1 解构赋值

对象的解构赋值用于从一个对象取值，相当于将目标对象自身的所有可遍历的（enumerable）、但尚未被读取的属性，分配到指定的对象上面：

```js
let { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 }
x // 1
y // 2
z // { a: 3, b: 4 }
```

由于解构赋值要求等号右边是一个对象，所以如果等号右边是 `undefined` 或 `null`，就会报错：

```js
let { ...z } = null // 运行时错误
let { ...z } = undefined // 运行时错误
```

解构赋值必须是最后一个参数，否则会报错：

```js
let { ...x, y, z } = someObject // 句法错误
let { x, ...y, ...z } = someObject // 句法错误
```

注意，解构赋值的拷贝是浅拷贝。如果键的值是复合类型的值（数组、对象、函数），拷贝的是这个值的引用，而不是副本：

```js
let obj = { a: { b: 1 } }
let { ...x } = obj
obj.a.b = 2
x.a.b // 2
```

另外，扩展运算符的解构赋值，不能复制继承自原型对象的属性：

```js
let o1 = { a: 1 }
let o2 = { b: 2 }
o2.__proto__ = o1
let { ...o3 } = o2
o3 // { b: 2 }
o3.a // undefined
```

变量声明语句之中，如果使用解构赋值，扩展运算符后面必须是一个变量名，而不能是一个解构赋值表达式：

```js
let { x, ...{ y, z } } = o
// SyntaxError: ... must be followed by an identifier in declaration contexts
```

#### 1.6.2 扩展运算符

对象的扩展运算符（`...`）用于取出参数对象的所有可遍历属性，拷贝到当前对象之中：

```js
let z = { a: 3, b: 4 }
let n = { ...z }
n // { a: 3, b: 4 }
```

由于数组是特殊的对象，所以对象的扩展运算符也可以用于数组：

```js
let foo = { ...['a', 'b', 'c'] }
foo
// {0: "a", 1: "b", 2: "c"}
```

如果扩展运算符后面是空对象，则没有任何效果；如果不是对象，会自动将其转为对象：

```js
{ ...{}, a: 1 }
// { a: 1 }

{ ...1 } // {}（等同于 {...Object(1)}）
{ ...true } // {}
{ ...undefined } // {}
{ ...null } // {}
```

但如果扩展运算符后面是字符串，它会自动转成一个类似数组的对象，因此返回的不是空对象：

```js
{ ...'hello' }
// {0: "h", 1: "e", 2: "l", 3: "l", 4: "o"}
```

对象的扩展运算符,只会返回参数对象自身的、可枚举的属性，这一点要特别小心,尤其是用于类的实例对象时：

```js
class C {
  p = 12
  m() {}
}

let c = new C()
let clone = { ...c }

clone.p // ok
clone.m() // 报错（m 定义在 C 的原型对象上）
```

对象的扩展运算符等同于使用 `Object.assign()` 方法：

```js
let aClone = { ...a }
// 等同于
let aClone = Object.assign({}, a)
```

如果想完整克隆一个对象（连同原型属性），可以采用下面的写法：

```js
// 写法一
const clone1 = {
  __proto__: Object.getPrototypeOf(obj),
  ...obj,
}

// 写法二
const clone2 = Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)

// 写法三
const clone3 = Object.create(
  Object.getPrototypeOf(obj),
  Object.getOwnPropertyDescriptors(obj),
)
```

写法一的 `__proto__` 属性在非浏览器环境不一定部署，推荐使用写法二和写法三。

扩展运算符可以用于合并两个对象：

```js
let ab = { ...a, ...b }
// 等同于
let ab = Object.assign({}, a, b)
```

如果用户自定义的属性放在扩展运算符后面，则扩展运算符内部的同名属性会被覆盖掉：

```js
let aWithOverrides = { ...a, x: 1, y: 2 }
// 等同于
let aWithOverrides = Object.assign({}, a, { x: 1, y: 2 })
```

这用来修改现有对象部分的属性就很方便了：

```js
let newVersion = {
  ...previousVersion,
  name: 'New Name', // Override the name property
}
```

如果把自定义属性放在扩展运算符前面，就变成了设置新对象的默认属性值：

```js
let aWithDefaults = { x: 1, y: 2, ...a }
// 等同于
let aWithDefaults = Object.assign({}, { x: 1, y: 2 }, a)
```

与数组的扩展运算符一样，对象的扩展运算符后面可以跟表达式：

```js
const obj = {
  ...(x > 1 ? { a: 1 } : {}),
  b: 2,
}
```

扩展运算符的参数对象之中，如果有取值函数 `get`，这个函数是会执行的：

```js
let a = {
  get x() {
    throw new Error('not throw yet')
  },
}

let aWithXGetter = { ...a } // 报错
```

## 2.[Object常用静态方法扩展(Static Methods)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)

这些方法直接通过 Object. 调用。

### Object.is()

ES5 比较两个值是否相等，只有相等运算符（`==`）和严格相等运算符（`===`）。它们都有缺点：前者会自动转换数据类型，后者的 `NaN` 不等于自身，以及 `+0` 等于 `-0`。

ES6 提出"**Same-value equality**"（同值相等）算法，`Object.is` 就是部署这个算法的新方法，用来比较两个值是否严格相等，与 `===` 行为基本一致：

```js
Object.is('foo', 'foo')
// true
Object.is({}, {})
// false
```

不同之处只有两个：一是 `+0` 不等于 `-0`，二是 `NaN` 等于自身：

```js
;+0 === -0 // true
NaN === NaN // false

Object.is(+0, -0) // false
Object.is(NaN, NaN) // true
```

### Object.assign()

`Object.assign()` 方法用于对象的合并，将源对象（source）的所有可枚举属性，复制到目标对象（target）：

```js
const target = { a: 1 }

const source1 = { b: 2 }
const source2 = { c: 3 }

Object.assign(target, source1, source2)
target // {a:1, b:2, c:3}
```

第一个参数是目标对象，后面的参数都是源对象。如果目标对象与源对象有同名属性，或多个源对象有同名属性，则后面的属性会覆盖前面的属性：

```js
const target = { a: 1, b: 1 }

const source1 = { b: 2, c: 2 }
const source2 = { c: 3 }

Object.assign(target, source1, source2)
target // {a:1, b:2, c:3}
```

如果只有一个参数，`Object.assign()` 会直接返回该参数；如果该参数不是对象，则会先转成对象再返回：

```js
const obj = { a: 1 }
Object.assign(obj) === obj // true

typeof Object.assign(2) // "object"
```

由于 `undefined` 和 `null` 无法转成对象，所以如果它们作为首参数，就会报错；但如果它们不在首参数，则会被跳过、不会报错：

```js
Object.assign(undefined) // 报错
Object.assign(null) // 报错

let obj = { a: 1 }
Object.assign(obj, undefined) === obj // true
Object.assign(obj, null) === obj // true
```

数值、字符串和布尔值不在首参数也不会报错。但除了字符串会以数组形式拷贝入目标对象，其他值都不会产生效果：

```js
const v1 = 'abc'
const v2 = true
const v3 = 10

const obj = Object.assign({}, v1, v2, v3)
console.log(obj) // { "0": "a", "1": "b", "2": "c" }
```

只有字符串的包装对象会产生可枚举属性，所以能被拷贝：

```js
Object(true) // {[[PrimitiveValue]]: true}
Object(10) //  {[[PrimitiveValue]]: 10}
Object('abc') // {0: "a", 1: "b", 2: "c", length: 3, [[PrimitiveValue]]: "abc"}
```

`Object.assign()` 只拷贝源对象的自身属性（不拷贝继承属性），也不拷贝不可枚举的属性（`enumerable: false`）：

```js
Object.assign(
  { b: 'c' },
  Object.defineProperty({}, 'invisible', {
    enumerable: false,
    value: 'hello',
  }),
)
// { b: 'c' }
```

属性名为 Symbol 值的属性，也会被 `Object.assign()` 拷贝：

```js
Object.assign({ a: 'b' }, { [Symbol('c')]: 'd' })
// { a: 'b', Symbol(c): 'd' }
```

**（1）浅拷贝**

`Object.assign()` 实行的是浅拷贝，而不是深拷贝。如果源对象某个属性的值是对象，那么目标对象拷贝得到的是这个对象的引用：

```js
const obj1 = { a: { b: 1 } }
const obj2 = Object.assign({}, obj1)

obj1.a.b = 2
obj2.a.b // 2
```

**（2）同名属性的替换**

对于嵌套的对象，一旦遇到同名属性，`Object.assign()` 的处理方法是替换，而不是添加：

```js
const target = { a: { b: 'c', d: 'e' } }
const source = { a: { b: 'hello' } }
Object.assign(target, source)
// { a: { b: 'hello' } }
```

**（3）数组的处理**

`Object.assign()` 可以用来处理数组，但会把数组视为对象：

```js
Object.assign([1, 2, 3], [4, 5])
// [4, 5, 3]
```

**（4）取值函数的处理**

`Object.assign()` 只能进行值的复制，如果要复制的值是一个取值函数，那么将求值后再复制：

```js
const source = {
  get foo() {
    return 1
  },
}
const target = {}

Object.assign(target, source)
// { foo: 1 }
```

`Object.assign()` 方法有很多用处：

[width(15,38,47)]

| 用途                     | 写法                                                          | 说明                                                                                     |
| :----------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| **为对象批量添加属性**   | `Object.assign(this, { x, y })`                               | 批量挂载多个属性，直接改 `this`                                                          |
| **为对象或原型添加方法** | `Object.assign(SomeClass.prototype, { someMethod() {} })`     | 一次性给原型装上多个方法，比逐个赋值简洁                                                 |
| **克隆对象（浅拷贝）**   | `const clone = origin => Object.assign({}, origin)`           | 需要保留原型链时用 `Object.assign(Object.create(Object.getPrototypeOf(origin)), origin)` |
| **合并多个对象为一个**   | `const merge = (...sources) => Object.assign({}, ...sources)` | 第一个参数是空对象，因此不修改任何源对象                                                 |
| **为可选属性指定默认值** | `Object.assign({}, DEFAULTS, options)`                        | 按顺序覆盖：用户传了的用用户的值，没传的落回默认值                                       |

**为可选属性指定默认值**的例子：

```js
const DEFAULTS = {
  logLevel: 0,
  outputFormat: 'html',
}

function processContent(options) {
  options = Object.assign({}, DEFAULTS, options)
  console.log(options)
  // ...
}
```

注意，由于存在浅拷贝的问题，`DEFAULTS` 对象和 `options` 对象的所有属性的值，最好都是简单类型，不要指向另一个对象：

```js
const DEFAULTS = {
  url: {
    host: 'example.com',
    port: 7070,
  },
}

processContent({ url: { port: 8000 } })
// { url: {port: 8000} }（url.host 被覆盖丢失）
```

### Object.keys()

ES5 引入了 `Object.keys` 方法，返回一个数组，成员是参数对象自身的（不含继承的）所有可遍历（enumerable）属性的键名：

```js
var obj = { foo: 'bar', baz: 42 }
Object.keys(obj)
// ["foo", "baz"]
```

ES2017 [引入](https://github.com/tc39/proposal-object-values-entries)了跟 `Object.keys` 配套的 `Object.values` 和 `Object.entries`，作为遍历一个对象的补充手段，供 `for...of` 循环使用：

```js
let { keys, values, entries } = Object
let obj = { a: 1, b: 2, c: 3 }

for (let key of keys(obj)) {
  console.log(key) // 'a', 'b', 'c'
}

for (let value of values(obj)) {
  console.log(value) // 1, 2, 3
}

for (let [key, value] of entries(obj)) {
  console.log([key, value]) // ['a', 1], ['b', 2], ['c', 3]
}
```

### Object.values()

`Object.values` 方法返回一个数组，成员是参数对象自身的（不含继承的）所有可遍历（enumerable）属性的键值：

```js
const obj = { foo: 'bar', baz: 42 }
Object.values(obj)
// ["bar", 42]
```

返回数组的成员顺序，与《属性的遍历》部分介绍的排列规则一致（数值键按升序）：

```js
const obj = { 100: 'a', 2: 'b', 7: 'c' }
Object.values(obj)
// ["b", "c", "a"]
```

`Object.values` 只返回对象自身的可遍历属性：

```js
const obj = Object.create({}, { p: { value: 42 } })
Object.values(obj) // []（p 默认 enumerable: false）

const obj2 = Object.create(
  {},
  {
    p: {
      value: 42,
      enumerable: true,
    },
  },
)
Object.values(obj2) // [42]
```

`Object.values` 会过滤属性名为 Symbol 值的属性：

```js
Object.values({ [Symbol()]: 123, foo: 'abc' })
// ['abc']
```

如果参数是一个字符串，会返回各个字符组成的一个数组；如果参数不是对象，会先转为对象（数值和布尔值的包装对象没有非继承属性，所以返回空数组）：

```js
Object.values('foo')
// ['f', 'o', 'o']

Object.values(42) // []
Object.values(true) // []
```

### Object.entries()

`Object.entries()` 方法返回一个数组，成员是参数对象自身的（不含继承的）所有可遍历（enumerable）属性的键值对数组：

```js
const obj = { foo: 'bar', baz: 42 }
Object.entries(obj)
// [ ["foo", "bar"], ["baz", 42] ]
```

除了返回值不一样，该方法的行为与 `Object.values` 基本一致。如果原对象的属性名是一个 Symbol 值，该属性会被忽略：

```js
Object.entries({ [Symbol()]: 123, foo: 'abc' })
// [ [ 'foo', 'abc' ] ]
```

基本用途是遍历对象的属性，另一个用处是将对象转为真正的 `Map` 结构：

```js
let obj = { one: 1, two: 2 }
for (let [k, v] of Object.entries(obj)) {
  console.log(`${JSON.stringify(k)}: ${JSON.stringify(v)}`)
}
// "one": 1
// "two": 2

const map = new Map(Object.entries({ foo: 'bar', baz: 42 }))
map // Map { foo: "bar", baz: 42 }
```

### Object.fromEntries()

`Object.fromEntries()` 方法是 `Object.entries()` 的逆操作，用于将一个键值对数组转为对象：

```js
Object.fromEntries([
  ['foo', 'bar'],
  ['baz', 42],
])
// { foo: "bar", baz: 42 }
```

该方法的主要目的，是将键值对的数据结构还原为对象，特别适合将 Map 结构转为对象：

```js
// 例一
const entries = new Map([
  ['foo', 'bar'],
  ['baz', 42],
])

Object.fromEntries(entries)
// { foo: "bar", baz: 42 }

// 例二
const map = new Map().set('foo', true).set('bar', false)
Object.fromEntries(map)
// { foo: true, bar: false }
```

它的一个用处是配合 `URLSearchParams` 对象，将查询字符串转为对象：

```js
Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'))
// { foo: "bar", baz: "qux" }
```

### Object.hasOwn()

JavaScript 对象的属性分成两种：自身的属性和继承的属性。ES2022 在 `Object` 对象上面新增了一个静态方法 [`Object.hasOwn()`](https://github.com/tc39/proposal-accessible-object-hasownproperty)，判断某个属性是否为对象自身的属性：

```js
const foo = Object.create({ a: 123 })
foo.b = 456

Object.hasOwn(foo, 'a') // false
Object.hasOwn(foo, 'b') // true
```

`Object.hasOwn()` 的一个好处是，对于不继承 `Object.prototype` 的对象不会报错，而 `hasOwnProperty()` 是会报错的：

```js
const obj = Object.create(null)

obj.hasOwnProperty('foo') // 报错
Object.hasOwn(obj, 'foo') // false
```

### Object.getOwnPropertyDescriptors()

ES2017 引入了 `Object.getOwnPropertyDescriptors()` 方法，返回指定对象所有自身属性（非继承属性）的描述对象：

```js
const obj = {
  foo: 123,
  get bar() {
    return 'abc'
  },
}

Object.getOwnPropertyDescriptors(obj)
// { foo:
//    { value: 123,
//      writable: true,
//      enumerable: true,
//      configurable: true },
//   bar:
//    { get: [Function: get bar],
//      set: undefined,
//      enumerable: true,
//      configurable: true } }
```

该方法的引入目的，主要是为了解决 `Object.assign()` 无法正确拷贝 `get` 属性和 `set` 属性的问题：

```js
const source = {
  set foo(value) {
    console.log(value)
  },
}

const target1 = {}
Object.assign(target1, source)
Object.getOwnPropertyDescriptor(target1, 'foo')
// { value: undefined, ... }（set 方法没被拷贝）

const target2 = {}
Object.defineProperties(target2, Object.getOwnPropertyDescriptors(source))
Object.getOwnPropertyDescriptor(target2, 'foo')
// { get: undefined, set: [Function: set foo], ... }（正确拷贝）
```

它还可以配合 `Object.create()` 方法，将对象属性（含 getter/setter）克隆到一个新对象（浅拷贝）：

```js
const clone = Object.create(
  Object.getPrototypeOf(obj),
  Object.getOwnPropertyDescriptors(obj),
)
```

`Object.getOwnPropertyDescriptors()` 也可以用来实现 Mixin（混入）模式：

```js
let mix = object => ({
  with: (...mixins) =>
    mixins.reduce(
      (c, mixin) => Object.create(c, Object.getOwnPropertyDescriptors(mixin)),
      object,
    ),
})

let a = { a: 'a' }
let b = { b: 'b' }
let c = { c: 'c' }
let d = mix(c).with(a, b)

d.c // "c"
d.b // "b"
d.a // "a"
```

---

JavaScript 语言的对象继承是通过**原型链**实现的。ES6 提供了更多**原型对象**的操作方法。

**`__proto__` 属性**

`__proto__` 属性（前后各两个下划线），用来读取或设置当前对象的原型对象（prototype）。目前，所有浏览器（包括 IE11）都部署了这个属性：

```js
// es5 的写法
const obj = {
  method: function () {
    // ...
  },
}
obj.__proto__ = someOtherObj

// es6 的写法
var obj = Object.create(someOtherObj)
obj.method = function () {
  // ...
}
```

该属性没有写入 ES6 的正文，而是写入了附录。标准明确规定，只有浏览器必须部署这个属性，其他运行环境不一定需要部署，而且新的代码最好认为这个属性是不存在的。因此，无论从语义的角度，还是从兼容性的角度，都不要使用这个属性，而是使用 `Object.setPrototypeOf()`（写操作）、`Object.getPrototypeOf()`（读操作）、`Object.create()`（生成操作）代替。

实现上，`__proto__`调用的是`Object.prototype.__proto__`，具体实现如下。

```javascript
Object.defineProperty(Object.prototype, '__proto__', {
  get() {
    let _thisObj = Object(this)
    return Object.getPrototypeOf(_thisObj)
  },
  set(proto) {
    if (this === undefined || this === null) {
      throw new TypeError()
    }
    if (!isObject(this)) {
      return undefined
    }
    if (!isObject(proto)) {
      return undefined
    }
    let status = Reflect.setPrototypeOf(this, proto)
    if (!status) {
      throw new TypeError()
    }
  },
})

function isObject(value) {
  return Object(value) === value
}
```

如果一个对象本身部署了 `__proto__` 属性，该属性的值就是对象的原型：

```js
Object.getPrototypeOf({ __proto__: null })
// null
```

### Object.setPrototypeOf()

`Object.setPrototypeOf` 方法的作用与 `__proto__` 相同，用来设置一个对象的原型对象（prototype），返回参数对象本身。它是 ES6 正式推荐的设置原型对象的方法：

```js
// 格式
Object.setPrototypeOf(object, prototype)

// 用法
const o = Object.setPrototypeOf({}, null)
```

```js
let proto = {}
let obj = { x: 10 }
Object.setPrototypeOf(obj, proto)

proto.y = 20
proto.z = 40

obj.x // 10
obj.y // 20
obj.z // 40
```

如果第一个参数不是对象，会自动转为对象。但由于返回的还是第一个参数，所以这个操作不会产生任何效果：

```js
Object.setPrototypeOf(1, {}) === 1 // true
Object.setPrototypeOf('foo', {}) === 'foo' // true
Object.setPrototypeOf(true, {}) === true // true
```

由于 `undefined` 和 `null` 无法转为对象，所以如果第一个参数是 `undefined` 或 `null`，就会报错：

```js
Object.setPrototypeOf(undefined, {})
// TypeError: Object.setPrototypeOf called on null or undefined

Object.setPrototypeOf(null, {})
// TypeError: Object.setPrototypeOf called on null or undefined
```

### Object.getPrototypeOf()

该方法与 `Object.setPrototypeOf` 方法配套，用于读取一个对象的原型对象：

```js
Object.getPrototypeOf(obj)
```

```js
function Rectangle() {
  // ...
}

const rec = new Rectangle()

Object.getPrototypeOf(rec) === Rectangle.prototype
// true

Object.setPrototypeOf(rec, Object.prototype)
Object.getPrototypeOf(rec) === Rectangle.prototype
// false
```

如果参数不是对象，会被自动转为对象：

```js
// 等同于 Object.getPrototypeOf(Number(1))
Object.getPrototypeOf(1)
// Number {[[PrimitiveValue]]: 0}

// 等同于 Object.getPrototypeOf(String('foo'))
Object.getPrototypeOf('foo')
// String {length: 0, [[PrimitiveValue]]: ""}

// 等同于 Object.getPrototypeOf(Boolean(true))
Object.getPrototypeOf(true)
// Boolean {[[PrimitiveValue]]: false}

Object.getPrototypeOf(1) === Number.prototype // true
Object.getPrototypeOf('foo') === String.prototype // true
Object.getPrototypeOf(true) === Boolean.prototype // true
```

如果参数是 `undefined` 或 `null`，它们无法转为对象，所以会报错：

```js
Object.getPrototypeOf(null)
// TypeError: Cannot convert undefined or null to object

Object.getPrototypeOf(undefined)
// TypeError: Cannot convert undefined or null to object
```

## **3. 常见问题与陷阱 (FAQ)**

### 3.1 `Object.assign` 和扩展运算符 `...` 是深拷贝吗？

- **不是，它们都是浅拷贝**。如果属性值是对象，拷贝的只是引用。如果需要深拷贝，请使用 `structuredClone()` (现代浏览器) 或 `JSON.parse(JSON.stringify())` 或 Lodash `_.cloneDeep()`。

### 3.2 扩展运算符 `...` 和 `Object.assign` 有区别吗？

- **`Object.assign`**: 会触发目标对象的 `setters`。
- **扩展运算符**: 定义新的属性，**不会**触发 `setters`。
- 在绝大多数简单合并场景下，两者效果一致，推荐使用更简洁的 `...`。

### 3.3 为什么 `Object.keys` 不返回 Symbol 属性？

- `Object.keys`、`Object.values`、`for...in` 循环都会**忽略 Symbol 属性**。
- 如果要获取 Symbol 属性，需要使用 `Object.getOwnPropertySymbols(obj)`。
- 如果要获取所有属性（包括 String 和 Symbol），可以使用 `Reflect.ownKeys(obj)`。

### 3.4 如何遍历对象？哪种方式最好？

- **`for...in`**: 遍历自身和**继承**的可枚举属性。通常不推荐，除非你需要遍历原型链。
- **`Object.keys(obj).forEach(...)`**: 遍历自身可枚举属性。常用。
- **`for (const [key, val] of Object.entries(obj))`**: 现代、最推荐的遍历方式，可以直接解构键值。

### 3.5 什么是"可枚举性" (Enumerability)？

- 对象的每个属性都有一个描述符 `enumerable`。如果为 `false`，该属性就不会出现在 `for...in` 循环和 `Object.keys()` 中。`class` 的原型方法默认就是不可枚举的。
