---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 滑动窗口算法 (Sliding Window)

## 1. 滑动窗口核心概览

滑动窗口本质上是**同向双指针**的一种极其经典的高级应用。它在数组或字符串上维持一个“**窗口**”（由左指针 `left` 和右指针 `right` 划定边界）。
在这个过程中，窗口会像毛毛虫一样向右滑动：**右指针主动向右扩张（吃进元素），左指针在特定条件下向右收缩（吐出元素）**，在此过程中寻找满足条件的极值或进行计数。

### 1.1 适用场景的“**黄金暗号**”

当你读题时，如果发现题目中同时包含以下两个特征，**99% 的概率需要使用滑动窗口**：

1.  **数据结构：** 数组、字符串。
2.  **核心词汇：** “**连续**”（连续子数组、子串）、“**最长 / 最短 / 大小为 K**”、“**最大 / 最小和**”。

### 1.2 滑动窗口万能代码模板 (必背)

不管是求最长、最短还是固定长度，都可以套用下面这个模板。你只需要思考四个问题：进窗口更新什么？什么时候出窗口？出窗口更新什么？什么时候记录答案？

```js
function slidingWindowTemplate(nums) {
    let left = 0;
    let result = ...; // 根据求最大还是最小，初始化为 0 或 Infinity
    let windowState = ...; // 维护窗口内的状态：如元素和(sum)、哈希表频率(Map)等

    // 1. 右指针主动扩张
    for (let right = 0; right < nums.length; right++) {
        // 【入】：将 nums[right] 的数据加入 windowState
        updateStateOnEnter(nums[right]);

        // 2. 判断窗口状态是否触发了“违规”或“达到固定长度”
        while (needShrink(windowState)) {
            // 🚨 【求最短】：如果你要求符合条件的最短连续子数组，通常在这里更新 result
            // result = Math.min(result, right - left + 1);

            // 【出】：将 nums[left] 的数据移出 windowState
            updateStateOnLeave(nums[left]);

            // 左指针收缩
            left++;
        }

        // 🚨 【求最长】：如果你要求符合条件的最长连续子数组，通常在这里更新 result
        // 因为此时 while 循环结束，窗口状态绝对是“合法”的
        // result = Math.max(result, right - left + 1);
    }

    return result;
}
```

### 1.3 扩大 / 收缩 / 记录答案的判定口诀

滑动窗口的坑，几乎都能用下面三句话判断清楚：

[width(13,54,33)]

| 动作         | 触发时机                                                             | 落到代码里                                   |
| :----------- | :------------------------------------------------------------------- | :------------------------------------------- |
| **扩大窗口** | `right` 每前进一步，无条件把 `nums[right]` 吃进来                    | `for (right...)` 循环体开头的“**入**”操作    |
| **收缩窗口** | 窗口**违规**（不再满足条件）时，`left` 才右移                        | `while (needShrink()) { ...; left++ }`       |
| **记录答案** | 求**最短**：进入 `while` 后立刻记录；求**最长**：出了 `while` 再记录 | `Math.min(...)` / `Math.max(...)` 摆放的位置 |

- **“违规”怎么定义？** 把它翻译成一句可判断的命题即可，例如“**窗口内 0 的个数 > k**”“**窗口内出现了重复字符**”“**窗口和 ≥ target**”。`while` 的条件就是这句话。
- **固定窗口通常没有 `while`**：它“**违规**”的时机是恒定的（长度超过 `k`），用 `if` 判断一次、移出一个元素即可。

### 1.4 窗口内计数：定长数组与 Map 的维护方式

窗口的 `windowState` 最常见的形式就是**计数**。JS 里通常有两种选择：

[width(25,33,23,19)]

| 方案                                 | 适用场景                                              | 入窗口                              | 出窗口                    |
| :----------------------------------- | :---------------------------------------------------- | :---------------------------------- | :------------------------ |
| **定长数组** `new Array(26).fill(0)` | 字符集固定且很小，如只含小写字母                      | `count[c.charCodeAt(0) - 97]++`     | 对应位置 `--`             |
| **`Map`**                            | 字符集未知 / 很大，或键不是数字（任意 Unicode、单词） | `map.set(k, (map.get(k) ?? 0) + 1)` | 减到 0 时 `map.delete(k)` |

> [!TIP] 数组 vs Map 怎么选？
> 能用数组就优先用数组：下标寻址比哈希快，也免去 `delete` 的开销。只有当字符集不可预知、或键的空间太大（如 Unicode 有上万个码点）时，才改用 `Map`。用 `Map` 判断“**窗口内是否还有某个字符**”时，记得**计数减到 0 就把键删掉**，否则 `map.size` 会把不该算的键也算进去。

## 2. 经典滑动窗口场景与 JS 实现

根据窗口大小是否变化，滑动窗口分为“**固定窗口**”和“**可变窗口**”两类。

### 2.1 固定窗口：大小为 K 的子数组最大平均数

**题目描述：** 给你一个由 `n` 个整数组成的数组 `nums` 和一个整数 `k`。请找出所有长度为 `k` 的连续子数组，并计算得到其最大平均数。

**核心逻辑：** 窗口的长度永远固定为 `k`。当 `right - left + 1 > k` 时，左指针就必须移动。

#### JavaScript 代码实现

```js
/**
 * 固定大小滑动窗口
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function findMaxAverage(nums, k) {
  let maxSum = -Infinity // 初始化为极小值，因为数组里可能有负数
  let currentSum = 0
  let left = 0

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right] // 【入】窗口

    // 当窗口长度达到 k 时，开始记录结果并准备滑动
    if (right - left + 1 === k) {
      maxSum = Math.max(maxSum, currentSum) // 记录当前窗口的最大和

      currentSum -= nums[left] // 【出】窗口：减去最左侧被抛弃的元素
      left++ // 左指针前进一步，保持窗口大小为 k - 1，准备下一次循环变成 k
    }
  }

  return maxSum / k // 返回最大平均数
}
```

### 2.2 可变窗口 (求最短)：长度最小的子数组

**题目描述：** 给定一个含有 `n` 个正整数的数组和一个正整数 `target`。找出该数组中满足其和 `≥ target` 的长度最小的连续子数组，并返回其长度。如果不存在符合条件的子数组，返回 0。

**核心逻辑：** 右指针不断累加元素。一旦和 `≥ target`，说明满足条件了。为了找“**最短**”，我们尝试不断把左指针往右挪（缩小窗口），看是否还能满足条件。

#### JavaScript 代码实现

```js
/**
 * 可变窗口 - 求最短
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
function minSubArrayLen(target, nums) {
  let minLen = Infinity // 求最小，初始设为无穷大
  let currentSum = 0
  let left = 0

  for (let right = 0; right < nums.length; right++) {
    currentSum += nums[right] // 【入】窗口

    // 一旦满足条件，触发收缩机制
    while (currentSum >= target) {
      // 🚨 核心：求最短，所以在满足条件的 while 循环【内部】更新答案
      minLen = Math.min(minLen, right - left + 1)

      currentSum -= nums[left] // 【出】窗口：减去左侧元素
      left++ // 缩小窗口
    }
  }

  return minLen === Infinity ? 0 : minLen
}
```

### 2.3 可变窗口 (求最长)：最大连续 1 的个数 III

**题目描述：** 给定一个二进制数组 `nums` 和一个整数 `k`，如果可以翻转最多 `k` 个 `0`，则返回数组中连续 `1` 的最大个数。
例如：`nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2`。最大连续1为 6（翻转最后面两个1前面的两个0）。

**核心逻辑：** 题目可以翻译为：**寻找一个最长的连续子数组，要求这个子数组里面 `0` 的个数不能超过 `k` 个。**
只要窗口里的 0 不超过 k 个，右指针就一直扩张；如果 0 超标了，左指针就开始移动，直到把一个 0 吐出去为止。

#### JavaScript 代码实现

```js
/**
 * 可变窗口 - 求最长
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function longestOnes(nums, k) {
  let maxLen = 0
  let left = 0
  let zeroCount = 0 // 记录窗口内 0 的个数

  for (let right = 0; right < nums.length; right++) {
    // 【入】窗口：如果是 0，计数器增加
    if (nums[right] === 0) {
      zeroCount++
    }

    // 违规条件：0 的个数超标了，必须收缩窗口
    while (zeroCount > k) {
      // 【出】窗口：如果即将被踢出的是 0，计数器减少
      if (nums[left] === 0) {
        zeroCount--
      }
      left++
    }

    // 🚨 核心：求最长，所以在确保窗口合法（while 循环之后）的【外部】更新答案
    maxLen = Math.max(maxLen, right - left + 1)
  }

  return maxLen
}
```

### 2.4 可变窗口（求最长）：无重复字符的最长子串

**题目描述：** 给定一个字符串 `s`，请找出其中不含重复字符的**最长子串**的长度。

**核心逻辑：** 用 `Set` 记录窗口内出现过的字符。`right` 每要走一步，先检查这个字符是否已经在窗口里；如果在，就不断移动 `left` 把它移出去，直到窗口重新合法，再加入 `right`。因为求最长，答案在 `while` **外**记录。

```js
/**
 * 无重复字符的最长子串
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  const window = new Set() // 记录窗口内出现的字符
  let left = 0
  let maxLen = 0

  for (let right = 0; right < s.length; right++) {
    // 违规：右指针要加入的字符已经在窗口里，收缩直到它被移出去
    while (window.has(s[right])) {
      window.delete(s[left])
      left++
    }

    window.add(s[right]) // 【入】窗口
    // 出了 while，窗口一定合法，此时才评估最长长度
    maxLen = Math.max(maxLen, right - left + 1)
  }

  return maxLen
}
```

### 2.5 固定窗口 + 计数：找到字符串中所有字母异位词

**题目描述：** 给定两个字符串 `s` 和 `p`，找到 `s` 中所有 `p` 的**字母异位词**的子串起始索引。字母异位词指字母相同但排列不同的字符串（如 `ab` 与 `ba`）。

**核心逻辑：** 异位词长度必然等于 `p.length`，所以这是一个**固定窗口**。用一个定长数组记录 `p` 的字符需求，另一个记录当前窗口的字符计数，两者相等时该起始位置就是一个答案。

```js
/**
 * 找到字符串中所有字母异位词
 * @param {string} s
 * @param {string} p
 * @return {number[]}
 */
function findAnagrams(s, p) {
  const result = []
  if (s.length < p.length) return result

  const base = 'a'.charCodeAt(0)
  const need = new Array(26).fill(0)
  const window = new Array(26).fill(0)

  // 统计 p 的字符需求
  for (const ch of p) need[ch.charCodeAt(0) - base]++

  for (let right = 0; right < s.length; right++) {
    window[s[right].charCodeAt(0) - base]++ // 【入】窗口

    // 固定窗口：长度超过 p 就移出最左侧字符
    if (right >= p.length) {
      window[s[right - p.length].charCodeAt(0) - base]-- // 【出】窗口
    }

    // 窗口内计数与 p 完全一致，说明是一个异位词
    if (arraysEqual(window, need)) {
      result.push(right - p.length + 1)
    }
  }

  return result
}

function arraysEqual(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
```

> [!TIP] 只用一个 `diff` 变量更省事
> 上面每轮都比对 26 个位置，是 $O(26n)$。想再快一点，可以维护一个 `diff` 变量记录“**两个计数数组有多少个位置不同**”，入/出窗口时只更新变化的那一个下标，把每次比较降到 $O(1)$。

### 2.6 可变窗口（求最短）：最小覆盖子串

**题目描述：** 给你一个字符串 `s` 和一个字符串 `t`，返回 `s` 中涵盖 `t` 所有字符的**最短子串**。如果不存在符合条件的子串，返回空字符串。

**核心逻辑：** 这是可变窗口求最短的集大成者。用 `need` 记录 `t` 每个字符的需求量，用 `window` 记录窗口内的计数，用 `valid` 记录“**已经凑够数量的字符种类数**”。当 `valid === need.size` 时窗口覆盖了 `t`，此时不断收缩 `left` 找更短解。

```js
/**
 * 最小覆盖子串
 * @param {string} s
 * @param {string} t
 * @return {string}
 */
function minWindow(s, t) {
  const need = new Map() // t 中每个字符需要出现的次数
  for (const ch of t) {
    need.set(ch, (need.get(ch) ?? 0) + 1)
  }

  const window = new Map() // 当前窗口内各字符的计数
  let valid = 0 // 已经凑够数量要求的字符种类数
  let left = 0
  let start = 0 // 最优解的起始下标
  let minLen = Infinity

  for (let right = 0; right < s.length; right++) {
    const c = s[right]
    // 【入】窗口
    if (need.has(c)) {
      window.set(c, (window.get(c) ?? 0) + 1)
      if (window.get(c) === need.get(c)) valid++ // 这种字符刚好凑够
    }

    // 窗口已覆盖 t，尝试收缩，争取更短的合法窗口
    while (valid === need.size) {
      // 求最短：在 while 内部记录
      if (right - left + 1 < minLen) {
        minLen = right - left + 1
        start = left
      }

      const d = s[left]
      // 【出】窗口
      if (need.has(d)) {
        if (window.get(d) === need.get(d)) valid-- // 移出后不再满足
        window.set(d, window.get(d) - 1)
      }
      left++
    }
  }

  return minLen === Infinity ? '' : s.slice(start, start + minLen)
}
```

## 3. 常见问题深度剖析 (FAQ)

### 3.1 滑动窗口和动态规划 (DP) 怎么区分？

关键在于**连续性**：题目要找“**连续的**”子数组或子串时，90% 是滑动窗口；只要求“**子序列**”（不要求物理位置连续）时，滑动窗口不适用，应改用动态规划或回溯。

### 3.2 为什么有时候在 `while` 里更新答案，有时候在 `while` 外更新？

这是滑动窗口的**黄金法则**，取决于找最值的方向：

- **找最短**：在 `while` **内**更新——只有进入 `while`（条件满足）时，才有资格争取更短的有效长度。
- **找最长**：在 `while` **外**更新——出了 `while` 说明窗口刚修复合法，此时评估长度才是最大且合法的。

### 3.3 代码里有 `for` 嵌套 `while`，时间复杂度是 $O(n^2)$ 吗？

不是，是 $O(n)$。`right` 与 `left` 都**只前进、不后退**：`right` 每个元素最多进窗口一次，`left` 每个元素最多出窗口一次，总操作数 ≤ $2n$，去掉常数即 $O(n)$。前提是内层 `left` 单调递增，若每轮重置 `left`，复杂度才会退化成 $O(n^2)$。

### 3.4 遇到含有负数的数组，还能用滑动窗口吗？

通常不能。求“**和等于 Target 的最长子数组**”这类题时，滑动窗口依赖“**右指针右移和变大、左指针右移和变小**”的**单调性**；有负数时右移可能让和变小，前提被打破。此时应改用**前缀和 + 哈希表**。

### 3.5 固定窗口和可变窗口的写法差异是什么？

核心区别在**收缩时机**：

- **固定窗口**：长度恒为 `k`，用 `if (right >= k)` 判断并移动一次 `left`，不需要 `while`。
- **可变窗口**：长度随条件变化，用 `while (违规)` 持续收缩，最短类在 `while` 内更新答案、最长类在 `while` 外更新。

### 3.6 窗口内的计数怎么维护？

遵循“**进一减一**”：`right` 吃进元素时对其计数 `+1`，`left` 吐出时 `-1`；窗口内其他状态（`sum`、`zeroCount`、`valid` 等）同样进出对称更新，保证状态与区间 `[left, right]` 一一对应。

### 3.7 什么时候要用 `Map` 计数而不是数组？

字符集是**固定小集合**（如仅 26 个小写字母）时用数组最快，下标寻址 $O(1)$ 且无需哈希；字符集**不可预知或过于庞大**（Unicode 有上万个码点、单词、数字键）时就得用 `Map`。用 `Map` 时计数减到 0 要 `delete`，避免 `size` 失真。

### 3.8 滑动窗口与双指针是什么关系？

**滑动窗口是同向双指针的一个特例**：所有滑动窗口都是双指针，但双指针不一定构成窗口——快慢指针（如链表判环）虽然也是同向的，两指针之间却没有“**共同维护的区间**”语义，就不算窗口。一句话：**双指针是技巧，滑动窗口是在这个技巧上加了一个有明确含义的区间**。
