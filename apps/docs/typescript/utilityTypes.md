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

| 需求特征                             | 核心工具 / 语法映射                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| 需批量增删修饰符 (可选/只读)         | 映射类型 (`[K in keyof T]`) + 符号操作 (`+?`, `-readonly`) |
| 需从已知集合筛选/排除特定成员        | 分布式条件类型 (`T extends U ? X : Y`)                     |
| 需从闭合结构中“**挖**”出某个未知类型 | 占位符匹配 (`infer`)                                       |
| 需对对象键名进行重命名或动态过滤     | 键名重映射 (`as` 关键字)                                   |

## 9. 深度拓展与常见误区

### 9.1 `Omit` 为什么不推荐用于极度严格的类型检查？

由于 `Omit` 的底层依赖 `Exclude` 和键名重映射，它实际上**破坏了原类型的辨识度**。对于存在联合类型的对象（判别联合），使用 `Omit` 后会丢失判别式能力，降级为普通对象。涉及严格辨识的场景应手动重构类型或使用 `Extract`。

### 9.2 工具类型的性能黑洞

过深的嵌套（如 `DeepPartial<DeepRecord<...>>`）或滥用 `Union` 展开，会导致 TypeScript 编译器 的 CPU 计算指数级暴增，引发 IDE 卡顿。业务代码中，**能用 interface 显式声明的结构，尽量避免用十几个工具类型嵌套推导**。
