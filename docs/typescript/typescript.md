---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# TypeScript 核心语法与进阶类型 (TypeScript Core & Advanced)

## 1. 核心概念与特性

TypeScript 是 JavaScript 的一个超集，它为 JavaScript 带来了**静态类型检查**和**最新的 ECMAScript 特性**。通过类型系统，它能够在编译阶段捕获大量的潜在错误，是现代前端大型工程的基石。

| 核心特性 | 描述与作用 |
| :--- | :--- |
| **基础类型 (Basic Types)** | 提供了丰富的基本数据类型声明，包括 `boolean`, `number`, `string`, `Array`, `Tuple` (元组), `Enum` (枚举) 等。 |
| **特殊类型** | 包含逃生舱 `any`、空值 `void`、不存在的值 `never`，以及 `null` 和 `undefined`。 |
| **接口 (Interfaces)** | 用于定义对象、函数和类的契约（结构形状），支持可选、只读属性以及继承。 |
| **类与修饰符 (Classes)** | 强化了面向对象编程，引入了 `public`、`private`、`protected` 和 `readonly` 访问控制修饰符。 |
| **泛型 (Generics)** | 允许在定义函数、接口或类时不预先指定具体的类型，而在使用时再指定类型，极大地提升了代码的复用性。 |
| **高级类型与保护** | 包含联合类型(`\|`)、交叉类型(`&`)、类型别名(`type`)，以及基于 `typeof` 和 `instanceof` 的类型收窄（类型保护）。 |

## 2. 核心语法与实战应用

以下将您提供的 TypeScript 核心代码进行了结构化的梳理与规范化。

### 2.1 基础数据类型与断言

```typescript
//1. 布尔值 最基本的数据类型就是简单的true/false值
let isDone: boolean = false;
isDone=true

//2. 数字 和JavaScript一样，TypeScript里的所有数字都是浮点数。
let decLiteral: number = 6;
decLiteral=7

//3. 字符串 可以使用双引号（"）或单引号（'）表示字符串。
let name:string='bob'

//4. 数组 (两种定义方式)
let list2:number[]=[1,2,3]
let list:Array<number>=[1,2,3]

//5. 元组 (Tuple) - 已知数量和类型的数组
let x: [string, number] = ['123', 123];
let y: [string, ...number[]] = ['123', 123123, 123123]; // 结合剩余参数
let z: [string, number?] = ['123']; // 可选元组元素

//6. 枚举 (Enum)  enum类型是对JavaScript标准数据类型的一个补充
const enum Color { Red, Green, Blue } // 自动赋值 (0, 1, 2)
const enum BackGroundColor { Red = 1, Green = 2, Blue = 4 } // 手动赋值
let color: Color = Color.Red;
// 反向映射 (仅限非 const 枚举，此处作为概念展示)
// let colorName: string | undefined = BackGroundColor['2']; 

//7. any 标记还不清楚类型的变量
let notSure:any=123
notSure=123
notSure=true

//8. Unknown
let safeValue: unknown = 4; // Unknown: 安全的 Any
// safeValue.toFixed(); // 报错！在使用前必须进行类型缩小
if (typeof safeValue === 'number') {
    safeValue.toFixed(2); // 成功，类型已收窄
}

//9. void   它表示没有任何类型
function add() {
    console.log('这是一个空函数')
}
let unusable:void=undefined

//10. null和undefined
let u:undefined=undefined
let n:null=null

//11. Never - 永不存在的值的类型 (如抛出异常或死循环)
function error(message: string): never {
    throw new Error(message);
}
function fail() { // 类型推断返回值为 never
    return error('错误了');
}
function infiniterLoop(): never {
    while (true) {} // 存在无法达到的终点
}

//12. 类型断言 (告诉编译器："相信我，我知道它的类型")
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length; // 泛型断言确定类型,尖括号语法 (JSX中不推荐)
let strIntLength: number = (someValue as string).length; // as 语法 (推荐)
```

### 2.2 接口 (Interfaces)

接口的作用就是为类型命名，和为你的代码或第三方代码定义契约。

```typescript
// 1. 基础属性、可选属性、只读属性
interface Person {
    readonly id: number; // 只读
    name: string;
    age?: number;        // 可选
}

// ReadonlyArray 确保数组创建后不能被修改
let a: number[] =[1,2,3];
let currentList: ReadonlyArray<number> = a;

// 2. 额外的属性检查 (索引签名)
interface SquareInterface {
    name?: string;
    area?: number;
    [key: string]: any; // 允许携带其他任意名称的属性
}

// 3. 函数类型接口
interface SearchFunc {
    (source: string, substring: string): boolean;
}
let search: SearchFunc = function(source: string, substring: string): boolean {
    return source.search(substring) !== -1;
}

// 4. 可索引的类型
interface StringArray {
    [index: number]: string;
}
let myArray: StringArray = ['Bob', 'Mary'];
let myStr: string | undefined = myArray[1];

// 5. 类类型与接口继承
interface ClockInterface {
    currentTime: Date;
    setTime(d: Date): void;
}
// 类的实例部分实现接口
class Clock implements ClockInterface {
    currentTime: Date;
    constructor(h: number, m: number) {
        this.currentTime = new Date();
    }
    setTime(d: Date) {
        this.currentTime = d;
    }
}

// 类静态部分与实例部分的区别
interface ClockConstructor {
    new (hour: number, minute: number): ClockInterface;
}
function createClock(ctor: ClockConstructor, hour: number, minute: number): ClockInterface {
    return new ctor(hour, minute);
}

// 6. 接口继承
interface Width { width: number; }
interface Height { height: number; }
interface Shape extends Width, Height {
    area: number;
}
let shape: Shape = { width: 18, height: 20, area: 15 };
```

### 2.3 类与访问修饰符 (Classes & Modifiers)

```typescript
// 1. 类的继承
class Animals {
    move(distance: number) {
        console.log(`I am moving ${distance} meters`);
    }
}
class Dog extends Animals {
    bark() {
        console.log('Woof! Woof');
    }
}
const dog=new Dog()
dog.move(10)
dog.bark()

// 2. 公共、私有与受保护的修饰符
// public (默认): 内部、外部、子类均可访问
class PersonInfo {
    constructor(public name: string) {} 
}

// 当成员被标记成private时，它就不能在声明它的类的外部访问。比如：
class Student{
    constructor(private age:number){
        this.age=age
    }
}
// new Student(18).age   实例对象无法访问

// protected: 在当前类内部和派生类(子类)中可以访问，外部实例不可访问
class Father {
    protected age: number;
    constructor(age: number) { this.age = age; }
}
class Son extends Father {
    protected name: string;
    constructor(age: number, name: string) {
        super(age); // 必须调用 super
        this.name = name;
    }
    getNameAndAge() {
        return this.name + this.age; // 子类可以访问父类的 protected age
    }
}
// console.log(new Son(18,'xiaoming').getNameAndAge())
// console.log(new Son(18,'xiaoming').name)  //实例对象无法访问

// 3. readonly 修饰符
class Mother {
    readonly name: string;
    constructor(name: string) {
        this.name = name; // 只能在声明时或构造函数里被初始化
    }
}
let mary=new Mother("Mary");
// mary.name='Alice'  //不可修改

//函数类型
function increment(x:number, y:number):number{
    return x+y
}
let myAdd:(x:number,y:number)=>number=increment  //完整类型
let myAdd2=increment  //类型推断

//默认参数，可选参数
function decrement(x?:number,y=12):number {
    if(x){
        return x-y
    }else{
        return y
    }
}

//剩余参数
function getMax(x:number,...argument:number[]):number{
    return Math.max(...arguments,x)
}
console.log(getMax(5,2,4))

//回调函数this
class Handler{
    info:string
    constructor(info:string) {
        this.info=info
    }
    onClick=(e:Event)=>{this.info=(e.target as HTMLInputElement).value}  //dom节点点击
}

```


### 2.4 泛型 (Generics) 与高级类型

```typescript
// 1. 泛型函数
function identity<T>(arg: T[]): T[] {
    console.log(arg.length);
    return arg;
}

// 2. 泛型接口
interface GenericIdentityFn<T> {
    (arg: T): T;
}
function nextIdentity<T>(arg: T): T { return arg; }
let currentIdentity: GenericIdentityFn<number> = nextIdentity;

// 3. 泛型类
class genericNumber<T>{
    value:T
    add: ((x: T, y: T) => T | undefined) | undefined;
    constructor(value:T){
        this.value=value
    }

}
let myGeneric=new genericNumber<number>(18)
myGeneric.value=10
myGeneric.add=function (x,y) {
    return x+y
}

// 4. 泛型约束 (必须包含 length 属性)
interface LengthWise {
    length: number;
}
function nextExtendsIdentity<T extends LengthWise>(arg: T): T {
    console.log(arg.length);
    return arg;
}

// 5. 巧妙利用 keyof 获取对象属性 (K 必须是 T 的键)
function getProperty<T, K extends keyof T>(obj: T, key: K) {
    return obj[key];
}

// 6. 获取类的构造函数类型
function create<T>(c: { new(): T }): T {
    return new c();
}

//索引类型和字符串索引签名
interface Map<T> {
    [key: string]: T;
}
let keys: keyof Map<number>; // string
let value: Map<number>['foo']; // number

```

### 2.5 类型别名(Type Aliases)

```typescript
//类型别名
type Name='string'
type Age='number'

// 联合类型
type width=number|string

//交叉类型
type Area={
    heigth:number;
    width:number;
}
type  Address={
    num:number
    cell:number,
    room:number
}
type House=Area&Address
let house:House={
    heigth:18,
    width:20,
    num:21,
    cell:100,
    room:200
}

//字符串字面量类型
type MyName='Mary' |'Bob'|'Nick'
```

### 2.6 类型保护 (Type Guards)

用于在条件块中缩小类型的范围。

```typescript
//typeof类型保护 联合类型
function padLeft(value:string,padding:number|string){
    if(typeof padding=='string'){
        return padding+value
    }
    if(typeof padding==='number'){
        return Array(padding+1).join(' ')+value
    }
    throw new Error(`Expected string or number, got '${padding}'.`);
}

//instanceof类型保护
interface Padder {
    getPaddingString(): string
}

class SpaceRepeatingPadder implements Padder {
    constructor(private numSpaces: number) { }
    getPaddingString() {
        return Array(this.numSpaces + 1).join(" ");
    }
}

class StringPadder implements Padder {
    constructor(private value: string) { }
    getPaddingString() {
        return this.value;
    }
}

function getRandomPadder() {
    return Math.random() < 0.5 ?
        new SpaceRepeatingPadder(4) :
        new StringPadder("  ");
}

// 类型为SpaceRepeatingPadder | StringPadder
let padder: Padder = getRandomPadder();

if (padder instanceof SpaceRepeatingPadder) {
    // padder; // 类型细化为'SpaceRepeatingPadder'
}
if (padder instanceof StringPadder) {
    // padder; // 类型细化为'StringPadder'
}
```

## 3. tsconfig.json配置(TypeScript Configuration)

###  3.1 核心概念与整体架构

`tsconfig.json` 是 TypeScript 项目的“大脑”与控制中心。如果一个目录下存在这个文件，就意味着该目录是 TypeScript 项目的根目录。它主要承担两大核心职责：
1.  **指定要编译的文件范围**（哪些文件归 TS 管，哪些不管）。
2.  **定义编译选项 (`compilerOptions`)**（TS 应该以多严格的标准检查代码，以及最终编译出什么样子的 JS）。

| 属性名 | 核心作用与描述 | 配置示例 |
| :--- | :--- | :--- |
| **`include`** | 指定需要被 TypeScript 编译和检查的文件或文件夹的 glob 模式数组。 | `["src/**/*", "env.d.ts"]` |
| **`exclude`** | 指定在 `include` 范围内，但需要被**刻意排除**的文件目录（如第三方库和产物目录）。 | `["node_modules", "dist"]` |
| **`files`** | 仅包含需要编译的单个文件列表（不支持 glob 模式），适用于极小型的项目。 | `["src/main.ts"]` |
| **`extends`** | 继承另一个配置文件的基础配置，极大提高多包项目 (Monorepo) 配置的复用性。 | `"extends": "./tsconfig.base.json"` |
| **`compilerOptions`** | **最核心的区域**。控制编译器的各种具体行为（语法降级、严格模式、模块解析等）。 | 见下文详细解析 |

### 3.2 compilerOptions 核心编译选项详解

`compilerOptions` 中的配置项多达上百个，但在实际工程中，我们只需要熟练掌握以下四大维度的核心配置即可。

#### 1. 基础构建与目标环境 (Build & Target)

决定了你的 TypeScript 代码最终会被“翻译”成什么年代的 JavaScript。

```json
{
  "compilerOptions": {
    // 1. 语法降级目标：将 TS 编译为哪个版本的 JS 语法（如把箭头函数转为普通函数）
    // 现代浏览器项目通常设为 "ES2015" 或 "ESNext"，老旧项目设为 "ES5"
    "target": "ES2015",

    // 2. 模块系统：决定编译后的代码使用哪种模块化规范
    // 前端通常使用 "ESNext" (保留 import/export)，Node.js 项目常使用 "CommonJS"
    "module": "ESNext",

    // 3. 内置类型库引入：告诉 TS 你的代码运行在什么环境中
    // 比如填入 "DOM"，TS 才会认识 document.getElementById，否则会报错
    "lib": ["DOM", "DOM.Iterable", "ESNext"],

    // 4. 产物输出目录：编译后的 JS 文件存放在哪里
    // 注意：如果使用 Vite/Webpack 打包，通常由打包工具接管，TS 就不需要配置 outDir 了
    "outDir": "./dist",

    // 5. 不输出文件：极其重要的现代配置！
    // 在 Vite 等现代工程中，esbuild 负责极速编译 JS，TS 编译器只负责“纯类型检查”。开启此项，TS 报错时就不会生成没用的 JS 文件。
    "noEmit": true
  }
}
```

#### 2. 严格模式与代码质量 (Strictness & Quality)

这是 TypeScript 灵魂所在。建议新项目**永远无脑开启** `strict: true`。

```json
{
  "compilerOptions": {
    // 1. 严格模式总开关：一键开启所有严格的类型检查机制
    "strict": true,

    // 以下是 strict 包含的具体子规则（通常不需要单独写，除非你想在总开关外单独关闭某个）：
    
    // 2. 不允许隐式的 any：变量如果没有声明类型且无法推导，直接报错
    "noImplicitAny": true,

    // 3. 严格的空值检查：极其重要！防止 Cannot read property of undefined 报错
    // 开启后，string 类型的变量绝对不能被赋值为 null 或 undefined
    "strictNullChecks": true,

    // 4. 严格绑定 this：防止 this 指向丢失引发的错误
    "noImplicitThis": true,

    // --- 以下是不包含在 strict 中，但极力推荐开启的额外质量检查 ---
    
    // 5. 检查未使用的局部变量：帮助清理死代码
    "noUnusedLocals": true,
    
    // 6. 函数里所有的分支都必须有明确的 return 返回值
    "noImplicitReturns": true
  }
}
```

#### 3. 模块解析与路径映射 (Module Resolution)

这部分配置直接影响到代码里 `import` 语句的寻找逻辑。

```json
{
  "compilerOptions": {
    // 1. 模块解析策略：现代前端工程（特别是用到第三方 npm 包时），必须设为 "node" 或最新的 "bundler"
    "moduleResolution": "node",

    // 2. 允许导入 .json 文件，并提供类型推导
    "resolveJsonModule": true,

    // 3. 核心：解决 CommonJS 和 ES Modules 导入兼容性问题
    // 开启后，允许使用 `import React from 'react'` 而不是 `import * as React from 'react'`
    "esModuleInterop": true,
    
    // 4. 隔离模块：对于 Babel, Vite(esbuild) 等单文件编译工具是必须的，确保文件能被安全地独立编译
    "isolatedModules": true,

    // 5. 路径别名 (Path Mapping) 极其常用！
    // 让 TS 认识你在 Webpack/Vite 中配置的 `@/` 别名，提供跳转和代码提示
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "components/*": ["src/components/*"]
    }
  }
}
```

### 3.3 现代工程化典型配置模板 (Vite + Vue3/React)

在现代构建工具体系中（如 Vite），TypeScript 通常剥离了“编译输出 JS”的工作，纯粹作为**静态类型检查器 (Linter)** 使用。

以下是一份标准的、适用于现代前端项目的 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",         // React 项目可以设为 "react-jsx"
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,      // 跳过对 node_modules 里的第三方库的类型检查，极大提升编译速度！
    "noEmit": true,            // Vite 环境专属：只做类型检查，不输出产物
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 `interface` (接口) 和 `type` (类型别名) 有什么本质区别？应该用哪个？
*   **答**：在大多数日常开发中，它们可以互换使用，但存在底层差异：
    *   **扩展性**：`interface` 是专门为面向对象设计的，可以通过 `extends` 继承，且**支持声明合并**（如果你定义了两个同名的 `interface`，它们会自动合并成一个）。
    *   **表达能力**：`type` 的表达能力更强，它可以定义联合类型 (`A | B`)、交叉类型 (`A & B`)、元组以及映射类型，而 `interface` 只能定义对象和函数形状。
    *   **规范建议**：定义对象结构、库的对外 API、类的契约时，优先使用 `interface`。在定义联合类型、复杂的泛型推导时，使用 `type`。

### 4.2 为什么在 React 或事件回调中，经常需要写成箭头函数 `onClick=(e: Event) => {}`？
*   **答**：这是为了解决 JavaScript 中的 `this` 指向丢失问题。
    *   如果您在类中写普通方法 `onClick(e) {}`，当它被作为回调函数传递给 DOM 事件时，运行时的 `this` 会变成触发事件的 DOM 元素（或者 `undefined`），导致无法访问类的实例属性（如 `this.info`）。
    *   **箭头函数不会创建自己的 `this`**，它会在声明时捕获其所在上下文的 `this`（即类的实例）。这样就能安全地在回调中操作实例变量。

### 4.3 `void` 和 `never` 有什么区别？
*   **答**：
    *   `void` 表示**“空”**。函数正常执行完毕了，只是它**没有返回任何有意义的值**（实际上在 JS 中隐式返回了 `undefined`）。常用于普通的副作用函数。
    *   `never` 表示**“永远不可能”**。函数**永远无法执行到终点**（比如抛出了一个 Error 直接中断了程序，或者陷入了 `while(true)` 死循环）。它代表代码执行的异常中断或无法返回。

### 4.4 为什么不推荐过度使用 `any`？可以用什么替代？
*   **答**：
    *   滥用 `any` 会让 TypeScript 退化成 "AnyScript"，使得类型系统的静态检查形同虚设，你将失去所有的代码提示和错误预警。
    *   **替代方案**：如果真的在编写时不知道是什么类型，请使用 **`unknown`** 类型。`unknown` 是安全的 `any`。你无法对 `unknown` 类型的值直接进行任何操作（如调用方法、获取属性），除非你先通过**类型保护**（`typeof` / `instanceof`）将其收窄为特定的类型。这强制要求你编写严谨的防错代码。

### 4.5 为什么在代码里写了类型，打包出来的 JS 文件大小没有变大？
*   **答**：这是一个核心认知。**TypeScript 的类型系统完全是编译时的概念。**
    *   在 TSC (或 Babel/Vite) 编译、打包为 JavaScript 时，**所有的接口、类型别名、类型断言、泛型占位符都会被完全擦除（Erasure）**。
    *   最终运行在浏览器里的纯正 JavaScript 中没有任何类型代码，所以完全不会增加产物的物理体积，也不会影响运行时的性能。

### 4.6 什么是 `.d.ts` 文件？它有什么用？
*   **答**：它是 TypeScript 的**类型声明文件 (Declaration Files)**。
    *   它的作用类似于 C++ 中的 `.h` 头文件。当我们在 TS 项目中引入一个纯 JS 编写的第三方库（比如 `jQuery` 或 `lodash`）时，TS 编译器是不认识它们的 API 的，会疯狂报错。
    *   `.d.ts` 文件的作用就是**为这些纯 JS 库补充类型说明**。你可以通过 `npm install @types/lodash -D` 来下载社区（DefinitelyTyped）为这些库预先写好的类型声明文件，从而让编辑器恢复智能提示。

### 4.7 符号 `!` 和 `?` 分别代表什么意思？
*   **答**：
    *   **可选链操作符 `?.`**（ES 特性）：用于安全地访问深层对象。`obj?.a?.b`，如果 `obj` 或 `a` 是 null/undefined，会短路返回 undefined，而不会抛出 TypeError 崩溃。
    *   **非空断言操作符 `!`**（TS 独有）：告诉编译器“我发誓这个变量绝不可能是 null 或 undefined，请闭嘴通过编译”。例如 `const el = document.getElementById('app')!;`。**警告：滥用 `!` 是危险的，如果运行时它真的是 null，程序依然会崩溃报错。** 推荐优先使用 `?.` 或 `if` 逻辑判断。

### 4.8 如何彻底杜绝团队成员乱写 `any`？
*   **答**：
    *  在 `tsconfig.json` 中配置 `"noImplicitAny": true`，禁止编译器自动推导 any。
    *  在 ESLint 配置文件中开启 `@typescript-eslint/no-explicit-any` 规则。一旦代码里出现显式的 `: any`，ESLint 直接报错，结合 Git Hooks (Husky) 在提交时强行拦截。
    *  鼓励大家使用安全的 `unknown` 替代 `any`，配合类型收窄（Type Guards）来编写严谨的代码。


