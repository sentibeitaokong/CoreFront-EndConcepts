---
outline: [2, 3]
---

# 集合引用类型 (Collections)

- **索引集合 (Indexed Collections)**: `Array`, `TypedArray`
- **键值集合 (Keyed Collections)**: `Map`, `Set`, `WeakMap`, `WeakSet`
- **传统结构**: `Object`

## 1. Array (数组)

数组是一个**有序**列表，本质上是特殊的对象（`typeof [] === 'object'`）。

三大特性：**动态大小**（无需预定义长度）、**混合类型**（可存任意类型）、**零基索引**(索引从零开始)。

### 1.1 创建数组

| 方式           | 代码示例                | 说明                                                    |
| :------------- | :---------------------- | :------------------------------------------------------ |
| 字面量（推荐） | `const arr = [1, 2, 3]` | 最简洁，性能最好                                        |
| 构造函数       | `new Array(1, 2)`       | 坑：`new Array(3)` 是长度为 3 的空数组，而非 `[3]`      |
| `Array.of`     | `Array.of(3)`           | 结果为 `[3]`，修复构造函数的坑                          |
| `Array.from`   | `Array.from('hello')`   | 将类数组/可迭代对象（字符串、Set、Arguments）转为真数组 |

### 1.2 属性

| 属性     | 说明                                         |
| :------- | :------------------------------------------- |
| `length` | 数组长度，**可写**：修改它会截断或清空数组。 |

```js
const arr = [1, 2, 3, 4, 5]
arr.length = 2
console.log(arr) // [1, 2]（被截断）
arr.length = 0 // 清空数组的常用技巧
```

### 1.3 [核心 API](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array)

#### 1.3.1 增删改 (Mutator) — 会改变原数组

| 方法        | 描述           | 返回值               | 示例                                    |
| :---------- | :------------- | :------------------- | :-------------------------------------- |
| `push()`    | 末尾添加       | 新长度               | `arr.push(4)`                           |
| `pop()`     | 删除末尾       | 被删除元素           | `arr.pop()`                             |
| `unshift()` | 开头添加       | 新长度               | `arr.unshift(0)`                        |
| `shift()`   | 删除开头       | 被删除元素           | `arr.shift()`                           |
| `splice()`  | 万能：增/删/改 | 被删除元素组成的数组 | `arr.splice(1, 1, 'new')`               |
| `sort()`    | 排序           | 排序后的数组引用     | 默认按字符串排序，数字需传 `(a,b)=>a-b` |
| `reverse()` | 反转           | 反转后的数组引用     | `arr.reverse()`                         |
| `fill()`    | 用静态值填充   | 数组本身             | `new Array(3).fill(0)` → `[0,0,0]`      |

#### 1.3.2 访问与查询 (Accessor) — 不改原数组

| 方法         | 描述                    | 示例                              |
| :----------- | :---------------------- | :-------------------------------- |
| `concat()`   | 合并多个数组            | `arr1.concat(arr2)`               |
| `slice()`    | 截取子数组（左闭右开）  | `arr.slice(1, 3)`（含 1，不含 3） |
| `join()`     | 数组转字符串            | `arr.join('-')` → `"1-2-3"`       |
| `indexOf()`  | 查找索引（不存在返 -1） | `arr.indexOf('a')`                |
| `includes()` | 是否包含（ES7）         | `arr.includes('a')`（能判 `NaN`） |
| `flat()`     | 拍平（ES2019）          | `[1,[2,3]].flat()` → `[1,2,3]`    |

#### 1.3.3 迭代与高阶函数

| 方法          | 作用       | 返回值             | 说明                        |
| :------------ | :--------- | :----------------- | :-------------------------- |
| `forEach()`   | 遍历       | `undefined`        | 无法用 `break` 跳出         |
| `map()`       | 映射       | 新数组             | 返回处理后的结果            |
| `filter()`    | 过滤       | 新数组             | 保留回调返回 `true` 的项    |
| `find()`      | 查找       | 元素 / `undefined` | 返回第一个符合条件的元素    |
| `findIndex()` | 查找下标   | 索引 / `-1`        | 返回第一个符合条件的索引    |
| `some()`      | 存在性检测 | `Boolean`          | 只要有一个符合就返回 `true` |
| `every()`     | 全员检测   | `Boolean`          | 所有元素都符合才返回 `true` |
| `reduce()`    | 累加/归并  | 任意值             | 将数组缩减为一个值          |

### 1.4 ES2022+ 新特性

| 方法                                          | 说明                                             |
| :-------------------------------------------- | :----------------------------------------------- |
| `at(index)`                                   | 支持负数索引，如 `arr.at(-1)` 取最后一个         |
| `findLast()` / `findLastIndex()`              | 从后往前查找                                     |
| `toSorted()` / `toReversed()` / `toSpliced()` | `sort`/`reverse`/`splice` 的**不改变原数组**版本 |

## 2. TypedArray (定型数组)

TypedArray 是一组**视图类**的总称（`Int8Array`、`Float32Array` 等），是基于 `ArrayBuffer` 处理**二进制数据**的类数组对象，常用于 WebGL、Canvas 像素、音频、文件 I/O。

### 2.1 核心概念

- **ArrayBuffer**：内存中存储原始二进制数据的连续内存块，**不能直接操作**。
- **View（TypedArray）**：操作 ArrayBuffer 的“**窗口**”，规定内存如何被解读（8 位整数还是 32 位浮点数）。

同一块 `ArrayBuffer` 可被多个视图共享，实现「多视图共享内存」。

### 2.2 视图类型

| 构造函数            | 数据类型          | 字节 | 说明                    | 取值范围       |
| :------------------ | :---------------- | :--- | :---------------------- | :------------- |
| `Int8Array`         | 8 位有符号整数    | 1    | —                       | -128 ~ 127     |
| `Uint8Array`        | 8 位无符号整数    | 1    | 常用于字节流            | 0 ~ 255        |
| `Uint8ClampedArray` | 8 位无符号整数    | 1    | Canvas 专用（溢出截断） | 0 ~ 255        |
| `Int16Array`        | 16 位有符号整数   | 2    | —                       | -32768 ~ 32767 |
| `Uint16Array`       | 16 位无符号整数   | 2    | —                       | 0 ~ 65535      |
| `Int32Array`        | 32 位有符号整数   | 4    | —                       | 约 ±21 亿      |
| `Uint32Array`       | 32 位无符号整数   | 4    | —                       | 0 ~ 约 42 亿   |
| `Float32Array`      | 32 位浮点数       | 4    | WebGL 标准              | 约 7 位精度    |
| `Float64Array`      | 64 位浮点数       | 8    | 同普通 Number           | 约 16 位精度   |
| `BigInt64Array`     | 64 位有符号大整数 | 8    | 用 `10n` 语法           | —              |
| `BigUint64Array`    | 64 位无符号大整数 | 8    | 用 `10n` 语法           | —              |

### 2.3 创建方式

| 方式             | 示例                        | 说明                           |
| :--------------- | :-------------------------- | :----------------------------- |
| 指定长度         | `new Int32Array(16)`        | 分配新内存，元素初始化为 0     |
| 数组/可迭代对象  | `new Uint8Array([1, 2, 3])` | 从普通数组、Set 等创建         |
| 复制 TypedArray  | `new Int8Array(x)`          | 复制数据，创建新内存块         |
| 基于 ArrayBuffer | `new Int32Array(buffer)`    | 多视图共享同一块内存（最重要） |

```js
const buffer = new ArrayBuffer(16) // 16 字节
const view1 = new Int32Array(buffer) // 看作 4 个 32 位整数
const view2 = new Uint8Array(buffer) // 看作 16 个 8 位整数

view1[0] = 1
console.log(view2[0]) // 1（底层字节变了，所有视图可见）
```

### 2.4 属性与方法

与普通数组大部分方法相同，但**长度不可变**、**无增删方法**（`push`/`pop`/`splice`/`shift`/`unshift`）。

| 属性         | 说明               |
| :----------- | :----------------- |
| `buffer`     | 引用的 ArrayBuffer |
| `byteLength` | 字节长度（只读）   |
| `byteOffset` | 偏移量（只读）     |
| `length`     | 元素个数（只读）   |

| 方法                   | 说明                                               |
| :--------------------- | :------------------------------------------------- |
| `set(array, offset)`   | 从 `offset` 处批量写入数组/ TypedArray             |
| `subarray(begin, end)` | 返回**共享同一块内存**的新视图（`slice` 则是复制） |
| `map` / `filter` / ... | 常规迭代方法均可用，返回相同类型的 TypedArray      |

## 3. Object (对象)

对象是由**键值对**组成的无序集合：键必须是字符串或 `Symbol`，值可以是任意类型（含另一个对象）。

### 3.1 创建对象

| 方式            | 示例                          | 说明         |
| :-------------- | :---------------------------- | :----------- |
| 对象字面量      | `const p = { name: 'Alice' }` | 最常用       |
| 构造函数        | `const c = new Object()`      | 较少使用     |
| `Object.create` | `Object.create(proto)`        | 指定原型创建 |

### 3.2 属性访问 (CRUD)

| 操作      | 点符号               | 方括号符号              |
| :-------- | :------------------- | :---------------------- |
| 读取      | `person.name`        | `person['age']`         |
| 创建/更新 | `person.city = 'NY'` | `person['city'] = 'NY'` |
| 删除      | `delete person.age`  | `delete person['age']`  |

### 3.3 对象迭代

| 方法                  | 描述                                                       |
| :-------------------- | :--------------------------------------------------------- |
| `for...in`            | 遍历自身 + **原型链**上的可枚举属性，需配 `hasOwnProperty` |
| `Object.keys(obj)`    | 自身可枚举属性的**键**数组                                 |
| `Object.values(obj)`  | 自身可枚举属性的**值**数组                                 |
| `Object.entries(obj)` | 自身可枚举属性 `[key, value]` 数组                         |

```js
// 同时遍历键和值（最佳实践）
for (const [key, value] of Object.entries(person)) {
  console.log(`${key}: ${value}`)
}
```

### 3.4 [`Object` 静态 API](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object)

| 方法                                     | 描述                                                       |
| :--------------------------------------- | :--------------------------------------------------------- |
| `Object.assign(target, ...sources)`      | **浅拷贝**源对象可枚举自身属性到 `target`，会改变 `target` |
| `Object.create(proto)`                   | 创建原型指向 `proto` 的新对象                              |
| `Object.defineProperty(obj, prop, desc)` | 精确控制属性特性（`enumerable`/`writable`/`configurable`） |
| `Object.keys/values/entries(obj)`        | 返回键 / 值 / `[key,value]` 数组                           |
| `Object.fromEntries(iterable)`           | `entries` 的逆操作，键值对转回对象                         |
| `Object.freeze(obj)` / `isFrozen(obj)`   | **浅冻结**，冻结后不可增删改                               |
| `Object.seal(obj)` / `isSealed(obj)`     | **密封**，不可增删，但可改现有属性值                       |
| `Object.is(v1, v2)`                      | 同值相等，比 `===` 精确（`NaN` 相等、`+0/-0` 不等）        |
| `Object.getPrototypeOf(obj)`             | 返回对象原型                                               |
| `obj.hasOwnProperty(prop)`               | 判断是否为**自身属性**（非继承）                           |

## 4. Map (映射)

`Map` 是真正的键值对集合，解决了 `Object` 作为字典时的诸多限制。

### 4.1 核心特性

| 特性         | 说明                                        |
| :----------- | :------------------------------------------ |
| 任意类型键   | 键可以是对象、数组、函数等（区别于 Object） |
| 保持插入顺序 | 遍历按 `set` 的顺序                         |
| `size` 属性  | 直接获取键值对数量                          |
| 无原型污染   | 纯粹哈希结构，无原型链继承冲突              |

### 4.2 创建

```js
const map = new Map([
  ['key1', 'value1'],
  [123, 'number key'],
  [{ id: 1 }, 'object key'],
])
```

### 4.3 核心 API

#### **4.3.1 属性**

| 属性   | 描述                            | 示例                                                                   |
| :----- | :------------------------------ | :--------------------------------------------------------------------- |
| `size` | 返回 `Map` 实例中键值对的数量。 | `const map = new Map([['a',1], ['b',2]]); console.log(map.size); // 2` |

#### **4.3.2 [核心方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map)**

| 方法              | 描述                                                                 | 返回值                                                       | 示例                           |
| :---------------- | :------------------------------------------------------------------- | :----------------------------------------------------------- | :----------------------------- |
| `set(key, value)` | **添加或更新**一个键值对。如果 `key` 已存在，则其 `value` 会被更新。 | `Map` 对象本身，**支持链式调用**。                           | `map.set('a', 1).set('b', 2);` |
| `get(key)`        | **读取**指定 `key` 对应的 `value`。                                  | 找到的 `value`，如果 `key` 不存在，则返回 **`undefined`**。  | `map.get('a'); // 1`           |
| `has(key)`        | **检查**是否存在指定的 `key`。                                       | `boolean` (`true` 或 `false`)                                | `map.has('a'); // true`        |
| `delete(key)`     | **删除**指定的键值对。                                               | 如果成功删除，返回 `true`；如果 `key` 不存在，返回 `false`。 | `map.delete('a'); // true`     |
| `clear()`         | **清空** `Map` 中所有的键值对。                                      | `undefined`                                                  | `map.clear();`                 |

```js
const userActivity = new Map()

// 使用 set (支持链式调用)
userActivity.set('user1', 'online').set('user2', 'away')
console.log(userActivity.size) // 2

// 使用 get
console.log(userActivity.get('user1')) // "online"
console.log(userActivity.get('user3')) // undefined

// 使用 has
console.log(userActivity.has('user2')) // true
console.log(userActivity.has('user3')) // false

// 使用 delete
const wasDeleted = userActivity.delete('user2')
console.log(wasDeleted) // true
console.log(userActivity.size) // 1

// 使用 clear
userActivity.clear()
console.log(userActivity.size) // 0
```

#### 4.3.3 迭代方法

| 迭代方法                | 说明                                     |
| :---------------------- | :--------------------------------------- |
| `forEach((value, key))` | 遍历，注意参数顺序是**值在前**           |
| `for...of`              | 默认遍历 `[key, value]`                  |
| `keys()`                | 返回所有 key 的迭代器                    |
| `values()`              | 返回所有 value 的迭代器                  |
| `entries()`             | 返回所有 `[key, value]` 的迭代器（默认） |

```js
const permissions = new Map([
  ['admin', ['create', 'read', 'update', 'delete']],
  ['editor', ['create', 'read', 'update']],
])

// 遍历 keys
for (const role of permissions.keys()) {
  console.log(role) // 'admin', 'editor'
}

// 遍历 values
for (const access of permissions.values()) {
  console.log(access) // ['create', ...], ['create', ...]
}

// 使用扩展语法将迭代器转换为数组
const allRoles = [...permissions.keys()] // ['admin', 'editor']
const allAccessLevels = [...permissions.values()]
```

### 4.4 与 Object 转换

#### **4.4.1 `Map` -> `Object`**

**注意**: 只有当 `Map` 的所有 `key` 都是字符串或 `Symbol` 时，这种转换才有意义。

```js
const map = new Map([
  ['name', 'Alice'],
  ['age', 30],
])

// 使用 Object.fromEntries() (ES2019+) - 推荐
const obj = Object.fromEntries(map)
// obj is { name: 'Alice', age: 30 }
```

#### **4.4.2 `Object` -> `Map`**

```js
const obj = {
  name: 'Bob',
  city: 'London',
}

// 使用 Object.entries()
const map = new Map(Object.entries(obj))
// map is Map(2) { 'name' => 'Bob', 'city' => 'London' }
```

## 5. Set (集合)

`Set` 是**唯一值**的集合，尤其擅长去重与集合运算。

### 5.1 核心特性

| 特性         | 说明                   |
| :----------- | :--------------------- |
| 唯一性       | 重复值自动忽略         |
| 任意类型值   | 基本类型和引用类型均可 |
| 保持插入顺序 | 按 `add` 顺序遍历      |
| 无索引       | 不能通过 `set[0]` 访问 |

### 5.2 创建

`Set` 构造函数接受一个**可迭代对象**（如 `Array`, `String`, `Map` 等）作为参数，并会自动提取其中的元素，并去除重复项。

```js
// 使用数组初始化 (最常见)
const arrayWithDuplicates = [1, 2, 3, 3, 'a', 'a', { id: 1 }]
const mySet = new Set(arrayWithDuplicates)

console.log(mySet) // Set(5) { 1, 2, 3, 'a', { id: 1 } }

// 使用字符串初始化
const charSet = new Set('hello')
console.log(charSet) // Set(4) { 'h', 'e', 'l', 'o' }
```

### 5.3 核心 API

#### **5.3.1 属性**

| 属性   | 描述                        | 示例                                                          |
| :----- | :-------------------------- | :------------------------------------------------------------ |
| `size` | 返回 `Set` 实例中值的数量。 | `const set = new Set([1, 2, 3]); console.log(set.size); // 3` |

#### **5.3.2 [核心方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set)**

| 方法            | 描述                                                 | 返回值                                                         | 示例                     |
| :-------------- | :--------------------------------------------------- | :------------------------------------------------------------- | :----------------------- |
| `add(value)`    | **添加**一个新值。如果该值已存在，则不执行任何操作。 | `Set` 对象本身，**支持链式调用**。                             | `set.add(1).add(2);`     |
| `has(value)`    | **检查**是否存在指定的值。                           | `boolean` (`true` 或 `false`)                                  | `set.has(1); // true`    |
| `delete(value)` | **删除**指定的值。                                   | 如果成功删除，返回 `true`；如果 `value` 不存在，返回 `false`。 | `set.delete(1); // true` |
| `clear()`       | **清空** `Set` 中所有的值。                          | `undefined`                                                    | `set.clear();`           |

```js
const userTags = new Set()

// 使用 add (支持链式调用)
userTags.add('javascript').add('Frontend')
console.log(userTags.size) // 2

// 再次添加重复值，会被忽略
userTags.add('javascript')
console.log(userTags.size) // 2

// 使用 has
console.log(userTags.has('javascript')) // true
console.log(userTags.has('Backend')) // false

// 使用 delete
const wasDeleted = userTags.delete('Frontend')
console.log(wasDeleted) // true
console.log(userTags.size) // 1

// 使用 clear
userTags.clear()
console.log(userTags.size) // 0
```

#### 5.3.3 迭代方法

`Set` 提供了多种方法来遍历其内容，并且它们都**遵循插入顺序**。

| 迭代方法                | 说明                                       |
| :---------------------- | :----------------------------------------- |
| `forEach((value, key))` | `key` 与 `value` 相同（为兼容 Map API）    |
| `for...of`              | 直接遍历值                                 |
| `values()` / `keys()`   | 二者等价，返回值的迭代器                   |
| `entries()`             | 返回 `[value, value]` 迭代器（为兼容 Map） |

```js
const numbers = new Set([10, 20, 30])

// keys() 和 values() 行为相同
for (const value of numbers.values()) {
  console.log(value) // 10, 20, 30
}

// entries()
for (const entry of numbers.entries()) {
  console.log(entry) // [10, 10], [20, 20], [30, 30]
}

// 使用扩展语法将迭代器转换为数组
const numArray = [...numbers] // [10, 20, 30]
```

## 6. WeakMap & WeakSet (弱引用集合)

「Weak」指对对象持有**弱引用**，专为内存管理设计。

### 6.1 核心概念

| 特性        | 强引用 (Map/Set)                | 弱引用 (WeakMap/WeakSet)             |
| :---------- | :------------------------------ | :----------------------------------- |
| GC 行为     | 只要集合仍引用对象，GC 就不回收 | 不阻止 GC 回收，唯一引用消失即被回收 |
| 键/值要求   | 任意类型                        | 必须是对象                           |
| 可枚举/迭代 | 支持 `size`/`forEach`/`keys` 等 | 不支持（内容不确定，随时可能被回收） |

### 6.2 `WeakMap` API

用于为外部对象附加数据（如私有属性、缓存），不阻止其被回收。

| 方法              | 说明         | 约束             |
| :---------------- | :----------- | :--------------- |
| `set(key, value)` | 添加/更新    | `key` 必须是对象 |
| `get(key)`        | 读取         | `key` 必须是对象 |
| `has(key)`        | 检查是否存在 | `key` 必须是对象 |
| `delete(key)`     | 删除         | `key` 必须是对象 |

### 6.3 `WeakSet` API

用于追踪一组对象（如标记 DOM 节点是否已处理），不阻止其被回收。

| 方法            | 说明         | 约束               |
| :-------------- | :----------- | :----------------- |
| `add(value)`    | 添加         | `value` 必须是对象 |
| `has(value)`    | 检查是否存在 | `value` 必须是对象 |
| `delete(value)` | 删除         | `value` 必须是对象 |

## 7. 总结对比表

| 特性     | Array        | Object         | Map             | Set           | WeakMap/Set  |
| :------- | :----------- | :------------- | :-------------- | :------------ | :----------- |
| 键类型   | 整数下标     | String/Symbol  | 任意            | 仅存值        | 必须是对象   |
| 有序性   | ✅           | ❌（不完全）   | ✅              | ✅            | ❌           |
| 可遍历   | ✅           | ✅（需转换）   | ✅              | ✅            | ❌           |
| 垃圾回收 | 强引用       | 强引用         | 强引用          | 强引用        | 弱引用       |
| 典型用途 | 列表/栈/队列 | 配置/JSON/字典 | 复杂键/频繁增删 | 去重/集合运算 | 防止内存泄漏 |

## 8. 常见问题与面试题

### 8.1 如何判断一个变量是数组？

```js
Array.isArray(obj) // 最佳方案
Object.prototype.toString.call(obj) === '[object Array]' // 原理级，跨 iframe 可靠
obj instanceof Array // 旧方案，跨 iframe 会失效
```

### 8.2 数组如何去重？

```js
const arr = [1, 2, 2, 3, 3]
const unique = [...new Set(arr)] // 最快
const unique2 = arr.filter((item, i) => arr.indexOf(item) === i)
```

### 8.3 `map` 和 `forEach` 的区别？

- `forEach`：单纯循环，无返回值（`undefined`），用于副作用。
- `map`：根据回调返回值生成**新数组**，原数组不变。

### 8.4 浅拷贝 vs 深拷贝

浅拷贝（`...`、`Object.assign`）只复制第一层；嵌套对象仍共享地址。

```js
const original = { name: 'A', details: { score: 100 } }
const shallow = { ...original }
shallow.details.score = 0
console.log(original.details.score) // 0（原始对象也被改！）
```

- 深拷贝推荐：`structuredClone(original)`（现代环境内置）。
- 简单但有缺陷：`JSON.parse(JSON.stringify(obj))`。
- 库方案：Lodash `_.cloneDeep()`。

### 8.5 用对象作为对象的键

对象键会被强转为字符串，任何对象转字符串都是 `"[object Object]"`，导致覆盖。

```js
const myMap = {}
myMap[{ id: 1 }] = 'V1'
myMap[{ id: 2 }] = 'V2' // 覆盖了 V1
console.log(myMap) // { '[object Object]': 'V2' }
```

**解决**：用 `Map`，它允许任何类型作为键。

### 8.6 什么时候用 `Map` 而不是 `Object`？

键不是字符串/Symbol（**必须**用 Map）；频繁增删（性能更好）；需保证插入顺序；需纯哈希结构（无原型属性）。

### 8.7 `Map` 的键如何判断相等？

使用 **Same-value-zero** 算法，基本同 `===`，但 **`NaN` 与 `NaN` 相等**。

```js
const map = new Map()
map.set(NaN, 'V')
map.get(NaN) // 'V'
map.get({}) // undefined（新对象地址不同）
```

### 8.8 什么时候用 `WeakMap` / `WeakSet`？

键/值对象生命周期不受你控制时：

- **WeakMap**：为对象缓存计算结果、附加数据（如 DOM 节点），对象销毁时自动清理。
- **WeakSet**：标记对象是否已处理/可见，对象消失时标记自动消失。
