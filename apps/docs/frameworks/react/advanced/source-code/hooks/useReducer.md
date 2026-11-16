---
outline: [2, 4]
---

# useReducer

`useReducer` 是状态 Hook 的通用形式：它把“如何根据 action 计算新状态”交给调用方传入的 reducer，自己只负责维护状态、收集更新并触发调度。`useState` 只是把 reducer 固定成 `basicStateReducer` 的特例，两者的底层实现高度重合。

`useReducer` 的实现位于 `packages/react-reconciler/src/ReactFiberHooks.old.js`，主要入口是 `mountReducer`、`updateReducer` 与 `dispatchReducerAction`。阅读前建议先了解 [Hooks 链表](/frameworks/react/advanced/source-code/hooks/hooksInternals) 中的 Dispatcher、Hook 节点和环形队列。

## 1. 三个入口

[width(30,9,61)]

| 函数                    | 阶段 | 职责                                     |
| ----------------------- | ---- | ---------------------------------------- |
| `mountReducer`          | 挂载 | 初始化状态与队列，绑定 `dispatch`        |
| `updateReducer`         | 更新 | 合并队列、按 lane 应用更新、返回最新状态 |
| `dispatchReducerAction` | 任意 | 创建 `Update`、入队并调度根节点          |

`HooksDispatcherOnMount.useReducer` 指向 `mountReducer`，`HooksDispatcherOnUpdate.useReducer` 指向 `updateReducer`，组件里的 `useReducer` 调用最终落到这两个函数之一。

## 2. `mountReducer`

挂载时创建状态、更新队列，并把 `dispatch` 预绑定到当前 Fiber 和队列：

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = mountWorkInProgressHook();
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue: UpdateQueue<S, A> = {
    pending: null,
    interleaved: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```

几个细节：

- `init` 存在时，初始状态是 `init(initialArg)`；否则直接使用 `initialArg`。
- `memoizedState` 与 `baseState` 同时写入初始状态，后者用于记录“尚未被低优先级跳过影响的状态基线”。
- `queue.lastRenderedReducer` 保存 reducer，供后续渲染和 eager 计算使用。
- `dispatch` 通过 `bind` 预先绑定 `currentlyRenderingFiber` 与 `queue`，所以组件里拿到的 `dispatch` 身份稳定，不需要额外依赖。

## 3. `updateReducer`：合并队列与按 lane 处理

更新阶段先把 `pending` 队列合并进 `baseQueue`，再按 `renderLanes` 逐个处理：

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;

  queue.lastRenderedReducer = reducer;

  const current: Hook = (currentHook: any);

  // The last rebase update that is NOT part of the base state.
  let baseQueue = current.baseQueue;

  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        // ...
      } else {
        // This update does have sufficient priority.
        // ...
        if (update.hasEagerState) {
          newState = ((update.eagerState: any): S);
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  // ... interleaved 更新的处理

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```

这段代码解决四件事：

1. **合并队列**：新调度的 `pending` 与上次没处理完的 `baseQueue` 拼成一个环。
2. **按 lane 过滤**：优先级不足的 Update 不丢弃，而是克隆到 `newBaseQueue`，留到下一次渲染。
3. **复用 eagerState**：如果 dispatch 时已经算过新状态，渲染阶段不再调用 reducer。
4. **标记更新**：只有 `newState` 与旧状态不同（`Object.is` 比较）时，才通知 `beginWork` 本轮确实有更新。

### 3.1 优先级不足时会发生什么

`updateReducer` 遍历环形队列时，并不是“全部应用”或“全部丢弃”，而是逐条判断：

```text
update1 (高优先级) → update2 (低优先级) → update3 (高优先级)
                     ↑ 跳过，复制进 newBaseQueue
```

- 高优先级的 `update1`、`update3` 依次作用于 `newState`。
- `update2` 的 lane 不在本次 `renderLanes` 中，被复制到新的 `baseQueue`。
- 第一个被跳过更新之前的状态成为新的 `baseState`，下次渲染以它为起点继续处理 `update2`。
- 跳过点之后的高优先级更新也会复制进 `baseQueue`，以保持“低优先级更新在前、高优先级更新在后”的原始顺序。

这样既保证本次渲染只呈现高优先级结果，又不会丢失低优先级更新。队列因此需要同时维护 `baseState` / `baseQueue`（尚未应用的部分）和 `memoizedState`（已经呈现给用户的状态）。

## 4. `dispatchReducerAction`

`useReducer` 的 dispatch 只负责“入队 + 调度”，不负责计算状态：

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function dispatchReducerAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  const lane = requestUpdateLane(fiber);

  const update: Update<S, A> = {
    lane,
    action,
    hasEagerState: false,
    eagerState: null,
    next: (null: any),
  };

  if (isRenderPhaseUpdate(fiber)) {
    enqueueRenderPhaseUpdate(queue, update);
  } else {
    const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
    if (root !== null) {
      const eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
      entangleTransitionUpdate(root, queue, lane);
    }
  }

  markUpdateInDevTools(fiber, lane, action);
}
```

执行顺序：

1. `requestUpdateLane` 根据当前事件优先级分配 lane。
2. 渲染期间产生的更新走 `enqueueRenderPhaseUpdate`，在本次渲染内重试。
3. 普通更新交给 `enqueueConcurrentHookUpdate` 入队，返回需要调度的根节点。
4. `scheduleUpdateOnFiber` 标记根节点并安排调度；`entangleTransitionUpdate` 处理 Transition 的 lane 纠缠。
5. `markUpdateInDevTools` 在开发构建中把 action 记录到 DevTools。

真正把 Update 挂进环形队列的是 `enqueueConcurrentHookUpdate`。它和 `scheduleUpdateOnFiber` 一起，把“状态变化”转成“根节点上有一条指定 lane 的待处理工作”。

## 5. `useReducer` 与 `useState` 的关系

`useState` 可以看作 `useReducer` 的一个特化版本：

[width(12,47,41)]

| 维度     | `useReducer`                                  | `useState`                                    |
| -------- | --------------------------------------------- | --------------------------------------------- |
| reducer  | 调用方传入                                    | 固定为 `basicStateReducer`                    |
| 初始化   | `initialArg` + 可选 `init`                    | 直接传值，函数参数视为惰性初始化              |
| dispatch | `dispatchReducerAction`，总是入队并调度       | `dispatchSetState`，队列为空时先做 eager 比较 |
| 更新语义 | `dispatch(action)`，由 reducer 决定新状态     | `setState(value)` 或 `setState(fn)`           |
| 适用场景 | 状态转换逻辑复杂、action 种类多、需要集中管理 | 简单独立的状态字段                            |

两者共享同一条 Hook 链表、同一套 `UpdateQueue` 与 `updateReducer` 处理逻辑。`useState` 的实现细节见 [useState](/frameworks/react/advanced/source-code/hooks/useState)。

## 6. 总结

[width(36,64)]

| 概念                          | 作用                                           |
| ----------------------------- | ---------------------------------------------- |
| `mountReducer`                | 初始化状态、队列并绑定 dispatch                |
| `updateReducer`               | 合并 `pending` / `baseQueue`，按 lane 应用更新 |
| `dispatchReducerAction`       | 创建 Update、入队并触发调度                    |
| `baseState` / `baseQueue`     | 保存被低优先级跳过的更新，留到后续渲染         |
| `lastRenderedReducer`         | 缓存 reducer，供渲染和 eager 计算复用          |
| `enqueueConcurrentHookUpdate` | 把 Update 挂进环形队列                         |

理解 `useReducer` 之后，`useState` 只剩下初始化特例与 eager bailout 两处差异；Effect 类 Hook 的执行机制则见 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect)。
