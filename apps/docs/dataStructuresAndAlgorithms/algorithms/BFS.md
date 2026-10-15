---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 广度优先遍历 (Breadth-First Search, BFS)

## 1. BFS 核心概览

广度优先遍历（BFS）是一种用于遍历或搜索树和图的算法。它的核心思想是：**从起始节点开始，一层一层地向外辐射状扩展，直到找到目标节点或遍历完所有节点。**

> **通俗理解：** 就像在平静的湖面投入一颗石子，波纹一圈一圈地向外扩散；或者像雷达扫描，先扫近的，再扫远的。

### 1.1 BFS 的核心利器：队列 (Queue)

BFS 的实现极其依赖一种基础数据结构：**队列（先进先出 FIFO）**。
算法流程非常固定，几乎所有的 BFS 都可以套用以下标准循环：

```js
/**
 * BFS 极简模板
 * @param {T} start 起始节点
 * @return {T[]} 遍历顺序
 */
function bfs(start) {
  const queue = [start] // ① 起点入队
  const visited = new Set([start]) // ② 入队那一刻就标记，而不是出队时
  const order = []

  while (queue.length > 0) {
    // ③ 队列不为空就继续
    const node = queue.shift() // ④ 队头出队
    order.push(node) // ⑤ 处理当前节点

    for (const next of neighbors(node)) {
      // ⑥ 扩散相邻节点
      if (visited.has(next)) continue
      visited.add(next)
      queue.push(next)
    }
  }

  return order
}
```

### 1.2 BFS 的王牌应用场景

[width(30,70)]

| 应用场景                      | 详细说明                                                                                                         |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **最短路径问题**              | （无权图中）求起点到终点的最少步数。因为 BFS 是按层级扩展的，**第一次**遇到终点时，走过的层数绝对是最短的。      |
| **层序遍历**                  | 打印二叉树/多叉树的每一层节点（如前端 DOM 树的按层解析）。                                                       |
| **社交网络计算**              | 寻找“**二度人脉**”、“**三度好友**”等基于距离扩散的关系。                                                         |
| **拓扑排序（Kahn 算法）**     | 基于入度（In-degree）的图层级解析，不断把入度为 0 的节点出队并“**摘掉**”它的出边（如构建系统中的模块依赖解析）。 |
| **多源最短路（多源 BFS）**    | 多个起点同时向外扩散，求「每个位置到最近源点的距离」（如腐烂的橘子、01 矩阵）。                                  |
| **连通块数量**                | 统计网格 / 图中互相连通区域的个数（如岛屿数量、省份数量），每次从未访问点发起一次 BFS 就得到一个连通块。         |
| **二叉树右视图 / 每层最大值** | 层序遍历时只保留每层最后一个节点（右视图）或每层最大值（如 LeetCode 515）。                                      |
| **单词接龙 / 状态空间搜索**   | 把每个合法状态看作节点，求从起始状态到目标状态的最少变换次数（如单词接龙、打开转盘锁）。                         |

### 1.3 BFS 的高频术语与适用前提

- **BFS 树 / 层号**：出队顺序天然按「距离起点多少条边」分层，第 $k$ 层节点到起点的最短距离恰好是 $k$。
- **适用前提（边权必须相同）**：BFS 默认每走一步的代价都是 1，因此只有在**无权图或所有边权相等**的图上，第一次到达某节点的层号才是最短路；边权不等时必须改用 Dijkstra。
- **超级源点**：多源 BFS 相当于凭空建一个虚拟源点连向所有真实起点，一次 BFS 即可求出「每个位置到最近源点的距离」。
- **入队即标记**：节点必须在**入队那一刻**标记 `visited`，而不是等到出队时。
- **空间复杂度 $O(n)$**：队列的最大长度对应图 / 树的**最大宽度**，最坏情况下会逼近节点总数 $n$。
- **双重身份**：在无权图中，BFS 同时是「层级遍历算法」和「单源最短路算法」。

## 2. 经典 BFS 场景

### 2.1 二叉树的层序遍历 (Level Order Traversal)

**题目描述：** 给你二叉树的根节点 `root` ，返回其节点值的层序遍历。（即逐层地，从左到右访问所有节点）。
例如：输入 `[3, 9, 20, null, null, 15, 7]`，返回 `[[3], [9,20], [15,7]]`。

**核心逻辑：** 树的 BFS 非常简单，因为树的指针是单向向下的，不会产生环，所以**不需要记录 `visited` 状态**。但为了区分“**层**”，我们需要在循环中固定当前队列的长度。

```js
// 假设树节点结构如下：
// function TreeNode(val, left, right) {
//     this.val = (val===undefined ? 0 : val)
//     this.left = (left===undefined ? null : left)
//     this.right = (right===undefined ? null : right)
// }

/**
 * 二叉树的层序遍历
 * @param {TreeNode} root
 * @return {number[][]}
 */
function levelOrder(root) {
  if (!root) return []

  const result = []
  const queue = [root] // 初始化队列，将根节点放入

  while (queue.length > 0) {
    const levelSize = queue.length // 🚨 核心技巧：记录当前层的节点数量
    const currentLevel = [] // 用于存放当前层的值

    // 按当前层的数量进行循环，确保一次性把这一层处理完
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift() // 从队头取出节点
      currentLevel.push(node.val)

      // 将下一层的子节点排入队尾
      if (node.left) queue.push(node.left)
      if (node.right) queue.push(node.right)
    }

    // 当前层处理完毕，存入总结果中
    result.push(currentLevel)
  }

  return result
}
```

### 2.2 图的最短路径 / 迷宫寻宝问题 (Maze Shortest Path)

**题目描述：** 给定一个 `N x N` 的二维网格 `grid`，其中 `0` 表示可以走的路，`1` 表示墙壁。你可以上下左右四个方向移动。求从左上角 `(0,0)` 走到右下角 `(N-1, N-1)` 的**最短路径长度**。如果走不到，返回 `-1`。

**核心逻辑：** 这是一个图/网格结构，可以走回头路！所以**必须使用 `visited` 集合来记录已经走过的坐标**，否则会陷入死循环，队列中不仅要存坐标，还要存**步数**。

```js
/**
 * 网格迷宫的最短路径
 * @param {number[][]} grid
 * @return {number}
 */
function shortestPathBinaryMatrix(grid) {
  const N = grid.length
  // 如果起点或终点就是墙，直接返回 -1
  if (grid[0][0] === 1 || grid[N - 1][N - 1] === 1) return -1

  // 队列存放对象：{ row: 行, col: 列, steps: 当前步数 }
  const queue = [{ row: 0, col: 0, steps: 1 }]

  // 使用 Set 记录走过的路径，防止无限画圈 (把行列拼接成字符串作为 key)
  const visited = new Set()
  visited.add('0,0')

  // 定义四个移动方向：上、下、左、右
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    const { row, col, steps } = current

    // 终止条件：到达右下角终点
    if (row === N - 1 && col === N - 1) {
      return steps
    }

    // 尝试向四个方向扩散
    for (let dir of directions) {
      const newRow = row + dir[0]
      const newCol = col + dir[1]
      const posKey = `${newRow},${newCol}`

      // 越界检查、墙壁检查、是否走过检查
      if (
        newRow >= 0 &&
        newRow < N &&
        newCol >= 0 &&
        newCol < N &&
        grid[newRow][newCol] === 0 &&
        !visited.has(posKey)
      ) {
        // 如果合法，加入队列，步数 + 1，并标记为已访问
        queue.push({ row: newRow, col: newCol, steps: steps + 1 })
        visited.add(posKey) // 🚨 核心：入队时立刻标记 visited，防止被其他路径重复推入
      }
    }
  }

  return -1 // 队列空了还没找到终点，说明是死胡同
}
```

### 2.3 多源 BFS（Multi-source BFS）

**核心逻辑：** 当题目有**多个起点**、要求「每个位置到最近起点的距离」时，不必对每个起点各跑一次 BFS。把所有起点**一次性全部入队**，再做普通的 BFS 即可——队列里相当于存在一个虚拟的「超级源点」，它到每个真实起点的距离都是 0。

**经典题目：** 腐烂的橘子（求全部腐烂的最少分钟数）、01 矩阵（求每个 `1` 到最近 `0` 的距离）。

```js
/**
 * 多源 BFS 模板：把 0 视为源点，求每个格子到最近源点的距离
 * @param {number[][]} grid
 * @return {number[][]} 距离矩阵，-1 表示不可达
 */
function multiSourceBFS(grid) {
  const rows = grid.length
  const cols = grid[0].length
  const queue = []
  // dist 同时兼任 visited：-1 表示尚未访问
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1))

  // 🚨 核心：所有源点一次性入队，距离置为 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 0) {
        queue.push([r, c])
        dist[r][c] = 0
      }
    }
  }

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    const r = current[0]
    const c = current[1]

    for (const dir of directions) {
      const nr = r + dir[0]
      const nc = c + dir[1]

      // 越界或已访问（离某个源点更近）就跳过
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (dist[nr][nc] !== -1) continue

      dist[nr][nc] = dist[r][c] + 1
      queue.push([nr, nc])
    }
  }

  return dist
}
```

> [!TIP]
> 多源 BFS 与单源 BFS 的代码几乎一样，唯一区别是**初始化时把所有源点都塞进队列**。判断信号：题目出现多个起点，或问「最近的 ××」「全部被感染 / 填满所需的最短时间」。不要偷懒地去循环跑 `n` 次单源 BFS，那样复杂度会从 $O(mn)$ 退化。

### 2.4 记录并还原最短路径（`parent` 数组）

BFS 只能算出「最少几步」，若要输出**具体走过的路径**，需要在入队时额外记录每个节点「是从哪个节点走过来的」（前驱），到达终点后沿前驱一路回退。

```js
/**
 * 记录最短路径的 BFS
 * @param {Record<string, string[]>} graph 邻接表
 * @param {string} start
 * @param {string} target
 * @return {string[] | null} 最短路径的节点序列，不可达返回 null
 */
function shortestPathWithRoute(graph, start, target) {
  const queue = [start]
  const visited = new Set([start])
  const parent = new Map([[start, null]]) // 记录每个节点的前驱

  while (queue.length > 0) {
    const node = queue.shift()
    if (node === target) break

    for (const next of graph[node] || []) {
      if (visited.has(next)) continue
      visited.add(next)
      parent.set(next, node) // 🚨 入队时立刻登记前驱
      queue.push(next)
    }
  }

  if (!parent.has(target)) return null // 队列空了还没到，说明不可达

  // 从终点沿 parent 回退到起点，再整体反转
  const path = []
  let cur = target
  while (cur !== null) {
    path.push(cur)
    cur = parent.get(cur)
  }
  return path.reverse()
}
```

## 3. 常见问题深度剖析 (FAQ)

### 3.1 广度优先 (BFS) 和深度优先 (DFS) 到底怎么选？

求“**最短路径 / 最少步数 / 层级关系**”秒选 BFS，无权图中第一次到达终点即为最优；求“**所有方案 / 排列组合 / 一条可行路即可**”选 DFS（回溯），递归写法更简洁。图很宽时 BFS 队列可能撑爆内存，可改双向 BFS；图很深时 DFS 递归可能爆栈，可改显式栈迭代。

### 3.2 BFS 会发生内存爆炸 (Out of Memory) 吗？

会。BFS 的空间由队列宽度决定，满二叉树最后一层约有 $N/2$ 个节点，队列里可能同时堆积几万个节点，而 DFS 的空间只取决于递归深度（平衡树仅 $O(\log N)$）。宽度过大时可改用双向 BFS。

### 3.3 JavaScript 中 `shift()` 操作的性能陷阱！

数组 `push()` 是 $O(1)$，但从队头取元素的 `shift()` 是 $O(N)$，它会让后面所有元素前移，队列很大时可能超时。严格场景可用链表或头指针自建队列，多数面试直接用数组即可。

### 3.4 为什么图的 BFS 必须在“**入队时**”标记 `visited`，而不是“**出队时**”标记？

若在出队时才标记，同一层的相邻节点会被多个当前节点重复发现并推入队列，导致队列急速膨胀甚至溢出。必须在推入队列的那一刻就标记为已访问。

### 3.5 BFS 的空间复杂度为什么是 $O(n)$？

空间几乎全被队列占满，队列任意时刻最多存放“**一整层**”节点，星形图或满二叉树最后一层这一宽度最坏可达 $O(n)$。而 DFS 的空间只取决于递归深度（平衡树 $O(\log n)$），所以图很宽时 BFS 比 DFS 更吃内存。

### 3.6 双向 BFS 为什么更快？

单向 BFS 搜到深度 $d$ 约访问 $b^d$ 个节点；双向 BFS 从起点和终点同时扩散，各推进到 $d/2$，总规模约 $2 \times b^{d/2}$，是指数级的下降。前提是起点、终点都已知且图可反向搜索，实现时用两个 `visited` 轮流扩展更小的一侧。

### 3.7 BFS 能处理带权图吗？

不能直接处理边权不相等的图，因为 BFS 假定每扩展一层距离就 +1，边权不同时先出队的节点未必离起点最近。正解：边权非负用 Dijkstra，含负权用 Bellman-Ford / SPFA，边权只有 0 和 1 可用 0-1 BFS（双端队列）。

### 3.8 为什么 BFS 用队列，而 DFS 用栈？

- 队列 FIFO：先发现的节点先处理,节点按“**距离从小到大**”出队，一层层向外扩散，这正是最短路正确的根基。
- 栈 LIFO：后发现的节点先处理，于是不断深入、一条路走到黑，正好满足 DFS“**钻到底再回退**”。
