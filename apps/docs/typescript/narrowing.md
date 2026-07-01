# 类型收窄

**核心本质**：TypeScript 编译器基于 JavaScript 运行时的**控制流分析 (Control Flow Analysis)**，将宽泛的联合类型、`unknown` 等在特定代码分支内“**压缩**”为绝对安全的精确类型。

**解决目标**：消除不确定类型带来的安全隐患，将“**类型断言（强转）**”的风险转化为运行时的严谨校验。

**一句话理解**：**“不要信任外部变量，先用运行时代码自证清白，再享用编译期的专属类型提示。”**

## 1. 原生类型探针

这是利用 JS 原生操作符进行收窄的三大基石。

| 收窄方式         | 适用场景与目标                                                            | 核心避坑指南                                                                                    |
| ---------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **`typeof`**     | 判断 JavaScript 的 8 种基础原始类型。                                     | ⚠️ **陷阱**：`typeof null === 'object'` 且 `typeof [] === 'object'`，它无法精细区分对象和数组。 |
| **`instanceof`** | 验证目标是否为某个类 (Class) 或内置构造函数 (如 `Date`, `Error`) 的实例。 | ⚠️ **局限**：依赖原型链，跨 iframe 或 Web Worker 传递的对象会失效（因执行上下文不同）。         |
| **`in` 操作符**  | 判断对象是否包含某特定属性名（常用于区分没有公共字段的接口）。            | ⚠️ **细节**：`in` 会顺着原型链查找，且哪怕该属性的值是 `undefined`，`in` 也会返回 `true`。      |

```ts
function format(val: string | Date | { title: string } | null) {
  if (val === null) {
    return 'Empty'
  }
  //1. typeof 收窄
  if (typeof val === 'string') {
    return val.trim()
  }
  //2. instanceof 收窄
  if (val instanceof Date) {
    return val.toISOString()
  }
  //3. in 收窄
  if ('title' in val) {
    return val.title
  }
}
```

## 2. 判别联合

这是 TypeScript 复杂状态建模的**黄金法则**。通过一个完全相同的字面量属性（判别式，通常命名为 `type`、`kind` 或 `status`），精准撕开联合类型。

```ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// 彻底干掉 `state.data?.xxx` 这种恶心的可选链，强制状态与数据的绑定关系。
function render<T>(state: RequestState<T>) {
  // TS 顺着 status 的值，自动推导出当前属于哪个具体的对象分支
  switch (state.status) {
    case 'success':
      return state.data // 安全访问 data
    case 'error':
      return state.error.message // 安全访问 error
  }
}
```

## 3. 自定义类型保护 (`is`)

当原生探针不够用（如校验复杂的 API 嵌套 JSON）时，开发者可以自己写判定逻辑。
**注意**：`is` 是一种“**强制信任**”，如果你的内部逻辑写错了，TS 编译器不会发现，会引发线上 Bug。

```ts
type User = { id: number; name: string }

// 返回值 value is User 告诉 TS：如果此函数返回 true，value 就是 User 类型
// Record<string, unknown>：一个键为字符串、值为未知类型的普通字典对象
function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  // 此时开发者接管了类型的担保责任
  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.name === 'string'
}
```

## 4. 断言函数 (`asserts`)

与 `is` 返回布尔值不同，`asserts` 采用“**不满足即抛错**”的逻辑。极其适合程序初始化、配置加载、BFF 层数据清洗等前置关卡。

```ts
// 如果不抛错，说明 value 就是 User
function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Fatal: Invalid user payload')
  }
}

function process(data: unknown) {
  assertUser(data)
  // 越过上方断言后，当前作用域的 data 类型已被永久锁定为 User
  console.log(data.id)
}
```

## 5. 真值与判空收窄

处理 `null` 和 `undefined` 的最佳实践。

| 判断语句           | 拦截范围                                            | 适用场景                                            |
| ------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `if (val)`         | 拦截 `false`, `0`, `''`, `null`, `undefined`, `NaN` | 需要过滤所有 Falsy 值时。**极易误杀 `0` 和 `""`**。 |
| `if (val != null)` | **仅**拦截 `null` 和 `undefined`                    | 最安全的判空法。双等号会同时处理 null/undefined。   |

## 6. 穷尽检查

配合 `switch` 语句使用的终极防御机制。利用 Bottom Type (`never`) 只能被赋予 `never` 的特性，**强制要求未来扩展代码时必须处理所有分支**。

```ts
type Action = { type: 'inc' } | { type: 'dec' } // 假设未来新增了 | { type: 'reset' }

function reducer(action: Action) {
  switch (action.type) {
    case 'inc':
      return 1
    case 'dec':
      return -1
    default:
      // 如果上方漏写了 'reset' 分支，action 的类型将落入 default。
      // 此时 action 类型为 { type: 'reset' }，强行赋值给 never 会在【编译期报错】！
      const _exhaustiveCheck: never = action
      return _exhaustiveCheck
  }
}
```

## 7. 常见问题 (FAQ) 与避坑指南

### 7.1 为什么接口数据强制建议先用 `unknown` 而不是 `any`？

外部输入（接口、LocalStorage、第三方回调）是极其危险的。用 `any` 等于放弃抵抗，而 `unknown` 是“**安全的 any**”。它强制开发者在使用数据前，必须通过 `is` 或 `asserts` 编写运行时探针，实现**从非安全区到安全区的强力过滤**。

### 7.2 什么时候必须用判别联合？

只要你的组件或业务实体存在**互斥的多个状态**（且不同状态下挂载的数据字段不同），**绝对不要**把所有字段堆在一起然后全加上 `?`。必须使用判别联合，这是 DDD（领域驱动设计）在 TypeScript 中最完美的落地方案。
