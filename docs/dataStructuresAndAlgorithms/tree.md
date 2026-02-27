# 树 (Tree)

## 1. 核心概念与特性

**树 (Tree)** 是一种**非线性**的数据结构，用于表示具有层级关系（父子关系）的数据。它就像自然界中的树倒过来，根在上面，叶子在下面。

### 1.1 树的通用术语
| 术语 | 描述 |
| :--- | :--- |
| **节点 (Node)** | 树的基本单元，包含数据和指向子节点的引用。 |
| **根节点 (Root)** | 树顶部的第一个节点，没有父节点。 |
| **叶子节点 (Leaf)** | 没有子节点的节点（树的最末端）。 |
| **内部节点** | 至少有一个子节点的节点（非叶子节点）。 |
| **边 (Edge)** | 连接两个节点的线。 |
| **深度 (Depth)** | 节点到根节点的边的数量。（根的深度为 0 或 1，视定义而定）。 |
| **高度 (Height)** | 节点到最远叶子节点的边的数量。整棵树的高度就是根节点的高度。 |

### 1.2 树 (Tree) & 二叉树 (Binary Tree)
*   **树**：一种非线性的、表示层级（父子）关系的数据结构（如 DOM 树）。
*   **二叉树**：为了便于计算机处理而做出的限制——**每个节点最多只能有两个子节点**（左孩子和右孩子）。

### 1.3 二叉搜索树 (BST - Binary Search Tree)
BST 将数据的**有序性**融入了结构中。这使得在树中查找、插入和删除一个特定的值，平均时间复杂度能够从数组的 $O(n)$ 降维打击到 **$O(\log n)$**。
*   **规则**：对于任何节点，它的**左子树**上所有节点的值**必须小于**它的值；它的**右子树**上所有节点的值**必须大于**它的值。
*   **优势**：在理想情况下，每次比较都能淘汰一半的数据，查找、插入的时间复杂度从 $O(n)$ 降为 **$O(\log n)$**。
*   **致命弱点**：如果按照从小到大的顺序（如 1, 2, 3, 4）插入节点，树会严重向右倾斜，退化成**单向链表**。此时时间复杂度又回到了最差的 $O(n)$。

### 1.4 自平衡二叉搜索树 (Self-Balancing BST)
为了解决 BST 会退化成链表的问题，“自平衡树”应运而生。它们能在每次插入或删除节点后，**自动调整结构（通过旋转）**，保证树的左右两边大致一样高。
*   **AVL 树**：最早的平衡树，规则极其严格（左右子树高度差不能超过 1）。查询极快，但插入/删除时为了维持绝对平衡，需要频繁旋转，代价高。
*   **红黑树 (Red-Black Tree)**：一种**近似平衡**的树。它牺牲了极其微小的查询性能，换来了在插入/删除时**极少的旋转次数**（最多不超过 3 次旋转）。因此在各种编程语言底层（如 Java 的 `TreeMap`、C++ 的 `map`）被作为首选。

## 2. 深入理解红黑树 (Red-Black Tree) 🔴⚫

理解红黑树，核心在于记住它的“五大黄金规则”以及它的修复手段。

### 2.1 红黑树的五大规则
一棵满足 BST 特性的树，如果还满足以下 5 条，它就是红黑树，并自然拥有了平衡的魔力：
*  **节点颜色**：每个节点要么是**红色**，要么是**黑色**。
*  **根节点黑**：根节点必须是**黑色**。
*  **叶子节点黑**：所有的叶子节点（这里指的是最底层的 NIL/Null 空节点）都是黑色的。
*  **不红红**：如果一个节点是**红色**的，那么它的两个直接子节点都必须是**黑色**的。（绝对不能有两个红节点相连）。
*  **黑高平衡（最重要）**：从任一节点到其所有叶子节点的所有可能路径上，**包含的黑色节点数量必须相同**。

### 2.2 失去平衡后的修复手段
当你插入一个新节点时，**新节点默认总是红色的**（因为这样最不容易破坏规则 5）。如果恰好它的父节点也是红色，就破坏了“不红红”规则。此时需要修复：
*  **变色**：将节点的颜色红黑互换。
*  **左旋 (Left Rotate)**：逆时针旋转，使得右子节点被提拔为父节点，原父节点降级为左子节点。
*  **右旋 (Right Rotate)**：顺时针旋转，左子节点上位。

## 3. 模拟实现二叉搜索树 (BST)

在 JavaScript 中，我们通过类和对象的嵌套引用来实现树结构。

### 3.1 节点类 (Node)
```js
class Node {
  constructor(key) {
    this.key = key;   // 节点的值
    this.left = null; // 指向左子节点的引用
    this.right = null;// 指向右子节点的引用
  }
}
```

### 3.2 二叉搜索树类 (BinarySearchTree)
包含了核心的插入、查找、遍历等方法。

```js
class BinarySearchTree {
  constructor() {
    this.root = null; // 初始化树时，根节点为空
  }

  // --- 1. 插入节点 ---
  insert(key) {
    const newNode = new Node(key);
    if (this.root === null) {
      this.root = newNode; // 如果是空树，新节点就是根
    } else {
      this.insertNode(this.root, newNode); // 否则，调用辅助函数递归寻找插入位置
    }
  }

  // 辅助插入函数 (递归)
  insertNode(node, newNode) {
    // 如果新值小于当前节点的值，向左走
    if (newNode.key < node.key) {
      if (node.left === null) {
        node.left = newNode; // 左边没路了，就在这里安家
      } else {
        this.insertNode(node.left, newNode); // 继续向左递归
      }
    } 
    // 如果新值大于等于当前节点的值，向右走
    else {
      if (node.right === null) {
        node.right = newNode; // 右边没路了，在这里安家
      } else {
        this.insertNode(node.right, newNode); // 继续向右递归
      }
    }
  }

  // --- 2. 查找特定值是否存在 ---
  search(key) {
    return this.searchNode(this.root, key);
  }

  searchNode(node, key) {
    if (node === null) return false; // 找到底了还没找到
    
    if (key < node.key) {
      return this.searchNode(node.left, key); // 去左子树找
    } else if (key > node.key) {
      return this.searchNode(node.right, key); // 去右子树找
    } else {
      return true; // 找到了！
    }
  }

  // --- 3. 查找最小值和最大值 ---
  // 根据 BST 的特性，最小值一定在树的最左端，最大值一定在最右端
  min() {
    let current = this.root;
    while (current != null && current.left !== null) {
      current = current.left;
    }
    return current ? current.key : null;
  }

  max() {
    let current = this.root;
    while (current != null && current.right !== null) {
      current = current.right;
    }
    return current ? current.key : null;
  }

  // --- 4. 树的遍历 (极其重要) ---
  // ① 中序遍历 (In-order): 左 -> 根 -> 右
  // 特点：对于 BST，中序遍历会得到一个由小到大排序的序列！
  inOrderTraverse(callback) {
    this.inOrderTraverseNode(this.root, callback);
  }
  inOrderTraverseNode(node, callback) {
    if (node !== null) {
      this.inOrderTraverseNode(node.left, callback); // 先遍历左子树
      callback(node.key);                            // 访问当前节点
      this.inOrderTraverseNode(node.right, callback);// 再遍历右子树
    }
  }

  // ② 先序遍历 (Pre-order): 根 -> 左 -> 右
  // 特点：通常用于打印一棵结构化的树。
  preOrderTraverse(callback) {
    this.preOrderTraverseNode(this.root, callback);
  }
  preOrderTraverseNode(node, callback) {
    if (node !== null) {
      callback(node.key);                             // 先访问当前节点
      this.preOrderTraverseNode(node.left, callback); // 然后遍历左子树
      this.preOrderTraverseNode(node.right, callback);// 最后遍历右子树
    }
  }

  // ③ 后序遍历 (Post-order): 左 -> 右 -> 根
  // 特点：常用于计算目录/树的大小，因为你必须先知道所有子目录的大小才能计算当前目录。
  postOrderTraverse(callback) {
    this.postOrderTraverseNode(this.root, callback);
  }
  postOrderTraverseNode(node, callback) {
    if (node !== null) {
      this.postOrderTraverseNode(node.left, callback); // 先遍历左子树
      this.postOrderTraverseNode(node.right, callback);// 再遍历右子树
      callback(node.key);                              // 最后访问当前节点
    }
  }
}

// === 测试演示 ===
const tree = new BinarySearchTree();
tree.insert(11);
tree.insert(7);
tree.insert(15);
tree.insert(5);
tree.insert(9);
tree.insert(13);
tree.insert(20);

// 中序遍历结果：将按从小到大输出
console.log('中序遍历:');
tree.inOrderTraverse(value => console.log(value)); // 5, 7, 9, 11, 13, 15, 20

console.log('最小值:', tree.min()); // 5
console.log('搜索 9:', tree.search(9)); // true
console.log('搜索 8:', tree.search(8)); // false
```

## 4. 常见问题 (FAQ) 与面试高频考点

### 4.1 二叉搜索树的性能永远都是 $O(\log n)$ 吗？
*   **答：不是。**
*   **最坏情况 (Worst Case)**：如果你按照按顺序插入节点（例如：依次插入 `1, 2, 3, 4, 5`），这棵树就会变成一条向右倾斜的长线，完全退化成了**单向链表**。此时查找的时间复杂度会暴跌至 **$O(n)$**。
*   **如何解决**：为了解决这个问题，计算机科学家发明了**自平衡二叉搜索树**。这类树在插入和删除节点时，会自动通过“旋转”操作来保持树的左右两边大致平衡，从而确保性能稳定在 $O(\log n)$。最著名的自平衡树是 **AVL 树** 和 **红黑树 (Red-Black Tree)**。

### 4.2 树的“广度优先搜索 (BFS)”和“深度优先搜索 (DFS)”有什么区别？
*   **深度优先 (DFS)**：一条路走到黑，撞到南墙（叶子节点）再回头。我们在上面代码中写的中序、先序、后序遍历，底层**都是基于 DFS** 实现的。DFS 通常使用**递归**或借助**栈 (Stack)** 来实现。
*   **广度优先 (BFS)**：也叫层序遍历。像水波纹一样，一层一层地向下遍历。BFS 不使用递归，它**必须借助队列 (Queue)** 来实现：将当前层的所有节点入队，然后依次出队并把它们的子节点入队。

### 4.3 面试高频题：如何翻转（镜像）一棵二叉树？(LeetCode 226)
*   **题目**：给你一棵二叉树的根节点，翻转这棵二叉树，并返回其根节点。（比如左子节点变右子节点，右子节点变左子节点）。
*   **解法 (DFS)**：
```js
var invertTree = function(root) {
    if (root === null) return null; // 递归终点
    
    // 1. 递归翻转左子树和右子树
    const left = invertTree(root.left);
    const right = invertTree(root.right);
    
    // 2. 交换当前节点的左右子树指针
    root.left = right;
    root.right = left;
    
    return root;
};
```

### 4.4 如果不用递归，怎么实现 DFS（如前序遍历）？
*   **答：所有的递归都可以用手动维护一个栈 (Stack) 来替代。** 这样可以防止树太深导致系统调用栈溢出 (`Maximum call stack size exceeded`)。
  *   **非递归前序遍历实现**：
  ```js
function preOrderIterative(root) {
      // 1. 如果树为空，直接返回空数组
      if (root === null) {
        return [];
      }
      const result = [];    // 存放遍历结果
      const stack = [root]; // 手动维护的栈，初始化推入根节点
      // 2. 当栈不为空时，持续循环
      while (stack.length > 0) {
          // 弹出栈顶元素作为当前节点
          const currentNode = stack.pop();
          // 访问该节点（将值推入结果数组）
          result.push(currentNode.key);
          // 关键点：因为栈是后进先出 (LIFO)，
          // 为了让左孩子先被访问，必须先压入右孩子，再压入左孩子！
          if (currentNode.right){
              stack.push(currentNode.right);
          }
          if (currentNode.left){
              stack.push(currentNode.left);
          }
      }
      return result
}
  ```

### 4.5 为什么数据库索引不用红黑树，而是用 B+ 树？
这是一道衡量计算机基础深度的经典题。
*   **红黑树的软肋**：红黑树每个节点最多只有 2 个分支。当数据量千万级时，树会变得**非常深（高）**。在内存里这没事，但如果数据在硬盘里，树深意味着要进行多次**磁盘 I/O**（这是极慢的操作）。
*   **B+ 树的优势**：它是为了磁盘而生的“多叉树”。它的每个节点非常“胖”，能存几百个分支。这使得千万级的数据，B+ 树只需要 3 到 4 层的高度就能装下，大大减少了访问硬盘的次数。

### 4.6 为什么前端开发（Vue/React）需要掌握树？
*   **虚拟 DOM (Virtual DOM)**：现代前端框架的底层核心，就是一个巨大的由 JavaScript 对象构成的**树形结构**。
*   **DOM Diff 算法**：当数据改变时，框架需要对比新旧两棵虚拟 DOM 树的差异。这个比对过程就是极其复杂的**树的遍历算法**。
*   **组件通信**：前端组件的嵌套关系（父-子-孙）天生就是一棵树。理解树的层级有助于理解事件冒泡、Context 上下文传递的路径。



