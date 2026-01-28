# 什么是 DOM 事件？

DOM 事件是发生在 HTML 文档元素上的一些特定交互瞬间。当用户在页面上进行操作（如点击鼠标、滚动页面、按下键盘）或者浏览器自身发生某些行为（如页面加载完成、资源加载失败）时，事件就会被触发。
JavaScript 允许我们“监听”这些事件，并在它们发生时执行特定的代码，从而实现网页的动态交互。

## 事件流 (Event Flow)

当一个事件在 DOM 树中的某个元素上发生时，它并不会只在那一个元素上触发。它会经历一个完整的流动过程，这个过程被称为**事件流**。事件流包含三个阶段：

1.**捕获阶段 (Capturing Phase)**: 事件从最外层的祖先元素（通常是 `window`）开始，逐级向下传播到目标元素。

2.**目标阶段 (Target Phase)**: 事件到达并触发在目标元素（即事件实际发生的元素）上。

3.**冒泡阶段 (Bubbling Phase)**: 事件从目标元素开始,逐级向上传播回最外层的祖先元素`window`。

![Logo](/eventBubbing.png)

1-5是捕获过程，5-6是目标阶段，6-10是冒泡阶段；
## 事件处理程序 (Event Handlers)

要让 JavaScript 响应一个事件，你需要为目标元素注册一个**事件处理程序**（也叫事件监听器）。主要有三种方式：

### 1. HTML on-event 属性 (不推荐)

直接在 HTML 标签上使用 `on<event>` 属性。

*   **语法**: `<element onevent="someJavaScriptCode">`
*   **示例**:
    ```html
    <button onclick="alert('你点击了我！')">点我</button>
    ```
*   **缺点**:
    *   将 JavaScript 和 HTML 结构紧密耦合，违反了“关注点分离”原则。
    *   难以维护，尤其是在代码逻辑复杂时。
    *   每个事件只能绑定一个函数。

### 2. DOM on-event 属性 (可用，但有局限)

通过 JavaScript 获取 DOM 元素对象，然后设置其 `on<event>` 属性。

*   **语法**: `element.onevent = function(){ /* ... */ };`
*   **示例**:
    ```js
    const myButton = document.getElementById('myBtn');
    myButton.onclick = function() {
      alert('按钮被点击了！');
    };
    ```
*   **局限**: 和 HTML 属性方式一样，每个事件（如 `onclick`）只能绑定一个处理函数。如果你再次赋值 `myButton.onclick = ...`，前一个函数就会被覆盖。

### 3. `addEventListener()` (现代标准，强烈推荐)

这是最强大、最灵活、最推荐的方式。

*   **语法**: `element.addEventListener(type, listener, options);`
    *   `type`: 事件类型字符串，**不需要** "on" 前缀，例如 `'click'`, `'keydown'`, `'load'`。
    *   `listener`: 当事件触发时要执行的函数。
    *   `options` (可选): 一个配置对象，或一个布尔值。
        *   `capture`: 布尔值。`true` 表示在**捕获阶段**执行处理函数；`false` (默认) 表示在**冒泡阶段**执行。
        *   `once`: 布尔值。`true` 表示监听器在执行一次后自动移除。
        *   `passive`: 布尔值。`true` 表示 `listener` 内部不会调用 `preventDefault()`。这可以用于优化滚动等性能。

*   **移除监听器**: 使用 `element.removeEventListener(type, listener, options);`
    *   **注意**: `removeEventListener` 要想成功，传入的 `listener` 必须是与 `addEventListener` 中**完全相同的函数引用**，匿名函数无法被移除。

*   **示例**:
    ```js
    const myButton = document.getElementById('myBtn');

    function handleClick() {
      console.log('按钮被点击了！');
    }

    // 添加事件监听
    myButton.addEventListener('click', handleClick);

    // 添加另一个监听，可以为一个事件绑定多个函数
    myButton.addEventListener('click', function() {
      console.log('第二个处理函数也被触发了！');
    });

    // 移除第一个监听器
    // myButton.removeEventListener('click', handleClick);
    ```

## `Event` 对象

当事件触发时，浏览器会自动创建一个 `Event` 对象，并将其作为唯一的参数传递给事件处理函数。这个对象包含了关于事件的所有信息。

```js
element.addEventListener('click', function(event) {
  // 'event' 就是 Event 对象
  console.log(event.type); // -> "click"
});
```

`Event` 对象上一些最重要、最常用的属性和方法：

| 属性/方法 | 描述 |
| :--- | :--- |
| **`event.target`** | **触发事件的原始元素**。即使事件冒泡到了父元素，`target` 仍然是用户实际点击的那个子元素。 |
| **`event.currentTarget`** | **当前正在执行事件处理函数的元素**。在事件冒泡过程中，这个值会改变。 |
| **`event.preventDefault()`** | **阻止事件的默认行为**。例如，阻止链接的跳转、阻止表单的提交。 |
| **`event.stopPropagation()`** | **阻止事件继续传播**（无论是捕获还是冒泡）。 |
| `event.type` | 事件的类型（例如 `'click'`）。 |
| `event.key` (键盘事件) | 按下的键的名称（例如 `'a'`, `'Enter'`, `'Shift'`）。 |
| `event.clientX` / `event.clientY` (鼠标事件) | 鼠标指针相对于浏览器视口左上角的位置。 |

## 常见事件类型

| 类别 | 常见事件 | 描述 |
| :--- | :--- | :--- |
| **鼠标事件** | `click`, `dblclick`, `mousedown`, `mouseup`, `mousemove`, `mouseover`, `mouseout`, `mouseenter`, `mouseleave` | 用户的鼠标操作。 |
| **键盘事件** | `keydown`, `keyup`, `keypress` | 用户的键盘操作。(`keypress` 已不推荐使用) |
| **表单事件** | `submit`, `change`, `input`, `focus`, `blur` | 用户与表单元素的交互。`change` 在失焦时触发，`input` 在内容改变时实时触发。 |
| **窗口/文档事件** | `load`, `DOMContentLoaded`, `resize`, `scroll`, `unload` | 浏览器窗口或文档的状态变化。 |
| **焦点事件** | `focus`, `blur`, `focusin`, `focusout` | 元素获得或失去焦点。`focus`/`blur` 不冒泡，`focusin`/`focusout` 冒泡。 |

## 常见问题 (Common Problems)

### 1.  **this的指向问题**
*   **问题**: 在事件处理函数中，`this` 的值到底是什么？
*   **答案**:
    *   在使用 `on-event` 属性或 `addEventListener` 时，`this` 通常指向**绑定事件的那个元素** (`event.currentTarget`)。
    *   **例外**: 如果你使用**箭头函数** (`=>`)作为监听器，`this` 将会继承其外层作用域的 `this` 值，而不会指向元素。

### 2.  **`event.target` vs `event.currentTarget`**
*   **问题**: 这两个属性有什么区别？
*   **答案**:
    *   `event.target`: **事件的源头**，用户真正交互的那个元素。
    *   `event.currentTarget`: **监听器所绑定的元素**。
    *   **场景**: 当你给一个 `<ul>` 绑定点击事件，但用户点击的是里面的 `<li>` 时，`event.target` 是 `<li>`，而 `event.currentTarget` 是 `<ul>`。

### 3.  **如何为动态添加的元素绑定事件？(事件委托)**
*   **问题**: 页面加载后，通过 JavaScript 新创建的元素无法触发之前绑定的事件。
*   **解决方案 (事件委托/Event Delegation)**: 不要给每个子元素都绑定事件，而是利用事件冒泡原理，将事件监听器绑定到它们的**共同的、静态的父元素**上。然后在父元素的处理函数中，通过 `event.target` 来判断是哪个子元素触发了事件。
*   **示例**:
    ```js
    const userList = document.getElementById('user-list'); // 这是一个 <ul>

    userList.addEventListener('click', function(event) {
      // 检查被点击的元素是否是一个 LI
      if (event.target && event.target.nodeName === 'LI') {
        console.log('你点击了列表项：', event.target.textContent);
      }
    });
    ```
*   **优点**: ① 性能更好（减少了事件监听器的数量）；② 无需为新元素重新绑定事件。

### 4.  **`removeEventListener` 失效**
*   **问题**: 调用 `removeEventListener` 后，事件依然能触发。
*   **原因**: 最常见的原因是添加时使用了匿名函数。
    ```js
    // 错误示范：无法移除
    element.addEventListener('click', function() { console.log('Hi'); });
    element.removeEventListener('click', function() { console.log('Hi'); }); // 这是两个不同的函数

    // 正确示范：使用具名函数或函数引用
    function sayHi() { console.log('Hi'); }
    element.addEventListener('click', sayHi);
    element.removeEventListener('click', sayHi); // 成功移除
    ```
*   另外，`addEventListener` 的第三个参数 `options` (或 `useCapture`) 也必须与移除时一致。

