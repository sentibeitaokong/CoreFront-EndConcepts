/*
 * 示例代码：collectionPrimitiveTypes.md
 * 来源文档：apps/docs/js/basic/collectionPrimitiveTypes.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 3. 迭代与高阶函数 (Iteration Methods) =====
// const nums = [1, 2, 3, 4]
// const sum = nums.reduce((acc, current) => acc + current, 0)
// // 0 是初始值，acc 是累加器
// // 结果: 10

// ===== Q1: 如何判断一个变量是数组？ =====
// // ✅ 最佳方案
// Array.isArray(obj)
//
// // ❌ 旧方案 (不可靠，跨 iframe 会失效)
// obj instanceof Array
//
// // ✅ 备用方案 (原理级)
// Object.prototype.toString.call(obj) === '[object Array]'

// ===== Q2: 如何去重？ =====
// const arr = [1, 2, 2, 3, 3]
//
// // ✅ 方案一：使用 Set (最快)
// const unique = [...new Set(arr)]
//
// // 方案二：使用 filter
// const unique2 = arr.filter((item, index) => arr.indexOf(item) === index)

// ===== Q4: 空位 (Sparse Array) 问题 =====
// const arr = [1, , 3] // 长度为 3，中间是空位 (empty slot)
//
// arr.forEach(i => console.log(i)) // 输出 1, 3 (forEach 跳过空位)
// arr.map(i => i * 2) // [2, empty, 6] (map 保留空位)
// arr.join('-') // "1--3" (空位被视为空字符串)

// ===== Q5: 数组也是引用类型 =====
// const a = [1, 2]
// const b = a
// b.push(3)
// console.log(a) // [1, 2, 3] -> a 也变了，因为 b 和 a 指向内存中同一个地址。

// ===== 1. 通过长度创建 (分配新内存) =====
// // 创建一个包含 16 个元素的 32 位整数数组
// // 占用内存 = 16 * 4 bytes = 64 bytes
// const i32 = new Int32Array(16)
// // 默认所有元素初始化为 0

// ===== 2. 通过数组/可迭代对象创建 =====
// const u8 = new Uint8Array([1, 2, 3])
// const fromSet = new Float32Array(new Set([1.1, 2.2]))

// ===== 3. 通过 TypedArray 复制 =====
// const x = new Int8Array([10, 20])
// const y = new Int8Array(x) // 复制数据，创建新的内存块

// ===== 3.4 基于 ArrayBuffer 创建视图 (最重要) =====
// const buffer = new ArrayBuffer(16) // 16 字节的内存
//
// // 视图1: 把这 16 字节看作 4 个 32 位整数
// const view1 = new Int32Array(buffer)
//
// // 视图2: 把这 16 字节看作 16 个 8 位整数
// const view2 = new Uint8Array(buffer)
//
// view1[0] = 1 // 修改第一个 32 位整数
// console.log(view2[0]) // 1 (底层的字节变了，所有视图都能看到变化)

// ===== Q4: 与普通数组的转换 =====
// // TypedArray -> Array
// const typed = new Uint8Array([1, 2, 3])
// const normal = [...typed] // 或者 Array.from(typed)
//
// // Array -> TypedArray
// const typed2 = new Uint8Array(normal)

// ===== 4. 对象迭代 =====
// // 遍历键
// for (const key of Object.keys(person)) {
//   console.log(key, person[key])
// }
//
// // 遍历值
// for (const value of Object.values(person)) {
//   console.log(value)
// }
//
// // 同时遍历键和值 (最佳实践)
// for (const [key, value] of Object.entries(person)) {
//   console.log(`${key}: ${value}`)
// }

// ===== 1. 创建一个空 Map =====
// const myMap = new Map()

// ===== 2.2 在创建时初始化 =====
// // 使用二维数组初始化
// const initialData = [
//   ['key1', 'value1'],
//   [123, 'this is a number key'],
//   [{ id: 1 }, 'this is an object key'],
// ]
//
// const myMap = new Map(initialData)
//
// console.log(myMap.get(123)) // "this is a number key"

// ===== 2. 核心方法 =====
// const userActivity = new Map()
//
// // 使用 set (支持链式调用)
// userActivity.set('user1', 'online').set('user2', 'away')
// console.log(userActivity.size) // 2
//
// // 使用 get
// console.log(userActivity.get('user1')) // "online"
// console.log(userActivity.get('user3')) // undefined
//
// // 使用 has
// console.log(userActivity.has('user2')) // true
// console.log(userActivity.has('user3')) // false
//
// // 使用 delete
// const wasDeleted = userActivity.delete('user2')
// console.log(wasDeleted) // true
// console.log(userActivity.size) // 1
//
// // 使用 clear
// userActivity.clear()
// console.log(userActivity.size) // 0

// ===== 3. 迭代方法 =====
// const roles = new Map([
//   ['alice', 'admin'],
//   ['bob', 'editor'],
// ])
//
// roles.forEach((role, user) => {
//   console.log(`${user}'s role is ${role}`)
// })
// // 输出:
// // "alice's role is admin"
// // "bob's role is editor"

// ===== 3. 迭代方法 =====
// // 默认遍历 entries [key, value]
// for (const [key, value] of roles) {
//   console.log(`${key}: ${value}`)
// }

// ===== 3. 迭代方法 =====
// const permissions = new Map([
//   ['admin', ['create', 'read', 'update', 'delete']],
//   ['editor', ['create', 'read', 'update']],
// ])
//
// // 遍历 keys
// for (const role of permissions.keys()) {
//   console.log(role) // 'admin', 'editor'
// }
//
// // 遍历 values
// for (const access of permissions.values()) {
//   console.log(access) // ['create', ...], ['create', ...]
// }
//
// // 使用扩展语法将迭代器转换为数组
// const allRoles = [...permissions.keys()] // ['admin', 'editor']
// const allAccessLevels = [...permissions.values()]

// ===== 1. Map -> Object =====
// const map = new Map([
//   ['name', 'Alice'],
//   ['age', 30],
// ])
//
// // 使用 Object.fromEntries() (ES2019+) - 推荐
// const obj = Object.fromEntries(map)
// // obj is { name: 'Alice', age: 30 }

// ===== 2. Object -> Map =====
// const obj = {
//   name: 'Bob',
//   city: 'London',
// }
//
// // 使用 Object.entries()
// const map = new Map(Object.entries(obj))
// // map is Map(2) { 'name' => 'Bob', 'city' => 'London' }

// ===== 1. 创建一个空 Set =====
// const mySet = new Set()

// ===== 2. 在创建时初始化 =====
// // 使用数组初始化 (最常见)
// const arrayWithDuplicates = [1, 2, 3, 3, 'a', 'a', { id: 1 }]
// const mySet = new Set(arrayWithDuplicates)
//
// console.log(mySet) // Set(5) { 1, 2, 3, 'a', { id: 1 } }
//
// // 使用字符串初始化
// const charSet = new Set('hello')
// console.log(charSet) // Set(4) { 'h', 'e', 'l', 'o' }

// ===== 2. 核心方法 =====
// const userTags = new Set()
//
// // 使用 add (支持链式调用)
// userTags.add('javascript').add('Frontend')
// console.log(userTags.size) // 2
//
// // 再次添加重复值，会被忽略
// userTags.add('javascript')
// console.log(userTags.size) // 2
//
// // 使用 has
// console.log(userTags.has('javascript')) // true
// console.log(userTags.has('Backend')) // false
//
// // 使用 delete
// const wasDeleted = userTags.delete('Frontend')
// console.log(wasDeleted) // true
// console.log(userTags.size) // 1
//
// // 使用 clear
// userTags.clear()
// console.log(userTags.size) // 0

// ===== 3. 迭代方法 =====
// const letters = new Set(['a', 'b', 'c'])
//
// letters.forEach((value, key, set) => {
//   console.log(`value: ${value}, key: ${key}`)
// })
// // 输出:
// // "value: a, key: a"
// // "value: b, key: b"
// // "value: c, key: c"

// ===== 3. 迭代方法 =====
// for (const letter of letters) {
//   console.log(letter) // 'a', 'b', 'c'
// }

// ===== 3. 迭代方法 =====
// const numbers = new Set([10, 20, 30])
//
// // keys() 和 values() 行为相同
// for (const value of numbers.values()) {
//   console.log(value) // 10, 20, 30
// }
//
// // entries()
// for (const entry of numbers.entries()) {
//   console.log(entry) // [10, 10], [20, 20], [30, 30]
// }
//
// // 使用扩展语法将迭代器转换为数组
// const numArray = [...numbers] // [10, 20, 30]

// ===== 2. 模拟私有属性 =====
// const privateData = new WeakMap()
//
// class Person {
//   constructor(name, age) {
//     this.name = name // public data
//
//     // Store private data in the WeakMap
//     privateData.set(this, {
//       secretAge: age,
//       secretId: Math.random(),
//     })
//   }
//
//   // Public method to reveal some private data
//   revealAge() {
//     const privates = privateData.get(this)
//     if (privates) {
//       console.log(`(Shhh, my real age is ${privates.secretAge})`)
//     }
//   }
// }
//
// let alice = new Person('Alice', 30)
// alice.revealAge() // (Shhh, my real age is 30)
//
// // You cannot access privateData from the outside
// console.log(privateData.get(alice).secretId) // This is possible, but hides the data from direct access on the instance
//
// // Now, let's see the garbage collection in action
// alice = null
//
// // 当 `alice` 变量被设置为 null 后，`Person` 实例不再有任何强引用。
// // 垃圾回收器下次运行时，会回收这个实例。
// // 同时，privateData 中与之关联的键值对也会被自动移除，不会造成内存泄漏。

// ===== 2. 追踪 DOM 节点 [html] =====
// <button id="btn1">Button 1</button> <button id="btn2">Button 2</button>

// ===== 2. 追踪 DOM 节点 =====
// const clickedNodes = new WeakSet()
// const btn1 = document.getElementById('btn1')
// const btn2 = document.getElementById('btn2')
//
// function processClick(event) {
//   const node = event.currentTarget
//
//   if (clickedNodes.has(node)) {
//     console.log('This node has already been processed.')
//     return
//   }
//
//   console.log('Processing this node for the first time...')
//   clickedNodes.add(node)
// }
//
// btn1.addEventListener('click', processClick)
// btn2.addEventListener('click', processClick)
//
// // 假设一段时间后，我们从 DOM 中移除了 btn2
// // btn2.remove();
//
// // 当 btn2 从 DOM 中被移除，并且没有其他 JavaScript 变量引用它时，
// // 垃圾回收器会回收这个 DOM 节点对象。
// // 同时，clickedNodes 中对 btn2 的弱引用也会自动消失，内存被释放。
// // 如果用的是普通 Set，即使 DOM 节点被移除，Set 依然会持有它的引用，导致内存泄漏。

