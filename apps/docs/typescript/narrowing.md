# 类型收窄

**核心本质**：TypeScript 编译器基于 JavaScript 运行时的**控制流分析 (Control Flow Analysis)**，将宽泛的联合类型、`unknown` 等在特定代码分支内“**压缩**”为绝对安全的精确类型。

**解决目标**：消除不确定类型带来的安全隐患，将“**类型断言（强转）**”的风险转化为运行时的严谨校验。

**一句话理解**：**“不要信任外部变量，先用运行时代码自证清白，再享用编译期的专属类型提示。”**

## 1. 原生类型探针

[width(18,29,53)]

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

[width(24,33,43)]

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

## 7. 类型断言不是收窄

初学者最常把 `as` 当成收窄来用，这两者**有本质区别**：收窄是编译器**验证**后确认的事实，断言是你**单方面通知**编译器的声明。

```ts
// ❌ 断言：编译期一路绿灯，运行时毫无保障
const el = document.getElementById('app') as HTMLDivElement
el.innerHTML = 'hello' // 如果 #app 不存在，el 实际是 null，这里直接崩溃

// ✅ 收窄：编译期验证，运行时也真的检查过
const el2 = document.getElementById('app')
if (el2 instanceof HTMLDivElement) {
  el2.innerHTML = 'hello' // 安全，且崩溃风险被真正排除
}
```

**为什么收窄更强**：`if` 分支里的那段运行时代码是**真实执行**的。它不只是为了让编译器闭嘴，而是在运行时就把不符合预期的值挡在了外面。断言什么都没有做——它只是把问题从编译期推迟到了线上。

**双重断言是最后的警报**：当你被迫写出 `as unknown as T` 时，说明两个类型之间已经没有任何可验证的关系了。这时正确做法通常是回头补类型守卫，而不是绕过检查器：

```ts
// ⚠️ 双重断言：类型系统的最后一道防线被击穿
const data = raw as unknown as User

// 回到正轨：写一个真正的运行时探针
function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.id === 'number' && typeof record.name === 'string'
}

const data2: unknown = raw
if (isUser(data2)) {
  console.log(data2.id) // 真正的安全区
}
```

## 8. 控制流分析的局限

收窄不是万能的。TS 的控制流分析是**保守**的——凡是它无法证明安全的地方，一律拒绝沿用已有的收窄结论。以下三类失效场景在真实项目里出现频率极高。

### 8.1 闭包中 `let` 变量的收窄会失效

编译器无法保证闭包**实际执行**时，外层变量还是当初那个值。

```ts
let value: string | null = getValue()

if (value !== null) {
  setTimeout(() => {
    // ❌ 报错：value 可能已经被改回 null
    // console.log(value.length)
  })
}
```

**解法**：把值搬进一个不会再变的 `const`。

```ts
const value2: string | null = getValue()

if (value2 !== null) {
  setTimeout(() => {
    console.log(value2.length) // ✅ const 不可能被重新赋值，收窄保留
  })
}
```

> [!NOTE] TypeScript 5.4 起的改进
> 编译器会做更精细的数据流分析：只要它能证明某个 `let` 变量在闭包创建之后**不会再被赋值**，收窄就会被保留。但一旦存在任何后续赋值，收窄立刻失效。**与其揣摩编译器的判断边界，不如直接用 `const`。**

### 8.2 `filter` 不会自动改变数组类型

这是 TS 里最经典的“**看起来该成立却不成立**”的场景。

```ts
const values: (string | null)[] = ['a', null, 'b']

// 直觉上 filtered 应该是 string[]，实际类型仍是 (string | null)[]
const filtered = values.filter(v => v !== null)
```

**解法一**：显式写成类型谓词，让编译器听懂你的意图。

```ts
const filtered = values.filter((v): v is string => v !== null)
// filtered 的类型是 string[]
```

**解法二**：使用 TS 5.5+ 的自动推导（它会为这类回调推断出类型谓词），但要注意推导规则并不覆盖所有写法，复杂场景仍建议显式标注。

```ts
// TS 5.5+ 把回调推断为 (v: string | null) => v is string
const filtered = values.filter(v => v !== null)
// filtered 的类型是 string[]

// ❌ 脱离调用上下文（没有期望的签名）时不会推导
const isNonNull = (v: string | null) => v !== null
// 类型仍是 (v: string | null) => boolean，不是类型谓词
```

**解法三**：`flatMap` 顶替。

```ts
const filtered2 = values.flatMap(v => (v === null ? [] : [v]))
// filtered2 的类型是 string[]
```

### 8.3 对象属性的收窄会被函数调用打断

```ts
const config: { name: string | null } = { name: 'app' }

if (config.name !== null) {
  doSomething() // 这个调用可能改掉了 config.name
  // ❌ 报错：收窄结果已被重置
  // config.name.length
}
```

**解法**：解构到局部常量，把“**属性**”变成“**快照**”。

```ts
const { name } = config
if (name !== null) {
  doSomething()
  console.log(name.length) // ✅ 局部常量不受外部修改影响
}
```

## 9. 常见问题 (FAQ) 与避坑指南

### 9.1 为什么接口数据强制建议先用 `unknown` 而不是 `any`？

外部输入（接口、`localStorage`、第三方回调）是极其危险的。用 `any` 等于放弃抵抗，而 `unknown` 是“**安全的 any**”。

它强制开发者在使用数据前,必须通过`is`或`asserts`编写运行时探针，实现**从非安全区到安全区的强力过滤**。

### 9.2 什么时候必须用判别联合？

只要你的组件或业务实体存在**互斥的多个状态**（且不同状态下挂载的数据字段不同），**绝对不要**把所有字段堆在一起然后全加上 `?`。

必须使用判别联合，这是 DDD（领域驱动设计）在 TypeScript 中最完美的落地方案。

### 9.3 `typeof` / `instanceof` / `in` 这三个探针各有什么坑？

- **`typeof`**：`typeof null === 'object'` 是 JS 早期的历史遗留 bug，且永远不会修复；`typeof [] === 'object'` 同理。所以它无法精细区分对象和数组——判 `null` 用 `val === null`，判数组用 `Array.isArray(val)`。
- **`instanceof`**：依赖原型链，跨 iframe 或 Web Worker 传递的对象会失效（执行上下文不同）。
- **`in`**：会**顺着原型链查找**，继承来的属性同样会命中；而且只要该键存在，哪怕值是 `undefined`，`in` 也返回 `true`。用它区分接口时，要确保这个属性名在其他分支上确实不会出现。

### 9.4 `is` 和 `asserts` 该怎么选？

- **返回布尔值、要写进 `if` 表达式** 用 `is`：`function isUser(v: unknown): v is User`，类型在 `if` 块内收窄。
- **“不满足即抛错”、把校验变成前置关卡** 用 `asserts`：`asserts` 一旦通过，当前作用域内该变量的类型会被永久锁定，后续代码不用再判空。

配置加载、BFF 层数据清洗这类“**校验失败就该立刻中断**”的场景，`asserts` 更省事。

### 9.5 `if (val)` 判空为什么会误杀 `0` 和 `''`？

`if (val)` 拦截的是**全部 Falsy 值**——`false`、`0`、`''`、`null`、`undefined`、`NaN` 都会被拦下。

只想拦 `null` 和 `undefined` 就用 `if (val != null)`：双等号会同时处理这两者，且放行 `0` 和 `''`，这是最安全的判空写法。

### 9.6 穷尽检查（`never`）到底有什么用？

它把“**未来漏写分支**”变成**编译期错误**。

配合 `switch` 的 `default` 分支，把剩余值赋给声明为 `never` 的变量：一旦新增了联合成员却忘记处理，该成员就会落到 `default`，赋值失败并立刻在编译期报错。

### 9.7 `as` 和类型守卫到底差在哪，为什么说 `as` 危险？

**一句话**：守卫是**运行时真的检查过**，断言是**你嘴上担保**。

`as` 在编译产物里不生成任何代码，它只影响类型检查。所以 `x as User` 之后，如果 `x` 运行时根本不是 `User`，程序会一路带着错误的类型假设跑下去，直到某个字段访问崩掉——而崩溃点往往离出错点很远，极难排查。

**实践准则**：`as` 只用在两个场景——**编译器确实推导不出来但你百分百确定**（如 `Object.keys` 的返回值）、**测试代码里构造数据**。业务主流程一律走类型守卫。

### 9.8 收窄失效了怎么办？

**先分清是哪一类失效**，再套对应的解法：

- **`filter` 之后数组类型没变窄**：`filter` 的签名只声明“返回值与原数组元素类型相同”，它**没有承诺**会改变类型，TS 只能按签名办事。三种改法——显式类型谓词 `arr.filter((v): v is string => v !== null)`（最稳，任何版本都支持）、依赖 TS 5.5+ 的自动推断、或改用 `flatMap` 返回单元素数组。
- **闭包 / 回调里访问变量报“可能为 `null`”**：闭包**不保证在收窄的那个时刻执行**，编译器无法确认回调真正跑起来时，外层变量是否已经被别处改掉，于是撤销之前的所有收窄结论。解法是把值捕获进 `const`（必要时先解构）。
