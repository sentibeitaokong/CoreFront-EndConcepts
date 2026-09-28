# MutationObserver

用于观察 DOM 树中节点的增删、属性与文本内容变化。它取代了已废弃且性能低下的 `MutationEvent`，是 Observer 家族中最底层、使用最广的成员。

## 1. 方法与配置项

```js
const observer = new MutationObserver(callback) // 构造
observer.observe(target, options) // 开始观察（可对多个目标重复调用）
observer.takeRecords() // 取回未处理的记录并清空队列
observer.disconnect() // 停止全部观察
```

[width(23,18,18,41)]

| 方法                             | 参数                            | 返回值             | 说明                                                              |
| :------------------------------- | :------------------------------ | :----------------- | :---------------------------------------------------------------- |
| `new MutationObserver(callback)` | `callback(mutations, observer)` | 实例               | 只注册回调，此时还未观察任何目标                                  |
| `observe(target, options)`       | 目标节点、配置项                | `undefined`        | 开始观察；对同一目标重复调用是**覆盖配置**，对不同目标调用则并存  |
| `takeRecords()`                  | -                               | `MutationRecord[]` | 取回尚未派发的记录并清空内部队列（`disconnect()` 会直接丢弃它们） |
| `disconnect()`                   | -                               | `undefined`        | 停止全部观察并清空队列                                            |

- **没有 `unobserve()` 方法**：想停止观察某个目标，只能 `disconnect()` 后重新 `observe` 其余目标。
- `callback(mutations, observer)`：`mutations` 为 `MutationRecord` 数组，`observer` 为当前观察器。

**`observe(target, options)` 配置项：**

[width(33,18,13,36)]

| 选项                    | 类型       | 默认值  | 说明                                             |
| ----------------------- | ---------- | ------- | ------------------------------------------------ |
| `childList`             | `boolean`  | `false` | 监听目标**直接子节点**的增删                     |
| `subtree`               | `boolean`  | `false` | 是否监听目标及其所有后代节点                     |
| `attributes`            | `boolean`  | `false` | 监听属性变化                                     |
| `attributeFilter`       | `string[]` | -       | 仅监听指定属性名（需 `attributes: true` 才生效） |
| `attributeOldValue`     | `boolean`  | `false` | 属性记录中携带旧值（需 `attributes: true`）      |
| `characterData`         | `boolean`  | `false` | 监听文本节点内容变化                             |
| `characterDataOldValue` | `boolean`  | `false` | 文本记录中携带旧值（需 `characterData: true`）   |

- **`textContent` 属于 `childList`，不是 `characterData`**：`el.textContent = 'x'` 会移除旧文本节点、插入新文本节点，记录类型是 `childList`（`addedNodes` / `removedNodes` 里是文本节点）；只有 `textNode.data = 'x'`（或 `.nodeValue`）这类「改文本节点自身」的操作才产生 `characterData` 记录。
- **文本节点不在 `childList` 的层级里**：只写 `characterData: true` 却不开 `subtree`，通常收不到（除非观察目标本身就是那个文本节点）。

```js
// ✅ 想在元素层面感知文本变化，用 subtree 覆盖到文本节点
observer.observe(el, {
  characterData: true,
  characterDataOldValue: true,
  subtree: true,
})
```

- **`oldValue` 默认是 `null`**，要拿旧值必须显式开启 `attributeOldValue` / `characterDataOldValue`；`childList` 记录**永远没有 `oldValue`**——节点增删没有「旧值」的概念，只能从 `removedNodes` 自行推导。
- **`subtree: true` 会覆盖全文档**：`{ childList: true, subtree: true, attributes: true }` 观察 `document.body`，等于为页面上每一次 DOM 变动、每一次属性修改都记一笔并派发回调；第三方脚本与逐帧改 `style` 的动画库会把它变成高频回调。能用 `attributeFilter` 就别全量监听，**特别避免监听 `style`**。
- **不跨 Shadow 边界**：观察宿主元素（host）看不到 `shadowRoot` 内部的变动，需要拿到 `element.shadowRoot` 后单独 `observe()`；`iframe` 内部文档同理（需同源）。

## 2. 基本用法

```js
const target = document.querySelector('#list')

const observer = new MutationObserver((mutations, observer) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'childList':
        console.log('子节点增删', mutation.addedNodes, mutation.removedNodes)
        break
      case 'attributes':
        console.log('属性变化', mutation.attributeName, mutation.oldValue)
        break
      case 'characterData':
        console.log('文本变化', mutation.target.textContent)
        break
    }
  })
})

observer.observe(target, {
  childList: true, // 监听直接子节点的增删
  subtree: true, // 监听所有后代节点
  attributes: true, // 监听属性变化
  attributeOldValue: true, // 在 MutationRecord 中返回旧属性值
  attributeFilter: ['class', 'style'], // 只监听指定属性
  characterData: true, // 监听文本内容变化
  characterDataOldValue: true, // 返回旧文本值
})

// 主动取回尚未处理的记录（常在 disconnect 前调用）
const pending = observer.takeRecords()
observer.disconnect()
```

只想盯住某几个属性时，用 `attributeFilter` + `attributeOldValue` 把噪音挡在外面：

```js
// 只监听 data-status 的变化，并把旧值一起带出来
const observer = new MutationObserver(records => {
  records.forEach(({ attributeName, oldValue, target }) => {
    const nextValue = target.getAttribute(attributeName)
    console.log(`${target.id} 的 ${attributeName}: ${oldValue} → ${nextValue}`)
  })
})

observer.observe(document.querySelector('#panel'), {
  attributes: true,
  attributeFilter: ['data-status'],
  attributeOldValue: true,
})
```

## 3. 字段速查

[width(44,33,23)]

| 字段                                   | 含义                           | 适用类型                       |
| -------------------------------------- | ------------------------------ | ------------------------------ |
| `type`                                 | 变化类型                       | 全部                           |
| `target`                               | 发生变化的节点                 | 全部                           |
| `addedNodes` / `removedNodes`          | 新增 / 移除的节点（NodeList）  | `childList`                    |
| `previousSibling` / `nextSibling`      | 变化节点的相邻兄弟节点         | `childList`                    |
| `attributeName` / `attributeNamespace` | 变化的属性名 / 命名空间        | `attributes`                   |
| `oldValue`                             | 旧值（需开启对应 `*OldValue`） | `attributes` / `characterData` |

> **注意：** `addedNodes` / `removedNodes` 是**静态快照**——只反映记录生成那一刻涉及的节点，之后 DOM 再变也不会更新。记录是「当时发生了什么」的存档，不是当前状态的视图：想知道某个节点此刻还在不在文档里，用 `node.isConnected`。另外它们是 `NodeList` 而非数组，需要 `map` / `filter` 时先 `[...record.addedNodes]` 或 `Array.from()` 转换。

## 4. 关键点

- 回调参数 `mutations` 是一个**批量快照**：同一任务内的多次变化会合并成一次回调，天然支持批处理；即使同步代码里连续修改 100 次 DOM，也只触发一次。
- 回调是**微任务**，与 `Promise.then`、`queueMicrotask`、Vue 的 `nextTick` 同属微任务队列，按入队顺序执行。所以「改 DOM → `await`」时谁先执行取决于谁先入队，不要依赖模糊的先后关系；需要「等这一轮 DOM 变化处理完」，用 `requestAnimationFrame` 卡时机比靠微任务顺序可靠。
- **在回调里再改被观察的 DOM 会重新入队一轮**：改动再次命中观察条件就会一直循环（全量监听 `attributes` 却在回调里改 `class`、观察 `body` 子树却又 `appendChild` 同类节点），表现是标签页冻结。防护三件套：`attributeFilter` 收窄监听 → 回调里判断「是不是自己改的」→ 副作用推到 `requestAnimationFrame` / `setTimeout`。
- 降低开销的顺序：缩小观察范围到具体容器 → 回调里只做轻量标记（重活交给 `requestIdleCallback`）→ 大范围监听不可避免时做**采样**。
- `takeRecords()` 可主动取回未处理的记录并清空内部队列；`disconnect()` 也会一并清空队列，因此断开前若有未读记录应先 `takeRecords()`。
- **想监听「自己被移出文档」，要观察父节点**：观察器绑在自己身上时，节点一旦脱离文档就再也不会产生记录。正确姿势是观察**父节点**的 `childList`，再回头比对 `removedNodes`——第三方 SDK、弹窗、微前端容器在没有框架卸载钩子时，常靠它做兜底清理：

```js
// 组件被移出文档时释放资源
const observer = new MutationObserver(records => {
  for (const record of records) {
    if ([...record.removedNodes].includes(el)) {
      cleanup() // 清定时器、解绑事件、销毁实例
      observer.disconnect()
      return
    }
  }
})

observer.observe(el.parentNode, { childList: true }) // 观察父节点，而不是 el 自己
```

## 5. 示例：屏蔽广告弹窗

```js
// 场景：页面运行时自动屏蔽第三方脚本动态插入的广告/弹窗
const adPatterns = [/ad-banner/i, /sponsor/i, /popup/i]

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type !== 'childList') continue

    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return // 只处理元素节点

      const el = node
      const hit = adPatterns.some(pattern =>
        pattern.test(`${el.id} ${el.className}`),
      )
      if (hit) {
        console.log('已屏蔽广告节点:', el)
        el.remove()
      }
    })
  }
})

// 观察整个 body 的子树，广告可能在任意位置插入
observer.observe(document.body, { childList: true, subtree: true })
```

## 6. 典型场景

- **屏蔽第三方广告 / 弹窗**：监控 `childList + subtree`，发现符合特征（`id` / `class` / 固定尺寸）的节点就移除——回调里务必**只删不写**，否则容易触发回环。
- **富文本编辑器的协同与撤销**：把 DOM 变更集作为协同（OT / CRDT）的输入和历史栈记录，按 `record.type` 分流处理 `childList` 与 `characterData`。
- **组件「被卸载」的兜底清理**：观察父节点的 `childList`，发现自身被移出文档后立即释放定时器、事件绑定与实例——没有框架卸载钩子的第三方组件尤其需要。
- **微前端 / 框架挂载点管理**：监听容器子节点的挂载与卸载，驱动子应用生命周期的启动与销毁，顺带清理残留样式与全局变量。
- **表单与输入框校验**：用 `characterData` 监听文本节点变化；但 `input.value` / `textarea.value` 不产生 DOM 记录，只能监听 `input` 事件。
- **动态内容的自动补挂**：框架或第三方脚本渲染出节点后，给新增的图片 / 卡片补上曝光观察、事件绑定或懒加载（配合 `IntersectionObserver` 使用）。
- **防篡改 / 水印保护**：水印节点被删除或 `style` 被改写时重新插入并恢复——必须配合 `attributeFilter` 与「是不是自己改的」判断，否则直接死循环。

## 7. 常见问题 (FAQ)

### 7.1 开了 `characterData` 却收不到文本变化？

- **改的是不是 `textContent` / `innerHTML`**：这类赋值走的是 `childList`（替换文本节点），不走 `characterData`。
- **有没有开 `subtree`**：文本是元素的子节点，目标元素本身不会产生 `characterData` 记录。
- **改的是不是 `input` / `textarea` 的 `value`**：表单控件的值属于属性状态，**不体现在 DOM 结构里**，`MutationObserver` 根本看不到——只能监听 `input` / `change` 事件。
- **改的是不是框架的虚拟 DOM**：Vue / React 更新 DOM 后才会有记录，但更新是异步的，别在 `setState` 之后同步期待回调。

### 7.2 观察 `document.body` 会不会拖慢页面？

**会，而且是线上最常见的 MutationObserver 性能事故**。每次 DOM 变动都要生成记录、入队、派发回调，`subtree: true` 时覆盖全文档。降低代价的办法：`attributeFilter` 收窄（尤其别监听 `style`）、缩小观察范围到具体容器、回调里只做轻量处理、必要时采样。

### 7.3 在回调里改 DOM 会不会一直循环？怎么防？

会——改动再次命中观察条件就会再入队一轮。防护三件套：`attributeFilter` 收窄监听 → 回调里判断「是不是自己改的」→ 副作用推到下一帧。另外 `takeRecords()` / `disconnect()` 都会清空内部队列，断开前若还有未读记录要先 `takeRecords()`。

### 7.4 为什么 Vue / React 不用 MutationObserver 做响应式？

因为它是**事后通知**，缺少响应式系统需要的关键信息：

[width(13,34,53)]

| 维度     | MutationObserver             | 框架的响应式（Proxy / 编译期）           |
| :------- | :--------------------------- | :--------------------------------------- |
| 时机     | 变化**已发生**后的异步微任务 | 赋值**那一刻**同步拦截                   |
| 信息     | 只知道「哪个节点变了」       | 知道「谁改了、改了哪个字段、旧值是什么」 |
| 能否阻止 | 不能，只能事后修补           | 可以拦截、派生、合并更新                 |
| 开销     | 全量 DOM 变动都记录，粒度粗  | 只跟踪被访问过的依赖                     |

MutationObserver 的正确定位是**兜底与外部集成**：监控第三方脚本插入的节点、检测容器被挂载 / 卸载、做 DOM 水合与微前端容器管理。

### 7.5 记录里的 `addedNodes` / `removedNodes` 为什么是空的？

两者都是**静态快照**，只会包含**这一条记录**涉及的节点，所以：

- `type` 为 `attributes` / `characterData` 时，这两个列表**本来就是空的**——属性与文本变化不涉及节点增删。
- 你期待的节点如果是在**之后**才插入的（例如 `img.src` 赋值后异步渲染的图片、框架下一帧才挂上的内容），它属于下一条记录，不在这条里。
- 顺序上，`removedNodes` 里的节点**已经脱离原来的父节点**（`node.parentNode` 为 `null`），要拿它的上下文信息（`id`、`dataset`、位置）就得在回调里先读出来再存。

对应做法：`childList` 记录里同时看 `addedNodes` 与 `removedNodes`，转成数组后再处理；需要「元素当前是否还在文档里」时用 `node.isConnected`。
