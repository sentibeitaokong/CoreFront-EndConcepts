---
outline: [2, 3]
---

# var、let、const 命令

ES6 之前只有 `var` 一种变量声明方式，ES6 新增了 `let` 和 `const`。三者核心区别在于**作用域、变量提升、可变性**。

## 1. 三者对比

[width(18,28,22,32)]

| 特性             | `var`                  | `let`            | `const`                    |
| :--------------- | :--------------------- | :--------------- | :------------------------- |
| **作用域**       | 函数作用域             | 块级作用域       | 块级作用域                 |
| **变量提升**     | 有（值为 `undefined`） | 无（暂时性死区） | 无（暂时性死区）           |
| **重复声明**     | 允许                   | 不允许           | 不允许                     |
| **必须初始化**   | 否                     | 否               | 是                         |
| **能否改值**     | 能                     | 能               | 不能（引用类型内部仍可变） |
| **挂载全局对象** | 是                     | 否               | 否                         |

> **建议**：默认用 `const`，需要重新赋值时用 `let`，尽量不用 `var`。

## 2. var 命令

### 2.1 基本用法

```js
var a // undefined
var b = 10
var c = 1,
  d = 2 // 同时声明多个
```

### 2.2 变量提升 (Hoisting)

引擎执行前会把 `var` 的**声明**（不含赋值）提升到当前函数作用域顶部，因此声明前使用得到 `undefined` 而非报错。

```js
console.log(myVar) // undefined（不报错）
var myVar = 5
console.log(myVar) // 5
```

实际等价于：

```js
var myVar // 声明被提升到顶部
console.log(myVar) // undefined
myVar = 5
console.log(myVar) // 5
```

### 2.3 允许重复声明

同一作用域内 `var` 重复声明不会报错，第二次声明视为赋值，易意外覆盖变量。

```js
var user = 'Alice'
var user = 'Bob' // 合法
console.log(user) // "Bob"
```

### 2.4 函数作用域与挂载全局对象

`var` 只有**函数作用域**，块 `{}` 无法约束它；全局声明的 `var` 会成为全局对象（`window` / `global`）的属性。

```js
{
  var x = 1
}
console.log(x) // 1（var 无块级作用域）

var y = 2
console.log(window.y) // 2（var 挂载全局对象）

let z = 3
console.log(window.z) // undefined（let 不挂载）
```

### 2.5 循环中的闭包问题

`var` 无块级作用域，循环变量 `i` 始终是同一个变量，异步回调拿到的是循环结束后的值。

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100)
}
// 3 3 3
```

**解决**：ES6 之前用 IIFE 创建独立作用域；ES6 起直接用 `let`。

```js
for (var i = 0; i < 3; i++) {
  ;(function (j) {
    setTimeout(() => console.log(j), 100)
  })(i)
}
// 0 1 2
```

### 2.6 隐式全局变量

非严格模式下，给未声明的变量赋值会隐式创建全局变量（常由漏写关键字导致）。

```js
function mistake() {
  b = 2 // 漏写 var/let/const，成为全局变量
}
mistake()
console.log(b) // 2（污染全局）
```

## 3. let 命令

### 3.1 块级作用域

`let` 声明的变量只在所在的 `{}` 代码块内有效。

```js
{
  let a = 10
  var b = 1
}
console.log(a) // ReferenceError
console.log(b) // 1
```

### 3.2 暂时性死区 (TDZ)

`let` 不存在变量提升：从块级作用域开始到声明语句之前，变量处于“**暂时性死区**”，访问会抛 `ReferenceError`。

```js
console.log(bar) // ReferenceError
let bar = 2
```

TDZ 也让 `typeof` 不再绝对安全：

```js
typeof x // ReferenceError
let x

typeof undeclared // "undefined"（未声明变量反而安全）
```

隐蔽的死区示例：

```js
let x = x // ReferenceError：声明未完成就取值

function bar(x = y, y = 2) {} // 报错：参数 x 默认值引用了尚未声明的 y
bar()
```

### 3.3 不允许重复声明

同一作用域内 `let` 不能重复声明同一变量，也不能在函数内重新声明参数。

```js
let a = 10
let a = 1 // SyntaxError

function func(arg) {
  let arg // 报错
}
```

### 3.4 for 循环的特殊行为

`for` 中 `let` 声明的计数器，每轮循环都是**独立的新变量**（引擎会记住上一轮的值）：

```js
var a = []
for (let i = 0; i < 3; i++) {
  a[i] = () => console.log(i)
}
a[0]() // 0
a[1]() // 1
a[2]() // 2
```

另外，设置循环变量的部分是**父作用域**，循环体是**子作用域**：

```js
for (let i = 0; i < 3; i++) {
  let i = 'abc'
  console.log(i) // 'abc'（循环体内 i 与循环变量 i 不在同一作用域）
}
```

## 4. const 命令

### 4.1 基本用法（必须初始化）

`const` 声明只读常量，且**必须立即初始化**；作用域与 `let` 相同。

```js
const PI = 3.1415
PI = 3 // TypeError: Assignment to constant variable

const foo // SyntaxError: Missing initializer
```

### 4.2 本质：绑定不可变

`const` 锁定的是**变量到内存地址的绑定**，而非值。基本类型的值就存在该地址，因此不可改；引用类型存的只是指针，指针不可改，但指向的对象/数组内部仍可变。

```js
const obj = {}
obj.prop = 123 // ✅ 可改属性
obj = {} // ❌ TypeError

const arr = []
arr.push('Hello') // ✅
arr = ['Dave'] // ❌ TypeError
```

### 4.3 冻结对象

若要“**彻底不可变**”，用 `Object.freeze`（浅冻结，嵌套对象需递归）：

```js
const foo = Object.freeze({})
foo.prop = 123 // 严格模式报错，常规模式静默失败

const deepFreeze = obj => {
  Object.freeze(obj)
  Object.keys(obj).forEach(k => {
    if (obj[k] && typeof obj[k] === 'object') {
      deepFreeze(obj[k])
    }
  })
}
```

## 5. 顶层对象与 globalThis

### 5.1 顶层对象

浏览器是 `window`，Node 是 `global`。ES5 中全局变量与顶层对象属性等价；ES6 起，仅 `var`/`function` 声明的全局变量仍挂载，`let`/`const`/`class` 不再挂载。

```js
var a = 1
let b = 1
window.a // 1
window.b // undefined
```

### 5.2 globalThis

js 语言存在一个顶层对象，它提供全局环境（即全局作用域），所有代码都是在这个环境中运行。但是，顶层对象在各种实现里面是不统一的。

- 浏览器里面，顶层对象是`window`，但 Node 和 Web Worker 没有`window`。
- 浏览器和 Web Worker 里面，`self`也指向顶层对象，但是 Node 没有`self`。
- Node 里面，顶层对象是`global`，但其他环境都不支持。

```js
var globalThis = function () {
  if (typeof self !== 'undefined') {
    return self
  }
  if (typeof window !== 'undefined') {
    return window
  }
  if (typeof global !== 'undefined') {
    return global
  }
  throw new Error('unable to locate global object')
}
```

## 6. 常见问题 (FAQ) 与 避坑指南

### 6.1 `for (var i)` 里 setTimeout 为什么都输出 3？

`var` 没有块级作用域，所有回调共享同一个 `i`；回调执行时循环已结束，`i` 已变为 3。改用 `let` 或 IIFE 即可。

### 6.2 为什么 `let x = x` 报错而 `var x = x` 不报错？

暂时性死区：`let x = x` 中右侧的 `x` 在声明完成前被读取，处于死区，抛 `ReferenceError`。而 `var` 有变量提升，`x` 此时已是 `undefined`。

### 6.3 `typeof` 一定安全吗？

不一定。在 `let`/`const` 的 TDZ 内使用 `typeof` 会抛 `ReferenceError`；只有对未声明变量的 `typeof` 才返回 `"undefined"`。

### 6.4 `const` 声明的对象为什么还能改属性？

`const` 锁定的是“**变量到地址的绑定**”，对象内部数据不在约束范围内。需要不可变时用 `Object.freeze`。

### 6.5 var/let/const 怎么选？

默认 `const`；需要重新赋值时 `let`；避免 `var`（作用域与提升的坑较多）。
