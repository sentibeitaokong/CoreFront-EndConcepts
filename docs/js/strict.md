# JavaScript **严格模式 (Strict Mode)**

严格模式是 ES5 引入的一种 JavaScript 运行模式。它通过**消除一些不安全的特性**、**抛出以前静默失败的错误**、**修复一些 JS 引擎的怪异行为**，以及**禁用一些令人困惑的语法**，来使 JavaScript 代码的语义更加严格、清晰和可预测。

## **1. 什么是严格模式？**

严格模式 (`"use strict";`) 是一种限制性更强的 JavaScript 变体。它的主要目标包括：

1.  **消除 JavaScript 语言中一些不合理、不严谨的特性**：减少代码的错误率。
2.  **纠正 JavaScript 引擎的一些不安全操作**：例如，防止意外创建全局变量。
3.  **提高编译器效率**：允许 JS 引擎进行更多的优化，提升代码运行速度。
4.  **为未来 JavaScript 版本做好铺垫**：禁止一些未来可能成为关键字的标识符。

## **2. 如何启用严格模式？**

严格模式可以通过两种方式启用：

### **2.1 在全局作用域启用**

在整个脚本文件的**最顶部**添加 `"use strict";`。

*   **影响范围**: 整个脚本文件中的所有代码都将以严格模式运行。
*   **注意**: 如果将多个脚本文件打包合并，而其中一个文件未启用严格模式，可能会导致意外行为。因此，**不推荐在全局作用域启用严格模式**，除非你确保整个项目都以严格模式编写。

```js
// script.js
"use strict";
// 整个文件的代码都运行在严格模式下

function foo() {
  // ...
}
```

### **2.2 在函数作用域启用**

在函数体的**最顶部**添加 `"use strict";`。

*   **影响范围**: 只有该函数内部的代码以及该函数内部嵌套的函数（如果它们也未显式启用/禁用严格模式）会以严格模式运行。
*   **推荐**: 这是**更安全、更推荐**的启用方式，因为它将严格模式的影响范围限定在特定函数内，避免了与未严格模式代码的冲突。

```js
function myFunction() {
  "use strict";
  // myFunction 内部的代码运行在严格模式下
  // 嵌套函数也会继承严格模式，除非它自己禁用（不推荐）
  function nestedFunction() {
    // ...
  }
}

// 外部代码不受影响，运行在非严格模式下
```

## **3. 严格模式带来的主要变化**

严格模式通过引入或修改以下规则，改变了 JavaScript 的行为：

### **3.1 消除不安全的特性**

1.  **不允许使用 `with` 语句**: `with` 语句会创建自己的作用域，使得变量难以追溯，影响性能优化。
    ```js
    "use strict";
    // with ({a: 1}) { console.log(a); } // SyntaxError
    ```

2.  **不允许使用 `arguments.caller` 和 `arguments.callee`**: 这两个属性可以访问函数调用者和函数本身，但性能开销大，且容易导致安全性问题。

### **3.2 抛出以前静默失败的错误**

1.  **不允许意外创建全局变量**: 在非严格模式下，给一个未声明的变量赋值，会自动创建全局变量。严格模式下，这会抛出 `ReferenceError`。
    ```js
    "use strict";
    // x = 10; // ReferenceError: x is not defined
    ```

2.  **对只读属性赋值会抛出 `TypeError`**:
    *   给常量 (`const`) 赋值。
    *   给不可配置/不可写属性赋值。
    *   给 `getter` 属性赋值。
    ```js
    "use strict";
    const obj = {};
    Object.defineProperty(obj, 'prop', { value: 1, writable: false });
    // obj.prop = 2; // TypeError
    ```

3.  **对不可扩展对象添加属性会抛出 `TypeError`**:
    ```js
    "use strict";
    const obj = {};
    Object.preventExtensions(obj);
    // obj.newProp = 1; // TypeError
    ```

4.  **删除不可配置属性会抛出 `TypeError`**:
    ```js
    "use strict";
    // delete Object.prototype; // TypeError (在严格模式下)
    ```

### **3.3 修复一些 JS 引擎的怪异行为**

1.  **`this` 绑定**:
    *   **普通函数调用**: 在非严格模式下，独立函数调用（如 `myFunction()`）中的 `this` 默认指向**全局对象 (`window`)**。在严格模式下，`this` 会绑定到 `undefined`。
    *   **`call()`, `apply()`, `bind()`**: 如果 `thisArg` 为 `null` 或 `undefined`，`this` 将直接绑定到 `null` 或 `undefined`，而不是像非严格模式那样自动转换为全局对象。
    ```js
    function showThis() {
      "use strict";
      console.log(this);
    }
    showThis(); // undefined
    showThis.call(null); // null
    ```

2.  **`arguments` 对象的行为**:
    *   在非严格模式下，`arguments` 对象中的元素与函数的命名参数是**同步**的（修改 `arguments[i]` 会修改对应的参数，反之亦然）。
    *   在严格模式下，`arguments` 对象与命名参数**完全解耦**，互不影响。
    ```js
    function foo(a) {
      "use strict";
      a = 2;
      console.log(arguments[0]); // 1 (解耦)
    }
    foo(1);
    ```

3.  **函数参数名不能重复**:
    ```js
    "use strict";
    // function foo(a, a) { } // SyntaxError
    ```

### **3.4 禁用令人困惑的语法**

1.  **不允许使用八进制字面量**: `0123` (八进制) 会被视为错误。
    ```js
    "use strict";
    // const num = 0123; // SyntaxError
    ```

2.  **不允许将 `eval` 字符串中的变量引入到当前作用域**: `eval` 作用域独立。
    ```js
    "use strict";
    // eval("var x = 1;"); console.log(x); // ReferenceError
    ```

3.  **不允许将 `eval` 和 `arguments` 作为变量名或函数名**: 它们是关键字。

## **4. 常见问题与最佳实践 (FAQ)**

*   **Q1: 为什么推荐在函数内部启用严格模式，而不是全局？**
    *   因为全局启用严格模式会影响整个脚本文件的所有代码。如果你的项目依赖于一些旧的、非严格模式编写的第三方库，或者你的代码库中包含大量未兼容严格模式的旧代码，全局启用可能会导致这些代码出现意外错误。在函数内部启用可以**限定影响范围**，逐步改造。

*   **Q2: 严格模式对性能有提升吗？**
    *   **是的**。严格模式消除了 JavaScript 引擎的一些“怪异”和不确定行为（如 `with` 语句、`arguments` 的同步），这使得引擎可以进行更多的优化，从而在某些情况下提高代码的运行速度。

*   **Q3: 严格模式能阻止我意外使用 `var` 声明全局变量吗？**
    *   **不能**。`"use strict"; var x = 10;` 仍然会在当前作用域（函数或全局）声明 `x`。严格模式阻止的是**未声明直接赋值**导致的全局变量：`x = 10;`。

*   **Q4: ES6 Modules (import/export) 默认就是严格模式吗？**
    *   **是的**。ES Modules 模块内部的代码**默认自动运行在严格模式下**，无需手动添加 `"use strict";`。这是现代 JavaScript 开发的最佳实践，因为它从设计上就鼓励更严格、更清晰的代码。

*   **Q5: 严格模式会影响 `this` 在箭头函数中的行为吗？**
    *   **不会**。箭头函数的 `this` 绑定是**词法绑定**，它不依赖于函数的调用方式，也不受严格模式的影响。它总是捕获其定义时所在的词法作用域的 `this`。

*   **Q6: 严格模式能捕获所有错误吗？**
    *   **不能**。严格模式主要捕获那些在非严格模式下会被静默忽略或导致意外行为的特定类型错误。它并不能捕获所有的运行时错误（如 `ReferenceError`, `TypeError` 等），这些仍然需要 `try...catch` 或全局错误处理机制。

*   **Q7: 应该在新代码中始终使用严格模式吗？**
    *   **强烈推荐**。对于所有新的 JavaScript 代码，无论是浏览器前端还是 Node.js 后端，都应该默认使用严格模式。它提高了代码质量、减少了潜在错误，并使其更易于维护和优化。如果使用 ES Modules，你甚至不需要手动添加 `"use strict";`。

