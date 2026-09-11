---
outline: [2, 3]
---

# 基本引用类型 (Reference Types)

在 JavaScript 中，**引用类型**的值（对象）是引用类型的一个实例。引用类型有时候也被称为**对象定义**，因为它们描述的是一类对象所具有的属性和方法。

> [!TIP] 相关阅读
> 本章聚焦 `Date`、`RegExp`、**原始值包装类型**和**单体内置对象**（`Global`、`Math`）；[集合引用类型](/js/basic/collectionPrimitiveTypes) 则专门讲解 `Array`、`Map`、`Set` 等容器。

## 1. Date 类型

`Date` 类型将日期保存为自 1970 年 1 月 1 日 00:00:00 UTC 以来经过的毫秒数。

### 1.1 创建日期

```js
let now = new Date() // 当前时间
let date1 = new Date(1000) // 时间戳（1970-01-01 00:00:01）
let date2 = new Date('2023-12-25') // 字符串解析
let date3 = new Date(2023, 11, 25, 10, 30, 0) // 年, 月(0-11), 日, 时, 分, 秒
```

> **注意**：月份是从 **0** 开始的（0=1月，11=12月）。

### 1.2 [常用方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date)

[width(18,39,43)]

| 分类   | 方法               | 说明                  |
| :----- | :----------------- | :-------------------- |
| Getter | `getFullYear()`    | 年份（4 位）          |
| Getter | `getMonth()`       | 月份（0–11）          |
| Getter | `getDate()`        | 日期（1–31）          |
| Getter | `getDay()`         | 星期（0–6，0 为周日） |
| Getter | `getTime()`        | 时间戳（毫秒）        |
| 转换   | `toISOString()`    | ISO 格式字符串        |
| 转换   | `toLocaleString()` | 本地时区显示          |

### 1.3 `Date.now()`

获取当前时间戳的高性能方法：

```js
const start = Date.now()
// ... do something
const end = Date.now()
console.log(`耗时: ${end - start}ms`)
```

> [!NOTE] Date 与 JSON 序列化
> `Date` 对象自带 `toJSON()` 方法（等价于 `toISOString()`），因此 `JSON.stringify(new Date())` 会输出 ISO 字符串。反序列化时需用 `reviver` 还原为 `Date`，详见 [JSON 序列化](/js/basic/jsonSerialize)。

## 2. RegExp 类型

`RegExp` 类型用于支持正则表达式。

### 2.1 创建方式

```js
// 1. 字面量形式 (推荐)
// 格式: /pattern/flags
let re1 = /at/g

// 2. 构造函数形式
// 格式: new RegExp("pattern", "flags")
let re2 = new RegExp('at', 'g')
```

### 2.2 匹配模式 (Flags)

[width(23,77)]

| 标志 | 说明                     |
| :--- | :----------------------- |
| `g`  | 全局匹配（查找所有匹配） |
| `i`  | 不区分大小写             |
| `m`  | 多行模式                 |

### 2.3 [核心方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

[width(26,74)]

| 方法        | 说明                                        |
| :---------- | :------------------------------------------ |
| `exec(str)` | 返回匹配数组（含捕获组），无匹配返回 `null` |
| `test(str)` | 返回布尔值，用于简单模式检测                |

```js
let text = 'cat, bat, sat, fat'
let pattern = /.at/

if (pattern.test(text)) {
  console.log('匹配成功')
}

let matches = pattern.exec(text)
console.log(matches[0]) // "cat"
console.log(matches.index) // 0
```

## 3. 原始值包装类型 (Primitive Wrapper Types)

原始值包装类型解决了「**原始值没有属性和方法**」的问题。字符串 `'abc'` 是原始值，却能调用 `'abc'.toUpperCase()`——原因就是引擎在后台进行的「**自动装箱 (Auto-boxing)**」：读取原始值的属性时，临时创建一个包装对象，用完立即销毁。

### 3.1 哪些是包装类型？

[width(16,20,27,37)]

| 包装类型  | 对应原始类型 | 能否 `new` 显式创建 | 说明                       |
| :-------- | :----------- | :------------------ | :------------------------- |
| `String`  | `string`     | 能（但不推荐）      | 字符串相关属性和方法       |
| `Number`  | `number`     | 能（但不推荐）      | 数值处理工具方法           |
| `Boolean` | `boolean`    | 能（但强烈不推荐）  | 极易引起误解（见常见问题） |

> [!NOTE] Symbol 与 BigInt
> `Symbol`、`BigInt` 也有包装机制，但**不能**用 `new` 创建（会直接报错），只能通过 `Object(symbol)` / `Object(bigint)` 装箱。

#### 3.2.1 Number 包装类型

[width(14,50,36)]

| 类型     | 方法                                         | 说明                                            |
| :------- | :------------------------------------------- | :---------------------------------------------- |
| `Number` | `toFixed(n)`                                 | 保留 n 位小数（返回字符串）                     |
| `Number` | `toPrecision(n)`                             | 返回指定精度的数值字符串                        |
| `Number` | `Number.isInteger(val)`                      | 判断是否为整数（静态方法）                      |
| `Number` | `Number.isNaN(val)` / `Number.isFinite(val)` | 更严格的判断（区别于全局 `isNaN` / `isFinite`） |

```js
let num = 10.005
console.log(num.toFixed(2)) // "10.01"（注意浮点数精度，实际往往需配合 Math 库）
console.log(Number.isInteger(1)) // true
console.log(Number.isInteger(1.0)) // true（1.0 就是整数 1）
```

#### 3.2.2 String 包装类型

JS 中最常用的引用类型之一。由于字符串是**不可变**的，所有修改字符串的方法都会返回**新字符串**，原字符串不变。

[width(15,46,39)]

| 分类     | 方法                                   | 说明                            |
| :------- | :------------------------------------- | :------------------------------ |
| 操作方法 | `slice` / `substring` / `substr`       | 截取子串                        |
| 操作方法 | `concat()`                             | 拼接（不如用 `+` 或模板字符串） |
| 操作方法 | `trim` / `trimStart` / `trimEnd`       | 去除前后空格 / 首 / 尾          |
| 位置方法 | `indexOf` / `lastIndexOf`              | 查找位置                        |
| 位置方法 | `includes` / `startsWith` / `endsWith` | ES6 新增，返回布尔值            |
| 模式匹配 | `match(regexp)`                        | 类似 `RegExp.exec`              |
| 模式匹配 | `replace(regexp/str, repl)`            | 替换                            |
| 模式匹配 | `split(separator)`                     | 分割成数组                      |

```js
const s = 'Hello World'
console.log(s.length) // 11（字符串的 length 是只读属性）
console.log(s.slice(0, 5)) // "Hello"
console.log(s.includes('World')) // true
console.log(s.replace('World', 'JS')) // "Hello JS"（原 s 不变）
```

#### 3.2.3 Boolean 包装类型

**强烈不建议显式创建 `new Boolean()`**，因为它容易引起误解（所有对象在布尔上下文中都为 `true`）。

### 3.2 “自动装箱”原理解析

访问原始值的属性时（如 `'abc'.length`），引擎会**瞬间**完成三步：

```js
var s1 = 'some text'
var s2 = s1.substring(2)
// 后台实际执行：
// 1. 创建临时包装对象：var temp = new String('some text')
// 2. 调用方法：         temp.substring(2)
// 3. 销毁临时对象：     temp = null
```

> [!TIP] 装箱的触发时机
> 只有**读取**属性/方法时才触发装箱；`typeof`、算术运算不会。`null` / `undefined` 没有对应的包装类型，访问属性会直接抛 `TypeError`。

### 3.3 显式创建 vs 隐式创建

你可以手动创建包装对象，但它们与原始值有本质区别：

[width(18,33,49)]

| 特性         | 原始值 (Primitive)  | 包装对象 (Wrapper Object)       |
| :----------- | :------------------ | :------------------------------ |
| **创建方式** | `var s = "hello"`   | `var s = new String("hello")`   |
| **`typeof`** | `"string"`          | `"object"`                      |
| **真值判断** | 非空字符串为 `true` | **永远为 `true`**（因为是对象） |
| **相等判断** | 值相等则 `==` 为真  | 需依赖隐式转换                  |

```js
var s1 = 'hello' // 隐式创建（原始值）
var s2 = new String('hello') // 显式创建（包装对象）

console.log(typeof s1) // "string"
console.log(typeof s2) // "object"

console.log(s1 === s2) // false（类型不同）
console.log(s1 == s2) // true（宽松相等时，s2 会调用 valueOf/toString 转为原始值再比较）
```

> [!IMPORTANT] 最佳实践
> 永远**不要**用 `new String()` / `new Number()` / `new Boolean()`；但可以直接使用不带 `new` 的 `String()` / `Number()` / `Boolean()` 作为**类型转换函数**，这是安全且推荐的做法。

### 3.4 拆箱 (Unboxing)

用 `valueOf()` / `toString()` 把包装对象转回原始值：

```js
var obj = new Number(123) // object
var obj2 = new String('123') // object
var val = obj.valueOf() // number 123
var val2 = obj2.valueOf() // string '123'
var str = obj.toString() // string '123'

console.log(typeof obj) // "object"
console.log(typeof obj2) // "object"
console.log(typeof val) // "number"
console.log(typeof val2) // "string"
```

> [!NOTE] 隐式拆箱的优先级
> 对象转原始值遵循 **ToPrimitive** 规则：`Symbol.toPrimitive` 优先，其次默认 `valueOf()`，`hint: "string"` 时 `toString()`。

## 4. 单体内置对象 (Singleton Built-in Objects)

不需要实例化（不需要 `new`），直接使用的对象。

### 4.1 Global 对象

它是兜底对象，不属于其他对象的属性和方法都在这里。在浏览器中，Global 对象由 `window` 代理。

[width(63,37)]

| 方法                               | 说明               |
| :--------------------------------- | :----------------- |
| `parseInt` / `parseFloat`          | 字符串转数字       |
| `isNaN` / `isFinite`               | 判断 NaN / 有限值  |
| `encodeURI` / `encodeURIComponent` | URL 编码           |
| `eval`                             | 执行 JS 代码字符串 |

### 4.2 [Math 对象](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math)

[width(14,45,41)]

| 分类 | 方法/属性                   | 说明                     |
| :--- | :-------------------------- | :----------------------- |
| 常量 | `Math.PI`                   | 圆周率 π                 |
| 最值 | `Math.min` / `Math.max`     | 最小值 / 最大值          |
| 舍入 | `Math.ceil`                 | 向上取整                 |
| 舍入 | `Math.floor`                | 向下取整                 |
| 舍入 | `Math.round`                | 四舍五入                 |
| 随机 | `Math.random`               | 返回 [0, 1) 之间的随机数 |
| 计算 | `Math.abs` / `pow` / `sqrt` | 绝对值 / 幂 / 平方根     |

```js
// 技巧：求数组最大值
Math.max(...arr)

// 生成 [min, max] 随机整数
Math.floor(Math.random() * (max - min + 1)) + min
```

## 5. 常见问题与面试题

### 5.1 给原始值添加属性

由于包装对象的生命周期**只有一瞬间**，给原始值添加属性是无效的。

```js
var str = 'abc'
str.color = 'red' // 步骤1: 创建临时对象 -> 步骤2: 添加属性 -> 步骤3: 销毁对象

console.log(str.color) // undefined
// 这里又创建了一个新的临时对象，这个新对象没有 color 属性
```

### 5.2 Boolean 包装对象的误导性

这是最容易出错的地方：**`new Boolean(false)` 在条件判断中是 `true`！**

```js
var falseObject = new Boolean(false)
var result = falseObject && true

console.log(result) // true
```

**原因**：`falseObject` 是一个对象。在 JS 中，**所有的对象（包括空对象）转为布尔值时都是 `true`**。所以永远不要显式地使用 `new Boolean()`。

### 5.3 面试题：`typeof` 与装箱

```js
var a = new String('hello')
var b = 'hello'
console.log(typeof a) // "object"
console.log(typeof b) // "string"
console.log(a instanceof String) // true
console.log(b instanceof String) // false
```

### 5.4 面试题：`==` 与 `===` 的包装差异

```js
console.log(new String('hello') == 'hello') // true（拆箱后值相等）
console.log(new String('hello') === 'hello') // false（类型不同）
console.log(1 == new Number(1)) // true
console.log(1 === new Number(1)) // false
```
