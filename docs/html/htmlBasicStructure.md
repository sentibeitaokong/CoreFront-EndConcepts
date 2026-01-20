# HTML 基本结构 (Basic Structure)

HTML (HyperText Markup Language) 是网页的骨架。无论网页多么复杂，其核心结构都遵循同一套标准。理解这个骨架是前端开发的第一步。

## 1. 标准骨架 (The Boilerplate)

这是每一个 HTML5 网页必须具备的最小代码结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网页标题</title>
    <!-- 这里引入 CSS -->
    <link rel="stylesheet" href="style.css">
</head>
<body>

    <!-- 这里写网页的可见内容 -->
    <h1>你好，世界！</h1>

    <!-- 这里引入 JavaScript -->
    <script src="script.js"></script>
</body>
</html>
```

## 2. 核心标签详解

### 2.1 文档类型声明 `<!DOCTYPE html>`
*   **作用**：这不是一个 HTML 标签，而是一个**声明**。它告诉浏览器：“请使用 **HTML5 标准模式** (Standard Mode) 来渲染这个页面”。
*   **如果不写**：浏览器会进入 **怪异模式 (Quirks Mode)**，使用旧时代的（如 IE5）渲染规则，导致盒模型计算错误、布局错乱。

### 2.2 根元素 `<html>`
*   **作用**：所有 HTML 代码的容器（根节点）。
*   **`lang` 属性**：指定网页的语言。
    *   `lang="zh-CN"`: 简体中文。
    *   `lang="en"`: 英语。
    *   *重要性*：帮助屏幕阅读器（盲人辅助工具）正确发音；触发浏览器的“是否翻译此页面”提示。

### 2.3 头部 `<head>`
*   **作用**：存放网页的**元数据 (Metadata)**。
*   **特点**：这里的内容**不会**直接显示在网页的正文中。
*   **常驻居民**：
    *   **`<meta charset="UTF-8">`**: **必写**。指定字符编码。防止中文出现乱码。
    *   **`<meta name="viewport" ...>`**: **移动端适配必写**。控制视口的宽度和缩放，没有它，媒体查询无法在手机上正常工作。
    *   **`<title>`**: 浏览器标签页上的标题，也是搜索引擎搜索结果的标题。
    *   **`<link>`**: 引入外部资源（如 CSS 文件、网站图标 Favicon）。
    *   **`<style>`**: 写内部 CSS 样式。
    *   **`<script>`**: 写内部 JS 代码（通常 JS 放在 body 底部，但也可放这里配合 `defer`）。

### 2.4 主体 `<body>`
*   **作用**：存放网页的**可见内容**。
*   **特点**：用户在浏览器窗口中看到的所有东西（文字、图片、按钮、视频）都必须写在这里面。

## 3. HTML5 语义化结构 (Semantic Elements)

在 `<body>` 内部，现代开发不再仅仅使用 `<div>` 来布局，而是推荐使用具有语义的标签。这有助于 SEO（搜索引擎优化）和无障碍访问。

```html
<body>
    <!-- 1. 页眉: Logo, 导航栏 -->
    <header>
        <nav>...</nav>
    </header>

    <!-- 2. 主要内容区: 一个页面只能有一个 main -->
    <main>
        <!-- 文章/独立内容块 -->
        <article>
            <h1>文章标题</h1>
            <p>内容...</p>
        </article>

        <!-- 侧边栏: 广告, 推荐列表 -->
        <aside>...</aside>
    </main>

    <!-- 3. 页脚: 版权信息, 联系方式 -->
    <footer>...</footer>
</body>
```

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: 如果不写 `<!DOCTYPE html>` 会发生什么？
**后果**：浏览器会进入 **Quirks Mode (怪异模式)**。
最典型的影响是 **盒模型 (Box Model)** 变了：
*   在标准模式下，`width` = 内容宽度。
*   在怪异模式下，`width` = 内容 + padding + border。
    这会导致你的 CSS 布局在不同浏览器下表现不一致，难以调试。

### Q2: 为什么我的中文变成了乱码（）？
**原因**：
1.  没有写 `<meta charset="UTF-8">`。
2.  或者，HTML 文件本身的保存编码不是 UTF-8（例如保存成了 GBK），但浏览器强行用 UTF-8 解析。
    
**解法**：确保编辑器（VS Code）右下角显示 "UTF-8"，并且代码里明确写了 charset meta 标签。

### Q3: 为什么手机上打开网页，字特别小，像缩小的电脑版？
**原因**：忘记写 **Viewport Meta** 标签。
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```
如果不写这行，手机浏览器默认会用 980px 的宽度去渲染网页，然后缩小塞进手机屏幕，导致无法阅读。

### Q4: `<script>` 标签应该放在 `<head>` 还是 `<body>` 底部？
*   **传统做法**：放在 `</body>` 闭合标签之前。
    *   *原因*：JS 的下载和执行会阻塞 HTML 的解析。放在底部可以让页面先显示出内容（白屏时间短），再加载脚本。
*   **现代做法**：放在 `<head>` 中，但加上 **`defer`** 属性。
    *   `<script src="..." defer></script>`
    *   *效果*：脚本异步下载，等 HTML 解析完再执行。这比放底部更规范。

### Q5: `title` 标签有什么用？
它有三个重要用途：
1.  显示在浏览器顶部的**标签页**上。
2.  当你把网页**收藏**到书签栏时的默认名字。
3.  **SEO (最重要)**：搜索引擎抓取网页时，`title` 是权重的核心，决定了搜索结果的第一行大字显示什么。

### Q6: `alt` 属性在 `<img>` 中是必须的吗？
**是的**，虽然不写不报错。
*   如果图片加载失败，显示 `alt` 的文字。
*   **盲人阅读器**会朗读 `alt` 内容，告诉用户这是什么图片。
*   有利于搜索引擎理解图片内容。