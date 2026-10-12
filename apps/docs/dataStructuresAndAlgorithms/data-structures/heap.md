# 堆 (Heap)

## 1. 核心概念与特性

**堆 (Heap)** 是一种非常特殊的、基于**完全二叉树**的数据结构。它的核心设计目的只有一个：**在最短的时间内，找到一组数据中的最大值或最小值**。

[width(11,89)]

| 特性               | 描述                                                                                                                                                                                         |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **逻辑结构**       | 它是一棵**完全二叉树**（除了最后一层外，其他每一层都被完全填满，且最后一层的节点尽可能地靠左对齐）。                                                                                         |
| **物理存储**       | 绝大多数情况下，**堆是使用数组来实现的**，而不是像普通树那样用指针节点。因为完全二叉树的父子关系可以通过数组的索引直接计算出来。                                                             |
| **堆的分类**       | **最小堆 (Min-Heap)**:父节点的值**总是小于或等于**其任何子节点的值。堆顶根节点是**最小值**。<br>**最大堆 (Max-Heap)**:父节点的值**总是大于或等于**其任何子节点的值。堆顶根节点是**最大值**。 |
| **时间复杂度**     | 查找极值（查堆顶）：$O(1)$<br>插入节点：$O(\log n)$<br>删除（弹出）堆顶：$O(\log n)$                                                                                                         |
| **核心操作**       | **上浮 `siftUp`**：新元素插到末尾后，不断与父节点比较、交换，直到满足堆序。<br>**下沉 `siftDown`**：把末尾元素补到堆顶后，不断与较小的子节点交换，一路沉到合适位置。                         |
| **建堆 (Heapify)** | 把无序数组原地调整成堆：从**最后一个非叶子节点**倒着对每个节点执行 `siftDown`，整体只需 $O(n)$。                                                                                             |
| **空间复杂度**     | $O(n)$，且**无需额外空间**——完全二叉树直接压进数组，不用像二叉链表那样存左右指针。                                                                                                           |
| **有序性**         | 堆**只保证堆顶是极值**，其余元素之间没有任何顺序，也**不是稳定结构**；想拿全局有序请用排序算法。                                                                                             |

## 2. 堆的核心魔法：数组索引关系

这是堆能用数组实现的关键。假设数组索引从 `0` 开始（JS 中就是如此），对于数组中索引为 `i` 的任意节点：

- **左子节点** 的索引是：`2 * i + 1`
- **右子节点** 的索引是：`2 * i + 2`
- **父节点** 的索引是：`Math.floor((i - 1) / 2)`

## 3. 手写模拟实现：最小堆 (Min-Heap)

我们要实现两个最核心的操作：**插入 (Insert)** 和 **提取最小值 (Extract Min)**。
在操作过程中，为了维持最小堆的特性，我们需要两个辅助操作：**上移 (Sift Up)** 和 **下移 (Sift Down)**。

```js
class MinHeap {
  constructor() {
    this.heap = [] // 底层使用数组存储
  }

  // --- 辅助方法：获取父子节点索引 ---
  getLeftIndex(index) {
    return 2 * index + 1
  }
  getRightIndex(index) {
    return 2 * index + 2
  }
  getParentIndex(index) {
    if (index === 0) return undefined
    return Math.floor((index - 1) / 2)
  }

  // --- 辅助方法：交换数组中两个元素 ---
  swap(i, j) {
    const temp = this.heap[i]
    this.heap[i] = this.heap[j]
    this.heap[j] = temp
  }

  // --- 1. 插入新值 (Insert) ---
  insert(value) {
    if (value != null) {
      // 第一步：把新元素放在数组的最末尾（即树的最后一个叶子节点）
      this.heap.push(value)
      // 第二步：执行上移操作，如果新节点比父节点小，就和父节点交换，直到根节点
      this.siftUp(this.heap.length - 1)
      return true
    }
    return false
  }

  // 核心操作：上移 (Sift Up)
  siftUp(index) {
    let parent = this.getParentIndex(index)
    // 当还没到达根节点，且当前节点比父节点【小】时，交换它们
    while (index > 0 && this.heap[parent] > this.heap[index]) {
      this.swap(parent, index)
      // 更新当前索引为父节点索引，继续向上比较
      index = parent
      parent = this.getParentIndex(index)
    }
  }

  // --- 2. 提取最小值 (Extract Min) ---
  extract() {
    if (this.isEmpty()) return undefined
    if (this.size() === 1) return this.heap.shift()

    // 最小堆的最小值永远在数组的第一位
    const removedValue = this.heap[0]

    // 第一步：把数组【最后一个元素】移动到第一位（覆盖掉原来的根节点）
    this.heap[0] = this.heap.pop()

    // 第二步：执行下移操作，让这个新的根节点一路往下沉，直到找到合适的位置
    this.siftDown(0)

    return removedValue // 返回被移除的最小值
  }

  // 核心操作：下移 (Sift Down)
  siftDown(index) {
    let current = index
    let left = this.getLeftIndex(index)
    let right = this.getRightIndex(index)
    const size = this.size()

    // 找出当前节点、左孩子、右孩子三者中【最小】的那个节点的索引
    if (left < size && this.heap[left] < this.heap[current]) {
      current = left
    }
    if (right < size && this.heap[right] < this.heap[current]) {
      current = right
    }

    // 如果最小的不是自己，说明需要下沉（交换）
    if (index !== current) {
      this.swap(index, current)
      // 递归地继续向下比较
      this.siftDown(current)
    }
  }

  // --- 其他辅助方法 ---
  size() {
    return this.heap.length
  }
  isEmpty() {
    return this.size() === 0
  }
  // 只查看最小值，不移除
  findMinimum() {
    return this.isEmpty() ? undefined : this.heap[0]
  }
}

// === 测试演示 ===
const minHeap = new MinHeap()
minHeap.insert(5)
minHeap.insert(3)
minHeap.insert(10)
minHeap.insert(1)

console.log(minHeap.heap) // 输出数组结构: [1, 3, 10, 5] (注意这不是完全排序的，但满足堆特性)
console.log('最小值:', minHeap.findMinimum()) // 1

console.log('提取最小值:', minHeap.extract()) // 1
console.log('提取后数组:', minHeap.heap) // [3, 5, 10]
```

### 3.1 用堆实现一个优先队列 (PriorityQueue)

优先队列是堆最直接的落地形态：元素带优先级，永远先弹出优先级最高的那个。它比上面写死「小顶堆」的 `MinHeap` 更通用，把比较规则做成参数即可在最小堆和最大堆之间切换。

```js
class PriorityQueue {
  // compare: 负数表示 a 应该排在 b 前面（小顶堆传 (a, b) => a.priority - b.priority）
  constructor(compare) {
    this.heap = []
    this.compare = compare
  }

  push(item) {
    this.heap.push(item)
    this.#siftUp(this.heap.length - 1)
  }

  pop() {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.#siftDown(0)
    }
    return top // 优先级最高的元素
  }

  peek() {
    return this.heap[0]
  }

  get size() {
    return this.heap.length
  }

  #siftUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.compare(this.heap[i], this.heap[parent]) >= 0) break
      const tmp = this.heap[i]
      this.heap[i] = this.heap[parent]
      this.heap[parent] = tmp
      i = parent
    }
  }

  #siftDown(i) {
    const n = this.heap.length
    while (true) {
      let best = i
      const left = 2 * i + 1
      const right = 2 * i + 2
      if (left < n && this.compare(this.heap[left], this.heap[best]) < 0)
        best = left
      if (right < n && this.compare(this.heap[right], this.heap[best]) < 0)
        best = right
      if (best === i) break
      const tmp = this.heap[i]
      this.heap[i] = this.heap[best]
      this.heap[best] = tmp
      i = best
    }
  }
}
```

### 3.2 一次性建堆 (Heapify)

如果一个数组已经全部给出，逐个 `insert` 建堆要 $O(n \log n)$；而直接从**最后一个非叶子节点**倒序 `siftDown`，只要 $O(n)$。区别在于前者把每个元素都当新节点上浮，后者让大量底层节点几乎不用移动。

```js
function siftDown(arr, i, size) {
  while (true) {
    let smallest = i
    const left = 2 * i + 1
    const right = 2 * i + 2
    if (left < size && arr[left] < arr[smallest]) smallest = left
    if (right < size && arr[right] < arr[smallest]) smallest = right
    if (smallest === i) break
    const tmp = arr[i]
    arr[i] = arr[smallest]
    arr[smallest] = tmp
    i = smallest
  }
}

function buildHeap(arr) {
  // 最后一个非叶子节点的索引是 (n >> 1) - 1，从它开始往前逐个下沉
  for (let i = (arr.length >> 1) - 1; i >= 0; i--) {
    siftDown(arr, i, arr.length)
  }
  return arr
}

const arr = [5, 3, 8, 1, 9, 2]
buildHeap(arr) // [1, 3, 2, 5, 9, 8]，数组已满足小顶堆特性
```

## 4. 典型应用场景

堆的价值是「在 $O(\log n)$ 内维护一个动态集合的极值」。凡是「反复取最大 / 最小」的场景，几乎都能看到它。

[width(26,47,27)]

| 场景                    | 说明                                                            | 关键点                      |
| :---------------------- | :-------------------------------------------------------------- | :-------------------------- |
| Top K 问题              | 求最大的 K 个数用**大小为 K 的小顶堆**，求最小的 K 个数用大顶堆 | $O(n \log K)$，优于全排序   |
| 优先队列 / 任务调度     | 按优先级取任务，入队即插入、取出即弹出最高优先级                | 堆是优先队列的标准实现      |
| React Scheduler         | 用小顶堆按 `expirationTime` 排序待执行任务，保证高优任务先跑    | `react-reconciler` 内部实现 |
| 合并 K 个有序链表       | 把每个链表的头节点放入小顶堆，每次弹出最小节点接到结果尾部      | LeetCode 23，$O(N \log K)$  |
| 流式数据求中位数        | 大顶堆存较小的一半、小顶堆存较大的一半，两个堆顶夹出中位数      | LeetCode 295，双堆          |
| 求第 K 大 / 第 K 小元素 | 维护大小为 K 的堆，遍历结束后堆顶就是答案                       | 也可用快选 (Quickselect)    |

## 5. 常见问题 (FAQ)

### 5.1 既然有二叉搜索树 (BST)，它也能找到极值，为什么还需要堆？

- **用途不同**：
  - **BST** 的目的是维护数据的**全局有序性**，支持快速查找、插入、删除**任意值**，支持范围查询（如“**找大于 5 且小于 10 的数**”）。
  - **堆** 的目的极其单一：**只为了极快地拿到最大值或最小值**。它不保证除了根节点之外的任何元素的绝对顺序。
- **形态稳定性**：如果一直插入递增的数字，BST 会退化成链表（除非用红黑树），而**堆永远是一棵完美的完全二叉树**，其查找和插入的时间复杂度永远稳定在 $O(1)$ 和 $O(\log n)$。

### 5.2 为什么 `extract` (弹出堆顶) 操作，要把最后一个叶子节点移到根节点，然后再下沉？

**为了维持完全二叉树的结构。** 如果你直接删掉根节点（数组的第一个元素），你不仅需要补上这个空缺，由于 `shift()` 操作，数组所有后续元素的索引都会改变，原本的父子索引关系瞬间全乱套了。
而把最后一个元素（数组的 `pop()`）拿去补在根节点的位置，数组前面的元素位置完全没变。然后再通过比较大小让它慢慢“**沉**”下去，是破坏性最小、效率最高的方法。

### 5.3 堆的经典应用：Top K 问题

有 10 亿个数字，由于内存不够不能全部加载排序，如何快速找出最大的 100 个数？

- **解法：维护一个大小为 $K=100$ 的【最小堆】。**
  1.  先拿前 100 个数建一个最小堆（堆顶是这 100 个数里最小的）。
  2.  然后继续读取后面的数。每次读到一个新数，就和**堆顶**（当前 100 个数中的最小值）比较。
  3.  如果新数**大于**堆顶，说明堆顶被淘汰了，弹出堆顶，把新数插进去重新调整堆。
  4.  如果新数小于或等于堆顶，直接丢弃。
  5.  遍历完 10 亿个数后，这个小顶堆里留下的就是最大的 100 个数。

### 5.4 为什么建堆 (Heapify) 是 $O(n)$ 而不是 $O(n \log n)$？

- 直觉上「$n$ 个节点，每个下沉 $O(\log n)$」像是 $O(n \log n)$，但这是**上界估计过松**了。
- 关键在于**大多数节点位于底层、下沉距离很短**：完全二叉树里，高度为 $h$ 的节点约有 $n / 2^{h+1}$ 个，它们的下沉代价是 $O(h)$。把两者相乘再对 $h$ 求和：
  $$\sum_{h=0}^{\log n} \frac{n}{2^{h+1}} \cdot h = O(n)$$
- 级数 $\sum h / 2^h$ 收敛到常数，所以总代价是线性的。对比之下，如果对**每个**节点做「上浮」（`insert` 的写法），越靠近底层的节点上浮路径越长，总代价才是 $O(n \log n)$。

### 5.5 求 Top K，用堆还是用快排 / 快速选择？

- **用堆**：时间复杂度 $O(n \log K)$，空间 $O(K)$。优点是**适合流式 / 超大数据**——数据可以一个一个读进来，不需要全部载入内存，10 亿个数也能处理（这正是 Top K 问题的常见设定）。
- **用快速选择 (Quickselect)**：平均 $O(n)$，比堆更快，但它需要**把数据全部放在内存里**，而且要打乱数组，是破坏性的。
- **选择原则**：数据能全部放进内存、只要一个第 K 大（不需要有序的 Top K 列表）→ 用快速选择；数据是流式的、内存受限、或要维护动态集合 → 用堆。若给的是**静态数组**且 K 很小，也可以先排序再切前 K 个，代码最简单。

### 5.6 优先队列是怎么用堆实现的？JS 里怎么用？

- 优先队列只要求「入队」和「取出最高优先级元素」，正好对应堆的 `insert` 和 `extract`，两者都是 $O(\log n)$，而查看队首是 $O(1)$。
- 实现要点是**把比较规则抽成参数**：传 `(a, b) => a - b` 得到小顶堆，取反就得到大顶堆。这样一套代码同时支持「数字越小越优先」和「数字越大越优先」。
- **JS 没有内置优先队列**，前端里 React Scheduler、各种任务调度器基本都会自带一个基于堆的实现；也有 `tinyqueue`、`heap-js` 这类现成库。

### 5.7 堆能快速查找任意元素吗？能删除任意元素吗？

- **都不擅长**。堆只维护父子之间的偏序，除了堆顶之外没有任何定位信息，所以：
  - **查找任意元素**：只能遍历整个数组，$O(n)$；
  - **删除任意元素**：先要花 $O(n)$ 找到它，交换到堆顶或末尾再 `siftDown` / `siftUp`，整体仍是 $O(n)$。
- 如果业务需要快速查找 + 快速取极值，通常要**组合数据结构**：例如额外维护一个 `Map<值, 下标>` 来把「查找」降到 $O(1)$，删除时再借助下标做 $O(\log n)$ 的调整——这就是「索引堆 (Indexed Heap)」的思路。

### 5.8 堆排序也是 $O(n \log n)$，为什么不如快速排序常用？

- **常数更大**：堆的访问模式是「跳跃式」的，`siftDown` 在数组里反复横跳，**CPU 缓存不友好**；快排的顺序分区访问则对缓存友好得多。同样是 $O(n \log n)$，快排的实际运行往往快数倍。
- **不稳定**：堆排序是**不稳定排序**，相等元素的相对顺序会被打乱，而实际业务常常依赖稳定性（归并、快排优化版能满足）。
- **优势场景**：堆排序的杀手锏是**最坏 $O(n \log n)$ 且原地 $O(1)$ 空间**，在内存极度受限、又要防御最坏输入的嵌入式 / 内核场景里仍有一席之地。日常排序直接 `Array.prototype.sort`（V8 内部用 TimSort）即可，堆真正不可替代的地方是 **Top K、优先队列** 这些「只要极值」的场景。
