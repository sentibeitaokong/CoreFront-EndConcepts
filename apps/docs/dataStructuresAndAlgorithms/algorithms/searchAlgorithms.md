---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 查找算法

## 1. 核心查找算法概览

[width(30,15,13,13,11,18)]

| 算法名称                            | 适用数据结构  | 平均时间复杂度 | 最坏时间复杂度 | 空间复杂度 | 前提条件               |
| :---------------------------------- | :------------ | :------------- | :------------- | :--------- | :--------------------- |
| **顺序查找 (Linear Search)**        | 数组、链表    | O(n)           | O(n)           | O(1)       | 无                     |
| **二分查找 (Binary Search)**        | 数组          | O(log n)       | O(log n)       | O(1)       | 数据**必须有序**       |
| **插值查找 (Interpolation Search)** | 数组          | O(log(log n))  | O(n)           | O(1)       | 数据**有序且分布均匀** |
| **哈希查找 (Hash Search)**          | 哈希表 / 字典 | O(1)           | O(n)           | O(n)       | 需要额外的哈希表空间   |
| **二叉搜索树查找 (BST Search)**     | 二叉搜索树    | O(log n)       | O(n)           | O(1)       | 树不能极度失衡         |

- 数据**无序**、规模不大 → 顺序查找（`indexOf` / `includes` / `find` 的底层就是它）。
- 数据**有序**、支持随机访问 → 二分查找；数据量大且分布均匀时，插值查找可能更快。
- 需要**频繁增删**又要求高效查找 → 哈希表（无序）或平衡树 / 二叉搜索树（有序）。
- 只想判断“**某个值在不在**”而不关心位置 → 用 `Set` / `Map` 的 `has`，平均 $O(1)$。

> [!TIP]
> 选型的顺序通常是：先问数据**有序吗**，再问**增删频繁吗**，最后才在同类算法里比常数因子。绝大多数业务里的“**查找慢**”，问题都不在算法本身，而在数据结构选错了。

## 2. 基础数组查找算法

### 2.1 顺序查找 / 线性查找

这是最基础、直接的查找方式。它按顺序遍历数据结构中的每一个元素,依次与目标值进行比对,直到找到为止。

- **核心思想：** 暴力遍历。
- **适用场景：** 数据量较小，或者数据完全无序，且无法提前建立索引或排序。

```js
/**
 * 顺序查找
 * @param {Array} arr 待查找数组
 * @param {Number/String} target 目标值
 * @returns {Number} 目标值的索引，未找到返回 -1
 */
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i
    }
  }
  return -1
}

// 实际开发中，推荐使用 JS 原生方法：
// const index = arr.indexOf(target);
// const item = arr.find(element => element === target);
// const foundIndex = arr.findIndex(element => element.id === target);
```

**JS 原生查找 API 对应的底层实现**

[width(24,20,37,19)]

| 方法                       | 返回                          | 说明                                                          | 复杂度                   |
| :------------------------- | :---------------------------- | :------------------------------------------------------------ | :----------------------- |
| **`indexOf(value)`**       | 第一个匹配的索引，找不到 `-1` | 使用严格相等比较，**无法识别 `NaN`**。                        | 最优 $O(1)$，最差 $O(n)$ |
| **`lastIndexOf(value)`**   | 最后一个匹配的索引            | 从后往前扫描，同样使用严格相等比较。                          | 最优 $O(1)$，最差 $O(n)$ |
| **`includes(value)`**      | 布尔值                        | 使用 SameValueZero 算法，**能识别 `NaN`**。                   | 最优 $O(1)$，最差 $O(n)$ |
| **`find(fn)`**             | 第一个满足条件的元素          | 支持任意条件判断，找不到返回 `undefined`。                    | 最优 $O(1)$，最差 $O(n)$ |
| **`findIndex(fn)`**        | 第一个满足条件的索引          | 条件版本，找不到返回 `-1`。                                   | 最优 $O(1)$，最差 $O(n)$ |
| **`findLast(fn)`**         | 最后一个满足条件的元素        | 从后往前查找（ES2023）。                                      | 最优 $O(1)$，最差 $O(n)$ |
| **`Set.prototype.has(v)`** | 布尔值                        | 不是数组方法，但平均 $O(1)$，比 `includes` 的 $O(n)$ 快得多。 | 平均 $O(1)$              |

> [!TIP]
> 这些原生方法都是**线性查找**。如果需要在同一堆数据里反复查找，先把数组转成 `Set` 或 `Map`，用一次 $O(n)$ 的建表换取之后每次 $O(1)$ 的查询，这是前端最高频的性能优化套路之一。

### 2.2 二分查找 / 折半查找

二分查找是基于**分治思想**的经典算法。它每次都将目标值与搜索范围的“**中间**”元素进行比较，如果目标值小于中间元素，则在左半部分继续搜索；如果大于，则在右半部分搜索。
**绝对前提：数组必须是已经排好序的。**

- **核心思想：** 每次排除一半的候选数据。
- **适用场景：** 静态的、已排序的大规模数组查找。

#### 2.2.1 左闭右闭边界

```js
/**
 * 二分查找 (非递归实现)
 * @param {Array} arr 已排序的数组 (假设为升序)
 * @param {Number} target 目标值
 * @returns {Number} 目标值的索引，未找到返回 -1
 */
function binarySearch(arr, target) {
  let left = 0
  let right = arr.length - 1

  while (left <= right) {
    // 关键点1：条件必须是 left <= right

    // 关键点2：防止 (left + right) 数值过大导致溢出 (虽然 JS 中数字安全上限很高，但这是算法标准写法)
    // 位运算写法：let mid = left + ((right - left) >> 1);
    let mid = left + Math.floor((right - left) / 2)

    if (arr[mid] === target) {
      return mid // 找到了
    } else if (arr[mid] < target) {
      left = mid + 1 // 目标在右半区，调整左边界
    } else {
      right = mid - 1 // 目标在左半区，调整右边界
    }
  }
  return -1
}
```

#### 2.2.2 左闭右开边界

```js
// 左闭右开写法的二分查找 [left, right)
function binarySearchHalfOpen(arr, target) {
  let left = 0
  let right = arr.length // 注意：右边界取不到，所以是 length 而不是 length - 1
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2)
    if (arr[mid] === target) return mid
    if (arr[mid] < target) {
      left = mid + 1
    } else {
      right = mid // 因为右边界取不到，这里不写 mid - 1
    }
  }
  return -1
}
```

> [!WARNING]
> 两种写法本身都对，**真正会导致死循环或漏解的是混用**：比如用了左闭右开的初始值 `right = arr.length`，却在收缩时写成 `right = mid - 1`；或者在左闭右闭里写 `right = mid`，都可能在 `left === right` 时原地打转。写二分前先确定区间是“**闭**”还是“**开**”，再统一整套边界。

#### 2.2.3 查找变体：`lower_bound` 与 `upper_bound`

很多题目要的不是“**存不存在**”，而是“**第一个满足条件的位置**”。这时用`lower_bound` / `upper_bound`更自然：

- **`lower_bound(target)`**：返回第一个**大于等于** `target` 的位置（即 `target` 的插入点，也是重复目标区间的左端）。
- **`upper_bound(target)`**：返回第一个**严格大于** `target` 的位置（重复目标区间的右端）。

```js
// 返回第一个 >= target 的下标；若元素都比 target 小，则返回 arr.length
function lowerBound(arr, target) {
  let left = 0
  let right = arr.length
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2)
    if (arr[mid] < target) {
      left = mid + 1 // mid 严格小于目标，一定不是答案
    } else {
      right = mid // mid 可能就是答案，保留在区间内
    }
  }
  return left
}

// 返回第一个 > target 的下标；若没有更大的元素，则返回 arr.length
function upperBound(arr, target) {
  let left = 0
  let right = arr.length
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2)
    if (arr[mid] <= target) {
      left = mid + 1 // 小于等于目标的一律排除
    } else {
      right = mid
    }
  }
  return left
}

const nums = [1, 2, 2, 2, 3, 5]
console.log(lowerBound(nums, 2)) // 1
console.log(upperBound(nums, 2)) // 4
console.log(upperBound(nums, 2) - lowerBound(nums, 2)) // 3，即 2 出现了 3 次
```

> [!TIP]
> 与其死记四套模板，不如只记 `lower_bound` 一套：其他变体要么是它的镜像，要么是它的结果加一减一。面试时先想清楚要的是“**第一个还是最后一个**”，再动手写。

#### 2.2.4 二分答案

二分的对象不一定是数组下标，也可以是**答案本身的取值范围**。只要答案满足单调性（判定条件随取值单调变化），就能对答案区间做二分。这类题通常叫「二分答案」。

```js
// 例：求满足 x^2 <= target 的最大整数 x（即 sqrt 的整数部分）
// 答案区间是 [0, target]，随着 x 增大，x^2 <= target 由“真”变“假”，具备单调性。
function mySqrt(target) {
  let left = 0
  let right = target
  let ans = 0
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (mid * mid <= target) {
      ans = mid // mid 可行，先记下来，再尝试更大的值
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return ans
}

console.log(mySqrt(10)) // 3
```

> [!TIP]
> 「二分答案」的套路是：先写出一个好判断的 `check(x)`，再确认 `check` 随 `x` 单调（比如“**越大越难满足**”），然后二分枚举 `x`。常见于“**最小化最大值**”“**最大化最小值**”“**求满足条件的最大容量**”等问题。

### 2.3 插值查找

插值查找是二分查找的进阶版本。它不再死板地每次都取正中间的元素，而是**根据目标值的大小，自适应地预测目标值可能出现的位置**。就像查字典时，找以'A'开头的单词会直接翻到前面，找以'Z'开头的会直接翻到后面。

- **核心预测公式：** `mid = left + (right - left) * (target - arr[left]) / (arr[right] - arr[left])`
- **适用场景：** 数据量极大，且数据**不仅有序，而且分布极其均匀**（如连续的数字序列）。

```js
/**
 * 插值查找
 * @param {Array} arr 已排序且分布均匀的数组
 * @param {Number} target 目标值
 */
function interpolationSearch(arr, target) {
  let left = 0
  let right = arr.length - 1

  // 注意：必须确保 target 在数组的极值范围内，否则公式计算可能越界
  while (left <= right && target >= arr[left] && target <= arr[right]) {
    if (left === right) {
      if (arr[left] === target) return left
      return -1
    }

    // 核心：自适应计算探测位置
    let pos =
      left +
      Math.floor(
        ((right - left) * (target - arr[left])) / (arr[right] - arr[left]),
      )

    if (arr[pos] === target) {
      return pos
    }
    if (arr[pos] < target) {
      left = pos + 1
    } else {
      right = pos - 1
    }
  }
  return -1
}
```

## 3. 基于高级数据结构的查找

在复杂的业务场景或底层系统设计中，单纯的数组结构往往无法满足高效的频繁增、删、查需求。这时，我们需要借助更高级的数据结构。

### 3.1 哈希查找

哈希查找的核心思想是**空间换时间**。它通过一个**哈希函数**，将键(Key)直接映射到内存中的一个位置，从而实现近乎 **O(1)** 的超高查询效率，在 JavaScript 中，原生的 `Object`、`Map` 和 `Set` 底层都高度依赖哈希表结构。

```js
/**
 * 使用 JavaScript 内置 Map 演示哈希查找的应用
 */
class Dictionary {
  constructor() {
    // 推荐使用 Map 而不是纯 Object，因为 Map 为频繁增删查改做了专门优化
    this.hashTable = new Map()
  }

  // 插入数据 (构建哈希表): 平均 O(1)
  insert(key, value) {
    this.hashTable.set(key, value)
  }

  // 哈希查找: 平均 O(1)
  search(key) {
    if (this.hashTable.has(key)) {
      return this.hashTable.get(key) // 直接命中，无需遍历
    }
    return null // 未找到
  }
}

const dict = new Dictionary()
dict.insert('EMP_001', { name: 'Alice', department: 'Engineering' })
dict.insert('EMP_002', { name: 'Bob', department: 'HR' })

// 瞬间查出目标数据
console.log(dict.search('EMP_001'))
```

### 3.2 二叉搜索树查找

二叉搜索树（BST）是一种特殊的二叉树，它具有天然的排序特性：
**对于任意节点，其左子树上所有节点的值均小于该节点的值；其右子树上所有节点的值均大于该节点的值。**

```js
// 1. 定义树节点
class TreeNode {
  constructor(val) {
    this.val = val
    this.left = null
    this.right = null
  }
}

// 2. BST 查找实现
class BinarySearchTree {
  constructor() {
    this.root = null
  }

  // ... 假设这里有 insert 方法构建了树 ...

  /**
   * 在 BST 中查找特定值 (递归实现)
   * @param {TreeNode} node 当前搜索的起始节点 (通常传入 this.root)
   * @param {Number} target 目标值
   * @returns {TreeNode | null} 找到的节点对象，未找到返回 null
   */
  search(node, target) {
    // 基线条件：节点为空（找到底了没找到），或找到了目标
    if (node === null || node.val === target) {
      return node
    }

    // 目标值小于当前节点，继续向左子树深入查找
    if (target < node.val) {
      return this.search(node.left, target)
    }
    // 目标值大于当前节点，继续向右子树深入查找
    else {
      return this.search(node.right, target)
    }
  }
}
```

## 4. 常见问题 (FAQ)

### 4.1 二分查找为什么必须要求数组有序？

二分的核心动作是“**拿 `arr[mid]` 与目标比较，然后一次性排除掉一半**”。这个排除之所以成立，依赖的前提是：若 `arr[mid] < target`，则 `mid` 左边（含 `mid`）的所有元素也都 `< target`；若 `arr[mid] > target`，右边全部 `> target`。

- 一旦数组无序，某个半区里就完全可能藏着目标，而你却把它整片丢掉了，结果自然是错的。
- 所以二分不是“**在数组里找数**”，而是“**在有序数组里找数**”。数据无序时要么先排序（$O(n \log n)$），要么改用哈希（$O(n)$ 建表 + 平均 $O(1)$ 查询）。

### 4.2 二分查找怎么写才不会死循环？

- **区间定义要统一。** 左闭右闭 `[left, right]` 配 `while (left <= right)`，收缩用 `left = mid + 1` / `right = mid - 1`；左闭右开 `[left, right)` 配 `while (left < right)`，收缩用 `left = mid + 1` / `right = mid`。两套不能混用。
- **区间必须真的缩小。** 每轮迭代至少要改动 `left` 或 `right` 中的一个。常见的中点写法有两种，注意取整方向要和收缩方向搭配：
  - `mid = left + Math.floor((right - left) / 2)`（下取整，配 `left = mid + 1`）；
  - `mid = left + Math.ceil((right - left) / 2)`（上取整，配 `right = mid - 1`）。
- **调试时打印 `left`、`right`、`mid`。** 如果发现某轮之后三者没变，就是边界没收缩，问题一定出在取整方向与收缩方向的搭配上。

### 4.3 `(left + right) / 2` 会溢出吗？JS 里要不要在意？

**在 JS 里通常不用担心**，因为 `Number` 是双精度浮点数，安全整数上限是 `2^53 - 1`，实际数组长度远远到不了会溢出的量级。

- 但 `left + (right - left) / 2`（或位运算写法 `left + ((right - left) >> 1)`）是**跨语言的通用写法**。在 C / Java 等定长整数语言里，`left + right` 溢出会算出负数，进而 `arr[负数]` 直接报错。
  > [!NOTE]
  > `>> 1` 是位运算，会先把操作数转成 **32 位有符号整数**，当数组长度超过 $2^{31}-1$ 时结果会出错。日常数组不可能这么大，但追求绝对稳妥时，用 `Math.floor((right - left) / 2)` 更安全。

### 4.4 二分查找的常见变体有哪几种？

所有变体都能由同一套“**在有序数组里找边界**”的模板推出来，最常见的有四种：

[width(27,34,39)]

| 变体                        | 含义                                       | 判定条件（升序数组）           |
| :-------------------------- | :----------------------------------------- | :----------------------------- |
| **精确查找**                | 找到等于目标的位置                         | `arr[mid] === target` 直接返回 |
| **`lower_bound`**           | 第一个 **≥** 目标的位置                    | `arr[mid] < target` 则左移     |
| **`upper_bound`**           | 第一个 **>** 目标的位置                    | `arr[mid] <= target` 则左移    |
| **最后一个 ≤ / 最后一个 <** | `lower_bound` / `upper_bound` 的结果再减一 | 复用上面两个函数的结果减 1     |

### 4.5 哈希查找和二分查找该怎么选？

[width(13,46,41)]

| 维度         | 哈希查找                                          | 二分查找                       |
| :----------- | :------------------------------------------------ | :----------------------------- |
| **数据要求** | 无序即可                                          | 必须有序                       |
| **查询速度** | 平均 $O(1)$，最坏 $O(n)$                          | 稳定 $O(\log n)$               |
| **额外空间** | 需要 $O(n)$ 建表                                  | $O(1)$                         |
| **范围查询** | 不支持（无法找“**第 k 大**”“**某区间内的元素**”） | 天然支持，也能做 `lower_bound` |
| **动态增删** | 频繁增删后可能触发扩容 / 再哈希                   | 插入删除要保持有序，代价较高   |

- **选哈希**：数据基本不变、只需要“**点查**”（某个 key 在不在、对应什么值），且愿意付出额外内存。
- **选二分**：数据已排序、内存敏感、需要范围查询 / 找最值 / 找边界，或者数据是“**静态只读**”的一次性构建。

### 4.6 插值查找为什么适合“**均匀分布**”的数据？

- **原理：** 插值查找不再固定取中点，而是用目标值在 `[arr[left], arr[right]]` 中的**相对位置**去推测下标：目标越靠近右端，猜测位置就越靠右。当数据均匀分布时，这个预测非常准，一步就能逼近目标，平均复杂度达到 $O(\log(\log n))$，比二分的 $O(\log n)$ 还快。
- **为什么怕不均匀：** 如果数据严重倾斜（例如 `[1, 2, 3, ..., 1000000, 1000000000]`），公式一次就可能把 `pos` 推到极端，甚至越界，此时复杂度退化到 $O(n)$。
- **实践建议：** 只有“**数据量很大且近似均匀**”时才值得用插值查找；一般场景用二分查找更稳妥，代码也更不易出错。
