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

## 4. 命名容器

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

通常建议保持条件简单，把断点和组件布局变化绑定在一起。

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

示例：

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

## 9. 常见误区

### 9.1 忘记声明 `container-type`

只写 `@container` 不会自动产生查询容器。

```css
@container (min-width: 500px) {
  .card {
    display: flex;
  }
}
```

如果祖先元素没有声明 `container-type`，这条规则不会按预期生效。

### 9.2 查询当前元素自身宽度

容器查询查询的是祖先容器，不是当前被设置样式的元素。

```css
.card {
  container-type: inline-size;
}

@container (min-width: 500px) {
  .card {
    display: flex;
  }
}
```

这段代码容易误解为查询 `.card` 自己。更推荐新增外层容器，让 `.card` 作为被查询影响的后代元素。

### 9.3 过度使用容器查询

容器查询适合组件局部适配，不应该替代所有布局方案。

如果只是简单的父子排列，优先使用 Flex、Grid、`minmax()`、`auto-fit` 等布局能力。只有当样式确实需要在某个容器宽度下发生结构性变化时，再使用容器查询。

## 10. 总结

- 容器查询使用 `@container` 根据祖先查询容器的尺寸改变组件样式。
- 使用前需要通过 `container-type` 或 `container` 声明查询容器。
- `inline-size` 是最常见的容器类型，适合基于宽度的组件响应式。
- 命名容器可以避免复杂嵌套中匹配错误的容器。
- `cqw`、`cqi` 等容器单位适合组件内部的弹性字号和间距。
- 页面级响应式用媒体查询，组件级响应式用容器查询。
