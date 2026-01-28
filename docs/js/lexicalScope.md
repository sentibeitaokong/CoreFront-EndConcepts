# 作用域 (Scope)

简单来说，作用域回答了编译器的一个问题：“**我该去哪里找这个变量？**”

## 1. 作用域的类型
    
在现代 JavaScript (ES6+) 中，主要有三种作用域：

### 1.1 全局作用域 (Global Scope)
*   **定义**：在所有函数和代码块之外声明的变量。
*   **生命周期**：伴随页面的生命周期，页面关闭才销毁。
*   **访问性**：在代码的任何地方都能访问。
*   **风险**：容易造成**命名冲突**（变量污染）。

```js
const globalVar = "I am global";

function check() {
  console.log(globalVar); // ✅ 可以访问
}
```

### 1.2 函数作用域 (Function Scope)
*   **定义**：在函数内部声明的变量。
*   **访问性**：只能在该函数内部访问，外部无法“看见”。
*   **关键字**：`var`, `let`, `const` 在函数内声明都遵循此规则。

```js
function myFunction() {
  var secret = "123";
  console.log(secret); // ✅ 内部可访问
}

console.log(secret); // ❌ 报错: ReferenceError
```

### 1.3 块级作用域 (Block Scope) - ES6 新增
*   **定义**：由花括号 `{}` 包裹的代码块（如 `if`, `for`, `switch` 语句）。
*   **关键点**：只有 `let` 和 `const` 遵循块级作用域，`var` **不遵循**（会穿透）。

```js
if (true) {
  let blockLet = "Locked";
  var blockVar = "Leaked";
}

console.log(blockVar); // ✅ 输出 "Leaked" (var 穿透了)
console.log(blockLet); // ❌ 报错: ReferenceError (let 被锁住了)
```

## 2. 核心机制

### 2.1 词法作用域 (Lexical Scope)
JavaScript 采用的是**词法作用域**（也叫静态作用域）。
这意味着：**函数的作用域在函数定义的时候就决定了，而不是在调用的时候决定。**

无论函数在哪里被调用，它总是查找它**写代码时**所在位置的上层作用域。

```js
let value = 1;

function foo() {
  console.log(value);
}

function bar() {
  let value = 2;
  foo(); // 在这里调用 foo
}

bar(); // 输出: 1
// 原因：foo 定义在全局，它的上级是全局作用域（value=1），而不是 bar 的作用域。
```

### 2.2 作用域链 (Scope Chain)
当代码使用一个变量时，JS 引擎会遵循“**就近原则**”进行查找，形成一条链：

1.  **当前作用域**：先看当前函数/块里有没有声明这个变量？
    *   有 → 使用它。
    *   没有 → **向上**一级作用域查找。
2.  **父级作用域**：重复上述过程。
3.  **全局作用域**：如果是最后一级还没找到。
    *   非严格模式 → 可能会隐式创建全局变量（如果是赋值操作）。
    *   严格模式/取值操作 → 抛出 `ReferenceError`。

**图解链条**： `Inner Function` -> `Outer Function` -> `Global` -> `Error`

### 2.3 作用域的高级应用——闭包 (Closure)

**定义**：当一个函数能够记住并访问它的**词法作用域**，即使这个函数在它的词法作用域之外执行时，就产生了闭包。

```js
function createCounter() {
  let count = 0; // 这个变量被“封闭”在闭包里
  
  return function() {
    count++;
    console.log(count);
  };
}

const myCounter = createCounter(); // createCounter 执行完毕，本该销毁 count
myCounter(); // 1 - 但 myCounter 依然持有对 count 的引用
myCounter(); // 2
```
*   **原理**：`myCounter` 依然保留着 `createCounter` 作用域的引用（背包），所以 `count` 不会被垃圾回收。

## 3. 常见问题 (FAQ)

### Q1: 什么是“变量遮蔽” (Variable Shadowing)？
**答**：当内部作用域声明了与外部作用域同名的变量时，内部变量会“遮盖”外部变量。在内部无法直接访问那个被遮盖的外部变量。

```js
let name = "Outer";

function show() {
  let name = "Inner"; // 遮蔽了外部的 name
  console.log(name);  // "Inner"
}
```

### Q2: 为什么很多人说 JavaScript 没有动态作用域？
**答**：动态作用域是指变量取决于函数**在哪里调用**。Bash 脚本就是动态作用域。而 JS 是词法作用域（取决于**在哪里定义**）。这也是 `this` 关键字经常让人困惑的原因——**作用域是静态的，但 `this` 的指向是动态的**。

### Q3: 为什么不推荐使用全局变量？
**答**：
1.  **命名冲突**：第三方库或同事的代码可能使用了相同的变量名，导致互相覆盖。
2.  **调试困难**：任何代码都能修改全局变量，很难追踪是谁改坏了数据。
3.  **内存泄漏**：全局变量一直存在，直到页面关闭才释放。

### Q4: 块级作用域对性能有影响吗？
**答**：微乎其微。现代 JS 引擎（如 V8）对作用域查找进行了极度的优化。使用 `let`/`const` 带来的逻辑清晰度和安全性收益远大于任何理论上的性能损耗。

### Q5: 面试题：作用域链查找
```js
var a = 10;
function test() {
  console.log(a); 
  var a = 20;
}
test();
```
**输出**：`undefined`
**解析**：
1.  函数 `test` 内部声明了 `var a`。
2.  由于**变量提升**，`var a` 被提到了函数顶部，但赋值留在原地。
3.  代码实际变成了：
    ```js
    function test() {
      var a; // undefined
      console.log(a);
      a = 20;
    }
    ```
4.  查找 `a` 时，在当前函数作用域找到了（值为 undefined），所以不会去全局查找 10。