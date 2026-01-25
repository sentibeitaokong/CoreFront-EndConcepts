# 执行上下文 (Execution Context) 和 执行栈 (Execution Stack / Call Stack)

## 1. 执行上下文 (Execution Context)

执行上下文是 JavaScript代码解析和执行的环境。每当 JS 代码运行的时候，它都是在某个执行上下文中运行的。

#### 1.1 上下文的类型

主要有三种类型：

1.  **全局执行上下文 (Global Execution Context - GEC)**
    *   这是默认的、最基础的上下文。
    *   任何不在函数内部的代码都在这里。
    *   它会做两件事：创建一个全局对象（浏览器中是 `window`，Node.js 中是 `global`），并将 `this` 指向这个全局对象。
    *   一个程序中**只有一个**全局执行上下文。

2.  **函数执行上下文 (Function Execution Context - FEC)**
    *   每当**调用**一个函数时，都会为该函数创建一个新的上下文。
    *   每个函数都有自己的上下文，但只有在**被调用**时才会被创建。
    *   可以有无数个。

3.  **Eval 函数执行上下文**
    *   执行在 `eval` 函数内部的代码会有属于它自己的上下文（一般不推荐使用，略过）。

### 1.2 生命周期：创建与执行

这是理解 JS "诡异"行为（如提升）的关键。执行上下文有两个阶段：
> [!IMPORTANT] 
>#### 第一阶段：创建阶段 (Creation Phase)俗称`预编译`
>在代码执行之前，JS 引擎会扫描代码并设置环境：
>1.  **确定 `this` 的值** (Binding `this`)。
>2.  **创建词法环境 (Lexical Environment)**：
>    *   **存储`let/const`变量和函数声明**：
>      *   **函数声明**：会被完整地存储在内存中（完全提升）。
>      *   **`let/const`变量**：会被“创建”但**未初始化**（进入暂时性死区 TDZ）。
>3.  **创建VariableEnvironment(变量环境)并建立作用域链 (Scope Chain)**：连接当前环境和父级环境，用于查找变量。
>    *   **`var`变量**：会被初始化为 `undefined`（变量提升）。



```markdown
ExecutionContext = {  
  ThisBinding = <this value>,     // 确定this 
  LexicalEnvironment = { ... },   // 词法环境
  VariableEnvironment = { ... },  // 变量环境
}
```

##### **This Binding**

*   在 **全局** 执行上下文中，`this` 的值指向全局对象，在浏览器中 `this` 的值指向 `window` 对象，而在 `nodejs` 中指向这个文件的 `module` 对象。
*   在 **函数** 执行上下文中，`this` 的值取决于函数的调用方式。具体有：默认绑定、隐式绑定、显式绑定（硬绑定）、`new` 绑定、箭头函数，具体内容会在【this全面解析】部分详解。

##### **词法环境（Lexical Environment）**

词法环境有两个**组成部分**：

1.  **环境记录**：存储变量和函数声明的实际位置。
2.  **对外部环境的引用**：可以访问其外部词法环境。

词法环境有两种**类型**：

1.  **全局环境**：是一个没有外部环境的词法环境，其外部环境引用为 **null**。它拥有一个全局对象（window 对象）及其关联的方法和属性（例如数组方法）以及任何用户自定义的全局变量，`this` 的值指向这个全局对象。
2.  **函数环境**：用户在函数中定义的变量被存储在**环境记录**中，包含了 `arguments` 对象。对外部环境的引用可以是全局环境，也可以是包含内部函数的外部函数环境。

```javascript
GlobalExectionContext = { // 全局执行上下文
  LexicalEnvironment: {    	  // 词法环境
    EnvironmentRecord: {   		// 环境记录
      Type: "Object",      		   // 全局环境
      // 标识符绑定在这里 
      outer: <null>  	   		   // 对外部环境的引用
    }
  }  
}

FunctionExectionContext = { // 函数执行上下文
  LexicalEnvironment: {  	  // 词法环境
    EnvironmentRecord: {  		// 环境记录
      Type: "Declarative",  	   // 函数环境
      // 标识符绑定在这里 			  
      outer: <Global or outer function environment reference>  // 对外部环境的引用
    }  
  }
}
```

#####  **变量环境**

变量环境也是一个词法环境，因此它具有上面定义的词法环境的所有属性。在 ES6 中，**词法** 环境和 **变量** 环境的区别在于前者用于存储 **函数声明和变量（`let` 和 `const`）** 绑定，而后者仅用于存储 **变量（`var`）** 绑定。


**变量提升**的原因：在创建阶段，函数声明存储在环境中，而变量会被设置为 `undefined`（在 `var` 的情况下）或保持未初始化（在 `let` 和 `const` 的情况下）。所以这就是为什么可以在声明之前访问 `var` 定义的变量（尽管是 `undefined`），但如果在声明之前访问 `let` 和 `const` 定义的变量就会提示引用错误的原因。这就是所谓的变量提升。
> [!IMPORTANT]
>#### **第二阶段：执行阶段 (Execution Phase)**
>1.  **代码从上到下逐行执行。**
>2.  **为变量赋值（将 `undefined` 替换为真实值）。**
>3.  **执行函数调用。**

### 1.3 内部结构演进：ES3 vs ES6+
为了彻底理解，我们需要对比旧标准（解释了 AO/VO）和新标准（解释了 `let`/`const` 块级作用域）。


####  1.3.1 ES3 标准（经典模型）
VO/AO 模型。

![Logo](/VO.png)

| 概念 | 全称   | 作用范围 | 何时创建   | 包含内容                          |
|----|------|------|--------|-------------------------------|
| VO | 变量对象 | 统称   | -      | 变量声明、函数声明                     |
| GO | 全局对象 | 全局   | 浏览器加载时 | 全局变量、内置对象(Date, Math...)、函数声明 |
| AO | 活动对象 | 函数内部 | 函数被调用时 | arguments、形参、局部变量、内部函数声明      |

```javascript
ExecutionContext = {
    scopeChain: { ... }, // 作用域链
    variableObject: { ... }, // VO/AO (变量、函数声明、arguments)
    this: { ... }
}
```

#### 1.3.2 ES6+ 标准（现代模型）
在 ES6 中，VO/AO 的概念被 **词法环境 (Lexical Environment)** 替代。这是为了支持 `let` 和 `const` 的块级作用域。

新的执行上下文结构如下：

```js
ExecutionContext = {
    // 1. 词法环境：处理 let, const, 函数声明
    LexicalEnvironment: {
        EnvironmentRecord: { ... }, // 存储变量的具体地方
        outer: <Reference to outer env> // 指向父级作用域（作用域链）
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

## 2. 执行栈 (Execution Stack / Call Stack)

执行栈（也叫调用栈）是一个 **LIFO (后进先出)** 的数据结构，用于存储代码运行时创建的所有执行上下文。

### 2.1 运行流程

1.  **初始化**：JS 引擎开始解析脚本时，首先创建一个**全局执行上下文**并推入栈底。
2.  **函数调用**：每当引擎发现一个函数调用，它会为该函数创建一个新的**函数执行上下文**，并将其**推入 (Push)** 栈顶。
3.  **执行栈顶**：JS 引擎总是执行栈顶的上下文。
4.  **函数返回**：当函数执行完毕（遇到 `return` 或代码结束），该上下文从栈中**弹出 (Pop)**，控制权交还给下一个上下文（即之前的栈顶）。

### 2.2 图解示例

```javascript
let a = 'Hello World!';

function first() {
  console.log('Inside first function');
  second(); // 调用 second
  console.log('Again inside first function');
}

function second() {
  console.log('Inside second function');
}

first(); // 调用 first
console.log('Inside Global Execution Context');

// Inside first function
// Inside second function
// Again inside first function
// Inside Global Execution Context
```

**栈的变化过程：**

1.  **Start**: `[ Global Exec Context ]` (栈底)
2.  **调用 first()**: `[ Global EC, first EC ]` (first 在栈顶，开始执行 first)
3.  **在 first 中调用 second()**: `[ Global EC, first EC, second EC ]` (暂停 first，开始执行 second)
4.  **second 执行完毕**: `[ Global EC, first EC ]` (second 弹出，继续执行 first)
5.  **first 执行完毕**: `[ Global EC ]` (first 弹出，继续执行 Global)
6.  **End**: 程序结束，全局上下文销毁（页面关闭时）。

## 3.综合案例
让我们通过一段代码，结合调用栈和ES6 结构来模拟整个过程：
```js
let a = 20;
const b = 30;
var c;

function multiply(e, f) {
 var g = 20;
 return e * f * g;
}

c = multiply(20, 30);

```
#### 3.1 全局执行上下文 (GEC) 创建阶段
**ES3:**
```markdown
GO:{
    a:<uninitialized>,    // 暂时性死区
    b:<uninitialized>,    // 暂时性死区
    c:undefined,
    multiply:function(){}
}
```

**ES6+:**
```javascript
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

#### 3.2 全局执行上下文 (GEC) 执行阶段

**ES3:**
```markdown
GO:{
    a:20,
    b:30,
    c:undefined,
    multiply(20, 30),
}
```

**ES6+:**

代码逐行执行：
*   `a` 赋值为 20。
*   `b` 赋值为 30。
*   `c` 此时还是 `undefined`。
*   遇到 `multiply(20, 30)` 调用 -> **创建函数执行上下文**。


#### 3.3 函数执行上下文 (FEC) 创建阶段

**ES3:**
```markdown
GO:{
    g:undefined,
    e:20,
    f:30,
}
```

**ES6+:**

```javascript
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

#### 3.4 函数执行上下文 (FEC) 执行阶段
*   `g` 被赋值为 20。
*   计算 `e * f * g`。
*   返回结果。
*   **FEC 出栈销毁**。

#### 3.5 回到全局
*   `c` 接收返回值。
*   程序结束。

## 4.其他示例

### 4.1 变量提升

```js
foo;  // undefined
var foo = function () {
    console.log('foo1');
}

foo();  // foo1，foo赋值

var foo = function () {
    console.log('foo2');
}

foo(); // foo2，foo重新赋值
```

### 4.2 函数提升

```js
foo();  // foo2
function foo() {
    console.log('foo1');
}

foo();  // foo2

function foo() {
    console.log('foo2');
}

foo(); // foo2
```

### 4.3 声明优先级，函数 > 变量
```js
foo();  // foo2
var foo = function() {
    console.log('foo1');
}

foo();  // foo1，foo重新赋值

function foo() {
    console.log('foo2');
}

foo(); // foo1
```

## 5. 常见问题与面试题 (FAQ)

### Q1: 栈溢出 (Stack Overflow) 是什么？
**答**：当执行栈被推入过多的执行上下文，超过了浏览器/引擎允许的最大容量时，就会报错 `RangeError: Maximum call stack size exceeded`。

**常见原因**：递归函数没有终止条件。

```javascript
function recursive() {
    recursive(); // 无限递归
}
recursive(); // 报错！
```

### Q2: 为什么 `var` 会声明提升，而赋值不提升？
**答**：这完全由**执行上下文的创建阶段**决定。
*   在**创建阶段**，引擎发现了 `var a`，于是给它在内存中占了个位，并赋值默认值 `undefined`。
*   赋值操作 `a = 10` 是在**执行阶段**才发生的。
    所以你在赋值前打印它，看到的是创建阶段的产物 `undefined`。

### Q3: 作用域链和执行栈有什么关系？
**答**：这是两个维度的概念，但经常混淆。
*   **执行栈**：决定了**代码执行的顺序**（谁调用的谁）。
*   **作用域链**：决定了**变量查找的权限**（从哪里找变量）。
*   **关键点**：作用域链是在**函数定义时**确定的（词法作用域），而不是在调用时确定的。即使函数 A 在函数 B 中被调用（在栈中 A 在 B 上面），A 查找变量时是去它的**定义位置**（父级作用域）找，而不是去 B 里面找。

### Q4: 闭包是如何“逃过”执行栈销毁的？
**答**：正常情况下，函数执行完，其上下文从栈中弹出，内存被回收。
但如果有闭包（内部函数引用了外部函数的变量），该外部函数的**词法环境 (Lexical Environment)** 会被保存在堆内存中，不会被垃圾回收机制（GC）立即回收。虽然执行上下文从栈中弹出了，但它的一部分“灵魂”（变量对象）留了下来供闭包使用。

### Q5: 代码演示上下文执行顺序
看下面代码，请问输出顺序是什么？

```javascript
console.log('1');

function foo() {
    console.log('2');
}

foo();

console.log('3');
```

**解析**：
1.  **创建阶段**：扫描到 `foo` 函数声明。
2.  **执行阶段**：
    *   `console.log('1')` -> 输出 '1'
    *   调用 `foo()` -> **压栈**
        *   `foo` 内部执行 -> 输出 '2'
        *   `foo` 执行完毕 -> **出栈**
    *   `console.log('3')` -> 输出 '3'

**结果**：1, 2, 3