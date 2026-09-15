# Class 的继承

继承允许一个类（子类）获取另一个类（父类）的属性和方法。JavaScript 用 `extends` 和 `super` 两个关键字，提供了一套清晰的继承方案。

## 1. Class继承核心语法

Class 可以通过`extends`关键字实现继承，让子类继承父类的属性和方法。extends 的写法比 ES5 的原型链继承，要清晰和方便很多。

```js
class Point {}

class ColorPoint extends Point {}
```

`ColorPoint` 通过 `extends` 继承了 `Point` 的所有属性和方法；因为没有写任何代码，两个类完全一样。

在 `ColorPoint` 内部加上代码：

```js
class Point {
  /* ... */
}

class ColorPoint extends Point {
  constructor(x, y, color) {
    super(x, y) // 调用父类的constructor(x, y)
    this.color = color
  }

  toString() {
    return this.color + ' ' + super.toString() // 调用父类的toString()
  }
}
```

`constructor()` 和 `toString()` 内部都出现了 `super`，它在这里表示父类的构造函数，用来新建一个父类的实例对象。

ES6 规定，子类必须在`constructor()`方法中调用`super()`，否则就会报错。这是因为子类自己的`this`对象，必须先通过父类的构造函数完成塑造，得到与父类同样的实例属性和方法，然后再对其进行加工，添加子类自己的实例属性和方法。如果不调用`super()`方法，子类就得不到自己的`this`对象。

```js
class Point {
  /* ... */
}

class ColorPoint extends Point {
  constructor() {}
}

let cp = new ColorPoint() // ReferenceError
```

`ColorPoint` 的构造函数没有调用 `super()`，导致新建实例时报错。

ES5 的继承是“**实例在前，继承在后**”：先创建子类实例对象，再把父类的方法加到这个对象上。ES6 则相反，先把父类的属性和方法加到空对象上，再把它作为子类的实例，即“**继承在前，实例在后**”。`super()` 就是生成这个 `this` 对象的一步，没有它就无法继承父类。

注意，这意味着新建子类实例时，父类的构造函数必定会先运行一次。

```js
class Foo {
  constructor() {
    console.log(1)
  }
}

class Bar extends Foo {
  constructor() {
    super()
    console.log(2)
  }
}

const bar = new Bar()
// 1
// 2
```

子类新建实例时会先执行一次父类构造函数，所以依次输出 1、2。

另一个需要注意的地方是，在子类的构造函数中，只有调用`super()`之后，才可以使用`this`关键字，否则会报错。这是因为子类实例的构建，必须先完成父类的继承，只有`super()`方法才能让子类实例继承父类。

```js
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class ColorPoint extends Point {
  constructor(x, y, color) {
    this.color = color // ReferenceError
    super(x, y)
    this.color = color // 正确
  }
}
```

在 `super()` 之前使用 `this` 会报错，放在 `super()` 之后才是正确的。

如果子类没有定义`constructor()`方法，这个方法会默认添加，并且里面会调用`super()`。也就是说，不管有没有显式定义，任何一个子类都有`constructor()`方法。

```js
class ColorPoint extends Point {}

// 等同于
class ColorPoint extends Point {
  constructor(...args) {
    super(...args)
  }
}
```

```js
let cp = new ColorPoint(25, 8, 'green')

cp instanceof ColorPoint // true
cp instanceof Point // true
```

`cp` 同时是 `ColorPoint` 和 `Point` 的实例，这与 ES5 的行为完全一致。

### 1.1 私有属性和私有方法的继承

父类的属性和方法都会被子类继承，除了私有的属性和方法——私有成员只能在定义它的 class 内部使用。

子类无法继承父类的私有属性，或者说，私有属性只能在定义它的 class 里面使用。

```js
class Foo {
  #p = 1
  #m() {
    console.log('hello')
  }
}

class Bar extends Foo {
  constructor() {
    super()
    console.log(this.#p) // 报错
    this.#m() // 报错
  }
}
```

子类访问父类的私有属性或私有方法，都会报错。

如果父类定义了私有属性的读写方法，子类就可以通过这些方法，读写私有属性。

```js
class Foo {
  #p = 1
  getP() {
    return this.#p
  }
}

class Bar extends Foo {
  constructor() {
    super()
    console.log(this.getP()) // 1
  }
}
```

### 1.2 静态属性和静态方法的继承

父类的静态属性和静态方法，也会被子类继承。

```js
class A {
  static hello() {
    console.log('hello world')
  }
}

class B extends A {}

B.hello() // hello world
```

注意，静态属性是通过浅拷贝实现继承的。

```js
class A {
  static foo = 100
}
class B extends A {
  constructor() {
    super()
    B.foo--
  }
}

const b = new B()
B.foo // 99
A.foo // 100
```

`B` 继承静态属性时采用**浅拷贝**，拷贝的是属性的值，所以 `A.foo` 和 `B.foo` 是两个彼此独立的属性。

但是，由于这种拷贝是浅拷贝，如果父类的静态属性的值是一个对象，那么子类的静态属性也会指向这个对象，因为浅拷贝只会拷贝对象的内存地址。

```js
class A {
  static foo = { n: 100 }
}

class B extends A {
  constructor() {
    super()
    B.foo.n--
  }
}

const b = new B()
B.foo.n // 99
A.foo.n // 99
```

浅拷贝只拷贝对象的内存地址，导致 `B.foo` 和 `A.foo` 指向同一个对象，子类修改它的属性值会影响到父类。

### 1.3 super 关键字

`super`这个关键字，既可以当作函数使用，也可以当作对象使用。在这两种情况下，它的用法完全不同。

第一种情况，`super`作为函数调用时，代表父类的构造函数。ES6 要求，子类的构造函数必须执行一次`super()`函数。

```js
class A {}

class B extends A {
  constructor() {
    super()
  }
}
```

调用`super()`的作用是形成子类的`this`对象，把父类的实例属性和方法放到这个`this`对象上面。子类在调用`super()`之前，是没有`this`对象的，任何对`this`的操作都要放在`super()`的后面。

注意，这里的`super`虽然代表了父类的构造函数，但是因为返回的是子类的`this`（即子类的实例对象），所以`super`内部的`this`代表子类的实例，而不是父类的实例，这里的`super()`相当于`A.prototype.constructor.call(this)`（在子类的`this`上运行父类的构造函数）。

```js
class A {
  constructor() {
    console.log(new.target.name)
  }
}
class B extends A {
  constructor() {
    super()
  }
}
new A() // A
new B() // B
```

`new.target` 指向当前正在执行的函数；在 `super()` 执行时（`new B()`）它指向子类 `B`，所以 `super()` 内部的 `this` 指向 `B`。

不过，由于`super()`在子类构造方法中执行时，子类的属性和方法还没有绑定到`this`，所以如果存在同名属性，此时拿到的是父类的属性。

```js
class A {
  name = 'A'
  constructor() {
    console.log('My name is ' + this.name)
  }
}

class B extends A {
  name = 'B'
}

const b = new B() // My name is A
```

输出的是 `A`：`super()` 执行时 `B` 的 `name` 还没绑定到 `this`，此时拿到的是父类的同名属性。

作为函数时，`super()`只能用在子类的构造函数之中，用在其他地方就会报错。

```js
class A {}

class B extends A {
  m() {
    super(); // 报错
  }
}
```

第二种情况，`super`作为对象时，在普通方法中，指向父类的原型对象；在静态方法中，指向父类。

```js
class A {
  p() {
    return 2
  }
}

class B extends A {
  constructor() {
    super()
    console.log(super.p()) // 2
  }
}

let b = new B()
```

`super` 在普通方法中指向 `A.prototype`，所以 `super.p()` 就相当于 `A.prototype.p()`。

这里需要注意，由于`super`指向父类的原型对象，所以定义在父类实例上的方法或属性，是无法通过`super`调用的。

```js
class A {
  constructor() {
    this.p = 2
  }
}

class B extends A {
  get m() {
    return super.p
  }
}

let b = new B()
b.m // undefined
```

`p` 是父类 `A` **实例**的属性，`super` 指向的是原型对象，因此引用不到它。

如果属性定义在父类的原型对象上，`super`就可以取到。

```js
class A {}
A.prototype.x = 2

class B extends A {
  constructor() {
    super()
    console.log(super.x) // 2
  }
}

let b = new B()
```

ES6 规定，在子类普通方法中通过`super`调用父类的方法时，方法内部的`this`指向当前的子类实例。

```js
class A {
  constructor() {
    this.x = 1
  }
  print() {
    console.log(this.x)
  }
}

class B extends A {
  constructor() {
    super()
    this.x = 2
  }
  m() {
    super.print()
  }
}

let b = new B()
b.m() // 2
```

`super.print()` 调用的是 `A.prototype.print()`，但它内部的 `this` 指向子类 `B` 的实例，所以输出 `2`，实际执行的是 `super.print.call(this)`。

由于`this`指向子类实例，所以如果通过`super`对某个属性赋值，这时`super`就是`this`，赋值的属性会变成子类实例的属性。

```js
class A {
  constructor() {
    this.x = 1
  }
}

class B extends A {
  constructor() {
    super()
    this.x = 2
    super.x = 3
    console.log(super.x) // undefined
    console.log(this.x) // 3
  }
}

let b = new B()
```

`super.x = 3` 等同于给 `this.x` 赋值 3，赋值的属性会变成子类实例的属性；而读取 `super.x` 读的是 `A.prototype.x`，所以返回 `undefined`。

如果`super`作为对象，用在静态方法之中，这时`super`将指向父类，而不是父类的原型对象。

```js
class Parent {
  static myMethod(msg) {
    console.log('static', msg)
  }

  myMethod(msg) {
    console.log('instance', msg)
  }
}

class Child extends Parent {
  static myMethod(msg) {
    super.myMethod(msg)
  }

  myMethod(msg) {
    super.myMethod(msg)
  }
}

Child.myMethod(1) // static 1

var child = new Child()
child.myMethod(2) // instance 2
```

另外，在子类的静态方法中通过`super`调用父类的方法时，方法内部的`this`指向当前的子类，而不是子类的实例。

```js
class A {
  constructor() {
    this.x = 1
  }
  static print() {
    console.log(this.x)
  }
}

class B extends A {
  constructor() {
    super()
    this.x = 2
  }
  static m() {
    super.print()
  }
}

B.x = 3
B.m() // 3
```

静态方法中 `super.print` 指向父类的静态方法，而它内部的 `this` 指向的是 `B`，不是 `B` 的实例。

注意，使用`super`的时候，必须显式指定是作为函数、还是作为对象使用，否则会报错。

```js
class A {}

class B extends A {
  constructor() {
    super();
    console.log(super); // 报错
  }
}
```

引擎无法判断这个 `super` 是作为函数还是对象使用，所以解析代码时就报错；显式表明数据类型（如 `super.valueOf()`）就不会报错。

```js
class A {}

class B extends A {
  constructor() {
    super()
    console.log(super.valueOf() instanceof B) // true
  }
}

let b = new B()
```

`super.valueOf()` 表明 `super` 是一个对象；同时 `this` 指向 `B` 的实例，所以返回的是一个 `B` 的实例。

最后，由于对象总是继承其他对象的，所以可以在任意一个对象中，使用`super`关键字。

```js
var obj = {
  toString() {
    return 'MyObject: ' + super.toString()
  },
}

obj.toString() // MyObject: [object Object]
```

**`super` 的用法和结果：**

[width(24,21,18,37)]

| 用法                        | 出现位置               | 指向                | 结果                                                          |
| :-------------------------- | :--------------------- | :------------------ | :------------------------------------------------------------ |
| `super(...)`                | 子类的 `constructor()` | 父类构造函数        | 生成子类的 `this`，只能调用一次，且必须在任何 `this` 操作之前 |
| `super.x`、`super.method()` | 子类的普通方法         | 父类的原型对象      | 方法内部的 `this` 是子类实例；取不到父类**实例**上的属性      |
| `super.x = v`               | 子类的普通方法         | 等同于 `this.x = v` | 属性写到子类实例上，再读 `super.x` 仍然是 `undefined`         |
| `super.x`、`super.method()` | 子类的静态方法         | 父类本身            | 方法内部的 `this` 是子类，而不是子类的实例                    |
| `super.toString()`          | 任意对象的方法         | 该对象的原型        | `this` 是该对象                                               |
| 单独使用 `super`            | 任意位置               | ——                  | 语法错误，必须显式作为函数或对象使用                          |

### 1.4 类的 prototype 属性和\_\_proto\_\_属性

大多数浏览器的 ES5 实现之中，每一个对象都有`__proto__`属性，指向对应的构造函数的`prototype`属性。Class 作为构造函数的语法糖，同时有`prototype`属性和`__proto__`属性，因此同时存在两条继承链。

（1）子类的`__proto__`属性，表示构造函数的继承，总是指向父类。

（2）子类`prototype`属性的`__proto__`属性，表示方法的继承，总是指向父类的`prototype`属性。

```js
class A {}

class B extends A {}

B.__proto__ === A // true
B.prototype.__proto__ === A.prototype // true
```

子类 `B` 的 `__proto__` 指向父类 `A`，`B.prototype` 的 `__proto__` 指向 `A.prototype`。

这样的结果是因为，类的继承是按照下面的模式实现的。

```js
class A {}

class B {}

// B 的实例继承 A 的实例
Object.setPrototypeOf(B.prototype, A.prototype)

// B 继承 A 的静态属性
Object.setPrototypeOf(B, A)

const b = new B()
```

《[对象的扩展](/js/advanced/data-types/object)》一章给出过`Object.setPrototypeOf`方法的实现。

```js
Object.setPrototypeOf = function (obj, proto) {
  obj.__proto__ = proto
  return obj
}
```

```js
Object.setPrototypeOf(B.prototype, A.prototype)
// 等同于
B.prototype.__proto__ = A.prototype

Object.setPrototypeOf(B, A)
// 等同于
B.__proto__ = A
```

这两条继承链，可以这样理解：作为一个对象，子类（`B`）的原型（`__proto__`属性）是父类（`A`）；作为一个构造函数，子类（`B`）的原型对象（`prototype`属性）是父类的原型对象（`prototype`属性）的实例。

```js
B.prototype = Object.create(A.prototype)
// 等同于
B.prototype.__proto__ = A.prototype
```

`extends`关键字后面可以跟多种类型的值。

```js
class B extends A {}
```

上面代码的`A`，只要是一个有`prototype`属性的函数，就能被`B`继承。由于函数都有`prototype`属性（除了`Function.prototype`函数），因此`A`可以是任意函数。

下面，讨论两种情况。第一种，子类继承`Object`类。

```js
class A extends Object {}

A.__proto__ === Object // true
A.prototype.__proto__ === Object.prototype // true
```

第二种情况，不存在任何继承。

```js
class A {}

A.__proto__ === Function.prototype // true
A.prototype.__proto__ === Object.prototype // true
```

`A` 不存在任何继承，就是一个普通函数，所以直接继承 `Function.prototype`；而 `A` 调用后返回一个空对象（`Object` 实例），所以 `A.prototype.__proto__` 指向 `Object.prototype`。

### 1.5 类实例的 \_\_proto\_\_ 属性

子类实例的`__proto__`属性的`__proto__`属性，指向父类实例的`__proto__`属性。也就是说，子类的原型的原型，是父类的原型。

```js
var p1 = new Point(2, 3)
var p2 = new ColorPoint(2, 3, 'red')

p2.__proto__ === p1.__proto__ // false
p2.__proto__.__proto__ === p1.__proto__ // true
```

`ColorPoint` 继承了 `Point`，所以子类原型的原型就是父类的原型。

因此，通过子类实例的`__proto__.__proto__`属性，可以修改父类实例的行为。

```js
p2.__proto__.__proto__.printName = function () {
  console.log('Ha')
}

p1.printName() // "Ha"
```

## 2. 原生构造函数的继承

原生构造函数是指语言内置的构造函数，通常用来生成数据结构。ECMAScript 的原生构造函数大致有下面这些。

[width(18,24,58)]

| 构造函数     | 生成的数据结构     | 字面量写法       |
| :----------- | :----------------- | :--------------- |
| `Boolean()`  | 布尔值及其包装对象 | `true` / `false` |
| `Number()`   | 数字及其包装对象   | `1`、`0xff`      |
| `String()`   | 字符串及其包装对象 | `'abc'`          |
| `Array()`    | 数组               | `[1, 2, 3]`      |
| `Date()`     | 日期与时间         | 无               |
| `Function()` | 函数               | `function () {}` |
| `RegExp()`   | 正则表达式         | `/abc/g`         |
| `Error()`    | 错误对象           | 无               |
| `Object()`   | 普通对象           | `{ a: 1 }`       |

以前，这些原生构造函数是无法继承的，比如，不能自己定义一个`Array`的子类。

```js
function MyArray() {
  Array.apply(this, arguments)
}

MyArray.prototype = Object.create(Array.prototype, {
  constructor: {
    value: MyArray,
    writable: true,
    configurable: true,
    enumerable: true,
  },
})
```

`MyArray` 看起来继承了 `Array`，但这个类的行为与 `Array` 完全不一致。

```js
var colors = new MyArray()
colors[0] = 'red'
colors.length // 0

colors.length = 0
colors[0] // "red"
```

之所以会发生这种情况，是因为子类无法获得原生构造函数的内部属性，通过`Array.apply()`或者分配给原型对象都不行。原生构造函数会忽略`apply`方法传入的`this`，也就是说，原生构造函数的`this`无法绑定，导致拿不到内部属性。

ES5 是先新建子类的实例对象`this`，再将父类的属性添加到子类上，由于父类的内部属性无法获取，导致无法继承原生的构造函数。比如，`Array`构造函数有一个内部属性`[[DefineOwnProperty]]`，用来定义新属性时，更新`length`属性，这个内部属性无法在子类获取，导致子类的`length`属性行为不正常。

下面的例子中，我们想让一个普通对象继承`Error`对象。

```js
var e = {}

Object.getOwnPropertyNames(Error.call(e))
// [ 'stack' ]

Object.getOwnPropertyNames(e)
// []
```

`Error.call()` 完全忽略传入的第一个参数，而是返回一个新对象，`e` 本身没有任何变化，可见这种写法无法继承原生构造函数。

ES6 允许继承原生构造函数定义子类，因为 ES6 是先新建父类的实例对象`this`，然后再用子类的构造函数修饰`this`，使得父类的所有行为都可以继承。下面是一个继承`Array`的例子。

```js
class MyArray extends Array {
  constructor(...args) {
    super(...args)
  }
}

var arr = new MyArray()
arr[0] = 12
arr.length // 1

arr.length = 0
arr[0] // undefined
```

`MyArray` 继承了 `Array`，因此可以从它生成数组的实例。这意味着 ES6 可以自定义原生数据结构（比如 `Array`、`String`）的子类，这是 ES5 无法做到的。

上面这个例子也说明，`extends`关键字不仅可以用来继承类，还可以用来继承原生的构造函数。因此可以在原生数据结构的基础上，定义自己的数据结构。下面就是定义了一个带版本功能的数组。

```js
class VersionedArray extends Array {
  constructor() {
    super()
    this.history = [[]]
  }
  commit() {
    this.history.push(this.slice())
  }
  revert() {
    this.splice(0, this.length, ...this.history[this.history.length - 1])
  }
}

var x = new VersionedArray()

x.push(1)
x.push(2)
x // [1, 2]
x.history // [[]]

x.commit()
x.history // [[], [1, 2]]

x.push(3)
x // [1, 2, 3]
x.history // [[], [1, 2]]

x.revert()
x // [1, 2]
```

`commit()` 把数组的当前状态生成一个版本快照存入 `history`，`revert()` 把数组重置为最新一次保存的版本；除此之外它依然是一个普通数组。

下面是一个自定义`Error`子类的例子，可以用来定制报错时的行为。

```js
class ExtendableError extends Error {
  constructor(message) {
    super()
    this.message = message
    this.stack = new Error().stack
    this.name = this.constructor.name
  }
}

class MyError extends ExtendableError {
  constructor(m) {
    super(m)
  }
}

var myerror = new MyError('ll')
myerror.message // "ll"
myerror instanceof Error // true
myerror.name // "MyError"
myerror.stack
// Error
//     at MyError.ExtendableError
//     ...
```

注意，继承`Object`的子类，有一个[行为差异](https://stackoverflow.com/questions/36203614/super-does-not-pass-arguments-when-instantiating-a-class-extended-from-object)。

```js
class NewObj extends Object {
  constructor() {
    super(...arguments)
  }
}
var o = new NewObj({ attr: true })
o.attr === true // false
```

上面代码中，`NewObj`继承了`Object`，但是无法通过`super`方法向父类`Object`传参。这是因为 ES6 改变了`Object`构造函数的行为，一旦发现`Object`方法不是通过`new Object()`这种形式调用，ES6 规定`Object`构造函数会忽略参数。

## 3. Mixin 模式的实现

Mixin 指的是多个对象合成一个新的对象，新对象具有各个组成成员的接口。它的最简单实现如下。

```js
const a = {
  a: 'a',
}
const b = {
  b: 'b',
}
const c = { ...a, ...b } // {a: 'a', b: 'b'}
```

下面是一个更完备的实现，将多个类的接口“**混入**”（mix in）另一个类。

```js
function mix(...mixins) {
  class Mix {
    constructor() {
      for (let mixin of mixins) {
        copyProperties(this, new mixin()) // 拷贝实例属性
      }
    }
  }

  for (let mixin of mixins) {
    copyProperties(Mix, mixin) // 拷贝静态属性
    copyProperties(Mix.prototype, mixin.prototype) // 拷贝原型属性
  }

  return Mix
}

function copyProperties(target, source) {
  for (let key of Reflect.ownKeys(source)) {
    if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
      let desc = Object.getOwnPropertyDescriptor(source, key)
      Object.defineProperty(target, key, desc)
    }
  }
}
```

`mix()` 把多个对象合成为一个类，使用时继承这个类即可。

```js
class DistributedEdit extends mix(Loggable, Serializable) {
  // ...
}
```

## **4. 常见问题 (FAQ)**

### 4.1 为什么子类的 `constructor` 里必须先调用 `super()`？

- ES6 的继承是“**继承在前，实例在后**”：子类的 `this` 必须先由父类构造函数塑造出来，子类才能在它上面添加自己的属性。

```js
class ColorPoint extends Point {
  constructor(x, y, color) {
    this.color = color // ReferenceError
    super(x, y)
    this.color = color // 正确
  }
}
```

- 如果子类没有定义 `constructor()`，会默认添加 `constructor(...args) { super(...args) }`，所以子类一定有 `constructor()`。

### 4.2 `super` 到底指向谁？

- **作为函数调用**（`super()`）：代表父类的构造函数，且内部的 `this` 是子类实例，相当于 `A.prototype.constructor.call(this)`。
- **作为对象，在普通方法中**：指向**父类的原型对象** `A.prototype`，所以取不到定义在父类实例上的属性。
- **作为对象，在静态方法中**：指向**父类本身**，此时方法内部的 `this` 指向子类，而不是子类的实例。

### 4.3 通过 `super` 赋值的属性为什么跑到子类实例上了？

- `super.x = 3` 因为 `this` 指向子类实例，实际等同于 `this.x = 3`，属性落在子类实例上。
- 而读取 `super.x` 读的是 `A.prototype.x`，所以紧接着 `console.log(super.x)` 是 `undefined`，`console.log(this.x)` 才是 `3`。

### 4.4 子类会继承父类的哪些东西？

- **实例属性和方法**：会继承，父类构造函数必定先运行一次。
- **私有成员**：**不会**继承，`this.#p`、`this.#m()` 在子类中都会报错；父类若提供了 `getP()` 这类方法，子类可以借它间接读写私有属性。
- **静态属性和静态方法**：会继承；注意静态属性是**浅拷贝**，值为对象时父子共享同一个对象。

### 4.5 类有哪两条继承链？

- `B.__proto__ === A`：作为对象，子类的原型是父类（构造函数的继承）。
- `B.prototype.__proto__ === A.prototype`：作为构造函数，子类的原型对象是父类原型对象的实例。
- 换成 `Object.setPrototypeOf` 的写法就是 `Object.setPrototypeOf(B, A)` 和 `Object.setPrototypeOf(B.prototype, A.prototype)`。

### 4.6 为什么 ES5 无法继承原生构造函数，ES6 可以？

- ES5 先新建子类实例 `this`，再把父类属性添加上去，而原生构造函数的内部属性（如 `Array` 的 `[[DefineOwnProperty]]`）拿不到，所以 `colors.length` 之类的行为会出错。
- ES6 先新建父类实例 `this`，再用子类构造函数修饰它，父类的所有行为都可以继承，因此 `class MyArray extends Array` 可以正常工作。

### 4.7 继承 `Object` 时为什么 `super` 传参失效？

- ES6 规定：一旦发现 `Object` 不是通过 `new Object()` 调用，就会忽略参数。
- 因此 `new NewObj({ attr: true }).attr` 是 `false`，`super(...arguments)` 起不到传参作用。

### 4.8 `super` 用在普通对象里可以吗？

- 可以。对象总是继承其他对象的，所以任意对象中都能使用 `super`，例如 `{ toString() { return 'MyObject: ' + super.toString() } }`。
- 另外，`super` 必须显式地作为函数或对象使用，直接 `console.log(super)` 会报语法错误。
