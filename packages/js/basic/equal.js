/*
 * 示例代码：equal.md
 * 来源文档：apps/docs/js/basic/equal.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 3.1 工作原理 =====
// object.is = function (a, b) {
//   // 情况 1: 处理 +0 和 -0
//   // 如果 x 和 y 都是 0，它们通过 `===` 比较会是 true。
//   // 但我们需要区分 +0 和 -0。
//   // 技巧：1 / +0 === Infinity，而 1 / -0 === -Infinity。
//   // 所以，如果它们的倒数不相等，说明一个是 +0，另一个是 -0。
//   if (x === 0 && y === 0) {
//     return 1 / x === 1 / y
//   }
//
//   // 情况 2: 处理 NaN
//   // NaN 是唯一一个不等于自身的值 (NaN !== NaN)。
//   // 所以，如果 x 不等于 x，那么 x 就是 NaN。
//   // 如果 x 和 y 都是 NaN，那么它们应该被认为是相等的。
//   if (x !== x) {
//     return y !== y
//   }
//
//   // 情况 3: 其他所有情况
//   // 对于所有其他值 (包括 null, undefined, string, boolean, object引用等)，
//   // Object.is() 的行为与 === 完全相同。
//   return x === y
// }

// ===== 问题 1：true、false 与数字的比较 =====
// const value = '1'
//
// if (value == true) {
//   // "1" == true -> "1" == 1 -> 1 == 1 -> true
//   console.log('Value is true') // ✅ 执行
// }
//
// const text = 'hello'
// if (text == true) {
//   // "hello" == true -> NaN == 1 -> false
//   console.log('Text is true') // ❌ 不执行
// }

// ===== 问题 1：true、false 与数字的比较 =====
// // 正确的方式
// if (value) {
//   console.log('Value is truthy')
// }

// ===== 问题 2：空数组与 false 的比较 =====
// if ([]) {
//   console.log('Empty array is truthy') // ✅ 执行
// }
//
// console.log([] == false) // true

// ===== 问题 3：null 与 0 的比较 =====
// console.log(null == 0) // false (宽松相等有 null 和 undefined 的特例)
//
// console.log(null > 0) // false (关系比较中，null -> 0)
// console.log(null >= 0) // true (关系比较中，null -> 0)

// ===== 问题 3：null 与 0 的比较 =====
// const value = null
//
// if (value === 0) {
//   // ...
// }
// if (value === null) {
//   // ...
// }

