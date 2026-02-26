# 迭代器模式

## 1. 核心概念与价值

迭代器模式建立了一套统一的接口，使得我们可以用同样的方式去遍历不同的数据结构（如数组、集合、映射甚至是自定义的树结构）。

| 维度 | 描述 |
|---|---|
| **核心意图** | 分离集合对象的遍历行为。让集合只关注数据存储，让迭代器关注数据遍历。 |
| **主要优点** | 1. **统一接口**：为不同的集合结构提供一致的访问方式（如 `for...of`）；<br>2. **惰性求值**：只有在需要时才计算下一个值，非常节省内存；<br>3. **解耦**：遍历逻辑与数据结构解耦，修改遍历逻辑不影响数据结构。 |
| **主要缺点** | 对于极其简单的数组遍历，使用迭代器模式可能显得代码量略多。 |

## 2. JavaScript 中的迭代器协议 

在 ES6 中，迭代器模式通过两个协议来实现：**可迭代协议** 和 **迭代器协议**。

### 2.1 迭代器协议 (Iterator Protocol)
一个对象要成为“迭代器”，必须实现一个 `next()` 方法，该方法返回一个包含两个属性的对象：
*   `value`: 当前迭代的值。
*   `done`: 布尔值，如果迭代已结束则为 `true`。

### 2.2 可迭代协议 (Iterable Protocol)
一个对象要成为“可迭代的”，必须实现 `Symbol.iterator` 方法，该方法返回一个迭代器。

## 3. 代码实现示例 

### 3.1 手写一个自定义迭代器（Range 示例）
假设我们要创建一个逻辑上的数字序列，而不实际创建一个大数组。

```javascript
const createRangeIterator = (start, end) => {
  let nextIndex = start;
  
  return {
    // 必须实现 next 方法
    next: function() {
      if (nextIndex <= end) {
        return { value: nextIndex++, done: false };
      }
      return { value: undefined, done: true };
    },
    // 为了支持 for...of，必须实现 [Symbol.iterator]
    [Symbol.iterator]: function() { return this; }
  };
};

const range = createRangeIterator(1, 3);
for (let num of range) {
  console.log(num); // 输出: 1, 2, 3
}
```

### 3.2 使用生成器 (Generators) —— 现代写法
生成器是实现迭代器模式的“语法糖”，它极大地简化了代码。

```javascript
function* countGenerator(start, end) {
  for (let i = start; i <= end; i++) {
    yield i; // 自动处理 value 和 done
  }
}

const gen = countGenerator(1, 3);
console.log(gen.next()); // { value: 1, done: false }
```

## 4. 典型应用场景 

| 场景 | 说明 |
|---|---|
| **处理大数据集** | 迭代器是“按需读取”的。如果你要处理一个包含百万条数据的逻辑序列，迭代器不需要一次性把数据存入内存。 |
| **自定义数据结构** | 比如你写了一个“二叉树”或“链表”，只要实现了 `Symbol.iterator`，别人就可以直接用 `for...of` 遍历你的树。 |
| **分页加载** | 可以封装一个迭代器，每次 `next()` 时去后端请求下一页数据。 |

## 5. 常见问题 (FAQ)

### 5.1 `for...in` 和 `for...of` 有什么区别？
这是初学者最容易混淆的点：
*   **`for...in`**：遍历的是对象的**键（Index/Key）**。它会遍历原型链上的属性，通常用于普通对象，不推荐用于数组。
*   **`for...of`**：遍历的是**值（Value）**。它专门为实现迭代器协议的对象设计。

### 5.2 迭代器是一次性的吗？
*   **答：通常是的。** 一旦迭代器的 `done` 变为 `true`，再次调用 `next()` 通常会一直返回 `{ done: true }`。如果你想重新遍历，通常需要调用 `Symbol.iterator` 重新获取一个新的迭代器实例。

### 5.3 如何判断一个对象是否是可迭代的？
*   **答**：检查它是否有 `Symbol.iterator` 属性且是一个函数：
    ```javascript
    const isIterable = obj => obj != null && typeof obj[Symbol.iterator] === 'function';
    console.log(isIterable([])); // true
    console.log(isIterable({})); // false
    ```

### 5.4 什么是“异步迭代器” (Async Iterator)？
*   **答**：这是 ES2018 引入的特性。如果你的数据源是异步的（如读取流或 API 请求），可以使用 `Symbol.asyncIterator` 和 `for await...of`。这在处理 Node.js 的 Readable Streams 时非常有用。

