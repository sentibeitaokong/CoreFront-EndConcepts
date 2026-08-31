# React Compiler 与 Vue 3 编译器：记忆化与靶向优化的分野

编译优化正在把「性能优化」这件曾经只能靠开发者手工完成的事，下沉到构建阶段。React Compiler 与 Vue 3 编译器由此走向两条相反的路：React Compiler 在**图灵完备的 JavaScript** 上做数据流分析、自动注入记忆化缓存，让运行时「**少算、少更新**」；Vue 3 编译器在**结构化模板**上做静态分析、标记动态提升静态，让运行时「**精准、跳过**」。前者更难但更通用，后者更简单但受限于模板 DSL。

## 1. React Compiler

React Compiler 面向 JavaScript 和 JSX 进行数据流与依赖分析，自动插入记忆化缓存：

:::code-group

```jsx [编译前]
// 开发者手写组件的常见非优化模式：每次渲染都重算 + 重建引用
function ProductList({ products, category }) {
  const filtered = products.filter(p => p.category === category)
  const sorted = [...filtered].sort((a, b) => b.price - a.price)
  const handleAdd = id => addToCart(id)

  return (
    <ul>
      {sorted.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={handleAdd}
          style={{ border: '1px solid #eee' }}
        />
      ))}
    </ul>
  )
}
```

```jsx [编译后]
// React Compiler 自动注入缓存槽与稳定引用
function ProductList(t0) {
  const { products, category } = t0
  const $ = _c(5) // 分配 5 个缓存槽

  // 自动 useMemo：filtered 仅在 products/category 变化时重算
  let filtered
  if ($[0] !== products || $[1] !== category) {
    filtered = products.filter(p => p.category === category)
    $[0] = products
    $[1] = category
    $[2] = filtered
  } else {
    filtered = $[2]
  }

  // 自动 useMemo：sorted 仅在 filtered 变化时重算
  let sorted
  if ($[3] !== filtered) {
    sorted = [...filtered].sort((a, b) => b.price - a.price)
    $[3] = filtered
    $[4] = sorted
  } else {
    sorted = $[4]
  }

  const handleAdd = _cached(0, () => id => addToCart(id)) // 稳定回调引用
  const style = _cached(1, () => ({ border: '1px solid #eee' })) // 提取不变对象

  return (
    <ul>
      {sorted.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onAdd={handleAdd}
          style={style}
        />
      ))}
    </ul>
  )
}
```

:::

React Compiler 的核心思路是：在编译时分析 JavaScript 的 SSA（Static Single Assignment）和控制流，找出哪些表达式在哪些条件下会重新计算，然后插入记忆化逻辑。它不改变 React 的运行时模型，只帮助运行时更早地 bailout。

编译产物的三个关键形态：

- **缓存槽 `_c(n)`**：为组件分配固定数量的缓存槽，按「依赖是否变化」决定重算还是复用——等价于自动 `useMemo`。
- **稳定引用 `_cached`**：把内联函数/对象提取为跨渲染稳定的引用——等价于自动 `useCallback` 与引用稳定化。
- **不改变组件模型**：组件仍是「渲染函数」，只是被编译器改写；运行时仍靠 Fiber 协调与 bailout，编译器只是让 bailout 更容易命中。

> [!NOTE]
> React Compiler 面向任意 JavaScript，因此只能做**保守**的优化：一旦遇到难以静态证明的依赖或副作用（如 `eval`、`delete`、对共享可变状态的读写），它会跳过该处的记忆化，优先保证正确性。

## 2. Vue 3 Compiler

Vue 编译器利用模板语法的结构化约束生成带优化提示的渲染函数：

:::code-group

```vue [编译前模板]
<template>
  <div class="container">
    <h1 class="title">商品列表</h1>
    <p class="hint-static">共 100 件商品</p>

    <ul>
      <li
        v-for="item in list"
        :key="item.id"
        :class="{ active: item.isActive }"
      >
        <span>{{ item.name }}</span>
        <span class="price">¥{{ item.price }}</span>
      </li>
    </ul>

    <footer class="static-footer"><p>底部信息</p></footer>
  </div>
</template>
```

```javascript [编译后渲染函数]
import {
  createVNode as _createVNode,
  createBlock as _createBlock,
  openBlock as _openBlock,
  Fragment as _Fragment,
  toDisplayString as _toDisplayString,
  normalizeClass as _normalizeClass,
  renderList as _renderList,
} from 'vue'

// 静态提升：不变节点只创建一次，跨渲染复用
const _hoisted_1 = _createVNode(
  'h1',
  { class: 'title' },
  '商品列表',
  -1 /* HOISTED */,
)
const _hoisted_2 = _createVNode(
  'footer',
  { class: 'static-footer' },
  [_createVNode('p', null, '底部信息', -1)],
  -1,
)

export function render(_ctx) {
  return (
    _openBlock(),
    _createBlock('div', { class: 'container' }, [
      _hoisted_1, // 静态节点：永远不参与 diff
      // 动态列表：renderList 生成，每个 li 带 patchFlag
      (_openBlock(true),
      _createBlock(
        _Fragment,
        null,
        _renderList(
          _ctx.list,
          item => (
            _openBlock(),
            _createBlock(
              'li',
              {
                key: item.id, // 列表 diff 依据
                class: _normalizeClass({ active: item.isActive }), // 2 /* CLASS */
              },
              [
                _createVNode(
                  'span',
                  null,
                  _toDisplayString(item.name),
                  1 /* TEXT */,
                ),
                _createVNode(
                  'span',
                  { class: 'price' },
                  '¥' + _toDisplayString(item.price),
                  1 /* TEXT */,
                ),
              ],
            )
          ),
        ),
        256 /* UNKEYED_FRAGMENT */,
      )),
      _hoisted_2, // 静态节点
    ])
  )
}
```

```markdown [编译优化项]
-1 /_ HOISTED _/ → 静态提升：VNode 只创建 1 次，永远复用
1 /_ TEXT _/ → PatchFlags.TEXT：只比较文本内容
2 /_ CLASS _/ → PatchFlags.CLASS：只比较 class
patch 时只检查标志位，跳过其它属性的比较

\_openBlock / \_createBlock → Block 树：
动态子节点收集进 dynamicChildren，更新时只遍历该数组做靶向 diff，跳过静态节点
```

:::

除静态提升、PatchFlags、Block Tree 外，Vue 编译器还利用模板的结构化信息做进一步优化：

- **v-once**：标记只渲染一次的子树，后续更新直接复用缓存的 VNode 与 DOM，跳过整个 diff。
- **v-memo**：给定依赖数组，只有依赖变化才更新该元素及其子树（模板级的 `memo`）。
- **缓存事件处理函数（cacheHandlers）**：内联 `@click="..."` 会被缓存，避免每次渲染生成新函数引发子组件多余更新。
- **静态 props 提升**：完全静态的 props 对象被提升复用，避免重复创建。
- **class/style 静态前缀拆分**：把静态前缀与动态后缀拆开，运行时只处理动态部分。

## 3. 对比总结

| 优化技术       | React Compiler                | Vue 3 Compiler                   |
| -------------- | ----------------------------- | -------------------------------- |
| **核心思想**   | 自动注入记忆化缓存            | 标记动态、提升静态               |
| **主要手段**   | 缓存槽、稳定引用              | 静态提升、PatchFlags、Block Tree |
| **依赖分析**   | 基于 SSA 控制流               | 基于模板 AST                     |
| **运行时效果** | 减少组件执行次数              | 减少 DOM diff 范围               |
| **开发者体验** | 减少 useMemo/useCallback 编写 | 完全透明，无需优化               |
