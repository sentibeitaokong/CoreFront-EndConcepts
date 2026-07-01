# 高级类型

**核心本质**：高级类型是 TypeScript 乃至整个静态类型语言界的一大创举，它赋予了类型系统**图灵完备**的计算能力。它允许开发者在类型层面执行分支判断（`if/else`）、循环遍历（`for...in`）、模式匹配提取以及字符串拼接。

**解决目标**：消除冗余的类型声明，实现从“**源类型**”到“**派生类型**”的自动化推导，构筑极其智能的 SDK 和框架 API 提示体验。

**一句话理解**：**“高级类型就是把运行时的动态逻辑，提前搬到了编译期的类型网络中。”**

## 1. 条件类型

条件类型是类型系统中的三元表达式，它建立了类型之间的依赖与推导关系。

```ts
// 语法：T extends U ? X : Y
// 如果 T 的结构能满足 U，则返回类型 X，否则返回 Y
type IsString<T> = T extends string ? true : false

type A = IsString<'hello'> // true
type B = IsString<123> // false
```

## 2. 分布式条件类型

条件类型的语法类似于三元表达式：`T extends U ? X : Y`。
它的核心不在于简单的判断，而在于结合泛型时触发的**分配律（Distributive）**。

#### 2.1 联合类型的分配律 (Distributive Conditional Types)

当条件类型左侧是**裸泛型参数 (Naked Type Parameter)**，且传入的是**联合类型**时，TS 会自动将联合类型拆开，逐项代入判断，最后将结果重新联合。

```typescript
type ToArray<T> = T extends any ? T[] : never

type Mixed = ToArray<string | number>
// 结果是 string[] | number[]，而不是 (string | number)[]
```

**实战应用：手写 `Exclude` 工具类型**
如果你想从联合类型中剔除某些特定类型，这就是分配律的绝佳舞台：

```typescript
type MyExclude<T, U> = T extends U ? never : T

type AvailableStatus = MyExclude<'success' | 'failed' | 'pending', 'failed'>
// 演算过程：
// 'success' extends 'failed' ? never : 'success' => 'success'
// 'failed' extends 'failed' ? never : 'failed'   => never
// 'pending' extends 'failed' ? never : 'pending' => 'pending'
// 最终联合：'success' | 'pending'
```

#### 2.2 打断分配律的黑魔法

有时候你不需要它自动分配，你希望把 `string | number` 当作一个完整的实体去对比。解决方法是**用方括号包裹**起来。

```typescript
// 严格判断 T 是否完全等于 U
type IsStrictlyEqual<T, U> = [T] extends [U] ? true : false
```

## 3. `infer` 模式匹配与提取

`infer` 是类型世界里的“**声明变量**”。它只能出现在条件类型的 `extends` 子句中，用于在模式匹配的过程中，临时捕获并提取局部类型。

#### 3.1 剥离外壳，提取内核 (如 Promise 解包)

Vue 3 的 `await` 解包和异步状态管理大量使用了这种机制。

```typescript
// 如果 T 是一个 Promise，就提取内部的值 U；如果内部还是 Promise，递归提取。
type DeepUnwrapPromise<T> =
  T extends Promise<infer U> ? DeepUnwrapPromise<U> : T

type RawData = DeepUnwrapPromise<Promise<Promise<string[]>>>
// 推导结果：string[]
```

#### 3.2 提取函数的参数与返回值

这是构建高阶函数（HOC）或 AIGC Agent 工具链拦截器时的必备技能。

```typescript
// 提取函数第一个参数的类型
type GetFirstArg<T> = T extends (first: infer A, ...args: any[]) => any
  ? A
  : never

function chat(prompt: string, maxTokens: number) {
  return '...'
}

type PromptType = GetFirstArg<typeof chat>
// 推导结果：string
```

## 4. 映射类型

当你需要基于一个已有的接口，批量生成一个新的接口时，映射类型是唯一的解法。它的核心语法是 `[K in keyof T]`。

| 映射语法节点     | 核心语义                                   |
| ---------------- | ------------------------------------------ |
| `keyof T`        | 取出对象所有键的**联合类型**。             |
| `[K in keyof T]` | 遍历上述联合类型，每次迭代时变量设为 `K`。 |
| `T[K]`           | 索引访问，获取原对象在该键下的**值类型**。 |

#### 4.1 基础映射与修饰符控制

你可以通过前缀 `-` 或 `+` 来剥离或添加 `readonly` 和 `?`（可选）修饰符。

```typescript
interface User {
  readonly id: number
  name: string
  age?: number
}

// 目标：把 User 的所有属性变成必填且可修改
// -?：强制剥离可选特性，要求必须传值
// -readonly：强制剥离只读特性。
type MutableAndRequired<T> = {
  -readonly [K in keyof T]-?: T[K]
}

type PerfectUser = MutableAndRequired<User>
// 推导结果：{ id: number; name: string; age: number; }
```

#### 4.2 键名重映射 —— `as` 关键字

结合映射类型，我们可以对对象的修饰符（只读、可选）进行极其精细的增删，甚至重命名或过滤键名。

```typescript
// 场景：基于状态对象，自动推导出对应的 setter 函数集合
type State = {
  theme: string
  isLogin: boolean
}

type StateSetters<T> = {
  // 将 theme 变成 setTheme，并约束参数类型
  // set${Capitalize<K>} 将属性首字母转换成大写字母 settheme=>setTheme
  [K in keyof T & string as `set${Capitalize<K>}`]: (value: T[K]) => void
}

type Setters = StateSetters<State>
// 推导结果：
// {
//   setTheme: (value: string) => void;
//   setIsLogin: (value: boolean) => void;
// }
```

## 5. 模板字面量与字符串模式匹配

### 5.1 模板字面量类型

模板字面量类型让 TypeScript 具备了在类型层面操作字符串的能力，这是开发现代路由系统和状态机 SDK 的利器。

```ts
// 1. 自动笛卡尔积展开
type Size = 'sm' | 'md' | 'lg'
type Variant = 'primary' | 'danger'
type ClassName = `btn-${Variant}-${Size}`
// 自动推导: "btn-primary-sm" | "btn-primary-md" | ...

// 2. 结合内置字符串工具类与重映射生成 API 签名
type StateSetters<T> = {
  [K in keyof T & string as `set${Capitalize<K>}`]: (value: T[K]) => void
}
// 例如传入 { name: string } 会生成 { setName: (value: string) => void }
```

### 5.2 字符串模式匹配

利用模板字面量与 `infer` 配合，实现对动态 URL 路径的编译期解析。

```ts
type PathParam<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | PathParam<Rest> // 匹配到多段参数，递归处理剩余部分
    : T extends `${string}:${infer Param}`
      ? Param // 匹配到最后一段参数
      : never // 未匹配到动态参数

// 测试：鼠标悬浮 Params，TS 会精准推导出 'userId' | 'postId'
type Params = PathParam<'/users/:userId/posts/:postId'>
```

## 7. 高级类型避坑指南

| 常见误区             | 架构师建议                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **过度沉迷类型体操** | 业务代码中不要堆砌高度复杂的递归与模式匹配，这会急剧增加同事的认知负担和编译耗时。复杂的业务实体优先使用简单、扁平的 `interface` 直接定义。                     |
| **滥用场景**         | 高级类型（工具类型）**主要服务于底层库、框架的 API 边界以及泛型组件**。只有当“**输入类型**”和“**输出类型**”之间存在强烈的衍生与校验关系时，才值得投入精力编写。 |
| **忽略编译性能**     | 嵌套极深的分发条件类型和模板字面量会导致 TS 检查器 CPU 飙升。对于极长的大型表单或对象，慎用全局递归遍历。                                                       |
