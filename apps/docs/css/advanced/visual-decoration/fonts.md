# 字体与图标 (Web Fonts & Icons)

字体是页面的「声音」——它决定了文字的观感、品牌气质与可读性。`@font-face` 让我们摆脱系统字体的束缚，把自定义字体、图标字体引入网页；而如何加载它们，则直接影响首屏性能。

**一句话理解**：**「`@font-face` 负责把字体文件『请进』网页，`font-display` 决定它没加载完时页面怎么办。」**

## 1. `@font-face`：引入自定义字体

`@font-face` 声明一个字体家族，并指定其字体文件的来源：

```css
@font-face {
  font-family: 'MyFont'; /* 自定义字体名 */
  src:
    url('/fonts/myfont.woff2') format('woff2'),
    url('/fonts/myfont.woff') format('woff'); /* 多个源，按顺序回退 */
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

声明后即可像普通字体一样使用：

```css
body {
  font-family: 'MyFont', sans-serif;
}
```

### 1.1 同一字体家族的多字重声明

不同字重（bold、italic）需要**分别声明**，用 `font-weight`/`font-style` 区分：

```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
}
```

## 2. 字体格式与加载顺序

现代浏览器主要支持以下格式，`woff2` 体积最小、优先推荐：

| 格式    | 说明                                      | 压缩率 |
| ------- | ----------------------------------------- | ------ |
| `woff2` | 现代标准，压缩率最高，首选。              | 最优   |
| `woff`  | 上一代标准，兼容旧浏览器，作为回退。      | 较好   |
| `ttf`   | 系统通用格式，体积大，一般作为最后回退。  | 无压缩 |
| `otf`   | OpenType，比 ttf 支持更多特性（连字等）。 | 无压缩 |
| `eot`   | 仅老版 IE 使用，基本已淘汰。              | 已淘汰 |

**写法要点**：`src` 中按「体积从小到大、优先级从高到低」排列，浏览器会下载第一个它支持且能用的格式。

## 3. `font-display`：字体加载期间的表现

字体是异步加载的，加载完成前文字可能「闪一下」或「空白」。`font-display` 控制这一阶段的呈现策略：

| 取值       | 行为                                                                 | 适用场景             |
| ---------- | -------------------------------------------------------------------- | -------------------- |
| `auto`     | 交给浏览器默认策略（通常是 block 的变体）。                          | 默认                 |
| `block`    | 加载期间**隐藏文字**（不可见），加载完成后显示。可能产生「白屏」期。 | 品牌字体要求严格     |
| `swap`     | 加载期间先用**回退字体**显示，加载完成后再「替换」。                 | 正文、追求可读性     |
| `fallback` | 极短的隐藏期（约 100ms）后先用回退字体，若之后加载完成再替换。       | 折中                 |
| `optional` | 极短隐藏期后决定：能用回退就用回退，**放弃本次字体下载**。           | 性能敏感、非关键字体 |

### 3.1 FOUT 与 FOIT

- **FOUT**（Flash of Unstyled Text）：先用回退字体，加载后再替换（`swap`）。
- **FOIT**（Flash of Invisible Text）：加载期间文字不可见（`block`）。

**推荐**：正文使用 `swap` 保证可读性，图标字体使用 `block` 避免「图标先显示为方框再替换」。

## 4. 字体性能与优化

- **优先 `woff2`**：比 `woff` 体积通常小 30% 以上。
- **按需子集化 (Subset)**：只打包用到的字符集（中文尤其重要，完整中文字体动辄数 MB）。
- **预加载关键字体**：避免二次网络往返。

```html
<link
  rel="preload"
  href="/fonts/myfont.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

- **控制字体数量**：每个字重/字型（如 bold、italic）都是独立文件，宁缺毋滥。

### 4.1 `unicode-range`：分段加载

只让指定字符范围的文字使用该字体，其余回退，避免加载整个字体：

```css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* 仅拉丁字符使用此字体 */
}
```

### 4.2 可变字体 (Variable Font)

一个可变字体文件可覆盖**多个字重/宽度/斜体**，替代多份静态文件：

```css
@font-face {
  font-family: 'VarFont';
  src: url('/fonts/var.woff2') format('woff2');
  font-weight: 100 900; /* 声明支持的字重范围 */
}

.text {
  font-family: 'VarFont';
  font-weight: 650;
} /* 任意字重 */
```

## 5. 字体回退与系统字体栈

### 5.1 font-family 回退机制

`font-family` 是**回退列表**：浏览器按顺序查找第一个可用字体，找不到就试下一个。

```css
body {
  font-family: 'MyFont', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  /*           优先        次选          次选              兜底   */
}
```

### 5.2 现代系统字体栈

系统字体零加载成本，是正文的最佳兜底：

```css
font-family:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
  Arial, sans-serif;
```

## 6. `font` 简写属性

`font` 可一次性声明多个字体属性，但**必须按固定顺序**，且至少包含 `font-size` 和 `font-family`：

```css
/* 语法：font: [font-style] [font-variant] [font-weight] font-size[/line-height] font-family */
.text {
  font:
    italic small-caps 700 16px/1.5 'MyFont',
    sans-serif;
}
```

## 7. 图标方案：字体图标 vs SVG

图标是 UI 的高频元素，主要有两种实现思路：

| 维度       | 图标字体 (Icon Font)                          | SVG 图标                            |
| ---------- | --------------------------------------------- | ----------------------------------- |
| 本质       | 把图标打包成字体，用 `font-family` + 字符渲染 | 矢量图形，直接内联或用 `<use>` 引用 |
| 缩放清晰度 | 依赖字体渲染，小字号边缘可能发虚              | 矢量无损，任意缩放清晰              |
| 颜色控制   | 单色，改色用 `color`                          | 支持多色、渐变、描边                |
| 体积       | 一次加载整套字体                              | 按需加载单个 SVG，更省              |
| 可维护性   | 需重新生成字体文件                            | 每个图标独立文件，易增删            |
| 代表       | Font Awesome、iconfont                        | Iconify、Lucide、内联 SVG           |

**现代推荐**：新项目优先选 **SVG 图标**（清晰、灵活、可 tree-shaking）；字体图标仍广泛存在于存量项目，理解其机制即可。

### 7.1 图标字体示例

```css
@font-face {
  font-family: 'iconfont';
  src: url('/fonts/iconfont.woff2') format('woff2');
}
.icon {
  font-family: 'iconfont';
  font-display: block;
}
```

```html
<i class="icon">&#xe600;</i>
```

### 7.2 SVG 图标示例（内联 + sprite）

```html
<!-- 内联 SVG -->
<svg width="24" height="24" viewBox="0 0 24 24">
  <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
</svg>
```

```html
<!-- SVG Sprite：定义一次，多次引用 -->
<svg style="display:none">
  <symbol id="icon-home" viewBox="0 0 24 24"><path d="..." /></symbol>
</svg>
<svg><use href="#icon-home"></use></svg>
```

## 8. 常见问题 (FAQ)

### 8.1 为什么字体在首次加载时「闪」了一下才变成我指定的字体？

这是字体异步加载导致的「FOUT/FOIT」现象。用 `font-display: swap` 让文字在加载期间先用回退字体，可消除白屏闪烁。

### 8.2 中文自定义字体为什么特别大？

中文常用字几千个，完整字库动辄数 MB。务必做**子集化**（只保留实际用到的字符），或用 `unicode-range` 分段加载。

### 8.3 `@font-face` 声明了但字体没生效？

依次排查：`src` 路径是否正确、格式是否被当前浏览器支持、`font-family` 名称是否一致（区分大小写）、是否被后续 `font-family` 覆盖、以及 `font-weight` 是否匹配（用了 bold 但只声明了 400）。

### 8.4 字体图标为什么小字号下发虚？

字体渲染依赖「像素对齐 + hinting」，小字号（如 12px 以下）图标边缘容易模糊。此时优先用 **SVG**，或改用 `-webkit-font-smoothing: antialiased` 微调。

## 9. 总结

- `@font-face` 引入字体，`src` 按优先级排列多格式回退，多字重需分别声明。
- `font-display` 控制加载期表现：正文用 `swap`，图标用 `block`。
- 性能三件套：**woff2 + 子集化 + preload**；进阶用 `unicode-range`、可变字体。
- 图标优先 **SVG**，字体图标理解机制即可。
