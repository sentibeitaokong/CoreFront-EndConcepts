/*
 * 示例代码：basicFunction.md
 * 来源文档：apps/docs/js/basic/basicFunction.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 2.1 形参 (Parameters) vs. 实参 (Arguments) =====
// // 'a' 和 'b' 形参 (Parameters)
// function multiply(a, b) {
//   return a * b
// }
//
// // 5 和 10 是实参 (Arguments)
// multiply(5, 10)

// ===== 3.1 按值传递 (Pass by Value) =====
// function changeValue(num) {
//   // 尝试在函数内部修改参数的值
//   num = 100
//   console.log('函数内部的值: ', num) // 输出 100
// }
//
// let myNumber = 50
// console.log('函数调用前: ', myNumber) // 输出 50
//
// changeValue(myNumber)
//
// console.log('函数调用后: ', myNumber) // 仍然输出 50

// ===== 1. 修改对象属性 =====
// function setAge(person) {
//   // 修改传入对象的属性
//   person.age = 30
//   console.log('函数内部的对象: ', person)
// }
//
// let myFriend = { name: '张三', age: 25 }
// console.log('函数调用前: ', myFriend) // { name: '张三', age: 25 }
//
// setAge(myFriend)
//
// console.log('函数调用后: ', myFriend) // { name: '张三', age: 30 }

// ===== 2. 重新赋值对象 =====
// function reassignObject(person) {
//   // 给参数重新赋一个新值
//   person = { name: '李四', age: 40 }
//   console.log('函数内部(重新赋值后): ', person)
// }
//
// let myFriend = { name: '张三', age: 25 }
// console.log('函数调用前: ', myFriend) // { name: '张三', age: 25 }
//
// reassignObject(myFriend)
//
// console.log('函数调用后: ', myFriend) // 仍然是 { name: '张三', age: 25 }

// ===== 3.1 为什么我的函数返回 undefined？ =====
// // 错误示例
// function getFullName(firstName, lastName) {
//   const fullName = `${firstName} ${lastName}`
//   // 忘记 return 了！
// }
//
// let name = getFullName('John', 'Doe')
// console.log(name) // undefined
//
// // 正确示例
// function getFullName_fixed(firstName, lastName) {
//   const fullName = `${firstName} ${lastName}`
//   return fullName // 必须 return
// }

// ===== 3.2 函数声明 vs. 函数表达式 (Hoisting) =====
// // 函数声明: Hoisting ✅
// sayHello() // "Hello!"
// function sayHello() {
//   console.log('Hello!')
// }
//
// // 函数表达式: No Hoisting ❌
// // sayGoodbye(); // TypeError: sayGoodbye is not a function
// const sayGoodbye = function () {
//   console.log('Goodbye!')
// }
// sayGoodbye() // 必须在赋值后调用

// ===== 3.3 箭头函数 vs. 普通函数 (基础 this 问题) =====
// const myObject = {
//   name: 'My Object',
//
//   // 普通函数作为回调
//   startTimeout_old: function () {
//     setTimeout(function () {
//       // 这里的 this 指向 window，而不是 myObject！
//       console.log(`[Old] Name: ${this.name}`)
//     }, 1000)
//   },
//
//   // 箭头函数作为回调
//   startTimeout_new: function () {
//     setTimeout(() => {
//       // 箭头函数“借用”了外层 startTimeout_new 的 this，即 myObject
//       console.log(`[New] Name: ${this.name}`)
//     }, 1000)
//   },
// }
//
// myObject.startTimeout_old() // [Old] Name: undefined (或 window 的 name)
// myObject.startTimeout_new() // [New] Name: My Object

// ===== 3.4 参数数量不匹配 =====
// function logThree(a, b, c) {
//   console.log(a, b, c)
// }
//
// logThree(1, 2, 3) // 1 2 3
// logThree(1, 2) // 1 2 undefined (c 是 undefined)
// logThree(1, 2, 3, 4) // 1 2 3 (多余的 4 被忽略)

