---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 滑动窗口算法 (Sliding Window)

## 1. 滑动窗口核心概览

滑动窗口本质上是**同向双指针**的一种极其经典的高级应用。它在数组或字符串上维持一个“窗口”（由左指针 `left` 和右指针 `right` 划定边界）。
在这个过程中，窗口会像毛毛虫一样向右滑动：**右指针主动向右扩张（吃进元素），左指针在特定条件下向右收缩（吐出元素）**，在此过程中寻找满足条件的极值或进行计数。

### 1.1 适用场景的“黄金暗号”

当你读题时，如果发现题目中同时包含以下两个特征，**99% 的概率需要使用滑动窗口**：
1.  **数据结构：** 数组、字符串。
2.  **核心词汇：** **“连续”**（连续子数组、子串）、**“最长 / 最短 / 大小为 K”**、**“最大 / 最小和”**。

### 1.2 👑 滑动窗口万能代码模板 (必背)

不管是求最长、最短还是固定长度，都可以套用下面这个模板。你只需要思考四个问题：进窗口更新什么？什么时候出窗口？出窗口更新什么？什么时候记录答案？

```javascript
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

## 2. 经典滑动窗口场景与 JS 实现

根据窗口大小是否变化，滑动窗口分为**“固定窗口”**和**“可变窗口”**两类。

### 2.1 固定窗口：大小为 K 的子数组最大平均数

**题目描述：** 给你一个由 `n` 个整数组成的数组 `nums` 和一个整数 `k`。请找出所有长度为 `k` 的连续子数组，并计算得到其最大平均数。

**核心逻辑：** 窗口的长度永远固定为 `k`。当 `right - left + 1 > k` 时，左指针就必须移动。

#### JavaScript 代码实现

```javascript
/**
 * 固定大小滑动窗口
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function findMaxAverage(nums, k) {
    let maxSum = -Infinity; // 初始化为极小值，因为数组里可能有负数
    let currentSum = 0;
    let left = 0;

    for (let right = 0; right < nums.length; right++) {
        currentSum += nums[right]; // 【入】窗口

        // 当窗口长度达到 k 时，开始记录结果并准备滑动
        if (right - left + 1 === k) {
            maxSum = Math.max(maxSum, currentSum); // 记录当前窗口的最大和
            
            currentSum -= nums[left]; // 【出】窗口：减去最左侧被抛弃的元素
            left++; // 左指针前进一步，保持窗口大小为 k - 1，准备下一次循环变成 k
        }
    }

    return maxSum / k; // 返回最大平均数
}
```

### 2.2 可变窗口 (求最短)：长度最小的子数组

**题目描述：** 给定一个含有 `n` 个正整数的数组和一个正整数 `target`。找出该数组中满足其和 `≥ target` 的长度最小的连续子数组，并返回其长度。如果不存在符合条件的子数组，返回 0。

**核心逻辑：** 右指针不断累加元素。一旦和 `≥ target`，说明满足条件了。为了找“最短”，我们尝试不断把左指针往右挪（缩小窗口），看是否还能满足条件。

#### JavaScript 代码实现

```javascript
/**
 * 可变窗口 - 求最短
 * @param {number} target
 * @param {number[]} nums
 * @return {number}
 */
function minSubArrayLen(target, nums) {
    let minLen = Infinity; // 求最小，初始设为无穷大
    let currentSum = 0;
    let left = 0;

    for (let right = 0; right < nums.length; right++) {
        currentSum += nums[right]; // 【入】窗口

        // 一旦满足条件，触发收缩机制
        while (currentSum >= target) {
            // 🚨 核心：求最短，所以在满足条件的 while 循环【内部】更新答案
            minLen = Math.min(minLen, right - left + 1);

            currentSum -= nums[left]; // 【出】窗口：减去左侧元素
            left++; // 缩小窗口
        }
    }

    return minLen === Infinity ? 0 : minLen;
}
```

### 2.3 可变窗口 (求最长)：最大连续 1 的个数 III

**题目描述：** 给定一个二进制数组 `nums` 和一个整数 `k`，如果可以翻转最多 `k` 个 `0`，则返回数组中连续 `1` 的最大个数。
例如：`nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2`。最大连续1为 6（翻转最后面两个1前面的两个0）。

**核心逻辑：** 题目可以翻译为：**寻找一个最长的连续子数组，要求这个子数组里面 `0` 的个数不能超过 `k` 个。**
只要窗口里的 0 不超过 k 个，右指针就一直扩张；如果 0 超标了，左指针就开始移动，直到把一个 0 吐出去为止。

#### JavaScript 代码实现

```javascript
/**
 * 可变窗口 - 求最长
 * @param {number[]} nums
 * @param {number} k
 * @return {number}
 */
function longestOnes(nums, k) {
    let maxLen = 0;
    let left = 0;
    let zeroCount = 0; // 记录窗口内 0 的个数

    for (let right = 0; right < nums.length; right++) {
        // 【入】窗口：如果是 0，计数器增加
        if (nums[right] === 0) {
            zeroCount++;
        }

        // 违规条件：0 的个数超标了，必须收缩窗口
        while (zeroCount > k) {
            // 【出】窗口：如果即将被踢出的是 0，计数器减少
            if (nums[left] === 0) {
                zeroCount--;
            }
            left++;
        }

        // 🚨 核心：求最长，所以在确保窗口合法（while 循环之后）的【外部】更新答案
        maxLen = Math.max(maxLen, right - left + 1);
    }

    return maxLen;
}
```

## 3. 常见问题深度剖析 (FAQ)

| 常见疑惑 | 深度解析与应对策略 |
| :--- | :--- |
| **1. 滑动窗口和动态规划 (DP) 怎么区分？** | 最大的区别在于**“连续性”**。如果题目要求找**“连续的”**子数组或子串，90% 是滑动窗口。如果题目只说找“子序列”（不需要物理位置连续），那绝对不能用滑动窗口，只能用动态规划或回溯。 |
| **2. 为什么有时候在 `while` 里更新答案，有时候在 `while` 外更新？** | 这是滑动窗口最值钱的经验（**黄金法则**）：<br>🔹 **找最短 (Min)：** 在 `while` 内部更新。因为你只有在满足条件时（进入 `while`），才有资格去争取一个更短的有效长度。<br>🔹 **找最长 (Max)：** 在 `while` 外部更新。因为 `while` 的作用是修复违规状态。出了 `while`，说明现在的窗口是合法的，且刚吃进一个新元素，此时评估长度才是最大且合法的。 |
| **3. 代码里有 `for` 嵌套 `while`，时间复杂度是 $O(n^2)$ 吗？** | **不是，是绝对的 $O(n)$。** 复杂度分析不是看有几层循环，而是看操作次数。在整个过程中，`right` 指针从 0 走到 `n`，每个元素最多进窗口 1 次；`left` 指针也只能从 0 走到 `n`（从不后退），每个元素最多出窗口 1 次。加起来总操作次数是 $2n$，去掉常数即 $O(n)$。 |
| **4. 遇到含有负数的数组，还能用滑动窗口吗？** | **极其危险，通常不能！** 比如让你求“和等于 Target 的最长子数组”。如果数组全是正数，右指针右移和变大，左指针右移和变小，具有**单调性**，完美契合滑动窗口。但如果有负数，右指针右移和可能会变小！这就打破了滑动窗口的单调性前提。此时必须改用 **“前缀和 + 哈希表”** 来解决。 |