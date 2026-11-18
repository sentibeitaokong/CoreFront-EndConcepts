---
outline: [2, 4]
---

# useRef

`useRef` 是缓存与引用类 Hook 中最简单的一个：挂载时创建一个 `{ current: initialValue }` 对象，之后每次渲染都返回同一个对象。它不参与依赖比较，修改 `ref.current` 也不会触发渲染。

实现位于 `packages/react-reconciler/src/ReactFiberHooks.old.js`，DOM ref 的赋值则发生在 Commit 阶段的 `ReactFiberCommitWork.old.js`。Hook 链表的基础见 [Hooks 链表](/frameworks/react/advanced/source-code/hooks/hooksInternals)。

## 1. `mountRef` 与 `updateRef`

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountRef<T>(initialValue: T): {|current: T|} {
  const hook = mountWorkInProgressHook();
  // 省略 enableUseRefAccessWarning 开启时的 DEV 警告对象
  // 默认构建创建普通对象并存入 Hook 节点。
  const ref = {current: initialValue};
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  const hook = updateWorkInProgressHook();
  // 直接返回同一个对象，忽略新的 initialValue。
  return hook.memoizedState;
}
```

`useRef` 的行为可以概括为：

- Mount 时创建一个 `{current: initialValue}` 对象，存进 `hook.memoizedState`。
- Update 时直接返回同一个对象，完全忽略新的 `initialValue`。
- 修改 `ref.current` 不会触发渲染，因为 React 不监听这个普通对象。

`enableUseRefAccessWarning` 是开发期的可选特性，开启后会返回一个带 `get current()` / `set current()` 的对象，用于警告“**在渲染期间读写 ref**”。默认构建返回的就是普通对象。

## 2. 为什么能跨渲染保持不变

`updateWorkInProgressHook` 会从 current 树克隆 Hook 节点，但 `memoizedState` 是直接复制引用。因此只要 Hook 的调用顺序不变，`useRef` 每次拿到的都是同一个 `{current}` 对象。它不参与依赖比较，也不会因为父组件重新渲染而重置。

这一点与 `useState` 不同：`useState` 的 `memoizedState` 会被 `updateReducer` 替换成新状态，而 `useRef` 的 `memoizedState` 始终是同一个对象的引用，状态由调用方直接修改。

## 3. DOM ref 的提交

`useRef` 只负责创建对象，真正的 DOM 赋值发生在 Commit 阶段：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref // 可能是回调函数或 { current } 对象
  if (ref !== null) {
    const instance = finishedWork.stateNode
    let instanceToUse
    // HostComponent 取公开实例，其他类型直接使用 stateNode。
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance)
        break
      default:
        instanceToUse = instance
    }

    // 回调 ref 以实例为参数调用。
    if (typeof ref === 'function') {
      // 省略 Profiler 计时
      ref(instanceToUse)
    } else {
      // 对象 ref 直接把实例写入 current。
      ref.current = instanceToUse
    }
    // 省略 DEV 下对回调返回值与 ref 对象的校验
  }
}

function commitDetachRef(current: Fiber) {
  const currentRef = current.ref
  if (currentRef !== null) {
    // 回调 ref 传 null 通知卸载，对象 ref 清空 current。
    if (typeof currentRef === 'function') {
      currentRef(null)
    } else {
      currentRef.current = null
    }
  }
}
```

- `commitAttachRef` 把 `fiber.stateNode` 写入 `ref.current`，或作为参数调用回调 ref。
- `commitDetachRef` 在卸载或 ref 变化时把 `ref.current` 置空。
- 对普通 DOM 元素，`stateNode` 是真实 DOM；对类组件，是组件实例。

## 4. 常见用途

```jsx
function Timer() {
  const timerRef = useRef(null)

  useEffect(() => {
    // 定时器 ID 存在 ref 中，修改它不会触发渲染。
    timerRef.current = window.setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => {
      // 清理函数在组件卸载时清除定时器。
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return null
}
```

- 定时器 ID：不需要触发渲染，放在 ref 里最合适。
- DOM 引用：`<div ref={divRef} />`，Commit 阶段由 `commitAttachRef` 赋值。
- 保存上一次的值：在 `useEffect` 中更新 `ref.current`。

## 5. 总结

[width(23,77)]

| 概念              | 作用                                              |
| ----------------- | ------------------------------------------------- |
| `mountRef`        | 创建 `{ current: initialValue }` 并存入 Hook 节点 |
| `updateRef`       | 直接返回同一个对象，忽略新的初始值                |
| 跨渲染保持稳定    | `memoizedState` 复制的是引用，不参与依赖比较      |
| `commitAttachRef` | Commit 阶段把 DOM / 组件实例写入 `ref.current`    |
| `commitDetachRef` | 卸载或 ref 变化时把 `ref.current` 置空            |
| 不触发渲染        | 修改 `ref.current` 不会通知 React                 |

`useRef` 适合保存“**可变但不需要参与渲染**”的数据。如果需要缓存计算结果或函数引用，分别见 [useMemo](/frameworks/react/advanced/source-code/hooks/useMemo) 与 [useCallback](/frameworks/react/advanced/source-code/hooks/useCallback)。
