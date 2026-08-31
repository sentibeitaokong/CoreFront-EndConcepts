# 更新机制

更新机制是前端框架的「神经中枢」——它决定状态变化后 UI 在多大范围内被重新计算。React 与 Vue 3 在这里走向两条相反的路：React 用「**顺序链表 + 显式声明 + 自上而下执行**」定位状态、传播更新，Vue 3 则用「**依赖图 + 自动收集 + 点对点触发**」精确追踪依赖、定向刷新。前者把「收敛更新」的职责交给开发者（`deps`、`memo`），后者把它交给运行时（`Proxy` 拦截）。

## 1. 状态存储与定位机制

### 1.1 [React：Hooks 顺序链表](../core-design/hooksInternals.md)

React 用**调用顺序**而非名称来定位状态：所有 Hooks 都挂在 Fiber 节点的 `memoizedState` 单向链表上，每次渲染时按顺序逐个取用。

:::code-group

```javascript [Hooks 链表结构]
// fiber.memoizedState 是一条单向链表，每个节点是一个 Hook
{
  memoizedState: 0,      // 当前值：useState 存值，useEffect 存 { create, destroy, deps }
  baseState: 0,          // 本次更新的基准状态（重放 update 的起点）
  queue: {
    pending: { action, lane, next },  // 待处理 update 的环形链表
    dispatch: setCount,               // 对应的 setState 引用
  },
  next: {                 // → 下一个 Hook，按组件内书写顺序串联
    memoizedState: { create, destroy, deps },  // 第二个 Hook：useEffect
    next: { memoizedState: { current: el }, next: null },  // 第三个：useRef
  },
}
```

```javascript [useState 核心实现]
// mount 时追加节点，update 时按顺序取节点——没有 key 可查，跳过即错位
function mountState(initialState) {
  const hook = mountWorkInProgressHook() // 链表尾追加新 hook
  hook.memoizedState =
    typeof initialState === 'function' ? initialState() : initialState
  hook.queue = { pending: null, dispatch: null }
  const dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    hook.queue,
  )
  hook.queue.dispatch = dispatch
  return [hook.memoizedState, dispatch]
}

function updateState() {
  const hook = updateWorkInProgressHook() // 按顺序取下一个 hook
  const update = hook.queue.pending?.next // 环形链表中最早的 update
  if (update != null) {
    let newState = hook.baseState // 从基准状态重放所有 update
    do {
      newState =
        typeof update.action === 'function'
          ? update.action(newState)
          : update.action
      update = update.next
    } while (update !== hook.queue.pending.next)
    hook.memoizedState = newState
  }
  return [hook.memoizedState, hook.queue.dispatch]
}
```

:::

**顺序为何不能变**：链表里没有任何 key/名字，每次 `useState`/`useMemo`/`useEffect` 都按"**取当前节点 → 指针前进一格**"定位。某次渲染一旦跳过某个 Hook，后续所有 Hook 整体错位——`count` 可能读到 `useEffect` 的 `deps`，`setState` 的更新可能写进 `useRef`。这正是 `eslint-plugin-react-hooks` 必须静态检查调用顺序的原因。

### 1.2 [Vue 3：响应式对象代理](../../../vue/advanced/source-code/reactivity-core/reactive.md)

Vue 3 的状态存储在 **响应式对象** 中，通过 `Proxy` 拦截属性的读写操作，不依赖任何调用顺序。

:::code-group

```javascript [reactive 与 ref]
// reactive：Proxy 拦截 get/set，深层对象惰性递归代理
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key) // 读即收集依赖
      const res = Reflect.get(target, key, receiver)
      return isObject(res)
        ? reactive(res) // 深层对象再次代理（惰性）
        : res
    },
    set(target, key, value, receiver) {
      const old = target[key]
      const res = Reflect.set(target, key, value, receiver)
      if (old !== value) trigger(target, key) // 值变了才触发
      return res
    },
  })
}

// ref：把任意值包成对象，用 .value 的 get/set 做 track/trigger
function ref(value) {
  return {
    _value: toReactive(value), // 对象走 reactive，原始值直接存
    get value() {
      track(this, 'value')
      return this._value
    },
    set value(v) {
      if (v !== this._value) {
        this._value = toReactive(v)
        trigger(this, 'value')
      }
    },
  }
}
```

```javascript [track 与 trigger]
// 依赖图连接枢纽：target → key → 依赖它的 effect 集合
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return // 不在 effect 内，不收集
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect) // 记录「谁依赖了这个 key」
  activeEffect.deps.push(dep) // effect 反向记录，便于 stop/cleanup
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => (effect.scheduler ? effect.scheduler() : effect.run())) // 组件更新走 scheduler（微任务），computed 直接 run
}
```

:::

**ref 与 reactive 的差异**：`reactive` 只接受对象，靠 `Proxy` 拦截；`ref` 可包任意值，靠 `.value` 的 getter/setter。解构 `reactive` 会丢失响应性（需 `toRefs`），解构 `ref` 无碍；二者底层共享同一套 `track`/`trigger` 机制。

## 2. 更新触发与依赖追踪

### 2.1 [React：自上而下的"执行-跳过"模型](../core-design/updateBatching.md)

React 的更新从触发更新的组件开始，**默认整棵子树重新执行函数**，然后通过 `memo`、`useMemo`、`useCallback` 或 React Compiler 来跳过不必要的执行。

```javascript
// useState 的更新触发
function dispatchSetState(fiber, queue, action) {
  const update = createUpdate(action) // 创建 Update 对象
  enqueueUpdate(fiber, queue, update) // 入队
  scheduleUpdateOnFiber(fiber) // 调度更新
}

// 更新阶段：beginWork 从根节点或触发点开始遍历整棵树
function beginWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress)
    case ClassComponent:
      return updateClassComponent(current, workInProgress)
    // ... 其他类型
  }
}
```

**核心特征**：

- 更新从触发点向上冒泡到根，再从根向下遍历所有子节点
- 每个组件是否重新执行，取决于 `memo`/`shouldComponentUpdate` 的判断
- 依赖追踪靠的是"**执行时读到了什么**"——但 React 不会自动记录，需要开发者用 `useMemo`/`useCallback` 显式声明依赖数组

### 2.2 [Vue 3：自下而上的"依赖-触发"模型](../../../vue/advanced/source-code/reactivityUpdate.md)

Vue 3 的更新基于 **依赖图（Dependency Graph）**：数据变化时，只有直接或间接依赖了该数据的 Effect 才会被触发。

```javascript
// 依赖图枢纽：target → key → 依赖它的 effect 集合
const targetMap = new WeakMap()

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect) // 记录"谁依赖了这个 key"
  activeEffect.deps.push(dep) // effect 反向记录，便于 cleanup
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  dep?.forEach(effect => {
    effect.scheduler ? effect.scheduler() : effect.run()
  })
}
```

**核心特征**：

- 依赖在**读取时自动收集**，无需开发者手动声明
- 更新是**点对点触发**——数据变了，直接通知依赖它的 Effect
- 组件渲染本身也是一个 Effect，因此只有用到了变化数据的组件才会重新执行

## 3. 派生状态与缓存机制

### 3.1 [React `useMemo`：渲染期同步求值](../core-design/hooksInternals.md)

```javascript
function useMemo(nextCreate, deps) {
  const hook = updateWorkInProgressHook()
  const prev = hook.memoizedState
  if (prev !== null && deps.every((d, i) => Object.is(d, prev[1][i]))) {
    return prev[0] // 缓存命中
  }
  const value = nextCreate()
  hook.memoizedState = [value, deps]
  return value
}
```

- **求值时机**：每次渲染时同步求值（检查 deps 是否变化）
- **依赖声明**：必须显式传入 `deps` 数组，靠 `Object.is` 浅比较
- **失效粒度**：整个 deps 数组任一引用变化即整体失效

### 3.2 [Vue `computed`：惰性求值 + 自动失效](../../../vue/advanced/source-code/reactivity-core/computed.md)

```javascript
function computed(getter) {
  let dirty = true
  let value
  const effect = new ReactiveEffect(getter, () => (dirty = true))
  return {
    get value() {
      if (dirty) {
        value = effect.run()
        dirty = false
      } // 首次或失效才重算
      track(this, 'value') // 让外层 effect 也能收集到 computed 的依赖
      return value
    },
  }
}
```

- **求值时机**：惰性求值——被读取时才计算，依赖变化只标记 `dirty`
- **依赖声明**：无需手动声明，读取响应式数据时自动 `track` 收集
- **失效粒度**：精确到具体响应式属性，只依赖真正读过的属性

### 3.3 对比总结

| 维度     | Vue `computed`                     | React `useMemo`          |
| -------- | ---------------------------------- | ------------------------ |
| 依赖声明 | 自动收集（读取时 track）           | 手动传入 deps 数组       |
| 求值时机 | 惰性——被读取时才计算               | 同步——每次渲染检查并重算 |
| 失效粒度 | 精确到具体属性                     | 整个 deps 数组整体失效   |
| 级联传播 | 天然级联，computed 可依赖 computed | 需手动在 deps 中逐层声明 |

## 4. 跨层数据传递

### 4.1 [React Context：广播式订阅](../core-design/contextPropagation.md)

```jsx
// Provider value 变化 → 所有读取该 Context 的 Consumer 重渲染（广播式）
const ThemeContext = createContext('light')

function App() {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={theme}>
      <Toolbar />
    </ThemeContext.Provider>
  )
}

function Toolbar() {
  const theme = useContext(ThemeContext) // 订阅：value 变则重渲染
  return <div className={theme}>...</div>
}
```

**核心特征**：

- `useContext` 读取即订阅，Provider value 变化触发所有 Consumer 重渲染
- 广播式传播：除非用 `memo`/React Compiler 拦截，否则所有 Consumer 都会执行
- 粗粒度：只用到一小部分字段也会整体重渲染

### 4.2 [Vue `provide/inject`：查找式注入](../../../vue/advanced/source-code/provideAndInject.md)

```vue
<!-- provide/inject 只沿 parent 链查找一次，响应式靠被注入的 ref 本身 -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('light')
provide('theme', theme) // 注入 ref 本身（注入普通值不响应）
</script>

<!-- 子组件 -->
<script setup>
import { inject } from 'vue'
const theme = inject('theme') // 读 theme.value 才触发依赖收集
</script>
```

**核心特征**：

- `provide`/`inject` 本身只沿 parent 链查找一次，**不建立订阅关系**
- 真正让跨层数据响应化的是被注入的 `ref`/`reactive` 对象
- 细粒度：子组件读取 `inject('theme').value` 时，依赖被收集到子组件自己的 Effect 上

### 4.3 对比总结

| 维度       | React Context                | Vue provide/inject           |
| ---------- | ---------------------------- | ---------------------------- |
| 订阅关系   | `useContext` 即订阅          | 本身不订阅，只查找一次       |
| 更新传播   | 广播式：所有 Consumer 重渲染 | 点对点：仅真正读取的组件更新 |
| 响应性来源 | Provider 的 value 本身       | 被注入对象自身的响应式       |
| 粒度       | 粗：按 Context 整体          | 细：按具体响应式属性         |

## 5. 设计哲学的根本差异

| 维度         | React                                 | Vue 3                             |
| ------------ | ------------------------------------- | --------------------------------- |
| **状态存储** | Fiber 链表 + Hook 顺序                | Proxy/ref 响应式对象              |
| **状态读取** | 组件执行时按 Hooks 顺序取             | 访问 `.value` 或代理属性          |
| **依赖建立** | 开发者手动声明（deps 数组）           | 运行时自动收集（track）           |
| **依赖比较** | `Object.is` 浅比较 deps               | 响应式属性精确比较                |
| **更新起点** | 触发点 → 根 → 整棵子树                | 数据变化 → 直接通知依赖 Effect    |
| **更新传播** | 自上而下执行 + 跳过优化               | 自下而上点对点触发                |
| **派生缓存** | `useMemo`，渲染期同步求值             | `computed`，惰性求值 + dirty 标记 |
| **跨层注入** | Context Provider + useContext         | provide + inject                  |
| **注入更新** | Provider value 变 → 广播所有 Consumer | 注入 ref 本身 → 响应式依赖驱动    |

**核心差异要点：**

- **状态定位方式相反**：React 靠 Hooks 的「调用顺序」定位状态（链表无 key 可查，跳过即错位）；Vue 3 靠「响应式属性」精确定位（`Proxy` 拦截），不受调用顺序约束。
- **依赖追踪的主动权不同**：React 需要开发者用 `deps` 数组「告诉」框架依赖什么；Vue 3 在读取响应式数据时「自动」`track` 收集，几乎零心智成本。
- **更新传播方向相反**：React 自顶向下「整树重新执行 + 跳过优化」；Vue 3 自底向上「点对点触发」，只有依赖了变化数据的组件才重跑。
- **失效粒度不同**：React 的 `useMemo` 以整个 `deps` 数组为单位整体失效；Vue 的 `computed` 精确到具体响应式属性，并支持惰性求值与天然级联。
