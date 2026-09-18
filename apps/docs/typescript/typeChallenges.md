# 类型体操

**核心本质**：利用 TypeScript 类型系统的元编程能力（映射、递归、模式匹配），在编译期执行复杂的类型计算。

**目标**：构建“**自适应**”的 API 边界，实现从核心模型到周边工具链（路由、请求、Props）的自动化类型流转。

**架构原则**：**“体操是给库开发者写的，不是给业务开发者堆的。”** 复杂的逻辑必须封装在内部，对外提供简单接口。

## 1. 边界与抉择矩阵

类型体操的价值在于**复用**与**自动化**，而非通过堆砌语法实现某种类型上的“**炫技**”。

[width(46,54)]

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

### 3.5 字符串分割：Split

`Join` 的逆运算。它把字符串按分隔符切成元组，是解析 `a.b.c` 这类路径的底座。

```ts
type Split<
  S extends string,
  Sep extends string,
> = S extends `${infer Head}${Sep}${infer Rest}`
  ? [Head, ...Split<Rest, Sep>] // 递归：切下第一段，继续切剩下的
  : [S] // 收敛出口：没有分隔符了，剩余部分就是最后一段

type Parts = Split<'a-b-c', '-'> // ['a', 'b', 'c']
type Single = Split<'abc', '-'> // ['abc']
```

**注意收敛出口返回的是 `[S]` 而不是 `S`**——返回元组才能保证每一层展开时结构一致（`[Head, ...Rest]` 要求右边是元组）。

### 3.6 联合转交叉：UnionToIntersection

这是类型体操里最“**魔法**”的一个，也是很多库内部的关键工具。它依赖的是**函数参数的逆变**特性：当多个函数类型被合并时，参数位置会被收成**交叉**。

```ts
type UnionToIntersection<U> = // 1. 先把联合分发成函数联合
  (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void
    ? I // 2. 用 infer 捕获，逆变把多个参数收成交叉
    : never

type Merged = UnionToIntersection<{ a: 1 } | { b: 2 }>
// { a: 1 } & { b: 2 }
```

**逐步拆解**：

1. `U extends unknown ? ...` 触发**分发条件类型**，把 `A | B` 拆成 `((arg: A) => void) | ((arg: B) => void)`。
2. 用条件类型去匹配这整个函数联合，`infer I` 在参数位置（**逆变位置**）捕获，编译器会求出所有候选的**交集**，也就是 `A & B`。

**实战价值**：把联合类型的所有成员合并成一个对象——例如收集所有事件的 handler 集合。这一步是 `UnionToTuple` 等高级工具的前置步骤。

### 3.7 路径取值：`Get`

把 `'user.profile.name'` 这样的路径字符串，映射到对象里真实的类型。

```ts
type Get<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Get<T[Key], Rest> // 递归：进入下一层
    : never // 键不存在
  : Path extends keyof T
    ? T[Path] // 收敛出口：最后一段，取出值类型
    : never

interface Data {
  user: { profile: { name: string; age: number } }
}

type NameType = Get<Data, 'user.profile.name'> // string
type Bad = Get<Data, 'user.missing'> // never
```

**实战价值**：表单库（如 `react-hook-form`、`vee-validate`）的 `name` 属性自动补全，就是靠这套推导实现的——你输入 `'user.'` 时 IDE 能列出 `profile`，是因为编译器正在实时递归。

## 4. 性能考量与 IDE 响应

TS 编译器在处理类型推导时，存在**实例化深度限制**。

- **复杂度指数**：嵌套的 `DeepReadonly` 或无限递归的字符串解析，会在 IDE 中表现为 `Type instantiation is excessively deep and possibly infinite`。
- **规避策略**：
  - 尽量用扁平化的映射类型替代递归。
  - 限制递归层级。
  - 对库调用者，通过显式声明 `type` 减少编译器计算量。
  - 撞上深度上限时改写成**尾递归**（用累加器参数把“待拼接”的部分提前攒起来），TS 4.5+ 会把它优化成循环。完整对比见 [高级类型](/typescript/advancedTypes) 的 6.5 节。

## 5. 常见问题 (FAQ)

### 5.1 怎么判断我的类型体操是不是过度设计？

在把类型代码推向分支前，执行以下“**灵魂三问**”：

- **“调用方是否更简单了？”** —— 如果用户必须先手动传入复杂的 `T` 类型才能调用你的函数，那这不是简化，而是负担。
- **“推导关系是否稳定？”** —— 如果数据结构一变，类型体操代码就需要重写，那它是脆弱的，不如直接显式声明接口。
- **“新同事是否能在 15 分钟内读懂？”** —— 如果答案是否定的，请立即删掉这段逻辑，将其还原为普通的 `interface` 或 `type` 定义。

### 5.2 类型体操该给谁写？业务代码能用吗？

**给库开发者写**。它的价值在于**复用**与**自动化**，而不是通过堆砌语法实现类型上的“炫技”。

- 适合：框架/库底层适配多变输入、路由参数与请求 URL 模板的自动推导、基于对象属性自动生成 setter、从后端 JSON 生成前端契约。
- 回避：常规业务的 Entity 定义、只在一两个地方复用的类型、超过 3 层以上的嵌套递归、为了少写几行显式类型而引入 `infer`。

### 5.3 递归类型报 `excessively deep` 怎么办？

**原因**：TS 编译器有**实例化深度限制**，嵌套的 `DeepReadonly` 或无限递归的字符串解析会直接撞上这个上限。

**解法**：

- 尽量用扁平化的映射类型替代递归。
- 限制递归层级，并明确递归终止条件。
- 对库调用者，通过显式声明 `type` 减少编译器的计算量。

### 5.4 写类型体操有固定套路吗？

有，按这四步走：

- **确定源点**：寻找逻辑的起点（`keyof T`、`T[number]`）。
- **分解步骤**：把大需求拆成“分发、提取、映射、递归”。
- **收敛递归**：类型体操本质是递归，必须明确终止条件。
- **封装出口**：用 `type` 别名定义最终结果，对外隐藏实现。

### 5.5 为什么说“对外接口一定要简单”？

因为使用者只是想要一个**自动补全好用的 API**，而不是想学你的类型实现。

把复杂的推导全部封在内部，对外只暴露一个语义清晰的 `type`。一旦调用方需要理解你的递归结构才能用对你的函数，这次抽象就已经亏了——参考 5.1 的第一问。

### 5.6 什么时候该放弃推导，直接手写类型？

出现下面任一情况就停手，改为显式声明：

- 推导出的报错信息已经无法阅读，排查成本超过手写成本。
- 数据结构频繁变动，类型代码跟着反复重写。
- 只有一两个调用点，抽象带来的间接层没有换来任何复用。

### 5.7 类型体操该怎么练？

和算法一样，**靠刷题**，但要有明确的收敛点：

- **入门**：先手写一遍内置工具类型（`Partial` / `Pick` / `Exclude` / `ReturnType`）。它们是最小完备的练习题，写完就掌握了映射类型、分布式条件类型和 `infer` 三大件。
- **进阶**：去 [type-challenges](https://github.com/type-challenges/type-challenges) 按难度刷。**重点不是做出答案，而是看懂别人的答案为什么更短**——同一道题往往有递归、累加器、尾递归三种写法。
- **收敛**：刷到能一眼看穿“这道题是分发、提取、映射还是递归”就够了。**继续刷下去对业务能力的边际收益趋近于零**，把时间还给业务建模更划算。

**必须避开的误区**：把刷题数量当成能力指标。真实项目里 90% 的类型问题用 `interface` + 几个内置工具类型就能解决（见 5.2）。

### 5.8 `UnionToIntersection` 到底是怎么工作的？

它是**逆变**的直接产物，分两步理解：

1. `U extends unknown ? (arg: U) => void : never` —— 先用分发条件类型，把联合 `A | B` 变成**函数类型的联合** `((arg: A) => void) | ((arg: B) => void)`。
2. 外层再用 `extends (arg: infer I) => void` 去匹配。**函数参数是逆变位置**，当编译器要在多个候选里求出一个 `I` 时，它取的是**交集**，于是得到 `A & B`。

**为什么是交集而不是联合**：因为一个函数若要同时满足“接受 `A`”和“接受 `B`”，它的参数就必须**同时是** `A` 和 `B`——这正是逆变的语义。完整代码见 3.6。
