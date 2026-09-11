# HTML 自定义数据属性 `data-*`

HTML5 引入的自定义数据属性 `data-*`，允许开发者在标准 HTML 元素上**存储额外的私有数据**，无需借助非标准属性或在 DOM 上挂额外字段。它为「HTML 与 JavaScript 之间传递数据」提供了标准化的通道，常用于组件配置、事件委托、状态标记等场景。

## 1. 语法规则

### 1.1 命名规则

`data-*` 属性名需满足以下规则：

[width(11,89)]

| 规则       | 说明                                                                                |
| :--------- | :---------------------------------------------------------------------------------- |
| **前缀**   | 必须以 `data-` 开头。                                                               |
| **字符集** | `data-` 后可由小写字母、数字、连字符 `-`、点 `.`、冒号 `:`、下划线 `_` 组成。       |
| **小写**   | **不能包含大写字母**（HTML 属性名不区分大小写，`data-Foo` 会被解析为 `data-foo`）。 |
| **推荐**   | 建议用连字符分隔（kebab-case），如 `data-user-id`，与 `dataset` API 配合最好。      |

```html
<article
  id="electric-cars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars"
>
  ...
</article>
```

### 1.2 值的类型

**`data-*` 的值只能是字符串**。所有非字符串都会被隐式转成字符串。取用时需自行 `Number()` 或 `JSON.parse()` 还原类型。

```html
<div data-count="5" data-active="false"></div>
```

```js
const el = document.querySelector('div')
el.dataset.count // "5"（字符串，不是数字！）
el.dataset.active // "false"（字符串，不是布尔值！）
```

## 2. JavaScript 访问方式

共有三种方式访问 `data-*`，各有优劣。

### 2.1 `getAttribute()` / `setAttribute()`（通用方式）

可以读写**任何** HTML 属性，包括 `data-*`，但需要写完整的 `data-` 前缀。

```js
const article = document.getElementById('electric-cars')

// 读取
const columns = article.getAttribute('data-columns') // "3"

// 写入
article.setAttribute('data-columns', '5')

// 删除
article.removeAttribute('data-columns')
```

### 2.2 `dataset` API（推荐）

`dataset` 是 `HTMLElement` 上的只读属性，返回一个 **`DOMStringMap`** 对象，包含元素上所有 `data-*` 属性的键值对。

**核心规则：kebab-case → camelCase**。`data-` 后面的连字符命名会转成驼峰命名：

```js
const article = document.getElementById('electric-cars')

// 读取（注意驼峰）
article.dataset.indexNumber // "12314"（对应 data-index-number）

// 写入
article.dataset.parent = 'automobiles'

// 动态新增（会立即反映到 DOM 属性上）
article.dataset.newAttribute = 'some-value' // 生成 data-new-attribute="some-value"

// 删除
delete article.dataset.parent // 移除 data-parent 属性
```

### 2.3 三种访问方式对比

[width(22,22,27,29)]

| 方式             | 语法                        | 类型转换                  | 是否同步到 DOM 属性     |
| :--------------- | :-------------------------- | :------------------------ | :---------------------- |
| `getAttribute()` | `el.getAttribute('data-x')` | 无（字符串）              | ✅ 读写即属性           |
| `el.dataset.x`   | `el.dataset.x`              | 无（字符串）              | ✅ 读写即属性           |
| jQuery `.data()` | `$el.data('x')`             | **自动转换**（`"3"`→`3`） | ❌ 写入不更新 HTML 属性 |

## 3. CSS 中的使用

### 3.1 属性选择器

```css
article[data-columns='3'] {
  column-count: 3;
}

article[data-parent='cars'] {
  border: 1px solid #ccc;
}
```

### 3.2 `attr()` 函数（配合伪元素）

```css
/* 把 data-label 的值直接作为内容显示 */
.tooltip::after {
  content: attr(data-label);
}
```

## 4. 实战场景

### 4.1 事件委托 + `data-id`（最常见）

列表渲染时把 ID 存在 `data-*` 里，配合**事件委托**只需绑定一个监听器：

```html
<ul class="list">
  <li><button data-id="1" class="del">删除</button></li>
  <li><button data-id="2" class="del">删除</button></li>
  <li><button data-id="3" class="del">删除</button></li>
</ul>
```

```js
document.querySelector('.list').addEventListener('click', e => {
  const btn = e.target.closest('[data-id]') // 找到带 data-id 的元素
  if (!btn) return
  const id = btn.dataset.id // 拿到 id
  console.log('删除 id =', id)
})
```

### 4.2 组件状态标记（配合 CSS）

用 `data-state` 承载组件状态，样式与逻辑解耦：

```html
<button class="menu" data-state="closed">菜单</button>
```

```js
const menu = document.querySelector('.menu')
menu.addEventListener('click', () => {
  const isOpen = menu.dataset.state === 'open'
  menu.dataset.state = isOpen ? 'closed' : 'open'
})
```

```css
.menu[data-state='open'] {
  background: #eee;
}
```

### 4.3 前端框架中的使用

- **Vue**：直接用 `:data-*` 绑定。
  ```html
  <div :data-id="item.id" :data-active="item.active"></div>
  ```
- **React**：`data-*` 直接作为 JSX 属性传递。
  ```jsx
  <div data-id={item.id} data-testid="list-item" />
  ```

## 5. 常见问题（FAQ）与避坑指南

### 5.1 不要在 `data-*` 里存敏感信息

`data-*` 的值**在 HTML 源码中明文可见**。切勿存密码、API Key、个人隐私等敏感数据——任何人都能「查看源代码」看到。

### 5.2 `dataset` 取出的值都是字符串

```js
el.dataset.count // "5"，不是数字 5
el.dataset.active // "false"，不是布尔 false
```

**解法**：`Number(el.dataset.count)`、`el.dataset.active === 'true'`，或用 `JSON.parse`。

### 5.3 命名里不能有大写字母

HTML 属性名**不区分大小写**，浏览器会把 `data-FooBar` 解析为 `data-foobar`，导致你在 `dataset.fooBar` 里取不到值。**务必全小写 + 连字符**。

### 5.4 性能：避免在 `data-*` 里塞大数据

每个 `data-*` 都会增大 HTML 体积，影响首屏加载。**大型数据集应放外部文件/接口**，`data-*` 只放轻量标识（ID、key、枚举状态）。

### 5.5 为什么推荐用 `data-` 前缀而不是自定义属性？

`data-` 前缀是 W3C **保留的扩展机制**：未来 HTML 标准新增的属性绝不会以 `data-` 开头，因此你的自定义属性**永远不会与未来标准冲突**。裸的自定义属性（如 `<div myattr="x">`）则可能撞名且不合法。
