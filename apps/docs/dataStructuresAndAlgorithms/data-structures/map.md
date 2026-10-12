# 字典 (Dictionary / Map)

## 1. 核心概念与特性

在计算机科学中，**字典 (Dictionary)**,也常被称为**映射 (Map)** 或**关联数组**。它用来存储 **[键, 值] (Key-Value) 对**。

如果说集合（Set）是只存储 `[值, 值]` 的数据结构，那么字典就是存储独特 `[键, 值]` 组合的数据结构，其中**键名必须是唯一的**，用于快速查找对应的值。

[width(13,53,34)]

| 特性         | ES5 对象 (Object) 模拟字典的缺陷                                              | ES6 原生 `Map` 的优势                                       |
| :----------- | :---------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **键的类型** | **只能是字符串或 Symbol**。如果传入对象作键，会被强转为 `"[object Object]"`。 | **任何类型都可以作为键**（包括函数、对象、NaN、基本类型）。 |
| **顺序性**   | 键的遍历顺序较为复杂且不可靠（特别是混合数字键和字符串键时）。                | **严格按照插入顺序**进行遍历。                              |
| **大小获取** | 必须手动遍历或使用 `Object.keys(obj).length`，时间复杂度 $O(n)$。             | 内置 `.size` 属性，时间复杂度 $O(1)$。                      |
| **迭代性**   | 默认不可迭代，不能直接用 `for...of`。                                         | 实现了 Iterable 协议，天然支持 `for...of` 和扩展运算符。    |

### 1.1 高频属性与术语

[width(18,82)]

| 术语 / 属性      | 说明                                                                                                                 |
| :--------------- | :------------------------------------------------------------------------------------------------------------------- |
| **任意类型的键** | 对象、函数、`NaN`、`Symbol` 都能当键；`Object` 的键会被强制转成字符串。                                              |
| **插入顺序**     | 按键被 `set` 的先后顺序迭代，且**删除后再插入的键会排到最后**；`Object` 的整数样式的键会被提前到最前面，顺序不可靠。 |
| **`size` 属性**  | $O(1)$ 读取键值对数量，注意是属性不是方法（写 `map.size()` 会报错）。                                                |
| **可迭代**       | 实现了 Iterable 协议，可直接 `for...of`、`[...map]`、`new Map(iterable)`。                                           |
| **迭代方法**     | `keys()` / `values()` / `entries()` / `forEach()`；`Map` 的默认迭代器就是 `entries()`。                              |
| **键的相等判定** | 用 **SameValueZero**：`NaN` 视为等于自身，但内容相同的两个对象算不同键（比的是引用）。                               |

## 2. ES6 原生 `Map` 的核心操作

在现代 JavaScript 开发中，当我们需要真正的字典结构时，强烈推荐使用原生的 `Map`。

### 2.1 基础增删改查

```js
const myMap = new Map()

// 1. 设置键值对 (set) - 支持链式调用
myMap.set('name', 'Alice').set('age', 25).set({ id: 1 }, 'Object Key') // 对象也可以作为键！

// 2. 根据键获取值 (get)
console.log(myMap.get('name')) // 输出: 'Alice'
console.log(myMap.get('gender')) // 输出: undefined

// 3. 判断键是否存在 (has)
console.log(myMap.has('age')) // true

// 4. 获取字典大小 (size)
console.log(myMap.size) // 3

// 5. 删除键值对 (delete)
myMap.delete('age')
console.log(myMap.has('age')) // false

// 6. 清空字典 (clear)
// myMap.clear();
```

### 2.2 遍历字典

`Map` 提供了三个遍历器生成函数和一个遍历方法。

```js
const map = new Map([
  ['a', 1],
  ['b', 2],
])

// 1. 遍历键 (keys)
for (let key of map.keys()) {
  console.log(key) // 'a', 'b'
}

// 2. 遍历值 (values)
for (let value of map.values()) {
  console.log(value) // 1, 2
}

// 3. 遍历键值对 (entries) - Map 默认的迭代器就是 entries
for (let [key, value] of map.entries()) {
  console.log(key, value)
}
// 等价于
for (let [key, value] of map) {
  console.log(key, value)
}

// 4. forEach 方法
map.forEach((value, key, mapSelf) => {
  console.log(key, value)
})
```

### 2.3 `Map` 与对象 / 数组的互转

`Map` 与 `Object`、数组之间的转换是日常高频操作，记住这几组固定写法即可。

```js
// 1. Object -> Map：用 Object.entries 取出 [key, value] 数组
const obj = { a: 1, b: 2 }
const mapFromObj = new Map(Object.entries(obj)) // Map { 'a' => 1, 'b' => 2 }

// 2. Map -> Object：用 Object.fromEntries（要求键最终能转成字符串）
const objFromMap = Object.fromEntries(mapFromObj) // { a: 1, b: 2 }

// 3. Map -> 数组：展开后得到 [key, value] 对的数组
const pairs = [...mapFromObj] // [['a', 1], ['b', 2]]

// 4. 数组 -> Map：直接把二维数组传给构造函数
const mapFromPairs = new Map([
  ['x', 10],
  ['y', 20],
])
```

> [!WARNING]
> `Object.fromEntries(map)` 会把**非字符串的键**强制转成字符串（对象键会变成 `"[object Object]"`），因此只有键是字符串或数字时，才适合把 `Map` 转成普通对象。

## 3. 手写模拟实现一个字典类

为了加深理解，我们用 ES6 之前的语法（基于普通 `Object`）来模拟实现一个基础版的字典。

_注意：此模拟实现的键依然会被转为字符串，无法做到像 ES6 `Map` 那样支持对象作为键，这只是为了演示数据结构的逻辑封装。_

```js
class Dictionary {
  constructor() {
    this.items = {}
  }

  // 辅助方法：将 key 转换为字符串，避免对象作为 key 时都被转成 "[object Object]"
  // 虽然这不能完全解决对象作 key 的问题，但稍微好一点
  toStrFn(item) {
    if (item === null) {
      return 'NULL'
    } else if (item === undefined) {
      return 'UNDEFINED'
    } else if (typeof item === 'string' || item instanceof String) {
      return `${item}`
    }
    // 对于对象，如果实现了自定义的 toString 方法，可以区分它们
    return item.toString()
  }

  // 1. 设置键值对
  set(key, value) {
    if (key != null && value != null) {
      const tableKey = this.toStrFn(key)
      this.items[tableKey] = value
      return true
    }
    return false
  }

  // 2. 移除键值对
  remove(key) {
    if (this.hasKey(key)) {
      delete this.items[this.toStrFn(key)]
      return true
    }
    return false
  }

  // 3. 检查键是否存在
  hasKey(key) {
    return this.items.hasOwnProperty(this.toStrFn(key))
  }

  // 4. 获取值
  get(key) {
    const tableKey = this.toStrFn(key)
    return this.hasKey(tableKey) ? this.items[tableKey] : undefined
  }

  // 5. 清空字典
  clear() {
    this.items = {}
  }

  // 6. 获取字典大小
  size() {
    return Object.keys(this.items).length
  }

  // 7. 获取所有键名
  keys() {
    return Object.keys(this.items)
  }

  // 8. 获取所有值
  values() {
    return Object.values(this.items)
  }
}

// === 测试模拟字典 ===
const dict = new Dictionary()
dict.set('name', 'Gandalf')
dict.set('email', 'gandalf@email.com')

console.log(dict.hasKey('email')) // true
console.log(dict.size()) // 2
console.log(dict.keys()) // ["name", "email"]
console.log(dict.values()) // ["Gandalf", "gandalf@email.com"]

dict.remove('name')
console.log(dict.keys()) // ["email"]
```

## 4. 典型应用场景

### 4.1 索引优化

列表页经常需要「根据 id 反查某条数据」。如果每次都 `Array.find`，是 $O(n)$；先用 `Map` 建一次索引（$O(n)$），之后每次查找都是 $O(1)$。

```js
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
]

const userMap = new Map(users.map(u => [u.id, u]))
userMap.get(2).name // '李四'，O(1)
```

### 4.2 记忆化缓存 (Memoization)

把「参数 → 计算结果」存进 `Map`，下次相同参数直接命中缓存。因为 `Map` 的键可以是对象，所以还能缓存以对象为参数的调用。

```js
const cache = new Map()
function fib(n) {
  if (n <= 1) return n
  if (cache.has(n)) return cache.get(n)
  const result = fib(n - 1) + fib(n - 2)
  cache.set(n, result)
  return result
}
```

### 4.3 计数器与分组统计

`Map` 适合做「动态 key」的计数 / 分组，键的类型不受限制：

```js
const words = ['apple', 'banana', 'apple', 'cherry', 'banana', 'apple']

const counter = new Map()
for (const word of words) {
  counter.set(word, (counter.get(word) || 0) + 1)
}
console.log(counter.get('apple')) // 3
```

> [!TIP]
> 如果 key 一定是字符串，且数据结构固定（比如就是一个普通配置对象），用 `Object` 更简洁。只有在 key 动态、类型多样，或需要频繁增删和保证顺序时，`Map` 才是更合适的选择。

## 5. 常见问题 (FAQ)

### 5.1 什么时候用 `Object`，什么时候用 `Map`？

- **用 `Object`**：当你的数据结构是固定的、用于表示一条记录（如用户信息：姓名、年龄），且键都是**字符串**时。对象字面量的语法更简洁，JSON 序列化也更天然。
- **用 `Map`**：
  - 当键名可能在运行时动态改变，或者**键名必须是对象/非字符串类型**时。
  - 当需要频繁进行键值对的**增删操作**时（`Map` 的底层对这类操作做了优化）。
  - 当你需要保证遍历时的**顺序严格一致**时。
  - 当你需要用到巨大的数据集时。

### 5.2 为什么我把对象作为 `Map` 的键，却 `get` 不到值？

```js
const map = new Map()
map.set({ id: 1 }, 'User Info')

// 这样取不到！返回 undefined
console.log(map.get({ id: 1 }))
```

- **原因**：`Map` 判断键是否相等使用的是类似严格相等的底层算法（SameValueZero）。你 `set` 进去的对象和 `get` 时传入的新对象 `{ id: 1 }`，虽然内容一样，但它们在**内存中的地址引用是不同的**，所以 `Map` 认为这是两个完全不同的键。
- **正确做法**：必须保存对原始对象的引用。
  ```js
  const keyObj = { id: 1 }
  map.set(keyObj, 'User Info')
  console.log(map.get(keyObj)) // 输出: "User Info"
  ```

### 5.3 `WeakMap` 是什么？

- **核心特点**：它的**键必须是对象**。它对键的引用是“**弱引用**”。这意味着，如果外部代码清除了对这个键对象的引用，垃圾回收器会自动回收该对象，并且 `WeakMap` 中对应的键值对也会自动消失。
- **应用场景**：在 Vue 3 的响应式系统源码中，广泛使用了 `WeakMap` 来存储对象及其对应的依赖（Dep），这样当组件销毁、原始数据对象被回收时，不会因为响应式系统的拦截而造成内存泄漏。

### 5.4 为什么 `Map` 的键可以是对象，而 `Object` 不行？

- **`Object` 的键被规范限定为字符串或 Symbol**。你写 `obj[{ a: 1 }] = 1` 时，引擎会先对键调用 `toString()`，对象默认得到 `"[object Object]"`，于是所有对象键都会挤到同一个属性上、彼此覆盖。
- **`Map` 的键用引用比较（SameValueZero）**，存的是键的原始引用，不做字符串化，所以对象、函数、`NaN` 都能作为互不相同的键。要真正用对象做键，只能选 `Map` / `WeakMap`。

### 5.5 `Map` 的迭代顺序是怎样的？

**严格按插入顺序，且是唯一确定的顺序。** `keys()`、`values()`、`entries()`、`forEach` 以及 `for...of` 全都遵循这一顺序,对已存在的键重新 `set` 只会**更新值，不改变顺序**；但 `delete` 之后再 `set` 同一个键，它会排到最后（相当于重新插入）

### 5.6 `Map` 与 `Object` 的性能对比如何？

- **增删频繁时**：`Map` 通常是 $O(1)$ 或分摊 $O(1)$，而 `Object` 在频繁 `delete` 后可能退化为慢属性（dictionary mode），性能下降更明显。
- **读取已有的固定属性时**：`Object` 有隐藏类（hidden class）优化，**静态结构的属性访问非常快**，往往不输 `Map`，甚至更快。
- **大小获取**：`Map.size` 是 $O(1)$；`Object` 需要 `Object.keys(obj).length`，是 $O(n)$。
- **结论**：数据是**固定结构的记录**、以只读为主时，用 `Object`；数据是**动态键、频繁增删、需要顺序和大小**的字典时，用 `Map`。性能差异在大多数业务里并不是决定因素，可维护性才是。

### 5.7 什么时候必须用 `WeakMap`？

- **当键是对象、且不希望阻止它被垃圾回收时。** `Map` 会强引用键，即使外部已经不再使用该对象，只要它还挂在 `Map` 里就回收不掉，容易内存泄漏；`WeakMap` 对键是**弱引用**，对象被回收后对应的键值对会自动消失。
- **典型场景**：给 DOM 节点 / 组件实例关联私有数据、缓存派生数据（如 Vue 3 用 `WeakMap` 存对象到依赖的映射）。当节点被移除时相关数据自动清理，无需手动 `delete`。
- 注意限制：`WeakMap` 的键**必须是对象**，且**不可遍历**（没有 `size`、`keys()`、`forEach`），所以它只适合「按对象查私有数据」，不能当通用字典。

### 5.8 `Map` 和 `Set` 之间是什么关系？

- 两者都是 ES6 新增的**键值容器**，底层都用哈希表加插入顺序维护，成员查找都是 $O(1)$。
- **`Set` 是「键值相同」的 `Map`**：`Set` 只存值、值即键；`Map` 存真正的 `[key, value]` 对。
