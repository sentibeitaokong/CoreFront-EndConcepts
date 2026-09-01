/*
 * 示例代码：setAndmap.md
 * 来源文档：apps/docs/js/advanced/data-types/setAndmap.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 基本用法 =====
// const s = new Set()
//
// ;[2, 3, 5, 4, 5, 2, 2].forEach(x => s.add(x))
//
// for (let i of s) {
//   console.log(i)
// }
// // 2 3 5 4

// ===== 1.1 基本用法 =====
// // 例一
// const set = new Set([1, 2, 3, 4, 4])
// ;[...set]
// // [1, 2, 3, 4]
//
// // 例二
// const items = new Set([1, 2, 3, 4, 5, 5, 5, 5])
// items.size // 5
//
// // 例三
// const set = new Set(document.querySelectorAll('div'))
// set.size // 56
//
// // 类似于
// const set = new Set()
// document.querySelectorAll('div').forEach(div => set.add(div))
// set.size // 56

// ===== 1.1 基本用法 =====
// // 去除数组的重复成员
// ;[...new Set(array)]

// ===== 1.1 基本用法 =====
// ;[...new Set('ababbc')].join('')
// // "abc"

// ===== 1.1 基本用法 =====
// let set = new Set()
// let a = NaN
// let b = NaN
// set.add(a)
// set.add(b)
// set // Set {NaN}

// ===== 1.1 基本用法 =====
// let set = new Set()
//
// set.add({})
// set.size // 1
//
// set.add({})
// set.size // 2

// ===== 1.1 基本用法 =====
// const items = new Set([1, 2, 3, 4, 5])
// const array = Array.from(items)

// ===== 1.1 基本用法 =====
// function dedupe(array) {
//   return Array.from(new Set(array))
// }
//
// dedupe([1, 1, 2, 3]) // [1, 2, 3]

// ===== 1.2 Set 实例的属性和方法 =====
// s.add(1).add(2).add(2)
// // 注意2被加入了两次
//
// s.size // 2
//
// s.has(1) // true
// s.has(2) // true
// s.has(3) // false
//
// s.delete(2) // true
// s.has(2) // false

// ===== 1.2 Set 实例的属性和方法 =====
// // 对象的写法
// const properties = {
//   width: 1,
//   height: 1,
// }
//
// if (properties[someName]) {
//   // do something
// }
//
// // Set的写法
// const properties = new Set()
//
// properties.add('width')
// properties.add('height')
//
// if (properties.has(someName)) {
//   // do something
// }

// ===== 1.3 遍历操作 =====
// let set = new Set(['red', 'green', 'blue'])
//
// for (let item of set.keys()) {
//   console.log(item)
// }
// // red
// // green
// // blue
//
// for (let item of set.values()) {
//   console.log(item)
// }
// // red
// // green
// // blue
//
// for (let item of set.entries()) {
//   console.log(item)
// }
// // ["red", "red"]
// // ["green", "green"]
// // ["blue", "blue"]

// ===== 1.3 遍历操作 =====
// Set.prototype[Symbol.iterator] === Set.prototype.values
// // true

// ===== 1.3 遍历操作 =====
// let set = new Set(['red', 'green', 'blue'])
//
// for (let x of set) {
//   console.log(x)
// }
// // red
// // green
// // blue

// ===== 1.3 遍历操作 =====
// let set = new Set([1, 4, 9])
// set.forEach((value, key) => console.log(key + ' : ' + value))
// // 1 : 1
// // 4 : 4
// // 9 : 9

// ===== 1.3 遍历操作 =====
// let set = new Set(['red', 'green', 'blue'])
// let arr = [...set]
// // ['red', 'green', 'blue']

// ===== 1.3 遍历操作 =====
// let arr = [3, 5, 2, 2, 5, 5]
// let unique = [...new Set(arr)]
// // [3, 5, 2]

// ===== 1.3 遍历操作 =====
// let set = new Set([1, 2, 3])
// set = new Set([...set].map(x => x * 2))
// // 返回Set结构：{2, 4, 6}
//
// let set = new Set([1, 2, 3, 4, 5])
// set = new Set([...set].filter(x => x % 2 == 0))
// // 返回Set结构：{2, 4}

// ===== 1.3 遍历操作 =====
// let a = new Set([1, 2, 3])
// let b = new Set([4, 3, 2])
//
// // 并集
// let union = new Set([...a, ...b])
// // Set {1, 2, 3, 4}
//
// // 交集
// let intersect = new Set([...a].filter(x => b.has(x)))
// // set {2, 3}
//
// // （a 相对于 b 的）差集
// let difference = new Set([...a].filter(x => !b.has(x)))
// // Set {1}

// ===== 1.3 遍历操作 =====
// // 方法一
// let set = new Set([1, 2, 3])
// set = new Set([...set].map(val => val * 2))
// // set的值是2, 4, 6
//
// // 方法二
// let set = new Set([1, 2, 3])
// set = new Set(Array.from(set, val => val * 2))
// // set的值是2, 4, 6

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const backEnd = new Set(['Python', 'Java', 'JavaScript'])
//
// const all = frontEnd.union(backEnd)
// // Set {"JavaScript", "HTML", "CSS", "Python", "Java"}

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const backEnd = new Set(['Python', 'Java', 'JavaScript'])
//
// const frontAndBackEnd = frontEnd.intersection(backEnd)
// // Set {"JavaScript"}

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const backEnd = new Set(['Python', 'Java', 'JavaScript'])
//
// const onlyFrontEnd = frontEnd.difference(backEnd)
// // Set {"HTML", "CSS"}
//
// const onlyBackEnd = backEnd.difference(frontEnd)
// // Set {"Python", "Java"}

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const backEnd = new Set(['Python', 'Java', 'JavaScript'])
//
// const onlyFrontEnd = frontEnd.symmetricDifference(backEnd)
// // Set {"HTML", "CSS", "Python", "Java"}
//
// const onlyBackEnd = backEnd.symmetricDifference(frontEnd)
// // Set {"Python", "Java", "HTML", "CSS"}

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const declarative = new Set(['HTML', 'CSS'])
//
// declarative.isSubsetOf(frontEnd)
// // true
//
// frontEndLanguages.isSubsetOf(declarativeLanguages)
// // false

// ===== 1.4 集合运算 =====
// frontEnd.isSubsetOf(frontEnd)
// // true

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const declarative = new Set(['HTML', 'CSS'])
//
// declarative.isSupersetOf(frontEnd)
// // false
//
// frontEnd.isSupersetOf(declarative)
// // true

// ===== 1.4 集合运算 =====
// frontEnd.isSupersetOf(frontEnd)
// // true

// ===== 1.4 集合运算 =====
// const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
// const interpreted = new Set(['JavaScript', 'Ruby', 'Python'])
// const compiled = new Set(['Java', 'C++', 'TypeScript'])
//
// interpreted.isDisjointFrom(compiled)
// // true
//
// frontEnd.isDisjointFrom(interpreted)
// // false

// ===== 2.1 含义 =====
// const ws = new WeakSet()
// ws.add(1) // 报错
// ws.add(Symbol()) // 不报错

// ===== 2.2 语法 =====
// const ws = new WeakSet()

// ===== 2.2 语法 =====
// const a = [
//   [1, 2],
//   [3, 4],
// ]
// const ws = new WeakSet(a)
// // WeakSet {[1, 2], [3, 4]}

// ===== 2.2 语法 =====
// const b = [3, 4]
// const ws = new WeakSet(b)
// // Uncaught TypeError: Invalid value used in weak set(…)

// ===== 2.2 语法 =====
// const ws = new WeakSet()
// const obj = {}
// const foo = {}
//
// ws.add(window)
// ws.add(obj)
//
// ws.has(window) // true
// ws.has(foo) // false
//
// ws.delete(window) // true
// ws.has(window) // false

// ===== 2.2 语法 =====
// ws.size // undefined
// ws.forEach // undefined
//
// ws.forEach(function (item) {
//   console.log('WeakSet has ' + item)
// })
// // TypeError: undefined is not a function

// ===== 2.2 语法 =====
// const foos = new WeakSet()
// class Foo {
//   constructor() {
//     foos.add(this)
//   }
//   method() {
//     if (!foos.has(this)) {
//       throw new TypeError('Foo.prototype.method 只能在Foo的实例上调用！')
//     }
//   }
// }

// ===== 3.1 含义和基本用法 =====
// const data = {}
// const element = document.getElementById('myDiv')
//
// data[element] = 'metadata'
// data['[object HTMLDivElement]'] // "metadata"

// ===== 3.1 含义和基本用法 =====
// const m = new Map()
// const o = { p: 'Hello World' }
//
// m.set(o, 'content')
// m.get(o) // "content"
//
// m.has(o) // true
// m.delete(o) // true
// m.has(o) // false

// ===== 3.1 含义和基本用法 =====
// const map = new Map([
//   ['name', '张三'],
//   ['title', 'Author'],
// ])
//
// map.size // 2
// map.has('name') // true
// map.get('name') // "张三"
// map.has('title') // true
// map.get('title') // "Author"

// ===== 3.1 含义和基本用法 =====
// const items = [
//   ['name', '张三'],
//   ['title', 'Author'],
// ]
//
// const map = new Map()
//
// items.forEach(([key, value]) => map.set(key, value))

// ===== 3.1 含义和基本用法 =====
// const set = new Set([
//   ['foo', 1],
//   ['bar', 2],
// ])
// const m1 = new Map(set)
// m1.get('foo') // 1
//
// const m2 = new Map([['baz', 3]])
// const m3 = new Map(m2)
// m3.get('baz') // 3

// ===== 3.1 含义和基本用法 =====
// const map = new Map()
//
// map.set(1, 'aaa').set(1, 'bbb')
//
// map.get(1) // "bbb"

// ===== 3.1 含义和基本用法 =====
// new Map().get('asfddfsasadf')
// // undefined

// ===== 3.1 含义和基本用法 =====
// const map = new Map()
//
// map.set(['a'], 555)
// map.get(['a']) // undefined

// ===== 3.1 含义和基本用法 =====
// const map = new Map()
//
// const k1 = ['a']
// const k2 = ['a']
//
// map.set(k1, 111).set(k2, 222)
//
// map.get(k1) // 111
// map.get(k2) // 222

// ===== 3.1 含义和基本用法 =====
// let map = new Map()
//
// map.set(-0, 123)
// map.get(+0) // 123
//
// map.set(true, 1)
// map.set('true', 2)
// map.get(true) // 1
//
// map.set(undefined, 3)
// map.set(null, 4)
// map.get(undefined) // 3
//
// map.set(NaN, 123)
// map.get(NaN) // 123

// ===== 3.2 实例的属性和操作方法 =====
// const map = new Map()
// map.set('foo', true)
// map.set('bar', false)
//
// map.size // 2

// ===== 3.2 实例的属性和操作方法 =====
// const m = new Map()
//
// m.set('edition', 6) // 键是字符串
// m.set(262, 'standard') // 键是数值
// m.set(undefined, 'nah') // 键是 undefined

// ===== 3.2 实例的属性和操作方法 =====
// let map = new Map().set(1, 'a').set(2, 'b').set(3, 'c')

// ===== 3.2 实例的属性和操作方法 =====
// const m = new Map()
//
// const hello = function () {
//   console.log('hello')
// }
// m.set(hello, 'Hello ES6!') // 键是函数
//
// m.get(hello) // Hello ES6!

// ===== 3.2 实例的属性和操作方法 =====
// const m = new Map()
//
// m.set('edition', 6)
// m.set(262, 'standard')
// m.set(undefined, 'nah')
//
// m.has('edition') // true
// m.has('years') // false
// m.has(262) // true
// m.has(undefined) // true

// ===== 3.2 实例的属性和操作方法 =====
// const m = new Map()
// m.set(undefined, 'nah')
// m.has(undefined) // true
//
// m.delete(undefined)
// m.has(undefined) // false

// ===== 3.2 实例的属性和操作方法 =====
// let map = new Map()
// map.set('foo', true)
// map.set('bar', false)
//
// map.size // 2
// map.clear()
// map.size // 0

// ===== 3.3 遍历方法 =====
// const map = new Map([
//   ['F', 'no'],
//   ['T', 'yes'],
// ])
//
// for (let key of map.keys()) {
//   console.log(key)
// }
// // "F"
// // "T"
//
// for (let value of map.values()) {
//   console.log(value)
// }
// // "no"
// // "yes"
//
// for (let item of map.entries()) {
//   console.log(item[0], item[1])
// }
// // "F" "no"
// // "T" "yes"
//
// // 或者
// for (let [key, value] of map.entries()) {
//   console.log(key, value)
// }
// // "F" "no"
// // "T" "yes"
//
// // 等同于使用map.entries()
// for (let [key, value] of map) {
//   console.log(key, value)
// }
// // "F" "no"
// // "T" "yes"

// ===== 3.3 遍历方法 =====
// map[Symbol.iterator] === map.entries
// // true

// ===== 3.3 遍历方法 =====
// const map = new Map([
//   [1, 'one'],
//   [2, 'two'],
//   [3, 'three'],
// ]);
//
// [...map.keys()]
// // [1, 2, 3]
//
// [...map.values()]
// // ['one', 'two', 'three']
//
// [...map.entries()]
// // [[1,'one'], [2, 'two'], [3, 'three']]
//
// [...map]
// // [[1,'one'], [2, 'two'], [3, 'three']]

// ===== 3.3 遍历方法 =====
// const map0 = new Map().set(1, 'a').set(2, 'b').set(3, 'c')
//
// const map1 = new Map([...map0].filter(([k, v]) => k < 3))
// // 产生 Map 结构 {1 => 'a', 2 => 'b'}
//
// const map2 = new Map([...map0].map(([k, v]) => [k * 2, '_' + v]))
// // 产生 Map 结构 {2 => '_a', 4 => '_b', 6 => '_c'}

// ===== 3.3 遍历方法 =====
// map.forEach(function (value, key, map) {
//   console.log('Key: %s, Value: %s', key, value)
// })

// ===== 3.3 遍历方法 =====
// const reporter = {
//   report: function (key, value) {
//     console.log('Key: %s, Value: %s', key, value)
//   },
// }
//
// map.forEach(function (value, key, map) {
//   this.report(key, value)
// }, reporter)

// ===== 3.4 与其他数据结构的互相转换 =====
// const myMap = new Map().set(true, 7).set({ foo: 3 }, ['abc'])
// ;[...myMap]
// // [ [ true, 7 ], [ { foo: 3 }, [ 'abc' ] ] ]

// ===== 3.4 与其他数据结构的互相转换 =====
// new Map([
//   [true, 7],
//   [{ foo: 3 }, ['abc']],
// ])
// // Map {
// //   true => 7,
// //   Object {foo: 3} => ['abc']
// // }

// ===== 3.4 与其他数据结构的互相转换 =====
// function strMapToObj(strMap) {
//   let obj = Object.create(null)
//   for (let [k, v] of strMap) {
//     obj[k] = v
//   }
//   return obj
// }
//
// const myMap = new Map().set('yes', true).set('no', false)
// strMapToObj(myMap)
// // { yes: true, no: false }

// ===== 3.4 与其他数据结构的互相转换 =====
// let obj = { a: 1, b: 2 }
// let map = new Map(Object.entries(obj))

// ===== 3.4 与其他数据结构的互相转换 =====
// function objToStrMap(obj) {
//   let strMap = new Map()
//   for (let k of Object.keys(obj)) {
//     strMap.set(k, obj[k])
//   }
//   return strMap
// }
//
// objToStrMap({ yes: true, no: false })
// // Map {"yes" => true, "no" => false}

// ===== 3.4 与其他数据结构的互相转换 =====
// function strMapToJson(strMap) {
//   return JSON.stringify(strMapToObj(strMap))
// }
//
// let myMap = new Map().set('yes', true).set('no', false)
// strMapToJson(myMap)
// // '{"yes":true,"no":false}'

// ===== 3.4 与其他数据结构的互相转换 =====
// function mapToArrayJson(map) {
//   return JSON.stringify([...map])
// }
//
// let myMap = new Map().set(true, 7).set({ foo: 3 }, ['abc'])
// mapToArrayJson(myMap)
// // '[[true,7],[{"foo":3},["abc"]]]'

// ===== 3.4 与其他数据结构的互相转换 =====
// function jsonToStrMap(jsonStr) {
//   return objToStrMap(JSON.parse(jsonStr))
// }
//
// jsonToStrMap('{"yes": true, "no": false}')
// // Map {'yes' => true, 'no' => false}

// ===== 3.4 与其他数据结构的互相转换 =====
// function jsonToMap(jsonStr) {
//   return new Map(JSON.parse(jsonStr))
// }
//
// jsonToMap('[[true,7],[{"foo":3},["abc"]]]')
// // Map {true => 7, Object {foo: 3} => ['abc']}

// ===== 4.1 含义 =====
// // WeakMap 可以使用 set 方法添加成员
// const wm1 = new WeakMap()
// const key = { foo: 1 }
// wm1.set(key, 2)
// wm1.get(key) // 2
//
// // WeakMap 也可以接受一个数组，
// // 作为构造函数的参数
// const k1 = [1, 2, 3]
// const k2 = [4, 5, 6]
// const wm2 = new WeakMap([
//   [k1, 'foo'],
//   [k2, 'bar'],
// ])
// wm2.get(k2) // "bar"

// ===== 4.1 含义 =====
// const map = new WeakMap()
// map.set(1, 2) // 报错
// map.set(null, 2) // 报错
// map.set(Symbol(), 2) // 不报错

// ===== 4.1 含义 =====
// const e1 = document.getElementById('foo')
// const e2 = document.getElementById('bar')
// const arr = [
//   [e1, 'foo 元素'],
//   [e2, 'bar 元素'],
// ]

// ===== 4.1 含义 =====
// // 不需要 e1 和 e2 的时候
// // 必须手动删除引用
// arr[0] = null
// arr[1] = null

// ===== 4.1 含义 =====
// const wm = new WeakMap()
//
// const element = document.getElementById('example')
//
// wm.set(element, 'some information')
// wm.get(element) // "some information"

// ===== 4.1 含义 =====
// const wm = new WeakMap()
// let key = {}
// let obj = { foo: 1 }
//
// wm.set(key, obj)
// obj = null
// wm.get(key)
// // Object {foo: 1}

// ===== 4.2 WeakMap 的语法 =====
// const wm = new WeakMap()
//
// // size、forEach、clear 方法都不存在
// wm.size // undefined
// wm.forEach // undefined
// wm.clear // undefined

// ===== 4.3 WeakMap 的示例 [bash] =====
// $ node --expose-gc

// ===== 4.3 WeakMap 的示例 =====
// // 手动执行一次垃圾回收，保证获取的内存使用状态准确
// > global.gc();
// undefined
//
// // 查看内存占用的初始状态，heapUsed 为 4M 左右
// > process.memoryUsage();
// { rss: 21106688,
//   heapTotal: 7376896,
//   heapUsed: 4153936,
//   external: 9059 }
//
// > let wm = new WeakMap();
// undefined
//
// // 新建一个变量 key，指向一个 5*1024*1024 的数组
// > let key = new Array(5 * 1024 * 1024);
// undefined
//
// // 设置 WeakMap 实例的键名，也指向 key 数组
// // 这时，key 数组实际被引用了两次，
// // 变量 key 引用一次，WeakMap 的键名引用了第二次
// // 但是，WeakMap 是弱引用，对于引擎来说，引用计数还是1
// > wm.set(key, 1);
// WeakMap {}
//
// > global.gc();
// undefined
//
// // 这时内存占用 heapUsed 增加到 45M 了
// > process.memoryUsage();
// { rss: 67538944,
//   heapTotal: 7376896,
//   heapUsed: 45782816,
//   external: 8945 }
//
// // 清除变量 key 对数组的引用，
// // 但没有手动清除 WeakMap 实例的键名对数组的引用
// > key = null;
// null
//
// // 再次执行垃圾回收
// > global.gc();
// undefined
//
// // 内存占用 heapUsed 变回 4M 左右，
// // 可以看到 WeakMap 的键名引用没有阻止 gc 对内存的回收
// > process.memoryUsage();
// { rss: 20639744,
//   heapTotal: 8425472,
//   heapUsed: 3979792,
//   external: 8956 }

// ===== 4.4 WeakMap 的用途 =====
// let myWeakmap = new WeakMap()
//
// myWeakmap.set(document.getElementById('logo'), { timesClicked: 0 })
//
// document.getElementById('logo').addEventListener(
//   'click',
//   function () {
//     let logoData = myWeakmap.get(document.getElementById('logo'))
//     logoData.timesClicked++
//   },
//   false,
// )

// ===== 4.4 WeakMap 的用途 =====
// const _counter = new WeakMap()
// const _action = new WeakMap()
//
// class Countdown {
//   constructor(counter, action) {
//     _counter.set(this, counter)
//     _action.set(this, action)
//   }
//   dec() {
//     let counter = _counter.get(this)
//     if (counter < 1) return
//     counter--
//     _counter.set(this, counter)
//     if (counter === 0) {
//       _action.get(this)()
//     }
//   }
// }
//
// const c = new Countdown(2, () => console.log('DONE'))
//
// c.dec()
// c.dec()
// // DONE

// ===== 5. WeakRef =====
// let target = {}
// let wr = new WeakRef(target)

// ===== 5. WeakRef =====
// let target = {}
// let wr = new WeakRef(target)
//
// let obj = wr.deref()
// if (obj) {
//   // target 未被垃圾回收机制清除
//   // ...
// }

// ===== 5. WeakRef =====
// function makeWeakCached(f) {
//   const cache = new Map()
//   return key => {
//     const ref = cache.get(key)
//     if (ref) {
//       const cached = ref.deref()
//       if (cached !== undefined) return cached
//     }
//
//     const fresh = f(key)
//     cache.set(key, new WeakRef(fresh))
//     return fresh
//   }
// }
//
// const getImageCached = makeWeakCached(getImage)

