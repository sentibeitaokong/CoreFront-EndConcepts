# Teleport 组件

`<Teleport>` 是 Vue 3 中用于将组件内部的 DOM 结构“传送”到组件树之外任意 DOM 节点的内置核心组件。与普通组件严格依附于父节点挂载不同，`<Teleport>` 通过特殊的**渲染器拦截**与**注释节点占位机制**，实现了“逻辑层级（虚拟 DOM 树）保留，物理层级（真实 DOM 树）抽离”的强大功能。

## 1. Teleport 的设计动机

- **突破 CSS 限制**：当父级元素存在 `overflow: hidden`、`z-index`、`transform` 或 `filter` 时，子元素弹窗的布局和层级极易失效。`<Teleport>` 允许将物理 DOM 挂载到 `<body>` 等全局容器，彻底摆脱这些限制。
- **保持逻辑与视图统一**：在不使用 `<Teleport>` 时，全局组件通常需要通过额外的状态管理（如 Vuex/Pinia）或命令式 API（如 `ElMessage()`）在外部挂载。使用 `<Teleport>` 可以让组件逻辑、生命周期、`Props` 传递和 `Provide/Inject` 依赖注入完美保留在当前的组件作用域内。
- **性能优化**：在动态修改挂载目标（`to` 属性）或切换禁用状态（`disabled`）时，`<Teleport>` 直接调用原生 DOM API 进行物理移动，而非销毁重建，保证了内部状态（如输入框焦点、iframe 状态）的延续。

## 2. 核心实现：`TeleportImpl` 对象

### 2.1 `<Teleport>` 组件入口

`<Teleport>` 并不是一个通过 `defineComponent` 声明的常规组件，而是一个包含特定处理逻辑的普通对象。

:::code-group

```typescript [Teleport.ts]
export const TeleportImpl = {
  // 核心标记：供底层的 Renderer 渲染引擎识别这是一个 Teleport 组件
  __isTeleport: true,

  // 核心处理函数，接管了该组件的挂载与更新流程
  process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null,
    parentSuspense: SuspenseBoundary | null,
    isSVG: boolean,
    slotScopeIds: string[] | null,
    optimized: boolean,
    internals: RendererInternals, // 渲染器底层方法集
  ) {
    if (n1 == null) {
      // 首次挂载阶段 (Mount)
      // ...
    } else {
      // 更新阶段 (Patch)
      // ...
    }
  },

  // 卸载与移除节点的逻辑
  remove(vnode, parentComponent, parentSuspense, optimized, internals) {
    // ...
  },

  // DOM 物理移动的逻辑
  move: moveTeleport,

  // SSR 客户端激活逻辑
  hydrate: hydrateTeleport,
}
```

:::

### 2.2 `process` 核心处理与占位机制

在首次挂载时，`<Teleport>` 的关键动作是在原来组件树的位置留下**锚点（注释节点）**，以便组件在逻辑上不脱节。

:::code-group

```typescript [Teleport.ts]
function process(
  n1: TeleportVNode | null,
  n2: TeleportVNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
  parentSuspense: SuspenseBoundary | null,
  isSVG: boolean,
  slotScopeIds: string[] | null,
  optimized: boolean,
  internals: RendererInternals, // 渲染器底层方法集
) {
  if (n1 == null) {
    // 首次挂载阶段 (Mount)
    const {
      insert,
      o: { createComment, createText },
    } = internals

    // 1. 占位机制：在当前原父组件的 DOM 树位置插入两个锚点（隐藏占位符）
    const placeholder = (n2.el = createComment('teleport start'))
    const mainAnchor = (n2.anchor = createComment('teleport end'))
    insert(placeholder, container, anchor)
    insert(mainAnchor, container, anchor)

    // 2. 解析 Teleport 的目标容器(to 属性)，并将其同时保存到 VNode 和当前局部作用域。
    const target = (n2.target = resolveTarget(n2.props, querySelector))
    const targetAnchor = (n2.targetAnchor = createText(''))
    if (target) {
      // 在目标容器中也插入一个结束锚点
      insert(targetAnchor, target)
    }

    // 3. 判断是否禁用传送
    const disabled = n2.props && n2.props.disabled
    // 根据 disabled 决定最终挂载的容器位置
    //禁用就挂载在父容器中，不禁用就挂载在目标容器中
    const mountLocation = disabled ? container : target
    const mountAnchor = disabled ? mainAnchor : targetAnchor

    // 4. 将实际的子节点挂载到计算好的容器中
    mountChildren(
      children,
      mountLocation,
      mountAnchor,
      // ...
    )
  } else {
    // 更新阶段 (Patch)
    // ...
  }
}
//调用解析函数，根据 n2.props.to 获取真实的 DOM 元素。
//如果 to 是字符串，则通过 querySelector 查找 DOM；如果已经是 DOM 元素则直接返回。
const resolveTarget = <T = RendererElement>(
  props: TeleportProps | null,
  select: RendererOptions['querySelector'],
): T | null => {
  const targetSelector = props && props.to
  if (isString(targetSelector)) {
    // 1. 如果 to 是字符串，则作为 CSS 选择器去查找元素
    if (!select) {
      // 极端情况：如果环境没有提供 querySelector (如在某些测试环境)，返回 null
      return null
    } else {
      const target = select(targetSelector)
      return target as any
    }
  } else {
    // 2. 如果是其他类型 (通常为真实 DOM 元素)，直接返回
    return targetSelector as any
  }
}
```

:::

## 3. 跨容器移动与渲染引擎劫持

### 3.1 跨容器移动 (`Patch` 阶段)

当 `<Teleport>` 的 `props` 发生变化时（如 `to` 或 `disabled` 改变），需要将整个 DOM 块“搬家”。这里调用的内部 `moveTeleport` 机制极其高效。

:::code-group

```typescript [Teleport.ts]
function process(
    n1: TeleportVNode | null,
    n2: TeleportVNode,
    container: RendererElement,
    anchor: RendererNode | null,
    parentComponent: ComponentInternalInstance | null,
    parentSuspense: SuspenseBoundary | null,
    isSVG: boolean,
    slotScopeIds: string[] | null,
    optimized: boolean,
    internals: RendererInternals // 渲染器底层方法集
) {
    if (n1 == null) {
        // 首次挂载阶段 (Mount)
        //...
    } else {
        // 更新阶段 (Patch)
        // 1. 常规 Diff：对子节点内部进行比对更新
        patchChildren(n1, n2, container, anchor, parentComponent, ...)

        // 2. 判断属性变更
        const wasDisabled = n1.props && n1.props.disabled
        const isDisabled = n2.props && n2.props.disabled
        const currentTarget = n1.target
        const nextTarget = (n2.target = resolveTarget(n2.props, querySelector))

        // 3. 物理移动策略
        if (wasDisabled && !isDisabled) {
            // 【禁用 -> 启用】：把 DOM 从原位置搬移到外部 target
            moveTeleport(n2, nextTarget, nextTargetAnchor, internals, MoveType.TARGET_DIRTY)
        } else if (!wasDisabled && isDisabled) {
            // 【启用 -> 禁用】：把 DOM 从外部抽回来，搬回原位置的 mainAnchor
            moveTeleport(n2, container, mainAnchor, internals, MoveType.TARGET_DIRTY)
        } else if (!isDisabled && currentTarget !== nextTarget) {
            // 【目标改变】：带着所有子节点集体搬迁到新 target
            moveTeleport(n2, nextTarget, nextTargetAnchor, internals, MoveType.TARGET_DIRTY)
        }

        // 底层移动逻辑：遍历所有子 DOM 并使用原生的 insertBefore 移动，不销毁组件！
        function moveTeleport(vnode, container, parentAnchor, internals) {
            const { move } = internals
            const children = vnode.children
            for (let i = 0; i < children.length; i++) {
                move(children[i], container, parentAnchor)
            }
        }
    }
}
//调用解析函数，根据 n2.props.to 获取真实的 DOM 元素。
//如果 to 是字符串，则通过 querySelector 查找 DOM；如果已经是 DOM 元素则直接返回。
const resolveTarget = <T = RendererElement>(
    props: TeleportProps | null,
    select: RendererOptions['querySelector']
): T | null => {
    const targetSelector = props && props.to
    if (isString(targetSelector)) {
        // 1. 如果 to 是字符串，则作为 CSS 选择器去查找元素
        if (!select) {
            // 极端情况：如果环境没有提供 querySelector (如在某些测试环境)，返回 null
            return null
        } else {
            const target = select(targetSelector)
            return target as any
        }
    } else {
        // 2. 如果是其他类型 (通常为真实 DOM 元素)，直接返回
        return targetSelector as any
    }
}
```

:::

### 3.2 `Renderer` 渲染引擎劫持

`<Teleport>` 作为一个底层对象，是如何接管渲染管线的呢？在渲染器的 `patch` 函数中对其进行了硬编码级别的拦截：

:::code-group

```typescript [Teleport.ts]
const patch = (n1, n2, container, anchor, parentComponent, ...) => {
    const { type, shapeFlag } = n2

    if (shapeFlag & ShapeFlags.ELEMENT) {
        // 渲染普通 DOM 元素
        processElement(...)
    } else if (shapeFlag & ShapeFlags.COMPONENT) {
        // 渲染普通 Vue 组件，走 mountComponent 实例化流程
        processComponent(...)
    } else if (shapeFlag & ShapeFlags.TELEPORT) {
        // 【核心拦截】：不创建组件实例，直接移交控制权给 TeleportImpl.process
        ;(type as typeof TeleportImpl).process(
            n1 as TeleportVNode,
            n2 as TeleportVNode,
            container,
            anchor,
            parentComponent,
            // 注入渲染器的底层方法供 Teleport 调用
            internals
        )
    }
}
```

:::

## 4. 完整流程示例

### 4.1 基础使用示例

```vue
<template>
  <div class="parent">
    <!-- 即使组件被多层嵌套，模态框 DOM 依然会被直接挂载到 body 下 -->
    <Teleport to="body" :disabled="isMobile">
      <div class="modal-overlay">
        <div class="modal-content">
          <h1>{{ title }}</h1>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('全局模态框')
const isMobile = ref(false) // 动态切换 disabled 时，DOM 只移动，不重建
</script>
```

### 4.2 完整流程图

![Logo](/teleport.png)

## 5. 总结

- **引擎级拦截**：通过 `ShapeFlags.TELEPORT` 标志，在渲染层跳过了普通组件的实例化管线，直接执行底层对象的 `process`。
- **锚点占位**：巧妙利用 `Comment` (注释节点) 在原组件树中“占位”，确保了无论物理 DOM 去向何处，虚拟 DOM 的卸载和生命周期链条永不断裂。
- **零开销搬运**：在处理动态传送（`to` 改变或 `disabled` 切换）时，基于原生 API 进行物理节点的位移，不触发 `Unmount` 与 `Mount`，极大提升了重渲染性能。
- **完美上下文穿透**：由于逻辑树关系未变，`<Teleport>` 内的节点天然支持获取父组件注入的 `Provide` 上下文，是构建健壮 UI 组件库的核心利器。
