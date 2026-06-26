# CSS 变量 (CSS Variables)

CSS变量也叫**CSS自定义属性**。它允许我们在CSS中定义可以复用、继承、动态修改的值。

它最常见的使用场景是：主题色、间距系统、圆角、阴影、组件状态和暗黑模式。

## 1. 基本语法

CSS 变量使用 `--` 开头，通过 `var()` 读取。

```css
:root {
  --primary-color: #1677ff;
  --base-radius: 8px;
}

.button {
  color: #fff;
  border-radius: var(--base-radius);
  background-color: var(--primary-color);
}
```

- `--primary-color`：变量声明。
- `var(--primary-color)`：变量读取。
- `:root`：通常用来放全局变量，相当于文档级别的根作用域。

## 2. 变量的作用域

CSS 变量遵循 CSS 的级联和继承规则。变量定义在哪个元素上，就从哪个元素开始对它和它的后代生效。

```css
:root {
  --text-color: #222;
}

.card {
  --text-color: #666;
}

.card-title {
  color: var(--text-color);
}
```

在这个例子中：

- `.card-title` 如果在 `.card` 内部，颜色是 `#666`。
- `.card-title` 如果不在 `.card` 内部，颜色是 `#222`。

这意味着 CSS 变量不是简单的“全局常量”，它是可以被局部覆盖的动态值。

## 3. fallback 默认值

当变量不存在时，可以给 `var()` 设置默认值，第二个属性为默认值。

```css
.button {
  background-color: var(--button-bg, #1677ff);
}
```

fallback 也可以继续嵌套：

```css
.button {
  color: var(--button-color, var(--text-color, #333));
}
```

## 4. 与预处理器变量的区别

Sass/Less 变量是在构建阶段被替换的，而 CSS 变量是在浏览器运行时计算的。

| 对比项   | Sass/Less 变量       | CSS 变量              |
| :------- | :------------------- | :-------------------- |
| 生效阶段 | 编译时               | 运行时                |
| 是否继承 | 不继承               | 遵循 CSS 继承和级联   |
| JS 修改  | 不能直接修改         | 可以通过 DOM 动态修改 |
| 主题切换 | 通常需要生成多份样式 | 修改变量即可          |

```scss
$primary-color: #1677ff;

.button {
  background: $primary-color;
}
```

上面的 Sass 变量编译后只剩普通 CSS，浏览器已经不知道 `$primary-color` 的存在。

CSS 变量则会保留在浏览器中：

```css
.button {
  background: var(--primary-color);
}
```

## 5. 动态主题切换

CSS 变量最适合做主题系统，因为只需要切换变量值，所有引用它的组件都会自动更新。

```css
:root {
  --bg-color: #ffffff;
  --text-color: #1f2329;
  --border-color: #dcdfe6;
}

[data-theme='dark'] {
  --bg-color: #141414;
  --text-color: #f5f5f5;
  --border-color: #333333;
}

.page {
  color: var(--text-color);
  background-color: var(--bg-color);
}

.card {
  border: 1px solid var(--border-color);
}
```

通过 JS 切换：

```js
document.documentElement.dataset.theme = 'dark'
```

这种方式不需要重复写大量 `.dark .xxx` 样式。

## 6. 变量可以参与计算

CSS 变量可以和 `calc()`、`hsl()`、`color-mix()` 等函数组合使用。

```css
:root {
  --space: 8px;
  --primary-h: 220;
  --primary-s: 90%;
}

.card {
  padding: calc(var(--space) * 3);
}

.button {
  background-color: hsl(var(--primary-h), var(--primary-s), 50%);
}

.button:hover {
  background-color: hsl(var(--primary-h), var(--primary-s), 42%);
}
```

## 7. 在组件中的最佳实践

组件库中通常会分两层变量：

- **全局变量**：品牌色、字体、间距、圆角等设计系统 token。
- **组件变量**：按钮背景、输入框边框、弹窗阴影等具体组件 token。

```css
:root {
  --color-primary: #1677ff;
  --radius-base: 6px;
}

.x-button {
  --button-bg: var(--color-primary);
  --button-radius: var(--radius-base);

  color: #fff;
  border-radius: var(--button-radius);
  background: var(--button-bg);
}

.x-button.is-danger {
  --button-bg: #ff4d4f;
}
```

这样做的好处是：

- 组件内部有默认样式。
- 外部可以低成本覆盖变量。
- 不需要提高选择器优先级。

## 8. 常见问题

### 8.1 变量名区分大小写吗？

区分。`--color-primary` 和 `--Color-Primary` 是两个不同变量。

### 8.2 CSS 变量可以保存一整段属性吗？

可以保存属性值，但不能保存完整声明。

```css
:root {
  --card-shadow: 0 8px 24px rgb(0 0 0 / 12%);
}

.card {
  box-shadow: var(--card-shadow);
}
```

下面这种写法是无效的：

```css
:root {
  --card-style: color: red;
}
```

### 8.3 为什么变量定义了但没有生效？

通常有三类原因：

- 当前元素访问不到该变量，因为变量定义在无关的作用域里。
- 变量值本身不符合当前属性的语法。
- 后面的样式通过级联覆盖了当前属性。

```css
.box {
  --size: red;
  width: var(--size); /* 无效，因为 width 不能使用 red */
}
```

## 9. 总结

- CSS 变量使用 `--name` 声明，使用 `var(--name)` 读取。
- CSS 变量遵循级联、继承和作用域规则。
- CSS 变量是运行时能力，适合主题切换和组件定制。
- 配合 `calc()`、`hsl()` 可以搭建设计 token 系统。
- 在工程中推荐使用“**全局 token + 组件 token**”的两层结构。
