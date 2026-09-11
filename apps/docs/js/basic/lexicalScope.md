---
outline: [2, 3]
---

# 作用域 (Scope)

简单来说，**作用域是一套规则，用来确定变量（标识符）在何处、以及如何被查找**,它同时决定了两个关键问题:

- **可见性**：哪些代码可以访问某个变量。
- **生命周期**：变量何时创建、何时被销毁。

## 1. 作用域的类型

在现代 JavaScript (ES6+) 中，主要有三种作用域：

### 1.1 全局作用域 (Global Scope)

- **定义**：在所有函数和代码块之外声明的变量。
- **生命周期**：伴随页面的生命周期，页面关闭才销毁。
- **访问性**：在代码的任何地方都能访问。
- **风险**：容易造成**命名冲突**（变量污染）。

```js
const globalVar = 'I am global'

function check() {
  console.log(globalVar) // ✅ 可以访问
}
```

> [!NOTE] var 与 let/const 在全局的差异
> 在全局作用域用 `var` 声明的变量会成为全局对象（浏览器 `window`）的**属性**；而 `let`/`const` 声明的变量虽然也在全局作用域（存在于全局词法环境的环境记录中），但**不会**挂到 `window` 上。
>
> ```js
> var a = 1
> let b = 2
> console.log(window.a) // 1
> console.log(window.b) // undefined
> ```

### 1.2 函数作用域 (Function Scope)

- **定义**：在函数内部声明的变量。
- **访问性**：只能在该函数内部访问，外部无法“**看见**”。
- **关键字**：`var`、`let`、`const` 在函数内声明都遵循此规则。

```js
function myFunction() {
  var secret = '123'
  let anotherSecret = '456'
  console.log(secret, anotherSecret) // ✅ 内部可访问
}

console.log(secret) // ❌ 报错: ReferenceError
```

### 1.3 块级作用域 (Block Scope) — ES6 新增

- **定义**：由花括号 `{}` 包裹的代码块（如 `if`、`for`、`switch` 语句）。
- **关键点**：只有 `let` 和 `const` 遵循块级作用域，`var` **不遵循**（会穿透）。

```js
if (true) {
  let blockLet = 'Locked'
  var blockVar = 'Leaked'
}

console.log(blockVar) // ✅ 输出 "Leaked" (var 穿透了)
console.log(blockLet) // ❌ 报错: ReferenceError (let 被锁住了)
```

#### 块级作用域的“特殊待遇”：`for` 循环

`for` 循环中使用 `let` 时，每次迭代都会**创建一个新的绑定**，这也是解决经典“**循环 + 异步**”闭包陷阱的根基：

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var:', i), 0)
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let:', j), 0)
}
// var: 3 / var: 3 / var: 3
// let: 0 / let: 1 / let: 2
```

> 详细解析见 [闭包](/js/basic/closure) 中的“**循环中的闭包陷阱**”。

### 1.4 作用域对比

[width(15,15,26,24,20)]

| 作用域     | 声明位置          | 遵循的关键字            | 生命周期                     | 典型特点 / 风险    |
| :--------- | :---------------- | :---------------------- | :--------------------------- | :----------------- |
| 全局作用域 | 任何函数 / 块之外 | `var` / `let` / `const` | 页面关闭才销毁               | 命名冲突、全局污染 |
| 函数作用域 | 函数内部          | `var` / `let` / `const` | 函数调用结束（若无闭包引用） | 外部无法访问       |
| 块级作用域 | `{}` 内部         | 仅 `let` / `const`      | 代码块结束                   | `var` 会穿透       |

## 2. 核心机制

### 2.1 词法作用域 (Lexical Scope)

JavaScript 采用的是**词法作用域**（也叫**静态作用域**）。
这意味着：**函数的作用域在函数定义的时候就决定了，而不是在调用的时候决定。**

无论函数在哪里被调用，它总是查找它**写代码时**所在位置的上层作用域。

```js
let value = 1

function foo() {
  console.log(value)
}

function bar() {
  let value = 2
  foo() // 在这里调用 foo
}

bar() // 输出: 1
// 原因：foo 定义在全局，它的上级是全局作用域（value=1），而不是 bar 的作用域。
```

#### 词法作用域 vs 动态作用域

[width(17,44,39)]

| 维度     | 词法作用域（JS）            | 动态作用域                   |
| :------- | :-------------------------- | :--------------------------- |
| 决定时机 | **定义时**（写代码的位置）  | **调用时**（运行时的调用栈） |
| 查找规则 | 由内向外，沿代码嵌套结构    | 沿着**调用栈**向上查找       |
| 代表语言 | JavaScript、C、Java、Python | Bash、部分 Lisp 方言         |

### 2.2 作用域链 (Scope Chain)

当代码使用一个变量时，JS 引擎会遵循“**就近原则**”从内向外逐层查找，这一层层嵌套的作用域串起来就形成了**作用域链**：

![作用域链](/img/scopeChain2.png)

**链条**：`Inner Function` → `Outer Function` → `Global` → `Error`

```js
const global = 'G'

function outer() {
  const outerVar = 'O'
  function inner() {
    const innerVar = 'I'
    console.log(innerVar) // ① 当前作用域找到 → "I"
    console.log(outerVar) // ② 向上查 outer → "O"
    console.log(global) // ③ 再向上查 global → "G"
    console.log(notExist) // ④ 全链找不到 → ReferenceError
  }
  inner()
}
outer()
```

> [!TIP] 作用域链在“定义时”就已确定
> 作用域链（`outer` 引用）是由**词法结构**决定的，函数定义时就已经确定，与它被调用时的位置无关——这正是词法作用域的体现。

### 2.3 作用域与执行上下文的关系

- **作用域**是**静态**概念：描述“**变量能在哪里被访问**”，由代码书写位置决定。
- **执行上下文**是**动态**概念：描述“**代码运行时有哪些环境**”，函数每次调用都会新建。

两者通过**词法环境**联系在一起：执行上下文中的词法环境持有 `EnvironmentRecord`（存储当前作用域的变量）+ `outer`（指向父级作用域），`outer` 层层串联即构成作用域链。详细机制见 [执行上下文与执行栈](/js/basic/executionContextAndStack)。

### 2.4 作用域与变量提升 (Hoisting)

变量的“**提升**”行为与作用域密切相关，也因关键字而异：

[width(20,15,40,25)]

| 关键字          | 作用域     | 提升行为                               | 声明前访问          |
| :-------------- | :--------- | :------------------------------------- | :------------------ |
| `var`           | 函数作用域 | 提升，并初始化为 `undefined`           | `undefined`         |
| `let` / `const` | 块级作用域 | 提升，但**不初始化**（进入暂时性死区） | 抛 `ReferenceError` |
| `function` 声明 | 函数 / 块  | 整体提升（含函数体）                   | 可正常调用          |

> 关于暂时性死区（TDZ）与变量提升的完整细节，见 [var、let、const 命令](/js/basic/variablesDeclare) 与 [执行上下文与执行栈](/js/basic/executionContextAndStack)。

## 3. 作用域的高级应用 — 闭包 (Closure)

**定义**：当一个函数能够记住并访问它的**词法作用域**，即使这个函数在它的词法作用域之外执行时，就产生了闭包。

```js
function createCounter() {
  let count = 0 // 这个变量被“封闭”在闭包里

  return function () {
    count++
    console.log(count)
  }
}

const myCounter = createCounter() // createCounter 执行完毕，本该销毁 count
myCounter() // 1 - 但 myCounter 依然持有对 count 的引用
myCounter() // 2
```

- **原理**：`myCounter` 依然保留着 `createCounter` 作用域的引用（背包），所以 `count` 不会被垃圾回收。

> [!NOTE] 闭包是“作用域”能力的外溢
> 闭包本质是作用域链的延伸：内部函数被返回到外部后，其 `outer` 引用仍指向外部函数的作用域，因此能继续访问外部变量。闭包的九大应用场景（私有变量、柯里化、防抖节流、模块化等）见 [闭包](/js/basic/closure)。

## 4. 常见问题 (FAQ)与 避坑指南

### 4.1 什么是“变量遮蔽” (Variable Shadowing)？

**答**：当内部作用域声明了与外部作用域同名的变量时，内部变量会“**遮盖**”外部变量。在内部无法直接访问那个被遮盖的外部变量。

```js
let name = 'Outer'

function show() {
  let name = 'Inner' // 遮蔽了外部的 name
  console.log(name) // "Inner"
}
```

### 4.2 为什么很多人说 JavaScript 没有动态作用域？

**答**：动态作用域是指变量取决于函数**在哪里调用**。Bash 脚本就是动态作用域。而 JS 是词法作用域（取决于**在哪里定义**）。这也是 `this` 关键字经常让人困惑的原因——**作用域是静态的，但 `this` 的指向是动态的**。关于 `this` 的绑定规则见 [this 全面解析](/js/basic/this)。

### 4.3 为什么不推荐使用全局变量？

- **命名冲突**：第三方库或同事的代码可能使用了相同的变量名，导致互相覆盖。
- **调试困难**：任何代码都能修改全局变量，很难追踪是谁改坏了数据。
- **内存泄漏**：全局变量一直存在，直到页面关闭才释放。

### 4.4 块级作用域对性能有影响吗？

**答**：微乎其微。现代 JS 引擎（如 V8）对作用域查找进行了极度的优化。使用 `let`/`const` 带来的逻辑清晰度和安全性收益远大于任何理论上的性能损耗。

### 4.5 作用域是静态的，`this` 是动态的

```js
const obj = {
  value: 'inner',
  getValue() {
    return this.value
  },
}

obj.getValue() // 'inner' —— this 指向 obj
const fn = obj.getValue
fn() // 非严格模式返回 undefined（this 是全局对象，其上没有 value）；严格模式下 this 为 undefined，报 TypeError
```

变量 `value` 的查找是词法的（静态），但 `this` 的指向取决于**调用方式**（动态）。把方法单独取出调用时，`this` 不再指向 `obj`。
