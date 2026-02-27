# 队列 (Queue) 与 双端队列 (Deque)

## 1. 普通队列 (Queue)

### 1.1 核心概念
普通队列严格遵循 **FIFO (First In, First Out，先进先出)** 原则。
就像超市结账排队，**只能从队尾（Rear）加入，从队头（Front）离开**。

![Logo](/queue.png)

### 1.2 使用 JS 数组模拟普通队列
利用数组的 `push`（尾部添加）和 `shift`（头部移除）可以轻松模拟。

```js
class Queue {
  constructor() { this.items = []; }
  
  enqueue(element) { this.items.push(element); } // 入队
  dequeue() { return this.items.shift(); }       // 出队 (注意：性能为 O(n))
  
  front() { return this.items[0]; }              // 查看队头
  isEmpty() { return this.items.length === 0; }
  size() { return this.items.length; }
}
```

## 2. 双端队列 (Deque - Double-Ended Queue)

### 2.1  核心概念
**双端队列 (Deque，发音通常为 "deck")** 是一种特殊的队列。它打破了普通队列的严格限制，允许你**在队列的两端（队头和队尾）都能进行插入和删除操作**。

可以说，双端队列同时拥有了**栈 (LIFO)** 和 **普通队列 (FIFO)** 的特性。

| 特性 | 描述 |
| :--- | :--- |
| **操作自由度** | 前端可进可出，后端可进可出。 |
| **生活比喻** | 一个两头通的电影院安检通道。如果有急事，你可以从入口退出去；如果遇到熟人，也可以直接从出口挤进来。 |
| **应用导向** | 用于需要在两端频繁操作数据的场景，如浏览器的历史记录（同时支持前进后退、且有容量上限）、滑动窗口算法。 |

### 2.2 使用 JS 数组模拟双端队列 🛠️

我们需要利用数组的四个原生方法来实现双端的操作：
*   队尾进：`push()`
*   队尾出：`pop()`
*   队头进：`unshift()`
*   队头出：`shift()`

```js
class Deque {
  constructor() {
    this.items = [];
  }

  // 1. 在双端队列前端添加新元素
  addFront(element) {
    this.items.unshift(element);
  }

  // 2. 在双端队列后端添加新元素 (同普通队列 enqueue)
  addBack(element) {
    this.items.push(element);
  }

  // 3. 从双端队列前端移除第一个元素 (同普通队列 dequeue)
  removeFront() {
    if (this.isEmpty()) return undefined;
    return this.items.shift();
  }

  // 4. 从双端队列后端移除最后一个元素 (同栈的 pop)
  removeBack() {
    if (this.isEmpty()) return undefined;
    return this.items.pop();
  }

  // 5. 返回前端的第一个元素
  peekFront() {
    if (this.isEmpty()) return undefined;
    return this.items[0];
  }

  // 6. 返回后端的最后一个元素
  peekBack() {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }

  isEmpty() { return this.items.length === 0; }
  size() { return this.items.length; }
}

// === 测试演示 ===
const deque = new Deque();
deque.addBack('John');
deque.addBack('Jack');
deque.addFront('Camila'); 
// 队列现在是: Camila(头) -> John -> Jack(尾)

console.log(deque.removeBack());  // "Jack" 离开了
console.log(deque.removeFront()); // "Camila" 离开了
```

## 3. 经典应用场景与算法面试题 

### 3.1 经典算法面试：回文检查器 (Palindrome Checker)
利用**双端队列**可以非常优雅地判断一个字符串是否是回文（正着读和反着读都一样，如 "madam" 或 "racecar"）。

**思路**：将字符串的每个字符放入双端队列，然后不断地同时从队头和队尾取出一个字符进行比较。如果全等，就是回文。
```js
function palindromeChecker(str) {
  if (str === undefined || str === null || str.length === 0) return false;
  
  const deque = new Deque();
  const lowerString = str.toLocaleLowerCase().split(' ').join(''); // 去空格转小写
  
  // 全部入队
  for (let i = 0; i < lowerString.length; i++) {
    deque.addBack(lowerString[i]);
  }
  
  let isEqual = true;
  // 核心判断：当队列里还有2个或以上元素时，首尾比较
  while (deque.size() > 1 && isEqual) {
    let firstChar = deque.removeFront();
    let lastChar = deque.removeBack();
    if (firstChar !== lastChar) {
      isEqual = false;
    }
  }
  return isEqual;
}
console.log(palindromeChecker("madam")); // true
```

### 3.2 LeetCode 经典题：滑动窗口最大值 (Sliding Window Maximum)
给定一个数组 `nums` 和滑动窗口的大小 `k`，每次窗口向右滑动一位。要求返回每次滑动窗口里的最大值。（这题的最优解 $O(n)$ 必须使用双端队列/单调队列来实现，保存有可能是最大值的元素的索引）。

**示例**

```text
输入: nums = [1,3,-1,-3,5,3,6,7], 和 k = 3
输出: [3,3,5,5,6,7]
解释: 
  滑动窗口的位置                最大值
---------------               -----
[1  3  -1] -3  5  3  6  7       3
 1 [3  -1  -3] 5  3  6  7       3
 1  3 [-1  -3  5] 3  6  7       5
 1  3  -1 [-3  5  3] 6  7       5
 1  3  -1  -3 [5  3  6] 7       6
 1  3  -1  -3  5 [3  6  7]      7

```

**代码实现**

```js
/**
 * 239. 滑动窗口最大值
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
var maxSlidingWindow = function(nums, k) {
  const result = [];
  const deque = []; // 双端队列，存储的是元素的【索引】

  for (let i = 0; i < nums.length; i++) {
    // 1. 剔除过期元素
    // 如果队列头部的索引已经滑出了当前窗口的左边界 (i - k + 1)，则将其移出队列
    // i - k 是窗口左边界的前一个位置
    if (deque.length > 0 && deque[0] <= i - k) {
      deque.shift();
    }

    // 2. 保持单调递减性质
    // 从队尾开始，把所有小于等于当前元素 nums[i] 的元素索引都弹出来
    // 因为当前元素 nums[i] 比它们大，且比它们晚过期，前面的这些小元素绝对不可能成为最大值了
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }

    // 3. 将当前元素的索引加入队尾
    deque.push(i);

    // 4. 记录结果
    // 当索引 i 达到了 k-1 时，说明第一个完整的窗口已经形成了，开始记录结果
    if (i >= k - 1) {
      // 因为队列是单调递减的，所以队头 deque[0] 对应的元素永远是当前窗口的最大值
      result.push(nums[deque[0]]);
    }
  }

  return result;
};

// --- 测试用例 ---
console.log(maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3)); 
// 输出: [3, 3, 5, 5, 6, 7]

console.log(maxSlidingWindow([1], 1)); 
// 输出: [1]

```

## 4. 常见问题 (FAQ) 与性能终极优化

### 4.1 使用数组的 `shift()` 和 `unshift()` 模拟队列有什么致命缺陷？
*   **答：时间复杂度灾难。**
    在 V8 等 JS 引擎中，数组往往是连续分配的内存。当你使用 `shift()` 删除头部元素，或者使用 `unshift()` 在头部插入元素时，引擎必须将数组中剩余的所有元素向前或向后移动一位，以调整它们的索引。
    *   这意味着 `addFront` 和 `removeFront` 的时间复杂度是 **$O(n)$**。如果数据量达到百万级，会造成严重的线程卡顿。

### 4.2 既然数组性能差，如何手写一个高性能的 $O(1)$ 双端队列？
*   **答：摒弃数组索引，使用基于对象的“双指针”法。**
    我们用一个普通的 JavaScript `{}` 对象来存储数据，并手动维护头尾指针。

**🔥 高性能双端队列实现 (时间复杂度全面 $O(1)$)：**
```js
class FastDeque {
  constructor() {
    this.items = {}; // 使用对象
    this.lowestCount = 0; // 队头指针
    this.count = 0;       // 队尾指针 (指向下一个要插入的位置)
  }

  addBack(element) {
    this.items[this.count] = element;
    this.count++;
  }

  addFront(element) {
    if (this.isEmpty()) {
      this.addBack(element);
    } else if (this.lowestCount > 0) {
      // 头部指针大于0，说明前面有空位，指针前移即可
      this.lowestCount--;
      this.items[this.lowestCount] = element;
    } else {
      // 极其少见的情况：lowestCount 为 0，且要在前面强行插入。
      // 为了不出现负数键（虽然JS对象支持负数键，但为了规范和清晰），
      // 我们不得不将所有现有元素向后挪一位。这会产生一次 O(n) 操作。
      for (let i = this.count; i > 0; i--) {
        this.items[i] = this.items[i - 1];
      }
      this.count++;
      this.lowestCount = 0;
      this.items[0] = element;
    }
  }

  removeFront() {
    if (this.isEmpty()) return undefined;
    const result = this.items[this.lowestCount];
    delete this.items[this.lowestCount]; // 从内存中删除
    this.lowestCount++; // 头指针后移
    return result;
  }

  removeBack() {
    if (this.isEmpty()) return undefined;
    this.count--; // 尾指针前移
    const result = this.items[this.count];
    delete this.items[this.count];
    return result;
  }

  isEmpty() { return this.count - this.lowestCount === 0; }
  size() { return this.count - this.lowestCount; }
}
```
*注：在对象版的 `addFront` 中，如果 `lowestCount` 为 0 时插入，仍会触发一次数据后移。如果在极端频繁地双头进出的场景，通常会引入双向链表 (Doubly Linked List) 来实现绝对的 $O(1)$。*


