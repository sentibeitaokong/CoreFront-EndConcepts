# 编译器优化

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

```markdown
React Compiler（通用 JavaScript 上的记忆化）：
输入是任意 JS/JSX，靠 SSA 与控制流分析推断"何时需要重算"
产物是插入 \_c 缓存槽的组件函数，不改变 React 运行时模型
收益是自动 useMemo/useCallback/稳定引用 → 更早 bailout，减少不必要更新

Vue 3 Compiler（结构化模板上的静态分析）：
输入是约束严格的 Template，靠 AST 转换判断"何处动态"
产物是携带 PatchFlags/Block Tree/静态提升的渲染函数
收益是运行时靶向 diff → 跳过静态节点，DOM 操作最小化
```

| 优化技术       | React Compiler                | Vue 3 Compiler                   |
| -------------- | ----------------------------- | -------------------------------- |
| **核心思想**   | 自动注入记忆化缓存            | 标记动态、提升静态               |
| **主要手段**   | 缓存槽、稳定引用              | 静态提升、PatchFlags、Block Tree |
| **依赖分析**   | 基于 SSA 控制流               | 基于模板 AST                     |
| **运行时效果** | 减少组件执行次数              | 减少 DOM diff 范围               |
| **开发者体验** | 减少 useMemo/useCallback 编写 | 完全透明，无需优化               |

**对比总结**：两者都把「本由开发者手动完成的事」下沉到编译器，但方向相反——React Compiler 在**图灵完备的 JavaScript** 上做数据流分析，目标是让运行时“**少算、少更新**”；Vue Compiler 在**结构化模板**上做静态分析，目标是让运行时“**精准、跳过**”。因此 React Compiler 更难但更通用，Vue Compiler 更简单但受限于模板 DSL 的表达能力。二者最终都服务于同一个目标：让运行时用更少的判断到达「必须变化」的最小 DOM 操作集合。
