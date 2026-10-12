# 集合 (Set)

## 1. 核心概念与特性

**集合 (Set)** 是一种包含**不同元素**的数据结构。它的核心设计理念直接来源于数学中的集合论。

[width(15,85)]

| 特性                | 描述                                                                                                                                        |
| :------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **绝对唯一性**      | 集合中**不能包含重复的元素**。如果你试图添加一个已经存在的元素，集合会直接忽略它。                                                          |
| **无序性 (理论上)** | 在传统的数学定义中，集合是无序的。但**在 JavaScript 的 ES6 `Set` 实现中，元素是按照插入的顺序进行迭代的**。                                 |
| **键值一致**        | 集合没有传统意义上的键（Key），它的键和值是相同的。                                                                                         |
| **类型宽容**        | 一个集合中可以同时存储不同类型的值（如数字、字符串、对象引用）。                                                                            |
| **`size` 属性**     | 用 `set.size` 直接读取元素个数，$O(1)$。注意它是**属性不是方法**，写 `set.size()` 会报错。                                                  |
| **唯一性判定**      | 底层用 **SameValueZero** 算法：它几乎等同于 `===`，但规定 `NaN` 等于自身（所以 `Set` 只能存一个 `NaN`），而内容相同的两个对象仍算不同元素。 |
| **插入顺序**        | 迭代顺序**严格等于插入顺序**，先加先出；元素被 `delete` 后重新 `add`，会排到最后。                                                          |

## 2. ES6 原生 `Set` 的核心操作

现代开发中，我们绝大多数情况直接使用 ES6 原生的 `Set`，其底层经过了高度优化。

### 2.1 基础增删改查

```js
const mySet = new Set()
// 可以用数组初始化并自动去重
const numberSet = new Set([1, 2, 2, 3]) // {1, 2, 3}

mySet.add(1) // 添加元素
mySet.add('Hello')
mySet.add(1) // 尝试添加重复元素，被忽略

console.log(mySet.has(1)) // 判断存在: true (O(1) 复杂度)
console.log(mySet.size) // 获取大小: 2 (属性，不是方法)

mySet.delete(1) // 删除元素
mySet.clear() // 清空集合
```

### 2.2 集合的数学运算

ES6 原生没有直接提供交、并、差集方法，需要结合数组来实现：

```js
const setA = new Set([1, 2, 3])
const setB = new Set([2, 3, 4, 5])

// 并集 (Union)
const union = new Set([...setA, ...setB]) // Set { 1, 2, 3, 4, 5 }

// 交集 (Intersection)
const intersection = new Set([...setA].filter(x => setB.has(x))) // Set { 2, 3 }

// 差集 (Difference: A - B)
const difference = new Set([...setA].filter(x => !setB.has(x))) // Set { 1 }
```

### 2.3 遍历、迭代与数组互转

`Set` 实现了 Iterable 协议，可以像数组一样 `for...of`，也能用扩展运算符展开。注意 `keys()` 和 `values()` 返回的是同一个迭代器（因为键值一致），`entries()` 返回的是 `[值, 值]` 对。

```js
const set = new Set(['a', 'b', 'c'])

// 1. 遍历：for...of 拿到的是【值】
for (const value of set) {
  console.log(value) // 'a' 'b' 'c'
}

// 2. forEach：第一个参数和第二个参数恒等，都是为了对齐数组 forEach 的签名
set.forEach(value => {
  console.log(value)
})

// 3. Set -> 数组
const arr1 = [...set] // ['a', 'b', 'c']
const arr2 = Array.from(set) // 效果相同，还能直接接一个映射函数

// 4. 数组 -> Set（顺带完成去重）
const back = new Set(arr1)
```

## 3. 手写模拟实现一个集合类

在 ES6 出现之前，或者在面试中考察基础数据结构理解时，我们通常使用 JavaScript 的**普通对象 (`Object`)** 来模拟集合。因为对象的键天然具有**唯一性**，这完美契合了集合的特性。

```js
class MySet {
  constructor() {
    // 使用对象来存储数据，保证键的唯一性
    this.items = {}
  }

  // 1. 检查元素是否存在于集合中
  has(element) {
    // 使用 Object.prototype.hasOwnProperty 确保不是继承来的属性
    return Object.prototype.hasOwnProperty.call(this.items, element)
  }

  // 2. 向集合添加新元素
  add(element) {
    if (!this.has(element)) {
      // 在对象中，键和值都设为同一个元素
      this.items[element] = element
      return true
    }
    return false // 元素已存在，添加失败
  }

  // 3. 从集合中移除元素
  delete(element) {
    if (this.has(element)) {
      delete this.items[element]
      return true
    }
    return false
  }

  // 4. 清空集合
  clear() {
    this.items = {}
  }

  // 5. 获取集合的大小
  size() {
    // 现代浏览器可以直接使用 Object.keys 的长度
    return Object.keys(this.items).length

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
    return Object.values(this.items)
  }
}

// === 测试模拟的集合 ===
const set = new MySet()
set.add(1)
set.add(2)
set.add(2) // 不会重复添加

console.log(set.values()) // 输出: [1, 2]
console.log(set.has(1)) // 输出: true
console.log(set.size()) // 输出: 2

set.delete(1)
console.log(set.values()) // 输出: [2]
```

> [!IMPORTANT] 模拟实现的局限性 (重要)
> 使用对象模拟集合有一个天然的缺陷：**JavaScript 对象的键只能是字符串（或 Symbol）**。
> 如果你执行 `set.add(1)`，它在底层会被转换为 `this.items["1"] = 1`。
> 这意味着如果你同时添加数字 `1` 和字符串 `"1"`，在这个模拟实现中，它们会被认为是**同一个元素**从而被覆盖。而真正的 ES6 `Set` 是可以区分它们的。

## 4. 典型应用场景

### 4.1 数组去重（最高频）

```js
const arr = [1, 2, 2, 3, 3, 3]
const unique = [...new Set(arr)] // [1, 2, 3]
```

### 4.2 并集 / 交集 / 差集

ES6 时代要手写，新标准（ES2025）已给 `Set` 加上了原生方法，语义更清晰：

```js
const a = new Set([1, 2, 3])
const b = new Set([2, 3, 4])

// ES2025 原生方法
const union = a.union(b) // Set { 1, 2, 3, 4 }
const inter = a.intersection(b) // Set { 2, 3 }
const diff = a.difference(b) // Set { 1 }
const symDiff = a.symmetricDifference(b) // Set { 1, 4 }

// 兼容老环境的写法：转成数组后用 has 过滤
const interLegacy = new Set([...a].filter(x => b.has(x)))
```

### 4.3 标签选择、白名单校验与缓存去重

- **标签选择 / 多选**：用户勾选的标签天然不重复，用 `Set` 存储，`add` / `delete` 都是 $O(1)$，比数组 `push` 后再 `indexOf` 判断更直接。
- **白名单 / 权限校验**：`const allow = new Set(perms)`，之后 `allow.has(action)` 判断，比数组 `includes`（$O(n)$）更快，语义也更清楚。
- **请求 / 计算去重**：把已处理过的 `id` 放进 `Set`，遇到重复的 key 直接跳过；缓存的 key 集合也常放在 `Set` 里做存在性判断。

```js
// 白名单校验
const allowList = new Set(['read', 'write'])
function can(action) {
  return allowList.has(action)
}

// 按 id 去重（保留首次出现的元素）
const seen = new Set()
const uniqueUsers = users.filter(user => {
  if (seen.has(user.id)) return false
  seen.add(user.id)
  return true
})
```

> [!TIP]
> 若只是给「对象」打标记、且希望对象被回收后标记自动消失，应该用 `WeakSet` 而不是 `Set`，可以避免内存泄漏。

## 5. 常见问题 (FAQ)

### 5.1 ES6 的 `Set` 判断元素是否重复的标准是什么？

使用的算法叫做 [**SameValueZero**](/js/basic/eightTypes#_3-6-零值相等-samevaluezero)。它几乎等同于严格相等 `===`，但有一个极大的**例外：`NaN`**, 在 `===` 运算符中，`NaN === NaN` 是 `false`。但是在 `Set` 内部，**`NaN` 被认为是等于 `NaN` 的**。所以一个 `Set` 中只能存在一个 `NaN`。

### 5.2 向 `Set` 中添加两个内容一模一样的对象，会被去重吗？

**不会。**

```js
const objSet = new Set()
objSet.add({ a: 1 })
objSet.add({ a: 1 })
console.log(objSet.size) // 2
```

- **原因**：JavaScript 中的对象是**引用类型**。两个长得一样的对象，在内存中的地址是不同的。`Set` 比较的是它们的内存地址（引用）。

### 5.3 `WeakSet` 是什么？和 `Set` 有什么区别？

- **概念**：`WeakSet` 是“**弱集合**”。
- **区别:**
  - **类型限制**：`WeakSet` 内部**只能存储对象**（或 Symbol），不能存储基本数据类型。
  - **垃圾回收机制 - 核心**：在普通的 `Set` 中，即使一个对象在外部没有被任何变量引用，只要它还在 `Set` 里，垃圾回收器（GC）就不会回收它（容易造成内存泄漏）。而 `WeakSet` 对对象的引用是“**弱引用**”。如果一个对象只被 `WeakSet` 引用，GC 会直接将其销毁并从 `WeakSet` 中移除。
  - **不可遍历**：正因为其内部元素随时可能被 GC 偷偷删掉，`WeakSet` **不支持遍历**（没有 `forEach`, `size` 等方法）。
- **适用场景**：为 DOM 节点打标签，当节点被移除时，WeakSet 里的记录自动清理，防内存泄漏。

### 5.4 `Set` 和数组在性能上有什么区别？

- **查找 / 判断存在**：`Set.has()` 是 $O(1)$（底层哈希表），数组 `includes()` / `indexOf()` 是 $O(n)$。数据量大时差距明显。
- **插入 / 删除**：`Set.add()` / `delete()` 平均 $O(1)$；数组在中间插入删除要搬移元素，是 $O(n)$。
- **去重**：`Set` 天然去重；数组要做去重需要额外处理。
- **代价**：`Set` 不能像数组那样通过下标随机访问（没有 `set[0]`），也没有 `map` / `filter` 这类数组专有方法（要先转成数组）。所以「需要顺序、下标、大量遍历变换」时用数组，「需要快速判重、频繁增删、保证唯一性」时用 `Set`。

### 5.5 对象数组怎么去重？

`Set` 用引用比较，两个内容相同的对象不会被去重，所以要**按业务字段**去重：

```js
const users = [
  { id: 1, name: '张三' },
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
]

// 方案一：用 Set 记录出现过的 id（保留首次出现）
const seen = new Set()
const byId = users.filter(u => {
  if (seen.has(u.id)) return false
  seen.add(u.id)
  return true
})

// 方案二：先转成 [id, user] 再放进 Map，天然按 id 覆盖
const map = new Map(users.map(u => [u.id, u]))
const uniqueUsers = [...map.values()]
```

### 5.6 如何在 `Set` 与数组之间互相转换？

- **数组 → Set**：`new Set(array)`，顺带完成去重。
- **Set → 数组**：`[...set]` 或 `Array.from(set)`。前者要求 `Set` 可迭代（原生 `Set` 满足），后者兼容性更好，还能接一个映射函数：`Array.from(set, x => x * 2)`。

```js
const arr = [1, 1, 2, 3]
const set = new Set(arr) // Set { 1, 2, 3 }
const back = [...set] // [1, 2, 3]
const doubled = Array.from(set, x => x * 2) // [2, 4, 6]
```

### 5.7 `Set` 的迭代顺序是怎样的？

**严格按插入顺序。** 先加入的排在前面；`delete` 之后再 `add` 同一个值，它会跑到最后（相当于重新插入）。
