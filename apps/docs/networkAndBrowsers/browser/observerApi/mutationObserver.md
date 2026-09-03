# MutationObserver

用于观察 DOM 树中节点的增删、属性与文本内容变化。它取代了已废弃且性能低下的 `MutationEvent`，是 Observer 家族中最底层、使用最广的成员。

## 1. API 签名

```javascript
const observer = new MutationObserver(callback) // 构造
observer.observe(target, options) // 开始观察（可对多个目标重复调用）
observer.takeRecords() // 取回未处理的记录并清空队列
observer.disconnect() // 停止全部观察
```

- `callback(mutations, observer)`：变化回调，`mutations` 为 `MutationRecord` 数组，`observer` 为当前观察器。
- **没有 `unobserve()` 方法**：想停止观察某个目标，只能 `disconnect()` 后重新 `observe` 其余目标。

**`observe(target, options)` 配置项：**

| 选项                    | 类型       | 默认值  | 说明                                             |
| ----------------------- | ---------- | ------- | ------------------------------------------------ |
| `childList`             | `boolean`  | `false` | 监听目标**直接子节点**的增删                     |
| `subtree`               | `boolean`  | `false` | 是否监听目标及其所有后代节点                     |
| `attributes`            | `boolean`  | `false` | 监听属性变化                                     |
| `attributeFilter`       | `string[]` | -       | 仅监听指定属性名（需 `attributes: true` 才生效） |
| `attributeOldValue`     | `boolean`  | `false` | 属性记录中携带旧值（需 `attributes: true`）      |
| `characterData`         | `boolean`  | `false` | 监听文本节点内容变化                             |
| `characterDataOldValue` | `boolean`  | `false` | 文本记录中携带旧值（需 `characterData: true`）   |

## 2. 基本用法

```javascript
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

## 3. 字段速查

| 字段                                   | 含义                           | 适用类型                       |
| -------------------------------------- | ------------------------------ | ------------------------------ |
| `type`                                 | 变化类型                       | 全部                           |
| `target`                               | 发生变化的节点                 | 全部                           |
| `addedNodes` / `removedNodes`          | 新增 / 移除的节点（NodeList）  | `childList`                    |
| `previousSibling` / `nextSibling`      | 变化节点的相邻兄弟节点         | `childList`                    |
| `attributeName` / `attributeNamespace` | 变化的属性名 / 命名空间        | `attributes`                   |
| `oldValue`                             | 旧值（需开启对应 `*OldValue`） | `attributes` / `characterData` |

## 4. 关键点

- 回调参数 `mutations` 是一个**批量快照**，同一任务内的多次变化会合并成一次回调，天然支持批处理。
- `MutationObserver` 的回调是**微任务**：即使同步代码里连续修改 100 次 DOM，也只会触发一次回调。
- `addedNodes` / `removedNodes` 是**活的 NodeList**，会随 DOM 后续变化而更新，遍历时需先转成数组再处理。
- `takeRecords()` 可主动取回未处理的记录并清空内部队列；`disconnect()` 也会一并清空队列，因此断开前若有未读记录应先 `takeRecords()`。

## 5. 示例：屏蔽广告弹窗

```javascript
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

- 监听第三方脚本插入广告 / 弹窗节点，及时移除或屏蔽。
- 富文本编辑器跟踪文档结构变化，驱动协同与撤销。
- 表单校验框架监听输入框值变化（配合 `characterData`）。
- 监听框架挂载 / 卸载根节点，配合微前端做容器生命周期管理。
