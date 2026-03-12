---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 列表渲染与 Key 原理(List Rendering & Keys)

## 1. 核心概念与工作流

在 React 的哲学里，UI 只是数据的映射。既然你要渲染一个列表，那你本质上就是想**把一个“数据数组”转换成一个“React 元素数组”**。

### 1.1 标准的列表渲染工作流

* 准备一个原始的数据数组。
* 调用数组的 `map()` 方法。
* 在 `map` 的回调函数中，为你需要的每一个数据项返回一段对应的 JSX（也就是 React 元素）。
* 将生成的新元素数组直接放置在 JSX 的大括号 `{}` 中，React 会自动将它们展开渲染到页面上。

```jsx
// 1. 准备原始数据
const numbers =;

function NumberList() {
  // 2. 利用 map 进行转换
  const listItems = numbers.map((number) => {
    // 3. 返回 JSX (🚨 注意这里的 key 属性，后文会重点讲解！)
    return <li key={number.toString()}>{number}</li>;
  });

  // 4. 直接渲染这个元素数组
  return <ul>{listItems}</ul>;
}

// ------ 更常见、更精简的“行内嵌入”写法 ------
function NumberListInline() {
  return (
    <ul>
      {/* 直接在 JSX 内部使用大括号包含 map 表达式 */}
      {numbers.map((number) => (
        <li key={number.toString()}>{number}</li>
      ))}
    </ul>
  );
}
```

## 2. 深入灵魂的考问：`key` 到底是什么？

当你运行上面的代码时，如果你忘了写 `key={number.toString()}`，页面虽然能正常显示，但控制台一定会抛出一条鲜红的警告：

> **Warning: Each child in a list should have a unique "key" prop.**

这是 React 中最著名、面试被问得最多的警告。

### 2.1 `key` 的本质与作用

**`key` 是 React 在执行虚拟 DOM 的 Diff 算法（调和阶段 Reconciliation）时，用来识别兄弟节点身份的唯一凭证（身份证）！**

它帮助 React 极其精确地判断：在这个列表中，哪些元素改变了、哪些被添加了、哪些被删除了。

### 2.2 没有 `key` 会发生什么灾难？(Diff 算法的盲区)

假设你渲染了一个没有 `key` 的列表：`[<li>苹果</li>, <li>香蕉</li>]`。
此时，你向数组**头部**插入了一个新数据变成了：`[<li>西瓜</li>, <li>苹果</li>, <li>香蕉</li>]`。

**React 的盲区比对过程（灾难现场）：**
React 看到新旧两棵树的列表区域，它没有身份证，只能**按照顺序**一个个比对：
1. 它拿新树的第 1 个（西瓜）和旧树的第 1 个（苹果）比。发现不一样，于是它**强制修改了第一个原生 DOM 节点的内容**，把苹果变成了西瓜。
2. 拿新树的第 2 个（苹果）和旧树的第 2 个（香蕉）比。又不一样，再次**强制修改真实 DOM**，把香蕉变成了苹果。
3. 看到新树有第 3 个（香蕉），旧树没有了。于是它**新建了一个真实的 DOM 节点**插入在最后。

**后果：**
为了在开头加一个西瓜，React 竟然把后面所有的 DOM 节点都残忍地修改、重绘了一遍！性能极差。更要命的是，如果这些被强行修改的列表项里面包含 `input` 且用户已经输入了文字，那些文字会产生极其诡异的错位！

### 2.3 有了 `key` 之后的完美救援

如果你给了 `key`（比如苹果是 `A`，香蕉是 `B`，西瓜是 `X`）。
当数组变成 `[X, A, B]` 时。

**React 的比对过程：**
React 在比对时，第一眼看过去，发现旧树里的 `key=A` 和 `key=B` 在新树里**原封不动地存在着，只是位置变了**！
于是，React 会**完美保留 `A` 和 `B` 原有的真实 DOM 节点及其内部状态**，仅仅将它们的位置往后挪一下。然后，针对那个陌生的 `key=X`，在最前面新建一个物理 DOM 即可。

性能得到史诗级拯救，组件状态得到完美保护！

## 3. `key` 的使用铁律与最佳实践

### 3.1 提取独立组件时的 `key` 绑定位置

这是一个极其容易写错的坑：**`key` 应该绑定在 `map()` 方法内部的最外层元素上，而不是组件内部的根元素上。**

```jsx
// ❌ 错误示范：把 key 写在了子组件的内部
function ListItem(props) {
  // 错！这里不需要 key，React 根本看不见它。
  return <li key={props.value}>{props.value}</li>;
}

function NumberList(props) {
  const numbers = props.numbers;
  // 错！这里在 map 里调用 ListItem，却没有给它 key 身份证。
  const listItems = numbers.map((number) =>
    <ListItem value={number} />
  );
  return <ul>{listItems}</ul>;
}

// ✅ 正确示范：key 必须留在 map 的现场
function ListItem(props) {
  // 对！这里只管渲染内容
  return <li>{props.value}</li>;
}

function NumberList(props) {
  const numbers = props.numbers;
  // 对！给遍历出来的每一个兄弟组件戴上胸牌
  const listItems = numbers.map((number) =>
    <ListItem key={number.toString()} value={number} />
  );
  return <ul>{listItems}</ul>;
}
```

### 3.2 到底该拿什么作为 `key`？

*   **最佳方案（唯一真理）**：**使用你的数据源中自带的唯一 ID！** （如数据库主键 `id`、UUID 等）。
*   **备用方案**：如果数据没有唯一 ID，可以在获取数据后前端先手动给它打上一个独一无二的随机字符串（如 `nanoid`）作为固定属性。
*   **绝对禁止**：千万不要用 `Math.random()` 即时生成！因为每次渲染组件，重新跑 `map` 时 `key` 都会变，React 会认为所有元素都是新的，直接全部销毁重建，导致输入框失焦、性能崩溃。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然用 `index`（数组索引）这么坑，为什么官方文档说“实在没有 id 时，可以勉强使用 index”？
*   **答**：这是关于**“列表是否绝对静态”**的权衡。
    *   **何时用 index 必死**：如果你渲染的这个列表，后续可能会发生**重新排序 (reorder)**、**在头部或中间插入/删除元素**。此时用 index，不仅会导致 DOM 重绘的性能灾难，更会导致那些属于组件内部不受控的状态（如 uncontrolled input 的值、第三方非 React 图表库）产生令人崩溃的**张冠李戴（错位）**现象。
    *   **何时用 index 安全**：如果你 100% 确定这个列表是**只读的静态列表**（永远不会改变顺序、永远不会增加删除元素，仅仅用来展示），或者你只会向数组的最末尾 `push` 数据。那么每次渲染时，特定数据对应的 index 是永远固定不变的，此时使用 `index` 作为 key 是绝对安全且无害的。

### 4.2 我需要在一个 `map` 循环里，渲染出两个平级的兄弟节点（比如一个 `dt` 和一个 `dd`），怎么给它们加 `key`？
*   **答**：使用幽灵标签 `<Fragment>`。
    *   在 React 中，你不能从一个回调函数里返回两个并列的元素，它们必须被包裹。但如果你不想增加多余的 DOM 层级（如包一个 div 会破坏 dl 的原生结构），你可以使用带有 `key` 的长拼写版 `<Fragment>`。
    *   **注意：简写版的 `<></>` 是不能接收 `key` 属性的！**
    ```jsx
    import { Fragment } from 'react';

    function Glossary(props) {
      return (
        <dl>
          {props.items.map(item => (
            // 必须使用显式的 Fragment 标签才能挂载 key
            <Fragment key={item.id}>
              <dt>{item.term}</dt>
              <dd>{item.description}</dd>
            </Fragment>
          ))}
        </dl>
      );
    }
    ```

### 4.3 为什么我不加 `key` 时，有时页面状态错乱，但有时又好好的？
*   **答**：这取决于你的列表项组件是**“受控 (Controlled)”**还是**“非受控 (Uncontrolled)”**。
    *   如果列表里只是纯粹的 `<span>文本</span>`。不加 key 时，React 强行把第一个 span 的文本“苹果”修改成“西瓜”。虽然底层做了低效的 DOM 修改，但视觉上你是看不出错乱的。
    *   但如果列表里有 `<input type="text" />`（非受控状态）。你在第一个输入框输入了“你好”。当你往头部插入新元素时，React 复用了第一个原生 input DOM（只是假装它变成了新元素的容器）。由于它复用了真实的物理 input 标签，你刚才打的字“你好”依然残留在里面！这就导致新插入的数据行，莫名其妙继承了原来第一行的用户输入，这就是经典的“状态借尸还魂”错位惨案。
