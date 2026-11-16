---
outline: [2, 4]
---

# useEffect

`useEffect` 是三种 Effect 中最“晚”执行的一种：它不阻塞浏览器绘制，而是在 Commit 完成后由 Scheduler 异步回调。实现上，它用 `HookPassive` 标记 Effect，用 `PassiveEffect | PassiveStaticEffect` 标记 Fiber，并把待执行的回调挂到根节点的 `pendingPassiveEffects` 上。

`useEffect`、`useLayoutEffect` 与 `useInsertionEffect` 共用 `mountEffectImpl` / `updateEffectImpl`，差异体现在 Fiber 标记、Effect 标记和执行阶段。本文先讲三者共用的数据结构、链表与执行顺序，再展开 `useEffect` 的入口函数与 Passive 调度；`useLayoutEffect` 与 `useInsertionEffect` 的专属执行路径见各自文档。

核心实现位于 `packages/react-reconciler/src/ReactFiberHooks.old.js`、`ReactFiberCommitWork.old.js`、`ReactFiberWorkLoop.old.js` 和 `ReactHookEffectTags.js`。

## 1. 三种 Effect 与执行时机

三者的区别不在“做什么”，而在“什么时候做”：

- `useInsertionEffect`：Mutation 阶段早期同步执行，主要供 CSS-in-JS 注入样式。
- `useLayoutEffect`：DOM 已变更、浏览器尚未绘制，**同步**执行。
- `useEffect`：浏览器绘制之后，**异步**执行。

### 1.1 标记与阶段对照

[width(26,33,17,24)]

| Hook                 | Fiber 标记                                            | Effect 标记     | 执行阶段                             |
| -------------------- | ----------------------------------------------------- | --------------- | ------------------------------------ |
| `useEffect`          | `PassiveEffect \| PassiveStaticEffect`                | `HookPassive`   | Commit 之后，Scheduler 异步回调      |
| `useLayoutEffect`    | `UpdateEffect`（满足条件时再加 `LayoutStaticEffect`） | `HookLayout`    | Mutation 之后、浏览器绘制之前，同步  |
| `useInsertionEffect` | `UpdateEffect`                                        | `HookInsertion` | Mutation 阶段早期，早于 Layout，同步 |

Fiber 标记用于让 Commit 阶段知道“这棵子树有没有对应类型的副作用”，Effect 标记用于在遍历 Effect 循环链表时过滤具体节点。两者是不同层级的位掩码，不能混为一谈。

### 1.2 一次更新的时间线

```mermaid
flowchart LR
    A["Render：执行组件函数"] --> B["Mutation：Insertion destroy/create"]
    B --> C["Mutation：Layout destroy"]
    C --> D["Layout：Layout create"]
    D --> E["root.current = finishedWork"]
    E --> F["浏览器绘制"]
    F --> G["Scheduler：Passive unmount/mount"]
```

这个顺序解决了一个关键问题：**所有 Layout Effect 的 destroy 都必须先于任何 Layout Effect 的 create 执行**。否则兄弟组件的副作用可能互相干扰，例如一个组件的清理函数覆盖了另一个组件刚设置的 ref。

## 2. Effect 的数据结构

### 2.1 `Effect` 与 `HookFlags`

```ts [react-reconciler/src/ReactFiberHooks.old.js]
export type Effect = {|
  tag: HookFlags,
  create: () => (() => void) | void,
  destroy: (() => void) | void,
  deps: Array<mixed> | null,
  next: Effect,
|};
```

```ts [react-reconciler/src/ReactHookEffectTags.js]
export type HookFlags = number

export const NoFlags = /*   */ 0b0000

// Represents whether effect should fire.
export const HasEffect = /* */ 0b0001

// Represents the phase in which the effect (not the clean-up) fires.
export const Insertion = /*  */ 0b0010
export const Layout = /*    */ 0b0100
export const Passive = /*   */ 0b1000
```

`tag` 不是单一枚举，而是位组合：

- `HookPassive | HookHasEffect`：本次需要执行 Passive Effect。
- `HookLayout | HookHasEffect`：本次需要执行 Layout Effect。
- `HookInsertion | HookHasEffect`：本次需要执行 Insertion Effect。
- 没有 `HookHasEffect`：只保留 `destroy` 引用，本次不执行。

### 2.2 函数组件的更新队列

Effect 节点不挂在 `hook.queue` 上，而是挂在函数组件 Fiber 的 `updateQueue.lastEffect` 上：

```ts [react-reconciler/src/ReactFiberHooks.old.js]
export type FunctionComponentUpdateQueue = {|
  lastEffect: Effect | null,
  stores: Array<StoreConsistencyCheck<any>> | null,
|};
```

`lastEffect` 指向循环链表的最后一个节点，`lastEffect.next` 则指向第一个节点。

## 3. 共享的挂载与更新实现

### 3.1 `mountEffectImpl` 与 `updateEffectImpl`

:::code-group

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = mountWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  currentlyRenderingFiber.flags |= fiberFlags
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps,
  )
}
```

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function updateEffectImpl(fiberFlags, hookFlags, create, deps): void {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  let destroy = undefined

  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState
    destroy = prevEffect.destroy
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        hook.memoizedState = pushEffect(hookFlags, create, destroy, nextDeps)
        return
      }
    }
  }

  currentlyRenderingFiber.flags |= fiberFlags

  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destroy,
    nextDeps,
  )
}
```

:::

### 3.2 挂载与更新的差异

挂载与更新的差异可以概括为：

```text
Mount
  → 打 Fiber 标记
  → pushEffect(HookHasEffect | hookFlags, create, undefined, deps)

Update
  → 取上一次的 destroy
  → deps 存在且相等？
      ├─ 是 → pushEffect(hookFlags, create, destroy, deps)，不打标记、不执行
      └─ 否 → 打 Fiber 标记 → pushEffect(HookHasEffect | hookFlags, create, destroy, deps)
```

注意：依赖相等时，React 仍然会创建一个新的 Effect 节点，只是 `tag` 里没有 `HookHasEffect`，并且不给 Fiber 打标记。这样既能保留最新的 `destroy` 引用，又能让 Commit 阶段跳过本次执行。

依赖是否相等的判断由 `areHookInputsEqual` 完成，比较规则与依赖数组的三种写法见 [Hooks 链表](/frameworks/react/advanced/source-code/hooks/hooksInternals#_4-依赖数组的比较规则)。

## 4. Effect 循环链表

### 4.1 `pushEffect`

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function pushEffect(tag, create, destroy, deps) {
  const effect: Effect = {
    tag,
    create,
    destroy,
    deps,
    // Circular
    next: (null: any),
  };
  let componentUpdateQueue: null | FunctionComponentUpdateQueue = (currentlyRenderingFiber.updateQueue: any);
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = (componentUpdateQueue: any);
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
```

### 4.2 链表结构

```text
lastEffect ──▶ effect3 ──next──▶ effect1 ──next──▶ effect2 ──next──▶ effect3
                  ▲
                  └── lastEffect.next 指向 firstEffect（环形）
```

- 空链表时，新 effect 的 `next` 指向自己。
- 追加时，把新 effect 插到 `lastEffect` 之后，再让 `lastEffect` 指向它。
- `lastEffect.next` 永远指向最早的 effect，因此从 `lastEffect.next` 出发 `do...while` 一圈，就能按声明顺序遍历所有 effect。

循环链表带来三个好处：

- 插入 O(1)：不需要遍历到尾部。
- 遍历方便：从任意节点出发都能走完整圈。
- 记录最新节点：`lastEffect` 直接定位最后声明的 effect。

## 5. 执行 Effect 链表

### 5.1 挂载：只执行 `create`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitHookEffectListMount(flags: HookFlags, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        // Mount
        const create = effect.create;
        effect.destroy = create();
        // ... DEV 下会检查 create 是否返回了函数，以及是否在渲染中更新
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

这个函数**只调用 `create`**，并把返回值存回 `effect.destroy`。上一次的清理函数不在这里执行，而是在 Mutation 阶段或 Passive unmount 阶段由 `commitHookEffectListUnmount` 处理。

### 5.2 卸载：执行 `destroy`

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & flags) === flags) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```

执行前先把 `effect.destroy` 置为 `undefined`，避免同一次提交中重复清理。真正调用 destroy 的是 `safelyCallDestroy`，它负责捕获错误并交给错误边界。

### 5.3 Mutation 阶段：Insertion 与 Layout 清理

函数组件的 Mutation 分支会先处理 `useInsertionEffect`，再处理 `useLayoutEffect` 的清理：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitMutationEffectsOnFiber(
  finishedWork: Fiber,
  root: FiberRoot,
  lanes: Lanes,
) {
  const flags = finishedWork.flags

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      recursivelyTraverseMutationEffects(root, finishedWork, lanes)
      commitReconciliationEffects(finishedWork)

      if (flags & Update) {
        try {
          commitHookEffectListUnmount(
            HookInsertion | HookHasEffect,
            finishedWork,
            finishedWork.return,
          )
          commitHookEffectListMount(HookInsertion | HookHasEffect, finishedWork)
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error)
        }

        // Layout effects are destroyed during the mutation phase so that all
        // destroy functions for all fibers are called before any create functions.
        try {
          commitHookEffectListUnmount(
            HookLayout | HookHasEffect,
            finishedWork,
            finishedWork.return,
          )
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error)
        }
      }
      return
    }
  }
}
```

Insertion Effect 的 destroy 和 create 都在 Mutation 阶段早期完成，早于 Layout Effect；因此它适合在布局读取之前注入样式。Layout Effect 只在这里执行 destroy，create 留到 Layout 阶段。

### 5.4 create 分别在哪个阶段

- **Insertion create**：与 destroy 一起在 Mutation 阶段早期完成，见 [useInsertionEffect](/frameworks/react/advanced/source-code/hooks/useInsertionEffect)。
- **Layout create**：在 Layout 阶段由 `commitLayoutEffectOnFiber` 执行，见 [useLayoutEffect](/frameworks/react/advanced/source-code/hooks/useLayoutEffect)。
- **Passive mount / unmount**：在浏览器绘制后由 Scheduler 回调执行，见本文第 9 节。

## 6. 执行顺序

React 18 的 Effect 顺序有四条规则：

1. **Layout destroy 先于 Layout create**：destroy 在 Mutation 阶段统一执行，create 在 Layout 阶段统一执行。
2. **Passive unmount 先于 Passive mount**：`flushPassiveEffectsImpl` 先清理上一次的副作用，再执行本次的副作用。
3. **挂载时子先父后**：`commitPassiveMountEffects_begin` 先向下遍历 child，再在回退时处理当前节点。
4. **删除树中的副作用父先子后**：`commitPassiveUnmountEffectsInsideOfDeletedTree_begin` 按 parent → child 的顺序清理被删除的子树。

一次完整的时序可以写成：

```text
Render 阶段
  → 调用组件函数，pushEffect 收集 effect
Commit
  → BeforeMutation
  → Mutation
      → useInsertionEffect destroy
      → useInsertionEffect create
      → useLayoutEffect destroy
  → root.current = finishedWork
  → Layout
      → useLayoutEffect create
浏览器绘制
Scheduler 回调
  → useEffect destroy
  → useEffect create
```

## 7. `useEffect` 的入口函数

:::code-group

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  if (
    __DEV__ &&
    enableStrictEffects &&
    (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  ) {
    return mountEffectImpl(
      MountPassiveDevEffect | PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    )
  } else {
    return mountEffectImpl(
      PassiveEffect | PassiveStaticEffect,
      HookPassive,
      create,
      deps,
    )
  }
}

function updateEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps)
}
```

:::

与另外两种 Effect 相比，`useEffect` 的标记有两个特点：

- **Fiber 标记带 `PassiveStaticEffect`**：即使依赖没有变化，也标记“这个组件含有静态 Passive Effect”，方便 Commit 阶段决定是否需要调度 Passive 回调。
- **开发构建下可能带 `MountPassiveDevEffect`**：Strict Effects 模式下，挂载时的 Effect 会被额外标记，用于模拟卸载与重新挂载，帮助暴露没有正确清理的副作用。

`updateEffect` 只传 `PassiveEffect`，因为更新阶段的执行由 `HookHasEffect` 控制，不需要静态标记。

## 8. 依赖与执行时机

`useEffect` 的依赖数组遵循 Hooks 的统一比较规则：

- 不传依赖：`deps` 为 `null`，每次渲染后都执行。
- `[]`：只在挂载时执行一次。
- `[a]`：挂载时执行一次，之后 `a` 变化时执行。

依赖相等时，`updateEffectImpl` 仍然会 push 一个 Effect 节点，但不会设置 `HookHasEffect`，也不会给 Fiber 打 `PassiveEffect` 标记。Commit 阶段看到没有标记，就不会调度 Passive 回调，上一次的 `destroy` 则继续保留在节点上。

依赖比较的细节见 [Hooks 链表](/frameworks/react/advanced/source-code/hooks/hooksInternals#_4-依赖数组的比较规则)。

## 9. Passive Effect 的调度与执行

### 9.1 调度

`commitRootImpl` 在 Mutation / Layout 之前就把 Passive 回调排进 Scheduler：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
if (
  (finishedWork.subtreeFlags & PassiveMask) !== NoFlags ||
  (finishedWork.flags & PassiveMask) !== NoFlags
) {
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true
    pendingPassiveEffectsRemainingLanes = remainingLanes
    pendingPassiveTransitions = transitions
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects()
      // This render triggered passive effects: release the root cache pool
      // *after* passive effects fire to avoid freeing a cache pool that may
      // be referenced by a node in the tree (HostRoot, Cache boundary etc)
      return null
    })
  }
}
```

这段代码做了几件事：

- 检查 `PassiveMask`，确认本次提交的树里确实有 Passive Effect。
- 用 `rootDoesHavePassiveEffects` 保证同一个根节点只调度一次。
- 保存 `remainingLanes` 与 `transitions`，让 Passive 回调执行时仍能拿到本次渲染的优先级上下文。
- 以 `NormalSchedulerPriority` 调度 `flushPassiveEffects`，因此 Passive Effect 不会阻塞绘制。

### 9.2 刷新顺序：先 unmount 再 mount

真正的刷新发生在 `flushPassiveEffectsImpl`：

```ts [react-reconciler/src/ReactFiberWorkLoop.old.js]
commitPassiveUnmountEffects(root.current)
commitPassiveMountEffects(root, root.current, lanes, transitions)
```

顺序固定为“先清理上一次的副作用，再执行本次的副作用”。这样即使组件在更新中更换了依赖，也能保证旧订阅先解除、新订阅再建立，不会出现重复订阅。

如果本次渲染被更高优先级的更新打断，`flushPassiveEffects` 会在新的渲染开始前先同步刷新已挂起的 Passive Effect，避免副作用与页面状态不一致。

### 9.3 create 的执行

`commitPassiveMountOnFiber` 对函数组件执行 Passive create：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitPassiveMountOnFiber(
  finishedRoot: FiberRoot,
  finishedWork: Fiber,
  committedLanes: Lanes,
  committedTransitions: Array<Transition> | null,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork)
      break
    }
    // ... HostRoot、Cache 等分支
  }
}
```

遍历方向是**子先父后**：`commitPassiveMountEffects_begin` 先向下遍历 child，再在回退时处理当前节点。这与 React 中“子组件的副作用先于父组件执行”的直觉一致。

## 10. 卸载清理

组件被删除时，React 会在 Passive unmount 阶段遍历被删除的子树。这里使用的是**不带** `HookHasEffect` 的 `HookPassive`，因为删除时所有已经创建的副作用都必须清理，而不只是本次依赖变化的那些：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitPassiveUnmountInsideDeletedTreeOnFiber(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
): void {
  switch (current.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent: {
      commitHookEffectListUnmount(HookPassive, current, nearestMountedAncestor)
      break
    }
    // ... HostRoot 等分支
  }
}
```

对比来看，组件仍在树上、只是发生更新时，`commitPassiveUnmountOnFiber` 使用的是 `HookPassive | HookHasEffect`，只清理本次依赖确实变化的旧 Effect；而删除路径使用 `HookPassive`，保证卸载时不会漏掉任何一个 `create` 返回的 `destroy`。

对于仍在树上的组件，Passive unmount 先处理子节点，再处理父节点；对于被删除的子树，注释明确说明是 parent → child。两种遍历方向不同，但都保证“清理函数在对应的 create 之后、下次 create 之前执行”。

## 11. 与简化实现的差异

这里的“简化实现”指仓库中用于教学的 mini-react / xunbei-react 版本。它们通常把 Layout Effect 和 Passive Effect 都放在 Commit 阶段同步处理，并且只用一个 `finishedWork` 引用保存待执行的 Passive Effect。与 React 18.3.1 的差异如下：

[width(19,40,41)]

| 维度           | React 18.3.1                                                          | 简化实现                                |
| -------------- | --------------------------------------------------------------------- | --------------------------------------- |
| Effect 标记    | `HookHasEffect` + `HookPassive` / `HookLayout` / `HookInsertion` 组合 | 可能直接用 `HookPassive` / `HookLayout` |
| 依赖未变化     | 仍 push 一个不带 `HookHasEffect` 的新 Effect，保留 destroy            | 可能直接复用旧 Effect                   |
| Layout 清理    | Mutation 阶段统一执行 destroy                                         | 可能在同一个函数里先 destroy 再 create  |
| Passive 调度   | `rootWithPendingPassiveEffects` + `pendingPassiveEffectsLanes`        | 只保存一个 `finishedWork`，直接后序遍历 |
| 优先级         | 按 lanes 计算 Passive 回调优先级                                      | 没有优先级与批次概念                    |
| Insertion Hook | 有完整实现                                                            | 可能只定义了标记，没有执行逻辑          |

最关键的区别是 `HookHasEffect`：官方用它区分“本次真的要执行”和“只是保留清理函数”。没有这个位，就无法在不执行 create 的情况下安全地携带 destroy。

## 12. 总结

`useEffect` 自身的关注点：

[width(15,85)]

| 关注点      | `useEffect` 的行为                               |
| ----------- | ------------------------------------------------ |
| Effect 标记 | `HookPassive`，本次执行时额外带 `HookHasEffect`  |
| Fiber 标记  | `PassiveEffect \| PassiveStaticEffect`           |
| 执行时机    | Commit 完成后，浏览器绘制之后                    |
| 调度方式    | `scheduleCallback(NormalSchedulerPriority, ...)` |
| 刷新顺序    | 先 Passive unmount，再 Passive mount             |
| 遍历方向    | 挂载时子先父后，删除时父先子后                   |
| 依赖未变化  | 不设 `HookHasEffect`，不调度回调，保留 `destroy` |

三种 Effect 的横向对比：

[width(18,23,33,26)]

| 关注点       | `useEffect`        | `useLayoutEffect`      | `useInsertionEffect` |
| ------------ | ------------------ | ---------------------- | -------------------- |
| Fiber 标记   | `PassiveEffect`    | `UpdateEffect`         | `UpdateEffect`       |
| Effect 标记  | `HookPassive`      | `HookLayout`           | `HookInsertion`      |
| 执行时机     | 浏览器绘制后       | DOM 变更后、绘制前     | Mutation 阶段早期    |
| 执行方式     | Scheduler 异步回调 | Commit 阶段同步        | Commit 阶段同步      |
| 是否阻塞绘制 | 否                 | 是                     | 是                   |
| 典型场景     | 请求、订阅、日志   | 测量布局、同步修改 DOM | CSS-in-JS 注入样式   |

Effect 的核心是“循环链表 + 依赖比较 + 标记驱动执行”。理解它之后，Commit 阶段的 Mutation / Layout / Passive 流程就只剩下具体的遍历与 DOM 操作本身了。下一步可以结合 [Commit 阶段](/frameworks/react/advanced/source-code/commit/commitWork) 一起阅读；需要同步读取布局时使用 [useLayoutEffect](/frameworks/react/advanced/source-code/hooks/useLayoutEffect)，需要在 Mutation 早期注入样式时使用 [useInsertionEffect](/frameworks/react/advanced/source-code/hooks/useInsertionEffect)。
