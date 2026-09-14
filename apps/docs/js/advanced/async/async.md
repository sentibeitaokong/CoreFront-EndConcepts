# async 函数

async/await 是 ES2017 (ES8) 引入的语法，建立在 Promise 之上，能用近乎同步的写法管理异步流程，解决“回调地狱”和 Promise 链式调用的繁琐。

## 1. 什么是 async 函数？

一句话，async 函数就是 Generator 函数的语法糖。

下面是一个依次读取两个文件的 Generator 函数。

```js
const fs = require('fs')

const readFile = function (fileName) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName, function (error, data) {
      if (error) return reject(error)
      resolve(data)
    })
  })
}

const gen = function* () {
  const f1 = yield readFile('/etc/fstab')
  const f2 = yield readFile('/etc/shells')
  console.log(f1.toString())
  console.log(f2.toString())
}
```

上面的`gen`改写成`async`函数就是下面这样。

```js
const asyncReadFile = async function () {
  const f1 = await readFile('/etc/fstab')
  const f2 = await readFile('/etc/shells')
  console.log(f1.toString())
  console.log(f2.toString())
}
```

一比较就会发现，**`async`函数就是把 Generator 的星号（`*`）替换成`async`，把`yield`替换成`await`**，仅此而已。相比 Generator 函数，它的改进有四点。

（1）内置执行器。Generator 函数必须靠`co`模块这类执行器才能跑起来，而`async`函数自带执行器，调用方式与普通函数一模一样，只要一行。

```js
asyncReadFile()
```

这行代码会自动执行并输出最终结果，完全不像 Generator 函数那样，需要调用`next`方法或用`co`模块才能真正跑起来。

（2）更好的语义。`async`表示函数里有异步操作，`await`表示紧跟在后面的表达式需要等待结果，比星号和`yield`清楚得多。

（3）更广的适用性。`co`模块约定，`yield`命令后面只能是 Thunk 函数或 Promise 对象；而`await`命令后面既可以是 Promise 对象，也可以是原始类型的值（数值、字符串和布尔值，这时会自动转成立即 resolved 的 Promise 对象）。

（4）返回值是 Promise。`async`函数返回 Promise 对象，可以直接用`then`方法指定下一步操作，比 Generator 函数返回 Iterator 对象方便。**`async`函数可以看作多个异步操作包装成的一个 Promise 对象，而`await`命令就是内部`then`命令的语法糖。**

## 2. 基本用法

`async`函数返回一个 Promise 对象，可以使用`then`方法添加回调函数。当函数执行的时候，一旦遇到`await`就会先返回，等到异步操作完成，再接着执行函数体内后面的语句。

下面是一个获取股票报价的例子。

```js
async function getStockPriceByName(name) {
  const symbol = await getStockSymbol(name)
  const stockPrice = await getStockPrice(symbol)
  return stockPrice
}

getStockPriceByName('goog').then(function (result) {
  console.log(result)
})
```

函数前面的`async`关键字表明该函数内部有异步操作。调用该函数时，会立即返回一个`Promise`对象。

下面是另一个例子，指定多少毫秒后输出一个值。

```js
function timeout(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function asyncPrint(value, ms) {
  await timeout(ms)
  console.log(value)
}

asyncPrint('hello world', 50)
```

由于`async`函数返回的是 Promise 对象，可以作为`await`命令的参数，所以上面的例子也可以写成下面的形式。

```js
async function timeout(ms) {
  await new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function asyncPrint(value, ms) {
  await timeout(ms)
  console.log(value)
}

asyncPrint('hello world', 50)
```

async 函数有多种使用形式。

```js
// 函数声明
async function foo() {}

// 函数表达式
const foo = async function () {};

// 对象的方法
let obj = { async foo() {} };
obj.foo().then(...)

// Class 的方法
class Storage {
  constructor() {
    this.cachePromise = caches.open('avatars');
  }

  async getAvatar(name) {
    const cache = await this.cachePromise;
    return cache.match(`/avatars/${name}.jpg`);
  }
}

const storage = new Storage();
storage.getAvatar('jake').then(…);

// 箭头函数
const foo = async () => {};
```

## 3. async 函数的高级特性

`async`函数的语法规则总体上比较简单，难点是错误处理机制。

### 3.1 返回 Promise 对象

`async`函数内部`return`语句返回的值，会成为`then`方法回调函数的参数。

```js
async function f() {
  return 'hello world'
}

f().then(v => console.log(v))
// "hello world"
```

`async`函数内部抛出错误，会导致返回的 Promise 对象变为`reject`状态，抛出的错误对象会被`catch`方法回调函数接收到。

```js
async function f() {
  throw new Error('出错了')
}

f().then(
  v => console.log('resolve', v),
  e => console.log('reject', e),
)
//reject Error: 出错了
```

### 3.2 Promise 对象的状态变化

`async`函数返回的 Promise 对象，必须等到内部所有`await`命令后面的 Promise 对象执行完，才会发生状态改变，除非遇到`return`语句或者抛出错误。也就是说，只有`async`函数内部的异步操作执行完，才会执行`then`方法指定的回调函数。

```js
async function getTitle(url) {
  let response = await fetch(url)
  let html = await response.text()
  return html.match(/<title>([\s\S]+)<\/title>/i)[1]
}
getTitle('https://tc39.github.io/ecma262/').then(console.log)
// "ECMAScript 2017 Language Specification"
```

上面代码中，`getTitle`内部有三个操作：抓取网页、取出文本、匹配页面标题，只有这三个操作全部完成，才会执行`then`方法里面的`console.log`。

### 3.3 await 命令

正常情况下，`await`命令后面是一个 Promise 对象，返回该对象的结果；如果不是 Promise 对象，就直接返回对应的值。

```js
async function f() {
  // 等同于
  // return 123;
  return await 123
}

f().then(v => console.log(v))
// 123
```

上面代码中`await`的参数是数值`123`，这时等同于`return 123`。

另一种情况是，`await`命令后面是一个 thenable 对象（即定义了`then`方法的对象），那么`await`会将其等同于 Promise 对象。

```js
class Sleep {
  constructor(timeout) {
    this.timeout = timeout
  }
  then(resolve, reject) {
    const startTime = Date.now()
    setTimeout(() => resolve(Date.now() - startTime), this.timeout)
  }
}

;(async () => {
  const sleepTime = await new Sleep(1000)
  console.log(sleepTime)
})()
// 1000
```

上面代码中，`Sleep`的实例不是 Promise 对象，但因为定义了`then`方法，`await`会把它当作 Promise 处理。

这个例子还演示了如何实现休眠效果。JavaScript 一直没有休眠的语法，借助`await`就可以让程序停顿指定的时间，下面是一个简化的`sleep`实现。

```js
function sleep(interval) {
  return new Promise(resolve => {
    setTimeout(resolve, interval)
  })
}

// 用法
async function one2FiveInAsync() {
  for (let i = 1; i <= 5; i++) {
    console.log(i)
    await sleep(1000)
  }
}

one2FiveInAsync()
```

`await`命令后面的 Promise 对象如果变为`reject`状态，`reject`的参数会被`catch`方法的回调函数接收到。

```js
async function f() {
  await Promise.reject('出错了')
}

f()
  .then(v => console.log(v))
  .catch(e => console.log(e))
// 出错了
```

注意，上面代码中`await`语句前面没有`return`，但`reject`的参数依然传入了`catch`的回调；这里在`await`前面加上`return`，效果是一样的。

任何一个`await`语句后面的 Promise 对象变为`reject`状态，整个`async`函数都会中断执行。

```js
async function f() {
  await Promise.reject('出错了')
  await Promise.resolve('hello world') // 不会执行
}
```

有时我们希望即使前一个异步操作失败，也不要中断后面的操作。这时可以把第一个`await`放在`try...catch`里，这样不管它是否成功，第二个`await`都会执行。

```js
async function f() {
  try {
    await Promise.reject('出错了')
  } catch (e) {}
  return await Promise.resolve('hello world')
}

f().then(v => console.log(v))
// hello world
```

另一种方法是在`await`后面的 Promise 对象后面再接一个`catch`方法，处理前面可能出现的错误。

```js
async function f() {
  await Promise.reject('出错了').catch(e => console.log(e))
  return await Promise.resolve('hello world')
}

f().then(v => console.log(v))
// 出错了
// hello world
```

### 3.4 错误处理

如果`await`后面的异步操作出错，等同于`async`函数返回的 Promise 对象被`reject`。

```js
async function f() {
  await new Promise(function (resolve, reject) {
    throw new Error('出错了')
  })
}

f()
  .then(v => console.log(v))
  .catch(e => console.log(e))
// Error：出错了
```

上面代码中，`await`后面的 Promise 对象会抛出一个错误对象，导致`catch`的回调函数被调用，它的参数就是抛出的错误对象。具体的执行机制，可以参考后文的“async 函数的实现原理”。

防止出错的方法，同样是把它放在`try...catch`里；如果有多个`await`命令，可以统一放在一个`try...catch`结构中。

```js
async function f() {
  try {
    await new Promise(function (resolve, reject) {
      throw new Error('出错了')
    })
  } catch (e) {}
  return await 'hello world'
}
```

```js
async function main() {
  try {
    const val1 = await firstStep()
    const val2 = await secondStep(val1)
    const val3 = await thirdStep(val1, val2)

    console.log('Final: ', val3)
  } catch (err) {
    console.error(err)
  }
}
```

下面的例子使用`try...catch`结构，实现多次重复尝试。

```js
const superagent = require('superagent')
const NUM_RETRIES = 3

async function test() {
  let i
  for (i = 0; i < NUM_RETRIES; ++i) {
    try {
      await superagent.get('http://google.com/this-throws-an-error')
      break
    } catch (err) {}
  }
  console.log(i) // 3
}

test()
```

上面代码中，如果`await`操作成功，就会用`break`退出循环；如果失败，会被`catch`捕捉，然后进入下一轮循环。

### 3.5 使用注意点

第一点，`await`命令后面的 Promise 对象运行结果可能是`rejected`，所以最好把`await`命令放在`try...catch`代码块中。

```js
async function myFunction() {
  try {
    await somethingThatReturnsAPromise()
  } catch (err) {
    console.log(err)
  }
}

// 另一种写法

async function myFunction() {
  await somethingThatReturnsAPromise().catch(function (err) {
    console.log(err)
  })
}
```

第二点，多个`await`命令后面的异步操作，如果不存在继发关系，最好让它们同时触发。

```js
let foo = await getFoo()
let bar = await getBar()
```

上面代码中，`getFoo`和`getBar`是两个互不依赖的异步操作，却被写成了继发关系：只有`getFoo`完成以后才会执行`getBar`，比较耗时。让它们同时触发即可。

```js
// 写法一
let [foo, bar] = await Promise.all([getFoo(), getBar()])

// 写法二
let fooPromise = getFoo()
let barPromise = getBar()
let foo = await fooPromise
let bar = await barPromise
```

第三点，`await`命令只能用在`async`函数之中，用在普通函数里就会报错。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}];

  // 报错
  docs.forEach(function (doc) {
    await db.post(doc);
  });
}
```

上面代码会报错。但把`forEach`的参数改成`async`函数也有问题。

```js
function dbFuc(db) {
  //这里不需要 async
  let docs = [{}, {}, {}]

  // 可能得到错误结果
  docs.forEach(async function (doc) {
    await db.post(doc)
  })
}
```

这时三个`db.post()`操作将是并发执行，而不是继发执行，可能得不到预期结果。正确的写法是用`for`循环。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}]

  for (let doc of docs) {
    await db.post(doc)
  }
}
```

另一种方法是使用数组的`reduce()`方法。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}]

  await docs.reduce(async (_, doc) => {
    await _
    await db.post(doc)
  }, undefined)
}
```

上面例子中，`reduce()`的第一个参数是`async`函数，导致该函数的第一个参数是前一步操作返回的 Promise 对象，所以必须用`await`等它结束。另外，`reduce()`返回的是数组最后一个成员的`async`函数的执行结果，也是一个 Promise 对象，所以前面也要加上`await`。

参数函数里没有`return`语句，原因是它的主要目的是`db.post()`操作而不是返回值；而且`async`函数不管有没有`return`都总是返回 Promise 对象，这个`return`是不必要的。

如果确实希望多个请求并发执行，可以使用`Promise.all`方法。当三个请求都会`resolved`时，下面两种写法效果相同。

```js
async function dbFuc(db) {
  let docs = [{}, {}, {}]
  let promises = docs.map(doc => db.post(doc))

  let results = await Promise.all(promises)
  console.log(results)
}

// 或者使用下面的写法

async function dbFuc(db) {
  let docs = [{}, {}, {}]
  let promises = docs.map(doc => db.post(doc))

  let results = []
  for (let promise of promises) {
    results.push(await promise)
  }
  console.log(results)
}
```

第四点，async 函数可以保留运行堆栈。

```js
const a = () => {
  b().then(() => c())
}
```

上面代码中，函数`a`内部运行了一个异步任务`b()`。当`b()`运行的时候，`a()`不会中断而是继续执行，等`b()`运行结束时`a()`可能早就结束了，`b()`所在的上下文环境也已经消失。如果`b()`或`c()`报错，错误堆栈将不包括`a()`。

改成`async`函数后：

```js
const a = async () => {
  await b()
  c()
}
```

这时`b()`运行的时候，`a()`是暂停执行，上下文环境都保存着，一旦`b()`或`c()`报错，错误堆栈将包括`a()`。

## 4. async 函数的实现原理

async 函数的实现原理，就是将 Generator 函数和自动执行器包装在一个函数里。

```js
async function fn(args) {
  // ...
}

// 等同于

function fn(args) {
  return spawn(function* () {
    // ...
  })
}
```

所有的`async`函数都可以写成上面的第二种形式，其中的`spawn`函数就是自动执行器，实现如下。

```js
function spawn(genF) {
  return new Promise(function (resolve, reject) {
    const gen = genF()
    function step(nextF) {
      let next
      try {
        next = nextF()
      } catch (e) {
        return reject(e)
      }
      if (next.done) {
        return resolve(next.value)
      }
      Promise.resolve(next.value).then(
        function (v) {
          step(function () {
            return gen.next(v)
          })
        },
        function (e) {
          step(function () {
            return gen.throw(e)
          })
        },
      )
    }
    step(function () {
      return gen.next(undefined)
    })
  })
}
```

## 5. async 函数的核心应用场景

### 5.1 与其他异步处理方法的比较

假定某个 DOM 元素上部署了一系列动画，前一个动画结束才能开始后一个；如果当中有一个出错，就不再往下执行，返回上一个成功执行的动画的返回值。下面分别用 Promise、Generator 和 async 函数实现。

先是 Promise 的写法。

```js
function chainAnimationsPromise(elem, animations) {
  // 变量ret用来保存上一个动画的返回值
  let ret = null

  // 新建一个空的Promise
  let p = Promise.resolve()

  // 使用then方法，添加所有动画
  for (let anim of animations) {
    p = p.then(function (val) {
      ret = val
      return anim(elem)
    })
  }

  // 返回一个部署了错误捕捉机制的Promise
  return p
    .catch(function (e) {
      /* 忽略错误，继续执行 */
    })
    .then(function () {
      return ret
    })
}
```

比起回调函数，Promise 的写法大大改进，但一眼看上去全是`then`、`catch`这些 API，操作本身的语义反而不容易看出来。

接着是 Generator 函数的写法。

```js
function chainAnimationsGenerator(elem, animations) {
  return spawn(function* () {
    let ret = null
    try {
      for (let anim of animations) {
        ret = yield anim(elem)
      }
    } catch (e) {
      /* 忽略错误，继续执行 */
    }
    return ret
  })
}
```

这个写法遍历每个动画，语义比 Promise 写法清晰，用户定义的操作全都在`spawn`函数内部。问题在于必须有一个任务运行器来自动执行 Generator 函数（这里的`spawn`），而且必须保证`yield`后面的表达式返回一个 Promise。

最后是 async 函数的写法。

```js
async function chainAnimationsAsync(elem, animations) {
  let ret = null
  try {
    for (let anim of animations) {
      ret = await anim(elem)
    }
  } catch (e) {
    /* 忽略错误，继续执行 */
  }
  return ret
}
```

可以看到 async 函数的实现最简洁、最符合语义，几乎没有语义不相关的代码：Generator 写法中的自动执行器被移到语言层面提供，不再暴露给用户。

[width(11,31,30,28)]

| 特性       | Promise                                                 | Generator 函数                                             | async/await                                      |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| 核心目的   | 表示一个异步操作的最终结果                              | 创建一个可暂停/恢复的函数，用于生成迭代器                  | 以同步的方式编写异步代码，简化 Promise 的使用    |
| 基本语法   | new Promise(), .then(), .catch()                        | function\*, yield, next()                                  | async function, await                            |
| 执行控制   | 自动执行。一旦创建，代码立即执行；通过 .then 注册回调。 | 手动控制。调用 .next() 才会执行到下一个 yield。            | 自动执行。await 关键字会自动暂停和恢复函数执行。 |
| 返回值     | 立即返回一个 Promise 对象（状态为 pending）             | 立即返回一个生成器/迭代器对象，而不是执行函数体。          | 立即返回一个 Promise 对象。                      |
| 结果获取   | 在 .then(result => ...) 的回调中获取                    | 通过 generator.next().value 获取 yield 后的值              | await 表达式会直接返回 Promise resolve 的值      |
| 错误处理   | 使用 .catch(error => ...) 链式捕获                      | 在函数内部使用 try...catch，或从外部调用 generator.throw() | 在 async 函数内部使用标准的 try...catch 语句     |
| 代码可读性 | 较好，解决了回调地狱，但链式调用过多时仍显冗长。        | 较差。需要理解 yield 和 next() 的交互，逻辑分散。          | 极佳。代码结构清晰，几乎和同步代码一模一样。     |

**简单来说**：以 `async/await` 为主，`Promise` 作为其基础和并发工具，仅在特定高级场景下才考虑使用 `Generator`。

### 5.2 按顺序完成异步操作

实际开发中经常需要按顺序完成一组异步操作，比如依次远程读取一组 URL，然后按照读取的顺序输出结果。

Promise 的写法如下。

```js
function logInOrder(urls) {
  // 远程读取所有URL
  const textPromises = urls.map(url => {
    return fetch(url).then(response => response.text())
  })

  // 按次序输出
  textPromises.reduce((chain, textPromise) => {
    return chain.then(() => textPromise).then(text => console.log(text))
  }, Promise.resolve())
}
```

上面代码用`fetch`同时远程读取一组 URL，每个`fetch`操作都返回一个 Promise 对象放入`textPromises`数组，再用`reduce`依次把每个 Promise 连起来，从而依次输出结果。这种写法不太直观，可读性比较差。

下面是 async 函数的实现。

```js
async function logInOrder(urls) {
  for (const url of urls) {
    const response = await fetch(url)
    console.log(await response.text())
  }
}
```

代码确实大大简化了，问题是所有远程操作都是继发：只有前一个 URL 返回结果，才会去读取下一个 URL，效率很差。我们需要的是并发发出远程请求。

```js
async function logInOrder(urls) {
  // 并发读取远程URL
  const textPromises = urls.map(async url => {
    const response = await fetch(url)
    return response.text()
  })

  // 按次序输出
  for (const textPromise of textPromises) {
    console.log(await textPromise)
  }
}
```

上面代码中，虽然`map`的参数是`async`函数，但它是并发执行的，因为只有`async`函数内部是继发执行，外部不受影响；后面的`for..of`循环内部使用了`await`，因此实现了按顺序输出。

## 6. 顶层 await

早期的语法规定是，`await`命令只能出现在 async 函数内部，否则都会报错。

```js
// 报错
const data = await fetch('https://api.example.com')
```

从 [ES2022](https://github.com/tc39/proposal-top-level-await) 开始，允许在模块的顶层独立使用`await`命令，主要目的是解决模块异步加载的问题。下面这个模块的输出值`output`取决于异步操作：

```js
// awaiting.js
let output
async function main() {
  const dynamic = await import(someMission)
  const data = await fetch(url)
  output = someProcess(dynamic.default, data)
}
main()
export { output }
```

由于异步操作没执行完时`output`是`undefined`，用它的一方只能靠时间碰运气。

```js
// usage.js
import { output } from './awaiting.js'

function outputPlusValue(value) {
  return output + value
}

console.log(outputPlusValue(100))
setTimeout(() => console.log(outputPlusValue(100)), 1000)
```

一种解决方法是让原始模块额外默认输出一个 Promise 对象，从这个对象判断异步操作有没有结束。

```js
// awaiting.js
let output
export default (async function main() {
  const dynamic = await import(someMission)
  const data = await fetch(url)
  output = someProcess(dynamic.default, data)
})()
export { output }
```

```js
// usage.js
import promise, { output } from './awaiting.js'

function outputPlusValue(value) {
  return output + value
}

promise.then(() => {
  console.log(outputPlusValue(100))
  setTimeout(() => console.log(outputPlusValue(100)), 1000)
})
```

这种写法要求模块的使用者遵守一个额外的使用协议，按特殊的方法加载这个模块；一旦忘了用 Promise 加载，依赖它的代码就可能出错。如果这个模块还有对外输出，整条依赖链上的模块都得用 Promise 加载。

顶层的`await`命令就是为了解决这个问题，它保证只有异步操作完成，模块才会输出值。

```js
// awaiting.js
const dynamic = import(someMission)
const data = fetch(url)
export const output = someProcess((await dynamic).default, await data)
```

加载这个模块的写法与普通模块完全一样。

```js
// usage.js
import { output } from './awaiting.js'
function outputPlusValue(value) {
  return output + value
}

console.log(outputPlusValue(100))
setTimeout(() => console.log(outputPlusValue(100)), 1000)
```

也就是说，模块的使用者完全不用关心依赖模块内部有没有异步操作，正常加载即可，并且总是能拿到正确的`output`。

注意，顶层`await`只能用在 ES6 模块，不能用在 CommonJS 模块，因为 CommonJS 模块的`require()`是同步加载，有顶层`await`就没法处理加载了。

下面是顶层`await`的一些使用场景。

```js
// import() 方法加载
const strings = await import(`/i18n/${navigator.language}`)

// 数据库操作
const connection = await dbConnector()

// 依赖回滚
let jQuery
try {
  jQuery = await import('https://cdn-a.com/jQuery')
} catch {
  jQuery = await import('https://cdn-b.com/jQuery')
}
```

注意，如果加载多个包含顶层`await`命令的模块，加载命令是同步执行的。

```js
// x.js
console.log('X1')
await new Promise(r => setTimeout(r, 1000))
console.log('X2')

// y.js
console.log('Y')

// z.js
import './x.js'
import './y.js'
console.log('Z')
```

上面代码有三个模块，最后的`z.js`加载`x.js`和`y.js`，打印结果是`X1`、`Y`、`X2`、`Z`。这说明`z.js`并没有等待`x.js`加载完成，再去加载`y.js`。

顶层`await`有点像交出代码的执行权给其他模块加载，等异步操作完成后再拿回执行权，继续向下执行。

## **7. 常见问题 (FAQ)**

### 7.1 `async` 函数和 `Promise` 是什么关系？

- `async` 函数是 `Promise` 的语法糖：调用它总是返回一个 Promise，函数内部 `return` 的值会被包装成这个 Promise 的结果，内部抛出的错误会让它变为 `rejected`。
- `await` 相当于 `.then()`：`await p` 之后的代码，就是 `p.then(...)` 里的回调。区别在于 `await` 可以用 `try...catch` 处理错误，写法更接近同步代码。

### 7.2 `await` 会阻塞主线程吗？

- **不会**。`await` 只暂停**当前 `async` 函数**的执行，把后续代码封装成微任务放进队列，然后立刻把执行权交还给调用者——调用栈、其他同步代码、事件循环都不受影响（详见《事件循环》一章）。
- 真正会“卡死”主线程的是耗时的**同步**代码（比如大循环），`await` 无法把它变成异步。

### 7.3 函数里没用到 `await`，还有必要写 `async` 吗？

- 通常有必要，因为 `async` 带来两个效果：返回值自动包装成 Promise；函数内部同步抛出的错误不会直接抛出，而是变成返回 Promise 的 `rejected`。
- 后者是双刃剑：调用方如果漏了 `.catch()` 或 `try...catch`，错误就变成未处理的 rejection，反而更容易被忽略。

```js
async function f() {
  throw new Error('出错了')
}

const p = f() // 不会同步抛出，p 是一个 rejected 的 Promise
```

### 7.4 `return await p` 和 `return p` 有什么区别？

- `return await p` 会在**当前函数内**等 `p` 完成：`p` 失败时能被当前函数的 `try...catch` 捕获；代价是多一次微任务的执行时间。
- `return p` 直接把 `p` 交给调用方，本函数的 `try...catch` 捕获不到它的失败（此时 `try` 代码块已经结束），只能由调用方处理。
- 需要在本函数内兜底错误或记录日志时用 `return await`；只是为了传回结果，直接 `return` 更简洁。

```js
async function withAwait() {
  try {
    return await Promise.reject(new Error('失败'))
  } catch (e) {
    return '被当前函数捕获：' + e.message // 执行这里
  }
}

async function withoutAwait() {
  try {
    return Promise.reject(new Error('失败'))
  } catch (e) {
    return '不会执行到这里'
  }
}
// withoutAwait() 返回的是 rejected 的 Promise，错误只能由调用方处理
```

### 7.5 `async` 函数可以用 `new` 调用吗？

- **不能**。`async` 函数不是构造函数，`new (async function () {})()` 会抛出 `TypeError: ... is not a constructor`。Generator 函数同理。

### 7.6 顶层 `await` 在什么情况下不能用？

- 只能用在 **ES 模块**的顶层。CommonJS 脚本里会报 `SyntaxError: await is only valid in async functions and the top level bodies of modules`。
- 还要求运行环境支持：Node.js 需要 14.8 以上，浏览器需要较新的版本；打包时也要按 ESM 处理产物。
