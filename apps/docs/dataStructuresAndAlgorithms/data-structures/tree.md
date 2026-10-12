# 树 (Tree)

## 1. 核心概念与特性

**树 (Tree)** 是一种**非线性**的数据结构，用于表示具有层级关系（父子关系）的数据。它就像自然界中的树倒过来，根在上面，叶子在下面。

### 1.1 树的通用术语

[width(21,79)]

| 术语                          | 描述                                                                                                                            |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| **节点 (Node)**               | 树的基本单元，包含数据和指向子节点的引用。                                                                                      |
| **根节点 (Root)**             | 树顶部的第一个节点，没有父节点。                                                                                                |
| **叶子节点 (Leaf)**           | 没有子节点的节点（树的最末端）。                                                                                                |
| **内部节点**                  | 至少有一个子节点的节点（非叶子节点）。                                                                                          |
| **边 (Edge)**                 | 连接两个节点的线。                                                                                                              |
| **父 / 子 / 兄弟节点**        | 直接相连的上下级关系：A 派生出 B，则 A 是 B 的**父节点**，B 是 A 的**子节点**；同一个父节点下的节点互为**兄弟节点 (Sibling)**。 |
| **子树 (Subtree)**            | 树中任一节点连同它的全部后代，本身也是一棵（更小的）树。                                                                        |
| **节点的度 (Degree)**         | 一个节点拥有的**子节点个数**。叶子节点的度为 0，二叉树任意节点的度 ≤ 2；整棵树的度是所有节点度的最大值。                        |
| **层 (Level)**                | 从根开始自上而下编号。习惯上根在第 1 层（也有的定义从第 0 层起），根的直接子节点在第 2 层，以此类推。                           |
| **深度 (Depth)**              | 节点到根节点的边的数量，**自上往下数**。（根的深度为 0 或 1，视定义而定）。                                                     |
| **高度 (Height)**             | 节点到最远叶子节点的边的数量，**自下往上数**。整棵树的高度就是根节点的高度。                                                    |
| **森林 (Forest)**             | 若干棵互不相交的树的集合。把一棵树删掉根节点，剩下的所有子树就构成了一个森林。                                                  |
| **平衡因子 (Balance Factor)** | 某节点「**左子树高度 − 右子树高度**」。AVL 树要求所有节点的平衡因子只能取 −1、0、1，这就是“**平衡**”的量化标准。                |

> [!TIP]
> **深度**与**高度**方向相反：深度从根往下数，高度从叶子往上数。同一节点二者通常不等，只有整棵树的高度才等于“**根的高度**”。面试里说“**树高**”和“**树的最大深度**”一般指同一个数。

### 1.2 树 (Tree) & 二叉树 (Binary Tree)

- **树**：一种非线性的、表示层级（父子）关系的数据结构（如 DOM 树）。
- **二叉树**：为了便于计算机处理而做出的限制——**每个节点最多只能有两个子节点**（左孩子和右孩子）。
- **二叉树区分左右**：左孩子和右孩子是**有序**的，交换两者会得到一棵不同的二叉树。

[width(30,46,24)]

| 形态                                  | 定义                                                                                   | 特点                                                       |
| :------------------------------------ | :------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| **满二叉树 (Full Binary Tree)**       | 每个节点要么有 0 个子节点、要么有**恰好 2 个**子节点，不存在只有一个孩子的情况。       | 节点总数一定是奇数。                                       |
| **完美二叉树 (Perfect Binary Tree)**  | 所有叶子都在**同一层**，且每一层的节点数都达到最大。深度为 $k$ 时共 $2^k - 1$ 个节点。 | 最“**规整**”的形态；中文教材里也常把这种叫“**满二叉树**”。 |
| **完全二叉树 (Complete Binary Tree)** | 除最后一层外其余各层都排满，且最后一层的节点**从左到右紧密排列、中间不断档**。         | 可以用**数组**紧凑存储（无空洞），**堆**就是它的典型应用。 |

> [!NOTE]
> 完美二叉树一定是满二叉树和完全二叉树；反过来不成立。完全二叉树的“**连续缺位**”性质，使得若节点编号从 0 开始，则左孩子索引为 `2i + 1`、右孩子为 `2i + 2`、父节点为 `(i - 1) >> 1`。

### 1.3 二叉搜索树 (BST - Binary Search Tree)

BST 将数据的**有序性**融入了结构中。这使得在树中查找、插入和删除一个特定的值，平均时间复杂度能够从数组的 $O(n)$ 降维打击到 **$O(\log n)$**。

- **规则**：对于任何节点，它的**左子树**上所有节点的值**必须小于**它的值；它的**右子树**上所有节点的值**必须大于**它的值。
- **优势**：在理想情况下，每次比较都能淘汰一半的数据，查找、插入的时间复杂度从 $O(n)$ 降为 **$O(\log n)$**。
- **致命弱点**：如果按照从小到大的顺序（如 1, 2, 3, 4）插入节点，树会严重向右倾斜，退化成**单向链表**。此时时间复杂度又回到了最差的 $O(n)$。

### 1.4 自平衡二叉搜索树 (Self-Balancing BST)

为了解决 BST 会退化成链表的问题，“**自平衡树**”应运而生。它们能在每次插入或删除节点后，**自动调整结构（通过旋转）**，保证树的左右两边大致一样高。

- **AVL 树**：最早的平衡树，规则极其严格（左右子树高度差不能超过 1）。查询极快，但插入/删除时为了维持绝对平衡，需要频繁旋转，代价高。
- **红黑树 (Red-Black Tree)**：一种**近似平衡**的树。它牺牲了极其微小的查询性能，换来了在插入/删除时**极少的旋转次数**（最多不超过 3 次旋转）。因此在各种编程语言底层（如 Java 的 `TreeMap`、C++ 的 `map`）被作为首选。

## 2. 深入理解红黑树 (Red-Black Tree)

### 2.1 红黑树的五大规则

一棵满足 BST 特性的树，如果还满足以下 5 条，它就是红黑树，并自然拥有了平衡的魔力：

- **节点颜色**：每个节点要么是**红色**，要么是**黑色**。
- **根节点黑**：根节点必须是**黑色**。
- **叶子节点黑**：所有的叶子节点（这里指的是最底层的 NIL/Null 空节点）都是黑色的。
- **不红红**：如果一个节点是**红色**的，那么它的两个直接子节点都必须是**黑色**的。（绝对不能有两个红节点相连）。
- **黑高平衡（最重要）**：从任一节点到其所有叶子节点的所有可能路径上，**包含的黑色节点数量必须相同**。

### 2.2 失去平衡后的修复手段

当你插入一个新节点时，**新节点默认总是红色的**（因为这样最不容易破坏规则 5）。如果恰好它的父节点也是红色，就破坏了“**不红红**”规则。此时需要修复：

- **变色**：将节点的颜色红黑互换。
- **左旋 (Left Rotate)**：逆时针旋转，使得右子节点被提拔为父节点，原父节点降级为左子节点。
- **右旋 (Right Rotate)**：顺时针旋转，左子节点上位。

## 3. 模拟实现二叉搜索树 (BST)

在 JavaScript 中，我们通过类和对象的嵌套引用来实现树结构。

### 3.1 节点类 (Node)

```js
class Node {
  constructor(key) {
    this.key = key // 节点的值
    this.left = null // 指向左子节点的引用
    this.right = null // 指向右子节点的引用
  }
}
```

### 3.2 二叉搜索树类 (BinarySearchTree)

包含了核心的插入、查找、遍历等方法。

```js
class BinarySearchTree {
  constructor() {
    this.root = null // 初始化树时，根节点为空
  }

  // --- 1. 插入节点 ---
  insert(key) {
    const newNode = new Node(key)
    if (this.root === null) {
      this.root = newNode // 如果是空树，新节点就是根
    } else {
      this.insertNode(this.root, newNode) // 否则，调用辅助函数递归寻找插入位置
    }
  }

  // 辅助插入函数 (递归)
  insertNode(node, newNode) {
    // 如果新值小于当前节点的值，向左走
    if (newNode.key < node.key) {
      if (node.left === null) {
        node.left = newNode // 左边没路了，就在这里安家
      } else {
        this.insertNode(node.left, newNode) // 继续向左递归
      }
    }
    // 如果新值大于等于当前节点的值，向右走
    else {
      if (node.right === null) {
        node.right = newNode // 右边没路了，在这里安家
      } else {
        this.insertNode(node.right, newNode) // 继续向右递归
      }
    }
  }

  // --- 2. 查找特定值是否存在 ---
  search(key) {
    return this.searchNode(this.root, key)
  }

  searchNode(node, key) {
    if (node === null) return false // 找到底了还没找到

    if (key < node.key) {
      return this.searchNode(node.left, key) // 去左子树找
    } else if (key > node.key) {
      return this.searchNode(node.right, key) // 去右子树找
    } else {
      return true // 找到了！
    }
  }

  // --- 3. 查找最小值和最大值 ---
  // 根据 BST 的特性，最小值一定在树的最左端，最大值一定在最右端
  min() {
    let current = this.root
    while (current != null && current.left !== null) {
      current = current.left
    }
    return current ? current.key : null
  }

  max() {
    let current = this.root
    while (current != null && current.right !== null) {
      current = current.right
    }
    return current ? current.key : null
  }

  // --- 4. 树的遍历 (极其重要) ---
  // ① 中序遍历 (In-order): 左 -> 根 -> 右
  // 特点：对于 BST，中序遍历会得到一个由小到大排序的序列！
  inOrderTraverse(callback) {
    this.inOrderTraverseNode(this.root, callback)
  }
  inOrderTraverseNode(node, callback) {
    if (node !== null) {
      this.inOrderTraverseNode(node.left, callback) // 先遍历左子树
      callback(node.key) // 访问当前节点
      this.inOrderTraverseNode(node.right, callback) // 再遍历右子树
    }
  }

  // ② 先序遍历 (Pre-order): 根 -> 左 -> 右
  // 特点：通常用于打印一棵结构化的树。
  preOrderTraverse(callback) {
    this.preOrderTraverseNode(this.root, callback)
  }
  preOrderTraverseNode(node, callback) {
    if (node !== null) {
      callback(node.key) // 先访问当前节点
      this.preOrderTraverseNode(node.left, callback) // 然后遍历左子树
      this.preOrderTraverseNode(node.right, callback) // 最后遍历右子树
    }
  }

  // ③ 后序遍历 (Post-order): 左 -> 右 -> 根
  // 特点：常用于计算目录/树的大小，因为你必须先知道所有子目录的大小才能计算当前目录。
  postOrderTraverse(callback) {
    this.postOrderTraverseNode(this.root, callback)
  }
  postOrderTraverseNode(node, callback) {
    if (node !== null) {
      this.postOrderTraverseNode(node.left, callback) // 先遍历左子树
      this.postOrderTraverseNode(node.right, callback) // 再遍历右子树
      callback(node.key) // 最后访问当前节点
    }
  }
}

// === 测试演示 ===
const tree = new BinarySearchTree()
tree.insert(11)
tree.insert(7)
tree.insert(15)
tree.insert(5)
tree.insert(9)
tree.insert(13)
tree.insert(20)

// 中序遍历结果：将按从小到大输出
console.log('中序遍历:')
tree.inOrderTraverse(value => console.log(value)) // 5, 7, 9, 11, 13, 15, 20

console.log('最小值:', tree.min()) // 5
console.log('搜索 9:', tree.search(9)) // true
console.log('搜索 8:', tree.search(8)) // false
```

## 4. 典型应用场景（前端视角）

树在前端工程里几乎无处不在——凡是存在「层级 / 嵌套 / 包含」关系的地方，底层都是一棵树。下表先给出全景，再逐项展开。

[width(20,27,53)]

| 场景           | 树状结构              | 核心操作                    |
| :------------- | :-------------------- | :-------------------------- |
| 页面结构与事件 | DOM 树                | 事件沿父子链**冒泡 / 捕获** |
| 视图渲染       | 虚拟 DOM 树           | 新旧两棵树的 **Diff**       |
| 模板编译       | AST（抽象语法树）     | 解析、遍历、转换            |
| 前端路由       | 路由树                | 嵌套路由的**前缀匹配**      |
| 文件 / 配置    | 目录树、JSON / 对象树 | 递归遍历、深拷贝            |
| 组件系统       | 组件树、Fiber 树      | 递归渲染与调度              |
| 数据库 / 缓存  | B+ 树、Trie           | 范围查询、前缀查找          |

### 4.1 DOM 树与事件传播

浏览器把 HTML 文档解析成一棵 **DOM 树**，`<html>` 是根，`<body>`、`<div>` 层层嵌套。事件在树上按固定路径传播，正是树结构决定的：

- **捕获阶段 (Capture)**：事件从 `window → document → … → 目标元素`自顶向下传递。
- **目标阶段 (Target)**：到达真正被点击的节点。
- **冒泡阶段 (Bubble)**：再从目标元素自底向上回传给各个祖先。

```js
// addEventListener 的第三个参数 useCapture 决定监听在哪个阶段触发
// 捕获阶段：从外到内
parent.addEventListener('click', () => console.log('parent 捕获'), true)
// 冒泡阶段（默认）：从内到外
parent.addEventListener('click', () => console.log('parent 冒泡'))
```

**事件委托 (Event Delegation)** 就是利用冒泡：不给上百个列表项各绑一个监听，只在父容器上绑一个，用 `event.target` 判断是哪个子节点触发的。这本质上是“**把监听挂在树的公共祖先上**”，既省内存又天然支持动态新增的子节点。

```js
// <ul id="list"><li data-id="1"><span>第一项</span></li>…</ul>

// 不给每个 <li> 绑，只在公共祖先 <ul> 上绑一个
document.querySelector('#list').addEventListener('click', e => {
  //从 element 自身开始，沿着 DOM 树向上找祖先，返回第一个匹配 selector 的元素。
  //如果自身就匹配，直接返回自身；如果一直找到根都没匹配，返回 null。
  const li = e.target.closest('li')
  if (!li) return // 点在了 ul 的空白处
  console.log('点击了第', li.dataset.id, '项')
})
```

- `e.target` 是**真正被点中**的最内层节点（点在内层 `<span>` 上时它并不是 `<li>`），`e.currentTarget` 才是挂监听的 `<ul>`——所以要靠 `closest()` 沿祖先链上溯，而不是拿 `e.target` 直接比。
- 之后动态新增的 `<li>` 无需重新绑定：它的事件照样会冒泡到 `<ul>`。

### 4.2 虚拟 DOM 与 Diff

React / Vue 会在内存里用普通 JS 对象描述 UI，形成一棵**虚拟 DOM 树**。数据变化时生成新树，再与旧树做 **Diff**——本质是「两棵树的同层比较」：

- 框架把传统的 $O(n^3)$ 树编辑距离问题，用三条启发式规则降到接近 $O(n)$：**同层比较**、**类型不同直接替换整棵子树**、**用 `key` 标识同层可复用节点**。
- 单节点 diff 时，React 只看左右子节点是否都只有一个、是否同类型，否则整块重建；Vue 则用「双端比较」优先头尾对齐。
- `key` 的作用是给同层节点一个稳定身份，缺失或用了数组下标会导致节点复用错位（列表重排时状态串味）。

### 4.3 模板编译与 AST

Vue 的模板不是 HTML，而是一门会被编译的语言。编译过程的核心产物就是 **AST（Abstract Syntax Tree，抽象语法树）**：

```markdown
<template> → parse（词法 + 语法分析）→ AST
→ transform（遍历 AST，收集依赖、优化静态节点）
→ generate（把 AST 重新打印成渲染函数 render()）
```

- **parse**：把标签、指令、插值解析成带 `children` 数组的嵌套节点对象——一棵树。
- **transform**：对树做**深度优先遍历**，标记静态节点（可跳过 diff）、收集 `ref` / `setup` 绑定。
- **generate**：后序遍历 AST 输出代码字符串。

Babel、PostCSS、ESLint 全部基于 AST 工作，可以说「前端工具链的基础就是树」。

### 4.4 路由树与嵌套路由匹配

Vue Router / React Router 的 `routes` 配置天然是一棵**嵌套树**，路由匹配就是在这棵树上做**前缀查找**：

```js
const routes = [
  {
    path: '/user',
    component: UserLayout,
    children: [
      { path: '', component: UserHome }, // /user
      { path: 'profile', component: UserProfile }, // /user/profile
      { path: ':id/posts', component: UserPosts }, // /user/42/posts
    ],
  },
]
```

- 访问 `/user/42/posts` 时，路由器自上而下逐段匹配，命中一条从根到叶的**路径**，沿途所有层级的组件一起渲染（`<router-view>` 嵌套）。
- 404 兜底、权限控制、面包屑导航，本质上都是对这条匹配路径（祖先链）的遍历。

### 4.5 文件 / 目录系统、JSON 与对象树

- **文件系统**：目录套目录就是一棵树，绝对路径 `/a/b/c` 就是一条从根到节点的路径。计算文件夹大小时必须**后序遍历**——先拿到所有子项大小再汇总。
- **JSON / 对象树**：任意嵌套的 JSON 都可以看成树。深拷贝、深比较、按路径取值（如 `_.get(obj, 'a.b.c')`）、antd / Element 的 `Tree` 组件数据，都要在树上递归遍历。
- **级联选择器 / 树形表格**：省市区三级联动、组织架构、权限菜单，数据结构都是 `{ label, value, children }`。

### 4.6 组件树与 React Fiber

- **组件树**：`<App><Header/><Main><List/><Footer/></Main></App>` 的嵌套关系就是一棵树，`props` 向下传递、事件向上冒泡、Context 沿祖先链查找，全依赖这棵树。
- **Fiber 树**：React 16 起把递归渲染改造成可中断的 **Fiber 架构**。每个组件对应一个 Fiber 节点，节点之间用 `child` / `sibling` / `return` 三个指针连成树——`child` 指向第一个子节点、`sibling` 指向下一个兄弟、`return` 指回父节点。这样渲染不再是一条道走到黑的递归，而能在树上游走并随时暂停，实现**时间切片与优先级调度**。这也是「树的遍历」在前端最硬核的一次落地。

### 4.7 数据库索引与 Trie

- **B+ 树**：MySQL 等关系型数据库的索引结构。多路平衡查找树，叶子节点用链表串起来，兼顾**等值查询**与**范围查询**，还能顺序扫描。
- **Trie（前缀树 / 字典树）**：每个节点代表一个字符，从根到某节点的路径拼出一个前缀。输入框自动补全、搜索联想、IP 路由、敏感词过滤都爱用它，查询复杂度只与词长有关，与词库大小无关。

## 5. 常见问题 (FAQ) 与面试高频考点

### 5.1 二叉搜索树的性能永远都是 $O(\log n)$ 吗？

**不是。**

- **最坏情况 (Worst Case)**：如果你按照按顺序插入节点（例如：依次插入 `1, 2, 3, 4, 5`），这棵树就会变成一条向右倾斜的长线，完全退化成了**单向链表**。此时查找的时间复杂度会暴跌至 **$O(n)$**。
- **如何解决**：为了解决这个问题，计算机科学家发明了**自平衡二叉搜索树**。这类树在插入和删除节点时，会自动通过“**旋转**”操作来保持树的左右两边大致平衡，从而确保性能稳定在 $O(\log n)$。最著名的自平衡树是 **AVL 树** 和 **红黑树 (Red-Black Tree)**。

### 5.2 树的“**广度优先搜索 (BFS)**”和“**深度优先搜索 (DFS)**”有什么区别？

- **深度优先 (DFS)**：一条路走到黑，撞到南墙（叶子节点）再回头。我们在上面代码中写的中序、先序、后序遍历，底层**都是基于 DFS** 实现的。DFS 通常使用**递归**或借助**栈 (Stack)** 来实现。
- **广度优先 (BFS)**：也叫层序遍历。像水波纹一样，一层一层地向下遍历。BFS 不使用递归，它**必须借助队列 (Queue)** 来实现：将当前层的所有节点入队，然后依次出队并把它们的子节点入队。

### 5.3 面试高频题：如何翻转（镜像）一棵二叉树？(LeetCode 226)

- **题目**：给你一棵二叉树的根节点，翻转这棵二叉树，并返回其根节点。（比如左子节点变右子节点，右子节点变左子节点）。

```js
var invertTree = function (root) {
  if (root === null) return null // 递归终点

  // 1. 递归翻转左子树和右子树
  const left = invertTree(root.left)
  const right = invertTree(root.right)

  // 2. 交换当前节点的左右子树指针
  root.left = right
  root.right = left

  return root
}
```

### 5.4 如果不用递归，怎么实现 DFS（如前序遍历）？

```js
function preOrderIterative(root) {
  // 1. 如果树为空，直接返回空数组
  if (root === null) {
    return []
  }
  const result = [] // 存放遍历结果
  const stack = [root] // 手动维护的栈，初始化推入根节点
  // 2. 当栈不为空时，持续循环
  while (stack.length > 0) {
    // 弹出栈顶元素作为当前节点
    const currentNode = stack.pop()
    // 访问该节点（将值推入结果数组）
    result.push(currentNode.key)
    // 关键点：因为栈是后进先出 (LIFO)，
    // 为了让左孩子先被访问，必须先压入右孩子，再压入左孩子！
    if (currentNode.right) {
      stack.push(currentNode.right)
    }
    if (currentNode.left) {
      stack.push(currentNode.left)
    }
  }
  return result
}
```

### 5.5 为什么数据库索引不用红黑树，而是用 B+ 树？

- **红黑树的软肋**：红黑树每个节点最多只有 2 个分支。当数据量千万级时，树会变得**非常深（高）**。在内存里这没事，但如果数据在硬盘里，树深意味着要进行多次**磁盘 I/O**（这是极慢的操作）。
- **B+ 树的优势**：它是为了磁盘而生的“**多叉树**”。它的每个节点非常“**胖**”，能存几百个分支。这使得千万级的数据，B+ 树只需要 3 到 4 层的高度就能装下，大大减少了访问硬盘的次数。

### 5.6 如何求二叉树的最大深度？

**最大深度 = 根到最远叶子节点的边数（或节点数，视定义）**。用后序遍历的思想，先求左右子树的深度，取较大者加一即可：

```js
function maxDepth(root) {
  if (root === null) return 0 // 空树深度为 0
  // 左右子树各自的最大深度，取更大的一边，再加上当前这一层
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1
}
```

- **时间复杂度** $O(n)$（每个节点访问一次），**空间复杂度** $O(h)$（递归栈深度，$h$ 为树高；最坏退化成链表时是 $O(n)$）。

### 5.7 什么是最近公共祖先（LCA）？

**最近公共祖先 (Lowest Common Ancestor)**：在树中同时是节点 `p` 和 `q` 的祖先、且**深度最大**的那个节点。它是「树上任意两点间路径的必经点」，常用于 DOM 事件委托定位、Git 分支合并基、组织架构里找共同上级。

普通二叉树的递归解法：若当前节点为空、或正好是 `p` 或 `q` 就直接返回；否则递归左右子树，**两边都找到非空结果**时，说明 `p`、`q` 分居两侧，当前节点即为 LCA：

```js
function lowestCommonAncestor(root, p, q) {
  if (root === null || root === p || root === q) return root
  const left = lowestCommonAncestor(root.left, p, q)
  const right = lowestCommonAncestor(root.right, p, q)
  if (left && right) return root // 一左一右，当前节点就是最近公共祖先
  return left || right // 都在同一侧，返回非空的那一边
}
```

如果树是 **BST**，还能利用有序性：从根开始，若 `p`、`q` 都小于当前节点就往左走，都大于就往右走，一旦分居两侧（或等于当前节点）即命中，无需递归。

### 5.8 堆与树是什么关系？

**堆 (Heap) 本质上是一棵“完全二叉树”**，只是它额外满足**堆序性**：

- **大顶堆**：每个父节点的值都 **≥** 其子节点；**小顶堆**：每个父节点的值都 **≤** 其子节点。注意堆只约束**父子**的大小关系，**兄弟之间无序**——所以堆不是 BST。
- **入堆 (push)**：把元素放到数组末尾（保持完全二叉树），再不断与父节点比较、上浮 (`sift up`)。
- **出堆 (pop)**：取走堆顶后，把末尾元素移到堆顶，再不断与较小的孩子比较、下沉 (`sift down`)。
- **底层应用**：JS 里没有原生堆，但**优先队列**（如 React 调度器 Scheduler 用最小堆管理任务优先级）、**Top-K 问题**、**堆排序**、Dijkstra 最短路都要用到它。这也是「树」与「数组」结合的最经典范例。
