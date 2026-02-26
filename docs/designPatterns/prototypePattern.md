# 原型模式

## 1. 核心概念

原型模式的核心思想是：**不通过实例化类来创建新对象，而是通过“克隆”或“关联”一个现有的对象（即原型对象）来创建新对象。**

| 术语 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **原型 (Prototype)** | 一个作为模版的对象。其他对象可以从中继承属性和方法。 | **细胞分裂**。新细胞从旧细胞中继承了所有的遗传信息。 |
| **原型链 (Chain)** | 对象通过 `__proto__` 属性层层向上链接，直到指向 `null` 的链条。 | **族谱**。如果你在自己家找不到东西，就去爸爸家找，再找不到就去爷爷家找。 |
| **性能优势** | 多个实例共享同一个方法，而不是每个实例都创建一份副本。 | **公共图书馆**。大家共用一本书，而不是每个人都买一本一模一样的。 |

## 2. 如何实现原型模式

在现代 JavaScript 中，实现原型模式主要有三种方式：

### 2.1 使用 `Object.create()` (标准做法)
这是最符合原型模式定义的方式，直接创建一个新对象，并指定其原型。

```javascript
const carPrototype = {
  drive() { console.log(`${this.brand} 正在行驶...`); },
  init(brand) { this.brand = brand; }
};

// 以 carPrototype 为原型创建新对象
const myCar = Object.create(carPrototype);
myCar.init('Tesla');
myCar.drive(); // Tesla 正在行驶...
```

### 2.2 使用构造函数的 `.prototype`
这是 ES5 时代的经典做法，也是面试常考点。

```javascript
function User(name) {
  this.name = name;
}

// 将方法挂载在原型上，实现共享
User.prototype.sayHi = function() {
  console.log(`你好, 我是 ${this.name}`);
};

const user1 = new User('Alice');
const user2 = new User('Bob');
console.log(user1.sayHi === user2.sayHi); // true，共享同一个函数
```

### 2.3 ES6 `class` 语法糖
`class` 本质上只是原型模式的语法糖，它的底层依然是操作 `prototype`。

```js
class User {
    constructor(name) {
        this.name = name;
    }
    sayHi = function() {
        console.log(`你好, 我是 ${this.name}`);
    };
}
const user1 = new User('Alice');
const user2 = new User('Bob');
console.log(user1.sayHi === user2.sayHi); // false，函数不共享
```

## 3. 原型模式的应用场景

| 场景 | 说明 |
| :--- | :--- |
| **大规模对象创建** | 当你需要创建成千上万个拥有相同方法的对象时，原型模式能显著降低内存占用。 |
| **插件/类库开发** | 允许用户通过修改原型来扩展你的插件功能。 |
| **Polyfill (兼容性补丁)** | 给旧环境的内置对象（如 `Array.prototype`）手动添加新方法。 |

## 4. 常见问题 (FAQ)

### 4.1  `__proto__` 和 `prototype` 有什么区别？
这是最容易混淆的一点：
*   **`prototype`**：是**函数**特有的属性。它定义了由该构造函数创建的所有实例将继承什么。
*   **`__proto__`**：是**每个对象**（包括函数对象）都有的隐藏属性。它指向该对象的原型（即它从谁那里继承来的）。
*   **关系**：`obj.__proto__ === Object.getPrototypeOf(obj) === Constructor.prototype`。

### 4.2 什么是“原型污染”？
*   **答**：如果你修改了内置对象的原型（如 `Object.prototype.abc = 123`），那么系统中**所有的对象**都会受到影响。这会导致极难排查的 Bug，甚至引发安全漏洞。
*   **准则**：除非在写补丁（Polyfill），否则**永远不要修改内置对象的原型**。

### 4.3 在原型上定义“引用类型”属性（如数组）会有什么问题？
*   **答：会有共享修改的问题。**
    ```javascript
    function Student() {}
    Student.prototype.friends = ['Tom']; // 引用类型在原型上
    const s1 = new Student();
    const s2 = new Student();
    s1.friends.push('Jerry');
    console.log(s2.friends); // ['Tom', 'Jerry'] —— 跟着变了！
    ```
*   **解决**：属性（特别是状态数据）应该定义在构造函数内部，而方法定义在原型上。

### 4.4 原型链查找会影响性能吗？
*   **答：会。** 如果原型链过深，查找一个不存在的属性会遍历整条链直到顶端，这比较耗时。
*   **技巧**：使用 `hasOwnProperty()` 可以检查属性是对象自身的还是原型链上的，它不会向上查找。

### 4.5 `Object.create(null)` 是做什么用的？
*   **答**：它会创建一个**绝对纯净**的对象，没有 `__proto__`，也不继承任何 `Object.prototype` 的方法（如 `toString`）。常用于作为纯粹的数据字典/哈希表。

