# 构造器模式

## 1. 核心概念

构造器模式是一种**创建型设计模式**。它的目的是通过一个特定的函数（或类）来初始化新创建的对象，并为对象分配内存和属性。

| 维度 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **核心意图** | 为特定类型的对象定义一套“蓝图”，并批量生产具有相同结构的实例。 | **建筑图纸**。根据一张图纸可以盖出无数个结构相同的房间，但每个房间的内部装修（初始数据）可以不同。 |
| **主要优点** | 1. **代码复用**：避免重复写对象字面量；<br>2. **结构统一**：确保同一类对象拥有相同的属性和方法名；<br>3. **易于扩展**：通过原型链或继承轻松增加功能。 | |
| **主要缺点** | 如果不正确地使用原型（Prototype），会导致每个实例都冗余地持有相同的方法，造成内存浪费。 | |

## 2. 构造器模式的演进

### 2.1 传统函数式构造器 (ES5 及以前)
在 ES6 之前，JavaScript 使用普通函数配合 `new` 关键字来实现构造器。

```js
function Hero(name, role) {
  // 1. 属性定义在实例上
  this.name = name;
  this.role = role;

  // 2. ❌ 错误做法：将方法定义在构造函数内部
  // 这会导致每个实例都创建一份该函数的副本，浪费内存
  this.sayHello = function() {
    console.log(`我是${this.name}，我的职业是${this.role}`);
  };
}

// 3. ✅ 正确做法：将方法定义在原型对象上
Hero.prototype.attack = function() {
  console.log(`${this.name} 发起了进攻！`);
};

const garen = new Hero('盖伦', '战士');
garen.attack();
```

### 2.2 现代类写法 (ES6 Class)
ES6 引入了 `class` 关键字，这实际上是构造函数和原型模式的**语法糖**，让代码看起来更具条理。

```js
class Car {
  // 构造器：负责初始化属性
  constructor(brand, price) {
    this.brand = brand;
    this.price = price;
  }

  // 方法会自动添加到原型链上，所有实例共享
  drive() {
    console.log(`${this.brand} 正在行驶...`);
  }
}

const myCar = new Car('Tesla', 300000);
myCar.drive();
```

## 3. `new` 关键字到底做了什么？

理解构造器模式的关键在于理解 `new` 的执行过程。当你调用 `new Hero(...)` 时，发生了以下四件事：

*  **创建一个全新的空对象**（例如 `{}`）。
*  **链接原型**：将这个新对象的 `__proto__` 指向构造函数的 `prototype` 属性。
*  **绑定 `this` 并执行**：执行构造函数，将其中的 `this` 指向这个新对象，从而为它添加属性。
*  **返回新对象**：如果构造函数没有返回其他对象，则默认返回这个新创建的对象。

```js
function New(){
    var obj = new Object()
    //取出第一个参数
    var constructor = Array.prototype.shift.call(arguments)
    obj.__proto__ = constructor.prototype
    var ret = constructor.apply(obj, arguments)
    // 如果构造函数中return 了对象则返回对象
    return typeof ret === 'object' ? ret : obj
}
```


## 4. 常见问题 (FAQ)

### 4.1 如果调用构造器时忘记写 `new` 会怎样？
*   **答**：这是一个非常经典且危险的问题。
    *   在**非严格模式**下：`this` 会指向全局对象（浏览器里是 `window`），你会无意中修改全局变量，且函数不会返回对象（得到 `undefined`）。
    *   在**严格模式** (`'use strict'`) 下：`this` 是 `undefined`，尝试给它赋值会直接抛出错误。
    *   **解决方案**：现代开发中建议始终使用 `class`，因为 `class` 强制要求使用 `new`，否则会直接报错。

### 4.2 为什么要把方法写在 `prototype` 上，而不是 `constructor` 内部？
*   **答：为了内存性能。**
    *   写在 `constructor` 内：每个实例都会拥有一份独立的方法函数副本。如果有 1000 个实例，内存中就有 1000 个一模一样的函数。
    *   写在 `prototype` 上：所有实例共用同一个函数引用。无论有多少个实例，内存中只占一份空间。

### 4.3 构造函数可以有 `return` 吗？
*   **答**：可以，但要小心。
    *   如果返回的是**原始类型**（如数字、字符串）：会被忽略，依然返回新创建的实例。
    *   如果返回的是一个**新对象**：那么 `new` 的结果将不再是原本打算创建的实例，而是你 `return` 出来的那个对象。

### 4.4 箭头函数可以作为构造器吗？
*   **答：绝对不可以。**
    *   原因一：箭头函数没有自己的 `this`，它的 `this` 是在定义时捕获的上下文。
    *   原因二：箭头函数没有 `prototype` 属性。
    *   尝试对箭头函数使用 `new` 会导致脚本抛出 `TypeError`。

