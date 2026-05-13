---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# Diff 算法演进：简单 Diff → 双端 Diff → 快速 Diff

`Diff` 算法是 Vue 虚拟 DOM 渲染的核心，负责比较新旧 VNode 树，并以最小代价更新真实 DOM。Vue 3 的 Diff 算法在 `patchKeyedChildren` 中实现，针对带 `key` 的子节点数组，采用双端同步和最长递增子序列（LIS）优化，将时间复杂度控制在近乎 O(n) 的水平。

## 1. Diff 的作用与设计动机

### 1.1 为什么需要 Diff？

- 直接全量替换 DOM 成本极高，Diff 通过 **复用** 已有 DOM 节点，仅更新变化的部分。
- 虚拟 DOM 描述了目标 UI 状态，Diff 负责找出新旧状态之间的差异，生成最小 DOM 操作序列（增、删、移动、更新）。
- 性能优化的核心在于减少 DOM 操作，尤其是节点移动次数。

### 1.2 算法演进对比

| 维度         | 简单 Diff（Vue2 早期）     | 双端 Diff（Vue2 主要）         | 快速 Diff（Vue3）             |
| ------------ | -------------------------- | ------------------------------ | ----------------------------- |
| **查找方式** | 双循环遍历，O(n²)          | 四种命中 + 暴力查找            | 头部/尾部同步 + key 映射 O(1) |
| **移动判断** | 基于 `lastIndex`           | 基于四种位置交换               | 基于 LIS，最小化移动次数      |
| **最佳场景** | 简单列表，少量变动         | 头尾增删多，中间乱序少的列表   | 任意复杂度的序列变化          |
| **移动次数** | 非最优（完全逆序移动很多） | 非最优（完全逆序仍有较多移动） | 理论最优（仅移动非 LIS 节点） |
| **复杂度**   | O(n²)                      | 大多数情况 O(n)，最坏 O(n²)    | 预处理 O(n)，LIS O(n log n)   |
| **实际地位** | 已淘汰                     | Vue2 保底算法                  | Vue3 核心算法                 |

## 2. Vue2 简单 Diff（带 key 的双循环算法）

### 2.1 核心思想

当新旧节点都是一组数组时，简单 Diff 的策略如下：

- **遍历新节点**：拿着新节点去旧节点列表里找（比对 `key`）。
- **找到可复用的节点（打补丁 patch）**：如果找到了 `key` 相同的旧节点，先更新它的内容。
- **判断是否需要移动 DOM**：这是算法的灵魂。记录一个 `lastIndex`（在遍历过程中遇到的**最大旧节点索引**）。
  - 如果当前找到的旧节点索引 `j` **小于** `lastIndex`，说明它在新序列中被排到了后面，**需要移动**。
  - 如果 `j` **大于或等于** `lastIndex`，说明相对顺序没变，不需要移动，并把 `lastIndex` 更新为 `j`。
- **处理新增和删除**：找不到旧节点的新节点就挂载（Mount）；新序列遍历完后，再遍历一次旧序列，没在新序列中出现的旧节点全部卸载（Unmount）。

### 2.2 代码实现

```typescript
function patchChildren(n1, n2, container) {
  const oldChildren = n1.children
  const newChildren = n2.children

  // 用来存储在寻找过程中遇到的最大索引值
  let lastIndex = 0

  // 1. 遍历新的 children
  for (let i = 0; i < newChildren.length; i++) {
    const newVNode = newChildren[i]
    let j = 0
    let find = false // 标记是否在旧节点中找到可复用的节点

    // 遍历旧的 children 去寻找可复用的节点
    for (j; j < oldChildren.length; j++) {
      const oldVNode = oldChildren[j]

      // 如果 key 相同，说明可以复用
      if (newVNode.key === oldVNode.key) {
        find = true

        // 步骤 1: 节点复用，打补丁更新属性和子节点内容
        patch(oldVNode, newVNode, container)

        // 步骤 2: 判断是否需要移动 DOM
        if (j < lastIndex) {
          // 当前找到的旧节点索引 < 最大索引，说明节点需要移动
          // 找到当前新节点的前一个节点（作为插入的锚点）
          const prevVNode = newChildren[i - 1]
          // 如果 prevVNode 存在，说明当前节点不是第一个节点
          if (prevVNode) {
            // 获取 prevVNode 对应的真实 DOM 的下一个兄弟节点
            const anchor = prevVNode.el.nextSibling
            // 调用底层的 insert 方法移动 DOM
            insert(newVNode.el, container, anchor)
          }
        } else {
          // 如果 j >= lastIndex，说明不需要移动
          // 更新 lastIndex 为当前找到的最大索引
          lastIndex = j
        }
        break // 找到了就跳出内层循环
      }
    }

    // 步骤 3: 如果遍历完旧节点都没找到，说明是新增节点
    if (!find) {
      // 找到插入的锚点
      const prevVNode = newChildren[i - 1]
      let anchor = null
      if (prevVNode) {
        // 如果有前一个新节点，插入到它后面
        anchor = prevVNode.el.nextSibling
      } else {
        // 如果没有前一个节点，说明它是第一个，插入到容器最前面
        anchor = container.firstChild
      }
      // 挂载全新的节点 (旧节点传 null 代表 mount)
      patch(null, newVNode, container, anchor)
    }
  }

  // 4. 遍历旧节点，处理需要删除的节点
  for (let i = 0; i < oldChildren.length; i++) {
    const oldVNode = oldChildren[i]
    // 去新节点数组中找，看旧节点是否还存在
    const has = newChildren.find(v => v.key === oldVNode.key)
    if (!has) {
      // 如果新节点中没有这个 key，说明被移除了，执行卸载
      unmount(oldVNode)
    }
  }
}
```

### 2.3 图解

![Logo](/easyDiff.png)

## 3. Vue2 双端 Diff 算法

### 3.1 核心思想

为解决简单 Diff 的 O(n²) 查找问题，Vue2 后期引入了**双端比较**策略，维护四个指针：

- `oldStartIdx` / `newStartIdx`（旧头 / 新头）
- `oldEndIdx` / `newEndIdx`（旧尾 / 新尾）

每一轮循环尝试以下四种命中情况（直到两序列之一遍历完）：

- **旧头 === 新头**：直接 patch，指针右移。
- **旧尾 === 新尾**：直接 patch，指针左移。
- **旧头 === 新尾**：patch 并将旧头对应的 DOM 移动到旧尾之后（新尾的下一个兄弟之前），指针相应移动。
- **旧尾 === 新头**：patch 并将旧尾对应的 DOM 移动到旧头之前（新头的前一个兄弟之后），指针相应移动。

如果四种都不命中，则**暴力查找**：根据新头的 `key` 在旧列表中搜索，找到则移动并 patch，未找到则新建。

### 3.2 代码实现

```typescript
function patchKeyedChildren(n1, n2, container) {
  const oldChildren = n1.children
  const newChildren = n2.children

  // 1. 初始化四个游标（指针）
  let oldStartIdx = 0
  let oldEndIdx = oldChildren.length - 1
  let newStartIdx = 0
  let newEndIdx = newChildren.length - 1

  // 2. 初始化四个游标对应的虚拟节点
  let oldStartVNode = oldChildren[oldStartIdx]
  let oldEndVNode = oldChildren[oldEndIdx]
  let newStartVNode = newChildren[newStartIdx]
  let newEndVNode = newChildren[newEndIdx]

  // 3. 核心循环：只要新旧游标没有发生交叉，就继续比对
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 防御性编程：如果旧节点已经被兜底逻辑处理过（置为 undefined），则跳过
    if (!oldStartVNode) {
      oldStartVNode = oldChildren[++oldStartIdx]
    } else if (!oldEndVNode) {
      oldEndVNode = oldChildren[--oldEndIdx]
    }

    // 步骤 1：旧头 == 新头（理想情况 1：节点在头部没动）
    else if (oldStartVNode.key === newStartVNode.key) {
      patch(oldStartVNode, newStartVNode, container)
      oldStartVNode = oldChildren[++oldStartIdx]
      newStartVNode = newChildren[++newStartIdx]
    }

    // 步骤 2：旧尾 == 新尾（理想情况 2：节点在尾部没动）
    else if (oldEndVNode.key === newEndVNode.key) {
      patch(oldEndVNode, newEndVNode, container)
      oldEndVNode = oldChildren[--oldEndIdx]
      newEndVNode = newChildren[--newEndIdx]
    }

    // 步骤 3：旧头 == 新尾（节点被移到了最后面）
    else if (oldStartVNode.key === newEndVNode.key) {
      patch(oldStartVNode, newEndVNode, container)
      // 将旧头 DOM 移动到旧尾 DOM 的后面
      insert(oldStartVNode.el, container, oldEndVNode.el.nextSibling)
      oldStartVNode = oldChildren[++oldStartIdx]
      newEndVNode = newChildren[--newEndIdx]
    }

    // 步骤 4：旧尾 == 新头（节点被移到了最前面，解决简单 Diff 缺陷的核心！）
    else if (oldEndVNode.key === newStartVNode.key) {
      patch(oldEndVNode, newStartVNode, container)
      // 将旧尾 DOM 移动到旧头 DOM 的前面
      insert(oldEndVNode.el, container, oldStartVNode.el)
      oldEndVNode = oldChildren[--oldEndIdx]
      newStartVNode = newChildren[++newStartIdx]
    }

    // 步骤 5：兜底逻辑（上面四种都没命中，说明是中间的乱序节点）
    else {
      // 拿新节点的头部（newStartVNode）去旧节点序列里找
      const idxInOld = oldChildren.findIndex(
        node => node && node.key === newStartVNode.key,
      )

      if (idxInOld > 0) {
        // 5.1 找到了：说明是可以复用的节点
        const vnodeToMove = oldChildren[idxInOld]
        patch(vnodeToMove, newStartVNode, container)
        // 既然在新序列中它跑到了前面，那就把它的 DOM 移动到当前旧头 DOM 的前面
        insert(vnodeToMove.el, container, oldStartVNode.el)
        // 重要：将旧数组中该位置置为 undefined，防止后续重复处理
        oldChildren[idxInOld] = undefined
      } else {
        // 5.2 没找到：说明这是一个全新的节点
        // 直接作为一个新节点挂载到当前旧头 DOM 的前面
        patch(null, newStartVNode, container, oldStartVNode.el)
      }

      // 处理完毕，新头游标向后移动一步
      newStartVNode = newChildren[++newStartIdx]
    }
  }

  // 4. 善后处理：循环结束后，处理剩余的节点

  // 情况 A：旧节点遍历完了，新节点还有剩余 -> 批量新增挂载
  if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
    for (let i = newStartIdx; i <= newEndIdx; i++) {
      // 计算插入的锚点：如果有剩余的新尾节点，插到它前面；否则插到最后
      const anchor = newChildren[newEndIdx + 1]
        ? newChildren[newEndIdx + 1].el
        : null
      patch(null, newChildren[i], container, anchor)
    }
  }

  // 情况 B：新节点遍历完了，旧节点还有剩余 -> 批量卸载删除
  else if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
    for (let i = oldStartIdx; i <= oldEndIdx; i++) {
      if (oldChildren[i]) {
        unmount(oldChildren[i])
      }
    }
  }
}
```

### 3.3 图解

![Logo](/twoEndDiff.png)

## 4. Vue3 快速 Diff 算法

### 4.1 核心思想

- **掐头 (Sync Start)：** 从前往后看，遇到相同的直接打补丁，直到遇到不同的停下。
- **去尾 (Sync End)：** 从后往前看，遇到相同的直接打补丁，直到遇到不同的停下。
- **多退少补 (Edge Cases)：** 掐头去尾后，如果一边空了，另一边还有剩，直接批量挂载（新增）或批量卸载（删除）。
- **乱序排兵 (LIS & Move)：** 如果两边都有剩，给新节点建一个 `Map` 字典；记录旧节点在新序列中的位置（`source` 数组）；根据 `source` 数组求出**最长递增子序列（定海神针）**；最后**倒序**遍历新节点，不在子序列里的就移动，在子序列里的就不动。

### 4.2 代码实现

:::code-group

```typescript [renderer.ts]
function patchKeyedChildren(oldChildren, newChildren, container, parentAnchor) {
  //从头部开始同步的比对游标
  let i = 0
  //新的子节点的长度
  const newChildrenLength = newChildren.length
  //旧子节点数组（old children）的尾部游标
  let oldChildrenEnd = oldChildren.length - 1
  //新子节点数组（new children）的尾部游标
  let newChildrenEnd = newChildrenLength - 1

  // 1. 头部同步
  // (a b) c
  // (a b) d e
  while (i <= oldChildrenEnd && i <= newChildrenEnd) {
    const oldVNode = oldChildren[i]
    const newVNode = newChildren[i]
    // 如果 oldVNode 和 newVNode 被认为是同一个 vnode，则直接 patch 即可
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode, container, null)
    } else {
      // 如果不被认为是同一个 vnode，则直接跳出循环
      break
    }
    // 下标自增
    i++
  }

  // 2. 尾部同步
  // a (b c)
  // d e (b c)
  while (i <= oldChildrenEnd && i <= newChildrenEnd) {
    const oldVNode = oldChildren[oldChildrenEnd]
    const newVNode = newChildren[newChildrenEnd]
    if (isSameVNodeType(oldVNode, newVNode)) {
      patch(oldVNode, newVNode, container, null)
    } else {
      break
    }
    oldChildrenEnd--
    newChildrenEnd--
  }

  // 3.  同序列挂载 -> 新节点数量>旧节点数量
  //左侧 （AB）->(AB)C
  //右侧  (AB) -> C(AB)
  if (i > oldChildrenEnd) {
    if (i <= newChildrenEnd) {
      //计算插入锚点
      const nextPos = newChildrenEnd + 1
      // 如果 nextPos 越界了，说明是尾部追加 parentAnchor为null；如果没有越界，说明是头部/中部插入，取下一个元素作为 anchor
      const anchor =
        nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
      while (i <= newChildrenEnd) {
        patch(null, newChildren[i], container, anchor)
        i++
      }
    }
  }
  // 4. 同序列卸载 -> 新节点数量<旧节点数量
  // 左侧   (AB)C->(AB)
  //右侧   A(BC)->(BC)
  else if (i > newChildrenEnd) {
    while (i <= oldChildrenEnd) {
      unmount(oldChildren[i])
      i++
    }
  }
  // 5. 乱序的 diff 比对
  else {
    // 旧子节点的开始索引：oldChildrenStart
    const oldStartIndex = i
    // 新子节点的开始索引：newChildrenStart
    const newStartIndex = i
    // 5.1 创建一个 <key（新节点的 key）:index（新节点的位置）> 的 Map 对象 keyToNewIndexMap。通过该对象可知：新的 child（根据 key 判断指定 child） 更新后的位置（根据对应的 index 判断）在哪里
    const keyToNewIndexMap = new Map()
    // 通过循环为 keyToNewIndexMap 填充值（s2 = newChildrenStart; e2 = newChildrenEnd）
    for (i = newStartIndex; i <= newChildrenEnd; i++) {
      // 从 newChildren 中根据开始索引获取每一个 child（c2 = newChildren）
      const nextChild = newChildren[i]
      // child 必须存在 key（这也是为什么 v-for 必须要有 key 的原因）
      if (nextChild.key != null) {
        // 把 key 和 对应的索引，放到 keyToNewIndexMap 对象中
        keyToNewIndexMap.set(nextChild.key, i)
      }
    }

    // 5.2 循环 oldChildren ，并尝试进行 patch（打补丁）或 unmount（删除）旧节点
    let j
    // 记录已经修复的新节点数量
    let patched = 0
    // 新节点待修补的数量 = newChildrenEnd - newChildrenStart + 1
    const toBePatched = newChildrenEnd - newStartIndex + 1
    // 标记位：节点是否需要移动
    let moved = false
    // 配合 moved 进行使用，用于判断乱序的单调递增游标,它始终保存当前最大的 index 值
    let maxNewIndexSoFar = 0
    // 创建一个 Array 的对象，用来确定最长递增子序列。
    // 初始化映射数组，用 0 填充 (注意：0 代表该新节点在旧列表中不存在，是全新节点)
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0)
    // 遍历 oldChildren（s1 = oldChildrenStart; e1 = oldChildrenEnd），获取旧节点，如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
    for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
      // 获取旧节点
      const prevChild = oldChildren[i]
      // 如果当前 已经处理的节点数量 > 待处理的节点数量，那么就证明：《所有的节点都已经更新完成，剩余的旧节点全部删除即可》
      if (patched >= toBePatched) {
        // 所有的节点都已经更新完成，剩余的旧节点全部删除即可
        unmount(prevChild)
        continue
      }
      // 新节点需要存在的位置，需要根据旧节点来进行寻找（包含已处理的节点。即：n-c 被认为是 1）
      let newIndex
      // 旧节点的 key 存在时
      if (prevChild.key != null) {
        // 根据旧节点的 key，从 keyToNewIndexMap 中可以获取到新节点对应的位置
        newIndex = keyToNewIndexMap.get(prevChild.key)
      } else {
        //旧节点的 key 不存在（无 key 节点）
        //当老节点没有key时，遍历新节点对比老节点查找相同类型相同且都没有key
        for (j = newStartIndex; j <= newChildrenEnd; j++) {
          // 找到《没有找到对应旧节点的新节点，并且该新节点可以和旧节点匹配》
          if (
            newIndexToOldIndexMap[j - newStartIndex] === 0 &&
            isSameVNodeType(prevChild, newChildren[j])
          ) {
            // 如果能找到，那么 newIndex = 该新节点索引
            newIndex = j
            break
          }
        }
      }
      // 最终没有找到新节点的索引，则证明：当前旧节点没有对应的新节点
      if (newIndex === undefined) {
        // 此时，直接删除即可
        unmount(prevChild)
      }
      // 没有进入 if，则表示：当前旧节点找到了对应的新节点，那么接下来就是要判断对于该新节点而言，是要 patch（打补丁）还是 move（移动）
      else {
        // 为 newIndexToOldIndexMap 填充值,记录它在旧节点中的位置 (i + 1 是为了避免 0 索引与初始化的 0 产生冲突)
        // 因为 newIndex 包含已处理的节点，所以需要减去 s2（s2 = newChildrenStart）表示：不计算已处理的节点
        newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
        // maxNewIndexSoFar 会存储当前最大的 newIndex，它应该是一个递增的，如果没有递增，则证明有节点需要移动
        // 乱序判断逻辑：如果 newIndex 一直比 maxNewIndexSoFar 大，说明顺序是递增的，没有发生交叉。
        if (newIndex >= maxNewIndexSoFar) {
          // 持续递增
          maxNewIndexSoFar = newIndex
        } else {
          // 没有递增，则需要移动，moved = true
          moved = true
        }
        // 打补丁
        patch(prevChild, newChildren[newIndex], container, null)
        // 自增已处理的节点数量
        patched++
      }
    }

    // 5.3 针对移动和挂载的处理
    // 仅当节点需要移动的时候，我们才需要生成最长递增子序列，否则只需要有一个空数组即可
    const increasingNewIndexSequence = moved
      ? getSequence(newIndexToOldIndexMap)
      : []
    // j >= 0 表示：初始值为 最长递增子序列的最后下标
    // j < 0 表示：《不存在》最长递增子序列。
    j = increasingNewIndexSequence.length - 1
    // 倒序循环，以便我们可以使用最后修补的节点作为锚点
    // 为什么要从后往前遍历？因为 DOM 节点的物理插入依赖 insertBefore()。
    // 从后往前，我们才能确保用来做参照物的“下一个节点”已经被正确排好序并安放在了真实的 DOM 树中。
    for (i = toBePatched - 1; i >= 0; i--) {
      // nextIndex（需要更新的新节点下标） = newChildrenStart + i
      const nextIndex = newStartIndex + i
      // 根据 nextIndex 拿到要处理的 新节点
      const nextChild = newChildren[nextIndex]
      // 获取锚点（是否超过了最长长度）
      const anchor =
        nextIndex + 1 < newChildrenLength
          ? newChildren[nextIndex + 1].el
          : parentAnchor
      // 如果 newIndexToOldIndexMap 中保存的 value = 0，则表示：新节点没有用对应的旧节点，此时需要挂载新节点
      if (newIndexToOldIndexMap[i] === 0) {
        // 挂载新节点
        patch(null, nextChild, container, anchor)
      }
      // moved 为 true，表示需要移动
      else if (moved) {
        // j < 0 表示：不存在 最长递增子序列
        // i !== increasingNewIndexSequence[j]  比对当前节点的索引和最长递增子序列的索引
        // 如果当前节点的索引不在 LIS 序列中，说明它是一个“违规者”，必须被移动！
        // 那么此时就需要 move （移动）
        if (j < 0 || i !== increasingNewIndexSequence[j]) {
          move(nextChild, container, anchor)
        } else {
          // 如果当前节点属于 LIS 序列，它是“良民”。
          // 绝对不调用 move API 操作真实 DOM，只把 LIS 的游标往前推一位，原地保留！
          j--
        }
      }
    }
  }
}
//移动节点到指定位置
const move = (vnode, container, anchor) => {
  hostInsert(vnode.el, container, anchor)
}
//根据 key || type 判断是否为相同类型节点
function isSameVNodeType(n1: any, n2: any) {
  //比对type和key  都相同则默认是一样的节点,才使用patch去更新数据
  return n1.type === n2.type && n1.key === n2.key
}
//获取最长递增子序列下标
function getSequence(arr) {
  // 获取一个数组浅拷贝。注意 p 的元素改变并不会影响 arr
  // p 是一个最终的回溯数组，它会在最终的 result 回溯中被使用
  // 它会在每次 result 发生变化时，记录 result 更新前最后一个索引的值
  const p = arr.slice()
  // 定义返回值（最长递增子序列下标），因为下标从 0 开始，所以它的初始值为 0
  const result = [0]
  let i, j, u, v, c
  // 当前数组的长度
  const len = arr.length
  // 对数组中所有的元素进行 for 循环处理，i = 下标
  for (i = 0; i < len; i++) {
    // 根据下标获取当前对应元素
    const arrI = arr[i]
    //
    if (arrI !== 0) {
      // 获取 result 中的最后一个元素，即：当前 result 中保存的最大值的下标
      j = result[result.length - 1]
      // arr[j] = 当前 result 中所保存的最大值
      // arrI = 当前值
      // 如果 arr[j] < arrI 。那么就证明，当前存在更大的序列，那么该下标就需要被放入到 result 的最后位置
      if (arr[j] < arrI) {
        p[i] = j
        // 把当前的下标 i 放入到 result 的最后位置
        result.push(i)
        continue
      }
      // 不满足 arr[j] < arrI 的条件，就证明目前 result 中的最后位置保存着更大的数值的下标。
      // 但是这个下标并不一定是一个递增的序列，比如： [1, 3] 和 [1, 2]
      // 所以我们还需要确定当前的序列是递增的。
      // 计算方式就是通过：二分查找来进行的

      // 初始下标
      u = 0
      // 最终下标
      v = result.length - 1
      // 只有初始下标 < 最终下标时才需要计算
      while (u < v) {
        // (u + v) 转化为 32 位 2 进制，右移 1 位 === 取中间位置（向下取整）例如：8 >> 1 = 4;  9 >> 1 = 4; 5 >> 1 = 2
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Right_shift
        // c 表示中间位。即：初始下标 + 最终下标 / 2 （向下取整）
        c = (u + v) >> 1
        // 从 result 中根据 c（中间位），取出中间位的下标。
        // 然后利用中间位的下标，从 arr 中取出对应的值。
        // 即：arr[result[c]] = result 中间位的值
        // 如果：result 中间位的值 < arrI，则 u（初始下标）= 中间位 + 1。即：从中间向右移动一位，作为初始下标。 （下次直接从中间开始，往后计算即可）
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          // 否则，则 v（最终下标） = 中间位。即：下次直接从 0 开始，计算到中间位置 即可。
          v = c
        }
      }
      // 最终，经过 while 的二分运算可以计算出：目标下标位 u
      // 利用 u 从 result 中获取下标，然后拿到 arr 中对应的值：arr[result[u]]
      // 如果：arr[result[u]] > arrI 的，则证明当前  result 中存在的下标 《不是》 递增序列，则需要进行替换
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        // 进行替换，替换为递增序列
        result[u] = i
      }
    }
  }
  // 重新定义 u。此时：u = result 的长度
  u = result.length
  // 重新定义 v。此时 v = result 的最后一个元素
  v = result[u - 1]
  // 自后向前处理 result，利用 p 中所保存的索引值，进行最后的一次回溯
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
```

:::

### 4.3 图解

![Logo](/fastDiff.png)

## 5. 总结

Vue Diff 算法的演进体现了框架对性能的极致追求：

- **简单 Diff** 作为雏形引入了 `key` 复用概念；
- **双端 Diff** 利用列表连续变化的特性大幅优化头尾场景；
- **快速 Diff** 引入 LIS 将移动操作降至理论下限，结合 key 映射让查找变为 O(1)，成为 Vue3 高性能的基石。
