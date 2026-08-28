# 协调与更新

## 1. React：Fiber 协调流程

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

Render 阶段关键工作——`beginWork` 的简化实现：

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

// React 协调子节点的核心函数（简化）
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  if (current === null) {
    // 首次挂载：直接创建新的子 Fiber（不做 diff）
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren)
  } else {
    // 更新：对比新旧子节点，标记删除/新增/移动
    workInProgress.child = reconcileChildFibers(
      workInProgress, current.child, nextChildren
    )
  }
}
```

React 的多节点协调（`reconcileChildrenArray`）受 Fiber 单向链表拓扑约束，只能**单向扫描**，用 `lastPlacedIndex` 贪心检测移动：

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

## 2. Vue 3：响应式驱动的 patch 流程

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

Vue 3 的多节点 patch（`patchKeyedChildren`）的 VNode 是数组，支持**双端扫描与索引随机访问**，用最长递增子序列（LIS）把移动次数压到最优：

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

## 3. 对比总结

```markdown
React（单向链表约束）：单次遍历 + lastPlacedIndex
第一轮顺序比对 → 第二轮 Map 查找 → 第三轮删除剩余
用"旧 index < lastPlacedIndex"判断移动，只能单向扫描

Vue 3（数组随机访问）：双端比较 + 最长递增子序列
头尾同步剥离 → 中间建 key Map → LIS 求不动的子序列
可双向扫描，LIS 内节点保持原位，移动次数接近最优
```

| 维度             | React                                           | Vue 3                                                   |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------- |
| **更新来源**     | `setState`、Hook dispatch、外部 Store 等        | `ref`、`reactive` 等响应式数据触发依赖                  |
| **比较输入**     | 新 React Element 与 current Fiber               | 新旧 VNode                                              |
| **列表复用依据** | `type` 与 `key`                                 | `type` 与 `key`                                         |
| **移动检测**     | `lastPlacedIndex` 贪心（单次遍历）              | 最长递增子序列 LIS（移动次数最优）                      |
| **变更提交**     | Commit 阶段统一处理 Placement、Update、Deletion | patch 过程直接调用 insert、patchProp、remove 等宿主操作 |
| **跳过工作**     | Bailout、`memo`、稳定引用、编译器缓存           | 响应式依赖、PatchFlags、Block Tree、静态提升            |

React 的协调受 Fiber 单向链表拓扑约束，只能单向扫描；Vue 3 的 VNode 是数组，天然支持双端与索引随机访问，因而能把 DOM 移动次数压得更低。二者最终都把真实 DOM 操作降到"**必须变化**"的最小集合，只是算法起点不同。
