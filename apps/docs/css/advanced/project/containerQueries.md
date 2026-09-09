# CSS 容器查询 (Container Queries)

CSS 容器查询允许组件根据“**父容器尺寸**”调整样式，而不是只根据浏览器视口调整样式。

它解决的是组件复用中的响应式问题：同一个卡片、列表、侧边栏组件，放在不同宽度的区域里时，可以自动切换布局。

## 1. 为什么需要容器查询？

传统响应式通常使用媒体查询：

```css
@media (min-width: 768px) {
  .card {
    display: flex;
  }
}
```

媒体查询关注的是视口宽度。问题是：组件实际可用空间不一定等于视口宽度。

容器查询让组件根据自己的外部容器做判断：

```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 480px) {
  .card {
    display: flex;
    gap: 16px;
  }
}
```

## 2. 声明查询容器

要使用容器查询，必须先把某个元素声明为查询容器。

```css
.card-wrapper {
  container-type: inline-size;
}
```

常见的 `container-type` 值：

| 值            | 作用                                   |
| :------------ | :------------------------------------- |
| `inline-size` | 只查询容器的行内方向尺寸，通常就是宽度 |
| `size`        | 同时查询容器的宽度和高度               |
| `normal`      | 默认值，不作为尺寸查询容器             |

实际项目中最常用的是 `inline-size`，因为多数响应式布局主要根据宽度变化。

**`size` 的注意事项**：使用 `size` 意味着容器的高度也必须能被查询，因此容器不能依赖内容自动撑开高度（否则会造成循环依赖）。通常需要给容器一个明确的高度，或在特定布局（如 Grid/Flex 的拉伸子项）中使用。

```css
.sidebar {
  container-type: size;
  height: 100%; /* 需要明确高度，否则 size 查询无法工作 */
}
```

另外，声明为查询容器后，元素会被浏览器纳入布局包含（containment）处理，这会影响 `position: absolute` 后代、`float` 等布局行为，需要留意。

## 3. 基本语法

`@container` 的写法和 `@media` 很像。

```css
.product-card-list {
  container-type: inline-size;
}

.product-card {
  display: grid;
  gap: 12px;
}

@container (min-width: 520px) {
  .product-card {
    grid-template-columns: 160px 1fr;
    align-items: center;
  }
}
```

这段代码表示：当 `.product-card` 所在的最近查询容器宽度大于等于 `520px` 时，卡片切换为左右布局。

注意：`@container` 查询的是最近的祖先查询容器，不是当前元素自己。

## 4. 命名容器与就近原则

如果页面中存在多层容器，可以给容器命名，让规则只匹配指定容器。

```css
.dashboard-panel {
  container-name: panel;
  container-type: inline-size;
}

@container panel (min-width: 640px) {
  .stat-card {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

`container` 简写可以同时声明名称和类型：

```css
.dashboard-panel {
  container: panel / inline-size;
}
```

**就近原则**：不带名字的 `@container` 会匹配元素**最近的**祖先查询容器；带名字的 `@container name` 则匹配最近的、名称相符的祖先容器。当元素同时位于多个嵌套容器中时，这个规则决定了到底以谁为准。

命名容器适合复杂页面，比如仪表盘、编辑器、后台管理系统中有多个嵌套区域时，避免规则匹配到不期望的容器。

## 5. 查询条件

容器查询支持范围语法。

```css
@container (width > 480px) {
  .card {
    padding: 20px;
  }
}

@container (320px <= width <= 640px) {
  .card-title {
    font-size: 18px;
  }
}
```

也可以组合多个条件：

```css
@container (min-width: 480px) and (max-width: 799px) {
  .toolbar {
    flex-wrap: wrap;
  }
}
```

> 此外还有 `style()` 查询，可以查询容器的自定义属性值（如 `@container style(--theme: dark)`），但浏览器支持尚不稳定，实际工程中先以尺寸查询为主。

## 6. 容器查询单位

容器查询提供了一组基于查询容器尺寸的单位。

| 单位    | 含义                      |
| :------ | :------------------------ |
| `cqw`   | 查询容器宽度的 1%         |
| `cqh`   | 查询容器高度的 1%         |
| `cqi`   | 查询容器行内方向尺寸的 1% |
| `cqb`   | 查询容器块级方向尺寸的 1% |
| `cqmin` | `cqi` 和 `cqb` 中较小的值 |
| `cqmax` | `cqi` 和 `cqb` 中较大的值 |

```css
.card-wrapper {
  container-type: inline-size;
}

.card-title {
  font-size: clamp(16px, 6cqw, 28px);
}
```

这里的 `6cqw` 表示查询容器宽度的 `6%`。相比 `vw`，它不会被整个视口影响，更适合组件内部的弹性字号和间距。

## 7. 与媒体查询的区别

| 对比项   | 媒体查询                 | 容器查询                   |
| :------- | :----------------------- | :------------------------- |
| 查询对象 | 视口、设备特性           | 祖先查询容器               |
| 关注点   | 页面级响应式             | 组件级响应式               |
| 常见场景 | 整体布局、导航、页面断点 | 卡片、列表、表格、面板组件 |
| 复用性   | 与页面环境绑定更强       | 更适合组件封装             |

两者不是替代关系，而是互补关系：

- 页面整体结构变化，用媒体查询。
- 组件在不同容器中自适应，用容器查询。

## 8. 工程实践

### 8.1 把容器声明放在组件外层

```html
<section class="article-card-container">
  <article class="article-card">
    <h3>标题</h3>
    <p>内容摘要</p>
  </article>
</section>
```

```css
.article-card-container {
  container: article-card / inline-size;
}

@container article-card (min-width: 560px) {
  .article-card {
    display: grid;
    grid-template-columns: 180px 1fr;
  }
}
```

不要让需要被改变的元素同时作为自己的查询容器。容器查询规则作用于容器的后代元素，这样结构更清晰。

### 8.2 断点跟随组件，而不是页面

容器查询的断点应该来自组件自身布局临界点，而不是直接照搬页面断点。

```css
@container (min-width: 420px) {
  .user-card {
    grid-template-columns: auto 1fr;
  }
}
```

这里的 `420px` 应该表示 `.user-card` 从上下布局切换到左右布局所需的最小空间。

### 8.3 与 CSS 变量配合

容器查询可以只修改组件变量，让组件样式更集中。

```css
.profile-card {
  --avatar-size: 48px;
  --card-gap: 12px;

  display: flex;
  gap: var(--card-gap);
}

@container (min-width: 480px) {
  .profile-card {
    --avatar-size: 72px;
    --card-gap: 20px;
  }
}

.profile-card-avatar {
  width: var(--avatar-size);
  height: var(--avatar-size);
}
```

这种写法适合组件库：查询规则只负责改变 token，具体属性仍由组件本身消费。

## 9. 常见问题 (FAQ) 与 故障排除

### 9.1 为什么写了 `@container` 却完全不生效？

**现象**：`@container` 规则写好了，但组件没有任何变化。

**原因**：只写 `@container` 不会自动产生查询容器。必须先在某个**祖先元素**上声明 `container-type`（或 `container`）。

**解决**：确认被查询元素有祖先元素声明了 `container-type: inline-size` 或 `container-type: size`。

```css
/* 缺少容器声明，规则无效 */
@container (min-width: 500px) {
  .card {
    display: flex;
  }
}
```

### 9.2 想查询组件自身宽度，为什么不行？

**现象**：把 `container-type` 和 `@container` 都写在同一个元素上，以为是在查询自己。

**原因**：容器查询查询的是**祖先容器**，不是当前被设置样式的元素。元素自己不能作为自己的查询容器。

**解决**：新增一个外层容器作为查询容器，让目标元素作为后代被规则影响。

```css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 500px) {
  .card {
    display: flex;
  }
}
```

### 9.3 嵌套了多个容器，规则匹配错了容器怎么办？

**现象**：页面里多层容器嵌套，`@container` 命中了不期望的那个容器。

**原因**：不带名字的 `@container` 匹配**最近的**祖先查询容器，这个“最近”可能不是你想的那个。

**解决**：给容器命名，用 `@container name` 精确匹配。

```css
.sidebar {
  container: sidebar / inline-size;
}

@container sidebar (min-width: 300px) {
  .menu {
    flex-direction: column;
  }
}
```

### 9.4 `container-type: size` 为什么查询不到高度？

**现象**：用了 `size`，但高度相关的查询条件一直不生效。

**原因**：`size` 需要容器有明确的高度。如果容器高度由内容撑开，浏览器无法建立“**高度查询容器**”，会退化为只支持行内方向（甚至完全不支持）。

**解决**：给容器明确高度（`height: 100%` 或固定值），或改用 `inline-size` 只查询宽度。

### 9.5 声明容器后，`position: absolute` 子元素位置变了？

**现象**：给元素加上 `container-type` 后，其内部绝对定位元素突然相对它定位了。

**原因**：查询容器会应用布局包含（`contain: layout`）。这会改变 `position: absolute` 后代的包含块，也会影响 `float` 等布局行为。

**解决**：这是预期行为。需要绝对定位脱离容器时，把定位元素放到查询容器之外，或用 `position: relative` 的中间层单独控制包含块。

### 9.6 容器单位 `cqw` 在不支持的浏览器怎么办？

**现象**：老浏览器里 `6cqw` 无法解析，字号直接失效。

**原因**：容器单位是较新的特性，需要浏览器支持。

**解决**：写一个 fallback，把不支持的浏览器能用的值放在前面：

```css
.card-title {
  font-size: 18px; /* 兜底 */
  font-size: clamp(16px, 6cqw, 28px); /* 支持的浏览器覆盖 */
}
```

### 9.7 容器查询能替代媒体查询吗？

**不能完全替代**。两者解决不同层级的问题：

- 页面整体结构、导航、布局断点，用媒体查询。
- 组件在不同容器中自适应，用容器查询。
