---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 赋值、浅拷贝与深拷贝 (Copy)

JavaScript 的两种数据类型及其存储方式,这三者的区别，本质上就是对“**引用类型**”进行操作时的不同行为。

- **原始类型 (Primitive Types)**: `String`, `Number`, `Boolean`, `null`, `undefined`, `Symbol`, `BigInt`。
  - **存储**: 值直接存储在**栈 (Stack)** 内存中。
  - **行为**: 变量持有的是**值的本身**。

- **引用类型 (Reference Types)**: `Object`, `Array`, `Function`, `Map`, `Set` 等。
  - **存储**: 数据本身（对象）存储在**堆 (Heap)** 内存中，而变量持有的是一个指向该数据的**内存地址（引用）**。
  - **行为**: 变量持有的是一个“**指针**”。

> 关于原始值/引用值在栈堆中的存储细节，见 [内存空间](/js/basic/memorySpace)。

## 1. 赋值 (Assignment)

**定义**: 将一个变量赋值给另一个变量时，复制的是变量**持有**的内容。

**行为**:

- **原始类型**：复制**值本身**，赋值后两个变量完全独立。
- **引用类型**：复制**内存地址**，赋值后两个变量指向**同一个**堆内存中的对象。

**结论**: 赋值**永远不会**产生新对象/数组，只是为同一事物创建了另一个“**标签**”。

### 1.1 **原始类型赋值:**

```js
let a = 100
let b = a // b 得到了 100 这个值的副本

b = 200 // 修改 b
console.log(a) // 100 (a 完全不受影响)
```

### 1.2 **引用类型赋值:**

```js
let objA = { name: 'Alice' }
let objB = objA // objB 得到了 objA 持有的内存地址

objB.name = 'Bob' // 通过 objB 修改了堆内存中的对象
console.log(objA.name) // 'Bob' (objA 也受到了影响，因为它们指向同一个对象)
```

## 2. 浅拷贝 (Shallow Copy)

**定义**: 创建一个**新对象/数组**，只复制原始对象/数组的**第一层**属性/元素。

**行为**:

- 第一层是**原始类型**：复制**值**。
- 第一层是**引用类型**：复制**内存地址**。

**结论**: 仅在**顶层**独立，内部嵌套的引用类型在新旧对象间**仍然共享**。

### 2.1 `Object.assign()`

Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。

```js
let a = {
  name: 'javascript',
  book: {
    title: "You Don't Know JS",
    price: '45',
  },
}
let b = Object.assign({}, a)
console.log(b)
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "45"}
// }

a.name = 'change'
a.book.price = '55'
console.log(a)
// {
// 	name: "change",
// 	book: {title: "You Don't Know JS", price: "55"}
// }

console.log(b)
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "55"}
// }
```

### 2.2 `Spread`（展开语法）

```js
let a = {
  name: 'javascript',
  book: {
    title: "You Don't Know JS",
    price: '45',
  },
}
let b = { ...a }
console.log(b)
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "45"}
// }

a.name = 'change'
a.book.price = '55'
console.log(a)
// {
// 	name: "change",
// 	book: {title: "You Don't Know JS", price: "55"}
// }

console.log(b)
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "55"}
// }
```

### 2.3 `Array.prototype.slice()`和`Array.prototype.concat()`

```js
let a = [0, '1', [2, 3]]
//let b = a.concat();
let b = a.slice(1)
console.log(b)
// ["1", [2, 3]]

a[1] = '99'
a[2][0] = 4
console.log(a)
// [0, "99", [4, 3]]

console.log(b)
//  ["1", [4, 3]]
```

## 3. 深拷贝 (Deep Copy)

**定义**: 创建**完全独立**的新对象/数组，**递归**复制原始对象/数组的所有层级。

**行为**: 无论嵌套多少层，所有引用类型都会被重新创建，而不是只复制地址。

**结论**: 深拷贝后，新旧对象**完全隔离**，互不影响。

### 3.1 [`JSON.parse(JSON.stringify(obj))`](/js/basic/jsonSerialize)

这是最广为人知、最简单的深拷贝方法。它巧妙地利用了 `JSON` 的两个方法，将 JavaScript 对象转换为 JSON 字符串，然后再解析回新的 JavaScript 对象。

#### 3.1.1 优点

[width(25,75)]

| 优点               | 说明                                                                   |
| :----------------- | :--------------------------------------------------------------------- |
| 极其简单           | 一行代码即可实现，非常直观                                             |
| 原生支持           | 浏览器和 Node.js 环境均可用，无需任何外部库                            |
| 处理 JSON 安全类型 | 完美处理 `Object` / `Array` / `String` / `Number` / `Boolean` / `null` |

#### 3.1.2 缺陷

这种方法并非万能，它的“**不安全**”之处在于 `JSON` 格式本身的限制：

[width(22,78)]

| 问题             | 表现                                                                  |
| :--------------- | :-------------------------------------------------------------------- |
| 丢失特定类型     | `undefined` / `Symbol` / `Function` 属性会**直接丢失**                |
| 错误转换特殊对象 | `Date` → 字符串；`RegExp`、`Error` → `{}`；`NaN`、`Infinity` → `null` |
| 无法处理循环引用 | 抛出 `TypeError: Converting circular structure to JSON`               |

```js
const original = {
  num: 1,
  str: 'hello',
  undef: undefined,
  func: () => {},
  date: new Date(),
  regex: /a/g,
  sub: { a: 1 },
}

const copied = JSON.parse(JSON.stringify(original))

console.log(copied)
/*
Output:
{
  "num": 1,
  "str": "hello",
  "date": "2023-10-27T...", // 变成了字符串！
  "regex": {},             // 变成了空对象！
  "sub": { "a": 1 }
}
// func 和 undef 属性直接消失了！
*/
```

#### 3.1.3 适用场景

- 当你**非常确定**要拷贝的数据是**纯粹的、JSON 安全的**（例如，从后端 API 获取的、不包含复杂类型的 JSON 数据）。
- 需要快速实现，且不关心上述缺陷时。

### 3.2 `structuredClone(obj)` (现代最佳实践)

这是一个由 Web API 提供的**全局函数**，专门用于深拷贝。它在现代浏览器和 Node.js v17+ 中可用。

#### 3.2.1 优点

[width(22,78)]

| 优点             | 说明                                                                                                              |
| :--------------- | :---------------------------------------------------------------------------------------------------------------- |
| 原生 API         | 官方推荐、最现代的深拷贝方案                                                                                      |
| 性能优秀         | 底层由 C++ 实现，通常比手写 JavaScript 递归快得多                                                                 |
| 支持循环引用     | 能正确处理循环引用的对象，不会报错                                                                                |
| 支持多种复杂类型 | 远超 `JSON` 方法，能正确处理 `Date` / `RegExp` / `Map` / `Set` / `Blob` / `File` / `ArrayBuffer` / `ImageData` 等 |

#### 3.2.2 缺点

[width(25,75)]

| 缺点               | 说明                                                            |
| :----------------- | :-------------------------------------------------------------- |
| 不能拷贝函数       | 抛出 `DataCloneError`（函数拷贝需保留闭包作用域，设计上不支持） |
| 不能拷贝 DOM 节点  | 抛出 `DataCloneError`                                           |
| 不会拷贝原型链     | 新对象 `__proto__` 指向 `Object.prototype`，丢失原始原型        |
| 属性描述符不会拷贝 | `getters` / `setters` / `writable: false` 等特性会丢失          |

```js
const original = {
  date: new Date(),
  regex: /a/g,
  map: new Map([['a', 1]]),
  set: new Set([1, 2]),
  details: { nested: true },
}
original.circular = original // 循环引用

const copied = structuredClone(original)

console.log(copied.date instanceof Date) // true
console.log(copied.map.get('a')) // 1
console.log(copied.details === original.details) // false
console.log(copied.circular === copied) // true (循环引用被正确处理)
```

#### 3.2.3 适用场景

- **绝大多数需要深拷贝的场景**。
- 当你需要处理 `Date`, `Map`, `Set` 等复杂数据结构时。
- 当数据可能存在循环引用时。
- **只要你不需要拷贝函数，就应该首选 `structuredClone`**。

### 3.3 Lodash `_.cloneDeep()`

#### 3.3.1 优点

[width(25,75)]

| 优点               | 说明                                                             |
| :----------------- | :--------------------------------------------------------------- |
| 功能最强大、最完善 | 被认为是 JavaScript 深拷贝的“**黄金标准**”                       |
| 处理类型极其广泛   | 能正确处理函数、`Symbol`、DOM 节点、原型链、属性描述符等边缘情况 |
| 性能优异           | 内部实现经过高度优化                                             |

#### 3.3.2 缺点

[width(45,55)]

| 缺点         | 说明             |
| :----------- | :--------------- |
| 需引入外部库 | 增加了项目的体积 |

```js
// 需要先安装 lodash: npm install lodash
const _ = require('lodash')

const original = {
  func: () => console.log('hello'),
  // ... 其他各种复杂类型
}

const copied = _.cloneDeep(original)

copied.func() // 'hello' (函数也被拷贝了)
```

#### 3.3.3 适用场景

- **任何复杂的生产环境项目**。
- 当你不确定数据结构，或需要处理函数等 `structuredClone` 不支持的类型时。
- 追求最高稳定性和最少 bug 时。

### 3.4 **总结：如何选择？**

[width(37,15,22,26)]

| 方法                               | 推荐指数 | 优点                                 | 缺点                                   |
| :--------------------------------- | :------- | :----------------------------------- | :------------------------------------- |
| **`structuredClone()`**            | ★★★★★    | **原生、快、支持循环引用和多种类型** | **不能拷贝函数**、有兼容性要求         |
| **Lodash `_.cloneDeep()`**         | ★★★★★    | **功能最全、最稳定**                 | 需要引入库，增加体积                   |
| **`JSON.parse(JSON.stringify())`** | ★★☆☆☆    | 简单快捷                             | **缺陷多，坑也多，不推荐用于复杂数据** |

## 4. 总结

[width(16,30,27,27)]

| 操作       | 创建新对象/数组? | 顶层属性/元素   | 嵌套的引用类型  |
| :--------- | :--------------- | :-------------- | :-------------- |
| **赋值**   | **否**           | 共享 (同一对象) | 共享 (同一对象) |
| **浅拷贝** | **是**           | 独立            | **共享**        |
| **深拷贝** | **是**           | 独立            | **独立**        |

## 5. 常见问题与面试题

### 5.1 赋值、浅拷贝、深拷贝的区别？

三者的本质区别在于对**引用类型**的处理深度：赋值**共享同一个对象**（复制地址）；浅拷贝**顶层独立、嵌套共享**；深拷贝**完全独立**。

### 5.2 展开运算符 `...` 和 `Object.assign` 是深拷贝还是浅拷贝？

都是**浅拷贝**，只复制第一层属性。嵌套的引用类型仍共享同一内存地址，修改内层会互相影响。

### 5.3 `JSON.parse(JSON.stringify())` 有哪些坑？

[width(18,82)]

| 坑           | 表现                                                                  |
| :----------- | :-------------------------------------------------------------------- |
| 丢失类型     | `undefined` / `Symbol` / `Function` 属性直接丢失                      |
| 转换特殊对象 | `Date` → 字符串；`RegExp`、`Error` → `{}`；`NaN`、`Infinity` → `null` |
| 循环引用     | 抛出 `TypeError: Converting circular structure to JSON`               |

### 5.4 `structuredClone` 为什么不能拷贝函数？

函数的拷贝需要保留其**闭包作用域**，行为非常复杂，因此设计上不支持，会抛出 `DataCloneError`。同理也不能拷贝 DOM 节点、原型链和属性描述符。

### 5.5 如何手写一个深拷贝？如何处理循环引用？

用**递归**逐层复制，并用 `WeakMap` 缓存已拷贝的对象来处理循环引用：

```js
function deepClone(obj, map = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj // 原始类型直接返回
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)
  if (map.has(obj)) return map.get(obj) // 命中缓存，处理循环引用

  const clone = Array.isArray(obj) ? [] : {}
  map.set(obj, clone) // 先缓存再递归，防止循环引用导致无限递归

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key], map)
    }
  }
  return clone
}
```

### 5.6 浅拷贝有哪些常见实现方式？

[width(31,69)]

| 方式               | 说明                                         |
| :----------------- | :------------------------------------------- |
| 展开运算符 `...`   | `{ ...obj }` / `[ ...arr ]`                  |
| `Object.assign`    | `Object.assign({}, obj)`                     |
| `slice` / `concat` | 仅适用于数组：`arr.slice()` / `arr.concat()` |
| 手动遍历赋值       | `for...in` 逐层复制第一层属性                |
