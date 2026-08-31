# React 协调与 Vue 3 Patch：差异计算的两种范式

React 和 Vue 3 都通过比较「**新旧 UI 描述**」来找出最小 DOM 变更，但两者的算法起点截然不同：React 受 **Fiber 单向链表** 的拓扑约束，只能**单向扫描**，用 `lastPlacedIndex` 贪心检测移动；Vue 3 的 VNode 是**数组**，天然支持**双端扫描与随机访问**，用最长递增子序列（LIS）把移动次数压到最优。此外，React 的协调发生在 **Render 阶段**（只记账、不碰 DOM），而 Vue 3 的 patch 则**边比较边操作 DOM**。

## 1. [React：Fiber 协调流程](../core-design/reconciliation.md)

### 1.1 更新入队：从 setState 到调度

React 的状态更新会创建 Update、分配 Lane，并在 Render 阶段根据新 Element 和 current Fiber 构建 work-in-progress Fiber：

```javascript
// React setState 触发更新的简化流程
function dispatchSetState(fiber, queue, action) {
  // 1. 创建 Update 对象
  const update = {
    lane, // 本次更新的优先级
    action, // 新值 或 updater 函数
    hasEagerState, // 是否已预先计算新状态
    eagerState, // 预先计算的状态（优化）
    next: null, // 链表指针
  }

  // 2. 将 Update 加入 Fiber 的 updateQueue 链表
  enqueueUpdate(fiber, queue, update)

  // 3. 从当前 Fiber 向上标记，直到 FiberRoot
  //    沿途将 lane 合并到各祖先的 childLanes
  markUpdateLaneFromFiberToRoot(fiber, lane)

  // 4. 调度更新——确保根节点进入 Scheduler
  scheduleUpdateOnFiber(root, fiber, lane)
}
```

### 1.2 beginWork 与协调入口

Render 阶段对每个 Fiber 执行 `beginWork`，先判断能否 **bailout（跳过）**，再按 `Fiber.tag` 分发到函数组件、原生 DOM、类组件等分支：

```javascript
// beginWork — 对每个 Fiber 执行的核心协调逻辑（简化）
function beginWork(current, workInProgress, renderLanes) {
  // 1. 检查是否可以 bailout（跳过）
  if (current !== null) {
    const oldProps = current.memoizedProps
    const newProps = workInProgress.pendingProps

    if (oldProps === newProps &&       // props 引用相同
        !hasContextChanged() &&        // context 未变化
        !includesSomeLane(renderLanes, workInProgress.lanes)) { // 无待处理更新
      return bailoutOnAlreadyFinishedWork(current, workInProgress)
    }
  }

  // 2. 根据 Fiber.tag 分发处理
  switch (workInProgress.tag) {
    case FunctionComponent:
      // 执行函数组件 → 获取 Hooks 状态 → 执行返回的 Element
      return updateFunctionComponent(current, workInProgress, ...)
    case HostComponent:
      // 原生 DOM：对比新旧 props，标记 flags
      return updateHostComponent(current, workInProgress, ...)
    case ClassComponent:
      return updateClassComponent(current, workInProgress, ...)
    // ... 其他类型
  }
}
```

协调子节点的总入口 `reconcileChildren` 先区分**挂载**与**更新**，再按**新 child 的运行时形态**分派到不同分支：

```javascript
// React 协调子节点的核心函数（简化）
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // 首次挂载：直接创建新的子 Fiber（不做 diff）
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    // 更新：对比新旧子节点，标记删除/新增/移动
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
    )
  }
}
```

| 新 child 的形态      | 分派到的函数              | 说明                     |
| -------------------- | ------------------------- | ------------------------ |
| 单个 Element         | `reconcileSingleElement`  | 单节点，匹配即停         |
| 数组（或可迭代对象） | `reconcileChildrenArray`  | 多节点列表（最复杂）     |
| `string` / `number`  | `reconcileSingleTextNode` | 文本节点                 |
| `null` / `undefined` | `deleteRemainingChildren` | 空内容，删除所有旧子节点 |

关键认知：**「单个还是多个」是分岔的第一层**——单节点与多节点是完全不同的两套逻辑，前者的复杂度远低于后者。

### 1.3 单节点协调

新 child 是单个 Element 时，从头扫描旧子节点链表，按 `key` 和 `type` 决定复用还是重建：

```javascript
// reconcileSingleElement — React 单节点协调（简化）
function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  lanes,
) {
  const key = element.key
  let child = currentFirstChild

  while (child !== null) {
    if (child.key === key) {
      if (child.elementType === element.type) {
        // ✅ key 同 + type 同：复用，删除其余兄弟
        deleteRemainingChildren(returnFiber, child.sibling)
        return useFiber(child, element.props)
      }
      // ❌ key 同 + type 不同：整条旧链表删除重建
      deleteRemainingChildren(returnFiber, child)
      break
    } else {
      deleteChild(returnFiber, child) // key 不同：删除，继续扫描下一个兄弟
    }
    child = child.sibling
  }

  return createFiberFromElement(element, returnFiber.mode, lanes) // 无匹配 → 新建
}
```

关键认知：**key 匹配但 type 不同时立即停止扫描**——同一个新节点不可能同时匹配两个旧节点，继续扫描毫无意义。

### 1.4 多节点协调：reconcileChildrenArray 与 lastPlacedIndex

React 的多节点协调受 Fiber 单向链表拓扑约束，只能**单向扫描**，用 `lastPlacedIndex` 贪心检测移动：

```javascript
// reconcileChildrenArray — React 多节点协调（简化）
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
  let oldFiber = currentFirstChild
  let lastPlacedIndex = 0 // 已复用旧节点在旧列表中的最大 index
  let newIdx = 0

  // 第一轮：顺序比对，key + type 相同 → 复用，遇到不同立即跳出
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx]
    if (oldFiber.key !== newChild.key || oldFiber.type !== newChild.type) break
    lastPlacedIndex = placeChild(
      useFiber(oldFiber, newChild),
      lastPlacedIndex,
      newIdx,
    )
    oldFiber = oldFiber.sibling
  }

  // 第二轮：剩余旧节点按 key 建 Map，遍历新节点查找复用或新建
  const existingChildren = mapRemainingChildren(oldFiber)
  for (; newIdx < newChildren.length; newIdx++) {
    const matched = existingChildren.get(newChildren[newIdx].key)
    const newFiber = matched
      ? updateFromMap(
          existingChildren,
          returnFiber,
          newIdx,
          newChildren[newIdx],
        )
      : createChild(returnFiber, newChildren[newIdx], null)
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
  }

  // 第三轮：Map 中仍剩余的旧节点 → 标记 ChildDeletion
  existingChildren.forEach(child => deleteChild(returnFiber, child))
}

// placeChild — lastPlacedIndex 贪心：旧 index < lastPlacedIndex 即相对顺序改变
function placeChild(newFiber, lastPlacedIndex, newIndex) {
  newFiber.index = newIndex
  const oldIndex = newFiber.alternate?.index
  if (oldIndex === undefined) {
    newFiber.flags |= Placement // 全新节点 → 插入
    return lastPlacedIndex
  }
  if (oldIndex < lastPlacedIndex) {
    newFiber.flags |= Placement // 相对顺序改变 → 移动
    return lastPlacedIndex
  }
  return oldIndex // 顺序不变 → 原地复用
}
```

三趟遍历最终把每个节点归入五种协调条件，每种对应不同的 Fiber 标记：

| 协调条件 | 判断依据                  | 标记                          | 结果                      |
| -------- | ------------------------- | ----------------------------- | ------------------------- |
| **复用** | key 相同 + type 相同      | 无（仅更新 `pendingProps`）   | 复用旧 DOM，更新属性      |
| **新增** | 新节点在旧列表中无匹配    | `Placement`                   | 新建 DOM 并插入           |
| **删除** | 旧节点在新列表中无匹配    | `ChildDeletion`               | Commit 阶段 `removeChild` |
| **移动** | key + type 同，index 错位 | `Placement`                   | 复用 DOM，调整位置        |
| **替换** | key 相同 + type 不同      | `Placement` + `ChildDeletion` | 删旧建新（state 丢失）    |

### 1.5 key 与无 key 陷阱

`key` 是 React 在多节点协调中识别「**同一个节点**」的唯一依据，只在 `reconcileChildrenArray` 中发挥作用。无 key 的节点在第二轮建 `Map` 时退化为以 **`index` 为键**——身份完全由位置决定，一旦增删导致 index 错位，内容就会错配到错误的 Fiber 上。这正是「不能用 index 当 key」的底层原因。

```jsx
// ❌ 用 index 作为 key：头部插入导致整列错配
const list = ['A', 'B', 'C']
list.unshift('D') // 新列表: ['D', 'A', 'B', 'C']

// 旧渲染: <li key=0>A</li> <li key=1>B</li> <li key=2>C</li>
// 新渲染: <li key=0>D</li> <li key=1>A</li> <li key=2>B</li> <li key=3>C</li>
// React 判定 key 0/1/2 的"内容变了"（更新）、key 3 为新增
// 本应只新增 D，却让 A/B/C 全部被更新——若项内有内部 state，还会串位
```

```jsx
// ✅ 用稳定的唯一 ID 作为 key：只新增 D，A/B/C 全部复用
list.map(item => <TodoItem key={item.id} item={item} />)
```

```javascript
// mapRemainingChildren —— 无 key 的节点以 index 为键（简化）
function mapRemainingChildren(currentFirstChild) {
  const existingChildren = new Map()
  let child = currentFirstChild
  while (child !== null) {
    child.key !== null
      ? existingChildren.set(child.key, child) // 有 key：以 key 为键
      : existingChildren.set(child.index, child) // 无 key：以 index 为键 ← 身份由位置决定
    child = child.sibling
  }
  return existingChildren
}
```

## 2. [Vue 3：响应式驱动的 patch 流程](../../../vue/advanced/source-code/patchKeyedChildren.md)

### 2.1 组件渲染 Effect 与更新入队

Vue 3 的响应式数据变化会触发订阅它的 ReactiveEffect。组件更新任务进入 Scheduler 队列，执行时生成新 VNode 并与旧 VNode 进行 patch：

```javascript
// Vue 3 组件挂载时的 setupRenderEffect（简化）
function setupRenderEffect(instance, initialVNode, container, ...) {
  const componentUpdateFn = () => {
    // 首次挂载
    if (!instance.isMounted) {
      const subTree = (instance.subTree = renderComponentRoot(instance))
      patch(null, subTree, container, ...)          // 首次挂载→全量递归
      initialVNode.el = subTree.el
      instance.isMounted = true
    }
    // 组件更新
    else {
      const prevTree = instance.subTree
      const nextTree = renderComponentRoot(instance) // 重新执行 render，生成新 VNode
      instance.subTree = nextTree
      patch(prevTree, nextTree, container, ...)     // 比较新旧 VNode
    }
  }

  // 创建 ReactiveEffect 并绑定到组件实例
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    () => queueJob(instance.update),  // scheduler：更新走微任务队列
  ))
  // 首次执行 componentUpdateFn 完成挂载
  effect.run()
}
```

### 2.2 patch 入口：按 VNode 类型分发

```javascript
// Vue 3 patch 函数的核心逻辑（简化）
function patch(oldVNode, newVNode, container, ...) {
  // 1. 类型不同 → 直接卸载旧节点，挂载新节点
  if (oldVNode.type !== newVNode.type) {
    unmount(oldVNode)
    oldVNode = null  // 使后续逻辑走挂载分支
  }

  const { type, shapeFlag } = newVNode
  switch (type) {
    case Text:         // 文本节点
      processText(oldVNode, newVNode, ...)
      break
    case Comment:      // 注释节点
      processCommentNode(oldVNode, newVNode, ...)
      break
    case Fragment:     // Fragment
      processFragment(oldVNode, newVNode, ...)
      break
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 普通元素（div、span 等）
        processElement(oldVNode, newVNode, ...)
      } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 组件
        processComponent(oldVNode, newVNode, ...)
      }
  }
}
```

### 2.3 patchElement：编译标记驱动的靶向更新

```javascript
// patchElement — 仅当新旧 type 相同时调用（简化）
function patchElement(oldVNode, newVNode, ...) {
  const el = (newVNode.el = oldVNode.el)

  // 1. 根据 patchFlag 靶向更新属性
  const { patchFlag } = newVNode
  if (patchFlag & PatchFlags.TEXT) {
    // 只更新文本内容，跳过所有属性比较
    setElementText(el, newVNode.children)
    return  // ← 提前退出，不进入子节点 patch！
  }
  if (patchFlag & PatchFlags.CLASS) {
    // 只更新 class
    hostPatchProp(el, 'class', null, newVNode.props.class)
  }
  // ... 其他靶向 flag

  // 2. 无 patchFlag 或 需要全量属性 diff
  patchProps(el, oldVNode.props, newVNode.props)

  // 3. 更新子节点
  patchChildren(oldVNode.children, newVNode.children, el, ...)
}
```

`patchFlag` 是 Vue 编译期的核心产物：模板结构是确定的，编译器能精确标记每个动态节点「**哪一类绑定会变**」（文本、class、style、props 等），运行时的 patch 因此可以**按图索骥**，跳过静态属性比较。

### 2.4 多节点 patch：patchKeyedChildren 与最长递增子序列

Vue 3 的多节点 patch 的 VNode 是数组，支持**双端扫描与索引随机访问**，用最长递增子序列（LIS）把移动次数压到最优：

```javascript
// patchKeyedChildren — Vue 3 多节点 patch（简化）
function patchKeyedChildren(c1, c2, container) {
  let i = 0,
    e1 = c1.length - 1,
    e2 = c2.length - 1

  // 1. 头部同步：从前往后，type + key 相同 → 复用
  while (i <= e1 && i <= e2 && isSameVNodeType(c1[i], c2[i])) {
    patch(c1[i], c2[i])
    i++
  }
  // 2. 尾部同步：从后往前，type + key 相同 → 复用
  while (i <= e1 && i <= e2 && isSameVNodeType(c1[e1], c2[e2])) {
    patch(c1[e1], c2[e2])
    e1--
    e2--
  }

  // 3. 中间乱序部分：建立 新 key → index 映射
  const keyToNewIndexMap = new Map()
  for (let j = i; j <= e2; j++) keyToNewIndexMap.set(c2[j].key, j)

  // 4. 遍历旧中间节点：命中 → 复用并记录新旧位置；未命中 → 卸载
  // 5. 计算最长递增子序列(LIS)：LIS 内的节点相对顺序未变，保持原位
  const seq = getSequence(newIndexToOldIndexMap)
  // 6. 从尾到头移动/插入非 LIS 节点，最小化真实 DOM 操作
}
```

**双端对比的威力**：绝大多数真实场景（头部/尾部插入、删除、顺序微调）都在第 1、2 步的头尾同步中被「**顺手**」处理掉，只有中间真正乱序的部分才进入 LIS 计算。而 LIS 求出的是「**无需移动的最长递增子序列**」，只需移动子序列外的节点即可达到最小移动次数。

### 2.5 无 key 列表与编译期优化

当列表**没有 key** 时，Vue 3 退化为按位置逐项 patch 的 `patchUnkeyedChildren`，与 React 无 key 时退化为 index 对比如出一辙：

```javascript
// patchUnkeyedChildren — 无 key 列表的 patch（简化）
function patchUnkeyedChildren(c1, c2, container) {
  const commonLength = Math.min(c1.length, c2.length)
  // 1. 逐位置对比：同位置直接复用或替换
  for (let i = 0; i < commonLength; i++) {
    patch(c1[i], c2[i], container)
  }
  // 2. 旧列表更长 → 卸载多余旧节点
  if (c1.length > c2.length) {
    for (let i = commonLength; i < c1.length; i++) unmount(c1[i])
  }
  // 3. 新列表更长 → 挂载多余新节点
  else if (c2.length > c1.length) {
    for (let i = commonLength; i < c2.length; i++) mount(c2[i], container)
  }
}
```

无 key 时，头部插入新项会导致后面所有节点的内容按位置错配，产生大量本可避免的更新——这与 React 的「index 陷阱」是同一个问题。**给列表项提供稳定 key 是两套框架共同的性能前提**。

更关键的是，Vue 3 对**带 key 的 `v-for` 且大部分为静态内容**的模板，编译器会生成 **Block Tree**：把动态节点收集到 `dynamicChildren` 数组，更新时只遍历该数组，直接**跳过整个静态子树**的 patch。此时 keyed diff 甚至很少真正运行，这也是 Vue 3 比 React 在静态内容密集场景下更省 diff 开销的根源。

## 3. 对比总结

| 维度             | React                                           | Vue 3                                                   |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| **更新来源**     | `setState`、Hook dispatch、外部 Store 等        | `ref`、`reactive` 等响应式数据触发依赖                  |
| **比较输入**     | 新 React Element 与 current Fiber               | 新旧 VNode                                              |
| **数据结构约束** | Fiber 单向链表，只能单向扫描                    | VNode 数组，可双端扫描 + 随机访问                       |
| **列表复用依据** | `type` 与 `key`                                 | `type` 与 `key`                                         |
| **移动检测**     | `lastPlacedIndex` 贪心（单次遍历）              | 最长递增子序列 LIS（移动次数最优）                      |
| **无 key 行为**  | 退化为 index 匹配，易错配                       | 退化为按位置逐项 patch，同样易错配                      |
| **变更提交**     | Commit 阶段统一处理 Placement、Update、Deletion | patch 过程直接调用 insert、patchProp、remove 等宿主操作 |
| **跳过工作**     | Bailout、`memo`、稳定引用、编译器缓存           | 响应式依赖、PatchFlags、Block Tree、静态提升            |

**关键差异要点：**

- **数据结构决定算法**：React 的 Fiber 是单向链表，只能单向扫描，移动检测退化为 `lastPlacedIndex` 贪心；Vue 3 的 VNode 是数组，可双端扫描 + 随机访问，用 LIS 求移动次数的数学最优解。
- **变更提交时机不同**：React 在 Render 阶段只「记账」（打 `flags`），Commit 阶段统一批量应用；Vue 3 的 patch 边比较边调用宿主 API，更新即时落盘。
- **跳过工作的手段不同**：React 靠 `memo`、稳定引用、Bailout 等运行时手段；Vue 3 靠编译期注入的 PatchFlags、Block Tree、静态提升。
- **复杂度分布相反**：React 把复杂度留给运行时（可中断、可优先级的并发协调），Vue 3 把复杂度左移到编译期（确定性的靶向 patch）。
