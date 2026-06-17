# `ref`

`ref` 是 Vue 3 响应式系统中用于包装基本类型值（也可包装对象）的核心 API。与 `reactive` 不同，`ref` 通过创建一个包含 `value` 属性的对象，并利用 `getter`/`setter` 实现对依赖的追踪和更新。

## 1. `ref` 的作用与设计动机

### 1.1 为什么需要 `ref`？

- `Proxy` 无法直接代理基本类型（如 `number`、`string`、`boolean`），因此需要包装为对象。
- `ref` 提供统一的 `.value` 访问方式，在模板中自动解包，使基本类型也能具备响应式能力。
- 在组合式函数中，`ref` 可以传递响应式值而不丢失响应性。

### 1.2 与 `reactive` 的简单对比

| 特性             | `ref`                            | `reactive`                      |
| ---------------- | -------------------------------- | ------------------------------- |
| 适用数据类型     | 任意（基本类型或对象）           | 仅对象（含数组、集合）          |
| 底层实现         | `RefImpl` 类 + `getter`/`setter` | `Proxy`                         |
| 访问方式         | `.value`                         | 直接属性访问                    |
| 模板自动解包     | 是（顶层属性）                   | 是                              |
| 传递时丢失响应性 | 否（整个 `ref` 对象可传递）      | 可能（直接解构/传递属性会丢失） |

## 2. 核心实现：`RefImpl` 类

### 2.1 `ref` 函数入口

:::code-group

```typescript [ref.ts]
export function ref(value?: unknown) {
  return createRef(value, false)
}
//通过 shallow 参数区分深层 ref 和浅层 ref（shallowRef）
function createRef(rawValue: unknown, shallow: boolean) {
  //判断是不是ref类型，不是的话直接返回值本身
  if (isRef(rawValue)) {
    return rawValue
  }
  //返回一个refImpl类
  return new RefImpl(rawValue, shallow)
}

//指定数据是否为 RefImpl 类型
function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}
```

:::

### 2.2 `RefImpl` 类定义

:::code-group

```typescript [ref.ts]
import { hasChanged } from '@vue/shared'
import { toReactive } from './reactive'
import { Dep } from './dep'

export interface Ref<T = any> {
  value: T
}
class RefImpl<T> {
  private _value: T
  private _rawValue: T
  public dep?: Dep = undefined
  // 是否为 ref 类型数据的标记
  public readonly __v_isRef = true
  //__v_isShallow区分深层 ref 和浅层 ref（shallowRef）
  constructor(
    value: T,
    public readonly __v_isShallow: boolean,
  ) {
    // 如果 __v_isShallow 为 true，则 value 不会被转化为 reactive 数据，即如果当前 value 为复杂数据类型，则会失去响应性。对应官方文档 shallowRef ：https://cn.vuejs.org/api/reactivity-advanced.html#shallowref
    this._value = __v_isShallow ? value : toReactive(value)
    // 原始数据
    this._rawValue = value
  }
  //get 语法将对象属性绑定到查询该属性时将被调用的函数。
  //ref类型数据一定要通过.value才能具备响应性以及访问性的原因主要是需要触发这里的get和set方法
  get value() {
    // 收集依赖
    trackRefValue(this)
    return this._value
  }
  set value(newVal) {
    //newVal 为新数据，this._rawValue 为旧数据（原始数据),对比两个数据是否发生了变化
    if (hasChanged(newVal, this._rawValue)) {
      // 更新原始数据
      this._rawValue = newVal
      // 更新 .value 的值
      this._value = toReactive(newVal)
      // 触发依赖
      triggerRefValue(this)
    }
  }
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

```typescript [/shared/index.ts]
//对比两个数据是否发生了改变
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)
```

```typescript [reactive.ts]
//将指定数据变为 reactive 数据
export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value as object) : value
```

:::

## 3. 依赖收集与触发更新

`ref` 的依赖收集和触发复用 `effect` 系统

### 3.1 `trackRefValue`

:::code-group

```typescript [ref.ts]
import { createDep, Dep } from './dep'
import { activeEffect, trackEffects } from './effect'
//收集依赖
export function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep || (ref.dep = createDep()))
  }
}
//是否可以收集依赖
export function isTracking() {
  //触发get操作还在收集依赖阶段 activeEffect为undefined时不收集依赖
  //不需要收集依赖的时候shouldTrack为false
  return shouldTrack && activeEffect !== undefined
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

```typescript [effect.ts]
//单例的，当前的 effect
let activeEffect: ReactiveEffect | undefined

//利用 dep 依次跟踪指定 key 的所有 effect
export function trackEffects(dep: Dep) {
  //添加单例依赖
  //避免重复收集依赖
  if (dep.has(activeEffect)) return
  dep.add(activeEffect)
  //单例依赖项下面的deps数组中存储当前收集的依赖，用于清除依赖时使用
  activeEffect.deps.push(dep)
}
```

:::

### 3.2 `triggerRefValue`

:::code-group

```typescript [ref.ts]
import { triggerEffects } from './effect'
//触发依赖
export function triggerRefValue(ref) {
  if (ref.dep) {
    triggerEffects(ref.dep)
  }
}
```

```typescript [effect.ts]
//依次触发 dep 中保存的依赖
export function triggerEffects(dep: Dep) {
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
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
```

:::

## 4. 完整流程示例

### 4.1 基础使用示例

```ts
// 创建响应式对象
const count = ref(0)

// 创建副作用函数
effect(() => {
  console.log(count.value)
})

// 修改属性触发更新
count.value = 1 // 输出:  1
```

### 4.2 完整流程图

![Logo](/img/ref.png)

## 5. 工具函数实现

### `isRef`

判断是否是`ref`值

```typescript
export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true)
}
```

### `unref`

如果参数是 `ref`，则返回内部值，否则返回参数本身

```typescript
export function unref<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? (ref.value as any) : ref
}
```

### `toRef`

可以将值、`refs` 或 `getters` 规范化为 `refs`。

也可以基于响应式对象上的一个属性，创建一个对应的 `ref`。这样创建的 `ref` 与其源属性保持同步：改变源属性的值将更新 `ref` 的值，反之亦然。

```typescript
// 核心类：对象属性引用
class ObjectRefImpl {
  constructor(object, key) {
    this._object = object
    this._key = key
    // 标记这是一个 ref 对象，Vue 内部通过这个标志位来识别
    this.__v_isRef = true
  }
  // 拦截 .value 的读取
  get value() {
    // 转发给 reactive 对象的 get 拦截器 -> 触发 track(依赖收集)
    return this._object[this._key]
  }
  // 拦截 .value 的修改
  set value(newValue) {
    // 转发给 reactive 对象的 set 拦截器 -> 触发 trigger(派发更新)
    this._object[this._key] = newValue
  }
}

// toRef 工具函数
export function toRef(object, key) {
  const val = object[key]
  // 如果该属性本身已经是一个 ref，就没必要再包装一层了，直接返回
  if (val && val.__v_isRef) {
    return val
  }
  // 否则，返回一个 ObjectRefImpl 实例
  return new ObjectRefImpl(object, key)
}
```

### `toRefs`

将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 `ref`。每个单独的 `ref` 都是使用 `toRef()` 创建的。

```typescript
// toRefs 工具函数
export function toRefs(object) {
  // 1. 根据传入对象是数组还是普通对象，初始化返回结果
  const ret = Array.isArray(object) ? new Array(object.length) : {}

  // 2. 遍历源对象的所有 key
  for (const key in object) {
    // 3. 对每一个 key 调用 toRef 进行包装，并挂载到返回结果上
    ret[key] = toRef(object, key)
  }

  return ret
}
```

### `proxyRefs`

你能以操作普通对象的方式，来操作一个内部可能包含 `ref` 的对象，而无需时刻使用 `.value` 来取值或赋值,因此模板无需使用`.value`属性来展示。

```typescript
export function proxyRefs<T extends object>(
  objectWithRefs: T,
): ShallowUnwrapRef<T> {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}

const shallowUnwrapHandlers: ProxyHandler<any> = {
  get(target, key, receiver) {
    //直接解构取值
    return unref(Reflect.get(target, key, receiver))
  },
  set(target, key, value, receiver) {
    const oldValue = target[key]
    //当旧值时ref类型以及新值不是ref类型时，将新值赋值给旧值的value属性
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value
      return true
    } else {
      return Reflect.set(target, key, value, receiver)
    }
  },
}
```

## 6. `ref` 与 `reactive` 对比

| 对比维度     | `ref`                     | `reactive`             |
| ------------ | ------------------------- | ---------------------- |
| 底层 API     | 自定义 `getter`/`setter`  | `Proxy`                |
| 数据结构     | 类 `RefImpl` 实例         | 代理对象               |
| 依赖存储     | `dep` 属性（`Set`）       | `targetMap` 全局存储   |
| 对基本类型   | 原生支持（包装）          | 不支持（需包装为对象） |
| 对对象的处理 | 递归调用 `reactive`       | 直接代理               |
| 模板自动解包 | 是（顶层）                | 是                     |
| 传递响应性   | 整个 `ref` 传递仍为响应式 | 直接解构属性会丢失     |

## 7. 总结

`ref` 是 Vue 3 响应式系统不可或缺的组成部分，其核心通过 `RefImpl` 类封装 `.value` 访问，利用 `trackRefValue` 和 `triggerRefValue` 与 `effect` 系统协作，实现了对基本类型和对象的响应式包装。

- **设计亮点**：统一了基本类型和对象的响应式处理，通过`__v_isRef` 标志实现了与 `reactive` 的互操作性。
- **性能优化**：依赖收集采用懒创建 `dep`，避免不必要的内存开销。
- **扩展性**：支持 `shallowRef`、`unref`、`proxyRefs` 等工具，为模板和组合式 API 提供便捷。
