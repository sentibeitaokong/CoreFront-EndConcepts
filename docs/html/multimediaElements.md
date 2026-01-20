# HTML 多媒体元素 (`MultimediaElements`)

在 Web 早期，播放视频音频需要依赖 Flash 等插件。HTML5 引入了原生多媒体标签，彻底改变了这一局面。

## 1. 图片元素 `<img>`

虽然简单，但它是网页性能优化的核心战场。

### 1.1 基础语法
```html
<img src="photo.jpg" alt="风景照" width="300" height="200">
```

### 1.2 关键属性
| 属性 | 描述 | 最佳实践 |
| :--- | :--- | :--- |
| **`src`** | 图片地址。 | 支持 WebP, JPG, PNG, GIF, SVG. |
| **`alt`** | **替代文本**。图片挂掉时显示；盲人读屏器朗读。 | **必填**。SEO 权重高。如果是装饰性图片，写 `alt=""`。 |
| **`width` / `height`** | 图片的**固有尺寸**。 | **必填**。防止图片加载时页面“抖动”（CLS 偏移）。 |
| **`loading`** | 加载策略。 | **`lazy`** (懒加载)：滚动到视口附近才下载图片，极大提升首屏速度。<br>`eager` (默认)：立即加载。 |
| **`srcset`** | 响应式图片源。 | 根据屏幕密度（1x/2x）或宽度加载不同清晰度的图。 |

### 1.3 响应式图片实战
让浏览器自动选择最合适的图片（省流量、高清晰）。
```html
<img src="small.jpg"
     srcset="small.jpg 500w, medium.jpg 1000w, large.jpg 2000w"
     sizes="(max-width: 600px) 100vw, 50vw"
     alt="响应式图片">
```

## 2. 视频元素 `<video>`

HTML5 最强大的标签之一。

### 2.1 基础语法
```html
<video src="movie.mp4" controls width="100%"></video>
```

### 2.2 核心属性
| 属性 | 描述 | 注意事项 |
| :--- | :--- | :--- |
| **`src`** | 视频地址。 | 推荐使用 `.mp4` (H.264 编码)，兼容性最好。 |
| **`controls`** | 显示播放控件（进度条、音量、全屏）。 | 如果不加，用户无法操作（除非你用 JS 写自定义控件）。 |
| **`autoplay`** | **自动播放**。 | **必须配合 `muted`** 使用，否则浏览器会拦截（防止扰民）。 |
| **`muted`** | **静音**。 | - |
| **`loop`** | 循环播放。 | - |
| **`poster`** | **封面图**。 | 视频加载前显示的图片。如果不写，显示视频第一帧（但这需要下载视频头信息，慢）。 |
| **`preload`** | 预加载策略。 | `auto` (加载全部)<br>`metadata` (只加载时长/尺寸信息 - **推荐**)<br>`none` (不预加载)。 |

### 2.3 兼容性写法 (多格式源)
有些浏览器支持更高效的 WebM 格式，不支持的自动回退到 MP4。
```html
<video controls poster="cover.jpg">
    <source src="movie.webm" type="video/webm">
    <source src="movie.mp4" type="video/mp4">
    <p>您的浏览器不支持 HTML5 视频。</p>
</video>
```

##  3. 音频元素 `<audio>`

用法几乎与 `<video>` 完全一致，只是没有宽高和封面。

### 3.1 基础语法
```html
<audio src="music.mp3" controls></audio>
```

### 3.2 核心属性
*   `controls`: 显示播放器（必须加，否则 `<audio>` 默认是看不见的）。
*   `autoplay`: 自动播放（大部分现代浏览器**拦截**音频自动播放，除非用户先与页面交互过）。
*   `loop`: 循环。
*   `muted`: 静音。

##  4. 嵌入内容 `<iframe>`

用于在当前页面挖一个窗口，展示另一个网页。

### 4.1 场景
*   嵌入 Bilibili/YouTube 视频。
*   嵌入 Google Maps / 百度地图。
*   广告位。

### 4.2 语法
```html
<iframe src="https://player.bilibili.com/..." 
        width="600" height="400" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

##  5. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么我的 `<video autoplay>` 不自动播放？
**原因**: 现代浏览器（Chrome/Safari/Firefox）为了用户体验，**默认禁止**带声音的媒体自动播放。
**解法**: 必须加上 `muted` 属性。
```html
<!-- 正确写法 -->
<video autoplay muted loop playsinline>...</video>
```
*注: `playsinline` 是为了兼容 iOS Safari，防止视频自动全屏播放。*

### Q2: 视频在 iPhone 上点击播放就自动全屏了？
**原因**: iOS 的默认行为。

**解法**: 添加 `playsinline` 属性（如果是 webview 还需 APP 端配合配置）。
```html
<video playsinline ...>
```

### Q3: 为什么 `<img>` 下方有 3px 的空白缝隙？
**原因**: 图片默认是 `inline-block`，对齐文本基线 (baseline)。缝隙是给字母下伸部分留的。

**解法**:
1.  `img { display: block; }` (推荐)
2.  `img { vertical-align: bottom; }`

### Q4: 怎么禁止用户下载我的图片/视频？
**没有绝对的方法**。只要浏览器能显示，用户就能拿到资源（F12、抓包）。

**防君子不防小人**:
1.  **图片**: 禁用右键 `oncontextmenu="return false;"`。
2.  **视频**: 使用 `controlsList="nodownload"` (Chrome 专属属性)。
    ```html
    <video controls controlsList="nodownload">
    ```

### Q5: 为什么 GIF 图加载这么慢？
GIF 格式非常古老且压缩率低。

**解法**: 使用 `<video>` 播放静音的 `.mp4` 或 `.webm` 循环视频来代替 GIF。体积通常能减小 90%。
```html
<video autoplay loop muted playsinline src="animation.mp4"></video>
```

### Q6: `object-fit` 是什么？
这是 CSS 属性，专门解决图片/视频变形问题。
*   `object-fit: cover;`: 保持比例填满容器（裁切多余部分）。
*   `object-fit: contain;`: 保持比例完整显示（留黑边）。
```css
img, video {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 类似 background-size: cover */
}
```