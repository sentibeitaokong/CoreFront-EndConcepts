# `processComponent`

`processComponent` 是 Vue 3 渲染器（`renderer`）中专门用于处理**组件节点**的核心函数。组件是 Vue 应用的基本构建块，`processComponent` 负责组件的挂载、更新和卸载。与普通元素不同，组件节点并不直接对应真实 DOM，而是通过组件实例管理其内部的渲染子树。

## 1. 设计动机与作用

### 1.1 为什么需要独立的 `processComponent`？

组件（`Component`）与普通元素（`Element`）在物理形态和逻辑复杂度上有天壤之别：

- **逻辑封装体**：普通元素只是静态的 DOM 描述，而组件拥有自己的内部状态（`data` / `setup` 中的 `ref` / `reactive`）、生命周期（`mounted`、`updated`）、计算属性（`computed`）以及监听器（`watch`）。
- **渲染的间接性**：组件本身并不会直接映射为某一个特定的真实 DOM 节点。它是一个黑盒，其最终长什么样，取决于它的 `render` 函数（或 `<template>` 编译出的渲染函数）执行后返回的次级 VNode 树（`SubTree`）。
- **响应式边界**：在 Vue 3 中，组件是响应式更新的最小粒度（即依赖收集和触发更新的最小单位）。当一个组件的状态发生变化时，理想情况下应该只重新渲染该组件的 `SubTree`，而不应波及父组件或兄弟组件。

### 1.2 与普通元素的对比

| 特征         | `processComponent`                          | `processElement`                 |
| ------------ | ------------------------------------------- | -------------------------------- |
| 对应真实 DOM | 间接（通过内部 render 生成的子树）          | 直接创建真实元素                 |
| 更新触发条件 | 组件实例的响应式数据变化或 `props`/插槽变化 | 父组件重新渲染导致 `VNode` 对比  |
| 更新核心函数 | `updateComponent` / `shouldUpdateComponent` | `patchElement` / `patchChildren` |
| 属性处理     | 需处理 `props` 和 `attrs` 的区别            | 直接设置 `DOM` 属性              |
| 生命周期钩子 | 有（`beforeMount`、`mounted` 等）           | 无                               |
| 子节点       | 由组件内部 `render` 产生，不直接传递        | 直接作为 `children` 传递         |

## 2. `processComponent`函数入口

:::code-group

```typescript [renderer.ts]
const processComponent = (
  n1: VNode | null,
  n2: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
  parentComponent: ComponentInternalInstance | null,
) => {
  // 阶段一：初次挂载 (n1 为空)
  if (n1 == null) {
    // 处理 KeepAlive 组件的激活逻辑 (缓存复用)
    if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
      ;(parentComponent!.ctx as KeepAliveContext).activate(
        n2,
        container,
        anchor,
      )
    } else {
      // 常规组件的全新挂载流程
      mountComponent(n2, container, anchor, parentComponent)
    }
  } else {
    // 阶段二：组件更新 (n1 存在，表示组件状态或 Props 发生变化)
    updateComponent(n1, n2)
  }
}
```

:::

## 3. 挂载分支：`mountComponent`

`mountComponent` 负责创建组件实例、初始化 `Props` 和 `Slots`、执行 `setup`、建立渲染副作用等。

:::code-group

```typescript [renderer.ts]
import { createComponentInstance, setupComponent } from './component.ts'
const mountComponent: MountComponentFn = (
  initialVNode, // 当前组件的新 VNode
  container, // 挂载的父容器
  anchor, // 挂载锚点
  parentComponent, // 父组件实例
) => {
  // 步骤 1：创建组件内部实例 (ComponentInternalInstance)
  // 这是组件在 Vue 内部的数据模型，用于存储状态、生命周期、SubTree 等元信息。
  const instance: ComponentInternalInstance =
    compatMountInstance || // 兼容 Vue 2 构建的特殊处理
    (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent,
      parentSuspense,
    ))
  // ... (处理 <KeepAlive> 的缓存注入等边缘逻辑)

  // 步骤 2：初始化组件 (Setup Component)
  // 解析 Props, Slots，执行 setup 函数 (如果存在)，并处理 Vue 2 风格的 Options API
  setupComponent(instance)

  // 步骤 3：建立响应式渲染副作用 (Setup Render Effect)
  // 这是 Vue 数据驱动视图的魔法核心！将 render 函数包裹在一个 effect 中。
  setupRenderEffect(instance, initialVNode, container, anchor)
}
```

:::

### 3.1 `createComponentInstance`

创建组件实例对象，存储组件状态、上下文、生命周期等：

:::code-group

```typescript [component.ts]
import { emit } from './componentEmits.ts'
let uid = 0
// 简化版组件实例创建工厂
export function createComponentInstance(vnode, parent) {
  // 1. 获取组件的原始配置对象 (例如我们写的 { setup(), render(), name: 'MyComp' })
  const type = vnode.type

  // 2. 继承应用级上下文 (appContext包含了 app.use 注册的全局组件/插件)
  // 如果有父组件就继承父级的，否则从根节点拿
  const appContext =
    (parent ? parent.appContext : vnode.appContext) || emptyAppContext

  // 3. 构建组件内部实例对象 (核心骨架)
  const instance = {
    uid: uid++, // 组件唯一标识
    vnode, // 当前关联的 VNode 外壳
    type, // 组件的原始配置对象
    parent, // 父组件实例的引用
    appContext, // 关联的应用上下文
    root: null, // 根组件实例的引用

    // ================= 渲染与响应式核心 =================
    next: null, // 待更新的全新 VNode (父组件传了新 props 时用到)
    subTree: null, // 组件 render() 函数执行后生成的【次级虚拟DOM树】
    effect: null, // 组件专属的响应式副作用 (ReactiveEffect)
    update: null, // 触发组件重新渲染的函数 (包裹了 effect.run)
    render: null, // 最终要执行的渲染函数 (无论是手写还是模板编译来的)

    // ================= 状态与数据源 =================
    data: {}, // Options API 里的 data 状态
    props: {}, // 组件接收到的 props
    attrs: {}, // 透传的 attributes (没有在 props 中声明的属性)
    slots: {}, // 插槽内容
    refs: {}, // 模板引用
    setupState: {}, // Composition API 中 setup() 返回的响应式状态

    // ================= 上下文与代理 =================
    ctx: {}, // 内部渲染上下文
    proxy: null, // 暴露给模板和 this 的响应式代理对象 (非常核心！)
    exposed: null, // 通过 defineExpose 暴露给父组件的属性

    // ================= 依赖注入 (Provide/Inject) =================
    provides: parent ? parent.provides : Object.create(appContext.provides), // 优雅的原型链继承

    // ================= 生命周期钩子 (内部采用数组存储) =================
    isMounted: false, // 挂载状态标记
    isUnmounted: false, // 卸载状态标记
    m: null, // mounted 钩子队列
    bm: null, // beforeMount 钩子队列
    u: null, // updated 钩子队列
    // ... 其他钩子省略
  }

  // 4. 根实例引用修正
  instance.ctx = { _: instance }
  instance.root = parent ? parent.root : instance

  // 5. 绑定 emit 函数 (利用闭包锁定当前实例)
  instance.emit = emit.bind(null, instance)

  return instance
}
```

```typescript [componentEmits.ts]
// 工具函数：首字母大写 (如: 'myClick' -> 'MyClick')
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
// 工具函数：拼接 on 前缀 (如: 'MyClick' -> 'onMyClick')
const toHandlerKey = (str: string) => (str ? `on${capitalize(str)}` : ``)
// 工具函数：连字符转小驼峰 (如: 'my-click' -> 'myClick')
const camelize = (str: string) =>
  str.replace(/-(\w)/g, (_, c) => c.toUpperCase())
const EMPTY_OBJ = {}

export function emit(
  instance: ComponentInternalInstance,
  event: string, // 触发的事件名，比如 'my-click'
) {
  // 如果组件已经被卸载，静默退出
  if (instance.isUnmounted) return

  // 1. 获取父组件挂载到当前组件 VNode 上的 props
  const props = instance.vnode.props || EMPTY_OBJ

  // 2. 将传入的事件名进行规范化转换！
  // 比如将 'my-click' 转换为 'onMyClick'
  let handlerName = toHandlerKey(camelize(event))

  // 3. 去 props 里寻找对应的事件处理函数
  let handler = props[handlerName]

  // 4. 如果找到了对应的处理函数，准备执行！
  if (handler) {
    handler()
  }
}
```

:::

### 3.2 `setupComponent`

初始化 `props`、`slots`，并执行用户提供的 `setup` 函数（如果是组合式 API）或初始化选项式 API：

:::code-group

```typescript [component.ts]
import { initProps } from './componentProps.ts'
import { initSlots } from './componentSlots.ts'

export function setupComponent(instance: ComponentInternalInstance) {
  const { props, children } = instance.vnode
  // 初始化 props（将驼峰式转为 kebab-case 等）
  initProps(instance, props)
  //初始化插槽
  initSlots(instance, children)
  //初始化有状态的组件 并为render赋值
  //如果使用的是async setup()异步函数会返回promise，则这里的返回值是为了支撑 <Suspense> 异步组件和服务端渲染 (SSR)。
  const setupResult = setupStatefulComponent(instance)
  return setupResult
}
```

:::

#### 3.2.1 `initProps`

初始化 `Props`

```typescript [componentProps.ts]
export function initProps(instance, rawProps) {
  const props = {}
  const attrs = {}
  // 内部逻辑简化：遍历 rawProps，如果在组件的 props 选项中声明了，就放到 props 里
  // 如果没有声明，就放到 attrs 里（透传属性）

  // 将 props 转化为浅层响应式对象，挂载到实例上
  instance.props = shallowReactive(props)
  instance.attrs = attrs
}
```

#### 3.2.2 `initSlots`

初始化 `Slots`

```typescript [componentSlots.ts]
export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    // 内部逻辑简化：将传入的 VNode 节点标准化为返回 VNode 数组的函数
    // 比如：{ default: () => [VNode], header: () => [VNode] }
    instance.slots = normalizeObjectSlots(children, instance.slots)
  } else {
    instance.slots = {}
  }
}
//转换类型为object插槽
function normalizeObjectSlots(children: any, slots: any) {
  //保证slots返回的是一个数组 方便渲染
  for (const key in children) {
    const value = children[key]
    slots[key] = (props: any) => normalizeSlotValue(value(props))
  }
}
//转换插槽内容为数组
function normalizeSlotValue(value: any) {
  return Array.isArray(value) ? value : [value]
}
```

#### 3.2.3 `setupStatefulComponent`

核心环节！创建代理上下文，并调用开发者的 `setup()` 函数。

:::code-group

```typescript [component.ts]
import { PublicInstanceProxyHandlers } from './componentPublicInstance.ts'
import { ref } from '../../reactivity/src/ref.ts'
import { applyOptions } from './componentOptions'
//全局实例
let currentInstance: any = null
//生命周期枚举字典
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  // ... 其他钩子
}

//将当前实例设为全局的 currentInstance，可追溯赋值过程,方便维护
export function setCurrentInstance(instance: any) {
  currentInstance = instance
}
function setupStatefulComponent(instance) {
  //拿到组件
  const Component = instance.type
  // 创建渲染代理拦截器,核心应用点：解决“去哪找数据”的问题，统一模板的上下文和 this 指针。
  // PublicInstanceProxyHandlers 会按优先级去 setupState -> data -> props -> ctx 中寻找数据
  // 这就是我们在模板里可以直接写 {{ msg }}，或者在 Options API 里用 this.msg 访问变量的原因
  // 找到变量以后，通过proxyRefs代理，只要发现是ref，立刻脱壳提取 .value。
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)
  // 2. 拿到开发者写的 setup 函数
  const { setup } = Component
  if (setup) {
    // 3. 极其关键的上下文切换：将当前实例设为全局的 currentInstance
    setCurrentInstance(instance)
    // 4.执行 setup 函数,获取setup函数的返回值,setup方法有function和object两种返回值：
    // function: 直接作为render函数渲染组件,
    // object: 则直接充当组件实例中的属性
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    })
    // 5. 重置状态
    setCurrentInstance(null)
    // 6. 处理 setup 的返回值
    if (isPromise(setupResult)) {
      // 如果返回了 Promise，说明这是一个异步组件，配合 <Suspense> 使用
      instance.asyncDep = setupResult
    } else {
      // 常规同步返回
      handleSetupResult(instance, setupResult)
    }
  } else {
    // 获取组件实例
    finishComponentSetup(instance)
  }
}
//处理setup函数返回值
export function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown,
) {
  // 场景 A：如果 setup 返回了一个函数
  if (typeof setupResult === 'function') {
    // 那么这个函数就是该组件的 render (渲染函数)！
    instance.render = setupResult
  }
  // 场景 B：如果 setup 返回了一个对象
  else if (isObject(setupResult)) {
    // proxyRefs:自动解包 ref！ 仅仅作用于 setup() 函数返回的那个普通对象,解决“如何无感访问 ref”的问题，抹平 ref.value 的心智负担。
    // 这就是为什么在 setup 里定义了 const count = ref(0)，返回后在模板里可以直接写 {{ count }} 而不需要写 {{ count.value }} 的原因。
    instance.setupState = proxyRefs(setupResult)
  }
  // 无论返回什么，最后都进入收尾阶段
  finishComponentSetup(instance)
}
//组件收尾
export function finishComponentSetup(instance: ComponentInternalInstance) {
  const Component = instance.type
  // 1. 处理模板编译
  if (!instance.render) {
    // 如果既没有手写 render，setup 也没有返回 render 函数
    if (compile && !Component.render) {
      // 如果存在 template 字符串，并且引入了带编译器的 Vue 版本，则在运行时编译！
      const template = Component.template
      if (template) {
        Component.render = compile(template /* 编译选项 */)
      }
    }
    // 将最终的 render 函数挂载到组件实例上。
    // 如果连 template 也没有，就给一个空的 NOOP 函数兜底，防止渲染器崩溃。
    instance.render = Component.render || NOOP
  }
  //步骤 2：兼容并解析 Vue 2 风格的 Options API
  // inject -> methods -> data -> computed -> watch -> provide -> 生命周期钩子
  applyOptions(instance)
}
```

```typescript [componentPublicInstance.ts]
//便于处理其他属性 全局映射表
const publicPropertiesMap = {
  $el: i => i.vnode.el, //组件的根 DOM 元素。取自组件实例的 vnode.el，也就是当前组件对应的虚拟节点的真实 DOM 引用。
  $data: i => i.data, //组件响应式数据对象
  $props: i => i.props, //组件接收到的 props 对象
  $attrs: i => i.attrs, //组件未声明为 props 的传递属性（attrs），即“透传属性”。
  $slots: i => i.slots, //组件的插槽内容，通常是一个对象，包含各个插槽的 VNode 数组。
  $refs: i => i.refs, //模板中的 ref 引用集合，包含了子组件实例或 DOM 元素。
  $emit: i => i.emit, //组件的 emit 方法，用于触发自定义事件。注意这是绑定好 this 的函数。
}

// 内部工具：检查对象自身是否拥有某属性
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)
// 代理拦截器 (核心魔法所在)
export const PublicInstanceProxyHandlers = {
  // 拦截读取操作： target.xxx 或 this.xxx
  get({ _: instance }, key) {
    const { ctx, setupState, data, props, appContext } = instance
    // 1. 拦截 Vue 内部特殊属性 (如 __isVue)
    if (key === '__isVue') return true
    // 2. 核心状态查找优先级：setupState > data > props > ctx
    // 判断该 key 是否在组件自身的状态对象中

    // 优先级 1：setup() 返回的响应式状态
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }
    // 优先级 2：Options API 的 data() 返回的状态
    else if (hasOwn(data, key)) {
      return data[key]
    }
    // 优先级 3：父组件传递的 Props
    else if (hasOwn(props, key)) {
      return props[key]
    }
    // 优先级 4：组件内部上下文 ctx (包含 methods 等)
    else if (hasOwn(ctx, key)) {
      return ctx[key]
    }
    // 3. 拦截以 $ 开头的内置公共 API (如 $el, $emit, $slots, $router)
    // publicPropertiesMap 是一个字典，里面预先注册了所有的 $ API
    const publicGetter = publicPropertiesMap[key]
    if (publicGetter) {
      return publicGetter(instance)
    }
  },
  // 拦截赋值操作： target.xxx = value 或 this.xxx = value
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance
    // 优先级 1：更新 setup() 的状态
    if (hasOwn(setupState, key)) {
      setupState[key] = value
      return true
    }
    // 优先级 2：更新 data() 的状态
    else if (hasOwn(data, key)) {
      data[key] = value
      return true
    }
    // 优先级 3：尝试更新 props (这是不允许的！)
    else if (hasOwn(instance.props, key)) {
      console.warn(`Attempting to mutate prop "${key}". Props are readonly.`)
      return false
    }
    // 如果是以 $ 开头的内置属性，禁止用户覆写
    if (key[0] === '$' && key.slice(1) in instance) {
      console.warn(`Attempting to mutate public property "${key}".`)
      return false
    }
    // 最后，将值更新到 ctx (比如动态添加的方法)
    ctx[key] = value
    return true
  },
  //拦截 in 操作符： 'xxx' in this
  has({ _: instance }, key) {
    const { data, setupState, props, ctx, appContext } = instance
    return (
      hasOwn(setupState, key) ||
      hasOwn(data, key) ||
      hasOwn(props, key) ||
      hasOwn(ctx, key) ||
      key in publicPropertiesMap ||
      hasOwn(appContext.config.globalProperties, key)
    )
  },
}
```

```typescript [ref.ts]
// 核心入口
export function proxyRefs(objectWithRefs) {
  // 1. 如果传入的对象已经是 reactive 响应式对象了，直接返回，没必要再包一层
  if (isReactive(objectWithRefs)) {
    return objectWithRefs
  }
  // 2. 否则，为这个对象创建一个 Proxy 代理
  return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}
// 代理拦截器 (核心魔法所在)
const shallowUnwrapHandlers = {
  // 拦截读取操作 (get)
  get: (target, key, receiver) => {
    // 调用 unref 进行自动解包
    return unref(Reflect.get(target, key, receiver))
  },

  // 拦截赋值操作 (set)
  set: (target, key, value, receiver) => {
    const oldValue = target[key]

    // 关键分支：如果旧值是一个 ref，而赋的新值【不是】一个 ref
    if (isRef(oldValue) && !isRef(value)) {
      // 直接修改旧 ref 的 .value 属性！
      oldValue.value = value
      return true
    } else {
      // 其他情况（旧值不是 ref，或者新旧值都是 ref），直接正常赋值覆盖
      return Reflect.set(target, key, value, receiver)
    }
  },
}
// 补充：unref 的极简实现
export function unref(ref) {
  // 如果是 ref，返回其 .value；否则原样返回
  return isRef(ref) ? ref.value : ref
}
```

```typescript [componentOptions.ts]
import {isArray, isObject, extend} from '@vue/shared'
import {inject, isRef} from 'vue'
import {LifecycleHooks} from './component'
import {onMounted, onBeforeMount} from "./apiLifecycle";

//兼容并解析 Vue 2 风格的 Options API
export function applyOptions(instance: ComponentInternalInstance) {
    // 1. 获取全局配置的 mixins 和组件自身的 options
    // resolveMergedOptions 会递归合并 Vue.mixin、extends 和当前组件的配置
    const options = resolveMergedOptions(instance)

    // 2. 准备上下文引用
    const publicThis = instance.proxy! // 供用户使用的 this (渲染代理)
    const ctx = instance.ctx           // 内部存放方法和计算属性的真实对象
    let globalSetupContext: any        // Vue 3.2 引入的 script setup 全局上下文

    // 阶段 1：全局状态与前置钩子
    // 1. 触发 beforeCreate 生命周期
    if (options.beforeCreate) {
        callHook(options.beforeCreate, instance, LifecycleHooks.BEFORE_CREATE)
    }

    // 2. 解析 Inject (注入)
    // 必须在 data/methods 之前解析，因为它们可能依赖注入的数据
    const {injectOptions} = options
    if (injectOptions) {
        resolveInjections(injectOptions, ctx, publicThis)
    }

    // 阶段 2：挂载 Methods (并进行严格冲突校验)
    const {methods} = options
    if (methods) {
        for (const key in methods) {
            const methodHandler = methods[key]
            if (isFunction(methodHandler)) {
                // 挂载前校验：绝对不允许 method 和 props 重名！
                // (在 __DEV__ 环境下会打印警告，生产环境直接覆盖，但原则上不允许)

                // 绑定 this 并挂载到 ctx 上
                // Object.defineProperty 保证这些方法是不可枚举的 (non-enumerable)
                Object.defineProperty(ctx, key, {
                    value: methodHandler.bind(publicThis),
                    writable: true,
                    configurable: true,
                    enumerable: true
                })
            }
        }
    }

    // 阶段 3：解析 Data (响应式核心)
    const {data: dataOptions} = options
    if (dataOptions) {
        // 1. 执行 data 函数
        const data = isFunction(dataOptions)
            ? dataOptions.call(publicThis, publicThis) // 传入 publicThis 作为 this
            : dataOptions // 兼容 data 是一个纯对象的情况 (Vue 2 根实例常这么写)

        // 2. 如果 data 不是对象，回退为空对象
        if (!isObject(data)) {
            data = {}
        }

        // 3. 极其严格的属性冲突校验！
        // 遍历 data 里的所有 key，确保它们没有覆盖 props 或 methods
        const keys = Object.keys(data)
        const props = instance.propsOptions[0] || {}
        let i = keys.length
        while (i--) {
            const key = keys[i]
            // 如果和 methods 重名，警告！
            if (methods && hasOwn(methods, key)) {
                // DEV 警告逻辑...
            }
            // 如果和 props 重名，直接跳过并警告！(Props 优先级高于 Data)
            if (hasOwn(props, key)) {
                // DEV 警告逻辑...
                continue
            }
            // 检查 key 是否以 _ 或 $ 开头 (Vue 的保留字前缀)
            if (key[0] !== '$' && key[0] !== '_') {
                // 只有合法的 key 才会被添加到真实的数据域中
            }
        }

        // 4. 将纯对象转化为深度响应式对象
        instance.data = reactive(data)
    }
    // 阶段 4：解析 Computed (计算属性)
    const {computed: computedOptions} = options
    if (computedOptions) {
        for (const key in computedOptions) {
            const opt = computedOptions[key]
            const get = isFunction(opt)
                ? opt.bind(publicThis)
                : isFunction(opt.get) ? opt.get.bind(publicThis) : NOOP
            const set = !isFunction(opt) && isFunction(opt.set)
                ? opt.set.bind(publicThis)
                : NOOP

            // 创建 Composition API 的 computed 实例
            const c = computed({get, set})

            // 通过 Object.defineProperty 将计算属性代理到 ctx 上
            // 当你访问 this.doubleCount 时，实际上是在访问 c.value
            Object.defineProperty(ctx, key, {
                enumerable: true,
                configurable: true,
                get: () => c.value,
                set: v => (c.value = v)
            })
        }
    }
    // 阶段 5：解析 Watch (侦听器) 的多态性
    const {watch: watchOptions} = options
    if (watchOptions) {
        for (const key in watchOptions) {
            // 开发者写的 watch 可能是五花八门的：
            // 1. 字符串: watch: { count: 'handleCountChange' }
            // 2. 函数: watch: { count(val) {...} }
            // 3. 对象: watch: { count: { handler: fn, deep: true } }
            // 4. 数组: watch: { count: [fn1, fn2] }
            createWatcher(watchOptions[key], ctx, publicThis, key)
        }
    }

    // 阶段 6：解析 Provide
    const {provide: provideOptions} = options
    if (provideOptions) {
        const provides = isFunction(provideOptions)
            ? provideOptions.call(publicThis)
            : provideOptions
        // 遍历 provide 对象并调用底层的 provide API
        Reflect.ownKeys(provides).forEach(key => {
            provide(key, provides[key as string])
        })
    }

    // 阶段 7：生命周期与组件资产
    // 1. 触发 created 钩子
    if (options.created) {
        callHook(options.created, instance, LifecycleHooks.CREATED)
    }

    function registerLifecycleHook(register: Function, hook?: Function) {
        register(hook?.bind(instance.data), instance)
    }

    // 注册 hooks
    registerLifecycleHook(onBeforeMount, beforeMount)
    registerLifecycleHook(onMounted, mounted)
    //...其他hooks
    // ...包含 renderTracked, renderTriggered 等

    // 3. 注册局部 Components, Directives (指令)
    // 这些资产会被挂载到 instance.components 等内部属性上，供模板编译器查找
    if (options.components) instance.components = options.components
    if (options.directives) instance.directives = options.directives
}

//将这四面八方的配置，按照极其严格的优先级和特定的合并策略，拍平成一个单一的、没有冲突的 options 对象。
export function resolveMergedOptions(
    instance: ComponentInternalInstance
): ComponentOptions {
    const base = instance.type as ComponentOptions
    const {mixins, extends: extendsOptions} = base

    // 拿到全局上下文中的 mixins (通过 app.mixin() 注册的)
    // 拿到全局的合并缓存字典 (optionsCache)
    const {mixins: globalMixins, optionsCache} = instance.appContext

    // 步骤 1：性能第一，读取缓存
    let resolved = optionsCache.get(base)
    if (resolved) {
        return resolved // 命中缓存，直接返回！
    }

    // 初始化一个空的最终配置对象
    resolved = {}

    // 步骤 2：核心递归合并算法 (严格按优先级先后顺序)
    // 优先级 1 (最低): 全局 Mixin
    if (globalMixins.length) {
        globalMixins.forEach(m => mergeOptions(resolved, m, instance))
    }

    // 优先级 2: 组件的 extends
    mergeOptions(resolved, base, instance)

    // 步骤 3：存入缓存并返回
    optionsCache.set(base, resolved)
    return resolved
}

// 核心合并引擎：mergeOptions
export function mergeOptions(to: any, from: any, instance: any) {
    // 1. 如果当前的 from 身上还有 extends 或 mixins，必须【深度优先递归】合并它们！
    if (from.extends) {
        mergeOptions(to, from.extends, instance)
    }
    if (from.mixins) {
        from.mixins.forEach(m => mergeOptions(to, m, instance))
    }

    // 2. 遍历 from 上的所有属性，应用【策略模式】进行合并
    for (const key in from) {
        const toVal = to[key]
        const fromVal = from[key]

        // 策略 A：生命周期钩子 (合并为数组)
        if (isLifecycleHook(key)) {
            if (toVal) {
                // 如果已经有钩子了，就把新旧钩子拼接成数组：[旧钩子, 新钩子]
                to[key] = [...new Set([...toArray(toVal), ...toArray(fromVal)])]
            } else {
                to[key] = fromVal
            }
        }
        // 策略 B：Data 函数 (包装为一个新的函数，执行时做深度对象合并)
        else if (key === 'data') {
            if (!toVal) {
                to[key] = fromVal
            } else {
                // 返回一个合并器函数，当 data 被执行时，深层比对对象的 key
                to[key] = function mergeDataFn() {
                    return deepMergeData(toVal.call(this), fromVal.call(this))
                }
            }
        }
        // 策略 C：对象覆盖 (Methods, Computed, Inject, Components 等)
        else if (key === 'methods' || key === 'computed' || /* ... */) {
            if (!toVal) {
                to[key] = fromVal
            } else {
                // 对象合并：fromVal (新值) 的属性会覆盖 toVal (旧值) 的同名属性
                to[key] = extend(Object.create(null), toVal, fromVal)
            }
        }
        // 策略 D：普通属性直接覆盖
        else {
            to[key] = fromVal
        }
    }
}

// 附：Watch 多态解析工厂函数
function createWatcher(raw, ctx, publicThis, key) {
    // 从 publicThis(也就是 this) 读取要监听的数据作为 getter
    const getter = () => publicThis[key]

    if (isString(raw)) {
        // 兼容写法 1: watch: { msg: 'onMsgChange' }
        const handler = ctx[raw]
        watch(getter, handler)
    } else if (isFunction(raw)) {
        // 兼容写法 2: 函数
        watch(getter, raw.bind(publicThis))
    } else if (isObject(raw)) {
        // 兼容写法 3: 对象 { handler: fn, deep: true }
        if (isArray(raw)) {
            // 兼容写法 4: 数组
            raw.forEach(r => createWatcher(r, ctx, publicThis, key))
        } else {
            const handler = isFunction(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler]
            watch(getter, handler, raw) // 传入 deep, immediate 等配置
        }
    }
}

//触发 hooks
function callHook(hook: Function, proxy) {
    hook.bind(proxy)()
}

//规范化Inject
export function resolveInjections(
    injectOptions: any, // 开发者写的 inject 配置 (可能是数组，也可能是对象)
    ctx: any,           // 组件的内部上下文 (挂载数据的地方)
    publicThis: any     // 组件的代理对象 (this)
) {
    // 步骤 1：规范化 (Normalization)
    /* 支持的写法：
      1. 数组: inject: ['foo']  => 变成 { foo: { from: 'foo' } }
      2. 别名: inject: { localFoo: 'foo' } => 变成 { localFoo: { from: 'foo' } }
      3. 完整: inject: { localFoo: { from: 'foo', default: 1 } } => 保持原样
    */
    const normalized = isArray(injectOptions)
        ? normalizeInject(injectOptions) // 内部辅助函数，将数组转对象
        : injectOptions

    // 步骤 2：遍历解析并注入
    for (const key in normalized) {
        const opt = normalized[key]

        // 最终解析出来的值
        let injected: unknown

        // 如果 opt 是一个对象 (包含了 from 和 default)
        if (isObject(opt)) {
            // 如果配置了默认值 (default)
            if ('default' in opt) {
                // 【核心操作 A】：直接调用 Composition API 的 inject() 函数！
                // 第三个参数 true 代表：如果 default 是个函数，将其作为工厂函数执行 (兼容 Vue 2)
                injected = inject(
                    opt.from || key,
                    opt.default,
                    true
                )
            } else {
                // 没有配置默认值，直接按 key 查找
                injected = inject(opt.from || key)
            }
        } else {
            // 如果 opt 只是个普通的字符串别名
            injected = inject(opt)
        }

        // 步骤 3：挂载到上下文与【自动解包魔法】
        // 如果祖先组件 provide 出来的是一个 ref 响应式对象
        if (isRef(injected)) {
            // 核心魔法：使用 Object.defineProperty 进行拦截劫持！
            // 目的：让开发者在 Options API 中读取 this.xxx 时，不需要写 .value
            Object.defineProperty(ctx, key, {
                enumerable: true,
                configurable: true,
                get: () => (injected as Ref).value,       // 读的时候，自动 .value
                set: v => ((injected as Ref).value = v)   // 写的时候，自动写入 .value
            })
        } else {
            // 如果注入的是普通值 (如字符串) 或 reactive 对象，直接挂载即可
            ctx[key] = injected
        }
    }
}


// 内部规范化 inject 的核心算法
export function normalizeInject(
    raw: any // 开发者传入的原始 inject 配置
): Record<string, { from: string | symbol; default?: any }> {

    // 准备一个干净的标准对象，用于存放最终结果
    const normalized: Record<string, any> = {}

    // 场景 A：开发者传入的是数组 (最常见的 Vue 2 经典写法)
    // 例如：inject: ['foo', 'bar']
    if (isArray(raw)) {
        for (let i = 0; i < raw.length; i++) {
            // 数组里的每一个字符串，既是挂载到 this 上的 key，也是去寻找数据的 from 键
            const key = raw[i]
            // 强制格式化为：{ foo: { from: 'foo' } }
            normalized[key] = {from: key}
        }
        return normalized
    }

    // 场景 B：开发者传入的是对象 (支持别名和默认值)
    if (isObject(raw)) {
        for (const key in raw) {
            const value = raw[key]

            // 场景 B1：值为普通字符串或 Symbol (别名写法)
            // 例如：inject: { localFoo: 'foo' }
            if (!isObject(value)) {
                // key 是本地挂载名 localFoo，value 是父组件提供的数据源名 'foo'
                // 强制格式化为：{ localFoo: { from: 'foo' } }
                normalized[key] = {from: value}
            }

                // 场景 B2：值已经是对象 (最完整的写法，可能包含 default)
            // 例如：inject: { localFoo: { from: 'foo', default: 1 } }
            else {
                // 利用 extend (Object.assign 的别名) 进行属性继承
                // 如果开发者忘了写 from，默认以本地 key 作为 from
                // 强制格式化为：{ localFoo: { from: 'foo', default: 1 } }
                normalized[key] = extend({from: key}, value)
            }
        }
        return normalized
    }

    // 如果传入了奇奇怪怪的类型 (比如数字、布尔值)，直接返回空对象兜底
    return normalized
}
```

```typescript [apiLifecycle.ts]
import { LifecycleHooks } from './component'
//注册 hook
export function injectHook(
  type: LifecycleHooks,
  hook: Function,
  target: ComponentInternalInstance | null = currentInstance,
): Function | undefined {
  // 将 hook 注册到 组件实例中
  if (target) {
    target[type] = hook
    return hook
  }
}
//创建一个指定的 hook
export const createHook = (lifecycle: LifecycleHooks) => {
  return (hook, target) => injectHook(lifecycle, hook, target)
}
//暴露hooks
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
```

:::

### 3.3 `setupRenderEffect`

创建组件的渲染 `effect`，它会在依赖的响应式数据变化时重新执行，触发组件的更新。该 `effect` 的 `scheduler` 被设置为 `queueJob(instance.update)`，实现异步批量更新。

:::code-group

```typescript [renderer.ts]
import { renderComponentRoot } from './componentRenderUtils'
import { updateProps } from './componentProps.ts'
import { updateSlots } from './componentSlots.ts'
const setupRenderEffect = (
  instance: ComponentInternalInstance,
  initialVNode: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
) => {
  // 1. 定义组件的更新逻辑 (核心工作函数)
  const componentUpdateFn = () => {
    // 【分支 A：初次挂载 Mount】
    if (!instance.isMounted) {
      // 获取 hook
      const { bm, m } = instance

      // beforeMount hook
      if (bm) {
        bm()
      }

      // 1. 执行 render 函数，生成初始的次级 VNode 树 (subTree)
      // 注意：执行这里的过程中，会触发响应式数据的 getter，完成依赖收集！
      const subTree = (instance.subTree = renderComponentRoot(instance))

      // 2. 递归调用全局的 patch，把虚拟 DOM 变成真实 DOM
      patch(null, subTree, container, anchor)

      // mounted hook
      if (m) {
        m()
      }

      // 3. 把组件根节点的 el，作为组件的 el
      initialVNode.el = subTree.el
      instance.isMounted = true
    }
    // 【分支 B：响应式更新 Update】
    else {
      //...
    }
  }
  // 2. 创建响应式副作用 (ReactiveEffect)
  // 使用 ReactiveEffect 包装 componentUpdateFn
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    // 【极其关键的调度器】：当依赖数据改变时，不立即同步执行更新，
    // 而是把更新任务丢进微任务队列 (queueJob) 里，实现批处理防抖
    () => queueJob(update),
    instance.scope, // 绑定组件的副作用作用域，组件卸载时一键清理
  ))
  // 3. 触发首次执行
  const update: SchedulerJob = (instance.update = () => effect.run())
  update.id = instance.uid // 给任务打上 ID，保证更新时的父子顺序
  // 手动调用一次，启动初次挂载流程
  update()
}
```

```typescript [componentRenderUtils.ts]
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createVNode, Comment, Fragment, Text } from './vnode'
//解析 render 函数的返回值
export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance

  let result
  try {
    // 解析到状态组件
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 获取到 result 返回值，如果 render 中使用了 this，则需要修改 this 指向 输入Vnode
      result = normalizeVNode(render!.call(data, data))
    }
  } catch (err) {
    console.error(err)
  }

  return result
}

//标准化 VNode
export function normalizeVNode(child: any): VNode {
  // 1. 如果子节点是 null 或者布尔值 (比如 render 里写了 v-if="false" 返回的 false)
  if (child == null || typeof child === 'boolean') {
    // 包装成一个空的注释节点 ()
    return createVNode(Comment)
  }
  // 2. 如果子节点是一个数组 (比如手写 render 返回了多个并列的元素)
  else if (isArray(child)) {
    // 包装成一个 Fragment (片段) 节点
    return createVNode(
      Fragment,
      null,
      // 递归标准化数组里的每一个子节点
      child.slice(),
    )
  }
  // 3. 如果子节点是普通对象 (最正常的情况)
  else if (typeof child === 'object') {
    // 3.1 检查它是不是已经是一个 VNode 了 (通过 __v_isVNode 内部标记)
    // cloneIfMounted 会检查这个 VNode 是否已经被挂载过了。如果挂载过，必须克隆一个全新的拷贝！
    return cloneIfMounted(child)
  }
  // 4. 兜底逻辑：如果子节点是字符串或数字 (比如 {{ count }})
  else {
    // 包装成一个纯文本节点 (Text VNode)
    return createVNode(Text, null, String(child))
  }
}

//clone VNode
export function cloneIfMounted(child) {
  return child
}
```

:::

## 4. 更新分支：`updateComponent`

### 4.1 `setupRenderEffect`

组件更新触发`setupRenderEffect`方法中的`update`方法，执行更新操作

:::code-group

```typescript [renderer.ts]
import { renderComponentRoot } from './componentRenderUtils'
import { updateProps } from './componentProps.ts'
import { updateSlots } from './componentSlots.ts'
const setupRenderEffect = (
  instance: ComponentInternalInstance,
  initialVNode: VNode,
  container: RendererElement,
  anchor: RendererNode | null,
) => {
  // 1. 定义组件的更新逻辑 (核心工作函数)
  const componentUpdateFn = () => {
    // 【分支 A：初次挂载 Mount】
    if (!instance.isMounted) {
      //...
    }
    // 【分支 B：响应式更新 Update】
    else {
      // 如果是由父组件触发的被动更新，会在此处更新当前组件的 props 和 slots
      let { next, vnode } = instance
      //有新节点
      if (next) {
        //将老节点的dom赋值给新节点
        next.el = vnode.el
        //更新组件实例属性
        updateComponentPreRender(instance, next)
      } else {
        //没有新节点 直接赋值老节点
        next = vnode
      }
      // 1. 再次执行 render 函数，生成【全新】的次级 VNode 树 (nextTree)
      const nextTree = renderComponentRoot(instance)
      // 2. 拿到旧的 VNode 树 (prevTree)
      const prevTree = instance.subTree
      // 3. 将当前树替换为新树
      instance.subTree = nextTree

      // 4. 递归调用 patch，启动核心 Diff 算法！
      patch(prevTree, nextTree, container, anchor)
      // 5. 更新 DOM 引用
      next.el = nextTree.el
    }
  }
  // 2. 创建响应式副作用 (ReactiveEffect)
  // 使用 ReactiveEffect 包装 componentUpdateFn
  const effect = (instance.effect = new ReactiveEffect(
    componentUpdateFn,
    // 【极其关键的调度器】：当依赖数据改变时，不立即同步执行更新，
    // 而是把更新任务丢进微任务队列 (queueJob) 里，实现批处理防抖
    () => queueJob(update),
    instance.scope, // 绑定组件的副作用作用域，组件卸载时一键清理
  ))
  // 3. 触发首次执行
  const update: SchedulerJob = (instance.update = () => effect.run())
  update.id = instance.uid // 给任务打上 ID，保证更新时的父子顺序
  // 手动调用一次，启动初次挂载流程
  update()
}

//更新组件实例属性
export const updateComponentPreRender = (
  instance: ComponentInternalInstance,
  nextVNode: VNode,
) => {
  // 1. 物理引用的双向绑定与清理
  // 让新 VNode 指向当前的组件实例
  nextVNode.component = instance
  // 保存旧的 Props，等下比对要用
  const prevProps = instance.vnode.props
  // 让组件实例的 vnode 指针指向最新的 VNode
  instance.vnode = nextVNode
  // 清空 next 标记，表示“待更新的节点”已经开始处理了
  instance.next = null

  // 2. 更新组件的 Props (极其核心)
  updateProps(instance, nextVNode.props, prevProps)

  // 3. 更新组件的 Slots (插槽)
  updateSlots(instance, nextVNode.children)

  // 4. 清理由于 Props 改变而可能触发的同步 Watcher
  // (确保在 render 执行前，所有的状态都已落定)
}
```

```typescript [componentRenderUtils.ts]
import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { createVNode, Comment, Fragment, Text } from './vnode'
//解析 render 函数的返回值
export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance

  let result
  try {
    // 解析到状态组件
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 获取到 result 返回值，如果 render 中使用了 this，则需要修改 this 指向 输入Vnode
      result = normalizeVNode(render!.call(data, data))
    }
  } catch (err) {
    console.error(err)
  }

  return result
}

//标准化 VNode
export function normalizeVNode(child: any): VNode {
  // 1. 如果子节点是 null 或者布尔值 (比如 render 里写了 v-if="false" 返回的 false)
  if (child == null || typeof child === 'boolean') {
    // 包装成一个空的注释节点 ()
    return createVNode(Comment)
  }
  // 2. 如果子节点是一个数组 (比如手写 render 返回了多个并列的元素)
  else if (isArray(child)) {
    // 包装成一个 Fragment (片段) 节点
    return createVNode(
      Fragment,
      null,
      // 递归标准化数组里的每一个子节点
      child.slice(),
    )
  }
  // 3. 如果子节点是普通对象 (最正常的情况)
  else if (typeof child === 'object') {
    // 3.1 检查它是不是已经是一个 VNode 了 (通过 __v_isVNode 内部标记)
    // cloneIfMounted 会检查这个 VNode 是否已经被挂载过了。如果挂载过，必须克隆一个全新的拷贝！
    return cloneIfMounted(child)
  }
  // 4. 兜底逻辑：如果子节点是字符串或数字 (比如 {{ count }})
  else {
    // 包装成一个纯文本节点 (Text VNode)
    return createVNode(Text, null, String(child))
  }
}

//clone VNode
export function cloneIfMounted(child) {
  return child
}
```

```typescript [componentProps.ts]
export function updateProps(
  instance: ComponentInternalInstance,
  rawProps: Data | null,
  rawPrevProps: Data | null,
) {
  // 1. 获取组件当前已存在的 props 和 attrs (透传属性)
  const {
    props,
    attrs,
    vnode: { patchFlag },
  } = instance

  // 获取组件声明的 props 选项 (如 props: { msg: String })
  const [options] = instance.propsOptions
  let hasAttrsChanged = false

  // 分支 A：极速路径 (Fast Path) - 基于编译期生成的 patchFlag
  // 如果模板是静态编译的，Vue 会精确知道只有哪些 props 是动态的
  if (
    (optimized || patchFlag > 0) &&
    !(patchFlag & PatchFlags.FULL_PROPS) // 排除包含动态 key 的情况 (如 v-bind="object")
  ) {
    if (patchFlag & PatchFlags.PROPS) {
      // dynamicProps 是一个数组，包含了所有动态绑定的属性名 (如 ['msg', 'count'])
      const propsToUpdate = instance.vnode.dynamicProps!
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i]
        // 提取新值
        const value = rawProps![key]

        if (options) {
          // 如果是声明过的 prop，直接更新到响应式的 instance.props 上
          if (hasOwn(attrs, key)) {
            // 处理特殊情况：原本是 attr，现在变成了 prop
            attrs[key] = value
          }
          // 解析新值并赋值
          props[key] = value
        } else {
          // 如果没有声明，说明这是个透传属性 (attr)，更新到 attrs 上
          if (attrs[key] !== value) {
            attrs[key] = value
            hasAttrsChanged = true
          }
        }
      }
    }
  }
  // 分支 B：慢速路径 (Slow Path) - 手写渲染函数或含有动态绑定的全量更新
  else {
    // 步骤 B1：遍历所有【新】属性，做更新或新增
    if (rawProps) {
      for (const key in rawProps) {
        const value = rawProps[key]
        // 判断这个 key 是否在 props 选项中声明过
        if (options && hasOwn(options, key)) {
          props[key] = value
        } else if (value !== attrs[key]) {
          // 透传属性
          attrs[key] = value
          hasAttrsChanged = true
        }
      }
    }
    // 步骤 B2：遍历所有【旧】属性，做删除清理
    if (rawPrevProps) {
      for (const key in rawPrevProps) {
        if (!rawProps || !(key in rawProps)) {
          if (options && hasOwn(options, key)) {
            // 如果新 props 里没有这个声明过的 key，就将其删掉 (或恢复默认值)
            delete props[key]
          } else {
            // 如果是 attrs，也删掉
            delete attrs[key]
            hasAttrsChanged = true
          }
        }
      }
    }
  }
  // 收尾：如果透传属性 attrs 发生了改变，手动触发它的响应式更新
  // (因为 attrs 本身不是 Proxy，只是个普通对象，所以需要手动 trigger)
  if (hasAttrsChanged) {
    trigger(instance, TriggerOpTypes.SET, '$attrs')
  }
}
```

```typescript [componentSlots.ts]
function updateSlots(instance, newChildren) {
  // 拿到组件当前的旧插槽对象 (这里面存的是上一轮的渲染函数)
  const oldSlots = instance.slots
  let newSlots = {}

  // 步骤 1：规范化 (Normalize) 新传进来的插槽
  if (typeof newChildren === 'function') {
    // 场景 A：如果父组件只传了一个函数 (默认插槽的简写)
    newSlots = { default: newChildren }
  } else if (newChildren !== null && typeof newChildren === 'object') {
    // 场景 B：标准的具名插槽对象 { header: fn, footer: fn }
    newSlots = newChildren
  }

  // 步骤 2：原地合并 (Merge) 新插槽
  // 绝对不能写成 instance.slots = newSlots！
  // 必须使用 Object.assign，强行把新函数覆盖到旧对象的内存地址上
  Object.assign(oldSlots, newSlots)

  // 步骤 3：垃圾回收 (Garbage Collection)
  // 遍历旧插槽对象
  for (const key in oldSlots) {
    // 如果这个旧插槽的 key (比如 'footer') 在新的 newSlots 里找不到了
    if (!(key in newSlots)) {
      // 狠心删掉它，防止幽灵渲染！
      delete oldSlots[key]
    }
  }
}
```

:::

### 4.2 `updateComponent`

当组件需要更新时，执行`patch`方法，内部调用`updateComponent` 决定是否真的需要更新，并执行更新流程。

:::code-group

```typescript [renderer.ts]
import { shouldUpdateComponent } from './componentUpdateUtils.ts'
const updateComponent = (n1: VNode, n2: VNode, optimized: boolean) => {
  const instance = (n2.component = n1.component)!
  if (shouldUpdateComponent(n1, n2, optimized)) {
    // 如果需要更新，将新 VNode 赋给 instance.next，并触发 effect
    instance.next = n2
    instance.update()
  } else {
    // 不需要更新，仅传递部分属性
    n2.component = n1.component
    n2.el = n1.el
    instance.vnode = n2
  }
}
```

```typescript [componentRenderUtils.ts]
//shouldUpdateComponent 会极其精细地比对新旧 VNode，只要确定组件的输入（Props、Slots）没有发生实质性改变，
//它就会果断返回 false，彻底截断该组件及所有子孙组件的渲染瀑布。
export function shouldUpdateComponent(prevVNode, nextVNode) {
  const { props: prevProps, children: prevChildren } = prevVNode
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode

  // 检查点 1：插槽 (Slots) 是否发生了变化
  // 如果子组件包含插槽，且插槽内容（children）改变了，必须更新！
  if (prevChildren || nextChildren) {
    if (!nextChildren || !nextChildren.$stable) {
      // 只要新的插槽不是“静态稳定”的，就认为可能变了，放行更新
      return true
    }
  }
  // 检查点 2：极速路径 (基于编译器的 PatchFlags 优化)
  // 如果模板是 Vue 编译器生成的，它会带上 patchFlag
  if (patchFlag > 0) {
    // 情况 A：带有动态 Key 的全量 Props (比如写了 v-bind="object")
    if (patchFlag & PatchFlags.FULL_PROPS) {
      return hasPropsChanged(prevProps, nextProps)
    }
    // 情况 B：只有部分 Props 是动态绑定的 (这是最常见的情况！)
    else if (patchFlag & PatchFlags.PROPS) {
      // dynamicProps 是编译器提取的动态属性名数组，比如 ['msg', 'count']
      const dynamicProps = nextVNode.dynamicProps
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i]
        // O(1) 级别的靶向比对：只比对这几个动态的变量！变了就放行！
        if (nextProps[key] !== prevProps[key]) {
          return true
        }
      }
      // 如果动态绑定的那几个变量都没变，直接拒绝更新
      return false
    }
  }
  // 检查点 3：慢速路径 (兜底逻辑)
  // 如果没有编译器优化 (比如手写 render 函数，或者纯纯的普通对象)
  // 退化为最稳妥的全量 Props 浅比较
  return hasPropsChanged(prevProps, nextProps)
}

// 辅助函数：全量 Props 浅比较
function hasPropsChanged(prevProps, nextProps) {
  // 1. 如果本来都没有 props，直接认为没变
  if (prevProps === nextProps) return false
  // 2. 只有一方有 props，肯定变了
  if (!prevProps || !nextProps) return true

  const nextKeys = Object.keys(nextProps)
  const prevKeys = Object.keys(prevProps)

  // 3. 连属性的数量都不一样，肯定变了 (比如突然多传了一个 prop)
  if (nextKeys.length !== prevKeys.length) return true

  // 4. 老老实实遍历所有 key，只要有一个 value 不全等，就认为变了
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i]
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }
  // 历经千辛万苦都没变，放行失败，拦截更新！
  return false
}
```

:::

## 5. 卸载分支: `unmountComponent`

组件的卸载发生在父组件或自身被销毁时。渲染器的 `unmount` 函数会调用组件实例的 `unmount` 方法，触发 `beforeUnmount` 和 `unmounted` 生命周期钩子，并递归卸载子树。

```typescript
// 核心：卸载组件实例
function unmountComponent(instance) {
  const { bum, um, subTree, update, effect } = instance

  // 步骤 1：触发 beforeUnmount 生命周期钩子
  // 此时组件的 DOM 还在，响应式数据也还能正常访问
  if (bum) {
    invokeArrayFns(bum) // 遍历执行所有的 beforeUnmount 函数
  }
  // 步骤 2：切断组件的主渲染引擎 (极其重要！)
  if (update) {
    // 把组件的更新任务从调度器 (微任务队列) 中踢出去，防止死灰复燃
    invalidateJob(update)
  }
  if (effect) {
    // 彻底停止 ReactiveEffect！
    // 这会让组件不再响应任何数据的变化，并从所有依赖的 dep (如 ref/reactive) 中把自己移除
    effect.stop()
  }
  // 步骤 3：递归卸载子树 (SubTree)
  // 组件本身只是个逻辑壳子，真正变成 DOM 的是它的 subTree。
  // 递归调用全局的 unmount 去销毁它内部的普通 DOM 或子组件。
  unmount(subTree)
  // 步骤 4：触发 unmounted 生命周期钩子
  if (um) {
    // 注意：unmounted 通常被推入后置微任务队列执行 (PostFlushCbs)
    // 保证在执行时，页面上的真实 DOM 已经彻底被移除了
    queuePostRenderEffect(um)
  }
  // 步骤 5：极致的内存回收 (Garbage Collection)
  instance.isUnmounted = true
  // 将实例上的庞大对象全部指向 null，切断引用链，让 V8 引擎能顺利回收内存
  instance.vnode = null
  instance.subTree = null
  instance.proxy = null
  instance.ctx = null
  instance.setupState = null
}

// 补充：全局的 unmount 函数 (处理物理 DOM 的移除)
function unmount(vnode) {
  // 如果是普通 HTML 元素
  if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
    const el = vnode.el
    // 1. 卸载该元素上的所有自定义指令 (如 v-focus)
    // 2. 移除 DOM 上的所有事件监听器 (如 @click)
    // 3. 递归卸载它的 children

    // 4. 物理移除：将元素从其父节点的 DOM 树中拔出！
    if (el && el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  // 如果是组件，转交回 unmountComponent
  else if (vnode.shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode.component)
  }
}
```

## 6. 完整流程图

### 6.1 组件的挂载与更新

![Logo](/processComponent.png)

### 6.2 组件的卸载

![Logo](/unmountComponent.png)

## 7. 性能优化关键点

- **惰性更新**：通过 `shouldUpdateComponent` 跳过不必要的组件递归，减少无效 `render`。
- **异步队列**：渲染 `effect` 的 `scheduler` 使用 `queueJob`，保证批量更新。
- **`KeepAlive`** 专用分支避免重新创建组件实例，缓存子树。
- **Props 浅比较**：在 `shouldUpdateComponent` 中，`props` 变化只做浅层比较，避免深度遍历。

## 8. 总结

`processComponent` 的源码深刻体现了 Vue 3 在架构设计上的宏大愿景：

- **响应式与渲染引擎的完美融合**：`ReactiveEffect` 巧妙地充当了连接 `@vue/reactivity`（响应式系统）和 `@vue/runtime-core`（渲染核心）的桥梁。组件自身就是一个巨大的响应式副作用。
- **异步批处理调度**：通过 `queueJob(update)`，Vue 确保在同一事件循环内，无论修改多少次数据，组件只会重新渲染一次。
- **默认的性能屏障**：`shouldUpdateComponent` 为所有子组件提供了一层免费的、强大的避免过度渲染的优化层，这是 Vue 能够在中大型应用中保持高性能的核心秘诀。
