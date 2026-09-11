# 数值的扩展

## 1. 二进制和八进制表示法

ES6 提供二进制（`0b`/`0B`）和八进制（`0o`/`0O`）的写法：

```js
0b111110111 === 503 // true
0o767 === 503 // true
```

ES5 起严格模式已不允许用前缀 `0` 表示八进制，ES6 明确用 `0o`：

```js
// 非严格模式
0o11 === 011 // true

// 严格模式
function f() {
  'use strict'
  console.log(0o11 === 011) // SyntaxError
}
```

将 `0b`/`0o` 前缀字符串转为十进制用 `Number`：

```js
Number('0b111') // 7
Number('0o10') // 8
```

## 2. 数值分隔符

ES2021 允许数值使用下划线（`_`）作为分隔符，方便长数值可读：

```js
let budget = 1_000_000_000_000
budget === 10 ** 12 // true
123_00 === 12_300 // true
```

小数和科学计数法也可用：`0.000_001`、`1e10_000`；其他进制同样适用：`0b1010_0001`、`0xa0_b0_c0`。

**使用注意**：

- 不能放在最前/最后，不能两个以上连在一起。
- 小数点前后、指数 `e`/`E` 前后不能有分隔符。
- 不能紧跟进制前缀（`0b_111` 报错）。

以下都报错：`3_.141`、`3._141`、`1_e12`、`1e_12`、`123__456`、`_1464301`、`1464301_`。

## 3. [`Number`的静态方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Number)

### Number.isFinite(), Number.isNaN()

`Number.isFinite()` 检查数值是否有限（不是 `Infinity`），非数值一律返回 `false`：

```js
Number.isFinite(15) // true
Number.isFinite(NaN) // false
Number.isFinite(Infinity) // false
Number.isFinite('15') // false（不转换）
```

`Number.isNaN()` 只有对 `NaN` 才返回 `true`：

```js
Number.isNaN(NaN) // true
Number.isNaN('NaN') // false（不转换）
```

与全局 `isFinite()`/`isNaN()` 的区别：全局方法先用 `Number()` 转换，新方法只对数值有效：

```js
isFinite('25') // true（转换后判断）
Number.isFinite('25') // false

isNaN('NaN') // true
Number.isNaN('NaN') // false
```

### Number.parseInt(), Number.parseFloat()

ES6 将全局 `parseInt`/`parseFloat` 移植到 `Number` 对象，行为不变，逐步减少全局方法：

```js
Number.parseInt('12.34') === parseInt('12.34') // true
Number.parseFloat('123.45#') === parseFloat('123.45#') // true
```

### Number.isInteger()

判断数值是否为整数。JS 中整数和浮点数同样存储，`25` 与 `25.0` 是同一个值：

```js
Number.isInteger(25) // true
Number.isInteger(25.1) // false
Number.isInteger('15') // false
```

由于 IEEE 754 双精度（最多 53 个二进制位）精度限制，`isInteger` 可能误判：

```js
Number.isInteger(3.0000000000000002) // true（精度丢失）
Number.isInteger(5e-324) // false
Number.isInteger(5e-325) // true（太小被转成 0）
```

对精度要求高时，不建议用 `isInteger` 判断。

### Number.EPSILON

表示 1 与大于 1 的最小浮点数之差（`2^-52`），是 JS 能表示的最小精度：

```js
Number.EPSILON === Math.pow(2, -52) // true
```

用于设置浮点数运算的**误差范围**。浮点数计算不精确：

```js
0.1 + 0.2 // 0.30000000000000004
0.1 + 0.2 === 0.3 // false
```

用误差范围比较：

```js
function withinErrorMargin(left, right) {
  return Math.abs(left - right) < Number.EPSILON * Math.pow(2, 2)
}
withinErrorMargin(0.1 + 0.2, 0.3) // true
```

### Number.isSafeInteger()

JS 能精确表示的整数范围在 `-2^53` 到 `2^53` 之间（不含端点），超出会丢失精度：

```js
Math.pow(2, 53) === Math.pow(2, 53) + 1 // true
```

上下限常量：`Number.MAX_SAFE_INTEGER === 2^53 - 1`，`Number.MIN_SAFE_INTEGER === -Number.MAX_SAFE_INTEGER`。

`Number.isSafeInteger()` 判断整数是否落在此范围内：

```js
Number.isSafeInteger(3) // true
Number.isSafeInteger(9007199254740992) // false
```

**注意**：验证运算结果时，要**同时验证参与运算的每个值**，否则可能误判：

```js
Number.isSafeInteger(9007199254740993 - 990) // true（结果看似安全）
9007199254740993 - 990 // 9007199254740002（实际已出错）

function trusty(left, right, result) {
  if (
    Number.isSafeInteger(left) &&
    Number.isSafeInteger(right) &&
    Number.isSafeInteger(result)
  ) {
    return result
  }
  throw new RangeError('Operation cannot be trusted!')
}
```

## 4. [Math 对象的扩展](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Math)

ES6 在 Math 对象上新增了 17 个静态方法。

### Math.trunc()

去除小数部分，返回整数部分（不四舍五入）：

```js
Math.trunc(4.9) // 4
Math.trunc(-4.9) // -4
```

非数值内部用 `Number()` 转换；空值/无法转换返回 `NaN`。

### Math.sign()

判断正负零，返回五种值：正数 `+1`、负数 `-1`、`0` 返回 `0`、`-0` 返回 `-0`、其他返回 `NaN`：

```js
Math.sign(-5) // -1
Math.sign(0) // +0
Math.sign(-0) // -0
Math.sign('foo') // NaN
```

### Math.cbrt()

计算立方根：

```js
Math.cbrt(-1) // -1
Math.cbrt(2) // 1.2599210498948732
```

### Math.clz32()

返回一个数的 32 位无符号整数形式中**前导 0 的个数**：

```js
Math.clz32(0) // 32
Math.clz32(1) // 31
Math.clz32(1000) // 22
```

小数只考虑整数部分；空值/其他类型先转数值。

### Math.imul()

返回两个数以 32 位带符号整数相乘的结果（等同 `(a * b) | 0` 的低 32 位），可返回大数乘法的正确低位：

```js
Math.imul(2, 4) // 8
Math.imul(0x7fffffff, 0x7fffffff) // 1（普通乘法低位会因精度丢失变 0）
```

### Math.fround()

返回一个数的 32 位单精度浮点数形式，主要作用是把 64 位双精度转为 32 位单精度：

```js
Math.fround(1.125) // 1.125（未丢失精度）
Math.fround(0.3) // 0.30000001192092896（丢失精度）
```

`NaN`/`Infinity` 返回原值。

### Math.hypot()

返回所有参数平方和的平方根：

```js
Math.hypot(3, 4) // 5
Math.hypot(3, 4, 5) // 7.0710678118654755
```

只要有一个参数无法转为数值，就返回 `NaN`。

### Math.f16round()

ES2025 新增，返回最接近输入值的 16 位半精度浮点数（指数 5 位、精度 10 位，可表示 ±65,504 范围）：

```js
Math.f16round(5) // 5
Math.f16round(5.05) // 5.05078125
Math.f16round(100000) // Infinity（超出范围）
```

**对数方法**：ES6 新增 4 个。

### Math.expm1()

返回 `e^x - 1`（即 `Math.exp(x) - 1`）：

```js
Math.expm1(0) // 0
Math.expm1(1) // 1.718281828459045
```

### Math.log1p()

返回 `1 + x` 的自然对数（`Math.log(1 + x)`），`x < -1` 返回 `NaN`：

```js
Math.log1p(1) // 0.6931471805599453
Math.log1p(-2) // NaN
```

### Math.log10()

返回以 10 为底的对数，`x < 0` 返回 `NaN`：

```js
Math.log10(100000) // 5
Math.log10(-2) // NaN
```

### Math.log2()

返回以 2 为底的对数：

```js
Math.log2(1024) // 10
Math.log2(1 << 29) // 29
```

**双曲函数方法**：ES6 新增 6 个。

### Math.sinh()

返回双曲正弦，即 `(e^x - e^-x) / 2`，奇函数 (`sinh(-x) === -sinh(x)`)：

```js
Math.sinh(0) // 0
Math.sinh(1) // 1.1752011936438014
Math.sinh(-1) // -1.1752011936438014
```

### Math.cosh()

返回双曲余弦，即 `(e^x + e^-x) / 2`，偶函数，最小值在 `x = 0` 处取 `1`：

```js
Math.cosh(0) // 1
Math.cosh(1) // 1.5430806348152437
```

### Math.tanh()

返回双曲正切，即 `sinh(x) / cosh(x)`，值域为 `(-1, 1)`，`x` 趋近 `±Infinity` 时趋近 `±1`：

```js
Math.tanh(0) // 0
Math.tanh(1) // 0.7615941559557649
Math.tanh(Infinity) // 1
```

### Math.asinh()

返回双曲正弦的反函数，即满足 `sinh(y) === x` 的 `y`：

```js
Math.asinh(0) // 0
Math.asinh(1) // 0.881373587019543
```

### Math.acosh()

返回双曲余弦的反函数，`x < 1` 时无定义，返回 `NaN`：

```js
Math.acosh(1) // 0
Math.acosh(2) // 1.3169578969248166
Math.acosh(0) // NaN
```

### Math.atanh()

返回双曲正切的反函数，`|x| > 1` 返回 `NaN`，`x = ±1` 返回 `±Infinity`：

```js
Math.atanh(0) // 0
Math.atanh(0.5) // 0.5493061443340548
Math.atanh(1) // Infinity
Math.atanh(2) // NaN
```

## 5. BigInt 数据类型

### 5.1 简介

JS 所有数字都是 64 位浮点数，有两个限制：精度只到 53 个二进制位（约 16 个十进制位）；大于等于 2^1024 返回 `Infinity`。ES2020 引入第八种数据类型 **BigInt**，只表示整数，无位数限制：

```js
const a = 2172141653n
const b = 15346349309n
a * b // 33334444555566667777n
Number(a) * Number(b) // 33334444555566670000（普通整数丢精度）
```

BigInt 必须加后缀 `n`，支持各种进制（`0b1101n`、`0o777n`、`0xffn`）：

```js
1n + 2n // 3n
42n === 42 // false（不同类型）
typeof 123n // 'bigint'
```

BigInt 可用负号（`-42n`），不能用正号（`+42n` 报错，与 asm.js 冲突）。

### 5.2 [BigInt 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

`BigInt()` 将其他类型转为 BigInt，转换规则基本与 `Number()` 一致：

```js
BigInt(123) // 123n
BigInt('123') // 123n
BigInt(false) // 0n
```

必须有参数且能正常转数值，以下报错：`BigInt(undefined)`、`BigInt(null)`、`BigInt('123n')`、`BigInt('abc')`、`BigInt(1.5)`。

实例方法：`toString()`、`valueOf()`、`toLocaleString()`。静态方法：

- `BigInt.asUintN(width, BigInt)`：转为 `0` 到 `2^width - 1` 的值。
- `BigInt.asIntN(width, BigInt)`：转为 `-2^(width-1)` 到 `2^(width-1) - 1` 的值。

```js
const max = 2n ** (64n - 1n) - 1n
BigInt.asIntN(64, max) // 9223372036854775807n
BigInt.asIntN(64, max + 1n) // -9223372036854775808n（溢出为符号位）
BigInt.asUintN(64, max + 1n) // 9223372036854775808n
```

位数小于数值本身位数时，头部位被舍弃。二进制数组新增 `BigUint64Array`/`BigInt64Array` 类型。

### 5.3 转换规则

用 `Boolean()`、`Number()`、`String()` 转换：

```js
Boolean(0n) // false
Number(1n) // 1
String(1n) // "1"（后缀 n 消失）
!0n // true（取反转布尔）
```

### 5.4 数学运算

`+`、`-`、`*`、`**` 与 Number 行为一致；除法 `/` 舍去小数：

```js
9n / 5n // 1n
```

两个例外会报错：无符号右移 `>>>`（BigInt 恒带符号，无意义）、一元求正 `+`（asm.js 兼容）。

BigInt 不能与普通数值混合运算（会丢精度）：

```js
1n + 1.3 // 报错
Math.sqrt(4n) // 报错
Math.sqrt(Number(4n)) // 2
```

### 5.5 其他运算

`0n` 对应 `false`，其他值对应 `true`。比较（`>`）和相等（`==`）允许与 Number 混合（不丢精度），但 `===` 严格区分类型：

```js
0n < 1 // true
0n == 0 // true
0n === 0 // false
'' + 123n // "123"（与字符串混合先转字符串）
```

## **6. 常见问题与陷阱 (FAQ)**

### 6.1 为什么 `0.1 + 0.2 !== 0.3`？\*\*

这是 IEEE 754 双精度浮点数的通病：0.1 和 0.2 在二进制中是无限循环小数，相加后精度丢失，结果是 `0.30000000000000004`。

**解决**：

- 用 `Number.EPSILON` 做误差范围比较：`Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON`。
- 转成整数计算（金额用"**分**"不用"**元**"）。
- 使用专门库（如 `decimal.js`）。

### 6.2 全局 `isNaN` 和 `Number.isNaN` 有什么区别？（高频面试题）

- `isNaN(value)`：先尝试**转换**为数字，若结果是 `NaN` 就返回 `true`。所以 `isNaN("foo")` 为 `true`。
- `Number.isNaN(value)`：**不转换**，先判断类型是否为 Number 再判断值。所以 `Number.isNaN("foo")` 为 `false`。**这是判断 NaN 的正确方法**。

### 6.3 `parseInt` 和 `Math.trunc` 去除小数有什么区别？

`Math.trunc` 是纯数学运算，直接舍去小数位；`parseInt` 会先把参数转成**字符串**再解析，可能意外：

```js
Math.trunc(0.0000001) // 0
parseInt(0.0000001) // 1（转字符串是 "1e-7"，parseInt 解析到 '1'）
```

### 6.4 什么时候应该用 `BigInt`？

仅当需要处理**超过 `2^53 - 1`** 的整数（高精度时间戳、加密算法、特定 ID）时。不要用它替代普通 `Number`，因为 `BigInt` 性能通常较差且操作受限。

### 6.5 `Number.EPSILON` 是什么？

它是 JS 中 1 与大于 1 的最小浮点数之间的差值（约 `2.22e-16`），定义了浮点数计算的**最小误差范围**。两数差值小于它，可认为两数相等。
