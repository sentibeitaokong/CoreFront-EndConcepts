# 堆 (Heap)

## 1. 核心概念与特性

**堆 (Heap)** 是一种非常特殊的、基于**完全二叉树**的数据结构。它的核心设计目的只有一个：**在最短的时间内，找到一组数据中的最大值或最小值**。

| 特性 | 描述 |
| :--- | :--- |
| **逻辑结构** | 它是一棵**完全二叉树**（除了最后一层外，其他每一层都被完全填满，且最后一层的节点尽可能地靠左对齐）。 |
| **物理存储** | 绝大多数情况下，**堆是使用数组来实现的**，而不是像普通树那样用指针节点。因为完全二叉树的父子关系可以通过数组的索引直接计算出来。 |
| **堆的分类** |分为两种：<br>**最小堆 (Min-Heap)**：父节点的值**总是小于或等于**其任何子节点的值。堆顶（根节点）是最小值。<br>**最大堆 (Max-Heap)**：父节点的值**总是大于或等于**其任何子节点的值。堆顶（根节点）是最大值。 |
| **时间复杂度** | 查找极值（查堆顶）：$O(1)$<br>插入节点：$O(\log n)$<br>删除（弹出）堆顶：$O(\log n)$ |

## 2. 堆的核心魔法：数组索引关系

这是堆能用数组实现的关键。假设数组索引从 `0` 开始（JS 中就是如此），对于数组中索引为 `i` 的任意节点：

*   **左子节点** 的索引是：`2 * i + 1`
*   **右子节点** 的索引是：`2 * i + 2`
*   **父节点** 的索引是：`Math.floor((i - 1) / 2)`

*利用这些简单的数学公式，我们就可以在数组中自由地“上下跳跃”，而不需要额外的内存去存储 left 和 right 指针。*

## 3. 手写模拟实现：最小堆 (Min-Heap)

我们要实现两个最核心的操作：**插入 (Insert)** 和 **提取最小值 (Extract Min)**。
在操作过程中，为了维持最小堆的特性，我们需要两个辅助操作：**上移 (Sift Up)** 和 **下移 (Sift Down)**。

```js
class MinHeap {
  constructor() {
    this.heap = []; // 底层使用数组存储
  }

  // --- 辅助方法：获取父子节点索引 ---
  getLeftIndex(index) { return 2 * index + 1; }
  getRightIndex(index) { return 2 * index + 2; }
  getParentIndex(index) {
    if (index === 0) return undefined;
    return Math.floor((index - 1) / 2);
  }

  // --- 辅助方法：交换数组中两个元素 ---
  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  // --- 1. 插入新值 (Insert) ---
  insert(value) {
    if (value != null) {
      // 第一步：把新元素放在数组的最末尾（即树的最后一个叶子节点）
      this.heap.push(value);
      // 第二步：执行上移操作，如果新节点比父节点小，就和父节点交换，直到根节点
      this.siftUp(this.heap.length - 1);
      return true;
    }
    return false;
  }

  // 核心操作：上移 (Sift Up)
  siftUp(index) {
    let parent = this.getParentIndex(index);
    // 当还没到达根节点，且当前节点比父节点【小】时，交换它们
    while (index > 0 && this.heap[parent] > this.heap[index]) {
      this.swap(parent, index);
      // 更新当前索引为父节点索引，继续向上比较
      index = parent;
      parent = this.getParentIndex(index);
    }
  }

  // --- 2. 提取最小值 (Extract Min) ---
  extract() {
    if (this.isEmpty()) return undefined;
    if (this.size() === 1) return this.heap.shift();

    // 最小堆的最小值永远在数组的第一位
    const removedValue = this.heap[0];

    // 第一步：把数组【最后一个元素】移动到第一位（覆盖掉原来的根节点）
    this.heap[0] = this.heap.pop();
    
    // 第二步：执行下移操作，让这个新的根节点一路往下沉，直到找到合适的位置
    this.siftDown(0);

    return removedValue; // 返回被移除的最小值
  }

  // 核心操作：下移 (Sift Down)
  siftDown(index) {
    let current = index;
    let left = this.getLeftIndex(index);
    let right = this.getRightIndex(index);
    const size = this.size();

    // 找出当前节点、左孩子、右孩子三者中【最小】的那个节点的索引
    if (left < size && this.heap[left] < this.heap[current]) {
      current = left;
    }
    if (right < size && this.heap[right] < this.heap[current]) {
      current = right;
    }

    // 如果最小的不是自己，说明需要下沉（交换）
    if (index !== current) {
      this.swap(index, current);
      // 递归地继续向下比较
      this.siftDown(current);
    }
  }

  // --- 其他辅助方法 ---
  size() { return this.heap.length; }
  isEmpty() { return this.size() === 0; }
  // 只查看最小值，不移除
  findMinimum() { return this.isEmpty() ? undefined : this.heap[0]; }
}

// === 测试演示 ===
const minHeap = new MinHeap();
minHeap.insert(5);
minHeap.insert(3);
minHeap.insert(10);
minHeap.insert(1);

console.log(minHeap.heap); // 输出数组结构: [1, 3, 10, 5] (注意这不是完全排序的，但满足堆特性)
console.log('最小值:', minHeap.findMinimum()); // 1

console.log('提取最小值:', minHeap.extract()); // 1
console.log('提取后数组:', minHeap.heap);      // [3, 5, 10]
```

## 4. 常见问题 (FAQ) 与算法面试高频题

### 4.1 既然有二叉搜索树 (BST)，它也能找到极值，为什么还需要堆？
*   **用途不同**：
    *   **BST** 的目的是维护数据的**全局有序性**，支持快速查找、插入、删除**任意值**，支持范围查询（如“找大于 5 且小于 10 的数”）。
    *   **堆** 的目的极其单一：**只为了极快地拿到最大值或最小值**。它不保证除了根节点之外的任何元素的绝对顺序。
*   **形态稳定性**：如果一直插入递增的数字，BST 会退化成链表（除非用红黑树），而**堆永远是一棵完美的完全二叉树**，其查找和插入的时间复杂度永远稳定在 $O(1)$ 和 $O(\log n)$。

### 4.2 为什么 `extract` (弹出堆顶) 操作，要把最后一个叶子节点移到根节点，然后再下沉？
*   **答：为了维持完全二叉树的结构。**
    如果你直接删掉根节点（数组的第一个元素），你不仅需要补上这个空缺，由于 `shift()` 操作，数组所有后续元素的索引都会改变，原本的父子索引关系瞬间全乱套了。
    而把最后一个元素（数组的 `pop()`）拿去补在根节点的位置，数组前面的元素位置完全没变。然后再通过比较大小让它慢慢“沉”下去，是破坏性最小、效率最高的方法。

### 4.3 堆的经典应用：Top K 问题
**面试必考！**：有 10 亿个数字，由于内存不够不能全部加载排序，如何快速找出最大的 100 个数？
*   **解法：维护一个大小为 $K=100$ 的【最小堆】。**
    1.  先拿前 100 个数建一个最小堆（堆顶是这 100 个数里最小的）。
    2.  然后继续读取后面的数。每次读到一个新数，就和**堆顶**（当前 100 个数中的最小值）比较。
    3.  如果新数**大于**堆顶，说明堆顶被淘汰了，弹出堆顶，把新数插进去重新调整堆。
    4.  如果新数小于或等于堆顶，直接丢弃。
    5.  遍历完 10 亿个数后，这个小顶堆里留下的就是最大的 100 个数。

### 4.4 堆排序 (Heap Sort) 的时间复杂度是多少？
*   **时间复杂度**：**$O(n \log n)$**。建堆的过程是 $O(n)$，每次取堆顶并调整是 $O(\log n)$，取 $n$ 次就是 $O(n \log n)$。
*   **空间复杂度**：**$O(1)$**。堆排序最大的优势是它是**原地排序算法**，不需要像归并排序那样开辟额外的数组空间。