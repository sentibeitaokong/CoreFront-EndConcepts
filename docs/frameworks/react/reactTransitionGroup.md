---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **动画库王者：`react-transition-group`**

## 1. 核心概念与痛点背景

在 React 中实现动画并不容易。因为 React 的核心哲学是**状态驱动视图**：当你通过条件渲染（如 `isShowing && <div>`）将一个元素从 DOM 树中移除时，React 会**瞬间、粗暴且毫不留情地物理拔除该节点**。

官方社区维护了一个极其重要的库：**`react-transition-group`**,主要包含三个极其硬核的核心组件：`CSSTransition`、`SwitchTransition` 和 `TransitionGroup`。

```bash
# 安装
npm install react-transition-group
```

## 2. 核心 API 实战解析

### 2.1 **掌控单元素动画：`CSSTransition`**

这是最基础、最常用的组件。它通过监听内部子元素的挂载/卸载（由 `in` 属性控制），在其生命周期的不同阶段，精准地给真实的 DOM 节点**动态挂载和卸载极其有规律的 CSS 类名**。

```jsx
import { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './fade.css'; // 记得引入你自己写的 CSS

export default function FadeModal() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button onClick={() => setShow(!show)}>切换弹窗</button>

      <CSSTransition
        in={show}         // 控制生死的开关 (true 表示进入，false 表示离开)
        timeout={500}     // 🚨 绝对关键：告诉库这个动画将持续多久，到点必须强制拔除 DOM！
        classNames="fade" // 决定了挂载的 CSS 类名前缀
        unmountOnExit     // 离开动画播放完毕后，是否真的从物理 DOM 树中销毁该节点
        appear            //渐入
        onEnter={el=>console.log('进入过渡')}
        onEntering={el=>console.log('正在过渡')}
        onEntered={el=>console.log('过渡完成')}
        onExit={el=>console.log('准备退出过渡')}
        onExiting={el=>console.log('退出过渡')}
        onExited={el=>console.log('退出过渡完成')}
      >
        {/* CSSTransition 内部只能、且必须紧紧包裹一个物理 DOM 节点 */}
        <div className="modal-box">
          我是带有淡入淡出动画的弹窗
        </div>
      </CSSTransition>
    </div>
  );
}
```

**配合极其严谨的 CSS 文件 (`fade.css`)：**

`CSSTransition` 会在你指定的 `classNames` 前缀后，自动拼接以下生命周期后缀：

```css
/* --- 1. 登场动画阶段 (Enter) --- */
/* 起点：刚被插入 DOM 的第一帧 */
.fade-enter {
  opacity: 0;
  transform: translateY(-20px);
}
/* 过程：下一帧立刻挂载 active，触发 CSS Transition 物理引擎 */
.fade-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 500ms, transform 500ms;
}
/* 终点：动画执行完毕后停留的状态 */
.fade-enter-done {
  opacity: 1;
}

/* --- 2. 离场动画阶段 (Exit) --- */
/* 起点：准备销毁前的瞬间 */
.fade-exit {
  opacity: 1;
}
/* 过程：离场动画的物理引擎 */
.fade-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 500ms, transform 500ms;
}
/* 终点：由于我们配置了 unmountOnExit，所以 exit-done 通常可以不写，节点直接就没了 */
```

### 2.2 掌控两元素交替：`SwitchTransition`

**痛点**：如果你有两个互斥的组件(比如“登录”和“注册”面板,或者一个不断被点击换数字的按钮),你想让旧的元素**先播完消失动画完全消失，新的元素再开始播入场动画**，防止两个元素同时出现在屏幕上导致页面排版撑爆。

`SwitchTransition` 是完美解法。它通过其内部唯一的 `key` 属性来识别元素是否发生了切换。

```jsx
import { useState } from 'react';
import { CSSTransition, SwitchTransition } from 'react-transition-group';

export default function ModeToggle() {
  const [isLoginMode, setIsLoginMode] = useState(true);

  return (
    // mode="out-in": 旧的先出，新的再进。这是最符合人类直觉的模式！
    <SwitchTransition mode="out-in">
      <CSSTransition
        // 🚨 核心魔法：SwitchTransition 监控的就是这个 key！
        // 只要 key 变了，它就拦截旧节点的销毁，强行播一遍 leave 动画！
        key={isLoginMode ? 'login' : 'register'}
        timeout={300}
        classNames="fade"
      >
        <button onClick={() => setIsLoginMode(!isLoginMode)}>
          {isLoginMode ? '我是登录按钮' : '我是注册按钮'}
        </button>
      </CSSTransition>
    </SwitchTransition>
  );
}
```

### 2.3 掌控海量列表：`TransitionGroup`

当面临由 `.map()` 渲染出来的、随时会被插入和删除的**长列表（如 Todo List）**时,`in` 属性就废了(因为你不可能给列表里的一万条数据每人都配一个 `show` 状态变量)。

`TransitionGroup` 会自动管理其内部所有子 `CSSTransition` 的 `in` 状态。只要检测到子元素被移除，它就会自动拦下，触发离场动画。

```jsx
import { useState } from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export default function TodoList() {
  const [items, setItems] = useState([
    { id: 1, text: '学习 React' },
    { id: 2, text: '学习动画' }
  ]);

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    // 渲染为一个原生的 <ul> 标签
    <TransitionGroup component="ul" className="todo-list">
      {items.map(({ id, text }) => (
        // 🚨 铁律：在 Group 中，CSSTransition 必须绑定唯一的 key！
        // 绝对不能自己写 in 属性了，Group 会接管生死大权。
        <CSSTransition key={id} timeout={500} classNames="fade">
          <li className="todo-item">
            {text}
            <button onClick={() => removeItem(id)}>删除</button>
          </li>
        </CSSTransition>
      ))}
    </TransitionGroup>
  );
}
```

## 3. 常见问题 (FAQ) 与避坑指南

### 3.1 致命报错：`findDOMNode is deprecated in StrictMode` 怎么解决？
*   **答**：这是使用该库最臭名昭著的 React 18+ 兼容性警告。
    *   **原因**：该库的底层历史极度悠久。在早年，它依赖 React 极其底层的、已被废弃的 `findDOMNode` API 来从组件内部“暴力”扒出真实的 DOM 节点以便挂载 CSS 类名。而 React 的严格模式已经全线封杀了这个 API。
    *   **终极解法 (使用 `nodeRef`)**：如果你包裹的是自定义组件，或者严格模式报错。你必须自己创建一个 `useRef` 钩住真实的 DOM，并把这个 ref **同时**传给你的 DOM 元素和 `CSSTransition` 的 `nodeRef` 属性。
    ```jsx
    const nodeRef = useRef(null);
    return (
      // 明确告诉 CSSTransition：别去猜了，真实的 DOM 在这个箱子里！
      <CSSTransition nodeRef={nodeRef} in={show} timeout={200} classNames="fade">
        <div ref={nodeRef}>我的动画不会报黄字警告了</div>
      </CSSTransition>
    );
    ```

### 3.2 为什么我的离开 (Exit) 动画死活不执行，元素瞬间就消失了？
*   **答**：这是新手犯错率最高的坑，通常有两大元凶：
    1.  **没有配置 `unmountOnExit` 但又乱用了 `v-if` 的思维**：如果你在 `CSSTransition` 外面或者里面自己手写了 `{show && <div/>}`。当 `show` 变假时，React 直接连根拔起了整个 DOM 树，`CSSTransition` 根本来不及反应。**正确的做法是永远只改变 `in` 属性，并配上 `unmountOnExit`，让库自己去销毁 DOM。**
    2.  **CSS 权重被覆盖了**：你写的 `.fade-exit-active` 里面写了 `opacity: 0`，但你原来这个 `<div className="my-box">` 里写了死死的 `opacity: 1 !important` 或者拥有更高优先级的选择器。导致动画类名虽然挂上去了，但样式被覆盖了。

### 3.3 为什么动画执行完毕后，页面还会卡顿一下，或者样式错乱？
*   **答**：**你的 `timeout` 时间和你在 CSS 里写的 `transition duration` 没对齐！**
    *   **原理**：`timeout={500}` 是 `CSSTransition` 的“倒计时炸弹”。它才不管你 CSS 动画有没有播完，只要 500 毫秒一到，它就会无情地把挂载的 `.fade-enter-active` 剥离，或者把整个节点从 DOM 里拔除！
    *   如果你 CSS 里写了 `transition: opacity 1s`，但 timeout 写了 500。动画播到一半，元素突然就被强行拔除了，画面极其突兀。
    *   **黄金准则**：`timeout` 设定的毫秒数，**必须必须绝对**大于或等于你所有相关 CSS 属性中最长的那个 `transition` 或 `animation` 持续时间。

### 3.4 Vue 里的 `<transition-group>` 有一个神仙般的 `v-move` 平滑移动算法，React 这个库有吗？
*   **答**：**很遗憾，并没有内置。**
    *   Vue 的 `<transition-group>` 底层内置了极其复杂的 FLIP 动画引擎，当你删除列表第一项时，底下的项会自动平滑地“滑”上去填补空缺。
    *   React 的 `TransitionGroup` 仅仅负责帮你触发“进入和离开”的透明度/缩放动画。至于剩下的元素怎么排版，它完全不管，底层元素会“瞬间”跳上去。
    *   **高级解法**：如果在 React 中你想实现极其丝滑的列表拖拽、移动填补重排动画，建议直接放弃这个基础库，**转向更加现代且霸道的顶级 React 物理动画引擎：`Framer Motion` (使用它的 `<AnimatePresence>` 和 `layout` 属性) 或 `AutoAnimate`**。
