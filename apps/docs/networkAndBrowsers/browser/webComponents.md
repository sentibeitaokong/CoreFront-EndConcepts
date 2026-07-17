# Web Components 组件化原生标准

Web Components 是浏览器原生的组件化标准，通过封装可复用、样式隔离的 UI，实现跨框架的组件交互。其核心由 **Custom Elements**、**Shadow DOM** 与 **HTML Template** 三大技术栈构成。

## 1. 自定义元素

通过 JavaScript 定义新的 HTML 标签。所有自定义元素必须包含短横线（如 `my-card`），以防与原生标签冲突。

```javascript
class UserCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<article><h3>Jane</h3><p>Engineer</p></article>`
  }
}
customElements.define('user-card', UserCard)

//使用方式
//<user-card></user-card>
```

### 1.1 生命周期钩子

Custom Element 常见生命周期：

| 方法                       | 触发时机           |
| :------------------------- | :----------------- |
| `constructor`              | 元素实例创建       |
| `connectedCallback`        | 元素插入文档       |
| `disconnectedCallback`     | 元素从文档移除     |
| `attributeChangedCallback` | 监听的属性变化     |
| `adoptedCallback`          | 元素被移动到新文档 |

监听属性需要声明 `observedAttributes`：

```js
class UserBadge extends HTMLElement {
  static get observedAttributes() {
    return ['name']
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'name') {
      this.textContent = newValue
    }
  }
}

customElements.define('user-badge', UserBadge)
```

## 2. 样式与结构隔离

Shadow DOM 将组件的 DOM 树封装在一个独立的影子根 (Shadow Root) 中，实现真正的样式隔离。

```javascript
class AppButton extends HTMLElement {
  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <style>
        button {
          border: 0;
          padding: 8px 12px;
          background: #1677ff;
          color: white;
        }
      </style>
      <button><slot></slot></button>
    `
  }
}

customElements.define('app-button', AppButton)

// 使用方式
// <app-button>保存</app-button>
```

- **隔离性**：外部 CSS 无法穿透，内部 CSS 无法污染外部，DOM 结构默认不可见。
- **Mode**：`open` 允许外部通过 `element.shadowRoot` 访问，`closed` 则完全封闭。

## 3. 插槽与模版

### 3.1 插槽

`slot` 用于占位，允许外部向组件内部注入内容：

- **具名插槽**：匹配 `slot="title"` 属性的内容。

```html
<!--组件内部-->
<header>
  <slot name="title"></slot>
</header>
<main>
  <slot></slot>
</main>

<!--组件调用-->
<user-panel>
  <h2 slot="title">用户信息</h2>
  <p>这里是主体内容</p>
</user-panel>
```

- **默认插槽**：接收所有未命名的直接子元素。

```html
<!--组件内部-->
<header>
  <slot></slot>
</header>

<!--组件调用-->
<user-panel>
  <p>这里是主体内容</p>
</user-panel>
```

### 3.2 模版

`template` 定义了不立即渲染的 HTML 结构，加载时资源不执行，渲染时通过 `cloneNode(true)` 实例化，是复用静态结构的最佳实践。

```html
<template id="card-template">
  <style>
    .card {
      border: 1px solid #ddd;
      padding: 12px;
    }
  </style>
  <div class="card">
    <slot></slot>
  </div>
</template>
```

在组件中使用：

```js
const template = document.querySelector('#card-template')

class AppCard extends HTMLElement {
  constructor() {
    super()

    const shadow = this.attachShadow({ mode: 'open' })
    shadow.append(template.content.cloneNode(true))
  }
}

customElements.define('app-card', AppCard)
```

`template.content` 是 `DocumentFragment`，使用时通常需要 `cloneNode(true)`。

## 4. 样式穿透与主题开放

Shadow DOM 的强隔离性有时会阻碍主题定制，需使用标准接口进行暴露,`::part` 适合明确开放组件内部某些节点的样式控制权。

| 方案         | 语义                                                   | 外部用法                        |
| ------------ | ------------------------------------------------------ | ------------------------------- |
| **CSS 变量** | `button { background: var(--app-button-bg, #1677ff) }` | `app-btn { --var-name: red; }`  |
| **`::part`** | `<button part="button">Save</button>`                  | `app-btn::part(button) { ... }` |

## 5. 架构级评估：Web Components vs 成熟框架

| 特性         | Web Components       | Vue / React 组件         |
| ------------ | -------------------- | ------------------------ |
| **依赖**     | 原生浏览器 API       | 依赖框架运行时           |
| **样式隔离** | 原生 Shadow DOM 隔离 | CSS Modules / CSS-in-JS  |
| **复用性**   | 跨框架全局兼容       | 仅限特定框架生态         |
| **状态管理** | 弱（需手写响应式）   | 强（内置高效响应式系统） |

## 6. 最佳实践建议

- **命名规范**：组件名统一加业务前缀，如 `xb-button`。
- **生命周期清理**：在 `disconnectedCallback` 中及时清理事件监听或定时器，防止内存泄漏。
- **性能平衡**：对复杂、强交互的业务逻辑（如表单校验、复杂数据同步），优先选用 Vue/React；针对跨框架的设计系统（Design System）、微前端基础组件、或嵌入式微部件，Web Components 是首选方案。
- **混合开发**：利用 Web Components 构建基础 UI 库，使其在 React/Vue 项目中都能作为普通 HTML 标签无缝使用，实现“**一次编写，处处运行**”。
