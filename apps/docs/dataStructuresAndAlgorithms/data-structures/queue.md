# 队列 (Queue) 与 双端队列 (Deque)

## 1. 普通队列 (Queue)

### 1.1 核心概念

普通队列严格遵循 **FIFO (First In, First Out，先进先出)** 原则。
就像超市结账排队，**只能从队尾（Rear）加入，从队头（Front）离开**。

![队列的先进先出结构示意图](/img/queue.png)

[width(15,85)]

| 特性           | 描述                                                                                                    |
| :------------- | :------------------------------------------------------------------------------------------------------ |
| **核心规则**   | **FIFO (First In, First Out) —— 先进先出**，最先入队的元素最先出队。                                    |
| **操作位置**   | 入队在**队尾 (Rear)**，出队在**队头 (Front)**，两端各管一头，不能在中间插队。                           |
| **核心操作**   | `enqueue`（入队）、`dequeue`（出队）、`front` / `peek`（只看队头）、`isEmpty`（判空）、`size`（大小）。 |
| **时间复杂度** | 用链表或双指针对象实现时，入队、出队都是 $O(1)$；用数组 `shift()` 出队则是 $O(n)$。                     |
| **与栈的区别** | 栈是 LIFO（后进先出），队列是 FIFO（先进先出），这是两者唯一的本质差异。                                |

### 1.2 使用 JS 数组模拟普通队列

利用数组的 `push`（尾部添加）和 `shift`（头部移除）可以轻松模拟。

```js
class Queue {
  constructor() {
    this.items = []
  }
  // 入队
  enqueue(element) {
    this.items.push(element)
  }
  // 出队 (注意：性能为 O(n))
  dequeue() {
    return this.items.shift()
  }
  // 查看队头
  front() {
    return this.items[0]
  }
  isEmpty() {
    return this.items.length === 0
  }
  size() {
    return this.items.length
  }
}
```

## 2. 双端队列 (Deque - Double-Ended Queue)

### 2.1 核心概念

**双端队列 (Deque，发音通常为 "deck")** 是一种特殊的队列。它打破了普通队列的严格限制，允许你**在队列的两端（队头和队尾）都能进行插入和删除操作**。

可以说，双端队列同时拥有了**栈 (LIFO)** 和 **普通队列 (FIFO)** 的特性。

[width(15,85)]

| 特性           | 描述                                                                                                   |
| :------------- | :----------------------------------------------------------------------------------------------------- |
| **操作自由度** | 前端可进可出，后端可进可出。                                                                           |
| **生活比喻**   | 一个两头通的电影院安检通道。如果有急事，你可以从入口退出去；如果遇到熟人，也可以直接从出口挤进来。     |
| **应用导向**   | 用于需要在两端频繁操作数据的场景，如浏览器的历史记录（同时支持前进后退、且有容量上限）、滑动窗口算法。 |

### 2.2 使用 JS 数组模拟双端队列

```js
class Deque {
  constructor() {
    this.items = []
  }

  // 1. 在双端队列前端添加新元素
  addFront(element) {
    this.items.unshift(element)
  }

  // 2. 在双端队列后端添加新元素 (同普通队列 enqueue)
  addBack(element) {
    this.items.push(element)
  }

  // 3. 从双端队列前端移除第一个元素 (同普通队列 dequeue)
  removeFront() {
    if (this.isEmpty()) return undefined
    return this.items.shift()
  }

  // 4. 从双端队列后端移除最后一个元素 (同栈的 pop)
  removeBack() {
    if (this.isEmpty()) return undefined
    return this.items.pop()
  }

  // 5. 返回前端的第一个元素
  peekFront() {
    if (this.isEmpty()) return undefined
    return this.items[0]
  }

  // 6. 返回后端的最后一个元素
  peekBack() {
    if (this.isEmpty()) return undefined
    return this.items[this.items.length - 1]
  }

  isEmpty() {
    return this.items.length === 0
  }
  size() {
    return this.items.length
  }
}

// === 测试演示 ===
const deque = new Deque()
deque.addBack('John')
deque.addBack('Jack')
deque.addFront('Camila')
// 队列现在是: Camila(头) -> John -> Jack(尾)

console.log(deque.removeBack()) // "Jack" 离开了
console.log(deque.removeFront()) // "Camila" 离开了
```

## 3. 经典应用场景与算法面试题

### 3.1 经典算法面试：回文检查器 (Palindrome Checker)

利用**双端队列**可以非常优雅地判断一个字符串是否是回文（正着读和反着读都一样，如 "**madam**" 或 "**racecar**"）。

**思路**：将字符串的每个字符放入双端队列，然后不断地同时从队头和队尾取出一个字符进行比较。如果全等，就是回文。

```js
function palindromeChecker(str) {
  if (str === undefined || str === null || str.length === 0) return false

  const deque = new Deque()
  const lowerString = str.toLocaleLowerCase().split(' ').join('') // 去空格转小写

  // 全部入队
  for (let i = 0; i < lowerString.length; i++) {
    deque.addBack(lowerString[i])
  }

  let isEqual = true
  // 核心判断：当队列里还有2个或以上元素时，首尾比较
  while (deque.size() > 1 && isEqual) {
    let firstChar = deque.removeFront()
    let lastChar = deque.removeBack()
    if (firstChar !== lastChar) {
      isEqual = false
    }
  }
  return isEqual
}
console.log(palindromeChecker('madam')) // true
```

### 3.2 LeetCode 经典题：滑动窗口最大值 (Sliding Window Maximum)

给定一个数组 `nums` 和滑动窗口的大小 `k`，每次窗口向右滑动一位。要求返回每次滑动窗口里的最大值。（这题的最优解 $O(n)$ 必须使用双端队列/单调队列来实现，保存有可能是最大值的元素的索引）。

**示例**

```text
输入: nums = [1,3,-1,-3,5,3,6,7], 和 k = 3
输出: [3,3,5,5,6,7]
解释:
滑动窗口的位置 最大值

---

[1 3 -1] -3 5 3 6 7 3
1 [3 -1 -3] 5 3 6 7 3
1 3 [-1 -3 5] 3 6 7 5
1 3 -1 [-3 5 3] 6 7 5
1 3 -1 -3 [5 3 6] 7 6
1 3 -1 -3 5 [3 6 7] 7
```

**代码实现**

```js
/**
 * 239. 滑动窗口最大值
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function (nums, k) {
  const result = []
  const deque = [] // 双端队列，存储的是元素的【索引】

  for (let i = 0; i < nums.length; i++) {
    // 1. 剔除过期元素
    // 如果队列头部的索引已经滑出了当前窗口的左边界 (i - k + 1)，则将其移出队列
    // i - k 是窗口左边界的前一个位置
    if (deque.length > 0 && deque[0] <= i - k) {
      deque.shift()
    }

    // 2. 保持单调递减性质
    // 从队尾开始，把所有小于等于当前元素 nums[i] 的元素索引都弹出来
    // 因为当前元素 nums[i] 比它们大，且比它们晚过期，前面的这些小元素绝对不可能成为最大值了
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop()
    }

    // 3. 将当前元素的索引加入队尾
    deque.push(i)

    // 4. 记录结果
    // 当索引 i 达到了 k-1 时，说明第一个完整的窗口已经形成了，开始记录结果
    if (i >= k - 1) {
      // 因为队列是单调递减的，所以队头 deque[0] 对应的元素永远是当前窗口的最大值
      result.push(nums[deque[0]])
    }
  }

  return result
}

// --- 测试用例 ---
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3))
// 输出: [3, 3, 5, 5, 6, 7]

console.log(maxSlidingWindow([1], 1))
// 输出: [1]
```

### 3.3 前端的任务队列：事件循环 (Event Loop)

浏览器与 Node.js 中所有异步任务，最终都会排进队列里按顺序消费，这是队列在前端最广泛、也最容易被忽视的应用。

- **宏任务队列 (MacroTask Queue)**：`setTimeout`、`setInterval`、I/O、UI 渲染等回调排在这里。
- **微任务队列 (MicroTask Queue)**：`Promise.then`、`queueMicrotask`、`MutationObserver` 的回调排在这里。
- 每执行完一个宏任务，引擎会把**当前所有微任务清空**，再去取下一个宏任务。

队列的 FIFO 特性保证了「先注册的回调先执行」；而微任务整体优先于宏任务，则保证了 Promise 的响应总是比 `setTimeout` 更快。

```js
console.log('1')
setTimeout(() => console.log('2')) // 宏任务，最后执行
Promise.resolve().then(() => console.log('3')) // 微任务，先于宏任务
console.log('4')
// 输出顺序：1 → 4 → 3 → 2
```

### 3.4 广度优先搜索 (BFS)：队列最重要的算法应用

图和树的**层序遍历**必须借助队列：每次从队头取出一个节点访问，再把它的邻居依次从队尾入队。这样天然保证了「按层、由近及远」的访问顺序，也正是 BFS 能找到**无权图最短路径**的原因。

```js
function bfs(root) {
  if (!root) return []
  const queue = [root]
  const res = []
  while (queue.length > 0) {
    const node = queue.shift() // 队头出队
    res.push(node.val)
    if (node.left) queue.push(node.left) // 邻居从队尾入队
    if (node.right) queue.push(node.right)
  }
  return res
}
```

> [!TIP] 相关阅读
> BFS 的完整原理与迷宫最短路径实现，见 [广度优先遍历](/dataStructuresAndAlgorithms/algorithms/BFS)；队列在其中的作用与 [深度优先遍历](/dataStructuresAndAlgorithms/algorithms/DFS) 用栈的对比也值得一读。

## 4. 常见问题 (FAQ) 与性能终极优化

### 4.1 使用数组的 `shift()` 和 `unshift()` 模拟队列有什么致命缺陷？

**时间复杂度灾难。**

在 V8 等 JS 引擎中，数组往往是连续分配的内存。当你使用 `shift()` 删除头部元素，或者使用 `unshift()` 在头部插入元素时，引擎必须将数组中剩余的所有元素向前或向后移动一位，以调整它们的索引。

### 4.2 既然数组性能差，如何手写一个高性能的 $O(1)$ 双端队列？

**摒弃数组索引，使用基于对象的“双指针”法(时间复杂度全面 $O(1)$)。**

```js
class FastDeque {
  constructor() {
    this.items = {} // 使用对象
    this.lowestCount = 0 // 队头指针
    this.count = 0 // 队尾指针 (指向下一个要插入的位置)
  }

  addBack(element) {
    this.items[this.count] = element
    this.count++
  }

  addFront(element) {
    if (this.isEmpty()) {
      this.addBack(element)
    } else if (this.lowestCount > 0) {
      // 头部指针大于0，说明前面有空位，指针前移即可
      this.lowestCount--
      this.items[this.lowestCount] = element
    } else {
      // 极其少见的情况：lowestCount 为 0，且要在前面强行插入。
      // 为了不出现负数键（虽然JS对象支持负数键，但为了规范和清晰），
      // 我们不得不将所有现有元素向后挪一位。这会产生一次 O(n) 操作。
      for (let i = this.count; i > 0; i--) {
        this.items[i] = this.items[i - 1]
      }
      this.count++
      this.lowestCount = 0
      this.items[0] = element
    }
  }

  removeFront() {
    if (this.isEmpty()) return undefined
    const result = this.items[this.lowestCount]
    delete this.items[this.lowestCount] // 从内存中删除
    this.lowestCount++ // 头指针后移
    return result
  }

  removeBack() {
    if (this.isEmpty()) return undefined
    this.count-- // 尾指针前移
    const result = this.items[this.count]
    delete this.items[this.count]
    return result
  }

  isEmpty() {
    return this.count - this.lowestCount === 0
  }
  size() {
    return this.count - this.lowestCount
  }
}
```

### 4.3 循环队列 (Circular Queue) 是什么？

循环队列把数组的首尾「接起来」——用**取模运算**让队尾指针绕回数组开头，从而复用已经出队释放的空间。

- **为什么需要它**：普通数组队列 `shift()` 出队是 $O(n)$；循环队列用 `front` / `rear` 两个指针加**固定长度数组**，入队、出队都是 $O(1)$，而且不会像对象版 `FastDeque` 那样让内存无限增长。
- **判空与判满**：常见做法是**牺牲一个空位**来区分二者——队空时 `front === rear`，队满时 `(rear + 1) % capacity === front`。

```js
class CircularQueue {
  constructor(capacity) {
    this.items = new Array(capacity + 1) // 多留一个空位用于判满
    this.front = 0
    this.rear = 0
  }

  enqueue(element) {
    if (this.isFull()) return false
    this.items[this.rear] = element
    this.rear = (this.rear + 1) % this.items.length
    return true
  }

  dequeue() {
    if (this.isEmpty()) return undefined
    const value = this.items[this.front]
    this.front = (this.front + 1) % this.items.length
    return value
  }

  isEmpty() {
    return this.front === this.rear
  }

  isFull() {
    return (this.rear + 1) % this.items.length === this.front
  }
}
```

### 4.4 如何用两个队列实现一个栈？(LeetCode 225)

- **思路**：准备一个主队列 `q1`（存数据）和一个辅助队列 `q2`。**入栈**时先把新元素放进 `q2`，再把 `q1` 里的旧元素全部搬到 `q2`，最后交换两者的引用——这样新元素就始终待在队头，出栈直接 `dequeue` 即可。
- 注意代价：这个方案是**入栈 $O(n)$、出栈 $O(1)$**，和「两个栈实现队列」正好相反。

```js
class MyStack {
  constructor() {
    this.q1 = []
    this.q2 = []
  }

  push(x) {
    this.q2.push(x)
    // 把 q1 的旧元素全部搬到 q2，保证新元素排在队头
    while (this.q1.length > 0) {
      this.q2.push(this.q1.shift())
    }
    const temp = this.q1
    this.q1 = this.q2
    this.q2 = temp
  }

  pop() {
    return this.q1.shift()
  }

  top() {
    return this.q1[0]
  }

  empty() {
    return this.q1.length === 0
  }
}
```

> [!NOTE]
> 上面的写法为了可读性直接用了 `shift()`，实际工程中若数据量大，应换成$O(1)$ 的队列实现。

### 4.5 为什么 BFS 用队列、DFS 用栈？

- **BFS** 要「先访问离起点近的」，所以新发现的节点排到**队尾**，等当前这一层都处理完才轮到它们——先进先出，用**队列**。
- **DFS** 要「一条路走到黑」，所以新发现的节点要**立刻**接着处理——后进先出，用**栈**（递归时就是引擎的调用栈）。

```js
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val
    this.left = left
    this.right = right
  }
}

//         1
//       /   \
//      2     3
//     / \
//    4   5
const tree = new TreeNode(
  1,
  new TreeNode(2, new TreeNode(4), new TreeNode(5)),
  new TreeNode(3),
)

// 队列：新节点排队尾，从队头取 -> 谁先被发现，谁先被访问
function bfs(root) {
  const queue = [root]
  const order = []

  while (queue.length > 0) {
    const node = queue.shift() // 取队头
    order.push(node.val)

    if (node.left) queue.push(node.left)
    if (node.right) queue.push(node.right)
  }
  return order
}

// 栈：新节点压栈顶，也从栈顶取 -> 谁刚被发现，谁马上被访问
function dfs(root) {
  const stack = [root]
  const order = []

  while (stack.length > 0) {
    const node = stack.pop() // 取栈顶
    order.push(node.val)

    if (node.left) stack.push(node.left)
    if (node.right) stack.push(node.right)
  }
  return order
}

console.log(bfs(tree)) // [1, 2, 3, 4, 5]  一层层往外扩散
console.log(dfs(tree)) // [1, 3, 2, 5, 4]  一条路走到黑
```

### 4.6 前端中真实的队列应用有哪些？

[width(24,76)]

| 场景               | 说明                                                    |
| :----------------- | :------------------------------------------------------ |
| 事件循环的任务队列 | 宏任务 / 微任务队列决定异步回调的执行时机。             |
| 请求并发控制       | 一次最多发 N 个请求，其余任务排队等候「出队」执行。     |
| 生产者 - 消费者    | Web Worker 的 `postMessage`、Node.js 的 Stream 缓冲区。 |
| 任务调度与动画     | 帧队列、动作队列，按 FIFO 顺序消费保证不会漏帧。        |
| 广度优先遍历       | 树的层序遍历、DOM 广度遍历。                            |
