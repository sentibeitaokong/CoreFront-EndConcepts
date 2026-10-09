# 迭代器模式

## 1. 核心概念与价值

迭代器模式建立了一套统一的接口，使得我们可以用同样的方式去遍历不同的数据结构（如数组、集合、映射甚至是自定义的树结构）。

[width(15,85)]

| 维度           | 描述                                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心意图**   | 分离集合对象的遍历行为。让集合只关注数据存储，让迭代器关注数据遍历。                                                                                                                                       |
| **关键角色**   | `Iterator`（提供 `next()`，返回 `{ value, done }`）、`Iterable`（提供 `[Symbol.iterator]()` 返回迭代器）、`Client`（用 `for...of`、展开语法消费迭代器）。                                                  |
| **主要优点**   | 1. **统一接口**：为不同的集合结构提供一致的访问方式（如 `for...of`）；<br>2. **惰性求值**：只有在需要时才计算下一个值，非常节省内存；<br>3. **解耦**：遍历逻辑与数据结构解耦，修改遍历逻辑不影响数据结构。 |
| **主要缺点**   | 对于极其简单的数组遍历，使用迭代器模式可能显得代码量略多。                                                                                                                                                 |
| **适用场景**   | 1. 需要按统一方式遍历不同结构（数组、`Map`、`Set`、树、链表）；<br>2. 数据量极大或无限，希望“**按需读取**”；<br>3. 数据分批、异步获取（分页、流）。                                                        |
| **不适用场景** | 1. 只是简单遍历数组或对象，`for` / `forEach` 已足够；<br>2. 需要随机访问（`arr[i]`），迭代器只能顺序前进。                                                                                                 |

## 2. JavaScript 中的迭代器协议

在 ES6 中，迭代器模式通过两个协议来实现：**可迭代协议** 和 **迭代器协议**。

### 2.1 迭代器协议 (Iterator Protocol)

一个对象要成为“**迭代器**”，必须实现一个 `next()` 方法，该方法返回一个包含两个属性的对象：

- `value`: 当前迭代的值。
- `done`: 布尔值，如果迭代已结束则为 `true`。

### 2.2 可迭代协议 (Iterable Protocol)

一个对象要成为“**可迭代的**”，必须实现 `Symbol.iterator` 方法，该方法返回一个迭代器。

### 2.3 与迭代器相关的原生能力

掌握这几个内置 API，面试与实战基本够用：

- **原生可迭代对象**：`Array`、`String`、`Map`、`Set`、`TypedArray`、`arguments`、Node 的 Stream 都自带 `Symbol.iterator`。
- **消费迭代器的语法**：`for...of`、展开 `[...it]`、解构 `const [a, b] = it`、`Array.from(it)`、`new Map(entries)`。
- **`yield*`**：在生成器里委托另一个可迭代对象，等价于把它的元素“**拆开**”依次 `yield`。
- **`next(value)` 传参**：调用 `gen.next(x)` 时，`x` 会成为上个 `yield` 表达式的返回值，是“**生成器做双向通信**”的关键。
- **`return()` / `throw()`**：迭代器可选实现这两个方法，分别在提前退出（如 `break`）和向生成器注入异常时被调用。
- **易错点**：普通对象 `{}` 默认不可迭代（`for...of` 会报错），而 `for...in` 会连原型链上的属性一起遍历，切勿混用。

## 3. 代码实现示例

### 3.1 手写一个自定义迭代器（Range 示例）

假设我们要创建一个逻辑上的数字序列，而不实际创建一个大数组。

```js
const createRangeIterator = (start, end) => {
  let nextIndex = start

  return {
    // 必须实现 next 方法
    next: function () {
      if (nextIndex <= end) {
        return { value: nextIndex++, done: false }
      }
      return { value: undefined, done: true }
    },
    // 为了支持 for...of，必须实现 [Symbol.iterator]
    [Symbol.iterator]: function () {
      return this
    },
  }
}

const range = createRangeIterator(1, 3)
for (let num of range) {
  console.log(num) // 输出: 1, 2, 3
}
```

### 3.2 使用生成器 (Generators) —— 现代写法

生成器是实现迭代器模式的“**语法糖**”，它极大地简化了代码。

```js
function* countGenerator(start, end) {
  for (let i = start; i <= end; i++) {
    yield i // 自动处理 value 和 done
  }
}

const gen = countGenerator(1, 3)
console.log(gen.next()) // { value: 1, done: false }
```

### 3.3 生成器实战：惰性管道

把 `map` / `filter` 用生成器改写，元素会“**流经**”整条管道，不产生中间数组：

```js
function* map(iterable, fn) {
  for (const item of iterable) yield fn(item)
}

function* filter(iterable, predicate) {
  for (const item of iterable) {
    if (predicate(item)) yield item
  }
}

function* take(iterable, n) {
  let count = 0
  for (const item of iterable) {
    if (count++ >= n) return
    yield item
  }
}

const result = [
  ...take(
    filter(
      map([1, 2, 3, 4, 5], x => x * 2),
      x => x > 4,
    ),
    2,
  ),
]
console.log(result) // [6, 8]
```

配合“**无限序列**”使用时，`take` 能保证管道及时停下。

## 4. 典型应用场景

[width(22,78)]

| 场景                   | 说明                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **处理大数据集**       | 迭代器是“**按需读取**”的。如果你要处理一个包含百万条数据的逻辑序列，迭代器不需要一次性把数据存入内存。         |
| **自定义数据结构**     | 比如你写了一个“**二叉树**”或“**链表**”，只要实现了 `Symbol.iterator`，别人就可以直接用 `for...of` 遍历你的树。 |
| **分页加载**           | 可以封装一个迭代器，每次 `next()` 时去后端请求下一页数据。                                                     |
| **解构与展开**         | `const [a, b] = list`、`[...set]`、`Array.from(map)` 都是迭代器协议的语法糖，能让自定义结构无缝融入原生语法。  |
| **无限序列 / 唯一 ID** | 生成器可以无限产出值而不撑爆内存，常用于 ID 生成器、随机数、分页游标。                                         |
| **惰性管道**           | 用生成器把 `map` / `filter` / `take` 串成管道，元素走完整个管道才产出一个，避免生成中间数组。                  |
| **异步流**             | Node 的 Readable Stream、`for await...of` 消费分页 API，都是异步迭代器的典型落地。                             |

## 5. 常见问题 (FAQ)

### 5.1 `for...in` 和 `for...of` 有什么区别？

这是初学者最容易混淆的点：

- **`for...in`**：遍历的是对象的**键（Index/Key）**。它会遍历原型链上的属性，通常用于普通对象，不推荐用于数组。
- **`for...of`**：遍历的是**值（Value）**。它专门为实现迭代器协议的对象设计。

### 5.2 迭代器是一次性的吗？

**通常是的。** 一旦迭代器的 `done` 变为 `true`，再次调用 `next()` 通常会一直返回 `{ done: true }`。如果你想重新遍历，通常需要调用 `Symbol.iterator` 重新获取一个新的迭代器实例。

### 5.3 如何判断一个对象是否是可迭代的？

检查它是否有 `Symbol.iterator` 属性且是一个函数：

```js
const isIterable = obj =>
  obj != null && typeof obj[Symbol.iterator] === 'function'
console.log(isIterable([])) // true
console.log(isIterable({})) // false
```

### 5.4 什么是“异步迭代器” (Async Iterator)？

这是 ES2018 引入的特性。如果你的数据源是异步的（如读取流或 API 请求），可以使用 `Symbol.asyncIterator` 和 `for await...of`。这在处理 Node.js 的 Readable Streams 时非常有用。
