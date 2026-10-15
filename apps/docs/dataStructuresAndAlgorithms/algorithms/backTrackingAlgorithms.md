---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 回溯算法 (Backtracking Algorithm)

## 1. 回溯算法核心概览

回溯算法实际上是一个类似枚举的搜索尝试过程。它的核心思想是“**试探与撤销**”：在搜索尝试过程中寻找问题的解，当发现已不满足求解条件时，就“**回溯**”（即退回一步或多步），尝试别的路径。

> **通俗理解：** 走迷宫。你顺着一条路往前走，走到死胡同了怎么办？退回到上一个岔路口，换一条路接着走。如果所有路都试过了，就彻底结束。这个“**退回**”的动作，就是回溯。

### 1.1 回溯算法的适用场景

回溯算法是“**暴力穷举**”的优雅实现，主要用于解决以下几类问题：

- **组合问题：** `N` 个数里面按一定规则找出 `k` 个数的集合（如：找出所有和为 10 的组合）。
- **排列问题：** `N` 个数按一定规则全排列（强调顺序，如：123 和 321 是不同的）。
- **子集问题：** 一个 `N` 个数的集合里有多少符合条件的子集。
- **切割问题：** 一个字符串按一定规则有几种切割方式（如：切割成所有有效的回文串）。
- **棋盘/迷宫问题：** N 皇后问题、解数独、单词搜索等。

[width(28,19,53)]

| 高频题目                  | 归属模型       | 关键点                                                         |
| :------------------------ | :------------- | :------------------------------------------------------------- |
| 全排列 / 全排列 II        | 排列           | 用 `used` 排除已选元素；II 需排序 + 树层去重                   |
| 组合总和 / II / III       | 组合           | 用 `startIndex` 限定起点；可重复选传 `i`，不可重复选传 `i + 1` |
| 子集 / 子集 II            | 子集           | 每进入一层递归就收集一次 `path`；II 需排序去重                 |
| 分割回文串 / 复原 IP 地址 | 切割           | 按“**切点**”逐段划分，子串合法才继续深搜                       |
| 电话号码的字母组合        | 组合（多集合） | 每层遍历一个数字对应的字符集                                   |
| 括号生成                  | 组合（构造）   | 用左右括号剩余数量做可行性剪枝                                 |
| N 皇后 / 解数独           | 棋盘           | 用 `isValid` 做二维约束的可行性剪枝                            |
| 单词搜索                  | 网格 DFS       | 二维网格 + `visited` 标记，朝四个方向递归                      |
| 递增子序列                | 子集           | 同一父节点下用 `Set` 去重，不能靠排序                          |

### 1.2 回溯算法通用模板

所有的回溯问题都可以抽象为一棵**决策树**的遍历过程（DFS）。掌握以下模板，几乎能套用所有回溯题：

```js
// 伪代码模板
let result = [] // 全局结果集
let path = [] // 单个路径的收集数组

function backtrack(参数集) {
  // 1. 终止条件 (走到叶子节点)
  if (满足结束条件) {
    result.push([...path]) // 注意：必须深拷贝 path 数组！
    return
  }

  // 2. 遍历当前层的所有可能选择 (横向遍历)
  for (let i = 0; i < 选择列表的长度; i++) {
    // (可选) 剪枝逻辑：如果不符合条件，直接 continue 跳过

    // 3. 做选择 (处理节点)
    path.push(选择列表[i])

    // 4. 递归 (纵向深入到下一层决策)
    backtrack(新的参数集)

    // 5. 回溯 (撤销选择，恢复现场，为尝试下一个兄弟节点做准备)
    path.pop()
  }
}
```

### 1.3 核心术语与剪枝落点

[width(16,40,44)]

| 术语            | 含义                                                 | 在代码中的对应                       |
| :-------------- | :--------------------------------------------------- | :----------------------------------- |
| **决策树**      | 把“**每一步的所有选择**”画成的树，回溯就是遍历这棵树 | 递归函数的一层就是树的一层           |
| **路径 `path`** | 从根节点走到当前节点所做的全部选择                   | 那个被 `push` / `pop` 的数组         |
| **选择列表**    | 当前这一层所有可以做的选择                           | `for` 循环所遍历的集合               |
| **剪枝**        | 提前砍掉不可能产生合法解（或最优解）的分支           | `continue` / `break` / 提前 `return` |

> [!TIP] 剪枝放在哪？
> 剪枝通常发生在**进入 `for` 循环之后、做选择之前**：先判断“**这个选择值不值得走**”，不值得就 `continue` 或 `break`，从而整枝跳过。放在递归之后剪枝就晚了，因为无用的子树已经被走过了。

## 2. 经典回溯场景

### 2.1 全排列 (Permutations) - 纯粹的顺序问题

**题目描述：** 给定一个不含重复数字的数组 `nums` ，返回其所有可能的全排列。
例如：`nums = [1,2,3]`，返回 `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`。

**核心逻辑：** 排列问题讲究顺序，每次递归都要从头开始选，但**不能选已经选过的数字**，所以需要一个 `used` 数组来记录状态。

```js
/**
 * 全排列
 * @param {number[]} nums
 * @return {number[][]}
 */
function permute(nums) {
  const result = []
  const path = []
  const used = new Array(nums.length).fill(false) // 记录数字是否被使用过

  function backtrack() {
    // 1. 终止条件：路径长度等于数组长度，说明找齐了一个排列
    if (path.length === nums.length) {
      result.push([...path])
      return
    }

    // 2. 遍历选择列表 (每次都从 0 开始，因为排列有顺序)
    for (let i = 0; i < nums.length; i++) {
      // 剪枝：如果这个数在当前路径中已经被用过了，跳过
      if (used[i]) continue

      // 3. 做选择
      path.push(nums[i])
      used[i] = true // 标记为已使用

      // 4. 递归深入
      backtrack()

      // 5. 撤销选择 (回溯)
      path.pop()
      used[i] = false // 恢复未被使用的状态
    }
  }

  backtrack()
  return result
}
```

### 2.2 组合总和 (Combination Sum) - 带有起点的挑选

**题目描述：** 给你一个无重复元素的整数数组 `candidates` 和一个目标整数 `target` ，找出其中所有使数字和为目标数 `target` 的唯一组合。**同同一个数字可以无限制重复被选取。**

**核心逻辑：** 组合问题**不讲究顺序**（`[2,2,3]` 和 `[3,2,2]` 是同一个组合）。为了避免产生重复的组合，必须引入 `startIndex` 变量，规定递归下一层时，**只能从当前元素或其后面的元素开始选**，决不回头。

```js
/**
 * 组合总和
 * @param {number[]} candidates
 * @param {number} target
 * @return {number[][]}
 */
function combinationSum(candidates, target) {
  const result = []
  const path = []

  // 为了更好的剪枝优化，先将数组排序 (非必须，但强烈建议)
  candidates.sort((a, b) => a - b)

  // startIndex 控制每层循环的起始位置，避免产生倒序的重复组合
  function backtrack(startIndex, sum) {
    // 1. 终止条件
    if (sum === target) {
      result.push([...path])
      return
    }

    // 2. 遍历选择列表 (从 startIndex 开始)
    for (let i = startIndex; i < candidates.length; i++) {
      // 强力剪枝：如果加上当前元素已经超了，而且数组是有序的，那么后面的元素加上必定也会超，直接 break 结束本层循环
      if (sum + candidates[i] > target) break

      // 3. 做选择
      path.push(candidates[i])
      sum += candidates[i]

      // 4. 递归：因为数字可以重复使用，所以下一层依然可以从当前的 i 开始，而不是 i + 1
      backtrack(i, sum)

      // 5. 撤销选择 (回溯)
      path.pop()
      sum -= candidates[i]
    }
  }

  backtrack(0, 0)
  return result
}
```

### 2.3 子集 (Subsets) - 收集树的所有节点

**题目描述：** 给你一个整数数组 `nums` ，数组中的元素互不相同。返回该数组所有可能的子集（幂集）。解集不能包含重复的子集。
例如：`nums = [1,2,3]`，子集包括 `[], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3]`。

**核心逻辑：** 之前的排列和组合，都是在**叶子节点**（最底层）收集结果。而子集问题，是要把决策树上**每一个节点**走过的路径都收集起来。

```js
/**
 * 子集
 * @param {number[]} nums
 * @return {number[][]}
 */
function subsets(nums) {
  const result = []
  const path = []

  function backtrack(startIndex) {
    // 1. 收集结果：注意，子集问题是在每次进入递归时，无条件收集当前的 path！
    // 因为空集 [] 和过程中的每一个状态，都是一个合法子集
    result.push([...path])

    // (终止条件其实可以省略，因为当 startIndex >= nums.length 时，下面的 for 循环根本进不去，自然会 return)
    if (startIndex >= nums.length) return

    // 2. 遍历
    for (let i = startIndex; i < nums.length; i++) {
      // 3. 做选择
      path.push(nums[i])

      // 4. 递归：寻找以 nums[i] 开头的所有子集，下一层只能从 i+1 开始挑 (因为不能有重复元素)
      backtrack(i + 1)

      // 5. 回溯
      path.pop()
    }
  }

  backtrack(0)
  return result
}
```

### 2.4 排列 / 组合 / 子集 的模板差异

[width(23,29,28,20)]

| 维度                 | 排列问题                                            | 组合问题                                         | 子集问题             |
| :------------------- | :-------------------------------------------------- | :----------------------------------------------- | :------------------- |
| 是否讲究顺序         | 讲究（`[1,2]` 与 `[2,1]` 算两个）                   | 不讲究                                           | 不讲究               |
| 每层循环起点         | 永远从 `0` 开始                                     | 从 `startIndex` 开始                             | 从 `startIndex` 开始 |
| 是否需要 `used`      | 需要（排除已选元素）                                | 通常不需要                                       | 通常不需要           |
| 递归下一层传什么     | `backtrack()`                                       | 可重复选传 `i`，不可重复选传 `i + 1`             | 固定传 `i + 1`       |
| 收集答案的时机       | 叶子节点（`path.length === n`）                     | 叶子节点（如 `sum === target`）                  | 每个节点进入时都收集 |
| 含重复元素时怎么去重 | 排序 + `used` 配合 `i > 0 && nums[i] === nums[i-1]` | 排序 + `i > startIndex && nums[i] === nums[i-1]` | 同组合               |

### 2.5 剪枝的三种常用手段与「树层去重 vs 树枝去重」

回溯是暴力穷举，复杂度量级降不下来，能优化的只有实际搜索的规模，手段就是**剪枝（Pruning）**。

- **可行性剪枝**：当前路径已经不可能得到合法解，立即放弃。例如组合总和里的 `if (sum + candidates[i] > target) break`、N 皇后里的 `isValid` 判断。
- **最优性剪枝**：当前路径即便走到叶子，也一定不比已知最优解更好，提前放弃（分支限界法的基础）。例如“**最小路径和**”类问题里，一旦当前代价已超过已记录的最优值就直接 `return`。
- **排序去重剪枝（预处理剪枝）**：先对原数组**排序**，让相同元素相邻，既方便跳过重复分支，也让“**越界**”判断能用 `break` 一次性停掉整层循环，而不是逐个 `continue`。

**树层去重 vs 树枝去重：** 这是含重复元素题目的胜负手。

[width(13,26,40,21)]

| 类型         | 去重对象                     | 判断条件                                                       | 典型题目                        |
| :----------- | :--------------------------- | :------------------------------------------------------------- | :------------------------------ |
| **树枝去重** | 同一条从根到叶的路径上的元素 | `if (used[i]) continue`                                        | 全排列 II                       |
| **树层去重** | 同一层的兄弟分支之间         | 排序后 `if (i > startIndex && nums[i] === nums[i-1]) continue` | 组合总和 II、子集 II、全排列 II |

- **树枝去重**保证“**一个元素在同一条路径里不被重复选**”；
- **树层去重**保证“**最终结果里不出现重复的方案**”，它依赖排序把相同元素挤在一起。

### 2.6 高频题型实现

#### 2.6.1 括号生成

**核心逻辑：** 用两个计数器记录已经用掉的左右括号数。左括号只要没用完就能继续放；右括号只有在数量**少于**左括号时才能放，否则会出现非法前缀——这正是可行性剪枝。

```js
/**
 * 括号生成
 * @param {number} n
 * @return {string[]}
 */
function generateParenthesis(n) {
  const result = []
  const path = []

  function backtrack(left, right) {
    // 终止条件：总共 2n 个括号全部放完
    if (path.length === 2 * n) {
      result.push(path.join(''))
      return
    }

    // 剪枝一：左括号还没用完，可以继续放左括号
    if (left < n) {
      path.push('(')
      backtrack(left + 1, right)
      path.pop()
    }

    // 剪枝二：右括号数量必须小于左括号，否则会出现非法前缀
    if (right < left) {
      path.push(')')
      backtrack(left, right + 1)
      path.pop()
    }
  }

  backtrack(0, 0)
  return result
}
```

#### 2.6.2 N 皇后

**核心逻辑：** 逐行放置皇后，用一个数组记录“**每一行皇后所在的列**”。每放一个就检查是否和之前的皇后同列、同对角线——二维约束用 `isValid` 一次判完，这就是可行性剪枝。

```js
/**
 * N 皇后
 * @param {number} n
 * @return {string[][]}
 */
function solveNQueens(n) {
  const result = []
  const board = [] // board[row] 记录第 row 行皇后所在的列号

  // 判断在第 row 行、第 col 列放置皇后是否合法
  function isValid(row, col) {
    for (let i = 0; i < row; i++) {
      // 同列，或处于同一条对角线（行差等于列差）
      if (board[i] === col || Math.abs(board[i] - col) === row - i) {
        return false
      }
    }
    return true
  }

  function backtrack(row) {
    if (row === n) {
      // 把列号数组渲染成题目要求的棋盘
      result.push(board.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1)))
      return
    }

    for (let col = 0; col < n; col++) {
      if (!isValid(row, col)) continue // 可行性剪枝：这个位置不合法就换一列
      board.push(col)
      backtrack(row + 1)
      board.pop()
    }
  }

  backtrack(0)
  return result
}
```

#### 2.6.3 分割回文串

**核心逻辑：** 切割问题的本质是“**选切点**”。从 `startIndex` 出发，尝试每一段可能结束的位置 `i`，只要 `s[startIndex..i]` 是回文就切下去，再从 `i + 1` 继续切。

```js
/**
 * 分割回文串
 * @param {string} s
 * @return {string[][]}
 */
function partition(s) {
  const result = []
  const path = []

  function isPalindrome(str, l, r) {
    while (l < r) {
      if (str[l] !== str[r]) return false
      l++
      r--
    }
    return true
  }

  function backtrack(startIndex) {
    // 切到字符串末尾，说明当前切法是一种合法方案
    if (startIndex === s.length) {
      result.push([...path])
      return
    }

    for (let i = startIndex; i < s.length; i++) {
      // 只有 s[startIndex..i] 是回文，才值得从这里切一刀
      if (!isPalindrome(s, startIndex, i)) continue

      path.push(s.slice(startIndex, i + 1))
      backtrack(i + 1) // 下一段从切点 i + 1 之后继续
      path.pop()
    }
  }

  backtrack(0)
  return result
}
```

#### 2.6.4 电话号码的字母组合

**核心逻辑：** 每个数字对应一组字符，`digits` 的长度就是决策树的深度。第 `index` 层遍历 `digits[index]` 对应的字符集即可，不需要 `used`，因为不同数字的字符集天然不重复。

```js
/**
 * 电话号码的字母组合
 * @param {string} digits
 * @return {string[]}
 */
function letterCombinations(digits) {
  if (digits.length === 0) return []

  const map = {
    2: 'abc',
    3: 'def',
    4: 'ghi',
    5: 'jkl',
    6: 'mno',
    7: 'pqrs',
    8: 'tuv',
    9: 'wxyz',
  }
  const result = []
  const path = []

  function backtrack(index) {
    if (index === digits.length) {
      result.push(path.join(''))
      return
    }

    for (const ch of map[digits[index]]) {
      path.push(ch)
      backtrack(index + 1)
      path.pop()
    }
  }

  backtrack(0)
  return result
}
```

> [!TIP] 单词搜索与解数独
> 「单词搜索」是在**二维网格**上做 DFS，用 `visited` 标记走过的格子，朝上下左右四个方向递归；「解数独」则是逐格填空，每格从 `1-9` 中挑一个不冲突的数字，两者的剪枝点都落在“**当前选择是否合法**”上。

## 3. 常见问题深度剖析 (FAQ)

### 3.1 最终结果数组 `result` 里面全是空数组或相同的值？

这是**引用传递**造成的：`result.push(path)` 推入的是 `path` 的内存地址，回溯结束时 `path` 会被 `pop` 空，`result` 里保存的所有引用就都跟着变空了。必须传入拷贝：`result.push([...path])` 或 `result.push(path.slice())`。

### 3.2 怎么判断什么时候用 `used` 数组，什么时候用 `startIndex`？

**排列问题**（讲究顺序，如 123 和 321）每层都要从 `0` 开始挑，用 `used` 排除已站在当前路径上的元素；**组合 / 子集问题**（不讲究顺序）用 `startIndex` 强制“**只往后选、不回头**”，否则会重复产出 `[1,2]` 和 `[2,1]`。

### 3.3 数据集里有重复数字（如 `[1,2,2]`），怎么保证结果不重复？

这叫**树层去重**(高频考点，如组合总和 II、全排列 II)。先对原数组排序让相同数字相邻，再在 `for` 循环里加 `if (i > startIndex && nums[i] === nums[i - 1]) continue;`，跳过同一层级中与前一个分支相同的选择。

### 3.4 既然回溯是暴力穷举，时间复杂度是不是很高？能优化吗？

是的，通常是 `O(2^n)` 或 `O(n!)` 的指数 / 阶乘级，无法降低量级，只能靠**剪枝**减少无意义的搜索分支。例如组合总和先排序，发现 `sum > target` 就 `break`，数据量大时提速明显。

### 3.5 回溯的时间复杂度到底怎么算？

数**决策树上一共有多少个节点（多少条路径）**，而不是看代码里有几层 `for`。全排列每层分支数是 $n, n-1, n-2, \dots$，为 $O(n \cdot n!)$；子集每个元素有“**选 / 不选**”两种可能，为 $O(2^n)$。剪枝只减少实际访问的节点数，改变不了最坏情况下的量级。

### 3.6 回溯和 DFS 是什么关系？

回溯是 DFS 的一种**带撤销操作**的应用：DFS 描述“**一条路走到黑再换路**”的遍历顺序，回溯在这个过程里多了“**做选择 / 撤销选择**”两步，用来枚举**所有**可行路径。一句话：**回溯 = DFS + 状态重置**，递归树上的每个节点就是一次选择。

### 3.7 什么时候必须先对原数组排序？

- **要去重**（组合总和 II、子集 II、全排列 II）：排序让相同元素相邻，才能用 `nums[i] === nums[i-1]` 判断树层重复。
- **要用 `break` 做可行性剪枝**（如 `sum + candidates[i] > target`）：只有有序才能“**一旦越界，后面全超**”。
- 像「递增子序列」这类不能改变元素相对位置的题，就不能排序，只能用 `Set` 在树层去重。
