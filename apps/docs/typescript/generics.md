# 泛型

**核心本质**：泛型是“**类型层面的参数**”。它允许在定义函数、接口、类时，不预先指定具体的类型，而是将类型的确定延迟到调用或实例化时刻。

**核心意义**：在保持类型严谨性的同时，实现逻辑的通用复用，彻底终结为了类型兼容而滥用 `any` 的糟糕实践。

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

## 3. 泛型约束

没有约束的泛型 `T` 就像 `any`，无法访问任何属性。通过 `extends`，我们告知编译器：`T` 至少具备什么结构。

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

## 4. `keyof` 与映射类型

`keyof` 用于提取对象的所有键，结合泛型可以实现**类型安全的属性访问**。

```ts
// 保证 key 必须是 obj 真实存在的键，返回值精确对应属性类型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]
}

const user = { id: 1, name: 'Ada' }
const id = getProperty(user, 'id') // ✅ 结果为 number
// const age = getProperty(user, 'age') // ❌ 报错：'age' 不在 keys 中
```

## 5. 泛型类与默认参数

泛型类适用于状态机、缓存仓库、事件订阅器等需要持有特定状态的容器。

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

//泛型类
class Store<TState extends object> {
  constructor(private state: TState) {}
  // 使用内置 Partial 工具类型实现部分更新：把 TState 里的所有属性都变成可选的
  patch(partial: Partial<TState>) {
    this.state = { ...this.state, ...partial }
  }
}
```

## 6. 核心避坑指南

| 误区             | 现状分析                                      | 架构修正策略                                                        |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| **滥用泛型**     | 声明了 `T` 但完全不参与参数关联。             | 删掉无意义的泛型，确保每个参数都有意义。                            |
| **伪类型安全**   | 使用 `as T` 强转 `JSON.parse` 结果。          | `T` 仅代表期望，不是真实校验。必须配合 `zod` 等库进行 Schema 校验。 |
| **复杂类型地狱** | 嵌套过深，导致编译器报错内容极难阅读。        | 拆分为多个中间别名，增加 `type` 语义化。                            |
| **忽略约束**     | 直接访问 `T` 的属性，导致报 Property 不存在。 | 使用 `extends` 显式约束 `T` 的结构。                                |

- **先写具体类型，再抽离泛型**：不要试图在一开始就写出极其通用的泛型函数，这会增加维护难度。
- **利用默认参数降噪**：对于复杂的通用工具（如 API 请求库），尽量为通用参数提供默认类型。
- **配合类型收窄使用**：泛型只负责“**传递**”，真正的安全检查往往需要配合 `typeof`、`in` 或自定义类型谓词 (Type Predicates) 共同完成。
