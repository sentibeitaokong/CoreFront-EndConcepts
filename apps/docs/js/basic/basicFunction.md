---
outline: [2, 3]
---

# 函数基础 (Function)

函数是 JavaScript 中可重复使用的代码块，函数也是 JS 的一等公民，深入理解函数是掌握 [闭包](/js/basic/closure) 与 [`this`](/js/basic/this) 的前提。

## 1. 如何定义一个函数

### 1.1 函数声明 (Function Declaration)

- **API 结构**：`function functionName(parameter1, parameter2) { ... }`
- **特点**： 会受到**函数提升 (Hoisting)**。这意味着你可以在代码的任何地方调用它，即使在声明它之前。

```js
// 调用函数
let greeting = greet('Alice')
console.log(greeting) // "Hello, Alice!"

// 声明函数
function greet(name) {
  return `Hello, ${name}!`
}
```

### 1.2 函数表达式 (Function Expression)

- **API 结构**：`const variableName = function(parameter1, ...) { ... };`
- **特点**：**不会被提升**。你必须在赋值之后才能调用它，函数本身可以是匿名的（没有名字）。

```js
// console.log(add(5, 10)); // TypeError: add is not a function (或 ReferenceError)

const add = function (a, b) {
  return a + b
}

let result = add(5, 10)
console.log(result) // 15
```

### 1.3 箭头函数 (Arrow Function) — ES6+

- **API 结构**：`const variableName = (parameter1, ...) => { ... };`
- **特点**：它没有自己的 `this`，`this` 继承自外层作用域（词法绑定），详见 [this 全面解析](/js/basic/this)。
- **语法简化规则**： 如果函数体只有一行 `return` 语句，可以省略花括号 `{}` 和 `return` 关键字，如果只有一个参数，可以省略参数外面的圆括号 `()`。

```js
// 传统函数表达式
const square_old = function (x) {
  return x * x
}

// 箭头函数 (更简洁)
const square_new = x => x * x

console.log(square_new(9)) // 81
```

> [!TIP] 声明方式与提升
> 三种定义方式的**提升**行为不同：函数声明整体提升，函数表达式/箭头函数只提升变量名（`let`/`const` 进入 TDZ）。与 `var`/`let`/`const` 的提升规则一致，详见 [var、let、const 命令](/js/basic/variablesDeclare)。

## 2. 函数的输入与输出

### 2.1 形参 (Parameters) vs 实参 (Arguments)

- **形参 (Parameters)**：在**定义函数时**列出的变量名，它们是函数内部的占位符。
- **实参 (Arguments)**：在**调用函数时**传入的真实值。

```js
// 'a' 和 'b' 是形参 (Parameters)
function multiply(a, b) {
  return a * b
}

// 5 和 10 是实参 (Arguments)
multiply(5, 10)
```

### 2.2 默认参数 (Default Parameters)

如果调用函数时没有提供某个实参，可以给它指定一个默认值。

- **API 结构**：`function(parameter = defaultValue) { ... }`

```js
function createAccount(username, theme = 'light') {
  console.log(`Creating account for ${username} with ${theme} theme.`)
}

createAccount('Bob') // "Creating account for Bob with light theme."
createAccount('Charlie', 'dark') // "Creating account for Charlie with dark theme."
```

### 2.3 `return` 语句 (返回值)

`return` 关键字用于指定函数的输出。

- **特点**：
  - 一个函数只能有一个 `return` 值（但这个值可以是数组或对象）。
  - `return` 语句会立即**终止**函数的执行。
  - 如果一个函数**没有 `return` 语句**，它会默认返回 `undefined`。

```js
function checkAge(age) {
  if (age < 18) {
    return 'Too young' // 满足条件，立即返回并终止
  }
  return 'Old enough'
}

function doNothing() {
  let x = 10
  // 没有 return 语句
}
console.log(doNothing()) // undefined
```

### 2.4 `arguments` 对象与 `rest` 参数

普通函数内部有一个类数组对象 `arguments`，保存所有传入的实参；ES6 的 `rest` 参数则把剩余实参收集成一个**真正的数组**。

```js
// 使用 arguments（类数组对象，无数组方法）
function sumArguments() {
  let total = 0
  for (let i = 0; i < arguments.length; i++) {
    total += arguments[i]
  }
  return total
}
console.log(sumArguments(1, 2, 3)) // 6

// 使用 rest 参数（真正的数组）
function sumRest(...nums) {
  return nums.reduce((acc, n) => acc + n, 0)
}
console.log(sumRest(1, 2, 3, 4)) // 10
```

> [!NOTE] arguments 与箭头函数
> 箭头函数**没有**自己的 `arguments`，它会沿作用域链向上查找外层函数的 `arguments`。需要在箭头函数中收集参数时，请使用 `rest` 参数。

## 3. 函数参数传递

### 3.1 按值传递 (Pass by Value)

这个概念适用于**原始数据类型**（Primitive Types），例如：`String`、`Number`、`Boolean`、`null`、`undefined`、`Symbol`。

当一个原始类型的值作为参数传递给函数时，函数内部的参数会得到这个值的一个完整副本。在函数内部对这个参数做的任何修改，都**不会**影响到函数外部的原始变量。

```js
function changeValue(num) {
  num = 100
  console.log('函数内部的值: ', num) // 输出 100
}

let myNumber = 50
console.log('函数调用前: ', myNumber) // 输出 50

changeValue(myNumber)

console.log('函数调用后: ', myNumber) // 仍然输出 50
```

### 3.2 按共享传递 (Pass by Sharing)

这个概念适用于**引用数据类型**（Reference Types），例如：`Object`、`Array`、`Function`。

当一个对象（或数组等）作为参数传递时，传递的**值**是这个对象在内存中的**引用地址**（可以理解为指针）的一个副本。

- 函数内部的参数和外部的变量指向的是**同一个**内存地址。
- 如果在函数内部**修改**这个对象的属性，由于大家指向同一个对象，外部的变量也会反映出这个变化。
- 但如果在函数内部给参数**重新赋值**一个全新的对象，参数就会指向一个新的内存地址，从而与外部变量断开连接。

#### 3.2.1 修改对象属性

```js
function setAge(person) {
  person.age = 30
  console.log('函数内部的对象: ', person)
}

let myFriend = { name: '张三', age: 25 }
console.log('函数调用前: ', myFriend) // { name: '张三', age: 25 }

setAge(myFriend)

console.log('函数调用后: ', myFriend) // { name: '张三', age: 30 }
```

函数内部对 `person.age` 的修改，影响了函数外部的 `myFriend` 对象。

#### 3.2.2 重新赋值对象

```js
function reassignObject(person) {
  person = { name: '李四', age: 40 }
  console.log('函数内部(重新赋值后): ', person)
}

let myFriend = { name: '张三', age: 25 }
console.log('函数调用前: ', myFriend) // { name: '张三', age: 25 }

reassignObject(myFriend)

console.log('函数调用后: ', myFriend) // 仍然是 { name: '张三', age: 25 }
```

当 `person = { ... }` 执行时，`person` 参数只是被赋予了一个新的引用地址，`myFriend` 仍指向最初的对象，因此它的值没有改变。

#### 3.3.3 **总结**

[width(13,15,72)]

| 数据类型     | 传递方式   | 描述                                                                                                       |
| :----------- | :--------- | :--------------------------------------------------------------------------------------------------------- |
| **原始类型** | 按值传递   | 函数得到的是值的副本，内外变量完全独立。                                                                   |
| **引用类型** | 按共享传递 | 函数得到的是引用地址的副本，内外变量指向同一个对象。修改对象**内部属性**会互相影响，但**重新赋值**则不会。 |

## 4. 常见问题与陷阱 (FAQ for Beginners)

### 4.1 为什么我的函数返回 `undefined`？

```js
// 错误示例
function getFullName(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`
  // 忘记 return 了！
}

let name = getFullName('John', 'Doe')
console.log(name) // undefined

// 正确示例
function getFullName_fixed(firstName, lastName) {
  const fullName = `${firstName} ${lastName}`
  return fullName // 必须 return
}
```

### 4.2 函数声明 vs 函数表达式 (Hoisting)

```js
// 函数声明: Hoisting ✅
sayHello() // "Hello!"
function sayHello() {
  console.log('Hello!')
}

// 函数表达式: No Hoisting ❌
// sayGoodbye(); // TypeError: sayGoodbye is not a function
const sayGoodbye = function () {
  console.log('Goodbye!')
}
sayGoodbye() // 必须在赋值后调用
```

**建议**：为了代码的可读性和一致性，养成“**先声明/定义，后使用**”的好习惯。

### 4.3 箭头函数 vs 普通函数 (基础 `this` 问题)

普通函数有自己的 `this`，其指向在调用时确定。箭头函数没有自己的 `this`，它会“**借用**”外层作用域的 `this`。

```js
const myObject = {
  name: 'My Object',

  // 普通函数作为回调
  startTimeout_old: function () {
    setTimeout(function () {
      // 这里的 this 指向 window，而不是 myObject！
      console.log(`[Old] Name: ${this.name}`)
    }, 1000)
  },

  // 箭头函数作为回调
  startTimeout_new: function () {
    setTimeout(() => {
      // 箭头函数“借用”了外层 startTimeout_new 的 this，即 myObject
      console.log(`[New] Name: ${this.name}`)
    }, 1000)
  },
}

myObject.startTimeout_old() // [Old] Name: undefined (或 window 的 name)
myObject.startTimeout_new() // [New] Name: My Object
```

**结论**：在对象的方法内部，如果需要使用回调函数（如 `setTimeout`、数组方法等），**箭头函数是避免 `this` 指向错误的最佳选择**。完整的 `this` 绑定规则见 [this 全面解析](/js/basic/this)。

### 4.4 参数数量不匹配

JavaScript 不会因为参数数量不对而报错。

```js
function logThree(a, b, c) {
  console.log(a, b, c)
}

logThree(1, 2, 3) // 1 2 3
logThree(1, 2) // 1 2 undefined (c 是 undefined)
logThree(1, 2, 3, 4) // 1 2 3 (多余的 4 被忽略)
```
