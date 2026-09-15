# Class 的基本语法

`class` 是 ES6 (ECMAScript 2015) 引入的语法糖，它为 JavaScript 现有的原型继承 (prototypal inheritance) 提供了一层更简洁、更清晰的写法，并没有引入新的面向对象继承模型。

## 1. 类的定义和实例化

在 class 之前，生成实例对象的传统方法是构造函数。

```js
function Point(x, y) {
  this.x = x
  this.y = y
}

Point.prototype.toString = function () {
  return '(' + this.x + ', ' + this.y + ')'
}

var p = new Point(1, 2)
```

ES6 引入了 `class` 关键字，作为对象的模板，写法更接近传统语言。它只是语法糖，绝大部分功能 ES5 都能做到，只是让原型的写法更清晰、更像面向对象编程。上面的代码用 `class` 改写如下。

```js
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ')'
  }
}
```

`constructor()` 是构造方法，`this` 代表实例对象，这种写法本质上与开头的 ES5 构造函数 `Point` 一致。

`toString()` 方法前面不需要加 `function` 关键字，方法与方法之间也不需要逗号分隔，加了会报错。

ES6 的类，完全可以看作构造函数的另一种写法。

```js
class Point {
  // ...
}

typeof Point // "function"
Point === Point.prototype.constructor // true
```

可见类的数据类型就是函数，类本身就指向构造函数。

使用时也是直接对类使用 `new`，跟构造函数的用法完全一致。

```js
class Bar {
  doStuff() {
    console.log('stuff')
  }
}

const b = new Bar()
b.doStuff() // "stuff"
```

类的所有方法都定义在 `prototype` 属性上面。

```js
class Point {
  constructor() {
    // ...
  }

  toString() {
    // ...
  }

  toValue() {
    // ...
  }
}

// 等同于

Point.prototype = {
  constructor() {},
  toString() {},
  toValue() {},
}
```

因此，在类的实例上面调用方法，其实就是调用原型上的方法。

```js
class B {}
const b = new B()

b.constructor === B.prototype.constructor // true
```

上面代码中，`b`是`B`类的实例，它的`constructor()`方法就是`B`类原型的`constructor()`方法。

类的方法都定义在 `prototype` 对象上，所以新方法也可以添加在 `prototype` 上，`Object.assign()` 可以一次添加多个方法。

```js
class Point {
  constructor() {
    // ...
  }
}

Object.assign(Point.prototype, {
  toString() {},
  toValue() {},
})
```

`prototype.constructor` 直接指向“**类**”的本身，这与 ES5 的行为一致。

```js
Point.prototype.constructor === Point // true
```

类的内部所有定义的方法都是**不可枚举**的（non-enumerable）。

```js
class Point {
  constructor(x, y) {
    // ...
  }

  toString() {
    // ...
  }
}

Object.keys(Point.prototype)
// []
Object.getOwnPropertyNames(Point.prototype)
// ["constructor","toString"]
```

`Object.keys()` 拿不到类内部定义的方法，这一点与 ES5 的行为不一致。

```js
var Point = function (x, y) {
  // ...
}

Point.prototype.toString = function () {
  // ...
}

Object.keys(Point.prototype)
// ["toString"]
Object.getOwnPropertyNames(Point.prototype)
// ["constructor","toString"]
```

### 1.1 constructor() 方法

`constructor()`方法是类的默认方法，通过`new`命令生成对象实例时，自动调用该方法。一个类必须有`constructor()`方法，如果没有显式定义，一个空的`constructor()`方法会被默认添加。

```js
class Point {}

// 等同于
class Point {
  constructor() {}
}
```

`constructor()`方法默认返回实例对象（即`this`），完全可以指定返回另外一个对象。

```js
class Foo {
  constructor() {
    return Object.create(null)
  }
}

new Foo() instanceof Foo
// false
```

类必须使用 `new` 调用，否则会报错，这是它跟普通构造函数的一个主要区别——后者不用 `new` 也可以执行。

```js
class Foo {
  constructor() {
    return Object.create(null)
  }
}

Foo()
// TypeError: Class constructor Foo cannot be invoked without 'new'
```

### 1.2 类的实例

生成类的实例与 ES5 完全一样，也是使用 `new`；如果忘记 `new` 而像函数那样调用，会直接报错。

```js
class Point {
  // ...
}

// 报错
var point = Point(2, 3)

// 正确
var point = new Point(2, 3)
```

类的属性和方法，除非显式定义在其本身（即定义在`this`对象上），否则都是定义在原型上（即定义在`class`上）。

```js
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  toString() {
    return '(' + this.x + ', ' + this.y + ')'
  }
}

var point = new Point(2, 3)

point.toString() // (2, 3)

point.hasOwnProperty('x') // true
point.hasOwnProperty('y') // true
point.hasOwnProperty('toString') // false
point.__proto__.hasOwnProperty('toString') // true
```

`x`、`y` 定义在 `this` 上，是实例自身的属性；`toString()` 定义在类上，是原型对象的属性。这些都与 ES5 的行为保持一致。

与 ES5 一样，类的所有实例共享一个原型对象。

```js
var p1 = new Point(2, 3)
var p2 = new Point(3, 2)

p1.__proto__ === p2.__proto__
//true
```

这也意味着，可以通过实例的`__proto__`属性为“**类**”添加方法。

```js
var p1 = new Point(2, 3)
var p2 = new Point(3, 2)

p1.__proto__.printName = function () {
  return 'Oops'
}

p1.printName() // "Oops"
p2.printName() // "Oops"

var p3 = new Point(4, 2)
p3.printName() // "Oops"
```

通过实例的原型添加的方法，会影响所有实例（包括之后新建的），因为它改变了“**类**”的原始定义，因此不推荐使用。

### 1.3 类实例属性简写

[ES2022](https://github.com/tc39/proposal-class-fields) 为类的实例属性，又规定了一种新写法。实例属性现在除了可以定义在`constructor()`方法里面的`this`上面，也可以定义在类内部的最顶层。

```js
// 原来的写法
class IncreasingCounter {
  constructor() {
    this._count = 0
  }
  get value() {
    console.log('Getting the current value!')
    return this._count
  }
  increment() {
    this._count++
  }
}
```

新写法是把这个属性定义在类的最顶层，其他都不变。

```js
class IncreasingCounter {
  _count = 0
  get value() {
    console.log('Getting the current value!')
    return this._count
  }
  increment() {
    this._count++
  }
}
```

实例属性与取值函数、方法处于同一个层级，这时不需要在实例属性前面加上 `this`。

好处是所有实例属性都集中在类的头部，一眼就能看出这个类有哪些实例属性。

```js
class foo {
  bar = 'hello'
  baz = 'world'

  constructor() {
    // ...
  }
}
```

### 1.4 取值函数（getter）和存值函数（setter）

与 ES5 一样，在“**类**”的内部可以使用`get`和`set`关键字，对某个属性设置存值函数和取值函数，拦截该属性的存取行为。

```js
class MyClass {
  constructor() {
    // ...
  }
  get prop() {
    return 'getter'
  }
  set prop(value) {
    console.log('setter: ' + value)
  }
}

let inst = new MyClass()

inst.prop = 123
// setter: 123

inst.prop
// 'getter'
```

存值函数和取值函数是设置在属性的 **`Descriptor`**对象上的,使用存值函数时，属性将被定义在**实例的原型**上，使用Object.defineProperty()时,属性将被定义在**实例自身**上。

```js
class Example {
  get hello() {
    return 'world'
  }
}
const obj = new Example()
var descriptor = Object.getOwnPropertyDescriptor(Example.prototype, 'hello')

console.log('get' in descriptor) // true
console.log('set' in descriptor) // true
console.log(obj.hello) //world
console.log(Object.getOwnPropertyDescriptor(obj, 'hello')) //undefined
console.log(
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), 'hello'),
)
// {
//     get: [Function: get hello],
//     set: undefined,
//         enumerable: false,
//     configurable: true
// }
```

### 1.5 属性表达式

类的属性名，可以采用表达式。

```js
let methodName = 'getArea'

class Square {
  constructor(length) {
    // ...
  }

  [methodName]() {
    // ...
  }
}
```

### 1.6 Class 表达式

与函数一样，类也可以使用表达式的形式定义。

```js
const MyClass = class Me {
  getClassName() {
    return Me.name
  }
}
```

这个类的名字是 `Me`，但 `Me` 只在 Class 内部可用，指代当前类；在 Class 外部，这个类只能用 `MyClass` 引用。

```js
let inst = new MyClass()
inst.getClassName() // Me
Me.name // ReferenceError: Me is not defined
```

如果类的内部没用到，可以省略 `Me`。

```js
const MyClass = class {
  /* ... */
}
```

采用 Class 表达式，可以写出立即执行的 Class。

```js
let person = new (class {
  constructor(name) {
    this.name = name
  }

  sayName() {
    console.log(this.name)
  }
})('张三')

person.sayName() // "张三"
```

### 1.7 类的静态方法

类相当于实例的原型，所有在类中定义的方法，都会被实例继承。如果在一个方法前，加上`static`关键字，就表示该方法不会被实例继承，而是直接通过类来调用，这就称为“**静态方法**”。

```js
class Foo {
  static classMethod() {
    return 'hello'
  }
}

Foo.classMethod() // 'hello'

var foo = new Foo()
foo.classMethod()
// TypeError: foo.classMethod is not a function
```

静态方法只能直接通过类调用（`Foo.classMethod()`），在实例上调用会报错。

注意，如果静态方法包含`this`关键字，这个`this`指的是类，而不是实例。

```js
class Foo {
  static bar() {
    this.baz()
  }
  static baz() {
    console.log('hello')
  }
  baz() {
    console.log('world')
  }
}

Foo.bar() // hello
```

静态方法中的 `this` 指的是类，而不是实例，等同于调用 `Foo.baz`；静态方法还可以与非静态方法重名。

父类的静态方法，可以被子类继承。

```js
class Foo {
  static classMethod() {
    return 'hello'
  }
}

class Bar extends Foo {}

Bar.classMethod() // 'hello'
```

静态方法也是可以从`super`对象上调用的。

```js
class Foo {
  static classMethod() {
    return 'hello'
  }
}

class Bar extends Foo {
  static classMethod() {
    return super.classMethod() + ', too'
  }
}

Bar.classMethod() // "hello, too"
```

### 1.8 类的静态属性

静态属性指的是 Class 本身的属性，即`Class.propName`，而不是定义在实例对象（`this`）上的属性。

```js
class Foo {}

Foo.prop = 1
Foo.prop // 1
```

目前，只有这种写法可行，因为 ES6 明确规定，Class 内部只有静态方法，没有静态属性。现在有一个[提案](https://github.com/tc39/proposal-class-fields)提供了类的静态属性，写法是在实例属性的前面，加上`static`关键字。

```js
class MyClass {
  static myStaticProp = 42

  constructor() {
    console.log(MyClass.myStaticProp) // 42
  }
}
```

```js
// 老写法
class Foo {
  // ...
}
Foo.prop = 1

// 新写法
class Foo {
  static prop = 1
}
```

老写法把静态属性定义在类的外部，容易被忽略，也不符合代码组织原则；新写法是显式声明（declarative），语义更好。

### 1.9 静态块

静态属性的一个问题是，如果它有初始化逻辑，这个逻辑要么写在类的外部，要么写在`constructor()`方法里面。

```js
class C {
  static x = 234;
  static y;
  static z;
}

try {
  const obj = doSomethingWith(C.x);
  C.y = obj.y
  C.z = obj.z;
} catch {
  C.y = ...;
  C.z = ...;
}
```

上面示例中，静态属性 `y`、`z` 的值依赖 `x` 的运算结果，这段初始化逻辑要么写在类的外部，要么写在 `constructor()` 里。前者把类的内部逻辑写到了外部，后者每次新建实例都会运行一次，都不理想。

为了解决这个问题，ES2022 引入了[静态块](https://github.com/tc39/proposal-class-static-block)（static block），允许在类的内部设置一个代码块，在类生成时运行且只运行一次，主要作用是对静态属性进行初始化。以后，新建类的实例时，这个块就不运行了。

```js
class C {
  static x = ...;
  static y;
  static z;

  static {
    try {
      const obj = doSomethingWith(this.x);
      this.y = obj.y;
      this.z = obj.z;
    }
    catch {
      this.y = ...;
      this.z = ...;
    }
  }
}
```

这个 static 代码块就是静态块，它把静态属性的初始化逻辑写进了类的内部，而且只运行一次。

每个类允许有多个静态块，每个静态块中只能访问之前声明的静态属性，静态块的内部不能有`return`语句。

静态块内部可以使用类名或`this`，指代当前类。

```js
class C {
  static x = 1
  static {
    this.x // 1
    // 或者
    C.x // 1
  }
}
```

除了静态属性的初始化，静态块还有一个作用，就是将私有属性与类的外部代码分享。

```js
let getX

export class C {
  #x = 1
  static {
    getX = obj => obj.#x
  }
}

console.log(getX(new C())) // 1
```

`#x` 是私有属性，类外部的 `getX()` 想获取它，以前只能写在 `constructor()` 里（每次新建实例都要定义一次），现在写在静态块里，只在类生成时定义一次。

## 2. 类的私有方法和私有属性

### 2.1 早期解决方案

私有方法和私有属性，是只能在类的内部访问的方法和属性，外部不能访问。这是常见需求，有利于代码的封装，但早期的 ES6 不提供，只能通过变通方法模拟实现。

一种做法是在命名上加以区别。

```js
class Widget {
  // 公有方法
  foo(baz) {
    this._bar(baz)
  }

  // 私有方法
  _bar(baz) {
    return (this.snaf = baz)
  }

  // ...
}
```

下划线只是一种命名约定，并不保险——在类的外部依然可以调用到这个方法。

另一种方法就是索性将私有方法移出类，因为类内部的所有方法都是对外可见的。

```js
class Widget {
  foo(baz) {
    bar.call(this, baz)
  }

  // ...
}

function bar(baz) {
  return (this.snaf = baz)
}
```

`foo` 是公开方法，内部调用 `bar.call(this, baz)`，使 `bar()` 实际上成为当前类的私有方法。

还有一种方法是利用`Symbol`值的唯一性，将私有方法的名字命名为一个`Symbol`值。

```js
const bar = Symbol('bar')
const snaf = Symbol('snaf')

export default class myClass {
  // 公有方法
  foo(baz) {
    this[bar](baz)
  }

  // 私有方法
  [bar](baz) {
    return (this[snaf] = baz)
  }

  // ...
}
```

`bar` 和 `snaf` 都是 `Symbol` 值，一般情况下无法获取，从而达到了私有方法/属性的效果；但 `Reflect.ownKeys()` 依然可以拿到它们。

```js
const inst = new myClass()

Reflect.ownKeys(myClass.prototype)
// [ 'constructor', 'foo', Symbol(bar) ]
```

### 2.2 私有属性的正式写法

[ES2022](https://github.com/tc39/proposal-class-fields)正式为`class`添加了私有属性，方法是在属性名之前使用`#`表示。

```js
class IncreasingCounter {
  #count = 0
  get value() {
    console.log('Getting the current value!')
    return this.#count
  }
  increment() {
    this.#count++
  }
}
```

`#count` 是私有属性，只能在类的内部使用（`this.#count`），在类的外部读写都会报错。

```js
const counter = new IncreasingCounter()
counter.#count // 报错
counter.#count = 42 // 报错
```

另外，不管在类的内部或外部，读取一个不存在的私有属性，也都会报错。这跟公开属性的行为完全不同，如果读取一个不存在的公开属性，不会报错，只会返回`undefined`。

```js
class IncreasingCounter {
  #count = 0
  get value() {
    console.log('Getting the current value!')
    return this.#myCount // 报错
  }
  increment() {
    this.#count++
  }
}

const counter = new IncreasingCounter()
counter.#myCount // 报错
```

注意，私有属性的属性名必须包括`#`，如果不带`#`，会被当作另一个属性。

```js
class Point {
  #x

  constructor(x = 0) {
    this.#x = +x
  }

  get x() {
    return this.#x
  }

  set x(value) {
    this.#x = +value
  }
}
```

由于井号 `#` 是属性名的一部分，使用时必须带着 `#`，所以 `#x` 和 `x` 是两个不同的属性，类外读不到 `#x`。

这种写法不仅可以写私有属性，还可以用来写私有方法。

```js
class Foo {
  #a
  #b
  constructor(a, b) {
    this.#a = a
    this.#b = b
  }
  #sum() {
    return this.#a + this.#b
  }
  printSum() {
    console.log(this.#sum())
  }
}
```

另外，私有属性也可以设置 getter 和 setter 方法。

```js
class Counter {
  #xValue = 0

  constructor() {
    console.log(this.#x)
  }

  get #x() {
    return this.#xValue
  }
  set #x(value) {
    this.#xValue = value
  }
}
```

私有属性不限于从`this`引用，只要是在类的内部，实例也可以引用私有属性。

```js
class Foo {
  #privateValue = 42
  static getPrivateValue(foo) {
    return foo.#privateValue
  }
}

Foo.getPrivateValue(new Foo()) // 42
```

私有属性和私有方法前面，也可以加上`static`关键字，表示这是一个静态的私有属性或私有方法。

```js
class FakeMath {
  static PI = 22 / 7
  static #totallyRandomNumber = 4

  static #computeRandomNumber() {
    return FakeMath.#totallyRandomNumber
  }

  static random() {
    console.log('I heard you like random numbers…')
    return FakeMath.#computeRandomNumber()
  }
}

FakeMath.PI // 3.142857142857143
FakeMath.random()
// I heard you like random numbers…
// 4
FakeMath.#totallyRandomNumber // 报错
FakeMath.#computeRandomNumber() // 报错
```

### 2.3 in 运算符

前面说过，直接访问某个类不存在的私有属性会报错，但是访问不存在的公开属性不会报错。这个特性可以用来判断，某个对象是否为类的实例。

```js
class C {
  #brand

  static isC(obj) {
    try {
      obj.#brand
      return true
    } catch {
      return false
    }
  }
}
```

这里访问私有属性 `#brand`：不报错就返回 `true`，报错说明不是当前类的实例，返回 `false`。

因此，`try...catch`结构可以用来判断某个私有属性是否存在。但是，这样的写法很麻烦，代码可读性很差，[ES2022](https://github.com/tc39/proposal-private-fields-in-in) 改进了`in`运算符，使它也可以用来判断私有属性。

```js
class C {
  #brand

  static isC(obj) {
    if (#brand in obj) {
      // 私有属性 #brand 存在
      return true
    } else {
      // 私有属性 #brand 不存在
      return false
    }
  }
}
```

`in` 运算符判断某个对象是否有私有属性 `#brand`，它不会报错，而是返回布尔值。

这种用法的`in`，也可以跟`this`一起配合使用。

```js
class A {
  #foo = 0
  m() {
    console.log(#foo in this) // true
  }
}
```

注意，判断私有属性时，`in`只能用在类的内部。另外，判断所针对的私有属性，一定要先声明，否则会报错。

```js
class A {
  m() {
    console.log(#foo in this) // 报错
  }
}
```

## 3. 类的注意点

### 3.1 严格模式

类和模块的内部默认就是严格模式，不需要用 `use strict` 指定；只要代码写在类或模块之中，就只有严格模式可用。

### 3.2 不存在提升

类不存在变量提升（hoist），这一点与 ES5 完全不同。

```js
new Foo() // ReferenceError
class Foo {}
```

类声明不会提升到代码头部，所以这样会报错。这也与继承有关：必须保证子类在父类之后定义。

```js
{
  let Foo = class {}
  class Bar extends Foo {}
}
```

### 3.3 name 属性

ES6 的类只是 ES5 构造函数的一层包装，所以函数的一些特性（包括 `name` 属性）都被 `class` 继承了。

```js
class Point {}
Point.name // "Point"
```

`name`属性总是返回紧跟在`class`关键字后面的类名。

### 3.4 Generator 方法

如果某个方法之前加上星号（`*`），就表示该方法是一个 Generator 函数。

```js
class Foo {
  constructor(...args) {
    this.args = args
  }
  *[Symbol.iterator]() {
    for (let arg of this.args) {
      yield arg
    }
  }
}

for (let x of new Foo('hello', 'world')) {
  console.log(x)
}
// hello
// world
```

`Symbol.iterator` 方法返回一个 `Foo` 类的默认遍历器，`for...of` 循环会自动调用它。

### 3.5 this 的指向

类的方法内部如果含有`this`，它默认指向类的实例。但是，必须非常小心，一旦单独使用该方法，很可能报错。

```js
class Logger {
  printName(name = 'there') {
    this.print(`Hello ${name}`)
  }

  print(text) {
    console.log(text)
  }
}

const logger = new Logger()
const { printName } = logger
printName() // TypeError: Cannot read property 'print' of undefined
```

将方法提取出来单独使用时，`this` 指向运行时所在的环境；由于类内部是严格模式，`this` 实际指向 `undefined`，于是找不到 `print` 方法而报错。

一个比较简单的解决方法是，在构造方法中绑定`this`，这样就不会找不到`print`方法了。

```js
class Logger {
  constructor() {
    this.printName = this.printName.bind(this)
  }

  // ...
}
```

另一种解决方法是使用箭头函数。

```js
class Obj {
  constructor() {
    this.getThis = () => this
  }
}

const myObj = new Obj()
myObj.getThis() === myObj // true
```

箭头函数内部的 `this` 总是指向定义时所在的对象；这里定义在构造函数内部，所以总是指向实例对象。

还有一种解决方法是使用`Proxy`，获取方法的时候，自动绑定`this`。

```js
function selfish(target) {
  const cache = new WeakMap()
  const handler = {
    get(target, key) {
      const value = Reflect.get(target, key)
      if (typeof value !== 'function') {
        return value
      }
      if (!cache.has(value)) {
        cache.set(value, value.bind(target))
      }
      return cache.get(value)
    },
  }
  const proxy = new Proxy(target, handler)
  return proxy
}

const logger = selfish(new Logger())
```

## 4. new.target 属性

`new`是从构造函数生成实例对象的命令。ES6 为`new`命令引入了一个`new.target`属性，该属性一般用在构造函数之中，返回`new`命令作用于的那个构造函数。如果构造函数不是通过`new`命令或`Reflect.construct()`调用的，`new.target`会返回`undefined`，因此这个属性可以用来确定构造函数是怎么调用的。

```js
function Person(name) {
  if (new.target !== undefined) {
    this.name = name
  } else {
    throw new Error('必须使用 new 命令生成实例')
  }
}

// 另一种写法
function Person(name) {
  if (new.target === Person) {
    this.name = name
  } else {
    throw new Error('必须使用 new 命令生成实例')
  }
}

var person = new Person('张三') // 正确
var notAPerson = Person.call(person, '张三') // 报错
```

Class 内部调用`new.target`，返回当前 Class。

```js
class Rectangle {
  constructor(length, width) {
    console.log(new.target === Rectangle)
    this.length = length
    this.width = width
  }
}

var obj = new Rectangle(3, 4) // 输出 true
```

需要注意的是，子类继承父类时，`new.target`会返回子类。

```js
class Rectangle {
  constructor(length, width) {
    console.log(new.target === Rectangle)
    // ...
  }
}

class Square extends Rectangle {
  constructor(length, width) {
    super(length, width)
  }
}

var obj = new Square(3) // 输出 false
```

利用这个特点，可以写出不能独立使用、必须继承后才能使用的类。

```js
class Shape {
  constructor() {
    if (new.target === Shape) {
      throw new Error('本类不能实例化')
    }
  }
}

class Rectangle extends Shape {
  constructor(length, width) {
    super()
    // ...
  }
}

var x = new Shape() // 报错
var y = new Rectangle(3, 4) // 正确
```

注意，在函数外部，使用`new.target`会报错。

## **5. 常见问题 (FAQ)**

### 5.1 `class` 和普通构造函数有什么区别？

- **本质相同**：`class` 只是构造函数的语法糖，`typeof Point === 'function'`，类本身就指向构造函数，底层仍是原型链。
- **写法更清晰**：方法定义在类内部，不需要 `function` 关键字，方法之间不需要逗号。
- **行为更严格**：类必须通过 `new` 调用，否则报错；类内部的代码默认是严格模式；类声明不会提升（存在暂时性死区）。
- **方法不可枚举**：类内部定义的方法都是 non-enumerable，而 ES5 挂到 `prototype` 上的方法默认可枚举。

### 5.2 `class` 的方法定义在实例上还是原型上？

- 类的方法（包括 `get`/`set`、Generator 方法、`Symbol.iterator`）都定义在 `prototype` 上，所有实例共享同一份。
- 只有写在 `constructor()` 里的 `this.xxx`，以及写在类顶层的实例属性（`_count = 0`），才是**实例自身的属性**。

### 5.3 类的静态成员有什么特点？

- `static` 修饰的方法/属性属于**类本身**，通过 `Foo.bar()` 调用，实例上访问不到。
- 静态方法中的 `this` 指向**类**，而不是实例；静态方法可以与非静态方法重名。
- 静态属性被子类继承时是**浅拷贝**：值是基本类型时父子各自独立，值是对象时父子指向同一个对象。

### 5.4 静态块（static block）解决了什么问题？

- 让静态属性的初始化逻辑写在**类内部**，并且只在类生成时执行一次，不会像写在 `constructor()` 里那样每次新建实例都执行。
- 一个类可以有多个静态块，每个静态块只能访问之前声明的静态属性，内部不能有 `return`。
- 它还有一个用途：把私有属性分享给类外部的代码（如 `static { getX = obj => obj.#x }`）。

### 5.5 `#` 私有属性和下划线、Symbol 的模拟方案有什么区别？

- `_bar` 只是命名约定，类外部照样能调用；`Symbol` 值属性虽然一般拿不到，但 `Reflect.ownKeys()` 可以枚举出来。
- `#` 是语言层面的真私有：只能在定义它的类内部访问，类外部读写都会报错，子类也无法继承。
- 私有属性名必须带 `#`，`#x` 和 `x` 是两个不同的属性；读取一个不存在的私有属性也会报错，而公开属性只会返回 `undefined`。
- 私有成员同样支持 `static`、`get`/`set`，也可以写在静态块的逻辑里。

### 5.6 `in` 运算符怎么用来判断私有属性？

- 判断私有属性时 `in` 只能用在**类的内部**，且该私有属性必须**先声明**，否则报错。
- `#brand in obj` 返回布尔值而不报错，因此 `obj.#brand` 的 `try...catch` 写法（也就是 “brand check”）可以简化掉。

### 5.7 方法里的 `this` 丢失了怎么办？

- 把方法提取出来单独调用（`const { printName } = logger`）时，`this` 会变成 `undefined`（类内部是严格模式）。
- 三种解决办法：在 `constructor()` 中 `bind(this)`；把方法写成实例上的箭头函数（`this.getThis = () => this`）；用 `Proxy` 在取值时自动绑定 `this`。

### 5.8 `new.target` 有什么用？

- 它返回 `new` 命令作用的那个构造函数；如果不是通过 `new` 或 `Reflect.construct()` 调用，则返回 `undefined`，因此可以用来强制构造函数只能用 `new` 调用。
- 在类中它返回当前类；子类继承父类时返回的是**子类**，利用这一点可以写出“**不能独立实例化、必须继承后使用**”的抽象类（在构造函数里判断 `new.target === Shape` 就抛错）。
