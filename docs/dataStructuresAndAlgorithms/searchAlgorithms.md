---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# 查找算法

## 1. 核心查找算法概览

| 算法名称 | 适用数据结构 | 平均时间复杂度 | 最坏时间复杂度 | 空间复杂度 | 前提条件 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **顺序查找 (Linear Search)** | 数组、链表 | O(n) | O(n) | O(1) | 无 |
| **二分查找 (Binary Search)** | 数组 | O(log n) | O(log n) | O(1) | 数据**必须有序** |
| **插值查找 (Interpolation Search)** | 数组 | O(log(log n)) | O(n) | O(1) | 数据**有序且分布均匀** |
| **哈希查找 (Hash Search)** | 哈希表 / 字典 | O(1) | O(n) | O(n) | 需要额外的哈希表空间 |
| **二叉搜索树查找 (BST Search)** | 二叉搜索树 | O(log n) | O(n) | O(1) | 树不能极度失衡 |

## 2.  基础数组查找算法

### 2.1 顺序查找 / 线性查找

这是最基础、最直接的查找方式。它按顺序遍历数据结构中的每一个元素，依次与目标值进行比对，直到找到为止。

*   **核心思想：** 暴力遍历。
*   **适用场景：** 数据量较小，或者数据完全无序，且无法提前建立索引或排序。

**示例**

```javascript
/**
 * 顺序查找
 * @param {Array} arr 待查找数组
 * @param {Number/String} target 目标值
 * @returns {Number} 目标值的索引，未找到返回 -1
 */
function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
    }
    return -1;
}

// 实际开发中，推荐使用 JS 原生方法：
// const index = arr.indexOf(target);
// const item = arr.find(element => element === target);
// const foundIndex = arr.findIndex(element => element.id === target);
```

### 2.2 二分查找 / 折半查找

二分查找是基于**分治思想**的经典算法。它每次都将目标值与搜索范围的“中间”元素进行比较，如果目标值小于中间元素，则在左半部分继续搜索；如果大于，则在右半部分搜索。
**绝对前提：数组必须是已经排好序的。**

*   **核心思想：** 每次排除一半的候选数据。
*   **适用场景：** 静态的、已排序的大规模数组查找。

**示例**

```javascript
/**
 * 二分查找 (非递归实现)
 * @param {Array} arr 已排序的数组 (假设为升序)
 * @param {Number} target 目标值
 * @returns {Number} 目标值的索引，未找到返回 -1
 */
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) { 
        // 关键点1：条件必须是 left <= right
        
        // 关键点2：防止 (left + right) 数值过大导致溢出 (虽然 JS 中数字安全上限很高，但这是算法标准写法)
        // 位运算写法：let mid = left + ((right - left) >> 1);
        let mid = left + Math.floor((right - left) / 2); 

        if (arr[mid] === target) {
            return mid; // 找到了
        } else if (arr[mid] < target) {
            left = mid + 1; // 目标在右半区，调整左边界
        } else {
            right = mid - 1; // 目标在左半区，调整右边界
        }
    }
    return -1;
}
```

### 2.3 插值查找

插值查找是二分查找的进阶版本。它不再死板地每次都取正中间的元素，而是**根据目标值的大小，自适应地预测目标值可能出现的位置**。就像查字典时，找以 'A' 开头的单词会直接翻到前面，找以 'Z' 开头的会直接翻到后面。

*   **核心预测公式：** `mid = left + (right - left) * (target - arr[left]) / (arr[right] - arr[left])`
*   **适用场景：** 数据量极大，且数据**不仅有序，而且分布极其均匀**（如连续的数字序列）。

**示例**

```javascript
/**
 * 插值查找
 * @param {Array} arr 已排序且分布均匀的数组
 * @param {Number} target 目标值
 */
function interpolationSearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    // 注意：必须确保 target 在数组的极值范围内，否则公式计算可能越界
    while (left <= right && target >= arr[left] && target <= arr[right]) {
        if (left === right) {
            if (arr[left] === target) return left;
            return -1;
        }

        // 核心：自适应计算探测位置
        let pos = left + Math.floor(
            (right - left) * (target - arr[left]) / (arr[right] - arr[left])
        );

        if (arr[pos] === target) {
            return pos;
        }
        if (arr[pos] < target) {
            left = pos + 1;
        } else {
            right = pos - 1;
        }
    }
    return -1;
}
```

## 3. 基于高级数据结构的查找

在复杂的业务场景或底层系统设计中，单纯的数组结构往往无法满足高效的频繁增、删、查需求。这时，我们需要借助更高级的数据结构。

### 3.1 哈希查找

哈希查找的核心思想是**空间换时间**。它通过一个**哈希函数**，将键（Key）直接映射到内存中的一个位置，从而实现近乎 **O(1)** 的超高查询效率。

在 JavaScript 中，原生的 `Object`、`Map` 和 `Set` 底层都高度依赖哈希表结构。

*   **适用场景：** 需要极高的单点查询速度，且不在乎数据是否有序的场景（如缓存系统、字典实现）。

####  JavaScript 代码模拟

```javascript
/**
 * 使用 JavaScript 内置 Map 演示哈希查找的应用
 */
class Dictionary {
    constructor() {
        // 推荐使用 Map 而不是纯 Object，因为 Map 为频繁增删查改做了专门优化
        this.hashTable = new Map(); 
    }

    // 插入数据 (构建哈希表): 平均 O(1)
    insert(key, value) {
        this.hashTable.set(key, value);
    }

    // 哈希查找: 平均 O(1)
    search(key) {
        if (this.hashTable.has(key)) {
            return this.hashTable.get(key); // 直接命中，无需遍历
        }
        return null; // 未找到
    }
}

const dict = new Dictionary();
dict.insert("EMP_001", { name: "Alice", department: "Engineering" });
dict.insert("EMP_002", { name: "Bob", department: "HR" });

// 瞬间查出目标数据
console.log(dict.search("EMP_001")); 
```

### 3.2  二叉搜索树查找

二叉搜索树（BST）是一种特殊的二叉树，它具有天然的排序特性：
**对于任意节点，其左子树上所有节点的值均小于该节点的值；其右子树上所有节点的值均大于该节点的值。**

这使得在 BST 中查找数据，本质上也是在做“动态的二分查找”。

*   **适用场景：** 数据需要频繁地动态插入、删除，同时又需要保持有序并支持高效查找的场景。

**示例**

```javascript
// 1. 定义树节点
class TreeNode {
    constructor(val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
}

// 2. BST 查找实现
class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    // ... 假设这里有 insert 方法构建了树 ...

    /**
     * 在 BST 中查找特定值 (递归实现)
     * @param {TreeNode} node 当前搜索的起始节点 (通常传入 this.root)
     * @param {Number} target 目标值
     * @returns {TreeNode | null} 找到的节点对象，未找到返回 null
     */
    search(node, target) {
        // 基线条件：节点为空（找到底了没找到），或找到了目标
        if (node === null || node.val === target) {
            return node;
        }
        
        // 目标值小于当前节点，继续向左子树深入查找
        if (target < node.val) {
            return this.search(node.left, target);
        } 
        // 目标值大于当前节点，继续向右子树深入查找
        else {
            return this.search(node.right, target);
        }
    }
}
```


