---
outline: [2, 3]
---

# 闭包 (Closure)

闭包让你可以在一个函数**外部**，访问这个函数**内部**的作用域。它就像一座桥梁，连接了函数的内部世界和外部世界。

> [!TIP] 相关阅读
> 闭包建立在 [作用域与作用域链](/js/basic/lexicalScope) 之上，其“**逃过执行栈销毁**”的底层机制见 [执行上下文与执行栈](/js/basic/executionContextAndStack)。

## 1. 什么是闭包？

| 来源                                                                         | 定义                                                         |
| :--------------------------------------------------------------------------- | :----------------------------------------------------------- |
| 官方定义                                                                     | 一个函数和对其周围状态（**词法环境**）的引用捆绑在一起的组合 |
| 红宝书定义                                                                   | 有权访问另一个函数作用域中变量的函数                         |
| [MDN 定义](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures) | 能够访问**自由变量**的函数                                   |

> **自由变量**：在函数中使用、但既不是函数参数也不是函数局部变量的变量，即另一个函数作用域中的变量。

```js
function outerFunction() {
  const outerVariable = 'I am outside!' // 这个变量被闭包“捕获”

  function innerFunction() {
    console.log(outerVariable) // 内部函数访问了外部变量
  }

  return innerFunction // 返回内部函数
}

// 1. 调用外部函数，它返回了内部函数
const myClosure = outerFunction()

// 2. outerFunction 已经执行完毕，其执行上下文已出栈。
//    但由于 myClosure（即 innerFunction）引用了 outerVariable，
//    outerVariable 并没有被销毁。

// 3. 调用内部函数
myClosure() // 输出: "I am outside!"
```

## 2. 闭包的三大特性

- **闭包可以访问当前函数以外的变量**

```js
function getOuter() {
  var date = '815'
  function getDate(str) {
    console.log(str + date) //访问外部的date
  }
  return getDate('今天是：')
}
getOuter() //"今天是：815"
```

- **即使外部函数已经返回，闭包仍能访问外部函数定义的变量**

```js
function getOuter() {
  var date = '815'
  function getDate(str) {
    console.log(str + date) //访问外部的date
  }
  return getDate //外部函数返回
}
var today = getOuter()
today('今天是：') //"今天是：815"
today('明天不是：') //"明天不是：815"
```

- **闭包可以更新外部变量的值**

```js
function updateCount() {
  var count = 0
  function getCount(val) {
    count = val
    console.log(count)
  }
  return getCount //外部函数返回
}
var count = updateCount()
count(815) //815
count(816) //816
```

## 3. 闭包产生的三个必要条件

- **函数嵌套**: 必须有一个内部函数嵌套在外部函数中。
- **内部函数引用外部变量**: 内部函数必须访问其外部函数的变量或参数。
- **外部函数返回内部函数**: 外部函数必须 `return` 这个内部函数。

## 4. 闭包九大应用场景

闭包的核心在于 **“状态的封装和持久化”**。所有的应用场景都是围绕这个核心展开的。

| 序号    | 应用场景                              | 核心思想                                                     |
| :------ | :------------------------------------ | :----------------------------------------------------------- |
| **1**   | **模拟私有变量 (Private Variables)**  | 封装不想被外部直接访问的状态。                               |
| **2**   | **创建函数工厂 (Function Factories)** | 用一个函数来创建和配置另一系列函数。                         |
| **3**   | **实现柯里化 (Currying)**             | 将多参数函数转化为一系列单参数函数，提高复用性。             |
| **4.a** | **循环与异步 I (setTimeout)**         | 在 `setTimeout` 回调中捕获并使用循环中特定时刻的变量值。     |
| **4.b** | **循环与异步 II (事件监听)**          | 为循环生成的多个 DOM 元素绑定带有正确上下文的事件。          |
| **5**   | **实现防抖 (Debounce)**               | 在闭包中保存计时器，用于延迟执行和重置，防止高频触发。       |
| **6**   | **实现节流 (Throttle)**               | 在闭包中保存状态锁或计时器，用于按固定频率执行函数。         |
| **7**   | **实现一次性函数 (Once Function)**    | 在闭包中保存一个“**已执行**”的标志位，确保函数只被调用一次。 |
| **8**   | **实现模块化 (Module Pattern)**       | 使用 IIFE 创建不污染全局的独立作用域，并选择性地暴露接口。   |
| **9**   | **缓存函数结果 (Memoization)**        | 在闭包中创建一个缓存对象，存储函数对给定参数的计算结果。     |

### 4.1 模拟私有变量 (Private Variables)

这是闭包最基础、最重要的应用，用于实现数据的封装。

```js
function createPerson(name) {
  let _age = 0 // 私有变量

  return {
    setAge: age => {
      if (age > 0) _age = age
    },
    getAge: () => _age,
    greet: () => console.log(`Hello, I'm ${name}, I am ${_age} years old.`),
  }
}

const alice = createPerson('Alice')
alice.setAge(30)
alice.greet() // "Hello, I'm Alice, I am 30 years old."
// console.log(alice._age); // undefined
```

### 4.2 创建函数工厂 (Function Factories)

闭包可以“**记住**”创建它时的配置，用于生成定制化的函数。

```js
function createMultiplier(factor) {
  // `factor` 被闭包“记住”了
  return number => number * factor
}

const double = createMultiplier(2)
const triple = createMultiplier(3)

console.log(double(10)) // 20
console.log(triple(10)) // 30
```

### 4.3 实现柯里化 (Currying)

通过闭包，将一个多参数函数分解，使其可以分步接收参数。

```js
const curry = fn => {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    } else {
      return function (...nextArgs) {
        return curried.apply(this, args.concat(nextArgs))
      }
    }
  }
}

const sum = (a, b, c) => a + b + c
const curriedSum = curry(sum)

console.log(curriedSum(1)(2)(3)) // 6
console.log(curriedSum(1, 2)(3)) // 6
```

### 4.4 循环与异步 (setTimeout & Event Listeners)

这是经典的闭包“**陷阱**”与应用场景，核心是在异步回调中访问到正确的循环变量。

**a) `setTimeout`**

```js
// 使用 let (ES6 最佳实践)
for (let i = 1; i <= 3; i++) {
  setTimeout(() => {
    // 每次循环，let 都会创建一个新的 i，闭包捕获的是这个新的 i
    console.log(`After ${i} second(s): ${i}`)
  }, i * 1000)
}

//After 1 second(s): 1
//After 1 second(s): 2
//After 1 second(s): 3
```

**b) 事件监听**

```js
const items = ['item1', 'item2', 'item3']
items.forEach((itemText, index) => {
  const button = document.createElement('button')
  button.textContent = itemText
  button.onclick = () => {
    // 闭包捕获了正确的 index
    alert(`You clicked item number ${index + 1}`)
  }
  document.body.appendChild(button)
})
```

### 4.5 实现防抖 (Debounce)

防止函数在高频触发下被无限制调用，只在最后一次触发后的一段时间内执行。

```js
function debounce(func, delay) {
  let timer // 闭包变量，用于存储计时器 ID

  return function (...args) {
    clearTimeout(timer) // 清除上一个未执行的计时器
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

window.addEventListener(
  'scroll',
  debounce(() => {
    console.log('API call for scroll position...')
  }, 300),
)
```

### 4.6 实现节流 (Throttle)

保证一个函数在固定时间间隔内最多只执行一次。

```js
function throttle(func, limit) {
  let inThrottle // 闭包变量，作为节流阀/锁

  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

window.addEventListener(
  'resize',
  throttle(() => {
    console.log('Window is resizing!')
  }, 200),
)
```

### 4.7 实现一次性函数 (Once Function)

确保一个函数在程序的生命周期中只被成功调用一次。

```js
function once(fn) {
  let hasBeenCalled = false // 闭包变量，作为执行标志
  let result

  return function (...args) {
    if (!hasBeenCalled) {
      hasBeenCalled = true
      result = fn.apply(this, args)
    }
    return result
  }
}

const initialize = once(() => {
  console.log('Initialization logic executed.')
  return true
})

initialize() // "Initialization logic executed."
initialize() // (无任何输出)
initialize() // (无任何输出)
```

### 4.8 实现模块化 (Module Pattern)

在 ES6 模块出现前，这是创建独立、可复用代码块的主要方式，避免污染全局作用域。

```js
const myAwesomeModule = (function () {
  // --- 私有部分 ---
  const privateVar = 'I am secret'
  const privateMethod = () => console.log(privateVar)

  // --- 公共 API ---
  return {
    publicMethod: () => {
      console.log('Accessing private stuff...')
      privateMethod()
    },
  }
})()

myAwesomeModule.publicMethod() // "Accessing private stuff...", "I am secret"
// console.log(myAwesomeModule.privateVar); // undefined
```

### 4.9 缓存函数结果 (Memoization)

对于计算成本高的纯函数，可以将输入和结果缓存起来，避免重复计算。

```js
function memoize(fn) {
  const cache = {} // 闭包变量，用作缓存存储

  return function (...args) {
    const key = JSON.stringify(args)
    if (cache[key]) {
      console.log('Fetching from cache...')
      return cache[key]
    } else {
      console.log('Calculating result...')
      const result = fn.apply(this, args)
      cache[key] = result
      return result
    }
  }
}

const slowFibonacci = n => {
  if (n < 2) return n
  return slowFibonacci(n - 1) + slowFibonacci(n - 2)
}

const memoizedFib = memoize(slowFibonacci)

memoizedFib(35) // "Calculating result..." (可能很慢)
memoizedFib(35) // "Fetching from cache..." (瞬间完成)
```

## 5. 常见问题与陷阱 (FAQ)

### 5.1 循环中的闭包陷阱

`var` 声明的循环变量在函数（全局）作用域中**只有一个**，循环结束时 `i` 已变为 `5`，所有回调共享同一个 `i`，因此无论点哪个按钮都打印 `5`。

```js
for (var i = 0; i < 5; i++) {
  button.onclick = function () {
    console.log(i) // 总是打印 5
  }
}
```

- **用 `let`（推荐）**：`let` 有块级作用域，每次循环创建独立的 `i`。

```js
for (let i = 0; i < 5; i++) {
  button.onclick = function () {
    console.log(i) // 0, 1, 2, 3, 4
  }
}
```

- **用 IIFE（ES5）**：立即执行函数为每次循环创建独立作用域，把 `i` 作为参数传入。

```js
for (var i = 0; i < 5; i++) {
  button.onclick = (function (savedIndex) {
    return function () {
      console.log(savedIndex)
    }
  })(i)
}
```

### 5.2 闭包是否会导致内存泄漏？

可能，但通常不是问题。闭包会让外部变量驻留内存；若闭包长期存在（全局引用、未移除的事件监听），这些变量不会被回收。

**避免**:不再需要时释放引用（设为 `null`或`removeEventListener`)；现代引擎只会保留闭包真正用到的变量。

### 5.3 闭包和性能有什么关系？

闭包比普通函数多占用内存、变量访问略慢（作用域链查找）。除非在极高频循环中大量创建闭包，否则影响可忽略——**不要为性能牺牲可读性和封装性**。
