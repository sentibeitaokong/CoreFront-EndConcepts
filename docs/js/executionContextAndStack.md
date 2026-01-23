# 执行上下文 (Execution Context) 和 执行栈 (Execution Stack / Call Stack)

## 1. 执行上下文 (Execution Context)

执行上下文是 JavaScript 代码被评估和执行的环境。每当 JS 代码运行的时候，它都是在某个执行上下文中运行的。

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

#### **第一阶段：创建阶段 (Creation Phase)**
在代码执行之前，JS 引擎会扫描代码并设置环境：
1.  **确定 `this` 的值** (Binding `this`)。
2.  **创建词法环境 (Lexical Environment)**：
    *   **存储变量和函数声明**：
    *   **函数声明**：会被完整地存储在内存中（完全提升）。
    *   **`var` 变量**：会被初始化为 `undefined`（变量提升）。
    *   **`let/const` 变量**：会被“创建”但**未初始化**（进入暂时性死区 TDZ）。
3.  **建立作用域链 (Scope Chain)**：连接当前环境和父级环境，用于查找变量。

#### **第二阶段：执行阶段 (Execution Phase)**
1.  **代码从上到下逐行执行。**
2.  **为变量赋值（将 `undefined` 替换为真实值）。**
3.  **执行函数调用。**

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
```

**栈的变化过程：**

1.  **Start**: `[ Global Exec Context ]` (栈底)
2.  **调用 first()**: `[ Global EC, first EC ]` (first 在栈顶，开始执行 first)
3.  **在 first 中调用 second()**: `[ Global EC, first EC, second EC ]` (暂停 first，开始执行 second)
4.  **second 执行完毕**: `[ Global EC, first EC ]` (second 弹出，继续执行 first)
5.  **first 执行完毕**: `[ Global EC ]` (first 弹出，继续执行 Global)
6.  **End**: 程序结束，全局上下文销毁（页面关闭时）。

## 3. 常见问题与面试题 (FAQ)

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