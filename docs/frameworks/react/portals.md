---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Portals 传送门

## 1. 核心概念与痛点背景

> **痛点场景：被“困住”的全屏弹窗 (Modal)**
> 假设你在一个被嵌套了 10 层的子组件 `UserForm` 里，写了一个 `<Modal>这是一个弹窗</Modal>`。
> 按照常规渲染，这个弹窗的物理 DOM 会深深地嵌在这 10 层 `<div>` 里。
>
> **灾难爆发：** 如果这 10 层祖先元素中，有任何一个元素设置了 **`overflow: hidden`**、**`z-index`**、或者 **`transform` / `filter`**，你的“全屏居中弹窗”就会瞬间被“斩断”（被父级容器裁切掉），或者无论你怎么设置 `z-index: 9999`，它都无法盖住其他同级的高层级元素。

**`React Portals` (传送门)** 就是为了拯救这个物理层级冲突而生的。
它的核心魔法是：**在组件逻辑上，它依然属于 React 树中原本的位置（享受 Props 传递、Context 共享、事件冒泡）；但在物理 DOM 上，它可以瞬间将自己的渲染产物“传送”到 HTML 文档的任意其他位置（比如直接塞进最外层的 `<body>` 里）。**

| 典型应用场景 | 详细说明 |
| :--- | :--- |
| **全局弹窗 (Modal / Dialog)** | 强制将弹窗 DOM 渲染到 `<body>` 底部，彻底摆脱所有父级 CSS 的层叠上下文束缚，确保遮罩层覆盖全屏。 |
| **跟随式悬浮框 (Tooltip / Popover)** | 当触发元素在一个有局部滚动条 (`overflow: scroll`) 的容器内时，将悬浮框传送到外部可以避免被裁切和强行滚动。 |
| **抽屉菜单 (Drawer)** | 从屏幕边缘滑出的侧边栏。 |
| **跨环境/微前端渲染** | 将 React 渲染的内容插入到并非由当前 React 根节点管理的、另一个第三方老旧代码（如 jQuery）生成的 DOM 节点内部。 |


## 2. 核心 API 与实战用法

React 提供了一个极其简单的顶层 API 来实现传送门：**`createPortal(children, domNode, [key])`**。

它接收两个必传参数：
* **`children`**：任何可渲染的 React 节点（如一段 JSX、一个组件）。
* **`domNode`**：一个已经存在于 HTML 页面中的**原生、真实的 DOM 节点**（传送的目的地）。

### 2.1 基础实战：实现一个工业级的 Modal 组件

**步骤 1：在 `index.html` 中预留坑位（目的地）**
通常我们在 `id="root"` 旁边留一个专门的坑位，方便管理所有传送过来的漂浮物。
```html
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
  
  <!-- 🕳️ 这里是专门给所有弹窗预留的降落坑位 -->
  <div id="modal-root"></div>
</body>
```

**步骤 2：编写 Modal 传送门组件**
```jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css'; // 里面写 fixed 全屏样式

function Modal({ children, isOpen, onClose }) {
  // 如果没打开，返回 null 阻止渲染
  if (!isOpen) return null;

  // 核心代码：使用 createPortal 将 UI 传送到目的地！
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      {/* 阻止点击内容区时触发外层的 onClose 关闭弹窗 */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose} className="close-btn">关闭</button>
      </div>
    </div>,
    // 目的地：直接抓取 html 里事先写好的真实节点
    document.getElementById('modal-root')
  );
}

export default Modal;
```

**步骤 3：在深层业务组件中随意召唤它**
```jsx
import { useState } from 'react';
import Modal from './Modal';

export default function DeepWidget() {
  const [showModal, setShowModal] = useState(false);

  return (
    // 假设这个容器有着极其恶心的 overflow: hidden 和低 z-index 限制
    <div className="widget" style={{ overflow: 'hidden', position: 'relative', zIndex: 1 }}>
      <button onClick={() => setShowModal(true)}>
        在深渊中呼唤弹窗
      </button>

      {/* 逻辑上它写在这里，但物理上它的 DOM 将飞出这个 div 的限制！ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>我是逃脱物理束缚的自由弹窗！</h2>
        <p>你永远不用担心我被父级的 overflow 裁切掉。</p>
      </Modal>
    </div>
  );
}
```

## 3. 高阶魔法：事件冒泡的神奇穿透

这是 Portals 最伟大（也最令人迷惑）的设计。

当组件的物理 DOM 被传送到几万光年外的 `body` 里时，如果你在这个弹窗里点击了一个按钮，**它的点击事件会冒泡到哪里？**

按浏览器原生的物理法则，它会冒泡给 `body`。
但 React 合成事件系统在此刻展现了神迹：**事件的冒泡，会严格遵循 React 组件树的“逻辑层级”，而不是 DOM 树的“物理层级”！**

```jsx
import { createPortal } from 'react-dom';

export default function App() {
  // 1. 父组件在这里监听所有的点击事件
  const handleParentClick = () => {
    console.log('✅ 抓到了！弹窗被点击了！');
  };

  return (
    // 逻辑父节点
    <div onClick={handleParentClick} style={{ border: '2px solid red', padding: 20 }}>
      <h1>我是逻辑上的父亲</h1>
      <p>虽然我儿子物理上飞到了 body 里，但他打碎了杯子，依然会冒泡通知我！</p>
      
      {createPortal(
        <button>点击我 (物理 DOM 在 root 外面)</button>,
        document.body
      )}
    </div>
  );
}
```
**意义**：这种“逻辑连通、物理隔离”的设计，保证了哪怕你使用了传送门，React 的所有数据流（Props）和事件流（Event Bubbling）依然是一个完整的闭环，极大地降低了心智负担。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 既然都传送到外部了，组件原来的 `useEffect` 还能正常执行吗？
*   **答**：**完完全全正常执行！**
    *   `createPortal` 仅仅是改变了最终生成的真实 DOM 的挂载位置。
    *   该组件**完全保留**在原本的 React 虚拟 DOM 树（Fiber Tree）结构中。它的生命周期（挂载、更新、卸载）、它从外部接收的 Props、它内部调用的 Hooks，统统与普通组件一模一样，没有任何区别。当你卸载这个逻辑组件时，它在远端的物理 DOM 也会被 React 干净利落地清空。

### 4.2 传送到外部的弹窗，还能使用 Context 里提供的数据（比如当前的主题颜色）吗？
*   **答**：**绝对没问题！**
    *   理由同上。因为逻辑层级没断，所以在组件树上游的 `ThemeProvider` 广播出的 Context 数据，这颗虽然在物理上流落在外的“私生子”节点，依然可以毫无障碍地通过 `useContext` 接收到。这也是 Portal 比你自己写个纯 JS 在外部创建 DOM 高级一万倍的地方。

### 4.3 为什么页面报错 `Target container is not a DOM element`？
*   **答**：这是使用 Portal 新手最常踩的时序坑。
    *   **原因**：你传给 `createPortal` 的第二个参数（目标 DOM 节点）是 `null` 或 `undefined`。
    *   **场景 1 (拼写错误)**：你用 `document.getElementById('modal-root')`，但是你的 `index.html` 里根本没写这个标签，或者拼写错了。
    *   **场景 2 (SSR 服务端渲染)**：如果你使用的是 Next.js。在服务端渲染阶段，**Node.js 环境里根本没有 `document` 对象！** 如果组件在首次渲染时直接调用 `createPortal`，会当场崩溃。
    *   **SSR 终极避坑指南**：在 SSR 项目中，必须确保 `createPortal` 只在**浏览器端挂载后 (Mounted)** 才执行。
    ```jsx
    import { useState, useEffect } from 'react';
    import { createPortal } from 'react-dom';

    function SafeModal({ children }) {
      const [mounted, setMounted] = useState(false);

      useEffect(() => {
        // 这个 effect 只会在客户端浏览器环境中执行
        setMounted(true);
        // 🚨 记得组件卸载时将 overflow 恢复，防止页面滚动条永久消失
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
      }, []);

      // 首次服务端渲染时，安全地返回 null
      if (!mounted) return null;

      return createPortal(
        <div className="modal">{children}</div>,
        document.getElementById('modal-root')
      );
    }
    ```

### 4.4 为什么我不直接往 body 里写 `position: fixed`，还要费劲巴拉用 Portal？`fixed` 不也是脱离文档流吗？
*   **答**：这是一个极其深刻的 CSS 面试题。
    *   很多人以为写了 `position: fixed`，元素就绝对相对浏览器视口定位了，就能无敌覆盖全屏。**错！**
    *   **CSS 层叠上下文陷阱 (Stacking Context)**：一旦这个 `fixed` 元素的任何一个祖先节点设置了 `transform` (哪怕是 `transform: translate(0,0)`), `perspective`, `filter`，或者开启了硬件加速 (`will-change: transform`)，**这个原本该相对于视口的 `fixed` 元素，它的定位基准就会瞬间降级，强行变成了相对于那个加了特殊属性的祖先元素定位！**
    *   此时它的坐标全乱了，且它的 `z-index` 将永远无法超越那个祖先容器。
    *   **终极解法**：如果你要写绝对安全、绝对无敌的全屏弹窗，**只有将物理 DOM 彻底用 Portal 搬出那个被污染的祖先容器**，直接丢到 `body` 底下，才是前端工程界唯一的标准答案。

### 4.5 我有很多个不同的弹窗组件同时触发了 `createPortal` 传送到同一个 `#modal-root` 里，会互相覆盖导致只有最后一个能显示吗？
*   **答**：**绝对不会覆盖，而是会优雅地追加 (Append)。**
    *   React 内部的 `createPortal` 处理逻辑极其成熟。它允许无数个 `<Teleport>` 实例瞄准同一个目标容器。
    *   它们的真实物理 DOM 会按照组件挂载时间的先后顺序，依次被追加 (append) 到目标容器的内部。这就是为什么你可以放心地在各个业务页面里随时呼出全局 Toast 提示，它们会自动在你的 `#toast-container` 里按照先后顺序整齐地排成一长列。
