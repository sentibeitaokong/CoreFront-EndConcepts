/*
 * 示例代码：basicPrimitiveType.md
 * 来源文档：apps/docs/js/basic/basicPrimitiveType.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 创建日期 =====
// let now = new Date() // 当前时间
// let date1 = new Date(1000) // 时间戳（1970-01-01 00:00:01）
// let date2 = new Date('2023-12-25') // 字符串解析
// let date3 = new Date(2023, 11, 25, 10, 30, 0) // 年, 月(0-11), 日, 时, 分, 秒

// ===== 1.3 Date.now() =====
// const start = Date.now()
// // ... do something
// const end = Date.now()
// console.log(`耗时: ${end - start}ms`)

// ===== 2.1 创建方式 =====
// // 1. 字面量形式 (推荐)
// // 格式: /pattern/flags
// let re1 = /at/g
//
// // 2. 构造函数形式
// // 格式: new RegExp("pattern", "flags")
// let re2 = new RegExp('at', 'g')

// ===== 2.3 核心方法 =====
// let text = 'cat, bat, sat, fat'
// let pattern = /.at/
//
// if (pattern.test(text)) {
//   console.log('匹配成功')
// }
//
// let matches = pattern.exec(text)
// console.log(matches[0]) // "cat"
// console.log(matches.index) // 0

// ===== 2. Number =====
// let num = 10.005
// console.log(num.toFixed(2)) // "10.01" (注意四舍五入的坑，实际往往需配合 Math 库)

// ===== 3.3 “自动装箱” (Auto-boxing) 原理解析 =====
// var s1 = 'some text'
// var s2 = s1.substring(2)

// ===== 3.4 显式创建 vs 隐式创建 =====
// var s1 = 'hello' //隐式创建
// var s2 = new String('hello') //显式创建
//
// console.log(typeof s1) // "string"
// console.log(typeof s2) // "object"
//
// console.log(s1 === s2) // false (类型不同)
// console.log(s1 == s2) // true (值相等，隐式转换)

// ===== 5.1 给原始值添加属性 =====
// var str = 'abc'
// str.color = 'red' // 步骤1: 创建临时对象 -> 步骤2: 添加属性 -> 步骤3: 销毁对象
//
// console.log(str.color) // undefined
// // 这里又创建了一个新的临时对象，这个新对象显然没有 color 属性

// ===== 5.2 Boolean 包装对象的误导性 =====
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

