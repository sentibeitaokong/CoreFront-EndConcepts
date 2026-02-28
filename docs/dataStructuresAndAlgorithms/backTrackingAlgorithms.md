---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 回溯算法 (Backtracking Algorithm)

## 1. 回溯算法核心概览

回溯算法实际上是一个类似枚举的搜索尝试过程。它的核心思想是**“试探与撤销”**：在搜索尝试过程中寻找问题的解，当发现已不满足求解条件时，就“回溯”（即退回一步或多步），尝试别的路径。

> **通俗理解：** 走迷宫。你顺着一条路往前走，走到死胡同了怎么办？退回到上一个岔路口，换一条路接着走。如果所有路都试过了，就彻底结束。这个“退回”的动作，就是回溯。

### 1.1 回溯算法的适用场景

回溯算法是“暴力穷举”的优雅实现，主要用于解决以下几类问题（只要题目要求“找出所有可能的方案”，90% 是回溯）：

1.  **组合问题：** `N` 个数里面按一定规则找出 `k` 个数的集合（如：找出所有和为 10 的组合）。
2.  **排列问题：** `N` 个数按一定规则全排列（强调顺序，如：123 和 321 是不同的）。
3.  **子集问题：** 一个 `N` 个数的集合里有多少符合条件的子集。
4.  **切割问题：** 一个字符串按一定规则有几种切割方式（如：切割成所有有效的回文串）。
5.  **棋盘/迷宫问题：** N 皇后问题、解数独、单词搜索等。

### 1.2 回溯算法通用模板 (必须刻在 DNA 里)

所有的回溯问题都可以抽象为一棵**决策树**的遍历过程（深度优先搜索 DFS）。掌握以下模板，几乎能套用所有回溯题：

```javascript
// 伪代码模板
let result = []; // 全局结果集
let path = [];   // 单个路径的收集数组

function backtrack(参数集) {
    // 1. 终止条件 (走到叶子节点)
    if (满足结束条件) {
        result.push([...path]); // 注意：必须深拷贝 path 数组！
        return; 
    }

    // 2. 遍历当前层的所有可能选择 (横向遍历)
    for (let i = 0; i < 选择列表的长度; i++) {
        // (可选) 剪枝逻辑：如果不符合条件，直接 continue 跳过
        
        // 3. 做选择 (处理节点)
        path.push(选择列表[i]); 
        
        // 4. 递归 (纵向深入到下一层决策)
        backtrack(新的参数集); 
        
        // 5. 回溯 (撤销选择，恢复现场，为尝试下一个兄弟节点做准备)
        path.pop(); 
    }
}
```

## 2. 经典回溯场景与 JavaScript 实现

### 2.1 全排列 (Permutations) - 纯粹的顺序问题

**题目描述：** 给定一个不含重复数字的数组 `nums` ，返回其所有可能的全排列。
例如：`nums = [1,2,3]`，返回 `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`。

**核心逻辑：** 排列问题讲究顺序，每次递归都要从头开始选，但**不能选已经选过的数字**，所以需要一个 `used` 数组来记录状态。

#### JavaScript 代码实现

```javascript
/**
 * 全排列
 * @param {number[]} nums
 * @return {number[][]}
 */
function permute(nums) {
    const result = [];
    const path = [];
    const used = new Array(nums.length).fill(false); // 记录数字是否被使用过

    function backtrack() {
        // 1. 终止条件：路径长度等于数组长度，说明找齐了一个排列
        if (path.length === nums.length) {
            result.push([...path]); 
            return;
        }

        // 2. 遍历选择列表 (每次都从 0 开始，因为排列有顺序)
        for (let i = 0; i < nums.length; i++) {
            // 剪枝：如果这个数在当前路径中已经被用过了，跳过
            if (used[i]) continue;

            // 3. 做选择
            path.push(nums[i]);
            used[i] = true; // 标记为已使用

            // 4. 递归深入
            backtrack();

            // 5. 撤销选择 (回溯)
            path.pop();
            used[i] = false; // 恢复未被使用的状态
        }
    }

    backtrack();
    return result;
}
```

### 2.2 组合总和 (Combination Sum) - 带有起点的挑选

**题目描述：** 给你一个无重复元素的整数数组 `candidates` 和一个目标整数 `target` ，找出其中所有使数字和为目标数 `target` 的唯一组合。**同同一个数字可以无限制重复被选取。**

**核心逻辑：** 组合问题**不讲究顺序**（`[2,2,3]` 和 `[3,2,2]` 是同一个组合）。为了避免产生重复的组合，必须引入 `startIndex` 变量，规定递归下一层时，**只能从当前元素或其后面的元素开始选**，决不回头。

#### JavaScript 代码实现

```javascript
/**
 * 组合总和
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
function combinationSum(candidates, target) {
    const result = [];
    const path = [];

    // 为了更好的剪枝优化，先将数组排序 (非必须，但强烈建议)
    candidates.sort((a, b) => a - b);

    // startIndex 控制每层循环的起始位置，避免产生倒序的重复组合
    function backtrack(startIndex, sum) {
        // 1. 终止条件
        if (sum === target) {
            result.push([...path]);
            return;
        }

        // 2. 遍历选择列表 (从 startIndex 开始)
        for (let i = startIndex; i < candidates.length; i++) {
            // 强力剪枝：如果加上当前元素已经超了，而且数组是有序的，那么后面的元素加上必定也会超，直接 break 结束本层循环
            if (sum + candidates[i] > target) break;

            // 3. 做选择
            path.push(candidates[i]);
            sum += candidates[i];

            // 4. 递归：因为数字可以重复使用，所以下一层依然可以从当前的 i 开始，而不是 i + 1
            backtrack(i, sum); 

            // 5. 撤销选择 (回溯)
            path.pop();
            sum -= candidates[i];
        }
    }

    backtrack(0, 0);
    return result;
}
```

### 2.3 子集 (Subsets) - 收集树的所有节点

**题目描述：** 给你一个整数数组 `nums` ，数组中的元素互不相同。返回该数组所有可能的子集（幂集）。解集不能包含重复的子集。
例如：`nums = [1,2,3]`，子集包括 `[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]`。

**核心逻辑：** 之前的排列和组合，都是在**叶子节点**（最底层）收集结果。而子集问题，是要把决策树上**每一个节点**走过的路径都收集起来。

#### JavaScript 代码实现

```javascript
/**
 * 子集
 * @param {number[]} nums
 * @return {number[][]}
 */
function subsets(nums) {
    const result = [];
    const path = [];

    function backtrack(startIndex) {
        // 1. 收集结果：注意，子集问题是在每次进入递归时，无条件收集当前的 path！
        // 因为空集 [] 和过程中的每一个状态，都是一个合法子集
        result.push([...path]);

        // (终止条件其实可以省略，因为当 startIndex >= nums.length 时，下面的 for 循环根本进不去，自然会 return)
        if (startIndex >= nums.length) return;

        // 2. 遍历
        for (let i = startIndex; i < nums.length; i++) {
            // 3. 做选择
            path.push(nums[i]);
            
            // 4. 递归：寻找以 nums[i] 开头的所有子集，下一层只能从 i+1 开始挑 (因为不能有重复元素)
            backtrack(i + 1);
            
            // 5. 回溯
            path.pop();
        }
    }

    backtrack(0);
    return result;
}
```

## 3. 常见问题深度剖析 (FAQ)

| 常见报错 / 疑问 | 深度解析与应对策略 |
| :--- | :--- |
| **1. 最终结果数组 `result` 里面全是空数组或相同的值？** | **致命错误：引用传递。** 在执行 `result.push(path)` 时，你推入的是 `path` 的内存地址。当回溯过程结束，`path` 会被 `pop` 成空数组，导致 `result` 里保存的所有引用都变成了空数组。**必须使用浅拷贝或深拷贝：`result.push([...path])` 或 `result.push(path.slice())`。** |
| **2. 怎么判断什么时候用 `used` 数组，什么时候用 `startIndex`？** | 这是一个核心分水岭。<br>🔹 **排列问题**（讲究顺序，如 123 和 321），每次 `for` 循环都必须从 `0` 开始，利用 `used` 数组排除已经选过的数字。<br>🔹 **组合/子集问题**（不讲究顺序，且不能有重复组合），必须使用 `startIndex`，每次 `for` 循环从 `startIndex` 开始向后找，绝不吃“回头草”。 |
| **3. 数据集里有重复数字（如 `[1,2,2]`），怎么保证结果不重复？** | 这被称为**树层去重**。这非常容易考到（如组合总和 II，全排列 II）。<br>1. **必须先对原数组排序！** 让相同的数字挨在一起。<br>2. 在 `for` 循环中加入去重逻辑：`if (i > startIndex && nums[i] === nums[i - 1]) continue;`。这句代码的意思是：在**同一层级**的遍历中，如果当前数字和前一个选过的数字一样，就跳过它，防止产生雷同的分支。 |
| **4. 既然回溯是暴力穷举，时间复杂度是不是很高？能优化吗？** | 是的，回溯算法的时间复杂度通常是指数级 `O(2^n)` 或阶乘级 `O(n!)`。我们无法降低其复杂度量级，只能通过**剪枝（Pruning）**来减少无意义的搜索分支。例如上面的组合总和代码中，先对数组排序，然后发现 `sum > target` 就直接 `break`，这在数据量大时能极大提升运行速度。 |