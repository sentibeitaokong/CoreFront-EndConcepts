# HTML5 拖放（Drag and Drop API）

HTML5 原生拖放允许用户在网页内部拖拽元素（如列表排序、看板卡片），甚至从操作系统拖拽文件到网页中（文件上传）。

## 1. 核心概念与流程

拖放操作涉及两个角色：

- **拖拽源（Drag Source）**：被拖动的元素。
- **放置目标（Drop Target）**：接受拖拽元素的容器。

### 1.1 `draggable` 属性

**并非所有元素都能拖拽**。默认只有以下内容可拖：

- ✅ `<img>` 图片
- ✅ `<a>` 带 `href` 的链接
- ✅ 被选中的文本

其他元素（如 `<div>`）必须显式开启：

```html
<div draggable="true">我是可拖拽的方块</div>
<!-- draggable="true" / "false" / "auto"（默认，由元素类型决定） -->
```

### 1.2 完整事件流程

一次完整的拖放，事件按以下顺序触发：

```markdown
dragstart → drag(反复) → dragenter → dragover(反复) → dragleave / drop → dragend
```

## 2. 事件系统

### 2.1 拖拽源触发的事件（Source Events）

| 事件            | 触发时机                                   | 常用操作                                          |
| :-------------- | :----------------------------------------- | :------------------------------------------------ |
| **`dragstart`** | **开始拖动时**（只触发一次）               | 设置传输数据（`setData`）、改变样式（如半透明）。 |
| **`drag`**      | **拖动过程中**（持续触发，类似 mousemove） | 实时更新位置（一般少用，性能消耗大）。            |
| **`dragend`**   | **拖动结束时**（无论放下还是取消都触发）   | 清理样式、重置状态。                              |

### 2.2 放置目标触发的事件（Target Events）

| 事件            | 触发时机                                     | 核心逻辑                                                      |
| :-------------- | :------------------------------------------- | :------------------------------------------------------------ |
| **`dragenter`** | 拖拽元素**进入**目标区域时                   | 添加高亮样式。                                                |
| **`dragover`**  | 拖拽元素在目标区域**上方移动**时（持续触发） | **必填**：必须 `e.preventDefault()` 才允许放置。              |
| **`dragleave`** | 拖拽元素**离开**目标区域时                   | 移除高亮样式。                                                |
| **`drop`**      | 拖拽元素**放下**在目标区域时                 | **获取数据**（`getData`）、处理业务逻辑（移动 DOM、读文件）。 |

## 3. 核心对象：`DataTransfer`

所有拖放事件的 `event` 对象里都有 **`event.dataTransfer`**，它是拖拽源与放置目标之间**传递数据的桥梁**。

### 3.1 方法

| 方法                          | 使用时机       | 说明                                                      |
| :---------------------------- | :------------- | :-------------------------------------------------------- |
| **`setData(format, data)`**   | `dragstart` 中 | 存入数据，`format` 通常为 `'text/plain'` 或 `'text/html'` |
| **`getData(format)`**         | `drop` 中      | 读取数据                                                  |
| **`clearData([format])`**     | 任意           | 清除数据，不带参数则清空所有                              |
| **`setDragImage(img, x, y)`** | `dragstart` 中 | 自定义拖拽时跟随鼠标的「幽灵图」                          |

### 3.2 属性

| 属性                | 说明                                                    |
| :------------------ | :------------------------------------------------------ |
| **`effectAllowed`** | Source 设置，允许的操作类型。                           |
| **`dropEffect`**    | Target 设置，当前放置操作的视觉反馈（鼠标指针样式）。   |
| **`files`**         | 从桌面拖入文件时的文件列表（`FileList`）。              |
| **`types`**         | 当前拖拽中已设置的数据格式列表（只读）。                |
| **`items`**         | 更底层的 `DataTransferItemList`，可逐项处理（含文件）。 |

### 3.3 `effectAllowed` 与 `dropEffect` 的关系

这是最容易踩坑的地方。**`dropEffect` 必须是 `effectAllowed` 允许的操作之一，否则会被浏览器忽略（表现为不能放置）。**

- `effectAllowed`（source 声明「允许做什么」）：`none` / `copy` / `copyLink` / `copyMove` / `link` / `linkMove` / `move` / `all` / `uninitialized`。
- `dropEffect`（target 声明「当前想做什么」）：`none` / `copy` / `link` / `move`。

```js
source.addEventListener('dragstart', e => {
  e.dataTransfer.effectAllowed = 'move' // 只允许移动
})

target.addEventListener('dragover', e => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move' // 必须与 effectAllowed 匹配，否则无效
})
```

> 速记：`move`（移动，源消失）、`copy`（复制，源保留）、`link`（创建链接）。

## 4. 元素拖拽排序

把左边的方块拖到右边（最基本的「源 → 目标」场景）。

### 4.1 开启拖拽

```html
<div id="source" draggable="true">我是可拖拽的方块</div>
<div id="target">拖到这里</div>
```

### 4.2 绑定事件

```js
const source = document.getElementById('source')
const target = document.getElementById('target')

// --- 拖拽源逻辑 ---
source.addEventListener('dragstart', e => {
  // 1. 传输数据：存入 ID
  e.dataTransfer.setData('text/plain', e.target.id)
  // 2. 视觉反馈：半透明（用 setTimeout 让样式在拖拽开始后生效）
  setTimeout(() => (e.target.style.opacity = '0.5'), 0)
  e.dataTransfer.effectAllowed = 'move'
})

source.addEventListener('dragend', e => {
  // 恢复样式
  e.target.style.opacity = '1'
})

// --- 放置目标逻辑 ---
target.addEventListener('dragover', e => {
  // 3. 关键：必须阻止默认行为，否则 drop 不会触发！
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
})

target.addEventListener('dragenter', e => {
  e.target.style.border = '2px dashed red' // 高亮
})

target.addEventListener('dragleave', e => {
  e.target.style.border = '1px solid black' // 恢复
})

target.addEventListener('drop', e => {
  e.preventDefault()
  e.target.style.border = '1px solid black'

  // 4. 获取数据
  const id = e.dataTransfer.getData('text/plain')
  const draggableElement = document.getElementById(id)

  // 5. 移动 DOM
  target.appendChild(draggableElement)
})
```

## 5. 文件拖拽上传

从桌面拖拽文件到网页，常用于图片上传、文件导入。

```html
<div
  id="drop-zone"
  style="border: 2px dashed #ccc; padding: 40px; text-align: center;"
>
  把文件拖到这里
</div>
```

```js
const dropZone = document.getElementById('drop-zone')

// 进入区域：高亮
dropZone.addEventListener('dragenter', e => {
  e.preventDefault()
  dropZone.classList.add('dragover')
})

// 在区域内移动：必须 preventDefault 才允许 drop
dropZone.addEventListener('dragover', e => {
  e.preventDefault() // 必须阻止，否则浏览器会直接打开文件
  e.dataTransfer.dropEffect = 'copy'
})

// 离开区域：取消高亮
dropZone.addEventListener('dragleave', e => {
  dropZone.classList.remove('dragover')
})

// 放下：处理文件
dropZone.addEventListener('drop', e => {
  e.preventDefault()
  dropZone.classList.remove('dragover')

  const files = e.dataTransfer.files // 文件列表

  if (files.length > 0) {
    const file = files[0]
    console.log('文件名:', file.name, '大小:', file.size)

    // 预览图片
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = event => {
        document.getElementById('preview').src = event.target.result
      }
      reader.readAsDataURL(file)
    }

    // 构造 FormData 上传到服务器
    // const formData = new FormData()
    // formData.append('file', file)
  }
})
```

```css
#drop-zone.dragover {
  border-color: #4caf50;
  background: #f0fff0;
}
```

## 6. 自定义拖拽图像

默认拖拽时浏览器会用被拖元素的截图作为「幽灵图」，可自定义：

```js
source.addEventListener('dragstart', e => {
  // 自定义一张图片跟随鼠标
  const img = new Image()
  img.src = 'custom-ghost.png'
  e.dataTransfer.setDragImage(img, 20, 20) // (20, 20) 为鼠标相对图片的偏移

  e.dataTransfer.setData('text/plain', e.target.id)
})
```

> 想**隐藏**默认幽灵图，可传入一个透明元素（如 1×1 透明 canvas）。

## 7. 常见问题（FAQ）与避坑指南

### 7.1 为什么 `drop` 事件死活不触发？

**原因**：浏览器默认行为是「禁止放置」。

**解法**：必须在 **`dragover`** 事件中调用 **`e.preventDefault()`**。

```js
target.addEventListener('dragover', e => e.preventDefault())
```

### 7.2 `dragover` 触发频率太高，导致闪烁/卡顿？

**现象**：在 `dragover` 里做复杂 DOM 操作，会导致疯狂重排重绘。

**解法**：

- 尽量在 `dragenter` 中做一次性操作（如加高亮）。
- `dragover` 里只做必要的 `e.preventDefault()` 和 `dropEffect` 设置。
- 用 CSS `pointer-events: none` 解决子元素频繁触发 `dragleave` 的问题。

### 7.3 为什么 `dragleave` 在进入子元素时也会触发？

**痛点**：鼠标从「父容器」移到「父容器的子元素」时，父容器会触发 `dragleave`，紧接着子元素触发 `dragenter`，导致父容器高亮样式闪烁。

**解法一：计数器法**（推荐）

```js
let counter = 0

target.addEventListener('dragenter', () => {
  counter++
  target.classList.add('dragover')
})

target.addEventListener('dragleave', () => {
  counter--
  if (counter === 0) target.classList.remove('dragover')
})

target.addEventListener('drop', () => {
  counter = 0
  target.classList.remove('dragover')
})
```

**解法二：CSS 法**——给子元素设置 `pointer-events: none;`（若子元素不需要交互）。

### 7.4 `effectAllowed` 与 `dropEffect` 不匹配导致无法放置

若在 `dragstart` 设置了 `effectAllowed = 'move'`，但在 `dragover` 里设置 `dropEffect = 'copy'`，则**放置操作无效**。

**解法**：两者保持一致。

### 7.5 拖拽排序时如何计算插入位置？

拖拽排序（列表内重排）需要根据鼠标位置判断插入到哪个元素前/后：

```js
list.addEventListener('dragover', e => {
  e.preventDefault()
  const dragging = document.querySelector('.dragging')
  // 找到当前鼠标悬停的元素
  const afterElement = getDragAfterElement(list, e.clientY)

  if (afterElement == null) {
    list.appendChild(dragging)
  } else {
    list.insertBefore(dragging, afterElement)
  }
})

// 根据鼠标 Y 坐标，找到应插入到哪个元素之前
function getDragAfterElement(container, y) {
  const elements = [...container.querySelectorAll('.item:not(.dragging)')]
  return elements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2
      // 取 offset 为负且最接近 0 的那个
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child }
      }
      return closest
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element
}
```
