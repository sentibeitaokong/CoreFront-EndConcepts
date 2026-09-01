/*
 * 示例代码：array.md
 * 来源文档：apps/docs/js/advanced/data-types/array.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 含义 =====
// console.log(...[1, 2, 3])
// // 1 2 3
//
// console.log(1, ...[2, 3, 4], 5)
// // 1 2 3 4 5
//
// [...document.querySelectorAll('div')]
// // [<div>, <div>, <div>]

// ===== 1.1 含义 =====
// function push(array, ...items) {
//   array.push(...items)
// }
//
// function add(x, y) {
//   return x + y
// }
//
// const numbers = [4, 38]
// add(...numbers) // 42

// ===== 1.1 含义 =====
// function f(v, w, x, y, z) {}
// const args = [0, 1]
// f(-1, ...args, 2, ...[3])

// ===== 1.1 含义 =====
// const arr = [...(x > 0 ? ['a'] : []), 'b']

// ===== 1.1 含义 =====
// ;[...[], 1]
// // [1]

// ===== 1.1 含义 =====
// (...[1, 2])
// // Uncaught SyntaxError: Unexpected number
//
// console.log((...[1, 2]))
// // Uncaught SyntaxError: Unexpected number
//
// console.log(...[1, 2])
// // 1 2

// ===== 1.2 替代函数的 apply() 方法 =====
// // ES5 的写法
// function f(x, y, z) {
//   // ...
// }
// var args = [0, 1, 2]
// f.apply(null, args)
//
// // ES6 的写法
// function f(x, y, z) {
//   // ...
// }
// let args = [0, 1, 2]
// f(...args)

// ===== 1.2 替代函数的 apply() 方法 =====
// // ES5 的写法
// Math.max.apply(null, [14, 3, 77])
//
// // ES6 的写法
// Math.max(...[14, 3, 77])
//
// // 等同于
// Math.max(14, 3, 77)

// ===== 1.2 替代函数的 apply() 方法 =====
// // ES5 的写法
// var arr1 = [0, 1, 2]
// var arr2 = [3, 4, 5]
// Array.prototype.push.apply(arr1, arr2)
//
// // ES6 的写法
// let arr1 = [0, 1, 2]
// let arr2 = [3, 4, 5]
// arr1.push(...arr2)

// ===== 1.2 替代函数的 apply() 方法 =====
// // ES5
// new (Date.bind.apply(Date, [null, 2015, 1, 1]))()
//
// // ES6
// new Date(...[2015, 1, 1])

// ===== 1.3 扩展运算符的应用 =====
// const a1 = [1, 2]
// const a2 = a1
//
// a2[0] = 2
// a1 // [2, 2]

// ===== 1.3 扩展运算符的应用 =====
// const a1 = [1, 2]
// const a2 = a1.concat()
//
// a2[0] = 2
// a1 // [1, 2]

// ===== 1.3 扩展运算符的应用 =====
// const a1 = [1, 2]
// // 写法一
// const a2 = [...a1]
// // 写法二
// const [...a2] = a1

// ===== 1.3 扩展运算符的应用 =====
// const arr1 = ['a', 'b']
// const arr2 = ['c']
// const arr3 = ['d', 'e']
//
// // ES5 的合并数组
// arr1.concat(arr2, arr3)
// // [ 'a', 'b', 'c', 'd', 'e' ]
//
// // ES6 的合并数组
// ;[...arr1, ...arr2, ...arr3]
// // [ 'a', 'b', 'c', 'd', 'e' ]

// ===== 1.3 扩展运算符的应用 =====
// const a1 = [{ foo: 1 }]
// const a2 = [{ bar: 2 }]
//
// const a3 = a1.concat(a2)
// const a4 = [...a1, ...a2]
//
// a3[0] === a1[0] // true
// a4[0] === a1[0] // true

// ===== 1.3 扩展运算符的应用 =====
// // ES5
// a = list[0], rest = list.slice(1)
//
// // ES6
// [a, ...rest] = list

// ===== 1.3 扩展运算符的应用 =====
// const [first, ...rest] = [1, 2, 3, 4, 5]
// first // 1
// rest // [2, 3, 4, 5]
//
// const [first, ...rest] = []
// first // undefined
// rest // []
//
// const [first, ...rest] = ['foo']
// first // "foo"
// rest // []

// ===== 1.3 扩展运算符的应用 =====
// const [...butLast, last] = [1, 2, 3, 4, 5];
// // 报错
//
// const [first, ...middle, last] = [1, 2, 3, 4, 5];
// // 报错

// ===== 1.3 扩展运算符的应用 =====
// ;[...'hello']
// // [ "h", "e", "l", "l", "o" ]

// ===== 1.3 扩展运算符的应用 =====
// 'x\uD83D\uDE80y'.length // 4
// [...'x\uD83D\uDE80y'].length // 3

// ===== 1.3 扩展运算符的应用 =====
// function length(str) {
//   return [...str].length
// }
//
// length('x\uD83D\uDE80y') // 3

// ===== 1.3 扩展运算符的应用 =====
// let str = 'x\uD83D\uDE80y';
//
// str.split('').reverse().join('')
// // 'y\uDE80\uD83Dx'
//
// [...str].reverse().join('')
// // 'y\uD83D\uDE80x'

// ===== 1.3 扩展运算符的应用 =====
// let nodeList = document.querySelectorAll('div')
// let array = [...nodeList]

// ===== 1.3 扩展运算符的应用 =====
// Number.prototype[Symbol.iterator] = function* () {
//   let i = 0
//   let num = this.valueOf()
//   while (i < num) {
//     yield i++
//   }
// }
//
// console.log([...5]) // [0, 1, 2, 3, 4]

// ===== 1.3 扩展运算符的应用 =====
// let arrayLike = {
//   0: 'a',
//   1: 'b',
//   2: 'c',
//   length: 3,
// }
//
// // TypeError: Cannot spread non-iterable object.
// let arr = [...arrayLike]

// ===== 1.3 扩展运算符的应用 =====
// let map = new Map([
//   [1, 'one'],
//   [2, 'two'],
//   [3, 'three'],
// ])
//
// let arr = [...map.keys()] // [1, 2, 3]

// ===== 1.3 扩展运算符的应用 =====
// const go = function* () {
//   yield 1
//   yield 2
//   yield 3
// }
//
// ;[...go()] // [1, 2, 3]

// ===== 1.3 扩展运算符的应用 =====
// const obj = { a: 1, b: 2 }
// let arr = [...obj] // TypeError: Cannot spread non-iterable object

// ===== Array.from() =====
// let arrayLike = {
//   0: 'a',
//   1: 'b',
//   2: 'c',
//   length: 3,
// }
//
// // ES5 的写法
// var arr1 = [].slice.call(arrayLike) // ['a', 'b', 'c']
//
// // ES6 的写法
// let arr2 = Array.from(arrayLike) // ['a', 'b', 'c']

// ===== Array.from() =====
// // NodeList 对象
// let ps = document.querySelectorAll('p')
// Array.from(ps).filter(p => {
//   return p.textContent.length > 100
// })
//
// // arguments 对象
// function foo() {
//   var args = Array.from(arguments)
//   // ...
// }

// ===== Array.from() =====
// Array.from('hello')
// // ['h', 'e', 'l', 'l', 'o']
//
// let namesSet = new Set(['a', 'b'])
// Array.from(namesSet) // ['a', 'b']

// ===== Array.from() =====
// Array.from([1, 2, 3])
// // [1, 2, 3]

// ===== Array.from() =====
// // arguments对象
// function foo() {
//   const args = [...arguments]
// }
//
// // NodeList对象
// ;[...document.querySelectorAll('div')]

// ===== Array.from() =====
// Array.from({ length: 3 })
// // [ undefined, undefined, undefined ]

// ===== Array.from() =====
// const toArray = (() => (Array.from ? Array.from : obj => [].slice.call(obj)))()

// ===== Array.from() =====
// Array.from(arrayLike, x => x * x)
// // 等同于
// Array.from(arrayLike).map(x => x * x)
//
// Array.from([1, 2, 3], x => x * x)
// // [1, 4, 9]

// ===== Array.from() =====
// let spans = document.querySelectorAll('span.name')
//
// // map()
// let names1 = Array.prototype.map.call(spans, s => s.textContent)
//
// // Array.from()
// let names2 = Array.from(spans, s => s.textContent)

// ===== Array.from() =====
// Array.from([1, , 2, , 3], n => n || 0)
// // [1, 0, 2, 0, 3]

// ===== Array.from() =====
// function typesOf() {
//   return Array.from(arguments, value => typeof value)
// }
// typesOf(null, [], NaN)
// // ['object', 'object', 'number']

// ===== Array.from() =====
// Array.from({ length: 2 }, () => 'jack')
// // ['jack', 'jack']

// ===== Array.from() =====
// function countSymbols(string) {
//   return Array.from(string).length
// }

// ===== Array.of() =====
// Array.of(3, 11, 8) // [3,11,8]
// Array.of(3) // [3]
// Array.of(3).length // 1

// ===== Array.of() =====
// Array() // []
// Array(3) // [, , ,]
// Array(3, 11, 8) // [3, 11, 8]

// ===== Array.of() =====
// Array.of() // []
// Array.of(undefined) // [undefined]
// Array.of(1) // [1]
// Array.of(1, 2) // [1, 2]

// ===== Array.of() =====
// function ArrayOf() {
//   return [].slice.call(arguments)
// }

// ===== copyWithin() =====
// Array.prototype.copyWithin(target, (start = 0), (end = this.length))

// ===== copyWithin() =====
// ;[1, 2, 3, 4, 5].copyWithin(0, 3)
// // [4, 5, 3, 4, 5]

// ===== copyWithin() =====
// // 将3号位复制到0号位
// [1, 2, 3, 4, 5].copyWithin(0, 3, 4)
// // [4, 2, 3, 4, 5]
//
// // -2相当于3号位，-1相当于4号位
// [1, 2, 3, 4, 5].copyWithin(0, -2, -1)
// // [4, 2, 3, 4, 5]
//
// // 将3号位复制到0号位
// [].copyWithin.call({length: 5, 3: 1}, 0, 3)
// // {0: 1, 3: 1, length: 5}
//
// // 将2号位到数组结束，复制到0号位
// let i32a = new Int32Array([1, 2, 3, 4, 5]);
// i32a.copyWithin(0, 2);
// // Int32Array [3, 4, 5, 4, 5]
//
// // 对于没有部署 TypedArray 的 copyWithin 方法的平台
// // 需要采用下面的写法
// [].copyWithin.call(new Int32Array([1, 2, 3, 4, 5]), 0, 3, 4);
// // Int32Array [4, 2, 3, 4, 5]

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// ;[1, 4, -5, 10].find(n => n < 0)
// // -5

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// ;[1, 5, 10, 15].find(function (value, index, arr) {
//   return value > 9
// }) // 10

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// ;[1, 5, 10, 15].findIndex(function (value, index, arr) {
//   return value > 9
// }) // 2

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// function f(v) {
//   return v > this.age
// }
// let person = { name: 'John', age: 20 }
// ;[10, 12, 26, 15].find(f, person) // 26

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// ;[NaN]
//   .indexOf(NaN)
//   // -1
//
//   [NaN].findIndex(y => Object.is(NaN, y))
// // 0

// ===== find()，findIndex()，findLast()，findLastIndex() =====
// const array = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]
//
// array.findLast(n => n.value % 2 === 1) // { value: 3 }
// array.findLastIndex(n => n.value % 2 === 1) // 2

// ===== fill() =====
// ;['a', 'b', 'c'].fill(7)
// // [7, 7, 7]
//
// new Array(3).fill(7)
// // [7, 7, 7]

// ===== fill() =====
// ;['a', 'b', 'c'].fill(7, 1, 2)
// // ['a', 7, 'c']

// ===== fill() =====
// let arr = new Array(3).fill({ name: 'Mike' })
// arr[0].name = 'Ben'
// arr
// // [{name: "Ben"}, {name: "Ben"}, {name: "Ben"}]
//
// let arr = new Array(3).fill([])
// arr[0].push(5)
// arr
// // [[5], [5], [5]]

// ===== entries()，keys() 和 values() =====
// for (let index of ['a', 'b'].keys()) {
//   console.log(index)
// }
// // 0
// // 1
//
// for (let elem of ['a', 'b'].values()) {
//   console.log(elem)
// }
// // 'a'
// // 'b'
//
// for (let [index, elem] of ['a', 'b'].entries()) {
//   console.log(index, elem)
// }
// // 0 "a"
// // 1 "b"

// ===== entries()，keys() 和 values() =====
// let letter = ['a', 'b', 'c']
// let entries = letter.entries()
// console.log(entries.next().value) // [0, 'a']
// console.log(entries.next().value) // [1, 'b']
// console.log(entries.next().value) // [2, 'c']

// ===== includes() =====
// ;[1, 2, 3]
//   .includes(2) // true
//   [(1, 2, 3)].includes(4) // false
//   [(1, 2, NaN)].includes(NaN) // true

// ===== includes() =====
// ;[1, 2, 3].includes(3, 3) // false
// ;[1, 2, 3].includes(3, -1) // true

// ===== includes() =====
// if (arr.indexOf(el) !== -1) {
//   // ...
// }

// ===== includes() =====
// ;[NaN].indexOf(NaN)
// // -1

// ===== includes() =====
// ;[NaN].includes(NaN)
// // true

// ===== includes() =====
// const contains = (() =>
//   Array.prototype.includes
//     ? (arr, value) => arr.includes(value)
//     : (arr, value) => arr.some(el => el === value))()
// contains(['foo', 'bar'], 'baz') // => false

// ===== flat()，flatMap() =====
// ;[1, 2, [3, 4]].flat()
// // [1, 2, 3, 4]

// ===== flat()，flatMap() =====
// ;[1, 2, [3, [4, 5]]].flat()[
//   // [1, 2, 3, [4, 5]]
//
//   (1, 2, [3, [4, 5]])
// ].flat(2)
// // [1, 2, 3, 4, 5]

// ===== flat()，flatMap() =====
// ;[1, [2, [3]]].flat(Infinity)
// // [1, 2, 3]

// ===== flat()，flatMap() =====
// ;[1, 2, , 4, 5].flat()
// // [1, 2, 4, 5]

// ===== flat()，flatMap() =====
// // 相当于 [[2, 4], [3, 6], [4, 8]].flat()
// ;[2, 3, 4].flatMap(x => [x, x * 2])
// // [2, 4, 3, 6, 4, 8]

// ===== flat()，flatMap() =====
// // 相当于 [[[2]], [[4]], [[6]], [[8]]].flat()
// ;[1, 2, 3, 4].flatMap(x => [[x * 2]])
// // [[2], [4], [6], [8]]

// ===== flat()，flatMap() =====
// arr.flatMap(function callback(currentValue[, index[, array]]) {
//   // ...
// }[, thisArg])

// ===== at() =====
// const arr = [5, 12, 8, 130, 44]
// arr.at(2) // 8
// arr.at(-2) // 130

// ===== at() =====
// const sentence = 'This is a sample sentence'
//
// sentence.at(0) // 'T'
// sentence.at(-1) // 'e'
//
// sentence.at(-100) // undefined
// sentence.at(100) // undefined

// ===== toReversed()，toSorted()，toSpliced()，with() =====
// const sequence = [1, 2, 3]
// sequence.toReversed() // [3, 2, 1]
// sequence // [1, 2, 3]
//
// const outOfOrder = [3, 1, 2]
// outOfOrder.toSorted() // [1, 2, 3]
// outOfOrder // [3, 1, 2]
//
// const array = [1, 2, 3, 4]
// array.toSpliced(1, 2, 5, 6, 7) // [1, 5, 6, 7, 4]
// array // [1, 2, 3, 4]
//
// const correctionNeeded = [1, 1, 3]
// correctionNeeded.with(1, 2) // [1, 2, 3]
// correctionNeeded // [1, 1, 3]

// ===== group()，groupToMap() =====
// const array = [1, 2, 3, 4, 5]
//
// array.group((num, index, array) => {
//   return num % 2 === 0 ? 'even' : 'odd'
// })
// // { odd: [1, 3, 5], even: [2, 4] }

// ===== group()，groupToMap() =====
// ;[6.1, 4.2, 6.3].group(Math.floor)
// // { '4': [4.2], '6': [6.1, 6.3] }

// ===== group()，groupToMap() =====
// const array = [1, 2, 3, 4, 5]
//
// const odd = { odd: true }
// const even = { even: true }
// array.groupToMap((num, index, array) => {
//   return num % 2 === 0 ? even : odd
// })
// //  Map { {odd: true}: [1, 3, 5], {even: true}: [2, 4] }

// ===== 4. 数组的空位 =====
// Array(3) // [, , ,]

// ===== 4. 数组的空位 =====
// 0 in [undefined, undefined, undefined] // true
// 0 in [, , ,] // false

// ===== 4. 数组的空位 =====
// // forEach方法
// [,'a'].forEach((x,i) => console.log(i)); // 1
//
// // filter方法
// ['a',,'b'].filter(x => true) // ['a','b']
//
// // every方法
// [,'a'].every(x => x==='a') // true
//
// // reduce方法
// [1,,2].reduce((x,y) => x+y) // 3
//
// // some方法
// [,'a'].some(x => x !== 'a') // false
//
// // map方法
// [,'a'].map(x => 1) // [,1]
//
// // join方法
// [,'a',undefined,null].join('#') // "#a##"
//
// // toString方法
// [,'a',undefined,null].toString() // ",a,,"

// ===== 4. 数组的空位 =====
// Array.from(['a', , 'b'])
// // [ "a", undefined, "b" ]

// ===== 4. 数组的空位 =====
// ;[...['a', , 'b']]
// // [ "a", undefined, "b" ]

// ===== 4. 数组的空位 =====
// ;[, 'a', 'b', ,].copyWithin(2, 0) // [,"a",,"a"]

// ===== 4. 数组的空位 =====
// new Array(3).fill('a') // ["a","a","a"]

// ===== 4. 数组的空位 =====
// let arr = [, ,]
// for (let i of arr) {
//   console.log(1)
// }
// // 1
// // 1

// ===== 4. 数组的空位 =====
// // entries()
// [...[,'a'].entries()] // [[0,undefined], [1,"a"]]
//
// // keys()
// [...[,'a'].keys()] // [0,1]
//
// // values()
// [...[,'a'].values()] // [undefined,"a"]
//
// // find()
// [,'a'].find(x => true) // undefined
//
// // findIndex()
// [,'a'].findIndex(x => true) // 0

// ===== 5.14 通过给元素赋值来填充数组,可以给数组操作符一个非整形数值吗？ =====
// let arr = []
// arr[3.4] = 'orange'
// console.log(arr.length) //0
// console.log(arr.hasOwnProperty(3.4)) //true

// ===== 5.15 如果数组在迭代时被修改了，数组内其他的元素会如何？ =====
// //遍历时删除了一个元素，导致数组所有项上移了一个单元，当准备遍历到第三个元素的时候，原本的元素'three'已经变成'four'了,'three'被跳过
// let words = ['one', 'two', 'three', 'four']
// words.forEach(item => {
//   console.log(item)
//   if (item == 'two') {
//     words.shift()
//   }
// })
// //one
// //two
// //four

// ===== 5.16 如何让类数组也具备数组的原型方法？ =====
// let obj = {
//   2: 3,
//   3: 4,
//   length: 2,
//   push: Array.prototype.push,
// }
// //数组的push原型方法
// // Array.prototype.push = function(x) {
// //     this[this.length] = x;
// //     this.length++
// // }
// obj.push(1)
// obj.push(2)
// //基于length属性做push,直接更改了数组索引2和3的值
// // obj[2]=1
// // obj[3]=2
// console.log(obj) //[,,1,2]
// console.log(obj[2]) //1
// console.log(obj[3]) //2

