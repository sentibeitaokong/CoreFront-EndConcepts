# js数据类型
ECMAScript 标准定义了 8 种数据类型，分为两大类：**原始类型（Primitive Types）** 和 **对象类型（Object Type）**。

*   **7 种原始类型**: `String`、`Number`、`BigInt`、`Boolean`、`Undefined`、`Null`、`Symbol`
*   **1 种对象类型**: `Object`

## 1. 原始类型 (Primitive Types)

原始类型是不可变的值，直接存储在语言的最底层。

#### 1. String (字符串)

*   **描述**: 用于表示文本数据，是由 16 位无符号整数值组成的序列，采用 UTF-16 编码。 字符串是不可变的，一旦创建，就无法修改。
*   **常见问题**:
    *   **"Stringly-typing"**: 避免使用字符串来表示复杂的数据结构（如用特殊字符分隔的列表）。这会增加不必要的维护成本，应使用数组或对象等更合适的抽象。
    *   **字符长度**: `length` 属性返回的是 UTF-16 码元的数量，可能不完全对应 Unicode 字符的实际数量（例如 emoji 表情）。
*   **示例**:
    ```js
    let name = "Gemini";
    let text = 'Hello, World!';
    let template = `My name is ${name}`;
    ```

#### 2. Number (数字)

*   **描述**: 采用双精度 64 位二进制格式（IEEE 754 标准）。 它可以表示整数和浮点数。
*   **常见问题**:
    *   **精度问题**: 由于采用浮点数表示，涉及小数的运算可能不精确。例如 `0.1 + 0.2` 并不严格等于 `0.3`。
    *   **安全整数范围**: js 只能安全地表示 `-(2^53 - 1)` 到 `2^53 - 1` 之间的整数。 超出这个范围的整数可能会失去精度。 可以使用 `Number.isSafeInteger()` 来检查。
    *   **特殊值**:
        *   `NaN` (Not a Number): 表示一个无法用数字表达的操作结果。一个特殊之处在于 `NaN` 不等于它自身 (`NaN !== NaN`)。
        *   `Infinity` 和 `-Infinity`: 表示正负无穷大。
*   **示例**:
    ```js
    let integer = 42;
    let float = 3.14;
    let notANumber = NaN;
    let infinity = Infinity;
    ```

#### 3. BigInt (大整数)

*   **描述**: 用于表示任意精度的整数，可以安全地存储和操作超出 `Number` 安全整数范围的大整数。 通过在整数末尾添加 `n` 或调用 `BigInt()` 函数创建。
*   **常见问题**:
    *   **类型混合**: 不能将 `BigInt` 和 `Number` 类型的值混合在算术表达式中，这会抛出 `TypeError`。
    *   **小数**: `BigInt` 无法表示小数。
*   **示例**:
    ```js
    const bigNumber = 9007199254740991n;
    const alsoBig = BigInt("12345678901234567890");
    ```

#### 4. Boolean (布尔)

*   **描述**: 表示逻辑实体，只有两个值：`true` 和 `false`。 常用于条件判断。
*   **常见问题**:
    *   **Truthy & Falsy**: 在需要布尔值的上下文中（如 `if` 语句），非布尔值会被隐式转换为布尔值。`false`、`0`、`""`、`null`、`undefined` 和 `NaN` 都会被转换为 `false`，其他所有值都被转换为 `true`。
*   **示例**:
    ```js
    let isTrue = true;
    let isFalse = false;
    ```

#### 5. Undefined

*   **描述**: 表示一个未被赋值的变量。 当一个变量被声明但没有初始化时，其默认值就是 `undefined`。
*   **常见问题**:
    *   **与 `null` 的区别**: `undefined` 通常表示“值的缺失”，是语言的默认行为。而 `null` 是开发者主动赋值，表示“对象的缺失”或“空值”。
    *   **非关键词**: `undefined` 是一个全局属性，而不是一个关键词。在现代 js 环境中虽然不能被重写，但在旧环境中可能存在被修改的风险。
*   **示例**:
    ```js
    let uninitialized; // 值为 undefined
    ```

#### 6. Null

*   **描述**: 表示一个“空”或“无”的值，由开发者主动赋值。 它是一个只有一个值 `null` 的原始类型。
*   **常见问题**:
    *   **`typeof null` 的结果**: `typeof null` 返回 `"object"`，这是一个历史遗留的 Bug。 因此，检查一个值是否为 `null` 时，应使用 `=== null`。
*   **示例**:
    ```js
    let emptyValue = null;
    ```

#### 7. Symbol (符号)

*   **描述**: `Symbol` 是唯一且不可变的值，主要用于创建唯一的对象属性键，以避免命名冲突。
*   **常见问题**:
    *   **非字符串**: `Symbol` 类型的值不能被自动转换为字符串，尝试拼接会抛出错误。
    *   **枚举**: 使用 `Symbol` 作为键的属性不会被 `for...in` 循环或 `Object.keys()` 枚举。需要使用 `Object.getOwnPropertySymbols()`。
*   **示例**:
    ```js
    const id = Symbol('unique id');
    const obj = {
      [id]: 123
    };
    ```


### 8. 对象类型 (Object Type)

*   **描述**: `Object` 是一个复杂的数据类型，用于存储键值对的集合。 数组、函数、日期等都是特殊的对象。
*   **常见问题**:
    *   **引用传递**: 对象的赋值是引用传递。当将一个对象赋给另一个变量时，两个变量指向同一个内存地址。修改其中一个会影响另一个。
    *   **`typeof` 的限制**: `typeof` 对所有对象类型（包括数组、null）都返回 `"object"`，无法进行细致区分。
*   **示例**:
    ```js
    const person = { firstName: "John", lastName: "Doe" };
    const fruits = ["Apple", "Banana", "Orange"];
    const today = new Date();
    ```
    
## 2. 数据类型鉴别方式

鉴别 js 中的数据类型有多种方法，每种方法都有其适用场景和局限性。

### 2.1 `typeof` 运算符

`typeof` 是最基础、最便捷的类型检测方式。它以字符串形式返回操作数的数据类型。

#### ✨ 用法

```javascript
typeof 42;          // "number"
typeof "hello";     // "string"
typeof true;        // "boolean"
typeof undefined;   // "undefined"
typeof Symbol("id"); // "symbol"
typeof 123n;        // "bigint"
typeof {};          // "object"
typeof [];          // "object"
typeof function(){}; // "function"
```

#### 🚨 常见问题与陷阱

`typeof` 虽然简单，但存在一些使其在某些场景下不可靠的“怪异”行为：

| 表达式 | 结果 | 原因/说明 |
| :--- | :--- | :--- |
| **`typeof null`** | **`"object"`** | 这是 JavaScript 历史上一个著名的 bug，并因历史原因被保留下来。`null` 应该被认为是其自身的原始类型。 |
| **`typeof []`** | **`"object"`** | `typeof` 无法区分数组、对象、RegExp 等，因为它们在底层都被视为对象。 |
| **`typeof new String("a")`** | **`"object"`** | 对于通过构造函数创建的包装对象，`typeof` 会返回 "object"，而不是其对应的原始类型。 |

#### ✅ 适用场景

*   **主要用于判断原始类型**（`string`, `number`, `boolean`, `undefined`, `symbol`, `bigint`）。
*   用于判断一个变量是否为 `function`。
*   **不适合**用来精确判断 `null` 或除 `function` 外的任何引用类型。

### 2.2  `instanceof` 运算符

`instanceof` 用于检测一个构造函数的 `prototype` 属性是否存在于某个实例对象的原型链上。简单来说，它回答的是：“这个对象是某个构造函数的实例吗？”

#### ✨ 用法

```javascript
const arr = [];
const obj = {};
const now = new Date();

arr instanceof Array;   // true
arr instanceof Object;  // true (因为 Array.prototype 继承自 Object.prototype)

obj instanceof Object;  // true
now instanceof Date;    // true
```

#### 🚨 常见问题与陷阱

| 问题 | 描述 |
| :--- | :--- |
| **对原始类型无效** | `instanceof` 只能用于对象，不能用于原始类型。`"hello" instanceof String` 的结果是 `false`。 |
| **多窗口/多框架问题** | 如果页面中有多个 `iframe` 或 `window`，每个执行环境都有自己的全局作用域和构造函数。在一个 `iframe` 中创建的数组，在另一个 `iframe` 中使用 `instanceof Array` 检测会返回 `false`，因为它们各自的 `Array` 构造函数不同。 |

#### ✅ 适用场景

*   判断一个对象是否是**某个特定类的实例**，或者是否在某条特定的原型链上。
*   适用于自定义类的实例判断。

### 2.3  `constructor` 属性

每个实例对象都有一个 `constructor` 属性，它指向创建该实例的构造函数。

#### ✨ 用法

```javascript
const num = 1;
const str = "hi";
const arr = [];

console.log(arr.constructor === Array);   // true
console.log(str.constructor === String);  // true
console.log(num.constructor === Number);  // true
```

#### 🚨 常见问题与陷阱

| 问题 | 描述 |
| :--- | :--- |
| **不稳定性** | `constructor` 属性是可以被轻易修改的。如果手动改变了一个对象的 `prototype.constructor`，那么检测结果将完全不可靠。 |
| **`null` 和 `undefined`** | `null` 和 `undefined` 没有 `constructor` 属性，直接访问会报错。 |

```javascript
function MyClass() {}
MyClass.prototype.constructor = Array; // 手动修改 constructor
const instance = new MyClass();

console.log(instance.constructor === Array); // true，但 instance 并非数组
```

#### ✅ 适用场景

*   在可以**确保 `constructor` 未被修改**的受控环境下，可以作为一种判断方式。
*   通常不推荐作为首选的类型判断方法，因为它不可靠。

### 2.4 `Object.prototype.toString.call()` (终极方案)

这是目前公认的**最准确、最可靠**的类型鉴别方法。`Object.prototype.toString()` 是一个原生方法，当用 `.call()` 或 `.apply()` 在不同类型的变量上调用时，它会返回一个统一格式的字符串：`"[object Type]"`，其中 `Type` 就是变量的精确类型。

#### ✨ 用法

```javascript
const toString = Object.prototype.toString;

toString.call(123);          // "[object Number]"
toString.call("abc");        // "[object String]"
toString.call(true);         // "[object Boolean]"
toString.call(undefined);    // "[object Undefined]"
toString.call(null);         // "[object Null]" (正确区分了 null)
toString.call([]);           // "[object Array]" (正确区分了数组)
toString.call({});           // "[object Object]"
toString.call(new Date());   // "[object Date]"
toString.call(/a/);          // "[object RegExp]"
toString.call(new Error());  // "[object Error]"
toString.call(window);       // "[object Window]" (在浏览器中)
```

#### 封装成一个通用的 `getType` 函数

为了方便使用，通常会将它封装成一个工具函数。

```javascript
function getType(value) {
    if (value === null) {
        return "null";
    }
    // 处理原始类型和函数
    const type = typeof value;
    if (type !== "object") {
        return type;
    }
    // 处理引用类型
    return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

console.log(getType(null));     // "null"
console.log(getType([]));       // "array"
console.log(getType(new Date())); // "date"
```

#### ✅ 适用场景

*   **任何需要精确判断数据类型的场景。**
*   能够区分普通对象 `Object`、数组 `Array`、`null` 以及其他所有内置对象类型。
*   能够跨 `iframe` 和 `window` 工作，不存在 `instanceof` 的问题。
*   是编写健壮的库和框架时的不二之选。

## 3.总结对比

| 方法 | 优点 | 缺点 | 推荐指数 |
| :--- | :--- | :--- | :--- |
| **`typeof`** | 简单快速，适合判断原始类型和 `function` | 无法区分 `null`、数组和对象 | ⭐⭐⭐ |
| **`instanceof`** | 能判断对象是否在某条原型链上，适合自定义类 | 对原始类型无效，有跨 `iframe` 问题 | ⭐⭐⭐⭐ |
| **`constructor`** | 语法直观 | 属性可被修改，不可靠 | ⭐⭐ |
| **`Object.prototype.toString.call()`** | **最准确、最可靠**，能区分所有类型，无兼容性问题 | 语法稍显繁琐，通常需要封装 | ⭐⭐⭐⭐⭐ |