---
outline: [2, 3]
---

# 执行上下文与执行栈 (Execution Context & Call Stack)

**执行上下文**是 JS 代码解析和执行的环境；**执行栈**（调用栈）则用 LIFO 结构管理这些上下文的执行顺序。

## 1. 执行上下文 (Execution Context)

执行上下文是 JS 代码解析和执行的环境。每当 JS 代码运行时，它都在某个执行上下文中运行。

### 1.1 上下文的类型

[width(26,63,11)]

| 类型                     | 说明                                                                                                    | 数量   |
| :----------------------- | :------------------------------------------------------------------------------------------------------ | :----- |
| **全局执行上下文 (GEC)** | 默认最基础，函数外的代码都在此；创建全局对象（浏览器中是 `window`，Node.js 中是 `global`）并绑定 `this` | 仅一个 |
| **函数执行上下文 (FEC)** | 每个**函数**都有自己的上下文，但只有被调用时才创建                                                      | 可多个 |
| **Eval 执行上下文**      | `eval` 拥有自己的上下文（不推荐使用）                                                                   | -      |

### 1.2 生命周期：创建与执行

执行上下文有两个阶段，这是理解“**提升**”等诡异行为的关键。

#### 1.2.1 创建阶段（俗称“预编译”）

> [!IMPORTANT] 第一阶段：创建阶段 (Creation Phase)俗称`预编译`
> 在代码执行之前，JS 引擎会扫描代码并设置环境：
>
> 1.  **确定 `this` 的值** (Binding `this`)。
> 2.  **创建词法环境 (Lexical Environment)**：
>     - **存储`let/const`变量和函数声明**：
>     - **函数声明**：会被完整地存储在内存中（完全提升）。
>     - **`let/const`变量**：会被“**创建**”但**未初始化**（进入暂时性死区 TDZ）。
> 3.  **创建VariableEnvironment(变量环境)并建立作用域链 (Scope Chain)**：连接当前环境和父级环境，用于查找变量。
>
>     - **`var`变量**：会被初始化为 `undefined`,若函数声明和`var`变量重名，则不做处理（变量提升）。

```js
ExecutionContext = {
  ThisBinding: <this value>,        // 确定 this
  LexicalEnvironment: { ... },     // 词法环境
  VariableEnvironment: { ... },    // 变量环境
}
```

#### 1.2.2 执行阶段

> [!IMPORTANT] 第二阶段：执行阶段 (Execution Phase)
>
> - **代码从上到下逐行执行。**
> - **为变量赋值（将 `undefined` 替换为真实值）。**
> - **执行函数调用。**

### 1.3 内部结构详解

一个执行上下文由三部分组成：`ThisBinding`、词法环境、变量环境。

```js
ExecutionContext = {
  // 1. This 绑定
  ThisBinding: <Global Object or Object Reference>,

  // 2. 词法环境：处理 let、const、函数声明
  LexicalEnvironment: {
    EnvironmentRecord: { ... },          // 存储变量的具体地方
    outer: <Reference to outer env>     // 指向父级作用域（作用域链）
  },

  // 3. 变量环境：专门处理 var
  VariableEnvironment: {
    EnvironmentRecord: { ... },
    outer: <Reference to outer env>
  }
}
```

#### 1.3.1 This Binding

- **全局**上下文：`this` 指向全局对象（浏览器 `window`，Node 中指向当前文件的 `module` 对象）。
- **函数**上下文：`this` 取决于函数的调用方式——默认绑定、隐式绑定、显式绑定（硬绑定）、`new` 绑定、箭头函数，详见 [this 全面解析](/js/basic/this)。

#### 1.3.2 词法环境 (Lexical Environment)

词法环境由「组成部分」和「类型」两个维度描述：

[width(13,22,65)]

| 维度     | 名称             | 说明                                                                                         |
| :------- | :--------------- | :------------------------------------------------------------------------------------------- |
| 组成部分 | 环境记录         | 存储变量和函数声明的实际位置                                                                 |
| 组成部分 | 对外部环境的引用 | 可以访问其外部词法环境                                                                       |
| 类型     | 全局环境         | 外部环境引用为 `null`；拥有全局对象及其方法、属性，以及自定义的全局变量；`this` 指向全局对象 |
| 类型     | 函数环境         | 存储函数内定义的变量，环境记录含 `arguments` 对象；外部引用可为全局环境或外层函数环境        |

```js
GlobalExectionContext = {           // 全局执行上下文
  LexicalEnvironment: {             // 词法环境
    EnvironmentRecord: {            // 环境记录
      Type: "Object",               // 全局环境
      outer: <null>                 // 对外部环境的引用
    }
  }
}

FunctionExectionContext = {         // 函数执行上下文
  LexicalEnvironment: {             // 词法环境
    EnvironmentRecord: {            // 环境记录
      Type: "Declarative",          // 函数环境
      outer: <Global or outer function environment reference>
    }
  }
}
```

#### 1.3.3 变量环境 (Variable Environment)

变量环境本质上也是词法环境，因此具有词法环境的全部属性（环境记录 + `outer` 引用）。区别在于分工：

- **词法环境**：存储**函数声明 + `let`/`const`**。
- **变量环境**：专存 **`var`**。

> **变量提升的根源**：创建阶段函数声明被完整存储、`var` 被初始化为 `undefined`，所以声明前可访问 `var`（值为 `undefined`）；而 `let`/`const` 保持**未初始化(TDZ)**，声明前访问会抛 `ReferenceError`。

### 1.4 内部结构演进

#### 1.4.1 ES3 标准（经典模型）

**VO/AO 模型：**

![Logo](/img/VO.png)

[width(10,14,14,18,44)]

| 概念 | 全称     | 作用范围 | 何时创建     | 包含内容                            |
| :--- | :------- | :------- | :----------- | :---------------------------------- |
| VO   | 变量对象 | 统称     | -            | 变量声明、函数声明                  |
| GO   | 全局对象 | 全局     | 浏览器加载时 | 全局变量、内置对象、函数声明        |
| AO   | 活动对象 | 函数内部 | 函数被调用时 | arguments、形参、局部变量、内部函数 |

```js
ExecutionContext = {
  scopeChain: { ... },        // 作用域链
  variableObject: { ... },    // VO/AO（变量、函数声明、arguments）
  this: { ... }
}
```

#### 1.4.2 ES6+ 标准（现代模型）

ES6 中 VO/AO 被**词法环境**取代，以支持 `let`/`const` 的块级作用域：

```js
ExecutionContext = {
  // 1. 词法环境：处理 let、const、函数声明
  LexicalEnvironment: {
    EnvironmentRecord: { ... },          // 存储变量的具体地方
    outer: <Reference to outer env>     // 指向父级作用域（作用域链）
  },

  // 2. 变量环境：专门处理 var
  VariableEnvironment: {
    EnvironmentRecord: { ... },
    outer: <Reference to outer env>
  },

  // 3. This 绑定
  ThisBinding: <Global Object or Object Reference>
}
```

#### 1.4.3 ES3 vs ES6+

[width(40,60)]

| ES3                      | ES6+                                      |
| :----------------------- | :---------------------------------------- |
| VO / AO（变量/活动对象） | 词法环境 / 变量环境（完整结构见上文 1.3） |
| scopeChain（作用域链）   | 环境记录中的 `outer` 引用链               |
| this                     | `ThisBinding`                             |

> 一句话总结：ES3 把「变量、函数、作用域」都塞进一个 **VO/AO 对象**里；ES6 拆成**词法环境 + 变量环境**两个对象，并用 `outer` 引用串联成作用域链，从而能区分 `let`/`const` 与 `var` 的不同提升行为。

## 2. 执行栈 (Call Stack)

执行栈（也叫调用栈）是一个 **LIFO (后进先出)** 的数据结构，用于存储代码运行时创建的所有执行上下文。

### 2.1 运行流程

- **初始化**：创建全局执行上下文，推入栈底。
- **函数调用**：为新函数创建函数执行上下文，**压栈 (Push)** 到栈顶。
- **执行栈顶**：引擎始终执行栈顶的上下文。
- **函数返回**：上下文**出栈 (Pop)**，控制权交还下一个上下文。

### 2.2 示例

```js
let a = 'Hello World!'

function first() {
  console.log('Inside first function')
  second()
  console.log('Again inside first function')
}

function second() {
  console.log('Inside second function')
}

first()
console.log('Inside Global Execution Context')

// Inside first function
// Inside second function
// Again inside first function
// Inside Global Execution Context
```

栈的变化：`[Global]` → `[Global, first]` → `[Global, first, second]` → `[Global, first]` → `[Global]`。

## 3. 综合案例

结合调用栈与 ES6 结构模拟 `multiply(20, 30)` 的执行过程：

```js
let a = 20
const b = 30
var c

function multiply(e, f) {
  var g = 20
  return e * f * g
}

c = multiply(20, 30)
```

### 3.1 全局上下文创建阶段

```js
GlobalExectionContext = {
    ThisBinding: <Global Object>,
        // 词法环境：存 let, const
        LexicalEnvironment: {
            EnvironmentRecord: {
                Type: "Object",
                a: <uninitialized>, // 暂时性死区
                b: <uninitialized>,
                multiply: <func>
            },
            outer: null
        },
        // 变量环境：存 var
        VariableEnvironment: {
            EnvironmentRecord: {
                Type: "Object",
                c: undefined, // var 提升为 undefined
            },
            outer: null
        }
}
```

（ES3 视角：`GO = { a: <uninitialized>, b: <uninitialized>, c: undefined, multiply: <func> }`）

### 3.2 全局上下文执行阶段

`a`、`b` 分别赋值 20、30；`c` 仍为 `undefined`；遇到 `multiply(20, 30)` 调用 → 创建函数执行上下文。

### 3.3 函数上下文创建阶段

```js
FunctionExectionContext = {
    ThisBinding: <Global Object>, // 因为是普通调用
        LexicalEnvironment: {
            EnvironmentRecord: {
                Type: "Declarative",
                arguments: {0: 20, 1: 30, length: 2},
                e: 20, // 形参
                f: 30  // 形参
            },
            outer: <GlobalLexicalEnvironment> // 作用域链指向全局
        },
        VariableEnvironment: {
            EnvironmentRecord: {
                Type: "Declarative",
                g: undefined // var 提升
            },
            outer: <GlobalLexicalEnvironment>
        }
}
```

（ES3 视角：`AO = { g: undefined, e:20, f:30 }`）

### 3.4 函数上下文执行阶段

`g` 赋值为 20，计算 `e * f * g`，返回结果，**FEC 出栈销毁**。

### 3.5 回到全局

`c` 接收返回值，程序结束。

## 4. 提升 (Hoisting) 示例

### 4.1 变量提升

```js
foo // undefined
var foo = function () {
  console.log('foo1')
}
foo() // foo1
var foo = function () {
  console.log('foo2')
}
foo() // foo2
```

### 4.2 函数提升

```js
foo() // foo2
function foo() {
  console.log('foo1')
}
foo() // foo2
function foo() {
  console.log('foo2')
}
foo() // foo2
```

### 4.3 声明优先级：函数 > 变量

```js
foo() // foo2
var foo = function () {
  console.log('foo1')
}
foo() // foo1
function foo() {
  console.log('foo2')
}
foo() // foo1
```

## 5. 常见问题 (FAQ)与 避坑指南

### 5.1 栈溢出 (Stack Overflow) 是什么？

执行栈压入过多上下文、超过引擎最大容量时，报 `RangeError: Maximum call stack size exceeded`。常见原因是递归无终止条件。

```js
function recursive() {
  recursive()
}
recursive() // RangeError
```

### 5.2 为什么 `var` 会提升，而赋值不提升？

由创建阶段决定：创建阶段引擎发现 `var a`，先占位并初始化为 `undefined`；赋值 `a = 10` 发生在执行阶段。因此赋值前访问得到 `undefined`。

### 5.3 作用域链和执行栈有什么关系？

- **执行栈**：决定**代码执行顺序**（谁调用谁）。
- **作用域链**：决定**变量查找权限**（去哪找变量）。

关键：作用域链在**函数定义时**确定（词法作用域），与调用顺序无关。

### 5.4 闭包如何“逃过”执行栈销毁？

函数执行完，上下文出栈、内存本应回收。但若有闭包引用外部函数变量，该外部函数的**词法环境**会保留在堆内存中，不被 GC 立即回收——上下文虽出栈，其“**变量对象**”仍供闭包使用。

### 5.5 上下文执行顺序

```js
console.log('1')
function foo() {
  console.log('2')
}
foo()
console.log('3')
```

创建阶段扫描到 `foo`；执行阶段依次输出 `1`、调用 `foo` 输出 `2`、再输出 `3` → **1, 2, 3**。

### 5.6 为什么函数声明优先级大于变量声明？

创建阶段，函数声明先被完整存入词法环境，随后才处理 `var` 声明；若同名，`var` 声明被**忽略**（不覆盖函数），但赋值仍留在原地。故函数在提升的“**先手**”阶段就占据了标识符。
