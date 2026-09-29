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

**`customElements` 高频静态方法：**

[width(37,63)]

| 方法                           | 说明                                                   |
| ------------------------------ | ------------------------------------------------------ |
| `define(name, ctor, options?)` | 注册元素；**同名重复注册会抛 `NotSupportedError`**     |
| `get(name)`                    | 取出已注册的构造函数，未注册返回 `undefined`           |
| `whenDefined(name)`            | 返回 Promise，注册完成时 resolve（**懒加载组件必用**） |
| `upgrade(root)`                | 手动升级子树里已存在的未注册元素                       |
| `getName(ctor)`                | 反查构造函数对应的标签名                               |

**命名与注册的高频坑：**

- 标签名必须**全小写且含短横线**，不能是 `font-face`、`annotation-xml` 等保留名。
- 元素**先出现在 DOM、后注册**也能工作，注册时浏览器会把已存在的标签「升级」（upgrade）成自定义元素。所以异步加载的组件会**短暂呈现为空标签**，用 `:defined` 伪类先藏起来：
- 一个标签名只能注册一次，想换实现得换名字，或用 `get()` 判断后再 `define()`。

```css
user-card:not(:defined) {
  display: none; /* 未升级前不显示空白占位，避免「闪一下」 */
}
```

### 1.1 生命周期钩子

Custom Element 常见生命周期：

[width(33,67)]

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

**生命周期的高频坑：**

- **`constructor` 里别碰属性、子节点和样式**：此时元素尚未升级完成，规范也要求构造函数不带参数、不读 DOM。初始化一律放到 `connectedCallback`。
- **`attributeChangedCallback` 先于 `connectedCallback` 触发**：解析 HTML 时先设属性、后入文档，所以别依赖两者顺序，写成幂等的初始化最稳。
- **`connectedCallback` 会被调用多次**：元素被移出再插回（排序、移动节点）就会重触发，监听器、定时器、请求都要做「只绑一次」的标记。
- **`disconnectedCallback` 不等于「已卸载」**：元素被移动时同样会触发，随后还会再 `connected`。真要判断彻底移除，得再查一次 `this.isConnected`。
- **`observedAttributes` 必须是 `static get`**：写成实例属性或普通方法都不会生效；`observedAttributes` 里没列出的属性变化不触发回调。
- **改 property 不触发回调**：`el.name = 'x'` 走的是 JS 属性，只有 `setAttribute('name', 'x')` 才会触发 `attributeChangedCallback`——这是「属性和特性」两套系统。

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
- **事件也受隔离**：阴影内派发的 `CustomEvent` 默认**不穿出**阴影边界，外部监听不到——必须带 `composed: true`（还要 `bubbles: true` 才会冒泡到外层）：

```js
// 组件内部：不写 composed 的话，外层 addEventListener 收不到
this.dispatchEvent(
  new CustomEvent('change', {
    detail: { value: this.value },
    bubbles: true, // 允许冒泡
    composed: true, // 允许穿过 Shadow DOM 边界
  }),
)
```

**`attachShadow()` 配置项：**

[width(32,68)]

| 选项                        | 说明                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `mode`                      | `'open'` 暴露 `element.shadowRoot`；`'closed'` 完全不暴露（内部仍可 `this.shadowRoot` 访问） |
| `delegatesFocus`            | `true` 时点击阴影内任意位置会把焦点交给第一个可聚焦子元素（自定义输入控件必开）              |
| `slotAssignment`            | `'named'`（默认）或 `'manual'` 手动分配子节点给插槽                                          |
| `clonable` / `serializable` | 是否允许 `cloneNode()` 复制阴影内容 / `getHTML()` 序列化（较新）                             |

**Shadow Root 常用成员：**

[width(38,62)]

| 成员                            | 说明                                                                       |
| ------------------------------- | -------------------------------------------------------------------------- |
| `shadowRoot.host`               | 反向拿到宿主元素，组件内部要「往上找」时用                                 |
| `shadowRoot.querySelector()`    | 查阴影内节点（外部 `document.querySelector` 查不到）                       |
| `shadowRoot.adoptedStyleSheets` | 挂载**可复用的构造样式表**，多实例共享同一份规则，不必每个实例塞 `<style>` |
| `shadowRoot.mode` / `innerHTML` | 模式、整体替换内容                                                         |

```js
// 设计系统常用：一份 CSSStyleSheet 被成百上千个实例共享，省内存也支持动态改样式
const sheet = new CSSStyleSheet()
sheet.replaceSync(`button { border: 0; padding: 8px 12px; }`)

class XbButton extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [sheet]
  }
}
```

### 2.1 表单关联：`ElementInternals`

原生表单元素之外的自定义控件（自定义开关、评分、日期选择器）默认**不被 `<form>` 认领**，`FormData` 里拿不到值。加上 `formAssociated` 并配合 `ElementInternals` 才能像原生控件一样参与表单：

[width(48,52)]

| 成员                                             | 作用                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `static formAssociated = true`                   | **必须声明**，否则表单完全无视该元素                  |
| `this.attachInternals()`                         | 在 `constructor` 中调用一次，拿到 `internals`         |
| `internals.setFormValue(value, state?)`          | 把值写进 `FormData` / `form.elements`，随表单一起提交 |
| `internals.setValidity(flags, message, anchor?)` | 参与 `checkValidity()`，实现自定义校验消息            |
| `internals.form` / `labels` / `name` / `type`    | 与表单、`<label>` 的联动元数据                        |

```js
class XbInput extends HTMLElement {
  static formAssociated = true // 关键：不写这句，表单不认它

  constructor() {
    super()
    this.internals = this.attachInternals()
    const shadow = this.attachShadow({ mode: 'open', delegatesFocus: true })
    shadow.innerHTML = `<input />`
    shadow.querySelector('input').addEventListener('input', e => {
      this.internals.setFormValue(e.target.value) // 同步给表单
    })
  }

  get value() {
    return this.internals.form
      ? new FormData(this.internals.form).get(this.name)
      : ''
  }
}
```

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

**插槽的高频 API 与坑：**

[width(29,71)]

| 成员 / 事件                                   | 说明                                                       |
| --------------------------------------------- | ---------------------------------------------------------- |
| `<slot>默认内容</slot>`                       | 没有内容插进来时显示的兜底内容（fallback）                 |
| `slotchange` 事件                             | 插槽**分配的子节点发生变化**时触发（增删、换 `slot` 属性） |
| `slot.assignedElements()` / `assignedNodes()` | 取出实际分配进来的节点（**只含直接子级，不含嵌套**）       |
| `element.assignedSlot`                        | 反查某个子节点被分到了哪个插槽                             |
| `::slotted(选择器)`                           | 从组件内部给**被插入的顶层节点**加样式                     |

```js
// 场景：插槽内容变化时重新计算布局（如自适应高度的标签栏）
const slot = this.shadowRoot.querySelector('slot')
slot.addEventListener('slotchange', () => {
  const items = slot.assignedElements() // 拿到真正插进来的元素
  this.toggleAttribute('empty', items.length === 0)
})
```

> **两个易错点**：`slotchange` 只在**分配关系**变化时触发，插槽内容自身的属性变化（改文字、改 class）**不会**触发它——那些要用 `MutationObserver`（见 [MutationObserver](/networkAndBrowsers/browser/observerApi/mutationObserver)）；`assignedNodes()` 默认不含文本节点，需要 `{ flatten: true }` 时才会把回退内容和文本也算进来。

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

**由外向内（外部定制组件）：**

[width(19,39,42)]

| 方案              | 语义                                                 | 外部用法                           |
| ----------------- | ---------------------------------------------------- | ---------------------------------- |
| **CSS 变量**      | 开放「可调参数」，粒度最细、也最稳                   | `app-btn { --app-button-bg: red }` |
| **`::part`**      | 组件显式用 `part="button"` 开放某个节点的样式控制权  | `app-btn::part(button) { ... }`    |
| **`exportparts`** | 嵌套组件把内层的 part 再导出给最外层（多层封装必用） | `<inner-btn exportparts="button">` |
| **`::slotted()`** | 定制**从外部插进来**的节点样式                       | `user-panel::slotted(h2) { ... }`  |

**由内向外（组件感知环境）：**

[width(29,71)]

| 选择器                                 | 作用                                                    |
| -------------------------------------- | ------------------------------------------------------- |
| `:host`                                | 选中宿主元素自身（默认 `display: inline`，常需显式改）  |
| `:host(.active)` / `:host([disabled])` | 按宿主的类名 / 特性切换样式                             |
| `:host-context(.dark)`                 | 按**祖先环境**适配主题（Chromium 支持较好，慎用于跨端） |
| `:defined`                             | 元素完成升级后才生效，用于避免加载前样式闪烁            |

```css
/* 组件内部：默认样式 + 按宿主状态调整 + 允许外部用变量覆盖 */
:host {
  display: inline-block;
}
:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
}
:host-context(.theme-dark) button {
  background: #222;
}
button {
  background: var(--app-button-bg, #1677ff); /* 约定暴露的变量名 */
}
```

**高频场景**：设计系统里通常约定「**颜色 / 间距用 CSS 变量开放，结构节点用 `::part` 开放**」——变量能覆盖属性值，`::part` 能覆盖整条规则，两者组合足以应付绝大多数主题定制；实在要改的节点没开放 `part`，就应该回去改组件，而不是想办法破坏隔离。

## 5. 架构级评估：Web Components vs 成熟框架

[width(13,27,60)]

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

### 6.1 与 React / Vue 混用

把自定义元素当**原生 DOM 节点**对待，就不会踩坑：简单数据走 attribute，复杂数据走 property，事件走 `addEventListener`。

[width(16,84)]

| 差异点                   | 说明                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **attribute 只传字符串** | 传对象、数组、函数必须走 **property**（`el.data = {...}`）；写成 `data="{...}"` 只会得到字符串                               |
| **React 18 及以前**      | 不认识自定义元素：复杂属性被 `toString()` 成 `[object Object]`，`onXxx` 也不自动绑定，需 `ref` + `addEventListener` 手动处理 |
| **React 19 起**          | 原生支持：对象 / 数组作为 property 传入，`onXxx` 自动转为事件监听                                                            |
| **Vue**                  | 需在 `compilerOptions.isCustomElement` 里放行，否则告警「未知组件」；传对象要用 `.prop` 修饰符                               |
| **插槽**                 | React 的 `children`、Vue 的默认插槽内容都会变成原生子节点，效果与 `<slot>` 预期一致                                          |

```javascript
// Vue / Vite：让编译器把 xb- 开头的标签当原生元素，而不是 Vue 组件
vue({
  template: {
    compilerOptions: {
      isCustomElement: tag => tag.startsWith('xb-'),
    },
  },
})
```

## 7. 常见问题 (FAQ)

### 7.1 为什么我给自定义元素写的样式「不生效」？

- **样式写在阴影内、选择器指向外部**：内部样式表只能命中阴影内节点，想选宿主用 `:host`，想选插进来的内容用 `::slotted()`。
- **外部想选阴影内节点**：普通选择器一律无效，只能用 CSS 变量或 `::part()`。
- **`:host` 没写 `display`**：自定义元素默认是 `display: inline`，设了宽高也不生效，记得 `:host { display: block }`。
- **元素还没升级**：脚本没加载完时标签就是个普通空元素，配合 `:not(:defined)` 处理。

### 7.2 `attachShadow()` 报错：`Shadow root cannot be created on this element`？

不是所有标签都能挂 Shadow DOM。浏览器**不允许**在 `a`、`form`、`input`、`select`、`textarea`、`img`、`video`、`iframe` 等已有复杂原生行为的标签上创建阴影根（避免破坏原生 UI）。

修法：自定义元素**继承 `HTMLElement` 而不是**继承 `HTMLInputElement` 之类的内置类；需要一个内部输入框就在阴影里创建一个真实的 `<input>`（配合 `ElementInternals` 参与表单）。

### 7.3 `attributeChangedCallback` 为什么不触发？

- **没声明 `static get observedAttributes`**：只有列在里面的属性才会被观察，且必须是静态 getter。
- **改的是 property 不是 attribute**：`el.name = 'x'` 不触发，`el.setAttribute('name', 'x')` 才触发。
- **属性在注册前就设好了**：升级时不一定会补发回调（不同浏览器行为有差异），所以初始化逻辑要在 `connectedCallback` 里再读一次当前属性值兜底。

### 7.4 为什么框架里传给自定义元素的对象变成了 `[object Object]`？

因为框架把对象当成了 **HTML attribute** 来设置，而 attribute 的值只能是字符串。React 19 之前、以及 Vue 的 `:prop` 写法都可能出现。修法就是显式走 property：React 中通过 `ref` 赋值 `el.data = obj`，Vue 中用 `.prop` 修饰符。

### 7.5 组件在页面上总「闪一下空白」是怎么回事？

典型的**升级时机**问题：HTML 已经渲染出来了，但定义组件的脚本还没加载执行，此时它只是个没有内容的空标签。两种处理：

- 用 `:not(:defined) { display: none }` 先把未升级的标签藏起来。
- 给出占位尺寸（`min-height` 或骨架屏），避免升级后撑开导致布局跳动（CLS）。

### 7.6 组件内派发的事件，外层为什么监听不到？

事件默认**不穿过 Shadow DOM 边界**。构造 `CustomEvent` 时要同时给 `bubbles: true`（能冒泡）和 `composed: true`（能穿出阴影），外层才能用 `addEventListener` 收到：

```js
this.dispatchEvent(
  new CustomEvent('xb-change', {
    detail: value,
    bubbles: true,
    composed: true,
  }),
)
```

如果外部想「监听属性变化」而不是事件，也可以用 `MutationObserver` 观察宿主的 attribute。

### 7.7 Web Components 能像 Vue / React 那样自动响应状态更新吗？

**不能**。标准只提供 DOM 封装能力，没有响应式系统，改数据后要**自己调用更新逻辑**（通常是在 setter 里 `this.render()`，或在 `attributeChangedCallback` 里更新）。要接近框架体验，可选：

- 手写极简 setter + 更新方法，适合小组件；
- 使用 **Lit** 这类薄封装库，它基于 Web Components 标准补充了响应式与模板能力，产出的仍是原生自定义元素。
