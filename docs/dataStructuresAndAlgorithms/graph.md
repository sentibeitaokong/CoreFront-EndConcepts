---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# 图 (Graph)

## 1. 核心概念与特性 

**图 (Graph)** 是一种极其灵活且复杂的**非线性**数据结构。你可以把它理解为“升级版”的树。在树中，子节点不能互相连接，也不能指回父节点（不能有环）；而在图中，**任何节点都可以与任何其他节点相连**。

图是网络世界的基石，互联网、社交网络、地图导航，底层全是图。

### 1.1 核心组成部分
*   **顶点 (Vertex/Node)**：图中的数据元素（比如社交网络中的一个人，地图上的一个路口）。
*   **边 (Edge)**：连接两个顶点的线，表示它们之间的关系。

### 1.2 图的分类
| 分类方式 | 描述 |
| :--- | :--- |
| **有向图 (Directed Graph)** | 边是**有方向**的。比如 A 关注了 B，但 B 不一定关注 A（如 Twitter/微博）。边用箭头表示：$A \rightarrow B$。 |
| **无向图 (Undirected Graph)** | 边是**没有方向**的，是双向平等的。比如 A 和 B 是微信好友，A 必然也是 B 的好友。边用直线表示：$A - B$。 |
| **加权图 (Weighted Graph)** | 边上带有**权重（数字）**。比如地图上 A 城市到 B 城市的距离，或者机票的价格。 |
| **无权图 (Unweighted Graph)** | 边只是表示“连接”这一状态，没有具体的数值大小。 |

## 2. 在计算机中如何表示图？

在 JavaScript 中，我们通常不用节点的 `next` 指针来表示图，因为一个节点可能有成百上千个邻居。最常用的表示方法有两种：

### 2.1 邻接矩阵 (Adjacency Matrix)
使用一个**二维数组（矩阵）**来表示。如果顶点 $i$ 和顶点 $j$ 之间有边，则 `matrix[i][j] = 1`（或权重），否则为 `0`。
*   **优点**：查找两个特定顶点是否相连极快 $O(1)$。
*   **缺点**：**极其浪费空间**。如果是“稀疏图”（节点很多但边很少），矩阵里绝大多数都是 0，造成巨大的内存浪费 $O(V^2)$。

### 2.2 邻接表 (Adjacency List) —— (最常用)
使用**字典（或对象/Map）加数组**来表示。字典的键是所有的顶点，值是一个数组，里面存着与该顶点**直接相连的所有邻居**。
*   **优点**：非常节省空间，只记录实际存在的边。在前端开发和大多数算法题中，默认使用邻接表。
*   **结构示例**：
    ```js
    const graph = {
      'A': ['B', 'C', 'D'], // A 和 B, C, D 相连
      'B': ['A', 'E'],      // B 和 A, E 相连
      'C': ['A']
    };
    ```

## 3. 手写模拟实现：无向图 (基于邻接表)

我们将使用原生的 `Map` 对象来存储图，键为顶点，值为包含邻居顶点的数组。

```js
class Graph {
  constructor() {
    this.vertices = []; // 存储所有顶点的名字（方便遍历）
    this.adjList = new Map(); // 使用 Map 存储邻接表
  }

  // --- 1. 添加顶点 (Vertex) ---
  addVertex(v) {
    if (!this.adjList.has(v)) {
      this.vertices.push(v);
      this.adjList.set(v, []); // 初始化该顶点的邻居列表为空数组
    }
  }

  // --- 2. 添加边 (Edge) ---
  // 因为是无向图，所以 A 连接 B 的同时，B 也连接 A
  addEdge(v, w) {
    // 容错：如果顶点不存在，先添加顶点
    if (!this.adjList.has(v)) this.addVertex(v);
    if (!this.adjList.has(w)) this.addVertex(w);

    this.adjList.get(v).push(w); // 将 w 加入 v 的邻居列表
    this.adjList.get(w).push(v); // 将 v 加入 w 的邻居列表
  }

  // --- 辅助方法：打印图 ---
  toString() {
    let s = '';
    for (let i = 0; i < this.vertices.length; i++) {
      const vertex = this.vertices[i];
      const neighbors = this.adjList.get(vertex);
      s += vertex + ' -> ';
      for (let j = 0; j < neighbors.length; j++) {
        s += neighbors[j] + ' ';
      }
      s += '\n';
    }
    return s;
  }
}

// === 构建测试图 ===
const myGraph = new Graph();
const myVertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
myVertices.forEach(v => myGraph.addVertex(v));

myGraph.addEdge('A', 'B');
myGraph.addEdge('A', 'C');
myGraph.addEdge('A', 'D');
myGraph.addEdge('C', 'D');
myGraph.addEdge('C', 'G');
myGraph.addEdge('D', 'G');
myGraph.addEdge('D', 'H');
myGraph.addEdge('B', 'E');
myGraph.addEdge('B', 'F');
myGraph.addEdge('E', 'I');

console.log('--- 图的结构 ---');
console.log(myGraph.toString());

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
解决办法是：使用一个数组或字典记录**“已被访问过的顶点 (visited)”**。

在刚才的 `Graph` 类中，我们加入 BFS 和 DFS 算法：

### 4.1 广度优先搜索 (BFS - Breadth First Search)
*   **策略**：像水波纹一样，从起点开始，先访问距离起点为 1 的所有邻居，再访问距离为 2 的所有邻居。
*   **必须借助数据结构**：**队列 (Queue)**。
*   **典型应用**：在无权图中寻找**最短路径**（如走迷宫、计算六度空间）。

```js
  // --- 广度优先搜索 (接在 Graph 类内部) ---
  bfs(startVertex, callback) {
    if (!this.adjList.has(startVertex)) return;

    const visited = {}; // 记录访问过的顶点
    const queue = [];   // 使用数组模拟队列

    queue.push(startVertex);   // 1. 起点入队
    visited[startVertex] = true; // 标记起点已访问

    while (queue.length > 0) {
      const currentVertex = queue.shift(); // 2. 队头出队
      
      const neighbors = this.adjList.get(currentVertex); // 获取它的所有邻居

      // 3. 遍历邻居，把没访问过的加入队列排队
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (!visited[neighbor]) {
          visited[neighbor] = true; // 入队时就标记为已访问，防止重复入队
          queue.push(neighbor);
        }
      }

      // 4. 执行回调逻辑 (处理当前出队节点)
      if (callback) callback(currentVertex); 
    }
  }
```

### 4.2 深度优先搜索 (DFS - Depth First Search)
*   **策略**：一条路走到黑，撞到死胡同（没有未访问的邻居了）再原路回退，走另一条路。
*   **必须借助数据结构**：**系统调用栈（递归）** 或 手动栈 (Stack)。
*   **典型应用**：走迷宫找一条可行路径、拓扑排序、检测图中是否有环。

```js
  // --- 深度优先搜索 (接在 Graph 类内部) ---
  dfs(startVertex, callback) {
    const visited = {}; // 记录访问过的顶点

    // 定义内部的递归函数
    const dfsRecursive = (vertex) => {
      visited[vertex] = true; // 1. 标记当前顶点已访问
      if (callback) callback(vertex); // 2. 处理当前顶点

      const neighbors = this.adjList.get(vertex); // 3. 获取所有邻居
      
      // 4. 对所有没访问过的邻居，深入递归
      for (let i = 0; i < neighbors.length; i++) {
        const neighbor = neighbors[i];
        if (!visited[neighbor]) {
          dfsRecursive(neighbor);
        }
      }
    };

    dfsRecursive(startVertex);
  }
```

**测试遍历结果：**
```js
// 基于前面构建的 myGraph
console.log('\n--- BFS (广度优先，从 A 开始) ---');
let bfsResult = [];
myGraph.bfs('A', (v) => bfsResult.push(v));
console.log(bfsResult.join(' -> ')); 
// 输出: A -> B -> C -> D -> E -> F -> G -> H -> I (按层级铺开)

console.log('\n--- DFS (深度优先，从 A 开始) ---');
let dfsResult = [];
myGraph.dfs('A', (v) => dfsResult.push(v));
console.log(dfsResult.join(' -> ')); 
// 输出: A -> B -> E -> I -> F -> C -> D -> G -> H (一条路走到黑)
```

## 5. 最短路径详解与实现

在讨论最短路径前，我们必须先明确图的类型。因为图是否带有“权重”（边上的数值，代表距离或代价），决定了我们必须使用完全不同的算法。

### 5.1 无权图的最短路径：广度优先搜索 (BFS)

如果图中所有的边都没有权重（或者说权重都等于 1），比如走迷宫、求社交网络中的最少朋友跳转次数（六度空间），那么 **广度优先搜索 (BFS)** 是寻找单源最短路径的最优且最简单的算法。

#### 1. 原理解析
BFS 像水波纹一样，一层一层地向外扩散。
*   第 1 层：距离起点为 1 的所有节点。
*   第 2 层：距离起点为 2 的所有节点。
    因此，当你**第一次**碰见目标节点时，你走过的层数，绝对是所有可能路径中最少的。

#### 2. JS 代码实现 (计算最短跳数及还原路径)

为了不仅能求出最短距离，还能**把具体的路径打印出来**，我们需要在 BFS 的过程中，记录每个节点是“从谁那里走过来的”（即它的前驱节点，通常用一个 `predecessors` 对象记录）。

```js
// 假设图的结构依然使用邻接表表示
const graph = {
  'A': ['B', 'C'],
  'B': ['A', 'D', 'E'],
  'C': ['A', 'F'],
  'D': ['B'],
  'E': ['B', 'F'],
  'F': ['C', 'E']
};

/**
 * 无权图最短路径 (BFS)
 * @param {Object} graph 邻接表图
 * @param {string} start 起点
 * @param {string} target 终点
 */
function unweightedShortestPath(graph, start, target) {
  const queue = [start];
  const visited = { [start]: true };
  const distances = { [start]: 0 };     // 记录到每个节点的最短距离
  const predecessors = { [start]: null }; // 记录每个节点的前驱节点，用于还原路径

  while (queue.length > 0) {
    const current = queue.shift();

    // 如果找到目标，提前结束搜索
    if (current === target) break;

    //广度优先遍历，直接可以找到指定目标的层级(最短路径),记录路线，反向从终点就能直接找到起点，还原最短路线
    const neighbors = graph[current] || [];
    for (let neighbor of neighbors) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        // 邻居的距离 = 当前节点距离 + 1
        distances[neighbor] = distances[current] + 1;
        // 记录邻居是从 current 走过来的
        predecessors[neighbor] = current; 
        queue.push(neighbor);
      }
    }
  }

  // 如果目标节点未被访问，说明不可达
  if (!visited[target]) return { distance: Infinity, path: [] };

  // 还原路径：从终点开始，顺着前驱节点一路找回起点
  const path = [];
  let currNode = target;
  while (currNode !== null) {
    path.unshift(currNode); // 每次插到最前面，最后得到 正向路径
    currNode = predecessors[currNode];
  }

  return {
    distance: distances[target],
    path: path
  };
}

// === 测试 ===
const result = unweightedShortestPath(graph, 'A', 'F');
console.log(`最短距离: ${result.distance}`); // 最短距离: 2
console.log(`最短路径: ${result.path.join(' -> ')}`); // 最短路径: A -> C -> F
```

### 5.2 单源加权图的最短路径(**权重不能为负数**)：Dijkstra (迪杰斯特拉) 算法 

如果图的边有权重（比如 A 到 B 距离 10km，B 到 C 距离 5km），BFS 就失效了。因为 BFS 找到的只是**经过边数最少**的路径，但这不一定是**总距离最短**的路径（可能绕远路但每段路很短反而更快）。

此时，我们必须使用著名的 **Dijkstra 算法**（用于计算单源最短路径，且**权重不能为负数**）。

#### 1. 原理解析 (贪心思想)
1.  **初始化**：创建一个距离表 `distances`，记录起点到所有其他节点的距离。一开始，起点到自己的距离是 0，到其他所有节点的距离都是无穷大 (Infinity)。
2.  **找最近**：在所有**还没被处理过**的节点中，找到当前距离起点**最近**的那个节点。
3.  **松弛操作 (Relaxation)**：以这个最近的节点作为跳板，看看能不能通过它，抄近道走到它的邻居那里。如果【起点 -> 当前节点 -> 邻居】的距离，比【起点直接走到邻居】的原有距离还要短，就**更新**这个邻居的最短距离。
4.  **标记完成**：把当前节点标记为“已处理”，以后不再碰它。
5.  **循环**：重复步骤 2 和 3，直到所有可达节点都被处理完。

#### 2. JS 代码实现 (Dijkstra 算法)

```js
// 加权图的邻接表表示 (值为对象，包含邻居节点和权重)
const weightedGraph = {
  'A': { 'B': 2, 'C': 4 },
  'B': { 'C': 1, 'D': 7 },
  'C': { 'E': 3 },
  'D': { 'F': 1 },
  'E': { 'D': 2, 'F': 5 },
  'F': {}
};

function dijkstra(graph, start) {
  const distances = {}; // 记录起点到各点的最短距离
  const visited = {};   // 记录节点是否已被确定了最短距离
  const predecessors = {}; // 记录路径

  // 1. 初始化
  for (let vertex in graph) {
    distances[vertex] = Infinity;
    predecessors[vertex] = null;
  }
  distances[start] = 0;

  // 辅助函数：在未访问的节点中，找到当前距离最小的节点
  const getMinDistanceVertex = (dists, visitMap) => {
    let minVertex = null;
    let minDistance = Infinity;
    for (let vertex in dists) {
      if (!visitMap[vertex] && dists[vertex] <= minDistance) {
        minDistance = dists[vertex];
        minVertex = vertex;
      }
    }
    return minVertex;
  };

  // 2. 主循环：每次处理一个节点
  let currVertex = getMinDistanceVertex(distances, visited);

  while (currVertex !== null) {
    const distanceToCurr = distances[currVertex];
    const neighbors = graph[currVertex];

    // 3. 遍历当前节点的所有邻居，尝试“松弛”操作  
    for (let neighbor in neighbors) {
      const weight = neighbors[neighbor];
      const newDistance = distanceToCurr + weight; // 算出一套新路径的距离

      // 如果新路径比旧路径更短，就更新它！
      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        predecessors[neighbor] = currVertex; // 记录是从 currVertex 抄的近道
      }
    }

    // 4. 标记当前节点已处理完毕
    visited[currVertex] = true;

    // 5. 寻找下一个距离最小的未访问节点
    currVertex = getMinDistanceVertex(distances, visited);
  }

  return { distances, predecessors };
}

// 辅助函数：根据 predecessors 还原到具体目标节点的路径
function getPath(predecessors, target) {
  const path = [];
  let curr = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = predecessors[curr];
  }
  return path;
}

// === 测试 ===
const resultDijkstra = dijkstra(weightedGraph, 'A');

console.log('A到各点的最短总距离:', resultDijkstra.distances); 
// { A: 0, B: 2, C: 3, E: 6, D: 8, F: 9 }
// 注意：A到C的最短距离不是直接走的 4，而是 A->B->C (2+1=3)！算法成功找出了近道。

console.log('A到F的最短路径:', getPath(resultDijkstra.predecessors, 'F').join(' -> '));
// A -> B -> C -> E -> D -> F
```

### 5.3 单源加权图的最短路径(**权重可以为负数**):Bellman-Ford（贝尔曼-福特） 算法详解与实现

在解决“单源最短路径”问题时，Dijkstra 算法是绝对的王者，但它有一个致命的弱点：**无法处理带有负数权重的边**。一旦图中出现负权边，Dijkstra 的贪心策略就会崩溃。

**Bellman-Ford 算法**就是为了解决这个问题而诞生的。它不仅能处理带有负数权重的边，还能**检测图中是否存在“负权回路 (Negative Cycle)”**。

#### 1.核心概念与原理

Bellman-Ford 算法的核心思想是**动态规划 (Dynamic Programming)**，具体操作称为**“松弛 (Relaxation)”**。

##### 什么是“松弛操作”？
假设我们有三个点：起点 `S`，中转点 `U`，终点 `V`。
*   已知 `S` 到 `V` 的当前最短距离为 `dist[V]`。
*   已知 `S` 到 `U` 的最短距离为 `dist[U]`，并且 `U` 到 `V` 有一条边，权重为 `weight(U, V)`。
*   **松弛**：如果 `dist[U] + weight(U, V) < dist[V]`，我们就把 `dist[V]` 更新为这个更小的值。意思是：“通过 `U` 中转去 `V`，比原来去 `V` 的路更近，我抄这条近道”。

##### 算法的“暴力美学”
Dijkstra 算法每次都要精挑细选找最近的节点去松弛，而 Bellman-Ford 的做法非常简单粗暴：
**把图中所有的边，不论三七二十一，全部拿出来尝试松弛一遍。**

一遍肯定不够，那要松弛几遍呢？
答案是：**$V-1$ 遍**（其中 $V$ 是图的顶点总数）。
*   **原理解释**：在一个包含 $V$ 个顶点的图中，任意两个顶点之间的**最短简单路径**（不包含环的路径）最多只包含 **$V-1$ 条边**。每次我们把所有边松弛一遍，实际上就是把最短路径的长度向前推进了一条边。所以，最多进行 $V-1$ 轮完整的松弛操作，就能找出所有节点的最短路径。

##### 如何检测负权回路？
如果图中存在一个环，且环上所有边的权重加起来是负数，那么在这个环里绕圈，总距离就会不断减小，趋近于负无穷大。这种情况下，是没有“最短”路径的。

Bellman-Ford 的绝技在于：在完成了规定的 $V-1$ 轮松弛后，**再强行进行第 $V$ 轮松弛**。
如果第 $V$ 轮还能成功更新某个距离，说明图中绝对存在负权回路！

#### 2. JavaScript 代码实现

为了方便遍历所有的边，通常我们会将图表示为**边集数组**（Edges Array），而不是邻接表。
每条边是一个对象：`{ source: 'u', target: 'v', weight: w }`。

```js
/**
 * Bellman-Ford 算法实现
 * @param {string[]} vertices 图的所有顶点数组，如 ['A', 'B', 'C', 'D']
 * @param {Object[]} edges 图的所有边数组，格式为 { u: '起点', v: '终点', weight: 权重 }
 * @param {string} start 起点
 * @returns {Object} 包含最短距离对象和前驱节点对象。如果检测到负权环，抛出错误。
 */
function bellmanFord(vertices, edges, start) {
  const distances = {};    // 记录到各点的最短距离
  const predecessors = {}; // 记录前驱节点，用于还原路径

  // 1. 初始化：起点距离为 0，其他点距离为正无穷大 (Infinity)
  for (let vertex of vertices) {
    distances[vertex] = Infinity;
    predecessors[vertex] = null;
  }
  distances[start] = 0;

  const V = vertices.length;

  // 2. 核心步骤：对所有边进行 V - 1 轮松弛操作
  for (let i = 1; i < V; i++) {
    let hasChanged = false; // 优化：如果某一轮没有任何距离被更新，说明已经求得最优解，可以提前结束

    for (let edge of edges) {
      const u = edge.u;
      const v = edge.v;
      const weight = edge.weight;

      // 松弛操作：如果通过 u 走到 v 的距离比原来记录的 v 的距离更短
      // (注意要判断 distances[u] !== Infinity，否则 Infinity + 负数 会出错)
      if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        predecessors[v] = u; // 记录路径
        hasChanged = true;
      }
    }

    // 提前退出优化
    if (!hasChanged) break;
  }

  // 3. 第 V 轮松弛：检测负权回路 (Negative Cycle)
  for (let edge of edges) {
    const u = edge.u;
    const v = edge.v;
    const weight = edge.weight;
    
    // 如果还能变得更短，说明图里有负权环！
    if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
      throw new Error("图中存在负权回路 (Negative Weight Cycle)，无法求出最短路径！");
    }
  }

  return { distances, predecessors };
}

// === 测试用例 ===

const myVertices = ['S', 'A', 'B', 'C', 'D'];
const myEdges = [
  { u: 'S', v: 'A', weight: 6 },
  { u: 'S', v: 'B', weight: 7 },
  { u: 'A', v: 'C', weight: 5 },
  { u: 'A', v: 'D', weight: -4 }, // 注意这里有一条负权边
  { u: 'B', v: 'C', weight: -3 }, // 注意这里有一条负权边
  { u: 'B', v: 'D', weight: 9 },
  { u: 'C', v: 'B', weight: -2 }, // 这条边加上 B->C 形成了 B-C-B 环，但 7-3-2 = 2，不是负权环
  { u: 'D', v: 'S', weight: 2 },
  { u: 'D', v: 'C', weight: 7 }
];

try {
  const result = bellmanFord(myVertices, myEdges, 'S');
  console.log('S 到各点的最短距离:', result.distances);
  // 输出: { S: 0, A: 6, B: 2, C: 4, D: 2 }
  
} catch (error) {
  console.error(error.message);
}

// 辅助函数：还原路径 (和 Dijkstra 一样)
function getPath(predecessors, target) {
  const path = [];
  let curr = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = predecessors[curr];
  }
  return path;
}
```

### 5.4 多源加权图的最短路径：弗洛伊德算法 (Floyd-Warshall)

**Dijkstra 算法**，它解决的是“**单源最短路径**”问题（即从*一个固定起点*到其他所有点的最短距离），而 **弗洛伊德算法 (Floyd-Warshall)** 解决的是“**多源最短路径**”问题。它非常暴力且优雅，能一次性计算出图中**任意两个节点之间**的最短路径。

**算法核心思想：动态规划 (DP)**

弗洛伊德算法的核心是一种极其精妙的**动态规划 (Dynamic Programming)** 思想。

#### 1. JavaScript 代码实现

与 Dijkstra 使用邻接表不同，Floyd 算法天生适合使用**邻接矩阵 (Adjacency Matrix)** 来实现。

```js
/**
 * 弗洛伊德算法 (Floyd-Warshall)
 * @param {number[][]} graph 邻接矩阵表示的加权图。
 *                           graph[i][j] 代表 i 到 j 的权重。无法直达则为 Infinity。
 * @return {number[][]} 返回所有点对之间的最短距离矩阵
 */
function floydWarshall(graph) {
  const numVertices = graph.length;
  // 1. 初始化距离矩阵 dist
  // 深拷贝原始图，避免修改原数据。初始时，两点间最短距离就是它们直接相连的边。
  const dist = [];
  for (let i = 0; i < numVertices; i++) {
    dist[i] = [];
    for (let j = 0; j < numVertices; j++) {
      dist[i][j] = graph[i][j];
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
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }

  return dist;
}

// === 测试用例 ===
const INF = Infinity;
// 定义一个 4个顶点的图的邻接矩阵
// 节点索引: A=0, B=1, C=2, D=3
const graphMatrix = [
  // A    B    C    D
  [  0,   2,   6,   4],  // A
  [INF,   0,   3, INF],  // B
  [  7, INF,   0,   1],  // C
  [  5, INF,  12,   0]   // D
];

const shortestPaths = floydWarshall(graphMatrix);

console.log("任意两点间的最短距离矩阵:");
console.table(shortestPaths);

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


####  2. 进阶：如何还原具体的路径？

上面的代码只算出了“最短距离是多少”，但现实中我们往往需要知道“具体该怎么走”。
为此，我们需要引入一个**路径记录矩阵 `path`**。

```js
function floydWarshallWithPath(graph) {
  const numVertices = graph.length;
  const dist = [];
  const path = []; // 用于记录路径

  // 1. 初始化
  for (let i = 0; i < numVertices; i++) {
    dist[i] = [];
    path[i] = [];
    for (let j = 0; j < numVertices; j++) {
      dist[i][j] = graph[i][j];
      // 初始时，如果 i 和 j 能直达，那么 i 到 j 的中转点就是 j 本身
      if (graph[i][j] !== Infinity && i !== j) {
        path[i][j] = j; 
      } else {
        path[i][j] = null;
      }
    }
  }

  // 2. 核心三重循环
  for (let k = 0; k < numVertices; k++) {
    for (let i = 0; i < numVertices; i++) {
      for (let j = 0; j < numVertices; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          // 关键点：如果经过 k 更近，那么从 i 去 j 的第一步，其实应该走向【从 i 去 k 的第一步】
          path[i][j] = path[i][k];
        }
      }
    }
  }

  return { dist, path };
}

// 辅助函数：根据 path 矩阵打印从 start 到 target 的路径
function printPath(pathMatrix, start, target) {
  if (pathMatrix[start][target] === null) return "无路径可达";
  
  let route = [start];
  let curr = start;
  while (curr !== target) {
    curr = pathMatrix[curr][target];
    route.push(curr);
  }
  return route.join(' -> ');
}

// 依然使用上面的 graphMatrix 测试
const result = floydWarshallWithPath(graphMatrix);
console.log("\nA(0) 到 C(2) 的最短路径:", printPath(result.path, 0, 2)); // 输出: 0 -> 1 -> 2
```

## 6. 常见问题 (FAQ) 与算法面试高频考点

### 6.1 怎么判断一个无向图中是否有“环”？
*   **解法 (DFS)**：在深度优先遍历时，除了记录当前节点是否被 `visited`，还要把它的**“父亲节点”（是从谁走到它的）**作为参数传递下去。
*   如果在遍历邻居时，发现某个邻居**已经被 `visited` 了，并且这个邻居不是我的父亲节点**，这就说明我走着走着撞到了以前走过的路，这就形成了一个环！

### 6.2 什么是拓扑排序 (Topological Sorting)？
*   **适用范围**：只能用于**有向无环图 (DAG)**。
*   **通俗解释**：大学里选课，必须先修完《高数》（前置条件），才能修《物理》。拓扑排序就是根据这些依赖关系，给出一份线性的修课顺序表，保证在修任何一门课之前，它的前置课都已经修完了。
*   **解法**：通常使用统计**“入度 (In-degree)”**的方法配合 BFS 队列实现（入度为 0 的节点先入队）。

### 6.3 BFS 为什么能找到无权图的最短路径？
*   因为 BFS 是“按层”向外扩展的。第一批从队列里出来的节点，距离起点的边数必然是 1；第二批出来的是 2。所以，当你**第一次**遍历到目标节点时，你走过的路径长度绝对是所有路径中最短的（因为更长的路径还没从队列里出来呢）。

### 6.4 图的遍历时间复杂度是多少？
*   使用**邻接表**表示图时，BFS 和 DFS 的时间复杂度都是 **$O(V + E)$**，其中 $V$ 是顶点数 (Vertices)，$E$ 是边数 (Edges)。因为算法会访问每个顶点一次，并且会沿着每一条边探索一次。