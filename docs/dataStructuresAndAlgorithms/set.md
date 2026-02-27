# 集合 (Set)

## 1. 核心概念与特性

**集合 (Set)** 是一种包含**不同元素**的数据结构。它的核心设计理念直接来源于数学中的集合论。

| 特性 | 描述 |
| :--- | :--- |
| **绝对唯一性** | 集合中**不能包含重复的元素**。如果你试图添加一个已经存在的元素，集合会直接忽略它。 |
| **无序性 (理论上)** | 在传统的数学定义中，集合是无序的。但**在 JavaScript 的 ES6 `Set` 实现中，元素是按照插入的顺序进行迭代的**。 |
| **键值一致** | 集合没有传统意义上的键（Key），它的键和值是相同的。 |
| **类型宽容** | 一个集合中可以同时存储不同类型的值（如数字、字符串、对象引用）。 |

## 2. ES6 原生 `Set` 的核心操作

现代开发中，我们绝大多数情况直接使用 ES6 原生的 `Set`，其底层经过了高度优化。

### 2.1 基础增删改查
```js
const mySet = new Set();
// 可以用数组初始化并自动去重
const numberSet = new Set([1, 2, 2, 3]); // {1, 2, 3}

mySet.add(1);          // 添加元素
mySet.add("Hello");
mySet.add(1);          // 尝试添加重复元素，被忽略

console.log(mySet.has(1));  // 判断存在: true (O(1) 复杂度)
console.log(mySet.size);    // 获取大小: 2 (属性，不是方法)

mySet.delete(1);       // 删除元素
mySet.clear();         // 清空集合
```

### 2.2 集合的数学运算
ES6 原生没有直接提供交、并、差集方法，需要结合数组来实现：

```js
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4, 5]);

// 并集 (Union)
const union = new Set([...setA, ...setB]); // Set { 1, 2, 3, 4, 5 }

// 交集 (Intersection)
const intersection = new Set([...setA].filter(x => setB.has(x))); // Set { 2, 3 }

// 差集 (Difference: A - B)
const difference = new Set([...setA].filter(x => !setB.has(x))); // Set { 1 }
```

## 3. 手写模拟实现一个集合类

在 ES6 出现之前，或者在面试中考察基础数据结构理解时，我们通常使用 JavaScript 的**普通对象 (`Object`)** 来模拟集合。因为对象的键天然具有**唯一性**，这完美契合了集合的特性。

```js
class MySet {
  constructor() {
    // 使用对象来存储数据，保证键的唯一性
    this.items = {};
  }

  // 1. 检查元素是否存在于集合中
  has(element) {
    // 使用 Object.prototype.hasOwnProperty 确保不是继承来的属性
    return Object.prototype.hasOwnProperty.call(this.items, element);
  }

  // 2. 向集合添加新元素
  add(element) {
    if (!this.has(element)) {
      // 在对象中，键和值都设为同一个元素
      this.items[element] = element;
      return true;
    }
    return false; // 元素已存在，添加失败
  }

  // 3. 从集合中移除元素
  delete(element) {
    if (this.has(element)) {
      delete this.items[element];
      return true;
    }
    return false;
  }

  // 4. 清空集合
  clear() {
    this.items = {};
  }

  // 5. 获取集合的大小
  size() {
    // 现代浏览器可以直接使用 Object.keys 的长度
    return Object.keys(this.items).length;
    
    // 如果要兼容非常古老的浏览器，需要手动遍历：
    // let count = 0;
    // for (let key in this.items) {
    //   if (this.items.hasOwnProperty(key)) { count++; }
    // }
    // return count;
  }

  // 6. 提取所有元素组成的数组 (以便后续进行遍历或数学运算)
  values() {
    // Object.values() 会将对象的所有值放入一个数组中返回
    return Object.values(this.items);
  }
}

// === 测试模拟的集合 ===
const set = new MySet();
set.add(1);
set.add(2);
set.add(2); // 不会重复添加

console.log(set.values()); // 输出: [1, 2]
console.log(set.has(1));   // 输出: true
console.log(set.size());   // 输出: 2

set.delete(1);
console.log(set.values()); // 输出: [2]
```

**模拟实现的局限性 (重要)**

使用对象模拟集合有一个天然的缺陷：**JavaScript 对象的键只能是字符串（或 Symbol）**。
如果你执行 `set.add(1)`，它在底层会被转换为 `this.items["1"] = 1`。
这意味着如果你同时添加数字 `1` 和字符串 `"1"`，在这个模拟实现中，它们会被认为是**同一个元素**从而被覆盖。而真正的 ES6 `Set` 是可以区分它们的。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 ES6 的 `Set` 判断元素是否重复的标准是什么？
*   **答**：使用的算法叫做 [**SameValueZero**](/js/eightTypes#_3-6-零值相等-samevaluezero)。它几乎等同于严格相等 `===`，但有一个极大的**例外：`NaN`**。
*   在 `===` 运算符中，`NaN === NaN` 是 `false`。但是在 `Set` 内部，**`NaN` 被认为是等于 `NaN` 的**。所以一个 `Set` 中只能存在一个 `NaN`。

### 4.2 向 `Set` 中添加两个内容一模一样的对象，会被去重吗？
*   **答：不会。**
    ```js
    const objSet = new Set();
    objSet.add({ a: 1 });
    objSet.add({ a: 1 });
    console.log(objSet.size); // 2
    ```
*   **原因**：JavaScript 中的对象是**引用类型**。两个长得一样的对象，在内存中的地址是不同的。`Set` 比较的是它们的内存地址（引用）。

### 4.3 `WeakSet` 是什么？和 `Set` 有什么区别？
*   **概念**：`WeakSet` 是“弱集合”。
*   **区别:**
    *   **类型限制**：`WeakSet` 内部**只能存储对象**（或 Symbol），不能存储基本数据类型。
    *   **垃圾回收机制 - 核心**：在普通的 `Set` 中，即使一个对象在外部没有被任何变量引用，只要它还在 `Set` 里，垃圾回收器（GC）就不会回收它（容易造成内存泄漏）。而 `WeakSet` 对对象的引用是**“弱引用”**。如果一个对象只被 `WeakSet` 引用，GC 会直接将其销毁并从 `WeakSet` 中移除。
    *   **不可遍历**：正因为其内部元素随时可能被 GC 偷偷删掉，`WeakSet` **不支持遍历**（没有 `forEach`, `size` 等方法）。
*   **适用场景**：为 DOM 节点打标签，当节点被移除时，WeakSet 里的记录自动清理，防内存泄漏。