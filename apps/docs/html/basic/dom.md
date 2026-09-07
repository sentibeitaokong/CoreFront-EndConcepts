# DOM 操作

文档对象模型（DOM）是 HTML 和 XML 文档的编程接口。它将文档解析为一个由节点和对象（包含属性和方法）组成的结构，通常是一个树状结构。简单来说，DOM 就像一座桥梁，连接了网页和脚本语言（主要是 JavaScript），让我们可以通过编程来改变文档的结构、样式和内容。

**一句话理解**：**「现代 DOM API 用 `before/after/replaceWith` 等动词直接表达意图，用 `DocumentFragment` 批量提交，用 `classList/dataset` 优雅管理样式与数据。」**

## 1. DOM API 概览

DOM API 是由一系列的接口（方法和属性）组成的，它允许我们对 HTML 元素进行增删改查等操作。这是一个由 W3C 和 WHATWG 共同制定的标准，并被现代浏览器广泛支持。

### 1.1 节点选择（获取元素）

要操作一个元素，首先需要获取它。DOM 提供了多种选择元素的方法：

| 方法                                | 描述                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `getElementById(id)`                | 通过元素的 `id` 属性获取一个元素节点。                 |
| `getElementsByTagName(tagName)`     | 通过标签名获取一个元素节点列表 (HTMLCollection)。      |
| `getElementsByClassName(className)` | 通过类名获取一个元素节点列表 (HTMLCollection)。        |
| `querySelector(selector)`           | 通过 CSS 选择器获取匹配的第一个元素节点。              |
| `querySelectorAll(selector)`        | 通过 CSS 选择器获取匹配的所有元素节点列表 (NodeList)。 |

### 1.2 节点操作

获取到元素节点后，我们就可以对它们进行各种操作了。

**1. 创建和添加节点**

| 方法                                   | 描述                                         |
| -------------------------------------- | -------------------------------------------- |
| `createElement(tagName)`               | 创建一个新的元素节点。                       |
| `createTextNode(text)`                 | 创建一个新的文本节点。                       |
| `appendChild(node)`                    | 将一个节点添加到指定父节点的子节点列表末尾。 |
| `insertBefore(newNode, referenceNode)` | 在指定的已有子节点之前插入一个新节点。       |

**2. 删除和替换节点**

| 方法                               | 描述             |
| ---------------------------------- | ---------------- |
| `removeChild(child)`               | 删除一个子节点。 |
| `replaceChild(newChild, oldChild)` | 替换一个子节点。 |

**3. 修改节点内容**

| 属性          | 描述                                       |
| ------------- | ------------------------------------------ |
| `innerHTML`   | 获取或设置一个元素内部的 HTML 内容。       |
| `textContent` | 获取或设置一个元素及其所有后代的文本内容。 |

**4. 修改节点属性**

| 方法/属性                            | 描述                             |
| ------------------------------------ | -------------------------------- |
| `getAttribute(attributeName)`        | 获取指定属性的值。               |
| `setAttribute(attributeName, value)` | 设置指定属性的值。               |
| `removeAttribute(attributeName)`     | 移除指定的属性。                 |
| `dataset`                            | 访问元素的 `data-*` 自定义属性。 |

**5. 修改节点样式**

| 属性        | 描述                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `style`     | 通过 `style` 属性可以直接读写元素的内联样式，例如 `element.style.color = 'red'`。                                       |
| `classList` | 通过 `classList.add()`, `classList.remove()`, `classList.toggle()` 等方法来操作元素的类名，这也是推荐的修改样式的方式。 |

## 2. 现代节点操作 API

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

### 2.1 新旧 API 对照

| 旧 API                        | 现代 API             | 语义            |
| ----------------------------- | -------------------- | --------------- |
| `parent.insertBefore(n, ref)` | `ref.before(n)`      | 插入到 ref 之前 |
| `parent.appendChild(n)`       | `ref.after(n)`       | 插入到 ref 之后 |
| `parent.replaceChild(n, old)` | `old.replaceWith(n)` | 替换节点        |
| `parent.removeChild(child)`   | `child.remove()`     | 删除节点        |

### 2.2 一次清空所有子节点：`replaceChildren()`

```javascript
list.replaceChildren() // 清空
list.replaceChildren('<p>全新内容</p>') // 替换全部子节点
```

### 2.3 相邻位置插入：`insertAdjacentElement` / `insertAdjacentText`

```javascript
p.insertAdjacentElement('beforebegin', newEl) // 插入元素
p.insertAdjacentText('afterend', '纯文本') // 插入文本（不解析 HTML）
```

## 3. 插入 HTML 的多种姿势

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

## 4. `<template>` 标签：原生 HTML 模板

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

## 5. `DocumentFragment`：批量操作的性能利器

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

### 5.1 为什么 fragment 能提升性能？

- `fragment` 是「游离」节点，不在文档树中，操作它**不触发回流**。
- 一次性 `appendChild(fragment)` 时，fragment 的所有子节点一次性进入文档，只触发一次回流。
- 相比「每条 `appendChild` 都回流」，性能提升显著。

## 6. 节点遍历

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

## 7. `classList` 与 `dataset`

### 7.1 `classList`：优雅管理类名

```javascript
const el = document.querySelector('.box')

el.classList.add('active')
el.classList.remove('active')
el.classList.toggle('active') // 有则删，无则加
el.classList.toggle('active', true) // 强制添加（第二个参数）
el.classList.contains('active') // 判断是否存在
el.classList.replace('old', 'new') // 替换
```

### 7.2 `dataset`：读写自定义数据属性

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

## 8. 克隆节点

`cloneNode(deep)` 用于复制一个节点，返回一个「游离」的副本——它**还没有被插入文档树**，需要手动挂载后才能看到效果：

```javascript
const el = document.getElementById('card')
const clone = el.cloneNode(true) // 深克隆：连同所有后代节点一起复制
const shallow = el.cloneNode(false) // 浅克隆：只复制自身，不含任何子节点
```

> 无论深克隆还是浅克隆，都会**完整复制节点自身的属性**（`class`、`id`、`data-*`、内联 `style` 等）。

### 8.1 复制内容

`cloneNode` 复制的是**节点的属性和结构**，而不是**JS 运行时挂在它上面的东西**。

| 会复制                                                           | 不会复制                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------ |
| 所有 HTML 属性及其值（`class`、`id`、`data-*` 等）               | 通过 `addEventListener` 绑定的 JS 事件监听器           |
| 内联样式 `style="..."` 与内联事件处理器（HTML 里写的 `onclick`） | 通过 JS 直接赋值的自定义属性（如 `el.customProp = 1`） |
| 深克隆时的全部后代节点                                           | 表单控件的**当前值**（只保留 `value` 属性里的初始值）  |

### 8.2 经典坑点

**1. JS 绑定的事件会丢失**

```javascript
el.addEventListener('click', () => console.log('clicked'))
const clone = el.cloneNode(true)
clone.click() // 不会触发，事件监听器没有被复制
```

**2. 克隆后 `id` 重复**

克隆会原样保留 `id`，插入文档后就会产生重复 `id`，通常克隆后手动改掉：

```javascript
clone.id = '' // 清空，或生成一个新 id
```

**3. 表单的当前值不会保留**

```html
<input id="name" value="初始值" />
```

```javascript
const input = document.getElementById('name')
input.value = '用户输入的值'
const clone = input.cloneNode(false)
clone.value // "初始值"，而不是 "用户输入的值"
```

### 8.3 典型应用场景

- **复用复杂结构**：克隆模板内容批量生成列表项。
- **拷贝 + 修改**：先克隆，再修改克隆体（改文本、改 `id`、重新绑定事件），避免直接改动原节点。

```javascript
const clone = tpl.content.cloneNode(true)
clone.querySelector('.name').textContent = 'xunbei'
list.appendChild(clone)
```

## 9. 创建元素的性能对比

| 方式                            | 性能 | 适用场景           |
| ------------------------------- | ---- | ------------------ |
| `createElement` + `textContent` | 最快 | 纯文本、需绑定事件 |
| `<template>` + `cloneNode`      | 快   | 复杂结构复用       |
| `innerHTML`                     | 慢   | 简单一次性赋值     |
| 字符串拼接 + `innerHTML`        | 中   | 大批量、无需事件   |

## 10. 常见问题 (FAQ)与 避坑指南

### 10.1 `innerHTML` vs `textContent` vs `innerText`

- **`innerHTML`**: 会解析并渲染 HTML 标签。如果你插入的内容来自用户，可能会有 XSS 攻击的风险。
- **`textContent`**: 不会解析 HTML 标签，会原样输出。它会获取所有子元素，包括 `<script>` 和 `<style>` 元素的内容，以及 `display: none` 的元素文本，且不触发布局。
- **`innerText`**: 同样不解析 HTML，但它会考虑 CSS 样式，不会返回被隐藏的文本（例如 `display: none;` 的元素），并且会触发布局重排（reflow），性能上不如 `textContent`。**优先用 `textContent`**。

### 10.2 `children` vs `childNodes`

- **`children`**: 只返回元素的**元素子节点**（HTML 元素），是一个 `HTMLCollection`。
- **`childNodes`**: 返回所有类型的**子节点**，包括元素节点、文本节点（比如换行符和空格）、注释节点等，是一个 `NodeList`。

`childNodes` 包含文本节点（HTML 中的换行、缩进都是文本节点），`children` 只统计元素节点。因此一个带换行的 `<ul>`，其 `childNodes.length` 通常大于 `children.length`。在大多数情况下，如果你只想操作子元素，`children` 会是更方便和安全的选择。

### 10.3 `HTMLCollection` vs `NodeList`

- **`HTMLCollection`**: 是一个**动态**的集合。当文档中的元素发生变化时，`HTMLCollection` 会自动更新。例如 `getElementsByTagName` 返回的就是 `HTMLCollection`。
- **`NodeList`**: 通常是一个**静态**的集合，但也可能是动态的（取决于获取它的方法）。例如 `querySelectorAll` 返回的是静态的 `NodeList`，而 `childNodes` 返回的是动态的。

对动态集合进行循环操作时要特别小心，因为在循环中修改 DOM 可能会导致死循环。

### 10.4 为什么 `innerHTML` 添加的内容丢失了事件绑定？

因为 `innerHTML` 会**销毁并重建**所有子节点，原有 DOM 节点上的 JS 事件随之消失。改用 `insertAdjacentHTML` 或「先 `createElement` 再绑定事件再 `appendChild`」可避免。

### 10.5 DOM 操作的性能问题

频繁地、大量地直接操作 DOM 可能会导致页面性能下降，因为每次 DOM 的改变都可能触发浏览器的重绘（repaint）和重排（reflow）。例如循环里逐条 `appendChild` 会触发大量回流，导致批量插入列表卡顿。

**解决方案：**

- **减少 DOM 访问**：将 DOM 元素的引用缓存到变量中，避免在循环中反复查询。
- **批量更新**：使用 `DocumentFragment` 一次性挂载，或使用 [虚拟列表](/performanceOptimization/virtualList) 只渲染可见项。
- **使用现代框架**：像 React、Vue 等现代 JavaScript 框架使用虚拟 DOM（Virtual DOM）来最小化和批量化对真实 DOM 的操作，从而提高性能。

### 10.6 跨浏览器兼容性

虽然现在主流浏览器的 DOM API 实现已经非常标准化，但在一些旧的浏览器或者处理某些边缘情况时，仍然可能存在细微的差异。

**解决方案：**

- **使用成熟的库**：像 jQuery 这样的库在早期很好地解决了跨浏览器兼容性问题。
- **查阅文档**：在开发时，可以查阅 MDN 等网站，了解 API 的浏览器兼容性情况。
- **功能检测**：在使用某个 API 之前，先检查它是否存在。
