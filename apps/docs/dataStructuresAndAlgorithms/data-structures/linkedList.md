# 链表与双向链表

## 1. 核心概念对比

**链表 (Linked List)** 是一种线性数据结构，其元素在内存中非连续存放。每个元素（节点）包含数据本身以及指向其他节点的指针（引用）。

[width(18,36,46)]

| 特性             | 单向链表 (Singly Linked List)                                | 双向链表 (Doubly Linked List)                                  |
| :--------------- | :----------------------------------------------------------- | :------------------------------------------------------------- |
| **遍历方向**     | 只能从头到尾**单向**遍历。                                   | 可以从头到尾，也可以从尾到头**双向**遍历。                     |
| **内存占用**     | 较小（只需存 1 个指针）。                                    | 较大（需存 2 个指针）。                                        |
| **删除特定节点** | $O(n)$：因为需要从头遍历找到该节点的前驱节点，才能修改指针。 | $O(1)$：因为节点自身就保存了前驱节点的指针，无需从头查找。     |
| **实现复杂度**   | 简单。                                                       | 复杂（插入、删除时需要同时维护前后两个方向的指针断裂与重连）。 |

### 1.1 节点结构与常用术语

[width(32,68)]

| 术语                            | 说明                                                                       |
| :------------------------------ | :------------------------------------------------------------------------- |
| **节点 (Node)**                 | 链表的最小存储单元，由「数据域」和「指针域」两部分组成。                   |
| **数据域 (data / element)**     | 存放真正的业务数据，类型任意。                                             |
| **指针域 (next / prev)**        | 存放相邻节点的引用，链表为空的终点用 `null` 表示。                         |
| **头指针 `head`**               | 指向第一个节点，是访问整条链表的唯一入口。                                 |
| **尾指针 `tail`**               | 指向最后一个节点，双向链表用它把尾部插入 / 删除降到 $O(1)$。               |
| **长度 `length` / `count`**     | 节点个数，单独维护可让 `size()` 从 $O(n)$ 降到 $O(1)$。                    |
| **哨兵节点 (dummy / sentinel)** | 不存有效数据的「假头」，让头部增删和中间增删走同一套逻辑，省去 `if` 特判。 |

### 1.2 链表的三种形态

[width(9,63,28)]

| 形态         | 结构特点                                                                                     | 典型用途                                     |
| :----------- | :------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **单向链表** | 每个节点只有 `next`，只能从头往后走。                                                        | 简单的队列、栈、只追加的日志链。             |
| **双向链表** | 每个节点同时有 `next` 和 `prev`，可前后双向遍历，已知节点时可 $O(1)$ 删除。                  | LRU 缓存、浏览器历史、编辑器的撤销 / 重做。  |
| **循环链表** | 尾节点的 `next` 指回头节点（双向则是首尾互指），没有 `null` 终点，遍历需靠「回到起点」终止。 | 轮播图、约瑟夫环、操作系统的时间片轮转调度。 |

## 2. 使用 JS 面向对象模拟单向链表

在 JS 中，我们使用对象引用来模拟“**指针**”的概念。

### 2.1 定义节点类 (Node)

```js
class Node {
  constructor(element) {
    this.element = element // 存储当前节点的数据
    this.next = null // 指向下一个节点的引用，默认为 null
  }
}
```

### 2.2 定义链表类 (LinkedList)

```js
class LinkedList {
  constructor() {
    this.head = null // 链表的头指针
    this.count = 0 // 记录链表的长度
  }

  // 1. 在链表尾部追加元素
  push(element) {
    const node = new Node(element)
    let current

    // 场景 A: 链表为空，直接将 head 指向新节点
    if (this.head === null) {
      this.head = node
    } else {
      // 场景 B: 链表不为空，需要从 head 开始遍历，直到找到最后一个节点
      current = this.head
      while (current.next !== null) {
        current = current.next
      }
      // 将最后一个节点的 next 指向新节点
      current.next = node
    }
    this.count++
  }

  // 2. 根据特定位置移除一个元素
  removeAt(index) {
    // 越界检查
    if (index >= 0 && index < this.count) {
      let current = this.head

      // 场景 A: 移除第一项
      if (index === 0) {
        this.head = current.next
      } else {
        // 场景 B: 移除中间或尾部的项
        let previous
        // 迭代找到要移除的目标节点 (current) 及其前一个节点 (previous)
        for (let i = 0; i < index; i++) {
          previous = current
          current = current.next
        }
        // 核心跳过逻辑：将前一个节点的 next 直接指向目标节点的 next
        // 被跳过的 current 节点因为没有了引用，会被 JS 的垃圾回收机制回收
        previous.next = current.next
      }
      this.count--
      return current.element // 返回被移除的元素
    }
    return undefined
  }

  // 3. 在任意位置插入一个元素
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new Node(element)

      if (index === 0) {
        // 插入在头部
        const current = this.head
        node.next = current
        this.head = node
      } else {
        // 插入在中间或尾部
        let previous
        let current = this.head
        for (let i = 0; i < index; i++) {
          previous = current
          current = current.next
        }
        // 先将新节点的 next 指向 current
        node.next = current
        // 再将前一个节点的 next 指向新节点
        previous.next = node
      }
      this.count++
      return true
    }
    return false // 索引越界，插入失败
  }

  // 4. 返回元素在链表中的索引（找不到返回 -1）
  indexOf(element) {
    let current = this.head
    for (let i = 0; i < this.count && current != null; i++) {
      if (element === current.element) {
        return i
      }
      current = current.next
    }
    return -1
  }

  // 5. 辅助方法：打印链表内容
  toString() {
    if (this.head == null) return ''
    let objString = `${this.head.element}`
    let current = this.head.next
    while (current != null) {
      objString = `${objString} -> ${current.element}`
      current = current.next
    }
    return objString
  }

  size() {
    return this.count
  }
  isEmpty() {
    return this.count === 0
  }
}

// === 测试演示 ===
const list = new LinkedList()
list.push('Alice')
list.push('Bob')
list.push('Charlie')
console.log(list.toString()) // Alice -> Bob -> Charlie

list.insert('David', 1)
console.log(list.toString()) // Alice -> David -> Bob -> Charlie

list.removeAt(2) // 移除 Bob
console.log(list.toString()) // Alice -> David -> Charlie
```

## 3. 使用 JS 模拟双向链表

### 3.1 定义双向节点类 (DoublyNode)

双向节点继承自普通节点，但多了一个 `prev` 属性。

```js
class Node {
  constructor(element) {
    this.element = element
    this.next = null
  }
}

class DoublyNode extends Node {
  constructor(element) {
    super(element) // 调用父类构造函数初始化 element 和 next
    this.prev = null // 新增：指向前一个节点的指针
  }
}
```

### 3.2 定义双向链表类 (DoublyLinkedList)

双向链表不仅需要保存 `head`，通常还需要保存 `tail`（尾节点），以支持从后往前的高效操作。

```js
class DoublyLinkedList {
  constructor() {
    this.head = null // 头指针
    this.tail = null // 尾指针
    this.count = 0 // 节点数量
  }

  // 1. 在任意位置插入元素 (核心难点：维护四个指针的指向)
  insert(element, index) {
    if (index >= 0 && index <= this.count) {
      const node = new DoublyNode(element)
      let current = this.head

      // 场景 A: 插入在头部
      if (index === 0) {
        if (this.head == null) {
          // 链表为空时，新节点既是头也是尾
          this.head = node
          this.tail = node
        } else {
          node.next = this.head
          current.prev = node
          this.head = node
        }
      }
      // 场景 B: 插入在尾部 (利用 tail 指针，O(1) 复杂度)
      else if (index === this.count) {
        current = this.tail
        current.next = node
        node.prev = current
        this.tail = node
      }
      // 场景 C: 插入在中间
      else {
        let previous
        // 从头遍历找到目标位置 (也可以优化：判断 index 如果大于一半就从 tail 开始反向找)
        for (let i = 0; i < index; i++) {
          previous = current
          current = current.next
        }
        // 核心：四步指针重连
        node.next = current
        previous.next = node
        current.prev = node
        node.prev = previous
      }
      this.count++
      return true
    }
    return false
  }

  // 2. 根据特定位置移除元素
  removeAt(index) {
    if (index >= 0 && index < this.count) {
      let current = this.head

      // 场景 A: 移除头部第一项
      if (index === 0) {
        this.head = current.next
        // 如果链表只有一项，移除后 tail 也要置空
        if (this.count === 1) {
          this.tail = null
        } else {
          this.head.prev = null
        }
      }
      // 场景 B: 移除尾部最后一项
      else if (index === this.count - 1) {
        current = this.tail
        this.tail = current.prev
        this.tail.next = null
      }
      // 场景 C: 移除中间项
      else {
        let previous
        for (let i = 0; i < index; i++) {
          previous = current
          current = current.next
        }
        // 核心：跳过 current 节点
        previous.next = current.next
        current.next.prev = previous
      }
      this.count--
      return current.element
    }
    return undefined
  }

  // 3. 在尾部追加元素 (复用 insert)
  push(element) {
    this.insert(element, this.count)
  }

  // 4. 正向打印 (测试用)
  toString() {
    if (this.head == null) return ''
    let objString = `${this.head.element}`
    let current = this.head.next
    while (current != null) {
      objString = `${objString} <-> ${current.element}`
      current = current.next
    }
    return objString
  }

  // 5. 反向打印 (测试用，验证 prev 指针是否全部正确)
  inverseToString() {
    if (this.tail == null) return ''
    let objString = `${this.tail.element}`
    let previous = this.tail.prev
    while (previous != null) {
      objString = `${objString} <-> ${previous.element}`
      previous = previous.prev
    }
    return objString
  }
}

// === 测试演示 ===
const dList = new DoublyLinkedList()
dList.push('John')
dList.push('Jack')
dList.push('Camila')

console.log(dList.toString()) // John <-> Jack <-> Camila
console.log(dList.inverseToString()) // Camila <-> Jack <-> John (反向遍历成功)

dList.insert('Alice', 1)
console.log(dList.toString()) // John <-> Alice <-> Jack <-> Camila
```

## 4. 典型应用场景

链表在真实前端工程里出现的频率比想象中高，下面这些场景几乎都会在面试里被追问。

### 4.1 LRU 缓存（哈希表 + 双向链表）

LRU (Least Recently Used，最近最少使用) 的经典实现是「哈希表 + 双向链表」：哈希表负责 $O(1)$ 定位节点，双向链表负责 $O(1)$ 调整顺序——被访问的节点移到头部，容量超限时从尾部淘汰。

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity
    // JS 的 Map 天然保持插入顺序，可直接当双向链表用
    this.map = new Map()
  }

  get(key) {
    if (!this.map.has(key)) return -1
    const value = this.map.get(key)
    this.map.delete(key) // 先删再插，等价于把节点移到链表头部
    this.map.set(key, value)
    return value
  }

  put(key, value) {
    if (this.map.has(key)) this.map.delete(key)
    this.map.set(key, value)
    if (this.map.size > this.capacity) {
      // map.keys().next().value 就是最久未使用的键（链表尾部）
      this.map.delete(this.map.keys().next().value)
    }
  }
}
```

> [!TIP]
> 手写题里若要求「不能用 Map」，就用普通对象做哈希表 + 自己实现双向链表的 `head` / `tail`；思路完全一致，只是把 Map 的插入顺序换成显式的 `prev` / `next` 指针。

### 4.2 React Fiber：用链表串起 child / sibling / return

React 16 之后的核心调度结构 Fiber 树，节点之间只用三个指针相连：

- `child`：指向第一个子节点。
- `sibling`：指向下一个兄弟节点。
- `return`：指向父节点（这个名字历史上叫 `parent`，改名是为了避免和 DOM 的 parent 混淆）。

多叉树因此被「扁平化」成一条条链表，React 得以随时中断渲染、再靠这三个指针恢复现场，实现可中断的增量渲染。

```markdown
        App
         |  child
         v
       Header -sibling-> Main -sibling-> Footer
         ^                                   |
         +------------- return -------------+
```

### 4.3 原型链本质上是一条单向链表

JS 的对象沿 `[[Prototype]]`（可读作 `__proto__`）向上查找属性，这个过程就是沿一条单向链表遍历：每个对象是节点，`[[Prototype]]` 是指针，终点是 `null`。

```js
const arr = []
Object.getPrototypeOf(arr) === Array.prototype // true
Object.getPrototypeOf(Array.prototype) === Object.prototype // true
Object.getPrototypeOf(Object.prototype) === null // 链表的终点
```

### 4.4 撤销 / 重做与浏览器历史

- **撤销栈**：编辑器的 undo / redo 用两个栈互相倒；若需要在历史中间跳转或删除某一步，改用双向链表会更方便摘除节点。
- **浏览器历史**：前进 / 后退需要同时向两个方向移动，天然对应双向链表；Vue Router、React Router 的 history 栈就是这种结构。

## 5. 常见问题 (FAQ)

### 5.1 既然双向链表更强大，删除更快，为什么不全用双向链表？

- **空间成本**：双向链表的每个节点都需要额外分配内存来存储 `prev` 指针。在处理海量极其简单的数据时，这部分额外开销不可忽视。
- **维护成本**：双向链表在增删节点时，涉及的指针操作翻倍（从单向的 2 步变成 4 步）。代码更容易写错，出现“**指针断裂**”导致内存泄漏或死循环。
- **结论**：如果你的业务场景主要是**只读遍历**或**尾部追加**，单向链表足够了。如果需要频繁在**两端和中间**插入删除，双向链表才是利器。

### 5.2 JavaScript 引擎底层用到双向链表了吗？

- **是的，非常多。**
- **浏览器的 LRU (最近最少使用) 缓存淘汰算法**：底层通常使用 `哈希表 + 双向链表` 实现。哈希表保证 $O(1)$ 的查找，双向链表保证在 $O(1)$ 的时间内将最新访问的节点移到头部，淘汰尾部的最老节点。
- **JS 引擎的垃圾回收机制 (Garbage Collection)**：在维护对象的引用图时，某些内部结构会使用双向链表以便快速剥离无用的对象。

### 5.3 面试高频：什么是“**哨兵节点**” (Dummy Node / Sentinel Node)？

- 在手写链表算法（尤其是单向链表）时，处理**头部节点的插入和删除**往往需要写特殊的 `if-else` 分支（就像上面代码的 `index === 0` 场景）。
- **哨兵节点**是一个不存储有效数据的“**假头部**”。
  - 在初始化时：`this.head = new Node("dummy")`。
  - 这样一来，真正的第一个有效节点其实是 `this.head.next`。
  - **好处**：这使得在头部插入/删除的逻辑，与在中间插入/删除的逻辑**完全一致**，代码会变得极其简洁优雅。在 LeetCode 刷题时，强烈建议使用哨兵节点技巧。

### 5.4 如何反转一个链表？（迭代 + 递归）

- **迭代法**：用三个指针 `prev` / `curr` / `next` 边走边反向。时间 $O(n)$，空间 $O(1)$，是首选写法。

```js
function reverseList(head) {
  let prev = null
  let curr = head
  while (curr !== null) {
    const next = curr.next // 先保存后继，否则改完指针就找不到后面的节点了
    curr.next = prev // 反转指针方向
    prev = curr // prev 前进一格
    curr = next // curr 前进一格
  }
  return prev // 循环结束时 prev 就是新的头节点
}
```

- **递归法**：先递归到链表末尾拿到新头节点，再在回溯过程中把后一个节点的 `next` 指回自己。时间 $O(n)$，但递归深度为 $n$，空间 $O(n)$，链表很长时会爆栈。

```js
function reverseListRecursive(head) {
  if (head === null || head.next === null) return head
  const newHead = reverseListRecursive(head.next)
  head.next.next = head // 让后一个节点指回自己
  head.next = null // 断开原来的正向指针，避免形成环
  return newHead
}
```

### 5.5 快慢指针如何找中点、又怎么判断链表有环？

- **找中点**：快指针每次走两步，慢指针走一步。快指针到尾时，慢指针刚好在一半位置。
- **判断有环 (Floyd 判圈算法 / 龟兔赛跑)**：如果链表有环，快指针会在环里不断绕圈，最终一定追上慢指针；如果无环，快指针会先走到 `null`。

```js
function middleNode(head) {
  let slow = head
  let fast = head
  while (fast !== null && fast.next !== null) {
    slow = slow.next
    fast = fast.next.next
  }
  return slow // 节点数为偶数时返回靠后的那个中间节点
}

function hasCycle(head) {
  let slow = head
  let fast = head
  while (fast !== null && fast.next !== null) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) return true // 相遇即有环
  }
  return false
}
```

> [!NOTE]
> 想顺手求出「环的入口节点」，可在快慢指针相遇后，把其中一个指针放回头部，两个指针改为每次各走一步，再次相遇处就是入环点。

### 5.6 如何合并两个有序链表？(LeetCode 21)

用**哨兵节点**省去「结果链表的头节点还没确定」的分支，再用一个 `tail` 指针不断接上较小的节点，最后把没走完的那条链整体接上即可。

```js
function mergeTwoLists(l1, l2) {
  const dummy = new Node(0) // 哨兵节点
  let tail = dummy
  while (l1 !== null && l2 !== null) {
    if (l1.element <= l2.element) {
      tail.next = l1
      l1 = l1.next
    } else {
      tail.next = l2
      l2 = l2.next
    }
    tail = tail.next
  }
  tail.next = l1 !== null ? l1 : l2 // 接上剩余的整条链
  return dummy.next // 真正的头节点是哨兵的下一个
}
```

### 5.7 如何删除链表的倒数第 N 个节点？(LeetCode 19)

**一次遍历**即可：让快指针先走 `n + 1` 步，然后快慢指针同步前进；快指针到达 `null` 时，慢指针正好停在待删节点的**前驱**上，执行 `slow.next = slow.next.next` 断开即可。加哨兵节点还能顺带处理「删除的正好是头节点」的情况。

```js
function removeNthFromEnd(head, n) {
  const dummy = new Node(0)
  dummy.next = head
  let fast = dummy
  let slow = dummy
  for (let i = 0; i <= n; i++) {
    fast = fast.next
  }
  while (fast !== null) {
    fast = fast.next
    slow = slow.next
  }
  slow.next = slow.next.next // 跳过倒数第 n 个节点
  return dummy.next
}
```

### 5.8 为什么 React Fiber 用链表而不是数组来组织子节点？

- **数组要求连续、长度固定**，在中间增删元素要整体搬移；而 React 的更新高度动态（任意位置插入、删除、复用），数组的改造成本很高。
- **链表支持 $O(1)$ 插入 / 删除**，并且 `child` / `sibling` / `return` 三个指针就能表达完整的树形结构，刚好匹配 Fiber「随时中断、随时恢复」的调度模型。
- **可中断的关键**：渲染中途被打断时，只要记住当前 Fiber 节点，靠 `return` 指针就能回到父级继续；数组方案则需要额外维护遍历下标和栈，代价更高。
