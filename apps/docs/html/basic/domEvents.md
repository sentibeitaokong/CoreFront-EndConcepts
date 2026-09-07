# DOM 事件

DOM 事件是发生在 HTML 文档元素上的一些特定交互瞬间。当用户在页面上进行操作（如点击鼠标、滚动页面、按下键盘）或者浏览器自身发生某些行为（如页面加载完成、资源加载失败）时，事件就会被触发。JavaScript 允许我们「监听」这些事件，并在它们发生时执行特定的代码，从而实现网页的动态交互。

## 1. 事件流

当一个事件在 DOM 树中的某个元素上发生时，它并不会只在那一个元素上触发，而是经历一个完整的流动过程，这个过程被称为**事件流**。事件流包含三个阶段：

- **捕获阶段**：事件从最外层祖先（通常是 `window`）开始，逐级向下传播到目标元素。
- **目标阶段**：事件到达并触发在目标元素（即事件实际发生的元素）上。
- **冒泡阶段**：事件从目标元素开始，逐级向上传播回最外层祖先 `window`。

![事件流三个阶段](/img/eventBubbing.png)

上图中 1-5 是捕获过程，5-6 是目标阶段，6-10 是冒泡阶段。

```html
<div id="outer">
  <button id="btn">点我</button>
</div>
```

```js
const outer = document.getElementById('outer')
const btn = document.getElementById('btn')

outer.addEventListener('click', () => console.log('外层：捕获阶段'), true) // 第三个参数 true = 捕获阶段
btn.addEventListener('click', () => console.log('按钮：目标阶段'))
outer.addEventListener('click', () => console.log('外层：冒泡阶段')) // 默认在冒泡阶段触发

// 点击按钮时输出顺序：
// 外层：捕获阶段  →  按钮：目标阶段  →  外层：冒泡阶段
```

> 默认情况下，`addEventListener` 在**冒泡阶段**触发监听器；只有把第三个参数设为 `true`（或 `{ capture: true }`）才会在**捕获阶段**触发。

## 2. 事件处理程序

要让 JavaScript 响应一个事件，你需要为目标元素注册一个**事件处理程序**(也叫事件监听器)。主要有三种方式：

### 2.1 HTML on-event 属性（不推荐）

直接在 HTML 标签上使用 `on<event>` 属性：

```html
<button onclick="alert('你点击了我！')">点我</button>
```

**缺点：**

- 将 JavaScript 和 HTML 结构紧密耦合，违反「关注点分离」原则。
- 难以维护，尤其是逻辑复杂时。
- 每个事件只能绑定一个函数。

### 2.2 DOM on-event 属性（可用，但有局限）

通过 JavaScript 获取 DOM 元素，再设置其 `on<event>` 属性：

```js
const myButton = document.getElementById('myBtn')
myButton.onclick = function () {
  alert('按钮被点击了！')
}
```

**局限：** 与 HTML 属性方式一样，每个事件（如 `onclick`）只能绑定一个处理函数，再次赋值 `myButton.onclick = ...` 会覆盖前一个函数。

### 2.3 addEventListener（现代标准，推荐）

这是最强大、最灵活、最推荐的方式。

**语法：** `element.addEventListener(type, listener, options)`

- `type`：事件类型字符串，**不需要** `on` 前缀，例如 `'click'`、`'keydown'`、`'load'`。
- `listener`：事件触发时要执行的函数。
- `options`（可选）：一个配置对象，常用字段如下：

| 选项      | 类型        | 含义                                                                |
| --------- | ----------- | ------------------------------------------------------------------- |
| `capture` | 布尔值      | `true` 在捕获阶段执行；`false`（默认）在冒泡阶段执行。              |
| `once`    | 布尔值      | `true` 表示监听器执行一次后自动移除。                               |
| `passive` | 布尔值      | `true` 表示监听器内不会调用 `preventDefault()`，可优化滚动等性能。  |
| `signal`  | AbortSignal | 传入 `AbortController` 的 signal，可调用 `abort()` 批量移除监听器。 |

```js
const myButton = document.getElementById('myBtn')

function handleClick() {
  console.log('按钮被点击了！')
}

// 添加事件监听
myButton.addEventListener('click', handleClick)

// 同一事件可绑定多个函数
myButton.addEventListener('click', function () {
  console.log('第二个处理函数也被触发了！')
})

// 用 once 让监听器只执行一次
myButton.addEventListener('click', () => console.log('只触发一次'), {
  once: true,
})

// 用 AbortController 批量移除
const controller = new AbortController()
myButton.addEventListener('click', handleClick, { signal: controller.signal })
controller.abort() // 移除上面这个监听器
```

**移除监听器：** 使用 `element.removeEventListener(type, listener, options)`。

> **注意：** `removeEventListener` 要成功移除，传入的 `listener` 必须是与 `addEventListener` 中**完全相同的函数引用**，匿名函数无法被移除；`options`（或 `useCapture`）也必须与添加时一致。

## 3. Event 对象

当事件触发时，浏览器会自动创建一个 `Event` 对象，并将其作为唯一参数传给事件处理函数。这个对象包含事件的所有信息：

```js
element.addEventListener('click', function (event) {
  console.log(event.type) // -> "click"
})
```

`Event` 对象上最常用的属性与方法：

| 属性/方法                                     | 描述                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `event.target`                                | **触发事件的原始元素**。即使事件冒泡到父元素，`target` 仍是用户实际交互的那个元素。 |
| `event.currentTarget`                         | **当前正在执行处理函数的元素**。在冒泡过程中会随着执行位置变化。                    |
| `event.type`                                  | 事件类型（例如 `'click'`）。                                                        |
| `event.bubbles`                               | 布尔值，表示事件是否会冒泡。                                                        |
| `event.defaultPrevented`                      | 布尔值，表示是否已调用 `preventDefault()`。                                         |
| `event.key`（键盘事件）                       | 按下的键名（例如 `'a'`、`'Enter'`、`'Shift'`）。                                    |
| `event.clientX` / `event.clientY`（鼠标事件） | 鼠标指针相对于浏览器视口左上角的坐标。                                              |
| `event.preventDefault()`                      | **阻止事件的默认行为**，例如阻止链接跳转、表单提交。                                |
| `event.stopPropagation()`                     | **阻止事件继续传播**（捕获或冒泡），但同一元素上的其他监听器仍会执行。              |
| `event.stopImmediatePropagation()`            | **阻止事件继续传播，并阻止同一元素上的其他监听器执行**。                            |

### 3.1 阻止行为方法

| 方法                         | 阻止默认行为 | 阻止传播 | 阻止同元素其他监听器 |
| ---------------------------- | ------------ | -------- | -------------------- |
| `preventDefault()`           | ✅           | ❌       | ❌                   |
| `stopPropagation()`          | ❌           | ✅       | ❌                   |
| `stopImmediatePropagation()` | ❌           | ✅       | ✅                   |

## 4. 常见事件类型

| 类别              | 常见事件                                                                                                      | 描述                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **鼠标事件**      | `click`、`dblclick`、`mousedown`、`mouseup`、`mousemove`、`mouseover`、`mouseout`、`mouseenter`、`mouseleave` | 用户的鼠标操作。                                                        |
| **键盘事件**      | `keydown`、`keyup`、`keypress`                                                                                | 用户的键盘操作。（`keypress` 已不推荐，改用 `keydown`）                 |
| **表单事件**      | `submit`、`change`、`input`、`focus`、`blur`                                                                  | 用户与表单元素的交互。`change` 失焦时触发，`input` 内容改变时实时触发。 |
| **窗口/文档事件** | `load`、`DOMContentLoaded`、`resize`、`scroll`、`unload`                                                      | 浏览器窗口或文档的状态变化。                                            |
| **焦点事件**      | `focus`、`blur`、`focusin`、`focusout`                                                                        | 元素获得或失去焦点。`focus`/`blur` 不冒泡，`focusin`/`focusout` 冒泡。  |

## 5. 常见问题 (FAQ)与 避坑指南

### 5.1 `this` 的指向问题

- **问题：** 在事件处理函数中，`this` 的值到底是什么？
- **答案：**
  - 使用 `on-event` 属性或 `addEventListener` 时，`this` 通常指向**绑定事件的那个元素**（即 `event.currentTarget`）。
  - **例外：** 使用**箭头函数**作为监听器时，`this` 继承外层作用域的 `this`，不会指向元素。

### 5.2 `event.target` 与 `event.currentTarget` 的区别

- `event.target`：**事件的源头**，用户真正交互的那个元素。
- `event.currentTarget`：**监听器所绑定的元素**。
- **场景：** 给一个 `<ul>` 绑定点击事件，用户点击的是里面的 `<li>`，此时 `event.target` 是 `<li>`，`event.currentTarget` 是 `<ul>`。

### 5.3 如何为动态添加的元素绑定事件（事件委托）

- **问题：** 页面加载后，通过 JavaScript 新建的元素无法触发之前绑定的事件。
- **解决方案（事件委托）：** 不要给每个子元素都绑定事件，而是利用**事件冒泡**，把监听器绑定到它们**共同的、静态的父元素**上，再在父元素处理函数里通过 `event.target` 判断是哪个子元素触发：

  ```js
  const userList = document.getElementById('user-list') // 这是一个 <ul>

  userList.addEventListener('click', function (event) {
    // 检查被点击的元素是否是 LI
    if (event.target && event.target.nodeName === 'LI') {
      console.log('你点击了列表项：', event.target.textContent)
    }
  })
  ```

- **优点：** ① 性能更好（监听器数量更少）；② 无需为新元素重新绑定事件。

### 5.4 `removeEventListener` 失效

- **问题：** 调用 `removeEventListener` 后，事件依然能触发。
- **原因：** 最常见的原因是添加时使用了匿名函数（两个函数字面量不是同一个引用）：

  ```js
  // 错误示范：无法移除
  element.addEventListener('click', function () {
    console.log('Hi')
  })
  element.removeEventListener('click', function () {
    console.log('Hi')
  }) // 两个不同的函数

  // 正确示范：使用具名函数或函数引用
  function sayHi() {
    console.log('Hi')
  }
  element.addEventListener('click', sayHi)
  element.removeEventListener('click', sayHi) // 成功移除
  ```

- 另外，`addEventListener` 的第三个参数 `options`（或 `useCapture`）也必须与移除时保持一致。
