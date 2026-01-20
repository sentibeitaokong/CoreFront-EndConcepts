这是一个关于 **HTML5 拖放 (Drag and Drop API)** 的**详细 API 文档**、**实战指南**及**常见问题解析**。

HTML5 原生拖放允许用户在网页内部拖拽元素（如列表排序、看板），甚至从操作系统拖拽文件到网页中（文件上传）。

---

# 1. 核心概念与流程

拖放操作涉及两个主要角色：
1.  **拖拽源 (Drag Source)**: 被拖动的元素。
2.  **放置目标 (Drop Target)**: 接受拖拽元素的容器。

---

# 2. API 速查表 (事件系统)

拖放全过程由 **7 个事件** 组成。

### 2.1 拖拽源触发的事件 (Source Events)

| 事件 | 触发时机 | 常用操作 |
| :--- | :--- | :--- |
| **`dragstart`** | **开始拖动时** (只触发一次) | 设置传输数据 (`setData`)，改变元素样式（如透明度）。 |
| **`drag`** | **拖动过程中** (持续触发，类似 mousemove) | 实时更新位置（一般很少用，性能消耗大）。 |
| **`dragend`** | **拖动结束时** (无论是成功放下还是取消) | 清理样式，重置状态。 |

### 2.2 放置目标触发的事件 (Target Events)

| 事件 | 触发时机 | 核心逻辑 |
| :--- | :--- | :--- |
| **`dragenter`** | 拖拽元素**进入**目标区域时 | 添加高亮样式（如边框变红）。 |
| **`dragover`** | 拖拽元素在目标区域**上方移动**时 (持续触发) | **必填**：必须执行 `e.preventDefault()` 才能允许放置。 |
| **`dragleave`** | 拖拽元素**离开**目标区域时 | 移除高亮样式。 |
| **`drop`** | 拖拽元素**放下**在目标区域时 | **获取数据** (`getData`)，处理业务逻辑（如移动 DOM，读取文件）。 |

---

# 3. 核心对象：`DataTransfer`

在所有拖放事件对象 `event` 中，都有一个属性 `event.dataTransfer`。它是拖拽源和放置目标之间**传递数据的桥梁**。

### 3.1 方法
*   **`setData(format, data)`**: (在 `dragstart` 中用) 存入数据。
    *   `format`: 通常是 `'text/plain'` 或 `'text/html'`。
*   **`getData(format)`**: (在 `drop` 中用) 读取数据。
*   **`clearData([format])`**: 清除数据。
*   **`setDragImage(imgElement, x, y)`**: 自定义拖动时跟随鼠标的“幽灵图”。

### 3.2 属性
*   **`effectAllowed`**: (Source 设置) 允许的操作类型 (`none`, `copy`, `move`, `link`, `all`)。
*   **`dropEffect`**: (Target 设置) 当前放置操作的视觉反馈（鼠标指针样式）。
*   **`files`**: 如果是从桌面拖文件，这里包含文件列表 (`FileList`)。

---

# 4. 实战一：元素拖拽排序 (Sortable List)

这是最常见的场景：把左边的方块拖到右边。

### 步骤 1: 开启拖拽 (`draggable="true"`)
默认只有图片和链接可以拖拽。其他元素必须显式开启。

```html
<div id="source" draggable="true">我是可拖拽的方块</div>
<div id="target">拖到这里</div>
```

### 步骤 2: 绑定事件

```javascript
const source = document.getElementById('source');
const target = document.getElementById('target');

// --- 拖拽源逻辑 ---

source.addEventListener('dragstart', (e) => {
  // 1. 传输数据：存入 ID
  e.dataTransfer.setData('text/plain', e.target.id);
  // 2. 视觉反馈：半透明
  setTimeout(() => e.target.style.opacity = '0.5', 0);
  e.dataTransfer.effectAllowed = 'move';
});

source.addEventListener('dragend', (e) => {
  // 恢复样式
  e.target.style.opacity = '1';
});

// --- 放置目标逻辑 ---

target.addEventListener('dragover', (e) => {
  // 3. 关键：必须阻止默认行为，否则 drop 不会触发！
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});

target.addEventListener('dragenter', (e) => {
  e.target.style.border = '2px dashed red'; // 高亮
});

target.addEventListener('dragleave', (e) => {
  e.target.style.border = '1px solid black'; // 恢复
});

target.addEventListener('drop', (e) => {
  e.preventDefault();
  e.target.style.border = '1px solid black';
  
  // 4. 获取数据
  const id = e.dataTransfer.getData('text/plain');
  const draggableElement = document.getElementById(id);
  
  // 5. 移动 DOM
  target.appendChild(draggableElement);
});
```

---

# 5. 实战二：文件拖拽上传

从桌面拖拽图片到网页。

```javascript
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); // 必须阻止，否则浏览器会直接打开图片
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  
  // 1. 获取文件列表
  const files = e.dataTransfer.files;
  
  if (files.length > 0) {
    const file = files[0];
    console.log('文件名:', file.name);
    
    // 2. 预览图片
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('preview').src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // 3. 可以在这里构造 FormData 上传到服务器
  }
});
```

---

# 6. 常见问题 (FAQ) 与 避坑指南

### Q1: 为什么 `drop` 事件死活不触发？
**原因**: 浏览器的默认行为是“禁止放置”。
**解法**: 必须在 **`dragover`** 事件中调用 **`e.preventDefault()`**。
```javascript
target.addEventListener('dragover', (e) => e.preventDefault());
```

### Q2: `dragover` 触发频率太高，导致闪烁？
**现象**: 在 `dragover` 里做复杂的 DOM 操作（如插入占位符），会导致页面疯狂重排重绘。
**解法**:
1.  尽量在 `dragenter` 中做一次性操作。
2.  在 `dragover` 中只做必要的 `e.preventDefault()` 和 `dropEffect` 设置。
3.  利用 CSS `pointer-events: none` 解决子元素频繁触发 `dragleave` 的问题。

### Q3: 为什么 `dragleave` 在进入子元素时也会触发？
**痛点**: 当鼠标从“父容器”移动到“父容器里的子元素”时，父容器会触发 `dragleave`，紧接着子元素触发 `dragenter`。这导致父容器的高亮样式闪烁（加上又去掉）。
**解法**:
1.  **计数器法**: 用一个变量 `counter`。`dragenter` 时 `++`，`dragleave` 时 `--`。只有当 `counter === 0` 时才真正移除样式。
2.  **CSS 法**: 给子元素设置 `pointer-events: none;`（如果子元素不需要交互）。

### Q4: 拖拽时不想显示默认的“幽灵图”，或者想自定义？
**解法**: 使用 `setDragImage`。
```javascript
source.addEventListener('dragstart', (e) => {
  const img = new Image();
  img.src = 'custom-ghost.png';
  e.dataTransfer.setDragImage(img, 0, 0);
  // 或者隐藏它：用一个透明的 1x1 canvas
});
```

### Q5: Firefox 的特殊坑点？
在 Firefox 中，如果没有在 `dragstart` 中调用 `setData`，拖拽可能无法启动。
**建议**: 即使不传数据，也写一行 `e.dataTransfer.setData('text/plain', '')` 以保平安。

### Q6: 移动端支持吗？
**原生不支持**。HTML5 Drag and Drop API 主要是为鼠标交互设计的，在触摸屏设备（iOS/Android）上几乎完全不可用。
**解法**: 移动端必须使用 Touch 事件模拟，或者直接使用成熟库（如 **Sortable.js** 或 **React-DnD**），它们内部处理了兼容性。