/*
 * 示例代码：number.md
 * 来源文档：apps/docs/js/advanced/data-types/number.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 二进制和八进制表示法 =====
// 0b111110111 === 503 // true
// 0o767 === 503 // true

// ===== 1. 二进制和八进制表示法 =====
// // 非严格模式
// ;(function () {
//   console.log(0o11 === 011)
// })()(
//   // true
//
//   // 严格模式
//   function () {
//     'use strict'
//     console.log(0o11 === 011)
//   },
// )() // Uncaught SyntaxError: Octal literals are not allowed in strict mode.

// ===== 1. 二进制和八进制表示法 =====
// Number('0b111') // 7
// Number('0o10') // 8

// ===== 2. 数值分隔符 =====
// let budget = 1_000_000_000_000
// budget === 10 ** 12 // true

// ===== 2. 数值分隔符 =====
// 123_00 === 12_300 // true
//
// 12345_00 === 123_4500 // true
// 12345_00 === 1_234_500 // true

// ===== 2. 数值分隔符 =====
// // 小数
// 0.000_001
//
// // 科学计数法
// 1e10_000

// ===== 2. 数值分隔符 =====
// // 全部报错
// 3_.141
// 3._141
// 1_e12
// 1e_12
// 123__456
// _1464301
// 1464301_

// ===== 2. 数值分隔符 =====
// // 二进制
// 0b1010_0001_1000_0101
// // 十六进制
// 0xa0_b0_c0

// ===== 2. 数值分隔符 =====
// // 报错
// 0_b111111000
// 0b_111111000

// ===== 2. 数值分隔符 =====
// let num = 12_345
//
// num // 12345
// num.toString() // 12345

// ===== 2. 数值分隔符 =====
// Number('123_456') // NaN
// parseInt('123_456') // 123

// ===== Number.isFinite(), Number.isNaN() =====
// Number.isFinite(15) // true
// Number.isFinite(0.8) // true
// Number.isFinite(NaN) // false
// Number.isFinite(Infinity) // false
// Number.isFinite(-Infinity) // false
// Number.isFinite('foo') // false
// Number.isFinite('15') // false
// Number.isFinite(true) // false

// ===== Number.isFinite(), Number.isNaN() =====
// Number.isNaN(NaN) // true
// Number.isNaN(15) // false
// Number.isNaN('15') // false
// Number.isNaN(true) // false
// Number.isNaN(9 / NaN) // true
// Number.isNaN('true' / 0) // true
// Number.isNaN('true' / 'true') // true

// ===== Number.isFinite(), Number.isNaN() =====
// isFinite(25) // true
// isFinite('25') // true
// Number.isFinite(25) // true
// Number.isFinite('25') // false
//
// isNaN(NaN) // true
// isNaN('NaN') // true
// Number.isNaN(NaN) // true
// Number.isNaN('NaN') // false
// Number.isNaN(1) // false

// ===== Number.parseInt(), Number.parseFloat() =====
// // ES5的写法
// parseInt('12.34') // 12
// parseFloat('123.45#') // 123.45
//
// // ES6的写法
// Number.parseInt('12.34') // 12
// Number.parseFloat('123.45#') // 123.45

// ===== Number.parseInt(), Number.parseFloat() =====
// Number.parseInt === parseInt // true
// Number.parseFloat === parseFloat // true

// ===== Number.isInteger() =====
// Number.isInteger(25) // true
// Number.isInteger(25.1) // false

// ===== Number.isInteger() =====
// Number.isInteger(25) // true
// Number.isInteger(25.0) // true

// ===== Number.isInteger() =====
// Number.isInteger() // false
// Number.isInteger(null) // false
// Number.isInteger('15') // false
// Number.isInteger(true) // false

// ===== Number.isInteger() =====
// Number.isInteger(3.0000000000000002) // true

// ===== Number.isInteger() =====
// Number.isInteger(5e-324) // false
// Number.isInteger(5e-325) // true

// ===== Number.EPSILON =====
// Number.EPSILON === Math.pow(2, -52)
// // true
// Number.EPSILON
// // 2.220446049250313e-16
// Number.EPSILON.toFixed(20)
// // "0.00000000000000022204"

// ===== Number.EPSILON =====
// 0.1 + 0.2
// // 0.30000000000000004
//
// 0.1 + 0.2 - 0.3
// // 5.551115123125783e-17
//
// ;(5.551115123125783e-17).toFixed(20)
// // '0.00000000000000005551'

// ===== Number.EPSILON =====
// 0.1 + 0.2 === 0.3 // false

// ===== Number.EPSILON =====
// 5.551115123125783e-17 < Number.EPSILON * Math.pow(2, 2)
// // true

// ===== Number.EPSILON =====
// function withinErrorMargin(left, right) {
//   return Math.abs(left - right) < Number.EPSILON * Math.pow(2, 2)
// }
//
// 0.1 + 0.2 === 0.3 // false
// withinErrorMargin(0.1 + 0.2, 0.3) // true
//
// 1.1 + 1.3 === 2.4 // false
// withinErrorMargin(1.1 + 1.3, 2.4) // true

// ===== Number.isSafeInteger() =====
// Math.pow(2, 53) // 9007199254740992
//
// 9007199254740992 // 9007199254740992
// 9007199254740993 // 9007199254740992
//
// Math.pow(2, 53) === Math.pow(2, 53) + 1
// // true

// ===== Number.isSafeInteger() =====
// Number.MAX_SAFE_INTEGER === Math.pow(2, 53) - 1
// // true
// Number.MAX_SAFE_INTEGER === 9007199254740991
// // true
//
// Number.MIN_SAFE_INTEGER === -Number.MAX_SAFE_INTEGER
// // true
// Number.MIN_SAFE_INTEGER === -9007199254740991
// // true

// ===== Number.isSafeInteger() =====
// Number.isSafeInteger('a') // false
// Number.isSafeInteger(null) // false
// Number.isSafeInteger(NaN) // false
// Number.isSafeInteger(Infinity) // false
// Number.isSafeInteger(-Infinity) // false
//
// Number.isSafeInteger(3) // true
// Number.isSafeInteger(1.2) // false
// Number.isSafeInteger(9007199254740990) // true
// Number.isSafeInteger(9007199254740992) // false
//
// Number.isSafeInteger(Number.MIN_SAFE_INTEGER - 1) // false
// Number.isSafeInteger(Number.MIN_SAFE_INTEGER) // true
// Number.isSafeInteger(Number.MAX_SAFE_INTEGER) // true
// Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1) // false

// ===== Number.isSafeInteger() =====
// Number.isSafeInteger = function (n) {
//   return (
//     typeof n === 'number' &&
//     Math.round(n) === n &&
//     Number.MIN_SAFE_INTEGER <= n &&
//     n <= Number.MAX_SAFE_INTEGER
//   )
// }

// ===== Number.isSafeInteger() =====
// Number.isSafeInteger(9007199254740993)
// // false
// Number.isSafeInteger(990)
// // true
// Number.isSafeInteger(9007199254740993 - 990)
// // true
// 9007199254740993 - 990
// // 返回结果 9007199254740002
// // 正确答案应该是 9007199254740003

// ===== Number.isSafeInteger() =====
// 9007199254740993 === 9007199254740992
// // true

// ===== Number.isSafeInteger() =====
// function trusty(left, right, result) {
//   if (
//     Number.isSafeInteger(left) &&
//     Number.isSafeInteger(right) &&
//     Number.isSafeInteger(result)
//   ) {
//     return result
//   }
//   throw new RangeError('Operation cannot be trusted!')
// }
//
// trusty(9007199254740993, 990, 9007199254740993 - 990)
// // RangeError: Operation cannot be trusted!
//
// trusty(1, 2, 3)
// // 3

// ===== Math.trunc() =====
// Math.trunc(4.1) // 4
// Math.trunc(4.9) // 4
// Math.trunc(-4.1) // -4
// Math.trunc(-4.9) // -4
// Math.trunc(-0.1234) // -0

// ===== Math.trunc() =====
// Math.trunc('123.456') // 123
// Math.trunc(true) //1
// Math.trunc(false) // 0
// Math.trunc(null) // 0

// ===== Math.trunc() =====
// Math.trunc(NaN) // NaN
// Math.trunc('foo') // NaN
// Math.trunc() // NaN
// Math.trunc(undefined) // NaN

// ===== Math.trunc() =====
// Math.trunc =
//   Math.trunc ||
//   function (x) {
//     return x < 0 ? Math.ceil(x) : Math.floor(x)
//   }

// ===== Math.sign() =====
// Math.sign(-5) // -1
// Math.sign(5) // +1
// Math.sign(0) // +0
// Math.sign(-0) // -0
// Math.sign(NaN) // NaN

// ===== Math.sign() =====
// Math.sign('') // 0
// Math.sign(true) // +1
// Math.sign(false) // 0
// Math.sign(null) // 0
// Math.sign('9') // +1
// Math.sign('foo') // NaN
// Math.sign() // NaN
// Math.sign(undefined) // NaN

// ===== Math.sign() =====
// Math.sign =
//   Math.sign ||
//   function (x) {
//     x = +x // convert to a number
//     if (x === 0 || isNaN(x)) {
//       return x
//     }
//     return x > 0 ? 1 : -1
//   }

// ===== Math.cbrt() =====
// Math.cbrt(-1) // -1
// Math.cbrt(0) // 0
// Math.cbrt(1) // 1
// Math.cbrt(2) // 1.2599210498948732

// ===== Math.cbrt() =====
// Math.cbrt('8') // 2
// Math.cbrt('hello') // NaN

// ===== Math.cbrt() =====
// Math.cbrt =
//   Math.cbrt ||
//   function (x) {
//     var y = Math.pow(Math.abs(x), 1 / 3)
//     return x < 0 ? -y : y
//   }

// ===== Math.clz32() =====
// Math.clz32(0) // 32
// Math.clz32(1) // 31
// Math.clz32(1000) // 22
// Math.clz32(0b01000000000000000000000000000000) // 1
// Math.clz32(0b00100000000000000000000000000000) // 2

// ===== Math.clz32() =====
// Math.clz32(0) // 32
// Math.clz32(1) // 31
// Math.clz32(1 << 1) // 30
// Math.clz32(1 << 2) // 29
// Math.clz32(1 << 29) // 2

// ===== Math.clz32() =====
// Math.clz32(3.2) // 30
// Math.clz32(3.9) // 30

// ===== Math.clz32() =====
// Math.clz32() // 32
// Math.clz32(NaN) // 32
// Math.clz32(Infinity) // 32
// Math.clz32(null) // 32
// Math.clz32('foo') // 32
// Math.clz32([]) // 32
// Math.clz32({}) // 32
// Math.clz32(true) // 31

// ===== Math.imul() =====
// Math.imul(2, 4) // 8
// Math.imul(-1, 8) // -8
// Math.imul(-2, -2) // 4

// ===== Math.imul() =====
// ;(0x7fffffff * 0x7fffffff) | 0 // 0

// ===== Math.imul() =====
// Math.imul(0x7fffffff, 0x7fffffff) // 1

// ===== Math.fround() =====
// Math.fround(0) // 0
// Math.fround(1) // 1
// Math.fround(2 ** 24 - 1) // 16777215

// ===== Math.fround() =====
// Math.fround(2 ** 24) // 16777216
// Math.fround(2 ** 24 + 1) // 16777216

// ===== Math.fround() =====
// // 未丢失有效精度
// Math.fround(1.125) // 1.125
// Math.fround(7.25) // 7.25
//
// // 丢失精度
// Math.fround(0.3) // 0.30000001192092896
// Math.fround(0.7) // 0.699999988079071
// Math.fround(1.0000000123) // 1

// ===== Math.fround() =====
// Math.fround(NaN) // NaN
// Math.fround(Infinity) // Infinity
//
// Math.fround('5') // 5
// Math.fround(true) // 1
// Math.fround(null) // 0
// Math.fround([]) // 0
// Math.fround({}) // NaN

// ===== Math.fround() =====
// Math.fround =
//   Math.fround ||
//   function (x) {
//     return new Float32Array([x])[0]
//   }

// ===== Math.hypot() =====
// Math.hypot(3, 4) // 5
// Math.hypot(3, 4, 5) // 7.0710678118654755
// Math.hypot() // 0
// Math.hypot(NaN) // NaN
// Math.hypot(3, 4, 'foo') // NaN
// Math.hypot(3, 4, '5') // 7.0710678118654755
// Math.hypot(-3) // 3

// ===== Math.f16round() =====
// Math.f16round(5) // 5
// Math.f16round(5.05) // 5.05078125

// ===== Math.f16round() =====
// Math.f16round(100000) // Infinity

// ===== Math.expm1() =====
// Math.expm1(-1) // -0.6321205588285577
// Math.expm1(0) // 0
// Math.expm1(1) // 1.718281828459045

// ===== Math.expm1() =====
// Math.expm1 =
//   Math.expm1 ||
//   function (x) {
//     return Math.exp(x) - 1
//   }

// ===== Math.log1p() =====
// Math.log1p(1) // 0.6931471805599453
// Math.log1p(0) // 0
// Math.log1p(-1) // -Infinity
// Math.log1p(-2) // NaN

// ===== Math.log1p() =====
// Math.log1p =
//   Math.log1p ||
//   function (x) {
//     return Math.log(1 + x)
//   }

// ===== Math.log10() =====
// Math.log10(2) // 0.3010299956639812
// Math.log10(1) // 0
// Math.log10(0) // -Infinity
// Math.log10(-2) // NaN
// Math.log10(100000) // 5

// ===== Math.log10() =====
// Math.log10 =
//   Math.log10 ||
//   function (x) {
//     return Math.log(x) / Math.LN10
//   }

// ===== Math.log2() =====
// Math.log2(3) // 1.584962500721156
// Math.log2(2) // 1
// Math.log2(1) // 0
// Math.log2(0) // -Infinity
// Math.log2(-2) // NaN
// Math.log2(1024) // 10
// Math.log2(1 << 29) // 29

// ===== Math.log2() =====
// Math.log2 =
//   Math.log2 ||
//   function (x) {
//     return Math.log(x) / Math.LN2
//   }

// ===== 5.1 简介 =====
// // 超过 53 个二进制位的数值，无法保持精度
// Math.pow(2, 53) === Math.pow(2, 53) + 1 // true
//
// // 超过 2 的 1024 次方的数值，无法表示
// Math.pow(2, 1024) // Infinity

// ===== 5.1 简介 =====
// const a = 2172141653n
// const b = 15346349309n
//
// // BigInt 可以保持精度
// a * b // 33334444555566667777n
//
// // 普通整数无法保持精度
// Number(a) * Number(b) // 33334444555566670000

// ===== 5.1 简介 =====
// 1234 // 普通整数
// 1234n // BigInt
//
// // BigInt 的运算
// 1n + 2n // 3n

// ===== 5.1 简介 =====
// 0b1101n // 二进制
// 0o777n // 八进制
// 0xffn // 十六进制

// ===== 5.1 简介 =====
// 42n === 42 // false

// ===== 5.1 简介 =====
// typeof 123n // 'bigint'

// ===== 5.1 简介 =====
// ;-42n + // 正确
//   42n // 报错

// ===== 5.1 简介 =====
// let p = 1
// for (let i = 1; i <= 70; i++) {
//   p *= i
// }
// console.log(p) // 1.197857166996989e+100

// ===== 5.1 简介 =====
// let p = 1n
// for (let i = 1n; i <= 70n; i++) {
//   p *= i
// }
// console.log(p) // 11978571...00000000n

// ===== 5.2 BigInt 函数 =====
// BigInt(123) // 123n
// BigInt('123') // 123n
// BigInt(false) // 0n
// BigInt(true) // 1n

// ===== 5.2 BigInt 函数 =====
// new BigInt() // TypeError
// BigInt(undefined) //TypeError
// BigInt(null) // TypeError
// BigInt('123n') // SyntaxError
// BigInt('abc') // SyntaxError

// ===== 5.2 BigInt 函数 =====
// BigInt(1.5) // RangeError
// BigInt('1.5') // SyntaxError

// ===== 5.2 BigInt 函数 =====
// const max = 2n ** (64n - 1n) - 1n
//
// BigInt.asIntN(64, max)
// // 9223372036854775807n
// BigInt.asIntN(64, max + 1n)
// // -9223372036854775808n
// BigInt.asUintN(64, max + 1n)
// // 9223372036854775808n

// ===== 5.2 BigInt 函数 =====
// const max = 2n ** (64n - 1n) - 1n
//
// BigInt.asIntN(32, max) // -1n
// BigInt.asUintN(32, max) // 4294967295n

// ===== 5.3 转换规则 =====
// Boolean(0n) // false
// Boolean(1n) // true
// Number(1n) // 1
// String(1n) // "1"

// ===== 5.3 转换规则 =====
// !0n // true
// !1n // false

// ===== 5.4 数学运算 =====
// 9n / 5n
// // 1n

// ===== 5.4 数学运算 =====
// 1n + 1.3 // 报错

// ===== 5.4 数学运算 =====
// // 错误的写法
// Math.sqrt(4n) // 报错
//
// // 正确的写法
// Math.sqrt(Number(4n)) // 2

// ===== 5.4 数学运算 =====
// 1n | 0 // 报错

// ===== 5.5 其他运算 =====
// if (0n) {
//   console.log('if')
// } else {
//   console.log('else')
// }
// // else

// ===== 5.5 其他运算 =====
// 0n < 1 // true
// 0n < true // true
// 0n == 0 // true
// 0n == false // true
// 0n === 0 // false

// ===== 5.5 其他运算 =====
// '' + 123n // "123"

