/*
 * 示例代码：generator.md
 * 来源文档：apps/docs/js/advanced/async/generator.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 基本概念 =====
// function* helloWorldGenerator() {
//   yield 'hello'
//   yield 'world'
//   return 'ending'
// }
//
// var hw = helloWorldGenerator()

// ===== 1.1 基本概念 =====
// hw.next()
// // { value: 'hello', done: false }
//
// hw.next()
// // { value: 'world', done: false }
//
// hw.next()
// // { value: 'ending', done: true }
//
// hw.next()
// // { value: undefined, done: true }

// ===== 1.1 基本概念 =====
// function * foo(x, y) { ··· }
// function *foo(x, y) { ··· }
// function* foo(x, y) { ··· }
// function*foo(x, y) { ··· }

// ===== 1.2 yield 表达式 =====
// function* gen() {
//   yield 123 + 456
// }

// ===== 1.2 yield 表达式 =====
// function* f() {
//   console.log('执行了！')
// }
//
// var generator = f()
//
// setTimeout(function () {
//   generator.next()
// }, 2000)

// ===== 1.2 yield 表达式 =====
// (function (){
//   yield 1;
// })()
// // SyntaxError: Unexpected number

// ===== 1.2 yield 表达式 =====
// var arr = [1, [[2, 3], 4], [5, 6]];
//
// var flat = function* (a) {
//   a.forEach(function (item) {
//     if (typeof item !== 'number') {
//       yield* flat(item);
//     } else {
//       yield item;
//     }
//   });
// };
//
// for (var f of flat(arr)){
//   console.log(f);
// }

// ===== 1.2 yield 表达式 =====
// var arr = [1, [[2, 3], 4], [5, 6]]
//
// var flat = function* (a) {
//   var length = a.length
//   for (var i = 0; i < length; i++) {
//     var item = a[i]
//     if (typeof item !== 'number') {
//       yield* flat(item)
//     } else {
//       yield item
//     }
//   }
// }
//
// for (var f of flat(arr)) {
//   console.log(f)
// }
// // 1, 2, 3, 4, 5, 6

// ===== 1.2 yield 表达式 =====
// function* demo() {
//   console.log('Hello' + yield); // SyntaxError
//   console.log('Hello' + yield 123); // SyntaxError
//
//   console.log('Hello' + (yield)); // OK
//   console.log('Hello' + (yield 123)); // OK
// }

// ===== 1.2 yield 表达式 =====
// function* demo() {
//   foo(yield 'a', yield 'b') // OK
//   let input = yield // OK
// }

// ===== 1.3 与 Iterator 接口的关系 =====
// var myIterable = {}
// myIterable[Symbol.iterator] = function* () {
//   yield 1
//   yield 2
//   yield 3
// }
//
// ;[...myIterable] // [1, 2, 3]

// ===== 1.3 与 Iterator 接口的关系 =====
// function* gen() {
//   // some code
// }
//
// var g = gen()
//
// g[Symbol.iterator]() === g
// // true

// ===== 1.4 next 方法的参数 =====
// function* f() {
//   for (var i = 0; true; i++) {
//     var reset = yield i
//     if (reset) {
//       i = -1
//     }
//   }
// }
//
// var g = f()
//
// g.next() // { value: 0, done: false }
// g.next() // { value: 1, done: false }
// g.next(true) // { value: 0, done: false }

// ===== 1.4 next 方法的参数 =====
// function* foo(x) {
//   var y = 2 * (yield x + 1)
//   var z = yield y / 3
//   return x + y + z
// }
//
// var a = foo(5)
// a.next() // Object{value:6, done:false}
// a.next() // Object{value:NaN, done:false}
// a.next() // Object{value:NaN, done:true}
//
// var b = foo(5)
// b.next() // { value:6, done:false }
// b.next(12) // { value:8, done:false }
// b.next(13) // { value:42, done:true }

// ===== 1.4 next 方法的参数 =====
// function* dataConsumer() {
//   console.log('Started')
//   console.log(`1. ${yield}`)
//   console.log(`2. ${yield}`)
//   return 'result'
// }
//
// let genObj = dataConsumer()
// genObj.next()
// // Started
// genObj.next('a')
// // 1. a
// genObj.next('b')
// // 2. b

// ===== 1.4 next 方法的参数 =====
// function wrapper(generatorFunction) {
//   return function (...args) {
//     let generatorObject = generatorFunction(...args)
//     generatorObject.next()
//     return generatorObject
//   }
// }
//
// const wrapped = wrapper(function* () {
//   console.log(`First input: ${yield}`)
//   return 'DONE'
// })
//
// wrapped().next('hello!')
// // First input: hello!

// ===== 1.5 for...of 循环 =====
// function* foo() {
//   yield 1
//   yield 2
//   yield 3
//   yield 4
//   yield 5
//   return 6
// }
//
// for (let v of foo()) {
//   console.log(v)
// }
// // 1 2 3 4 5

// ===== 1.5 for...of 循环 =====
// function* fibonacci() {
//   let [prev, curr] = [0, 1]
//   for (;;) {
//     yield curr
//     ;[prev, curr] = [curr, prev + curr]
//   }
// }
//
// for (let n of fibonacci()) {
//   if (n > 1000) break
//   console.log(n)
// }

// ===== 1.5 for...of 循环 =====
// function* objectEntries(obj) {
//   let propKeys = Reflect.ownKeys(obj)
//
//   for (let propKey of propKeys) {
//     yield [propKey, obj[propKey]]
//   }
// }
//
// let jane = { first: 'Jane', last: 'Doe' }
//
// for (let [key, value] of objectEntries(jane)) {
//   console.log(`${key}: ${value}`)
// }
// // first: Jane
// // last: Doe

// ===== 1.5 for...of 循环 =====
// function* objectEntries() {
//   let propKeys = Object.keys(this)
//
//   for (let propKey of propKeys) {
//     yield [propKey, this[propKey]]
//   }
// }
//
// let jane = { first: 'Jane', last: 'Doe' }
//
// jane[Symbol.iterator] = objectEntries
//
// for (let [key, value] of jane) {
//   console.log(`${key}: ${value}`)
// }
// // first: Jane
// // last: Doe

// ===== 1.5 for...of 循环 =====
// function* numbers() {
//   yield 1
//   yield 2
//   return 3
//   yield 4
// }
//
// // 扩展运算符
// ;[...numbers()] // [1, 2]
//
// // Array.from 方法
// Array.from(numbers()) // [1, 2]
//
// // 解构赋值
// let [x, y] = numbers()
// x // 1
// y // 2
//
// // for...of 循环
// for (let n of numbers()) {
//   console.log(n)
// }
// // 1
// // 2

// ===== 2.1 Generator.prototype.throw() =====
// var g = function* () {
//   try {
//     yield
//   } catch (e) {
//     console.log('内部捕获', e)
//   }
// }
//
// var i = g()
// i.next()
//
// try {
//   i.throw('a')
//   i.throw('b')
// } catch (e) {
//   console.log('外部捕获', e)
// }
// // 内部捕获 a
// // 外部捕获 b

// ===== 2.1 Generator.prototype.throw() =====
// var g = function* () {
//   try {
//     yield
//   } catch (e) {
//     console.log(e)
//   }
// }
//
// var i = g()
// i.next()
// i.throw(new Error('出错了！'))
// // Error: 出错了！(…)

// ===== 2.1 Generator.prototype.throw() =====
// var g = function* () {
//   while (true) {
//     try {
//       yield
//     } catch (e) {
//       if (e != 'a') throw e
//       console.log('内部捕获', e)
//     }
//   }
// }
//
// var i = g()
// i.next()
//
// try {
//   throw new Error('a')
//   throw new Error('b')
// } catch (e) {
//   console.log('外部捕获', e)
// }
// // 外部捕获 [Error: a]

// ===== 2.1 Generator.prototype.throw() =====
// var g = function* () {
//   while (true) {
//     yield
//     console.log('内部捕获', e)
//   }
// }
//
// var i = g()
// i.next()
//
// try {
//   i.throw('a')
//   i.throw('b')
// } catch (e) {
//   console.log('外部捕获', e)
// }
// // 外部捕获 a

// ===== 2.1 Generator.prototype.throw() =====
// var gen = function* gen() {
//   yield console.log('hello')
//   yield console.log('world')
// }
//
// var g = gen()
// g.next()
// g.throw()
// // hello
// // Uncaught undefined

// ===== 2.1 Generator.prototype.throw() =====
// function* gen() {
//   try {
//     yield 1
//   } catch (e) {
//     console.log('内部捕获')
//   }
// }
//
// var g = gen()
// g.throw(1)
// // Uncaught 1

// ===== 2.1 Generator.prototype.throw() =====
// var gen = function* gen() {
//   try {
//     yield 1
//   } catch (e) {
//     yield 2
//   }
//   yield 3
// }
//
// var g = gen()
// g.next() // { value:1, done:false }
// g.throw() // { value:2, done:false }
// g.next() // { value:3, done:false }
// g.next() // { value:undefined, done:true }

// ===== 2.1 Generator.prototype.throw() =====
// var gen = function* gen() {
//   yield console.log('hello')
//   yield console.log('world')
// }
//
// var g = gen()
// g.next()
//
// try {
//   throw new Error()
// } catch (e) {
//   g.next()
// }
// // hello
// // world

// ===== 2.1 Generator.prototype.throw() =====
// function* foo() {
//   var x = yield 3
//   var y = x.toUpperCase()
//   yield y
// }
//
// var it = foo()
//
// it.next() // { value:3, done:false }
//
// try {
//   it.next(42)
// } catch (err) {
//   console.log(err)
// }

// ===== 2.1 Generator.prototype.throw() =====
// function* g() {
//   yield 1
//   console.log('throwing an exception')
//   throw new Error('generator broke!')
//   yield 2
//   yield 3
// }
//
// function log(generator) {
//   var v
//   console.log('starting generator')
//   try {
//     v = generator.next()
//     console.log('第一次运行next方法', v)
//   } catch (err) {
//     console.log('捕捉错误', v)
//   }
//   try {
//     v = generator.next()
//     console.log('第二次运行next方法', v)
//   } catch (err) {
//     console.log('捕捉错误', v)
//   }
//   try {
//     v = generator.next()
//     console.log('第三次运行next方法', v)
//   } catch (err) {
//     console.log('捕捉错误', v)
//   }
//   console.log('caller done')
// }
//
// log(g())
// // starting generator
// // 第一次运行next方法 { value: 1, done: false }
// // throwing an exception
// // 捕捉错误 { value: 1, done: false }
// // 第三次运行next方法 { value: undefined, done: true }
// // caller done

// ===== 2.2 Generator.prototype.return() =====
// function* gen() {
//   yield 1
//   yield 2
//   yield 3
// }
//
// var g = gen()
//
// g.next() // { value: 1, done: false }
// g.return('foo') // { value: "foo", done: true }
// g.next() // { value: undefined, done: true }

// ===== 2.2 Generator.prototype.return() =====
// function* gen() {
//   yield 1
//   yield 2
//   yield 3
// }
//
// var g = gen()
//
// g.next() // { value: 1, done: false }
// g.return() // { value: undefined, done: true }

// ===== 2.2 Generator.prototype.return() =====
// function* numbers() {
//   yield 1
//   try {
//     yield 2
//     yield 3
//   } finally {
//     yield 4
//     yield 5
//   }
//   yield 6
// }
// var g = numbers()
// g.next() // { value: 1, done: false }
// g.next() // { value: 2, done: false }
// g.return(7) // { value: 4, done: false }
// g.next() // { value: 5, done: false }
// g.next() // { value: 7, done: true }

// ===== 2.3 next()、throw()、return() 的共同点 =====
// const g = function* (x, y) {
//   let result = yield x + y
//   return result
// }
//
// const gen = g(1, 2)
// gen.next() // Object {value: 3, done: false}
//
// gen.next(1) // Object {value: 1, done: true}
// // 相当于将 let result = yield x + y
// // 替换成 let result = 1;

// ===== 2.3 next()、throw()、return() 的共同点 =====
// gen.throw(new Error('出错了')) // Uncaught Error: 出错了
// // 相当于将 let result = yield x + y
// // 替换成 let result = throw(new Error('出错了'));

// ===== 2.3 next()、throw()、return() 的共同点 =====
// gen.return(2) // Object {value: 2, done: true}
// // 相当于将 let result = yield x + y
// // 替换成 let result = return 2;

// ===== 3.1 yield\* 表达式 =====
// function* foo() {
//   yield 'a'
//   yield 'b'
// }
//
// function* bar() {
//   yield 'x'
//   // 手动遍历 foo()
//   for (let i of foo()) {
//     console.log(i)
//   }
//   yield 'y'
// }
//
// for (let v of bar()) {
//   console.log(v)
// }
// // x
// // a
// // b
// // y

// ===== 3.1 yield\* 表达式 =====
// function* bar() {
//   yield 'x'
//   yield* foo()
//   yield 'y'
// }
//
// // 等同于
// function* bar() {
//   yield 'x'
//   yield 'a'
//   yield 'b'
//   yield 'y'
// }
//
// // 等同于
// function* bar() {
//   yield 'x'
//   for (let v of foo()) {
//     yield v
//   }
//   yield 'y'
// }
//
// for (let v of bar()) {
//   console.log(v)
// }
// // "x"
// // "a"
// // "b"
// // "y"

// ===== 3.1 yield\* 表达式 =====
// function* inner() {
//   yield 'hello!'
// }
//
// function* outer1() {
//   yield 'open'
//   yield inner()
//   yield 'close'
// }
//
// var gen = outer1()
// gen.next().value // "open"
// gen.next().value // 返回一个遍历器对象
// gen.next().value // "close"
//
// function* outer2() {
//   yield 'open'
//   yield* inner()
//   yield 'close'
// }
//
// var gen = outer2()
// gen.next().value // "open"
// gen.next().value // "hello!"
// gen.next().value // "close"

// ===== 3.1 yield\* 表达式 =====
// let delegatedIterator = (function* () {
//   yield 'Hello!'
//   yield 'Bye!'
// })()
//
// let delegatingIterator = (function* () {
//   yield 'Greetings!'
//   yield* delegatedIterator
//   yield 'Ok, bye.'
// })()
//
// for (let value of delegatingIterator) {
//   console.log(value)
// }
// // "Greetings!
// // "Hello!"
// // "Bye!"
// // "Ok, bye."

// ===== 3.1 yield\* 表达式 =====
// function* concat(iter1, iter2) {
//   yield* iter1
//   yield* iter2
// }
//
// // 等同于
//
// function* concat(iter1, iter2) {
//   for (var value of iter1) {
//     yield value
//   }
//   for (var value of iter2) {
//     yield value
//   }
// }

// ===== 3.1 yield\* 表达式 =====
// function* gen() {
//   yield* ['a', 'b', 'c']
// }
//
// gen().next() // { value:"a", done:false }

// ===== 3.1 yield\* 表达式 =====
// let read = (function* () {
//   yield 'hello'
//   yield* 'hello'
// })()
//
// read.next().value // "hello"
// read.next().value // "h"

// ===== 3.1 yield\* 表达式 =====
// function* foo() {
//   yield 2
//   yield 3
//   return 'foo'
// }
//
// function* bar() {
//   yield 1
//   var v = yield* foo()
//   console.log('v: ' + v)
//   yield 4
// }
//
// var it = bar()
//
// it.next()
// // {value: 1, done: false}
// it.next()
// // {value: 2, done: false}
// it.next()
// // {value: 3, done: false}
// it.next()
// // "v: foo"
// // {value: 4, done: false}
// it.next()
// // {value: undefined, done: true}

// ===== 3.1 yield\* 表达式 =====
// function* genFuncWithReturn() {
//   yield 'a'
//   yield 'b'
//   return 'The result'
// }
// function* logReturned(genObj) {
//   let result = yield* genObj
//   console.log(result)
// }
//
// ;[...logReturned(genFuncWithReturn())]
// // The result
// // 值为 [ 'a', 'b' ]

// ===== 3.1 yield\* 表达式 =====
// function* iterTree(tree) {
//   if (Array.isArray(tree)) {
//     for (let i = 0; i < tree.length; i++) {
//       yield* iterTree(tree[i])
//     }
//   } else {
//     yield tree
//   }
// }
//
// const tree = ['a', ['b', 'c'], ['d', 'e']]
//
// for (let x of iterTree(tree)) {
//   console.log(x)
// }
// // a
// // b
// // c
// // d
// // e

// ===== 3.1 yield\* 表达式 =====
// ;[...iterTree(tree)] // ["a", "b", "c", "d", "e"]

// ===== 3.1 yield\* 表达式 =====
// // 下面是二叉树的构造函数，
// // 三个参数分别是左树、当前节点和右树
// function Tree(left, label, right) {
//   this.left = left
//   this.label = label
//   this.right = right
// }
//
// // 下面是中序（inorder）遍历函数。
// // 由于返回的是一个遍历器，所以要用generator函数。
// // 函数体内采用递归算法，所以左树和右树要用yield*遍历
// function* inorder(t) {
//   if (t) {
//     yield* inorder(t.left)
//     yield t.label
//     yield* inorder(t.right)
//   }
// }
//
// // 下面生成二叉树
// function make(array) {
//   // 判断是否为叶节点
//   if (array.length == 1) return new Tree(null, array[0], null)
//   return new Tree(make(array[0]), array[1], make(array[2]))
// }
// let tree = make([[['a'], 'b', ['c']], 'd', [['e'], 'f', ['g']]])
//
// // 遍历二叉树
// var result = []
// for (let node of inorder(tree)) {
//   result.push(node)
// }
//
// result
// // ['a', 'b', 'c', 'd', 'e', 'f', 'g']

// ===== 3.2 作为对象属性的 Generator 函数 =====
// let obj = {
//   * myGeneratorMethod() {
//     ···
//   }
// };

// ===== 3.2 作为对象属性的 Generator 函数 =====
// let obj = {
//   myGeneratorMethod: function* () {
//     // ···
//   },
// }

// ===== 3.3 Generator 函数的this =====
// function* g() {}
//
// g.prototype.hello = function () {
//   return 'hi!'
// }
//
// let obj = g()
//
// obj instanceof g // true
// obj.hello() // 'hi!'

// ===== 3.3 Generator 函数的this =====
// function* g() {
//   this.a = 11
// }
//
// let obj = g()
// obj.next()
// obj.a // undefined

// ===== 3.3 Generator 函数的this =====
// function* F() {
//   yield (this.x = 2)
//   yield (this.y = 3)
// }
//
// new F()
// // TypeError: F is not a constructor

// ===== 3.3 Generator 函数的this =====
// function* F() {
//   this.a = 1
//   yield (this.b = 2)
//   yield (this.c = 3)
// }
// var obj = {}
// var f = F.call(obj)
//
// f.next() // Object {value: 2, done: false}
// f.next() // Object {value: 3, done: false}
// f.next() // Object {value: undefined, done: true}
//
// obj.a // 1
// obj.b // 2
// obj.c // 3

// ===== 3.3 Generator 函数的this =====
// function* F() {
//   this.a = 1
//   yield (this.b = 2)
//   yield (this.c = 3)
// }
// var f = F.call(F.prototype)
//
// f.next() // Object {value: 2, done: false}
// f.next() // Object {value: 3, done: false}
// f.next() // Object {value: undefined, done: true}
//
// f.a // 1
// f.b // 2
// f.c // 3

// ===== 3.3 Generator 函数的this =====
// function* gen() {
//   this.a = 1
//   yield (this.b = 2)
//   yield (this.c = 3)
// }
//
// function F() {
//   return gen.call(gen.prototype)
// }
//
// var f = new F()
//
// f.next() // Object {value: 2, done: false}
// f.next() // Object {value: 3, done: false}
// f.next() // Object {value: undefined, done: true}
//
// f.a // 1
// f.b // 2
// f.c // 3

// ===== 4.1 异步操作的同步化表达 =====
// function* loadUI() {
//   showLoadingScreen()
//   yield loadUIDataAsynchronously()
//   hideLoadingScreen()
// }
// var loader = loadUI()
// // 加载UI
// loader.next()
//
// // 卸载UI
// loader.next()

// ===== 4.1 异步操作的同步化表达 =====
// function* main() {
//   var result = yield request('http://some.url')
//   var resp = JSON.parse(result)
//   console.log(resp.value)
// }
//
// function request(url) {
//   makeAjaxCall(url, function (response) {
//     it.next(response)
//   })
// }
//
// var it = main()
// it.next()

// ===== 4.1 异步操作的同步化表达 =====
// function* numbers() {
//   let file = new FileReader('numbers.txt')
//   try {
//     while (!file.eof) {
//       yield parseInt(file.readLine(), 10)
//     }
//   } finally {
//     file.close()
//   }
// }

// ===== 4.2 控制流管理 =====
// step1(function (value1) {
//   step2(value1, function (value2) {
//     step3(value2, function (value3) {
//       step4(value3, function (value4) {
//         // Do something with value4
//       })
//     })
//   })
// })

// ===== 4.2 控制流管理 =====
// Promise.resolve(step1)
//   .then(step2)
//   .then(step3)
//   .then(step4)
//   .then(
//     function (value4) {
//       // Do something with value4
//     },
//     function (error) {
//       // Handle any error from step1 through step4
//     },
//   )
//   .done()

// ===== 4.2 控制流管理 =====
// function* longRunningTask(value1) {
//   try {
//     var value2 = yield step1(value1)
//     var value3 = yield step2(value2)
//     var value4 = yield step3(value3)
//     var value5 = yield step4(value4)
//     // Do something with value4
//   } catch (e) {
//     // Handle any error from step1 through step4
//   }
// }

// ===== 4.2 控制流管理 =====
// scheduler(longRunningTask(initialValue))
//
// function scheduler(task) {
//   var taskObj = task.next(task.value)
//   // 如果Generator函数未结束，就继续调用
//   if (!taskObj.done) {
//     task.value = taskObj.value
//     scheduler(task)
//   }
// }

// ===== 4.2 控制流管理 =====
// let steps = [step1Func, step2Func, step3Func]
//
// function* iterateSteps(steps) {
//   for (var i = 0; i < steps.length; i++) {
//     var step = steps[i]
//     yield step()
//   }
// }

// ===== 4.2 控制流管理 =====
// let jobs = [job1, job2, job3]
//
// function* iterateJobs(jobs) {
//   for (var i = 0; i < jobs.length; i++) {
//     var job = jobs[i]
//     yield* iterateSteps(job.steps)
//   }
// }

// ===== 4.2 控制流管理 =====
// for (var step of iterateJobs(jobs)) {
//   console.log(step.id)
// }

// ===== 4.2 控制流管理 =====
// var it = iterateJobs(jobs)
// var res = it.next()
//
// while (!res.done) {
//   var result = res.value
//   // ...
//   res = it.next()
// }

// ===== 4.3 部署 Iterator 接口 =====
// function* iterEntries(obj) {
//   let keys = Object.keys(obj)
//   for (let i = 0; i < keys.length; i++) {
//     let key = keys[i]
//     yield [key, obj[key]]
//   }
// }
//
// let myObj = { foo: 3, bar: 7 }
//
// for (let [key, value] of iterEntries(myObj)) {
//   console.log(key, value)
// }
//
// // foo 3
// // bar 7

// ===== 4.3 部署 Iterator 接口 =====
// function* makeSimpleGenerator(array) {
//   var nextIndex = 0
//
//   while (nextIndex < array.length) {
//     yield array[nextIndex++]
//   }
// }
//
// var gen = makeSimpleGenerator(['yo', 'ya'])
//
// gen.next().value // 'yo'
// gen.next().value // 'ya'
// gen.next().done // true

// ===== 4.4 作为数据结构 =====
// function* doStuff() {
//   yield fs.readFile.bind(null, 'hello.txt')
//   yield fs.readFile.bind(null, 'world.txt')
//   yield fs.readFile.bind(null, 'and-such.txt')
// }

// ===== 4.4 作为数据结构 =====
// for (task of doStuff()) {
//   // task是一个函数，可以像回调函数那样使用它
// }

// ===== 4.4 作为数据结构 =====
// function doStuff() {
//   return [
//     fs.readFile.bind(null, 'hello.txt'),
//     fs.readFile.bind(null, 'world.txt'),
//     fs.readFile.bind(null, 'and-such.txt'),
//   ]
// }

// ===== 4.5 Generator 与状态机 =====
// var ticking = true
// var clock = function () {
//   if (ticking) console.log('Tick!')
//   else console.log('Tock!')
//   ticking = !ticking
// }

// ===== 4.5 Generator 与状态机 =====
// var clock = function* () {
//   while (true) {
//     console.log('Tick!')
//     yield
//     console.log('Tock!')
//     yield
//   }
// }

// ===== 4.7 Generator 与上下文 =====
// function* gen() {
//   yield 1
//   return 2
// }
//
// let g = gen()
//
// console.log(g.next().value, g.next().value)

