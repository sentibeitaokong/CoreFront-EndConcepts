# React useInsertionEffect

## 1. 概览：什么是 useInsertionEffect？

`useInsertionEffect` 是 React 18 引入的一个新的 Hook，其设计目的是为 **CSS-in-JS 库作者**提供一个专用的钩子，用于在 React 对 DOM 进行变更之前插入样式规则。

### 1.1 核心作用
- **提前插入样式**：允许在 React 渲染阶段之后、更新 DOM 之前，将 `<style>` 标签或样式规则插入到 DOM 中。
- **服务于 CSS-in-JS 库**：主要面向 styled-components、Emotion 等库的开发者，用于解决在并发渲染模式下插入样式可能引发的闪烁问题。
- **性能优化**：确保在浏览器绘制之前样式已经就位，避免无样式内容闪烁（FOUC）。

### 1.2 为什么需要它？
在 React 18 的并发渲染中，渲染可以被中断和恢复。如果样式插入发生在 `useLayoutEffect` 或 `useEffect` 中，可能会出现样式在布局计算之后才注入的情况，导致用户看到未样式化的内容，然后突然变化。

`useInsertionEffect` 的时机比 `useLayoutEffect` 更早，它发生在 React 对 DOM 进行变更**之前**，因此适合插入样式，确保 DOM 更新后样式立即可用。

## 2. API 语法与基本使用

### 2.1 基本语法

```jsx
import { useInsertionEffect } from 'react';

function useCSS(rule) {
  useInsertionEffect(() => {
    // 在这里插入 <style> 标签或动态生成 CSS
    const style = document.createElement('style');
    style.textContent = rule;
    document.head.appendChild(style);
    
    return () => {
      style.remove(); // 清理
    };
  }, [rule]);
}
```

### 2.2 API 速览

| 特性 | 说明 |
| :--- | :--- |
| **签名** | `useInsertionEffect(setup, dependencies?)` |
| **参数** | `setup`：包含副作用逻辑的函数，可返回清理函数；`dependencies`：依赖数组 |
| **执行时机** | **在 DOM 变更之前**，但在所有 DOM 更新被提交到屏幕之前同步执行 |
| **调用位置** | 只能在组件顶层或自定义 Hook 中调用 |
| **适用人群** | **CSS-in-JS 库作者**，普通应用开发者几乎不需要直接使用 |

### 2.3 基础使用示例：动态插入全局样式

```jsx
import { useInsertionEffect } from 'react';

function GlobalStyle() {
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        margin: 0;
        padding: 0;
        font-family: sans-serif;
      }
    `;
    document.head.appendChild(style);
    
    return () => style.remove();
  }, []);
  
  return null; // 不渲染任何内容
}
```

## 3. 深入理解：useInsertionEffect 与其他 Effect 的区别

### 3.1 执行时机对比

| Hook | 执行时机 | 适用场景 |
| :--- | :--- | :--- |
| **`useInsertionEffect`** | React 更新 DOM **之前**，但在所有 DOM 变更被提交到屏幕前同步执行 | 插入全局 `<style>` 标签或动态生成 CSS |
| **`useLayoutEffect`** | React 更新 DOM **之后**，但在浏览器绘制之前同步执行 | 读取布局（如测量元素尺寸）、同步触发重绘 |
| **`useEffect`** | 浏览器绘制之后异步执行 | 数据获取、订阅、手动修改 DOM（不阻塞视觉更新） |

**示例：**
```
1. React 触发渲染
2. React 计算 DOM 更新
3. useInsertionEffect 执行（可插入样式）
4. React 将 DOM 更新应用到浏览器
5. useLayoutEffect 执行（可读取布局）
6. 浏览器绘制屏幕
7. useEffect 执行
```

### 3.2 关键区别

- **`useInsertionEffect` 不能访问 DOM 引用**：因为它在 DOM 变更之前运行，此时 DOM 节点尚未更新，所以不应该读取或操作真实的 DOM 元素（例如通过 ref）。这是它与 `useLayoutEffect` 和 `useEffect` 的重要区别。
- **主要用于插入样式**：它的唯一合理用途就是插入样式。如果你需要读取布局或执行其他副作用，应该使用 `useLayoutEffect` 或 `useEffect`。

## 4. 实战案例：CSS-in-JS 库的内部实现

假设你正在编写一个简化版的 CSS-in-JS 库，需要在组件挂载时动态生成样式并插入到文档中。

```jsx
import { useInsertionEffect, useRef } from 'react';

// 模拟一个简单的 CSS-in-JS 解决方案
function useStyle(cssRules) {
  const styleRef = useRef(null);
  
  useInsertionEffect(() => {
    // 如果还没有 style 元素，则创建
    if (!styleRef.current) {
      styleRef.current = document.createElement('style');
      document.head.appendChild(styleRef.current);
    }
    
    // 更新样式内容
    styleRef.current.textContent = cssRules;
    
    return () => {
      // 清理：从 DOM 中移除 style 元素
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [cssRules]);
}

// 在组件中使用
function Button({ children }) {
  useStyle(`
    .btn {
      padding: 8px 16px;
      background: blue;
      color: white;
    }
  `);
  
  return <button className="btn">{children}</button>;
}
```

在这个例子中，`useInsertionEffect` 确保了样式在组件对应的 DOM 元素被添加到页面之前就已经存在，从而避免了无样式内容闪烁。

## 5. 常见问题 (FAQ)

### 5.1 普通应用开发者需要使用 useInsertionEffect 吗？

**答**：**几乎不需要**。`useInsertionEffect` 是为 CSS-in-JS 库作者设计的高级 Hook。如果你在使用现成的 CSS-in-JS 库（如 styled-components），库内部已经处理了样式插入逻辑。你只需要按照库的 API 编写样式即可，无需直接调用 `useInsertionEffect`。

如果你正在编写自定义样式管理方案，并且遇到了并发渲染下的样式闪烁问题，那么可以考虑使用它。否则，请坚持使用 `useEffect` 或 `useLayoutEffect`。

### 5.2 可以用 useInsertionEffect 来读取 DOM 布局吗？

**答**：**不可以**。`useInsertionEffect` 执行时，DOM 节点尚未更新，因此通过 ref 获取的 DOM 节点仍然是旧的，或者可能还未挂载。尝试读取布局会导致错误的值或抛出异常。

**准则**：`useInsertionEffect` 仅用于插入样式，不应用于任何涉及 DOM 读取或操作的其他用途。

### 5.3 useInsertionEffect 和 useLayoutEffect 哪个更适合动态插入样式？

**答**：**是的，对于样式插入，`useInsertionEffect` 是更优选择**。

-   **并发模式兼容性**：`useInsertionEffect` 是专门为并发渲染设计的，能够确保样式在正确的时机插入，避免闪烁。
-   **性能优势**：`useInsertionEffect` 比 `useLayoutEffect` 触发更早，且它不会阻塞浏览器绘制（虽然两者都是同步的，但 `useInsertionEffect` 发生在 DOM 变更前，而 `useLayoutEffect` 发生在变更后，理论上 `useInsertionEffect` 对布局计算的影响更小）。

如果你正在开发一个 CSS-in-JS 库，建议迁移到 `useInsertionEffect`。如果你在使用第三方库，请确保库的版本已经支持 React 18 并内部使用了 `useInsertionEffect`。

### 5.4 在 useInsertionEffect 中可以触发状态更新吗？

**答**：**技术上可以，但强烈不推荐**。

-   `useInsertionEffect` 是同步执行的，如果在其中触发状态更新，可能会导致额外的渲染，甚至引发无限循环。
-   更糟糕的是，由于它在 DOM 变更之前运行，触发状态更新可能会打乱 React 的渲染流程，导致不可预测的行为。

**建议**：不要在 `useInsertionEffect` 中执行状态更新。如果需要在样式插入后执行某些操作，应该放在 `useLayoutEffect` 或 `useEffect` 中。

### 5.5 为什么 useInsertionEffect 的清理函数是在组件卸载时执行，而不是在每次重新渲染前？

**答**：与 `useEffect` 和 `useLayoutEffect` 类似，`useInsertionEffect` 的清理函数在以下时机执行：

-   **组件卸载时**：执行清理。
-   **依赖项变化导致重新执行 setup 前**：先执行上一次的清理函数，再执行新的 setup。

这意味着如果你在 `useInsertionEffect` 中插入了 `<style>` 标签，当依赖项变化时，旧的样式会被移除，新的样式会被插入，从而保证样式始终与最新的规则同步。

### 5.6 在服务器端渲染（SSR）中，useInsertionEffect 会执行吗？

**答**：**`useInsertionEffect` 不会在服务器端执行**。它只在客户端运行。

对于 SSR 场景，CSS-in-JS 库通常需要在服务端收集样式，并将其注入到生成的 HTML 中（例如作为 `<style>` 标签内联在 head 中），以便客户端能够看到正确样式化的内容。这通常通过库提供的服务端渲染 API（如 `styled-components` 的 `ServerStyleSheet`）来实现。

在客户端水合（hydration）时，库可能会使用 `useInsertionEffect` 来管理后续的动态样式更新，但初始样式已经在服务端生成并嵌入 HTML 中。

### 5.7 我可以多次调用 useInsertionEffect 吗？

**答**：**可以**，与 `useEffect` 类似，你可以在一个组件中多次调用 `useInsertionEffect` 来处理不同的样式规则。React 会按照它们在组件中定义的顺序依次执行它们。

但是，请确保你确实有合理的理由拆分它们。通常，将所有样式逻辑合并到一个 `useInsertionEffect` 调用中即可。

### 5.8 如何测试 useInsertionEffect 中的逻辑？

**答**：测试 `useInsertionEffect` 中的逻辑需要模拟 DOM 环境（如使用 Jest 的 `jsdom`）。你可以渲染使用了该 Hook 的组件，然后断言样式元素是否被正确插入到 document 中。

例如，使用 React Testing Library：

```jsx
import { render } from '@testing-library/react';
import { MyStyledComponent } from './MyStyledComponent';

test('inserts style tag', () => {
  render(<MyStyledComponent />);
  
  // 检查是否存在我们预期的 style 标签
  const styleTag = document.querySelector('style[data-testid="my-style"]');
  expect(styleTag).toBeInTheDocument();
  expect(styleTag.textContent).toContain('.btn { background: blue; }');
});
```



