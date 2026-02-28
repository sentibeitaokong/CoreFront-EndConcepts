---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 广度优先遍历 (Breadth-First Search, BFS)

## 1. BFS 核心概览

广度优先遍历（BFS）是一种用于遍历或搜索树和图的算法。它的核心思想是：**从起始节点开始，一层一层地向外辐射状扩展，直到找到目标节点或遍历完所有节点。**

> **通俗理解：** 就像在平静的湖面投入一颗石子，波纹一圈一圈地向外扩散；或者像雷达扫描，先扫近的，再扫远的。

### 1.1 BFS 的核心利器：队列 (Queue)

BFS 的实现极其依赖一种基础数据结构：**队列（先进先出 FIFO）**。
算法流程非常固定，几乎所有的 BFS 都可以套用以下标准循环：

1.  把起始节点放入队列。
2.  只要队列不为空，就进入循环。
3.  从队列头部取出一个节点（`shift`）。
4.  处理该节点（如判断是否是目标节点）。
5.  将该节点所有**未被访问过**的相邻子节点，推入队列尾部（`push`）。
6.  重复步骤 2-5。

### 1.2 BFS 的王牌应用场景

| 应用场景 | 详细说明 |
| :--- | :--- |
| **最短路径问题** | （无权图中）求起点到终点的最少步数。因为 BFS 是按层级扩展的，**第一次**遇到终点时，走过的层数绝对是最短的。 |
| **层序遍历** | 打印二叉树/多叉树的每一层节点（如前端 DOM 树的按层解析）。 |
| **社交网络计算** | 寻找“二度人脉”、“三度好友”等基于距离扩散的关系。 |
| **拓扑排序** | 基于入度（In-degree）的图层级解析（如构建系统中的模块依赖解析）。 |

## 2. 经典 BFS 场景与 JavaScript 实现

### 2.1 二叉树的层序遍历 (Level Order Traversal)

**题目描述：** 给你二叉树的根节点 `root` ，返回其节点值的层序遍历。（即逐层地，从左到右访问所有节点）。
例如：输入 `[3, 9, 20, null, null, 15, 7]`，返回 `[[3], [9,20], [15,7]]`。

**核心逻辑：** 树的 BFS 非常简单，因为树的指针是单向向下的，不会产生环，所以**不需要记录 `visited` 状态**。但为了区分“层”，我们需要在循环中固定当前队列的长度。

#### JavaScript 代码实现

```javascript
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
    if (!root) return [];

    const result = [];
    const queue = [root]; // 初始化队列，将根节点放入

    while (queue.length > 0) {
        const levelSize = queue.length; // 🚨 核心技巧：记录当前层的节点数量
        const currentLevel = []; // 用于存放当前层的值

        // 按当前层的数量进行循环，确保一次性把这一层处理完
        for (let i = 0; i < levelSize; i++) {
            const node = queue.shift(); // 从队头取出节点
            currentLevel.push(node.val);

            // 将下一层的子节点排入队尾
            if (node.left) queue.push(node.left);
            if (node.right) queue.push(node.right);
        }

        // 当前层处理完毕，存入总结果中
        result.push(currentLevel);
    }

    return result;
}
```

### 2.2 图的最短路径 / 迷宫寻宝问题 (Maze Shortest Path)

**题目描述：** 给定一个 `N x N` 的二维网格 `grid`，其中 `0` 表示可以走的路，`1` 表示墙壁。你可以上下左右四个方向移动。求从左上角 `(0,0)` 走到右下角 `(N-1, N-1)` 的**最短路径长度**。如果走不到，返回 `-1`。

**核心逻辑：**
1. 这是一个图/网格结构，可以走回头路！所以**必须使用 `visited` 集合来记录已经走过的坐标**，否则会陷入死循环。
2. 队列中不仅要存坐标，还要存**步数**。

#### JavaScript 代码实现

```javascript
/**
 * 网格迷宫的最短路径
 * @param {number[][]} grid 
 * @return {number}
 */
function shortestPathBinaryMatrix(grid) {
    const N = grid.length;
    // 如果起点或终点就是墙，直接返回 -1
    if (grid[0][0] === 1 || grid[N - 1][N - 1] === 1) return -1;

    // 队列存放对象：{ row: 行, col: 列, steps: 当前步数 }
    const queue = [{ row: 0, col: 0, steps: 1 }];
    
    // 使用 Set 记录走过的路径，防止无限画圈 (把行列拼接成字符串作为 key)
    const visited = new Set();
    visited.add('0,0');

    // 定义四个移动方向：上、下、左、右
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
        const current = queue.shift();
        const { row, col, steps } = current;

        // 终止条件：到达右下角终点
        if (row === N - 1 && col === N - 1) {
            return steps; 
        }

        // 尝试向四个方向扩散
        for (let dir of directions) {
            const newRow = row + dir[0];
            const newCol = col + dir[1];
            const posKey = `${newRow},${newCol}`;

            // 越界检查、墙壁检查、是否走过检查
            if (
                newRow >= 0 && newRow < N && 
                newCol >= 0 && newCol < N && 
                grid[newRow][newCol] === 0 && 
                !visited.has(posKey)
            ) {
                // 如果合法，加入队列，步数 + 1，并标记为已访问
                queue.push({ row: newRow, col: newCol, steps: steps + 1 });
                visited.add(posKey); // 🚨 核心：入队时立刻标记 visited，防止被其他路径重复推入
            }
        }
    }

    return -1; // 队列空了还没找到终点，说明是死胡同
}
```

## 3. 常见问题深度剖析 (FAQ)

| 常见疑惑 | 深度解析与应对策略 |
| :--- | :--- |
| **1. 广度优先 (BFS) 和深度优先 (DFS) 到底怎么选？** | 🔹 **求“最短路径”、“最少操作步数”、“层级关系”：** 绝对秒选 BFS。<br>🔹 **求“所有可能的方案”、“排列组合”、“走迷宫求一条可行路即可”：** 选择 DFS（回溯）。<br>两者在遍历所有节点时都能得到正确结果，但 BFS 找最短路径有天然优势，DFS 写法（递归）更简洁。 |
| **2. BFS 会发生内存爆炸 (Out of Memory) 吗？** | **会！这是 BFS 最大的弱点。** BFS 的空间复杂度取决于树/图的**最大宽度**。对于一棵满二叉树，最后一层有 $N/2$ 个节点，这意味着队列里最多会同时堆积几万甚至几十万个节点，极耗内存。而 DFS 的空间复杂度只取决于树的深度（最差是 $O(N)$，很好是 $O(\log N)$）。如果宽度太大，可以考虑**双向 BFS** 进行优化。 |
| **3. JavaScript 中 `shift()` 操作的性能陷阱！** | 在 JS 的原生数组中，`push()` 是 $O(1)$，但从队头移除元素的 **`shift()` 操作是 $O(N)$ 的！** 因为它会导致后面所有元素向前移动一位。如果 BFS 的队列非常庞大，频繁 `shift()` 会导致严重的性能瓶颈（超时）。<br>**应对策略：** 在极其严格的算法题中，我们需要自己用闭包或 Class 实现一个基于链表的 Queue；但在绝大多数中等难度面试中，直接用数组模拟即可，面试官通常允许。 |
| **4. 为什么图的 BFS 必须在“入队时”标记 `visited`，而不是“出队时”标记？** | 这是一个极度高频的 Bug！如果在“出队”时才标记 `visited`，那么在同一层级扩展时，同一个相邻节点可能会被多个当前节点发现并**重复推入队列**。这会导致队列急速膨胀，内存溢出。**必须在推入队列的那一刻，立刻将其宣判为已访问。** |