---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# JavaScript 数据类型

ECMAScript 标准定义了 8 种数据类型，分为两大类：**原始类型（Primitive Types）** 和 **对象类型（Object Type）**。

- **7 种原始类型**: `String`、`Number`、`BigInt`、`Boolean`、`Undefined`、`Null`、`Symbol`
- **1 种对象类型**: `Object`

原始类型**按值**存储、不可变；对象类型**按引用**存储、可变。

## 1. 原始类型 (Primitive Types)

### 1.1 String (字符串)

- **描述**: 表示文本数据，采用 UTF-16 编码，**不可变**。
- **常见问题**:
  - **"Stringly-typing"**: 避免用字符串表示复杂结构（如 `"a,b,c"`），应使用数组或对象。
  - **字符长度**: `length` 返回 UTF-16 码元数量，emoji 等可能不准确（`'😀'.length` 是 `2`）。
- **示例**:
  ```js
  let name = 'Gemini'
  let template = `My name is ${name}`
  ```

### 1.2 Number (数字)

- **描述**: 采用 IEEE 754 双精度 64 位格式，整数和浮点数统一都是 `number`。
- **常见问题**:
  - **精度问题**: `0.1 + 0.2` 不等于 `0.3`。
  - **安全整数范围**: 只能安全表示 `-(2^53 - 1)` ~ `2^53 - 1`，超出会丢精度，用 `Number.isSafeInteger()` 检查。
  - **特殊值**: `NaN`（不等于自身）、`Infinity` / `-Infinity`、`+0` / `-0`。
- **示例**:
  ```js
  let integer = 42
  let float = 3.14
  let notANumber = NaN
  let infinity = Infinity
  ```

### 1.3 BigInt (大整数)

- **描述**: 表示任意精度的整数，整数末尾加 `n` 或调用 `BigInt()` 创建。
- **常见问题**:
  - **类型混合**: 不能与 `Number` 混用算术运算，会抛 `TypeError`。
  - **小数**: 无法表示小数，`1n / 2n` 结果是 `0n`。
- **示例**:
  ```js
  const bigNumber = 9007199254740991n
  const alsoBig = BigInt('12345678901234567890')
  ```

### 1.4 Boolean (布尔)

- **描述**: 只有两个值 `true` 和 `false`，常用于条件判断。
- **常见问题**:
  - **Truthy & Falsy**: 隐式转布尔时，`false`、`0`、`-0`、`0n`、`""`、`null`、`undefined`、`NaN` 为 `false`，其余（含 `[]`、`{}`）为 `true`。
- **示例**:
  ```js
  let isTrue = true
  let isFalse = false
  ```

### 1.5 Undefined

- **描述**: 表示未赋值的变量，声明但未初始化时默认就是 `undefined`。
- **常见问题**:
  - **与 `null` 的区别**: `undefined` 是语言默认行为（“**值缺失**”）；`null` 是开发者主动赋值（“**对象缺失**”）。
  - **非关键词**: `undefined` 是全局属性而非保留字，旧环境可能被改写，可用 `void 0` 代替。
- **示例**:
  ```js
  let uninitialized // 值为 undefined
  ```

### 1.6 Null

- **描述**: 表示“**空**”或“**无**”，由开发者主动赋值。
- **常见问题**:
  - **`typeof null`**: 返回 `"object"`，是历史遗留 Bug。判断 `null` 应使用 `=== null`。
- **示例**:
  ```js
  let emptyValue = null
  ```

### 1.7 Symbol (符号)

- **描述**: 唯一且不可变的值，用于创建唯一的对象属性键，避免命名冲突。
- **常见问题**:
  - **非字符串**: 不能自动转字符串，拼接会抛 `TypeError`。
  - **枚举**: `Symbol` 键不会被 `for...in`、`Object.keys()` 枚举，需用 `Object.getOwnPropertySymbols()`。
- **示例**:
  ```js
  const id = Symbol('unique id')
  const obj = { [id]: 123 }
  ```

### 1.8 对象类型 (Object Type)

- **描述**: 存储键值对集合的复杂类型。数组、函数、日期等都是特殊的对象。
- **常见问题**:
  - **引用传递**: 对象赋值是引用传递，两个变量指向同一内存地址，修改会互相影响。
  - **`typeof` 的限制**: 除函数（返回 `"function"`）外，所有对象都返回 `"object"`，无法细分。
- **示例**:
  ```js
  const person = { firstName: 'John', lastName: 'Doe' }
  const fruits = ['Apple', 'Banana', 'Orange']
  const today = new Date()
  ```

## 2. 数据类型鉴别方式

### 2.1 `typeof` 运算符

以字符串形式返回操作数的数据类型。

```js
typeof 42 // "number"
typeof 'hello' // "string"
typeof true // "boolean"
typeof undefined // "undefined"
typeof Symbol('id') // "symbol"
typeof 123n // "bigint"
typeof {} // "object"
typeof [] // "object"
typeof function () {} // "function"
```

**陷阱**：

[width(31,16,53)]

| 表达式                       | 结果           | 原因/说明                                       |
| :--------------------------- | :------------- | :---------------------------------------------- |
| **`typeof null`**            | **`"object"`** | 历史遗留 bug，`null` 应被视作其自身的原始类型。 |
| **`typeof []`**              | **`"object"`** | 无法区分数组、对象、RegExp 等。                 |
| **`typeof new String("a")`** | **`"object"`** | 包装对象返回 `"object"`，而非原始类型。         |

**适用场景**：判断原始类型和 `function`；不适合精确判断 `null` 或引用类型。

### 2.2 `instanceof` 运算符

检测某构造函数的 `prototype` 是否存在于实例对象的原型链上。

```js
const arr = []
const obj = {}
const now = new Date()

arr instanceof Array // true
arr instanceof Object // true (因为 Array.prototype 继承自 Object.prototype)

obj instanceof Object // true
now instanceof Date // true
```

**陷阱**：

[width(22,78)]

| 问题                  | 描述                                                                                                               |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------- |
| **对原始类型无效**    | `"hello" instanceof String` 为 `false`。                                                                           |
| **多窗口/多框架问题** | 跨 `iframe`/`window` 时各自的构造函数不同，`instanceof Array` 可能返回 `false`。判断数组建议用 `Array.isArray()`。 |

**适用场景**：判断对象是否属于某个类或原型链，适合自定义类。

### 2.3 `constructor` 属性

每个实例对象的 `constructor` 属性指向创建它的构造函数。

```js
const num = 1
const str = 'hi'
const arr = []

console.log(arr.constructor === Array) // true
console.log(str.constructor === String) // true
console.log(num.constructor === Number) // true
```

**陷阱**：

- **不稳定性**: `constructor` 可被修改（如 `MyClass.prototype.constructor = Array`），结果不可靠。
- **`null` / `undefined`**: 没有 `constructor`，直接访问会报错。

**适用场景**：受控环境下可用，但不推荐作为首选。

### 2.4 `Object.prototype.toString.call()` (终极方案)

最准确可靠的类型鉴别方法，返回 `"[object Type]"` 格式字符串。

```js
const toString = Object.prototype.toString

toString.call(123) // "[object Number]"
toString.call('abc') // "[object String]"
toString.call(true) // "[object Boolean]"
toString.call(undefined) // "[object Undefined]"
toString.call(null) // "[object Null]" (正确区分了 null)
toString.call([]) // "[object Array]" (正确区分了数组)
toString.call({}) // "[object Object]"
toString.call(new Date()) // "[object Date]"
toString.call(/a/) // "[object RegExp]"
toString.call(new Error()) // "[object Error]"
toString.call(window) // "[object Window]" (在浏览器中)
```

**封装成工具函数**：

```js
function getType(value) {
  if (value === null) return 'null'
  const type = typeof value
  if (type !== 'object') {
    return type
  }
  // 处理引用类型
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase()
}

console.log(getType(null)) // "null"
console.log(getType([])) // "array"
console.log(getType(new Date())) // "date"
```

**适用场景**：任何需要精确判断类型的场景；能跨 `iframe` 工作，是库和框架的首选。

### 2.5 总结对比

[width(24,32,28,16)]

| 方法                                   | 优点                                           | 缺点                               | 推荐指数   |
| :------------------------------------- | :--------------------------------------------- | :--------------------------------- | :--------- |
| **`typeof`**                           | 简单快速，适合原始类型和 `function`            | 无法区分 `null`、数组和对象        | ⭐⭐⭐     |
| **`instanceof`**                       | 能判断原型链，适合自定义类                     | 对原始类型无效，有跨 `iframe` 问题 | ⭐⭐⭐⭐   |
| **`constructor`**                      | 语法直观                                       | 属性可被修改，不可靠               | ⭐⭐       |
| **`Object.prototype.toString.call()`** | **最准确、最可靠**，能区分所有类型，无兼容问题 | 语法稍繁琐，通常需封装             | ⭐⭐⭐⭐⭐ |

## 3. 数据类型转换

JavaScript 是**弱类型**语言，变量类型可随时改变，运算时引擎会自动隐式转换。

### 3.1 转换的两种形式

- **显式转换**：代码明确写出，如 `Number("123")`、`String(123)`、`Boolean(1)`。
- **隐式转换**：由运算符或语句触发，如 `"1" + 2`、`if (1)`、`1 == "1"`。

### 3.2 底层抽象操作

[width(13,17,70)]

| 抽象操作          | 触发场景               | 转换规则 / 说明                                                                                                                                                                                    |
| :---------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ToPrimitive`** | 对象转为原始值时       | 先查 `Symbol.toPrimitive` -> 再 `valueOf()` -> 再 `toString()`。                                                                                                                                   |
| **`ToBoolean`**   | 布尔上下文（如 `if`）  | 假值：`false`、`undefined` / `null`、`0` / `-0` / `0n`、`NaN`、`""`；其余（含 `[]`、`{}`）均为真。                                                                                                 |
| **`ToNumber`**    | 数学运算 / 数值上下文  | `undefined` -> `NaN`；`null` -> `0`；`true` / `false` -> `1` / `0`；String 纯数字解析为数字、空字符串为 `0`、含非数字字符为 `NaN`；Symbol 抛 `TypeError`；Object 先 `ToPrimitive` 再按规则转数字。 |
| **`ToString`**    | 字符串上下文（如拼接） | 基本类型直接转字符串（`null` -> `"null"`）；对象先 `ToPrimitive`，如 `{}` -> `"[object Object]"`、`[1,2]` -> `"1,2"`。                                                                             |

### 3.3 显式转换 (Explicit Coercion)

#### 3.3.1 转数字

- `Number(val)`：严格转换，无法解析就返回 `NaN`。
- `parseInt(val)` / `parseFloat(val)`：从左向右解析，遇到非数字停止。

[width(22,22,24,32)]

| 特性                  | `parseInt(string, radix)`                                  | `parseFloat(string)`                                            | `Number(value)`                                                        |
| :-------------------- | :--------------------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **核心目的**          | 解析第一个**整数**                                         | 解析第一个**浮点数**                                            | 将**整个值**严格转换为数字                                             |
| **处理方式**          | 读到非数字字符停止                                         | 读到第二个小数点或非数字字符停止                                | “**要么全部，要么没有**”                                               |
| **处理空字符串 `""`** | `NaN`                                                      | `NaN`                                                           | `0`                                                                    |
| **处理 `null`**       | `NaN`                                                      | `NaN`                                                           | `0`                                                                    |
| **处理 `undefined`**  | `NaN`                                                      | `NaN`                                                           | `NaN`                                                                  |
| **处理布尔值**        | `NaN`                                                      | `NaN`                                                           | `true` -> `1`，`false` -> `0`                                          |
| **处理十六进制**      | 需指定基数 `16`                                            | 不支持 (`0`)                                                    | **支持** (`0x...`)                                                     |
| **示例**              | `parseInt('42px')` -> `42`；`parseInt('0x1F', 16)` -> `31` | `parseFloat('3.14.15')` -> `3.14`；`parseFloat('10px')` -> `10` | `Number('42')` -> `42`；`Number('42px')` -> `NaN`；`Number('')` -> `0` |

#### 3.3.2 转字符串

- `String(val)`：适用所有类型（含 null/undefined）。
- `val.toString()`：不适用 null/undefined。

#### 3.3.3 转布尔

- `Boolean(val)` 或 `!!val`。

### 3.4 隐式转换 (Implicit Coercion)

#### 3.4.1 二元 `+` 运算符

一侧是字符串则**拼接**，否则按**数字加法**处理。

```js
1 + '1' // "11"
true + true // 2
4 + [1, 2, 3] // "41,2,3"
10 + {} // "10[object Object]"
```

#### 3.4.2 数学运算符 (`-`, `*`, `/`, `%`)

一律转数字 (`ToNumber`)。

```js
'100' - 10 // 90
1 - null // 1
1 - undefined // NaN
```

#### 3.4.3 逻辑非 (`!`)

转为布尔值 (`ToBoolean`)。

```js
![] // false
!!'0' // true
```

#### 3.4.4 宽松相等运算符 (`==` 和 `!=`)

比较前会尝试转换类型，其比较与转换规则如下表所示（`!=` 即 `==` 结果取反）：

[width(15,10,10,13,17,17,18)]

| 被比较值 A \ 被比较值 B | Undefined | Null  | Number              | String                     | Boolean                       | Object                        |
| ----------------------- | --------- | ----- | ------------------- | -------------------------- | ----------------------------- | ----------------------------- |
| Undefined               | true      | true  | false               | false                      | false                         | IsFalsy(B)                    |
| Null                    | true      | true  | false               | false                      | false                         | IsFalsy(B)                    |
| Number                  | false     | false | A == B              | A == ToNumber(B)           | A == ToNumber(B)              | A == ToPrimitive(B)           |
| String                  | false     | false | ToNumber(A) == B    | A == B                     | ToNumber(A) == ToNumber(B)    | ToPrimitive(B) == A           |
| Boolean                 | false     | false | ToNumber(A) == B    | ToNumber(A) == ToNumber(B) | A == B                        | ToNumber(A) == ToPrimitive(B) |
| Object                  | false     | false | ToPrimitive(A) == B | ToPrimitive(A) == B        | ToPrimitive(A) == ToNumber(B) | A == B                        |

```js
77 == "77"        // true  ("77" -> 77)
true == 1         // true  (true -> 1)
"" == 0           // true  ("" -> 0)
[1] == 1          // true  ([1] -> "1" -> 1)
[] == false       // true  ([] -> "" -> 0; false -> 0)
null == undefined // true  (规范特例)
[] == ![]         // true  ([] -> 0; ![] -> false -> 0)
[] == []          // false (内存地址不同)
{} == {}          // false (内存地址不同)
```

### 3.5 同值相等 (`Object.is()`)

与 `===` 基本相同，**两个特例**：

- `Object.is(NaN, NaN)` -> `true`
- `Object.is(+0, -0)` -> `false`

```js
Object.is = function (x, y) {
  if (x === 0 && y === 0) return 1 / x === 1 / y // 区分 +0 / -0
  if (x !== x) return y !== y // 处理 NaN
  return x === y // 其他情况同 ===
}
```

### 3.6 零值相等 (SameValueZero)

与 SameValue 几乎一样，**唯一区别是认为 `+0` 和 `-0` 相等**。它是 `Set`、`Map`、数组 `includes()` 内部使用的算法。

[width(26,12,12,21,29)]

| 比较的值                  | `==`    | `===`   | `SameValueZero` | `SameValue` (`Object.is()`) |
| :------------------------ | :------ | :------ | :-------------- | :-------------------------- |
| **`NaN` 与 `NaN`**        | `false` | `false` | **`true`**      | **`true`**                  |
| **`+0` 与 `-0`**          | `true`  | `true`  | **`true`**      | **`false`**                 |
| **`5` 与 `"5"`**          | `true`  | `false` | `false`         | `false`                     |
| **`null` 与 `undefined`** | `true`  | `false` | `false`         | `false`                     |

**为什么用 SameValueZero**：`Set` 中 `NaN` 应去重（否则可无限添加）；`+0`/`-0` 应视为同键（否则 `map.set(+0)` 后用 `-0` 取不到会很困惑）。

## 4. 数据类型运算符 (Operator Precedence)

### 4.1 JavaScript 运算符详解

#### 4.1.1 赋值运算符

[width(20,23,26,31)]

| 运算符 | 名称     | 示例      | 等同于       |
| :----- | :------- | :-------- | :----------- |
| `=`    | 赋值     | `x = y`   | `x = y`      |
| `+=`   | 加法赋值 | `x += y`  | `x = x + y`  |
| `-=`   | 减法赋值 | `x -= y`  | `x = x - y`  |
| `*=`   | 乘法赋值 | `x *= y`  | `x = x * y`  |
| `/=`   | 除法赋值 | `x /= y`  | `x = x / y`  |
| `%=`   | 取模赋值 | `x %= y`  | `x = x % y`  |
| `**=`  | 幂赋值   | `x **= y` | `x = x ** y` |

#### 4.1.2 比较运算符

[width(30,20,50)]

| 运算符            | 名称     | 描述                         |
| :---------------- | :------- | :--------------------------- |
| `==`              | 等于     | 值相等，会类型转换。         |
| `!=`              | 不等于   | 值不相等，会类型转换。       |
| `===`             | 全等     | 值和类型都相等，不类型转换。 |
| `!==`             | 不全等   | 值或类型不相等，不类型转换。 |
| `>` `<` `>=` `<=` | 关系比较 |                              |

#### 4.1.3 算术运算符

[width(40,60)]

| 运算符 | 名称          |
| :----- | :------------ |
| `+`    | 加法          |
| `-`    | 减法          |
| `*`    | 乘法          |
| `/`    | 除法          |
| `%`    | 取模 (求余数) |
| `**`   | 幂            |
| `++`   | 自增          |
| `--`   | 自减          |

#### 4.1.4 逻辑运算符

[width(21,33,46)]

| 运算符 | 名称         | 描述               |
| :----- | :----------- | :----------------- |
| `&&`   | 逻辑与 (AND) | 两者都为真才为真   |
| `\|\|` | 逻辑或 (OR)  | 只要一个为真就为真 |
| `!`    | 逻辑非 (NOT) | 取反               |

#### 4.1.5 位运算符

[width(42,58)]

| 运算符 | 名称       |
| :----- | :--------- |
| `&`    | 按位与     |
| `\|`   | 按位或     |
| `^`    | 按位异或   |
| `~`    | 按位非     |
| `<<`   | 按位左移   |
| `>>`   | 有符号右移 |
| `>>>`  | 无符号右移 |

#### 4.1.6 其他运算符

[width(21,17,62)]

| 运算符       | 名称        | 描述                                             |
| :----------- | :---------- | :----------------------------------------------- |
| `typeof`     | 类型        | 返回操作数类型的字符串。                         |
| `instanceof` | 实例        | 判断是否是某构造函数的实例。                     |
| `? :`        | 条件 (三元) | `condition ? val1 : val2`。                      |
| `delete`     | 删除        | 删除对象属性。                                   |
| `in`         | 属性检查    | 属性是否在对象或其原型链中。                     |
| `??`         | 空值合并    | `a ?? b`，`a` 为 `null`/`undefined` 时返回 `b`。 |

### 4.2 [运算符优先级 (Operator Precedence)](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Operator_precedence)

优先级高的运算符先求值。下面的面试题综合考察了变量提升、`this`、`new` 与函数调用的优先级：

```js
function Foo() {
  getName = function () {
    console.log(1)
  } // 1
  return this
}
Foo.getName = function () {
  console.log(2)
} // 2
Foo.prototype.getName = function () {
  console.log(3)
} // 3
var getName = function () {
  console.log(4)
} // 4
function getName() {
  console.log(5)
} // 5

Foo.getName() // 2
getName() // 4
Foo().getName() // 1
getName() // 1
new Foo.getName() // 2
new Foo().getName() // 3
new new Foo().getName() // 3

// 输出：2 4 1 1 2 3 3
```

[width(11,44,32,13)]

| 优先级 | 运算符                                                                | 描述                       | 结合性   |
| :----- | :-------------------------------------------------------------------- | :------------------------- | :------- |
| **21** | `( ... )`                                                             | 分组                       | 不适用   |
| **20** | `.` `[]` `new`(带参数) `()` `?.`                                      | 成员访问、函数调用、可选链 | 从左到右 |
| **19** | `new`(无参数)                                                         | 实例化                     | 从右到左 |
| **18** | `++` `--`（后置）                                                     | 后置自增/自减              | 不适用   |
| **17** | `!` `~` `+` `-` `++` `--` `typeof` `void` `delete` `await`            | 一元运算等                 | 从右到左 |
| **16** | `**`                                                                  | 幂                         | 从右到左 |
| **15** | `*` `/` `%`                                                           | 乘、除、取模               | 从左到右 |
| **14** | `+` `-`                                                               | 加、减                     | 从左到右 |
| **13** | `<<` `>>` `>>>`                                                       | 按位移位                   | 从左到右 |
| **12** | `<` `<=` `>` `>=` `in` `instanceof`                                   | 关系、实例                 | 从左到右 |
| **11** | `==` `!=` `===` `!==`                                                 | 相等性                     | 从左到右 |
| **10** | `&`                                                                   | 按位与                     | 从左到右 |
| **9**  | `^`                                                                   | 按位异或                   | 从左到右 |
| **8**  | `\|`                                                                  | 按位或                     | 从左到右 |
| **7**  | `&&`                                                                  | 逻辑与                     | 从左到右 |
| **6**  | `\|\|`                                                                | 逻辑或                     | 从左到右 |
| **5**  | `??`                                                                  | 空值合并                   | 从左到右 |
| **4**  | `? :`                                                                 | 条件（三元）               | 从右到左 |
| **3**  | `=` `+=` `-=` `**=` `*=` `/=` `%=` `<<=` `>>=` `>>>=` `&=` `^=` `\|=` | 赋值                       | 从右到左 |
| **2**  | `yield`                                                               | yield                      | 从右到左 |
| **1**  | `,`                                                                   | 逗号                       | 从左到右 |

## 5. 常见问题 (FAQ) 与 避坑指南

### 5.1 `[] == ![]`

结果 `true`：`![]` -> `false` -> `0`；`[]` -> `""` -> `0`；`0 == 0`。

### 5.2 `{} + []` vs `[] + {}`

- `[] + {}` -> `""` + `"[object Object]"` = `"[object Object]"`。
- `{} + []` -> 语句开头 `{}` 被当空代码块忽略，实际是 `+[]` -> `0`。

### 5.3 `true`、`false` 与数字的比较

不要用 `== true` 判断真值，应直接利用真值性：

```js
if (value) {
  console.log('Value is truthy')
}
```

### 5.4 空数组与 `false` 的比较

`[]` 是真值，但 `[] == false` 为 `true`（`[]` -> `""` -> `0`）。判断数组为空应用 `array.length`。

### 5.5 `null` 与 `0` 的比较

```js
null == 0 // false（null/undefined 特例）
null > 0 // false（关系比较中 null -> 0）
null >= 0 // true
```

建议用 `===` 显式检查，避免依赖 `null` 的隐式转换。

### 5.6 `NaN` 的各种比较

```js
NaN === NaN // false
NaN == NaN // false

Number.isNaN(NaN) // true
Number.isNaN('abc') // false（不做类型转换）
```
