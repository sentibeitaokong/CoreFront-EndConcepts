# 数组的扩展

## 1. 扩展运算符

### 1.1 含义

扩展运算符（spread）是三个点（`...`），好比 rest 参数的逆运算，将一个数组转为用逗号分隔的参数序列，主要用于函数调用。

```js
console.log(...[1, 2, 3]) // 1 2 3
console.log(1, ...[2, 3, 4], 5) // 1 2 3 4 5

function add(x, y) {
  return x + y
}
const numbers = [4, 38]
add(...numbers) // 42
```

扩展运算符可与普通参数结合，后面还可放置表达式（空数组不产生效果）：

```js
function f(v, w, x, y, z) {}
const args = [0, 1]
f(-1, ...args, 2, ...[3])

const arr = [...(x > 0 ? ['a'] : []), 'b']
;[...[], 1] // [1]
```

> 只有函数调用时，扩展运算符才能放在圆括号中，否则报 `SyntaxError`。

### 1.2 替代函数的 apply() 方法

扩展运算符可直接展开数组作为函数参数，不再需要 `apply()`：

```js
// ES5
Math.max.apply(null, [14, 3, 77])
// ES6
Math.max(...[14, 3, 77]) // 77

// ES5：把数组追加到另一数组尾部
Array.prototype.push.apply(arr1, arr2)
// ES6
arr1.push(...arr2)

// ES5
new (Date.bind.apply(Date, [null, 2015, 1, 1]))()
// ES6
new Date(...[2015, 1, 1])
```

### 1.3 扩展运算符的应用

**（1）复制数组**：数组是复合类型，直接赋值只复制指针；扩展运算符可克隆数组（浅拷贝）。

```js
const a1 = [1, 2]
const a2 = [...a1] // 或 const [...a2] = a1
a2[0] = 2
a1 // [1, 2]
```

**（2）合并数组**（浅拷贝）：

```js
const arr1 = ['a', 'b']
const arr2 = ['c']
const arr3 = ['d', 'e']
;[...arr1, ...arr2, ...arr3] // ['a', 'b', 'c', 'd', 'e']
```

**（3）与解构赋值结合**：只能放在最后一位。

```js
const [first, ...rest] = [1, 2, 3, 4, 5]
first // 1
rest // [2, 3, 4, 5]
```

**（4）字符串**：转为真数组，并能正确识别 4 字节 Unicode 字符。

```js
;[...'hello'] // ["h", "e", "l", "l", "o"]

'x🚀y'.length // 4
;[...'x🚀y'].length // 3
;[...'x🚀y'].reverse().join('') // 'y🚀x'（正确反转）
```

**（5）实现了 Iterator 接口的对象**：任何部署了 Iterator 的对象都可用扩展运算符转为数组（如 `NodeList`、自定义迭代器）。未部署 Iterator 的类数组对象会报错，应改用 `Array.from`。

```js
let nodeList = document.querySelectorAll('div')
let array = [...nodeList]

let arrayLike = { 0: 'a', 1: 'b', length: 2 }
;[...arrayLike] // TypeError: Cannot spread non-iterable object
```

**（6）Map 和 Set 结构，Generator 函数**：扩展运算符内部调用 Iterator 接口，因此都可用：

```js
let map = new Map([
  [1, 'one'],
  [2, 'two'],
])
;[...map.keys()] // [1, 2]

const go = function* () {
  yield 1
  yield 2
  yield 3
}
;[...go()] // [1, 2, 3]
```

## 2.数组的静态方法

### Array.from()

`Array.from()` 将两类对象转为真数组：**类数组对象**（有 `length` 属性）和**可遍历对象**（Set、Map、字符串等）。

```js
let arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 }
Array.from(arrayLike) // ['a', 'b', 'c']

// 常见：NodeList 与 arguments
Array.from(document.querySelectorAll('p'))
function foo() {
  var args = Array.from(arguments)
}
```

与扩展运算符的区别：扩展运算符依赖 `Symbol.iterator`；`Array.from` 支持任何有 `length` 属性的类数组对象：

```js
Array.from({ length: 3 }) // [undefined, undefined, undefined]
```

`Array.from()` 可接受第二个参数（类似 `map`），第三个参数绑定 `this`：

```js
Array.from([1, 2, 3], x => x * x) // [1, 4, 9]
Array.from([1, , 2, , 3], n => n || 0) // [1, 0, 2, 0, 3]
Array.from({ length: 2 }, () => 'jack') // ['jack', 'jack']
```

应用：正确统计含 Unicode 字符的字符串长度：

```js
function countSymbols(string) {
  return Array.from(string).length
}
```

### Array.of()

`Array.of()` 将一组值转为数组，弥补 `Array()` 因参数个数不同导致的行为差异：

```js
Array.of(3, 11, 8) // [3, 11, 8]
Array.of(3) // [3]（单个参数也作为元素）
Array.of() // []
```

对比 `Array()`：`Array(3)` 创建长度为 3 的空数组，`Array(3, 11, 8)` 才是 `[3, 11, 8]`。`Array.of()` 行为统一，可替代 `Array()`/`new Array()`。

## 3.数组的原型方法

### copyWithin()

在当前数组内部将指定位置的成员复制到其他位置（覆盖），**修改当前数组**并返回它。

```js
Array.prototype.copyWithin(target, (start = 0), (end = this.length))
```

- `target`：开始替换的位置（负值倒数）。
- `start`/`end`：读取范围，可负值。

```js
;[1, 2, 3, 4, 5].copyWithin(0, 3) // [4, 5, 3, 4, 5]
;[1, 2, 3, 4, 5].copyWithin(0, -2, -1) // [4, 2, 3, 4, 5]
```

### find()，findIndex()，findLast()，findLastIndex()

`find()` 返回第一个符合条件的成员（否则 `undefined`），`findIndex()` 返回其位置（否则 `-1`）。回调参数为 `(value, index, arr)`，可传第二个参数绑定 `this`。

```js
;[1, 4, -5, 10].find(n => n < 0) // -5
;[1, 5, 10, 15].findIndex(v => v > 9) // 2
```

它们可发现 `NaN`（弥补 `indexOf` 的不足）：

```js
;[NaN].indexOf(NaN) // -1
;[NaN].findIndex(y => Object.is(NaN, y)) // 0
```

ES2022 新增 `findLast()`/`findLastIndex()`，从数组末尾向前查找：

```js
const array = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]
array.findLast(n => n.value % 2 === 1) // { value: 3 }
array.findLastIndex(n => n.value % 2 === 1) // 2
```

### fill()

用给定值填充数组，便于空数组初始化：

```js
new Array(3).fill(7) // [7, 7, 7]
```

`fill`方法还可以接受第二个和第三个参数，用于指定填充的起始位置和结束位置。

```javascript
;['a', 'b', 'c'].fill(7, 1, 2)
// ['a', 7, 'c']
```

注意，如果填充的类型为对象，那么被赋值的是同一个内存地址的对象，而不是深拷贝对象。

```javascript
let arr = new Array(3).fill({ name: 'Mike' })
arr[0].name = 'Ben'
arr
// [{name: "Ben"}, {name: "Ben"}, {name: "Ben"}]

let arr = new Array(3).fill([])
arr[0].push(5)
arr
// [[5], [5], [5]]
```

### entries()，keys() 和 values()

返回遍历器对象，可用 `for...of` 遍历：`keys()` 遍历键名、`values()` 遍历键值、`entries()` 遍历键值对。

```js
for (let index of ['a', 'b'].keys()) {
  console.log(index)
}
// 0
// 1

for (let elem of ['a', 'b'].values()) {
  console.log(elem)
}
// 'a'
// 'b'

for (let [index, elem] of ['a', 'b'].entries()) {
  console.log(index, elem)
}
// 0 "a"
// 1 "b"
```

### includes()

返回布尔值，判断数组是否包含给定值。

```js
;[1, 2, 3].includes(2) // true
;[1, 2, NaN].includes(NaN) // true
;[NaN].indexOf(NaN) // -1
```

该方法的第二个参数表示搜索的起始位置，默认为`0`。如果第二个参数为负数，则表示倒数的位置，如果这时它大于数组长度（比如第二个参数为`-4`，但数组长度为`3`），则会重置为从0开始。

```javascript
;[1, 2, 3].includes(3, 3) // false
;[1, 2, 3].includes(3, -1) // true
```

注意区分 Map/Set 的 `has`：Map 的 `has` 查**键名**，Set 的 `has` 查**值**。

### flat()，flatMap()

`flat()` 将嵌套数组"**拉平**"，默认一层，返回新数组：

```js
;[1, 2, [3, 4]].flat() // [1, 2, 3, 4]
;[1, 2, [3, [4, 5]]].flat(2) //拉平两层 [1, 2, 3, 4, 5]
;[1, [2, [3]]].flat(Infinity) // [1, 2, 3]
```

如果原数组有空位，`flat()`方法会跳过空位。

```javascript
;[1, 2, , 4, 5].flat()
// [1, 2, 4, 5]
```

`flatMap()` 对每个成员执行映射函数，再对结果执行一层 `flat()`：

```js
// 相当于 [[2, 4], [3, 6], [4, 8]].flat()
;[2, 3, 4].flatMap(x => [x, x * 2])
// [2, 4, 3, 6, 4, 8]
```

`flatMap()` 只能展开一层

```javascript
// 相当于 [[[2]], [[4]], [[6]], [[8]]].flat()
;[1, 2, 3, 4].flatMap(x => [[x * 2]])
// [[2], [4], [6], [8]]
```

`flatMap()`方法的参数是一个遍历函数，该函数可以接受三个参数，分别是当前数组成员、当前数组成员的位置（从零开始）、原数组。

```javascript
arr.flatMap(function callback(currentValue[, index[, array]]) {
  // ...
}[, thisArg])
```

`flatMap()`方法还可以有第二个参数，用来绑定遍历函数里面的`this`。

### at()

ES2022 引入，接受整数参数返回对应位置成员，支持负索引（`arr[-1]` 语法不可用，因为 `[]` 也用于对象键名）：

```js
const arr = [5, 12, 8, 130, 44]
arr.at(2) // 8
arr.at(-2) // 130
```

超出范围返回 `undefined`。同样可用于字符串和 TypedArray。

```javascript
const sentence = 'This is a sample sentence'

sentence.at(0) // 'T'
sentence.at(-1) // 'e'

sentence.at(-100) // undefined
sentence.at(100) // undefined
```

### toReversed()，toSorted()，toSpliced()，with()

ES2023 引入，操作时不改变原数组，返回拷贝：

[width(50,32,18)]

| 新方法                                    | 对应原有方法              | 作用         |
| :---------------------------------------- | :------------------------ | :----------- |
| `toReversed()`                            | `reverse()`               | 颠倒顺序     |
| `toSorted(compareFn)`                     | `sort()`                  | 排序         |
| `toSpliced(start, deleteCount, ...items)` | `splice()`                | 删除并插入   |
| `with(index, value)`                      | `splice(index, 1, value)` | 替换指定位置 |

```js
const sequence = [1, 2, 3]
sequence.toReversed() // [3, 2, 1]
sequence // [1, 2, 3]

const outOfOrder = [3, 1, 2]
outOfOrder.toSorted() // [1, 2, 3]
outOfOrder // [3, 1, 2]

const array = [1, 2, 3, 4]
array.toSpliced(1, 2, 5, 6, 7) // [1, 5, 6, 7, 4]
array // [1, 2, 3, 4]

const correctionNeeded = [1, 1, 3]
correctionNeeded.with(1, 2) // [1, 2, 3]
correctionNeeded // [1, 1, 3]
```

### group()，groupToMap()

按分组函数的运行结果对数组成员分组。`group()` 返回**对象**（组名须为字符串），`groupToMap()` 返回 **Map**（组名可为任意值）：

```js
const array = [1, 2, 3, 4, 5]
array.group(num => (num % 2 === 0 ? 'even' : 'odd'))
// { odd: [1, 3, 5], even: [2, 4] }

const odd = { odd: true }
const even = { even: true }
array.groupToMap(num => (num % 2 === 0 ? even : odd))
// Map { {odd: true} => [1,3,5], {even: true} => [2,4] }
```

分组函数可接受 `(num, index, array)`；第二个参数可绑定 `this`。按字符串分组用 `group()`，按对象分组用 `groupToMap()`。

## 4. 数组的空位

数组的空位指的是，数组的某一个位置没有任何值，比如`Array()`构造函数返回的数组都是空位。

```js
Array(3) // [, , ,]
```

注意，空位不是`undefined`，某一个位置的值等于`undefined`，依然是有值的。空位是没有任何值，`in`运算符可以说明这一点。

```js
0 in [undefined, undefined, undefined] // true
0 in [, , ,] // false
```

ES5 对空位的处理，已经很不一致了，大多数情况下会忽略空位。

- `forEach()`, `filter()`, `reduce()`, `every()` 和`some()`都会跳过空位。
- `map()`会跳过空位，但会保留这个值
- `join()`和`toString()`会将空位视为`undefined`，而`undefined`和`null`会被处理成空字符串。

```js
// forEach方法
[,'a'].forEach((x,i) => console.log(i)); // 1

// filter方法
['a',,'b'].filter(x => true) // ['a','b']

// every方法
[,'a'].every(x => x==='a') // true

// reduce方法
[1,,2].reduce((x,y) => x+y) // 3

// some方法
[,'a'].some(x => x !== 'a') // false

// map方法
[,'a'].map(x => 1) // [,1]

// join方法
[,'a',undefined,null].join('#') // "#a##"

// toString方法
[,'a',undefined,null].toString() // ",a,,"
```

ES6 则是明确将空位转为`undefined`。

`Array.from()`方法会将数组的空位，转为`undefined`，也就是说，这个方法不会忽略空位。

```js
Array.from(['a', , 'b'])
// [ "a", undefined, "b" ]
```

扩展运算符（`...`）也会将空位转为`undefined`。

```js
;[...['a', , 'b']]
// [ "a", undefined, "b" ]
```

`copyWithin()`会连空位一起拷贝。

```js
;[, 'a', 'b', ,].copyWithin(2, 0) // [,"a",,"a"]
```

`fill()`会将空位视为正常的数组位置。

```js
new Array(3).fill('a') // ["a","a","a"]
```

`for...of`循环也会遍历空位。

```js
let arr = [, ,]
for (let i of arr) {
  console.log(1)
}
// 1
// 1
```

`entries()`、`keys()`、`values()`、`find()`和`findIndex()`会将空位处理成`undefined`。

```js
// entries()
[...[,'a'].entries()] // [[0,undefined], [1,"a"]]

// keys()
[...[,'a'].keys()] // [0,1]

// values()
[...[,'a'].values()] // [undefined,"a"]

// find()
[,'a'].find(x => true) // undefined

// findIndex()
[,'a'].findIndex(x => true) // 0
```

由于空位的处理规则非常不统一，所以建议避免出现空位。

## **5. 常见问题与陷阱 (FAQ)**

### 5.1 `includes` 和 `indexOf` 有什么区别？我该用哪个？

- **NaN 处理**：`indexOf` 找不到 `NaN`（返回 -1），`includes` 能正确找到（返回 true）。
- **返回值**：`indexOf` 返回索引（数字），`includes` 返回布尔值。
- **建议**：只需判断是否存在用 `includes`（语义清晰），需要索引用 `indexOf`。

### 5.2 `find` 和 `filter` 有什么区别？

- `find`：找到第一个满足条件的元素后立即停止，返回**元素**（没找到返回 `undefined`）。
- `filter`：遍历整个数组，返回**所有**满足条件元素的新数组。
- 只需一个结果时 `find` 性能更好。

### 5.3 `forEach` 和 `map` 的核心区别是什么？为什么不能在 `forEach` 中 `break`？

- `forEach`：执行副作用（打印、修改外部变量、DOM 操作），无返回值（返回 `undefined`），不可链式。
- `map`：数据转换，返回新数组（长度一致），不应用于副作用。

不能在 `forEach` 中 `break`/`continue`，因为它是函数调用，传入的是回调函数，在里面使用这两个关键字是语法错误。需要中途跳出时用 `for...of`，或用 `find`/`some`/`every` 模拟。

### 5.4 `map` 和扩展运算符是深拷贝吗？

**不是**，都是浅拷贝。`map` 和 `[...arr]` 都会返回新数组，但只复制第一层，元素是对象时复制的仍是同一个引用（除非在回调里显式创建新对象）。

```js
const arr = [{ n: 1 }]
const copied = [...arr]
copied[0].n = 2
arr[0].n // 2（同一个对象）
```

### 5.5 `flat()` 默认拉平几层？它和 `flatMap` 有什么区别？

默认拉平 **1 层**；任意深度用 `flat(Infinity)`。`flat()` 还会**自动移除**空位：

```js
;[1, 2, , 4, 5].flat() // [1, 2, 4, 5]
```

`flatMap` 等价于先 `map` 再 `flat(1)`，但一次遍历同时完成映射和扁平化，**效率更高**（避免创建中间临时数组）。注意 `flatMap` 只能拉平 1 层。

### 5.6 `Array.from` 和 `Array.of` 到底有什么用？

`Array.from` 将**类数组对象**（`arguments`、DOM `NodeList`）或**可迭代对象**（`Set`/`Map`/`String`）转为真数组；第二个参数可同时映射：

```js
Array.from({ length: 3 }, (_, i) => i) // [0, 1, 2]
```

`Array.of` 修复 `new Array()` 的怪异行为：`new Array(3)` 创建长度为 3 的空数组，`new Array(1, 2)` 创建 `[1, 2]`。`Array.of(3)` 始终创建 `[3]`，行为一致。

### 5.7 链式调用和大数据量下的 ES6 方法有性能问题吗？

链式调用（如 `.map().filter()`）**有**开销：每次调用都会创建完整的临时新数组并遍历一次，增加内存与 CPU 开销。优化：用 `reduce` 一次遍历完成过滤+映射，或用 `for` 循环。

ES6 方法的性能也**通常不如**原生 `for` 循环——后者在纯计算上往往最快，ES6 方法有函数调用开销。但除非极端性能敏感场景，仍优先用 ES6 方法（可读性、维护性更好）。

### 5.8 如果数组在迭代时被修改了，数组内其他的元素会如何？

其他元素会被**跳过**（删除元素导致后续元素前移）：

```js
let words = ['one', 'two', 'three', 'four']
words.forEach(item => {
  console.log(item)
  if (item === 'two') words.shift()
})
// one
// two
// four（'three' 被跳过）
```

### 5.9 可以给数组一个非整数的下标吗？

**可以**，但会作为数组的**属性**创建，而非数组元素，不记录进 `length`：

```js
let arr = []
arr[3.4] = 'orange'
arr.length // 0
arr.hasOwnProperty(3.4) // true
```

### 5.10 如何让类数组也具备数组的原型方法？

把数组的原型方法赋给对象的属性，方法基于 `length` 属性操作：

```js
let obj = {
  2: 3,
  3: 4,
  length: 2,
  push: Array.prototype.push,
}
obj.push(1)
obj.push(2)
// 基于 length 属性 push，直接改了索引 2 和 3
obj // [,,1,2]
obj[2] // 1
obj[3] // 2
```
