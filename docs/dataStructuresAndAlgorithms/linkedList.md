#  链表与双向链表

## 1. 核心概念对比

**链表 (Linked List)** 是一种线性数据结构，其元素在内存中非连续存放。每个元素（节点）包含数据本身以及指向其他节点的指针（引用）。

**单向链表 vs 双向链表**

| 特性 | 单向链表 (Singly Linked List) | 双向链表 (Doubly Linked List) |
| :--- | :--- | :--- |
| **遍历方向** | 只能从头到尾**单向**遍历。 | 可以从头到尾，也可以从尾到头**双向**遍历。 |
| **内存占用** | 较小（只需存 1 个指针）。 | 较大（需存 2 个指针）。 |
| **删除特定节点** | $O(n)$：因为需要从头遍历找到该节点的前驱节点，才能修改指针。 | $O(1)$：因为节点自身就保存了前驱节点的指针，无需从头查找。 |
| **实现复杂度** | 简单。 | 复杂（插入、删除时需要同时维护前后两个方向的指针断裂与重连）。 |

## 2. 使用 JS 面向对象模拟单向链表

在 JS 中，我们使用对象引用来模拟“指针”的概念。

### 2.1 定义节点类 (Node)
```js
class Node {
  constructor(element) {
    this.element = element; // 存储当前节点的数据
    this.next = null;       // 指向下一个节点的引用，默认为 null
  }
}
```

### 2.2 定义链表类 (LinkedList) 并实现核心方法
```js
class LinkedList {
  constructor() {
    this.head = null;  // 链表的头指针
    this.count = 0;    // 记录链表的长度
  }

  // 1. 在链表尾部追加元素
  push(element) {
    const node = new Node(element);
    let current;
    
    // 场景 A: 链表为空，直接将 head 指向新节点
    if (this.head === null) {
      this.head = node;
    } else {
      // 场景 B: 链表不为空，需要从 head 开始遍历，直到找到最后一个节点
      current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      // 将最后一个节点的 next 指向新节点
      current.next = node;
    }
    this.count++;
  }

  // 2. 根据特定位置移除一个元素
  removeAt(index) {
    // 越界检查
    if (index >= 0 && index < this.count) {
      let current = this.head;

      // 场景 A: 移除第一项
      if (index === 0) {
        this.head = current.next; 
      } else {
        // 场景 B: 移除中间或尾部的项
        let previous;
        // 迭代找到要移除的目标节点 (current) 及其前一个节点 (previous)
        for (let i = 0; i < index; i++) {
          previous = current;
          current = current.next;
        }
        // 核心跳过逻辑：将前一个节点的 next 直接指向目标节点的 next
        // 被跳过的 current 节点因为没有了引用，会被 JS 的垃圾回收机制回收
        previous.next = current.next;
      }
      this.count--;
      return current.element; // 返回被移除的元素
    }
    return undefined;
  }

  // 3. 在任意位置插入一个元素
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element);
      
      if (index === 0) {
        // 插入在头部
        const current = this.head;
        node.next = current;
        this.head = node;
      } else {
        // 插入在中间或尾部
        let previous;
        let current = this.head;
        for (let i = 0; i < index; i++) {
          previous = current;
          current = current.next;
        }
        // 先将新节点的 next 指向 current
        node.next = current;
        // 再将前一个节点的 next 指向新节点
        previous.next = node;
      }
      this.count++;
      return true;
    }
    return false; // 索引越界，插入失败
  }

  // 4. 返回元素在链表中的索引（找不到返回 -1）
  indexOf(element) {
    let current = this.head;
    for (let i = 0; i < this.count && current != null; i++) {
      if (element === current.element) {
        return i;
      }
      current = current.next;
    }
    return -1;
  }

  // 5. 辅助方法：打印链表内容
  toString() {
    if (this.head == null) return '';
    let objString = `${this.head.element}`;
    let current = this.head.next;
    while (current != null) {
      objString = `${objString} -> ${current.element}`;
      current = current.next;
    }
    return objString;
  }

  size() { return this.count; }
  isEmpty() { return this.count === 0; }
}

// === 测试演示 ===
const list = new LinkedList();
list.push("Alice");
list.push("Bob");
list.push("Charlie");
console.log(list.toString()); // Alice -> Bob -> Charlie

list.insert("David", 1);
console.log(list.toString()); // Alice -> David -> Bob -> Charlie

list.removeAt(2); // 移除 Bob
console.log(list.toString()); // Alice -> David -> Charlie
```

## 3. 使用 JS 模拟双向链表

因为单向链表在上一份文档中已经详细实现过，这里我们重点展示更为复杂、也更强大的**双向链表**的实现。

### 3.1 定义双向节点类 (DoublyNode)
双向节点继承自普通节点，但多了一个 `prev` 属性。

```js
class Node {
  constructor(element) {
    this.element = element;
    this.next = null;
  }
}

class DoublyNode extends Node {
  constructor(element) {
    super(element); // 调用父类构造函数初始化 element 和 next
    this.prev = null; // 新增：指向前一个节点的指针
  }
}
```

### 3.2 定义双向链表类 (DoublyLinkedList)
双向链表不仅需要保存 `head`，通常还需要保存 `tail`（尾节点），以支持从后往前的高效操作。

```js
class DoublyLinkedList {
  constructor() {
    this.head = null;  // 头指针
    this.tail = null;  // 尾指针
    this.count = 0;    // 节点数量
  }

  // 1. 在任意位置插入元素 (核心难点：维护四个指针的指向)
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new DoublyNode(element);
      let current = this.head;

      // 场景 A: 插入在头部
      if (index === 0) {
        if (this.head == null) { 
          // 链表为空时，新节点既是头也是尾
          this.head = node;
          this.tail = node;
        } else {
          node.next = this.head;
          current.prev = node;
          this.head = node;
        }
      } 
      // 场景 B: 插入在尾部 (利用 tail 指针，O(1) 复杂度)
      else if (index === this.count) {
        current = this.tail;
        current.next = node;
        node.prev = current;
        this.tail = node;
      } 
      // 场景 C: 插入在中间
      else {
        let previous;
        // 从头遍历找到目标位置 (也可以优化：判断 index 如果大于一半就从 tail 开始反向找)
        for (let i = 0; i < index; i++) {
          previous = current;
          current = current.next;
        }
        // 核心：四步指针重连
        node.next = current;
        previous.next = node;
        current.prev = node;
        node.prev = previous;
      }
      this.count++;
      return true;
    }
    return false;
  }

  // 2. 根据特定位置移除元素
  removeAt(index) {
    if (index >= 0 && index < this.count) {
      let current = this.head;

      // 场景 A: 移除头部第一项
      if (index === 0) {
        this.head = current.next;
        // 如果链表只有一项，移除后 tail 也要置空
        if (this.count === 1) {
          this.tail = null;
        } else {
          this.head.prev = null;
        }
      } 
      // 场景 B: 移除尾部最后一项
      else if (index === this.count - 1) {
        current = this.tail;
        this.tail = current.prev;
        this.tail.next = null;
      } 
      // 场景 C: 移除中间项
      else {
        let previous;
        for (let i = 0; i < index; i++) {
          previous = current;
          current = current.next;
        }
        // 核心：跳过 current 节点
        previous.next = current.next;
        current.next.prev = previous;
      }
      this.count--;
      return current.element;
    }
    return undefined;
  }

  // 3. 在尾部追加元素 (复用 insert)
  push(element) {
    this.insert(element, this.count);
  }

  // 4. 正向打印 (测试用)
  toString() {
    if (this.head == null) return '';
    let objString = `${this.head.element}`;
    let current = this.head.next;
    while (current != null) {
      objString = `${objString} <-> ${current.element}`;
      current = current.next;
    }
    return objString;
  }

  // 5. 反向打印 (测试用，验证 prev 指针是否全部正确)
  inverseToString() {
    if (this.tail == null) return '';
    let objString = `${this.tail.element}`;
    let previous = this.tail.prev;
    while (previous != null) {
      objString = `${objString} <-> ${previous.element}`;
      previous = previous.prev;
    }
    return objString;
  }
}

// === 测试演示 ===
const dList = new DoublyLinkedList();
dList.push("John");
dList.push("Jack");
dList.push("Camila");

console.log(dList.toString());        // John <-> Jack <-> Camila
console.log(dList.inverseToString()); // Camila <-> Jack <-> John (反向遍历成功)

dList.insert("Alice", 1);
console.log(dList.toString());        // John <-> Alice <-> Jack <-> Camila
```

## 4. 常见问题 (FAQ) 与应用场景

### 4.1 既然双向链表更强大，删除更快，为什么不全用双向链表？
*   **空间成本**：双向链表的每个节点都需要额外分配内存来存储 `prev` 指针。在处理海量极其简单的数据时，这部分额外开销不可忽视。
*   **维护成本**：从上面的代码可以看出，双向链表在增删节点时，涉及的指针操作翻倍（从单向的 2 步变成 4 步）。代码更容易写错，出现“指针断裂”导致内存泄漏或死循环。
*   **结论**：如果你的业务场景主要是**只读遍历**或**尾部追加**，单向链表足够了。如果需要频繁在**两端和中间**插入删除，双向链表才是利器。

### 4.2 JavaScript 引擎底层用到双向链表了吗？
*   **是的，非常多。**
*   **浏览器的 LRU (最近最少使用) 缓存淘汰算法**：底层通常使用 `哈希表 + 双向链表` 实现。哈希表保证 $O(1)$ 的查找，双向链表保证在 $O(1)$ 的时间内将最新访问的节点移到头部，淘汰尾部的最老节点。
*   **JS 引擎的垃圾回收机制 (Garbage Collection)**：在维护对象的引用图时，某些内部结构会使用双向链表以便快速剥离无用的对象。

### 4.3 面试高频：什么是“哨兵节点” (Dummy Node / Sentinel Node)？
*   在手写链表算法（尤其是单向链表）时，处理**头部节点的插入和删除**往往需要写特殊的 `if-else` 分支（就像上面代码的 `index === 0` 场景）。
*   **哨兵节点**是一个不存储有效数据的“假头部”。
    *   在初始化时：`this.head = new Node("dummy")`。
    *   这样一来，真正的第一个有效节点其实是 `this.head.next`。
    *   **好处**：这使得在头部插入/删除的逻辑，与在中间插入/删除的逻辑**完全一致**，代码会变得极其简洁优雅。在 LeetCode 刷题时，强烈建议使用哨兵节点技巧。