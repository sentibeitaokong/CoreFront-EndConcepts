# Generator 函数的语法

## 1. Generator 函数介绍

### 1.1 基本概念

Generator 函数是 ES6 提供的一种异步编程解决方案，语法行为与传统函数完全不同。本章介绍它的语法和 API，异步编程应用见同目录的《Generator 函数的异步应用》。

语法上，Generator 函数可以理解成一个状态机，封装了多个内部状态；执行它会返回一个遍历器对象，所以它同时也是一个遍历器对象生成函数，返回的遍历器可以依次遍历内部的每一个状态。

形式上它仍是普通函数，只是有两个特征：一是`function`关键字与函数名之间有一个星号；二是函数体内部使用`yield`表达式定义不同的内部状态（`yield`在英语里的意思就是“**产出**”）。

```js
function* helloWorldGenerator() {
  yield 'hello'
  yield 'world'
  return 'ending'
}

var hw = helloWorldGenerator()
```

上面的`helloWorldGenerator`内部有两个`yield`表达式（`hello`和`world`），即该函数有三个状态：hello、world 和 return 语句（结束执行）。

调用 Generator 函数的写法与普通函数一样；不同的是调用后函数体并不执行，返回的也不是运行结果，而是一个指向内部状态的指针对象，即遍历器对象（Iterator Object）。

必须调用遍历器对象的`next`方法，指针才会移向下一个状态：每次调用都从函数头部或上一次停下的地方开始执行，直到遇到下一个`yield`表达式（或`return`语句）为止。换言之，Generator 函数是分段执行的，`yield`表达式是暂停标记，`next`方法负责恢复执行。

```js
hw.next()
// { value: 'hello', done: false }

hw.next()
// { value: 'world', done: false }

hw.next()
// { value: 'ending', done: true }

hw.next()
// { value: undefined, done: true }
```

上面代码一共调用了四次`next`方法。第一次调用开始执行函数，直到第一个`yield`表达式为止，`value`为`hello`、`done`为`false`；第二次执行到下一个`yield`，`value`为`world`；第三次一直执行到`return`语句（没有则执行到函数结束），`value`是`return`后面表达式的值（没有`return`则为`undefined`），`done`为`true`；第四次返回`{ value: undefined, done: true }`，以后再调用`next`都是这个值。

总结一下：每次调用`next`都会返回一个带`value`和`done`的对象，`value`是`yield`后面表达式的值，`done`表示遍历是否结束。

ES6 没有规定星号写在`function`与函数名之间的哪个位置，下面的写法都能通过。

```js
function * foo(x, y) { ··· }
function *foo(x, y) { ··· }
function* foo(x, y) { ··· }
function*foo(x, y) { ··· }
```

通常采用第三种写法（星号紧跟在`function`后面），本文也是如此。

### 1.2 yield 表达式

只有调用`next`方法才会遍历下一个内部状态，因此 Generator 函数是一种可以暂停执行的函数，`yield`表达式就是暂停标志。

遍历器对象的`next`方法的运行逻辑如下。

（1）遇到`yield`表达式，就暂停执行后面的操作，并将紧跟在`yield`后面的那个表达式的值，作为返回的对象的`value`属性值。

（2）下一次调用`next`方法时继续往下执行，直到遇到下一个`yield`表达式。

（3）如果没有再遇到新的`yield`表达式，就一直运行到`return`语句为止（没有`return`语句则运行到函数结束），并将`return`语句后面表达式的值作为返回对象的`value`属性值；没有`return`语句时该值为`undefined`。

注意，`yield`后面的表达式只有`next`方法把指针指向该语句时才会执行，等于为 JavaScript 提供了手动的“**惰性求值**”（Lazy Evaluation）功能。

```js
function* gen() {
  yield 123 + 456
}
```

`yield`与`return`都能返回紧跟其后的表达式的值；区别是遇到`yield`函数就暂停，下次再从该位置继续执行，而`return`没有位置记忆：一个函数只能执行一次`return`，却可以执行多次`yield`，所以普通函数只能返回一个值，Generator 函数可以返回一系列的值。这也是它名称的来历（英语中 generator 是“**生成器**”）。

Generator 函数可以不用`yield`表达式，这时就变成了一个单纯的暂缓执行函数。

```js
function* f() {
  console.log('执行了！')
}

var generator = f()

setTimeout(function () {
  generator.next()
}, 2000)
```

`f`如果是普通函数，在为变量`generator`赋值时就会执行；但它是 Generator 函数，只有调用`next`时才会执行。

另外，`yield`表达式只能用在 Generator 函数里面，用在其他地方都会报错。

```js
(function (){
  yield 1;
})()
// SyntaxError: Unexpected number
```

```js
var arr = [1, [[2, 3], 4], [5, 6]];

var flat = function* (a) {
  a.forEach(function (item) {
    if (typeof item !== 'number') {
      yield* flat(item);
    } else {
      yield item;
    }
  });
};

for (var f of flat(arr)){
  console.log(f);
}
```

上面代码同样报错，因为`forEach`的参数是普通函数，里面却用了`yield`。改用`for`循环即可。

```js
var arr = [1, [[2, 3], 4], [5, 6]]

var flat = function* (a) {
  var length = a.length
  for (var i = 0; i < length; i++) {
    var item = a[i]
    if (typeof item !== 'number') {
      yield* flat(item)
    } else {
      yield item
    }
  }
}

for (var f of flat(arr)) {
  console.log(f)
}
// 1, 2, 3, 4, 5, 6
```

另外，`yield`表达式用在另一个表达式之中时必须加圆括号。

```js
function* demo() {
  console.log('Hello' + yield); // SyntaxError
  console.log('Hello' + yield 123); // SyntaxError

  console.log('Hello' + (yield)); // OK
  console.log('Hello' + (yield 123)); // OK
}
```

`yield`表达式用作函数参数或放在赋值表达式的右边，可以不加括号。

```js
function* demo() {
  foo(yield 'a', yield 'b') // OK
  let input = yield // OK
}
```

### 1.3 与 Iterator 接口的关系

任意一个对象的`Symbol.iterator`方法等于该对象的遍历器生成函数，调用它会返回该对象的一个遍历器对象。Generator 函数就是遍历器生成函数，因此可以把它赋值给对象的`Symbol.iterator`属性，使该对象具有 Iterator 接口。

```js
var myIterable = {}
myIterable[Symbol.iterator] = function* () {
  yield 1
  yield 2
  yield 3
}
;[...myIterable] // [1, 2, 3]
```

Generator 函数执行后返回的遍历器对象，本身也具有`Symbol.iterator`属性，执行后返回自身。

```js
function* gen() {
  // some code
}

var g = gen()

g[Symbol.iterator]() === g
// true
```

### 1.4 next 方法的参数

`yield`表达式本身没有返回值，或者说总是返回`undefined`。`next`方法可以带一个参数，该参数就会被当作上一个`yield`表达式的返回值。

```js
function* f() {
  for (var i = 0; true; i++) {
    var reset = yield i
    if (reset) {
      i = -1
    }
  }
}

var g = f()

g.next() // { value: 0, done: false }
g.next() // { value: 1, done: false }
g.next(true) // { value: 0, done: false }
```

上面定义了一个可以无限运行的 Generator 函数`f`：`next`不带参数时`reset`总是`undefined`；带参数`true`时`reset`被置为`true`，于是`i`等于`-1`，下一轮循环从`-1`开始递增。

这个功能有很重要的语法意义：Generator 函数恢复运行时上下文（context）不变，因此可以用`next`方法的参数在函数开始运行之后继续向函数体内部注入值，在不同阶段从外部调整函数行为。

再看一个例子。

```js
function* foo(x) {
  var y = 2 * (yield x + 1)
  var z = yield y / 3
  return x + y + z
}

var a = foo(5)
a.next() // Object{value:6, done:false}
a.next() // Object{value:NaN, done:false}
a.next() // Object{value:NaN, done:true}

var b = foo(5)
b.next() // { value:6, done:false }
b.next(12) // { value:8, done:false }
b.next(13) // { value:42, done:true }
```

第二次调用`next`不带参数时，`y`等于`2 * undefined`（即`NaN`），第三次同样不带参数，`z`等于`undefined`，返回对象的`value`就是`NaN`。

提供参数后结果完全不同：第二次把上一个`yield`表达式的值设为`12`，`y`等于`24`，返回`8`；第三次把它的值设为`13`，`z`等于`13`，所以`return`语句的值`5 + 24 + 13`等于`42`。

由于`next`方法的参数表示上一个`yield`表达式的返回值，第一次调用`next`时传参是无效的（V8 引擎直接忽略），只有从第二次开始才有效。语义上，第一个`next`用来启动遍历器对象，所以不用带参数。

再看一个用`next`方法的参数向函数内部输入值的例子。

```js
function* dataConsumer() {
  console.log('Started')
  console.log(`1. ${yield}`)
  console.log(`2. ${yield}`)
  return 'result'
}

let genObj = dataConsumer()
genObj.next()
// Started
genObj.next('a')
// 1. a
genObj.next('b')
// 2. b
```

如果想在第一次调用`next`时就能输入值，可以在 Generator 函数外面再包一层。

```js
function wrapper(generatorFunction) {
  return function (...args) {
    let generatorObject = generatorFunction(...args)
    generatorObject.next()
    return generatorObject
  }
}

const wrapped = wrapper(function* () {
  console.log(`First input: ${yield}`)
  return 'DONE'
})

wrapped().next('hello!')
// First input: hello!
```

### 1.5 for...of 循环

`for...of`循环可以自动遍历 Generator 函数返回的`Iterator`对象，不再需要调用`next`方法。

```js
function* foo() {
  yield 1
  yield 2
  yield 3
  yield 4
  yield 5
  return 6
}

for (let v of foo()) {
  console.log(v)
}
// 1 2 3 4 5
```

一旦`next`方法返回对象的`done`为`true`，`for...of`循环就会中止，且不包含该返回对象，所以`return`返回的`6`不在循环之中。

下面是一个利用 Generator 函数和`for...of`循环，实现斐波那契数列的例子。

```js
function* fibonacci() {
  let [prev, curr] = [0, 1]
  for (;;) {
    yield curr
    ;[prev, curr] = [curr, prev + curr]
  }
}

for (let n of fibonacci()) {
  if (n > 1000) break
  console.log(n)
}
```

JavaScript 对象原生没有遍历接口，无法使用`for...of`循环；利用 Generator 函数为它加上这个接口，就可以遍历任意对象了。

```js
function* objectEntries(obj) {
  let propKeys = Reflect.ownKeys(obj)

  for (let propKey of propKeys) {
    yield [propKey, obj[propKey]]
  }
}

let jane = { first: 'Jane', last: 'Doe' }

for (let [key, value] of objectEntries(jane)) {
  console.log(`${key}: ${value}`)
}
// first: Jane
// last: Doe
```

`jane`本身不具备 Iterator 接口，用`objectEntries`加上之后就能用`for...of`遍历。另一种写法是把 Generator 函数加到对象的`Symbol.iterator`属性上面。

```js
function* objectEntries() {
  let propKeys = Object.keys(this)

  for (let propKey of propKeys) {
    yield [propKey, this[propKey]]
  }
}

let jane = { first: 'Jane', last: 'Doe' }

jane[Symbol.iterator] = objectEntries

for (let [key, value] of jane) {
  console.log(`${key}: ${value}`)
}
// first: Jane
// last: Doe
```

除了`for...of`循环以外，扩展运算符（`...`）、解构赋值和`Array.from`方法内部调用的也都是遍历器接口，因此它们都可以把 Generator 函数返回的 Iterator 对象作为参数。

```js
function* numbers() {
  yield 1
  yield 2
  return 3
  yield 4
}

// 扩展运算符
;[...numbers()] // [1, 2]

// Array.from 方法
Array.from(numbers()) // [1, 2]

// 解构赋值
let [x, y] = numbers()
x // 1
y // 2

// for...of 循环
for (let n of numbers()) {
  console.log(n)
}
// 1
// 2
```

## 2. 提前终止 Generator 函数

### 2.1 Generator.prototype.throw()

Generator 函数返回的遍历器对象，都有一个`throw`方法，可以在函数体外抛出错误，然后在 Generator 函数体内捕获。

```js
var g = function* () {
  try {
    yield
  } catch (e) {
    console.log('内部捕获', e)
  }
}

var i = g()
i.next()

try {
  i.throw('a')
  i.throw('b')
} catch (e) {
  console.log('外部捕获', e)
}
// 内部捕获 a
// 外部捕获 b
```

遍历器对象`i`连续抛出两个错误：第一个被函数体内的`catch`捕获；第二次抛出时内部的`catch`已经执行过，不会再捕获它，于是错误被抛到函数体外，由外面的`catch`捕获。

`throw`方法可以接受一个参数，该参数会被`catch`语句接收，建议抛出`Error`对象的实例。

```js
var g = function* () {
  try {
    yield
  } catch (e) {
    console.log(e)
  }
}

var i = g()
i.next()
i.throw(new Error('出错了！'))
// Error: 出错了！(…)
```

注意不要混淆遍历器对象的`throw`方法和全局的`throw`命令：上面的错误是用前者抛出的，而`throw`命令只能被函数体外的`catch`捕获。

```js
var g = function* () {
  while (true) {
    try {
      yield
    } catch (e) {
      if (e != 'a') throw e
      console.log('内部捕获', e)
    }
  }
}

var i = g()
i.next()

try {
  throw new Error('a')
  throw new Error('b')
} catch (e) {
  console.log('外部捕获', e)
}
// 外部捕获 [Error: a]
```

之所以只捕获了`a`，是因为函数体外的`catch`捕获`a`以后，就不再执行`try`代码块里剩余的语句了。

如果 Generator 函数内部没有部署`try...catch`代码块，那么`throw`方法抛出的错误，将被外部`try...catch`代码块捕获。

```js
var g = function* () {
  while (true) {
    yield
    console.log('内部捕获', e)
  }
}

var i = g()
i.next()

try {
  i.throw('a')
  i.throw('b')
} catch (e) {
  console.log('外部捕获', e)
}
// 外部捕获 a
```

如果 Generator 函数内部和外部，都没有部署`try...catch`代码块，那么程序将报错，直接中断执行。

```js
var gen = function* gen() {
  yield console.log('hello')
  yield console.log('world')
}

var g = gen()
g.next()
g.throw()
// hello
// Uncaught undefined
```

`throw`方法抛出的错误要被内部捕获，前提是必须至少执行过一次`next`方法。

```js
function* gen() {
  try {
    yield 1
  } catch (e) {
    console.log('内部捕获')
  }
}

var g = gen()
g.throw(1)
// Uncaught 1
```

`g.throw(1)`执行时`next`方法一次都没有执行过，错误不会被内部捕获，而是直接在外部抛出：第一次执行`next`等同于启动 Generator 函数的内部代码，函数还没开始执行，错误只可能抛在外部。

`throw`方法被内部捕获以后，会附带执行到下一条`yield`表达式，这种情况下等同于执行一次`next`方法。

```js
var gen = function* gen() {
  try {
    yield 1
  } catch (e) {
    yield 2
  }
  yield 3
}

var g = gen()
g.next() // { value:1, done:false }
g.throw() // { value:2, done:false }
g.next() // { value:3, done:false }
g.next() // { value:undefined, done:true }
```

`g.throw`被内部捕获以后等同于执行了一次`next`方法，所以返回`{ value:2, done:false }`；只要内部部署了`try...catch`代码块，`throw`方法抛出的错误就不影响下一次遍历。

另外，`throw`命令与`g.throw`方法是无关的，两者互不影响。

```js
var gen = function* gen() {
  yield console.log('hello')
  yield console.log('world')
}

var g = gen()
g.next()

try {
  throw new Error()
} catch (e) {
  g.next()
}
// hello
// world
```

这种函数体内捕获错误的机制大大方便了错误处理：多个`yield`表达式只用一个`try...catch`代码块就够；而用回调函数的写法，想捕获多个错误就得为每个函数写一个错误处理语句。

Generator 函数体外抛出的错误，可以在函数体内捕获；反过来，函数体内抛出的错误，也可以被函数体外的`catch`捕获。

```js
function* foo() {
  var x = yield 3
  var y = x.toUpperCase()
  yield y
}

var it = foo()

it.next() // { value:3, done:false }

try {
  it.next(42)
} catch (err) {
  console.log(err)
}
```

第二个`next`向函数体内传入 42，数值没有`toUpperCase`方法，于是抛出 TypeError 错误，被函数体外的`catch`捕获。

一旦 Generator 执行过程中抛出错误且没有被内部捕获，就不会再执行下去了：此后调用`next`方法返回的是`value`为`undefined`、`done`为`true`的对象，即引擎认为它已经运行结束。

```js
function* g() {
  yield 1
  console.log('throwing an exception')
  throw new Error('generator broke!')
  yield 2
  yield 3
}

function log(generator) {
  var v
  console.log('starting generator')
  try {
    v = generator.next()
    console.log('第一次运行next方法', v)
  } catch (err) {
    console.log('捕捉错误', v)
  }
  try {
    v = generator.next()
    console.log('第二次运行next方法', v)
  } catch (err) {
    console.log('捕捉错误', v)
  }
  try {
    v = generator.next()
    console.log('第三次运行next方法', v)
  } catch (err) {
    console.log('捕捉错误', v)
  }
  console.log('caller done')
}

log(g())
// starting generator
// 第一次运行next方法 { value: 1, done: false }
// throwing an exception
// 捕捉错误 { value: 1, done: false }
// 第三次运行next方法 { value: undefined, done: true }
// caller done
```

第二次运行会抛出错误，第三次运行时 Generator 函数已经结束，不再执行下去。

### 2.2 Generator.prototype.return()

Generator 函数返回的遍历器对象，还有一个`return()`方法，可以返回给定的值，并且终结遍历 Generator 函数。

```js
function* gen() {
  yield 1
  yield 2
  yield 3
}

var g = gen()

g.next() // { value: 1, done: false }
g.return('foo') // { value: "foo", done: true }
g.next() // { value: undefined, done: true }
```

调用`return()`后，返回值的`value`就是它的参数`foo`，遍历同时终止、`done`为`true`，以后再调用`next()`的`done`总是`true`。

如果`return()`方法调用时，不提供参数，则返回值的`value`属性为`undefined`。

```js
function* gen() {
  yield 1
  yield 2
  yield 3
}

var g = gen()

g.next() // { value: 1, done: false }
g.return() // { value: undefined, done: true }
```

如果 Generator 函数内部有`try...finally`代码块，且正在执行`try`代码块，那么`return()`方法会导致立刻进入`finally`代码块，执行完以后，整个函数才会结束。

```js
function* numbers() {
  yield 1
  try {
    yield 2
    yield 3
  } finally {
    yield 4
    yield 5
  }
  yield 6
}
var g = numbers()
g.next() // { value: 1, done: false }
g.next() // { value: 2, done: false }
g.return(7) // { value: 4, done: false }
g.next() // { value: 5, done: false }
g.next() // { value: 7, done: true }
```

调用`return()`后立刻进入`finally`代码块，`try`里面剩下的代码不再执行；等`finally`代码块执行完，才返回`return()`指定的返回值。

### 2.3 next()、throw()、return() 的共同点

`next()`、`throw()`、`return()`这三个方法本质上是同一件事，可以放在一起理解。它们的作用都是让 Generator 函数恢复执行，并且使用不同的语句替换`yield`表达式。

`next()`是将`yield`表达式替换成一个值。

```js
const g = function* (x, y) {
  let result = yield x + y
  return result
}

const gen = g(1, 2)
gen.next() // Object {value: 3, done: false}

gen.next(1) // Object {value: 1, done: true}
// 相当于将 let result = yield x + y
// 替换成 let result = 1;
```

第二个`next(1)`方法相当于把`yield`表达式替换成一个值`1`；`next`方法没有参数时相当于替换成`undefined`。

`throw()`是将`yield`表达式替换成一个`throw`语句。

```js
gen.throw(new Error('出错了')) // Uncaught Error: 出错了
// 相当于将 let result = yield x + y
// 替换成 let result = throw(new Error('出错了'));
```

`return()`是将`yield`表达式替换成一个`return`语句。

```js
gen.return(2) // Object {value: 2, done: true}
// 相当于将 let result = yield x + y
// 替换成 let result = return 2;
```

## 3. Generator 函数的高级特性

### 3.1 yield\* 表达式

如果在 Generator 函数内部调用另一个 Generator 函数，就需要在前者的函数体内部自己手动完成遍历。

```js
function* foo() {
  yield 'a'
  yield 'b'
}

function* bar() {
  yield 'x'
  // 手动遍历 foo()
  for (let i of foo()) {
    console.log(i)
  }
  yield 'y'
}

for (let v of bar()) {
  console.log(v)
}
// x
// a
// b
// y
```

在`bar`里调用`foo`就得手动遍历它；嵌套多个 Generator 函数时非常麻烦。

ES6 提供了`yield*`表达式，作为解决办法，用来在一个 Generator 函数里面执行另一个 Generator 函数。

```js
function* bar() {
  yield 'x'
  yield* foo()
  yield 'y'
}

// 等同于
function* bar() {
  yield 'x'
  yield 'a'
  yield 'b'
  yield 'y'
}

// 等同于
function* bar() {
  yield 'x'
  for (let v of foo()) {
    yield v
  }
  yield 'y'
}

for (let v of bar()) {
  console.log(v)
}
// "x"
// "a"
// "b"
// "y"
```

再来看一个对比的例子。

```js
function* inner() {
  yield 'hello!'
}

function* outer1() {
  yield 'open'
  yield inner()
  yield 'close'
}

var gen = outer1()
gen.next().value // "open"
gen.next().value // 返回一个遍历器对象
gen.next().value // "close"

function* outer2() {
  yield 'open'
  yield* inner()
  yield 'close'
}

var gen = outer2()
gen.next().value // "open"
gen.next().value // "hello!"
gen.next().value // "close"
```

`outer2`使用了`yield*`，`outer1`没使用，结果就是`outer1`返回一个遍历器对象，`outer2`返回该遍历器对象的内部值。

如果`yield`表达式后面跟的是一个遍历器对象，就需要在`yield`后面加上星号，表示把遍历委托给它，这就是`yield*`表达式。

```js
let delegatedIterator = (function* () {
  yield 'Hello!'
  yield 'Bye!'
})()

let delegatingIterator = (function* () {
  yield 'Greetings!'
  yield* delegatedIterator
  yield 'Ok, bye.'
})()

for (let value of delegatingIterator) {
  console.log(value)
}
// "Greetings!
// "Hello!"
// "Bye!"
// "Ok, bye."
```

`delegatingIterator`是代理者，`delegatedIterator`是被代理者；因为后者是遍历器对象，`yield`后面要用星号表示委托。效果就是一个遍历器遍历了多个 Generator 函数，有递归的效果。

`yield*`后面的 Generator 函数（没有`return`语句时），等同于在 Generator 函数内部，部署一个`for...of`循环。

```js
function* concat(iter1, iter2) {
  yield* iter1
  yield* iter2
}

// 等同于

function* concat(iter1, iter2) {
  for (var value of iter1) {
    yield value
  }
  for (var value of iter2) {
    yield value
  }
}
```

可见没有`return`语句时，`yield*`后面的 Generator 函数不过是`for...of`的一种简写，完全可以用后者替代；有`return`语句时，则需要用`var value = yield* iterator`获取它的值。

如果`yield*`后面跟着一个数组，由于数组原生支持遍历器，因此就会遍历数组成员。

```js
function* gen() {
  yield* ['a', 'b', 'c']
}

gen().next() // { value:"a", done:false }
```

`yield`后面不加星号返回的是整个数组，加了星号则把数组当作遍历器逐个产出成员。

实际上，任何数据结构只要有 Iterator 接口，就可以被`yield*`遍历。

```js
let read = (function* () {
  yield 'hello'
  yield* 'hello'
})()

read.next().value // "hello"
read.next().value // "h"
```

字符串具有 Iterator 接口，所以`yield*`返回的是单个字符。

如果被代理的 Generator 函数有`return`语句，那么就可以向代理它的 Generator 函数返回数据。

```js
function* foo() {
  yield 2
  yield 3
  return 'foo'
}

function* bar() {
  yield 1
  var v = yield* foo()
  console.log('v: ' + v)
  yield 4
}

var it = bar()

it.next()
// {value: 1, done: false}
it.next()
// {value: 2, done: false}
it.next()
// {value: 3, done: false}
it.next()
// "v: foo"
// {value: 4, done: false}
it.next()
// {value: undefined, done: true}
```

第四次调用`next`时屏幕上会有输出，因为`foo`的`return`语句向`bar`提供了返回值。

再看一个例子。

```js
function* genFuncWithReturn() {
  yield 'a'
  yield 'b'
  return 'The result'
}
function* logReturned(genObj) {
  let result = yield* genObj
  console.log(result)
}

;[...logReturned(genFuncWithReturn())]
// The result
// 值为 [ 'a', 'b' ]
```

上面存在两次遍历的叠加：扩展运算符遍历`logReturned`返回的遍历器，`yield*`又遍历`genFuncWithReturn`返回的遍历器，最终表现为扩展运算符遍历后者的结果，所以值是`[ 'a', 'b' ]`；后者的`return`值`The result`赋给了`logReturned`内部的`result`变量，因此有终端输出。

`yield*`命令可以很方便地取出嵌套数组的所有成员。

```js
function* iterTree(tree) {
  if (Array.isArray(tree)) {
    for (let i = 0; i < tree.length; i++) {
      yield* iterTree(tree[i])
    }
  } else {
    yield tree
  }
}

const tree = ['a', ['b', 'c'], ['d', 'e']]

for (let x of iterTree(tree)) {
  console.log(x)
}
// a
// b
// c
// d
// e
```

扩展运算符默认调用 Iterator 接口，所以这个函数也可以用于平铺嵌套数组。

```js
;[...iterTree(tree)] // ["a", "b", "c", "d", "e"]
```

下面是一个稍微复杂的例子，用`yield*`语句遍历完全二叉树。

```js
// 下面是二叉树的构造函数，
// 三个参数分别是左树、当前节点和右树
function Tree(left, label, right) {
  this.left = left
  this.label = label
  this.right = right
}

// 下面是中序（inorder）遍历函数。
// 由于返回的是一个遍历器，所以要用generator函数。
// 函数体内采用递归算法，所以左树和右树要用yield*遍历
function* inorder(t) {
  if (t) {
    yield* inorder(t.left)
    yield t.label
    yield* inorder(t.right)
  }
}

// 下面生成二叉树
function make(array) {
  // 判断是否为叶节点
  if (array.length == 1) return new Tree(null, array[0], null)
  return new Tree(make(array[0]), array[1], make(array[2]))
}
let tree = make([[['a'], 'b', ['c']], 'd', [['e'], 'f', ['g']]])

// 遍历二叉树
var result = []
for (let node of inorder(tree)) {
  result.push(node)
}

result
// ['a', 'b', 'c', 'd', 'e', 'f', 'g']
```

### 3.2 作为对象属性的 Generator 函数

如果一个对象的属性是 Generator 函数，可以简写成下面的形式。

```js
let obj = {
  * myGeneratorMethod() {
    ···
  }
};
```

`myGeneratorMethod`属性前面的星号表示这个属性是一个 Generator 函数。

它的完整形式如下，与上面的写法等价。

```js
let obj = {
  myGeneratorMethod: function* () {
    // ···
  },
}
```

### 3.3 Generator 函数的`this`

Generator 函数总是返回一个遍历器，ES6 规定这个遍历器是 Generator 函数的实例，也继承了 Generator 函数的`prototype`对象上的方法。

```js
function* g() {}

g.prototype.hello = function () {
  return 'hi!'
}

let obj = g()

obj instanceof g // true
obj.hello() // 'hi!'
```

可见`g`返回的遍历器`obj`是`g`的实例，继承了`g.prototype`；但把`g`当作普通构造函数并不生效，因为它返回的总是遍历器对象，而不是`this`对象。

```js
function* g() {
  this.a = 11
}

let obj = g()
obj.next()
obj.a // undefined
```

Generator 函数也不能跟`new`命令一起用，会报错。

```js
function* F() {
  yield (this.x = 2)
  yield (this.y = 3)
}

new F()
// TypeError: F is not a constructor
```

那么，有没有办法让 Generator 函数返回一个正常的对象实例，既可以用`next`方法，又可以获得正常的`this`？

一个变通方法是：先生成一个空对象，使用`call`方法绑定 Generator 函数内部的`this`，这样构造函数调用以后，这个空对象就是 Generator 函数的实例对象了。

```js
function* F() {
  this.a = 1
  yield (this.b = 2)
  yield (this.c = 3)
}
var obj = {}
var f = F.call(obj)

f.next() // Object {value: 2, done: false}
f.next() // Object {value: 3, done: false}
f.next() // Object {value: undefined, done: true}

obj.a // 1
obj.b // 2
obj.c // 3
```

上面代码先把`F`内部的`this`绑定到`obj`再调用，返回一个 Iterator 对象；执行三次`next`方法（因为有两个`yield`表达式）后函数运行完毕，内部属性都绑定在`obj`上，`obj`也就成了`F`的实例。

上面代码中执行的是遍历器对象`f`，但生成的对象实例是`obj`，有没有办法将这两个对象统一呢？

一个办法就是将`obj`换成`F.prototype`。

```js
function* F() {
  this.a = 1
  yield (this.b = 2)
  yield (this.c = 3)
}
var f = F.call(F.prototype)

f.next() // Object {value: 2, done: false}
f.next() // Object {value: 3, done: false}
f.next() // Object {value: undefined, done: true}

f.a // 1
f.b // 2
f.c // 3
```

再将`F`改成构造函数，就可以对它执行`new`命令了。

```js
function* gen() {
  this.a = 1
  yield (this.b = 2)
  yield (this.c = 3)
}

function F() {
  return gen.call(gen.prototype)
}

var f = new F()

f.next() // Object {value: 2, done: false}
f.next() // Object {value: 3, done: false}
f.next() // Object {value: undefined, done: true}

f.a // 1
f.b // 2
f.c // 3
```

## 4. Generator 函数核心应用场景

Generator 可以暂停函数执行，返回任意表达式的值，这一特点使它有多种应用场景。

### 4.1 异步操作的同步化表达

Generator 函数能暂停执行，意味着可以把异步操作写在`yield`表达式里，等调用`next`方法时再往后执行——异步操作的后续代码就放在`yield`下面，反正要等`next`才执行，等于不需要写回调函数了。所以它的一个重要实际意义，就是处理异步操作、改写回调函数。

```js
function* loadUI() {
  showLoadingScreen()
  yield loadUIDataAsynchronously()
  hideLoadingScreen()
}
var loader = loadUI()
// 加载UI
loader.next()

// 卸载UI
loader.next()
```

第一次调用`loadUI`时函数体不会执行，仅返回一个遍历器；对它调用`next`方法会显示`Loading`界面并异步加载数据，加载完再调用一次`next`则隐藏该界面。所有`Loading`逻辑都封装在一个函数里，按部就班，非常清晰。

Ajax 是典型的异步操作，通过 Generator 函数部署 Ajax 操作，可以用同步的方式表达。

```js
function* main() {
  var result = yield request('http://some.url')
  var resp = JSON.parse(result)
  console.log(resp.value)
}

function request(url) {
  makeAjaxCall(url, function (response) {
    it.next(response)
  })
}

var it = main()
it.next()
```

`main`函数通过 Ajax 获取数据，除了多一个`yield`，几乎与同步写法完全一样。注意`makeAjaxCall`中的`next`方法必须加上`response`参数，因为`yield`表达式本身没有值，总是等于`undefined`。

另一个例子是通过 Generator 函数逐行读取文本文件。

```js
function* numbers() {
  let file = new FileReader('numbers.txt')
  try {
    while (!file.eof) {
      yield parseInt(file.readLine(), 10)
    }
  } finally {
    file.close()
  }
}
```

### 4.2 控制流管理

如果有一个多步操作非常耗时，采用回调函数，可能会写成下面这样。

```js
step1(function (value1) {
  step2(value1, function (value2) {
    step3(value2, function (value3) {
      step4(value3, function (value4) {
        // Do something with value4
      })
    })
  })
})
```

采用 Promise 改写上面的代码。

```js
Promise.resolve(step1)
  .then(step2)
  .then(step3)
  .then(step4)
  .then(
    function (value4) {
      // Do something with value4
    },
    function (error) {
      // Handle any error from step1 through step4
    },
  )
```

这样已经把回调改成了直线执行的形式，但引入了大量 Promise 语法，Generator 函数可以进一步改善运行流程。

```js
function* longRunningTask(value1) {
  try {
    var value2 = yield step1(value1)
    var value3 = yield step2(value2)
    var value4 = yield step3(value3)
    var value5 = yield step4(value4)
    // Do something with value4
  } catch (e) {
    // Handle any error from step1 through step4
  }
}
```

然后，用一个函数按次序自动执行所有步骤。

```js
scheduler(longRunningTask(initialValue))

function scheduler(task) {
  var taskObj = task.next(task.value)
  // 如果Generator函数未结束，就继续调用
  if (!taskObj.done) {
    task.value = taskObj.value
    scheduler(task)
  }
}
```

注意，这种做法只适合同步操作：代码一得到返回值就继续往下执行，不判断异步操作何时完成；如果步骤里有异步操作，执行器还必须等到它完成以后再继续。

下面利用`for...of`循环会自动依次执行`yield`命令的特性，提供一种更一般的控制流管理方法。

```js
let steps = [step1Func, step2Func, step3Func]

function* iterateSteps(steps) {
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i]
    yield step()
  }
}
```

数组`steps`封装了一个任务的多个步骤，`iterateSteps`依次为它们加上`yield`命令。

将任务分解成步骤之后，还可以反过来把项目分解成多个依次执行的任务。

```js
let jobs = [job1, job2, job3]

function* iterateJobs(jobs) {
  for (var i = 0; i < jobs.length; i++) {
    var job = jobs[i]
    yield* iterateSteps(job.steps)
  }
}
```

数组`jobs`封装了一个项目的多个任务，`iterateJobs`依次为它们加上`yield*`命令。

最后，就可以用`for...of`循环一次性执行所有任务的所有步骤。

```js
for (var step of iterateJobs(jobs)) {
  console.log(step.id)
}
```

再次提醒，上面的做法只适用于所有步骤都是同步操作的情况；要依次执行异步步骤，执行器必须能够等待异步操作完成（详见同目录的《Generator 函数的异步应用》）。

`for...of`的本质是一个`while`循环，所以上面的代码实质上执行的是下面的逻辑。

```js
var it = iterateJobs(jobs)
var res = it.next()

while (!res.done) {
  var result = res.value
  // ...
  res = it.next()
}
```

### 4.3 部署 Iterator 接口

利用 Generator 函数，可以在任意对象上部署 Iterator 接口。

```js
function* iterEntries(obj) {
  let keys = Object.keys(obj)
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i]
    yield [key, obj[key]]
  }
}

let myObj = { foo: 3, bar: 7 }

for (let [key, value] of iterEntries(myObj)) {
  console.log(key, value)
}

// foo 3
// bar 7
```

下面是一个对数组部署 Iterator 接口的例子，尽管数组原生具有这个接口。

```js
function* makeSimpleGenerator(array) {
  var nextIndex = 0

  while (nextIndex < array.length) {
    yield array[nextIndex++]
  }
}

var gen = makeSimpleGenerator(['yo', 'ya'])

gen.next().value // 'yo'
gen.next().value // 'ya'
gen.next().done // true
```

### 4.4 作为数据结构

Generator 可以看作一种数据结构，更确切地说是一个数组结构：它能返回一系列的值，相当于对任意表达式提供类似数组的接口。

```js
function* doStuff() {
  yield fs.readFile.bind(null, 'hello.txt')
  yield fs.readFile.bind(null, 'world.txt')
  yield fs.readFile.bind(null, 'and-such.txt')
}
```

上面依次返回三个函数，由于用了 Generator 函数，可以像处理数组那样处理它们。

```js
for (task of doStuff()) {
  // task是一个函数，可以像回调函数那样使用它
}
```

如果用 ES5 表达，完全可以用数组模拟 Generator 的这种用法。

```js
function doStuff() {
  return [
    fs.readFile.bind(null, 'hello.txt'),
    fs.readFile.bind(null, 'world.txt'),
    fs.readFile.bind(null, 'and-such.txt'),
  ]
}
```

上面的函数可以用一模一样的`for...of`循环处理！两相比较就看出，Generator 使得数据或者操作具备了类似数组的接口。

### 4.5 Generator 与状态机

Generator 是实现状态机的最佳结构。比如下面的`clock`函数就是一个状态机。

```js
var ticking = true
var clock = function () {
  if (ticking) console.log('Tick!')
  else console.log('Tock!')
  ticking = !ticking
}
```

`clock`一共有两种状态（`Tick`和`Tock`），每运行一次就改变一次状态；用 Generator 实现就是下面这样。

```js
var clock = function* () {
  while (true) {
    console.log('Tick!')
    yield
    console.log('Tock!')
    yield
  }
}
```

与 ES5 实现相比，Generator 实现少了用来保存状态的外部变量`ticking`，因此更简洁、更安全（状态不会被非法篡改）、更符合函数式编程的思想：它本身就包含“当前是否处于暂停态”这一状态信息。

## **5. 常见问题 (FAQ)**

### 5.1 Generator 函数是同步的还是异步的？

- **同步的**。Generator 函数并不会自己“**在后台跑**”：每次调用`next()`都是同步执行，一直执行到下一个`yield`才返回。
- 它提供的只是**暂停/恢复**的能力。异步效果来自“`yield` 一个 Promise + 执行器在该 Promise 完成后调用`next()`”这套组合（见《Generator 函数的异步应用》），而不是 Generator 函数本身。

### 5.2 一个遍历器对象能重复遍历吗？

- **不能**。遍历器是一次性的，`done`为`true`之后再遍历只会得到空结果；想重新遍历，必须重新调用 Generator 函数生成新的遍历器。

```js
function* gen() {
  yield 1
  yield 2
}

const it = gen()
;[...it] // [1, 2]
;[...it] // [] —— 同一个遍历器已经用完
;[...gen()] // [1, 2] —— 重新调用函数才有新遍历器
```

### 5.3 暂停中的 Generator 会一直占着内存吗？怎么清理？

- **会**。暂停时它的整个执行上下文（局部变量等）都保留在堆上，直到函数执行结束。大量长期挂起的 Generator 会占用可观的内存。
- 不再需要时主动调用`return()`结束它：`finally`代码块会被执行，可以在这里释放资源（关闭文件、清除定时器等）。

```js
function* withRes() {
  try {
    yield 1
    yield 2
  } finally {
    console.log('释放资源') // return() 也会触发
  }
}

const g = withRes()
g.next() // { value: 1, done: false }
g.return(99) // 先打印“释放资源”，再返回 { value: 99, done: true }
```

### 5.4 `yield`、`yield*`、`await` 有什么区别？

- `yield`：产出一个值并暂停，只能用在 Generator 函数内部。
- `yield*`：把一个可遍历对象（另一个 Generator、数组、字符串等）的成员逐个委托出去。
- `await`：等待一个 Promise 落定，只能用在`async`函数或模块顶层。
- 三者都会让函数暂停，区别在于恢复方式：`yield`/`yield*`由外部调用`next()`恢复，`await`由引擎在 Promise 落定后自动恢复。

### 5.5 有了 `async/await`，还需要 Generator 吗？

- 处理异步流程基本不需要了。`async/await`就是 Generator + 自动执行器的语法糖（详见《Generator 函数的异步应用》）。
- 但 Generator 还有`async/await`不具备的能力：向函数体内注入值或错误、精确控制每次`next()`的时机、实现惰性求值与无限序列、为对象部署 Iterator 接口等。

### 5.6 `throw()`抛出错误后，遍历还能继续吗？

- 看错误是否被内部捕获。内部`try...catch`捕获之后，`throw()`相当于一次`next()`，遍历继续进行。
- 如果内部没有捕获（或者`next()`一次都没调用过），错误会抛到函数外，遍历器随即进入结束状态，此后`next()`永远返回`{ value: undefined, done: true }`。
