# 泛型

**核心本质**：泛型是“**类型层面的参数**”。它允许在定义函数、接口、类时，不预先指定具体的类型，而是将类型的确定延迟到调用或实例化时刻。

**核心意义**：在保持类型严谨性的同时，实现逻辑的通用复用，彻底终结为了类型兼容而滥用 `any` 的糟糕实践。

**一句话理解**：**“泛型不是把类型抹掉，而是把类型变成可以传入的参数。”**

## 1. 泛型函数

泛型的力量在于保留“**输入是什么，输出就是什么**”的逻辑关联，而非简单的输入输出无关化。

```ts
// 泛型函数：定义 T 参数，将类型捕获并流转
function identity<T>(value: T): T {
  return value
}

// 自动推导 vs 显式指定
const a = identity('hello') // 推导为 string
const b = identity<number>(123) // 显式指定
```

对比一下不用泛型的写法，就能看出泛型的价值：

```ts
// 坏做法：返回 any，输入与输出的关联彻底丢失
function badIdentity(value: any): any {
  return value
}
const c = badIdentity('hello') // c 的类型是 any，后续没有任何提示

// 坏做法：为每种类型都写一个函数，代码量爆炸
function identityString(value: string): string {
  return value
}
function identityNumber(value: number): number {
  return value
}
```

## 2. 泛型接口与类型别名

在处理 API 响应、组件 Props、状态容器等场景时，泛型提供了完美的结构化模版。

```ts
// 通用的 API 响应壳
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 嵌套组合复用
type PageResult<T> = { total: number; list: T[] }
type UserResponse = ApiResponse<PageResult<{ id: number; name: string }>>
/*{
    code: number,
    message: string,
    data: {
        total: number,
        list: { id: number,name: string }[]
    }
}*/
```

**实战价值**：`ApiResponse<T>` 把“**外层协议**”和“**内层业务数据**”彻底解耦。后端新增一个接口时，只需要更换 `T`，`code` / `message` 这套壳永远不用重写。

```ts
type LoginResponse = ApiResponse<{ token: string }>
type OrderListResponse = ApiResponse<PageResult<Order>>

// 所有接口共用一个错误处理函数的签名
function handleError(res: ApiResponse<unknown>) {
  if (res.code !== 0) {
    console.error(res.message)
  }
}
```

## 3. 泛型约束

没有约束的泛型 `T` 就像 `any`，无法访问任何属性。通过 `extends`，我们告知编译器：`T` 至少具备什么结构。

### 3.1 基础约束

```ts
// 约束 T 必须含有 length 属性
function logLength<T extends { length: number }>(value: T): T {
  console.log(value.length)
  return value
}

logLength('abc') // ✅ string 有 length
logLength([1, 2, 3]) // ✅ 数组有 length
// logLength(123)    // ❌ number 没有 length
```

注意返回值依然是 `T` 而不是 `{ length: number }`——约束只是**准入门槛**，不会让宽泛类型污染返回值。

### 3.2 多个参数互相约束

泛型之间可以互相引用，这是实现“**键值严格对应**”的关键。

```ts
// K 被约束为 T 的键，因此 key 只能传对象真实存在的属性
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value }
}

const user = { id: 1, name: 'Ada' }

setProperty(user, 'name', 'Bob') // ✅ value 必须是 string
// setProperty(user, 'name', 123)   // ❌ 类型不匹配
// setProperty(user, 'age', 18)     // ❌ 'age' 不是 user 的键
```

这里的 `value: T[K]`（**索引访问类型**）是精髓：`K` 变换时，`value` 的类型会自动跟着变，不需要任何手动 switch。

### 3.3 约束本身的类型也要收窄

`extends` 后面的约束可以引用其他泛型参数，形成约束链：

```ts
// 第一个参数约束 T，第二个参数又约束 K
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(item => item[key])
}

const users = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bob' },
]
const names = pluck(users, 'name') // 推导为 string[]
const ids = pluck(users, 'id') // 推导为 number[]
```

## 4. 泛型默认参数

当泛型参数在多数调用场景下都取同一个类型时，为它提供默认值可以显著降低调用处的噪音。

```ts
// 默认泛型参数：TData 默认为 unknown，TError 默认为 Error
type Result<TData = unknown, TError = Error> =
  | { ok: true; data: TData }
  | { ok: false; error: TError }
type StringResult = Result<string>

/*
 *   type StringResult =
 *     | { ok: true; data: string }
 *     | { ok: false; error: Error }
 */

// 调用方只关心数据时，一个参数就够
function fetchUser(): Result<{ id: number }> {
  return { ok: true, data: { id: 1 } }
}

// 需要自定义错误类型时才传第二个参数
function fetchOrder(): Result<{ id: number }, NetworkError> {
  return { ok: false, error: new NetworkError('timeout') }
}
```

**注意**：有默认值的泛型参数必须排在**没有默认值的参数之后**，这与函数默认参数规则一致。

## 5. 泛型类

泛型类适用于状态机、缓存仓库、事件订阅器等需要持有特定状态的容器。

```ts
class Store<TState extends object> {
  constructor(private state: TState) {}
  // 使用内置 Partial 工具类型实现部分更新：把 TState 里的所有属性都变成可选的
  patch(partial: Partial<TState>) {
    this.state = { ...this.state, ...partial }
  }
  getState(): TState {
    return this.state
  }
}

const store = new Store({ theme: 'dark', fontSize: 14 })
store.patch({ theme: 'light' }) // ✅ 只需传要改的字段
// store.patch({ theme: 123 })     // ❌ 类型不匹配
store.getState().fontSize // ✅ 推导为 number
```

**静态成员不能引用类的泛型参数**——泛型属于实例，而静态成员挂在类本身上：

```ts
class Container<T> {
  // static empty: T[] = [];  // ❌ 静态成员不能引用类型参数 T
  static create<T>(): Container<T> {
    // ✅ 静态方法可以声明自己的泛型参数
    return new Container<T>()
  }
}
```

## 6. 泛型与条件类型结合

泛型只有在**未确定**时才能触发条件类型的分发，这是类型体操的起点。把条件类型包在泛型函数里，就能根据输入自动切换返回类型。

```ts
// 如果 T 是数组，返回单个元素；否则原样返回
type Unwrap<T> = T extends (infer U)[] ? U : T

function firstOrSelf<T>(value: T): Unwrap<T> {
  return (Array.isArray(value) ? value[0] : value) as Unwrap<T>
}

const n = firstOrSelf([1, 2, 3]) // number
const s = firstOrSelf('hello') // string
```

**注意**：上面出现了 `as Unwrap<T>`，这是条件类型在函数实现里的常见妥协——TS 无法在函数体内验证“**返回值的类型恰好等于某个尚未求值的条件类型**”，只能靠断言。**能改写成函数重载时，优先用重载**，那才是真正类型安全的做法。

```ts
// 更安全的替代写法：函数重载
function firstOrSelf<T>(value: T[]): T
function firstOrSelf<T>(value: T): T
function firstOrSelf<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value
}
```

## 7. `const` 类型参数 (TS 5.0)

默认情况下，TS 会把对象字面量里的字符串推宽成 `string`，数组推宽成 `string[]`，**字面量信息全部丢失**。TS 5.0 引入的 `const` 修饰符可以只对这一个泛型参数关闭推宽。

```ts
type HasNames = { names: readonly string[] }

// ① 普通泛型：字面量被推宽
function getNames<T extends HasNames>(arg: T): T['names'] {
  return arg.names
}

const looseNames = getNames({ names: ['Alice', 'Bob'] })
// looseNames 的类型是 string[]，字面量丢了

// ② 调用方自己补 as const：同样能保住字面量
const assertedNames = getNames({ names: ['Alice', 'Bob'] as const })
// assertedNames 的类型是 readonly ['Alice', 'Bob']
// 代价是每个调用点都得记得写，漏一个就退回 string[]

// ③ const 类型参数：定义方一次性解决，调用方无感
function getNamesExact<const T extends HasNames>(arg: T): T['names'] {
  return arg.names
}

const exactNames = getNamesExact({ names: ['Alice', 'Bob'] })
// exactNames 的类型是 readonly ['Alice', 'Bob']
```

**`as const` 与 `const` 类型参数的区别**：两者都能保住字面量，区别在于**由谁承担**。`as const` 由**调用方**在每个调用点手写，啰嗦且容易被遗忘；`const` 类型参数由**定义方**一次性解决，约束住所有调用点。设计对外 API 时优先选后者。

## 8. 变型 (Variance)

变型描述的是：当 `Dog` 是 `Animal` 的子类型时，`Box<Dog>` 和 `Box<Animal>` 之间是什么关系。这是泛型最容易踩坑、也最少被讲清楚的部分。

[width(24,28,48)]

| 变型                     | 含义                               | TypeScript 中的体现                              |
| ------------------------ | ---------------------------------- | ------------------------------------------------ |
| **协变 (Covariant)**     | 子类型关系**同向**传递             | 对象属性、数组、`Promise<T>`、`() => T` 的返回值 |
| **逆变 (Contravariant)** | 子类型关系**反向**传递             | 函数参数（需开启 `strictFunctionTypes`）         |
| **双变 (Bivariant)**     | 两个方向都接受（**不安全**的折中） | 方法语法 (`m(x: T): void`) 的参数                |
| **不变 (Invariant)**     | 两个方向都必须完全一致             | 显式用 `in` / `out` 标注的泛型参数               |

```ts
interface Animal {
  name: string
}
interface Dog extends Animal {
  bark(): void
}

// 协变：Dog 是 Animal 的子类型，Dog[] 也可赋给 Animal[]
const dogs: Dog[] = []
const animals: Animal[] = dogs // ✅

// 逆变：函数参数方向相反，(Animal) => void 可赋给 (Dog) => void
type Handler<T> = (value: T) => void
const handleAnimal: Handler<Animal> = a => console.log(a.name)
const handleDog: Handler<Dog> = handleAnimal // ✅ 参数更宽的能接更窄的
// const handleAnimal2: Handler<Animal> = handleDog // ❌ 反过来不行
```

**为什么函数参数要逆变**：调用 `handleDog` 时，调用方保证传入的是 `Dog`；而 `handleAnimal` 只要求参数有 `name`，`Dog` 恰好满足，所以安全。反过来，如果允许用“**只认 `Dog`”的函数顶替**“要处理所有 `Animal`”的位置，一旦传入 `Cat` 就会崩溃。

**双变的坑**：TS 对**方法简写语法**的参数默认双变，所以下面这段不报错——但它是不安全的：

```ts
interface Box {
  set(value: Dog): void // 方法语法：双变，放行
}
interface StrictBox {
  set: (value: Dog) => void // 函数属性语法：严格逆变检查
}
```

**显式声明变型 (TS 4.7+)**：给接口的泛型参数加 `in` / `out`，既能让编译器提前校验，也能提升类型检查速度。

```ts
// out：T 只出现在输出位置，必然是协变
interface Producer<out T> {
  get(): T
}

// in：T 只出现在输入位置，必然是逆变
interface Consumer<in T> {
  set(value: T): void
}

// 同时出现在输入和输出位置，默认不变
interface Box<T> {
  get(): T
  set(value: T): void
}
```

## 9. 泛型在框架中的应用

泛型是组件库对外 API 的基本功，它决定了使用者的自动补全体验。

:::code-group

```tsx [React 泛型组件]
interface ListProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  renderItem: (item: T) => React.ReactNode
}

// 泛型组件：T 由 items 自动推导，renderItem 的参数拿到精确类型
function List<T>({ items, keyExtractor, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}

// 使用时无需手写泛型，item 自动推导为 User
const userList = (
  <List items={users} keyExtractor={u => u.id} renderItem={u => u.name} />
)
```

```ts [Vue 3 组合式 API]
// defineProps 支持泛型类型参数，模板里直接获得类型提示
const props = defineProps<{
  items: string[]
  selected?: string
}>()

// ref 泛型：明确初始值为 null 时，后续赋值的类型
const current = ref<string | null>(null)

// computed 的类型由回调返回值自动推导
const count = computed(() => props.items.length)
```

:::

**设计要点**：泛型应该出现在**使用者已经掌握的信息**上。上面 `List` 的 `T` 由 `items` 推导，使用者什么都不用写；如果强制使用者手写 `<List<User> ...>`，那就是把推导负担转嫁出去了。

## 10. 常见问题 (FAQ) 与避坑指南

### 10.1 什么时候说明这个泛型是多余的？

**判断标准**：`T` 是否真的参与了参数与返回值之间的关联。

声明了 `T` 却完全不出现在任何参数、返回值或约束里（例如 `function log<T>(msg: string)`），那它只是个装饰，删掉即可。确保每个泛型参数都有实际作用。

### 10.2 泛型能保证运行时的数据安全吗？`JSON.parse` 的结果 `as T` 一下就安全了吗？

**都不能**。泛型只负责编译期的“**传递**”，运行时类型信息早已被擦除；而 `as T` 只是让编译器闭嘴，`T` 代表的是你的**期望**，不是运行时的真实校验。

接口返回值、`localStorage`、`fetch` 这类外部数据必须配合 `zod` 等库做 Schema 校验，否则类型写得再漂亮，运行时该崩还是崩：

```ts
// 坏做法：类型好看，运行时全是坑
const user = JSON.parse(raw) as User

// 好做法：运行时真校验，校验通过才拿到 User
const verified = userSchema.parse(JSON.parse(raw)) // zod 会在失败时抛错
```

不想引入校验库时，至少要写类型守卫——配合 `typeof`、`in` 或自定义类型谓词 (Type Predicates) 完成收窄，这也正是 [类型收窄](/typescript/narrowing) 存在的意义。

### 10.3 为什么直接访问 `T` 的属性会报“Property 不存在”？

**原因**：没有约束的泛型 `T` 就像 `any`，编译器只知道它是某个类型，无法保证它具备你想要的结构。

**解法**：用 `extends` 显式约束，例如 `<T extends { length: number }>` 之后才能安全访问 `value.length`。

### 10.4 泛型报错又长又难读怎么办？

**原因**：嵌套过深时，报错信息会把整个类型结构彻底展开，几乎无法阅读。

**解法**：拆分为多个中间 `type` 别名，用语义化的名字把每一层推导收敛掉，报错就能定位到具体是哪一层出的问题。

### 10.5 泛型函数应该先写具体的，还是先写通用的？

**先写具体类型，再抽离泛型**。不要一开始就试图写出极其通用的泛型函数——那会让维护难度陡增，而且往往抽错了维度。等到有两三处真实复用出现时再抽，抽象才站得住。

### 10.6 泛型参数太多、调用起来很啰嗦怎么办？

**解法**：为通用参数提供默认类型降噪。

例如 `type Result<TData = unknown, TError = Error>`，调用方只关心数据时写 `Result<string>` 就够了。API 请求库这类复杂通用工具，默认参数能显著减少调用处的噪音。

### 10.7 什么时候该用 `const` 类型参数而不是 `as const`？

- **你是在写库/工具函数**：用 `const` 类型参数。使用者无感，调用点干净，且不可能忘记。
- **你是在业务代码里固定一个配置对象**：用 `as const`。就地生效，不需要改函数签名。

两者不冲突，`const` 类型参数解决的是“**定义方替调用方决定**”，`as const` 解决的是“**调用方自己决定**”。

### 10.8 逆变听起来很抽象，实际什么时候会踩到？

最常见的场景是**回调参数**。当你把一个“**处理宽类型**”的函数，赋给一个“**声明为处理窄类型**”的位置时：

```ts
type Listener<T> = (event: T) => void

function on(event: string, listener: Listener<MouseEvent>) {
  document.addEventListener(event, listener as EventListener)
}

// ✅ 数学上安全：形参更宽的函数可以顶替更窄的位置
const handler: Listener<MouseEvent> = (e: Event) => console.log(e.type)
```

反过来（把窄的放进宽的位置）编译器会拦住你——这正是它该做的事：`Listener<MouseEvent>` 接不住 `KeyboardEvent`。
