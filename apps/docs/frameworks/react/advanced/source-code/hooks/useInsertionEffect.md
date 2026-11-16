---
outline: [2, 4]
---

# useInsertionEffect

`useInsertionEffect` 是 React 18 新增的 Effect Hook，定位非常明确：**只供 CSS-in-JS 库在布局读取之前注入样式**。它比 `useLayoutEffect` 更早执行，在 Mutation 阶段就完成 destroy 与 create。

实现上与另外两种 Effect 共用 `mountEffectImpl` / `updateEffectImpl`，区别只在标记：Fiber 打 `UpdateEffect`，Effect 打 `HookInsertion`。通用的 Effect 数据结构与执行顺序见 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect#_1-三种-effect-与执行时机)。

## 1. `mountInsertionEffect` 与 `updateInsertionEffect`

```ts [react-reconciler/src/ReactFiberHooks.old.js]
function mountInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return mountEffectImpl(UpdateEffect, HookInsertion, create, deps)
}

function updateInsertionEffect(
  create: () => (() => void) | void,
  deps: Array<mixed> | void | null,
): void {
  return updateEffectImpl(UpdateEffect, HookInsertion, create, deps)
}
```

两个函数都只传 `UpdateEffect` 与 `HookInsertion`，没有额外的静态标记或开发期标记。执行与否完全由 `HookHasEffect` 控制：依赖变化时才带上的位。

## 2. Mutation 阶段早期执行

Insertion Effect 的 destroy 和 create 都在 `commitMutationEffectsOnFiber` 里完成，且排在 Layout destroy 之前。完整代码见 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect#_5-3-mutation-阶段-insertion-与-layout-清理)：

```text
Mutation
  → useInsertionEffect destroy
  → useInsertionEffect create     ← 样式在这里注入
  → useLayoutEffect destroy       ← 此时布局读取已经能看到新样式
```

这个位置解决了 CSS-in-JS 的一个核心问题：如果样式在 `useLayoutEffect` 里注入，组件在同一个 Layout 阶段读取布局时可能还拿不到最新样式，导致测量结果错误；放到 `useInsertionEffect` 就能保证样式先落地。

## 3. 使用边界

`useInsertionEffect` 不是给普通业务代码用的，官方对它的限制很明确：

- **只做样式注入**：典型场景是动态生成 `<style>` 标签或调用 CSS-in-JS 运行时的插入方法。
- **不要读取布局**：此时 DOM 的 ref 还没有挂载，`ref.current` 仍然是 `null`，`getBoundingClientRect()` 之类的读取没有意义。
- **不要调度更新**：在 Insertion Effect 中调用 `setState` 不会得到预期结果，React 会给出警告。
- **不要依赖执行顺序处理业务逻辑**：它的执行时机属于渲染管线内部，普通副作用应使用 `useLayoutEffect` 或 `useEffect`。

## 4. 与另外两个 Effect 的对比

[width(16,26,35,23)]

| 维度         | `useInsertionEffect` | `useLayoutEffect`               | `useEffect`           |
| ------------ | -------------------- | ------------------------------- | --------------------- |
| Effect 标记  | `HookInsertion`      | `HookLayout`                    | `HookPassive`         |
| 执行阶段     | Mutation 早期        | Mutation destroy、Layout create | 绘制后 Scheduler 回调 |
| 是否同步     | 是                   | 是                              | 否                    |
| ref 是否可用 | 否                   | 是                              | 是                    |
| 典型用途     | CSS-in-JS 注入样式   | 测量布局、同步修改 DOM          | 请求、订阅、日志      |

## 5. 总结

[width(37,63)]

| 概念                           | 作用                                       |
| ------------------------------ | ------------------------------------------ |
| `HookInsertion`                | 标记 Insertion Effect 类型                 |
| `UpdateEffect`                 | 让 Commit 阶段处理该子树的副作用           |
| `commitMutationEffectsOnFiber` | 在 Mutation 阶段早期执行 destroy 与 create |
| `HookHasEffect`                | 过滤出本次依赖变化的 Effect                |

`useInsertionEffect` 的“早”是为了让样式在布局读取前生效；它不参与普通业务副作用的执行。需要读取布局时使用 [useLayoutEffect](/frameworks/react/advanced/source-code/hooks/useLayoutEffect)，不阻塞绘制时使用 [useEffect](/frameworks/react/advanced/source-code/hooks/useEffect)。
