---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# javascript数据类型
ECMAScript 标准定义了 8 种数据类型，分为两大类：**原始类型（Primitive Types）** 和 **对象类型（Object Type）**。

*   **7 种原始类型**: `String`、`Number`、`BigInt`、`Boolean`、`Undefined`、`Null`、`Symbol`
*   **1 种对象类型**: `Object`

## 1. 原始类型 (Primitive Types)

原始类型是不可变的值，直接存储在语言的最底层。

### 1. String (字符串)

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

### 2. Number (数字)

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

### 3. BigInt (大整数)

*   **描述**: 用于表示任意精度的整数，可以安全地存储和操作超出 `Number` 安全整数范围的大整数。 通过在整数末尾添加 `n` 或调用 `BigInt()` 函数创建。
*   **常见问题**:
    *   **类型混合**: 不能将 `BigInt` 和 `Number` 类型的值混合在算术表达式中，这会抛出 `TypeError`。
    *   **小数**: `BigInt` 无法表示小数。
*   **示例**:
    ```js
    const bigNumber = 9007199254740991n;
    const alsoBig = BigInt("12345678901234567890");
    ```

### 4. Boolean (布尔)

*   **描述**: 表示逻辑实体，只有两个值：`true` 和 `false`。 常用于条件判断。
*   **常见问题**:
    *   **Truthy & Falsy**: 在需要布尔值的上下文中（如 `if` 语句），非布尔值会被隐式转换为布尔值。`false`、`0`、`""`、`null`、`undefined` 和 `NaN` 都会被转换为 `false`，其他所有值都被转换为 `true`。
*   **示例**:
    ```js
    let isTrue = true;
    let isFalse = false;
    ```

### 5. Undefined

*   **描述**: 表示一个未被赋值的变量。 当一个变量被声明但没有初始化时，其默认值就是 `undefined`。
*   **常见问题**:
    *   **与 `null` 的区别**: `undefined` 通常表示“值的缺失”，是语言的默认行为。而 `null` 是开发者主动赋值，表示“对象的缺失”或“空值”。
    *   **非关键词**: `undefined` 是一个全局属性，而不是一个关键词。在现代 js 环境中虽然不能被重写，但在旧环境中可能存在被修改的风险。
*   **示例**:
    ```js
    let uninitialized; // 值为 undefined
    ```

### 6. Null

*   **描述**: 表示一个“空”或“无”的值，由开发者主动赋值。 它是一个只有一个值 `null` 的原始类型。
*   **常见问题**:
    *   **`typeof null` 的结果**: `typeof null` 返回 `"object"`，这是一个历史遗留的 Bug。 因此，检查一个值是否为 `null` 时，应使用 `=== null`。
*   **示例**:
    ```js
    let emptyValue = null;
    ```

### 7. Symbol (符号)

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

```js
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

```js
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

```js
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

```js
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

```js
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

```js
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

### 2.5 总结对比

| 方法 | 优点 | 缺点 | 推荐指数 |
| :--- | :--- | :--- | :--- |
| **`typeof`** | 简单快速，适合判断原始类型和 `function` | 无法区分 `null`、数组和对象 | ⭐⭐⭐ |
| **`instanceof`** | 能判断对象是否在某条原型链上，适合自定义类 | 对原始类型无效，有跨 `iframe` 问题 | ⭐⭐⭐⭐ |
| **`constructor`** | 语法直观 | 属性可被修改，不可靠 | ⭐⭐ |
| **`Object.prototype.toString.call()`** | **最准确、最可靠**，能区分所有类型，无兼容性问题 | 语法稍显繁琐，通常需要封装 | ⭐⭐⭐⭐⭐ |

## 3. 数据类型转换
JavaScript 是一种**弱类型 (Weakly Typed)** 语言，这意味着变量的数据类型是可以随时改变的，且在不同类型的数据进行运算时，JS 引擎会自动进行隐式转换，掌握类型转换是避免“奇怪 Bug”和通过前端面试的关键。


### 3.1 转换的两种形式

1.  **显式转换 (Explicit)**：代码中明确写出了转换逻辑。
    *   例如：`Number("123")`, `String(123)`, `Boolean(1)`.
2.  **隐式转换 (Implicit)**：由运算符或语句触发，JS 引擎自动完成。
    *   例如：`"1" + 2` (变为字符串), `if (1)` (变为布尔), `1 == "1"` (比较时转换).

### 3.2 三大底层抽象操作

ECMAScript 规范定义了几个内部操作，用于处理不同类型间的转换。理解它们是理解一切转换的基础。

#### 1. `ToPrimitive` (转为原始值)
当对象需要被转为原始值时调用（例如对象相加、比较）。
*   **逻辑**：检查 `Symbol.toPrimitive` -> 调用 `valueOf()` -> 调用 `toString()`。

#### 2. `ToBoolean` (转为布尔值)
JS 中只有极少数的值会被转换为 `false`，其他全是 `true`。

| 假值 (Falsy Values) | 说明 |
| :--- | :--- |
| `false` | 布尔假 |
| `undefined` | 未定义 |
| `null` | 空值 |
| `0`, `-0` | 数字零 |
| `NaN` | 非数字 |
| `""` / `''` / `` `` | 空字符串 |
| *`document.all`* | (浏览器历史遗留，特殊对象) |

> **注意**：`[]` (空数组) and `{}` (空对象) 都是 **true**。

#### 3. `ToNumber` (转为数字)
| 输入类型 | 结果 |
| :--- | :--- |
| `undefined` | **`NaN`** (重点) |
| `null` | **`0`** (重点) |
| `true` | `1` |
| `false` | `0` |
| String | 如果纯数字则解析为数字；空串为 `0`；含非数字字符则为 `NaN` |
| Symbol | 抛出 `TypeError` |
| Object | 先 `ToPrimitive` 转为原始值，再按上述规则转数字 |

#### 4. `ToString` (转为字符串)
*   基本类型直接转字符串（`null` -> `"null"`, `undefined` -> `"undefined"`）。
*   对象类型：先 `ToPrimitive`，通常调用 `toString()`。
    *   `{}` -> `"[object Object]"`
    *   `[1,2]` -> `"1,2"`

### 3.3 显式转换 (Explicit Coercion)

通常为了代码清晰，建议使用显式转换。

#### 1. 转数字
*   `Number(val)`：严格转换。只要有一个字符无法解析（除了空格），就返回 `NaN`。
*   `parseInt(val)` / `parseFloat(val)`：解析转换。从左向右解析，遇到非数字停止。

**核心差异速查表**

| 特性 | `parseInt(string, radix)` | `parseFloat(string)` | `Number(value)` |
| :--- | :--- | :--- | :--- |
| **核心目的** | 从字符串中**解析**出第一个**整数** | 从字符串中**解析**出第一个**浮点数** | 将**整个值**严格**转换**为数字 |
| **处理方式** | 从头读取，直到遇到非数字字符就停止 | 从头读取，直到遇到第二个小数点或非数字字符就停止 | “要么全部，要么没有”。任何无效字符都会导致失败 |
| **处理非数字** | **忽略**字符串末尾的非数字部分 | **忽略**字符串末尾的非数字部分 | **失败**，返回 `NaN` |
| **处理小数点** | **忽略**小数点及其之后的所有内容 | **识别**并解析第一个小数点 | **识别**并解析 |
| **处理空字符串 `""`**| `NaN` | `NaN` | `0` |
| **处理 `null`** | `NaN` | `NaN` | `0` |
| **处理十六进制** | 需要指定基数 `16` | 不支持 (`0`) | **支持** (`0x...`) |
| **推荐用法** | 从字符串中提取像素值、ID等整数 | 从字符串中提取货币、尺寸等小数值 | 验证用户输入、进行精确的数据类型转换 |


#### 2. 转字符串
*   `String(val)`：适用于所有类型（包括 null/undefined）。
*   `val.toString()`：适用于除 null/undefined 以外的类型。

#### 3. 转布尔
*   `Boolean(val)`
*   `!!val` (双重取反，最常用)

### 3.4 隐式转换 (Implicit Coercion)

这是最容易出错的地方，主要发生在运算符操作中。

#### 1. 二元 `+` 运算符
**规则**：
1.  如果有一侧是 **字符串**，则按照 **字符串拼接** 处理（另一侧调用 `ToString`）。
2.  如果两侧都不是字符串，则按照 **数字加法** 处理（两侧调用 `ToNumber`）。

```js
1 + "1"       // "11" (拼接)
true + true   // 2 (1 + 1)
4 + [1,2,3]   // "41,2,3" (数组转字符串是 "1,2,3")
10 + {}       // "10[object Object]"
```

#### 2. 数学运算符 (`-`, `*`, `/`, `%`)
**规则**：除了 `+` 以外的数学运算符，一律将操作数转换为 **数字 (`ToNumber`)**。

```js
"100" - 10    // 90
100 * "2"     // 200
10 - "abc"    // NaN
1 - null      // 1 (1 - 0)
1 - undefined // NaN (1 - NaN)
```

#### 3. 逻辑非 (`!`) 和 逻辑运算
**规则**：转换为 **布尔值 (`ToBoolean`)**。

```js
![]   // false (数组是真值，取反为假)
!!"0" // true (非空字符串是真值)
```

#### 4. 宽松相等运算符 (`==` 和 `!=`)

这是 JavaScript 中一个复杂且容易出错的部分。它在比较之前会尝试**转换值的类型**。

##### 4.1  工作原理

`a == b` 的比较会经过一个复杂的**抽象相等比较算法**，主要规则如下：

1.  **类型相同？** -> 行为与 `===` 相同。
2.  **`null == undefined`？** -> `true` (这是唯一的特例)。
3.  **`Number == String`？** -> 将 `String` 转换为 `Number` 再比较。
4.  **`Boolean == 任何类型`？** -> 将 `Boolean` 转换为 `Number` (`true` -> `1`, `false` -> `0`) 再比较。
5.  **`Object == (String | Number | Symbol)`？** -> 将 `Object` 转换为原始类型（会调用内部的 ToPrimitive 操作。这个操作会根据上下文决定优先调用 `valueOf()` 还是 `toString()`方法`）再比较。

![Logo](/equal.png)

##### 4.2 示例

| 表达式                 | 结果      | 转换过程                                            |
|:--------------------|:--------|:------------------------------------------------|
| `77 == "77"`        | `true`  | `"77"` -> `77`                                  |
| `true == 1`         | `true`  | `true` -> `1`                                   |
| `false == 0`        | `true`  | `false` -> `0`                                  |
| `"" == 0`           | `true`  | `""` -> `0`                                     |
| `"\n " == 0`        | `true`  | `"\n "` -> `""` -> `0`                          |
| `[1] == 1`          | `true`  | `[1]` -> `"1"` -> `1`                           |
| `[] == 0`           | `true`  | `[]` -> `""` -> `0`                             |
| `[] == false`       | `true`  | `[]` -> `""` -> `0`; `false` -> `0`             |
| `null == undefined` | `true`  | `规范中的特例。`                                       |
| `[]==![]`           | `true`  | `[]` -> `""` -> `0`;`![]`->`false` -> `0`       |
| `[]==[]`            | `false` | `两个数组的内存地址不同`                                   |
| `{}=={}`            | `false` | `两个对象的内存地址不同`                                   |
| `{}==!{}`           | `false` | `{}`->`'[object object]'`->`NaN`;`!{}`->`false` |

> **❌ 为什么应避免使用 `==`：** 它的类型转换规则复杂、不直观，是许多常见 bug 的根源。你很难记住所有的转换规则，这使得代码的行为难以预测。

### 3.5 同值相等 (`Object.is()`)

`Object.is()` 是 ES6 引入的，用于判断两个值是否为“相同的值”。它被认为是比 `===` 更精确的比较方式。

#### 1. 工作原理

`Object.is()` 的行为与 `===` 基本完全相同，**除了两个特例**：

1.  `Object.is(NaN, NaN)` -> `true` (与 `===` 不同)
2.  `Object.is(+0, -0)` -> `false` (与 `===` 不同)

```js
object.is=function(a,b){
    // 情况 1: 处理 +0 和 -0
    // 如果 x 和 y 都是 0，它们通过 `===` 比较会是 true。
    // 但我们需要区分 +0 和 -0。
    // 技巧：1 / +0 === Infinity，而 1 / -0 === -Infinity。
    // 所以，如果它们的倒数不相等，说明一个是 +0，另一个是 -0。
    if (x === 0 && y === 0) {
        return 1 / x === 1 / y;
    }

    // 情况 2: 处理 NaN
    // NaN 是唯一一个不等于自身的值 (NaN !== NaN)。
    // 所以，如果 x 不等于 x，那么 x 就是 NaN。
    // 如果 x 和 y 都是 NaN，那么它们应该被认为是相等的。
    if (x !== x) {
        return y !== y;
    }

    // 情况 3: 其他所有情况
    // 对于所有其他值 (包括 null, undefined, string, boolean, object引用等)，
    // Object.is() 的行为与 === 完全相同。
    return x === y;
}
```

#### 2. 示例

| 表达式 | 结果 |
| :--- | :--- |
| `Object.is(77, "77")` | `false` |
| `Object.is({}, {})` | `false` |
| `Object.is(NaN, NaN)` | `true` |
| `Object.is(+0, -0)` | `false` |

> **用途：** `Object.is()` 在某些需要精确区分 `NaN` 或 `+0` 和 `-0` 的数学计算或算法场景中非常有用。在日常的业务逻辑中，`===` 依然是首选。



## 4. 经典面试题解析 (Wat Moments)

### 案例 1：`[] == ![]`
**结果**：`true`

**解析步骤**：
1.  右边：`![]`。`[]` 是真值，`![]` 变为 `false`。
    *   比较变为：`[] == false`
2.  遇到 Boolean：`false` 转为数字 `0`。
    *   比较变为：`[] == 0`
3.  遇到 Object vs Number：`[]` 调用 `valueOf` (是数组本身) -> `toString()` (是空串 `""`)。
    *   比较变为：`"" == 0`
4.  遇到 String vs Number：`""` 转为数字 `0`。
    *   比较变为：`0 == 0` -> **true**

### 案例 2：`{} + []` vs `[] + {}`
这取决于在浏览器控制台还是脚本中运行。

1.  `[] + {}`
    *   `[]` -> `""`
    *   `{}` -> `"[object Object]"`
    *   结果：`"[object Object]"`

2.  `{} + []`
    *   在旧版本控制台或特定解析中，`{}` 被当做**空代码块**（Block）直接忽略。
    *   实际执行的是 `+ []`（一元加号，强制转数字）。
    *   `[]` -> `""` -> `0`。
    *   结果：`0` (但在现代浏览器和 Node 环境中，通常也被解析为字符串拼接 `"[object Object]"`).

### 案例 3：`true`、`false` 与数字的比较

**现象**:
`if (myVar == true)` 这样的代码可能不会按预期工作。

**代码示例**:
```js
const value = "1";

if (value == true) { // "1" == true -> "1" == 1 -> 1 == 1 -> true
    console.log("Value is true"); // ✅ 执行
}

const text = "hello";
if (text == true) { // "hello" == true -> NaN == 1 -> false
    console.log("Text is true"); // ❌ 不执行
}
```

**✅ 解决方案**:
永远不要用 `== true` 或 `== false` 来检查真值。直接利用值的“真值性” (truthiness)。

```js
// 正确的方式
if (value) { 
    console.log("Value is truthy");
}
```

### 案例 4：空数组与 `false` 的比较

**现象**:
`[]` 本身是一个“真值” (truthy)，但 `[] == false` 的结果却是 `true`。

**代码示例**:
```js
if ([]) {
    console.log("Empty array is truthy"); // ✅ 执行
}

console.log([] == false); // true
```

**原因 (逐步转换)**:
1.  `[] == false`
2.  `[]` 是对象，`false` 是布尔值。
3.  `false` 转换为数字 `0` -> `[] == 0`
4.  `[]` 尝试转换为原始类型，调用 `toString()` -> `"" == 0`
5.  `""` 字符串转换为空数字 `0` -> `0 == 0`
6.  结果为 `true`。

**✅ 解决方案**:
使用 `===`，或者通过 `array.length` 来判断数组是否为空。

### 案例 5：`null` 与 `0` 的比较

**现象**:
`null == 0` 是 `false`，但 `null > 0` 和 `null >= 0` 却表现不一。

**代码示例**:
```js
console.log(null == 0); // false (宽松相等有 null 和 undefined 的特例)

console.log(null > 0);  // false (关系比较中，null -> 0)
console.log(null >= 0); // true (关系比较中，null -> 0)
```

**✅ 解决方案**:
同样，使用 `===` 进行显式检查，避免依赖 `null` 的隐式转换。

```js
const value = null;

if (value === 0) {
    // ...
}
if (value === null) {
    // ...
}
```

#### 总结建议

1.  **永远优先使用 `===`**，除非你真的想判断 `null` 或 `undefined` (`if (obj == null)` 是唯一推荐的 `==` 用法)。
2.  **显式转换优于隐式转换**。`Number(str)` 比 `str * 1` 可读性更好。
3.  **记住 Falsy 值**，其他全为真。

| 运算符 | 描述 | 类型转换 | 适合场景 |
| :--- | :--- | :--- | :--- |
| **`===`** | **严格相等** | **否** | **99% 的情况。** 你的默认选择。 |
| **`==`** | **宽松相等** | **是** | 几乎从不。唯一的例外可能是 `val == null` (等价于 `val === null || val === undefined`)，但显式检查更清晰。 |
| **`Object.is()`** | **同值相等** | **否** | 需要精确区分 `NaN` 或 `+0` / `-0` 的特殊情况。 |