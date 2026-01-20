# HTML5 增强表单特性 (Enhanced Forms)

HTML5 极大地增强了表单的功能。以前需要写大量 JavaScript 才能实现的**验证、输入限制、日期选择**等功能，现在只需要简单的 HTML 属性即可搞定。

## 1. 新增输入类型 (`type` 属性)

HTML5 引入了许多语义化的 `type` 值。在移动端，这些类型能**自动唤起对应的软键盘**（核心优势）。

| 类型 (type) | 描述 | 移动端键盘表现 | 浏览器默认验证 |
| :--- | :--- | :--- | :--- |
| **`email`** | 电子邮件 | 键盘带 `@` 和 `.` 符号。 | 必须包含 `@`。 |
| **`tel`** | 电话号码 | 纯数字拨号键盘。 | **无**（因为各国电话格式不同）。需配合 `pattern`。 |
| **`url`** | 网址 | 键盘带 `/` 和 `.com`。 | 必须是合法 URL 格式。 |
| **`number`** | 数字 | 数字键盘。 | 只能输入数字。配合 `min`, `max`, `step` 使用。 |
| **`search`** | 搜索框 | 键盘回车键变成“搜索”。 | 输入框右侧可能带个“x”清空按钮。 |
| **`date`** | 日期选择器 | 唤起系统原生日期滚轮。 | 显示年/月/日选择器。 |
| **`time`** | 时间选择器 | 唤起时间滚轮。 | 显示时:分。 |
| **`range`** | 滑块 | - | 拖动滑块选择数值。 |
| **`color`** | 颜色选择器 | - | 弹出取色板。 |
| **`password`**| 密码 | - | 输入内容掩码显示（圆点）。 |

## 2. 核心增强属性 (Attributes)

这些属性让表单变得“智能”。

### 2.1 验证与限制
| 属性 | 描述 | 示例 |
| :--- | :--- | :--- |
| **`required`** | **必填**。为空时阻止提交并提示。 | `<input required>` |
| **`pattern`** | **正则验证**。最强大的验证属性。 | `<input pattern="[0-9]{6}">` (验证6位验证码) |
| **`min` / `max`** | 最小/最大值。适用于 `number`, `date`, `range`。 | `<input type="number" min="1" max="100">` |
| **`minlength` / `maxlength`** | 最小/最大字符长度。适用于 `text`, `password`。 | `<input maxlength="140">` |
| **`step`** | 数字间隔。 | `<input type="number" step="0.5">` (0, 0.5, 1.0...) |

### 2.2 用户体验优化
| 属性 | 描述 |
| :--- | :--- |
| **`placeholder`** | **占位提示符**。输入框为空时显示的灰色提示文字。 |
| **`autofocus`** | **自动聚焦**。页面加载后光标自动定位到该框（一个页面只能有一个）。 |
| **`autocomplete`** | **自动完成**。`on` (开启), `off` (关闭)。<br>建议用于敏感信息（验证码）关闭提示。 |
| **`readonly`** | **只读**。内容可见，可聚焦，可提交，但**不可修改**。 |
| **`disabled`** | **禁用**。变灰，不可聚焦，**不会被提交**。 |
| **`multiple`** | **多选**。适用于 `file` (上传多图) 和 `email` (逗号分隔多个邮箱)。 |

## 3. 新增表单标签

### 3.1 `<datalist>` (原生自动补全)
给输入框提供一个“预设推荐列表”，但用户依然可以输入列表以外的内容。
```html
<label>浏览器：</label>
<input list="browsers" name="browser">

<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
</datalist>
```

### 3.2 `<progress>` 和 `<meter>`
*   **`<progress>`**: 进度条（任务完成度）。
    ```html
    <progress value="70" max="100"></progress>
    ```
*   **`<meter>`**: 刻度尺（如磁盘容量、温度）。有红黄绿颜色变化。
    ```html
    <meter value="80" min="0" max="100" low="30" high="60"></meter>
    ```

## 4. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么移动端键盘不弹数字键盘？
**原因**: 仅仅写 `type="number"` 在某些 iOS 版本上可能无效。

**解法**: 使用 `pattern` 强制指定。
```html
<input type="text" pattern="[0-9]*" inputmode="numeric">
```
*注：`inputmode` 是较新的属性，专门控制键盘类型。*

### Q2: 如何修改 `placeholder` 的颜色？
需要使用 CSS 伪元素（浏览器兼容性写法）。
```css
input::placeholder { color: red; }
input::-webkit-input-placeholder { color: red; } /* Chrome/Safari */
input::-moz-placeholder { color: red; } /* Firefox */
```

### Q3: `autocomplete="off"` 失效了？
现代浏览器（尤其是 Chrome）为了帮用户记密码，有时会忽略 `off` 设置。

**解法**: 给 `name` 或 `id` 起个随机怪异的名字，或者在 `type="password"` 上方放一个隐藏的 input 迷惑浏览器。

### Q4: 原生验证提示框太丑，怎么改？
浏览器的默认验证气泡（如“请填写此字段”）样式无法修改。
**解法**:
1.  禁用原生验证：`<form novalidate>`.
2.  使用 JS 监听 `submit` 事件，手动检查数据并显示自定义样式的 Error Tips。
3.  利用 CSS `:valid` 和 `:invalid` 伪类做样式反馈（变红/变绿）。

### Q5: `readonly` 和 `disabled` 的核心区别？
**面试必问**。
*   **`readonly` (只读)**: 数据**会**随表单一起提交到后端。
*   **`disabled` (禁用)**: 数据**不会**被提交。后端收不到这个字段。

### Q6: 为什么 `<input type="date">` 在 PC 端样式很难看？
**现状**: 原生日期选择器在 Chrome PC 端样式非常简陋，且无法通过 CSS 定制。在 Safari/Firefox 上长得还不一样。

**解法**: 商业项目中通常**不使用原生 date**，而是使用 JS 组件库（如 Flatpickr, Ant Design DatePicker）来保证 UI 一致性。但在**移动端**，强烈建议使用原生 `date`，因为能唤起系统级的原生滚轮，体验最好。

### Q7: 点击按钮没有反应，或者自动刷新页面了？
**原因**: `<button>` 默认的 `type` 是 `submit`。放在 `<form>` 里点击会自动提交刷新。

**解法**: 如果只是想触发 JS 逻辑，请显式声明类型：
```html
<button type="button" onclick="...">普通按钮</button>
```