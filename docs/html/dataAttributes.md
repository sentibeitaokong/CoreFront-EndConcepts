# HTML 自定义数据属性 `data-*`

HTML5 引入了自定义数据属性 `data-*`，它允许开发者在标准的 HTML 元素上存储额外的信息，而无需借助其他非标准属性或在 DOM 上附加额外属性。 这种机制为在 HTML 和 JavaScript 之间交换私有数据提供了便利，从而能够创建更具吸引力的用户体验，而无需进行 Ajax 调用或服务器端数据库查询。

## `data-*` 属性是什么？

`data-*` 属性是一类特殊的属性，它们被设计用来存储页面或应用程序的私有自定义数据。 用户代理（浏览器）会完全忽略这些属性，这意味着它们不会对页面的渲染产生任何影响。

### 语法

`data-*` 属性的语法非常简单：

*   **前缀:** 属性名必须以 `data-` 开头。
*   **名称:** `data-` 后面的部分可以由一个或多个小写字母、数字、连字符、点、冒号或下划线组成。不过，为了与 `dataset` API 更好地协作，建议使用连字符分隔的名称（kebab-case）。
*   **值:** 属性值可以是任何字符串。

**示例：**

```html
<article
  id="electric-cars"
  data-columns="3"
  data-index-number="12314"
  data-parent="cars">
...
</article>
```

### API 和用法

您可以通过 JavaScript 和 CSS 来访问和操作 `data-*` 属性。

#### JavaScript API

在 JavaScript 中，有两种主要的方法可以访问 `data-*` 属性：

1.  **`getAttribute()` 和 `setAttribute()`:**
    这是通用的属性访问方法，可以用来读取和设置任何 HTML 属性，包括 `data-*` 属性。

    ```js
    const article = document.getElementById('electric-cars');

    // 获取 data-columns 的值
    const columns = article.getAttribute('data-columns'); // "3"

    // 设置 data-columns 的值
    article.setAttribute('data-columns', '5');
    ```

2.  **`dataset` 属性:**
    `dataset` 属性是 `HTMLElement` 接口的一部分，它提供了一个更简洁的方式来访问 `data-*` 属性。`dataset` 返回一个 `DOMStringMap` 对象，其中包含了元素上所有 `data-*` 属性的键值对。

    *   `data-` 后面的属性名会从连字符命名法（kebab-case）转换成驼峰式命名法（camelCase）。例如，`data-index-number` 在 `dataset` 中会变成 `indexNumber`。

    ```js
    const article = document.getElementById('electric-cars');

    // 获取 data-index-number 的值
    const index = article.dataset.indexNumber; // "12314"

    // 设置 data-parent 的值
    article.dataset.parent = 'automobiles';

    // 动态添加一个新的 data-new-attribute
    article.dataset.newAttribute = 'some-value';
    ```

#### jQuery API

如果您正在使用 jQuery，可以使用 `.data()` 方法来访问 `data-*` 属性。从 jQuery 1.4.3 版本开始，`data-*` 属性会在第一次调用 `.data()` 方法时被读取并缓存。

```js
// 获取 data-columns 的值
const columns = $('#electric-cars').data('columns'); // 3 (jQuery 会尝试将字符串转换为数字)

// 设置 data-columns 的值 (注意：这不会改变 HTML 属性)
$('#electric-cars').data('columns', 5);
```

**重要提示:** 使用 jQuery 的 `.data()` 方法修改数据时，并不会更新 HTML 元素上的 `data-*` 属性。要更新 HTML 属性，您需要使用 `.attr()` 方法。

#### CSS 选择器

您可以使用属性选择器来根据 `data-*` 属性的值为元素设置样式。

```css
article[data-columns='3'] {
  column-count: 3;
}

article[data-parent='cars'] {
  border: 1px solid #ccc;
}
```

### 常见问题与最佳实践

在使用 `data-*` 属性时，需要注意以下几点：

| 问题/实践 | 描述 |
| :--- | :--- |
| 🚫 **不要存储敏感信息** | `data-*` 属性的值在 HTML 源代码中是可见的。因此，切勿在其中存储任何敏感信息，如密码、API 密钥或个人数据。 |
| ⚡ **性能考量** | 过度使用 `data-*` 属性或在其中存储大量数据会增加 HTML 文件的大小，从而可能影响页面加载时间。建议保持 `data-*` 属性值的简洁，对于大型数据集，应考虑使用外部文件。 |
| ♿ **可访问性** | 辅助技术（如屏幕阅读器）可能无法访问 `data-*` 属性中的内容。因此，不应将需要被用户看到或访问的内容存储在 `data-*` 属性中。 |
| 📛 **命名约定** | `data-*` 属性的名称不应包含任何大写字母。 遵循连字符分隔的命名方式（kebab-case）有助于与 `dataset` API 更好地集成。 |
| 🤷 **为何使用 `data-` 前缀** | 使用 `data-` 前缀可以确保您的自定义属性不会与未来 HTML 标准中可能引入的新属性发生冲突。 |
| 🧼 **分离关注点** | 虽然可以在 CSS 中使用 `data-*` 属性来控制样式，但过度使用可能会导致 HTML、CSS 和 JavaScript 之间的界限变得模糊。通常，`data-*` 属性更适合在 HTML 和 JavaScript 之间传递数据。 |
| 🔍 **搜索引擎索引** | 搜索引擎的爬虫可能不会索引 `data-*` 属性的值。 |