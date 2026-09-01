/*
 * 示例代码：jsonSerialize.md
 * 来源文档：apps/docs/js/basic/jsonSerialize.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 value (必需) =====
// const user = {
//   id: 1,
//   name: 'Alice',
//   isAdmin: true,
//   courses: ['Math', 'Science'],
//   profile: {
//     age: 30,
//     city: 'New York',
//   },
// }
//
// const jsonString = JSON.stringify(user)
// console.log(jsonString)
// // 输出: '{"id":1,"name":"Alice","isAdmin":true,"courses":["Math","Science"],"profile":{"age":30,"city":"New York"}}'

// ===== 1.1 value (必需) =====
// const data = {
//   a: undefined,
//   b: Symbol('id'),
//   c: () => {},
//   d: [NaN, Infinity],
// }
// console.log(JSON.stringify(data)) // '{"d":[null,null]}' (a, b, c 都消失了)

// ===== 1.2 replacer (可选) =====
// const product = { name: 'Laptop', price: 1200, secretCode: 'XYZ123' }
//
// const replacerFunc = (key, value) => {
//   if (key === 'secretCode') {
//     return undefined // 过滤掉 secretCode
//   }
//   if (key === 'price') {
//     return `$${value}` // 修改 price 的值
//   }
//   return value
// }
//
// console.log(JSON.stringify(product, replacerFunc))
// // '{"name":"Laptop","price":"$1200"}'

// ===== 2.1 text (必需) =====
// const jsonString =
//   '{"id":1,"name":"Alice","isAdmin":true,"courses":["Math","Science"]}'
// const userObject = JSON.parse(jsonString)
//
// console.log(userObject.name) // "Alice"
// console.log(userObject.courses[0]) // "Math"

// ===== 2.2 reviver (可选) =====
// const jsonString = '{"name":"Meeting","time":"2023-10-27T10:00:00.000Z"}'
//
// const reviverFunc = (key, value) => {
//   // 正则表达式匹配 ISO 8601 日期格式
//   if (
//     typeof value === 'string' &&
//     /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
//   ) {
//     return new Date(value)
//   }
//   return value
// }
//
// const eventObject = JSON.parse(jsonString, reviverFunc)
//
// console.log(eventObject.time instanceof Date) // true

// ===== 3.2 如何处理 BigInt 的序列化？ =====
// // 方法一：修改原型 (会影响全局)
// BigInt.prototype.toJSON = function () {
//   return this.toString()
// }
// console.log(JSON.stringify({ value: 123n })) // '{"value":"123"}'
//
// // 方法二：使用 replacer (更安全)
// const replacer = (key, value) => {
//   return typeof value === 'bigint' ? value.toString() : value
// }

// ===== 3.5 toJSON() 方法有什么用？ =====
// const user = {
//   name: 'Alice',
//   lastLogin: new Date(),
//   toJSON: function () {
//     return {
//       // 自定义序列化结果
//       user_name: this.name,
//       login_timestamp: this.lastLogin.getTime(),
//     }
//   },
// }
// console.log(JSON.stringify(user))
// // '{"user_name":"Alice","login_timestamp":169839...}'

