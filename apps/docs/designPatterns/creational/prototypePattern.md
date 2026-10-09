# 原型模式

## 1. 核心概念

原型模式的核心思想是：**不通过实例化类来创建新对象，而是通过“**克隆**”或“**关联**”一个现有的对象（即原型对象）来创建新对象。**

[width(21,37,42)]

| 术语                 | 描述                                                                                           | 形象比喻                                                                     |
| :------------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| **核心定义**         | 以某个现有对象为原型，通过“**克隆**”或“**关联**”来创建新对象，新对象自动继承原型的属性与方法。 | **印刷母版**。印一万份报纸都从同一块母版翻印，母版改一次，之后印的都跟着变。 |
| **原型 (Prototype)** | 一个作为模版的对象。其他对象可以从中继承属性和方法。                                           | **细胞分裂**。新细胞从旧细胞中继承了所有的遗传信息。                         |
| **原型链 (Chain)**   | 对象通过 `__proto__` 属性层层向上链接，直到指向 `null` 的链条。                                | **族谱**。如果你在自己家找不到东西，就去爸爸家找，再找不到就去爷爷家找。     |
| **性能优势**         | 多个实例共享同一个方法，而不是每个实例都创建一份副本。                                         | **公共图书馆**。大家共用一本书，而不是每个人都买一本一模一样的。             |

**优点、缺点与取舍**

[width(15,85)]

| 维度           | 说明                                                                                                                        |
| :------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **主要优点**   | 1. 共享方法，内存占用低；<br>2. 创建新对象比走完整构造流程更轻量；<br>3. 支持运行时动态扩展对象能力。                       |
| **主要缺点**   | 1. 原型上的引用类型属性被所有实例共享，容易互相污染；<br>2. 原型链过深会拖慢属性查找；<br>3. 属性来源隐式，调试时不易追踪。 |
| **适用场景**   | 需要大量结构相同的对象、对象创建成本高于克隆、需要运行时给一批对象统一扩展能力。                                            |
| **不适用场景** | 对象结构差异大、含复杂嵌套引用且要求互相隔离、需要清晰独立状态的实体对象。                                                  |

## 2. 如何实现原型模式

在现代 JavaScript 中，实现原型模式主要有三种方式：

### 2.1 使用 `Object.create()` (标准做法)

这是最符合原型模式定义的方式，直接创建一个新对象，并指定其原型。

```js
const carPrototype = {
  drive() {
    console.log(`${this.brand} 正在行驶...`)
  },
  init(brand) {
    this.brand = brand
  },
}

// 以 carPrototype 为原型创建新对象
const myCar = Object.create(carPrototype)
myCar.init('Tesla')
myCar.drive() // Tesla 正在行驶...
```

### 2.2 使用构造函数的 `.prototype`

这是 ES5 时代的经典做法，也是面试常考点。

```js
function User(name) {
  this.name = name
}

// 将方法挂载在原型上，实现共享
User.prototype.sayHi = function () {
  console.log(`你好, 我是 ${this.name}`)
}

const user1 = new User('Alice')
const user2 = new User('Bob')
console.log(user1.sayHi === user2.sayHi) // true，共享同一个函数
```

### 2.3 ES6 `class` 语法糖

`class` 本质上只是原型模式的语法糖，它的底层依然是操作 `prototype`：类体里**不带 `static` 的实例方法**会被挂到 `ClassName.prototype` 上，由所有实例共享；带 `static` 的**类方法**挂在**类自身**（即构造函数）上，与原型无关，实例访问不到；只有在 `constructor` 里 `this.xxx = ...` 赋的值才落在实例自己身上。

```js
class User {
  constructor(name) {
    // 实例属性：每个实例各有一份
    this.name = name
  }

  // 实例方法：等价于 User.prototype.sayHi = function () {...}
  sayHi() {
    console.log(`你好, 我是 ${this.name}`)
  }

  // 类方法（static）：挂在类自身 User.create，不在原型上
  static create(name) {
    return new User(name)
  }
}

const user1 = new User('Alice')
const user2 = new User('Bob')

console.log(user1.sayHi === user2.sayHi) // true：共享原型上的同一个函数
console.log(user1.sayHi === User.prototype.sayHi) // true：实例方法确实挂在原型上
console.log(user1.hasOwnProperty('sayHi')) // false：它来自原型链，不是实例自身
console.log(Object.keys(user1)) // ['name']：被枚举的只有实例属性

console.log(typeof User.create) // 'function'：类方法挂在类自身
console.log(User.prototype.create) // undefined：它不在原型上，实例也访问不到
```

**反例：写成“类字段”就不再共享了。** 下面这种写法等价于在构造函数里执行 `this.sayHi = () => {...}`，方法落在了**实例**上，也就不再体现原型模式：

```js
class BadUser {
  constructor(name) {
    this.name = name
  }

  // 类字段：每个实例各创建一份函数副本
  sayHi = () => {
    console.log(`你好, 我是 ${this.name}`)
  }
}

const a = new BadUser('Alice')
const b = new BadUser('Bob')

console.log(a.sayHi === b.sayHi) // false：函数不共享
console.log(a.hasOwnProperty('sayHi')) // true：落在了实例自己身上
```

## 3. 原型模式的应用场景

[width(20,80)]

| 场景                      | 说明                                                                                 |
| :------------------------ | :----------------------------------------------------------------------------------- |
| **大规模对象创建**        | 当你需要创建成千上万个拥有相同方法的对象时，原型模式能显著降低内存占用。             |
| **插件/类库开发**         | 允许用户通过修改原型来扩展你的插件功能。                                             |
| **Polyfill (兼容性补丁)** | 给旧环境的内置对象（如 `Array.prototype`）手动添加新方法。                           |
| **框架底层机制**          | ES6 `class`、继承、`instanceof` 全都建立在原型链之上，理解原型就是理解 JS 面向对象。 |
| **框架 / 库扩展**         | 通过公共原型给所有实例增能，如 `Vue.prototype.$http = axios`、jQuery 的 `$.fn`。     |
| **纯字典对象**            | 用 `Object.create(null)` 造出没有原型的对象当哈希表，天然免疫原型污染。              |
| **对象浅拷贝**            | `{ ...obj }` / `Object.assign` 复制对象，是最轻量的“**以原型造新对象**”手段。        |

## 4. 关键语言特性与易错点

原型模式在 JS 里几乎等于“**原型机制本身**”，下面这些 API 与坑点必须掌握。

[width(27,30,43)]

| 特性 / API                   | 说明                                                 | 易错点                                                                 |
| :--------------------------- | :--------------------------------------------------- | :--------------------------------------------------------------------- |
| `Object.create(proto)`       | 指定原型创建对象，不执行任何构造逻辑。               | 传 `Object.create(null)` 后对象没有 `toString` 等方法，直接用会报错。  |
| `Object.getPrototypeOf(obj)` | 读取对象的原型（`__proto__` 的标准替代）。           | 不要用会**修改**原型的 `Object.setPrototypeOf`，它在热路径上性能很差。 |
| `hasOwnProperty` / `in`      | `hasOwnProperty` 只看自身；`in` 会**沿原型链**查找。 | 用 `in` 判断“**对象有没有这个属性**”时会误判从原型继承来的属性。       |
| 展开 / `Object.assign`       | 二者都是**浅拷贝**，只复制第一层。                   | 深层的对象 / 数组仍是引用共享，改一处会牵连另一处。                    |
| `structuredClone(obj)`       | 浏览器原生的**深拷贝**，支持循环引用。               | 不能克隆函数、`Symbol`、DOM 节点，遇到会直接抛错。                     |
| `instanceof`                 | 沿原型链判断实例归属，可手写实现加深理解。           | 原型被替换（`A.prototype = {}`）后，旧实例的 `instanceof` 判断会失效。 |

## 5. 常见问题 (FAQ)

### 5.1 `__proto__` 和 `prototype` 有什么区别？

- **`prototype`**：是**函数**特有的属性。它定义了由该构造函数创建的所有实例将继承什么。
- **`__proto__`**：是**每个对象**（包括函数对象）都有的隐藏属性。它指向该对象的原型（即它从谁那里继承来的）。
- **关系**：`obj.__proto__ === Object.getPrototypeOf(obj) === Constructor.prototype`。

### 5.2 什么是“原型污染”？

如果你修改了内置对象的原型（如 `Object.prototype.abc = 123`），那么系统中**所有的对象**都会受到影响。这会导致极难排查的 Bug，甚至引发安全漏洞。

### 5.3 在原型上定义“引用类型”属性（如数组）会有什么问题？

**会有共享修改的问题。**

```js
function Student() {}
Student.prototype.friends = ['Tom'] // 引用类型在原型上
const s1 = new Student()
const s2 = new Student()
s1.friends.push('Jerry')
console.log(s2.friends) // ['Tom', 'Jerry'] —— 跟着变了！
```

- **解决**：属性（特别是状态数据）应该定义在构造函数内部，而方法定义在原型上。

### 5.4 原型链查找会影响性能吗？

**会。** 如果原型链过深，查找一个不存在的属性会遍历整条链直到顶端，这比较耗时，使用 `hasOwnProperty()` 可以检查属性是对象自身的还是原型链上的，它不会向上查找。

### 5.5 `Object.create(null)` 是做什么用的？

它会创建一个**绝对纯净**的对象，没有 `__proto__`，也不继承任何 `Object.prototype` 的方法（如 `toString`）。常用于作为纯粹的数据字典/哈希表。
