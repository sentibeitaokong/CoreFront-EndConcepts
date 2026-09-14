# Iterator 和 for...of 循环

## 1. Iterator（遍历器）的概念

JavaScript 原有的表示“**集合**”的数据结构主要是数组（`Array`）和对象（`Object`），ES6 又添加了`Map`和`Set`。它们可以组合使用，定义出自己的数据结构（比如数组的成员是`Map`，`Map`的成员是对象），因此需要一种统一的接口机制来处理。

遍历器（Iterator）就是这样一种接口：任何数据结构只要部署它，就可以完成遍历操作（即依次处理该数据结构的所有成员）。它的**作用**有三个：为各种数据结构提供统一、简便的访问接口；使成员能够按某种次序排列；供 ES6 新增的`for...of`循环消费。

Iterator 的遍历过程是这样的：先创建一个指针对象指向数据结构的起始位置，再不断调用它的`next`方法，指针依次指向第一个、第二个成员，直到指向结束位置。每次调用`next`都返回一个包含`value`和`done`的对象：`value`是当前成员的值，`done`是布尔值，表示遍历是否结束。

下面是一个模拟`next`方法返回值的例子。

```js
var it = makeIterator(['a', 'b'])

it.next() // { value: "a", done: false }
it.next() // { value: "b", done: false }
it.next() // { value: undefined, done: true }

function makeIterator(array) {
  var nextIndex = 0
  return {
    next: function () {
      return nextIndex < array.length
        ? { value: array[nextIndex++], done: false }
        : { value: undefined, done: true }
    },
  }
}
```

`makeIterator`是一个遍历器生成函数，返回的遍历器对象（即指针对象）通过`next`方法移动指针，反复调用就能遍历事先给定的数据结构。

`next`返回值中的`done: false`和`value: undefined`都可以省略，因此上面的`makeIterator`可以简写成下面的形式。

```js
function makeIterator(array) {
  var nextIndex = 0
  return {
    next: function () {
      return nextIndex < array.length
        ? { value: array[nextIndex++] }
        : { done: true }
    },
  }
}
```

由于 Iterator 只是把接口规格加到数据结构之上，遍历器与它遍历的数据结构实际上是分开的，因此可以写出没有对应数据结构的遍历器对象。下面是一个无限运行的例子。

```js
var it = idMaker()

it.next().value // 0
it.next().value // 1
it.next().value // 2
// ...

function idMaker() {
  var index = 0

  return {
    next: function () {
      return { value: index++, done: false }
    },
  }
}
```

上面的例子中，`idMaker`返回的遍历器对象没有对应的数据结构，或者说，它自己描述了一个数据结构出来。

如果使用 TypeScript 的写法，遍历器接口（Iterable）、指针对象（Iterator）和`next`方法返回值的规格可以描述如下。

```js
interface Iterable {
  [Symbol.iterator]() : Iterator,
}

interface Iterator {
  next(value?: any) : IterationResult,
}

interface IterationResult {
  value: any,
  done: boolean,
}
```

### 1.1 默认 Iterator 接口

Iterator 接口的目的，就是为所有数据结构提供一种统一的访问机制，即`for...of`循环（详见下文）；用`for...of`遍历时，该循环会自动去寻找 Iterator 接口。

ES6 规定，默认的 Iterator 接口部署在数据结构的`Symbol.iterator`属性上；一种数据结构只要具有这个属性，我们就称它是“**可遍历的**”（iterable）。该属性本身是一个函数，即当前数据结构默认的遍历器生成函数，执行它就会返回一个遍历器。属性名`Symbol.iterator`是一个表达式，返回`Symbol`对象的`iterator`属性。

```js
const obj = {
  [Symbol.iterator]: function () {
    return {
      next: function () {
        return {
          value: 1,
          done: true,
        }
      },
    }
  },
}
```

上面代码中，对象`obj`因为具有`Symbol.iterator`属性，所以是可遍历的（iterable）；执行这个属性会返回一个遍历器对象。

ES6 的有些数据结构原生具备 Iterator 接口（比如数组），不用任何处理就可以被`for...of`循环遍历，原因在于它们原生部署了`Symbol.iterator`属性；另外一些（比如对象）则没有部署。原生具备 Iterator 接口的数据结构如下。

[width(35,32,33)]

| 数据结构              | `next()` 依次返回   | 顺序                 |
| :-------------------- | :------------------ | :------------------- |
| `Array`、`TypedArray` | 各成员的值          | 索引升序             |
| `String`              | 每个字符            | 按码点，不拆开代理对 |
| `Map`                 | `[key, value]` 数组 | 插入顺序             |
| `Set`                 | 各成员的值          | 插入顺序             |
| 函数的`arguments`对象 | 各参数              | 参数顺序             |
| `NodeList`对象        | 各个节点            | 文档顺序             |

下面的例子是数组的`Symbol.iterator`属性。

```js
let arr = ['a', 'b', 'c']
let iter = arr[Symbol.iterator]()

iter.next() // { value: 'a', done: false }
iter.next() // { value: 'b', done: false }
iter.next() // { value: 'c', done: false }
iter.next() // { value: undefined, done: true }
```

原生部署了 Iterator 接口的数据结构不用自己写遍历器生成函数，`for...of`循环会自动遍历；其他数据结构（主要是对象）必须在`Symbol.iterator`属性上部署遍历器生成方法，才会被`for...of`循环遍历（部署在原型链上也可以）。

对象（Object）之所以没有默认部署 Iterator 接口，是因为哪个属性先遍历、哪个属性后遍历不确定，需要开发者手动指定。本质上，遍历器是一种线性处理，对于任何非线性的数据结构，部署遍历器接口，就等于部署一种线性转换。不过严格地说，对象部署遍历器接口并不是很必要，因为这时对象实际上被当作 Map 结构使用，而 ES6 原生提供了 Map。

```js
class RangeIterator {
  constructor(start, stop) {
    this.value = start
    this.stop = stop
  }

  [Symbol.iterator]() {
    return this
  }

  next() {
    var value = this.value
    if (value < this.stop) {
      this.value++
      return { done: false, value: value }
    }
    return { done: true, value: undefined }
  }
}

function range(start, stop) {
  return new RangeIterator(start, stop)
}

for (var value of range(0, 3)) {
  console.log(value) // 0, 1, 2
}
```

下面是通过遍历器实现“**链表**”结构的例子。

```js
function Obj(value) {
  this.value = value
  this.next = null
}

Obj.prototype[Symbol.iterator] = function () {
  var iterator = { next: next }

  var current = this

  function next() {
    if (current) {
      var value = current.value
      current = current.next
      return { done: false, value: value }
    }
    return { done: true }
  }
  return iterator
}

var one = new Obj(1)
var two = new Obj(2)
var three = new Obj(3)

one.next = two
two.next = three

for (var i of one) {
  console.log(i) // 1, 2, 3
}
```

上面代码在构造函数的原型链上部署`Symbol.iterator`方法，其`next`方法在返回一个值的同时，自动将内部指针移到下一个实例。

下面是另一个为对象添加 Iterator 接口的例子。

```js
let obj = {
  data: ['hello', 'world'],
  [Symbol.iterator]() {
    const self = this
    let index = 0
    return {
      next() {
        if (index < self.data.length) {
          return {
            value: self.data[index++],
            done: false,
          }
        }
        return { value: undefined, done: true }
      },
    }
  },
}
```

类似数组的对象（存在数值键名和`length`属性）部署 Iterator 接口有一个简便方法：`Symbol.iterator`直接引用数组的 Iterator 接口。

```js
NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]
// 或者
NodeList.prototype[Symbol.iterator] = [][Symbol.iterator]
;[...document.querySelectorAll('div')] // 可以执行了
```

NodeList 对象本身就具有遍历接口，改成数组的`Symbol.iterator`属性也没有任何影响。

下面是另一个类似数组的对象调用数组`Symbol.iterator`方法的例子。

```js
let iterable = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3,
  [Symbol.iterator]: Array.prototype[Symbol.iterator],
}
for (let item of iterable) {
  console.log(item) // 'a', 'b', 'c'
}
```

注意，普通对象部署数组的`Symbol.iterator`方法，并无效果。

```js
let iterable = {
  a: 'a',
  b: 'b',
  c: 'c',
  length: 3,
  [Symbol.iterator]: Array.prototype[Symbol.iterator],
}
for (let item of iterable) {
  console.log(item) // undefined, undefined, undefined
}
```

如果`Symbol.iterator`对应的不是遍历器生成函数（即会返回一个遍历器对象），解释引擎将会报错。

```js
var obj = {}

obj[Symbol.iterator] = () => 1
;[...obj] // TypeError: Result of the Symbol.iterator method is not an object
```

有了遍历器接口，数据结构就可以用`for...of`循环遍历（详见下文），也可以使用`while`循环遍历。

```js
var $iterator = ITERABLE[Symbol.iterator]()
var $result = $iterator.next()
while (!$result.done) {
  var x = $result.value
  // ...
  $result = $iterator.next()
}
```

上面代码中，`ITERABLE`代表某种可遍历的数据结构，`$iterator`是它的遍历器对象。

### 1.2 调用 Iterator 接口的场合

除了下文会介绍的`for...of`循环，还有一些场合会默认调用 Iterator 接口（即`Symbol.iterator`方法）。

**（1）解构赋值**

对数组和 Set 结构进行解构赋值时，会默认调用`Symbol.iterator`方法。

```js
let set = new Set().add('a').add('b').add('c')

let [x, y] = set
// x='a'; y='b'

let [first, ...rest] = set
// first='a'; rest=['b','c'];
```

**（2）扩展运算符**

扩展运算符（...）也会调用默认的 Iterator 接口。

```js
// 例一
var str = 'hello'
;[...str] //  ['h','e','l','l','o']

// 例二
let arr = ['b', 'c']
;['a', ...arr, 'd']
// ['a', 'b', 'c', 'd']
```

扩展运算符内部调用的就是 Iterator 接口，这提供了一种简便机制：任何部署了 Iterator 接口的数据结构，都可以用扩展运算符转为数组。

```js
let arr = [...iterable]
```

**（3）yield\***

`yield*`后面跟的是一个可遍历的结构，它会调用该结构的遍历器接口。

```js
let generator = function* () {
  yield 1
  yield* [2, 3, 4]
  yield 5
}

var iterator = generator()

iterator.next() // { value: 1, done: false }
iterator.next() // { value: 2, done: false }
iterator.next() // { value: 3, done: false }
iterator.next() // { value: 4, done: false }
iterator.next() // { value: 5, done: false }
iterator.next() // { value: undefined, done: true }
```

**（4）其他场合**

下面这些接受数组（或其他可遍历对象）作为参数的场合，同样会调用遍历器接口。

[width(51,49)]

| 场合                                       | 示例                                     |
| :----------------------------------------- | :--------------------------------------- |
| `for...of`循环                             | `for (const v of set)`                   |
| `Array.from()`                             | `Array.from(new Set([1, 2]))` → `[1, 2]` |
| `Map()`、`Set()`、`WeakMap()`、`WeakSet()` | `new Map([['a', 1], ['b', 2]])`          |
| `Promise.all()`、`Promise.race()`          | `Promise.all(new Set([p1, p2]))`         |

## 2. 字符串的 Iterator 接口

字符串是一个类似数组的对象，也原生具有 Iterator 接口。

```js
var someString = 'hi'
typeof someString[Symbol.iterator]
// "function"

var iterator = someString[Symbol.iterator]()

iterator.next() // { value: "h", done: false }
iterator.next() // { value: "i", done: false }
iterator.next() // { value: undefined, done: true }
```

上面代码中，`Symbol.iterator`方法返回的遍历器对象上可以调用`next`方法，实现对字符串的遍历。

可以覆盖原生的`Symbol.iterator`方法，达到修改遍历器行为的目的。

```js
var str = new String('hi')

;[...str] // ["h", "i"]

str[Symbol.iterator] = function () {
  return {
    next: function () {
      if (this._first) {
        this._first = false
        return { value: 'bye', done: false }
      } else {
        return { done: true }
      }
    },
    _first: true,
  }
}
;[...str] // ["bye"]
str // "hi"
```

上面代码中，`str`的`Symbol.iterator`方法被修改后，扩展运算符（`...`）返回的值变成了`bye`，而字符串本身还是`hi`。

## 3. Iterator 接口与 Generator 函数

`Symbol.iterator()`方法最简单的实现方式，是使用 Generator 函数。

```js
let myIterable = {
  [Symbol.iterator]: function* () {
    yield 1
    yield 2
    yield 3
  },
}
;[...myIterable] // [1, 2, 3]

// 或者采用下面的简洁写法

let obj = {
  *[Symbol.iterator]() {
    yield 'hello'
    yield 'world'
  },
}

for (let x of obj) {
  console.log(x)
}
// "hello"
// "world"
```

上面代码中，`Symbol.iterator()`方法几乎不用部署任何代码，只要用`yield`命令给出每一步的返回值即可。

## 4. 遍历器对象的 return()，throw()

遍历器对象除了具有`next()`方法，还可以具有`return()`方法和`throw()`方法；自己写遍历器对象生成函数时，`next()`方法是必须部署的，`return()`和`throw()`是否部署可选。

`return()`方法的使用场合是，如果`for...of`循环提前退出（通常是因为出错，或者有`break`语句），就会调用它；如果一个对象在完成遍历前需要清理或释放资源，就可以部署它。

```js
function readLinesSync(file) {
  return {
    [Symbol.iterator]() {
      return {
        next() {
          return { done: false }
        },
        return() {
          file.close()
          return { done: true }
        },
      }
    },
  }
}
```

`readLinesSync`返回的遍历器对象除了`next()`方法，还部署了`return()`方法；下面两种情况都会触发它。

```js
// 情况一
for (let line of readLinesSync(fileName)) {
  console.log(line)
  break
}

// 情况二
for (let line of readLinesSync(fileName)) {
  console.log(line)
  throw new Error()
}
```

情况一输出文件第一行后就会执行`return()`方法关闭文件；情况二会在关闭文件之后再抛出错误。

注意，`return()`方法必须返回一个对象，这是 Generator 语法决定的。

`throw()`方法主要是配合 Generator 函数使用，一般的遍历器对象用不到。

## 5. for...of 循环

ES6 借鉴 C++、Java、C# 和 Python，引入了`for...of`循环，作为遍历所有数据结构的统一方法。

一个数据结构只要部署了`Symbol.iterator`属性，就可以用`for...of`循环遍历它的成员——`for...of`循环内部调用的就是数据结构的`Symbol.iterator`方法。

`for...of`循环可以使用的范围包括数组、Set 和 Map 结构、某些类似数组的对象（比如`arguments`对象、DOM NodeList 对象）、Generator 对象，以及字符串。

### 5.1 数组

数组原生具备 Iterator 接口（即默认部署了`Symbol.iterator`属性），`for...of`循环本质上就是调用这个接口产生的遍历器，下面的代码可以证明。

```js
const arr = ['red', 'green', 'blue']

for (let v of arr) {
  console.log(v) // red green blue
}

const obj = {}
obj[Symbol.iterator] = arr[Symbol.iterator].bind(arr)

for (let v of obj) {
  console.log(v) // red green blue
}
```

上面代码中，空对象`obj`借用了数组`arr`的`Symbol.iterator`，它的`for...of`循环产生了与`arr`完全一样的结果。

`for...of`循环可以代替数组实例的`forEach`方法。

```js
const arr = ['red', 'green', 'blue']

arr.forEach(function (element, index) {
  console.log(element) // red green blue
  console.log(index) // 0 1 2
})
```

JavaScript 原有的`for...in`循环只能获得键名，不能直接获取键值；`for...of`循环则允许遍历获得键值。

```js
var arr = ['a', 'b', 'c', 'd']

for (let a in arr) {
  console.log(a) // 0 1 2 3
}

for (let a of arr) {
  console.log(a) // a b c d
}
```

可见，`for...in`循环读取键名，`for...of`循环读取键值；要通过`for...of`循环获取数组的索引，可以借助数组实例的`entries`方法和`keys`方法。

`for...of`循环调用遍历器接口，数组的遍历器接口只返回具有数字索引的属性，这一点跟`for...in`循环也不一样。

```js
let arr = [3, 5, 7]
arr.foo = 'hello'

for (let i in arr) {
  console.log(i) // "0", "1", "2", "foo"
}

for (let i of arr) {
  console.log(i) //  "3", "5", "7"
}
```

### 5.2 Set 和 Map 结构

Set 和 Map 结构也原生具有 Iterator 接口，可以直接使用`for...of`循环。

```js
var engines = new Set(['Gecko', 'Trident', 'Webkit', 'Webkit'])
for (var e of engines) {
  console.log(e)
}
// Gecko
// Trident
// Webkit

var es6 = new Map()
es6.set('edition', 6)
es6.set('committee', 'TC39')
es6.set('standard', 'ECMA-262')
for (var [name, value] of es6) {
  console.log(name + ': ' + value)
}
// edition: 6
// committee: TC39
// standard: ECMA-262
```

上面代码演示了如何遍历 Set 结构和 Map 结构，有两点值得注意：遍历的顺序就是各个成员被添加进数据结构的顺序；Set 结构遍历时返回的是一个值，而 Map 结构遍历时返回的是一个数组，两个成员分别为键名和键值。

```js
let map = new Map().set('a', 1).set('b', 2)
for (let pair of map) {
  console.log(pair)
}
// ['a', 1]
// ['b', 2]

for (let [key, value] of map) {
  console.log(key + ' : ' + value)
}
// a : 1
// b : 2
```

**计算生成的数据结构**

有些数据结构是在现有数据结构的基础上计算生成的，比如 ES6 的数组、Set、Map 都部署了以下三个方法，调用后返回遍历器对象。

- `entries()` 返回一个遍历器对象，用来遍历`[键名, 键值]`组成的数组。对于数组，键名就是索引值；对于 Set，键名与键值相同。Map 结构的 Iterator 接口，默认就是调用`entries`方法。
- `keys()` 返回一个遍历器对象，用来遍历所有的键名。
- `values()` 返回一个遍历器对象，用来遍历所有的键值。

这三个方法返回的遍历器对象，遍历的都是计算生成的数据结构。

```js
let arr = ['a', 'b', 'c']
for (let pair of arr.entries()) {
  console.log(pair)
}
// [0, 'a']
// [1, 'b']
// [2, 'c']
```

### 5.3 类似数组的对象

类似数组的对象有好几类，下面是`for...of`循环用于字符串、DOM NodeList 对象、`arguments`对象的例子。

```js
// 字符串
let str = 'hello'

for (let s of str) {
  console.log(s) // h e l l o
}

// DOM NodeList对象
let paras = document.querySelectorAll('p')

for (let p of paras) {
  p.classList.add('test')
}

// arguments对象
function printArgs() {
  for (let x of arguments) {
    console.log(x)
  }
}
printArgs('a', 'b')
// 'a'
// 'b'
```

`for...of`循环遍历字符串还有一个特点：会正确识别 32 位 UTF-16 字符。

```js
for (let x of 'a\uD83D\uDC0A') {
  console.log(x)
}
// 'a'
// '\uD83D\uDC0A'
```

并不是所有类似数组的对象都具有 Iterator 接口，一个简便的解决方法是用`Array.from`方法将其转为数组。

```js
let arrayLike = { length: 2, 0: 'a', 1: 'b' }

// 报错
for (let x of arrayLike) {
  console.log(x)
}

// 正确
for (let x of Array.from(arrayLike)) {
  console.log(x)
}
```

### 5.4 对象

普通的对象不能直接使用`for...of`结构，会报错，必须部署 Iterator 接口后才能使用；这种情况下，`for...in`循环依然可以用来遍历键名。

```js
let es6 = {
  edition: 6,
  committee: 'TC39',
  standard: 'ECMA-262',
}

for (let e in es6) {
  console.log(e)
}
// edition
// committee
// standard

for (let e of es6) {
  console.log(e)
}
// TypeError: es6 is not iterable
```

可见，普通对象的`for...in`循环可以遍历键名，`for...of`循环会报错。一种解决方法是用`Object.keys`方法将对象的键名生成一个数组，然后遍历它。

```js
for (var key of Object.keys(someObject)) {
  console.log(key + ': ' + someObject[key])
}
```

另一个方法是使用 Generator 函数将对象重新包装一下。

```js
const obj = { a: 1, b: 2, c: 3 }

function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]]
  }
}

for (let [key, value] of entries(obj)) {
  console.log(key, '->', value)
}
// a -> 1
// b -> 2
// c -> 3
```

### 5.5 与其他遍历语法的比较

以数组为例，JavaScript 提供了多种遍历语法，最原始的写法是`for`循环。

```js
for (var index = 0; index < myArray.length; index++) {
  console.log(myArray[index])
}
```

这种写法比较麻烦，因此数组提供内置的`forEach`方法。

```js
myArray.forEach(function (value) {
  console.log(value)
})
```

`for...in`循环可以遍历数组的键名。

```js
for (var index in myArray) {
  console.log(myArray[index])
}
```

`for...of`循环相比上面几种做法，有几点显著的优点。

```js
for (let value of myArray) {
  console.log(value)
}
```

[width(12,12,11,15,50)]

| 遍历语法    | 遍历内容       | 能否中断循环 | 适用对象                           | 说明                                                                                                                                |
| :---------- | :------------- | :----------- | :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `for`循环   | 索引（数字）   | 可以         | 数组、类数组、字符串               | 需要自己管理索引和循环边界，写法繁琐                                                                                                |
| `forEach()` | 成员值         | 不可以       | 数组                               | 写法简洁，但是`break`、`return`都不能奏效，无法中途退出                                                                             |
| `for...in`  | 键名（字符串） | 可以         | 普通对象，不适用于数组             | 数组的键名是数字，它却以字符串“0”、“1”、“2”作为键名；还会遍历手动添加的其他键，甚至包括原型链上的键；某些情况下顺序是任意的         |
| `for...of`  | 成员值         | 可以         | 所有实现了 Iterator 接口的数据结构 | 有着同`for...in`一样的简洁语法，但是没有上述缺点；可以与`break`、`continue`和`return`配合使用；提供了遍历所有数据结构的统一操作接口 |

## 6. 遍历器对象的工具方法

ES2025 为遍历器对象（`Iterator.prototype`）添加了一些工具方法，便于处理数据。

```js
const arr = ['a', '', 'b', '', 'c', '', 'd', '', 'e']

arr
  .values() // creates an iterator
  .filter(x => x.length > 0)
  .drop(1)
  .take(3)
  .map(x => `=${x}=`)
  .toArray()
// ['=b=', '=c=', '=d=']
```

上面示例中，`arr.values()`返回一个遍历器对象，以前要用`for...of`循环处理，现在有了工具方法，可以直接链式调用。

遍历器对象的工具方法，基本上与数组方法是对应的。

[width(36,25,39)]

| 遍历器方法                   | 返回值              | 数组上的对应方法                |
| :--------------------------- | :------------------ | :------------------------------ |
| `iterator.filter(fn)`        | 遍历器对象          | `filter()`                      |
| `iterator.map(fn)`           | 遍历器对象          | `map()`                         |
| `iterator.flatMap(fn)`       | 遍历器对象          | `flatMap()`                     |
| `iterator.drop(limit)`       | 遍历器对象          | 无，近似惰性的`slice(limit)`    |
| `iterator.take(limit)`       | 遍历器对象          | 无，近似惰性的`slice(0, limit)` |
| `iterator.some(fn)`          | 布尔值              | `some()`                        |
| `iterator.every(fn)`         | 布尔值              | `every()`                       |
| `iterator.find(fn)`          | 成员值或`undefined` | `find()`                        |
| `iterator.reduce(fn, init?)` | 累积结果            | `reduce()`                      |
| `iterator.forEach(fn)`       | `undefined`         | `forEach()`                     |
| `iterator.toArray()`         | 数组                | 无（数组不需要转换）            |

注意，`drop`、`take`是惰性的：它们返回的仍是遍历器对象，只有在消费（比如`toArray()`）时才真正取值，因此可以用在无限遍历器上。

## **7. 常见问题 (FAQ)**

### 7.1 “可遍历对象（Iterable）”和“遍历器对象（Iterator）”有什么区别？

- **可遍历对象**是部署了`Symbol.iterator`方法的对象（数组、字符串、Set、Map 等），这个属性是一个**方法**。
- **遍历器对象**是调用该方法的**返回值**，它必须有`next()`方法，`next()`返回`{ value, done }`。
- 所以数组本身不是遍历器（它没有`next()`方法），`arr[Symbol.iterator]()`返回的才是。

```js
const arr = [1, 2]
typeof arr[Symbol.iterator] // 'function' —— arr 是可遍历对象
typeof arr.next // 'undefined' —— arr 本身不是遍历器
const it = arr[Symbol.iterator]() // 这才是遍历器对象
typeof it.next // 'function'
```

### 7.2 `for...of` 和 `for...in` 应该怎么选？

- `for...of`遍历**成员的值**，走 Iterator 接口，适用于数组、字符串、Set、Map 等可遍历对象，不能直接用于普通对象。
- `for...in`遍历**键名**（都是字符串），会枚举可枚举属性，**包括原型链上的**，主要用于普通对象。
- 遍历数组优先用`for...of`：`for...in`会把索引当字符串处理，还可能把原型上扩展的属性一起带出来。

### 7.3 遍历器能“重来”吗？遍历到一半怎么退出？

- **不能重来**。遍历器是一次性的，一旦`done`为`true`，再调用`next()`只会返回`{ value: undefined, done: true }`；要重新遍历必须重新获取一个遍历器。
- 提前退出用`break`、`return`或`throw`都可以。如果遍历器实现了`return()`方法，`for...of`在提前退出时会自动调用它，适合在里面做资源清理。

```js
const it = {
  i: 0,
  next() {
    return this.i < 3
      ? { value: this.i++, done: false }
      : { value: undefined, done: true }
  },
  return() {
    console.log('提前退出，清理资源') // break 时自动调用
    return { value: undefined, done: true }
  },
  [Symbol.iterator]() {
    return this
  },
}

for (const x of it) {
  if (x === 1) break
}
```

### 7.4 遍历过程中修改原集合会怎样？

- 不同数据结构行为不同，但都不建议边遍历边改：
  - **数组**：`for...of`按下标推进，遍历中`push`进来的成员**也会被遍历到**（不设条件就是死循环），而`splice`删除成员会导致某些成员**被跳过**。
  - **Set / Map**：迭代器是“**活**”的，遍历中新增的成员**会被访问到**，删除尚未访问的成员则**不会被访问**。
- 需要增删时，先用`[...arr]`复制一份再遍历。

### 7.5 手写一个遍历器要注意什么？

- `next()`必须返回**对象**，且有`value`和`done`两个属性（`done`为`true`时`value`可以省略）。
- `done`为`true`之后，应保持返回`{ value: undefined, done: true }`。
- 遍历器对象自身最好也部署`Symbol.iterator`并返回`this`，这样它才能被`for...of`、扩展运算符等消费——Generator 函数返回的遍历器就是这么做的（见《Generator 函数的语法》）。
- 需要支持提前退出时的清理，就实现`return()`方法。
