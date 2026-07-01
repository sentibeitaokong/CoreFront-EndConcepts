# 类型体操

**核心本质**：利用 TypeScript 类型系统的元编程能力（映射、递归、模式匹配），在编译期执行复杂的类型计算。

**目标**：构建“**自适应**”的 API 边界，实现从核心模型到周边工具链（路由、请求、Props）的自动化类型流转。

**架构原则**：**“体操是给库开发者写的，不是给业务开发者堆的。”** 复杂的逻辑必须封装在内部，对外提供简单接口。

## 1. 边界与抉择矩阵

类型体操的价值在于**复用**与**自动化**，而非通过堆砌语法实现某种类型上的“**炫技**”。

| 适合写体操的场景                              | 建议回避的场景                                        |
| --------------------------------------------- | ----------------------------------------------------- |
| **框架/库底层**：需适配用户多变的输入。       | **常规业务逻辑**：增删改查的 Entity 定义。            |
| **自动化推导**：如路由参数、请求 URL 模板。   | **局部类型冗余**：仅在一两个地方复用的类型。          |
| **属性变换**：如基于对象属性自动生成 setter。 | **嵌套递归**：超过 3 层以上的递归调用（易导致卡顿）。 |
| **API 边界**：从后端 JSON 生成前端契约。      | **强行抽象**：为了少写几行显式类型而引入 `infer`。    |

## 2. 构建类型逻辑的方法论

- **确定源点**：寻找逻辑的起点（`keyof T`, `T[number]`）。
- **分解步骤**：将大需求拆分为“分发、提取、映射、递归”。
- **收敛递归**：类型体操本质是递归，必须明确递归终止条件。
- **封装出口**：用 `type` 别名定义最终结果，对外隐藏实现。

## 3. 经典实战

### 3.1 集合转换：Tuple 转 Object

将元组 `['a', 'b']` 转化为 `{ a: 'a'; b: 'b' }`。

```ts
type TupleToObject<T extends readonly (string | number | symbol)[]> = {
  [K in T[number]]: K
}
// 使用 `as const` 保留字面量类型，T[number] 提取所有元素组成的联合类型
```

### 3.2 深度只读与递归映射

处理复杂嵌套结构，实现“**防卫性**”的编译期只读约束，原始类型和函数直接返回，数组和元组保持结构，普通对象递归属性。

```ts
type Primitive = string | number | boolean | bigint | symbol | null | undefined

type DeepReadonly<T> = T extends Primitive | Function
  ? T
  : T extends readonly unknown[]
    ? Readonly<{ [K in keyof T]: DeepReadonly<T[K]> }>
    : { readonly [K in keyof T]: DeepReadonly<T[K]> }
```

### 3.3 字符串模式匹配：TrimLeft

利用模板字面量与递归，完成字符串的清理工作，递归出口是字符串不再匹配空白前缀。

```ts
type WhiteSpace = ' ' | '\n' | '\t'

type TrimLeft<S extends string> = S extends `${WhiteSpace}${infer Rest}`
  ? TrimLeft<Rest>
  : S
```

### 3.4 路由参数提取 (Real-world Utility)

从 `'/users/:userId/posts/:postId'` 提取出 `{ userId: string; postId: string }`。

```ts
type PathParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | PathParams<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never

type ParamsObject<T extends string> = { [K in PathParams<T>]: string }

// 运行时实现：自动匹配路径参数
function buildPath<T extends string>(path: T, params: ParamsObject<T>) {
  return Object.entries(params).reduce(
    (result, [key, value]) => result.replace(`:${key}`, value),
    path as string,
  )
}
```

## 4. 性能考量与 IDE 响应

TS 编译器在处理类型推导时，存在**实例化深度限制**。

- **复杂度指数**：嵌套的 `DeepReadonly` 或无限递归的字符串解析，会在 IDE 中表现为 `Type instantiation is excessively deep and possibly infinite`。
- **规避策略**：
  - 尽量用扁平化的映射类型替代递归。
  - 限制递归层级。
  - 对库调用者，通过显式声明 `type` 减少编译器计算量。

## 5. 架构决策自检：是否过度设计？

在将你的类型代码推向分支前，请执行以下“**灵魂三问**”：

- **“调用方是否更简单了？”** —— 如果用户必须先手动传入复杂的 `T` 类型才能调用你的函数，那这不是简化，而是负担。
- **“推导关系是否稳定？”** —— 如果数据结构一变，类型体操代码就需要重写，那它是脆弱的，不如直接显式声明接口。
- **“新同事是否能在 15 分钟内读懂？”** —— 如果答案是否定的，请立即删掉这段逻辑，将其还原为普通的 `interface` 或 `type` 定义。
