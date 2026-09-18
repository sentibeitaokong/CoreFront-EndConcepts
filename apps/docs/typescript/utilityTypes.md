# 工具类型与类型计算

**核心本质**：工具类型是 TypeScript 编译器内置的**类型级纯函数**。它接收一个或多个泛型参数，通过一套完备的类型运算语法（映射、条件、推导）计算并返回一个全新的类型。

**解决目标**：消除重复的类型定义，实现基于单一数据源（Single Source of Truth）的类型自动推导与变换（如 API 响应体瘦身、表单草稿态生成、依赖注入提取）。

**一句话理解**：**“工具类型是预装好的类型体操模版，将底层复杂的 `keyof`、`in`、`extends` 和 `infer` 封装成了开箱即用的黑盒。”**

## 1. 对象属性修饰转换

针对对象接口类型的键，进行批量修饰符（可选、必填、只读）的重写。

```ts
// 底层实现与演进
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyRequired<T> = { [K in keyof T]-?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
```

[width(20,21,28,31)]

| 内置类型      | 底层操作        | 典型高频业务场景                  | 局限性深度扩展                                    |
| ------------- | --------------- | --------------------------------- | ------------------------------------------------- |
| `Partial<T>`  | 附加 `?`        | 表单编辑草稿、`PATCH` 请求载荷    | 仅**浅层可选**。深度嵌套需自定义 `DeepPartial<T>` |
| `Required<T>` | 移除 `?` (`-?`) | 归一化默认配置项，消除空检查      | 无法处理 `null`，需配合 `NonNullable`             |
| `Readonly<T>` | 附加 `readonly` | 冻结状态树 (Redux/Vuex)、常量配置 | 仅限编译期，运行时防篡改需 `Object.freeze`        |

## 2. 对象结构裁剪与字典映射

重塑对象的键值对结构，是实现接口 DTO（数据传输对象）复用的绝对主力。

```ts
// 挑选与映射
type MyPick<T, K extends keyof T> = { [P in K]: T[P] }
type MyRecord<K extends keyof any, T> = { [P in K]: T }

// 排除 (基于键名重映射 as 语法，映射为 never 即可物理剔除该键)
type MyOmit<T, K extends keyof any> = {
  [P in keyof T as P extends K ? never : P]: T[P]
}
```

- **`Pick<T, K>`**：从对象中挑选部分属性。在严谨的架构中优先使用，防止源类型新增敏感字段后被意外暴露。
- **`Omit<T, K>`**：从对象中排除部分属性。适合排除 `id`、`createdAt` 等公共字段生成创建载荷 (CreateDTO)。
- **`Record<K, T>`**：生成统一键类型的字典。其中 `keyof any` 是 TS 内部设定的安全键集，等价于 `string | number | symbol`。

## 3. 联合类型集合运算

利用**分布式条件类型** 特性，对联合类型进行精确的集合操作。

```ts
type MyExclude<T, U> = T extends U ? never : T
type MyExtract<T, U> = T extends U ? T : never
type MyNonNullable<T> = T extends null | undefined ? never : T
```

[width(22,21,57)]

| 内置类型         | 集合运算本质      | 核心作用机制                        |
| ---------------- | ----------------- | ----------------------------------- |
| `Exclude<T, U>`  | 差集 ($T - U$)    | 从联合类型中排除可赋值给 `U` 的成员 |
| `Extract<T, U>`  | 交集 ($T \cap U$) | 从联合类型中提取可赋值给 `U` 的成员 |
| `NonNullable<T>` | 过滤空值          | 移除 `null` 和 `undefined`          |

## 4. 函数签名与内部结构捕获

通过强力关键字 `infer` 实施类型层面的**模式匹配**，直接“**窃取**”函数或构造器的内部类型。

### 4.1 捕获普通函数参数

```ts
type MyParameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never

function login(username: string, age: number) {}
// 自动提取出 [username: string, age: number]
type LoginParams = MyParameters<typeof login>
// 实际用途：创建一个函数，参数与 login 完全一致
function saveUser(...args: LoginParams) {
  // args 的类型自动推导为 [string, number]
}
```

### 4.2 捕获普通函数的返回值

```typescript
type MyReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : never

function getUser() {
  return { id: 1, name: 'Ada' }
}
// 自动提取出 { id: number, name: string }
type User = MyReturnType<typeof getUser>
// 实际用途：确保函数返回值类型与某个变量类型严格匹配
const result: User = getUser()
```

### 4.3 捕获类构造函数参数

```typescript
type MyConstructorParameters<T extends abstract new (...args: any[]) => any> =
  T extends abstract new (...args: infer P) => any ? P : never

class User {
  constructor(name: string, age: number) {}
}
// 自动提取出 [name: string, age: number]
type UserConstructorArgs = MyConstructorParameters<typeof User>
// 实际用途：如果你要写一个工厂函数来创建对象，参数类型必须跟构造函数一致
function createUser(...args: UserConstructorArgs) {
  return new User(...args)
}
```

### 4.4 提取类实例化后的类型

```typescript
type MyInstanceType<T extends abstract new (...args: any[]) => any> =
  T extends abstract new (...args: any[]) => infer R ? R : never

class Store {
  name: string = 'Store'
  save() {}
}
// 自动提取出 Store 的实例对象类型 { name: string, save(): void }
type StoreInstance = MyInstanceType<typeof Store>
// 实际用途：当你需要定义一个存储 Store 实例的数组或变量时
const myStore: StoreInstance = new Store()
```

- **高阶应用**：常用于 AOP 编程、防抖节流函数封装时，动态继承并保留原函数的形参提示 (`Parameters<T>`) 和返回类型 (`ReturnType<T>`)。

## 5. 异步操作流解包

消除 Promise 嵌套地狱的类型救星，模拟 `await` 关键字的类型级执行。

```ts
type SimpleAwaited<T> = T extends Promise<infer V> ? SimpleAwaited<V> : T

type RawData = SimpleAwaited<Promise<Promise<string[]>>>
// 推导结果：string[]
```

## 6. 内置字符串操作

用于结合**模板字面量类型**生成动态键名。

- `Uppercase<StringType>`：全大写。
- `Lowercase<StringType>`：全小写。
- `Capitalize<StringType>`：首字母大写 (如 `name` $\rightarrow$ `Name`，常拼接为 `setName`)。
- `Uncapitalize<StringType>`：首字母小写。

## 7. This 上下文绑定

严格模式下控制老式 API 设计中的 `this` 指向。

### 7.1 提取this类型

```ts
// 提取函数首个特殊参数 this 的类型
type MyThisParameterType<T> = T extends (
  this: infer This,
  ...args: any[]
) => any
  ? This
  : unknown

// 定义一个带有显式 this 的函数
function sayHello(this: { name: string }, greeting: string) {
  console.log(`${greeting}, ${this.name}`)
}
// 提取出 this 的类型：{ name: string }
type ThisType = MyThisParameterType<typeof sayHello>
// 验证提取结果
const context: ThisType = { name: 'TypeScript' }
```

### 7.2 剥离this类型

```typescript
// 剥离 this，返回一个干净的纯函数签名
type MyOmitThisParameter<T> =
  unknown extends MyThisParameterType<T>
    ? T
    : T extends (...args: infer A) => infer R
      ? (...args: A) => R
      : T

function sayHello(this: { name: string }, greeting: string) {
  console.log(`${greeting}, ${this.name}`)
}
// 移除 this 后，类型变为：(greeting: string) => void
type PureFunction = MyOmitThisParameter<typeof sayHello>
// 现在你可以像普通函数一样调用它，而不需要通过 call/apply 绑定 this
const fn: PureFunction = (greeting: string) => {
  console.log(greeting)
}
fn('Hello') // ✅ 成功，不需要关注 this
```

- **典型场景**：开发 Vue 2.x、Vuex 或 jQuery 插件时，提供精准的 `this.xxx` 自动补全。

## 8. 架构决策与实现心智模型

面对复杂的类型推导需求，优先套用以下“**解题范式**”：

[width(38,62)]

| 需求特征                             | 核心工具 / 语法映射                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| 需批量增删修饰符 (可选/只读)         | 映射类型 (`[K in keyof T]`) + 符号操作 (`+?`, `-readonly`) |
| 需从已知集合筛选/排除特定成员        | 分布式条件类型 (`T extends U ? X : Y`)                     |
| 需从闭合结构中“**挖**”出某个未知类型 | 占位符匹配 (`infer`)                                       |
| 需对对象键名进行重命名或动态过滤     | 键名重映射 (`as` 关键字)                                   |

## 9. 高频自定义工具类型

内置工具类型只覆盖了最常见的浅层操作。真实项目里，下面这几个“**社区标准件**”几乎一定会被手写一遍——它们是内置类型的自然延伸。

### 9.1 `DeepPartial`：深度可选

`Partial<T>` 只作用于最外层，嵌套对象改不了。表单草稿态、`PATCH` 请求载荷需要的是深度版本。

```ts
type DeepPartial<T> = T extends Function
  ? T // 函数不再深入
  : T extends readonly unknown[]
    ? { [K in keyof T]: DeepPartial<T[K]> } // 数组保持结构
    : { [K in keyof T]?: DeepPartial<T[K]> } // 普通对象每个属性变可选

interface Settings {
  theme: string
  editor: { fontSize: number; tabSize: number }
}

type DraftSettings = DeepPartial<Settings>
// editor 也变成了可选的：editor?: { fontSize?: number; tabSize?: number }
```

**代价提醒**：递归类型是编译性能的主要杀手，大型表单上慎用（见 10.2）。

### 9.2 把指定键变成必填 / 可选

内置的 `Required<T>` 是**全量**的，但我们往往只想对某几个键下手。

```ts
// 把 K 指定的键变成必填
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

// 把 K 指定的键变成可选
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

interface User {
  id: number
  name?: string
}

type UserWithName = WithRequired<User, 'name'>
// name 变成必填：{ id: number; name: string }
```

`Omit` + `Partial<Pick<...>>` 这个组合是**精准打击单个键**的标准套路，值得记住。

### 9.3 `RequireAtLeastOne`：至少要传一个

筛选条件、更新接口这类场景，语义是“**这些字段不能全空，但也不必全填**”。

```ts
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Omit<T, Keys> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Omit<Pick<T, Keys>, K>>
  }[Keys]

interface SearchQuery {
  name: string
  email: string
  phone: string
}

type ValidQuery = RequireAtLeastOne<SearchQuery>
// 至少得提供 name / email / phone 中的一个，其余可选
```

**原理**：`[K in Keys]` 会生成一个“**每个键都想当老大**”的联合，再用索引访问 `[Keys]` 把它展开成联合类型——于是三个变体都成立，只要命中其中一个就合法。这是分布式映射 + 索引访问的经典组合技。

### 9.4 `NoInfer<T>`：阻止某处参与推导 (TS 5.4+)

有时你需要某个位置**只能校验、不能影响推导**。`NoInfer<T>` 就是给编译器下的“这里闭嘴”指令。

```ts
// 没有 NoInfer：S 会同时从 initial 和 states 推导
declare function createFSM<S extends string>(config: {
  initial: S
  states: S[]
}): void

// 有 NoInfer：S 只由 states 决定，initial 仅做校验
declare function createFSMStrict<S extends string>(config: {
  initial: NoInfer<S>
  states: S[]
}): void

createFSMStrict({
  initial: 'typo', // ❌ 报错：'typo' 不在 states 推导出的联合里
  states: ['idle', 'loading'],
})
```

**价值**：它把“**必须是这一组状态之一**”这层约束真正表达了出来。不用 `NoInfer` 时，`initial` 会把 `'typo'` 也拉进 `S`，检查形同虚设。

## 10. 常见问题 (FAQ)

### 10.1 `Omit` 为什么不推荐用于极度严格的类型检查？

由于 `Omit` 的底层依赖 `Exclude` 和键名重映射，它实际上**破坏了原类型的辨识度**。

对于存在联合类型的对象（判别联合），使用 `Omit` 后会丢失判别式能力，降级为普通对象。涉及严格辨识的场景应手动重构类型或改用 `Extract`。

### 10.2 工具类型会让编译变慢吗？

**会**。过深的嵌套（如 `DeepPartial<DeepRecord<...>>`）或滥用联合类型展开，会导致 TypeScript 编译器的 CPU 计算指数级暴增，引发 IDE 卡顿。

业务代码中，**能用 `interface` 显式声明的结构，尽量避免用十几个工具类型嵌套推导**。

### 10.3 `Partial<T>` 改不了嵌套对象、`Readonly<T>` 防不住运行时改动，是为什么？

这两个问题指向同一个事实：**内置工具类型只做“编译期”的“浅层”变换**。

先说 `Partial<T>`：它只给最外层属性加 `?`，不会递归进去。

```ts
interface Config {
  theme: string
  nested: { fontSize: number }
}

const c: Partial<Config> = {
  theme: 'dark',
  // nested 整体可以省略；但一旦要写，里面的 fontSize 依然是必填的
  nested: { fontSize: 14 },
  // nested: {},   // ❌ Property 'fontSize' is missing
}
```

需要深层可选时自定义 `DeepPartial<T>`，但要先确认真的值得——递归工具类型正是 10.2 里编译变慢的主要来源。

再说 `Readonly<T>`：它只在编译期拦截赋值，产物里没有任何运行时约束，绕过类型（`as`、`any`）或在 JS 侧直接改依然生效。需要运行时防篡改要配合 `Object.freeze`，而 `Object.freeze` 同样是浅层的——嵌套对象内的字段仍然可改，深冻结要自己递归处理。

### 10.4 `Exclude` 和 `Omit` 怎么选？

- 操作**联合类型**用 `Exclude<T, U>`：从 `'success' | 'failed'` 里剔除成员。
- 操作**对象类型**用 `Omit<T, K>`：从接口里排除某些键（如生成 `CreateDTO` 时去掉 `id`、`createdAt`）。

记住 `Omit` 的底层正是 `Exclude` + 键名重映射，所以它才带有 9.1 里那个缺点。

### 10.5 `Parameters` / `ReturnType` 为什么常配 `typeof` 一起用？

**原因**：这两个工具类型接收的是**函数类型**，而 `typeof fn` 才能从值身上取出那个函数类型。

**解法**：写 `Parameters<typeof login>`、`ReturnType<typeof getUser>`。这也是防抖节流封装、AOP 编程时保留原函数形参提示与返回类型的关键手法。

### 10.6 `Record<K, T>` 的 `K` 为什么有时要写 `keyof any`？

`keyof any` 是 TS 内部设定的安全键集，等价于 `string | number | symbol`，也就是“**任何合法的对象键**”。

需要生成“键类型不定、值类型统一”的字典时，写 `Record<keyof any, T>` 比写 `Record<string, T>` 更准确，因为后者会把 `symbol` 键排除在外。

### 10.7 `Required<T>` 全变必填太狠了，能只改一个字段吗？

能。内置工具类型都是**全量**的，要精准打击某几个键，需要用 `Omit` / `Pick` 手动拼装：

```ts
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
```

核心思路是**先把要处理的键摘出来单独变换，再合并回去**。同理，想把某几个键变可选，用 `Omit<T, K> & Partial<Pick<T, K>>`。完整写法见第 9.2 节。

### 10.8 `NoInfer<T>` 解决的是什么问题？

它解决的是**推导来源太宽**的问题。

默认情况下，一个泛型参数会从**所有出现它的位置**共同推导。如果某个位置只应该被“校验”而不该“贡献推导”，它的值就会污染整个推导结果，让约束形同虚设。`NoInfer<T>` 就是把这个位置从推导中摘出去：**只检查，不参与。**

典型场景是“初始值必须是状态列表之一”这类 FSM 配置。完整例子见第 9.4 节。
