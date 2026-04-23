# Reactive

`reactive` 是 `Vue 3` 响应式系统的核心 `API`，用于将普通对象转换为深度响应式的代理对象。与 `ref` 不同，`reactive` 直接基于 `Proxy` 实现，能够拦截对象上的多种操作（读取、设置、删除、遍历等）。

## 1. 响应式系统整体架构

Vue 3的响应式系统基于Proxy和Reflect实现，采用依赖收集和触发更新的模式。整体架构包含以下核心组件：

- **reactive**：创建响应式对象的入口函数
- **effect**：副作用函数，用于追踪依赖和执行更新
- **track**：依赖收集函数
- **trigger**：触发更新函数
- **targetMap**：依赖存储的数据结构

## 2. reactive创建响应式对象流程

### 2.1 reactive函数实现

:::code-group
```typescript [reactive.ts] 
import { mutableHandlers } from './baseHandlers'

//响应式标识
export const enum ReactiveFlags {
	IS_REACTIVE = '__v_isReactive'
}

//响应性 Map 缓存对象
export const reactiveMap = new WeakMap<object, any>()

//为复杂数据类型，创建响应性对象  mutableHandlers为响应式handler
export function reactive(target: object) {
	return createReactiveObject(target, mutableHandlers, reactiveMap)
}

```
:::

### 2.2 createReactiveObject核心逻辑

:::code-group
```typescript [reactive.ts]
//创建响应性对象
function createReactiveObject(
	target: object,
	baseHandlers: ProxyHandler<any>,
	proxyMap: WeakMap<object, any>
) {
	// 如果该实例已经被代理，则直接读取即可
	const existingProxy = proxyMap.get(target)
	if (existingProxy) {
		return existingProxy
	}
    //reactive特性
    //1.Proxy的target属性只能传对象，所以reactive里面不能放简单数据类型，会报错
    //2.Proxy代理的是目标对象，所以解构reactive对象无法有效代理，也就失去了响应性，综上想对简单数据类型实现响应式，必须使用ref
	const proxy = new Proxy(target, baseHandlers)
	// 为 Reactive 增加标记
	proxy[ReactiveFlags.IS_REACTIVE] = true

	// 缓存代理对象
	proxyMap.set(target, proxy)
    //返回代理对象
	return proxy
}
```
:::

### 2.3 mutableHandlers(响应式handler)

:::code-group
```typescript [baseHandlers.ts]
import { track, trigger } from './effect'

//创建 getter 回调方法
const get = createGetter()
//setter 回调方法
const set = createSetter()
export const mutableHandlers: ProxyHandler<object> = {
    get,
    set
}
//判断是不是object对象
const isObject = (value: any) => {
    return value !== null && typeof value === 'object'
}
function createGetter(isReadonly: any = false, shallow: any = false) {
    return function get(target: any, propertyKey: string,receiver:any) {
        //判断是否是响应式以及只读属性
        if (propertyKey === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (propertyKey === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }
        //// 利用 Reflect 得到返回值   receier将this指向从目标对象转换成代理对象
        const res = Reflect.get(target, propertyKey,receiver)

        //如果是shallowReadonly,则shallow为true,直接返回数据
        if (shallow) {
            return res
        }

        //判断res是不是object对象 懒代理设置，性能优化
        if (isObject(res)) {
            //对象嵌套执行reactive和readonly方法
            return isReadonly ? readonly(res) : reactive(res)
        }
        //如果不是只读就进行依赖收集
        if (!isReadonly) {
            //依赖收集
            track(target, propertyKey)
        }
        return res
    }
}
function createSetter() {
    return function set(
        target: object,
        key: string | symbol,
        value: unknown,
        receiver: object
    ) {
        // 利用 Reflect.set 设置新值
        const result = Reflect.set(target, key, value, receiver)
        // 触发依赖
        trigger(target, key)
        return result
    }
}
```
:::

## 3. 依赖收集流程（track）

### 3.1 track函数实现

:::code-group
```typescript [effect.ts]
import { createDep, Dep } from './dep'

type KeyToDepMap = Map<any, Dep>
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
function track(target, type, key) {
    //traget(目标)->key(目标属性)->dep(依赖项)

    //状态为不收集依赖时直接返回
    if (!isTracking()) return
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

## 4. 触发更新流程（trigger）

### 4.1 trigger函数实现

:::code-group
```typescript [effect.ts]   
//触发依赖
function trigger(target: object, key?: unknown) {
  // 依据 target 获取存储的 map 实例
  const depsMap = targetMap.get(target)
  // 如果 map 不存在，则直接 return
  if (!depsMap) {
    return
  }
  // 依据指定的 key，获取 dep 实例
  let dep: Dep | undefined = depsMap.get(key)
  // dep 不存在则直接 return
  if (!dep) {
    return
  }
  // 触发 dep
  triggerEffects(dep)
}
```
:::

### 4.2 triggerEffects执行更新

:::code-group
```typescript [effect.ts]
//依次触发 dep 中保存的依赖
function triggerEffects(dep: Dep) {
  // 把 dep 构建为一个数组
  const effects = isArray(dep) ? dep : [...dep]
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

## 5. effect副作用函数

### 5.1 ReactiveEffect类

:::code-group
```typescript [effect.ts]
//响应性触发依赖时的执行类
let activeEffect: any
let shouldTrack: any
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
        shouldTrack = true
        //将这个单例依赖类赋值给activeEffect
        activeEffect = this
        //执行fn方法时会收集依赖，收集完依赖再把shouldTrack置为false，防止依赖再次重复收集
        const result = this._fn()
        //reset
        shouldTrack = false
        return result
    }
    stop() {
        if (this.active) {
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
function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
    //fn
    const scheduler = options.scheduler
    const _effect = new ReactiveEffect(fn, scheduler)
    //合并options选项
    const extend=Object.assign
    extend(_effect, options)
    _effect.run()
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

## 7. 工具函数实现

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

## 8. 完整流程示例

### 8.1 基础使用示例

```ts
// 创建响应式对象
const state = reactive({ count: 0 })

// 创建副作用函数
effect(() => {
  console.log(state.count)
})

// 修改属性触发更新
state.count=1 // 输出: count changed: 1
```

### 8.2 完整流程图

![Logo](/reactive3.png)


## 9. 总结

Vue 3的响应式系统通过Proxy实现了更完善的拦截能力，相比Vue 2有以下优势：

1. **更完整的拦截**：支持数组索引、对象新增/删除属性等
2. **更好的性能**：懒代理减少初始化开销
3. **更简洁的实现**：无需重写数组原型方法
4. **更灵活的架构**：effect系统支持更复杂的调度策略


