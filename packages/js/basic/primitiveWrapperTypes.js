/*
 * 示例代码：primitiveWrapperTypes.md
 * 来源文档：apps/docs/js/basic/primitiveWrapperTypes.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 3. “自动装箱” (Auto-boxing) 原理解析 =====
// var s1 = 'some text'
// var s2 = s1.substring(2)

// ===== 4. 显式创建 vs 隐式创建 =====
// var s1 = 'hello'
// var s2 = new String('hello')
//
// console.log(typeof s1) // "string"
// console.log(typeof s2) // "object"
//
// console.log(s1 === s2) // false (类型不同)
// console.log(s1 == s2) // true (值相等，隐式转换)

// ===== 坑点 1：给原始值添加属性 =====
// var str = 'abc'
// str.color = 'red' // 步骤1: 创建临时对象 -> 步骤2: 添加属性 -> 步骤3: 销毁对象
//
// console.log(str.color) // undefined
// // 这里又创建了一个新的临时对象，这个新对象显然没有 color 属性

// ===== 坑点 2：Boolean 包装对象的误导性 =====
// var falseObject = new Boolean(false)
// var result = falseObject && true
//
// console.log(result) // true

// ===== 6. 拆箱 (Unboxing) =====
// var obj = new Number(123) // object
// var obj2 = new String('123') // object
// var val = obj.valueOf() // number 123
// var val = obj.toString() // string 123
//
// console.log(typeof obj) // "object"
// console.log(typeof obj2) // "object"
// console.log(typeof val) // "number"
// console.log(typeof val2) // "string"

