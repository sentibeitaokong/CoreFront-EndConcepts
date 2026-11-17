---
outline: [2, 4]
---

# useCallback

`useCallback` 缓存的是函数引用本身，而不是函数的执行结果。它的实现与 `useMemo` 几乎同构：挂载时把 `[callback, deps]` 存进 Hook 节点，更新时依赖相等就返回旧函数。

实现位于 `packages/react-reconciler/src/ReactFiberHooks.old.js`，入口是 `mountCallback` 与 `updateCallback`。依赖比较规则见 [Hooks 链表](/frameworks/react/advanced/source-code/hooks/hooksInternals#_4-依赖数组的比较规则)，三者的整体定位见 [useMemo](/frameworks/react/advanced/source-code/hooks/useMemo#_1-缓存与引用-hook-的定位)。

## 1. `mountCallback` 与 `updateCallback`

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = mountWorkInProgressHook()
  // 未传 deps 时记为 null，更新阶段不会命中复用。
  const nextDeps = deps === undefined ? null : deps
  // 缓存函数引用与依赖，供下一次渲染比较。
  hook.memoizedState = [callback, nextDeps]
  return callback
}

function updateCallback<T>(callback: T, deps: Array<mixed> | void | null): T {
  const hook = updateWorkInProgressHook()
  const nextDeps = deps === undefined ? null : deps
  const prevState = hook.memoizedState
  if (prevState !== null) {
    if (nextDeps !== null) {
      const prevDeps: Array<mixed> | null = prevState[1] // 上次缓存的依赖数组
      // 依赖逐项相等时复用旧函数引用。
      if (areHookInputsEqual(nextDeps, prevDeps)) {
        return prevState[0] // 上次缓存的函数
      }
    }
  }
  // 依赖变化或没有 deps 时，换成本次的函数并更新缓存。
  hook.memoizedState = [callback, nextDeps]
  return callback
}
```

`useCallback` 的实现与 `useMemo` 几乎同构，区别只在缓存的内容：`useMemo` 缓存工厂函数的返回值，`useCallback` 直接缓存传入的函数。

## 2. 与 `useMemo` 的等价关系

`useCallback(fn, deps)` 与 `useMemo(() => fn, deps)` 在语义上等价：

```js
// 下面两种写法返回同一个函数引用
const handleClick = useCallback(() => {
  console.log(count)
}, [count])

const handleClickViaMemo = useMemo(() => {
  return () => {
    console.log(count)
  }
}, [count])
```

React 没有让 `useCallback` 内部调用 `useMemo`，而是提供了独立的 `mountCallback` / `updateCallback`。这样 Dispatcher 可以直接指向对应函数，减少一次运行时分发。

## 3. 闭包陷阱

`useCallback` 缓存的是“**某次渲染中的函数**”，函数内部捕获的是那次渲染的变量：

```jsx
function Counter() {
  const [count, setCount] = useState(0)

  const log = useCallback(() => {
    console.log(count)
  }, []) // 依赖为空 → 永远捕获第一次渲染的 count

  return <button onClick={log}>log</button>
}
```

如果依赖写错，缓存函数会读到旧闭包。解决方式：

- 把 `count` 放进依赖数组。
- 或用 `useRef` 保存最新值，让回调读取 `ref.current`。

## 4. 不能替代 `useMemo` 做昂贵计算

`useCallback` 只缓存函数本身，不执行计算。如果昂贵计算发生在函数调用时，缓存引用并不能避免计算：

```jsx
// 缓存了函数引用，但每次点击仍会重新计算
const handleClick = useCallback(() => {
  return expensiveCompute(list)
}, [list])

// 如果想缓存计算结果，应使用 useMemo
const result = useMemo(() => expensiveCompute(list), [list])
```

选择标准很简单：

- 需要稳定**函数引用**（例如传给 `memo` 子组件、作为 `useEffect` 依赖）→ `useCallback`。
- 需要稳定**计算结果**（避免重复执行昂贵计算）→ `useMemo`。

## 5. 总结

[width(24,76)]

| 概念                | 作用                                                     |
| ------------------- | -------------------------------------------------------- |
| `mountCallback`     | 存 `[callback, deps]` 并返回原函数                       |
| `updateCallback`    | 依赖相等返回旧函数，否则存新函数                         |
| 与 `useMemo` 的关系 | `useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)` |
| 闭包风险            | 缓存函数捕获的是创建它那次渲染的变量                     |
| 适用场景            | 稳定回调引用，而非缓存计算结果                           |

`useCallback` 与 `useMemo` 共享同一套依赖比较规则；如果缓存的是可变容器而不是函数，见 [useRef](/frameworks/react/advanced/source-code/hooks/useRef)。
