# React注意点

##  1. 组件导入和导出

| 导出方式 | 导出语句 | 导入语句 |
|---|---|---|
| **默认 (Default)** | `export default function Button() {}` | `import Button from './Button.js';` |
| **具名 (Named)** | `export function Button() {}` | `import { Button } from './Button.js';` |

## 2. JSX 规则

* **只能返回一个根元素**。
* **标签必须闭合**。
* **使用驼峰式命名法**给大部分属性命名。

## 3. Props 注意点

- 要传递 props，请将它们添加到 JSX，就像使用 HTML 属性一样。
- 要读取 props，请使用 `function Avatar({ person, size })` 解构语法。
- 你可以指定一个默认值，如 `size = 100`，用于缺少值或值为 `undefined` 的 props。
- 你可以使用 `<Avatar {...props} />` JSX 展开语法转发所有 props，但不要过度使用它！
- 像 `<Card><Avatar /></Card>` 这样的嵌套 JSX，将被视为 `Card` 组件的 `children` prop。
- **Props 是只读的时间快照**：每次渲染都会收到新版本的 props。
- **你不能改变 props**。当你需要交互性时，你可以设置 state。

## 4. 条件渲染

- 在 React，你可以使用 JavaScript 来控制分支逻辑。
- 你可以使用 `if` 语句来选择性地返回 JSX 表达式。
- 你可以选择性地将一些 JSX 赋值给变量，然后用大括号将其嵌入到其他 JSX 中。
- 在 JSX 中，`{cond ? <A /> : <B />}` 表示 **“当 `cond` 为真值时, 渲染 `<A />`，否则渲染 `<B />`”**。
- 在 JSX 中，`{cond && <A />}` 表示 **“当 `cond` 为真值时, 渲染 `<A />`，否则不进行渲染”**。

## 5. 渲染列表 Key 的作用

它使 React 能追踪这些组件，即便后者的位置或数据发生了变化，也能保存组件状态。

- **key 值在兄弟节点之间必须是唯一的。** 不过不要求全局唯一，在不同的数组中可以使用相同的 key。
- **key 值不能改变**，否则就失去了使用 key 的意义！所以千万不要在渲染时动态地生成 key。

## 6. 组件需要保持纯粹

**好处**：将组件按纯函数严格编写，以避免一些随着代码库的增长而出现的、令人困扰的 bug 以及不可预测的行为。

一个组件必须是纯粹的，就意味着：
- **只负责自己的任务。** 它不会更改在该函数调用前就已存在的对象或变量。
- **输入相同，则输出相同。** 给定相同的输入，组件应该总是返回相同的 JSX。

## 7. 响应事件

- 你可以通过将函数作为 prop 传递给元素（如 `<button>`）来处理事件。
- 必须传递事件处理函数，**而非函数调用！** 是 `onClick={handleClick}`，而不是 `onClick={handleClick()}`。
- 你可以单独或者内联定义事件处理函数。
- 事件处理函数在组件内部定义，所以它们可以访问 props。
- 你可以在父组件中定义一个事件处理函数，并将其作为 prop 传递给子组件。
- 你可以根据特定于应用程序的名称定义事件处理函数的 prop。
- 事件会向上传播。通过事件的第一个参数调用 `e.stopPropagation()` 来防止这种情况。
- 事件可能具有不需要的浏览器默认行为。调用 `e.preventDefault()` 来阻止这种情况。
- 从子组件显式调用事件处理函数 prop 是事件传播的另一种优秀替代方案。

##  8. 组件可以通过设置 State 具有记忆性

- State 是组件私有的。如果你在两个地方渲染它，则每个副本都有独属于自己的 state。

## 9. 更新 State

- 设置 state 不会更改现有渲染中的变量，但会请求一次新的渲染。
- React 会在事件处理函数执行完成之后处理 state 更新。这被称为**批处理**。
- 要在一个事件中多次更新某些 state，你可以使用更新函数，如 `setNumber(n => n + 1)`。
- 将 React 中所有的 state 都视为**不可直接修改**的。

## 10. 更新对象类型的 State

- 当你在 state 中存放对象时，直接修改对象并不会触发重渲染，并会改变前一次渲染“快照”中 state 的值。
- **不要直接修改一个对象**，而要为它创建一个**新**版本，并通过把 state 设置成这个新版本来触发重新渲染。
- 你可以使用 `{...obj, something: 'newValue'}` 对象展开语法来创建对象的拷贝。
- 对象的展开语法是浅层的：它的复制深度只有一层。
- 想要更新嵌套对象，你需要从你更新的位置开始，自底向上为每一层都创建新的拷贝。
- 想要减少重复的拷贝代码，可以使用 Immer 库。

## 11. 更新数组类型的 State

你可以把数组放入 state 中，但不应该直接修改它。而是创建它的一份**新的拷贝**，然后使用新的数组来更新状态。

| 数组操作 | 推荐做法 (返回新数组) ✅ | 避免使用 (直接修改原数组) ❌ |
|---|---|---|
| **添加元素** | `concat`, `[...arr]` 展开语法 ([参考](https://zh-hans.react.dev/learn/updating-arrays-in-state#adding-to-an-array)) | `push`, `unshift` |
| **删除元素** | `filter`, `slice` ([参考](https://zh-hans.react.dev/learn/updating-arrays-in-state#removing-from-an-array)) | `pop`, `shift`, `splice` |
| **替换元素** | `map` ([参考](https://zh-hans.react.dev/learn/updating-arrays-in-state#replacing-items-in-an-array)) | `splice`, `arr[i] = ...` 赋值 |
| **排序** | 先将数组复制一份再操作 ([参考](https://zh-hans.react.dev/learn/updating-arrays-in-state#making-other-changes-to-an-array)) | `reverse`, `sort` |

- 使用 `[...arr, newItem]` 数组展开语法来向数组中添加元素。
- 使用 `filter()` 和 `map()` 来创建一个经过过滤或者变换的数组。
- 可以使用 Immer 来保持代码简洁。

## 12. 设置 State

**步骤一：删除任何不必要的 state 变量**
1. 这个 state 是否会导致矛盾？
2. 相同的信息是否已经在另一个 state 变量中存在？
3. 你是否可以通过另一个 state 变量的相反值得到相同的信息？

**步骤二：连接事件处理函数去设置 state**

## 13. State 的结构

* **合并关联的 state**。如果你总是同时更新两个或更多的 state 变量，请考虑将它们合并为一个单独的 state 变量。
* **避免互相矛盾的 state**。当 state 结构中存在多个相互矛盾或“不一致”的 state 时，你就可能为此会留下隐患。
* **避免冗余的 state**。如果你能在渲染期间从组件的 props 或其现有的 state 变量中计算出一些信息，则不应将这些信息放入该组件的 state 中。
* **避免重复的 state**。当同一数据在多个 state 变量之间或在多个嵌套对象中重复时，很难保持同步。应尽可能减少重复。
* **避免深度嵌套的 state**。深度分层的 state 更新起来不是很方便。最好以扁平化方式构建 state。

## 14. 组件共享状态

- 当你想要整合两个组件时，将它们的 state 移动到共同的父组件中。
- 然后在父组件中通过 `props` 把信息传递下去。
- 最后，向下传递事件处理程序，以便子组件可以改变父组件的 state。
- 考虑将组件视为“受控”（由 prop 驱动）或是“不受控”（由 state 驱动）是十分有益的。

## 15. 保留 State 和重置 State 状态

- **保留 state 状态**：[相同位置的相同组件会使得 state 被保留下来](https://zh-hans.react.dev/learn/preserving-and-resetting-state#same-component-at-the-same-position-preserves-state)。只要在相同位置渲染的是相同组件，React 就会保留状态。
- **重置 state 状态**：
    1. 将组件渲染在不同位置。
    2. 使用 `key` 来重置 state。可以通过为一个子树指定一个不同的 key 来重置它的 state。
- state 不会被保存在 JSX 标签里。它与你在树中放置该 JSX 的位置相关联。
- **不要嵌套组件的定义**，否则你会意外地导致 state 被频繁重置。

## 16. 使用 Reducer 整合状态逻辑

- 把 `useState` 转化为 `useReducer`：
    1. 通过事件处理函数 dispatch actions；
    2. 编写一个 reducer 函数，它接受传入的 state 和一个 action，并返回一个新的 state；
    3. 使用 `useReducer` 替换 `useState`。
- Reducer 可能需要你写更多的代码，但是这有利于代码的调试和测试。
- **Reducer 必须是纯净的**。
- 每个 action 都描述了一个单一的用户交互。
- 可以使用 Immer 来帮助你在 reducer 里直接修改状态（简化代码书写）。

## 17. 跨组件传递参数 Context

- Context 使组件向其下方的整个树提供信息。
- **传递 Context 的方法**:
    1. 通过 `export const MyContext = createContext(defaultValue)` 创建并导出 context。
    2. 在无论层级多深的任何子组件中，把 context 传递给 `useContext(MyContext)` Hook 来读取它。
    3. 在父组件中把 children 包在 `<MyContext.Provider value={...}>` 中来提供 context。
- Context 会穿过中间的任何组件。
- Context 可以让你写出“较为通用”的组件。
- 在使用 context 之前，先试试传递 props 或者将 JSX 作为 `children` 传递。

## 18. 使用 Reducer 和 Context 结合 (类似 react-redux)

- 你可以将 reducer 与 context 相结合，让任何组件读取和更新它的状态。
- **为子组件提供 state 和 dispatch 函数**：
    1. 创建两个 context (一个用于 state，一个用于 dispatch 函数)。
    2. 让组件的 context 使用 reducer。
    3. 使用组件中需要读取的 context。
- 你可以通过将所有传递信息的代码移动到单个文件中来进一步整理组件。
    - 你可以导出一个像 `TasksProvider` 这样可以提供 context 的组件。
    - 你也可以导出像 `useTasks` 和 `useTasksDispatch` 这样的自定义 Hook。
- 你可以在你的应用程序中大量使用 context 和 reducer 的组合。

## 19. Ref 和 State 不同之处

| 特性 | Ref | State |
|---|---|---|
| **返回值** | `useRef(initialValue)` 返回 `{ current: initialValue }` | `useState(initialValue)` 返回 state 变量的当前值和一个 state 设置函数 `[value, setValue]` |
| **触发渲染** | 更改时**不会**触发重新渲染。 | 更改时**会**触发重新渲染。 |
| **可变性** | **可变** —— 你可以在渲染过程之外修改和更新 `current` 的值。 | **“不可变”** —— 你必须使用 state 设置函数来修改 state 变量，从而排队重新渲染。 |
| **读写时机** | 你**不应**在渲染期间读取（或写入） `current` 值。 | 你可以随时读取 state。但是，每次渲染都有自己不变的 state [快照](https://zh-hans.react.dev/learn/state-as-a-snapshot)。 |

## 20. Ref 的用处

- 存储 [timeout ID](https://developer.mozilla.org/docs/Web/API/setTimeout)。
- 存储和操作 [DOM 元素](https://developer.mozilla.org/docs/Web/API/Element)。
- 存储不需要被用来计算 JSX 的其他对象。
- **将 ref 视为脱围机制**。当你使用外部系统或浏览器 API 时，ref 很有用。如果你很大一部分应用程序逻辑和数据流都依赖于 ref，你可能需要重新考虑你的方法。
- **不要在渲染过程中读取或写入 `ref.current`。** 如果渲染过程中需要某些信息，请使用 state 代替。由于 React 不知道 `ref.current` 何时发生变化，即使在渲染时读取它也会使组件的行为难以预测。（唯一的例外是像 `if (!ref.current) ref.current = new Thing()` 这样的代码，它只在第一次渲染期间设置一次 ref。）
- 与 state 一样，ref 允许你在组件的重新渲染之间保留信息；与 state 不同，设置 ref 的 `current` 值不会触发重新渲染。
- 通常，你会将 refs 用于非破坏性操作，例如聚焦、滚动或测量 DOM 元素。
- 默认情况下，组件不暴露其 DOM 节点。你可以通过使用 `ref` 属性来暴露 DOM 节点。避免更改由 React 管理的 DOM 节点。

## 21. Effect

- 与事件不同，Effect 由渲染本身引起，而非特定的交互。
- Effect 允许你将组件与某些外部系统（第三方 API、网络等）同步。
- 默认情况下，Effect 在每次渲染（包括初始渲染）后运行。
- 如果所有依赖项都与上一次渲染时相同，React 会跳过本次 Effect。
- 你不能“选择”依赖项，它们是由 Effect 内部的代码所决定的。
- 空的依赖数组 (`[]`) 对应于组件的“挂载”，即组件被添加到页面上时。
- 仅在严格模式下的开发环境中，React 会挂载两次组件，以对 Effect 进行压力测试。
- 如果你的 Effect 因为重新挂载而出现问题，那么你需要实现一个清理函数。
- React 会在 Effect 再次运行之前和在组件卸载时调用你的清理函数。

##  22. 如何移除不必要的 Effect

- 如果你可以在渲染期间计算某些内容，则不需要使用 Effect。
- 想要缓存昂贵的计算，请使用 `useMemo` 而不是 `useEffect`。
- 想要重置整个组件树的 state，请传入不同的 `key`。
- 想要在 prop 变化时重置某些特定的 state，请在渲染期间处理。
- 组件**显示**时就需要执行的代码应该放在 Effect 中，否则应该放在事件处理函数中。
- 如果你需要更新多个组件的 state，最好在单个事件处理函数中处理。
- 当你尝试在不同组件中同步 state 变量时，请考虑状态提升。
- 你可以使用 Effect 获取数据，但你需要实现清除逻辑以避免竞态条件。

## 23. Effect 生命周期

- 组件可以挂载、更新和卸载。
- 每个 Effect 与周围组件有着独立的生命周期。
- 每个 Effect 描述了一个独立的同步过程，可以**开始**和**停止**。
- 在编写和读取 Effect 时，要独立地考虑每个 Effect（如何开始和停止同步），而不是从组件的角度思考（如何挂载、更新或卸载）。
- 在组件主体内声明的值是“响应式”的。
- 响应式值应该重新进行同步 Effect，因为它们可以随着时间的推移而发生变化。
- 检查工具会验证在 Effect 内部使用的所有响应式值是否都被指定为了依赖项。标记的所有错误都是合理的，总是有一种方法可以修复代码，同时不违反规则。

## 24. Effect 非响应式数据事件 Effect Event

- 事件处理函数在响应特定交互时运行（例如提交表单，按钮点击事件）。
- Effect 在需要同步的时候运行。
- 事件处理函数内部的逻辑是**非响应式**的。（手动触发的都是非响应式）
- Effect 内部的逻辑是**响应式**的。（effect 内部逻辑都是自动触发的）
- 你可以将非响应式逻辑从 Effect 移到 Effect Event 中（实验性 API 如 `useEffectEvent`）。
- 只在 Effect 内部调用 Effect Event。
- 不要将 Effect Event 传给其他组件或者 Hook。

## 25. 移除 Effect 依赖

- 依赖应始终与代码匹配。当你对依赖不满意时，你需要编辑的是代码。
- 抑制 linter 会导致非常混乱的错误，你应该始终避免它。要移除依赖，你需要向 linter “证明”它不是必需的。
- 如果某些代码是为了响应特定交互，请将该代码移至事件处理的地方。
- 如果 Effect 的不同部分因不同原因需要重新运行，请将其拆分为多个 Effect。
- 如果你想根据以前的状态更新一些状态，传递一个更新函数。
- 如果你想读取最新值而不“反应”它，请从 Effect 中提取出一个 Effect Event。
- 在 JavaScript 中，如果对象和函数是在不同时间创建的，则它们被认为是不同的。尽量避免对象和函数依赖。将它们移到组件外或 Effect 内。

## 26. 自定义 Hook

- 自定义 Hook 让你可以在组件间共享逻辑。
- 自定义 Hook 命名必须以 `use` 开头，后面跟一个大写字母。
- 自定义 Hook **共享的只是状态逻辑，不是状态本身**。
- 你可以将响应值从一个 Hook 传到另一个，并且它们会保持最新。
- 每次组件重新渲染时，所有的 Hook 会重新运行。
- 自定义 Hook 的代码应该和组件代码一样保持纯粹。
- 把自定义 Hook 收到的事件处理函数包裹到 Effect Event。

