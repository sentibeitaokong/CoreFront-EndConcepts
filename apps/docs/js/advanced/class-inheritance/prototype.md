# JavaScript **构造函数、原型、原型链与继承**

JavaScript 并非传统的基于“**类**”(Class)的语言，而是基于**原型 (Prototype)** 的。对象不从类中创建，而是直接或间接地从其他对象“**克隆**”而来。ES6 的 `class` 语法只是建立在这套原型机制之上的“**语法糖**”。

## **1. 构造函数 (Constructor)**

### **1.1 什么是构造函数?**

- **定义**: 在JavaScript中,任何一个**普通函数**，只要通过 `new` 操作符来调用，它就可以被看作是一个**构造函数**。
- **约定**: 构造函数的函数名通常首字母大写，以作区分，例如 `Person`, `Car`。
- **作用**: 主要用于**初始化**一个新创建的对象，为其设置属性和方法。

```js
// 定义一个构造函数
function Car(make, model, year) {
  // `this` 在这里指向一个新创建的空对象

  // 为新对象添加属性
  this.make = make
  this.model = model
  this.year = year

  // 为新对象添加方法
  this.getDetails = function () {
    return `${this.year} ${this.make} ${this.model}`
  }

  // `new` 操作符会隐式地 return this
}

// 使用 new 关键字调用构造函数，创建实例
const myCar = new Car('Toyota', 'Corolla', 2021)

// 访问实例的属性和方法
console.log(myCar.make) // "Toyota"
console.log(myCar.getDetails()) // "2021 Toyota Corolla"
```

### **1.2 new的实现原理**

- 创建新对象: 创建一个全新的、空的 JavaScript 对象 {}。
- 链接原型: 将这个新对象的[[Prototype]]（内部属性，可通过**proto**访问）链接到构造函数的 prototype 属性。
- newObject.**proto** = Constructor.prototype
- 绑定 this: 将这个新对象绑定为函数调用的 this 上下文。
- 返回新对象: 如果函数没有显式 return 一个对象，则自动返回这个新创建的对象。

```js
function myNew() {
  // 1、创建一个空的对象
  var obj = new Object(),
    // 2、获得构造函数，同时删除 arguments 中第一个参数
    Con = [].shift.call(arguments)
  // 3、链接到原型，obj 可以访问构造函数原型中的属性
  Object.setPrototypeOf(obj, Con.prototype)
  // 4、绑定 this 实现继承，obj 可以访问到构造函数中的属性
  var ret = Con.apply(obj, arguments)
  // 5、优先返回构造函数返回的对象
  return ret instanceof Object ? ret : obj
}
```

### **1.3 构造函数、实例和原型的关系**

- **构造函数 (`Car`)**: 一个函数，定义了实例的“**蓝图**”。
- **实例 (`myCar`)**: 通过 `new` 构造函数创建的具体对象。
- **原型 (`Car.prototype`)**: 构造函数的一个属性，它本身是一个对象。所有由该构造函数创建的实例，都会共享这个原型对象上的属性和方法。

**它们之间的链接**:
`myCar.__proto__ === Car.prototype`
`Car.prototype.constructor === Car`

**最佳实践：将共享方法放在原型上**
将方法直接定义在构造函数内（如 `this.getDetails = ...`）会导致**每个实例**都创建一份该方法的副本，造成内存浪费。正确的做法是将其放在原型上。

```js
function Car(make, model) {
  this.make = make
  this.model = model
}

// 将共享的方法添加到原型上
Car.prototype.getDetails = function () {
  return `${this.year} ${this.make} ${this.model}` // 注意：这里的 year 可能会是 undefined
}

Car.prototype.setYear = function (year) {
  this.year = year
}

const car1 = new Car('Honda', 'Civic')
const car2 = new Car('Ford', 'Focus')

// car1 和 car2 共享同一个 getDetails 和 setYear 方法
console.log(car1.getDetails === car2.getDetails) // true
```

#### **2.1 `prototype` (函数的原型属性)**

- **谁拥有**: **只有函数**才拥有 `prototype` 属性,当你定义一个函数时，JavaScript 引擎会自动为这个函数创建一个 prototype 属性。
- **是什么**: 这个 **`prototype`** 属性指向一个对象，我们称之为原型对象。这个对象是空的，但它有一个预置的 **`constructor`** 属性。
- **核心用途**: 存放由该构造函数创建的所有实例所需要共享的属性和方法。这样做可以极大地节省内存。

#### **2.2 `__proto__` (对象的原型链接) / `Object.getPrototypeOf()`**

- **谁拥有**: **每个对象**（包括函数、数组，甚至 null 除外的一切）都有一个内部的 `[[Prototype]]` 链接，指向其原型。
- **是什么**: 这个链接可以通过非标准的 `__proto__` 属性或标准的 `Object.getPrototypeOf(obj)` 方法指向该对象的原型,它构成了对象之间链接的“**链条**”。
- **关系**: 当使用 **`new`** 关键字调用一个构造函数来创建实例时，JS 引擎会执行一个关键步骤：将新创建实例的 **`[[Prototype]]`** (即 **`__proto__`**) 指向构造函数的 **`prototype`** 对象。
  - `instance.__proto__ === Constructor.prototype`

**优化构造函数**: 将共享的方法放到 `prototype` 上，以节省内存。

```js
function Person(name, age) {
  this.name = name
  this.age = age
}

// 将共享的方法添加到 Person 的原型对象上
Person.prototype.sayHello = function () {
  console.log(`Hello, I'm ${this.name}`)
}

Person.prototype.species = 'Homo sapiens'

const person1 = new Person('Alice', 30)
const person2 = new Person('Bob', 25)

person1.sayHello() // "Hello, I'm Alice"

// 验证关系
console.log(person1.__proto__ === Person.prototype) // true
console.log(person1.sayHello === person2.sayHello) // true (两个实例共享同一个 sayHello 函数)
```

#### **2.3 `constructor` 属性**

- **定义**: 默认情况下，每个 **`prototype`** 对象都会自动获得一个 **`constructor`** 属性。
- **是什么**: 它是一个指回其关联的构造函数本身的指针。
- **关系**: **`Constructor.prototype.constructor === Constructor`**

**`constructor`** 返回创建实例对象时构造函数的引用。此属性的值是对函数本身的引用，而不是一个包含函数名称的字符串。

```js
function Parent(age) {
  this.age = age
}

var p = new Parent(50)
p.constructor === Parent // true
p.constructor === Object // false
```

**`constructor` 值只读吗?**

对于**引用类型**来说 **`constructor`** 属性值是可以修改的，但是对于**基本类型**来说是**只读**的，引用类型情况其值可修改这个很好理解，比如**原型链继承**方案中，就需要对 **`constructor`**重新赋值进行**修正**。

```js
function Foo() {
  this.value = 42
}
Foo.prototype = {
  method: function () {},
}

function Bar() {}

// 设置 Bar 的 prototype 属性为 Foo 的实例对象
Bar.prototype = new Foo()
Bar.prototype.foo = 'Hello World'

Bar.prototype.constructor === Object
// true

// 修正 Bar.prototype.constructor 为 Bar 本身
Bar.prototype.constructor = Bar

var test = new Bar() // 创建 Bar 的一个新实例
console.log(test)
```

**基本类型**来说是**只读**的,因为创建他们的是只读的原生构造函数 **`（native constructors）`**，这也说明了依赖一个对象的 **`constructor`** 属性并**不安全**。

```js
function Type() {}
var types = [1, 'muyiy', true, Symbol(123)]

for (var i = 0; i < types.length; i++) {
  types[i].constructor = Type
  types[i] = [
    types[i].constructor,
    types[i] instanceof Type,
    types[i].toString(),
  ]
}

console.log(types.join('\n'))
// function Number() { [native code] }, false, 1
// function String() { [native code] }, false, muyiy
// function Boolean() { [native code] }, false, true
// function Symbol() { [native code] }, false, Symbol(123)
```

## **3. 原型链 (Prototype Chain)**

### **3.1 什么是原型链**

**定义**:每个 JavaScript 对象都有一个内部槽 `[[Prototype]]`，它指向另一个对象或 `null`。当访问一个对象的属性时，如果该对象自身没有这个属性，引擎就会沿着 `[[Prototype]]` 指向的原型对象继续查找；如果原型对象也没有，就继续沿着它的 `[[Prototype]]` 向上查找，直到找到该属性或到达 `null` 为止。这条由 `[[Prototype]]` 逐级链接形成的单向对象链条，就叫做**原型链**。`Object.create(null)` 创建的对象没有原型，因此它的原型链只有它自己。

```js
function Parent(age) {
  this.age = age
}
var p = new Parent(50)

p // Parent {age: 50}
p.__proto__ === Parent.prototype // true
p.__proto__.__proto__ === Object.prototype // true
p.__proto__.__proto__.__proto__ === null // true
```

### 3.2 **`Function`** 和 **`Object`** 鸡蛋问题

![Logo](/img/prototype.png)

- `Object.prototype` **是普通对象的根原型**（终点为 `null`）。
- `Function.prototype` **是所有函数的根原型**（包括 `Object`、`Function` 自身）。
- `Function.prototype` **本身也是对象**，所以它的原型是 `Object.prototype`。

**结论:** “**鸡蛋问题**”是**错觉**。

引擎初始化时先创建 `Object.prototype` 和 `Function.prototype` 两个根原型，再创建 `Object` 和 `Function` 两个构造函数。`Function` 是所有函数的构造器，`Object` 是所有普通对象的构造器，而 `Function.prototype` 本身又是对象，所以它的原型最终指向 `Object.prototype`。整个原型链单向、有终点（`null`），不存在循环依赖。

## **4. 继承 (Inheritance)**

继承的核心就是**让一个构造函数的原型，链接到另一个构造函数的原型**，从而形成原型链,继承本质上是构建和操纵原型链。

### **4.1 原型链继承**

- **核心**: 将子类的原型 `prototype` 直接设置为父类的一个**实例**。
- **实现**:

  ```js
  function Animal(name) {
    this.name = name // 实例自身属性
    this.colors = ['black', 'white'] // 引用类型属性，用于测试
  }

  // 在父类原型上添加共享方法
  Animal.prototype.eat = function () {
    console.log(`${this.name} is eating.`)
  }
  function Dog() {}
  Dog.prototype = new Animal() // 核心

  const dog1 = new Dog()
  dog1.eat() // "undefined is eating." (可以访问原型方法)
  ```

- **优点**:
  - 实现简单，易于理解。
  - 父类原型上新增的方法，子类实例也能访问到。
- **缺点**:
  - **无法向父类构造函数传递参数**: 所有 `Dog` 实例的 `name` 都是 `undefined`。
  - **引用类型属性共享**: 所有子类实例会共享父类实例的引用类型属性（如 `colors`）。一个实例修改，会影响所有其他实例，这是**致命缺陷**。
    ```js
    const dog1 = new Dog()
    const dog2 = new Dog()
    dog1.colors.push('brown')
    console.log(dog2.colors) // ['black', 'white', 'brown'] (dog2 被污染了)
    ```

### **4.2 借用构造函数继承 (经典继承/伪造对象)**

- **核心**: 在子类构造函数内部，使用 `call()` 或 `apply()` 来调用父类构造函数，从而将父类的实例属性复制到子类实例上。
- **实现**:

  ```js
  function Animal(name) {
    this.name = name // 实例自身属性
    this.colors = ['black', 'white'] // 引用类型属性，用于测试
  }

  // 在父类原型上添加共享方法
  Animal.prototype.eat = function () {
    console.log(`${this.name} is eating.`)
  }
  function Dog(name) {
    Animal.call(this, name) // 核心
  }

  const dog1 = new Dog('Buddy')
  console.log(dog1.name) // "Buddy"
  console.log(dog1.colors) // ['black', 'white']
  // dog1.eat(); // TypeError: dog1.eat is not a function
  ```

- **优点**:
  - **解决了引用类型属性共享的问题**: 每个实例都有自己独立的属性副本。
  - **可以向父类构造函数传递参数**。

- **缺点**:
  - **无法继承父类原型上的方法**: 只能继承父类构造函数中的属性和方法。`Animal.prototype` 上的 `eat` 方法无法访问。
  - 方法都在构造函数中定义，每次创建实例都会创建一次方法，无法复用。

### **4.3 组合继承 (原型链 + 借用构造函数)**

- **核心**: 结合了前两种方法的优点，是 JavaScript 中最常用的继承模式之一。
  - 使用**原型链**继承共享的**原型属性和方法**。
  - 使用**借用构造函数**继承**实例自身属性**。
- **实现**:

  ```js
  function Animal(name) {
    this.name = name // 实例自身属性
    this.colors = ['black', 'white'] // 引用类型属性，用于测试
  }

  // 在父类原型上添加共享方法
  Animal.prototype.eat = function () {
    console.log(`${this.name} is eating.`)
  }
  function Dog(name) {
    Animal.call(this, name) // 继承自身属性
  }

  Dog.prototype = new Animal() // 继承原型方法
  Dog.prototype.constructor = Dog // 修正 constructor 指向

  const dog1 = new Dog('Buddy')
  dog1.eat() // "Buddy is eating."
  const dog2 = new Dog('Max')
  dog1.colors.push('brown')
  console.log(dog2.colors) // ['black', 'white'] (未被污染)
  ```

  ![Logo](/img/prototypeExtends.png)

- **优点**:
  - 完美解决了参数传递和引用类型共享的问题。
  - 实例既有自己的属性，也能使用原型上的方法，实现了函数复用。
- **缺点**:
  - **父类构造函数被调用了两次**: 一次是在 `new Animal()` 时，另一次是在 `Animal.call(this, ...)` 时。这会导致子类原型上包含一份多余的、无用的父类实例属性。

### **4.4 原型式继承**

- **核心**: 利用一个**临时构造函数**，接收一个对象作为参数，然后返回这个临时构造函数的一个新实例。本质上是对传入的对象进行了一次**浅拷贝**。ES5 的 `Object.create()` 就是这种思想的规范化。
- **实现**:

  ```js
  function object(o) {
    function F() {}
    F.prototype = o
    return new F()
  }

  const person = { name: 'Alice', friends: ['Bob', 'Charlie'] }
  const anotherPerson = object(person)

  console.log(anotherPerson.name) // "Alice"
  ```

- **优点**:
  - 简单，不需要创建自定义的构造函数。
- **缺点**:
  - 与原型链继承一样，包含引用类型的属性会被所有实例共享。

### **4.5 寄生式继承**

- **核心**: 在**原型式继承**的基础上，创建一个用于封装继承过程的函数，该函数在内部以某种方式来增强对象，最后再像真的是它自己的对象一样返回。
- **实现**:

  ```js
  function createAnother(original) {
    const clone = object(original) // 通过原型式继承创建一个新对象
    clone.sayHi = function () {
      // 增强这个对象
      console.log('hi')
    }
    return clone
  }

  const person = { name: 'Alice' }
  const anotherPerson = createAnother(person)
  anotherPerson.sayHi() // "hi"
  ```

- **优点**:
  - 简单，代码量少。
- **缺点**:
  - 与借用构造函数模式一样，方法无法复用。
  - 引用类型属性仍然共享。

### **4.6 寄生组合式继承 (最佳实践 - ES5)**

- **核心**: 这是对**组合继承**的终极优化。它通过**寄生式继承**来继承父类的原型，解决了组合继承中父类构造函数被调用两次的问题。
- **实现**:

  ```js
  function Animal(name) {
    this.name = name // 实例自身属性
    this.colors = ['black', 'white'] // 引用类型属性，用于测试
  }

  // 在父类原型上添加共享方法
  Animal.prototype.eat = function () {
    console.log(`${this.name} is eating.`)
  }
  function inheritPrototype(subType, superType) {
    // 1. 创建父类原型的一个副本（一个以父类原型为原型的空对象）
    const prototype = Object.create(superType.prototype)
    // 2. 增强对象：修正 constructor 指向
    prototype.constructor = subType
    // 3. 将副本赋给子类的原型
    subType.prototype = prototype
  }

  // --- 使用 ---
  function Dog(name) {
    Animal.call(this, name) // 继承自身属性
  }

  inheritPrototype(Dog, Animal) // 核心：用寄生方式继承原型

  Dog.prototype.bark = function () {
    console.log('barking...')
  }

  const dog1 = new Dog('Buddy')
  ```

- **优点**:
  - **堪称完美**。只调用了一次父类构造函数，避免了在子类原型上创建不必要的属性。
  - 保持了原型链的完整性，`instanceof` 和 `isPrototypeOf` 也能正常工作。
  - 函数可复用，引用类型属性不共享，可传参。
- **缺点**:
  - 实现相对复杂，需要额外封装一个函数。

### **4.7 混入方式继承 (Mixin)**

- **核心**: 将多个对象的属性和方法复制到一个对象上。这不是严格意义上的继承，更像是一种“**组合**”或“**扩展**”。
- **实现**:

  ```js
  function mixin(target, ...sources) {
    Object.assign(target, ...sources)
  }

  const CanFly = {
    fly() {
      console.log('flying...')
    },
  }
  const CanSwim = {
    swim() {
      console.log('swimming...')
    },
  }

  function Duck() {}
  mixin(Duck.prototype, CanFly, CanSwim)

  const duck = new Duck()
  duck.fly() // "flying..."
  ```

- **优点**:
  - 非常灵活，可以轻松地为对象添加多种功能。
- **缺点**:
  - 可能会导致属性覆盖和命名冲突。

### **4.8 ES6 `class` 继承 (`extends`)**

- **核心**: ES6 引入的**语法糖**，让继承的写法更清晰、更符合传统面向对象语言的习惯。其底层实现就是**寄生组合式继承**。
- **实现**:

  ```js
  class Animal {
    constructor(name) {
      this.name = name
      this.colors = ['black', 'white']
    }
    eat() {
      console.log(`${this.name} is eating.`)
    }
  }

  class Dog extends Animal {
    constructor(name, breed) {
      super(name) // 核心：调用父类的 constructor，相当于 Animal.call(this, name)
      this.breed = breed
    }
    bark() {
      console.log('barking...')
    }
  }

  const dog1 = new Dog('Buddy', 'Golden Retriever')
  dog1.eat()
  const dog2 = new Dog('Max')
  dog1.colors.push('brown')
  console.log(dog2.colors) // ['black', 'white']
  ```

- **优点**:
  - **语法简洁、清晰、易于理解**。
  - 是现代 JavaScript 开发中**最推荐**的继承方式。
- **缺点**:
  - 不是新的继承方案，只是语法糖，需要理解其原型本质。

### **4.9 总结**

[width(22,31,32,15)]

| 继承方案           | 优点                           | 缺点                           | 推荐度 |
| :----------------- | :----------------------------- | :----------------------------- | :----- |
| **原型链继承**     | 简单，实现原型继承             | 引用类型共享，无法传参         | ★☆☆☆☆  |
| **构造函数继承**   | 解决引用类型共享，可传参       | 无法继承原型方法，函数无法复用 | ★★☆☆☆  |
| **组合继承**       | 综合前两者优点                 | **父类构造函数调用两次**       | ★★★★☆  |
| **原型式继承**     | 简单，适用于浅拷贝             | 引用类型共享                   | ★★☆☆☆  |
| **寄生式继承**     | 简单，可增强对象               | 方法无法复用，引用类型共享     | ★★☆☆☆  |
| **寄生组合式继承** | **堪称完美，ES5 最佳方案**     | 实现稍复杂                     | ★★★★★  |
| **混入继承**       | 灵活，功能组合                 | 易属性冲突                     | ★★★☆☆  |
| **ES6 `extends`**  | **语法简洁，现代 JS 最佳方案** | 只是语法糖                     | ★★★★★  |

## **5. 常见问题 (FAQ)**

### 5.1 `prototype` 和 `__proto__` 有什么区别？

- `prototype` 是**函数**特有的属性，指向一个对象，用于存放该构造函数创建的所有实例共享的属性和方法；这个对象自带一个 `constructor` 属性，指回构造函数本身。
- `__proto__` 是**每个对象**（包括函数、数组）都有的内部链接 `[[Prototype]]`，指向该对象的原型，标准读取方式是 `Object.getPrototypeOf(obj)`。
- **关系**: 它们是同一枚硬币的两面。`prototype` 是从**构造函数**的角度看“**模板**”是什么，`__proto__` 是从**实例**的角度看“**模板**”在哪里，二者通过 `new` 连接：`实例.__proto__ === 构造函数.prototype`。
- **例外**：ES6 的**箭头函数**没有自己的 `prototype` 属性，不能用作构造函数。
- 直接修改一个已存在对象的 `__proto__` 会破坏引擎的性能优化，推荐用 `Object.create()` 或 `class` / `extends` 代替。

### 5.2 忘记使用 `new` 关键字会发生什么？

直接调用 `Car(...)` 时，它只是一个普通函数：

- **非严格模式**下，函数内部的 `this` 指向**全局对象 (`window`)**，`this.make = ...` 会意外创建 `window.make`、`window.model` 等全局变量，污染全局作用域。
- **严格模式**下，`this` 是 `undefined`，给 `undefined` 设置属性（`this.make`）会直接抛出 `TypeError`。

构造函数与普通函数**没有本质区别**，任何函数都可以是构造函数，它们的区别完全在于**调用方式**：`new Car()` 是构造调用，`this` 指向新实例；`Car()` 是普通调用，`this` 指向 `window` 或 `undefined`。另外，构造函数**不需要**显式返回值，`new` 会隐式返回新实例，只有想返回一个完全不同的对象时才需要 `return`。

**安全模式**: 在构造函数内部检查调用方式，强制补上 `new`。

```js
function Person(name) {
  if (!(this instanceof Person)) {
    // 如果不是通过 new 调用，则强制用 new 调用并返回
    return new Person(name)
  }
  this.name = name
}
const p1 = new Person('Alice') // 正常
const p2 = Person('Bob') // 也能正确工作，p2 是一个 Person 实例
```

`class` 构造函数**必须**通过 `new` 调用，直接调用会报错，从语法层面避免了忘记 `new` 的问题。

### 5.3 `hasOwnProperty()` 和 `in` 操作符有什么区别？

- **`prop in obj`**: 检查 `prop` 是否在 `obj` 的**自身**或其**原型链**上。只要能通过原型链找到，就返回 `true`。
- **`obj.hasOwnProperty(prop)`**: **只**检查 `prop` 是否是 `obj` 的**自身属性**，不关心原型链。

```js
console.log('name' in myDog) // true (自身属性)
console.log('species' in myDog) // true (原型链属性)
console.log('toString' in myDog) // true (顶级原型链属性)

console.log(myDog.hasOwnProperty('name')) // true
console.log(myDog.hasOwnProperty('species')) // false
```

**注意**：`Object.create(null)` 创建的对象没有 `hasOwnProperty` 方法，此时可以用 `Object.hasOwn(obj, prop)`。

### 5.4 属性的“屏蔽”和引用类型共享是怎么回事？

- **屏蔽 (Shadowing)**: 当你试图给一个对象**赋值**一个原型链上已存在的同名属性时，会在**对象自身**上创建一个新属性，而不是修改原型链上的属性。这个自身属性会“**屏蔽**”原型链上的同名属性。

```js
myDog.species = 'Feline' // 在 myDog 自身上创建了一个新属性 species

console.log(myDog.species) // 'Feline' (优先访问自身属性)
console.log(myDog.hasOwnProperty('species')) // true

// 原型上的属性并未改变
const anotherDog = new Dog('Max')
console.log(anotherDog.species) // 'Canine'
```

**注意**: 如果原型链上的属性是 `setter`，则赋值操作会调用该 `setter`，而不会在自身创建新属性。

```javascript
// 1. 在原型上定义一个带有 getter 和 setter 的访问器属性 name
const proto = {
  _name: 'default',
  get name() {
    return this._name
  },
  set name(value) {
    console.log('Setter 被调用，值为:', value)
    this._name = value // 注意：这里的 this 指向实例，会在实例上创建 _name
  },
}

// 2. 创建一个以 proto 为原型的对象
const obj = Object.create(proto)

// 3. 对实例的 name 属性赋值
obj.name = 'Alice'

// 4. 检查结果
console.log('obj.hasOwnProperty("name"):', obj.hasOwnProperty('name')) // false
console.log('obj.name:', obj.name) // Alice（通过 getter 读取）
console.log('obj._name:', obj._name) // Alice（实例自身的 _name）
console.log('proto._name:', proto._name) // default（原型上的 _name 未被修改）
console.log('obj.hasOwnProperty("_name"):', obj.hasOwnProperty('_name')) // true
```

- **引用类型共享**: 原型是被所有实例**共享**的，如果原型上的属性是对象或数组（引用类型），所有实例访问到的都是**同一个**引用，通过某个实例修改它会影响到其他所有实例。

```js
function Cat() {}
Cat.prototype.hobbies = ['sleeping', 'eating']

const cat1 = new Cat()
const cat2 = new Cat()

cat1.hobbies.push('playing')

console.log(cat2.hobbies) // ['sleeping', 'eating', 'playing'] (cat2 被影响了！)
```

- **解决方案**: 将引用类型的属性定义在**构造函数**内部，使每个实例都有自己独立的副本，这正是**借用构造函数继承**要解决的问题。

### 5.5 `instanceof` 是如何工作的？

`A instanceof B` 运算符检查的是 `B.prototype` 对象是否出现在 `A` 的**原型链**上。它不是检查 `A` 是否由 `B` 直接创建。

```js
function instaceOf(target, origin) {
  //循环遍历直到找到指定原型返回true，否则返回false
  let proto = target.__proto__
  while (true) {
    if (proto === null) {
      return false
    }
    if (proto === origin.prototype) {
      return true
    }
    proto = proto.__proto__
  }
}
```

### 5.6 `Object.create(null)` 和 `{}` 有什么区别？

- `{}`（或 `new Object()`）创建的对象，其原型是 `Object.prototype`。
- `Object.create(null)` 创建一个**没有原型**的对象，其 `__proto__` 是 `null`。它不继承任何来自 `Object.prototype` 的方法（如 `toString`、`hasOwnProperty`），是一个绝对“**干净**”的、纯粹的“**字典**”对象，非常适合用作无副作用的哈希表；代价是读取属性时得更小心，例如用 `Object.hasOwn(obj, prop)` 判断自身属性。

### 5.7 为什么组合继承中 `constructor` 需要被修正？`Object.create()` 在继承中起了什么作用？

- **修正 `constructor`**: `Dog.prototype = new Animal()` 会用 `Animal` 的实例覆盖 `Dog` 的原型，而该实例的 `constructor` 指向 `Animal`，导致 `Dog` 实例的 `constructor` 也错误地指向 `Animal`，`Dog.prototype.constructor = Dog` 就是为了把这个指向修正回来。引用类型上的 `constructor` 可写，而基本类型上的 `constructor` 只读（它们由只读的原生构造函数创建），所以依赖一个对象的 `constructor` 属性并**不安全**。
- **`Object.create()` 的作用**: 在寄生组合式继承中，`Object.create(superType.prototype)` 创建了一个**新的空对象**，它的 `__proto__` 直接指向 `superType.prototype`。它替代了 `new superType()`，既建立了原型链的链接，又**避免了执行父类的构造函数**，从而不会在子类原型上留下多余的实例属性，这也是 `extends` 的底层实现。

### 5.8 ES6 的 `class` 和构造函数有什么关系？

ES6 的 `class` 是构造函数的**语法糖**，它提供了更清晰、更接近传统面向对象语言的写法，但底层实现**完全基于**构造函数和原型链，`extends` 的底层就是**寄生组合式继承**。

```js
class Car {
  constructor(make, model) {
    this.make = make
    this.model = model
  }

  getDetails() {
    // 这个方法会自动被添加到 Car.prototype 上
    return `${this.make} ${this.model}`
  }
}
// 上面的 class 写法，本质上等同于 Part 3 中的构造函数 + 原型方法的写法。
```

- `getDetails` 会被自动添加到 `Car.prototype` 上，实例共享同一个方法。
