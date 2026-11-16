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
  if (enableUseRefAccessWarning) {
    // ... DEV 下返回一个带 getter/setter 的对象，用于警告渲染期读写
  } else {
    const ref = {current: initialValue};
    hook.memoizedState = ref;
    return ref;
  }
}

function updateRef<T>(initialValue: T): {|current: T|} {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}
```

`useRef` 的行为可以概括为：

- Mount 时创建一个 `{current: initialValue}` 对象，存进 `hook.memoizedState`。
- Update 时直接返回同一个对象，完全忽略新的 `initialValue`。
- 修改 `ref.current` 不会触发渲染，因为 React 不监听这个普通对象。

`enableUseRefAccessWarning` 是开发期的可选特性，开启后会返回一个带 `get current()` / `set current()` 的对象，用于警告“在渲染期间读写 ref”。默认构建走 `else` 分支，就是普通对象。

## 2. 为什么能跨渲染保持不变

`updateWorkInProgressHook` 会从 current 树克隆 Hook 节点，但 `memoizedState` 是直接复制引用。因此只要 Hook 的调用顺序不变，`useRef` 每次拿到的都是同一个 `{current}` 对象。它不参与依赖比较，也不会因为父组件重新渲染而重置。

这一点与 `useState` 不同：`useState` 的 `memoizedState` 会被 `updateReducer` 替换成新状态，而 `useRef` 的 `memoizedState` 始终是同一个对象的引用，状态由调用方直接修改。

## 3. DOM ref 的提交

`useRef` 只负责创建对象，真正的 DOM 赋值发生在 Commit 阶段：

:::code-group

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref
  if (ref !== null) {
    const instance = finishedWork.stateNode
    let instanceToUse
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance)
        break
      default:
        instanceToUse = instance
    }

    if (typeof ref === 'function') {
      let retVal
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        try {
          startLayoutEffectTimer()
          retVal = ref(instanceToUse)
        } finally {
          recordLayoutEffectDuration(finishedWork)
        }
      } else {
        retVal = ref(instanceToUse)
      }
      // ... DEV 下会检查 retVal 是否为函数
    } else {
      // ... DEV 下会检查 ref 是否带有 current
      ref.current = instanceToUse
    }
  }
}
```

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitDetachRef(current: Fiber) {
  const currentRef = current.ref
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null)
    } else {
      currentRef.current = null
    }
  }
}
```

:::

- `commitAttachRef` 把 `fiber.stateNode` 写入 `ref.current`，或作为参数调用回调 ref。
- `commitDetachRef` 在卸载或 ref 变化时把 `ref.current` 置空。
- 对普通 DOM 元素，`stateNode` 是真实 DOM；对类组件，是组件实例。

## 4. 常见用途

```jsx
function Timer() {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => {
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

## 5. 与简化实现的差异

这里的“简化实现”指仓库中用于教学的 mini-react / xunbei-react 版本。它们通常只创建普通对象，也不会在 Commit 阶段完整处理 ref 的挂载与卸载。与 React 18.3.1 的差异如下：

[width(18,62,20)]

| 维度         | React 18.3.1                                             | 简化实现                    |
| ------------ | -------------------------------------------------------- | --------------------------- |
| ref 对象     | 默认创建普通 `{current}`，可选 DEV 警告                  | 只创建普通对象              |
| DOM ref 提交 | `commitAttachRef` / `commitDetachRef` 在 Commit 阶段处理 | 可能没有实现 ref 的提交逻辑 |

## 6. 总结

[width(23,77)]

| 概念              | 作用                                              |
| ----------------- | ------------------------------------------------- |
| `mountRef`        | 创建 `{ current: initialValue }` 并存入 Hook 节点 |
| `updateRef`       | 直接返回同一个对象，忽略新的初始值                |
| 跨渲染保持稳定    | `memoizedState` 复制的是引用，不参与依赖比较      |
| `commitAttachRef` | Commit 阶段把 DOM / 组件实例写入 `ref.current`    |
| `commitDetachRef` | 卸载或 ref 变化时把 `ref.current` 置空            |
| 不触发渲染        | 修改 `ref.current` 不会通知 React                 |

`useRef` 适合保存“可变但不需要参与渲染”的数据。如果需要缓存计算结果或函数引用，分别见 [useMemo](/frameworks/react/advanced/source-code/hooks/useMemo) 与 [useCallback](/frameworks/react/advanced/source-code/hooks/useCallback)。
