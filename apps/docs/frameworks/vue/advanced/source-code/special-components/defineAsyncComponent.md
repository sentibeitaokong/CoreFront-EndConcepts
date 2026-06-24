# 异步组件 (Async Component)

异步组件是 Vue 3 中用于优化**代码分割**和**按需加载**的核心机制。从本质上讲，异步组件就是一个包装器 (`Wrapper`) 高阶组件。这个包装器在内部默默地调用加载器 (`Loader`) 去下载远程的 JavaScript 代码，并在这个过程中妥善地管理 `Loading` (加载中)、`Error` (加载失败)、`Timeout` (超时) 等各种状态，最终将真实的组件渲染出来。

## 1. 异步组件的作用与设计动机

### 1.1 为什么需要异步组件？

- **代码分割**：大型应用将组件按路由或功能拆分，避免**首屏加载**所有代码，**按需请求**组件模块。
- **加载状态控制**：在组件加载期间展示**占位内容**（如 loading 动画），加载失败时展示**错误组件**或重试。
- **灵活配置**：支持**延迟展示** `loading` 组件、设置**超时时间**、指定**错误重试次数**等，使降级体验细腻可控。
- **与 `<Suspense>` 协同**：在 `<Suspense>` 内部，多个异步组件可统一管理加载状态，实现全局 `fallback`。

### 1.2 核心思想：状态机与高阶组件

一个完善的异步组件其实就是一个状态机：

- **初始状态**：开始调用 `loader` 函数下载代码。
- **加载状态** (Loading)：如果下载时间超过了设定的 `delay`（默认 200ms），展示 `loadingComponent`。
- **成功状态** (Resolved)：代码下载完成，拿到真实组件对象，渲染真实组件。
- **失败状态** (Error/Timeout)：如果下载失败或超过了设定的 `timeout` 时间，展示 `errorComponent`。

### 1.2 与常规组件的对比

| 特性         | 常规组件               | 异步组件                             |
| ------------ | ---------------------- | ------------------------------------ |
| 代码加载     | 同步（已包含在主包中） | 异步，按需加载                       |
| 加载状态     | 无需处理               | 可配置 `loading`/`error` 组件        |
| 体积影响     | 全部组件增加首屏包体积 | 仅主包包含加载逻辑，组件内容延迟加载 |
| 使用方式     | 直接 `import` 并注册   | 使用 `defineAsyncComponent` 包装     |
| `<Suspense>` | 非必须，也可使用       | 可在 `<Suspense>` 中统一管理         |

## 2. 核心入口：`defineAsyncComponent`

### 2.1 函数签名与规范化

异步组件通过 `defineAsyncComponent` 函数定义，支持两种参数形式：

- **工厂函数**：直接返回动态导入的 Promise。
- **选项对象**：包含 `loader`、`loadingComponent`、`errorComponent`、`delay`、`timeout`、`retry` 等配置。

:::code-group

```typescript [apiAsyncComponent.ts]
//兼容 ESM（{ default: T }）和直接导出两种模块格式
export type AsyncComponentResolveResult<T = Component> = T | { default: T }
//一个返回 Promise 的函数，通常就是动态 import() 表达式
export type AsyncComponentLoader<T = any> = () => Promise<
  AsyncComponentResolveResult<T>
>
//所有配置项均为可选（除 loader），delay 默认 200m
//suspensible 默认 true，timeout 默认 undefined（永不超时）
export interface AsyncComponentOptions<T = any> {
  loader: AsyncComponentLoader<T>
  loadingComponent?: Component
  errorComponent?: Component
  delay?: number
  timeout?: number
  suspensible?: boolean
  onError?: (
    error: Error,
    retry: () => void,
    fail: () => void,
    attempts: number,
  ) => any
}
//defineAsyncComponent函数入口
export function defineAsyncComponent<
  T extends Component = { new (): ComponentPublicInstance },
>(source: AsyncComponentLoader<T> | AsyncComponentOptions<T>): T {
  // 1. 参数规范化：如果直接传了一个函数 () => import(...)，转为配置对象形式
  if (isFunction(source)) {
    source = { loader: source }
  }
  // 解构选项
  const {
    loader, // 异步加载函数
    loadingComponent, // 加载中显示的占位组件
    errorComponent, // 加载失败时显示的组件
    delay = 200, // 延迟显示
    timeout, // 超时时间
    retry = 0, // 默认不重试
    onError: userOnError, // 自定义错误处理回调
    suspensible = true, // 是否交由外层 <Suspense> 控制
  } = source
  // ... 后续逻辑
}
```

```typescript [shared/index.ts]
//是否为一个 function
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
```

:::

### 2.2 `load` 函数：请求去重与错误恢复

:::code-group

```typescript [apiAsyncComponent.ts]
// 缓存进行中的请求，避免重复
let pendingRequest: Promise<Component> | null = null
// 加载完成后的真实组件
let resolvedComp: Component | undefined
//重试次数
let retries = 0
//重试函数
const retry = () => {
  retries++
  pendingRequest = null
  return load()
}
// 模块 2：核心加载器（请求去重 + 错误处理 + ESM 兼容）
const load = (): Promise<ConcreteComponent> => {
  //竞态保护 —— 防止在重试（retry）时，旧的异步结果污染最新的请求状态。
  let thisRequest: Promise<ConcreteComponent>
  return (
    pendingRequest ||
    (thisRequest = pendingRequest =
      loader()
        .catch(err => {
          err = err instanceof Error ? err : new Error(String(err))
          // 控制反转：交给 userOnError 决定重试还是失败 用户自定义错误处理
          if (userOnError) {
            return new Promise((resolve, reject) => {
              const userRetry = () => resolve(retry())
              const userFail = () => reject(err)
              userOnError(err, userRetry, userFail, retries + 1)
            })
          } else {
            throw err
          }
        })
        .then((comp: any) => {
          // 放弃当前结果，等待最新的请求
          if (thisRequest !== pendingRequest && pendingRequest) {
            return pendingRequest
          }
          // ESM 兼容处理：提取 default 导出
          if (
            comp &&
            (comp.__esModule || comp[Symbol.toStringTag] === 'Module')
          ) {
            comp = comp.default
          }
          // 只有 thisRequest === pendingRequest 请求时最新请求时才采用结果
          resolvedComp = comp
          return comp
        }))
  )
}
```

:::

### 2.3 `defineComponent` 包装与元数据

异步组件本身是一个通过 `defineComponent` 创建的标准 `Vue` 组件对象，名为 `AsyncComponentWrapper`。

:::code-group

```typescript [apiAsyncComponent.ts]
return defineComponent({
  name: 'AsyncComponentWrapper',

  // 隐藏的系统标记，供 Suspense 识别
  __asyncLoader: load,

  setup() {
    const instance = currentInstance!

    // 分支1：已加载完成，直接渲染真实组件
    if (resolvedComp) {
      return () => createInnerComp(resolvedComp, instance)
    }

    // 分支2：在 Suspense 或 SSR 中，返回 Promise，由父级管理状态
    if (suspensible && instance.suspense) {
      return load()
        .then(comp => () => createInnerComp(comp, instance))
        .catch(err => {
          //处理错误
          handleError(err, instance)
          return () =>
            errorComponent ? createVNode(errorComponent, { error: err }) : null
        })
    }

    // --- 分支 B：独立运行，启用内部状态机 ---
    const loaded = ref(false)
    const error = ref()
    const delayed = ref(!!delay)

    // 1. 处理 Delay：延迟取消 delayed 状态，控制 Loading 组件的展示
    if (delay) {
      setTimeout(() => {
        delayed.value = false
      }, delay)
    }

    // 2. 处理 Timeout：主动注入超时错误
    if (timeout != null) {
      setTimeout(() => {
        if (!loaded.value && !error.value) {
          const err = new Error(`Async component timed out after ${timeout}ms.`)
          handleError(err)
          error.value = err
        }
      }, timeout)
    }

    // 3. 触发核心加载
    load()
      .then(() => {
        loaded.value = true // 触发重新 render
        if (instance.parent && isKeepAlive(instance.parent.vnode)) {
          instance.parent.update()
        }
      })
      .catch(err => {
        handleError(err)
        error.value = err // 触发重新 render
      })

    // 4. 渲染劫持 (Render Hijacking)
    return () => {
      if (loaded.value && resolvedComp) {
        // 加载成功：渲染真实的内部组件
        return createInnerComp(resolvedComp, instance)
      } else if (error.value && errorComponent) {
        // 发生错误：渲染 Error 兜底组件
        return createVNode(errorComponent, { error: error.value })
      } else if (loadingComponent && !delayed.value) {
        // 加载中 (且已过防闪烁期)：渲染 Loading 组件
        return createInnerComp(loadingComponent, instance)
      }
      // 尚未开始或在 delay 期间，渲染空节点占位
      return null
    }
  },
})
```

:::

### 2.4 `createInnerComp` 属性透传

创建真实组件的 VNode 时，会将异步组件包装器的 `ref`、`props`、`children`、`ce`（自定义元素回调）透传给内部真实组件，确保在模板中使用时的行为与普通组件完全一致。

:::code-group

```typescript [apiAsyncComponent.ts]
// 简化后的 createInnerComp 透传逻辑
function createInnerComp(comp: Component, parent: ComponentInternalInstance) {
  // 从包装器自身的 vnode 上提取所有的属性
  const { ref, props, children, ce } = parent.vnode

  // 根据加载回来的真实组件 comp，创建一个新的 VNode
  // 将包装器的 props 和 children (插槽) 原封不动地喂给它
  const vnode = createVNode(comp, props, children)

  // 完美继承：透传模板引用 (Template Ref) 和自定义元素钩子
  vnode.ref = ref
  vnode.ce = ce

  // 擦除包装器上的 ref，防止冲突
  delete vnode.props!.ref

  return vnode
}
```

:::

## 3. 与 Suspense 的协作机制

`defineAsyncComponent` 与 `<Suspense>` 的集成通过 **`suspensible` 选项** 控制：

- 默认 `suspensible = true`：当异步组件处于 `<Suspense>` 内部时，`setup` 中的 `instance.suspense` 为 true，触发**分支2**——`setup` 返回一个 Promise，Suspense 负责管理加载状态，此时异步组件自身的 `loadingComponent` 和 `errorComponent` 被忽略，统一使用 `<Suspense>` 的 `#fallback` 和错误边界。
- `suspensible = false`：即使被 `<Suspense>` 包裹，异步组件仍然使用自身的加载/错误组件，脱离父级 Suspense 的控制。

## 4. 完整流程示例

### 4.1 基础使用

```typescript
import { defineAsyncComponent } from 'vue'

const AsyncComp = defineAsyncComponent(() => import('./HeavyComp.vue'))

// 在模板或 render 函数中直接使用 <AsyncComp />
```

- 首次渲染时，`HeavyComp.vue` 尚未加载，`resolveAsyncComponent` 返回注释节点。
- 加载完成，`loadedComp` 被赋值，组件更新触发器重新渲染，现在返回真正的 `HeavyComp` 组件。

### 4.2 带 loading 和 error 的配置

```typescript
const AsyncComp = defineAsyncComponent({
  loader: () => import('./HeavyComp.vue'),
  loadingComponent: () => h('div', 'Loading...'),
  errorComponent: ({ error }) => h('div', `Error: ${error.message}`),
  delay: 300,
  timeout: 5000,
  retry: 2,
})
```

### 4.3 完整流程图

![Logo](/img/defineAsyncComponent.png)

## 5. 总结

- **设计亮点**：`defineAsyncComponent` 将动态导入转换为 Vue 组件的标准接口，使得代码分割与组件使用完全解耦。内部通过闭包管理加载状态，对外暴露简洁的配置选项。
- **性能优化**：请求去重、延迟显示 loading、与 `<Suspense>` 深度整合，避免不必要的资源竞争和闪烁。
- **扩展性**：用户自定义 `onError` 回调支持任意重试/失败逻辑，错误组件和加载组件可完全定制。
