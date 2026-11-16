---
outline: [2, 4]
---

# useLayoutEffect

`useLayoutEffect` 与 `useEffect` 共用 `mountEffectImpl` / `updateEffectImpl`，区别在标记与执行阶段：它用 `HookLayout` 标记 Effect，用 `UpdateEffect` 标记 Fiber，并在 Mutation 阶段执行 destroy、在 Layout 阶段同步执行 create。

由于执行发生在 DOM 变更之后、浏览器绘制之前，`useLayoutEffect` 可以安全地读取布局并同步修改 DOM，代价是阻塞绘制。实现位于 `packages/react-reconciler/src/ReactFiberHooks.old.js` 与 `ReactFiberCommitWork.old.js`。通用的 Effect 数据结构与执行顺序见 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect#_1-三种-effect-与执行时机)。

## 1. `mountLayoutEffect` 与 `updateLayoutEffect`

:::code-group

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  let fiberFlags: Flags = UpdateEffect
  if (enableSuspenseLayoutEffectSemantics) {
    fiberFlags |= LayoutStaticEffect
  }
  if (
    __DEV__ &&
    enableStrictEffects &&
    (currentlyRenderingFiber.mode & StrictEffectsMode) !== NoMode
  ) {
    fiberFlags |= MountLayoutDevEffect
  }
  return mountEffectImpl(fiberFlags, HookLayout, create, deps)
}

function updateLayoutEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps)
}
```

:::

标记说明：

- `UpdateEffect`：表示这棵子树含有需要执行的 Layout Effect。
- `LayoutStaticEffect`：开启 `enableSuspenseLayoutEffectSemantics` 时追加，用于 Suspense / Offscreen 场景下区分“静态”Layout Effect。
- `MountLayoutDevEffect`：开发构建的 Strict Effects 模式下追加，用于模拟卸载与重新挂载。

与 `useEffect` 不同，`useLayoutEffect` 没有 `PassiveStaticEffect`，因为它的执行由 Commit 阶段同步驱动，不需要额外的静态标记来决定是否调度。

## 2. Mutation 阶段：先执行 destroy

Layout Effect 的清理函数不在 Layout 阶段执行，而是在 Mutation 阶段统一执行。函数组件的 Mutation 分支见 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect#_5-3-mutation-阶段-insertion-与-layout-清理) 中的 `commitMutationEffectsOnFiber`：

```text
Mutation
  → useInsertionEffect destroy / create
  → useLayoutEffect destroy        ← 所有组件的 destroy 在这里完成
Layout
  → useLayoutEffect create         ← 所有组件的 create 在这里开始
```

把 destroy 提前到 Mutation 阶段，是为了保证“**所有** Layout Effect 的 destroy 都先于“**任何** Layout Effect 的 create”执行。如果某个组件的清理函数依赖另一个组件刚刚建立的状态（例如覆盖了同一个 ref），先 destroy 后 create 才能避免交叉污染。

## 3. Layout 阶段：执行 create

Layout 阶段由 `commitLayoutEffectOnFiber` 处理函数组件：

```ts [react-reconciler/src/ReactFiberCommitWork.old.js]
function commitLayoutEffectOnFiber(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  if ((finishedWork.flags & LayoutMask) !== NoFlags) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent: {
        if (
          !enableSuspenseLayoutEffectSemantics ||
          !offscreenSubtreeWasHidden
        ) {
          // At this point layout effects have already been destroyed (during mutation phase).
          commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork)
        }
        break
      }
      // ... 类组件的 componentDidMount / componentDidUpdate
    }
  }
}
```

Layout 阶段只执行带 `HookHasEffect` 的 Layout Effect，也就是本次依赖确实变化的那些。注释再次强调了执行顺序：执行到这里时，Layout Effect 已经在 Mutation 阶段被销毁。

## 4. 为什么必须同步执行

`useLayoutEffect` 的价值在于“绘制前拿到确定的结果”：

- **测量布局**：读取 `getBoundingClientRect()`、`offsetWidth` 等，再同步调整状态，避免用户看到中间态。
- **同步修改 DOM**：例如在绘制前滚动到指定位置、设置焦点、修正 tooltip 位置。
- **避免闪烁**：如果改用 `useEffect`，浏览器可能先绘制旧状态，再在下一次渲染中修正，出现可见的闪烁。

代价同样明显：create 在 Commit 阶段同步执行，会阻塞浏览器绘制。因此在里面做耗时计算或大量 DOM 操作，会直接拖慢首屏与交互响应。

## 5. 与 `useEffect` 的对比

[width(18,26,56)]

| 维度         | `useLayoutEffect`                | `useEffect`                            |
| ------------ | -------------------------------- | -------------------------------------- |
| Effect 标记  | `HookLayout`                     | `HookPassive`                          |
| Fiber 标记   | `UpdateEffect`                   | `PassiveEffect \| PassiveStaticEffect` |
| destroy 时机 | Mutation 阶段                    | Passive unmount，绘制之后              |
| create 时机  | Layout 阶段，绘制之前            | Scheduler 回调，绘制之后               |
| 是否阻塞绘制 | 是                               | 否                                     |
| 典型用途     | 测量布局、同步修正 DOM、避免闪烁 | 请求、订阅、日志等非阻塞副作用         |

**SSR 注意**：服务端渲染时没有真实的 DOM 布局，`useLayoutEffect` 在服务端会触发警告。依赖布局测量的逻辑应放到客户端组件中，或改用 `useEffect` 并在回调里做条件判断。

## 6. 总结

[width(43,57)]

| 概念                                  | 作用                                     |
| ------------------------------------- | ---------------------------------------- |
| `HookLayout`                          | 标记 Layout Effect 类型                  |
| `UpdateEffect` / `LayoutStaticEffect` | 让 Commit 阶段知道子树含有 Layout Effect |
| `commitMutationEffectsOnFiber`        | 在 Mutation 阶段统一执行 Layout destroy  |
| `commitLayoutEffectOnFiber`           | 在 Layout 阶段同步执行 Layout create     |
| `HookHasEffect`                       | 过滤出本次依赖变化的 Effect              |

`useLayoutEffect` 的“同步”来自 Commit 阶段的执行位置，而不是 Hook 本身做了什么特殊处理。需要更早注入样式时使用 [useInsertionEffect](/frameworks/react/advanced/source-code/hooks/useInsertionEffect)；不依赖布局的副作用应优先使用 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect)。
