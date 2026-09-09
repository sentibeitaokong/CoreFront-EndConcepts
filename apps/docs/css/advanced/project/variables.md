# CSS 变量 (CSS Variables)

CSS变量也叫**CSS自定义属性**（Custom Properties）。它允许我们在CSS中定义可以复用、继承、动态修改的值。

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

> 注意：自定义属性的名字是**大小写敏感**的，`--primary-color` 和 `--Primary-Color` 是两个完全不同的变量。

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

- `.card-title` 如果在 `.card` 内部，颜色是 `#666`。
- `.card-title` 如果不在 `.card` 内部，颜色是 `#222`。

这意味着 CSS 变量不是简单的“**全局常量**”，它是可以被局部覆盖的动态值。

自定义属性默认是**继承**的，和普通属性一样：定义在父元素上，子元素就能读到。

## 3. fallback 默认值

当变量不存在时，可以给 `var()` 设置默认值，第二个参数就是默认值。

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

两个需要注意的细节：

- **fallback 只在变量“未定义”时生效**。如果变量已经定义，但值不合法（比如 `--size: red`），fallback 不会兜底，属性会直接按“无效值”处理。
- **fallback 从第一个逗号后开始**，所以 fallback 本身可以包含逗号，比如字体列表：

```css
.font {
  font-family: var(--custom-font, 'PingFang SC', 'Microsoft YaHei', sans-serif);
}
```

这里如果 `--custom-font` 未定义，`font-family` 会回退为整个 `"PingFang SC", "Microsoft YaHei", sans-serif` 字体栈。

## 4. 变量的值类型

CSS 变量不挑类型，几乎可以保存任何值：颜色、长度、百分比、字符串、完整的一串值。

```css
:root {
  --color: #1677ff;
  --length: 16px;
  --ratio: 50%;
  --complex: 0 8px 24px rgb(0 0 0 / 12%);
  --list: 1px solid #eee;
}
```

## 5. 与预处理器变量的区别

Sass/Less 变量是在构建阶段被替换的，而 CSS 变量是在浏览器运行时计算的。

| 对比项   | Sass/Less 变量       | CSS 变量              |
| :------- | :------------------- | :-------------------- |
| 生效阶段 | 编译时               | 运行时                |
| 是否继承 | 不继承               | 遵循 CSS 继承和级联   |
| JS 修改  | 不能直接修改         | 可以通过 DOM 动态修改 |
| 主题切换 | 通常需要生成多份样式 | 修改变量即可          |

```scss
//编译前
$primary-color: #1677ff;

.button {
  background: $primary-color;
}

//编译后
.button {
  background: #1677ff; //浏览器已经不知道 `$primary-color` 的存在
}
```

CSS 变量则会保留在浏览器中：

```css
.button {
  background: var(--primary-color);
}
```

## 6. 动态主题切换

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

**通过 JS 切换：**

```js
document.documentElement.dataset.theme = 'dark'
```

**配合 `prefers-color-scheme` 自动跟随系统**：

```css
:root {
  --bg-color: #ffffff;
  --text-color: #1f2329;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #141414;
    --text-color: #f5f5f5;
  }
}
```

也可以用 `light-dark()` 函数同时定义两套值，由系统配色自动选择：

```css
:root {
  color-scheme: light dark;
  --bg-color: light-dark(#ffffff, #141414);
}
```

## 7. 变量可以参与计算

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

## 8. 在组件中的最佳实践

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

## 9. 使用 @property 声明类型化变量

普通 CSS 变量是“**无类型**”的字符串，浏览器无法判断它是什么。`@property` 可以给自定义属性声明类型，从而获得更强的能力：

- 可以做类型校验，非法值会被忽略。
- 可以声明默认值（`initial-value`）。
- **可以参与动画**——这是普通变量做不到的。

```css
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

.ring {
  animation: spin 3s linear infinite;
  background: conic-gradient(from var(--angle), #1677ff, transparent);
}

@keyframes spin {
  to {
    --angle: 360deg;
  }
}
```

没有 `@property` 时，`--angle` 只是一个普通字符串，`from var(--angle)` 的渐变无法被浏览器插值；声明为 `<angle>` 类型后就可以平滑过渡。

## 10. 常见问题 (FAQ) 与 故障排除

### 10.1 为什么变量定义了但没生效？

**现象**：明明在 `:root` 里定义了 `--color`，但 `.box { color: var(--color) }` 没有任何效果。

**原因**：通常有三类。

- 当前元素访问不到该变量（变量定义在无关的作用域，比如兄弟元素上）。
- 变量值本身不符合当前属性的语法（如 `width: var(--color)` 中 `--color: #1677ff`）。
- 后面的样式通过级联覆盖了当前属性。

**解决**：用开发者工具查看该元素，确认变量是否出现在“**自定义属性**”列表里，以及它的计算值是什么。

```css
.box {
  --size: red;
  width: var(--size); /* 无效：width 不接受 red */
}
```

### 10.2 变量定义在父元素上，为什么子元素读不到？

**现象**：变量写在了 `.card` 上，但 `.card` 的后代读不到。

**原因**：自定义属性是继承的，只要定义在祖先元素上后代就能读到。如果读不到，多半是：

- 选择器没真正命中（类名拼错、作用域不匹配）。
- 变量值被更近的祖先覆盖成了别的值。

**解决**：先确认祖先选择器确实命中，再检查是否有更近的祖先重新定义了同名变量。

### 10.3 为什么 fallback 没生效？

**现象**：`var(--btn-color, #333)`，颜色却不是 `#333`。

**原因**：fallback 只在变量“**未定义**”时兜底。如果变量已经定义了，但它的值对当前属性不合法，属性会变成“**无效值**”，直接回退到 `inherit` / `initial`，而不是用 fallback。

```css
:root {
  --size: red;
}

.box {
  width: var(--size, 200px); /* --size 已定义，fallback 不生效，width 变无效 */
}
```

**解决**：不要把 fallback 当成“**值校验器**”。想保证值一定合法，可以配合 `@property` 做类型约束（见第 9 节）。

### 10.4 变量名区分大小写吗？

区分。`--color-primary` 和 `--Color-Primary` 是两个不同的变量。

### 10.5 CSS 变量能保存一整段声明吗？

只能保存**属性值**，不能保存完整声明。

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
  --card-style: color: red; /* 不能这样保存整条声明 */
}
```

### 10.6 CSS 变量能用在媒体查询里吗？

**不能**。媒体查询在 CSS 解析阶段求值，而 CSS 变量是运行时才替换的，二者不在同一阶段。

```css
/* 无效：--bp 无法在 @media 中使用 */
@media (min-width: var(--bp)) { ... }
```

需要动态断点，请使用容器查询（Container Queries），它查询的是容器尺寸而非变量。

### 10.7 怎么用 JS 读写 CSS 变量？

**读取**：

```js
getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
```

**写入**：

```js
document.documentElement.style.setProperty('--primary-color', '#ff4d4f')
```

**删除**：

```js
document.documentElement.style.removeProperty('--primary-color')
```

### 10.8 为什么变量在 `@keyframes` 里不生效？

普通自定义属性无法被浏览器插值，所以在 `@keyframes` 里直接写 `--x: 0` → `--x: 100` 不会产生动画。

```css
.box {
  width: 100px;
  height: 100px;
  background: red;
  /* 直接使用变量控制宽度 */
  width: var(--x);
}

@keyframes move {
  0% {
    --x: 50px;
  }
  100% {
    --x: 200px;
  }
}

.box:hover {
  animation: move 2s ease;
}
```

**解决**：用 `@property` 声明类型，让浏览器知道如何插值。

```css
/* 1. 注册自定义属性为“长度”类型 */
@property --x {
  syntax: '<length>';
  initial-value: 0px;
  inherits: false;
}

.box {
  width: 100px;
  height: 100px;
  background: red;
  /* 使用变量 */
  width: var(--x);
}

@keyframes move {
  0% {
    --x: 50px;
  }
  100% {
    --x: 200px;
  }
}

.box:hover {
  animation: move 2s ease;
}
```
