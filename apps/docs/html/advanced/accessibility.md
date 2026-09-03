# Web 可访问性 (Accessibility)

可访问性是指让 Web 内容能够被**尽可能多的人**使用，尤其是残障人士。它不仅关乎合规与道义，更是产品质量与 SEO 的重要组成部分：语义化 HTML、键盘可操作、屏幕阅读器友好，通常也意味着更清晰的代码结构与更好的搜索引擎排名。

## 1. 标准与准则：WCAG 与 POUR 原则

W3C 的 **WAI**（Web Accessibility Initiative）制定了核心标准 **WCAG**（Web Content Accessibility Guidelines），目前主流版本为 **WCAG 2.2**，分为 A / AA / AAA 三个等级。其指导思想可归纳为 **POUR** 四大原则：

| 原则                      | 含义                                       | 示例                                     |
| ------------------------- | ------------------------------------------ | ---------------------------------------- |
| **Perceivable** 可感知    | 信息必须能以用户可感知的方式呈现           | 为图片提供替代文本、保证颜色对比度       |
| **Operable** 可操作       | 组件与导航必须可操作                       | 所有功能可键盘操作、避免会诱发光敏的内容 |
| **Understandable** 可理解 | 信息与操作必须易于理解                     | 清晰的标签、一致的导航、明确的错误提示   |
| **Robust** 健壮           | 内容能被多种用户代理（含辅助技术）可靠解析 | 使用规范 HTML、正确的 ARIA 属性          |

> **注意：** 多数企业将 **WCAG 2.2 AA** 作为最低合规基线，这也是欧美地区 Web 无障碍诉讼与政府采购的常见门槛。

## 2. 语义化 HTML：可访问性的基石

浏览器与屏幕阅读器对页面结构的理解，高度依赖 HTML 语义。使用正确的标签，往往比事后补一堆 ARIA 更有效。

### 2.1 页面地标 (Landmarks)

屏幕阅读器用户通过地标快速跳转页面区域：

```html
<header>
  <!-- banner  -->
  <nav>
    <!-- navigation -->
    <main>
      <!-- main（每个页面仅一个） -->
      <aside>
        <!-- complementary -->
        <footer><!-- contentinfo --></footer>
      </aside>
    </main>
  </nav>
</header>
```

### 2.2 标题层级

标题（`<h1>` ~ `<h6>`）是屏幕阅读器用户「浏览目录」的主要手段，必须**连续且不跳级**：

```html
<h1>商品详情</h1>
<h2>商品参数</h2>
<h3>尺寸</h3>
<h2>用户评价</h2>
```

### 2.3 常见语义标签选择

| 场景      | 错误做法                | 正确做法                               |
| --------- | ----------------------- | -------------------------------------- |
| 按钮      | `<div onclick="...">`   | `<button>`                             |
| 链接      | `<span onclick="跳转">` | `<a href="...">`                       |
| 列表      | 多个 `<div>` 堆叠       | `<ul>` / `<ol>` / `<dl>`               |
| 表格      | 用 `<div>` 模拟         | `<table>` + `<caption>` + `<th scope>` |
| 强调/引用 | `<b>`、`<i>` 用于语义   | `<strong>`、`<em>`、`<blockquote>`     |

## 3. 替代文本：让图片「被听见」

### 3.1 `alt` 属性

```html
<!-- 有意义的信息图 -->
<img src="chart.png" alt="2025 年营收同比增长 32% 的柱状图" />

<!-- 纯装饰图：空 alt，让阅读器跳过 -->
<img src="divider.png" alt="" />
```

- **有意义**：`alt` 应描述图片传达的**信息**，而非文件本身。
- **装饰性**：`alt=""` 表示可忽略，切勿省略 `alt`（否则阅读器会读出文件名）。
- **复杂图表**：`alt` 简短概括 + 正文或 `<figcaption>` 提供长描述。

### 3.2 `<figure>` 与 `<figcaption>`

```html
<figure>
  <img src="architecture.png" alt="微前端架构分层示意图" />
  <figcaption>图 1：主应用与各子应用的通信拓扑</figcaption>
</figure>
```

## 4. 键盘可操作性

无法使用鼠标的用户依赖键盘（Tab / Shift+Tab / Enter / 方向键）操作，所有交互必须键盘可达。

### 4.1 焦点顺序与 `tabindex`

| 值                 | 行为                                      | 使用建议                     |
| ------------------ | ----------------------------------------- | ---------------------------- |
| 未设置（交互元素） | 按 DOM 顺序自然进入 Tab 序列              | 首选                         |
| `tabindex="0"`     | 使非交互元素（如自定义组件）进入 Tab 序列 | 自定义控件时使用             |
| `tabindex="-1"`    | 可编程聚焦但不在 Tab 序列中               | 弹窗、跳转目标               |
| `tabindex=">0"`    | 显式指定顺序                              | **避免使用**（破坏自然顺序） |

### 4.2 焦点管理（弹窗场景）

```javascript
const dialog = document.querySelector('#dialog')
const trigger = document.querySelector('#open-btn')
let lastFocused = null

function openDialog() {
  lastFocused = document.activeElement
  dialog.showModal()
  dialog.querySelector('input').focus() // 焦点移入弹窗
}

function closeDialog() {
  dialog.close()
  lastFocused?.focus() // 焦点归还给触发元素
}
```

> **注意：** 原生 `<dialog>` 配合 `showModal()` 会正确处理焦点圈定与 `Esc` 关闭；手写弹窗时需自行实现**焦点陷阱**（Focus Trap），保证 Tab 不逃逸到页面背景。

### 4.3 跳过导航链接

```html
<body>
  <a class="skip-link" href="#main">跳到主要内容</a>
  <nav>…</nav>
  <main id="main" tabindex="-1">…</main>
</body>
```

```css
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 8px;
  top: 8px;
}
```

## 5. ARIA：当语义不够用时

ARIA（Accessible Rich Internet Applications）通过 `role`、`aria-*` 属性向辅助技术补充语义，用于原生 HTML 无法表达的交互组件。

### 5.1 常见 `role`

| role                                  | 用途                               |
| ------------------------------------- | ---------------------------------- |
| `role="button"`                       | 将可点击的 `<div>` 声明为按钮      |
| `role="dialog"`                       | 声明模态弹窗                       |
| `role="tablist"` / `tab` / `tabpanel` | 标签页                             |
| `role="alert"`                        | 需要立即播报的动态内容             |
| `role="status"`                       | 低优先级的状态播报（如「已保存」） |

### 5.2 状态与属性

```html
<!-- 手风琴折叠面板 -->
<button aria-expanded="false" aria-controls="panel-1">展开详情</button>
<div id="panel-1" role="region" hidden>…</div>

<!-- 实时播报的购物车数量变化 -->
<div role="status" aria-live="polite">
  <span id="cart-count">0</span> 件商品
</div>
```

- **`aria-live`**：`polite` 会等当前播报结束后再读，`assertive` 立即打断，`off` 不播报。
- **`aria-label` / `aria-labelledby`**：为无文本控件补充名称。
- **`aria-hidden="true"`**：从可访问性树中隐藏纯装饰元素。

### 5.3 ARIA 五条铁律

- **能不写就不写**：优先使用原生语义标签。
- **不要改变原生语义**：别给 `<button>` 加 `role="link"`。
- **交互元素必须可键盘操作**：加了 `role="button"` 就要自己实现 Enter/Space 键盘处理。
- **不要隐藏可聚焦元素**：`aria-hidden` 的元素内不应有可聚焦控件。
- **提供可访问名称**：所有交互控件都要有可读的名称。

## 6. 表单可访问性

### 6.1 标签关联

```html
<!-- 显式关联：for 指向 id -->
<label for="email">邮箱</label>
<input id="email" type="email" name="email" />

<!-- 隐式关联：input 嵌套在 label 内 -->
<label>
  我同意协议
  <input type="checkbox" name="agree" />
</label>
```

### 6.2 错误提示与描述

```html
<label for="pwd">密码</label>
<input
  id="pwd"
  type="password"
  aria-invalid="true"
  aria-describedby="pwd-help pwd-error"
/>
<p id="pwd-help">至少 8 位，包含字母和数字</p>
<p id="pwd-error" role="alert">密码强度不足</p>
```

### 6.3 字段集与分组

```html
<fieldset>
  <legend>性别</legend>
  <label><input type="radio" name="gender" value="male" /> 男</label>
  <label><input type="radio" name="gender" value="female" /> 女</label>
</fieldset>
```

## 7. 颜色与对比度

- **文本对比度**：普通文本 ≥ 4.5:1，大号文本（≥18pt 或 24px 加粗）≥ 3:1（WCAG AA）。
- **不要仅靠颜色传达信息**：错误状态不能只用红色，需配合图标或文字。

```css
/* ❌ 仅靠颜色 */
.status {
  color: red;
}

/* ✅ 颜色 + 图标/文字 + 额外纹理 */
.status--error {
  color: #c00000;
}
.status--error::before {
  content: '⚠';
}
```

## 8. 可访问性测试

### 8.1 自动化工具

| 工具                        | 说明                                 |
| --------------------------- | ------------------------------------ |
| **axe-core** / axe DevTools | 最流行的静态规则引擎，可集成到测试   |
| **Lighthouse**              | Chrome 内置，提供 Accessibility 审计 |
| **eslint-plugin-jsx-a11y**  | React 代码静态检查，防止遗漏 alt 等  |
| **pa11y**                   | 命令行批量审计，适合接入 CI          |

```javascript
// 在测试中集成 axe-core
import axe from 'axe-core'

const results = await axe.run(document)
expect(results.violations).toHaveLength(0)
```

### 8.2 人工检查清单

自动化工具只能发现约 **30%~50%** 的问题，以下需人工验证：

- [ ] 全程仅用键盘能否完成所有操作？
- [ ] 焦点是否有清晰可见的指示？焦点顺序是否合理？
- [ ] 用屏幕阅读器（VoiceOver / NVDA / JAWS）能否理解页面内容？
- [ ] 放大到 200% 布局是否仍可用？
- [ ] 暂停/停止自动播放的轮播、动画是否可行？

## 9. 最佳实践总结

- **语义优先**：优先正确的 HTML 标签，ARIA 作为兜底。
- **键盘优先**：任何鼠标操作都要有对应的键盘路径。
- **焦点可见**：切勿 `outline: none` 而不提供替代焦点样式。
- **动态内容要播报**：使用 `aria-live` 让变化可被感知。
- **减少依赖颜色**：状态信息需多重表达。
- **把可访问性纳入 CI**：用 axe / eslint-plugin-jsx-a11y 在提交阶段拦截回归。
