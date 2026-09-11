---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 函数的扩展

## 1. 函数参数的默认值

### 1.1 基本用法

ES6 之前，不能直接为函数的参数指定默认值，只能采用 `y = y || 'World'` 这样的变通方法。缺点是当 `y` 赋值为布尔 `false`（如空字符 `''`）时，赋值不起作用，会误用默认值。更严谨的写法是判断 `typeof y === 'undefined'`。

ES6 允许直接写在参数定义后面：

```js
function log(x, y = 'World') {
  console.log(x, y)
}

log('Hello') // Hello World
log('Hello', 'China') // Hello China
log('Hello', '') // Hello
```

另一个例子：

```js
function Point(x = 0, y = 0) {
  this.x = x
  this.y = y
}

const p = new Point()
p // { x: 0, y: 0 }
```

参数变量是默认声明的，所以不能用 `let` 或 `const` 再次声明；且使用默认值时函数不能有同名参数。

```js
function foo(x = 5) {
  let x = 1 // error
}

function foo(x, x, y = 1) {
  // error: Duplicate parameter name
}
```

参数默认值是**惰性求值**的，每次调用时都会重新计算默认值表达式，而不是固定传值：

```js
let x = 99
function foo(p = x + 1) {
  console.log(p)
}

foo() // 100
x = 100
foo() // 101
```

### 1.2 与解构赋值默认值结合使用

```js
function foo({ x, y = 5 }) {
  console.log(x, y)
}

foo({}) // undefined 5
foo({ x: 1, y: 2 }) // 1 2
foo() // TypeError（参数未提供，无法解构）
```

若调用时没提供参数，可结合函数参数默认值兜底：

```js
function foo({ x, y = 5 } = {}) {
  console.log(x, y)
}

foo() // undefined 5
```

双重默认值的例子（`fetch` 的第二个参数）：

```js
function fetch(url, { body = '', method = 'GET', headers = {} } = {}) {
  console.log(method)
}

fetch('http://example.com', {}) // "GET"
fetch('http://example.com') // "GET"
```

两种写法的差别（练习）：

```js
// 写法一：解构参数的每个属性都有默认值
function m1({ x = 0, y = 0 } = {}) {
  return [x, y]
}

// 写法二：只有参数整体有默认值
function m2({ x, y } = { x: 0, y: 0 }) {
  return [x, y]
}

m1({ x: 3 }) // [3, 0]
m2({ x: 3 }) // [3, undefined]
m1({}) // [0, 0]
m2({}) // [undefined, undefined]
```

### 1.3 参数默认值的位置

定义了默认值的参数，通常应为**尾参数**，否则无法省略它而不省略后面的参数（除非显式传入 `undefined`）。

```js
function f(x = 1, y) {
  return [x, y]
}

f() // [1, undefined]
f(2) // [2, undefined]
f(undefined, 1) // [1, 1]
```

传入 `undefined` 会触发默认值，`null` 则不会：

```js
function foo(x = 5, y = 6) {
  console.log(x, y)
}

foo(undefined, null) // 5 null
```

### 1.4 `arguments`对象

`arguments` 是一个在**所有（非箭头）函数**内部都可以访问的**类数组对象**，包含调用时传入的所有参数。

#### 1.4.1 它是 "类数组" 而非真数组

有 `length` 和索引访问，但**没有**数组方法（`forEach`/`map`/`filter` 等）。转为真数组的方式：

```js
function toArray() {
  const a1 = [...arguments] // ES6+ 推荐
  const a2 = Array.from(arguments) // ES6+ 推荐
  const a3 = Array.prototype.slice.call(arguments) // ES5
}
```

#### 1.4.2 与函数参数的"绑定"关系 (非严格模式下)

非严格模式下，`arguments` 与命名参数**双向绑定**（改一个，另一个同步变化）；

```js
function testBinding(a, b) {
  console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1

  // 修改命名参数
  a = 100
  console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=100

  // 修改 arguments
  arguments[1] = 200
  console.log(`修改 arguments[1] 后: b=${b}, arguments[1]=${arguments[1]}`) // 修改 arguments[1] 后: b=200, arguments[1]=200
}

testBinding(1, 2)
```

但在**严格模式**和函数有参数默认值的情况下，这种绑定关系被解除了，它们是相互独立的。

```js
//严格模式
function testStrictBinding(a, b) {
  'use strict'
  console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1

  // 修改命名参数
  a = 100
  console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=1
}

testStrictBinding(1, 2)

//参数默认值
function testDefaultBinding(a = 5, b = 6) {
  console.log(`初始: a=${a}, arguments[0]=${arguments[0]}`) // 初始: a=1, arguments[0]=1

  // 修改命名参数
  a = 100
  console.log(`修改 a 后: a=${a}, arguments[0]=${arguments[0]}`) // 修改 a 后: a=100, arguments[0]=1
}

testDefaultBinding(1, 2)
```

#### 1.4.3 `arguments.callee` (已废弃)

指向当前正在执行的函数，用于匿名递归。严格模式下**禁用**，现已不推荐使用，推荐函数命名表达式：

```js
// 以前的写法，现在不推荐
const factorial = function (n) {
  if (n <= 1) {
    return 1
  }
  // 使用 arguments.callee 实现匿名递归
  return n * arguments.callee(n - 1)
}

//现在写法
const factorial = function f(n) {
  return n <= 1 ? 1 : n * f(n - 1)
}
```

### 1.5 函数的 length 属性

指定默认值后，`length` 返回**没有默认值的参数个数**；若默认值参数不是尾参数，其后面的参数也不计入：

```js
;(function (a) {}).length // 1
;(function (a = 5) {}).length // 0
;(function (a, b, c = 5) {}).length // 2
;(function (a = 0, b, c) {}).length // 0
```

`length` 的含义是函数**预期传入的参数个数**，rest 参数同样不计入：

```js
;(function (...args) {}).length // 0
```

### 1.6 作用域

设置默认值时，函数声明初始化阶段会形成一个**单独作用域**，初始化结束即消失。

```js
var x = 1
function f(x, y = x) {
  console.log(y)
}
f(2) // 2（默认值 x 指向第一个参数 x，而非全局 x）
```

```js
let x = 1
function f(y = x) {
  let x = 2
  console.log(y)
}
f() // 1（默认值作用域内没有 x，指向外层全局 x，函数体内部的 x 影响不到它）
```

若外层也没有 `x`，则报 `ReferenceError`；`x = x` 会因暂时性死区报错：

```js
function foo(x = x) {
  // ReferenceError: Cannot access 'x' before initialization
}
```

默认值若是函数，同样遵守该作用域规则：

```js
let foo = 'outer'
function bar(func = () => foo) {
  let foo = 'inner'
  console.log(func())
}
bar() // outer
```

### 1.7 应用

利用默认值指定某参数不得省略：

```js
function throwIfMissing() {
  throw new Error('Missing parameter')
}

function foo(mustBeProvided = throwIfMissing()) {
  return mustBeProvided
}

foo() // Error: Missing parameter
```

默认值在**运行时**求值（`throwIfMissing` 带括号即调用）；若参数已赋值，默认值函数不会执行。也可将默认值设为 `undefined` 表示参数可省略：

```js
function foo(optional = undefined) {
  /* ... */
}
```

## 2. 函数定义语法增强

### 2.1 箭头函数

#### 2.1.1 基本用法

```js
var f = v => v
// 等同于
var f = function (v) {
  return v
}

var sum = (num1, num2) => num1 + num2
```

- 无参数或多参数用圆括号；多于一条语句用大括号 + `return`。

```js
var f = () => 5
// 等同于
var f = function () {
  return 5
}

var sum = (num1, num2) => num1 + num2
// 等同于
var sum = function (num1, num2) {
  return num1 + num2
}
```

- 直接返回对象必须在对象外加括号 `({ ... })`，否则大括号被当作代码块。

```javascript
var sum = (num1, num2) => {
  return num1 + num2
}
```

- 与解构、rest 参数可结合：`const full = ({ first, last }) => first + ' ' + last`。

```javascript
// 报错
let getTempItem = id => { id: id, name: "Temp" };

// 不报错
let getTempItem = id => ({ id: id, name: "Temp" });
```

- 常用于简化回调：`[1, 2, 3].map(x => x * x)`。

```js
const numbers = (...nums) => nums
numbers(1, 2, 3, 4, 5) // [1,2,3,4,5]
```

#### 2.1.2 使用注意点

- 没有自己的 `this`（最重要）。
- 不可作构造函数，不能 `new`。
- 没有 `arguments`，可用 rest 参数代替。
- 不能用 `yield`，不能作 Generator。

箭头函数内部 `this` 就是**定义时**上层作用域的 `this`，是固定的：

```js
function foo() {
  setTimeout(() => {
    console.log('id:', this.id)
  }, 100)
}
var id = 21
foo.call({ id: 42 }) // id: 42（this 固定为 foo 的 this）
```

对比箭头函数与普通函数在 `setInterval` 里的表现：

```js
function Timer() {
  this.s1 = 0
  this.s2 = 0
  setInterval(() => this.s1++, 1000) // 箭头函数：this 固定为 Timer
  setInterval(function () {
    this.s2++ // 普通函数：this 指向全局
  }, 1000)
}

var timer = new Timer()

setTimeout(() => console.log('s1: ', timer.s1), 3100)
setTimeout(() => console.log('s2: ', timer.s2), 3100)
// s1: 3
// s2: 0
```

嵌套箭头函数中 `this` 始终是外层普通函数的 `this`，无论嵌套多少层：

```js
function foo() {
  return () => {
    return () => {
      return () => {
        console.log('id:', this.id)
      }
    }
  }
}

var f = foo.call({ id: 1 })

var t1 = f.call({ id: 2 })()() // id: 1
var t2 = f().call({ id: 3 })() // id: 1
var t3 = f()().call({ id: 4 }) // id: 1
```

除 `this` 外，箭头函数内 `arguments`、`super`、`new.target` 也都指向外层。因为 `this` 是词法固定的，`call`/`apply`/`bind` 都无法改变它：

```js
;(function () {
  return [(() => this.x).bind({ x: 'inner' })()]
}).call({ x: 'outer' }) // ['outer']
```

#### 2.1.3 不适用场合

**（1）定义对象方法且内部含 `this`**：对象不构成单独作用域，箭头函数会捕获全局 `this`。

```js
globalThis.s = 21
const obj = {
  s: 42,
  m: () => console.log(this.s),
}
obj.m() // 21（而非 42）
```

**（2）需要动态 `this`** 时（如 DOM 事件回调）：

```js
button.addEventListener('click', () => {
  this.classList.toggle('on') // this 是全局，报错
})
```

此外，函数体复杂、有大量读写操作时，也应使用普通函数以提高可读性。

#### 2.1.4 嵌套的箭头函数

```js
let insert = value => ({
  into: array => ({
    after: afterValue => {
      array.splice(array.indexOf(afterValue) + 1, 0, value)
      return array
    },
  }),
})

insert(2).into([1, 3]).after(1) // [1, 2, 3]
```

管道（pipeline）机制：

```js
const pipeline =
  (...funcs) =>
  val =>
    funcs.reduce((a, b) => b(a), val)

const plus1 = a => a + 1
const mult2 = a => a * 2
pipeline(plus1, mult2)(5) // 12
```

### 2.2 rest 参数

`...变量名` 用于获取多余参数，得到一个**真数组**，可替代 `arguments`。

```js
function add(...values) {
  return values.reduce((sum, val) => sum + val, 0)
}
add(2, 5, 3) // 10
```

rest 参数必须是**最后一个**参数，且不计入 `length`：

```js
function f(a, ...b, c) {} // 报错
;(function (a, ...b) {}).length // 1
```

### 2.3 严格模式

从 ES5 开始，函数内部可以设定为严格模式。

```js
function doSomething(a, b) {
  'use strict'
  // code
}
```

ES2016 规定：函数参数若使用了**默认值、解构赋值或扩展运算符**，函数内部就不能显式 `'use strict'`，否则报错。

```javascript
// 报错
function doSomething(a, b = a) {
  'use strict';
  // code
}

// 报错
const doSomething = function ({a, b}) {
  'use strict';
  // code
};

// 报错
const doSomething = (...a) => {
  'use strict';
  // code
};

const obj = {
  // 报错
  doSomething({a, b}) {
    'use strict';
    // code
  }
};
```

原因:严格模式本应同时作用于参数和函数体,但参数先于函数体执行,此时还无法确定是否应以严格模式执行。

两种方法可以规避这种限制。第一种是设定**全局性**的严格模式，这是合法的。

```javascript
'use strict'

function doSomething(a, b = a) {
  // code
}
```

第二种是把函数包在一个无参数的**立即执行函数**里面。

```javascript
const doSomething = (function () {
  'use strict'
  return function (value = 42) {
    return value
  }
})()
```

### 2.4 name 属性

函数的 `name` 属性返回函数名。

```javascript
function foo() {}
foo.name // "foo"
```

如果将一个匿名函数赋值给一个变量，ES5 的`name`属性，会返回空字符串，而 ES6 的`name`属性会返回实际的函数名。

```javascript
var f = function () {}
f.name // ES5: ""，ES6: "f"
```

如果将一个具名函数赋值给一个变量，则 ES5 和 ES6 的`name`属性都返回这个具名函数原本的名字。

```javascript
const bar = function baz() {}
bar.name // "baz"
```

`Function`构造函数返回的函数实例，`name`属性的值为`anonymous`。

```javascript
new Function().name // "anonymous"
```

`bind`返回的函数，`name`属性值会加上`bound`前缀。

```js
foo.bind({}).name // "bound foo"
```

## 3. 尾调用优化

### 3.1 什么是尾调用？

尾调用指函数**最后一步**是调用另一个函数：

```js
function f(x) {
  return g(x) // 尾调用
}
```

以下都不是尾调用（调用后还有操作）：

```js
function f(x) {
  let y = g(x) // 调用后还有赋值
  return y
}
function f(x) {
  return g(x) + 1 // 调用后还有运算
}
function f(x) {
  g(x) // 隐含 return undefined
}
```

尾调用不一定要在函数尾部，只要是最后一步操作即可（如 `if/else` 分支里分别 `return m(x)` / `return n(x)`）。

### 3.2 尾调用优化

函数调用会在内存形成"**调用帧**"（call frame），所有帧构成调用栈。尾调用是最后一步，外层函数的调用帧无需保留，可用内层函数的调用帧**取代**它，从而始终只保留一个调用帧，节省内存。前提是内层函数不再用到外层函数的内部变量：

```js
function addOne(a) {
  var one = 1
  function inner(b) {
    return b + one // 用到外层 one，无法优化
  }
  return inner(a)
}
```

> 目前仅 Safari 支持尾调用优化，Chrome 和 Firefox 均未实现。

### 3.3 尾递归

递归调用自身为递归；若最后一步调用自身则为**尾递归**，只存在一个调用帧，不会栈溢出。

普通递归阶乘（复杂度 O(n)）：

```js
function factorial(n) {
  if (n === 1) return 1
  return n * factorial(n - 1)
}
```

尾递归改写（复杂度 O(1)）：

```js
function factorial(n, total) {
  if (n === 1) return total
  return factorial(n - 1, n * total)
}
factorial(5, 1) // 120
```

非尾递归的 Fibonacci 数列

```javascript
function Fibonacci(n) {
  if (n <= 1) {
    return 1
  }

  return Fibonacci(n - 1) + Fibonacci(n - 2)
}

Fibonacci(10) // 89
Fibonacci(100) // 超时
Fibonacci(500) // 超时
```

Fibonacci 尾递归：

```js
function Fibonacci2(n, ac1 = 1, ac2 = 1) {
  if (n <= 1) {
    return ac2
  }

  return Fibonacci2(n - 1, ac2, ac1 + ac2)
}

Fibonacci2(100) // 573147844013817200000
Fibonacci2(1000) // 7.0330367711422765e+208
Fibonacci2(10000) // Infinity
```

ES6 中只要使用尾递归，就不会发生栈溢出（或者层层递归造成的超时），相对节省内存。

### 3.4 递归函数的改写

尾递归需把中间变量改写成参数，缺点是不直观（`factorial(5, 1)`）。两种解决方式：

**方法一**：尾递归函数外包一个正常形式的函数。

```javascript
function tailFactorial(n, total) {
  if (n === 1) return total
  return tailFactorial(n - 1, n * total)
}

function factorial(n) {
  return tailFactorial(n, 1)
}

factorial(5) // 120
```

函数式编程有一个概念，叫做柯里化（currying），意思是将多参数的函数转换成单参数的形式。这里也可以使用柯里化。

```javascript
function currying(fn, n) {
  return function (m) {
    return fn.call(this, m, n)
  }
}

function tailFactorial(n, total) {
  if (n === 1) return total
  return tailFactorial(n - 1, n * total)
}

const factorial = currying(tailFactorial, 1)

factorial(5) // 120
```

**方法二**：用 ES6 默认值（最简洁）：

```js
function factorial(n, total = 1) {
  if (n === 1) return total
  return factorial(n - 1, n * total)
}
factorial(5) // 120
```

### 3.5 严格模式

ES6 的尾调用优化只在**严格模式**下开启，正常模式是无效的。

这是因为在正常模式下，函数内部有两个变量，可以跟踪函数的调用栈。

- `func.arguments`：返回调用时函数的参数。
- `func.caller`：返回调用当前函数的那个函数。

尾调用优化发生时，函数的调用栈会改写，因此上面两个变量就会失真。严格模式禁用这两个变量，所以尾调用模式仅在严格模式下生效。

```javascript
function restricted() {
  'use strict'
  restricted.caller // 报错
  restricted.arguments // 报错
}
restricted()
```

### 3.6 尾递归优化的实现

尾递归优化只在严格模式生效，其他环境下可自行实现：核心思想是**用循环换掉递归**，减少调用栈。

蹦床函数（trampoline）：

```js
function trampoline(f) {
  while (f && f instanceof Function) {
    f = f()
  }
  return f
}

function sum(x, y) {
  if (y > 0) return sum.bind(null, x + 1, y - 1)
  return x
}

trampoline(sum(1, 100000)) // 100001
```

真正的尾递归优化实现（状态变量 `active` + 参数数组 `accumulated`）：

```js
function tco(f) {
  var value
  var active = false
  var accumulated = []

  return function accumulator() {
    accumulated.push(arguments)
    if (!active) {
      active = true
      while (accumulated.length) {
        value = f.apply(this, accumulated.shift())
      }
      active = false
      return value
    }
  }
}

var sum = tco(function (x, y) {
  if (y > 0) return sum(x + 1, y - 1)
  return x
})
sum(1, 100000) // 100001
```

上面代码中，`tco`函数是尾递归优化的实现，它的奥妙就在于状态变量`active`。默认情况下，这个变量是不激活的。一旦进入尾递归优化的过程，这个变量就激活了。然后，每一轮递归`sum`返回的都是`undefined`，所以就避免了递归执行；而`accumulated`数组存放每一轮`sum`执行的参数，总是有值的，这就保证了`accumulator`函数内部的`while`循环总是会执行。这样就很巧妙地将“**递归**”改成了“**循环**”，而后一轮的参数会取代前一轮的参数，保证了调用栈只有一层。

## 4.总结

**`arguments` vs. Rest 参数 (`...args`)**

[width(16,45,39)]

| 特性         | `arguments`                    | Rest 参数 (`...args`)              |
| :----------- | :----------------------------- | :--------------------------------- |
| **类型**     | 类数组对象                     | **真数组**                         |
| **可用性**   | 所有普通函数                   | 仅在函数参数末尾声明               |
| **箭头函数** | **不存在** ❌                  | **可用** ✅                        |
| **包含内容** | 函数收到的**所有**参数         | **仅包含**未被命名的"**剩余**"参数 |
| **绑定关系** | 在非严格模式下与参数双向绑定   | 与参数完全独立                     |
| **推荐度**   | 遗留特性，不推荐在新代码中使用 | **现代 JS 最佳实践** ✅            |

**普通函数 (`Function`)vs箭头函数 (`Arrow Function`)**

[width(24,36,40)]

| 特性                | 普通函数 (Function)            | 箭头函数 (Arrow Function)           |
| ------------------- | ------------------------------ | ----------------------------------- |
| this 绑定           | 动态，取决于调用方式           | 词法，取决于定义时的外部作用域      |
| arguments 对象      | 有，是一个类数组对象           | 无，但可通过 Rest 参数 ...args 替代 |
| prototype 属性      | 有                             | 无                                  |
| 作为构造函数        | 可以 (new 调用)                | 不可以 (TypeError )                 |
| 隐式 return         | 无，必须显式 return (除非单行) | 有，单行表达式时隐式 return         |
| 函数提升 (Hoisting) | 函数声明有，函数表达式无       | 无                                  |
| Generator 函数      | 可以 (function\*)              | 不可以                              |
| super属性           | 有                             | 无                                  |
| 语法                | 相对冗长                       | 简洁                                |

## **5. 常见问题与陷阱 (FAQ)**

### 5.1 箭头函数中的 `this` 到底指向谁？

箭头函数**没有自己的 `this`**，它的 `this` 是词法作用域的，捕获定义时所在上下文（外层函数或全局）的 `this`，一旦捕获就固定不变。

```js
function Person() {
  this.age = 0
  setInterval(() => {
    this.age++ // 捕获了外层的 this (Person 实例)
  }, 1000)
}
```

### 5.2 为什么箭头函数不能作为对象的方法？

对象字面量中直接使用箭头函数，它的 `this` 指向定义对象时所在上下文（通常是 `window`），而非对象本身。

```js
const obj = {
  value: 10,
  log: () => console.log(this.value), // this 指向 window，输出 undefined
}
```

**解决**：使用普通函数简写 `log() { ... }`。

### 5.3 箭头函数可以作为构造函数吗？可以用 `call`/`apply`/`bind` 改变 `this` 吗？

**都不行**，根源是箭头函数没有自己的 `this`，也没有 `[[Construct]]` 内部方法和 `prototype` 属性：

- `new` 一个箭头函数会抛出 `TypeError`。
- `call`/`apply`/`bind` 虽然也存在，但传入的 `thisArg` 会被忽略（后续参数传递仍有效）。

### 5.4 箭头函数没有 `arguments` 对象怎么获取参数？它和 Rest 参数有什么区别？

使用 **Rest 参数 (`...args`)**，得到的是真正的数组：

```js
const sum = (...nums) => nums.reduce((a, b) => a + b, 0)
```

两者的区别：

- **类型**：Rest 参数是真正的数组，可直接用 `map`/`sort` 等方法；`arguments` 是类数组对象。
- **包含内容**：Rest 参数只含未被命名的"剩余"参数；`arguments` 含所有传入参数。
- **位置**：Rest 参数必须是最后一个参数；`arguments` 无需声明。

### 5.5 默认参数 (Default Parameters) 是在什么时候求值的？

默认参数是**惰性求值**的，只有在调用函数且参数为 `undefined`（未提供）时才执行默认值表达式。

```js
let i = 0
function getVal() {
  return i++
}
function foo(val = getVal()) {
  console.log(val)
}

foo(10) // 10 (getVal 未执行)
foo() // 0 (getVal 执行)
foo() // 1 (getVal 再次执行)
```

### 5.6 默认参数会影响函数的 `length` 属性吗？

**会**。`length` 返回没有默认值的参数个数，且某个参数有默认值后，其后的所有参数都不计入：

```js
;(function (a) {}).length // 1
;(function (a = 5) {}).length // 0
;(function (a, b, c = 5) {}).length // 2
;(function (a, b = 5, c) {}).length // 1（c 也不计入）
```

### 5.7 什么是尾调用优化 (TCO)？为什么我看不到效果？

尾调用优化指函数最后一步调用另一函数时，引擎复用当前栈帧而非新建栈帧，防止栈溢出。**为何看不到**：虽 ES6 规范要求实现，但 Chrome V8、Firefox、Node.js 目前均未实现，仅 Safari 支持。原因是实现会丢失调试栈信息、复杂度高，普通 Web 开发收益不明显。

### 5.8 可以在箭头函数中使用 `await` 吗？

**可以**，只要箭头函数声明为 `async`：

```js
const fetchData = async () => {
  const res = await fetch('/api')
  return res.json()
}
```
