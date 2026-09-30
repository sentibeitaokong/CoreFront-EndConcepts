---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# **性能优化(`memo`, `useMemo`, `useCallback`)**

## 1. 核心概念与性能陷阱

在现代 React 开发中（函数组件时代），有一个最为核心但也最容易导致性能灾难的设定：**“父组件的任何一次重新渲染（`Re-render`），都会无条件地导致其内部所有子孙组件连带重新渲染！”**

为了打破这个“连坐”机制，React 提供了三大性能优化神器。它们的核心思想只有一个：**缓存 (`Cache/Memoization`)**。

[width(19,23,58)]

| API 名称          | 拦截对象                        | 核心作用与使用场景                                                                              |
| :---------------- | :------------------------------ | :---------------------------------------------------------------------------------------------- |
| **`React.memo`**  | **组件 (Component)**            | 阻断没必要的组件渲染。只有当传给子组件的 `props` 发生物理改变时，子组件才会重新渲染。           |
| **`useMemo`**     | **值 (Value / Object / Array)** | 缓存一个极其耗时的计算结果，或者缓存一个对象/数组的**内存地址**，防止它在每次渲染时被重新创建。 |
| **`useCallback`** | **函数 (Function)**             | 缓存一个函数的**内存地址**。本质上是 `useMemo` 专门用来缓存函数的语法糖。                       |

**三大 API 的高频参数与配套方案：**

[width(24,18,58)]

| API / 参数                           | 写法                         | 高频要点                                                                                                               |
| ------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `React.memo` 第二参数                | `memo(Component, areEqual?)` | 自定义比较函数：返回 `true` 表示“props 相等，跳过渲染”——**和 `shouldComponentUpdate` 的语义相反**，极易写错            |
| `useMemo` 的 `deps`                  | `useMemo(factory, deps)`     | `[]` → 只算一次；**省略 `deps` → 每次渲染都重算（等于没优化）**；`deps` 里放对象/数组 → 每次都是新地址，同样等于没优化 |
| `useCallback` 的 `deps`              | `useCallback(fn, deps)`      | 等价于 `useMemo(() => fn, deps)`；依赖没变就一直复用同一个函数地址                                                     |
| `useRef`                             | `useRef(init)`               | 需要“跨渲染稳定、又不想参与依赖比较”的值（定时器 id、上一次的值、最新 props）时，比 `useCallback` 更轻                 |
| `useTransition` / `useDeferredValue` | React 18 并发特性            | 把“不急的重渲染”标记为**可打断的低优先级更新**，比硬缓存更治本                                                         |

**依赖数组对照表（最容易写错的一处）：**

[width(27,25,48)]

| 写法                  | 含义                  | 常见误用                                                    |
| --------------------- | --------------------- | ----------------------------------------------------------- |
| `useMemo(fn, [])`     | 只在挂载时算一次      | 内部用到了 props / state → **永远拿到首次的值**（陈旧闭包） |
| `useMemo(fn, [a, b])` | `a` 或 `b` 变了才重算 | 漏写依赖 → 算出过期结果                                     |
| `useMemo(fn)`         | 每次渲染都重算        | 以为“不写就是只算一次”，实际等于白写                        |
| `useMemo(fn, [obj])`  | `obj` 地址变了就重算  | `obj` 是渲染时新建的字面量 → 每次都重算，缓存形同虚设       |

## 2. 核心 API 实战解析

### 2.1 阻断渲染：`React.memo`

如果一个组件的渲染成本极高，你可以用 `React.memo` 把这个组件包裹起来。它会在底层为你做一层关于 `props` 的**浅比较 (`Shallow Compare`)**。

```jsx
import { useState, memo } from 'react'

// 1. 使用 memo 包裹子组件
const ExpensiveChild = memo(function ExpensiveChild({ title }) {
  console.log('--- 极其昂贵的子组件渲染了 ---')
  return <div>{title}</div>
})

export default function Parent() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        父组件打字/计数: {count}
      </button>

      {/* 2. 父组件重新渲染时，因为 title 是个死字符串没变，
          memo 发现 props 没变，直接拦截了这次渲染，子组件不会打印 log！*/}
      <ExpensiveChild title="我是不会变的标题" />
    </div>
  )
}

// 默认情况下其只会对复杂对象做浅层对比，如果你想要控制对比过程，那么请将自定义的比较函数通过第二个参数传入来实现。
/*function MyComponent(props) {
    /!* 使用 props 渲染 *!/
}
function areEqual(prevProps, nextProps) {
    /!*
    如果把 nextProps 传入 render 方法的返回结果与
    将 prevProps 传入 render 方法的返回结果一致则返回 true，
    否则返回 false
    true就缓存，false则不缓存
    *!/
}
export default React.memo(MyComponent, areEqual);*/
```

**高频场景：**

[width(36,64)]

| 场景                           | 为什么值得加 `memo`                                    |
| ------------------------------ | ------------------------------------------------------ |
| 长列表 / 虚拟列表的每一行      | 一次渲染几百行，父组件任何 state 变化都会“连坐”全部行  |
| 图表、地图、富文本编辑器       | 单次渲染开销本来就大（百毫秒级），省一次就很明显       |
| 纯展示型叶子组件 + props 稳定  | 单个很便宜，但**数量多**，省下的是总时间               |
| 内部有输入框的父组件里的子组件 | 打字时父组件每敲一个字就重渲染，子组件其实可以完全不动 |

**高频坑：**

- **props 里有对象 / 数组 / 函数时 `memo` 直接失效**：每次渲染都是新地址，浅比较必然不等（解法见 2.2、2.3）。
- **`children` 也参与比较**：`<Memo>{<span />}</Memo>` 里的 JSX 每次渲染都是新元素，一样拦不住。
- **Context 变化绕不开 `memo`**：组件订阅的 Context 值变了，`memo` 拦不住它。
- **`areEqual` 的返回值是“反”的**：返回 `true` 表示“认为没变，**跳过渲染**”，很多人按 `shouldComponentUpdate` 的直觉写反而写反。
- **`memo` 只比较 props**：组件自己的 state 变了当然要渲染，这是它的职责范围之外。

### 2.2 拯救引用陷阱：`useCallback`

**痛点**：在上面的例子中，如果你传给 `ExpensiveChild` 的不是一个死字符串，而是一个**函数**（比如 `onClick` 回调），`React.memo` 就会**瞬间失效**！

因为父组件每次重新执行时，内部声明的普通函数 `const handleClick = () => {}` 都会在内存中**分配一个全新的地址**。`memo` 一对比发现内存地址变了，以为是新函数，于是乖乖去渲染了子组件。

**解法**：使用 `useCallback` 锁死函数的内存地址！

```jsx
import { useState, useCallback, memo } from 'react'

const ExpensiveChild = memo(({ onAction }) => {
  console.log('--- 子组件渲染了 ---')
  return <button onClick={onAction}>执行动作</button>
})

export default function Parent() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')

  // 🚨 极其关键：用 useCallback 包裹这个函数！
  // 第二个参数是依赖数组。只有当 text 发生改变时，这个函数才会换一个新的内存地址。
  // 如果只是 count 变了，handleClick 永远返回第一次创建的那个老地址。
  const handleClick = useCallback(() => {
    console.log('携带的文字是:', text)
  }, [text])

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>加数 (不会触发子组件)</button>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="打字 (会触发子组件)"
      />

      {/* 此时传进去的 handleClick 地址被死死锁住了，memo 完美生效！ */}
      <ExpensiveChild onAction={handleClick} />
    </div>
  )
}
```

**高频场景：**

[width(29,71)]

| 场景                     | 说明                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| 传给 `memo` 子组件的回调 | 这是 `useCallback` 存在的**唯一理由**——子组件没包 `memo`，父组件写再多也白搭 |
| 作为 `useEffect` 的依赖  | 回调不稳定会让 effect 每轮渲染都重跑（订阅、轮询、事件绑定被反复重建）       |
| 自定义 Hook 的返回值     | Hook 返回的函数不缓存，所有调用方都会跟着重渲染                              |
| 作为其他 Hook 的依赖项   | 如 `useMemo(() => f(x), [f, x])`，`f` 不稳定会连带把 `useMemo` 拖失效        |

**高频坑：**

- **闭包陷阱**：依赖写 `[]` 却读了 `text`，就永远拿到初始值。要么把依赖写全，要么用 `setCount(prev => prev + 1)` 这类**函数式更新**绕开对 state 的读取。
- **`onClick={() => doSomething(id)}` 这种内联写法救不了**：它写在 JSX 里，每次渲染本来就要新建。要传给 `memo` 子组件时，必须包成 `useCallback(() => doSomething(id), [id])`。
- **依赖里别放渲染时新建的对象 / 数组**：`[user]` 中的 `user` 若是每次新建的字面量，回调每帧都是新地址，`memo` 照样失效。

### 2.3 缓存计算结果与对象：`useMemo`

`useMemo` 与 `useCallback` 极其相似，但它不仅能缓存函数，它还能缓存**任何复杂计算返回的值**（特别是数组和对象）。

**缓存极度耗时的数学计算**

```jsx
import { useState, useMemo } from 'react'

function App({ list }) {
  const [count, setCount] = useState(0)

  // 如果不加 useMemo，每次点击 count 按钮，这个循环一万次的函数都会被执行一遍！
  const sortedList = useMemo(() => {
    console.log('执行了极度耗时的排序逻辑...')
    return list.sort((a, b) => a - b)
  }, [list]) // 只有当传入的 list 物理改变时，才重新排序

  return <div>...</div>
}
```

**锁死对象的内存地址（极其常见）**
如果要把一个对象作为 `props` 传给 `memo` 子组件，或者作为 `useEffect` 的依赖项，为了防止每次渲染生成新对象导致无限死循环，必须用 `useMemo` 锁住它。

```jsx
// 每次组件渲染，这个 options 都是同一块内存
const options = useMemo(() => {
  return { color: 'red', size: 10 }
}, [])

// 传给 memo 组件绝对安全
;<ChartComponent config={options} />
```

**高频场景：**

[width(35,65)]

| 场景                            | 为什么必须缓存                                                      |
| ------------------------------- | ------------------------------------------------------------------- |
| 大数据量的排序 / 过滤 / 聚合    | 每次渲染重算会明显卡顿，几百条以上就值得缓存                        |
| **Context 的 `value`**          | `<Ctx.Provider value={{ a, b }}>` 每次都是新对象 → 所有消费者重渲染 |
| 传给 `memo` 子组件的对象 / 数组 | 和 `useCallback` 是同一个问题，只是缓存的是“值”而不是“函数”         |
| 作为 `useEffect` 的依赖项       | 依赖是对象时不锁地址，会让 effect 反复执行甚至死循环                |
| 由 props 派生的状态             | 派生计算放渲染里做，父组件每动一次都要陪着算一遍                    |

**高频坑：**

- **别在 `useMemo` 里做副作用**：它只是“缓存计算”，React 有权丢弃缓存并重算（严格模式会故意算两次）。发请求、改 DOM、打日志要放 `useEffect`。
- **官方只把它当性能提示**：规范并不保证缓存一定保留，所以**不能用它保证“只执行一次”**（那是 `useRef` / `useEffect` 的活）。
- **依赖写错比不缓存更危险**：缓存了过期结果，界面会显示错误数据，而且极难排查。
- **缓存的“收益”要能被感知**：计算耗时几十微秒的表达式，加 `useMemo` 反而多付一次依赖比较，得不偿失。

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 既然 `memo`、`useCallback` 这么好，我是不是应该把项目里所有的组件和函数全部用它们包裹起来？

- **答**：**这是彻头彻尾的灾难！官方极其严厉地反对“过早优化”和“无脑包裹”。**
  - **性能反噬**：你以为你在优化性能，实际上 `memo` 的浅比较对象属性、`useCallback` 收集和追踪依赖数组，这些**底层动作本身就是极其消耗 CPU 性能的**。
  - **何时是负优化**：如果一个子组件非常轻量（只是个普通的 div 结构），或者你传给它的 props 每次 100% 都会变。你给它加了 `memo`，React 不仅要重新渲染它，还要在渲染前多做一次毫无意义的浅比较，性能反而更差！
  - **【黄金使用准则】**：
    1. **绝不单独使用**：`useCallback` 和 `useMemo` 存在的唯一意义，就是为了**配合 `React.memo` 或者作为 `useEffect` 的依赖项**。如果子组件没有包 `memo`，你父组件里写一万个 `useCallback` 都是脱裤子放屁，因为子组件依然会无条件渲染！
    2. **只给重型组件加护盾**：只有当子组件极其昂贵（如图表、上百行的表格、富文本编辑器），且你能明确感觉到页面输入卡顿时，才祭出这三件套。

### 3.2 我把函数写在组件外面（全局作用域）算是一种优化吗？

- **答**：**算，而且是最高级的优化！**
  - 如果你有一个纯粹的处理函数，它**完全不依赖**组件内部的任何 `State` 或 `Props`。
  - 千万不要把它写在组件里面然后用 `useCallback` 包裹。你应该**直接把它提取到组件函数定义的外面！**
  - 这样这个函数在整个 JS 模块加载时只会被创建一次，内存地址永生不变，连 `useCallback` 计算依赖的性能都省了，是真正的极致优雅。

  ```jsx
  // ✅ 完美的性能优化：不依赖内部状态的函数直接踢出组件外！
  const formatDate = date => date.toISOString()

  function App() {
    // ...
  }
  ```

### 3.3 React Compiler 发布后，还需要手写这三个 API 吗？

- **答**：**长期看会被大幅取代，但现在它们仍是硬性要求。**
  - 过去的几年里，React 开发者苦于手动添加 `useMemo` 和 `useCallback`，代码里充满了为了底层机制妥协的“噪音”。
  - React 团队推出的 **React Compiler**（前身即 Forget）通过底层静态分析引擎，在**编译阶段**自动为组件、对象和函数打上缓存标记——这正是我们上面手写的那些事。
  - 但它是**需要显式接入的构建期工具**（Babel / SWC 插件），不是装上 React 就自动生效；存量项目、动态写法、以及编译器分析不了的边界场景，依然要靠手写。
  - 结论：**接入编译器的项目可以少写**，但你必须懂这三个 API 的语义——否则既看不懂编译器为什么“没生效”，也修不了它报出的问题。面试与实际排障里，它们仍是必考项。

### 3.4 为什么我用 `memo` 包了子组件，它还是每次都渲染？

按可能性从高到低排查：

- **props 里有“每次都不一样”的东西**：对象 / 数组 / 函数字面量、`style={{ color }}`、`onClick={() => ...}`、`data={list.filter(...)}`——每次渲染都是新地址，浅比较必然不等。解法见 2.2 / 2.3。
- **传了 JSX 作为 `children`**：`<Memo><span /></Memo>` 里那个元素每次渲染都是新建的，一样会被判定为“变了”。
- **组件自己订阅了 Context**：Context 的 value 变化会**绕过 `memo`** 直接触发渲染。
- **`key` 变了**：key 一变，React 直接卸载旧组件、新建一个，`memo` 完全用不上（把数组下标当 key 时最常见）。
- **子组件被定义在父组件函数体内部**：`const Child = memo(() => ...)` 写在父组件里，每次渲染都创建一个**全新的组件类型**，React 视作两个不同组件，直接卸载重建。

### 3.5 `useMemo` 的依赖里放了对象或数组，为什么缓存还是失效？

因为依赖比较用的是 `Object.is`，比的是**地址**而不是内容。`useMemo(() => f({ a: 1 }), [{ a: 1 }])` 里的字面量每次渲染都新建，地址永远不同，于是每次都重算。三种解法：

1. **把依赖拆到原始值**：`[{ a: 1 }]` → `[a]`，最推荐；
2. **用 `useMemo` 把对象本身锁住**，再把锁好的对象作为依赖传下去；
3. **用 `useRef` 存一份稳定引用**，只在必要时更新它。

### 3.6 依赖数组写 `[]` 就没问题了吗？

不是。`[]` 只解决“不要重复计算”，不解决“要拿到最新值”：

- `useMemo(fn, [])` / `useCallback(fn, [])` 里的 `fn` 会**永久闭包在首次渲染的作用域**里，之后读到的 props / state 全是旧值——即**陈旧闭包 (stale closure)**。
- 正道是**把依赖写全**，用 ESLint 的 `react-hooks/exhaustive-deps` 规则兜底。若确实需要“函数地址稳定、但内部读最新值”，用 `useRef` 存一份最新值（ref 不参与依赖比较）：

```jsx
const latestText = useRef(text)
latestText.current = text // 每次渲染同步一次
const handleClick = useCallback(() => console.log(latestText.current), [])
```

- 另一个更简单的绕过方式：**函数式更新** `setCount(prev => prev + 1)`，压根不读外部 state。

### 3.7 `useCallback` 里读到的总是旧值，怎么解决？

这就是 3.6 说的陈旧闭包，三种解法按推荐度排序：

1. **补全依赖数组**：依赖变了就生成新函数。对 `memo` 子组件依然有效——它只是会在“数据真的变了”时重渲染，这本来就是应该付出的代价。
2. **`useRef` 保存最新值**：适合“函数必须稳定、内部又要读最新值”的场景（`setInterval` 回调、全局事件监听）。
3. **改用函数式更新**，从根上不依赖外部 state。

> 反面提醒：**为了让 lint 闭嘴而硬删依赖项**，是拿一个更隐蔽的 bug 换一个更小的警告。

### 3.8 列表已经用了 `memo` 还是很卡，还有什么办法？

`memo` 只能省掉“**不必要**的重渲染”，省不掉“必要的那一次”。继续排查这几个方向：

- **一次要渲染的数据量太大** → 上虚拟列表（只渲染可视区域），长列表的终极方案；
- **单行本身就很贵** → 拆分结构、减少 DOM 层级，把重型子组件再单独 `memo`；
- **更新频率太高** → 用 `useDeferredValue` / `useTransition` 把非紧急更新降级，或对搜索输入做防抖；
- **`key` 不稳定** → 用业务 id，别用数组下标，否则每行都在卸载重建；
- **状态放得太高** → 把频繁变化的状态**下沉**到真正用它的组件，或把 Context 拆成多个 Provider，从源头缩小“连坐”范围。
