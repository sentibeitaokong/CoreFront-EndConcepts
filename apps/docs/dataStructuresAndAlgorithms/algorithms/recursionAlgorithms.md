---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 递归算法

## 1. 递归算法核心概览

递归，通俗来说就是“**函数自己调用自己**”。它的核心思想是将一个极其复杂的大问题，层层拆解为结构相同、但规模更小的子问题，直到子问题简单到可以直接求解，然后再层层返回结果，最终拼凑出原问题的答案。

### 1.1 递归的核心两要素

编写任何递归函数，都必须严格包含以下两个部分，缺一不可：

[width(13,62,25)]

| 核心要素     | 详细说明                                                                                                           | 代码体现示例                   |
| :----------- | :----------------------------------------------------------------------------------------------------------------- | :----------------------------- |
| **终止条件** | 递归的“**刹车片**”。必须有一个明确的条件，满足时不再继续调用自身，而是直接返回一个确定的值。否则会导致无限死循环。 | `if (n === 1) return 1;`       |
| **递推关系** | 递归的“**引擎**”。将当前问题拆解为更小规模的同类问题，并进行自我调用，同时一定要**逼近终止条件**。                 | `return n * factorial(n - 1);` |

## 2. 经典递归场景

### 2.1 数学计算：阶乘 (Factorial)

最基础的递归演示。计算 `n!`（即 `n * (n-1) * ... * 1`）。

```js
/**
 * 计算 n 的阶乘
 * @param {Number} n
 * @returns {Number}
 */
function factorial(n) {
  // 1. 终止条件：当 n 为 1 或 0 时，阶乘为 1
  if (n === 1 || n === 0) {
    return 1
  }
  // 2. 递推关系：n! = n * (n-1)!
  return n * factorial(n - 1)
}

console.log(factorial(5)) // 输出: 120 (5 * 4 * 3 * 2 * 1)
```

### 2.2 前端高频应用：数组扁平化 (Array Flattening)

在处理多维嵌套数组时（例如 `[1, [2, [3, 4]]]`），递归是将其展平为一维数组的最佳利器。

```js
/**
 * 递归实现数组扁平化
 * @param {Array} arr 多维数组
 * @returns {Array} 一维数组
 */
function flattenArray(arr) {
  let result = []

  for (let i = 0; i < arr.length; i++) {
    // 判断当前元素是否仍是数组
    if (Array.isArray(arr[i])) {
      // 是数组：递归展开它，并与当前结果拼接
      result = result.concat(flattenArray(arr[i]))
    } else {
      // 不是数组（终止条件隐式体现）：直接推入结果
      result.push(arr[i])
    }
  }

  return result
}

console.log(flattenArray([1, [2, [3, 4], 5], 6])) // 输出: [1, 2, 3, 4, 5, 6]
```

### 2.3 核心对象操作：完美深拷贝 (Deep Clone)

JavaScript 中引用类型的拷贝一直是痛点。利用递归遍历对象的所有层级结构，是实现深拷贝的核心。

```js
/**
 * 递归实现完美的深拷贝
 * @param {Object} obj 要拷贝的对象
 * @param {WeakMap} hash 用于解决循环引用问题的哈希表
 */
function deepClone(obj, hash = new WeakMap()) {
  // 终止条件 1：如果不是对象或数组（即基本类型），直接返回
  if (obj === null || typeof obj !== 'object') return obj
  // 终止条件 2：如果 Date 或 RegExp 对象，特殊处理
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof RegExp) return new RegExp(obj)

  // 终止条件 3：解决循环引用（如果该对象已经被拷贝过，直接返回其引用）
  if (hash.has(obj)) return hash.get(obj)

  // 初始化拷贝后的新对象或数组
  let cloneObj = new obj.constructor()
  hash.set(obj, cloneObj) // 记录当前对象已经拷贝过

  // 递推关系：递归处理所有的属性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneObj[key] = deepClone(obj[key], hash)
    }
  }
  return cloneObj
}
```

### 2.4 树形结构遍历：DOM 树 / 组件树 / 文件树

前端处理的数据大量是树形的：DOM 节点、React / Vue 组件树、文件目录、权限菜单、评论楼中楼……它们的共同点是「每个节点又包含若干同构的子节点」，这正是递归最自然的用武之地。

[width(18,41,41)]

| 场景          | 递归含义                                       | 高频 API / 术语                                     |
| :------------ | :--------------------------------------------- | :-------------------------------------------------- |
| DOM 树遍历    | 处理当前节点，再递归处理它的每一个子节点       | `node.childNodes` / `node.children`                 |
| 组件树渲染    | 组件返回子树，框架递归挂载                     | React 的 `children`、Vue 的递归组件（组件内写自己） |
| 树形查找      | 在子树里找目标节点，命中即返回                 | DFS、`Array.prototype.find` + 递归                  |
| 扁平列表转树  | 按 `parentId` 把一维数组组装成多叉树           | `reduce` 建索引 + 递归挂载                          |
| JSON 序列化   | `JSON.stringify` 内部就是对属性递归下降        | `JSON.stringify` / `JSON.parse`                     |
| 虚拟 DOM diff | 同层比较后递归处理子节点（React 的 reconcile） | `React.createElement`、diff 算法                    |
| 对象深度比较  | 逐层比对两个对象的每个属性                     | `deepEqual` 手写、`structuredClone`                 |

:::code-group

```js [递归遍历 DOM 子树]
/**
 * 递归遍历 DOM 子树
 * @param {Node} node 起始节点
 * @param {Function} visit 每个节点执行的回调
 */
function walkDom(node, visit) {
  visit(node)
  // 终止条件隐式体现：没有子节点时循环不执行
  node.childNodes.forEach(child => walkDom(child, visit))
}

walkDom(document.body, node => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    node.classList.add('visited')
  }
})
```

```js [扁平列表转树]
/**
 * 扁平列表转树
 * @param {Array} list 记录列表
 * @param {*} rootId 根节点的 parentId
 * @returns {Array}
 */
function buildTree(list, rootId = null) {
  const tree = []
  for (const item of list) {
    if (item.parentId === rootId) {
      // 递推关系：为当前节点继续寻找它的子节点
      item.children = buildTree(list, item.id)
      tree.push(item)
    }
  }
  return tree
}
```

:::

### 2.5 分治（Divide and Conquer）：归并排序与快速排序

分治是递归在算法层面的经典范式，三步走：**分（Divide）→ 治（Conquer）→ 合（Combine）**。它和普通递归的区别在于：把问题拆成多个子问题**分别求解**，再把结果**合并**回去。

- **归并排序**：把数组从中间劈成两半 → 各自排好序 → 合并两个有序数组。
- **快速排序**：选一个基准值（pivot）→ 小的扔左边、大的扔右边 → 对左右两部分分别快排（这一步不需要「合并」，因为划分本身就在排序）。

```js
/**
 * 归并排序：典型的分治递归
 * @param {number[]} arr
 * @returns {number[]}
 */
function mergeSort(arr) {
  // 终止条件：长度小于 2 时天然有序
  if (arr.length < 2) return arr

  const mid = Math.floor(arr.length / 2)
  const left = mergeSort(arr.slice(0, mid)) // 分 + 治
  const right = mergeSort(arr.slice(mid))

  // 合：把两个有序数组合并成一个
  const merged = []
  let i = 0
  let j = 0
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      merged.push(left[i])
      i++
    } else {
      merged.push(right[j])
      j++
    }
  }
  return merged.concat(left.slice(i)).concat(right.slice(j))
}
```

### 2.6 回溯（Backtracking）：全排列、子集与 N 皇后

回溯 = 递归 + 撤销选择。它沿着一条路径一路深入，走不通或走完就退回上一步、换一个分支继续。核心模板固定为：**做选择 → 递归 → 撤销选择**。

```js
/**
 * 求数组的全排列（回溯模板）
 * @param {number[]} nums
 * @returns {number[][]}
 */
function permute(nums) {
  const result = []
  const path = []
  const used = new Array(nums.length).fill(false)

  function backtrack() {
    // 终止条件：路径长度等于原数组，说明凑出了一个完整排列
    if (path.length === nums.length) {
      result.push([...path])
      return
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue
      used[i] = true // 做选择
      path.push(nums[i])
      backtrack() // 递归进入下一层
      path.pop() // 撤销选择
      used[i] = false
    }
  }

  backtrack()
  return result
}
```

> [!TIP]
> 回溯的本质是把「多叉树的遍历」用递归写出来：每一层代表一次选择，叶子节点就是一个完整解。剪枝（提前 `return`）与去重（先排序、再跳过相邻的相同元素）是刷题时最常追加的优化。

## 3. 递归的性能黑洞与高阶优化

递归虽然代码极其优雅简洁，但在 JavaScript 引擎中却存在两个致命的性能陷阱。

### 3.1 记忆化缓存 (Memoization)

**陷阱：重叠子问题导致时间复杂度爆炸。**
以著名的斐波那契数列（Fibonacci：`1, 1, 2, 3, 5, 8...`）为例，纯粹的递归 `fib(n) = fib(n-1) + fib(n-2)` 会产生极其可怕的重复计算，时间复杂度高达 `O(2^n)`。计算 `fib(50)` 甚至会让浏览器直接崩溃。

**对策：** 引入缓存对象，将计算过的值存起来，下次直接读取。这直接将时间复杂度降为 `O(n)`。

```js
/**
 * 使用闭包和缓存优化的斐波那契数列
 */
const fibonacciMemo = (function () {
  // 缓存对象，充当备忘录
  const memo = {}

  return function fib(n) {
    if (n <= 2) return 1 // 终止条件

    // 如果备忘录里有，直接返回（O(1) 查找）
    if (memo[n]) return memo[n]

    // 如果没有，计算后存入备忘录，再返回
    memo[n] = fib(n - 1) + fib(n - 2)
    return memo[n]
  }
})()

console.log(fibonacciMemo(50)) // 瞬间输出: 12586269025
```

### 3.2 尾递归优化 (Tail Call Optimization - TCO)

**陷阱：调用栈溢出 (Stack Overflow)。**
JS 引擎在执行函数时，会往内存的“**执行栈（Call Stack）**”中推入栈帧。如果递归层数太深（一般超过 10000 层），内存就会被撑爆，抛出 `RangeError: Maximum call stack size exceeded`。

**对策：** 将递归调用放到函数的**最后一步**，并且**不要保留任何局部变量的计算**。这样引擎就可以重用当前栈帧，不再无脑压栈。

```js
//普通递归：返回阶段还需要进行乘法运算 (n * ...)，所以必须保留每一层的 n，导致一直压栈
function factorial(n) {
  if (n === 1) return 1
  return n * factorial(n - 1)
}

// ✅ 尾递归优化：将中间结果 (total) 放在参数中传递。最后一步纯粹只有函数调用本身。
function factorialTail(n, total = 1) {
  if (n === 1) return total
  return factorialTail(n - 1, n * total) // 重点：没有外层计算了
}
```

### 3.3 递归的复杂度分析：递归树与主定理

分析递归算法的时间复杂度，不能只数循环，而要看**递归调用展开后的形态**。

- **递归树法（Recursion Tree）：** 把递归调用画成一棵树，每个节点代表一次函数调用。把「每个节点的开销 × 该层节点数」求出，再把所有层累加起来。
- **主定理（Master Theorem）：** 对于形如 `T(n) = a·T(n/b) + f(n)` 的分治递归，可直接套公式判断复杂度量级（比较 `f(n)` 与 `n^(log_b a)` 的大小）。

[width(21,30,18,31)]

| 递归形式                         | 递推式                   | 时间复杂度    | 典型例子                   |
| :------------------------------- | :----------------------- | :------------ | :------------------------- |
| 线性递减（每次只调用一次自身）   | `T(n) = T(n-1) + O(1)`   | $O(n)$        | 阶乘、数组求和             |
| 二分查找（只递归其中一半）       | `T(n) = T(n/2) + O(1)`   | $O(\log n)$   | 二分查找                   |
| 二分分治（拆一半且做 O(n) 合并） | `T(n) = 2T(n/2) + O(n)`  | $O(n \log n)$ | 归并排序、快速排序（平均） |
| 组合爆炸（每次调用两个自身）     | `T(n) = 2T(n-1) + O(1)`  | $O(2^n)$      | 朴素斐波那契、子集枚举     |
| 记忆化后（状态只有 n 个）        | `T(n)`，每个状态只算一次 | $O(n)$        | 记忆化斐波那契             |

## 4. 常见问题深度剖析 (FAQ)

### 4.1 报错：`RangeError: Maximum call stack size exceeded`

这就是著名的“**栈溢出**”，原因有二：一是忘记写终止条件导致无限递归，二是数据量太大、递归层数超出 V8 的最大调用栈容量（通常在一万层左右）。解决办法：先检查 `if` 终止条件，若数据量确实过大，就改为 **`while` / `for` 循环（迭代）**，或自己维护数组模拟栈 (Stack)。

### 4.2 为什么深拷贝递归会报内存泄漏或死循环？

因为对象存在“**循环引用**”，例如 `obj.a = obj`，普通递归深拷贝会顺着这条线无限拷贝下去。解决办法是引入 `WeakMap`：每次拷贝对象前先查一下，拷贝过就直接返回缓存的引用。

### 4.3 递归 和 迭代（循环），到底怎么选？

递归代码可读性极高、符合数学思维，但内存开销大（压栈）、存在溢出风险；迭代性能极高、无栈溢出风险，但处理树、图等非线性结构时代码会极其臃肿复杂。**黄金法则**：线性结构（单纯计算、一维数组）且层级很深时优先迭代；非线性结构（DOM 树遍历、AST 解析、对象深拷贝）果断用递归。

### 4.4 为什么 JS 没有尾调用优化（TCO）？

ES6 规范确实写过「严格模式下必须做尾调用优化」，但 V8（Chrome / Node）出于实现成本与调试体验的考虑没有跟进：启用 TCO 会复用栈帧，导致 `Error.stack` 丢失中间调用帧，`debugger` 断点和堆栈追踪都会受影响；目前只有 Safari（JavaScriptCore）严格实现了它。因此不要指望 TCO 防爆栈，该用迭代就用迭代，或自己维护显式栈，也可以把超深递归拆成异步任务（`setTimeout` / `queueMicrotask`）让调用栈在两次任务之间被清空。

### 4.5 递归深度上限大概是多少？

没有固定值，取决于引擎、每个栈帧的大小和剩余内存，同一段代码在不同机器上都可能不同。在 V8 里，普通的 `f(n - 1)` 递归通常在一万层上下就会抛 `RangeError: Maximum call stack size exceeded`。不要把具体数字写进业务逻辑：只要存在深度可能很大的情况就改成迭代，需要提前评估时，用一个小脚本实测当前环境的安全深度。

### 4.6 记忆化（Memoization）和动态规划（DP）是什么关系？

两者都在利用「重叠子问题」做缓存：记忆化是**自顶向下**，从原问题递归下去、遇到算过的直接取缓存；DP 是**自底向上**，从最小子问题递推填表。同一道题两种写法往往等价、复杂度也相同。状态转移方程不好直接想时，先写记忆化递归再“**翻译**”成自底向上的 DP；担心递归爆栈时，继续改写成迭代 DP。

### 4.7 怎么把递归改写成迭代（显式栈）？

递归能自动回溯靠的是引擎维护的调用栈，改写成迭代就要自己用一个数组模拟这个栈。以二叉树前序遍历为例：把根节点压栈，循环里弹出节点并处理，再把**右、左**子节点依次压栈（倒序压入，保证左孩子先出栈）。对于需要「回溯结果」的递归（后序遍历、回溯法），入栈时额外记录状态或加访问标记，把复杂度从“**靠调用栈**”变成“**靠数据结构**”，即可彻底规避爆栈。

### 4.8 分治和递归是什么关系？

分治是**递归的一种使用范式**，不是独立算法，它要求问题能拆成结构相同、相互独立的子问题，求解后再合并结果；递归是实现分治的天然工具，但递归不一定是分治——阶乘只是线性递减，并没有「合并多个子问题」这一步。判断能否分治看三点：**可分解**、**子问题同类且独立**（无重叠）、**可合并**；若子问题存在重叠，就该转向记忆化 / 动态规划。
