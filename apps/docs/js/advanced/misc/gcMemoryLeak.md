# 垃圾回收与内存泄漏

JavaScript 有自动垃圾回收（GC），开发者无需像 C 那样手动 `free`。但「自动」不等于「无需关心」——不当的引用会让对象永远无法被回收，最终内存泄漏导致页面卡顿甚至崩溃。

**一句话理解**：**「GC 回收『不可达』的对象；内存泄漏的根源，是让本该死去的对象还保留着一条可达的引用链。」**

## 1. 可达性：GC 判断对象是否该回收的依据

GC 的核心是「**可达性 (Reachability)**」：从根（Root）出发，能沿着引用链走到的对象就是「可达」的，会被保留；否则就是「垃圾」，等待回收。

### 1.1 根（Root）包括哪些？

- 全局变量、当前执行函数的局部变量与参数。
- 当前调用栈上的变量。
- 事件监听器、定时器、闭包捕获的变量。

```javascript
let user = { name: 'xunbei' }
user = null // 原对象不再被任何引用，变为不可达，可被回收
```

### 1.2 引用链示例

```javascript
let a = { b: { c: 'data' } } // a → b → c 整条链可达
a.b = null // c 失去引用，成为垃圾
```

## 2. V8 垃圾回收机制

V8（Chrome/Node 的 JS 引擎）采用**分代回收**，把堆分成两代：

| 代     | 名称      | 特点               | 回收策略                          |
| ------ | --------- | ------------------ | --------------------------------- |
| 新生代 | Young Gen | 存活时间短、对象小 | Scavenge（复制算法），频繁、快速  |
| 老生代 | Old Gen   | 存活时间长、对象大 | 标记-清除 + 标记-整理，偶尔、耗时 |

### 2.1 新生代：Scavenge（复制算法）

新生代空间一分为二（From / To），存活对象在两次回收间来回「搬运」：

1. 存活对象从 From 复制到 To。
2. 角色互换，From 清空。
3. **经过多次回收仍存活的对象「晋升」到老生代**。

### 2.2 老生代：标记-清除 + 标记-整理

- **标记-清除 (Mark-Sweep)**：先标记所有可达对象，再清除未标记对象。缺点是会产生内存碎片。
- **标记-整理 (Mark-Compact)**：清除后把存活对象向一端移动，解决碎片问题。
- **增量标记 (Incremental Marking)**：把标记过程拆成小步，与 JS 交替执行，减少主线程卡顿。
- **引用计数**：早期算法，因无法处理循环引用，现代浏览器已弃用。

### 2.3 为什么循环引用曾是问题？

引用计数无法回收互相引用但外部不可达的对象：

```javascript
function cycle() {
  const a = {}
  const b = {}
  a.b = b
  b.a = a // 循环引用：a 和 b 互相引用
  // 函数返回后，外部无法访问 a、b，但引用计数认为它们「被引用」而不回收
}
```

现代浏览器用「可达性」判断，循环引用的对象函数返回后即不可达，能被正常回收。

## 3. 常见内存泄漏场景

### 3.1 全局变量泄漏

未声明变量会成为全局属性，永不回收：

```javascript
function fn() {
  name = 'xunbei' // 漏写 let/const，name 挂到 window 上
}
```

### 3.2 被遗忘的定时器与回调

```javascript
const timer = setInterval(() => {
  /* ... */
}, 1000)
// 组件销毁时忘记 clearInterval，回调被持有，相关对象无法回收
clearInterval(timer) // 必须清理
```

### 3.3 事件监听器未移除

```javascript
// 组件挂载时监听，卸载时必须移除
window.addEventListener('resize', handler)
// 卸载时：
window.removeEventListener('resize', handler)
```

### 3.4 闭包捕获大对象

```javascript
let cache = null
function init() {
  const big = new Array(1000000).fill('x') // 大对象
  cache = function () {
    return big
  } // 闭包引用 big
}
init() // big 被闭包永久持有，即使不再使用
```

### 3.5 DOM 引用未清理

```javascript
let el = document.getElementById('box')
document.body.removeChild(el) // 移除 DOM
// 但 el 变量仍持有引用，元素无法被回收
el = null // 解除引用
```

### 3.6 未释放的 Blob URL

```javascript
const url = URL.createObjectURL(blob)
img.src = url
// 未调用 URL.revokeObjectURL(url)，内存常驻
```

### 3.7 框架中的「异步后置状态更新」

```javascript
// React 组件卸载后，异步请求回来仍 setState，可能引用已卸载组件的状态
useEffect(() => {
  let cancelled = false
  fetch('/api').then(res => {
    if (!cancelled) setData(res) // 用标志位避免卸载后更新
  })
  return () => {
    cancelled = true
  }
}, [])
```

## 4. 排查内存泄漏

### 4.1 观察现象

- 页面越用越卡、响应变慢。
- 任务管理器 / Chrome 任务管理器内存持续上涨。
- 长时间运行后标签页崩溃。

### 4.2 Chrome DevTools Memory 面板

1. **Heap Snapshot（堆快照）**：分别在不同时间点拍快照，对比两次快照，找到未被回收的对象。
2. **Allocation on timeline（时间轴分配）**：录制内存分配过程，定位反复分配却未释放的对象。
3. **Performance 面板**：观察 JS Heap 曲线是否「锯齿状」（有回收）还是「持续上升」（泄漏）。

### 4.3 快速定位步骤

1. 打开 DevTools → Memory → 选 **Heap snapshot**。
2. 操作前拍一次快照，重复操作（如反复打开/关闭弹窗）后再拍一次。
3. 在第二次快照顶部切换对比视图，按 **Shallow Size / Retained Size** 排序。
4. 找到「新增且未释放」的对象，查看其 **Retainers**（持有链），追溯是谁引用了它。

### 4.4 关键指标

| 指标          | 含义                           |
| ------------- | ------------------------------ |
| Shallow Size  | 对象自身占用的内存             |
| Retained Size | 对象及其「独占」的引用链总内存 |

## 5. 最佳实践

- **及时清理**：定时器 `clearInterval`、事件 `removeEventListener`、Blob URL `revokeObjectURL`。
- **组件卸载钩子**：Vue `onUnmounted` / React `useEffect` 清理函数中统一清理副作用。
- **慎用全局与闭包**：避免把大对象长期留在全局作用域或被闭包捕获。
- **`WeakMap` / `WeakSet`**：作为缓存时用弱引用，键被回收后条目自动消失。

```javascript
const cache = new WeakMap() // 键是对象，对象被回收后条目自动清除
function getVal(key) {
  if (!cache.has(key)) cache.set(key, compute(key))
  return cache.get(key)
}
```

### 5.1 弱引用的三种武器

| 特性      | 说明                                                 |
| --------- | ---------------------------------------------------- |
| `WeakMap` | 键必须是对象，键被回收后条目自动消失，**不可遍历**。 |
| `WeakSet` | 值必须是对象，弱引用，**不可遍历**。                 |
| `WeakRef` | 持有对象的弱引用，用 `.deref()` 读取（可能已回收）。 |

## 6. 总结

- GC 依据「可达性」回收不可达对象。
- V8 分代回收：新生代复制（Scavenge），老生代标记-清除 + 标记-整理。
- 泄漏根源 = 忘清理定时器/监听器/闭包引用/全局变量/Blob URL。
- 排查靠 DevTools 堆快照 + 时间轴，最佳实践是「谁创建谁清理」。
