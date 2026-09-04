# DOM 操作进阶

在了解了 [DOM 基础概念](/html/basic/domAttributes)（节点选择、`appendChild`、`innerHTML` 等）之后，本文聚焦**现代 DOM 操作 API**——它们更简洁、更语义化、性能更好，是告别「手动拼 HTML 字符串」的关键一步。

**一句话理解**：**「现代 DOM API 用 `before/after/replaceWith` 等动词直接表达意图，用 `DocumentFragment` 批量提交，用 `classList/dataset` 优雅管理样式与数据。」**

## 1. 现代节点操作 API

ES6+ 与 DOM 标准新增了一批「动词化」方法，取代繁琐的 `appendChild` + `insertBefore`：

```html
<div id="list">
  <p id="first">第一项</p>
</div>
```

```javascript
const list = document.getElementById('list')
const p = document.getElementById('first')

// 在 p 之前插入
p.before('<p>插入到前面</p>') // 支持 HTML 字符串
// 在 p 之后插入
p.after('<p>插入到后面</p>')

// 替换 p 自身
p.replaceWith('<p>替换后的内容</p>')

// 删除 p 自身
p.remove()
```

### 1.1 新旧 API 对照

| 旧 API                        | 现代 API             | 语义            |
| ----------------------------- | -------------------- | --------------- |
| `parent.insertBefore(n, ref)` | `ref.before(n)`      | 插入到 ref 之前 |
| `parent.appendChild(n)`       | `ref.after(n)`       | 插入到 ref 之后 |
| `parent.replaceChild(n, old)` | `old.replaceWith(n)` | 替换节点        |
| `parent.removeChild(child)`   | `child.remove()`     | 删除节点        |

### 1.2 一次清空所有子节点：`replaceChildren()`

```javascript
list.replaceChildren() // 清空
list.replaceChildren('<p>全新内容</p>') // 替换全部子节点
```

### 1.3 相邻位置插入：`insertAdjacentElement` / `insertAdjacentText`

```javascript
p.insertAdjacentElement('beforebegin', newEl) // 插入元素
p.insertAdjacentText('afterend', '纯文本') // 插入文本（不解析 HTML）
```

## 2. 插入 HTML 的多种姿势

| 方法 / 属性                  | 行为                                      | 性能                                 |
| ---------------------------- | ----------------------------------------- | ------------------------------------ |
| `innerHTML`                  | 解析并**替换**元素全部子内容。            | 全量重解析，较差（且会丢失绑定事件） |
| `insertAdjacentHTML(pos, s)` | 在指定位置插入 HTML，**不重建**已有节点。 | 更好，保留原节点                     |
| `textContent`                | 设置纯文本，不解析 HTML。                 | 安全、快                             |

`insertAdjacentHTML` 的 `position` 参数：

| 位置          | 插入到哪                     |
| ------------- | ---------------------------- |
| `beforebegin` | 元素自身之前（作为兄弟节点） |
| `afterbegin`  | 元素第一个子节点之前         |
| `beforeend`   | 元素最后一个子节点之后       |
| `afterend`    | 元素自身之后（作为兄弟节点） |

```javascript
list.insertAdjacentHTML('beforeend', '<p>追加到末尾</p>')
```

> 安全提醒：`innerHTML` / `insertAdjacentHTML` 会解析 HTML，**不可直接插入用户输入**，否则有 [XSS](/webSecurity/csrfAndXss) 风险。

## 3. `<template>` 标签：原生 HTML 模板

`<template>` 内的内容**不会立即渲染**，可随时克隆后插入，是干净的「HTML 模板」方案：

```html
<template id="row-tpl">
  <tr>
    <td class="name"></td>
    <td class="age"></td>
  </tr>
</template>
```

```javascript
const tpl = document.getElementById('row-tpl')
const clone = tpl.content.cloneNode(true) // 克隆模板内容
clone.querySelector('.name').textContent = 'xunbei'
document.querySelector('tbody').appendChild(clone)
```

## 4. `DocumentFragment`：批量操作的性能利器

频繁操作 DOM（如循环插入 1000 个节点）会触发大量回流，性能极差。`DocumentFragment` 是一个「**内存中的临时容器**」，先把节点拼装好，再一次挂载到页面：

```javascript
const fragment = document.createDocumentFragment()

for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li')
  li.textContent = `第 ${i} 项`
  fragment.appendChild(li) // 只操作内存，不触发回流
}

list.appendChild(fragment) // 一次性挂载，只回流一次
```

### 4.1 为什么 fragment 能提升性能？

- `fragment` 是「游离」节点，不在文档树中，操作它**不触发回流**。
- 一次性 `appendChild(fragment)` 时，fragment 的所有子节点一次性进入文档，只触发一次回流。
- 相比「每条 `appendChild` 都回流」，性能提升显著。

## 5. 节点遍历

| 属性                     | 返回           | 说明                  |
| ------------------------ | -------------- | --------------------- |
| `parentNode`             | 父节点         | 含文本/注释等所有节点 |
| `parentElement`          | 父元素         | 仅元素节点            |
| `children`               | 子元素集合     | 仅元素，不含文本节点  |
| `childNodes`             | 子节点集合     | 含文本/注释节点       |
| `firstElementChild`      | 第一个子元素   | 跳过文本节点          |
| `lastElementChild`       | 最后一个子元素 | 跳过文本节点          |
| `previousElementSibling` | 前一个兄弟元素 | 跳过文本节点          |
| `nextElementSibling`     | 后一个兄弟元素 | 跳过文本节点          |

> 记忆口诀：带 `Element` 的**只看元素**，不带 `Element` 的**包含所有节点**（含换行产生的文本节点）。

### 5.1 节点类型 (nodeType)

| nodeType | 常量                 | 含义     |
| -------- | -------------------- | -------- |
| 1        | `Node.ELEMENT_NODE`  | 元素节点 |
| 3        | `Node.TEXT_NODE`     | 文本节点 |
| 8        | `Node.COMMENT_NODE`  | 注释节点 |
| 9        | `Node.DOCUMENT_NODE` | 文档节点 |

## 6. `classList` 与 `dataset`

### 6.1 `classList`：优雅管理类名

```javascript
const el = document.querySelector('.box')

el.classList.add('active')
el.classList.remove('active')
el.classList.toggle('active') // 有则删，无则加
el.classList.toggle('active', true) // 强制添加（第二个参数）
el.classList.contains('active') // 判断是否存在
el.classList.replace('old', 'new') // 替换
```

### 6.2 `dataset`：读写自定义数据属性

```html
<div id="user" data-id="42" data-role="admin"></div>
```

```javascript
const user = document.getElementById('user')

user.dataset.id // "42"
user.dataset.role // "admin"
user.dataset.name = 'xunbei' // 等价于 data-name="xunbei"
delete user.dataset.role // 删除 data-role
```

> 注意：`data-foo-bar` 会映射为 `dataset.fooBar`（驼峰命名）。

## 7. 克隆节点

```javascript
const clone = el.cloneNode(true) // true 深克隆（含子节点），false 只克隆自身
```

**坑点**：`cloneNode` 不会复制元素上通过 JS `addEventListener` 绑定的事件（HTML 内联 `onclick` 除外）。

## 8. 创建元素的性能对比

| 方式                            | 性能 | 适用场景           |
| ------------------------------- | ---- | ------------------ |
| `createElement` + `textContent` | 最快 | 纯文本、需绑定事件 |
| `<template>` + `cloneNode`      | 快   | 复杂结构复用       |
| `innerHTML`                     | 慢   | 简单一次性赋值     |
| 字符串拼接 + `innerHTML`        | 中   | 大批量、无需事件   |

## 9. 常见问题 (FAQ)

### 9.1 为什么 `innerHTML` 添加的内容丢失了事件绑定？

因为 `innerHTML` 会**销毁并重建**所有子节点，原有 DOM 节点上的 JS 事件随之消失。改用 `insertAdjacentHTML` 或「先 `createElement` 再绑定事件再 `appendChild`」可避免。

### 9.2 批量插入列表为什么卡顿？

循环里逐条 `appendChild` 会触发大量回流。解决：用 `DocumentFragment` 一次性挂载，或使用 [虚拟列表](/performanceOptimization/virtualList) 只渲染可见项。

### 9.3 `children` 和 `childNodes` 数量为何不一样？

`childNodes` 包含文本节点（HTML 中的换行、缩进都是文本节点），`children` 只统计元素节点。因此一个带换行的 `<ul>`，其 `childNodes.length` 通常大于 `children.length`。

### 9.4 `textContent` 和 `innerText` 有什么区别？

- `textContent`：获取**所有**文本（含 `display: none` 和 `<script>`/`<style>` 内容），不触发布局。
- `innerText`：只获取**可见**文本，会触发回流，性能较差。**优先用 `textContent`**。

## 10. 总结

- 优先用现代 API：`before/after/replaceWith/remove/replaceChildren`，语义清晰。
- 批量插入用 `DocumentFragment`，复杂结构用 `<template>`，避免频繁回流。
- 管理类名用 `classList`，读数据用 `dataset`。
- 插入 HTML 注意 XSS，切勿直接拼用户输入。
