# KeepAlive 组件

`<KeepAlive>`是 Vue 3 中用于缓存组件实例的内置抽象组件。与普通组件的直接销毁和重建不同，`<KeepAlive>` 通过将被包裹的组件 DOM 移动到内存中的隐藏容器里，并结合内部状态机与 `LRU` **缓存算法**，实现了组件状态的保留及性能优化的双重目的。

## 1. KeepAlive 的设计动机

在动态组件或 `<RouterView>` 切换时，Vue 默认会销毁并重建不活跃的组件。这会丢失组件内部的状态（如表单输入、滚动位置）。`KeepAlive` 通过**缓存组件实例**来解决这个问题：

- **保留状态**：在切换 Tab 或路由时，保留用户的表单输入、滚动位置或局部交互状态。
- **性能优化**：对于包含大量 DOM 节点或复杂子组件树的重型组件，避免频繁的 `Mount` 和 `Unmount` 操作，大幅节省 CPU 计算量。
- **可配置的缓存策略**：通过 `include`、`exclude`、`max` 控制哪些组件被缓存以及缓存数量上限。
- **抽象组件设计**：自身不渲染任何额外 DOM 节点（如 `div`），对组件树的 DOM 结构零侵入。

## 2. 核心实现：`KeepAliveImpl` 对象

### 2.1 `<KeepAlive>` 组件入口

`KeepAlive` 本身是一个对象组件，通过 `defineComponent` 定义（简化）：

:::code-group

```typescript [keepAlive.ts]
import { defineComponent, getCurrentInstance, SetupContext } from 'vue'

export const KeepAliveImpl = {
  name: `KeepAlive`,
  // 核心标记：供底层的 Renderer 渲染引擎识别这是一个 KeepAlive 组件
  __isKeepAlive: true,

  props: {
    include: [String, RegExp, Array], //只有名称匹配的组件才会被缓存
    exclude: [String, RegExp, Array], //名称匹配的组件不会被缓存
    max: [String, Number], //最大缓存实例数（超过时使用 LRU 策略淘汰最久未使用的实例）
  },

  setup(props: KeepAliveProps, { slots }: SetupContext) {
    //获取根实例
    const instance = getCurrentInstance()!
    // 与渲染器通信的上下文（通过 instance.ctx）
    const sharedContext = instance.ctx as KeepAliveContext

    // 1. 缓存核心数据结构
    // cache 存储 VNode 映射：key -> VNode
    const cache: Map<string, VNode> = new Map()
    // keys 存储当前的 key 集合，依靠 Set 保证插入顺序，实现 LRU 算法
    const keys: Set<string> = new Set()
    // 当前正在渲染的组件 VNode（用于激活或创建）
    let current: VNode | null = null
    // 渲染器提供的方法
    const {
      renderer: {
        p: patch, // 更新/挂载
        m: move, // 移动 DOM
        um: _unmount, // 卸载
        o: { createElement },
      },
    } = sharedContext
    // 2. 隐藏容器：用于存放"失活"组件的 DOM（不渲染到页面上）
    // 在浏览器中相当于 document.createElement('div')
    const storageContainer = sharedContext.createElement('div')

    // 暴露内部方法给 Renderer 调用
    sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
      // 从 storageContainer 搬回到页面真实的 container 中
      const instance = vnode.component!
      // 将 DOM 从隐藏容器移回正常容器
      move(vnode, container, anchor)
      // 更新可能的 props 变化
      patch(instance.vnode, vnode, container, anchor)
      // 异步触发 activated 钩子
      queuePostRenderEffect(() => {
        instance.isDeactivated = false
        if (instance.a) invokeArrayFns(instance.a) // instance.a 存放 onActivated 注册的回调
      })
    }

    sharedContext.deactivate = (vnode: VNode) => {
      // 从页面真实 DOM 搬运到内存 storageContainer 中，不执行真正的卸载
      const instance = vnode.component!
      // 将 DOM 移入隐藏容器 storageContainer
      move(vnode, storageContainer)
      // 异步触发 deactivated 钩子
      queuePostRenderEffect(() => {
        if (instance.da) invokeArrayFns(instance.da) // instance.da 存放 onDeactivated 注册的回调
        instance.isDeactivated = true
      })
    }

    // 返回 render 函数 ...
  },
}
```

:::

### 2.2 render 函数与缓存命中逻辑

`setup` 中返回的render函数

:::code-group

```typescript [keepAlive.ts]
return () => {
  if (!slots.default) return null

  // 获取默认插槽的第一个子节点
  const children = slots.default()
  const rawVNode = children[0]

  // 提取 key 和 name
  const comp = rawVNode.type as Component
  const name = getComponentName(comp)
  const key = rawVNode.key == null ? comp : rawVNode.key

  // include / exclude 规则匹配校验
  if (
    (name && props.include && !matches(props.include, name)) ||
    (name && props.exclude && matches(props.exclude, name))
  ) {
    current = rawVNode
    return rawVNode // 不匹配则直接返回原始节点，不走缓存
  }

  // 尝试从缓存中读取
  const cachedVNode = cache.get(key)

  if (cachedVNode) {
    // 【缓存命中】
    rawVNode.el = cachedVNode.el
    rawVNode.component = cachedVNode.component

    // 更新 LRU 队列（先删后加，排到最后面）
    keys.delete(key)
    keys.add(key)

    //渲染器在挂载时检测到该标记，会调用 activate 而非 mountComponent。
    rawVNode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
  } else {
    // 【缓存未命中】
    keys.add(key)
    // 检测是否超出了 max 限制，如果超出，执行 LRU 淘汰最老数据
    if (props.max && keys.size > parseInt(props.max as string, 10)) {
      pruneCacheEntry(keys.values().next().value) // 淘汰第一个
    }
  }

  //渲染器在卸载时检测到该标记，会调用 deactivate 而非真卸载。
  rawVNode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE

  current = rawVNode
  return rawVNode
}
//KeepAlive 通过组件的 name 属性进行匹配。首先获取组件的名称（兼容 Options API 的 name 和 __name）：
function getComponentName(comp: any): string | false {
  return comp.name || comp.__name
}
//判断该名称是否匹配 `include` 或 `exclude`：
function matches(pattern: any, name: string): boolean {
  if (Array.isArray(pattern)) {
    return pattern.some(p => matches(p, name))
  } else if (typeof pattern === 'string') {
    return pattern.split(',').some(p => p.trim() === name)
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  return false
}
```

:::

## 3. LRU 算法与渲染器劫持

### 3.1 LRU 淘汰

`<KeepAlive>`的核心在于其精简的缓存调度机制与底层渲染器的紧密协作。

:::code-group

```typescript [keepAlive.ts]
// 利用 ES6 Set 数据结构“按插入顺序迭代”的天然特性实现 LRU
// 当需要更新元素为“最新使用”时：
keys.delete(key)
keys.add(key) // 重新 add 的元素会被排在 Set 的最末尾

// 当需要淘汰“最久未访问”的元素时：
if (keys.size > max) {
  // Set.values().next().value 直接获取 Set 最头部的元素（即最老的元素）
  const oldestKey = keys.values().next().value
  pruneCacheEntry(oldestKey)
}

// 销毁缓存记录及实例
function pruneCacheEntry(key: CacheKey) {
  const cached = cache.get(key) as VNode
  // 从映射和集合中彻底移除
  cache.delete(key)
  keys.delete(key)
  // 触发底层的真正卸载 (unmount)
  unmount(cached)
}
```

:::

### 3.2 `Renderer` 渲染引擎劫持

:::code-group

```typescript [renderer.ts]
// 在组件执行卸载 unmount 时拦截
const unmount = (vnode, parentComponent, parentSuspense, doRemove) => {
  const { shapeFlag } = vnode

  // 识别到 SHOULD_KEEP_ALIVE 标记
  if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
    // 移交控制权：不销毁，调用 KeepAlive 注入的 deactivate 隐藏它
    ;(parentComponent!.ctx as KeepAliveContext).deactivate(vnode)
    return
  } else {
    // 正常走组件树卸载逻辑...
    unmount(vnode)
  }
}

// 在组件挂载 processComponent 时拦截
const processComponent = (n1, n2, container, anchor, parentComponent) => {
  // 识别到 KEPT_ALIVE 标记
  if (n1 == null) {
    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      // 移交控制权：不创建新实例，调用 KeepAlive 注入的 activate 唤醒它
      ;(parentComponent!.ctx as KeepAliveContext).activate(
        n2,
        container,
        anchor,
      )
    } else {
      // 正常挂载新组件
      mountComponent(n2, container, anchor, parentComponent)
    }
  }
}
```

:::

## 4. 完整流程示例

### 4.1 基础使用示例

```vue
<template>
  <!-- max 控制最大缓存数量，避免内存溢出 -->
  <KeepAlive :max="10" include="Home,Profile">
    <component :is="currentComponent" />
  </KeepAlive>
</template>

<script setup>
import { ref } from 'vue'
import Home from './Home.vue'
import Profile from './Profile.vue'

const currentComponent = ref(Home)
</script>
```

### 4.2 完整流程图

![Logo](/keepAlive.png)

## 5. 总结

- **缓存机制**：通过 `Map` 存储组件 VNode，实现实例复用。
- **LRU 淘汰**：利用 `keys` 集合维护访问顺序，超出 `max` 时卸载最老的缓存。
- **DOM 保留**: 失活时将 DOM 移入隐藏 `div`，激活时移回原容器
- **生命周期**：扩展 `activated`/`deactivated` 钩子，使组件能感知缓存状态。
- **渲染器配合**：通过 `COMPONENT_KEPT_ALIVE` 标记，让渲染器区分正常卸载和失活，避免销毁实例。
