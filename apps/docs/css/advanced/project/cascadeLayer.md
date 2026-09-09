# CSS Cascade Layer

CSS Cascade Layer（级联层）用来显式管理不同来源样式之间的优先顺序。

它解决的不是“**单个选择器怎么写**”，而是“**整个项目的样式层级怎么治理**”。在组件库、重置样式、第三方样式、业务覆盖并存的项目中非常有用。

## 1. 为什么需要 Cascade Layer？

大型项目里很容易出现为了覆盖样式不断加选择器、加嵌套、加 `!important` 的情况。

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
    /* 胜出  */
    color: blue;
  }
}
```

**注意**：这里即使两个选择器优先级相同，也是后面的层胜出。

## 4. 匿名层与嵌套层

### 4.1 匿名层

`@layer` 不带名字时，会创建一个匿名层。每个匿名层都是独立的，无法被后续规则引用（无法合并）。

```css
@layer {
  .button {
    color: red;
  }
}
```

匿名层的优先级规则和具名层一致：后写的匿名层优先级更高，未分层样式高于匿名层。匿名层主要用于“**一次性**”包裹某段样式，避免污染命名空间。

### 4.2 嵌套层

层可以嵌套，用 `.` 表示层级关系，方便按模块组织。

```css
@layer framework.base, framework.components;

@layer framework.base {
  body {
    margin: 0;
  }
}

@layer framework.components {
  .button {
    color: #1677ff;
  }
}
```

引用嵌套层时，可以用完整路径 `framework.components`，也可以在父层内部用相对名字 `@layer components`。

## 5. Layer 与选择器优先级的关系

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
    /* 胜出  */
    color: blue;
  }
}
```

## 6. 未分层样式的优先级

普通未放进 `@layer` 的作者样式，优先级高于所有普通 layer 样式。

```css
@layer components {
  .button {
    color: blue;
  }
}

.button {
  /* 胜出  */
  color: red;
}
```

## 7. 与 `!important` 的关系

普通声明中，越靠后的层优先级越高。

但是 `!important` 会反过来：越靠前的层优先级越高。

```css
@layer reset, components;

@layer reset {
  /* 胜出  */
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

## 8. 导入第三方样式

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

## 9. 推荐分层方案

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

## 10. 常见问题 (FAQ) 与 故障排除

### 10.1 加了 `@layer` 后，为什么原本生效的样式失效了？

**现象**：把原来正常的样式改成 `@layer components { ... }` 之后，突然被别的样式覆盖了。

**原因**：未分层的普通样式优先级**高于**所有普通 layer 样式。项目里如果残留了未分层的样式，它们会“**压过**”你的 layer。

**解决**：要么把残留的普通样式也纳入 layer 管理，要么把这些“**兜底覆盖**”的样式刻意留在 layer 之外作为最终覆盖层。

### 10.2 我的 `!important` 怎么反而“输了”？

**现象**：在两个 layer 里都写了 `!important`，结果排在**前面**的层生效了。

**原因**：这是 `!important` 在 layer 中的反转规则——越靠前的层优先级越高。目的是保护基础层不被覆盖。

**解决**：记住这个反转规则；如果不需要反转语义，尽量避免在同一属性上同时用 `!important`，把优先级治理交给层顺序。

### 10.3 `@import` 写在 `@layer` 下面为什么无效？

**现象**：把 `@import url(...) layer(vendor)` 写在文件中间，结果不生效。

**原因**：`@import` 必须出现在所有其他规则之前（`@charset` 除外），否则会被浏览器忽略。

**解决**：把 `@layer` 顺序声明和所有 `@import` 都放在文件最顶部。

### 10.4 Layer 能替代作用域隔离吗？

**不能**。Cascade Layer 只管理级联优先级，不会限制选择器的匹配范围。

```css
@layer components {
  .title {
    color: red;
  }
}
```

`.title` 仍然会匹配页面上所有 class 为 `title` 的元素。

如果需要作用域隔离，应该结合 CSS Modules、Vue scoped、Shadow DOM 或命名规范。

### 10.5 Layer 能替代合理命名吗？

**不能完全替代**。Layer 可以降低覆盖成本，但不能解决所有样式污染问题。

```css
@layer components {
  .item {
    color: red;
  }
}
```

`.item` 仍然是一个过于宽泛的类名。工程中仍然应该使用清晰的组件命名，比如 `.x-menu-item`。

### 10.6 应该在哪里声明层顺序？

**推荐只在入口文件声明一次**。

```css
@layer reset, base, tokens, components, utilities, overrides;
```

如果多个文件里反复声明不同顺序，会增加维护成本，也容易让人误判覆盖关系。
