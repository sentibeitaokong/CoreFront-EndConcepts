# Set 和 Map 数据结构

## 1. Set

### 1.1 基本用法

ES6 提供了新的数据结构 Set，类似数组，但成员值**唯一**，没有重复值。`Set` 本身是构造函数。

```js
const s = new Set()
;[2, 3, 5, 4, 5, 2, 2].forEach(x => s.add(x))
// 遍历 s 输出：2 3 5 4
```

`Set()` 可接受数组（或任何 iterable 结构）作为参数初始化：

```js
const set = new Set([1, 2, 3, 4, 4])
;[...set] // [1, 2, 3, 4]

const items = new Set([1, 2, 3, 4, 5, 5, 5, 5])
items.size // 5
```

去除数组重复成员的一种简单方法：

```js
;[...new Set(array)]
```

也可去除字符串重复字符：`[...new Set('ababbc')].join('')` → `"abc"`。

向 Set 加值时不发生类型转换（`5` 和 `"5"` 不同）。判断是否相同使用 **Same-value-zero equality**（近似 `===`），区别是 `NaN` 等于自身：

```js
let set = new Set()
set.add(NaN)
set.add(NaN)
set // Set {NaN}（两个 NaN 视为相等）

set.add({})
set.add({})
set.size // 2（两个对象总不相等）
```

`Array.from()` 也可将 Set 转为数组，从而去重：

```js
function dedupe(array) {
  return Array.from(new Set(array))
}
dedupe([1, 1, 2, 3]) // [1, 2, 3]
```

### 1.2 [Set 实例的属性和方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Set)

**属性**：

[width(47,53)]

| 属性 / 方法                   | 说明                                |
| :---------------------------- | :---------------------------------- |
| `Set.prototype.constructor`   | 构造函数，默认就是 `Set` 函数       |
| `Set.prototype.size`          | 返回成员总数                        |
| `Set.prototype.add(value)`    | 添加值，返回 Set 本身（可链式调用） |
| `Set.prototype.delete(value)` | 删除值，返回布尔值（是否删除成功）  |
| `Set.prototype.has(value)`    | 返回布尔值，表示是否包含该值        |
| `Set.prototype.clear()`       | 清除所有成员，无返回值              |

```js
s.add(1).add(2).add(2)
s.size // 2
s.has(1) // true
s.delete(2) // true
```

判断是否包含某键，`Object` 与 `Set` 的写法对比：

```js
// 对象的写法
const properties = { width: 1, height: 1 }
if (properties[someName]) {
  /* ... */
}

// Set 的写法
const properties = new Set()
properties.add('width').add('height')
if (properties.has(someName)) {
  /* ... */
}
```

### 1.3 遍历操作

四个遍历方法：

- `Set.prototype.keys()`：返回键名的遍历器
- `Set.prototype.values()`：返回键值的遍历器
- `Set.prototype.entries()`：返回键值对的遍历器
- `Set.prototype.forEach()`：用回调函数遍历每个成员

Set 没有键名（键名即键值），所以 `keys()` 和 `values()` 行为完全一致；`entries()` 每次输出 `[value, value]`。**遍历顺序就是插入顺序**。

Set 默认遍历器就是 `values`：

```js
Set.prototype[Symbol.iterator] === Set.prototype.values // true
```

因此可直接用 `for...of` 遍历 Set。

`forEach` 的回调参数与数组一致，依次为**键值、键名、集合本身**（键值=键名）：

```js
let set = new Set([1, 4, 9])
set.forEach((value, key) => console.log(key + ' : ' + value))
// 1 : 1  ...
```

**遍历的应用**：扩展运算符内部用 `for...of`，可用于 Set；结合 `map`/`filter` 间接操作，可轻松实现并集、交集、差集：

```js
let a = new Set([1, 2, 3])
let b = new Set([4, 3, 2])

// 并集
new Set([...a, ...b]) // {1, 2, 3, 4}
// 交集
new Set([...a].filter(x => b.has(x))) // {2, 3}
// 差集（a 相对 b）
new Set([...a].filter(x => !b.has(x))) // {1}
```

遍历中同步改变原 Set，可用 `new Set([...set].map(...))` 或 `new Set(Array.from(set, val => ...))`。

### 1.4 集合运算

[ES2025](https://github.com/tc39/proposal-set-methods) 为 Set 添加了集合运算方法（参数都必须是 Set 结构或类 Set 结构）：

[width(77,23)]

| 方法                                       | 说明       |
| :----------------------------------------- | :--------- |
| `Set.prototype.intersection(other)`        | 交集       |
| `Set.prototype.union(other)`               | 并集       |
| `Set.prototype.difference(other)`          | 差集       |
| `Set.prototype.symmetricDifference(other)` | 对称差集   |
| `Set.prototype.isSubsetOf(other)`          | 是否为子集 |
| `Set.prototype.isSupersetOf(other)`        | 是否为超集 |
| `Set.prototype.isDisjointFrom(other)`      | 是否不相交 |

```js
const frontEnd = new Set(['JavaScript', 'HTML', 'CSS'])
const backEnd = new Set(['Python', 'Java', 'JavaScript'])

frontEnd.union(backEnd) // {"JavaScript", "HTML", "CSS", "Python", "Java"}
frontEnd.intersection(backEnd) // {"JavaScript"}
frontEnd.difference(backEnd) // {"HTML", "CSS"}
frontEnd.symmetricDifference(backEnd) // {"HTML", "CSS", "Python", "Java"}
```

返回结果中成员顺序由添加到集合的顺序决定。任何集合都是自身的子集和超集。

## 2. WeakSet

### 2.1 含义

WeakSet 结构与 Set 类似，但有两个区别：

1. **成员只能是对象和 Symbol 值**，不能是其他类型。
2. **弱引用**：垃圾回收机制不考虑 WeakSet 对对象的引用，其他引用消失后对象会被回收，WeakSet 里的引用自动消失。

```js
const ws = new WeakSet()
ws.add(1) // 报错
ws.add(Symbol()) // 不报错
```

因为成员随时可能消失、个数取决于垃圾回收时机，**WeakSet 不可遍历**。适合临时存放一组对象或与对象绑定的信息，防止内存泄漏。

### 2.2 [语法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)

```js
const ws = new WeakSet()
```

构造函数可接受数组（或任何 Iterable 结构）作为参数，数组的**成员**（须为对象）会成为 WeakSet 成员：

```js
const a = [
  [1, 2],
  [3, 4],
]
const ws = new WeakSet(a) // WeakSet {[1,2], [3,4]}

const b = [3, 4]
new WeakSet(b) // TypeError（成员不是对象）
```

三个方法：

[width(48,52)]

| 方法                              | 说明                                    |
| :-------------------------------- | :-------------------------------------- |
| `WeakSet.prototype.add(value)`    | 添加成员，返回 WeakSet 本身             |
| `WeakSet.prototype.delete(value)` | 删除成员，成功返回 `true`，否则 `false` |
| `WeakSet.prototype.has(value)`    | 返回布尔值，表示是否包含该值            |

没有 `size` 属性，也无法遍历成员。典型用途：存储 DOM 节点（节点移除时不引发内存泄漏），或校验方法只能在实例上调用：

```js
const foos = new WeakSet()
class Foo {
  constructor() {
    foos.add(this)
  }
  method() {
    if (!foos.has(this)) {
      throw new TypeError('只能在 Foo 的实例上调用！')
    }
  }
}
```

## 3. Map

### 3.1 含义和基本用法

Object 本质是键值对集合，但键只能是字符串（其他类型会被转为字符串）。Map 的键可以是**任意类型**（包括对象），提供"值—值"的对应：

```js
const m = new Map()
const o = { p: 'Hello World' }
m.set(o, 'content')
m.get(o) // "content"
```

Map 构造函数可接受一个数组（成员为 `[key, value]` 二元数组）初始化，任何具有 Iterator 接口且成员为双元素数组的结构（Set、Map 等）都可作为参数：

```js
const map = new Map([
  ['name', '张三'],
  ['title', 'Author'],
])
map.get('name') // "张三"
```

对同一个键多次赋值，后面的值覆盖前面的值；读取未知键返回 `undefined`。

**键相等规则**：

- 只有**同一个对象的引用**才视为同一个键（跟内存地址绑定）：

  ```js
  const map = new Map()
  map.set(['a'], 555)
  map.get(['a']) // undefined（两个不同的数组实例）
  ```

- 简单类型（数字、字符串、布尔值）只要**严格相等**即视为一个键：`0` 和 `-0` 是一个键，`true` 和 `'true'` 是两个键，`undefined` 和 `null` 是两个键，`NaN` 视为同一个键。

### 3.2 [实例的属性和操作方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map)

[width(37,63)]

| 属性 / 方法               | 说明                                             |
| :------------------------ | :----------------------------------------------- |
| `size`                    | 返回成员总数                                     |
| `Map.prototype.set(k, v)` | 设置键值对，返回整个 Map（可链式），已有键则更新 |
| `Map.prototype.get(k)`    | 读取键值，找不到返回 `undefined`                 |
| `Map.prototype.has(k)`    | 返回布尔值，表示是否包含该键                     |
| `Map.prototype.delete(k)` | 删除某键，成功返回 `true`                        |
| `Map.prototype.clear()`   | 清除所有成员，无返回值                           |

```js
let map = new Map().set(1, 'a').set(2, 'b').set(3, 'c')
map.get(2) // "b"
map.has(3) // true
map.delete(3) // true
```

### 3.3 遍历方法

- `Map.prototype.keys()`：返回键名的遍历器
- `Map.prototype.values()`：返回键值的遍历器
- `Map.prototype.entries()`：返回所有成员的遍历器
- `Map.prototype.forEach()`：遍历所有成员

**遍历顺序就是插入顺序**，默认遍历器是 `entries`：

```js
map[Symbol.iterator] === map.entries // true

for (let [key, value] of map) {
  console.log(key, value)
}
```

Map 转数组最快捷的方式是扩展运算符：

```js
[...map.keys()] // [1, 2, 3]
[...map.values()] // ['one', 'two', 'three']
[...map.entries()] // [[1,'one'], [2,'two'], [3,'three']]
```

Map 本身没有 `map`/`filter`，可转数组后操作再转回：

```js
const map1 = new Map([...map0].filter(([k, v]) => k < 3))
const map2 = new Map([...map0].map(([k, v]) => [k * 2, '_' + v]))
```

`forEach` 回调参数依次为**键值、键名、map 本身**，第二个参数可绑定 `this`。

### 3.4 与其他数据结构的互相转换

[width(19,81)]

| 转换       | 方法                                                                |
| :--------- | :------------------------------------------------------------------ |
| Map → 数组 | `[...myMap]`                                                        |
| 数组 → Map | `new Map([[k, v], ...])`                                            |
| Map → 对象 | 键全为字符串时：`Object.create(null)` + 遍历赋值，键会被转成字符串  |
| 对象 → Map | `new Map(Object.entries(obj))`                                      |
| Map → JSON | 键全为字符串 → 对象 JSON；键含非字符串 → `JSON.stringify([...map])` |
| JSON → Map | `new Map(JSON.parse(str))`（JSON 为二元数组数组时）                 |

## 4. WeakMap

### 4.1 含义

WeakMap 与 Map 的区别有两点：

1. **键名只能是对象（`null` 除外）和 Symbol 值**，不接受其他类型。
2. **键名是弱引用**（不计入垃圾回收机制）。

```js
const map = new WeakMap()
map.set(1, 2) // 报错
map.set(null, 2) // 报错
map.set(Symbol(), 2) // 不报错
```

用途：往对象上存数据又不想干扰垃圾回收（如 DOM 元素上添加数据，元素被清除时对应记录自动消失），防止内存泄漏。

**注意**：WeakMap 弱引用的只是**键名**，键值仍是正常引用：

```js
const wm = new WeakMap()
let key = {}
let obj = { foo: 1 }
wm.set(key, obj)
obj = null
wm.get(key) // { foo: 1 }（键值仍被强引用保留）
```

### 4.2 [WeakMap 的语法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

WeakMap 与 Map 的 API 区别：

- 没有遍历操作（`keys()`/`values()`/`entries()`），也没有 `size` 属性（键名不可预测、随时可能消失）。
- 无法清空，不支持 `clear`。

只有四个方法可用：`get()`、`set()`、`has()`、`delete()`。

```js
const wm = new WeakMap()
wm.size // undefined
wm.forEach // undefined
wm.clear // undefined
```

### 4.3 WeakMap 的示例

WeakMap 的引用消失难以直接观察。可通过 Node 的 `--expose-gc` + `process.memoryUsage()` 验证：将一个大数组作为键名存入 WeakMap 后，把外部变量置 `null` 再手动 GC，堆内存会明显回落——说明 WeakMap 的键名弱引用没有阻止回收。Chrome DevTools 的 Memory 面板（垃圾桶按钮强制 GC）也能观察。

### 4.4 WeakMap 的用途

**（1）DOM 节点作为键名**：节点删除时对应状态自动消失，无泄漏风险。

```js
let myWeakmap = new WeakMap()
myWeakmap.set(document.getElementById('logo'), { timesClicked: 0 })
document.getElementById('logo').addEventListener('click', function () {
  let logoData = myWeakmap.get(document.getElementById('logo'))
  logoData.timesClicked++
})
```

**（2）部署私有属性**：

```js
const _counter = new WeakMap()
const _action = new WeakMap()

class Countdown {
  constructor(counter, action) {
    _counter.set(this, counter)
    _action.set(this, action)
  }
  dec() {
    let counter = _counter.get(this)
    if (counter < 1) return
    counter--
    _counter.set(this, counter)
    if (counter === 0) _action.get(this)()
  }
}
const c = new Countdown(2, () => console.log('DONE'))
c.dec()
c.dec() // DONE
```

## 5. [WeakRef](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/WeakRef)

[ES2021](https://github.com/tc39/proposal-weakrefs) 提供了 WeakRef 对象，用于直接创建对象的弱引用：

```js
let target = {}
let wr = new WeakRef(target)
```

`wr` 是对 `target` 的弱引用，不会妨碍其被垃圾回收。实例的 `deref()` 方法：原始对象存在则返回它，已被回收则返回 `undefined`：

```js
let obj = wr.deref()
if (obj) {
  // target 未被回收
}
```

弱引用的一大用途是作为**缓存**，未被清除时从缓存取值，清除后自动失效：

```js
function makeWeakCached(f) {
  const cache = new Map()
  return key => {
    const ref = cache.get(key)
    if (ref) {
      const cached = ref.deref()
      if (cached !== undefined) return cached
    }
    const fresh = f(key)
    cache.set(key, new WeakRef(fresh))
    return fresh
  }
}
```

> 标准规定，用 `WeakRef()` 创建弱引用后，本轮事件循环内原始对象肯定不会被清除，只会在后续事件循环中被清除。

## 6. 常见问题与面试题

### 6.1 Set 如何判断成员是否重复？

使用 **Same-value-zero equality**（近似 `===`），关键区别：`NaN` 等于自身、`0` 等于 `-0`；对象按引用比较，两个内容相同的对象不相等。

### 6.2 Set 与数组如何互相转换？如何给数组去重？

- Set → 数组：`[...set]` 或 `Array.from(set)`。
- 数组 → Set：`new Set(array)`。
- 去重：`[...new Set(array)]` 或 `Array.from(new Set(array))`。

### 6.3 WeakSet 与 Set 的区别？

[width(24,38,38)]

| 区别        | Set                  | WeakSet              |
| :---------- | :------------------- | :------------------- |
| 成员类型    | 任意值               | 仅对象和 Symbol      |
| 引用类型    | 强引用               | 弱引用（不阻止回收） |
| 可遍历      | ✅（keys/values 等） | ❌                   |
| `size` 属性 | ✅                   | ❌                   |
| 方法        | add/delete/has/clear | 仅 add/delete/has    |

### 6.4 Map 与普通对象（Object）有什么区别？

[width(14,46,40)]

| 区别   | Object                        | Map                         |
| :----- | :---------------------------- | :-------------------------- |
| 键类型 | 仅字符串 / Symbol             | 任意类型（含对象）          |
| 键顺序 | 不保证（数字键特殊排序）      | 保证插入顺序                |
| 大小   | 需手动 `Object.keys().length` | `size` 属性                 |
| 遍历   | 需转换                        | 直接 `for...of` / `forEach` |
| 性能   | 频繁增删键时较弱              | 频繁增删键时更优            |

### 6.5 Map 的键比较规则是什么？

- 对象键：**按引用**，同一个对象引用才是同一个键（`map.get(['a'])` 取不到 `map.set(['a'], ...)`）。
- 简单类型键：严格相等即可，`0` 与 `-0` 是一个键，`NaN` 视为同一个键，`true` 与 `'true'`、`undefined` 与 `null` 是不同键。

### 6.6 WeakMap 与 Map 的区别？弱引用的是什么？

WeakMap 与 Map 的区别：键名只能是对象/Symbol；键名是**弱引用**；不可遍历、无 `size`、无 `clear`，只有 `get`/`set`/`has`/`delete` 四个方法。弱引用的**只是键名**，键值仍是正常（强）引用。

### 6.7 WeakMap 有哪些典型用途？

1. 在 **DOM 节点**上附加数据（节点移除时数据自动消失，防内存泄漏）。
2. 部署**私有属性**（配合 class）。
3. 缓存（结合 WeakRef），条目可被 GC 自动回收。
