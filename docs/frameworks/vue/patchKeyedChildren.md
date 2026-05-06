# `Diff`算法

在 Vue 3 的渲染管线中，当面对带有 `key` 的同层子节点数组更新时，Vue 会调用其最核心、也是最为前端圈津津乐道的**快速 Diff 算法 (Fast-Path Diffing Algorithm)**，即 `patchKeyedChildren` 函数。

## 1. `patchKeyedChildren` 函数入口

相比于 Vue 2 的双端比对算法，Vue 3 借鉴了 `inferno.js` 的设计思路，引入了前置/后置预处理和最长递增子序列 (Longest Increasing Subsequence, LIS)，极大地减少了 DOM 的移动操作。

:::code-group

```typescript [renderer.ts]
//diff算法
function patchKeyedChildren(
  c1: any,
  c2: any,
  container: any,
  parentComponent: any,
  parentAnchor: any,
) {
  //i：从头部开始同步的比对游标，初始值为 `0`。
  //e1(end 1)：旧子节点数组（old children）的尾部游标，初始值为 `c1.length - 1`。
  //e2(end 2)：新子节点数组（new children）的尾部游标，初始值为 `c2.length - 1`。
  let i: number = 0
  let e1: number = c1.length - 1
  let e2: number = c2.length - 1

  function isSameVnodeType(n1: any, n2: any) {
    //比对type和key  都相同则默认是一样的节点,才使用patch去更新数据
    return n1.type === n2.type && n1.key === n2.key
  }

  //1.头部同步 AB(C)->AB(DE)
  while (i <= e1 && i <= e2) {
    //...
  }

  //2.尾部同步  (A)BC->(DE)BC
  while (i <= e1 && i <= e2) {
    //...
  }

  //3.同序列挂载 新的vnode节点比老的vnode节点多
  //左侧 （AB）->(AB)C  i = 2, e1 = 1, e2 = 2
  //右侧  (AB) -> C(AB)  i = 0, e1 = -1, e2 = 0
  if (i > e1) {
    if (i <= e2) {
      //...
    }
  } else if (i > e2) {
    //4.同序列卸载  老节点比新节点要多
    //左侧   (AB)C->(AB)  i = 2, e1 = 2, e2 = 1
    //右侧   (A)BC->BC  i = 0, e1 = 0, e2 = -1
    while (i <= e1) {
      //...
    }
  } else {
    // 未知乱序序列 中间对比
    // a,b,(c,e,d),f,g -> a,b,(e,c),f,g
    // 新老节点长度相同左右侧节点相同，中间节点不同
    //...
  }
}
```

:::

## 2. 头部同步

**逻辑目标：** 从头开始遍历，只要新旧节点的 `type` 和 `key` 相同，就认为它们是同一个节点，直接进行原地 `patch` 更新属性。一旦遇到不同的节点，游标 `i` 立刻停止。

:::code-group

```typescript [renderer.ts]
// 1. sync from start
// (a b) c
// (a b) d e
while (i <= e1 && i <= e2) {
  const n1 = c1[i]
  const n2 = c2[i]
  if (isSameVNodeType(n1, n2)) {
    // 节点类型和 key 相同，递归深入比对属性和子节点
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized,
    )
  } else {
    break // 遇到不同，立刻退出循环
  }
  i++ // 头部游标推进
}
```

:::

## 3. 尾部同步

**逻辑目标：** 当头部游标 `i` 卡住后，算法改从尾部开始向前遍历。同样，遇到相同的就原地 `patch`，遇到不同的立刻停止。此时 `e1` 和 `e2` 会不断减小。

:::code-group

```typescript [renderer.ts]
// 2. sync from end
// a (b c)
// d e (b c)
while (i <= e1 && i <= e2) {
  const n1 = c1[e1]
  const n2 = c2[e2]
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized,
    )
  } else {
    break // 遇到不同，立刻退出循环
  }
  e1-- // 旧尾指针回退
  e2-- // 新尾指针回退
}
```

:::

## 4. 同序列挂载

**逻辑目标：** 经过掐头去尾后，如果发现**旧节点已经被全部遍历完了（`i > e1`）**，但是**新节点还有剩余（`i <= e2`）** 则需要被全新插入到 DOM 树中的！

:::code-group

```typescript [renderer.ts]
// 3. common sequence + mount
//左侧 （AB）->(AB)C  i = 2, e1 = 1, e2 = 2
//右侧  (AB) -> C(AB)  i = 0, e1 = -1, e2 = 0
if (i > e1) {
  if (i <= e2) {
    // 计算插入锚点 (往哪个物理 DOM 节点的前面插)
    const nextPos = e2 + 1
    // 如果 nextPos 越界了，说明是尾部追加；如果没有越界，说明是头部/中部插入，取下一个元素作为 anchor
    const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor
    while (i <= e2) {
      // 调用 patch，第一个参数传 null 代表这是全新挂载 (Mount)
      patch(
        null,
        c2[i],
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized,
      )
      i++
    }
  }
}
```

:::

## 5. 同序列卸载

**逻辑目标：** 逻辑与阶段 3 完全相反。如果**新节点已经被全部遍历完了（`i > e2`）**，但是**旧节点还有剩余（`i <= e1`）**。这说明剩下的旧节点全都是废弃的，需要被彻底从 DOM 中删除。

:::code-group

```typescript [renderer.ts]
  // 4. common sequence + unmount
  //左侧   (AB)C->(AB)  i = 2, e1 = 2, e2 = 1
  //右侧   (A)BC->BC  i = 0, e1 = 0, e2 = -1
  else if (i > e2) {
    while (i <= e1) {
      // 遍历剩余的旧游标区间，全部执行卸载操作，回收内存并移除 DOM
      unmount(c1[i], parentComponent, parentSuspense, true)
      i++
    }
  }
```

:::

## 6. 未知乱序序列

**逻辑目标：** 这是整个 Diff 算法最深邃、最硬核的区域。当新旧节点都有剩余，且顺序被打乱（发生了位置交叉）时，进入此分支。为了用最少的 DOM 移动次数完成乱序重排，Vue 引入了 `Map` 空间换时间和最长递增子序列。

### 6.1 空间换时间：构建新节点的 Key-Index 映射表

抛弃 Vue 2 的两层 `for` 循环嵌套。Vue 3 为剩余的新节点创建了一个哈希表（Map），让后续查找旧节点是否还在新列表中存在的时间复杂度直接降为 $O(1)$。

```typescript
  // 5. unknown sequence
  else {
    const s1 = i // 旧节点乱序部分的起始点
    const s2 = i // 新节点乱序部分的起始点

    // 5.1 build key:index map for newChildren
    const keyToNewIndexMap = new Map()
    for (i = s2; i <= e2; i++) {
      const nextChild = c2[i]
      if (nextChild.key != null) {
        keyToNewIndexMap.set(nextChild.key, i) // key -> 新索引下标
      }
    }
```

### 6.2 收集移动线索：建立 `newIndexToOldIndexMap` 数组

Vue 会创建一个核心数组 `newIndexToOldIndexMap`。它的长度是需要更新的新节点数量。
**它的作用是：记录每一个新节点，在旧列表中的原始位置。** 这是后续计算“递增子序列”的唯一数据来源。

```typescript
let j
let patched = 0 // 已更新的节点数量
const toBePatched = e2 - s2 + 1 // 目标需要处理的新节点总数
let moved = false // 核心标志位：是否真正发生了跨越式的 DOM 移动
let maxNewIndexSoFar = 0 // 用于判断乱序的单调递增游标

// 初始化映射数组，用 0 填充 (注意：0 代表该新节点在旧列表中不存在，是全新节点)
const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

// 开始遍历剩余的旧节点
for (i = s1; i <= e1; i++) {
  const prevChild = c1[i]

  // 性能防线：如果已经更新的数量达到了新节点的总数，
  // 说明后面剩下的旧节点全都是多余的，无脑删掉即可！
  if (patched >= toBePatched) {
    unmount(prevChild, parentComponent, parentSuspense, true)
    continue
  }

  // $O(1)$ 极速寻址：去 Map 里查这个旧节点还在不在新列表里
  let newIndex =
    prevChild.key != null ? keyToNewIndexMap.get(prevChild.key) : undefined

  if (newIndex === undefined) {
    // 没找到，说明节点被删了
    unmount(prevChild, parentComponent, parentSuspense, true)
  } else {
    // 找到了！说明可以复用。
    // 记录它在旧节点中的位置 (i + 1 是为了避免 0 索引与初始化的 0 产生冲突)
    newIndexToOldIndexMap[newIndex - s2] = i + 1

    // 乱序判断逻辑：如果 newIndex 一直比 maxNewIndexSoFar 大，说明顺序是递增的，没有发生交叉。
    // 一旦变小，说明节点发生了物理反转，标记 moved = true
    if (newIndex >= maxNewIndexSoFar) {
      maxNewIndexSoFar = newIndex
    } else {
      moved = true
    }

    // 打上补丁，同步最新的属性内容
    patch(
      prevChild,
      c2[newIndex],
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized,
    )
    patched++
  }
}
```

### 6.3 终极重排：运用最长递增子序列 (LIS) 移动与挂载

**为什么需要最长递增子序列？**

假设通过上一步得到的 `newIndexToOldIndexMap` 是 `[5, 3, 4, 0]`（代表新节点分别对应旧列表的第 5, 3, 4 个，以及 0 是全新节点）。
它的最长递增子序列的索引是 `[1, 2]`（即对应原数组的 `3, 4`）。
这告诉 Vue 一个惊人的事实：**在这一团乱麻中，元素 `3` 和 `4` 的相对顺序其实是没有变化的。我们只需要把这两个元素死死锚定在 DOM 上不动，把 `5` 移走，把新节点 `0` 插进来，就能用最少的 DOM API 调用完成重排。**

```typescript
    // 5.3 move and mount
    // 只有当 moved 为 true 时，才执行极其消耗 CPU 算力的 getSequence (LIS 算法)
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap) // 返回递增子序列的索引数组
      : []

    // j 是递增子序列的末尾游标
    j = increasingNewIndexSequence.length - 1

    // 极其关键的倒序遍历！
    // 为什么要从后往前遍历？因为 DOM 节点的物理插入依赖 insertBefore()。
    // 从后往前，我们才能确保用来做参照物的“下一个节点”已经被正确排好序并安放在了真实的 DOM 树中。
    for (i = toBePatched - 1; i >= 0; i--) {
      const nextIndex = s2 + i
      const nextChild = c2[nextIndex]
      const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor

      if (newIndexToOldIndexMap[i] === 0) {
        // 值是 0，说明在旧列表里找不到，这是一个全新节点，执行 Mount
        patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized)
      } else if (moved) {
        // 如果发生了物理乱序
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          // 如果当前节点的索引不在 LIS 序列中，说明它是一个“违规者”，必须被移动！
          move(nextChild, container, anchor, MoveType.REORDER)
        } else {
          // 如果当前节点属于 LIS 序列，它是“良民”。
          // 绝对不调用 move API 操作真实 DOM，只把 LIS 的游标往前推一位，原地保留！
          j--
        }
      }
    }
  }
}
```

## 7. 总结

Vue 3 的 `patchKeyedChildren` 通过极其严密的逻辑闭环，构建了一座性能堡垒：

1.  **极速路径拦截**：绝不让简单的首尾增删（Phase 1-4）去碰触复杂的算法逻辑，保证了基础操作的绝对性能。
2.  **空间换时间**：用 `Map` 表消灭了低效的双层遍历查找。
3.  **动态规划优化底线**：在不可避免的极端乱序重排中，通过 LIS 算法将浏览器最讨厌的“重排/重绘”操作（真实的 DOM 移动）压缩到了数学理论的最低极限。
