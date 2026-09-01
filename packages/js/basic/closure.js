/*
 * 示例代码：closure.md
 * 来源文档：apps/docs/js/basic/closure.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1. 什么是闭包？ =====
// function outerFunction() {
//   const outerVariable = 'I am outside!' // 这个变量被闭包“捕获”
//
//   function innerFunction() {
//     console.log(outerVariable) // 内部函数访问了外部变量
//   }
//
//   return innerFunction // 返回内部函数
// }
//
// // 1. 调用外部函数，它返回了内部函数
// const myClosure = outerFunction()
//
// // 2. outerFunction 已经执行完毕，其执行上下文已出栈。
// //    但由于 myClosure（即 innerFunction）引用了 outerVariable，
// //    outerVariable 并没有被销毁。
//
// // 3. 调用内部函数
// myClosure() // 输出: "I am outside!"

// ===== 2. 闭包的三大特性 =====
// function getOuter() {
//   var date = '815'
//   function getDate(str) {
//     console.log(str + date) //访问外部的date
//   }
//   return getDate('今天是：') //"今天是：815"
// }
// getOuter()

// ===== 2. 闭包的三大特性 =====
// function getOuter() {
//   var date = '815'
//   function getDate(str) {
//     console.log(str + date) //访问外部的date
//   }
//   return getDate //外部函数返回
// }
// var today = getOuter()
// today('今天是：') //"今天是：815"
// today('明天不是：') //"明天不是：815"

// ===== 2. 闭包的三大特性 =====
// function updateCount() {
//   var count = 0
//   function getCount(val) {
//     count = val
//     console.log(count)
//   }
//   return getCount //外部函数返回
// }
// var count = updateCount()
// count(815) //815
// count(816) //816

// ===== 4.1 模拟私有变量 (Private Variables) =====
// function createPerson(name) {
//   let _age = 0 // 私有变量
//
//   return {
//     setAge: age => {
//       if (age > 0) _age = age
//     },
//     getAge: () => _age,
//     greet: () => console.log(`Hello, I'm ${name}, I am ${_age} years old.`),
//   }
// }
//
// const alice = createPerson('Alice')
// alice.setAge(30)
// alice.greet() // "Hello, I'm Alice, I am 30 years old."
// // console.log(alice._age); // undefined

// ===== 4.2 创建函数工厂 (Function Factories) =====
// function createMultiplier(factor) {
//   // `factor` 被闭包“记住”了
//   return number => number * factor
// }
//
// const double = createMultiplier(2)
// const triple = createMultiplier(3)
//
// console.log(double(10)) // 20
// console.log(triple(10)) // 30

// ===== 4.3 实现柯里化 (Currying) =====
// const curry = fn => {
//   return function curried(...args) {
//     if (args.length >= fn.length) {
//       return fn.apply(this, args)
//     } else {
//       return function (...nextArgs) {
//         return curried.apply(this, args.concat(nextArgs))
//       }
//     }
//   }
// }
//
// const sum = (a, b, c) => a + b + c
// const curriedSum = curry(sum)
//
// console.log(curriedSum(1)(2)(3)) // 6
// console.log(curriedSum(1, 2)(3)) // 6

// ===== 4.4 循环与异步 (setTimeout & Event Listeners) =====
// // 使用 let (ES6 最佳实践)
// for (let i = 1; i <= 3; i++) {
//   setTimeout(() => {
//     // 每次循环，let 都会创建一个新的 i，闭包捕获的是这个新的 i
//     console.log(`After ${i} second(s): ${i}`)
//   }, i * 1000)
// }

// ===== 4.4 循环与异步 (setTimeout & Event Listeners) =====
// const items = ['item1', 'item2', 'item3']
// items.forEach((itemText, index) => {
//   const button = document.createElement('button')
//   button.textContent = itemText
//   button.onclick = () => {
//     // 闭包捕获了正确的 index
//     alert(`You clicked item number ${index + 1}`)
//   }
//   document.body.appendChild(button)
// })

// ===== 4.5 实现防抖 (Debounce) =====
// function debounce(func, delay) {
//   let timer // 闭包变量，用于存储计时器 ID
//
//   return function (...args) {
//     clearTimeout(timer) // 清除上一个未执行的计时器
//     timer = setTimeout(() => {
//       func.apply(this, args)
//     }, delay)
//   }
// }
//
// window.addEventListener(
//   'scroll',
//   debounce(() => {
//     console.log('API call for scroll position...')
//   }, 300),
// )

// ===== 4.6 实现节流 (Throttle) =====
// function throttle(func, limit) {
//   let inThrottle // 闭包变量，作为节流阀/锁
//
//   return function (...args) {
//     if (!inThrottle) {
//       func.apply(this, args)
//       inThrottle = true
//       setTimeout(() => (inThrottle = false), limit)
//     }
//   }
// }
//
// window.addEventListener(
//   'resize',
//   throttle(() => {
//     console.log('Window is resizing!')
//   }, 200),
// )

// ===== 4.7 实现一次性函数 (Once Function) =====
// function once(fn) {
//   let hasBeenCalled = false // 闭包变量，作为执行标志
//   let result
//
//   return function (...args) {
//     if (!hasBeenCalled) {
//       hasBeenCalled = true
//       result = fn.apply(this, args)
//     }
//     return result
//   }
// }
//
// const initialize = once(() => {
//   console.log('Initialization logic executed.')
//   return true
// })
//
// initialize() // "Initialization logic executed."
// initialize() // (无任何输出)
// initialize() // (无任何输出)

// ===== 4.8 实现模块化 (Module Pattern) =====
// const myAwesomeModule = (function () {
//   // --- 私有部分 ---
//   const privateVar = 'I am secret'
//   const privateMethod = () => console.log(privateVar)
//
//   // --- 公共 API ---
//   return {
//     publicMethod: () => {
//       console.log('Accessing private stuff...')
//       privateMethod()
//     },
//   }
// })()
//
// myAwesomeModule.publicMethod() // "Accessing private stuff...", "I am secret"
// // console.log(myAwesomeModule.privateVar); // undefined

// ===== 4.9 缓存函数结果 (Memoization) =====
// function memoize(fn) {
//   const cache = {} // 闭包变量，用作缓存存储
//
//   return function (...args) {
//     const key = JSON.stringify(args)
//     if (cache[key]) {
//       console.log('Fetching from cache...')
//       return cache[key]
//     } else {
//       console.log('Calculating result...')
//       const result = fn.apply(this, args)
//       cache[key] = result
//       return result
//     }
//   }
// }
//
// const slowFibonacci = n => {
//   if (n < 2) return n
//   return slowFibonacci(n - 1) + slowFibonacci(n - 2)
// }
//
// const memoizedFib = memoize(slowFibonacci)
//
// memoizedFib(35) // "Calculating result..." (可能很慢)
// memoizedFib(35) // "Fetching from cache..." (瞬间完成)

// ===== 5.1 循环中的闭包陷阱 (The Classic Loop Problem) =====
// for (var i = 0; i < 5; i++) {
//   var button = document.createElement('button')
//   button.innerHTML = 'Button ' + i
//   button.onclick = function () {
//     console.log(i) // 试图打印点击的按钮的索引
//   }
//   document.body.appendChild(button)
// }

// ===== 5.1 循环中的闭包陷阱 (The Classic Loop Problem) =====
// for (let i = 0; i < 5; i++) {
//   // ... 和上面一样
//   button.onclick = function () {
//     console.log(i) // 这里的 i 是每次循环中独有的 i
//   }
//   // ...
// }

// ===== 5.1 循环中的闭包陷阱 (The Classic Loop Problem) =====
// for (var i = 0; i < 5; i++) {
//   // ...
//   button.onclick = (function (savedIndex) {
//     return function () {
//       console.log(savedIndex)
//     }
//   })(i) // 立即执行，并把当前的 i 传进去
//   // ...
// }

