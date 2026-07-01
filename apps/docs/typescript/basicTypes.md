# 类型基础

**核心本质**：TypeScript 采用**结构化类型系统（Structural Typing，即鸭子类型）**，用静态类型描述 JavaScript 运行时数据的形状。它在编译期构建一张严密的“**类型网**”，约束变量、参数、返回值和对象结构的流转。

**解决目标**：消除 90% 的 `undefined is not a function`、字段拼写错误、隐式类型转换导致的 NaN、以及接口结构漂移带来的难以排查的运行时崩溃。

**一句话理解**：**“类型是给 JavaScript 动态数据加上的编译期强制契约。”**

## 1. 基础类型

除了 JS 原生的基础类型，TS 增加了更严格的细分约束。

```ts
//1. 布尔值 最基本的数据类型就是简单的true/false值
let isDone: boolean = false
isDone = true

//2. 数字 和JavaScript一样，TypeScript里的所有数字都是浮点数。
let decLiteral: number = 6
decLiteral = 7

//3. 字符串 可以使用双引号（"）或单引号（'）表示字符串。
let name: string = 'bob'

//4. ES2020 引入，不能和 `number` 混算（如 `1n + 1` 会报错），需显式转换。
let big: bigint = 9007199254740991n

//5. symbol
let id: symbol = Symbol('id')

//6. null和undefined
let empty: null = null
let missing: undefined = undefined

//7. 枚举 (Enum)  enum类型是对JavaScript标准数据类型的一个补充
const enum Color {
  Red,
  Green,
  Blue,
} // 自动赋值 (0, 1, 2)
const enum BackGroundColor {
  Red = 1,
  Green = 2,
  Blue = 4,
} // 手动赋值
let color: Color = Color.Red
// 反向映射 (仅限非 const 枚举，此处作为概念展示)
// let colorName: string | undefined = BackGroundColor['2'];
```

| 类型                       | 深度解析与避坑指南                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `number` / `string`        | 始终使用小写的原始类型。**绝不要使用**大写的 `Number` / `String`（那是 JS 的包装对象）。 |
| `null` / `undefined`       | 强烈建议在 `tsconfig.json` 中开启 `strictNullChecks: true`，彻底根除空指针异常。         |
| `object` / `Object` / `{}` | `object` 仅代表非原始类型（排除数字、字符串等）。<br>                                    |

## 2. 数组与高级元组

数组描述**同质化**列表，元组描述**异质化且定长**的结构。

```ts
// 1. 数组与只读数组
const ids: number[] = [1, 2, 3]
const names: Array<string> = ['Ada', 'Bob']
const readOnlyList: ReadonlyArray<number> = [1, 2] // 或 readonly number[]

// 2. 具名元组 (Named Tuples) - 提升可读性
const point: [x: number, y: number] = [10, 20]

// 3. 元组的扩展操作 (Rest & Optional)
const command: [name: string, ...args: string[]] = [
  'git',
  'commit',
  '-m',
  'fix',
]
const options: [string, ...number[]] = ['123', 123123, 123123] // 结合剩余参数
const config: [port: number, host?: string] = [8080] // 可选元素
```

## 3. 顶端、底端与特殊类型

理解 TS 类型层级树的关键，在于掌握最高点和最低点。

| 类型      | 层级定位    | 核心含义与最佳实践                                                                                                          |
| --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `any`     | Top Type    | **逃生舱，关闭一切类型检查**。污染类型推导，除非是极度复杂的历史代码迁移，否则绝对禁用。                                    |
| `unknown` | Top Type    | **安全的 `any`**。接收未知输入（如 API 返回、`JSON.parse`）。**使用前必须强制进行类型收窄（Type Guard）**。                 |
| `void`    | 特殊类型    | 表示函数没有**显式返回有意义的值**。它兼容 `undefined`，常用于回调函数签名。                                                |
| `never`   | Bottom Type | **不可能发生的状态**。没有任何值可以赋给 `never`。用于抛出异常、死循环、以及极其关键的**穷尽检查 (Exhaustiveness Check)**。 |

```ts
//1. any 标记还不清楚类型的变量
let notSure: any = 123
notSure = 123
notSure = true

//2. Unknown
let safeValue: unknown = 4 // Unknown: 安全的 Any
// safeValue.toFixed(); // 报错！在使用前必须进行类型缩小
if (typeof safeValue === 'number') {
  safeValue.toFixed(2) // 成功，类型已收窄
}

//3. void   它表示没有任何类型
function add() {
  console.log('这是一个空函数')
}
let unusable: void = undefined

//4. Never - 永不存在的值的类型 (如抛出异常或死循环)
function error(message: string): never {
  throw new Error(message)
}
function fail() {
  // 类型推断返回值为 never
  return error('错误了')
}
function infiniterLoop(): never {
  while (true) {} // 存在无法达到的终点
}
```

## 4. 类与访问修饰符

TypeScript 中的 `class` 是对 JavaScript ES6 类语法的超集。它在保留 JS 原生运行时行为的同时，引入了**访问修饰符 (Access Modifiers)** 和 **类型契约**，将原本模糊的对象结构提升为编译期可控的强类型结构。

### 4.1 访问修饰符

访问修饰符决定了类成员（属性或方法）的“**可见范围**”。如果不显式标注，TS 成员默认皆为 `public`。

| 修饰符          | 含义        | 可见范围                                     |
| --------------- | ----------- | -------------------------------------------- |
| **`public`**    | 公开 (默认) | 任何地方均可自由访问。                       |
| **`private`**   | 私有        | 仅**当前类内部**可访问，子类及实例均不可见。 |
| **`protected`** | 受保护      | 仅**当前类及其子类**可访问，实例不可见。     |

```ts
class Base {
  public name = 'base'
  private secret = 'top-secret'
  protected family = 'secret-family'
}

class Child extends Base {
  show() {
    console.log(this.name) // ✅ 访问 public
    console.log(this.family) // ✅ 访问 protected (子类可见)
    // console.log(this.secret); // ❌ 编译报错 (private 仅基类可见)
  }
}

const obj = new Base()
console.log(obj.name) // ✅
// console.log(obj.family); // ❌ 编译报错 (protected 实例不可见)
```

### 4.2 属性的特殊控制

除了可见范围，TS 还提供了两把“**锁**”来控制属性的修改行为。

- **`readonly`**：**只读锁**。属性只能在构造函数 (constructor) 中进行初始化，之后无法修改。
- **`static`**：**静态标识**。属性或方法挂载在类本身（Class）上，而不是挂载在类的实例（Instance）上。

```ts
class Config {
  static version = '1.0.0' // 类名.version 访问
  constructor(public readonly id: number) {}
}

const c = new Config(1)
// c.id = 2; // ❌ 报错：readonly 属性不可修改
```

### 4.3 构造函数缩写

这是 TS 极度提升开发效率的语法糖：在构造函数参数前直接加上访问修饰符，TS 会自动将该参数声明为类属性并完成赋值。

```ts
//1. 传统写法
class User {
  public name: string
  constructor(name: string) {
    this.name = name
  }
}

//2. 快捷写法
class User {
  // 仅需一行，自动声明 name 并挂载至 this
  constructor(
    public name: string,
    private age: number,
  ) {}
}
```

### 4.4 抽象类

抽象类是“**未完成的类**”。它不能被实例化，只能被继承。它定义了一套规范，要求子类必须实现具体的细节。

- **`abstract class`**：定义抽象类。
- **`abstract method`**：定义抽象方法，子类必须 `override` 实现，否则报错。

```ts
abstract class Animal {
  abstract makeSound(): void // 强制子类必须实现
  move(): void {
    console.log('moving...')
  }
}

class Dog extends Animal {
  makeSound() {
    console.log('Woof!')
  } // ✅ 必须实现
}
```

## 5. 接口

### 5.1 基础解构：定义与修饰符

接口不仅能规定对象有哪些字段，还能精确控制字段的读写权限和必须性

```ts
// 1. 基础属性、可选属性、只读属性
interface User {
  readonly id: number // 只读属性：初始化后绝对不可修改
  name: string // 必填属性：缺一不可
  age?: number // 可选属性：可以不传，类型自动推导为 number | undefined
}

const u1: User = { id: 1, name: 'Alice' }
// u1.id = 2; // 编译报错：Cannot assign to 'id' because it is a read-only property.
```

### 5.2 索引签名：动态字典

当你不知道对象会有哪些具体的键，但知道这些键和值的类型时使用。

```ts
//1. 额外的属性检查 (索引签名)
interface StringDictionary {
  [key: string]: string // 允许任意数量的 string 类型的键，且值必须是 string
}

const dict: StringDictionary = {
  a: 'hello',
  b: 'world',
  // c: 123 // ❌ 编译报错：不能将类型“number”分配给类型“string”
}

//2. 可索引的类型
interface StringArray {
  [index: number]: string
}
let myArray: StringArray = ['Bob', 'Mary']
let myStr: string | undefined = myArray[1]
```

### 5.3 描述函数类型

接口不仅可以描述对象，还可以直接描述一个函数的签名（虽然大多数情况下用 type 描述函数更简洁）。

```typescript
interface SearchFunc {
  (source: string, substring: string): boolean
}
let search: SearchFunc = function (source: string, substring: string): boolean {
  return source.search(substring) !== -1
}
```

### 5.4 继承：面向对象的扩展

```typescript
interface Animal {
  eat(): void
}
interface Pet {
  name: string
}

// 多重继承：Dog 必须同时拥有 eat 方法和 name 属性，外加自身的 breed
interface Dog extends Animal, Pet {
  breed: string
}

const myDog: Dog = {
  name: 'Rex',
  breed: 'German Shepherd',
  eat: () => console.log('Chomp chomp'),
}
```

### 5.5 声明合并：杀手级特性

这是 **interface** 区别于 **type** 的最大杀手锏。 如果在同一个作用域内定义了多个同名接口，TypeScript 会自动将它们合并为一个接口。

```typescript
// 假设这是第三方库提供的原始接口
interface Config {
  timeout: number
}

// 这是你在自己项目里补充的声明
interface Config {
  retries: number
}

// 最终的 Config 契约变成了合并后的形态
const myConfig: Config = {
  timeout: 1000,
  retries: 3, // ✅ 合法
}
```

### 5.6 类实现：类的行为契约

接口可以约束一个**类**必须具备哪些属性和方法。这在大型工程的控制反转（IoC）和依赖注入（DI）中极其重要。

```typescript
//1. 类类型与接口继承
interface ClockInterface {
  currentTime: Date
  setTime(d: Date): void
}
// 类的实例部分实现接口
class Clock implements ClockInterface {
  currentTime: Date
  constructor(h: number, m: number) {
    this.currentTime = new Date()
  }
  setTime(d: Date) {
    this.currentTime = d
  }
}

//2. 类静态部分与实例部分的区别
interface ClockConstructor {
  new (hour: number, minute: number): ClockInterface
}
function createClock(
  ctor: ClockConstructor,
  hour: number,
  minute: number,
): ClockInterface {
  return new ctor(hour, minute)
}
```

## 6. 类型别名

这是 TS 表达复杂业务逻辑的基石，让类型像数学公式一样组合。

### 6.1 联合类型

```ts
//1. 类型别名
type Name = 'string'
type Age = 'number'

//2. 基础联合类型
type width = number | string

//3. 可辨识联合类型
type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; error: Error }

function renderUI(state: FetchState) {
  // 此时 TS 只知道有 status 字段，直接访问 state.data 会报错
  if (state.status === 'success') {
    // 经过判别式收窄，TS 明确知道此时一定是 success 分支
    console.log(state.data.length) // 完全安全
  }
}
```

### 6.2 交叉类型

```typescript
type Area = {
  heigth: number
  width: number
}
type Address = {
  num: number
  cell: number
  room: number
}
type House = Area & Address
let house: House = {
  heigth: 18,
  width: 20,
  num: 21,
  cell: 100,
  room: 200,
}
```

### 6.3 字符串字面量类型

```typescript
type Method = 'GET' | 'POST'
type Endpoint = '/users' | '/orders'
type APIKey = `${Method} ${Endpoint}`
// 自动推导出: 'GET /users' | 'GET /orders' | 'POST /users' | 'POST /orders'
```

## 7. `interface` (接口) 和 `type` (类型别名) 深度对比

| 核心区别维度                          | `interface` (接口)                                                              | `type` (类型别名)                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **1. 声明合并 (Declaration Merging)** | **✅ 支持**。多次声明同名接口会自动合并为一个。常用于扩展第三方库类型。         | **❌ 不支持**。声明同名 type 会直接报“标识符重复”错误。                                           |
| **2. 支持的类型范围**                 | 仅限**对象 (Object)**、**函数**和**类**的结构。                                 | **任何类型**。包含对象、基本数据类型、联合类型 (｜)、交叉类型 (`&`)、元组等。                     |
| **3. 扩展与继承机制**                 | 使用 **`extends`** 关键字。遇到同名但不兼容的属性冲突时，编译器会**严格报错**。 | 使用 **`&` (交叉类型)**。遇到属性冲突时不会报错，而是尝试合并（类型常被推导为 `never`）。         |
| **4. 映射类型 (`in` 关键字)**         | **❌ 不支持**。属性必须静态显式声明。                                           | **✅ 支持**。可以通过 `in` 关键字遍历其他类型来动态生成新类型。                                   |
| **5. 编译器底层性能**                 | **较优**。TS 编译器有内部缓存和惰性求值优化，处理深层对象图谱时更高效。         | **稍弱**。特别是深层、复杂的交叉类型（`A & B & C`），每次都需要完全展开计算。                     |
| **6. IDE 提示与错误体验**             | **清晰、内聚**。鼠标悬停或报错时，通常直接显示简短的接口名称。                  | **易臃肿**。IDE 往往会将交叉或组合类型彻底展开，显示为一个巨大的匿名对象结构。                    |
| **7. 类实现 (`implements`)**          | 天生支持。类可以随时实现一个或多个接口。                                        | **受限支持**。类可以实现 type，但前提是该 type 必须描述的是**静态对象结构**（绝不能是联合类型）。 |

**一句话总结选型策略：**
定义对象结构、库的对外 API、类的契约时，优先使用 `interface`。在定义联合类型、复杂的泛型推导时，使用 `type`。

## 8. 常见问题 (FAQ) 与避坑指南

### 8.1 extends和implements核心区别？

**`extends` 是“继承”**（获得父类的属性和方法，可重写或扩展），而 **`implements` 是“实现”**（必须实现接口中定义的所有抽象方法）。

| 对比维度         | **`extends`**                                                               | **`implements`**                                              |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **核心关系**     | 继承（父子类关系）                                                          | 实现（类与契约的关系）                                        |
| **目标**         | 继承一个**类**（抽象类或具体类）                                            | 实现一个或多个**接口**                                        |
| **数量限制**     | 只能**单继承**（一个类只能直接继承一个父类）                                | 可以**多实现**（一个类可实现多个接口）                        |
| **方法实现**     | 子类可以**重写**父类的方法，也可以直接继承父类已有的实现                    | 类必须**实现接口中所有未提供默认实现的方法**                  |
| **构造器**       | 子类构造器会**自动调用**父类构造器（通过 `super()`）                        | 接口没有构造器，所以无所谓                                    |
| **访问修饰符**   | 子类可访问父类的 `protected` 和 `public` 成员                               | 接口中所有成员默认是 `public`，实现类必须保持 `public` 可见性 |
| **字段/属性**    | 子类会继承父类的所有非 `private` 字段                                       | 接口只能定义静态常量（`public static final`），不能有实例字段 |
| **设计目的**     | 代码复用、扩展已有类的行为                                                  | 定义规范/协议，让不同类实现相同的行为                         |
| **改变现有行为** | 可以通过重写改变父类方法的行为                                              | 必须提供接口中方法的实现（不能直接改变接口行为）              |
| **使用关系**     | `class Child extends Parent`                                                | `class MyClass implements InterfaceA, InterfaceB`             |
| **结合使用**     | 类可以先继承一个父类，再实现多个接口：`class C extends P implements I1, I2` | -                                                             |

### 8.2 为什么在代码里写了类型，打包出来的 JS 文件大小没有变大？

- 在 TSC (或 Babel/Vite) 编译、打包为 JavaScript 时，**所有的接口、类型别名、类型断言、泛型占位符都会被完全擦除（Erasure）**。
- 最终运行在浏览器里的纯正 JavaScript 中没有任何类型代码，所以完全不会增加产物的物理体积，也不会影响运行时的性能。

### 8.3 符号 `!` 和 `?` 分别代表什么意思？

- **可选链操作符 `?.`**（ES 特性）：用于安全地访问深层对象。`obj?.a?.b`，如果 `obj` 或 `a` 是 null/undefined，会短路返回 undefined，而不会抛出 TypeError 崩溃。
- **非空断言操作符 `!`**（TS 独有）：告诉编译器“我发誓这个变量绝不可能是 null 或 undefined，请闭嘴通过编译”。例如 `const el = document.getElementById('app')!;`。**警告：滥用 `!` 是危险的，如果运行时它真的是 null，程序依然会崩溃报错。** 推荐优先使用 `?.` 或 `if` 逻辑判断。

### 8.4 如何彻底杜绝团队成员乱写 `any`？

- 在 `tsconfig.json` 中配置 `"noImplicitAny": true`，禁止编译器自动推导 any。
- 在 ESLint 配置文件中开启 `@typescript-eslint/no-explicit-any` 规则。一旦代码里出现显式的 `: any`，ESLint 直接报错，结合 Git Hooks (Husky) 在提交时强行拦截。
- 鼓励大家使用安全的 `unknown` 替代 `any`，配合类型收窄（Type Guards）来编写严谨的代码。

### 8.5 为什么 TypeScript 叫“结构化类型系统”（鸭子类型）？

主流后端语言（Java/C#）采用**名义类型（Nominal Typing）**，两个类即便字段一模一样，只要名字不同就不能互相赋值。
而 TS 采用**结构化类型（Structural Typing）**：**“如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子。”** 只要目标变量需要的字段你都有（哪怕你还有多余的字段），TS 就会允许赋值。这极大契合了 JS 对象字面量的动态灵活性。

### 8.6 到底什么时候该用 `unknown` 替代 `any`？

任何时候你觉得想写 `any`，先试着写 `unknown`。
比如用 `fetch` 获取网络数据时，返回的类型其实是未知的：

```ts
// 坏做法：any 会像病毒一样传染，导致后面调 data.a.b.c 都不报错
const data: any = await response.json()

// 好做法：必须先写类型守卫 (Type Guard) 进行收窄
const data: unknown = await response.json()
if (typeof data === 'object' && data !== null && 'id' in data) {
  console.log(data.id) // 安全收窄后方可使用
}
```

### 8.7 交叉类型（`&`）遇到同名冲突会发生什么？

如果交叉的接口中包含同名但**基础类型不同**的字段，该字段会被合并为 `never`。

```ts
type A = { id: number }
type B = { id: string }
type C = A & B
// C.id 变成了 number & string，即 never。后续给 C 赋值将永远失败。
```
