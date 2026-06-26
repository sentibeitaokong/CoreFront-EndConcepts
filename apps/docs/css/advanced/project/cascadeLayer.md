# CSS Cascade Layer

CSS Cascade Layer 是 CSS 级联层，用来显式管理不同来源样式之间的优先顺序。

它解决的不是“**单个选择器怎么写**”，而是“**整个项目的样式层级怎么治理**”。在组件库、重置样式、第三方样式、业务覆盖并存的项目中非常有用。

## 1. 为什么需要 Cascade Layer？

传统 CSS 主要依赖三件事决定最终样式：

- 来源和重要性，比如浏览器样式、作者样式、`!important`。
- 选择器优先级，比如 id、class、标签。
- 书写顺序，后写的覆盖先写的。

问题是：大型项目里很容易出现为了覆盖样式不断加选择器、加嵌套、加 `!important` 的情况。

```css
.button {
  color: blue;
}

.page .content .button {
  color: red;
}

.button.primary {
  color: green !important;
}
```

Cascade Layer 允许我们先定义“**层**”的顺序，再把样式放进对应层里。这样可以从架构层面控制覆盖关系。

## 2. 基本语法

使用 `@layer` 声明一个层。

```css
@layer reset {
  button {
    border: none;
    background: none;
  }
}

@layer components {
  .button {
    color: #fff;
    background: #1677ff;
  }
}
```

同一个层可以分多次书写，浏览器会把它们合并到同一层里。

```css
@layer components {
  .button {
    padding: 8px 16px;
  }
}

@layer components {
  .card {
    padding: 16px;
  }
}
```

## 3. 层的顺序

层的顺序通常在文件开头统一声明。

```css
@layer reset, base, components, utilities;
```

越靠后的层，优先级越高。

```css
@layer reset, components;

@layer reset {
  button {
    color: black;
  }
}

@layer components {
  button {
    color: blue;
  }
}
```

最终 `button` 的颜色是 `blue`，因为 `components` 层排在 `reset` 后面。

注意：这里即使两个选择器优先级相同，也是后面的层胜出。

## 4. Layer 与选择器优先级的关系

Cascade Layer 的关键点是：**层级顺序优先于层内选择器优先级**。

```css
@layer base, components;

@layer base {
  #app .button {
    color: red;
  }
}

@layer components {
  .button {
    color: blue;
  }
}
```

最终颜色是 `blue`。

虽然 `#app .button` 的选择器优先级更高，但它在 `base` 层；`.button` 在更靠后的 `components` 层。

这就是 Cascade Layer 的价值：减少“**选择器军备竞赛**”。

## 5. 未分层样式的优先级

普通未放进 `@layer` 的作者样式，优先级高于所有普通 layer 样式。

```css
@layer components {
  .button {
    color: blue;
  }
}

.button {
  color: red;
}
```

最终颜色是 `red`。

所以在工程中要么有意识地保留未分层样式作为最终覆盖层，要么尽量把项目样式全部纳入 layer 管理。

## 6. 与 `!important` 的关系

普通声明中，越靠后的层优先级越高。

但是 `!important` 会反过来：越靠前的层优先级越高。

```css
@layer reset, components;

@layer reset {
  .button {
    color: red !important;
  }
}

@layer components {
  .button {
    color: blue !important;
  }
}
```

最终颜色是 `red`。

原因是 `!important` 的设计目标是保护更基础、更底层的样式不被轻易覆盖。

实际项目中仍然建议少用 `!important`，把优先级治理交给层顺序。

## 7. 导入第三方样式

`@import` 可以直接指定导入文件所属的 layer。

```css
@layer reset, vendor, components, utilities;

@import url('./normalize.css') layer(reset);
@import url('./third-party.css') layer(vendor);
```

这样第三方样式不会因为选择器复杂而难以覆盖。

```css
@layer components {
  .button {
    color: #1677ff;
  }
}
```

只要 `components` 层排在 `vendor` 后面，就可以稳定覆盖第三方样式。

## 8. 推荐分层方案

一个常见的工程分层如下：

```css
@layer reset, base, tokens, components, utilities, overrides;
```

| 层名         | 用途                           |
| :----------- | :----------------------------- |
| `reset`      | normalize、reset、清除默认样式 |
| `base`       | `body`、标题、链接等基础元素   |
| `tokens`     | CSS 变量、主题变量             |
| `components` | 按钮、表单、弹窗等组件样式     |
| `utilities`  | 工具类，比如 `.mt-8`           |
| `overrides`  | 页面级或特殊业务覆盖           |

示例：

```css
@layer reset, base, tokens, components, utilities, overrides;

@layer tokens {
  :root {
    --color-primary: #1677ff;
  }
}

@layer components {
  .button {
    background: var(--color-primary);
  }
}

@layer utilities {
  .mt-16 {
    margin-top: 16px;
  }
}
```

## 9. 常见误区

### 9.1 Layer 不是作用域隔离

Cascade Layer 只管理级联优先级，不会限制选择器的匹配范围。

```css
@layer components {
  .title {
    color: red;
  }
}
```

`.title` 仍然会匹配页面上所有 class 为 `title` 的元素。

如果需要作用域隔离，应该结合 CSS Modules、Vue scoped、Shadow DOM 或命名规范。

### 9.2 Layer 不能替代合理命名

Layer 可以降低覆盖成本，但不能解决所有样式污染问题。

```css
@layer components {
  .item {
    color: red;
  }
}
```

`.item` 仍然是一个过于宽泛的类名。工程中仍然应该使用清晰的组件命名，比如 `.x-menu-item`。

### 9.3 不要随处声明层顺序

推荐只在入口文件声明一次层顺序。

```css
@layer reset, base, tokens, components, utilities, overrides;
```

如果多个文件里反复声明不同顺序，会增加维护成本，也容易让人误判覆盖关系。

## 10. 总结

- Cascade Layer 用 `@layer` 管理样式层级。
- 先声明的层优先级低，后声明的层优先级高。
- 层级顺序优先于层内选择器优先级。
- 未分层的普通样式优先级高于所有普通 layer 样式。
- `!important` 在 layer 中会反转层级优先顺序。
- 推荐用于 reset、第三方样式、组件库、工具类和业务覆盖的工程化治理。
