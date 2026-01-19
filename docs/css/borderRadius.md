# CSS 圆角 (`border-radius`)

从最基础的“让按钮变圆”，到高级的“异形设计”，`border-radius` 是 CSS 中使用频率最高的属性之一。

## 1. 基础语法

`border-radius` 是一个简写属性，用于设置元素外边框圆角。

```css
/* 设置所有 4 个角为 10px */
.box {
  border-radius: 10px;
}
```

**单位**
*   **px (像素)**: 固定圆角大小（最常用）。
*   **% (百分比)**: 相对于**元素自身**的宽度和高度计算。
*   `50%`: 如果是正方形，会变成正圆；如果是长方形，会变成椭圆。

## 2. 控制单个角 (顺时针规则)

你可以分别为 4 个角设置不同的值，顺序遵循 **“左上 -> 右上 -> 右下 -> 左下”** (顺时针)。

| 值个数 | 语法示例 | 解释 |
| :--- | :--- | :--- |
| **1 个值** | `border-radius: 10px;` | 4 个角全是 10px。 |
| **2 个值** | `border-radius: 10px 50px;` | **对角相等**。<br>左上+右下=10px；右上+左下=50px。 |
| **3 个值** | `border-radius: 10px 50px 20px;` | 左上=10px；右上+左下=50px；右下=20px。 |
| **4 个值** | `border-radius: 10px 20px 30px 40px;` | 左上、右上、右下、左下。 |

**也可以单独设置某一个角：**
*   `border-top-left-radius`
*   `border-top-right-radius`
*   `border-bottom-right-radius`
*   `border-bottom-left-radius`

## 3. 常见形状“配方”

### A. 正圆 (Perfect Circle)
要求：宽度和高度必须相等。
```css
.circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
```

### B. 胶囊/药丸按钮 (Pill Shape)
无论按钮多宽，两头始终保持半圆。
**技巧**：设置一个**极大的像素值**。
```css
.btn {
  height: 40px;
  /* 不要用 50%，否则长方形按钮会变成难看的椭圆 */
  border-radius: 9999px; 
}
```

### C. 聊天气泡 / 树叶形
只设置对角，或者 3 个角。
```css
.message-bubble {
  border-radius: 15px 15px 0 15px; /* 左下角是直角 */
}

.leaf {
  border-radius: 0 50% 0 50%; /* 像一片叶子 */
}
```

## 4. 高级用法：椭圆圆角 (斜杠语法)

标准的 `border-radius: 50px` 画出的是正圆的一角。如果你想画**椭圆**的一角，需要使用 `/` 分隔水平半径和垂直半径。

**语法**：`border-radius: 水平半径 / 垂直半径;`

```css
/* 水平方向半径 100px，垂直方向半径 50px */
.ellipse-corner {
  border-radius: 100px / 50px;
}

/* 这种写法能创造出类似“手绘不规则圆”的效果 */
.blob {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}
```

## 5. 常见问题 (FAQ)

### Q1: 里面的图片溢出了圆角怎么办？
**现象**：给 div 设了圆角，但里面的 `<img>` 还是直角的，把圆角盖住了。

**解法**：在父容器上加 `overflow: hidden`。
```css
.card {
  border-radius: 10px;
  overflow: hidden; /* 关键属性：切掉溢出的子元素 */
}
```

### Q2: 边框 (Border) 和 圆角 的关系？
如果元素有边框，`border-radius` 设置的是**边框外侧**的圆角。
*   **内侧圆角**会自动计算：`内侧半径 = 外侧半径 - 边框厚度`。
*   如果 `边框厚度 > 外侧半径`，内侧就会变成直角。

### Q3: 嵌套圆角如何看起来才“协调”？
如果你有一个外框（圆角 20px）和一个内部按钮，内部按钮的圆角应该是多少才好看？

**公式**：`内圆角 = 外圆角 - Padding`
```css
.outer {
  padding: 10px;
  border-radius: 20px;
}
.inner {
  /* 视觉上最完美的同心圆角 */
  border-radius: 10px; /* 20px - 10px */
}
```