---
outline: # 这个页面将显示 h2 和 h3 标题
---

# **[`useInsertionEffect`](https://zh-hans.react.dev/reference/react/useInsertionEffect): CSS-in-JS 库的专属 Hook 与避免布局抖动的利器**

在现代 Web 前端工程化中，CSS-in-JS 库（如 Styled-Components, Emotion）允许开发者在运行时动态生成和注入样式。然而，随着 React 18 并发渲染（Concurrent Rendering）的引入，传统的在组件生命周期中注入 `<style>` 标签的做法，极易引发严重的性能问题——“布局抖动”（Layout Thrashing）。

`useInsertionEffect` 正是 React 18 专门为解决“动态样式注入时机”和“避免浏览器重复计算布局”而推出的极度底层的专属 Hook。

## 1. 核心概念与基础语法

```js
useInsertionEffect(setup, dependencies?)
```

### 1.1 基本定义与应用场景

`useInsertionEffect` 的签名与 `useEffect` 完全一致，但它的执行时机极其超前：它在 React 对 DOM 进行任何突变（mutations，如添加、修改、删除节点）**之前**同步触发。

**核心应用场景**：仅限于 CSS-in-JS 库作者用于在读取布局或真实 DOM 更新前，将全局 `<style>` 标签或 CSS 规则注入到文档中。

```jsx
import { useInsertionEffect } from 'react';

// 假设这是一个极简的 CSS-in-JS 库底层 Hook
function useCSS(rule) {
  // 1. 调用 useInsertionEffect 确保在 DOM 变更前注入样式
  useInsertionEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = rule;
    document.head.appendChild(style);

    // 2. 组件卸载或规则变化时的清理逻辑
    return () => {
      document.head.removeChild(style);
    };
  }, [rule]); // 依赖数组控制重新注入的时机
}

function DynamicButton() {
  // 此时样式注入逻辑被安全地包裹在 useInsertionEffect 中
  useCSS('.my-btn { color: red; background: black; }');
  return <button className="my-btn">点击我</button>;
}
```

## 2. 核心进阶：解决动态样式的“布局抖动”（Layout Thrashing）难题

在 React 18 之前，很多底层库使用 `useLayoutEffect` 来注入样式。但在现代浏览器的渲染机制下，这成为了一个致命的性能瓶颈。

### 2.1 痛点场景：强制同步布局（Forced Synchronous Layout）

**痛点场景**：当 React 更新组件时，如果我们在 `useLayoutEffect` 中插入新的 CSS 规则，此时 React 已经修改了真实的 DOM。浏览器发现 DOM 变了，正准备计算元素的布局（Layout）位置。这时你突然向 `<head>` 塞入了一段新的 `<style>`，浏览器不得不**作废刚刚基于旧样式建立的布局树，重新拉取新样式再计算一遍所有元素的几何信息**。如果多个组件同时发生这种情况，就会导致极其卡顿的“布局抖动”。

**解决原则**：**将样式的注入时机提前到 React 修改任何原生 DOM 节点之前！使用 `useInsertionEffect` 完美避开二次计算。**

```jsx
// ❌ 错误示范 (性能噩梦)：在 DOM 已经变更后才注入样式
function BadCSSInjection({ rule }) {
  useLayoutEffect(() => {
    // 此时 React 已经把组件更新写进 DOM，浏览器正准备计算布局
    // 此时插入 style 会强迫浏览器推翻重来，消耗大量性能
    injectStyle(rule); 
  }, [rule]);
  return <div className="dynamic-box">内容</div>;
}

// ✅ 正确示范 (高性能)：在 DOM 变更前注入
function GoodCSSInjection({ rule }) {
  useInsertionEffect(() => {
    // 在 React 碰触原生 DOM 之前，样式就已经就绪了
    // 浏览器后续计算布局时，直接使用包含此规则的最新样式树
    injectStyle(rule); 
  }, [rule]);
  return <div className="dynamic-box">内容</div>;
}
```

## 3. 高阶进阶：严格的限制条件与边界死穴

### 3.1 突破死穴：为什么它不能替代普通的 Effect？

**痛点场景**：很多开发者看到它执行得很早，就试图把一些需要“尽早执行”的逻辑（比如读取 DOM 尺寸、提早发网络请求、甚至更新状态）塞进 `useInsertionEffect`。这会导致应用直接崩溃、无限死循环或读取到陈旧的脏数据。

**解决原则**：**深刻理解它的执行环境。在 `useInsertionEffect` 执行时，当前的 UI 更新都还在 React 的内存（Virtual DOM）中，原生 DOM 根本还没有应用这些更新。**

```jsx
import { useInsertionEffect, useRef, useState } from 'react';

function InvalidUsage() {
  const divRef = useRef(null);
  const [count, setCount] = useState(0);

  useInsertionEffect(() => {
    // ❌ 绝对禁止：此时 divRef.current 还是旧的，甚至是初次渲染的 null
    // console.log(divRef.current.clientWidth);

    // ❌ 绝对禁止：不能在这里触发状态更新，会导致无限渲染循环
    // setCount(c => c + 1);

    // ✅ 黄金法则：这里只能做一件事 -> 往文档中插入全局的 <style> 标签或规则
    document.head.appendChild(createStyle());
  }, []);

  return <div ref={divRef}>测试节点</div>;
}
```

## 4. 深入理解：useInsertionEffect 与其他 Effect 的区别

### 4.1 执行时机对比

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

### 4.2 关键区别

- **`useInsertionEffect` 不能访问 DOM 引用**：因为它在 DOM 变更之前运行，此时 DOM 节点尚未更新，所以不应该读取或操作真实的 DOM 元素（例如通过 ref）。这是它与 `useLayoutEffect` 和 `useEffect` 的重要区别。
- **主要用于插入样式**：它的唯一合理用途就是插入样式。如果你需要读取布局或执行其他副作用，应该使用 `useLayoutEffect` 或 `useEffect`。


## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 普通的业务线开发需要用到 `useInsertionEffect` 吗？
*   **答**：**绝对不需要！这是最常见的过度设计与新人误区。**
    *   React 官方文档明确强调：这个 Hook 是专门提供给 CSS-in-JS 库（如 Emotion, Styled-Components 等）的作者使用的。
    *   如果你在写普通的业务组件，写 Tailwind CSS、CSS Modules 或者普通的 SASS/LESS，你完全不需要关注动态注入 `<style>` 标签的底层逻辑。
    *   **避坑方案**：日常业务开发中，凡是遇到副作用，首选 `useEffect`；如果遇到需要读取 DOM 尺寸并同步调整位置以避免画面闪烁的问题，请使用 `useLayoutEffect`。把 `useInsertionEffect` 留给底层框架建设者。

### 5.2 它在服务器端渲染（SSR）环境中会执行吗？
*   **答**：**不会执行。**
    *   与 `useEffect` 和 `useLayoutEffect` 一样，`useInsertionEffect` 仅仅是一个客户端 Hook，只会在浏览器环境中运行。
    *   在服务器端渲染期间，由于根本没有真实的 DOM API（如 `document.createElement`），React 会直接忽略它。
    *   **避坑方案**：CSS-in-JS 库在处理 SSR 时，通常需要另外一套机制（在 Node 端收集用到的样式，并作为字符串拼接到返回的 HTML `<head>` 中），而 `useInsertionEffect` 仅仅负责客户端水合（Hydration）及后续 SPA 路由跳转时的动态样式注入。

### 5.3 `useInsertionEffect`、`useLayoutEffect` 和 `useEffect` 的精确执行顺序是怎样的？
*   **答**：**这是深刻理解 React 渲染管线机制的核心重点。**
    *   针对同一个组件，它们的执行顺序严格如下：
        1.  **`useInsertionEffect`**：执行。此时 React 还没把最新的 Virtual DOM 渲染到真实 DOM 上（此时你注入样式）。
        2.  **DOM 突变（DOM Mutations）**：React 将差异（Diff）更新到真实的 DOM 节点上。
        3.  **`useLayoutEffect`**：执行。此时原生 DOM 已经更新完毕，但浏览器**还没有**把画面绘制（Paint）到屏幕上（此时你可以读取真实 DOM 的尺寸并同步调整）。
        4.  **浏览器绘制（Browser Paint）**：用户在屏幕上看到了最新的画面更新。
        5.  **`useEffect`**：执行。画面已经出来了，React 在后台异步执行网络请求、事件监听等不阻塞视觉的逻辑。

