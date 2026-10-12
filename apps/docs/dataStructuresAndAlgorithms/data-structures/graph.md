---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 图 (Graph)

图是网络世界的基石，互联网、社交网络、地图导航，底层全是图。

## 1. 核心概念与特性

**图 (Graph)** 是一种极其灵活且复杂的**非线性**数据结构。你可以把它理解为“**升级版**”的树。在树中，子节点不能互相连接，也不能指回父节点（不能有环）；而在图中，**任何节点都可以与任何其他节点相连**。

### 1.1 核心组成部分

- **顶点 (Vertex/Node)**：图中的数据元素（比如社交网络中的一个人，地图上的一个路口）。
- **边 (Edge)**：连接两个顶点的线，表示它们之间的关系。
- **权重 (Weight)**：边上附带的数值（距离、耗时、价格等）。带权重的图称为**加权图**，地图导航、网络时延这类场景都靠它建模。
- **路径 (Path) 与路径长度**：从一个顶点走到另一个顶点所经过的顶点序列；路径长度是沿途边的条数（加权图中则是权重之和）。
- **环 (Cycle)**：起点和终点重合的路径（如 A → B → A）。图有没有环，决定了它能不能拓扑排序、遍历时要不要额外防死循环。

### 1.2 图的分类

[width(31,69)]

| 分类方式                      | 描述                                                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **有向图 (Directed Graph)**   | 边是**有方向**的。比如 A 关注了 B，但 B 不一定关注 A（如 Twitter/微博）。边用箭头表示：$A -> B$。              |
| **无向图 (Undirected Graph)** | 边是**没有方向**的，是双向平等的。比如 A 和 B 是微信好友，A 必然也是 B 的好友。边用直线表示：$A - B$。         |
| **加权图 (Weighted Graph)**   | 边上带有**权重（数字）**。比如地图上 A 城市到 B 城市的距离，或者机票的价格。                                   |
| **无权图 (Unweighted Graph)** | 边只是表示“**连接**”这一状态，没有具体的数值大小。                                                             |
| **有向无环图 (DAG)**          | 边有方向、且**不存在任何环**的图。“**无环**”保证了它可以被拓扑排序，是依赖管理、任务调度、编译构建的核心模型。 |
| **稠密图 (Dense Graph)**      | 边数接近顶点数的平方。各顶点之间几乎两两相连，用邻接矩阵存储更划算。                                           |
| **稀疏图 (Sparse Graph)**     | 边数远少于 $V^2$。前端里的依赖图、社交图几乎都是稀疏图，用邻接表最省空间。                                     |
| **完全图 (Complete Graph)**   | 任意两个顶点之间都恰好有一条边。$V$ 个顶点的无向完全图共有 $\frac{V(V-1)}{2}$ 条边。                           |
| **简单图 / 多重图**           | 不含自环和重边的是简单图；允许自环或两顶点间有多条边的是多重图。通常讨论的图默认指简单图。                     |

### 1.3 关键术语速查

[width(38,30,32)]

| 术语                               | 含义                                              | 备注                                               |
| :--------------------------------- | :------------------------------------------------ | :------------------------------------------------- |
| **度 (Degree)**                    | 与一个顶点直接相连的边数                          | 无向图中就等于邻居个数                             |
| **入度 / 出度**                    | 有向图中指向该点的边数 / 由该点指出的边数         | 所有顶点的入度之和 = 出度之和 = 边数 $E$           |
| **路径 (Path) / 路径长度**         | 从 A 到 B 途经的顶点序列 / 沿途边的权重之和       | 无权图里长度就是边的条数                           |
| **环 (Cycle)**                     | 起点与终点重合的路径                              | 自环 (Self-loop) 是顶点指向自己、长度为 1 的特殊环 |
| **重边 (Multi-edge)**              | 两个顶点之间出现的多条边                          | 含自环或重边的图叫多重图                           |
| **连通 / 强连通**                  | 无向图中任意两点可达 / 有向图中任意两点可互相到达 | 否则称为非连通、非强连通                           |
| **连通分量 (Connected Component)** | 无向图里“**最大连通子图**”的个数                  | 可用 DFS / BFS 或并查集统计                        |
| **生成树 (Spanning Tree)**         | 连通图中恰好包含全部顶点和 $V-1$ 条边的子图       | 加权图中总权重最小的叫最小生成树 (MST)             |
| **二分图 (Bipartite)**             | 顶点能分成两个集合，所有边都跨集合                | 等价于图中不存在长度为奇数的环                     |

### 1.4 图在前端的典型应用

图不只是算法题里的抽象概念，前端工程里到处都是它的身影：

[width(15,43,42)]

| 场景                 | 具体落地                                                    | 用到的图模型 / 算法                          |
| :------------------- | :---------------------------------------------------------- | :------------------------------------------- |
| 包管理器依赖解析     | npm / pnpm / yarn 把每个包当顶点、依赖关系当有向边          | 依赖图 + 拓扑排序，并检测循环依赖            |
| 构建工具的模块依赖图 | Vite / Webpack / Rollup 分析 `import`、`require` 得到模块图 | DFS 收集依赖、循环依赖告警、HMR 沿图精确更新 |
| Monorepo 任务编排    | Turborepo / Nx 依据包之间的依赖决定构建顺序                 | DAG + 拓扑排序 + 并行调度                    |
| 状态机 / 工作流      | 订单流转、审批流、游戏关卡切换                              | 有向图（状态机）；DAG 保证不会陷入死循环     |
| 组件依赖图           | Vue / React 的组件树、Hooks 的依赖数组                      | 有向图；响应式系统靠依赖图做精确更新         |
| 社交网络             | 好友关系（无向）、关注关系（有向）                          | 连通分量、六度空间（BFS 求最短路）           |
| 地图与导航           | 路口是顶点、道路是带权边                                    | Dijkstra / A\* / Bellman-Ford                |
| 推荐系统             | 用户-商品二部图、相似用户关系图                             | 图上传播 / 随机游走                          |
| 权限与路由           | 菜单继承、路由嵌套、组织架构                                | 树 / 有向图（DFS 遍历）                      |

## 2. 在计算机中如何表示图？

在 JavaScript 中，我们通常不用节点的 `next` 指针来表示图，因为一个节点可能有成百上千个邻居。最常用的表示方法有两种：

### 2.1 邻接矩阵 (Adjacency Matrix)

使用一个 **二维数组（矩阵）** 来表示。如果顶点 $i$ 和顶点 $j$ 之间有边，则 `matrix[i][j] = 1`（或权重），否则为 `0`。

- **优点**：查找两个特定顶点是否相连极快 $O(1)$。
- **缺点**：**极其浪费空间**。如果是“**稀疏图**”（节点很多但边很少），矩阵里绝大多数都是 0，造成巨大的内存浪费 $O(V^2)$。

```js
// 4 个顶点 A B C D 编号 0~3，边为 A-B、A-C、B-D
const matrix = Array.from({ length: 4 }, () => Array(4).fill(0)) // 4×4 全 0

function addEdge(i, j) {
  matrix[i][j] = 1
  matrix[j][i] = 1 // 无向图：两个方向都标 1，矩阵沿对角线对称
}

addEdge(0, 1) // A-B
addEdge(0, 2) // A-C
addEdge(1, 3) // B-D

//         A  B  C  D
//    A [  0  1  1  0 ]
//    B [  1  0  0  1 ]
//    C [  1  0  0  0 ]
//    D [  0  1  0  0 ]

console.log(matrix[0][3]) // 0 —— A 与 D 不相连，一次寻址就判定
```

### 2.2 邻接表 (Adjacency List) —— (最常用)

使用**字典（或对象/Map）加数组**来表示。字典的键是所有的顶点，值是一个数组，里面存着与该顶点**直接相连的所有邻居**。

- **优点**：非常节省空间，只记录实际存在的边。在前端开发和大多数算法题中，默认使用邻接表。
- **结构示例**：
  ```js
  const graph = {
    A: ['B', 'C', 'D'], // A 和 B, C, D 相连
    B: ['A', 'E'], // B 和 A, E 相连
    C: ['A'],
  }
  ```

> [!TIP]
> 一句话选型：**稠密图用邻接矩阵**（$O(1)$ 判断两点是否相连，$O(V^2)$ 的空间也能接受）；**稀疏图用邻接表**（只存真实存在的边）。前端里几乎全是稀疏图，所以邻接表是默认选择。另外邻接矩阵天然适配 Floyd-Warshall，邻接表天然适配 BFS / DFS / Dijkstra。

## 3. 手写模拟实现：无向图 (基于邻接表)

我们将使用原生的 `Map` 对象来存储图，键为顶点，值为包含邻居顶点的数组。

```js
class Graph {
  constructor() {
    this.vertices = [] // 存储所有顶点的名字（方便遍历）
    this.adjList = new Map() // 使用 Map 存储邻接表
  }

  // --- 1. 添加顶点 (Vertex) ---
  addVertex(v) {
    if (!this.adjList.has(v)) {
      this.vertices.push(v)
      this.adjList.set(v, []) // 初始化该顶点的邻居列表为空数组
    }
  }

  // --- 2. 添加边 (Edge) ---
  // 因为是无向图，所以 A 连接 B 的同时，B 也连接 A
  addEdge(v, w) {
    // 容错：如果顶点不存在，先添加顶点
    if (!this.adjList.has(v)) this.addVertex(v)
    if (!this.adjList.has(w)) this.addVertex(w)

    this.adjList.get(v).push(w) // 将 w 加入 v 的邻居列表
    this.adjList.get(w).push(v) // 将 v 加入 w 的邻居列表
  }

  // --- 辅助方法：打印图 ---
  toString() {
    let s = ''
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i]
      const neighbors = this.adjList.get(vertex)
      s += vertex + ' -> '
      for (let j = 0; j < neighbors.length; j++) {
        s += neighbors[j] + ' '
      }
      s += '\n'
    }
    return s
  }
}

// === 构建测试图 ===
const myGraph = new Graph()
const myVertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
myVertices.forEach(v => myGraph.addVertex(v))

myGraph.addEdge('A', 'B')
myGraph.addEdge('A', 'C')
myGraph.addEdge('A', 'D')
myGraph.addEdge('C', 'D')
myGraph.addEdge('C', 'G')
myGraph.addEdge('D', 'G')
myGraph.addEdge('D', 'H')
myGraph.addEdge('B', 'E')
myGraph.addEdge('B', 'F')
myGraph.addEdge('E', 'I')

console.log('--- 图的结构 ---')
console.log(myGraph.toString())

// A -> B C D
// B -> A E F
// C -> A D G
// D -> A C G H
// E -> B I
// F -> B
// G -> C D
// H -> D
// I -> E
```

## 4. 图的核心算法：遍历 (Traversal)

遍历图最大的难点在于：**图可能有环**。如果不做标记，你的程序会陷入无限死循环。
解决办法是：使用一个数组或字典记录“**已被访问过的顶点 (visited)**”。

### 4.1 广度优先搜索 (BFS - Breadth First Search)

- **策略**：像水波纹一样，从起点开始，先访问距离起点为 1 的所有邻居，再访问距离为 2 的所有邻居。
- **必须借助数据结构**：**队列 (Queue)**。
- **典型应用**：在无权图中寻找**最短路径**（如走迷宫、计算六度空间）。

```js
// --- 广度优先搜索 (接在 Graph 类内部) ---
function bfs(startVertex, callback) {
  if (!this.adjList.has(startVertex)) return

  const visited = {} // 记录访问过的顶点
  const queue = [] // 使用数组模拟队列

  queue.push(startVertex) // 1. 起点入队
  visited[startVertex] = true // 标记起点已访问

  while (queue.length > 0) {
    const currentVertex = queue.shift() // 2. 队头出队

    const neighbors = this.adjList.get(currentVertex) // 获取它的所有邻居

    // 3. 遍历邻居，把没访问过的加入队列排队
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i]
      if (!visited[neighbor]) {
        visited[neighbor] = true // 入队时就标记为已访问，防止重复入队
        queue.push(neighbor)
      }
    }

    // 4. 执行回调逻辑 (处理当前出队节点)
    if (callback) callback(currentVertex)
  }
}

console.log('\n--- BFS (广度优先，从 A 开始) ---')
let bfsResult = []
myGraph.bfs('A', v => bfsResult.push(v))
console.log(bfsResult.join(' -> '))
// 输出: A -> B -> C -> D -> E -> F -> G -> H -> I (按层级铺开)
```

### 4.2 深度优先搜索 (DFS - Depth First Search)

- **策略**：一条路走到黑，撞到死胡同（没有未访问的邻居了）再原路回退，走另一条路。
- **必须借助数据结构**：**系统调用栈（递归）** 或 手动栈 (Stack)。
- **典型应用**：走迷宫找一条可行路径、拓扑排序、检测图中是否有环。

```js
// --- 深度优先搜索 (接在 Graph 类内部) ---
function dfs(startVertex, callback) {
  const visited = {} // 记录访问过的顶点

  // 定义内部的递归函数
  const dfsRecursive = vertex => {
    visited[vertex] = true // 1. 标记当前顶点已访问
    if (callback) callback(vertex) // 2. 处理当前顶点

    const neighbors = this.adjList.get(vertex) // 3. 获取所有邻居

    // 4. 对所有没访问过的邻居，深入递归
    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i]
      if (!visited[neighbor]) {
        dfsRecursive(neighbor)
      }
    }
  }
  dfsRecursive(startVertex)
}

console.log('\n--- DFS (深度优先，从 A 开始) ---')
let dfsResult = []
myGraph.dfs('A', v => dfsResult.push(v))
console.log(dfsResult.join(' -> '))
// 输出: A -> B -> E -> I -> F -> C -> D -> G -> H (一条路走到黑)
```

### 4.3 拓扑排序 (Topological Sorting)

拓扑排序只适用于**有向无环图 (DAG)**：它把所有顶点排成一个线性序列，使得对图中每条边 $u \rightarrow v$，$u$ 都排在 $v$ 的前面。它解决的正是“**谁必须先于谁**”的依赖问题，是包管理、构建编排、任务调度的核心算法。

#### 4.3.1 **Kahn 算法（BFS + 入度）**

先统计每个顶点的入度，把所有入度为 0 的顶点入队；每次出队一个顶点就把它加入结果，并把它的所有邻居入度减 1，减到 0 的邻居再入队。若最终结果里的顶点数少于总数，说明图中存在环。

```js
// Kahn 入度法：numVertices 为顶点数，edges 为 [u, v] 数组，代表一条 u -> v 的边
function topologicalSortKahn(numVertices, edges) {
  // 1. 建邻接表，顺带统计每个顶点的入度
  const adj = Array.from({ length: numVertices }, () => [])
  const inDegree = new Array(numVertices).fill(0)

  for (const [u, v] of edges) {
    adj[u].push(v)
    inDegree[v]++ // v 又多了一条入边
  }

  // 2. 入度为 0 表示没有前置依赖，可以立刻执行，先全部入队
  const queue = []
  for (let i = 0; i < numVertices; i++) {
    if (inDegree[i] === 0) queue.push(i)
  }

  // 3. 每出队一个顶点就「解除」它对邻居的依赖，谁被解锁谁入队
  const order = []
  while (queue.length > 0) {
    const curr = queue.shift()
    order.push(curr) // 能出队就说明依赖已清空，直接定序
    for (const next of adj[curr]) {
      inDegree[next]-- // curr 排好了，next 少一个前置依赖
      if (inDegree[next] === 0) queue.push(next) // 减到 0 就可以执行了
    }
  }

  // 排出的顶点数少于总数，说明有环，不存在拓扑序
  return order.length === numVertices ? order : []
}
```

#### 4.3.2 **DFS 后序法**

对每个顶点做深度优先搜索，在**递归返回的那一刻**把顶点压入结果数组（后序），全部完成后整体反转，就得到了拓扑序。用“**三色标记**”（未访问 / 在递归栈上 / 已完成）可以顺带检测环。

```js
// DFS 后序法：在「递归返回的那一刻」记录顶点，全部走完后整体反转
function topologicalSortDFS(numVertices, edges) {
  // 1. 建邻接表
  const adj = Array.from({ length: numVertices }, () => [])
  for (const [u, v] of edges) adj[u].push(v)

  // 2. 三色标记：0 未访问 / 1 在递归栈上 / 2 已完成
  const state = new Array(numVertices).fill(0)
  const order = []
  let hasCycle = false

  const dfs = u => {
    state[u] = 1 // 入栈，标记为「正在处理」
    for (const v of adj[u]) {
      if (state[v] === 1) {
        hasCycle = true // 又走回了递归栈上的顶点，说明有环
      } else if (state[v] === 0) {
        dfs(v) // 未访问过，继续往里走
      }
    }
    state[u] = 2
    order.push(u) // 后序：等所有邻居处理完再记录自己
  }

  // 3. 图可能不连通，每个未访问的顶点都要发起一次深搜
  for (let i = 0; i < numVertices; i++) {
    if (state[i] === 0) dfs(i)
  }

  // 后序记录的是「依赖在前」的逆序，反转后才是拓扑序
  return hasCycle ? [] : order.reverse()
}

// === 测试：课程 0 是 1、2 的先修课，1 又是 3 的先修课 ===
const courseEdges = [
  [0, 1],
  [0, 2],
  [1, 3],
]
console.log(topologicalSortKahn(4, courseEdges)) // [0, 1, 2, 3]（同层顺序可能不同）
console.log(topologicalSortDFS(4, courseEdges)) // [0, 2, 1, 3]
```

> [!TIP]
> 两种写法都要会：**Kahn** 思路直观、天然能分层（同一批入度为 0 的顶点可并行执行），配合优先队列还能求“**字典序最小的拓扑序**”，检测环只需比较结果数量；**DFS** 一次深搜即可完成，常和别的 DFS 逻辑一起写，但递归太深可能爆栈，检测环要额外维护三色标记。

### 4.4 并查集 (Union-Find)

并查集 (Disjoint Set Union, DSU) 不是遍历算法，而是专门处理“**动态连通性**”的一种数据结构：它维护若干个互不相交的集合，支持两种近乎 $O(1)$ 的操作——`find`（查某个元素属于哪个集合）和 `union`（把两个集合合并）。它和图的交集在于：**判断两个顶点是否连通、无向图是否有环、统计连通分量个数**都能靠它优雅解决。

```js
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i) // 初始时每个元素自成一个集合
    this.size = new Array(n).fill(1) // 集合大小，用于按大小合并
  }

  // 查找根节点 + 路径压缩：一路把沿途节点直接挂到根上
  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x])
    }
    return this.parent[x]
  }

  // 合并两个集合，返回本次是否真的发生了合并
  union(a, b) {
    const rootA = this.find(a)
    const rootB = this.find(b)
    if (rootA === rootB) return false // 本就在同一集合，再连边就会成环

    // 把小的集合挂到大的集合下，避免树退化成链表
    if (this.size[rootA] < this.size[rootB]) {
      this.parent[rootA] = rootB
      this.size[rootB] += this.size[rootA]
    } else {
      this.parent[rootB] = rootA
      this.size[rootA] += this.size[rootB]
    }
    return true
  }

  connected(a, b) {
    return this.find(a) === this.find(b)
  }
}

// === 测试：判断无向图是否有环 ===
const uf = new UnionFind(5)
const undirectedEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0], // 这条边让 0-1-2-3 首尾相接，形成环
]
let foundCycle = false
for (const [u, v] of undirectedEdges) {
  if (!uf.union(u, v)) {
    foundCycle = true // 边的两端已经连通，说明这条边制造了环
    break
  }
}
console.log(foundCycle) // true
```

## 5. 最短路径详解与实现

在讨论最短路径前，我们必须先明确图的类型。因为图是否带有“**权重**”（边上的数值，代表距离或代价），决定了我们必须使用完全不同的算法。

### 5.1 无权图的最短路径：广度优先搜索 (BFS)

如果图中所有的边都没有权重（或者说权重都等于 1），比如走迷宫、求社交网络中的最少朋友跳转次数（六度空间），那么 **广度优先搜索 (BFS)** 是寻找单源最短路径的最优且最简单的算法。

#### 5.1.1 原理解析

BFS 像水波纹一样，一层一层地向外扩散。

- 第 1 层：距离起点为 1 的所有节点。
- 第 2 层：距离起点为 2 的所有节点。
  因此，当你**第一次**碰见目标节点时，你走过的层数，绝对是所有可能路径中最少的。

#### 5.1.2 计算最短跳数及还原路径

为了不仅能求出最短距离，还能**把具体的路径打印出来**，我们需要在 BFS 的过程中，记录每个节点是“**从谁那里走过来的**”（即它的前驱节点，通常用一个 `predecessors` 对象记录）。

```js
// 假设图的结构依然使用邻接表表示
const graph = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B'],
  E: ['B', 'F'],
  F: ['C', 'E'],
}

/**
 * 无权图最短路径 (BFS)
 * @param {Object} graph 邻接表图
 * @param {string} start 起点
 * @param {string} target 终点
 */
function unweightedShortestPath(graph, start, target) {
  const queue = [start]
  const visited = { [start]: true }
  const distances = { [start]: 0 } // 记录到每个节点的最短距离
  const predecessors = { [start]: null } // 记录每个节点的前驱节点，用于还原路径

  while (queue.length > 0) {
    const current = queue.shift()

    // 如果找到目标，提前结束搜索
    if (current === target) break

    //广度优先遍历，直接可以找到指定目标的层级(最短路径),记录路线，反向从终点就能直接找到起点，还原最短路线
    const neighbors = graph[current] || []
    for (let neighbor of neighbors) {
      if (!visited[neighbor]) {
        visited[neighbor] = true
        // 邻居的距离 = 当前节点距离 + 1
        distances[neighbor] = distances[current] + 1
        // 记录邻居是从 current 走过来的
        predecessors[neighbor] = current
        queue.push(neighbor)
      }
    }
  }

  // 如果目标节点未被访问，说明不可达
  if (!visited[target]) return { distance: Infinity, path: [] }

  // 还原路径：从终点开始，顺着前驱节点一路找回起点
  const path = []
  let currNode = target
  while (currNode !== null) {
    path.unshift(currNode) // 每次插到最前面，最后得到 正向路径
    currNode = predecessors[currNode]
  }

  return {
    distance: distances[target],
    path: path,
  }
}

// === 测试 ===
const result = unweightedShortestPath(graph, 'A', 'F')
console.log(`最短距离: ${result.distance}`) // 最短距离: 2
console.log(`最短路径: ${result.path.join(' -> ')}`) // 最短路径: A -> C -> F
```

### 5.2 单源加权图的最短路径(**权重不能为负数**)：Dijkstra (迪杰斯特拉) 算法

如果图的边有权重（比如 A 到 B 距离 10km，B 到 C 距离 5km），BFS 就失效了。因为 BFS 找到的只是**经过边数最少**的路径，但这不一定是**总距离最短**的路径（可能绕远路但每段路很短反而更快）。

此时，我们必须使用著名的 **Dijkstra 算法**（用于计算单源最短路径，且**权重不能为负数**）。

#### 5.2.1 原理解析 (贪心思想)

1. **初始化**：创建一个距离表 `distances`，记录起点到所有其他节点的距离。一开始，起点到自己的距离是 0，到其他所有节点的距离都是无穷大 (Infinity)。
2. **找最近**：在所有**还没被处理过**的节点中，找到当前距离起点**最近**的那个节点。
3. **松弛操作 (Relaxation)**：以这个最近的节点作为跳板，看看能不能通过它，抄近道走到它的邻居那里。如果【起点 -> 当前节点 -> 邻居】的距离，比【起点直接走到邻居】的原有距离还要短，就**更新**这个邻居的最短距离。
4. **标记完成**：把当前节点标记为“**已处理**”，以后不再碰它。
5. **循环**：重复步骤 2 和 3，直到所有可达节点都被处理完。

#### 5.2.2 Dijkstra 算法

```js
// 加权图的邻接表表示 (值为对象，包含邻居节点和权重)
const weightedGraph = {
  A: { B: 2, C: 4 },
  B: { C: 1, D: 7 },
  C: { E: 3 },
  D: { F: 1 },
  E: { D: 2, F: 5 },
  F: {},
}

function dijkstra(graph, start) {
  const distances = {} // 记录起点到各点的最短距离
  const visited = {} // 记录节点是否已被确定了最短距离
  const predecessors = {} // 记录路径

  // 1. 初始化
  for (let vertex in graph) {
    distances[vertex] = Infinity
    predecessors[vertex] = null
  }
  distances[start] = 0

  // 辅助函数：在未访问的节点中，找到当前距离最小的节点
  const getMinDistanceVertex = (dists, visitMap) => {
    let minVertex = null
    let minDistance = Infinity
    for (let vertex in dists) {
      if (!visitMap[vertex] && dists[vertex] <= minDistance) {
        minDistance = dists[vertex]
        minVertex = vertex
      }
    }
    return minVertex
  }

  // 2. 主循环：每次处理一个节点
  let currVertex = getMinDistanceVertex(distances, visited)

  while (currVertex !== null) {
    const distanceToCurr = distances[currVertex]
    const neighbors = graph[currVertex]

    // 3. 遍历当前节点的所有邻居，尝试“松弛”操作
    for (let neighbor in neighbors) {
      const weight = neighbors[neighbor]
      const newDistance = distanceToCurr + weight // 算出一套新路径的距离

      // 如果新路径比旧路径更短，就更新它！
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance
        predecessors[neighbor] = currVertex // 记录是从 currVertex 抄的近道
      }
    }

    // 4. 标记当前节点已处理完毕
    visited[currVertex] = true

    // 5. 寻找下一个距离最小的未访问节点
    currVertex = getMinDistanceVertex(distances, visited)
  }

  return { distances, predecessors }
}

// 辅助函数：根据 predecessors 还原到具体目标节点的路径
function getPath(predecessors, target) {
  const path = []
  let curr = target
  while (curr !== null) {
    path.unshift(curr)
    curr = predecessors[curr]
  }
  return path
}

// === 测试 ===
const resultDijkstra = dijkstra(weightedGraph, 'A')

console.log('A到各点的最短总距离:', resultDijkstra.distances)
// { A: 0, B: 2, C: 3, E: 6, D: 8, F: 9 }
// 注意：A到C的最短距离不是直接走的 4，而是 A->B->C (2+1=3)！算法成功找出了近道。

console.log(
  'A到F的最短路径:',
  getPath(resultDijkstra.predecessors, 'F').join(' -> '),
)
// A -> B -> C -> E -> D -> F
```

### 5.3 单源加权图的最短路径(**权重可以为负数**):Bellman-Ford(贝尔曼-福特)算法

Dijkstra 是**单源最短路径**的王者，但它有个致命弱点：**处理不了负权边**——一旦出现负权，贪心策略就会崩溃。

**Bellman-Ford 算法**正是为此而生：不仅能处理负权边，还能**检测负权回路 (Negative Cycle)**。

#### 5.3.1 核心概念与原理

算法的核心思想是**动态规划 (Dynamic Programming)**，具体操作称为“**松弛 (Relaxation)**”，起点 `S` 经中转点 `U` 到终点 `V`：若 `dist[U] + weight(U, V) < dist[V]`，就把 `dist[V]` 更新为这个更小的值——也就是“**从 `U` 绕一下更近，抄这条近道**”。

> [!WARNING] 如何检测负权回路？
> 若环上所有边的权重之和为负，在环里绕圈总距离就会不断减小、趋近于负无穷，这种情况下根本没有“**最短**”路径可言。

#### 5.3.2 代码实现

遍历所有边时，图通常表示为**边集数组**（Edges Array）而非邻接表——每条边是一个 `{ u, v, weight }` 对象。

```js
/**
 * Bellman-Ford 算法实现
 * @param {string[]} vertices 图的所有顶点数组，如 ['A', 'B', 'C', 'D']
 * @param {Object[]} edges 图的所有边数组，格式为 { u: '起点', v: '终点', weight: 权重 }
 * @param {string} start 起点
 * @returns {Object} 包含最短距离对象和前驱节点对象。如果检测到负权环，抛出错误。
 */
function bellmanFord(vertices, edges, start) {
  const distances = {} // 记录到各点的最短距离
  const predecessors = {} // 记录前驱节点，用于还原路径

  // 1. 初始化：起点距离为 0，其他点距离为正无穷大 (Infinity)
  for (let vertex of vertices) {
    distances[vertex] = Infinity
    predecessors[vertex] = null
  }
  distances[start] = 0

  const V = vertices.length

  // 2. 核心步骤：对所有边进行 V - 1 轮松弛操作
  for (let i = 1; i < V; i++) {
    let hasChanged = false // 优化：如果某一轮没有任何距离被更新，说明已经求得最优解，可以提前结束

    for (let edge of edges) {
      const u = edge.u
      const v = edge.v
      const weight = edge.weight

      // 松弛操作：如果通过 u 走到 v 的距离比原来记录的 v 的距离更短
      // (注意要判断 distances[u] !== Infinity，否则 Infinity + 负数 会出错)
      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight
        predecessors[v] = u // 记录路径
        hasChanged = true
      }
    }

    // 提前退出优化
    if (!hasChanged) break
  }

  // 3. 第 V 轮松弛：检测负权回路 (Negative Cycle)
  for (let edge of edges) {
    const u = edge.u
    const v = edge.v
    const weight = edge.weight

    // 如果还能变得更短，说明图里有负权环！
    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      throw new Error(
        '图中存在负权回路 (Negative Weight Cycle)，无法求出最短路径！',
      )
    }
  }

  return { distances, predecessors }
}

// === 测试用例 ===

const myVertices = ['S', 'A', 'B', 'C', 'D']
const myEdges = [
  { u: 'S', v: 'A', weight: 6 },
  { u: 'S', v: 'B', weight: 7 },
  { u: 'A', v: 'C', weight: 5 },
  { u: 'A', v: 'D', weight: -4 }, // 注意这里有一条负权边
  { u: 'B', v: 'C', weight: -3 }, // 注意这里有一条负权边
  { u: 'B', v: 'D', weight: 9 },
  { u: 'C', v: 'B', weight: -2 }, // 这条边加上 B->C 形成了 B-C-B 环，但 7-3-2 = 2，不是负权环
  { u: 'D', v: 'S', weight: 2 },
  { u: 'D', v: 'C', weight: 7 },
]

try {
  const result = bellmanFord(myVertices, myEdges, 'S')
  console.log('S 到各点的最短距离:', result.distances)
  // 输出: { S: 0, A: 6, B: 2, C: 4, D: 2 }
} catch (error) {
  console.error(error.message)
}

// 辅助函数：还原路径 (和 Dijkstra 一样)
function getPath(predecessors, target) {
  const path = []
  let curr = target
  while (curr !== null) {
    path.unshift(curr)
    curr = predecessors[curr]
  }
  return path
}
```

### 5.4 多源加权图的最短路径：弗洛伊德算法 (Floyd-Warshall)

Dijkstra 解决的是“**单源最短路径**”（从一个固定起点出发，到其他所有点的最短距离），**弗洛伊德算法 (Floyd-Warshall)** 解决的是“**多源最短路径**”——它能一次性算出图中**任意两个节点之间**的最短路径，非常暴力且优雅。

它的核心思想是**动态规划 (Dynamic Programming)**。

#### 5.4.1 代码实现

与 Dijkstra 使用邻接表不同，Floyd 算法天生适合使用**邻接矩阵 (Adjacency Matrix)** 来实现。

```js
/**
 * 弗洛伊德算法 (Floyd-Warshall)
 * @param {number[][]} graph 邻接矩阵表示的加权图。
 * graph[i][j] 代表 i 到 j 的权重。无法直达则为 Infinity。
 * @return {number[][]} 返回所有点对之间的最短距离矩阵
 */
function floydWarshall(graph) {
  const numVertices = graph.length
  // 1. 初始化距离矩阵 dist
  // 深拷贝原始图，避免修改原数据。初始时，两点间最短距离就是它们直接相连的边。
  const dist = []
  for (let i = 0; i < numVertices; i++) {
    dist[i] = []
    for (let j = 0; j < numVertices; j++) {
      dist[i][j] = graph[i][j]
    }
  }

  // 2. 核心算法：三重循环 (极其简洁优美)
  // 第一层循环 k：依次尝试把每一个顶点作为“中转站”
  for (let k = 0; k < numVertices; k++) {
    // 第二层循环 i：遍历所有起点
    for (let i = 0; i < numVertices; i++) {
      // 第三层循环 j：遍历所有终点
      for (let j = 0; j < numVertices; j++) {
        // 状态转移：判断经过中转站 k，会不会让 i 到 j 的距离变得更短？
        // 注意：要防止 Infinity + Infinity 产生的精度问题，通常直接比较即可
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          // 如果发现了捷径，更新 i 到 j 的最短距离
          dist[i][j] = dist[i][k] + dist[k][j]
        }
      }
    }
  }

  return dist
}

// === 测试用例 ===
const INF = Infinity
// 定义一个 4个顶点的图的邻接矩阵
// 节点索引: A=0, B=1, C=2, D=3
const graphMatrix = [
  // A    B    C    D
  [0, 2, 6, 4], // A
  [INF, 0, 3, INF], // B
  [7, INF, 0, 1], // C
  [5, INF, 12, 0], // D
]

const shortestPaths = floydWarshall(graphMatrix)

console.log('任意两点间的最短距离矩阵:')
console.table(shortestPaths)

/*
输出结果解读:
        0 (A)   1 (B)   2 (C)   3 (D)
0 (A)     0       2       5       4
1 (B)     9       0       3       4
2 (C)     6       8       0       1
3 (D)     5       7      10       0

例如：
- A(0) 到 C(2) 原本直达是 6，但通过 A->B->C (2+3=5) 更短，所以矩阵里存的是 5。
- B(1) 到 D(3) 原本不通 (INF)，但通过 B->C->D (3+1=4)，所以矩阵里存的是 4。
*/
```

#### 5.4.2 进阶：如何还原具体的路径？

上面的代码只算出了“**最短距离是多少**”，但现实中往往还需要知道“**具体该怎么走**”——那就要再引入一个**路径记录矩阵 `path`**。

```js
function floydWarshallWithPath(graph) {
  const numVertices = graph.length
  const dist = []
  const path = [] // 用于记录路径

  // 1. 初始化
  for (let i = 0; i < numVertices; i++) {
    dist[i] = []
    path[i] = []
    for (let j = 0; j < numVertices; j++) {
      dist[i][j] = graph[i][j]
      // 初始时，如果 i 和 j 能直达，那么 i 到 j 的中转点就是 j 本身
      if (graph[i][j] !== Infinity && i !== j) {
        path[i][j] = j
      } else {
        path[i][j] = null
      }
    }
  }

  // 2. 核心三重循环
  for (let k = 0; k < numVertices; k++) {
    for (let i = 0; i < numVertices; i++) {
      for (let j = 0; j < numVertices; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j]
          // 关键点：如果经过 k 更近，那么从 i 去 j 的第一步，其实应该走向【从 i 去 k 的第一步】
          path[i][j] = path[i][k]
        }
      }
    }
  }

  return { dist, path }
}

// 辅助函数：根据 path 矩阵打印从 start 到 target 的路径
function printPath(pathMatrix, start, target) {
  if (pathMatrix[start][target] === null) return '无路径可达'

  let route = [start]
  let curr = start
  while (curr !== target) {
    curr = pathMatrix[curr][target]
    route.push(curr)
  }
  return route.join(' -> ')
}

// 依然使用上面的 graphMatrix 测试
const result = floydWarshallWithPath(graphMatrix)
console.log('\nA(0) 到 C(2) 的最短路径:', printPath(result.path, 0, 2)) // 输出: 0 -> 1 -> 2
```

## 6. 常见问题 (FAQ) 与算法面试高频考点

### 6.1 怎么判断一个无向图中是否有“**环**”？

- **解法 (DFS)**：深度优先遍历时，除了记录节点是否 `visited`，还要把它的 **“父亲节点”（从谁走到它的）** 作为参数传下去。
- 遍历邻居时，若某个邻居**已被 `visited` 且不是我的父亲节点**，说明撞到了以前走过的路，形成了环。

```js
// 邻接表表示的无向图，判断有无环
function hasCycle(numVertices, edges) {
  const adj = Array.from({ length: numVertices }, () => [])
  for (const [u, v] of edges) {
    adj[u].push(v)
    adj[v].push(u) // 无向图：两个方向都要连
  }

  const visited = new Array(numVertices).fill(false)

  // parent 是「从谁走到 u 的」，用来排除回头看的这条边
  const dfs = (u, parent) => {
    visited[u] = true
    for (const v of adj[u]) {
      if (!visited[v]) {
        if (dfs(v, u)) return true // 没走过就继续深入，u 成为下一层的 parent
      } else if (v !== parent) {
        return true // 已访问又不是父亲 —— 撞上老路，成环
      }
    }
    return false
  }

  // 图可能不连通，每个未访问的顶点都要发起一次 DFS
  for (let i = 0; i < numVertices; i++) {
    if (!visited[i] && dfs(i, -1)) return true
  }
  return false
}

const triangle = [
  [0, 1],
  [1, 2],
  [2, 0],
]
const chain = [
  [0, 1],
  [1, 2],
]

console.log(hasCycle(3, triangle)) // true，0-1-2-0 成环
console.log(hasCycle(3, chain)) // false，一条链
```

### 6.2 图的遍历时间复杂度是多少？

- 用**邻接表**表示图时，BFS 和 DFS 的时间复杂度都是 **$O(V + E)$**（$V$ 为顶点数，$E$ 为边数）：每个顶点访问一次，每条边也探索一次。

### 6.3 为什么 Dijkstra 不能处理负权边？

- Dijkstra 的贪心前提是：**每次取出当前距离最小的顶点，就断定它的最短距离已最终确定**，之后不再更新。
- 负权边会打破这个前提，让“**已确定**”的顶点还能被改小。例如 A→B=1、A→C=5、C→B=-10：Dijkstra 会先确定 B=1，但走 A→C→B 得到 -5，更短，贪心就此失效。
- **结论**：带负权边时用 **Bellman-Ford**（还能检测负权环）；需要多源最短路则用 **Floyd-Warshall**。

### 6.4 A\* 算法和 Dijkstra 有什么区别？

- **Dijkstra**：按“**起点到当前顶点的实际代价**” $g(n)$ 排序取最小，像水波一样向四周均匀扩散，保证最优，但会探索大量与终点无关的顶点。
- **A\***：按 $f(n) = g(n) + h(n)$ 排序，其中 $h(n)$ 是“**当前顶点到终点的启发式估计**”(如欧氏距离、曼哈顿距离)。只要 $h(n)$ 不高估真实距离（可采纳），A\* 仍能保证最优，但搜索方向被“**拉**”向终点，扩展的顶点更少。
- **关系**：当 $h(n) \equiv 0$ 时，A\* 就退化成 Dijkstra。地图导航、游戏寻路几乎都用 A\*。

### 6.5 最小生成树 (MST)：Prim 和 Kruskal 有什么区别？

- **最小生成树**：在带权连通无向图中，选出 $V-1$ 条边把所有顶点连通，且总权重最小。两种算法都基于贪心的“**切分定理**”。
- **Kruskal**：把**所有边按权重从小到大排序**，依次尝试加入，用**并查集**判断加入后是否会成环，不成环就收下，收满 $V-1$ 条为止。复杂度 $O(E \log E)$，**适合稀疏图**。
- **Prim**：从一个顶点出发，每次在“**已选顶点集合**”与“**未选顶点集合**”之间选一条**权重最小的边**扩展进来（思路很像 Dijkstra）。用优先队列实现为 $O(E \log V)$，**适合稠密图**。

### 6.6 有向图怎么判断是否有环？

- **DFS 三色标记**：顶点有“**未访问 / 在递归栈上 / 已完成**”三种状态。若在 DFS 中遇到一个**正处于递归栈上**的邻居，说明绕回了自己，存在环。
- **Kahn 拓扑排序**：跑完后若排出的顶点数小于总数，说明剩下的顶点互相成环。
- **无向图**不能用三色法，要用并查集或“**DFS 记录父亲节点**”。

### 6.7 邻接矩阵和邻接表该怎么选？

[width(24,32,44)]

| 维度               | 邻接矩阵                                   | 邻接表                                         |
| :----------------- | :----------------------------------------- | :--------------------------------------------- |
| 空间               | $O(V^2)$，稀疏图下极度浪费                 | $O(V + E)$，只存真实存在的边                   |
| 判断两点是否相连   | $O(1)$                                     | $O(\deg)$（可用 `Set` 优化到平均 $O(1)$）      |
| 遍历某点的所有邻居 | $O(V)$，要扫一整行                         | $O(\deg)$，只访问真实邻居                      |
| 适合               | 稠密图、顶点少、需频繁判边、Floyd-Warshall | 稀疏图、BFS / DFS / Dijkstra、绝大多数工程场景 |
| 前端常见度         | 低                                         | 高（依赖图、社交图都是稀疏图）                 |

- **结论**：除非顶点数很小又需要频繁 $O(1)$ 判边，否则默认选**邻接表**。

### 6.8 如何求一个图的连通分量个数？

- **DFS / BFS**：从任意未访问顶点出发做一次遍历，能到达的所有顶点属于同一个连通分量；换一个未访问顶点再遍历，计数器加一，直到所有顶点都被标记。复杂度 $O(V + E)$。
- **并查集**：把所有边都 `union` 一遍，最后统计有多少个不同的根节点（或在 `union` 时维护计数器）即可，适合边会动态增加、需要反复查询的场景。
