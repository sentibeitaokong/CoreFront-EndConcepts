---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# **JavaScript 基本引用类型**

在 JavaScript 中，**引用类型**的值（对象）是引用类型的一个实例。引用类型有时候也被称为**对象定义**，因为它们描述的是一类对象所具有的属性和方法。

## 1. Date 类型

`Date` 类型将日期保存为自 1970 年 1 月 1 日 00:00:00 UTC 以来经过的毫秒数。

### 1.1 创建日期
```javascript
let now = new Date(); // 当前时间
let date1 = new Date(1000); // 时间戳（1970-01-01 00:00:01）
let date2 = new Date("2023-12-25"); // 字符串解析
let date3 = new Date(2023, 11, 25, 10, 30, 0); // 年, 月(0-11), 日, 时, 分, 秒
```
> **注意**：月份是从 **0** 开始的（0=1月，11=12月）。

### 1.2 常用方法
*   **Getter**:
    *   `getFullYear()`: 年份 (4位)
    *   `getMonth()`: 月份 (0-11)
    *   `getDate()`: 日期 (1-31)
    *   `getDay()`: 星期几 (0-6, 0是周日)
    *   `getTime()`: 获取时间戳 (毫秒)
*   **转换**:
    *   `toISOString()`: 返回 ISO 格式 (e.g., `2023-10-05T14:48:00.000Z`)
    *   `toLocaleString()`: 根据本地时区显示

### 1.3 `Date.now()`
获取当前时间戳的高性能方法：
```javascript
const start = Date.now();
// ... do something
const end = Date.now();
console.log(`耗时: ${end - start}ms`);
```

## 2. RegExp 类型

`RegExp` 类型用于支持正则表达式。

### 2.1 创建方式
```javascript
// 1. 字面量形式 (推荐)
// 格式: /pattern/flags
let re1 = /at/g;

// 2. 构造函数形式
// 格式: new RegExp("pattern", "flags")
let re2 = new RegExp("at", "g");
```

### 2.2 匹配模式 (Flags)
*   `g`: 全局模式 (Global)，查找所有匹配项。
*   `i`: 不区分大小写 (Case-insensitive)。
*   `m`: 多行模式 (Multiline)。

### 2.3 核心方法
1.  **`exec(str)`**:
    *   主要用于捕获组。返回一个数组（包含匹配项和捕获组），如果没有匹配则返回 `null`。
    *   是 RegExp 的最强方法。
2.  **`test(str)`**:
    *   返回 `true` 或 `false`。用于简单的模式检测。

```javascript
let text = "cat, bat, sat, fat";
let pattern = /.at/;

if (pattern.test(text)) {
    console.log("匹配成功");
}

let matches = pattern.exec(text);
console.log(matches[0]); // "cat"
console.log(matches.index); // 0
```

## 3. 原始值包装类型 (Primitive Wrappers)
原始值包装类型是一个非常特殊且巧妙的设计，它解决了“原始值（Primitive）”无法拥有属性和方法的问题。

### 3.1 核心矛盾：原始值 vs 对象

在 JS 中，数据类型分为两类：
*   **原始值**：`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`。它们是简单的值，**没有属性和方法**。
*   **引用值（对象）**：`Object`, `Array`, `Function` 等。它们可以拥有属性和方法。

**矛盾点**：
既然字符串 `'abc'` 是原始值，为什么我们可以调用 `'abc'.toUpperCase()` 或 `'abc'.length`？

**答案**：这就是**原始值包装类型**在起作用。JS 引擎在后台进行了“自动装箱”操作。

### 3.2 哪些是包装类型？

主要有三个（对应三种常见的原始类型）：
#### 1. Boolean
**强烈不建议显式创建 `new Boolean()`**，因为它容易引起误解（所有对象在布尔上下文中都为 true）。

#### 2. Number
提供了处理数值的工具方法：
*   `toFixed(digits)`: 保留几位小数（返回字符串）。
*   `toPrecision(digits)`: 返回指定精度的数值字符串。
*   `Number.isInteger(val)`: 判断是否为整数。

```javascript
let num = 10.005;
console.log(num.toFixed(2)); // "10.01" (注意四舍五入的坑，实际往往需配合 Math 库)
```

#### 3. String
JS 中最常用的引用类型之一。由于字符串是不可变的，所有修改字符串的方法都会返回新字符串。

**操作方法**:
*   `slice(start, end)`, `substring(start, end)`, `substr(start, length)`: 截取。
*   `concat()`: 拼接（不如直接用 `+` 或模板字符串）。
*   `trim()`: 去除前后空格。

**位置方法**:
*   `indexOf(str)`, `lastIndexOf(str)`: 查找位置。
*   `includes(str)`, `startsWith(str)`, `endsWith(str)`: (ES6) 返回布尔值。

**模式匹配**:
*   `match(regexp)`: 类似 `RegExp.exec`。
*   `replace(regexp/str, replacement)`: 替换。

*(注：`Symbol` and `BigInt` 也有对应的包装对象机制，但不能通过 `new` 显式创建)*

### 3.3 “自动装箱” (Auto-boxing) 原理解析

当你访问一个原始值的属性时（例如 `str.length`），JS 引擎会**瞬间**完成以下三个步骤：

假设代码是：
```javascript
var s1 = "some text";
var s2 = s1.substring(2);
```

**引擎在后台实际执行的过程：**

1.  **创建实例**：根据原始值，临时创建一个对应的包装对象实例。
    *   `var temp = new String("some text");`
2.  **调用方法**：在这个临时对象上调用指定的方法。
    *   `s2 = temp.substring(2);`
3.  **销毁实例**：方法调用结束后，这个临时对象被立即销毁。
    *   `temp = null;`

正是因为这个**创建 -> 执行 -> 销毁**的过程发生得非常快，让你感觉原始值好像真的有方法一样。

### 3.4 显式创建 vs 隐式创建

你可以手动创建包装对象，但它们与原始值有本质区别：

| 特性 | 原始值 (Primitive) | 包装对象 (Wrapper Object) |
| :--- | :--- | :--- |
| **创建方式** | `var s = "hello"` | `var s = new String("hello")` |
| **`typeof`** | `"string"` | `"object"` |
| **真值判断** | 非空字符串为 true | **永远为 true** (因为它是对象) |

```javascript
var s1 = "hello";
var s2 = new String("hello");

console.log(typeof s1); // "string"
console.log(typeof s2); // "object"

console.log(s1 === s2); // false (类型不同)
console.log(s1 == s2);  // true (值相等，隐式转换)
```

## 4. 单体内置对象 (Singleton Built-in Objects)

不需要实例化（不需要 `new`），直接使用的对象。

### 4.1 Global 对象
它是兜底对象，不属于其他对象的属性和方法都在这里。
*   在浏览器中，Global 对象由 `window` 代理。
*   **常用方法**:
    *   `isNaN()`, `isFinite()`
    *   `parseInt()`, `parseFloat()`
    *   `encodeURI()`, `encodeURIComponent()` (URL 编码)
    *   `eval()` (执行 JS 代码字符串)

### 4.2 Math 对象
提供数学计算功能。

**常用属性**:
*   `Math.PI`: π 值。

**常用方法**:
*   **最值**: `Math.min()`, `Math.max()`.
    *   技巧：求数组最大值 `Math.max(...arr)`.
*   **舍入**:
    *   `Math.ceil()`: 向上取整。
    *   `Math.floor()`: 向下取整。
    *   `Math.round()`: 四舍五入。
*   **随机**:
    *   `Math.random()`: 返回 [0, 1) 之间的随机数。
    *   *公式：生成 [min, max] 随机整数*:
        ```javascript
        Math.floor(Math.random() * (max - min + 1)) + min
        ```
*   **计算**: `Math.abs()` (绝对值), `Math.pow()` (幂), `Math.sqrt()` (平方根).

## 5. 常见坑点与面试题

### 坑点 1：给原始值添加属性

由于包装对象的生命周期**只有一瞬间**，你给原始值添加属性是无效的。

```javascript
var str = "abc";
str.color = "red"; // 步骤1: 创建临时对象 -> 步骤2: 添加属性 -> 步骤3: 销毁对象

console.log(str.color); // undefined
// 这里又创建了一个新的临时对象，这个新对象显然没有 color 属性
```

### 坑点 2：Boolean 包装对象的误导性

这是最容易出错的地方：**`new Boolean(false)` 在条件判断中是 `true`！**

```javascript
var falseObject = new Boolean(false);
var result = falseObject && true;

console.log(result); // true
```
**原因**：`falseObject` 是一个对象。在 JS 中，**所有的对象（包括空对象）转为布尔值时都是 `true`**。所以永远不要显式地使用 `new Boolean()`。

## 6. 拆箱 (Unboxing)

如果想把包装对象变回原始值，可以使用 `valueOf()`或`toString()` 方法。

```javascript
var obj = new Number(123); // object
var obj2= new String('123'); // object
var val = obj.valueOf();   // number 123
var val= obj.toString(); // string 123


console.log(typeof obj); // "object"
console.log(typeof obj2); // "object"
console.log(typeof val); // "number"
console.log(typeof val2); // "string"
```

## 7. 总结

JavaScript 的引用类型体系非常丰富：

1.  **Date**: 处理时间，注意月份 0 起始。
2.  **RegExp**: 强大的文本处理工具，核心是 `exec` 和 `test`。
3.  **原始值包装类型 (String/Number/Boolean)**: 
* **目的**：让原始值像对象一样方便地调用方法（如 `substring`, `toFixed`）。
* **机制**：**读取**属性时，临时创建对象；读取完毕，立即销毁。
* **最佳实践**：
    *   **不要**显式地使用 `new Number()`, `new String()`, `new Boolean()` 创建对象，这会带来混淆和性能损耗。
    *   可以直接使用 `Number()`, `String()`（不带 new）作为**类型转换函数**使用，这是安全的。
4.  **Math**: 提供数学计算工具。
5.  **Global**: 全局的宿主，浏览器中即 Window。


