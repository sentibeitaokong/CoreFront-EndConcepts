# JavaScript **函数基础**
函数是 JavaScript 中可重复使用的代码块。你可以把它想象成一个“配方”，它接受一些“原料”（参数），经过一系列“步骤”（代码），然后产出一个“菜肴”（返回值）。

## **1. 如何定义一个函数**

### **1.1 函数声明 (Function Declaration)**

*   **API 结构**: `function functionName(parameter1, parameter2) { ... }`
*   **特点**:
    *   会受到**函数提升 (Hoisting)**。这意味着你可以在代码的任何地方调用它，即使在声明它之前。
*   **示例**:
    ```js
    // 调用函数
    let greeting = greet("Alice");
    console.log(greeting); // "Hello, Alice!"

    // 声明函数
    function greet(name) {
      return `Hello, ${name}!`;
    }
    ```

### **1.2 函数表达式 (Function Expression)**

*   **API 结构**: `const variableName = function(parameter1, ...) { ... };`
*   **特点**:
    *   **不会被提升**。你必须在赋值之后才能调用它。
    *   函数本身可以是匿名的（没有名字）。
*   **示例**:
    ```js
    // console.log(add(5, 10)); // TypeError: add is not a function (或 ReferenceError)

    const add = function(a, b) {
      return a + b;
    };

    let result = add(5, 10);
    console.log(result); // 15
    ```

### **1.3 箭头函数 (Arrow Function) - (ES6+)**

*   **API 结构**: `const variableName = (parameter1, ...) => { ... };`
*   **特点**:
    *   语法更短。
    *   **重要**: 它没有自己的 `this`。
*   **语法简化规则**:
    1.  如果函数体只有一行 `return` 语句，可以省略花括号 `{}` 和 `return` 关键字。
    2.  如果只有一个参数，可以省略参数外面的圆括号 `()`。

*   **示例**:
    ```js
    // 传统函数表达式
    const square_old = function(x) {
      return x * x;
    };

    // 箭头函数 (更简洁)
    const square_new = x => x * x;

    console.log(square_new(9)); // 81
    ```

## **2. 函数的输入与输出**

### **2.1 形参 (Parameters) vs. 实参 (Arguments)**

*   **形参 (Parameters)**: 在**定义函数时**列出的变量名，它们是函数内部的占位符。
*   **实参 (Arguments)**: 在**调用函数时**传入的真实值。

```js
// 'a' 和 'b' 形参 (Parameters)
function multiply(a, b) {
  return a * b;
}

// 5 和 10 是实参 (Arguments)
multiply(5, 10);
```

### **2.2 默认参数 (Default Parameters)**

如果调用函数时没有提供某个实参，可以给它指定一个默认值。

*   **API 结构**: `function(parameter = defaultValue) { ... }`
*   **示例**:
    ```js
    function createAccount(username, theme = "light") {
      console.log(`Creating account for ${username} with ${theme} theme.`);
    }

    createAccount("Bob"); // "Creating account for Bob with light theme."
    createAccount("Charlie", "dark"); // "Creating account for Charlie with dark theme."
    ```

### **2.3 `return` 语句 (返回值)**

`return` 关键字用于指定函数的输出。

*   **特点**:
    *   一个函数只能有一个 `return` 值（但这个值可以是数组或对象）。
    *   `return` 语句会立即**终止**函数的执行。
    *   如果一个函数**没有 `return` 语句**，它会默认返回 `undefined`。

*   **示例**:
    ```js
    function checkAge(age) {
      if (age < 18) {
        return "Too young"; // 满足条件，立即返回并终止
      }
      return "Old enough";
    }

    function doNothing() {
      let x = 10;
      // 没有 return 语句
    }
    console.log(doNothing()); // undefined
    ```

## **3. 常见问题与陷阱 (FAQ for Beginners)**

### **Q1: 为什么我的函数返回 `undefined`？**

这是初学者最常见的问题。

```js
// 错误示例
function getFullName(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`;
  // 忘记 return 了！
}

let name = getFullName("John", "Doe");
console.log(name); // undefined

// 正确示例
function getFullName_fixed(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`;
  return fullName; // 必须 return
}
```

### **Q2: 函数声明 vs. 函数表达式 (Hoisting)**

```js
// 函数声明: Hoisting ✅
sayHello(); // "Hello!"
function sayHello() {
  console.log("Hello!");
}

// 函数表达式: No Hoisting ❌
// sayGoodbye(); // TypeError: sayGoodbye is not a function
const sayGoodbye = function() {
  console.log("Goodbye!");
};
sayGoodbye(); // 必须在赋值后调用
```
**建议**: 为了代码的可读性和一致性，养成“先声明/定义，后使用”的好习惯。

### **Q3: 箭头函数 vs. 普通函数 (基础 `this` 问题)**

普通函数有自己的 `this`，其指向在调用时确定。箭头函数没有自己的 `this`，它会“借用”外层作用域的 `this`。

**一个经典的例子：**

```js
const myObject = {
  name: 'My Object',
  
  // 普通函数作为回调
  startTimeout_old: function() {
    setTimeout(function() {
      // 这里的 this 指向 window，而不是 myObject！
      console.log(`[Old] Name: ${this.name}`); 
    }, 1000);
  },

  // 箭头函数作为回调
  startTimeout_new: function() {
    setTimeout(() => {
      // 箭头函数“借用”了外层 startTimeout_new 的 this，即 myObject
      console.log(`[New] Name: ${this.name}`);
    }, 1000);
  }
};

myObject.startTimeout_old(); // [Old] Name: undefined (或 window 的 name)
myObject.startTimeout_new(); // [New] Name: My Object
```
**结论**: 在对象的方法内部，如果需要使用回调函数（如 `setTimeout`, 数组方法等），**箭头函数是避免 `this` 指向错误的最佳选择**。

### **Q4: 参数数量不匹配**

JavaScript 不会因为参数数量不对而报错。

```js
function logThree(a, b, c) {
  console.log(a, b, c);
}

logThree(1, 2, 3);    // 1 2 3
logThree(1, 2);       // 1 2 undefined (c 是 undefined)
logThree(1, 2, 3, 4); // 1 2 3 (多余的 4 被忽略)
```