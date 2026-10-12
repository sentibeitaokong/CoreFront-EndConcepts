---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 双指针技巧 (Two Pointers)

## 1. 双指针核心概览

双指针并不是一种具体的“**算法**”（如排序或 DFS），而是一种**编程技巧**。它的核心思想是：在遍历数组、字符串或链表时，不再使用单一的变量 `i` 去循环，而是同时维护**两个指向不同位置的索引（指针）**，通过它们之间的协同移动来完成特定的搜索、比较或原地修改操作。

### 1.1 双指针的四大黄金应用模型

掌握双指针，本质上是掌握它在不同场景下的移动轨迹。绝大多数双指针问题都可以归类为以下四种模型：

[width(15,26,35,24)]

| 模型分类                | 指针初始位置                     | 移动轨迹与特征                                             | 典型应用场景                                        |
| :---------------------- | :------------------------------- | :--------------------------------------------------------- | :-------------------------------------------------- |
| **对撞指针 (左右指针)** | 一左一右 (`left=0, right=len-1`) | 两人相向而行，直到相遇 (`left >= right`) 停止。            | 反转字符串、回文串判定、**有序数组**求和/二分查找。 |
| **快慢指针**            | 同一起点 (`fast=0, slow=0`)      | 两人同向而行，快指针探路，慢指针在后方记录或修改数据。     | 数组原地去重、移除元素、链表找中点/判断环。         |
| **滑动窗口**            | 同一起点 (`left=0, right=0`)     | 同向而行。右指针主动扩张窗口，左指针在满足条件时收缩窗口。 | 求满足特定条件的连续子数组/子串（最长/最短）。      |
| **双数组指针**          | 分别在两个数组的起点             | 根据比较结果，各自独立移动。                               | 合并两个有序数组、求两个数组的交集。                |

### 1.2 四大模型的适用条件与移动规则

上表是速查，下面把四个模型“**什么时候用、指针怎么动、为什么快**”讲透：

1. **对撞指针（左右指针）**
   - **适用条件：** 数组**有序**或具有单调性，且答案依赖“**首尾两个位置**”的组合、比较。
   - **移动规则：** `left` 从 `0` 向右、`right` 从 `len - 1` 向左，相向而行，循环条件 `left < right`。
   - **为什么快：** 每一步都能根据当前结果排除掉一整批候选（和偏小就 `left++`，偏大就 `right--`）。
   - **典型题：** 两数之和 II、盛最多水的容器、反转字符串、验证回文串。

2. **快慢指针（同向指针）**
   - **适用条件：** 需要“**原地修改**”数组，或在**链表**上找中点、判环。
   - **移动规则：** `slow` 与 `fast` 同向；`fast` 负责探路，`slow` 只在满足条件时才前进。
   - **为什么快：** 一次遍历完成“**筛选 + 写回**”，省去额外数组的空间。
   - **典型题：** 移除元素、移动零、删除有序数组中的重复项、链表中点、环形链表。

3. **滑动窗口**
   - **适用条件：** 求“**连续子数组 / 子串**”的极值或计数。
   - **移动规则：** `right` 主动扩张吃进元素，窗口违规时 `left` 收缩吐出元素。
   - **典型题：** 无重复字符的最长子串、长度最小的子数组、最小覆盖子串（详见 [滑动窗口](/dataStructuresAndAlgorithms/algorithms/slideWindow)）。

4. **分离双指针（双数组指针）**
   - **适用条件：** 同时在**两个**数组 / 链表上操作，或把同一个数组拆成两段来看。
   - **移动规则：** 两个指针分处不同序列，各自根据比较结果独立移动，互不干扰。
   - **典型题：** 合并两个有序数组、判断子序列、求两个数组的交集。

## 2. 经典双指针模型与 JavaScript 实现

### 2.1 对撞指针：两数之和 II (有序数组)

**题目描述：** 给你一个**下标从 1 开始**的整数数组 `numbers`，该数组已按**非递减顺序排列**。请你从数组中找出满足相加之和等于目标数 `target` 的两个数。
（如果是无序数组，应该用哈希表；但既然是有序的，双指针是空间复杂度 $O(1)$ 的最优解）。

**核心逻辑：** 既然数组是有序的，左指针指向最小的数，右指针指向最大的数。
如果两数之和大了，说明右边的数太大了，右指针左移（变小）；如果和太小，左指针右移（变大）。

#### JavaScript 代码实现

```js
/**
 * 两数之和 II - 对撞指针
 * @param {number[]} numbers (已排序)
 * @param {number} target
 * @return {number[]}
 */
function twoSum(numbers, target) {
  let left = 0
  let right = numbers.length - 1

  while (left < right) {
    // 不能等于，因为要找的是两个不同的数
    const sum = numbers[left] + numbers[right]

    if (sum === target) {
      // 题目要求下标从 1 开始，所以加 1
      return [left + 1, right + 1]
    } else if (sum < target) {
      left++ // 和太小，左边的指针往右走（找更大的数）
    } else {
      right-- // 和太大，右边的指针往左走（找更小的数）
    }
  }
  return []
}
```

### 2.2 快慢指针：原地移除元素 (Remove Element)

**题目描述：** 给你一个数组 `nums` 和一个值 `val`，你需要 **原地** 移除所有数值等于 `val` 的元素，并返回移除后数组的新长度。**不能使用额外的数组空间**。

**核心逻辑：** `fast` 指针负责在前面“**探路**”扫描整个数组，`slow` 指针负责在后面“**驻扎**”，只记录那些**不等于** `val` 的有效元素。

#### JavaScript 代码实现

```js
/**
 * 原地移除元素 - 快慢指针
 * @param {number[]} nums
 * @param {number} val
 * @return {number} 新数组的长度
 */
function removeElement(nums, val) {
  let slow = 0 // 慢指针：指向下一个即将被合法元素覆盖的位置

  // 快指针：负责遍历所有元素
  for (let fast = 0; fast < nums.length; fast++) {
    // 只有当快指针找到“有效元素”时，才把它交接给慢指针
    if (nums[fast] !== val) {
      nums[slow] = nums[fast] // 覆盖
      slow++ // 慢指针前进一步
    }
    // 如果 nums[fast] === val，快指针直接跳过，慢指针原地待命
  }

  // 最终 slow 的值恰好就是有效元素的个数
  return slow
}
```

### 2.3 对撞指针进阶：三数之和（排序 + 双指针 + 去重）

**题目描述：** 给你一个整数数组 `nums`，判断是否存在三元组 `[nums[i], nums[j], nums[k]]` 满足 `i != j != k` 且和为 0。要求返回所有不重复的三元组。

**核心逻辑：** 先排序，然后固定第一个数 `nums[i]`，剩下的问题就退化成“**在有序数组里找两数之和等于 `-nums[i]`**”，正好用对撞指针。难点在于**三处去重**。

```js
/**
 * 三数之和
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
  const result = []
  nums.sort((a, b) => a - b) // 排序：既让对撞指针可用，也方便去重

  for (let i = 0; i < nums.length - 2; i++) {
    // 剪枝：最小的数已经大于 0，后面不可能再凑出和为 0
    if (nums[i] > 0) break
    // 去重一：外层固定的第一个数，相同的只固定一次
    if (i > 0 && nums[i] === nums[i - 1]) continue

    let left = i + 1
    let right = nums.length - 1

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right]

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]])
        // 去重二、三：找到解后，左右指针都要跳过相同的数
        while (left < right && nums[left] === nums[left + 1]) left++
        while (left < right && nums[right] === nums[right - 1]) right--
        left++
        right--
      } else if (sum < 0) {
        left++ // 和太小，左指针右移（找更大的数）
      } else {
        right-- // 和太大，右指针左移（找更小的数）
      }
    }
  }

  return result
}
```

### 2.4 对撞指针（面积型）：盛最多水的容器

**题目描述：** 给定数组 `height`，下标 `i`、`j` 之间的容器能盛的水量为 `min(height[i], height[j]) * (j - i)`，求最大值。

**核心逻辑：** 面积由“**两板间距**”和“**较矮的板**”共同决定。既然往内移动一定会让间距变小，那么只有**移动较矮的那一侧**才有可能让面积变大（移动高的一侧，短板没变、间距还小了，面积只会更小）。

```js
/**
 * 盛最多水的容器
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
  let left = 0
  let right = height.length - 1
  let maxWater = 0

  while (left < right) {
    // 面积 = 两板间距 × 较矮的那块板
    const h = Math.min(height[left], height[right])
    maxWater = Math.max(maxWater, h * (right - left))

    // 关键：向内移动较矮的一侧
    if (height[left] < height[right]) {
      left++
    } else {
      right--
    }
  }

  return maxWater
}
```

### 2.5 快慢指针：数组去重与链表判圈

#### 删除有序数组中的重复项

**核心逻辑：** `slow` 指向当前“**已确定不重复**”的最后一个位置，`fast` 向后扫描。只有 `fast` 遇到一个**新的不同值**时，才把它写到 `slow` 的下一位。

```js
/**
 * 删除有序数组中的重复项
 * @param {number[]} nums
 * @return {number} 去重后的新长度
 */
function removeDuplicates(nums) {
  if (nums.length === 0) return 0

  let slow = 0 // slow 指向当前最后一个「已确定不重复」的位置
  for (let fast = 1; fast < nums.length; fast++) {
    // 只有快指针发现了新值，才写到慢指针的下一位
    if (nums[fast] !== nums[slow]) {
      slow++
      nums[slow] = nums[fast]
    }
  }
  return slow + 1 // 新长度 = 下标 + 1
}
```

#### 环形链表：Floyd 判圈（龟兔赛跑）

**核心逻辑：** `fast` 每次走两步、`slow` 每次走一步。若有环，`fast` 会在环内绕圈并最终追上 `slow`。找到相遇点后，把其中一个指针放回 `head`，两个指针都改成每次走一步，再次相遇的位置就是**环的入口**。

```js
// 链表节点定义（供参考）
// function ListNode(val) { this.val = val; this.next = null }

/**
 * 环形链表：判断是否有环
 * @param {ListNode} head
 * @return {boolean}
 */
function hasCycle(head) {
  let slow = head
  let fast = head

  while (fast !== null && fast.next !== null) {
    slow = slow.next // 龟走一步
    fast = fast.next.next // 兔走两步

    if (slow === fast) return true // 相遇即有环
  }
  return false
}

/**
 * 环形链表 II：返回入环的第一个节点
 * @param {ListNode} head
 * @return {ListNode}
 */
function detectCycle(head) {
  let slow = head
  let fast = head

  // 第一阶段：快慢指针相遇
  while (fast !== null && fast.next !== null) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) break
  }

  // 无环，退出循环时 fast 走到了尽头
  if (fast === null || fast.next === null) return null

  // 第二阶段：一个指针回到头，两指针同速前进，相遇点即环入口
  let ptr = head
  while (ptr !== slow) {
    ptr = ptr.next
    slow = slow.next
  }
  return ptr
}
```

### 2.6 分离双指针：合并有序数组与判断子序列

这两个指针分别待在两个序列上，各自独立移动，互不干扰，是最典型的“**分离双指针**”。

```js
/**
 * 合并两个有序数组（原地合并进 nums1）
 * @param {number[]} nums1 长度足够，前 m 个是有效元素
 * @param {number} m
 * @param {number[]} nums2
 * @param {number} n
 */
function merge(nums1, m, nums2, n) {
  let i = m - 1 // nums1 有效元素的末尾
  let j = n - 1 // nums2 的末尾
  let k = m + n - 1 // 写入位置：从后往前填，避免覆盖还没处理的元素

  while (j >= 0) {
    // nums1 还有元素且更大就取 nums1，否则取 nums2
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--]
    } else {
      nums1[k--] = nums2[j--]
    }
  }
}

/**
 * 判断子序列：s 是否为 t 的子序列
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isSubsequence(s, t) {
  let i = 0 // 指向 s
  let j = 0 // 指向 t

  while (i < s.length && j < t.length) {
    if (s[i] === t[j]) i++ // s 的字符匹配上了，才推进 i
    j++ // t 的指针始终前进
  }

  // s 全部匹配完，说明它是 t 的子序列
  return i === s.length
}
```

## 3. 常见问题深度剖析 (FAQ)

### 3.1 怎么判断一道题到底是用“**对撞指针**”还是“**同向指针**”？

- **对撞（左右）指针**：题目涉及**有序数组**（两数之和）、**反转 / 回文**（从两头向中间靠拢）、**面积 / 盛水**（如接雨水）。
- **同向（快慢 / 滑动窗口）指针**：题目要求**原地修改 / 去重**，或求**连续的子数组 / 子串**。

### 3.2 双指针的时间复杂度真的是 $O(n)$ 吗？

通常是的，但要小心隐性循环。对撞指针左右合计走一遍数组，是 $O(n)$；滑动窗口即使 `for` 里嵌 `while`，因为 `right`、`left` **都只前进、不后退**，每个元素最多被 `right` 访问一次、被 `left` 踢出一次，总操作数 ≤ $2n$，去掉常数后依然是严格的 $O(n)$。

### 3.3 JavaScript 中字符串是不可变的 (Immutable)，怎么用双指针进行“**原地反转**”？

JS 字符串的字符是只读的，无法像 C++ / Java 那样直接 `str[left] = str[right]`。标准做法是先 `let arr = s.split('');`，在数组上用双指针完成交换，再 `return arr.join('');`——这消耗 $O(n)$ 空间，但在 JS 中是唯一标准的解法。

### 3.4 双指针和链表结合时要注意什么？

单向链表**不能从后往前遍历**，因此不可能使用对撞指针，链表双指针**永远是快慢指针**。经典应用是找中点（快指针走两步、慢指针走一步，快到底时慢恰在中点）和判环（龟兔赛跑，快慢指针相遇即有环）。

### 3.5 快慢指针判环的原理是什么（Floyd 判圈 + 找环入口）？

- **判环**：`slow` 每步走 1、`fast` 每步走 2。无环时 `fast` 会先到达 `null`；有环时 `fast` 进入环内绕圈，与 `slow` 的距离每轮缩小 1，必然追上 `slow`。
- **找环入口**：相遇后把一个指针放回 `head`，两指针都改成每步走 1，再次相遇的位置就是入环的第一个节点。

### 3.6 三数之和如何去重？

三处缺一不可，前提都是**先排序**：

- **外层 `i`**：`if (i > 0 && nums[i] === nums[i-1]) continue`，避免固定的第一个数重复。
- **内层 `left` / `right`**：找到解后，若 `nums[left] === nums[left+1]` 就继续 `left++`；若 `nums[right] === nums[right-1]` 就 `right--`。

### 3.7 双指针和滑动窗口是什么关系？

**滑动窗口是双指针的一个特例**：它属于“**同向双指针**”，只不过两指针之间夹着的区间有明确语义（一个窗口），且通常要求窗口内数据**连续**。反过来，快慢指针虽然也是同向的，但两者往往没有“**共同维护的区间**”这层含义（如链表判环），所以不叫滑动窗口。

### 3.8 什么时候应该先排序？

出现这些信号时通常要先排序：

- 题目要求“**有序**”或允许先排序（两数之和 II、三数之和）。
- 需要用“**相邻比较**”的思路去重。
- 对撞指针必须依赖**单调性**才能决定该动哪一侧。

但排序会改变原始顺序，若题目要求返回**原始下标**而非数值，就不能排序，应改用哈希表。
