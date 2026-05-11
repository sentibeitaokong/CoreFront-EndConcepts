# Reactive

`reactive` 是 Vue 3 响应式系统的核心 API，用于将对象转换为响应式代理。其底层基于 ES6 的 `Proxy` 实现，配合 `track`（依赖收集）和 `trigger`（触发更新）机制，实现了自动的依赖追踪和视图更新。

## 1. `reactive` 的作用与设计动机

### 1.1 为什么需要 `reactive`？

- `Proxy` 可以直接代理整个对象，拦截所有属性访问和修改操作，而无需为每个属性单独定义 `getter/setter`。
- 与 Vue 2 的 `Object.defineProperty` 相比，`Proxy` 能够检测属性的添加和删除、数组索引和 `length` 的变更，以及 `Map`、`Set` 等集合类型，使得响应式系统更加完整。
- 通过递归地将嵌套对象也转换为响应式代理，避免手动深度处理。

### 1.2 与 `ref` 的定位对比

| 特性           | `reactive`                      | `ref`                          |
| -------------- | ------------------------------- | ------------------------------ |
| 适用数据类型   | 对象（含数组、`Map`、`Set` 等） | 任意（基本类型或对象）         |
| 底层实现       | `Proxy` 代理                    | `RefImpl` 类 + `getter/setter` |
| 访问方式       | 直接访问属性                    | 通过 `.value`                  |
| 模板自动解包   | 是                              | 是（顶层属性）                 |
| 解构响应性保持 | 需配合 `toRef` / `toRefs`       | 可整体传递保持响应式           |

## 2. reactive创建响应式对象流程

### 2.1 reactive函数实现

:::code-group

```typescript [reactive.ts]
import { mutableHandlers } from './baseHandlers'

//WeakMap 的键是弱引用。当原始对象 target 在外部没有任何引用时，垃圾回收机制（GC）会自动回收它，
//同时 WeakMap 中对应的代理对象也会被自动清除，从而避免内存泄漏。
export const reactiveMap = new WeakMap<object, any>()

//为复杂数据类型，创建响应性对象  mutableHandlers：拦截普通对象和数组的 Handler
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}
```

:::

### 2.2 createReactiveObject核心逻辑

:::code-group

```typescript [reactive.ts]
import { isObject } from '@xunbei-vue/shared'

//响应式标识
export enum ReactiveFlags {
  SKIP = '__v_skip', //标记一个对象永远不需要被转换为响应式。
  IS_REACTIVE = '__v_isReactive', //判断一个对象是否由 reactive（或 shallowReactive）创建的响应式代理。
  IS_READONLY = '__v_isReadonly', //判断一个对象是否为只读代理（readonly 或 shallowReadonly 创建）。
  IS_SHALLOW = '__v_isShallow', //标记当前代理是否为浅层代理（shallowReactive 或 shallowReadonly）。
  RAW = '__v_raw', //供内部获取代理所对应的原始对象，是实现 toRaw 的基础。
  IS_REF = '__v_isRef', //标识一个对象是 ref 实例（RefImpl），以便与普通代理区分。
}

//创建响应性对象
function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>,
) {
  // 非对象直接返回
  if (!isObject(target)) {
    console.warn(`target :"${target}"必须是一个对象`)
    return target
  }
  // 已经是代理则直接返回
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // 从缓存中查找
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  //reactive特性
  //1.Proxy的target属性只能传对象，所以reactive里面不能放简单数据类型，会报错
  //2.Proxy代理的是reactive对象(目标对象)，所以解构reactive对象无法有效代理，也就失去了响应性，综上想对简单数据类型实现响应式，必须使用ref
  const proxy = new Proxy(target, baseHandlers)

  // 缓存代理对象
  proxyMap.set(target, proxy)
  //返回代理对象
  return proxy
}
```

```typescript [shared/index.ts]
export const isObject = (value: any) => {
  return value !== null && typeof value === 'object'
}
```

:::

### 2.3 mutableHandlers(响应式handler)

:::code-group

```typescript [baseHandlers.ts]
import { track, trigger, shouldTrack } from './effect'
import { ReactiveFlags } from './reactive'
import {
  isObject,
  hasOwn,
  isIntegerKey,
  toRaw,
  hasChanged,
} from '@xunbei-vue/shared'
import { arrayInstrumentations } from './arrayInstrumentations'
import { TrackOpTypes, TriggerOpTypes } from './operations'

//创建 getter 回调方法
const get = createGetter()
//setter 回调方法
const set = createSetter()
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
}

//isReadonly是否只读，shallow是否浅层次
//reactive,shallowReactive,readonly,shallowReadonly源码实现本质区别就是createGetter函数传参不同
function createGetter(isReadonly: any = false, shallow: any = false) {
  return function get(target: any, propertyKey: string, receiver: any) {
    // 处理内部标记位（例如 ReactiveFlags.IS_REACTIVE）
    if (propertyKey === ReactiveFlags.IS_REACTIVE) return !isReadonly //深层响应式
    if (propertyKey === ReactiveFlags.IS_READONLY) return isReadonly //只读
    if (propertyKey === ReactiveFlags.IS_SHALLOW) return shallow //浅层响应式
    if (
      propertyKey === ReactiveFlags.RAW &&
      receiver === reactiveMap.get(target)
    )
      return target //原始对象

    // 数组方法特殊处理（重写数组方法如 includes, indexOf, lastIndexOf 等需保留原型行为）
    // 不加干预，会引发两个致命问题
    // 1.身份认知错乱：查找对象时，代理对象（Proxy）和原始对象（Raw）对比失败。
    // 2.无限递归爆栈：修改数组的方法隐式读取 length，导致副作用函数互相触发死循环。

    // 1. 判断是否是数组
    const targetIsArray = Array.isArray(target)
    // 2. 🚨 拦截核心：如果是数组，且访问的是被重写的方法
    if (
      !isReadonly &&
      targetIsArray &&
      hasOwn(arrayInstrumentations, propertyKey)
    ) {
      // 返回 Vue 重写后的方法
      return Reflect.get(arrayInstrumentations, propertyKey, receiver)
    }
    // 利用 Reflect 得到返回值   receier将this指向从目标对象转换成代理对象
    const res = Reflect.get(target, propertyKey, receiver)

    //如果是shallowReadonly,则shallow为true,直接返回数据
    if (shallow) {
      return res
    }
    // 若值为 ref，自动解包 .value（仅对数组和通过下标访问时不解包）
    if (isRef(res)) {
      return targetIsArray && isIntegerKey(propertyKey) ? res : res.value
    }

    //判断res是不是object对象 懒代理设置，性能优化
    if (isObject(res)) {
      //对象嵌套执行reactive和readonly方法
      return isReadonly ? readonly(res) : reactive(res)
    }
    //如果不是只读就进行依赖收集
    if (!isReadonly) {
      //依赖收集
      track(target, TrackOpTypes.GET, propertyKey)
    }
    return res
  }
}

function createSetter(shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object,
  ) {
    let oldValue = (target as any)[key]

    // 1. 数组核心判断：是【新增元素】还是【修改现有元素】？
    const hadKey =
      Array.isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length // 索引 < 长度，说明元素已存在 (修改)
        : hasOwn(target, key) // 索引 >= 长度，说明是越界赋值 (新增)

    // 利用 Reflect.set 设置新值
    const result = Reflect.set(target, key, value, receiver)

    // 2. 派发更新
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, value) // 触发新增操作
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, value, oldValue) // 触发修改操作
      }
    }
    return result
  }
}
```

```typescript [arrayInstrumentations.ts]
import { shouldTrack } from './effect'
import { toRaw } from '@xunbei-vue/shared'

export const arrayInstrumentations = createArrayInstrumentations()

function createArrayInstrumentations() {
  const instrumentations: Record<string, Function> = {}
  //重写数组includes,indexOf,lastIndexOf方法
  ;(['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      const arr = toRaw(this) as any
      // 1. 依赖收集：遍历所有索引，使得该查找操作能响应数组内容的变化
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, TrackOpTypes.GET, i + '')
      }
      // 2. 先用原始参数执行方法
      const res = arr[key](...args)
      if (res === -1 || res === false) {
        // 3. 如果没找到，再用 toRaw 转换后的参数尝试一次（因为数组元素可能是 ref/reactive）
        return arr[key](...args.map(toRaw))
      } else {
        return res
      }
    }
  })

  //重写数组push,pop,shift,unshift,splice方法
  //这些方法会读取数组的 length 属性，设置新索引的值，并修改 length 属性，会导致隐式 length 依赖爆栈
  ;(['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    instrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      // 暂停依赖收集和触发，避免在方法内部造成死循环或性能损耗
      shouldTrack = false
      const res = (toRaw(this) as any)[key].apply(this, args)
      shouldTrack = true
      return res
    }
  })

  return instrumentations
}
```

```typescript [shared/index.ts]
//判断是不是object对象
export const isObject = (value: any) => {
  return value !== null && typeof value === 'object'
}
//返回原始对象
export function toRaw<T>(observed: T): T {
  // 尝试读取对象的 __v_raw 属性
  const raw = observed && (observed as any)[ReactiveFlags.RAW]

  // 🚨 核心逻辑：如果有 raw，说明它是个代理对象，递归调用 toRaw 继续剥离；
  // 如果没有，说明它本身就是原始对象，直接返回。
  return raw ? toRaw(raw) : observed
}
//判断当前被操作的键名（key）是不是一个合法的数组整数索引。
export const isIntegerKey = (key: unknown) =>
  isString(key) &&
  key !== 'NaN' &&
  key[0] !== '-' &&
  '' + parseInt(key, 10) === key

//当前操作究竟是修改已有属性，还是新增属性？
export const hasOwn = (val: any, key: any) =>
  Object.prototype.hasOwnProperty.call(val, key)

//新旧值比对
export const hasChanged = (value, oldValue) => !Object.is(value, oldValue)
```

```typescript [operations.ts]
//收集依赖标识
export const enum TrackOpTypes {
  GET = 'get',
  HAS = 'has',
  ITERATE = 'iterate',
}
//触发依赖标识
export const enum TriggerOpTypes {
  SET = 'set',
  ADD = 'add',
  DELETE = 'delete',
  CLEAR = 'clear',
}
```

```typescript [reactive.ts]
export enum ReactiveFlags {
  SKIP = '__v_skip', //标记一个对象永远不需要被转换为响应式。
  IS_REACTIVE = '__v_isReactive', //判断一个对象是否由 reactive（或 shallowReactive）创建的响应式代理。
  IS_READONLY = '__v_isReadonly', //判断一个对象是否为只读代理（readonly 或 shallowReadonly 创建）。
  IS_SHALLOW = '__v_isShallow', //标记当前代理是否为浅层代理（shallowReactive 或 shallowReadonly）。
  RAW = '__v_raw', //供内部获取代理所对应的原始对象，是实现 toRaw 的基础。
  IS_REF = '__v_isRef', //标识一个对象是 ref 实例（RefImpl），以便与普通代理区分。
}
```

:::

## 3. 依赖收集流程（track）

### 3.1 track函数实现

:::code-group

```typescript [effect.ts]
import { createDep, Dep } from './dep'

type KeyToDepMap = Map<any, Dep>
//可收集依赖
export let shouldTrack: any
//收集所有依赖的 WeakMap 实例：
const targetMap = new WeakMap<any, KeyToDepMap>()
//单例的，当前的 effect
let activeEffect: ReactiveEffect | undefined

//是否可以收集依赖
function isTracking() {
  //触发get操作还在收集依赖阶段 activeEffect为undefined时不收集依赖
  //不需要收集依赖的时候shouldTrack为false
  return shouldTrack && activeEffect !== undefined
}

//用于收集依赖的方法
export function track(target: object, type: TrackOpTypes, key: unknown) {
  //traget(目标)->key(目标属性)->dep(依赖项)

  //状态为不收集依赖时直接返回
  if (!isTracking()) return

  // 遍历操作的依赖会被挂载到 'length' 或专门的 ITERATE_KEY 上。
  // 🚨 针对数组遍历的特殊处理（通常在 get 拦截器或 ownKeys 拦截器中处理映射）
  if (Array.isArray(target) && type === TrackOpTypes.ITERATE) {
    key = 'length'
  }
  // 尝试从 targetMap 中，根据 target 获取 map
  let depsMap = targetMap.get(target)
  // 如果获取到的 map 不存在，则生成新的 map 对象，并把该对象赋值给对应的 value
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 获取指定 key 的 dep
  let dep = depsMap.get(key)

  // 如果 dep 不存在，则生成一个新的 dep，并放入到 depsMap 中
  if (!dep) {
    //createDep创建一个set类型的依赖存储项，里面是所有的依赖
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}
```

```typescript [dep.ts]
import { ReactiveEffect } from './effect'
export type Dep = Set<ReactiveEffect>
//依据 effects 生成 dep 实例
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  //创建一个里面放有ReactiveEffect类的set数据类型，使用set是为了保证依赖的唯一性，dep保存所有依赖项
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}
```

:::

### 3.2 trackEffects依赖收集

:::code-group

```typescript [effect.ts]
//利用 dep 依次跟踪指定 key 的所有 effect
function trackEffects(dep: Dep) {
  //添加单例依赖
  //避免重复收集依赖
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  //单例依赖项下面的deps数组中存储当前收集的依赖，用于清除依赖时使用
  activeEffect.deps.push(dep)
}
```

:::

### 3.3 流程图

![Logo](/trackReactive.png)

## 4. 触发更新流程（trigger）

### 4.1 trigger函数实现

:::code-group

```typescript [effect.ts]
//触发依赖
export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  newValue?: unknown,
  oldValue?: unknown,
) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  // 收集所有需要触发的 dep（可能不止一个，例如数组 length 修改会连带影响多个索引）
  let deps: (Dep | undefined)[] = []

  if (key === 'length' && Array.isArray(target)) {
    // 显式设置 arr.length = n 时，需要触发：
    // 1. length 本身
    // 2. 所有索引 >= n 的依赖（这些索引对应的元素将被删除）
    depsMap.forEach((dep, mapKey) => {
      if (mapKey === 'length' || mapKey >= (newValue as number)) {
        deps.push(dep)
      }
    })
  } else {
    // 正常情况：优先收集 key 对应的 dep
    if (key !== undefined) {
      deps.push(depsMap.get(key))
    }

    // 根据操作类型追加额外依赖
    switch (type) {
      case TriggerOpTypes.ADD:
        if (!Array.isArray(target)) {
          // 非数组对象新增属性时，通知迭代器依赖（例如 for...in）
          deps.push(depsMap.get(ITERATE_KEY))
        } else if (isIntegerKey(key)) {
          // 数组新增索引（如 push、unshift），需要触发 length 的依赖
          // 因为数组长度改变会影响依赖于 length 的副作用（例如 v-for）
          deps.push(depsMap.get('length'))
        }
        break
      case TriggerOpTypes.DELETE:
        if (!Array.isArray(target)) {
          // 非数组对象删除属性时，通知迭代器依赖
          deps.push(depsMap.get(ITERATE_KEY))
        }
        // 对于数组，delete 操作不改变 length，因此无需额外处理
        break
      case TriggerOpTypes.SET:
        // SET 仅影响当前 key，已收集，无需额外处理
        break
      case TriggerOpTypes.CLEAR:
        // 清空集合时，所有依赖都要触发（这里只做简单处理，集合类型有其专门逻辑）
        deps = [...depsMap.values()]
        break
    }
  }

  // 合并所有收集到的 dep，去重后统一触发
  const effects = new Set<ReactiveEffect>()
  for (const dep of deps) {
    if (dep) {
      for (const effect of dep) {
        effects.add(effect)
      }
    }
  }

  triggerEffects(createDep([...effects]))
}
```

:::

### 4.2 triggerEffects执行更新

:::code-group

```typescript [effect.ts]
//依次触发 dep 中保存的依赖
function triggerEffects(dep: Dep) {
  // 把 dep 构建为一个数组
  const effects = Array.isArray(dep) ? dep : [...dep]
  // 依次触发
  // for (const effect of effects) {
  // 	triggerEffect(effect)
  // }

  // 不在依次触发，而是先触发所有的计算属性依赖，再触发所有的非计算属性依赖
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }
  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}
//触发指定的依赖
function triggerEffect(effect: ReactiveEffect) {
  //当依赖有scheduler 执行依赖的scheduler方法
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
```

:::

### 4.3 流程图

![Logo](/triggerReactive.png)

## 5. effect副作用函数

### 5.1 ReactiveEffect类

:::code-group

```typescript [effect.ts]
//响应性触发依赖时的执行类
export let activeEffect: any
export let shouldTrack: any
const effectStack: ReactiveEffect[] = []

//依赖类
export class ReactiveEffect {
  private _fn: any
  //存在该属性，则表示当前的 effect 为计算属性的 effect
  computed?: ComputedRefImpl<T>
  //依赖数组
  deps = []
  //是否可用 响应式
  active = true
  //清空依赖执行的副作用函数
  onStop?: () => void
  public scheduler: Function | undefined

  constructor(fn: any, scheduler: any) {
    this._fn = fn
    this.scheduler = scheduler
  }

  run() {
    //1.会收集依赖，利用shouldTrack来区别  stop以后不让收集依赖
    if (!this.active) {
      return this._fn()
    }
    //防止effect嵌套自增递归死循环  例： effect(() => {count.value++})
    if (!effectStack.includes(this)) {
      try {
        // 3. 将自己压入栈顶，并设置为 activeEffect
        effectStack.push(this)
        //可进行依赖收集
        shouldTrack = true
        //将这个单例依赖类赋值给activeEffect
        activeEffect = this
        //执行fn方法时会收集依赖，收集完依赖再把shouldTrack置为false，防止依赖再次重复收集
        const result = this._fn()
        //reset
        shouldTrack = false
        // 4. 执行 getter 函数，期间所有 track 都依赖 activeEffect
        return result
      } finally {
        // 5. 执行完毕后，弹出自己
        effectStack.pop()
        // 6. 恢复 activeEffect 为栈顶元素（若栈空则为 undefined）
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }

  stop() {
    if (this.active) {
      //清除依赖
      cleanupEffect(this)
      if (this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

//清除依赖
function cleanupEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
  effect.deps.length = 0
}

//停止收集依赖
export function stop(runner: Runner): void {
  //执行依赖类的stop方法
  runner.effect?.stop()
}
```

:::

### 5.2 effect创建函数

:::code-group

```typescript [effect.ts]
interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}
function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  //fn
  const scheduler = options && options.scheduler
  const _effect = new ReactiveEffect(fn, scheduler)
  //合并options选项
  const extend = Object.assign
  extend(_effect, options)
  //懒执行
  if (!options || !options.lazy) {
    // 执行 run 函数
    _effect.run()
  }
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  //手动执行更新的函数
  return runner
}
```

:::

## 6. 依赖存储结构

### 6.1 targetMap数据结构

```js
// 全局的依赖映射 traget(目标)->key(目标属性)->dep(依赖项)
const targetMap = new WeakMap()
// targetMap结构: WeakMap<object, Map<key, Set<effect>>>
```

### 6.2 createDep创建依赖集合

:::code-group

```typescript [dep.ts]
import { ReactiveEffect } from './effect'
export type Dep = Set<ReactiveEffect>
//依据 effects 生成 dep 实例
export const createDep = (effects?: ReactiveEffect[]): Dep => {
  //创建一个里面放有ReactiveEffect类的set数据类型，使用set是为了保证依赖的唯一性，dep保存所有依赖项
  const dep = new Set<ReactiveEffect>(effects) as Dep
  return dep
}
```

:::

## 7. 完整流程示例

### 7.1 基础使用示例

```ts
// 创建响应式对象
const state = reactive({ count: 0 })

// 创建副作用函数
effect(() => {
  console.log(state.count)
})

// 修改属性触发更新
state.count = 1 // 输出: count changed: 1
```

### 7.2 完整流程图

![Logo](/reactive3.png)

## 8. 工具函数实现

### `isReactive`

检查一个对象是否是由 `reactive()` 或 `shallowReactive()` 创建的代理。

```typescript
function isReactive(value: any) {
  //执行取值操作触发get方法
  return !!value[ReactiveFlags.IS_REACTIVE]
}
```

### `isReadonly`

通过 `readonly()` 和 `shallowReadonly()` 创建的代理都是只读的，类似于没有 `set` 函数的 `computed ref`。

```typescript
function isReadonly(value: any) {
  //执行取值操作触发get方法
  return !!value[ReactiveFlags.IS_READONLY]
}
```

### `isProxy`

检查一个对象是否是由 `reactive()`、`readonly()`、`shallowReactive()` 或 `shallowReadonly()` 创建的代理。

```typescript
function isProxy(value: any) {
  return isReadonly(value) || isReactive(value)
}
```

## 9. 总结

`reactive` 是 Vue 3 响应式系统面向对象的基石，通过 `Proxy` 实现了全面、精准的拦截，结合 `track/trigger` 与 `effect` 系统，构建出自动依赖追踪与更新的完整链路。

- **设计亮点**：惰性递归深度响应式、数组方法重写、自动解包 `ref`、对集合类型的特殊处理。
- **性能优化**：使用 `WeakMap` 防止内存泄漏，依赖集合使用 `Set` 去重，惰性递归减少不必要的代理创建。
- **扩展性**：通过工厂模式轻松衍生出 `shallowReactive`、`readonly` 等变体，并预留了自定义 `Proxy handler` 的能力。
