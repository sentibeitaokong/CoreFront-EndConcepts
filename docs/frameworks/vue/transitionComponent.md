# `<Transition>` 组件

`<Transition>` 是 Vue 3 内置的抽象组件，用于在**单个元素或组件**进入和离开 DOM 时应用过渡动画。它不渲染自己的 DOM，而是对包裹的**单个子节点**在特定生命周期钩子中附加 CSS 类名、调用 JavaScript 钩子，并与渲染器协调处理过渡期间的额外 DOM 元素（如离开动画时保留元素直到动画结束）。

## 1. Transition 的作用与设计动机

- **动画与组件逻辑解耦**：过渡逻辑不应当侵入业务组件，而应该通过声明式的包裹组件实现。`<Transition>` 提供了声明式语法（`name`、`css` 属性、JavaScript 钩子等），让动画控制集中管理。
- **与 Vue 响应式系统无缝集成**：当被包裹的组件或元素因条件渲染（`v-if`）、动态组件（`:is`）或列表切换被移除/插入时，`<Transition>` 能自动感知并驱动动画。
- **协调 DOM 挂载/卸载时机**：离开动画期间，DOM 节点必须保留在文档流中直到动画结束。`<Transition>` 通过**延迟卸载**和**插入占位**机制实现这一能力，这是纯 CSS 无法做到的。

## 2. 核心实现：BaseTransitionImpl 对象

Vue 3 将过渡的基础能力抽象为 `BaseTransition`，它是渲染器能够识别的低层级过渡组件。`<Transition>` 则是基于 `BaseTransition` 实现的**用户层组件**，负责处理 CSS 类名、JavaScript 钩子回调等。

### 2.1 `<Transition>`组件入口

`<BaseTransition>` 在其 `setup` 函数中，会提取默认插槽中的唯一子节点，并生成一套过渡专属的生命周期钩子，挂载到该子节点的 VNode 上。

:::code-group

```typescript [BaseTransition.ts]
import { onMounted, onBeforeUnmount } from '@vue/runtime-core'

export const BaseTransitionImpl = {
  name: `BaseTransition`,
  __isBaseTransition: true, // 渲染器识别标记
  props: {
    mode: String, //过渡模式
    appear: Boolean, //首次渲染时执行进入动画
    persisted: Boolean, //标记为持久化（配合 KeepAlive）
    onBeforeEnter: Function, //进入动画开始前回调
    onEnter: Function, //进入动画进行中回调
    onAfterEnter: Function, //进入动画完成回调
    onEnterCancelled: Function, //进入动画被取消回调
    onBeforeLeave: Function, //离开动画开始前回调
    onLeave: Function, //离开动画进行中回调
    onAfterLeave: Function, //离开动画完成回调
    onLeaveCancelled: Function, //离开动画被取消回调
  },
  setup(props, { slots }) {
    // 1. 获取当前组件实例
    const instance = getCurrentInstance()!
    // 2. 内部组合式 API：维护动画状态 (如 isMounted, isLeaving 等)
    const state = useTransitionState()

    return () => {
      const children = slots.default && slots.default()
      if (!children || !children.length) return

      // Transition 只能包含一个根节点
      let child = children[0]

      // 【核心一】解析生成 Transition 专属 Hooks
      const hooks = resolveTransitionHooks(child, props, state, instance)

      // 【核心二】将 Hooks 挂载到子节点 VNode 的 transition 属性上
      // 后续底层的 Renderer 渲染引擎会读取这个属性并执行拦截
      child.transition = hooks

      return child
    }
  },
}
// 1. 定义过渡状态的数据结构接口
export interface TransitionState {
  isMounted: boolean
  isLeaving: boolean
  isUnmounting: boolean
  // 用于存储当前正在执行离开动画 (leaving) 的 VNode 集合
  // 这对于实现 mode="out-in" 等复杂队列控制至关重要
  leavingVNodes: Map<any, Record<string, VNode>>
}

// 2. 核心 Hook 实现
export function useTransitionState(): TransitionState {
  // 创建一个纯 JavaScript 对象作为状态容器
  const state: TransitionState = {
    isMounted: false,
    isLeaving: false,
    isUnmounting: false,
    leavingVNodes: new Map(),
  }
  // 监听 Transition 组件自身的挂载
  onMounted(() => {
    state.isMounted = true
  })
  // 监听 Transition 组件自身的即将卸载
  onBeforeUnmount(() => {
    state.isUnmounting = true
  })
  return state
}
```

:::

### 2.2 状态机与帧调度：`resolveTransitionHooks`

过渡动画最难处理的是时序问题。Vue 通过 `requestAnimationFrame` 巧妙地控制了 CSS 类名的添加时机。

:::code-group

```typescript [BaseTransition.ts]
export function resolveTransitionHooks(vnode, props, state, instance) {
  const { onBeforeEnter, onEnter, onLeave } = props

  return {
    mode: props.mode,

    // 1. 元素挂载前
    beforeEnter(el) {
      onBeforeEnter && onBeforeEnter(el)
    },

    // 2. 元素挂载后
    enter(el, done) {
      // 核心技巧：必须等待下一帧，确保浏览器的初始样式 (from) 已经被应用
      nextFrame(() => {
        if (!state.isLeaving) {
          // 此时添加 to 类名，触发 CSS 过渡
          onEnter && onEnter(el, done)
        }
      })
    },

    // 3. 元素即将卸载
    leave(el, remove) {
      // remove 参数是渲染引擎传进来的、用于真正拔除 DOM 的函数
      state.isLeaving = true

      const done = () => {
        state.isLeaving = false
        remove() // 只有当动画执行完毕调用 done 时，才真正卸载 DOM！
      }

      onLeave && onLeave(el, done)
    },
  }
}

// Vue 内部的双重 RAF 封装，防止浏览器样式计算合并
export function nextFrame(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb)
  })
}
```

:::

## 3. DOM 实现：Web 平台的 `<Transition>`

这个包装组件负责将开发者编写的 CSS 过渡（如 `name="fade"`）翻译成底层认识的 JS 回调。

### 3.1 翻译 CSS 类名

:::code-group

```typescript [Transition.ts]
const Transition = (props, {slots}) => {
    // 1. 解析生成所有相关的 CSS 类名
    // 如果 props.name="fade"，生成 enterFromClass="fade-enter-from" 等
    const {name = 'v', type, css = true, ...domProps} = props
    const {enterFromClass, enterActiveClass, enterToClass, leaveFromClass...} = resolveTransitionClasses(props)

    // 2. 拼装传给 BaseTransition 的 props
    const baseProps = {
        ...domProps,
        onBeforeEnter(el) {
            if (css) {
                // 添加: .fade-enter-from 和 .fade-enter-active
                addTransitionClass(el, enterFromClass)
                addTransitionClass(el, enterActiveClass)
            }
        },
        onEnter(el, done) {
            if (css) {
                // 下一帧执行
                nextFrame(() => {
                    // 移除: .fade-enter-from
                    removeTransitionClass(el, enterFromClass)
                    // 添加: .fade-enter-to (此时浏览器开始播放动画)
                    addTransitionClass(el, enterToClass)
                })
                // 监听动画结束事件，执行 done
                whenTransitionEnds(el, type, done)
            }
        },
        onLeave(el, done) {
            if (css) {
                addTransitionClass(el, leaveFromClass)
                addTransitionClass(el, leaveActiveClass)

                // 【核心操作】强制重排 (Force Reflow)，保证动画起点生效
                forceReflow()

                nextFrame(() => {
                    removeTransitionClass(el, leaveFromClass)
                    addTransitionClass(el, leaveToClass)
                })
                whenTransitionEnds(el, type, done)
            }
        }
    }

    // 3. 渲染底层组件
    return h(BaseTransitionImpl, baseProps, slots)
}

export interface TransitionClassInfo {
    enterFromClass: string
    enterActiveClass: string
    enterToClass: string
    appearFromClass: string
    appearActiveClass: string
    appearToClass: string
    leaveFromClass: string
    leaveActiveClass: string
    leaveToClass: string
}
//负责将开发者传入的 props 标准化，解析并输出一套完整的、用于控制 DOM 动画的 CSS 类名集合。
export function resolveTransitionClasses({
         name = 'v', // 如果没有传入 name，默认前缀为 'v'
         type,
         css = true,
         duration,
         // --- Enter (进入阶段) ---
         enterFromClass = `${name}-enter-from`,
         enterActiveClass = `${name}-enter-active`,
         enterToClass = `${name}-enter-to`,
         // --- Appear (初始渲染阶段) ---
         appearFromClass = enterFromClass,
         appearActiveClass = enterActiveClass,
         appearToClass = enterToClass,
         // --- Leave (离开阶段) ---
         leaveFromClass = `${name}-leave-from`,
         leaveActiveClass = `${name}-leave-active`,
         leaveToClass = `${name}-leave-to`
     }: TransitionProps): TransitionClassInfo {

    // 直接返回解析好的完整类名集合
    return {
        enterFromClass,
        enterActiveClass,
        enterToClass,
        appearFromClass,
        appearActiveClass,
        appearToClass,
        leaveFromClass,
        leaveActiveClass,
        leaveToClass
    }
}

// 强制重排的实现，读取 offsetHeight 会强制浏览器立即计算布局
function forceReflow() {
    return document.body.offsetHeight
}

```

:::

### 3.2 添加动画样式：`addTransitionClass`

如果是普通的 DOM 操作，直接调用 `el.classList.add(cls)` 即可。但在 Vue 的响应式系统中，这么做会带来两个致命问题：

- **多类名支持**：开发者可能传入的是一串包含空格的多个类名（例如使用 `Animate.css` 时：`enter-active-class="animate__animated animate__fadeIn`"），原生的 `classList.add` 无法直接处理包含空格的单个字符串。
- **状态覆盖冲突（核心痛点）**：如果在过渡动画播放期间，组件内部的响应式状态发生了变化（例如绑定的 :class 改变），Vue 的渲染引擎会触发 `patchClass` 来更新 DOM 的 class 属性。这个更新可能会意外覆盖并抹除正在执行的过渡类名，导致动画瞬间中断。

:::code-group

```typescript [Transition.ts]
// 添加过渡类名
export function addTransitionClass(el: Element, cls: string) {
  // 1. 处理多个类名（以空格分隔）的情况
  cls.split(/\s+/).forEach(c => c && el.classList.add(c))

  // 2. 核心：在 DOM 节点上挂载/获取 _vtc (Vue Transition Classes) 缓存集合
  //当由于响应式数据变化导致需要重新设置元素的 class 属性时，底层的 patchClass 方法会敏锐地嗅探到 el._vtc 的存在。
  //如果存在，它会在覆盖新类名之前，乖乖地把这些过渡动画类名再拼接到末尾。
  const _vtc = (el as any)._vtc || ((el as any)._vtc = new Set())

  // 3. 将当前添加的过渡类名存入缓存
  _vtc.add(cls)
}
```

:::

### 3.3 移除动画样式: `removeTransitionClass`

:::code-group

```typescript [Transition.ts]
// 移除过渡类名
export function removeTransitionClass(el: Element, cls: string) {
  // 1. 从真实 DOM 的 classList 中移除
  cls.split(/\s+/).forEach(c => c && el.classList.remove(c))
  // 2. 更新 _vtc 缓存
  const _vtc = (el as any)._vtc
  if (_vtc) {
    _vtc.delete(cls)
    // 如果集合空了，彻底清理掉 _vtc 属性，释放内存
    if (!_vtc.size) {
      el._vtc = undefined
    }
  }
}
```

:::

### 3.4 监听动画结束：`whenTransitionEnds`

Vue 使用了 `window.getComputedStyle(el)` 来读取目标元素的 `transitionDuration` 或 `animationDuration`。根据读取到的时间设定一个精确的超时器，并监听 `transitionend` 事件。无论是哪种方式先触发，都会调用 `done()` 来结束动画状态。

:::code-group

```typescript [Transition.ts]
//负责调度
//四重防御体系:事件监听 + 超时兜底 + 冒泡防御 + 数量校验,确保动画能够正常顺利的结束
export function whenTransitionEnds(
  el: Element,
  expectedType: TransitionProps['type'] | undefined,
  resolve: () => void, // 动画结束后的回调函数 (done)
) {
  // 1. 获取通过 window.getComputedStyle 解析出的动画信息
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType)

  // 如果没有检测到任何动画配置，立刻结束！
  if (!type) {
    return resolve()
  }

  // 确定监听的事件名称
  const endEvent = type === 'transition' ? 'transitionend' : 'animationend'
  let ended = 0

  // 结束函数：清理监听器并执行 resolve
  const end = () => {
    el.removeEventListener(endEvent, onEnd)
    resolve()
  }

  // 2. 原生事件监听器
  const onEnd = (e: Event) => {
    // 【核心防御 1】：防御冒泡！只有 target 是自身才处理
    if (e.target === el) {
      // 【核心防御 2】：防御多属性触发！只有所有属性的动画都执行完毕，才真正结束
      if (++ended >= propCount) {
        end()
      }
    }
  }

  // 3. 【核心防御 3】：宏任务兜底 (Fallback机制)
  // 如果原生事件因为各种奇葩原因没触发，等 timeout + 1 毫秒后强行结束！
  setTimeout(() => {
    if (ended < propCount) {
      end()
    }
  }, timeout + 1)

  // 真正绑定原生事件
  el.addEventListener(endEvent, onEnd)
}
//信息解析器:负责计算超时时间
export function getTransitionInfo(
  el: Element,
  expectedType?: string,
): { type: string | null; timeout: number; propCount: number } {
  // 1. 读取浏览器计算后的最终样式
  const styles: any = window.getComputedStyle(el)

  // 提取 Transition 相关信息
  const transitionDelays = (styles.transitionDelay || '').split(', ')
  const transitionDurations = (styles.transitionDuration || '').split(', ')
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations)

  // 提取 Animation 相关信息
  const animationDelays = (styles.animationDelay || '').split(', ')
  const animationDurations = (styles.animationDuration || '').split(', ')
  const animationTimeout = getTimeout(animationDelays, animationDurations)

  let type: string | null = null
  let timeout = 0
  let propCount = 0

  // 2. 决定使用哪种类型 (transition 还是 animation)
  if (expectedType === 'transition') {
    if (transitionTimeout > 0) {
      type = 'transition'
      timeout = transitionTimeout
      propCount = transitionDurations.length
    }
  } else if (expectedType === 'animation') {
    if (animationTimeout > 0) {
      type = 'animation'
      timeout = animationTimeout
      propCount = animationDurations.length
    }
  } else {
    // 3. 如果开发者没传 type，Vue 自动推断：谁的时间长，就以谁为准！
    timeout = Math.max(transitionTimeout, animationTimeout)
    type =
      timeout > 0
        ? transitionTimeout > animationTimeout
          ? 'transition'
          : 'animation'
        : null
    propCount = type
      ? type === 'transition'
        ? transitionDurations.length
        : animationDurations.length
      : 0
  }

  return {
    type,
    timeout,
    propCount,
  }
}

// 辅助函数：将 '0.5s', '500ms' 转换为真实的毫秒数并求出最大总时间
function getTimeout(delays: string[], durations: string[]): number {
  while (delays.length < durations.length) {
    delays = delays.concat(delays)
  }
  return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])))
}

function toMs(s: string): number {
  return Number(s.slice(0, -1).replace(',', '.')) * 1000
}
```

:::

## 4. 渲染器 (Renderer) 的生死劫持

`<Transition>` 生成的 Hook 是如何被调用的？这需要深入到 Vue 的挂载和卸载核心。

### 4.1 挂载劫持 (Mount)

当渲染器要把一个真实的 DOM 插入到页面中时：

```typescript
const mountElement = (vnode, container, anchor, parentComponent) => {
  // ... 创建真实的 DOM 元素 el ...

  // 读取 VNode 上的 transition 属性
  const transition = vnode.transition

  // 如果有过渡，在插入真实 DOM 之前调用 beforeEnter
  if (transition) {
    transition.beforeEnter(el)
  }

  insert(el, container, anchor) // 原生 Node.insertBefore

  // 插入真实 DOM 之后，异步调度 enter
  if (transition) {
    queuePostRenderEffect(() => {
      transition.enter(el)
    }, parentComponent)
  }
}
```

### 4.2 卸载劫持 (Unmount) -> 最巧妙的延后销毁

这是 Vue 解决“组件被销毁时无法播放动画”的核心机制：

```typescript
const remove = vnode => {
  const { el, transition } = vnode

  // 正常的移除 DOM 闭包函数
  const performRemove = () => {
    hostRemove(el) // el.parentNode.removeChild(el)
  }

  // 如果节点有 transition 钩子
  if (transition && !transition.persisted) {
    // 【交出控制权】：我不立刻删除 DOM 了，我把 performRemove 传给 leave 钩子
    // 等到 leave 动画播放完毕（触发 done 时），再去执行 performRemove
    transition.leave(el, performRemove)
  } else {
    // 没动画的普通节点，直接干掉
    performRemove()
  }
}
```

## 5. 完整流程示例

### 5.1 基础使用示例

```vue
<template>
  <button @click="show = !show">Toggle</button>
  <Transition name="fade">
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 5.2 完整流程图

![Logo](/transitionComponent.png)

## 6. 总结

- **职责分离**：状态机 (`BaseTransition`) 与 平台实现 (`Transition`) 完全分离。这种设计使得在诸如 Weex、跨平台小程序等非 DOM 环境中，只需要重写平台实现层即可复用所有的动画生命周期逻辑。
- **控制反转 (IoC)**：DOM 节点的“生死大权”原本掌握在渲染引擎手中。但 `<Transition>` 通过依赖注入的方式，将`remove`（卸载操作）的控制权反转交给了动画状态机，实现了完美的离开动画支持。
- **消除渲染帧合并**：源码中通过 `forceReflow()` 和双重 `requestAnimationFrame` (`nextFrame`)，彻底解决了由于浏览器优化机制（将同一帧内的 DOM 操作合并）导致的起点 CSS 样式失效的隐患。
