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

[width(22,78)]

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

## 6. 递归类型

前面所有能力（条件类型、`infer`、映射类型、模板字面量）单用都只能处理**一层**结构。真正让类型系统产生质变的，是把它们**组合成递归**。前面 `DeepUnwrapPromise` 和 `PathParam` 其实已经在递归了，这一节把它讲透。

### 6.1 递归的三要素

任何可用的递归类型都必须同时具备这三点，缺一个就会报 `Type instantiation is excessively deep and possibly infinite`：

[width(13,42,45)]

| 要素         | 作用                                     | 典型写法                                   |
| ------------ | ---------------------------------------- | ------------------------------------------ |
| **模式匹配** | 判断当前输入长什么样，决定走哪条分支     | `T extends \`${infer Head}${infer Rest}\`` |
| **提取处理** | 用 `infer` 取出这一步要消费的部分        | `infer Rest`、`T[number]`                  |
| **收敛出口** | 有且至少有一条分支**不再递归**，直接返回 | `: S`（上面的兜底分支）                    |

**新手最常犯的错**：只写了递归分支，忘了收敛出口，编译器只能一路递归到深度上限然后报错。**写递归类型时，先把终止条件写出来，再写递归分支。**

### 6.2 结构递归：`DeepReadonly`

处理嵌套对象的标准范式——原始类型和函数直接返回，数组和元组保持结构，普通对象递归每个属性。

```ts
type Primitive = string | number | boolean | bigint | symbol | null | undefined

type DeepReadonly<T> = T extends Primitive | Function
  ? T // 收敛出口 1：原始类型和函数不再深入
  : T extends readonly unknown[]
    ? Readonly<{ [K in keyof T]: DeepReadonly<T[K]> }> // 数组保持结构
    : { readonly [K in keyof T]: DeepReadonly<T[K]> } // 普通对象递归属性

interface Config {
  name: string
  nested: { timeout: number; retries: number }
}

type FrozenConfig = DeepReadonly<Config>
// {
//   readonly name: string
//   readonly nested: { readonly timeout: number; readonly retries: number }
// }
```

**注意**：`T extends Primitive | Function` 这个出口必须放在最前面。否则 `Function` 会被当成普通对象去遍历属性，递归永不收敛。

### 6.3 字符串递归：`TrimLeft`

字符串递归的终止条件是“不再匹配前缀模式”。

```ts
type WhiteSpace = ' ' | '\n' | '\t'

type TrimLeft<S extends string> = S extends `${WhiteSpace}${infer Rest}`
  ? TrimLeft<Rest> // 递归：剥掉一个空白字符，处理剩下的
  : S // 收敛出口：首字符不是空白，原样返回
```

因为它也是**模板字面量的经典用法**，可以和 `infer` 组合出各种字符串解析器。

### 6.4 累加器：让递归“带状态”

有些计算必须记住“已经处理过什么”，这时给递归加一个**累加器参数**（默认值为空）。这是手写加法、`Join`、`ReplaceAll` 等类型的基础套路。

```ts
// 递归构建元组：每次往末尾塞一个元素，直到长度等于目标值
type BuildTuple<
  N extends number,
  Acc extends unknown[] = [],
> = Acc['length'] extends N ? Acc : BuildTuple<N, [...Acc, unknown]>

// 用两个元组拼起来，长度相加就是结果
type Add<A extends number, B extends number> = [
  ...BuildTuple<A>,
  ...BuildTuple<B>,
]['length']

type Five = Add<2, 3> // 5
```

`Acc['length'] extends N` 这一句是精髓：**用元组的长度当作数字计数器**，因为 TS 的类型系统里没有“数值运算”，只有结构匹配。这是类型体操的通用思维转换。

### 6.5 尾递归消除：突破深度上限

编译器对递归深度有硬性上限（不同版本数值不同，量级在数十层），撞上就报 `excessively deep`。TypeScript 4.5+ 引入了**尾递归消除**：如果递归调用是某个分支的**最终结果**（后面没有任何额外运算），编译器会把它优化成循环，从而突破深度限制。

[width(33,15,52)]

| 写法                           | 是否尾递归 | 说明                                               |
| ------------------------------ | ---------- | -------------------------------------------------- |
| `? TrimLeft<Rest> : S`         | ✅ 是      | 递归调用就是整个分支的结果                         |
| `` ? `${L}${ReplaceAll<R>}` `` | ❌ 否      | 递归结果还要和外层模板拼接，必须等递归返回后才能算 |

改造的办法就是**把“等待拼接”的部分提前攒进累加器**：

```ts
// ❌ 非尾递归：递归结果被模板字面量包住，深度限制低
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer L}${From}${infer R}`
  ? `${L}${To}${ReplaceAll<R, From, To>}` // 递归结果还要参与拼接
  : S

// ✅ 尾递归：已处理的部分攒进 Acc，递归调用成为最终结果
type ReplaceAllTail<
  S extends string,
  From extends string,
  To extends string,
  Acc extends string = '',
> = S extends `${infer L}${From}${infer R}`
  ? ReplaceAllTail<R, From, To, `${Acc}${L}${To}`> // 递归调用就是整个结果
  : `${Acc}${S}` // 收敛出口：把剩余部分接上

type R = ReplaceAllTail<'a-b-c', '-', '_'> // 'a_b_c'
```

**实战建议**：只有当字符串/数组长到几十个元素时才会撞上限制。真撞上了，再考虑改写成尾递归；**为了“防御性”提前把每个递归类型都写成累加器形式，是可读性的净损失**（参考 7.1）。

## 7. 常见问题 (FAQ)

### 7.1 什么时候不该写高级类型？

**结论**：业务代码里不要堆砌高度复杂的递归与模式匹配。

- 它会急剧增加同事的认知负担和编译耗时——读懂一个 `DeepReadonly<T>` 远比读懂一个扁平的 `interface` 贵。
- 复杂的业务实体优先使用简单、扁平的 `interface` 直接定义，把推导留给真正需要的地方。

### 7.2 高级类型主要该用在哪里？

**结论**：主要服务于底层库、框架的 API 边界以及泛型组件。

只有当“**输入类型**”和“**输出类型**”之间存在强烈的衍生与校验关系时，才值得投入精力编写。仅在一两个地方复用，或为了少写几行显式类型而引入 `infer`，都属于滥用。

### 7.3 递归类型为什么会让 IDE 卡顿，甚至报 `Type instantiation is excessively deep`？

**原因**：TS 检查器对类型实例化有深度限制，嵌套极深的分发条件类型和模板字面量会让 CPU 消耗飙升。

**解法**：

- 用扁平化的映射类型替代递归。
- 明确递归终止条件，并限制递归层级。
- 对极长的大型表单或对象，慎用全局递归遍历。

### 7.4 为什么 `T extends U ? X : Y` 有时会把联合类型拆开？

这是**分发条件类型**在起作用：当 `extends` 左侧是**裸泛型参数**、且传入的是联合类型时，TS 会逐项代入再把结果重新联合。

`ToArray<string | number>` 得到的是 `string[] | number[]`，而不是 `(string | number)[]`；手写 `Exclude` 正是靠这条分配律。

### 7.5 怎么让条件类型不要把联合类型拆开？

**解法**：用方括号把两侧包起来，`[T] extends [U]` 就把 `string | number` 当成一个完整的实体去比较了，可以做严格的全等判断。

### 7.6 `infer` 为什么写在别处会报错？

`infer` 是类型世界里的“**声明变量**”，**只能出现在条件类型的 `extends` 子句里**，用于在模式匹配过程中临时捕获并提取局部类型。离开 `extends` 子句就没有匹配上下文可用，自然报错。

### 7.7 映射类型里怎么去掉 `readonly` 和 `?`？

在键名前加 `-` 前缀即可：`-readonly [K in keyof T]-?: T[K]` 会同时剥离只读和可选，得到必填且可修改的类型。反过来 `+readonly`、`+?` 是显式添加（不加符号时默认就是添加）。
