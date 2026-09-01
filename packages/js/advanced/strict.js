/*
 * 示例代码：strict.md
 * 来源文档：apps/docs/js/advanced/misc/strict.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 2.1 在全局作用域启用 =====
// // script.js
// 'use strict'
// // 整个文件的代码都运行在严格模式下
//
// function foo() {
//   // ...
// }

// ===== 2.2 在函数作用域启用 =====
// function myFunction() {
//   'use strict'
//   // myFunction 内部的代码运行在严格模式下
//   // 嵌套函数也会继承严格模式，除非它自己禁用（不推荐）
//   function nestedFunction() {
//     // ...
//   }
// }
//
// // 外部代码不受影响，运行在非严格模式下

