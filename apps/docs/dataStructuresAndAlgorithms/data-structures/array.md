# 数组 (Array)

## 1. 核心概念与特性

[width(15,85)]

| 特性              | 描述                                                                                                                                                         |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **动态大小**      | JS 数组无需预先声明长度，它会随着元素的增加自动扩容。                                                                                                        |
| **异构性**        | 同一个数组可以容纳不同类型的数据（如 `[1, "hello", {a: 1}, null]`）。                                                                                        |
| **索引机制**      | 从 `0` 开始。通过 `arr[index]` 访问元素，时间复杂度为 $O(1)$。                                                                                               |
| **本质**          | 数组其实是特殊的对象。`typeof []` 返回 `"object"`。判断数组的正确方式是 `Array.isArray(arr)`。                                                               |
| **`length` 属性** | 可读也可写：`arr.length = 2` 会直接**截断**数组，`arr.length = 5` 会用空位（empty）把数组补齐。                                                              |
| **稀疏数组**      | 存在空位的数组（如 `[1, , 3]`、`new Array(3)`）。绝大多数遍历方法会**跳过空位**，`map` 不会对空位执行回调，因此 `[1, , 3].map(x => x * 2)` 仍是 `[2, , 6]`。 |
| **类数组对象**    | 有索引和 `length` 属性但不是数组，如函数内的 `arguments`、DOM 的 `NodeList`、`{ 0: 'a', length: 1 }`。它们没有数组方法，需要用 `Array.from()` 转成真数组。   |

## 2. 核心操作 API (高频必会)

为了便于记忆，我将数组方法按“**是否会改变原数组**”分为两类，这是面试和开发中最容易踩坑的地方。

### 2.1 会改变原数组的方法 (Mutating Methods)

执行这些方法后，原数组的数据或长度会被直接修改。

[width(18,38,25,19)]

| 方法            | 描述                                                  | 示例                                            | 时间复杂度                  |
| :-------------- | :---------------------------------------------------- | :---------------------------------------------- | :-------------------------- |
| **`push()`**    | 在末尾添加一个或多个元素，返回新长度。                | `arr.push(4)`                                   | $O(1)$                      |
| **`pop()`**     | 移除并返回末尾的最后一个元素。                        | `arr.pop()`                                     | $O(1)$                      |
| **`unshift()`** | 在头部添加一个或多个元素，返回新长度。                | `arr.unshift(0)`                                | $O(n)$ (需移动后续所有元素) |
| **`shift()`**   | 移除并返回头部的第一个元素。                          | `arr.shift()`                                   | $O(n)$                      |
| **`splice()`**  | 万能方法。用于添加、删除、替换元素。                  | `arr.splice(1, 2, 'a')` (从索引1删2个，插入'a') | $O(n)$                      |
| **`sort()`**    | 对数组进行排序（默认按**字符串的 Unicode 码点**排）。 | `arr.sort((a,b) => a - b)` (按数字升序)         | $O(n \log n)$               |
| **`reverse()`** | 颠倒数组中元素的顺序。                                | `arr.reverse()`                                 | $O(n)$                      |
| **`fill()`**    | 用静态值填充/覆盖数组的部分或全部。                   | `arr.fill(0)`                                   | $O(n)$                      |

### 2.2 不改变原数组的方法 (Non-Mutating Methods)

执行这些方法会返回一个**新数组或新值**，原数组保持不变。（在 React/Redux 等强调不可变数据的框架中非常重要）。

[width(13,38,32,17)]

| 方法               | 描述                                                 | 示例                                     | 时间复杂度               |
| :----------------- | :--------------------------------------------------- | :--------------------------------------- | :----------------------- |
| **`concat()`**     | 合并两个或多个数组，返回新数组。                     | `arr.concat([4,5])`                      | $O(n)$                   |
| **`slice()`**      | 截取数组的一部分，返回新数组（浅拷贝）。             | `arr.slice(1, 3)` (取索引 1 到 2)        | $O(n)$                   |
| **`join()`**       | 将所有元素连接成一个字符串。                         | `arr.join('-')`                          | $O(n)$                   |
| **`map()`**        | 遍历并对每个元素执行回调，返回**映射后的新数组**。   | `arr.map(x => x * 2)`                    | $O(n)$                   |
| **`filter()`**     | 遍历并过滤出满足条件的元素，返回**新数组**。         | `arr.filter(x => x > 5)`                 | $O(n)$                   |
| **`reduce()`**     | 累加器，将数组所有元素计算为一个**单一值**。         | `arr.reduce((acc, cur) => acc + cur, 0)` | $O(n)$                   |
| **`forEach()`**    | 仅遍历执行操作，**没有返回值**（返回 `undefined`）。 | `arr.forEach(x => console.log(x))`       | $O(n)$                   |
| **`some()`**       | 是否有**至少一个**元素满足条件？返回布尔值。         | `arr.some(x => x > 10)`                  | 最优 $O(1)$, 最差 $O(n)$ |
| **`every()`**      | 是否**所有**元素都满足条件？返回布尔值。             | `arr.every(x => x > 0)`                  | 最优 $O(1)$, 最差 $O(n)$ |
| **`find()`**       | 查找并返回**第一个**满足条件的**元素**。             | `arr.find(x => x === 3)`                 | $O(n)$                   |
| **`findIndex()`**  | 查找并返回**第一个**满足条件的**索引**。             | `arr.findIndex(x => x === 3)`            | $O(n)$                   |
| **`includes()`**   | 判断数组是否包含某个特定值（**能识别 NaN**）。       | `arr.includes(NaN)`                      | $O(n)$                   |
| **`indexOf()`**    | 查找元素第一次出现的索引（找不到返回 -1）。          | `arr.indexOf(3)`                         | $O(n)$                   |
| **`flat()`**       | 按指定深度拍平嵌套数组，`Infinity` 表示无限深。      | `arr.flat(2)`                            | $O(n)$                   |
| **`flatMap()`**    | 先 `map` 再 `flat(1)`，适合“**一对多**”的映射。      | `arr.flatMap(x => [x, x * 2])`           | $O(n)$                   |
| **`at()`**         | 支持**负索引**取值，`at(-1)` 就是最后一个元素。      | `arr.at(-1)`                             | $O(1)$                   |
| **`findLast()`**   | 从后往前查找，返回**最后一个**满足条件的元素。       | `arr.findLast(x => x > 5)`               | $O(n)$                   |
| **`toSorted()`**   | `sort()` 的**非破坏性**版本（ES2023），原数组不动。  | `arr.toSorted((a, b) => a - b)`          | $O(n \log n)$            |
| **`toReversed()`** | `reverse()` 的**非破坏性**版本（ES2023）。           | `arr.toReversed()`                       | $O(n)$                   |
| **`toSpliced()`**  | `splice()` 的**非破坏性**版本（ES2023）。            | `arr.toSpliced(1, 2)`                    | $O(n)$                   |

## 3. 高阶应用技巧

### 3.1 数组去重

```js
const arr = [1, 2, 2, 3, 3]
// 方案一：ES6 Set (最简洁，推荐)
const unique = [...new Set(arr)]

// 方案二：filter + indexOf
const unique2 = arr.filter((item, index) => arr.indexOf(item) === index)
```

### 3.2 拍平多维数组 (Flatten)

```js
const arr = [1, [2, [3, 4]]]
// 方案一：ES2019 flat (参数为深度，Infinity 表示无限深)
const flatArr = arr.flat(Infinity) // [1, 2, 3, 4]

// 方案二：reduce 递归
const flatten = ary =>
  ary.reduce(
    (acc, val) => acc.concat(Array.isArray(val) ? flatten(val) : val),
    [],
  )
```

### 3.3 创建指定长度的初始化数组

```js
// 创建一个长度为 5，全是 0 的数组
const arr1 = new Array(5).fill(0) // [0, 0, 0, 0, 0]

// 创建一个 1 到 5 的数组
const arr2 = Array.from({ length: 5 }, (_, i) => i + 1) // [1, 2, 3, 4, 5]
```

### 3.4 数组转字典 / 按字段分组（最高频）

列表转字典是前端最常用的性能优化手段之一：把「每次都要 $O(n)$ 查找」变成「一次 $O(n)$ 建表，之后都是 $O(1)$」。

```js
const users = [
  { id: 1, name: '张三', role: 'admin' },
  { id: 2, name: '李四', role: 'user' },
]

// 1. Object.fromEntries（最简洁）
const userMap = Object.fromEntries(users.map(u => [u.id, u]))

// 2. reduce 版
const userMap2 = users.reduce((acc, u) => {
  acc[u.id] = u
  return acc
}, {})

// 3. 按字段分组（ES2024 原生，替代手写 reduce）
const byRole = Object.groupBy(users, u => u.role)
// { admin: [ {...} ], user: [ {...} ] }
```

### 3.5 求交并差集（Set 提速）

两个数组求交集时，初学者常写 `a.filter(x => b.includes(x))`，这是 $O(n \times m)$。先把 `b` 转成 `Set`，查找就从 $O(m)$ 降到 $O(1)$。

```js
const a = [1, 2, 3]
const b = [2, 3, 4]
const setB = new Set(b)

const intersection = [...new Set(a)].filter(x => setB.has(x)) // 交集 [2, 3]
const difference = [...new Set(a)].filter(x => !setB.has(x)) // 差集 [1]
const union = [...new Set([...a, ...b])] // 并集 [1, 2, 3, 4]
```

### 3.6 求最值与数组乱序

```js
const nums = [3, 1, 4, 1, 5]

// 求最值：展开运算符在数组很大时可能超出引擎的参数个数上限
Math.max(...nums) // 5
// 更稳妥的 reduce 写法
const max = nums.reduce((acc, cur) => (cur > acc ? cur : acc), -Infinity)

// 数组乱序：Fisher–Yates 洗牌，每种排列概率相等
function shuffle(arr) {
  const res = [...arr]
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = res[i]
    res[i] = res[j]
    res[j] = tmp
  }
  return res
}
```

> [!WARNING]
> 不要用 `arr.sort(() => Math.random() - 0.5)` 来打乱数组。`sort` 的比较函数要求返回**一致的**顺序关系，随机返回值破坏了这一前提，在 V8 的不同排序实现下会导致某些元素几乎不动，分布并不均匀。

## 4. 常见问题 (FAQ)

### 4.1 为什么 `[1, 2, 10].sort()` 的结果是 `[1, 10, 2]`？

JS 数组的 `sort()` 默认将元素转换为**字符串**，然后比较它们的 UTF-16 码点顺序。字符串 `"10"` 的第一位 `"1"` 比 `"2"` 小，所以排在前面，必须传入**比较函数**：`arr.sort((a, b) => a - b);`

### 4.2 `for...in` 和 `for...of` 遍历数组有什么区别？

- **`for...in`**：遍历的是**索引（键）**，且会遍历出原型链上被添加的自定义属性。**极不推荐**用于遍历数组。
- **`for...of`**：ES6 新增，专门用于遍历实现了 Iterator 接口的数据结构（如数组）。它遍历的是**值**，安全且高效。

### 4.3 `forEach` 循环中能使用 `break` 或 `return` 跳出循环吗？

**不能。** `forEach` 无法通过常规的 `break` 中断。`return` 仅仅是跳出当前这一个回调函数（类似于 `continue`)，如果需要提前中断循环，请使用普通的 `for` 循环，或者 `some()`、`every()`。

### 4.4 V8 引擎底层是如何实现 JS 数组的？

JS 数组在底层并不是纯粹的一片连续内存。V8 引擎有两种数组模式：

- **快数组 (Fast Elements)**：如果你的数组类型一致（如全是数字），且索引紧凑没有大跳跃，V8 会分配一块**连续的线性内存**，像 C 语言数组一样高效。
- **慢数组 (Dictionary Elements)**：如果你的数组充满空洞（如 `arr[0]=1; arr[10000]=2;`），或者混杂了各种对象，V8 会把它转为 **哈希表（字典）** 存储。这样节省了内存，但查找和插入的时间复杂度退化。

### 4.5 `new Array(3)` 和 `[undefined, undefined, undefined]` 有什么区别？

前者创建的是**稀疏数组**，长度为 3，但**没有任何索引属性**（打印出来是 `[empty × 3]`）；后者是三个真实存在的元素，值都是 `undefined`。

- 这会导致行为差异：
  - `new Array(3).map(x => 1)` → `[empty × 3]`，回调**一次都不执行**；而 `[undefined, undefined, undefined].map(x => 1)` → `[1, 1, 1]`。
  - `new Array(3).forEach(...)` 同样一次都不执行。
- **建议**：需要长度固定的占位数组时，用 `Array.from({ length: 3 })` 或 `new Array(3).fill(undefined)`，得到的是元素真实存在的密集数组。

### 4.6 `Array.from()`、扩展运算符 `...`、`slice()` 转数组怎么选？

- **扩展运算符 `[...arrLike]`**：写法最简洁，但要求对象**实现了 `Symbol.iterator`**。`arguments`、`NodeList`、`Set`、`Map` 都可以；只有 `length` 和索引的“**纯类数组**”对象不行。
- **`Array.from(arrLike)`**：只要对象有 `length` 属性就能转，兼容性最好，还支持第二个参数直接做映射：`Array.from({ length: 3 }, (_, i) => i)`。
- **`Array.prototype.slice.call(arrLike)`**：ES5 时代的老写法，现在基本只在维护老代码时才会见到。

### 4.7 为什么 `[NaN].indexOf(NaN)` 是 `-1`，而 `[NaN].includes(NaN)` 是 `true`？

`indexOf` 内部用**严格相等 `===`** 比较，而 `NaN === NaN` 恒为 `false`，所以永远找不到；`includes` 内部使用 **SameValueZero** 算法，它规定 `NaN` 等于自身，所以返回 `true`，判断数组是否包含某个值，优先用 `includes`；只有需要兼容老环境时才退回 `indexOf`。

### 4.8 `sort()` 是稳定排序吗？

**是。** 从 ES2019 规范开始，`Array.prototype.sort` **必须**是稳定排序（V8 7.0 / Chrome 70 起落实）。稳定意味着比较结果相等的两个元素，排序后相对顺序不变。

- 所以 `[{ id: 1, name: 'a' }, { id: 1, name: 'b' }].sort((x, y) => x.id - y.id)` 中 `a`、`b` 的先后顺序会被保留。
- 另外注意 `sort()` 是**原地修改**的，若不想动原数组，请用 `toSorted()`。
