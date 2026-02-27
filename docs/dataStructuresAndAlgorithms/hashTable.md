# 哈希表 / 散列表

## 1. 核心概念与特性

**哈希表 (Hash Table)**，也叫散列表，是根据**键 (Key)** 直接访问在内存存储位置的**值 (Value)** 的数据结构。

它的核心理念极其极其强大：它能在 **$O(1)$ 的时间复杂度**内完成数据的查找、插入和删除操作。这种性能在处理海量数据时是其他数据结构难以企及的。

### 1.1 它是如何做到 $O(1)$ 查找的？(核心原理)

这就好比去图书馆找一本书：
*   **数组/链表 (遍历)**：你需要从第一个书架一本本看过去，直到找到你要的书 ($O(n)$)。
*   **哈希表**：你拿着书名（Key）去问图书管理员（**哈希函数 Hash Function**），管理员直接告诉你一个精确的架子号（**数组索引 Index**）。你直接走到那个架子前拿出书，一步到位 ($O(1)$)。

**流程**：`Key` $\xrightarrow{\text{哈希函数}}$ `Index (数字)` $\xrightarrow{\text{存入底层的连续数组}}$ `Value`。

### 1.2 什么是“哈希冲突 (Hash Collision)”？

既然哈希函数的输出对应着数组的索引，而数组的大小总是有限的，那么不同的键（Key）完全有可能被哈希函数算出**相同的索引**。

这就像两个不同的人去存包，结果管理员给了他们同一个柜子的钥匙。这就是**哈希冲突**。
一个优秀的哈希表设计，不仅要有一个能将键均匀散列的哈希函数，还要有完美的解决冲突的方案。

## 2. 解决哈希冲突的两大主流方案

### 2.1 分离链接法 / 链地址法 (Separate Chaining) —— 本文主要实现
这也是 Java 中 `HashMap` 底层使用的主流方式。
**原理**：哈希表底层的数组不再直接存 Value，而是存一个**单向链表（或数组/红黑树）**。当发生冲突时，大家都排队挂在这个链表后面。
查找时，先通过哈希函数找到数组索引，然后再遍历这个位置上的链表去比对真正的 Key。

### 2.2 开放寻址法 (Open Addressing) / 线性探查
**原理**：底层只用一个一维数组。如果管理员给你分配的 5 号柜子已经有人用了，你就在旁边按顺序找（6号、7号...），直到找到一个空柜子为止。
**缺点**：在哈希表快满的时候，寻找空位的过程会变得极其漫长，容易产生“聚集（Cluster）”现象，导致性能暴跌。

## 3. 手写模拟实现哈希表 (链地址法 + 自动扩容)

我们要实现一个专业的哈希表。为了防止数据量变大导致链表过长（从而使查询退化为 $O(n)$），我们必须引入**负载因子 (Load Factor)** 和**自动扩容 (Resize)** 机制。

```js
// 内部类：用于存储在链表中的键值对
class ValuePair {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
}

class HashTable {
  constructor(initialCapacity = 16) {
    this.table = new Array(initialCapacity); // 底层存储数组
    this.count = 0;                          // 记录实际存储的键值对数量
    this.capacity = initialCapacity;         // 数组当前的容量
    this.LOAD_FACTOR_THRESHOLD = 0.75;       // 扩容阈值（工业标准通常是 0.75）
  }

  // --- 核心魔法：哈希函数 (djb2 算法的简化版) ---
  // 它的任务是把传入的 key（通常转为字符串）变成一个合法的数组索引
  hashFunction(key) {
    let hash = 5381;
    const strKey = String(key);
    for (let i = 0; i < strKey.length; i++) {
      hash = (hash * 33) + strKey.charCodeAt(i);
    }
    // 必须用取余操作，确保索引不会超出当前数组的容量
    return hash % this.capacity; 
  }

  // --- 1. 设置键值对 (Set) ---
  put(key, value) {
    if (key == null || value == null) return false;

    // 如果当前元素数量达到了容量的 75%，触发扩容（扩大为原来的 2 倍）
    if (this.count >= this.capacity * this.LOAD_FACTOR_THRESHOLD) {
      this.resize(this.capacity * 2);
    }

    const index = this.hashFunction(key);

    // 解决冲突：分离链接法。如果这个位置还没有东西，就初始化一个空数组（模拟链表）
    if (this.table[index] == null) {
      this.table[index] = [];
    }

    const linkedList = this.table[index];

    // 遍历该位置的链表，检查 key 是否已经存在。如果存在，则更新 value
    for (let i = 0; i < linkedList.length; i++) {
      if (linkedList[i].key === key) {
        linkedList[i].value = value;
        return true;
      }
    }

    // 如果链表里没有这个 key，说明是新增，推入链表尾部
    linkedList.push(new ValuePair(key, value));
    this.count++;
    return true;
  }

  // --- 2. 获取值 (Get) ---
  get(key) {
    const index = this.hashFunction(key);
    const linkedList = this.table[index];

    // 如果该位置不为空，遍历链表寻找对应的 key
    if (linkedList != null) {
      for (let i = 0; i < linkedList.length; i++) {
        if (linkedList[i].key === key) {
          return linkedList[i].value;
        }
      }
    }
    return undefined; // 没找到
  }

  // --- 3. 删除键值对 (Remove) ---
  remove(key) {
    const index = this.hashFunction(key);
    const linkedList = this.table[index];

    if (linkedList != null) {
      for (let i = 0; i < linkedList.length; i++) {
        if (linkedList[i].key === key) {
          linkedList.splice(i, 1); // 从数组(链表)中删除该节点
          this.count--;
          
          // 优化：如果这个位置的链表被删空了，将其置为 undefined，方便垃圾回收
          if (linkedList.length === 0) {
            this.table[index] = undefined;
          }
          return true;
        }
      }
    }
    return false;
  }

  // --- 核心架构：自动扩容 (Resize) ---
  // 当哈希表装得太满时，必须扩容，否则冲突会剧增，导致性能下降
  resize(newCapacity) {
    console.log(`[系统提示] 触发扩容：${this.capacity} -> ${newCapacity}`);
    
    const oldTable = this.table; // 保存旧数据
    
    // 更新容量，并创建一个全新的、更大的空数组
    this.capacity = newCapacity;
    this.table = new Array(newCapacity);
    this.count = 0; // 重置计数器，因为接下来要重新 put

    // 遍历旧数组中的所有链表，并把里面的键值对【重新散列（Rehash）】到新数组中
    for (let i = 0; i < oldTable.length; i++) {
      const linkedList = oldTable[i];
      if (linkedList != null) {
        for (let j = 0; j < linkedList.length; j++) {
          // 因为 this.capacity 变了，所以计算出的 hash 索引会和原来不一样！
          this.put(linkedList[j].key, linkedList[j].value); 
        }
      }
    }
  }

  size() { return this.count; }
}

// === 测试演示 ===
const hashTable = new HashTable(4); // 故意设一个极小的初始容量来触发扩容

hashTable.put("John", "john@email.com");
hashTable.put("Tyrion", "tyrion@email.com");
hashTable.put("Aaron", "aaron@email.com"); // 到这里容量是 3， 3 >= 4 * 0.75，即将触发扩容！
hashTable.put("Donnie", "donnie@email.com");

console.log('获取 John:', hashTable.get("John")); 
console.log('获取未存在的 key:', hashTable.get("Jack")); 
console.log('当前元素个数:', hashTable.size());
```

## 4. 常见问题 (FAQ) 与算法面试高频考点

### 4.1 为什么哈希表查询的平均时间复杂度是 $O(1)$，但最坏情况是 $O(n)$？
*   **答**：在理想情况下，哈希函数非常优秀，把所有 Key 均匀地散列在数组中，没有冲突，直接通过索引取值，即 $O(1)$。
*   **最坏情况**：如果哈希函数写得很烂，或者恰好碰到了极其极端的测试用例，导致所有的 Key 算出来的哈希索引都一样！那么所有的数据都会挤在同一个位置的**链表**上。此时你在查找时，必须遍历这条包含了所有数据的单向链表，时间复杂度退化为 **$O(n)$**。

### 4.2 什么是负载因子 (Load Factor)？为什么要扩容？
*   **负载因子** = 当前存储的元素个数 / 底层数组的总容量。
*   如果一个大小为 100 的数组里存了 99 个元素，哪怕哈希函数再好，接下来插入的数据发生哈希冲突的概率也是极大的。冲突越多，链表越长，查询越慢。
*   所以，工业界（如 Java 的 HashMap）通常将阈值设为 **0.75**。一旦负载因子达到 0.75，就必须忍痛进行一次昂贵的扩容（翻倍）和 Rehash 操作，用空间来换取未来长久的 $O(1)$ 时间。

### 4.3 JavaScript 中自带哈希表吗？
*   **是的。**
*   ES5 时代的普通对象 `{}` 底层就是利用哈希表引擎来实现属性查找的。
*   ES6 引入的 **`Map` 和 `Set` 数据结构，其底层也是高度优化过的哈希表**。在现代开发中，除非为了算法练习，我们一律直接使用原生的 `Map` 或 `Set`。

### 4.4 面试题：如何解决哈希表在发生碰撞后链表过长导致查询变慢的问题？ (Java 1.8 优化)
*   **答**：如果在同一个索引位置冲突的节点实在太多（比如超过了 8 个），此时遍历链表就太慢了。优秀的现代哈希表实现（如 Java 1.8 的 HashMap），会在这时将**链表转化为红黑树 (Red-Black Tree)**。
*   这样，该位置上的最坏查询时间复杂度，就能从链表的 $O(n)$ 优化回红黑树的 **$O(\log n)$**。