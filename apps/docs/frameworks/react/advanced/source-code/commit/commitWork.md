---
outline: [2, 4]
---

# Commit 阶段

Render 阶段只在 Fiber 树上“**记账**”：比较新旧节点、计算 Lane、给需要变化的 Fiber 打上 `flags`。真正改 DOM、跑生命周期、执行 Effect 的是 Commit 阶段。它同步且不可中断——一旦开始，就必须把整棵树的变更应用完，否则页面会停在半更新状态。

React 18.3.1 的 `enableNewReconciler` 默认为 `false`，因此运行时走 `.old.js` 分叉。Commit 的核心实现位于 `react-reconciler/src/ReactFiberCommitWork.old.js` 与 `react-reconciler/src/ReactFiberWorkLoop.old.js`。Render 阶段如何产生这些 flags，可参考[工作循环](/frameworks/react/advanced/source-code/reconciler/workLoop)、[beginWork](/frameworks/react/advanced/source-code/reconciler/beginWork) 和 [completeWork](/frameworks/react/advanced/source-code/reconciler/completeWork)。

## 1. Commit 阶段的三幕剧

### 1.1 `commitRootImpl` 的固定顺序

Commit 的总入口是 `commitRootImpl`。它拿到 Render 阶段留下的 `root.finishedWork`，按固定顺序执行 BeforeMutation、Mutation、Layout 三个阶段，并在 Mutation 与 Layout 之间切换 `root.current`：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 第一幕 BeforeMutation：在修改宿主树前读取状态，调用 getSnapshotBeforeUpdate。
const shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(
  root,
  finishedWork,
)

// ...

// 第二幕 Mutation：真正修改宿主树。
commitMutationEffects(root, finishedWork, lanes)

// ...

// 新旧树在此切换：必须晚于 Mutation（卸载时旧树仍是 current），早于 Layout（挂载时新树已是 current）。
root.current = finishedWork

// ...

commitLayoutEffects(finishedWork, root, lanes)

// ...

// 通知 Scheduler 在帧末让出主线程，给浏览器绘制机会。
requestPaint()
```

`root.current = finishedWork` 的位置很关键：

- 放在 Mutation 之后，`componentWillUnmount` 执行时旧树仍然是 `current`；
- 放在 Layout 之前，`componentDidMount` / `componentDidUpdate` 执行时新树已经是 `current`。

`requestPaint()` 则请求 Scheduler 在这一帧结束时让出主线程，给浏览器绘制机会。

### 1.2 三个同步子阶段与一个异步阶段

[width(19,36,45)]

| 子阶段         | 入口函数                                                    | 主要工作                                                             |
| -------------- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| BeforeMutation | `commitBeforeMutationEffects`                               | `getSnapshotBeforeUpdate`、读取 DOM 变更前的状态                     |
| Mutation       | `commitMutationEffects`                                     | 插入、移动、删除 DOM；执行 Insertion Effect；执行 Layout Effect 清理 |
| Layout         | `commitLayoutEffects`                                       | 执行 Layout Effect 的 create、`componentDidMount`、挂载 ref          |
| Passive        | `commitPassiveMountEffects` / `commitPassiveUnmountEffects` | 在绘制后异步执行 `useEffect` 的 create 与 destroy                    |

前三个阶段在 `commitRootImpl` 中同步完成；Passive 阶段不在其中直接执行，而是通过 `scheduleCallback` 安排到后续任务：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 子树或自身带 Passive 标记，说明有 useEffect 待执行。
if (
  (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
  (finishedWork.flags & PassiveMask) !== NoFlags
) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true
    pendingPassiveEffectsRemainingLanes = remainingLanes
    // render 与 commit 之间可能因节流而隔开，先把 transitions 存下来，避免被覆盖。
    pendingPassiveTransitions = transitions
    // 用普通优先级异步调度，等浏览器绘制后再冲刷 Passive Effect。
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects()
      // 等 Passive Effect 执行完再释放 root 的 cache pool，避免树上节点仍在使用。
      return null
    })
  }
}
```

注意每轮 `commitRootImpl` 开头还会先清空上一轮遗留的 Passive Effect：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 提交前先清空上一轮遗留的 Passive Effect。
do {
  // flushPassiveEffects 末尾可能冲刷出新的 Passive Effect，因此要循环到不再有挂起项。
  // 省略 TODO 注释：让 flushPassiveEffects 不再自动冲刷同步任务。
  flushPassiveEffects()
} while (rootWithPendingPassiveEffects !== null)
```

这保证了“上一次提交的 `useEffect` 清理”不会拖到下一次提交之后才执行。

### 1.3 整体流程

```mermaid
flowchart TD
    A[commitRootImpl] --> B[commitBeforeMutationEffects]
    B --> C[commitMutationEffects]
    C --> D[root.current = finishedWork]
    D --> E[commitLayoutEffects]
    E --> F[requestPaint]
    A -.->|PassiveMask| G[scheduleCallback<br/>NormalSchedulerPriority]
    G --> H[flushPassiveEffects]
    H --> I[commitPassiveUnmountEffects]
    H --> J[commitPassiveMountEffects]
```

## 2. Mutation 阶段

Mutation 阶段负责“**把 Fiber 上的标记翻译成宿主操作**”。它的入口很小，真正的分派发生在 `commitMutationEffectsOnFiber`。

### 2.1 `commitMutationEffects`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
export function commitMutationEffects(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
) {
  // 记录当前提交的 lanes 与 root，供错误捕获逻辑使用。
  inProgressLanes = committedLanes
  inProgressRoot = root

  // 省略 DEV 下的调试 Fiber 标记。

  commitMutationEffectsOnFiber(finishedWork, root, committedLanes)

  // 提交结束，清空游标。
  inProgressLanes = null
  inProgressRoot = null
}
```

`inProgressLanes` / `inProgressRoot` 是模块级变量，供 `captureCommitPhaseError` 等错误处理逻辑使用；进入时保存、退出时清空。

### 2.2 `recursivelyTraverseMutationEffects`

真正的递归发生在 `recursivelyTraverseMutationEffects`。它做两件事：先处理父节点收集到的删除队列，再按 `subtreeFlags` 决定是否继续遍历子节点。

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber,
  lanes: Lanes,
) {
  // 删除队列可能挂在任意类型的 Fiber 上，且必须先于子节点的副作用执行。
  const deletions = parentFiber.deletions
  if (deletions !== null) {
    // 省略各删除调用外的错误捕获。
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i]
      commitDeletionEffects(root, parentFiber, childToDelete)
    }
  }

  // 省略 DEV 下的调试 Fiber 标记。

  // 子树没有 Mutation 标记就剪枝，不再向下遍历。
  if (parentFiber.subtreeFlags & MutationMask) {
    let child = parentFiber.child
    // 沿 sibling 指针依次处理所有子 Fiber。
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root, lanes)
      child = child.sibling
    }
  }
}
```

两个顺序约定值得记住：

1. **删除先于子节点副作用**。`deletions` 在遍历 `child` 之前处理，保证被删除子树的清理发生在兄弟节点插入之前。
2. **`subtreeFlags & MutationMask` 剪枝**。如果整棵子树都没有 Mutation 相关标记，就不再向下遍历，这是 React 18 去掉 effect list 后仍能避免全树扫描的关键。

`MutationMask` 由多个 flag 位或而成：

```ts [react-reconciler/src/ReactFiberFlags.js]
// 每个标记独占一个二进制位，便于按位判断与组合。
// 插入或移动宿主节点
export const Placement = /*                    */ 0b00000000000000000000000010
// 更新属性、文本或执行 Layout Effect
export const Update = /*                       */ 0b00000000000000000000000100
// 有子节点需要删除
export const ChildDeletion = /*                */ 0b00000000000000000000010000
// 重置文本内容
export const ContentReset = /*                 */ 0b00000000000000000000100000
// 需要绑定或解绑 ref
export const Ref = /*                          */ 0b00000000000000001000000000
// 有 Passive Effect（useEffect）待执行
export const Passive = /*                      */ 0b00000000000000100000000000
// hydration 进行中，提交阶段消费后清位
export const Hydrating = /*                    */ 0b00000000000001000000000000

// ...

// MutationMask 汇总 Mutation 阶段要消费的标记。
export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility
// LayoutMask 与 PassiveMask 分别供另外两个阶段剪枝。
export const LayoutMask = Update | Callback | Ref | Visibility
export const PassiveMask = Passive | ChildDeletion
```

### 2.3 `commitMutationEffectsOnFiber`

不同类型 Fiber 的副作用不同。以函数组件为例，`Update` 标记意味着需要处理 Hook Effect：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // 先递归子树，再处理本节点的结构标记。
      recursivelyTraverseMutationEffects(root, finishedWork, lanes);
      commitReconciliationEffects(finishedWork);

      // Update 标记表示 Hook Effect 需要在本次提交重新执行。
      if (flags & Update) {
        // 省略各调用外的错误捕获。
        // Insertion Effect 在 Mutation 阶段同步卸载并重新挂载。
        commitHookEffectListUnmount(
          HookInsertion | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
        commitHookEffectListMount(
          HookInsertion | HookHasEffect,
          finishedWork,
        );
        // Layout Effect 的 destroy 也在这里执行，保证所有 destroy 都先于任何 create，
        // 避免兄弟组件的副作用互相干扰。
        commitHookEffectListUnmount(
          HookLayout | HookHasEffect,
          finishedWork,
          finishedWork.return,
        );
      }
      return;
    }
```

可以看到三类 Effect 在 Mutation 阶段的分工：

- `useInsertionEffect`：先卸载旧的，再同步挂载新的；
- `useLayoutEffect`：只执行 destroy，create 留到 Layout 阶段；
- `useEffect`：完全不在 Mutation 阶段处理，交给 Passive 阶段。

### 2.4 `commitReconciliationEffects`

所有“**结构变化**”的标记最终汇聚到 `commitReconciliationEffects`：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitReconciliationEffects(finishedWork: Fiber) {
  // 插入/移动标记可能挂在任意 Fiber 上，执行时机在子节点副作用之后、本节点副作用之前。
  const flags = finishedWork.flags
  // 有 Placement 标记就执行真正的插入或移动。
  if (flags & Placement) {
    // 省略各调用外的错误捕获。
    commitPlacement(finishedWork)
    // 清除 Placement，后续生命周期才能知道节点已插入。
    // 省略 TODO 注释：isMounted 已废弃，这段清位逻辑将来可以去掉。
    finishedWork.flags &= ~Placement
  }
  // 省略 Hydrating 标记的清位。
}
```

位掩码在这里体现得很直接：

- `flags & Placement` 判断是否存在标记；
- `flags &= ~Placement` 清除标记，避免后续阶段或重复遍历再次处理；
- 同一个 Fiber 可以同时带多个位，按阶段分别消费。

## 3. 插入与移动

### 3.1 为什么必须用 `insertBefore`

假设列表从 `[A, B, C]` 变成 `[B, A, C]`，只有 A 被标记为 `Placement`。如果直接：

```js
// 错误示范：追加到末尾会把顺序变成 [B, C, A]。
parent.appendChild(A)
```

A 会被追加到 C 后面，结果变成 `[B, C, A]`，顺序错误。正确做法是找到 A 后面第一个“**稳定**”的宿主节点 C，把 A 插到 C 之前：

```js
// 正确做法：插到后方第一个稳定锚点之前。
parent.insertBefore(A, C) // 结果 [B, A, C]
```

`getHostSibling` 的职责就是找这个锚点；找不到锚点时才退回 `appendChild`。

### 3.2 `commitPlacement`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitPlacement(finishedWork: Fiber): void {
  // 非 Mutation 渲染器没有宿主节点，无需插入。
  if (!supportsMutation) {
    return
  }

  // 先向上找到宿主父节点，再递归插入它的所有宿主子节点。
  const parentFiber = getHostParentFiber(finishedWork)

  // 注意：这两个变量必须始终一起更新。
  switch (parentFiber.tag) {
    case HostComponent: {
      const parent: Instance = parentFiber.stateNode
      if (parentFiber.flags & ContentReset) {
        // 插入前先清空父节点的旧文本，避免残留。
        resetTextContent(parent)
        // 消费后清除 ContentReset 标记。
        parentFiber.flags &= ~ContentReset
      }

      // 找稳定锚点，找不到时退回 appendChild。
      const before = getHostSibling(finishedWork)
      // 只拿到被插入的顶层 Fiber，需要向下递归找所有终端宿主节点。
      insertOrAppendPlacementNode(finishedWork, before, parent)
      break
    }
    case HostRoot:
    case HostPortal: {
      const parent: Container = parentFiber.stateNode.containerInfo
      const before = getHostSibling(finishedWork)
      insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent)
      break
    }
    // 省略无效宿主父节点时的报错。
  }
}
```

几处细节：

- `supportsMutation` 为 `false` 的渲染器（如部分自定义渲染器）直接跳过 DOM 操作；
- `HostComponent` 的父容器是 `stateNode`，`HostRoot` / `HostPortal` 的父容器是 `stateNode.containerInfo`；
- 父节点带 `ContentReset` 时，先清空文本再插入，避免旧文本残留在新节点前面。

### 3.3 `getHostSibling`：向前找稳定锚点

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function getHostSibling(fiber: Fiber): ?Instance {
  // 向前寻找第一个稳定的宿主兄弟节点；连续插入时需要越过已标记的节点。
  // 省略 TODO 注释：连续插入会退化成指数级搜索，待优化。
  let node: Fiber = fiber
  siblings: while (true) {
    // 没有兄弟就沿 return 向上，直到遇到宿主父节点；仍没有则返回 null。
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null
      }
      node = node.return
    }
    node.sibling.return = node.return
    node = node.sibling
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment
    ) {
      // 非宿主节点，向下找它的 child，直到遇到宿主节点。
      if (node.flags & Placement) {
        // 本身也待移动，不能作为锚点，换下一个兄弟。
        continue siblings
      }
      // 没有子节点，或遇到不属于当前宿主树的 Portal，同样换兄弟。
      if (node.child === null || node.tag === HostPortal) {
        continue siblings
      } else {
        node.child.return = node
        node = node.child
      }
    }
    // 本轮不移动的宿主节点才是稳定锚点。
    if (!(node.flags & Placement)) {
      return node.stateNode
    }
  }
}
```

查找规则：

1. 没有兄弟就沿 `return` 向上，直到遇到有兄弟的祖先或宿主父节点；越过宿主父节点仍找不到就返回 `null`。
2. 找到兄弟后，如果它不是宿主节点，就向下找它的 `child`。
3. 跳过本身也带 `Placement` 的节点——它们也会移动，不能作为稳定锚点。
4. 跳过 `HostPortal`，因为 Portal 的 DOM 不在当前宿主树里。
5. 返回第一个“**本轮不移动**”的宿主节点的 `stateNode`。

注释里也坦白了代价：连续多次插入时，每次都要越过前面尚未插入的节点，最坏会退化成指数级搜索。

### 3.4 `insertOrAppendPlacementNode`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance,
): void {
  const { tag } = node
  const isHost = tag === HostComponent || tag === HostText
  // 宿主节点直接插入或追加。
  if (isHost) {
    const stateNode = node.stateNode
    if (before) {
      insertBefore(parent, stateNode, before)
    } else {
      appendChild(parent, stateNode)
    }
  } else if (tag === HostPortal) {
    // Portal 不向下遍历，它的子节点由各自的容器处理。
  } else {
    // 普通组件 Fiber 没有 DOM，继续向下找宿主子节点。
    const child = node.child
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent)
      let sibling = child.sibling
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent)
        sibling = sibling.sibling
      }
    }
  }
}
```

函数组件、Context Provider 等没有 DOM 的 Fiber，会继续向下递归，直到找到 `HostComponent` 或 `HostText`。Portal 则直接返回：它的子节点会由 Portal 自己的容器处理。

对应的 `insertOrAppendPlacementNodeIntoContainer` 逻辑相同，只是把 `insertBefore` / `appendChild` 换成了容器版本。

### 3.5 `getHostParentFiber` 与 `isHostParent`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function getHostParentFiber(fiber: Fiber): Fiber {
  // 沿 return 向上找第一个宿主父节点。
  let parent = fiber.return
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent
    }
    parent = parent.return
  }

  // 找不到宿主父节点属于内部错误。
  throw new Error('Expected to find a host parent.')
}

// 只有宿主组件、根节点和 Portal 能承载子节点。
function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  )
}
```

函数组件、Context Provider 等没有 DOM 的节点会被跳过，直到遇到 `HostComponent`、`HostRoot` 或 `HostPortal`。

## 4. 删除

### 4.1 `commitDeletionEffects`

删除的入口不是被删节点自己，而是它的父节点。`commitDeletionEffects` 先确定“**从哪个宿主节点里移除**”，再递归清理整棵被删子树。

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
// 递归遍历被删子树期间，用这两个变量记录该从哪个实例/容器中移除。
// 省略 TODO 注释：这两个游标应该在整个 Mutation 阶段维护，而不只是删除时。
let hostParent: Instance | Container | null = null
let hostParentIsContainer: boolean = false

function commitDeletionEffects(
  root: FiberRoot,
  returnFiber: Fiber,
  deletedFiber: Fiber,
) {
  if (supportsMutation) {
    // ...
    // 先向上找到最近的宿主父节点，确定从哪个实例或容器移除子节点。
    // ...
    let parent = returnFiber
    findParent: while (parent !== null) {
      // 宿主节点取 stateNode，HostRoot 与 HostPortal 取 containerInfo。
      switch (parent.tag) {
        case HostComponent: {
          hostParent = parent.stateNode
          hostParentIsContainer = false
          break findParent
        }
        case HostRoot: {
          hostParent = parent.stateNode.containerInfo
          hostParentIsContainer = true
          break findParent
        }
        case HostPortal: {
          hostParent = parent.stateNode.containerInfo
          hostParentIsContainer = true
          break findParent
        }
      }
      parent = parent.return
    }
    // 省略 hostParent 为 null 时的错误处理。
    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber)
    hostParent = null
    hostParentIsContainer = false
  } else {
    // 非 Mutation 渲染器只需解绑 ref 并调用 componentWillUnmount。
    commitDeletionEffectsOnFiber(root, returnFiber, deletedFiber)
  }

  // 断开 return 指针，已卸载组件上的 setState 才能被检测到。
  detachFiberMutation(deletedFiber)
}
```

`hostParent` / `hostParentIsContainer` 是模块级变量，相当于“**删除遍历期间使用的游标**”。找到最近的宿主父节点后，`commitDeletionEffectsOnFiber` 递归处理子树；结束后清空游标，最后调用 `detachFiberMutation` 切断 `return` 指针，让已卸载组件上的 `setState` 能被检测出来。

### 4.2 `commitDeletionEffectsOnFiber`

删除遍历会区分节点类型。宿主节点负责真正 `removeChild`，函数组件负责执行 Effect 的 destroy：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
    case HostComponent: {
      // 省略 Suspense/Offscreen 隐藏子树的判断。
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      // 故意落入 HostText 分支，统一走移除逻辑。
    }
    // eslint-disable-next-line-no-fallthrough
    case HostText: {
      // 只需移除最近的宿主子节点，先把 hostParent 置空，避免嵌套节点重复移除。
      if (supportsMutation) {
        const prevHostParent = hostParent;
        const prevHostParentIsContainer = hostParentIsContainer;
        hostParent = null;
        recursivelyTraverseDeletionEffects(
          finishedRoot,
          nearestMountedAncestor,
          deletedFiber,
        );
        hostParent = prevHostParent;
        hostParentIsContainer = prevHostParentIsContainer;

        if (hostParent !== null) {
          // 子节点的清理都完成后，才真正把节点从树上移除。
          if (hostParentIsContainer) {
            removeChildFromContainer(
              ((hostParent: any): Container),
              (deletedFiber.stateNode: Instance | TextInstance),
            );
          } else {
            removeChild(
              ((hostParent: any): Instance),
              (deletedFiber.stateNode: Instance | TextInstance),
            );
          }
        }
      } else {
        recursivelyTraverseDeletionEffects(
          finishedRoot,
          nearestMountedAncestor,
          deletedFiber,
        );
      }
      return;
    }
```

有几个容易忽略的点：

- 进入宿主节点后先把 `hostParent` 置为 `null`，再递归子节点。这样嵌套的子宿主节点不会重复执行 `removeChild`，只由最外层负责移除。
- `HostComponent` 会先 `safelyDetachRef`，再落入 `HostText` 分支。
- 递归清理完子节点后，才恢复 `hostParent` 并执行 `removeChild`，所以清理函数访问 DOM 时节点仍然存在。

函数组件分支只处理 `useInsertionEffect` 和 `useLayoutEffect` 的 destroy：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // 省略 Suspense/Offscreen 隐藏子树的判断。
      // 取出该组件的 Effect 环形链表，逐个执行 destroy。
      const updateQueue: FunctionComponentUpdateQueue | null = (deletedFiber.updateQueue: any);
      if (updateQueue !== null) {
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect !== null) {
          // lastEffect.next 才是头节点，绕环遍历一整圈。
          const firstEffect = lastEffect.next;

          let effect = firstEffect;
          do {
            const {destroy, tag} = effect;
            if (destroy !== undefined) {
              // 只处理 Insertion 与 Layout Effect，Passive 留到 Passive Unmount 阶段。
              if ((tag & HookInsertion) !== NoHookEffect) {
                safelyCallDestroy(
                  deletedFiber,
                  nearestMountedAncestor,
                  destroy,
                );
              } else if ((tag & HookLayout) !== NoHookEffect) {
                // ...
                safelyCallDestroy(
                  deletedFiber,
                  nearestMountedAncestor,
                  destroy,
                );
                // ...
              }
            }
            effect = effect.next;
          } while (effect !== firstEffect);
        }
      }

      // 子树同样需要递归清理。
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber,
      );
      return;
    }
```

`useEffect` 的 destroy 不在这里执行，而是留到 Passive Unmount 阶段。这样能保证所有同步清理先完成，再把异步副作用的清理推迟到绘制之后。

### 4.3 删除标记为什么挂在父节点

Render 阶段发现子节点需要删除时，调用的是 `deleteChild`；父节点同时被打上 `ChildDeletion`，而 `ChildDeletion` 会同时进入 Mutation 与 Passive 两套掩码：

:::code-group

```ts [react-reconciler/src/ReactChildFiber.old.js]
function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  if (!shouldTrackSideEffects) {
    // 当前不追踪副作用，直接返回。
    return
  }
  const deletions = returnFiber.deletions
  // 首次删除时初始化 deletions，并给父节点打上 ChildDeletion。
  if (deletions === null) {
    returnFiber.deletions = [childToDelete]
    returnFiber.flags |= ChildDeletion
  } else {
    deletions.push(childToDelete)
  }
}
```

```ts [react-reconciler/src/ReactFiberFlags.js]
// 有子节点需要删除
export const ChildDeletion = /*                */ 0b00000000000000000000010000
// 有 Passive Effect（useEffect）待执行
export const Passive = /*                      */ 0b00000000000000100000000000

// ...

// ChildDeletion 同时进入两套掩码：Mutation 移除 DOM，Passive 清理 useEffect。
export const MutationMask =
  Placement |
  Update |
  ChildDeletion |
  ContentReset |
  Ref |
  Hydrating |
  Visibility

// 省略 TODO 注释：之后拆成 PassiveMountMask 与 PassiveUnmountMask。
export const PassiveMask = Passive | ChildDeletion
```

:::

待删除的 Fiber 被放进父节点的 `deletions` 数组，同时父节点被打上 `ChildDeletion`。好处是：

- Commit 阶段只需要在父节点处处理一次 `deletions`，不必再遍历被删子树去找“**谁是根**”；
- 被删子树的 Fiber 可能已经不再参与本轮协调，单独遍历容易遗漏；
- `ChildDeletion` 同时出现在 `MutationMask` 和 `PassiveMask` 中，Mutation 阶段负责移除 DOM，Passive 阶段负责清理 `useEffect`。

## 5. Hook Effect 的挂载与卸载

### 5.1 Effect 标签

Effect 不是按“**类型**”直接存成 `useEffect` / `useLayoutEffect`，而是用位标记描述它属于哪个阶段、是否需要在本次提交执行：

```ts [react-reconciler/src/ReactHookEffectTags.js]
export type HookFlags = number

// 四个位分别表示是否执行与所属阶段，组合后用于筛选。
export const NoFlags = /*   */ 0b0000

// 本次提交是否需要执行 create 或 destroy。
export const HasEffect = /* */ 0b0001

// 标记 create 在哪个阶段执行（destroy 的阶段另算）。
export const Insertion = /*  */ 0b0010
export const Layout = /*    */ 0b0100
export const Passive = /*   */ 0b1000
```

调用方通过组合标签筛选，例如 `HookLayout | HookHasEffect` 表示“**本次需要执行的 Layout Effect**”。

### 5.2 环形链表遍历

每个函数组件的 `updateQueue.lastEffect` 指向 Hook Effect 环形链表的尾节点，`lastEffect.next` 才是头节点。挂载和卸载都按同一个环走一圈：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // lastEffect.next 是头节点，绕环遍历一圈。
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      // flags 的每一位都命中才执行，避免误处理其它阶段。
      if ((effect.tag & flags) === flags) {
        // 先置空 destroy，再执行清理，避免重入或重复执行。
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          // ...
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
          // ...
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitHookEffectListMount(flags: HookFlags, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    // 同样从环形链表头节点开始遍历。
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        // 执行 create，返回值保存为下一次的 destroy。
        const create = effect.create;
        effect.destroy = create();
        // ...
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

两个实现细节：

- `(effect.tag & flags) === flags` 要求 `flags` 中的每一位都匹配，因此不会误执行其它阶段的 Effect。
- 卸载时先把 `effect.destroy` 置为 `undefined`，再调用旧 destroy，避免清理函数重入或重复执行。
- 挂载时把 `create()` 的返回值写回 `effect.destroy`，供下一次卸载使用。

### 5.3 为什么 Layout Effect 的 destroy 在 Mutation 阶段

`useLayoutEffect` 的 create 在 Layout 阶段执行，但 destroy 被提前到 Mutation 阶段。源码注释给出了原因：让所有组件的 destroy 都先于任何 create 执行。否则兄弟组件的副作用可能互相干扰——比如一个组件的 destroy 覆盖了另一个组件在 create 中设置的 ref。

`useInsertionEffect` 更特殊：它在 Mutation 阶段先 destroy、再 create，因为它本来就是为“**在布局读取前插入样式**”设计的。

## 6. Passive Effects

### 6.1 调度时机

Passive Effect 的调度在 `commitRootImpl` 前半段完成（见 [1.2](#12-三个同步子阶段与一个异步阶段)）。它使用 `NormalSchedulerPriority`，因此：

- 不会阻塞当前 Commit；
- 浏览器先完成绘制；
- Scheduler 在后续任务中调用 `flushPassiveEffects`。

如果本次提交由同步 Lane 触发，`commitRootImpl` 末尾还会同步冲刷一次 Passive Effect：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
// 同步 Lane 的提交要在函数内冲刷 Passive Effect；LegacyRoot 的例外判断已省略。
if (includesSomeLane(pendingPassiveEffectsLanes, SyncLane)) {
  flushPassiveEffects()
}
```

这是为了兼容“**同步渲染的结果必须立即可观察**”的语义。

### 6.2 `commitPassiveMountEffects`

Passive 遍历不使用递归，而是用模块级 `nextEffect` 做迭代，避免深树导致调用栈过深：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
export function commitPassiveMountEffects(
  root: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
  committedTransitions: Array<Transition> | null,
): void {
  // 用模块级 nextEffect 做迭代遍历，避免深树递归爆栈。
  nextEffect = finishedWork
  commitPassiveMountEffects_begin(
    finishedWork,
    root,
    committedLanes,
    committedTransitions,
  )
}

function commitPassiveMountEffects_begin(
  subtreeRoot: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
  committedTransitions: Array<Transition> | null,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect
    const firstChild = fiber.child
    // 子树仍有 Passive 标记就继续下潜，否则交给 complete 回溯处理。
    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && firstChild !== null) {
      firstChild.return = fiber
      nextEffect = firstChild
    } else {
      commitPassiveMountEffects_complete(
        subtreeRoot,
        root,
        committedLanes,
        committedTransitions,
      )
    }
  }
}

function commitPassiveMountEffects_complete(
  subtreeRoot: Fiber,
  root: FiberRoot,
  committedLanes: Lanes,
  committedTransitions: Array<Transition> | null,
) {
  while (nextEffect !== null) {
    const fiber = nextEffect

    // 回溯时执行本节点上待处理的 Passive Effect。
    if ((fiber.flags & Passive) !== NoFlags) {
      // 省略 DEV 下的调试 Fiber 标记与各调用外的错误捕获。
      commitPassiveMountOnFiber(
        root,
        fiber,
        committedLanes,
        committedTransitions,
      )
    }

    // 回到子树根即结束；否则转向兄弟，没有兄弟就继续向上。
    if (fiber === subtreeRoot) {
      nextEffect = null
      return
    }

    const sibling = fiber.sibling
    if (sibling !== null) {
      sibling.return = fiber.return
      nextEffect = sibling
      return
    }

    nextEffect = fiber.return
  }
}
```

`begin` 只负责向下找到叶子，`complete` 负责在回溯途中执行带 `Passive` 标记的 Fiber。`subtreeFlags & PassiveMask` 再次承担剪枝作用。

真正执行 `useEffect` create 的是 `commitPassiveMountOnFiber` 的函数组件分支：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // Passive 阶段执行 useEffect 的 create；省略 Profiler 计时。
      commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork);
      break;
    }
```

### 6.3 `commitPassiveUnmountEffects`

卸载遍历比挂载多了一件事：遇到 `ChildDeletion` 时，要先清理被删除子树内部的 Passive Effect。

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
export function commitPassiveUnmountEffects(firstChild: Fiber): void {
  // 与挂载一致，用 nextEffect 迭代遍历整棵树。
  nextEffect = firstChild
  commitPassiveUnmountEffects_begin()
}

function commitPassiveUnmountEffects_begin() {
  while (nextEffect !== null) {
    const fiber = nextEffect
    const child = fiber.child

    // 遇到删除标记，先清理被删子树内部的 Passive Effect。
    if ((nextEffect.flags & ChildDeletion) !== NoFlags) {
      const deletions = fiber.deletions
      if (deletions !== null) {
        for (let i = 0; i < deletions.length; i++) {
          const fiberToDelete = deletions[i]
          nextEffect = fiberToDelete
          commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
            fiberToDelete,
            fiber,
          )
        }

        // ...
        nextEffect = fiber
      }
    }

    // 其余节点照常下潜或回溯。
    if ((fiber.subtreeFlags & PassiveMask) !== NoFlags && child !== null) {
      child.return = fiber
      nextEffect = child
    } else {
      commitPassiveUnmountEffects_complete()
    }
  }
}
```

被删子树的清理走单独的遍历 `commitPassiveUnmountEffectsInsideOfDeletedTree_begin`，它按“**父 → 子**”的顺序执行 destroy。这一点与挂载阶段“**子 → 父**”的 create 顺序相反：清理应当先释放父级资源，再释放子级依赖。

最终执行 `useEffect` destroy 的函数仍然是 `commitHookEffectListUnmount`：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitPassiveUnmountOnFiber(finishedWork: Fiber): void {
  // Passive 阶段执行 useEffect 的 destroy。
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      // Passive 阶段执行 useEffect 的 destroy；省略 Profiler 计时。
      commitHookEffectListUnmount(
        HookPassive | HookHasEffect,
        finishedWork,
        finishedWork.return,
      )
      break
    }
  }
}
```

### 6.4 为什么不在 Mutation 阶段直接执行

- `useEffect` 的语义是“**浏览器绘制之后**”，此时布局已经稳定，读取布局不会触发额外的强制同步。
- 如果同步执行，耗时副作用会阻塞绘制，用户看到首屏的时间变长。
- 交给 Scheduler 后，React 可以在浏览器空闲时执行，必要时还能继续让出主线程。
- 卸载时的 `useEffect` destroy 也要等 DOM 移除完成后再执行，避免清理函数访问已经不在文档中的节点。

需要“**DOM 已更新、绘制之前**”执行副作用时，应该使用 `useLayoutEffect`；两者的调度差异可参考 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect) 与 [useLayoutEffect](/frameworks/react/advanced/source-code/hooks/useLayoutEffect)。

## 7. 总结

[width(13,15,45,27)]

| 操作             | 触发标记        | 关键函数                                                                   | 注意事项                             |
| ---------------- | --------------- | -------------------------------------------------------------------------- | ------------------------------------ |
| 插入 / 移动      | `Placement`     | `commitPlacement`、`getHostSibling`                                        | 必须用 `insertBefore` 保持顺序       |
| 删除             | `ChildDeletion` | `commitDeletionEffects`、`commitDeletionEffectsOnFiber`                    | 先清理子节点，再由最外层宿主节点移除 |
| 更新属性         | `Update`        | 在 `completeWork` 中生成，Mutation 阶段消费                                | `ContentReset` 要先重置文本          |
| Insertion Effect | `Insertion`     | `commitHookEffectListUnmount` / `commitHookEffectListMount`                | Mutation 阶段先 destroy 再 create    |
| Layout Effect    | `Layout`        | Mutation 阶段 destroy，Layout 阶段 `commitHookEffectListMount` 执行 create | DOM 已变、绘制前同步执行             |
| Passive Effect   | `Passive`       | `commitPassiveMountEffects`、`commitPassiveUnmountEffects`                 | 绘制后异步执行；删除子树单独清理     |

Commit 阶段的设计原则可以概括为“**Render 只算、Commit 只做**”：

[width(14,86)]

| 阶段     | 职责                                      |
| -------- | ----------------------------------------- |
| Render   | 比较、打标记、计算 Lane                   |
| Mutation | 消费结构标记，完成 DOM 的插入、移动、删除 |
| Layout   | 读取变更后的 DOM，执行同步副作用          |
| Passive  | 绘制后异步补齐 `useEffect`                |
