---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# React State 与全生命周期(State & Lifecycle)

## 1. 核心概念与范式演进

在 React 的世界里，**State (状态)** 是驱动 UI 变化的唯一引擎。如果说 **Props** 是组件的“基因”（由外部决定，不可改变），那么 State 就是组件的“记忆”与“心情”（由组件内部自我管理，随交互而改变）。

React 的组件开发范式经历了从 **Class 组件 (面向对象)** 到 **Function 组件 + Hooks (函数式)** 的历史性跨越。

## 2. 状态管理的核心铁律 (State)

在 `React` 中，无论是 `Class` 组件时代的 `this.setState()`，还是现代 `Hooks` 时代的 `useState` 返回的 `setXxx()` 函数，它们执行的都是一项绝对神圣的任务：通知 `React` 数据变了，你需要重新渲染`（Re-render）`当前组件。

无论你使用哪种范式，操作 React State 都必须遵守两条最高级别的军规：

| 核心铁律 | 深度解释 | 灾难后果 |
| :--- | :--- | :--- |
| **绝对的不可变性 (Immutability)** | 你**绝对不能**直接修改当前状态在内存中的值。你要做的是产生一个**全新**的数据副本交回给 React。 | React 底层使用 `Object.is` (浅比较) 来判断数据是否变化。如果你直接改了原对象的属性，内存地址没变，React 会直接无视你的修改，页面死活不更新！ |
| **状态快照 (State as a Snapshot)** | 在同一次渲染的函数闭包中，State 的值是**被彻底冻结的死值**。你调用了 `setCount(1)`，紧接着下一行代码去读 `count`，读到的依然是旧的 `0`。 | 在同一个函数里连续进行依赖当前状态的多次计算，结果全错。 |


### 2.1 绝对不能直接修改 State (Immutability)
在 Vue 中你可以直接 `this.x = 1`。但在 React 中，**直接修改 State 是一项死罪，它不会触发重新渲染。**

*   **Class 组件**：必须使用 `this.setState()`。

```jsx
import React, {Component} from 'react';
export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            count:0
        };
    }
    render() {
        return (
            <div>
                <div>{this.state.count}</div>
                <button onClick={()=>this.increment()}>+</button>
            </div>
        )
    }
    increment(){
        //修改state值并触发更新
        this.setState({
            count:this.state.count+1
        })
    }
}

```
*   **函数组件**：必须使用 `useState` 返回的 `setXxx()` 函数,对于字符串、数字、布尔值，直接赋予新值即可。

```jsx
const [count, setCount] = useState(0);

// 直接用新值覆盖旧值
setCount(count + 1);
setCount(5);
```



*   **对象与数组**：必须使用展开运算符 `...` 或数组原生方法（如 `map`, `filter`）生成一个**内存地址完全不同的新副本**去覆盖旧数据，在操作对象和数组时，**不准用 `push`, `pop`, `splice`, `delete` 等会改变原数组的方法！**

```jsx
const [user, setUser] = useState({ name: 'Alice', age: 20 });
const [list, setList] = useState(['A', 'B']);

const updateData = () => {
  // --- 操作对象 ---
  // 1. 展开运算符拷贝旧对象，并覆盖你想修改的属性
  setUser(prev => ({ ...prev, age: 21 })); 
  
  // --- 操作数组 ---
  // 1. 新增元素 (替代 push/unshift)
  setList(prev => [...prev, 'C']);     // 加在末尾
  setList(prev => ['X', ...prev]);     // 加在开头
  
  // 2. 删除元素 (替代 splice/pop)
  // 使用 filter 过滤掉不要的，返回一个纯净的新数组
  setList(prev => prev.filter(item => item !== 'B')); 
  
  // 3. 修改某个具体元素
  // 使用 map 遍历，遇到要改的就返回新对象，不改的直接返回原对象
  setList(prev => prev.map(item => item === 'A' ? 'Apple' : item));
};
```

### 2.2 State 的更新是异步与批处理的 (Batching)
为了压榨极致的性能，当你连续调用三次 `setState` 时，React **不会**立刻傻傻地去渲染三次页面。它会把这些请求打包（合并），等同步代码全部执行完后，再统一进行一次精准的渲染。

**函数式更新 (Updater Function):** 当你新的 State 需要依赖于前一个 State 计算得出时，绝对不要写 `setCount(count + 1)`，**必须传入一个回调函数！**

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const incrementBy3 = () => {
    // ❌ 错误示范：由于“快照”特性，这三行代码里的 count 都是 0。
    // 相当于执行了三次 setCount(0 + 1)，最终结果是 1！
    // setCount(count + 1);
    // setCount(count + 1);
    // setCount(count + 1);

    // ✅ 正确示范：传入一个回调函数 (prev => ...)
    // React 会把这个函数放进队列，保证每次计算都能拿到【绝对最新】的那个值
    setCount(prevCount => prevCount + 1); // 0 + 1 = 1
    setCount(prevCount => prevCount + 1); // 1 + 1 = 2
    setCount(prevCount => prevCount + 1); // 2 + 1 = 3
  };

  return <button onClick={incrementBy3}>加 3</button>;
}
```


## 3. Class 组件：经典的生命周期图谱

Class 组件的生命周期就像人的生老病死，有着极其严格的物理执行顺序。React 16.3 之后，官方对部分钩子打上了 `UNSAFE_` 标记并准备废弃，这里我们只讲**现代标准的 Class 生命周期**。

### 3.1 挂载阶段 (Mounting) - 出生
当组件实例被创建并插入 DOM 时，其生命周期调用顺序如下：

1.  **`constructor(props)`**：第一步。唯一可以直接 `this.state = {}` 赋值的地方。用于初始化内部状态或绑定 `this`。
2.  `static getDerivedStateFromProps(props, state)`：(极少使用) 在调用 render 方法之前调用。用于让 state 依赖于 props 发生变化。
3.  **`render()`**：**绝对核心。必须实现。** 它只做一件事：检查 `this.props` 和 `this.state` 并返回纯粹的 JSX。**绝不能在这里使用 `setState` 或发请求，否则光速死循环！**
4.  **`componentDidMount()`**：**挂载完毕。** 此时真实的 DOM 已经存在。**发起网络请求、绑定全局事件 (`window.addEventListener`)、操作 D3.js/ECharts 原生 DOM 的唯一合法位置。**

### 3.2 更新阶段 (Updating) - 成长
当组件的 props 或 state 发生改变时，会触发更新：

1.  `static getDerivedStateFromProps`：同上。
2.  **`shouldComponentUpdate(nextProps, nextState)`**：**性能优化的核武器。** 返回 `true` 或 `false`。如果返回 false，React 会直接中止本次渲染流程，后面的生命周期全部取消。常用于极度耗性能的巨型组件比对。
3.  **`render()`**：再次执行，生成新的虚拟 DOM。
4.  `getSnapshotBeforeUpdate(prevProps, prevState)`：在真实 DOM 更新前一刹那被调用。常用于截取旧的 DOM 状态（比如用户滚动到了哪里）。
5.  **`componentDidUpdate(prevProps, prevState, snapshot)`**：**更新完毕。** 此时 DOM 已经是最新的。**常用于根据新的 props 或 state 继续发起请求（注意：必须包裹在 if 语句中检查新旧值，否则死循环！）**。

### 3.3 卸载阶段 (Unmounting) - 死亡

1.  **`componentWillUnmount()`**：在组件从 DOM 中被移除之前调用。**极其重要：取消网络请求、清除定时器、解绑通过 `addEventListener` 绑定的全局事件。如果忘了写，会导致严重的内存泄漏！**

```js
import React, { Component } from 'react';

class ClassicLifecycleDemo extends Component {
  // ---------------------------------------------------------
  // 1. 【初始化阶段】
  // ---------------------------------------------------------
  constructor(props) {
    super(props);
    console.log('1. [Constructor]: 组件实例化，分配内存。');
    // 唯一可以直接给 this.state 赋值的地方，绝不能写 setState！
    this.state = {
      count: 0,
      derivedValue: null
    };
    this.scrollRef = React.createRef();
  }

  // ---------------------------------------------------------
  // 2. 【静态推导阶段】(极少使用)
  // 替代了 componentWillReceiveProps。在 Render 之前触发。
  // 作用：让 state 依赖 props 的变化而发生变化。
  // 注意：它是静态方法，拿不到 this！
  // ---------------------------------------------------------
  static getDerivedStateFromProps(nextProps, prevState) {
    console.log('2/5. [getDerivedStateFromProps]: 根据 props 计算衍生 state。');
    if (nextProps.multiplier !== prevState.derivedValue) {
      // 返回一个对象来更新 state，或者返回 null 表示不更新
      return { derivedValue: nextProps.multiplier * 2 };
    }
    return null;
  }

  // ---------------------------------------------------------
  // 3. 【拦截阶段】(核心性能优化点)
  // 只有在 Update 阶段触发。返回 false 直接中止后续渲染流程！
  // ---------------------------------------------------------
  shouldComponentUpdate(nextProps, nextState) {
    console.log('6. [shouldComponentUpdate]: 询问是否需要重新渲染？');
    // 优化示例：如果 count 没变，就不重新渲染
    if (this.state.count === nextState.count && this.props === nextProps) {
      console.log('   -> 数据没变，拦截渲染！');
      return false; 
    }
    return true; // 默认返回 true
  }

  // ---------------------------------------------------------
  // 4. 【渲染阶段】(绝对核心)
  // 生成虚拟 DOM。绝对不能在这里调用 setState，否则无限死循环！
  // ---------------------------------------------------------
  render() {
    console.log('3/7. [Render]: 正在计算生成 Virtual DOM...');
    return (
      <div style={{ border: '2px solid #f0db4f', padding: '20px' }}>
        <h2>经典 Class 生命周期演示</h2>
        <p>计数器: {this.state.count}</p>
        <p>衍生值 (props * 2): {this.state.derivedValue}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          增加计数
        </button>
        <div ref={this.scrollRef} style={{ height: '50px', overflowY: 'scroll' }}>
          内部滚动区域...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 5. 【DOM 快照阶段】(极少使用)
  // 替代了 componentWillUpdate。在真实 DOM 更新前的最后一刹那触发。
  // 作用：截取老 DOM 的状态（比如用户刚好滚动到的像素位置）。
  // ---------------------------------------------------------
  getSnapshotBeforeUpdate(prevProps, prevState) {
    console.log('8. [getSnapshotBeforeUpdate]: 获取老 DOM 快照。');
    if (this.scrollRef.current) {
      // 把当前的滚动位置作为 snapshot 返回给 componentDidUpdate
      return this.scrollRef.current.scrollTop; 
    }
    return null;
  }

  // ---------------------------------------------------------
  // 6. 【挂载完毕阶段】
  // ---------------------------------------------------------
  componentDidMount() {
    console.log('4. 👶 [componentDidMount]: 组件初次挂载到真实 DOM 完毕！');
    console.log('   执行任务：发 Ajax 请求、绑 window 事件、初始化原生图表。');
  }

  // ---------------------------------------------------------
  // 7. 【更新完毕阶段】
  // ---------------------------------------------------------
  componentDidUpdate(prevProps, prevState, snapshot) {
    console.log('9. 🔄 [componentDidUpdate]: 组件更新真实 DOM 完毕！');
    if (snapshot !== null) {
      console.log(`   恢复之前捕获的滚动位置: ${snapshot}px`);
    }
    // 🚨 警告：如果在这里 setState，必须包裹在条件判断里，否则死循环！
    if (this.props.userId !== prevProps.userId) {
      // fetchNewData(this.props.userId);
    }
  }

  // ---------------------------------------------------------
  // 8. 【卸载阶段】
  // ---------------------------------------------------------
  componentWillUnmount() {
    console.log('10. 💀 [componentWillUnmount]: 组件即将从被拔除销毁！');
    console.log('    执行任务：clearInterval(定时器)，removeEventListener！');
  }
}

export default ClassicLifecycleDemo;

```

## 4. Function 组件 + Hooks：一统天下的 `useEffect`

随着 Hooks 的到来，Class 那些碎步般的生命周期被一个无所不能的神器彻底统一：**`useEffect`**。

它不再按时间线去切割生命周期，而是按照**“业务逻辑的副作用”**去组织代码。

### 4.1 模拟 `componentDidMount` (只执行一次)
**秘诀：传入一个空的依赖数组 `[]`。**
```jsx
import { useEffect } from 'react';

function UserList() {
  useEffect(() => {
    // 这里的代码只会在组件第一次出现在屏幕上时，执行唯一的一次！
    fetchData();
  }, []); // 👈 灵魂空数组

  return <div>...</div>;
}
```

### 4.2 模拟 `componentDidUpdate` (响应特定数据变化)
**秘诀：在数组中填入你需要监听的具体状态。**
```jsx
const [userId, setUserId] = useState(1);

useEffect(() => {
  // 当且仅当 userId 的值发生变化时，才会执行这里的重新请求逻辑
  fetchUserData(userId);
}, [userId]); // 👈 精准打击的依赖项
```

### 4.3 模拟 `componentWillUnmount` (擦屁股/清理工作)
**秘诀：在 `useEffect` 中 `return` 一个清理函数。**
```jsx
useEffect(() => {
  // 挂载时开启定时器
  const timer = setInterval(() => console.log('Tick'), 1000);

  // 👈 return 的这个函数，会在组件被销毁前，由 React 自动调用！
  return () => {
    clearInterval(timer);
    console.log('定时器已被安全销毁');
  };
}, []);
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么我的 `setState` 在 `for` 循环或者异步的 `setTimeout` 里表现得不一样？(React 17 vs 18 的惊天差异)
*   **答**：这是关于**批处理 (Batching)** 的高阶问题。
    *   **React 17 及以前**：批处理只有在 React 掌管的合成事件（如 `onClick`）中才有效。如果你把 `setState` 写在了 `setTimeout`、`Promise.then` 或者原生的 `addEventListener` 里，React 管不到它们。此时你连续写 3 个 `setState`，会引发**3次极其卡顿的重复渲染**！
    *   **React 18 伟大革新**：引入了 **Automatic Batching (自动批处理)** 机制。现在，无论你把 `setState` 写在宇宙的哪个角落（定时器、Fetch 回调里），React 都能极其智能地把它们打包拦截，合并成**1次渲染**。性能得到了史诗级提升。

### 5.2 为什么组件每次挂载时，`useEffect` 里的 `console.log` 会打印两次？
*   **答**：这绝对是 React 18 新手踩坑率第一的问题，并非 Bug。
    *   **原因**：你在入口文件使用了 `<React.StrictMode>` (严格模式) 标签。
    *   **机制**：在**开发环境 (Development)** 中，严格模式会故意强制执行一遍：`挂载 -> 立即卸载(执行 return 函数) -> 再次挂载`。
    *   **目的**：逼迫你暴露并修复代码里潜藏的副作用 Bug（比如你如果忘了在 return 里清定时器，就会发现定时器疯狂翻倍）。
    *   **影响**：上线生产环境 (`npm run build`) 后，此行为会自动彻底消失，恢复为执行一次。

### 5.3 为什么 `useEffect` 会导致疯狂的无限死循环 (Maximum update depth exceeded)？
*   **答**：这是由于违背了单向数据流与依赖更新机制。
    *   **致命罪魁祸首 1**：忘了写依赖数组 `[]`。导致每次渲染都会触发 Effect，Effect 里又 `setState` 导致新渲染，光速死循环。
    *   **致命罪魁祸首 2**：在 Effect 里更新了 A，但又把 A 写进了依赖数组。
    *   **致命罪魁祸首 3**：依赖了每次渲染都会被重新创建的对象或函数。
        ```jsx
        // ❌ 错误示范：每次组件重新渲染，options 都会被重新分配一个全新的内存地址！
        // React 浅比对发现 options 地址变了，又去执行 useEffect，死循环！
        const options = { id: 1 }; 
        useEffect(() => { fetch(options) }, [options]); 
        ```
    *   **解法**：把不需要响应式的对象移到组件外部定义，或者使用 `useMemo` / `useCallback` 强行锁死它们的内存地址。

### 5.4 Class 组件的 `this.setState` 和 Hooks 的 `useState` 在合并机制上有什么不同？
*   **答**：
    *   **Class 组件**：`this.setState({ a: 1 })` 是**浅合并 (Merge)**。如果你原本的 state 是 `{ a: 0, b: 2 }`，更新后变成 `{ a: 1, b: 2 }`，`b` 会被自动保留。
    *   **Hooks (`useState`)**：`setObj({ a: 1 })` 是**全量覆盖 (Replace)**。原本的 `b` 会瞬间灰飞烟灭！如果你用 `useState` 管理对象，更新时必须自己手动写展开运算符把旧数据拉过来：`setObj(prev => ({ ...prev, a: 1 }))`。因此在 Hooks 中，更推荐把复杂的对象打散成多个独立的 `useState` 来管理。


## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然直接修改对象和数组这么麻烦，有没有好用的第三方库能帮我？
*   **答**：**有，绝对的神器 `Immer.js`。**
    *   在处理嵌套了五六层的深层对象时，原生的展开运算符 `...` 会让你写出令人窒息的垃圾代码（著名的“展开地狱”）。
    *   `Immer` 暴露出一个 `produce` 代理函数。它允许你**用最习惯的直接修改（Mutate）语法**去操作数据（比如直接 `obj.a.b.c = 1`，直接 `arr.push()`），它会在底层通过 `Proxy` 拦截你的操作，并自动为你生成一个符合 React “不可变性”要求的心全新数据副本。
    *   强烈建议在极度复杂的局部状态管理中配合 `useImmer` hook 使用！

### 4.2 初始化 state 时，如果在 `useState` 里面写了一个极度消耗 CPU 的计算函数会怎样？
*   **答**：**会导致每一次组件重渲染时，这个极其耗时的计算都会被重复执行一遍！**
    *   **错误写法**：`const [data, setData] = useState(computeMassiveData());`
    *   **真相**：虽然 `useState` 只在首次挂载时采用初始值，后续渲染会忽略初始值，但 `computeMassiveData()` 作为函数的**实参**，在每次组件函数重新执行时，它自身都会被毫无意义地空转执行一次，榨干 CPU！
    *   **终极解法 (惰性初始化 Lazy Initialization)**：如果你初始化的数据需要昂贵的计算，**请传入一个函数本身，而不是执行它！**
        ```jsx
        // ✅ 传入函数名或箭头函数。React 只会在首次渲染时执行它一次。
        const [data, setData] = useState(() => computeMassiveData());
        ```

### 4.3 我把一个带有嵌套函数的复杂对象放到 State 里了，为什么页面报错了或者行为极度诡异？
*   **答**：**React 的 State 里绝对不应该存放任何无法被 JSON 序列化的东西！**
    *   **禁忌清单**：不要把带有内部 `this` 指向的类实例对象（如 `new WebSocket()`）、带有闭包的函数、或者巨大的真实原生 DOM 节点放进 State 里！
    *   **原因**：State 是用来描述 UI 数据快照的。当你试图对这些复杂对象进行展开拷贝以实现“不可变更新”时，它们的内部原型链或闭包引用会全部断裂。
    *   **解法**：如果一个数据仅仅是一个在组件生命周期内存活的物理实体（如 WebSocket 实例、定时器 ID），并且**它的改变完全不需要触发页面的重新渲染**，请绝对不要用 `useState`，请把它放进 **`useRef()`** 里面！

### 4.4 为什么我在 Class 组件里写的 `this.setState({ a: 1 })` 能自动保留原来的 `b`，但改成 Hooks `useState` 后 `b` 就不见了？
*   **答**：这是两大范式底层的行为差异，上篇文档有提过，在此着重强调。
    *   **Class 组件的合并机制**：`this.setState` 底层执行的是**浅层合并 (Shallow Merge)**。如果你传了一个只包含部分属性的对象，React 会自动帮你用 `Object.assign` 跟老 state 缝合在一起。
    *   **Hooks 的覆盖机制**：`useState` 底层执行的是**无脑物理覆盖 (Replace)**。它不假设你存的是对象还是数字，你传什么它就替换成什么。所以用 Hooks 时，你必须自己手动展开旧数据 `setObj(prev => ({ ...prev, a: 1 }))`。
