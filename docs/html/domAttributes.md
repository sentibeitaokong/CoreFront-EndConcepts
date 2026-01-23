# 什么是 DOM？

文档对象模型（DOM）是 HTML 和 XML 文档的编程接口。 它将文档解析为一个由节点和对象（包含属性和方法）组成的结构，通常是一个树状结构。 简单来说，DOM 就像一座桥梁，连接了网页和脚本语言（主要是 JavaScript），让我们可以通过编程来改变文档的结构、样式和内容。

## DOM API 概览

DOM API 是由一系列的接口（方法和属性）组成的，它允许我们对 HTML 元素进行增删改查等操作。 这是一个由 W3C 和 WHATWG 共同制定的标准，并被现代浏览器广泛支持。

以下是一些最核心和常用的 DOM API：

### 节点选择（获取元素）

要操作一个元素，首先需要获取它。DOM 提供了多种选择元素的方法：

| 方法 | 描述 |
| --- | --- |
| `getElementById(id)` | 通过元素的 `id` 属性获取一个元素节点。 |
| `getElementsByTagName(tagName)` | 通过标签名获取一个元素节点列表 (HTMLCollection)。 |
| `getElementsByClassName(className)` | 通过类名获取一个元素节点列表 (HTMLCollection)。 |
| `querySelector(selector)` | 通过 CSS 选择器获取匹配的第一个元素节点。 |
| `querySelectorAll(selector)` | 通过 CSS 选择器获取匹配的所有元素节点列表 (NodeList)。 |

### 节点操作

获取到元素节点后，我们就可以对它们进行各种操作了。

**1. 创建和添加节点**

| 方法 | 描述 |
| --- | --- |
| `createElement(tagName)` | 创建一个新的元素节点。 |
| `createTextNode(text)` | 创建一个新的文本节点。 |
| `appendChild(node)` | 将一个节点添加到指定父节点的子节点列表末尾。 |
| `insertBefore(newNode, referenceNode)` | 在指定的已有子节点之前插入一个新节点。 |

**2. 删除和替换节点**

| 方法 | 描述 |
| --- | --- |
| `removeChild(child)` | 删除一个子节点。 |
| `replaceChild(newChild, oldChild)` | 替换一个子节点。 |

**3. 修改节点内容**

| 属性 | 描述 |
| --- | --- |
| `innerHTML` | 获取或设置一个元素内部的 HTML 内容。 |
| `textContent` | 获取或设置一个元素及其所有后代的文本内容。 |

**4. 修改节点属性**

| 方法/属性 | 描述 |
| --- | --- |
| `getAttribute(attributeName)` | 获取指定属性的值。 |
| `setAttribute(attributeName, value)` | 设置指定属性的值。 |
| `removeAttribute(attributeName)` | 移除指定的属性。 |
| `dataset` | 访问元素的 `data-*` 自定义属性。 |

**5. 修改节点样式**

| 属性 | 描述                                                                      |
| --- |-------------------------------------------------------------------------|
| `style` | 通过 `style` 属性可以直接读写元素的内联样式，例如 `element.style.color = 'red'`。            |
| `classList` | 通过 `classList.add()`, `classList.remove()`, `classList.toggle()` 等方法来操作元素的类名，这也是推荐的修改样式的方式。 |

## 常见问题 (FAQ)

### **1. `innerHTML` vs `textContent` vs `innerText`**

*   **`innerHTML`**: 会解析并渲染 HTML 标签。如果你插入的内容来自用户，可能会有 XSS 攻击的风险。
*   **`textContent`**: 不会解析 HTML 标签，会原样输出。它会获取所有子元素，包括 `<script>` 和 `<style>` 元素的内容。
*   **`innerText`**: 同样不解析 HTML，但它会考虑 CSS 样式，不会返回被隐藏的文本（例如 `display: none;` 的元素），并且会触发布局重排（reflow），性能上不如 `textContent`。

### **2. `children` vs `childNodes`**

*   **`children`**: 只返回元素的**元素子节点**（HTML 元素），是一个 `HTMLCollection`。
*   **`childNodes`**: 返回所有类型的**子节点**，包括元素节点、文本节点（比如换行符和空格）、注释节点等，是一个 `NodeList`。

在大多数情况下，如果你只想操作子元素，`children` 会是更方便和安全的选择。

### **3. `HTMLCollection` vs `NodeList`**

*   **`HTMLCollection`**: 是一个**动态**的集合。当文档中的元素发生变化时，`HTMLCollection` 会自动更新。例如 `getElementsByTagName` 返回的就是 `HTMLCollection`。
*   **`NodeList`**: 通常是一个**静态**的集合，但也可能是动态的（取决于获取它的方法）。例如 `querySelectorAll` 返回的是静态的 `NodeList`，而 `childNodes` 返回的是动态的。

对动态集合进行循环操作时要特别小心，因为在循环中修改 DOM 可能会导致死循环。

### **4. DOM 操作的性能问题**

频繁地、大量地直接操作 DOM 可能会导致页面性能下降，因为每次 DOM 的改变都可能触发浏览器的重绘（repaint）和重排（reflow）。

**解决方案：**

*   **减少 DOM 访问**：将 DOM 元素的引用缓存到变量中，避免在循环中反复查询。
*   **批量更新**：使用 `DocumentFragment` 作为临时容器，在内存中构建好 DOM 子树，然后一次性地添加到主 DOM 中。
*   **使用现代框架**：像 React、Vue 等现代 JavaScript 框架使用虚拟 DOM（Virtual DOM）来最小化和批量化对真实 DOM 的操作，从而提高性能。

### **5. 跨浏览器兼容性**

虽然现在主流浏览器的 DOM API 实现已经非常标准化，但在一些旧的浏览器或者处理某些边缘情况时，仍然可能存在细微的差异。

**解决方案：**

*   **使用成熟的库**：像 jQuery 这样的库在早期很好地解决了跨浏览器兼容性问题。
*   **查阅文档**：在开发时，可以查阅 MDN 等网站，了解 API 的浏览器兼容性情况。
*   **功能检测**：在使用某个 API 之前，先检查它是否存在。
