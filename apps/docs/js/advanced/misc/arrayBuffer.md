---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# ArrayBuffer

`ArrayBuffer`、`TypedArray` 视图和 `DataView` 视图是 JavaScript 操作二进制数据的接口，统称二进制数组。它们属于独立规格（2011 年 2 月发布），ES6 纳入 ECMAScript 规格并增加了新方法。

这个接口源自 WebGL：浏览器与显卡之间要大量、实时地交换数据，通信必须是二进制。文本格式传一个 32 位整数，两端都要做格式转化，非常耗时；直接操作字节把 4 个字节原封不动送入显卡，性能会大幅提升。

二进制数组因此诞生：它像 C 语言的数组，可以以下标直接操作内存，让 JavaScript 能与操作系统原生接口做二进制通信。

二进制数组由三类对象组成。

**（1）`ArrayBuffer`对象**：一段二进制内存，必须通过“**视图**”操作；“**视图**”部署了数组接口，可以用数组方法操作内存。

**（2）`TypedArray`视图**：包括 12 种类型，比如`Uint8Array`（无符号 8 位整数）、`Int16Array`（16 位整数）、`Float32Array`（32 位浮点数）等。

**（3）`DataView`视图**：可以自定义复合格式，比如第一个字节是 Uint8、第二三个字节是 Int16、第四个字节起是 Float32，还可以自定义字节序。

`ArrayBuffer` 代表原始二进制数据，`TypedArray` 读写简单类型，`DataView` 读写复杂类型。

`TypedArray`视图支持的数据类型一共有12种。

[width(16,15,43,26)]

| 数据类型  | 字节长度 | 含义                             | 对应的 C 语言类型 |
| --------- | -------- | -------------------------------- | ----------------- |
| Int8      | 1        | 8 位带符号整数                   | signed char       |
| Uint8     | 1        | 8 位不带符号整数                 | unsigned char     |
| Uint8C    | 1        | 8 位不带符号整数（自动过滤溢出） | unsigned char     |
| Int16     | 2        | 16 位带符号整数                  | short             |
| Uint16    | 2        | 16 位不带符号整数                | unsigned short    |
| Int32     | 4        | 32 位带符号整数                  | int               |
| Uint32    | 4        | 32 位不带符号的整数              | unsigned int      |
| BigInt64  | 8        | 64 位有符号整数                  |                   |
| BigUint64 | 8        | 64 位无符号整数                  |                   |
| Float16   | 2        | 16 位浮点数                      |                   |
| Float32   | 4        | 32 位浮点数                      | float             |
| Float64   | 8        | 64 位浮点数                      | double            |

二进制数组不是真正的数组，而是类似数组的对象。

很多浏览器 API 用到了二进制数组，常见的有：

- [Canvas](#canvas)
- [Fetch API](#fetch-api)
- [File API](#file-api)
- [WebSockets](#websocket)
- [XMLHttpRequest](#ajax)

## 1. ArrayBuffer 对象

### 1.1 ArrayBuffer定义

`ArrayBuffer` 是一个构造函数，用来分配一段连续内存存放二进制数据；这段内存不能直接读写，只能通过视图（`TypedArray` 与 `DataView`）以指定格式解读。

```js
const buf = new ArrayBuffer(32)
```

参数是所需内存大小（单位字节），生成的每个字节默认都是 0。

读写前必须先建视图：`DataView` 的创建需要传入 `ArrayBuffer` 实例作为参数。

```js
const buf = new ArrayBuffer(32)
const dataView = new DataView(buf)
dataView.getUint8(0) // 0
```

以无符号 8 位整数格式从头读一个字节，得到 0。

同一段内存上可以同时建立多个视图：

```js
const buffer = new ArrayBuffer(12)

const x1 = new Int32Array(buffer)
x1[0] = 1
const x2 = new Uint8Array(buffer)
x2[0] = 2

x1[0] // 2
```

`x1`、`x2` 是同一段内存上的两种视图（32 位带符号 / 8 位无符号整数），一个视图改底层内存，另一个立刻体现出来。

`TypedArray` 的构造函数除了接受 `ArrayBuffer` 实例，还可以接受普通数组，直接分配内存生成底层 `ArrayBuffer`，同时完成赋值。

```js
const typedArray = new Uint8Array([0, 1, 2])
typedArray.length // 3

typedArray[0] = 5
typedArray // [5, 1, 2]
```

### 1.2 [ArrayBuffer的常用方法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)

#### 1.2.1 ArrayBuffer.prototype.byteLength

`ArrayBuffer`实例的`byteLength`属性返回所分配内存区域的字节长度。

```js
const buffer = new ArrayBuffer(32)
buffer.byteLength
// 32
```

要分配的内存区域很大时有可能失败（没有那么多连续空余内存），所以有必要检查是否分配成功。

```js
if (buffer.byteLength === n) {
  // 成功
} else {
  // 失败
}
```

#### 1.2.2 ArrayBuffer.prototype.slice()

`ArrayBuffer` 实例的`slice`方法把内存区域的一部分拷贝成新的`ArrayBuffer`对象。

```js
const buffer = new ArrayBuffer(8)
const newBuffer = buffer.slice(0, 3)
```

拷贝前 3 个字节生成新的`ArrayBuffer`对象，分两步：先分配新内存，再拷贝过去。

`slice` 接受两个参数：拷贝开始的字节序号（含该字节）和截止的字节序号（不含该字节）。省略第二个参数则默认到结尾。

除了`slice`，`ArrayBuffer` 不提供任何直接读写内存的方法，只允许在其上建立视图再读写。

#### 1.2.3 ArrayBuffer.isView()

`ArrayBuffer.isView()` 返回布尔值，表示参数是否为 `ArrayBuffer` 的视图实例（即 `TypedArray` 或 `DataView`）。

```js
const buffer = new ArrayBuffer(8)
ArrayBuffer.isView(buffer) // false

const v = new Int32Array(buffer)
ArrayBuffer.isView(v) // true
```

### 1.3 长度可变与所有权转移

这一节的方法是 ES2024 前后才补齐的，解决两个老问题：内存一旦分配就不能再变；大块数据交给 Worker 会被复制一遍。

#### 1.3.1 可调整长度的 ArrayBuffer

`ArrayBuffer` 构造函数可以接受第二个参数 `{ maxByteLength }`，得到一个长度可变的实例。

```js
const buffer = new ArrayBuffer(16, { maxByteLength: 64 })

buffer.resizable // true
buffer.byteLength // 16
buffer.maxByteLength // 64

buffer.resize(32)
buffer.byteLength // 32
```

几点注意。

- 只有带 `maxByteLength` 创建的实例才可调整；其他实例的 `resizable` 是 `false`，对它调用 `resize()` 会抛 `TypeError`。
- 长度只能增长到 `maxByteLength` 以内，超出去同样抛 `TypeError`；缩小则是直接丢弃后面的字节。
- 调整之后，创建时没有指定长度的视图“跟随长度”，buffer 变大它的 `length` 也跟着变大；指定了长度（或偏移）的视图长度定死，不会跟着变。
- 缩容之后，通过旧视图访问超出的部分一律按越界规则处理（读得到 `undefined`，写入被忽略）。

```js
const buffer = new ArrayBuffer(16, { maxByteLength: 64 })
const tracking = new Uint8Array(buffer) // 没有指定长度，跟随 buffer
const fixed = new Uint8Array(buffer, 0, 8) // 指定了长度，长度定死

tracking.length // 16
fixed.length // 8

buffer.resize(32)
tracking.length // 32，跟着变大了
fixed.length // 8，不变
```

#### 1.3.2 所有权转移（transfer）

`ArrayBuffer.prototype.transfer()` 不复制字节，把整段内存“过户”给新的 `ArrayBuffer` 对象，原对象随即变为已分离（detached）状态。

```js
const buffer = new ArrayBuffer(8)
const view = new Uint8Array(buffer)

const moved = buffer.transfer()

buffer.detached // true
buffer.byteLength // 0
view.byteLength // 0

moved.byteLength // 8，字节内容原样保留
```

分离之后原对象与它的视图长度都变成 0，再读写会抛 `TypeError`。同族方法共三个，区别只在于是否复制、结果长度是否可变。

- `transfer(newByteLength?)`：返回长度**可变**（`resizable`）的新实例，不复制字节。
- `transferToFixedLength(newByteLength?)`：返回长度**固定**的新实例，同样不复制字节。
- `slice(start, end)`：与 transfer 相反，`slice` 会**复制**字节，原对象保持可用。

`postMessage` 的第二个参数就是转移清单（transfer list）。把 `ArrayBuffer` 放进去，数据就不会被复制。

```js
const buffer = new ArrayBuffer(1024)
const view = new Uint8Array(buffer)

// 把 buffer 的所有权交给 Worker，主线程不再持有这段内存
worker.postMessage(buffer, [buffer])

buffer.byteLength // 0
view.byteLength // 0
```

结构化克隆与所有权转移的区别，5.6 节还会展开。

### 1.4 内存占用与分配上限

`byteLength` 是这段内存实际占用的字节数，也是唯一的内存成本；对象头部与视图的开销都可忽略，估算很简单。

> 占用字节数 = 元素个数 × 每个元素的字节数 = `typedArray.length * TypedArray.BYTES_PER_ELEMENT`

[width(53,13,13,21)]

| 视图                                                | 每个元素字节数 | 100 万个元素占用 | 能精确表示的整数范围         |
| --------------------------------------------------- | -------------- | ---------------- | ---------------------------- |
| `Int8Array` / `Uint8Array` / `Uint8ClampedArray`    | 1              | 1 MB             | -128 ～ 127 / 0 ～ 255       |
| `Int16Array` / `Uint16Array` / `Float16Array`       | 2              | 2 MB             | -32768 ～ 32767 / 0 ～ 65535 |
| `Int32Array` / `Uint32Array` / `Float32Array`       | 4              | 4 MB             | -2³¹ ～ 2³¹-1 / 0 ～ 2³²-1   |
| `BigInt64Array` / `BigUint64Array` / `Float64Array` | 8              | 8 MB             | 64 位整数的全部范围          |

普通数组即使全是同一种基本类型，每个元素也至少占 8 个字节，元素数量变化时还可能重新分配、搬移内存。数据量大且类型统一时，TypedArray 的内存优势是压倒性的。

分配失败很常见，尤其是移动端。

- 长度超过实现允许的上限时 `new ArrayBuffer(length)` 直接抛 `RangeError`。上限由实现决定、各版本差异很大，并非“**可寻址范围**”那么简单，真正的限制是能否拿出连续的虚拟内存，所以同样的代码在桌面端能跑、移动端可能就抛错。
- 上限之内也可能因为内存不足或地址空间碎片化而分配失败，同样抛 `RangeError`，消息通常是 `Array buffer allocation failed`。

```js
try {
  const huge = new ArrayBuffer(Number.MAX_SAFE_INTEGER)
} catch (e) {
  console.log(e.constructor.name) // 'RangeError'
}
```

## 2. TypedArray 视图

### 2.1 概述

同一段内存可以有不同的解读方式，这就是“**视图**”（view）。`ArrayBuffer` 有两种视图：`TypedArray` 的成员是同一数据类型，`DataView` 的成员可以是不同数据类型。

目前`TypedArray`视图一共包括 12 种类型，每一种都是一种构造函数。

- 构造函数共 12 个：`Int8Array`、`Uint8Array`、`Uint8ClampedArray`、`Int16Array`、`Uint16Array`、`Int32Array`、`Uint32Array`、`BigInt64Array`、`BigUint64Array`、`Float16Array`、`Float32Array`、`Float64Array`，各类型占用的字节数与含义见上表。

这 12 个构造函数生成的数组统称`TypedArray`视图，很像普通数组：有`length`，能用`[]`取元素，数组方法都能用。差异主要在以下方面。

- TypedArray 数组的所有成员都是同一种类型。
- TypedArray 数组的成员是连续的，不会有空位。
- TypedArray 数组成员的默认值为 0：`new Array(10)` 返回 10 个空位，`new Uint8Array(10)` 返回 10 个 0。
- TypedArray 数组只是一层视图，本身不储存数据，数据都在底层`ArrayBuffer`对象中，要获取底层对象必须用`buffer`属性。

### 2.2 构造函数

这些构造函数有多种用法。

#### 2.2.1 TypedArray(buffer, byteOffset=0, length?)

同一个`ArrayBuffer`对象之上，可以按不同数据类型建立多个视图。

```js
// 创建一个8字节的ArrayBuffer
const b = new ArrayBuffer(8)

// 创建一个指向b的Int32视图，开始于字节0，直到缓冲区的末尾
const v1 = new Int32Array(b)

// 创建一个指向b的Uint8视图，开始于字节2，直到缓冲区的末尾
const v2 = new Uint8Array(b, 2)

// 创建一个指向b的Int16视图，开始于字节2，长度为2
const v3 = new Int16Array(b, 2, 2)
```

视图的构造函数可以接受三个参数：

- 第一个参数（必需）：视图对应的底层`ArrayBuffer`对象。
- 第二个参数（可选）：视图开始的字节序号，默认从 0 开始。
- 第三个参数（可选）：视图包含的数据个数，默认直到本段内存区域结束。

三个视图互相重叠；任一视图修改内存，都会在另外两个上反映出来。

注意，`byteOffset`必须与所要建立的数据类型一致，否则会报错。

```js
const buffer = new ArrayBuffer(8)
const i16 = new Int16Array(buffer, 1)
// Uncaught RangeError: start offset of Int16Array should be a multiple of 2
```

带符号的 16 位整数占两个字节，所以`byteOffset`必须能被 2 整除。

想从任意字节开始解读`ArrayBuffer`必须用`DataView`，因为`TypedArray`只提供 12 种固定的解读格式。

#### 2.2.2 TypedArray(length)

视图还可以不通过`ArrayBuffer`对象，直接分配内存而生成。

```js
const f64a = new Float64Array(8)
f64a[0] = 10
f64a[1] = 20
f64a[2] = f64a[0] + f64a[1]
```

参数是成员个数（这里共 64 字节）。

#### 2.2.3 TypedArray(typedArray)

TypedArray 数组的构造函数可以接受另一个`TypedArray`实例作为参数。

```js
const typedArray = new Int8Array(new Uint8Array(4))
```

注意，新数组只复制参数数组的值，底层内存不同：它开辟一段新内存，不在原数组的内存上建立视图。

```js
const x = new Int8Array([1, 1])
const y = new Int8Array(x)
x[0] // 1
y[0] // 1

x[0] = 2
y[0] // 1
```

想基于同一段内存构造不同视图，可以采用下面的写法。

```js
const x = new Int8Array([1, 1])
const y = new Int8Array(x.buffer)
x[0] // 1
y[0] // 1

x[0] = 2
y[0] // 2
```

#### 2.2.4 TypedArray(arrayLikeObject)

构造函数的参数也可以是普通数组，直接生成`TypedArray`实例。

```js
const typedArray = new Uint8Array([1, 2, 3, 4])
```

注意，这时`TypedArray` 会重新开辟内存，不会在原数组的内存上建视图。

TypedArray 数组也可以转换回普通数组。

```js
const normalArray = [...typedArray]
// or
const normalArray = Array.from(typedArray)
// or
const normalArray = Array.prototype.slice.call(typedArray)
```

### 2.3 TypedArray 数组方法

普通数组的操作方法和属性对 TypedArray 数组完全适用：`copyWithin`、`entries`、`every`、`fill`、`filter`、`find`、`findIndex`、`forEach`、`indexOf`、`join`、`keys`、`lastIndexOf`、`map`、`reduce`、`reduceRight`、`reverse`、`slice`、`some`、`sort`、`toLocaleString`、`toString`、`values` 全部可用，签名与普通数组一致；用法请参阅数组方法的介绍，这里不再重复。

TypedArray 数组没有`concat`方法。要合并多个 TypedArray 数组，可以用下面这个函数。

```js
function concatenate(resultConstructor, ...arrays) {
  let totalLength = 0
  for (let arr of arrays) {
    totalLength += arr.length
  }
  let result = new resultConstructor(totalLength)
  let offset = 0
  for (let arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

concatenate(Uint8Array, Uint8Array.of(1, 2), Uint8Array.of(3, 4))
// Uint8Array [1, 2, 3, 4]
```

TypedArray 数组也部署了 Iterator 接口，可以被遍历。

```js
let ui8 = Uint8Array.of(0, 1, 2)
for (let byte of ui8) {
  console.log(byte)
}
// 0
// 1
// 2
```

#### 2.3.1 TypedArray.prototype.buffer

`TypedArray`实例的`buffer`属性返回整段内存区域对应的`ArrayBuffer`对象，只读。

```js
const a = new Float32Array(64)
const b = new Uint8Array(a.buffer)
```

#### 2.3.2 TypedArray.prototype.byteLength，TypedArray.prototype.byteOffset

`byteLength`返回 TypedArray 数组占据的内存长度（字节），`byteOffset`返回它从底层`ArrayBuffer`对象的哪个字节开始。两者都只读。

```js
const b = new ArrayBuffer(8)

const v1 = new Int32Array(b)
const v2 = new Uint8Array(b, 2)
const v3 = new Int16Array(b, 2, 2)

v1.byteLength // 8
v2.byteLength // 6
v3.byteLength // 4

v1.byteOffset // 0
v2.byteOffset // 2
v3.byteOffset // 2
```

#### 2.3.3 TypedArray.prototype.length

`length` 是成员个数，`byteLength` 是字节长度，注意区分。

```js
const a = new Int16Array(8)

a.length // 8
a.byteLength // 16
```

#### 2.3.4 TypedArray.prototype.set()

`set` 把一段内容（普通数组或 TypedArray 数组）完全复制到另一段内存。

```js
const a = new Uint8Array(8)
const b = new Uint8Array(8)

b.set(a)
```

`set` 是整段内存拷贝，比逐个成员复制快得多。

第二个参数表示从 `b` 的哪个成员开始复制 `a`。

```js
const a = new Uint16Array(8)
const b = new Uint16Array(10)

b.set(a, 2)
```

`b` 比 `a` 多两个成员，所以从 `b[2]` 开始复制。

#### 2.3.5 TypedArray.prototype.subarray()

`subarray` 在 TypedArray 数组的一部分上再建一个新视图。

```js
const a = new Uint16Array(8)
const b = a.subarray(2, 3)

a.byteLength // 16
b.byteLength // 2
```

`subarray` 的两个参数是起始与结束的成员序号（不含结束位），省略第二个则含剩余全部成员。

#### 2.3.6 TypedArray.prototype.slice()

`slice` 返回一个指定位置的新的`TypedArray`实例。

```js
let ui8 = Uint8Array.of(0, 1, 2)
ui8.slice(-1)
// Uint8Array [ 2 ]
```

`slice` 的参数是原数组的具体位置，负值表示逆向位置（-1 为倒数第一个）。

#### 2.3.7 TypedArray.of()

TypedArray 数组的所有构造函数都有静态方法`of`，把参数转为`TypedArray`实例。

```js
Float32Array.of(0.151, -8, 3.7)
// Float32Array [ 0.151, -8, 3.7 ]
```

下面三种写法都会生成同样的 TypedArray 数组。

```js
// 方法一
let tarr = new Uint8Array([1, 2, 3])

// 方法二
let tarr = Uint8Array.of(1, 2, 3)

// 方法三
let tarr = new Uint8Array(3)
tarr[0] = 1
tarr[1] = 2
tarr[2] = 3
```

#### 2.3.8 TypedArray.from()

静态方法`from`接受一个可遍历的数据结构（比如数组），返回基于它的`TypedArray`实例。

```js
Uint16Array.from([0, 1, 2])
// Uint16Array [ 0, 1, 2 ]
```

这个方法还可以把一种`TypedArray`实例转为另一种。

```js
const ui16 = Uint16Array.from(Uint8Array.of(0, 1, 2))
ui16 instanceof Uint16Array // true
```

`from` 的第二个参数可以是函数，用来遍历每个元素，功能类似`map`。

```js
Int8Array.of(127, 126, 125).map(x => 2 * x)
// Int8Array [ -2, -4, -6 ]

Int16Array.from(Int8Array.of(127, 126, 125), x => 2 * x)
// Int16Array [ 254, 252, 250 ]
```

`from` 没有发生溢出，说明它先把第一个参数指定的数组拷贝到另一段内存，处理后再转成指定格式。

### 2.4 TypedArray 与普通数组的互转

TypedArray 与普通数组之间可以自由转换，但**每种写法是否复制内存**并不一样，这是最容易出错的地方。

[width(50,16,34)]

| 写法                                         | 结果           | 是否复制内存                         |
| -------------------------------------------- | -------------- | ------------------------------------ |
| `new Uint8Array(ordinaryArray)`              | TypedArray     | 复制，按目标类型逐个转换（可能截断） |
| `Uint8Array.from(ordinaryArray, mapFn?)`     | TypedArray     | 复制，可以顺带映射                   |
| `Array.from(typedArray)` / `[...typedArray]` | 普通数组       | 复制                                 |
| `Array.prototype.slice.call(typedArray)`     | 普通数组       | 复制                                 |
| `typedArray.slice()`                         | **TypedArray** | 复制，但不会变成普通数组             |
| `new Uint16Array(typedArray)`                | TypedArray     | 复制，元素逐个转换                   |
| `new Uint16Array(typedArray.buffer)`         | TypedArray     | **共享内存**，字节原样重新解释       |
| `typedArray.subarray(start, end)`            | TypedArray     | **共享内存**                         |

尤其要注意 `typedArray.buffer` 指向**底层整段内存**，不是视图自己那一小段。带 `byteOffset` 的视图最容易踩坑，Node.js 的 `Buffer` 是重灾区（见 5.8 节）。

```js
const buffer = new ArrayBuffer(16)
const tail = new Uint8Array(buffer, 8)

tail.length // 8
tail.byteLength // 8
tail.byteOffset // 8
tail.buffer.byteLength // 16，buffer 是整段内存，不是 tail 那 8 个字节
```

想拿到“只有这个视图”的那一段，得写成 `new Uint8Array(tail.buffer, tail.byteOffset, tail.byteLength)`，或直接用 `tail.slice()` 复制一份。

TypedArray 是定长数组，凡是会改变长度的方法它都没有。

[width(28,13,23,36)]

| 方法                                 | 普通数组         | TypedArray                  | 变通写法                                |
| ------------------------------------ | ---------------- | --------------------------- | --------------------------------------- |
| `push` / `pop` / `shift` / `unshift` | 有               | 无                          | 重新分配一个更大的数组，用 `set` 搬过去 |
| `splice`                             | 有               | 无                          | `copyWithin` 配合手动截断               |
| `concat`                             | 有               | 无                          | 见 2.3 节的 `concatenate` 函数          |
| `flat` / `flatMap`                   | 有               | 无                          | 手动循环                                |
| `slice`                              | 有，返回普通数组 | 有，返回**新的 TypedArray** | —                                       |
| `toReversed` / `toSorted` / `with`   | 有               | 有                          | —                                       |
| `toSpliced`                          | 有               | 无（长度定死）              | —                                       |
| `sort` 不传比较函数时                | 按字符串顺序     | 按**数值大小**升序          | —                                       |

```js
function append8(ta, ...values) {
  const next = new Uint8Array(ta.length + values.length)
  next.set(ta)
  next.set(values, ta.length)
  return next
}

append8(Uint8Array.of(1, 2), 3, 4)
// Uint8Array [ 1, 2, 3, 4 ]
```

`sort` 的默认行为值得单独记一笔：`[-1, 10, 2].sort()` 在普通数组上得到 `[-1, 10, 2]`（按字符串比较），`Int16Array.of(-1, 10, 2).sort()` 得到 `Int16Array [ -1, 2, 10 ]`（按数值比较）。

类型判断上也有差异。

```js
const ta = Uint8Array.of(1, 2, 3)

Array.isArray(ta) // false
ta instanceof Array // false
typeof ta // 'object'
Object.prototype.toString.call(ta) // '[object Uint8Array]'
ArrayBuffer.isView(ta) // true
```

**性能**方面，TypedArray 的优势来自两点：元素是紧凑的原始值，不存在装箱；内存操作可以整段进行。大致记成下面这样。

- **批量搬运**（`set`、`slice`、`copyWithin`）差距最大，它们走的是内存拷贝，而不是逐元素循环。
- **数值密集的循环**通常也更快，但现代引擎对普通数组的优化已经很好，差距没有早些年那么夸张。
- **字符串、混合类型、频繁增删**的场景仍然应该用普通数组，硬套 TypedArray 只会来回转换，反而更慢。

### 2.5 结构化方法：subarray / slice / set / copyWithin / fill

这几个方法都跟“**一段**”数据有关，区别在于**参数单位**、**是否复制内存**和**越界时的态度**。

[width(32,13,24,31)]

| 方法                                      | 参数单位     | 是否复制内存               | 下标越界时              |
| ----------------------------------------- | ------------ | -------------------------- | ----------------------- |
| `subarray(start, end)`                    | 元素下标     | 否，共享底层内存           | 截断到有效范围，不报错  |
| `slice(start, end)`                       | 元素下标     | 是，返回新数组             | 截断到有效范围，不报错  |
| `set(source, offset)`                     | 元素下标     | 是，把数据复制进来         | 放不下就抛 `RangeError` |
| `copyWithin(target, start, end)`          | 元素下标     | 在自身内部搬移，不额外分配 | 截断到有效范围，不报错  |
| `fill(value, start, end)`                 | 元素下标     | 就地写入                   | 截断到有效范围，不报错  |
| `ArrayBuffer.prototype.slice(start, end)` | **字节**下标 | 是                         | 截断到有效范围，不报错  |

`subarray` 与 `slice` 的差别最常考：两者参数完全相同，但 `subarray` 返回原内存上的一层新视图，改它会改到底层数据；`slice` 复制一份，改它不影响原数组。

```js
const a = Uint8Array.of(1, 2, 3, 4)

const sub = a.subarray(1, 3)
sub[0] = 99
a // Uint8Array [ 1, 99, 3, 4 ]

const copy = a.slice(1, 3)
copy[0] = 0
a // Uint8Array [ 1, 99, 3, 4 ]，不受影响
```

`copyWithin` 适合“丢掉头部一段”这类操作，它的三个参数都是下标，不是长度。

```js
const a = Uint8Array.of(1, 2, 3, 4, 5)

// 把 a[0..2] 搬到从下标 2 开始的位置
a.copyWithin(2, 0, 3)
a // Uint8Array [ 1, 2, 1, 2, 3 ]
```

`set` 允许源和目标在同一段内存上重叠，规格保证结果等同于先把源复制出来再写入，不会出现“边读边写”的错乱。

```js
const a = Uint8Array.of(1, 2, 3, 4, 5)

a.set(a.subarray(0, 3), 1)
a // Uint8Array [ 1, 1, 2, 3, 5 ]
```

`fill` 是这批方法里唯一只写的，初始化内存时最省事。

```js
const a = new Uint8Array(5)

a.fill(7, 1, 3)
a // Uint8Array [ 0, 7, 7, 0, 0 ]
```

### 2.6 越界与类型转换的坑

#### 2.6.1 读写越界是静默的

TypedArray 的下标读写越界**不报错**：读越界得到 `undefined`，写越界被直接丢弃，严格模式也不抛错。它常被当作“一段定长内存”，静默失败往往意味着数据悄悄丢了。

```js
const u8 = new Uint8Array(2)

u8[5] = 2 // 静默忽略，不报错
u8[5] // undefined
u8.length // 2
```

需要报错的地方，要么自己检查下标，要么用会报错的方法。

```js
const u8 = new Uint8Array(2)

try {
  u8.set([1, 2, 3]) // 目标放不下，抛 RangeError
} catch (e) {
  console.log(e.constructor.name) // 'RangeError'
}
```

规律是：**构造视图时**字节偏移越界、长度越界，以及 `set()` 放不下，都抛 `RangeError`；而 `subarray`、`slice`、`fill`、`copyWithin` 的下标一律**截断**处理，不报错。两者混在一起很容易记反。

#### 2.6.2 对齐要求

带 `byteOffset` 的 `TypedArray` 构造函数要求偏移量是该类型字节数的整数倍，否则抛 `RangeError`（见 2.2 节的例子）。`DataView` 没有这个限制，偏移可以是任意字节。

#### 2.6.3 数值转换规则

往整型视图写入非整数或超范围的值时，先向零截断，再对 2 的 n 次方取模。

```js
const i32 = new Int32Array(1)

i32[0] = -1.9
i32[0] // -1，向零截断，不四舍五入

i32[0] = 2.9
i32[0] // 2

i32[0] = NaN
i32[0] // 0

i32[0] = Infinity
i32[0] // 0，正负无穷都是 0
```

#### 2.6.4 map / filter 返回的还是同类型视图

`map` 和 `filter` 用原视图的构造函数创建结果，于是结果照样被溢出规则截断，很违反直觉。

```js
Int8Array.of(100, 100).map(x => x * 2)
// Int8Array [ -56, -56 ]，200 按 8 位有符号整数解释就是 -56
```

想避免截断得换更宽的类型，比如 `Int16Array.from(Int8Array.of(100, 100), x => x * 2)`（见 2.3 节 `from` 的例子）。

#### 2.6.5 BigInt 视图只能放 BigInt

`BigInt64Array` / `BigUint64Array` 的元素类型是 BigInt，写入普通数值抛 `TypeError`，读出的值也必须用 BigInt 参与运算。

```js
const b = new BigInt64Array(1)

b[0] = 1n
b[0] // 1n
// b[0] = 1 会抛 TypeError: Cannot convert 1 to a BigInt
```

BigInt 不能被 `JSON.stringify` 序列化，所以 `BigUint64Array` 的数据想走 JSON 必须先转成字符串，直接序列化会抛 `TypeError`。

#### 2.6.6 浮点视图存不下精确值

`Float32Array`、`Float16Array` 保存的是降精度后的值，写进去再读出来不一定等于原值，比较时不要直接用 `===`。半精度的 `Float16Array` 尤其明显（十进制约 3 位有效数字），而且出现得较晚，老环境里可能没有。

#### 2.6.7 Uint8ClampedArray 的取整规则与别的整型视图不同

它既不取模也不向零截断，而是先把值夹到 0 ～ 255，再按“四舍六入五成双”取整。

```js
new Uint8ClampedArray([0.5, 1.5, 2.5, 3.5, -0.5, 257])
// Uint8ClampedArray [ 0, 2, 2, 4, 0, 255 ]
```

## 3. 复合视图

视图的构造函数可以指定起始位置和长度，所以同一段内存里可以依次存放不同类型的数据，这叫“复合视图”。

```js
const buffer = new ArrayBuffer(24)

const idView = new Uint32Array(buffer, 0, 1)
const usernameView = new Uint8Array(buffer, 4, 16)
const amountDueView = new Float32Array(buffer, 20, 1)
```

这段 24 字节内存分成三部分：字节 0 ～ 3 是 1 个 32 位无符号整数，字节 4 ～ 19 是 16 个 8 位整数，字节 20 ～ 23 是 1 个 32 位浮点数。

这种结构可以用 C 语言描述为：

```c
struct someStruct {
  unsigned long id;
  char username[16];
  float amountDue;
};
```

### 3.1 字节序

字节序是数值在内存中的表示方式。

```js
const buffer = new ArrayBuffer(16)
const int32View = new Int32Array(buffer)

for (let i = 0; i < int32View.length; i++) {
  int32View[i] = i * 2
}
```

16 字节内存上建 32 位整数视图，每个整数占 4 字节，可以写入 4 个整数：0、2、4、6。

在这段数据上接着建一个 16 位整数的视图，可以读出完全不一样的结果。

```js
const int16View = new Int16Array(buffer)

for (let i = 0; i < int16View.length; i++) {
  console.log('Entry ' + i + ': ' + int16View[i])
}
// Entry 0: 0
// Entry 1: 0
// Entry 2: 2
// Entry 3: 0
// Entry 4: 4
// Entry 5: 0
// Entry 6: 6
// Entry 7: 0
```

16 位整数占 2 字节，整段内存分成 8 段。x86 采用小端字节序（little endian）：不重要的字节排在前面，重要的字节排在后面，于是得到上面的结果。

比如`0x12345678`，最重要的字节是“12”，最不重要的是“78”。小端把最不重要的字节排在前面，储存顺序是`78563412`；大端相反，是`12345678`。几乎所有个人电脑都是小端，TypedArray 因此也按本机操作系统的字节序读写。

但很多网络设备和特定操作系统采用大端字节序，TypedArray 只能按本机序解析，遇到大端数据就会出错。为此 JavaScript 引入了可设定字节序的`DataView`，下文详述。

下面是另一个例子。

```js
// 假定某段buffer包含如下字节 [0x02, 0x01, 0x03, 0x07]
const buffer = new ArrayBuffer(4)
const v1 = new Uint8Array(buffer)
v1[0] = 2
v1[1] = 1
v1[2] = 3
v1[3] = 7

const uInt16View = new Uint16Array(buffer)

// 计算机采用小端字节序
// 所以头两个字节等于258
if (uInt16View[0] === 258) {
  console.log('OK') // "OK"
}

// 赋值运算
uInt16View[0] = 255 // 字节变为[0xFF, 0x00, 0x03, 0x07]
uInt16View[0] = 0xff05 // 字节变为[0x05, 0xFF, 0x03, 0x07]
uInt16View[1] = 0x0210 // 字节变为[0x05, 0xFF, 0x10, 0x02]
```

下面的函数可以判断当前是小端还是大端字节序。

```js
const BIG_ENDIAN = Symbol('BIG_ENDIAN')
const LITTLE_ENDIAN = Symbol('LITTLE_ENDIAN')

function getPlatformEndianness() {
  let arr32 = Uint32Array.of(0x12345678)
  let arr8 = new Uint8Array(arr32.buffer)
  switch (arr8[0] * 0x1000000 + arr8[1] * 0x10000 + arr8[2] * 0x100 + arr8[3]) {
    case 0x12345678:
      return BIG_ENDIAN
    case 0x78563412:
      return LITTLE_ENDIAN
    default:
      throw new Error('Unknown endianness')
  }
}
```

### 3.2 BYTES_PER_ELEMENT 属性

每种视图的构造函数都有`BYTES_PER_ELEMENT`属性，表示这种数据类型占据的字节数。

```js
Int8Array.BYTES_PER_ELEMENT // 1
Uint8Array.BYTES_PER_ELEMENT // 1
Uint8ClampedArray.BYTES_PER_ELEMENT // 1
Int16Array.BYTES_PER_ELEMENT // 2
Uint16Array.BYTES_PER_ELEMENT // 2
Int32Array.BYTES_PER_ELEMENT // 4
Uint32Array.BYTES_PER_ELEMENT // 4
Float32Array.BYTES_PER_ELEMENT // 4
Float64Array.BYTES_PER_ELEMENT // 8
```

`TypedArray` 实例上也能获取，即`TypedArray.prototype.BYTES_PER_ELEMENT`。

### 3.3 ArrayBuffer 与字符串的互相转换

`ArrayBuffer` 与字符串的互转用原生 `TextEncoder` 和 `TextDecoder`。下面按 TypeScript 用法给出类型签名。

```js
/**
 * Convert ArrayBuffer/TypedArray to String via TextDecoder
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
 */
function ab2str(
  input: ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array,
  outputEncoding: string = 'utf8',
): string {
  const decoder = new TextDecoder(outputEncoding)
  return decoder.decode(input)
}

/**
 * Convert String to ArrayBuffer via TextEncoder
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/TextEncoder
 */
function str2ab(input: string): ArrayBuffer {
  const view = str2Uint8Array(input)
  return view.buffer
}

/** Convert String to Uint8Array */
function str2Uint8Array(input: string): Uint8Array {
  const encoder = new TextEncoder()
  const view = encoder.encode(input)
  return view
}
```

第二个参数`outputEncoding`是输出编码，一般保持默认值（`utf-8`），其他可选值参见[官方文档](https://encoding.spec.whatwg.org)或 [Node.js 文档](https://nodejs.org/api/util.html#util_whatwg_supported_encodings)。

### 3.4 溢出

不同视图类型能容纳的数值范围是确定的，超出就溢出：8 位视图只能容纳 8 位二进制值，放入 9 位的值就会溢出。

TypedArray 的溢出规则是抛弃溢出的位，再按视图类型解释。

```js
const uint8 = new Uint8Array(1)

uint8[0] = 256
uint8[0] // 0

uint8[0] = -1
uint8[0] // 255
```

256 的二进制是 9 位`100000000`，溢出后只保留后 8 位`00000000`；按无符号 8 位整数解释就是`0`。

负数在计算机内部用“2 的补码”表示：对应正数按位取反再加`1`。`-1`的正值是`1`，取反得`11111110`，加`1`得`11111111`，按无符号 8 位整数解释就是`255`。

转换规则可以这样表示。

- 正向溢出（overflow）：当输入值大于当前数据类型的最大值，结果等于当前数据类型的最小值加上余值，再减去 1。
- 负向溢出（underflow）：当输入值小于当前数据类型的最小值，结果等于当前数据类型的最大值减去余值的绝对值，再加上 1。

“余值”就是模运算（`%`）的结果。

```js
12 % 4 // 0
12 % 5 // 2
```

看下面的例子。

```js
const int8 = new Int8Array(1)

int8[0] = 128
int8[0] // -128

int8[0] = -129
int8[0] // 127
```

`int8` 是带符号 8 位视图，范围 -128 ～ 127。输入`128`属正向溢出，按“最小值加余值再减 1”（余值 1）得`-128`；输入`-129`属负向溢出，按“最大值减余值绝对值再加 1”得`127`。

`Uint8ClampedArray` 的溢出规则不同：正向溢出一律取最大值 255，负向溢出一律取最小值 0。

```js
const uint8c = new Uint8ClampedArray(1)

uint8c[0] = 256
uint8c[0] // 255

uint8c[0] = -1
uint8c[0] // 0
```

### 3.5 字节序实践：什么时候必须用 DataView

3.1 节的结论：TypedArray 只按本机字节序解释数据。网络字节序是大端、个人电脑多为小端，HTTP 头里的长度直接用 TypedArray 读出来就是错的。

解决方式有两种：一种是用 TypedArray 读出后手动换字节。

```js
// 把 16 位整数的两个字节前后对调
function swap16(value) {
  return ((value & 0xff) << 8) | ((value >> 8) & 0xff)
}

swap16(0x0102) // 513，也就是 0x0201
```

这样不用改代码结构，缺点是每个字段都要做位运算，字段一多容易漏，32 位、64 位还得写不同版本。

另一种是用 `DataView`：每个读写方法都能单独指定字节序，偏移可以落在任意字节上，不受对齐限制。选型可按下面的经验来。

[width(31,37,32)]

| 场景                                             | 推荐方案                         | 理由                                       |
| ------------------------------------------------ | -------------------------------- | ------------------------------------------ |
| 一段内存全是同一种类型（像素、采样、矩阵）       | `TypedArray`                     | 可以整段遍历和拷贝，性能最好               |
| 内存里是多种类型拼接的固定结构（协议头、文件头） | `DataView`                       | 每个字段一个方法，偏移任意，不用手写位运算 |
| 同一段内存要按不同结构反复解读                   | 复合视图（多个 TypedArray 叠加） | 建一次视图，之后都是普通的数组访问         |
| 对端序有要求的数据（比如网络字节序）             | `DataView`                       | 每个读写方法都能指定端序                   |
| 需要共享给 Worker 并做同步                       | `SharedArrayBuffer` + `Atomics`  | 见第 6、7 节                               |

3.1 节那几个“换个视图读出来就不一样”的例子，前提是 TypedArray 按本机端序解释，只在 x86 小端这类平台上成立；换到大端机器上 `int16View[i]` 的值会反过来。跨平台代码不要依赖这个顺序。

## 4. DataView 视图

一段数据包含多种类型时（比如服务器传来的 HTTP 数据），除了建立复合视图，还可以用`DataView`视图。

`DataView` 支持设定字节序。设计上，`TypedArray` 面向网卡、声卡等本机设备，用本机字节序即可；`DataView` 面向网络设备传来的数据，端序自行设定。

`DataView` 本身也是构造函数，接受一个`ArrayBuffer`对象作为参数生成视图。

```js
new DataView(ArrayBuffer buffer [, 字节起始位置 [, 长度]]);
```

下面是一个例子。

```js
const buffer = new ArrayBuffer(24)
const dv = new DataView(buffer)
```

`DataView` 实例有以下属性，含义与`TypedArray`实例的同名属性相同。

- `DataView.prototype.buffer`：返回对应的 ArrayBuffer 对象
- `DataView.prototype.byteLength`：返回占据的内存字节长度
- `DataView.prototype.byteOffset`：返回当前视图从对应的 ArrayBuffer 对象的哪个字节开始

`DataView` 实例提供 11 个方法读取内存。

- `getInt8` / `getUint8` 读 1 个字节，返回 8 位（无符号）整数；`getInt16` / `getUint16` 读 2 个字节，返回 16 位（无符号）整数；`getInt32` / `getUint32` 读 4 个字节，返回 32 位（无符号）整数；`getBigInt64` / `getBigUint64` 读 8 个字节，返回 64 位（无符号）整数；`getFloat16` 读 2 个字节、`getFloat32` 读 4 个字节、`getFloat64` 读 8 个字节，返回对应精度的浮点数。

`get` 系列方法的参数是一个字节序号（不能是负数，否则报错），表示从哪个字节开始读取。

```js
const buffer = new ArrayBuffer(24)
const dv = new DataView(buffer)

// 从第1个字节读取一个8位无符号整数
const v1 = dv.getUint8(0)

// 从第2个字节读取一个16位无符号整数
const v2 = dv.getUint16(1)

// 从第4个字节读取一个16位无符号整数
const v3 = dv.getUint16(3)
```

一次读取两个或以上字节时，必须明确字节序。`DataView` 的 `get` 方法默认按**大端**解读，要小端必须在第二个参数传 `true`。

```js
// 小端字节序
const v1 = dv.getUint16(1, true)

// 大端字节序
const v2 = dv.getUint16(3, false)

// 大端字节序
const v3 = dv.getUint16(3)
```

DataView 视图提供 11 个方法写入内存。

- `setInt8` / `setUint8` 写 1 个字节的 8 位（无符号）整数；`setInt16` / `setUint16` 写 2 个字节的 16 位（无符号）整数；`setInt32` / `setUint32` 写 4 个字节的 32 位（无符号）整数；`setBigInt64` / `setBigUint64` 写 8 个字节的 64 位（无符号）整数；`setFloat16` 写 2 个字节、`setFloat32` 写 4 个字节、`setFloat64` 写 8 个字节的浮点数。

`set` 系列接受两个参数：字节序号和写入的数据。写入两个或以上字节的方法还要第三个参数，`false`/`undefined` 表示大端，`true` 表示小端。

```js
// 在第1个字节，以大端字节序写入值为25的32位整数
dv.setInt32(0, 25, false)

// 在第5个字节，以大端字节序写入值为25的32位整数
dv.setInt32(4, 25)

// 在第9个字节，以小端字节序写入值为2.5的32位浮点数
dv.setFloat32(8, 2.5, true)
```

不确定本机字节序时可以这样判断。

```js
const littleEndian = (function () {
  const buffer = new ArrayBuffer(2)
  new DataView(buffer).setInt16(0, 256, true)
  return new Int16Array(buffer)[0] === 256
})()
```

返回`true` 是小端，`false` 是大端。

### 4.1 DataView 的越界行为

与 TypedArray 的静默越界相反，`DataView` 的每个 `get` / `set` 方法都做范围检查，越界直接抛 `RangeError`。

```js
const dv = new DataView(new ArrayBuffer(4))

try {
  dv.getUint8(4) // 视图只有 4 个字节，没有下标 4
} catch (e) {
  console.log(e.constructor.name) // 'RangeError'
}
```

TypedArray 读越界给 `undefined`，`DataView` 读越界直接抛错。解析外部数据时后者更安全：损坏的数据包会立刻暴露，而不是悄悄产出一堆 `undefined` 和 `NaN`。

构造 `DataView` 时也一样，“字节起始位置”和“长度”都必须落在底层 `ArrayBuffer` 的范围内。

```js
const buffer = new ArrayBuffer(16)
const dv = new DataView(buffer, 8, 8)

dv.byteOffset // 8
dv.byteLength // 8
```

### 4.2 性能与兼容性

- `DataView` 是“一次方法调用读写一个字段”，早期引擎上比 `TypedArray` 慢不少；现在 V8 等引擎做了内联优化，解析场景差距已经不大。
- 真正拉开差距的是**逐字节循环**。解析几十字节的协议头用哪个都行；处理 400 万像素的图片必须用 `TypedArray`（最好配 `set` 整段搬运），不要用 `DataView` 逐个像素 `getUint8`。
- 大多数解析场景的正确姿势是**混用**：用 `DataView` 读文件头、协议头这类长度不一的固定结构，拿到数据区的位置和长度后再用 `TypedArray` 批量处理。
- 兼容性上，`getBigInt64` / `getBigUint64` 是 ES2020 才加入的，`getFloat16` / `setFloat16` 更晚（ES2025 前后），用到它们要注意目标环境。`TypedArray` 与 `DataView` 本身在 ES6 之前就已存在（见开头的 2011 年独立规格）。

## 5. 二进制数组的应用

大量 Web API 用到了`ArrayBuffer`对象和它的视图对象。

### 5.1 AJAX

传统上 AJAX 只能返回文本（`responseType` 默认为`text`），`XHR2` 允许返回二进制数据：知道类型就把 `responseType` 设为`arraybuffer`，不知道就设为`blob`。

```js
let xhr = new XMLHttpRequest()
xhr.open('GET', someUrl)
xhr.responseType = 'arraybuffer'

xhr.onload = function () {
  let arrayBuffer = xhr.response
  // ···
}

xhr.send()
```

知道传回来的是 32 位整数时，可以这样处理。

```js
xhr.onreadystatechange = function () {
  if (req.readyState === 4) {
    const arrayResponse = xhr.response
    const dataView = new DataView(arrayResponse)
    const ints = new Uint32Array(dataView.byteLength / 4)

    xhrDiv.style.backgroundColor = '#00FF00'
    xhrDiv.innerText = 'Array is ' + ints.length + 'uints long'
  }
}
```

### 5.2 Canvas

网页`Canvas`元素输出的二进制像素数据就是 TypedArray 数组。

```js
const canvas = document.getElementById('myCanvas')
const ctx = canvas.getContext('2d')

const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
const uint8ClampedArray = imageData.data
```

`Uint8ClampedArray` 是 `Canvas` 用的专有类型，专为颜色设计：每个字节是无符号 8 位整数（只能取 0 ～ 255），运算时自动过滤溢出，图像处理时很方便。

如果用`Uint8Array`存颜色值，乘一个 gamma 值时必须这样计算：

```js
u8[i] = Math.min(255, Math.max(0, u8[i] * gamma))
```

`Uint8Array` 对大于 255 的结果（如`0xFF+1`）会自动变成`0x00`，所以必须手动夹取，既麻烦又影响性能。改用`Uint8ClampedArray`就简单得多。

```js
pixels[i] *= gamma
```

`Uint8ClampedArray` 把小于 0 的值设为 0、大于 255 的设为 255。IE 10 不支持该类型。

### 5.3 WebSocket

`WebSocket`可以通过`ArrayBuffer`发送或接收二进制数据。

```js
let socket = new WebSocket('ws://127.0.0.1:8081')
socket.binaryType = 'arraybuffer'

// Wait until socket is open
socket.addEventListener('open', function (event) {
  // Send binary data
  const typedArray = new Uint8Array(4)
  socket.send(typedArray.buffer)
})

// Receive binary data
socket.addEventListener('message', function (event) {
  const arrayBuffer = event.data
  // ···
})
```

### 5.4 Fetch API

Fetch API 取回的数据就是`ArrayBuffer`对象。

```js
fetch(url)
  .then(function (response) {
    return response.arrayBuffer()
  })
  .then(function (arrayBuffer) {
    // ...
  })
```

### 5.5 File API

知道一个文件的二进制数据类型时，也可以把它读取为`ArrayBuffer`对象。

```js
const fileInput = document.getElementById('fileInput')
const file = fileInput.files[0]
const reader = new FileReader()
reader.readAsArrayBuffer(file)
reader.onload = function () {
  const arrayBuffer = reader.result
  // ···
}
```

下面以处理 bmp 文件为例（`file` 是文件对象），先读取它。

```js
const reader = new FileReader()
reader.addEventListener('load', processimage, false)
reader.readAsArrayBuffer(file)
```

回调函数里先在二进制数据上建 `DataView` 视图，再用 `bitmap` 对象存放处理结果，最后展示到`Canvas`元素中。

```js
function processimage(e) {
  const buffer = e.target.result
  const datav = new DataView(buffer)
  const bitmap = {}
  // 具体的处理步骤
}
```

处理图像数据时先处理 bmp 的文件头。

```js
bitmap.fileheader = {}
bitmap.fileheader.bfType = datav.getUint16(0, true)
bitmap.fileheader.bfSize = datav.getUint32(2, true)
bitmap.fileheader.bfReserved1 = datav.getUint16(6, true)
bitmap.fileheader.bfReserved2 = datav.getUint16(8, true)
bitmap.fileheader.bfOffBits = datav.getUint32(10, true)
```

接着处理图像元信息。

```js
bitmap.infoheader = {}
bitmap.infoheader.biSize = datav.getUint32(14, true)
bitmap.infoheader.biWidth = datav.getUint32(18, true)
bitmap.infoheader.biHeight = datav.getUint32(22, true)
bitmap.infoheader.biPlanes = datav.getUint16(26, true)
bitmap.infoheader.biBitCount = datav.getUint16(28, true)
bitmap.infoheader.biCompression = datav.getUint32(30, true)
bitmap.infoheader.biSizeImage = datav.getUint32(34, true)
bitmap.infoheader.biXPelsPerMeter = datav.getUint32(38, true)
bitmap.infoheader.biYPelsPerMeter = datav.getUint32(42, true)
bitmap.infoheader.biClrUsed = datav.getUint32(46, true)
bitmap.infoheader.biClrImportant = datav.getUint32(50, true)
```

最后处理像素信息。

```js
const start = bitmap.fileheader.bfOffBits
bitmap.pixels = new Uint8Array(buffer, start)
```

### 5.6 结构化克隆与所有权转移

`postMessage`（以及 `structuredClone`）传递 `ArrayBuffer` 时默认做**结构化克隆**：复制一份字节给接收方，两边各持有独立内存。数据量大时这份复制很可观，于是有了“转移”（transfer）——直接过户所有权。

```js
// 不转移：结构化克隆，Worker 拿到的是副本
const buffer = new ArrayBuffer(1024)

worker.postMessage(buffer)
buffer.byteLength // 1024，主线程这边仍然可用
```

```js
// 转移：把所有权交出去，主线程这边立即失效
const buffer = new ArrayBuffer(1024)
const view = new Uint8Array(buffer)

worker.postMessage(buffer, [buffer])
buffer.byteLength // 0
view.byteLength // 0
```

几个要点：

- 转移清单里必须是 `ArrayBuffer` 对象本身，不能是视图。传视图进去会抛 `TypeError`，因为视图不是 transferable。
- `SharedArrayBuffer` 两种方式都不复制：它本来就共享，传过去两边看到的是同一段内存，也不需要转移清单。
- `structuredClone()` 没有独立的转移清单参数，做转移要写成 `structuredClone(buffer, { transfer: [buffer] })`。
- 转移是**不可逆**的：原对象已分离，还引用它的旧代码只会拿到长度为 0 的视图，在“主线程把数据交给 Worker 后还想自己再用一下”的场景里非常容易出事。

### 5.7 实战：解析一个二进制协议

假设有一段自定义协议：前 4 个字节是魔数 `DEMO`，第 5 个字节是版本号，第 6、7 个字节是负载长度（大端 16 位），之后是负载。先把数据拼出来。

```js
const HEADER = 7
const buffer = new ArrayBuffer(HEADER + 3)
const dv = new DataView(buffer)

dv.setUint8(0, 0x44) // D
dv.setUint8(1, 0x45) // E
dv.setUint8(2, 0x4d) // M
dv.setUint8(3, 0x4f) // O
dv.setUint8(4, 1) // 版本号
dv.setUint16(5, 3) // 负载长度，默认就是大端
new Uint8Array(buffer, HEADER).set([10, 20, 30])
```

再解析它：头部字段偏移固定、长度不一，交给 `DataView`；负载是同类型数据，交给 `TypedArray`，直接用 `subarray` 的思路在上面建视图，一个字节都不复制。

```js
function parseFrame(arrayBuffer) {
  const HEADER = 7 // 头部长度，负载从这里开始
  const dv = new DataView(arrayBuffer)
  const magic = String.fromCharCode(
    dv.getUint8(0),
    dv.getUint8(1),
    dv.getUint8(2),
    dv.getUint8(3),
  )
  const version = dv.getUint8(4)
  const length = dv.getUint16(5, false) // false 表示大端
  return {
    magic,
    version,
    length,
    payload: new Uint8Array(arrayBuffer, HEADER, length),
  }
}

parseFrame(buffer)
// {
//   magic: 'DEMO',
//   version: 1,
//   length: 3,
//   payload: Uint8Array(3) [ 10, 20, 30 ]
// }
```

这里把 `length` 直接当视图长度用了，实际代码必须先校验它没超出剩余字节数，否则会抛 `RangeError`。这也正是上一节说的“`DataView` 会报错”带来的好处：损坏的数据包在解析阶段立刻暴露。

真实协议还要处理粘包、分包（一段 `ArrayBuffer` 里可能只有半个包）：把待解析的字节缓存进一个 `Uint8Array`，凑够完整包再解析，通常是新分配一个数组、用 `set` 把两段拼起来。

### 5.8 其他常见来源

除了 `fetch` 和 `FileReader`，日常还会遇到这几种。

```js
// Blob 与 ArrayBuffer 互转
async function blobToBuffer(blob) {
  return await blob.arrayBuffer()
}

const blob = new Blob([new Uint8Array([1, 2, 3])])
```

```js
// Web Crypto 的摘要结果本身就是 ArrayBuffer
async function sha256(data) {
  const digest = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(digest)
}
```

```js
// Node.js 的 Buffer 是 Uint8Array 的子类
const buf = Buffer.from([1, 2, 3])

buf instanceof Uint8Array // true
buf.length // 3
```

Node.js 有个著名的坑：`Buffer` 实例常常从一块共享的 8KB 内存池里切出来，`buf.buffer` 指向整块池子，不是你以为的那几个字节。

```js
const buf = Buffer.from('hi')

buf.length // 2
buf.byteOffset // 88，在这个例子里并不是 0
buf.buffer.byteLength // 8192，底层是共享的内存池

// 想拿到真正的字节范围，必须带上 byteOffset 和 byteLength
const view = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
view // Uint8Array [ 104, 105 ]
```

### 5.9 二进制载体的选型

[width(21,24,26,29)]

| 载体             | 本质                                               | 能否直接读写                 | 典型场景                                 |
| ---------------- | -------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| `Blob`           | 不可变的二进制大对象，数据可能在磁盘上而不在内存里 | 不能，要先转成 `ArrayBuffer` | 上传下载、`URL.createObjectURL`、大文件  |
| `ArrayBuffer`    | 一段内存                                           | 不能，必须先建视图           | `fetch`、`FileReader`、`crypto` 的返回值 |
| `TypedArray`     | 同类型视图                                         | 能                           | 像素、采样、数值数组                     |
| `DataView`       | 复合视图                                           | 能                           | 协议头、文件头、端序不确定的数据         |
| Node.js `Buffer` | `Uint8Array` 的子类                                | 能                           | Node 里读写文件、网络                    |
| Base64 字符串    | 文本形式的二进制                                   | 能，但每次都要编解码         | 塞进 JSON、`data:` URL                   |

选择原则：

- 数据还没进内存，或很大又只做整体搬运 → 用 `Blob`。
- 数据已经在内存里、要按字节解析 → 用 `ArrayBuffer` + `DataView`。
- 数据是同一种类型、要批量计算 → 用 `TypedArray`。
- 必须放进 JSON 或要跨文本渠道传输 → 用 Base64，但要记住它有约 33% 的体积膨胀，编解码也不便宜。

## 6. SharedArrayBuffer

JavaScript 是单线程的，Web worker 引入了多线程：主线程与用户互动，Worker 承担计算任务。线程间数据隔离，通过`postMessage()`通信。

```js
// 主线程
const w = new Worker('myworker.js')
```

主线程通过`w.postMessage`发消息，通过`message`事件监听回应。

```js
// 主线程
w.postMessage('hi')
w.onmessage = function (ev) {
  console.log(ev.data)
}
```

Worker 线程同样监听`message`事件获取消息并作出反应。

```js
// Worker 线程
onmessage = function (ev) {
  console.log(ev.data)
  postMessage('ho')
}
```

线程间交换的数据可以是任意格式，包括二进制，但采用复制机制，数据量大时效率很低。更高效的做法是留出一块内存区域，由主线程与 Worker 共享、双方都能读写。

ES2017 引入 [`SharedArrayBuffer`](https://github.com/tc39/ecmascript_sharedmem/blob/master/TUTORIAL.md)，允许主线程与 Worker 共享同一块内存。它的 API 与 `ArrayBuffer` 一模一样，唯一区别是后者无法共享数据。

```js
// 主线程

// 新建 1KB 共享内存
const sharedBuffer = new SharedArrayBuffer(1024)

// 主线程将共享内存的地址发送出去
w.postMessage(sharedBuffer)

// 在共享内存上建立视图，供写入数据
const sharedArray = new Int32Array(sharedBuffer)
```

Worker 线程从事件的`data`属性取到数据。

```js
// Worker 线程
onmessage = function (ev) {
  // 主线程共享的数据，就是 1KB 的共享内存
  const sharedBuffer = ev.data

  // 在共享内存上建立视图，方便读写
  const sharedArray = new Int32Array(sharedBuffer)

  // ...
}
```

共享内存也可以在 Worker 线程创建后发给主线程。

`SharedArrayBuffer` 与 `ArrayBuffer` 一样无法直接读写，必须建视图。

```js
// 分配 10 万个 32 位整数占据的内存空间
const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 100000)

// 建立 32 位整数视图
const ia = new Int32Array(sab) // ia.length == 100000

// 新建一个质数生成器
const primes = new PrimeGenerator()

// 将 10 万个质数，写入这段内存空间
for (let i = 0; i < ia.length; i++) ia[i] = primes.next()

// 向 Worker 线程发送这段共享内存
w.postMessage(ia)
```

Worker 线程收到数据后这样处理。

```js
// Worker 线程
let ia
onmessage = function (ev) {
  ia = ev.data
  console.log(ia.length) // 100000
  console.log(ia[37]) // 输出 163，因为这是第38个质数
}
```

### 6.1 跨源隔离：SharedArrayBuffer 的安全门槛

2018 年，`SharedArrayBuffer` 因 Spectre 漏洞被主流浏览器临时关闭，重新开放的条件是页面进入**跨源隔离**（cross-origin isolated）状态：共享内存配上高精度计时能被侧信道利用去读同一渲染进程里别的数据，所以浏览器必须先确保进程里没有别的源的内容。

进入跨源隔离状态要求服务器同时返回这两个响应头。

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

两个头各管一件事：

- `Cross-Origin-Opener-Policy: same-origin` 把当前页面与跨源窗口的浏览上下文组彻底切开，`window.opener` 之类的引用断掉，防止别的源借共用渲染进程窥探。
- `Cross-Origin-Embedder-Policy: require-corp` 要求页面加载的所有跨源子资源都显式声明允许被嵌入（带 `Cross-Origin-Resource-Policy: cross-origin` 或通过 CORS 校验），否则拒绝加载。这是接入时最麻烦的一条：第三方图片、字体、脚本、iframe 都得跟着改，任何一个不配合都会让整页加载失败。

条件满足后 `crossOriginIsolated` 才是 `true`，`SharedArrayBuffer` 才能用。

```js
if (self.crossOriginIsolated) {
  const sab = new SharedArrayBuffer(1024)
  const view = new Int32Array(sab)
  // ···
} else {
  // 没有跨源隔离：SharedArrayBuffer 可能根本不存在，也可能在构造时直接抛错
}
```

几个容易忽略的点：

- 判断用 `self.crossOriginIsolated`，不要用 `typeof SharedArrayBuffer`：没有隔离时各浏览器表现不一（有的全局对象不存在，有的对象在但构造时抛错），只有这个信号明确。
- 隔离状态是**页面级**的，Worker 会继承主线程的隔离状态，不需要额外设置。
- Node.js 没有这个限制，`SharedArrayBuffer` 直接可用，`worker_threads` 之间共享内存是常规用法。
- 纯静态托管加不了自定义响应头，只能用 Service Worker 之类的手段补，共享内存方案在部署上比想象中更受限。

### 6.2 长度可变的 SharedArrayBuffer 与内存模型

`SharedArrayBuffer` 也可以创建成可增长的。

```js
const sab = new SharedArrayBuffer(1024, { maxByteLength: 4096 })

sab.growable // true
sab.byteLength // 1024

sab.grow(2048)
sab.byteLength // 2048
```

`grow()` 只能增大、不能缩小，且不能超过 `maxByteLength`。增长后视图的表现和 1.3 节一样：创建时没指定长度的视图跟着变大，指定了长度的不变。

内存模型只需记住一条：

- **不加 `Atomics` 的普通读写，在另一个线程看来没有任何顺序保证。**编译器、CPU 都可能重排指令，写入的值何时对别的线程可见也不确定。7 节开头那两个“结果不是预期”的例子，说的就是这件事。
- 用 `Atomics.store` 写入、用 `Atomics.load` 读出，才能保证“前面的写一定先于后面的读发生”。

### 6.3 常见误区

- `postMessage(sharedArrayBuffer)` 传的是共享内存，不是副本；两边改的是同一个地方。
- `SharedArrayBuffer.prototype.slice()` 返回的**也是** `SharedArrayBuffer`（一段新共享内存），不是 `ArrayBuffer`。
- `ArrayBuffer.isView()` 对 SAB 上的视图同样返回 `true`，判断不出底层是哪种 buffer；要区分得看 `view.buffer instanceof SharedArrayBuffer`。
- 共享内存不会被提前回收：只要还有一个线程持有视图，底层内存就一直活着。不小心“泄漏”一段共享内存，影响会跨线程持续存在。

## 7. Atomics 对象

多线程共享内存最大的问题是防止两个线程同时修改某个地址，以及修改后如何让其他线程同步。`Atomics` 保证所有共享内存操作都是“原子性”的，并能在所有线程内同步。

所谓“原子性操作”：一条普通命令编译后变成多条机器指令。单线程运行没问题；多线程共享内存时，这组指令执行期间可能插入其他线程的指令，导致结果出错。

```js
// 主线程
ia[42] = 314159 // 原先的值 191
ia[37] = 123456 // 原先的值 163

// Worker 线程
console.log(ia[37])
console.log(ia[42])
// 可能的结果
// 123456
// 191
```

主线程本意是先写 42 号再写 37 号，但编译器和 CPU 为优化可能调换这两个互不依赖的操作的顺序；Worker 线程执行到一半时来读取，就打印出`123456`和`191`。

下面是另一个例子。

```js
// 主线程
const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 100000)
const ia = new Int32Array(sab)

for (let i = 0; i < ia.length; i++) {
  ia[i] = primes.next() // 将质数放入 ia
}

// worker 线程
ia[112]++ // 错误
Atomics.add(ia, 112, 1) // 正确
```

`ia[112]++` 会被编译成多条机器指令，中间无法保证不插入其他线程的指令；两个线程同时自增，结果很可能都不正确。

`Atomics` 保证一个操作对应的多条机器指令作为整体运行、中间不被打断，从而避免线程竞争。所以`ia[112]++`要改写成`Atomics.add(ia, 112, 1)`。

`Atomics` 提供多种方法。

#### 7.1 Atomics.store()，Atomics.load()

`store()` 向共享内存写入数据，`load()` 从共享内存读出数据。比起直接读写，它们的好处是保证读写操作的原子性。

它们还解决一个问题：多个线程把共享内存的某个位置当作开关（flag），值一变就执行特定操作。这时必须保证该位置的赋值在它前面所有可能改写内存的操作之后执行，取值在它后面所有读取该位置的操作之前执行。`store()` 和 `load()` 就能做到，编译器不会为优化打乱指令顺序。

```js
Atomics.load(typedArray, index)
Atomics.store(typedArray, index, value)
```

`store()` 接受三个参数（视图、位置索引、值），返回`typedArray[index]`；`load()` 接受两个参数（视图、位置索引），同样返回`typedArray[index]`。

```js
// 主线程 main.js
ia[42] = 314159 // 原先的值 191
Atomics.store(ia, 37, 123456) // 原先的值是 163

// Worker 线程 worker.js
while (Atomics.load(ia, 37) == 163);
console.log(ia[37]) // 123456
console.log(ia[42]) // 314159
```

主线程对 42 号位置的赋值一定早于 37 号位置；Worker 线程在`Atomics.load()`之后取到的就是新值。

下面是另一个例子。

```js
// 主线程
const worker = new Worker('worker.js')
const length = 10
const size = Int32Array.BYTES_PER_ELEMENT * length
// 新建一段共享内存
const sharedBuffer = new SharedArrayBuffer(size)
const sharedArray = new Int32Array(sharedBuffer)
for (let i = 0; i < 10; i++) {
  // 向共享内存写入 10 个整数
  Atomics.store(sharedArray, i, 0)
}
worker.postMessage(sharedBuffer)
```

Worker 线程用`Atomics.load()`读取数据：

```js
// worker.js
self.addEventListener(
  'message',
  event => {
    const sharedArray = new Int32Array(event.data)
    for (let i = 0; i < 10; i++) {
      const arrayValue = Atomics.load(sharedArray, i)
      console.log(`The item at array index ${i} is ${arrayValue}`)
    }
  },
  false,
)
```

#### 7.2 Atomics.exchange()

Worker 线程写入数据既可以用`Atomics.store()`，也可以用`Atomics.exchange()`：前者返回写入的值，后者返回被替换的旧值。

```js
// Worker 线程
self.addEventListener(
  'message',
  event => {
    const sharedArray = new Int32Array(event.data)
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        const storedValue = Atomics.store(sharedArray, i, 1)
        console.log(`The item at array index ${i} is now ${storedValue}`)
      } else {
        const exchangedValue = Atomics.exchange(sharedArray, i, 2)
        console.log(`The item at array index ${i} was ${exchangedValue}, now 2`)
      }
    }
  },
  false,
)
```

#### 7.3 Atomics.wait()，Atomics.notify()

用`while`循环等待通知不高效，用在主线程还会卡顿，`Atomics`因此提供`wait()`和`notify()`，相当于锁内存：一个线程操作时让其他线程休眠，结束后再唤醒。

`Atomics.notify()` 以前叫`Atomics.wake()`，后来改名。

```js
// Worker 线程
self.addEventListener(
  'message',
  event => {
    const sharedArray = new Int32Array(event.data)
    const arrayIndex = 0
    const expectedStoredValue = 50
    Atomics.wait(sharedArray, arrayIndex, expectedStoredValue)
    console.log(Atomics.load(sharedArray, arrayIndex))
  },
  false,
)
```

只要`sharedArray[0]`等于`50`，Worker 线程就在这一行进入休眠。

主线程更改指定位置的值后，就可以唤醒 Worker 线程。

```js
// 主线程
const newArrayValue = 100
Atomics.store(sharedArray, 0, newArrayValue)
const arrayIndex = 0
const queuePos = 1
Atomics.notify(sharedArray, arrayIndex, queuePos)
```

`sharedArray[0]`改为`100`后执行`Atomics.notify()`，唤醒该位置休眠队列里的一个线程。

`Atomics.wait()` 的使用格式如下。

```js
Atomics.wait(sharedArray, index, value, timeout)
```

四个参数：

- sharedArray：共享内存的视图数组。
- index：视图数据的位置（从0开始）。
- value：该位置的预期值。一旦实际值等于预期值，就进入休眠。
- timeout：整数，超过这个时间就自动唤醒，单位毫秒。可选，默认`Infinity`，即无限期休眠，只有`Atomics.notify()`才能唤醒。

`Atomics.wait()` 返回字符串，有三种可能：`sharedArray[index]` 不等于 `value` 时返回`not-equal`（不进入休眠）；被`notify()`唤醒返回`ok`；超时唤醒返回`timed-out`。

`Atomics.notify()` 的使用格式如下。

```js
Atomics.notify(sharedArray, index, count)
```

三个参数，前两个（`sharedArray`、`index`）与 `wait()` 相同，`count` 是需要唤醒的线程数量，默认`Infinity`。

`Atomics.notify()` 唤醒休眠的 Worker 线程后，它会继续往下运行。

看一个例子。

```js
// 主线程
console.log(ia[37]) // 163
Atomics.store(ia, 37, 123456)
Atomics.notify(ia, 37, 1)

// Worker 线程
Atomics.wait(ia, 37, 163)
console.log(ia[37]) // 123456
```

Worker 线程在`ia[37]`等于`163`时休眠；主线程写入`123456`后用`Atomics.notify()`唤醒它。

基于`wait`和`notify`的锁实现可参考 Lars T Hansen 的 [js-lock-and-condition](https://github.com/lars-t-hansen/js-lock-and-condition) 库。

浏览器主线程不宜休眠，这会导致用户失去响应；主线程实际上会拒绝进入休眠。

#### 7.4 运算方法

共享内存上某些运算不能被打断——运算过程中不能让其他线程改写内存上的值，Atomics 为此提供了一批运算方法。

```js
Atomics.add(sharedArray, index, value)
```

`Atomics.add` 把`value`加到`sharedArray[index]`，返回旧值。

```js
Atomics.sub(sharedArray, index, value)
```

`Atomics.sub` 从`sharedArray[index]`减去`value`，返回旧值。

```js
Atomics.and(sharedArray, index, value)
```

`Atomics.and` 把`value`与`sharedArray[index]`做位运算`and`后放回，返回旧值。

```js
Atomics.or(sharedArray, index, value)
```

`Atomics.or` 把`value`与`sharedArray[index]`做位运算`or`后放回，返回旧值。

```js
Atomics.xor(sharedArray, index, value)
```

`Atomic.xor` 把`value`与`sharedArray[index]`做位运算`xor`后放回，返回旧值。

#### 7.5 其他方法

`Atomics` 还有以下方法。

- `Atomics.compareExchange(sharedArray, index, oldval, newval)`：如果`sharedArray[index]`等于`oldval`，就写入`newval`，返回`oldval`。
- `Atomics.isLockFree(size)`：返回布尔值，表示 `Atomics` 是否能处理该 `size` 的内存锁定。返回 `false` 时应用需要自己实现锁定。

`Atomics.compareExchange` 的一个用途：从 SharedArrayBuffer 读一个值，做完操作后检查原值是否被其他线程改写过；没写过就写回原位置，写过就读取新值重新操作。

#### 7.6 同步模式：自旋锁与互斥锁

`Atomics.compareExchange` 是“检查并写入”的原子组合，可以把共享内存里的一个位置当作锁：约定 `0` 空闲、`1` 已占用。

```js
// 约定 state[0]：0 表示空闲，1 表示已占用
function acquire(state) {
  // 只有把 0 换成 1 成功，才算拿到锁；抢不到就自旋重试
  while (Atomics.compareExchange(state, 0, 0, 1) !== 0) {
    // 自旋等待
  }
}

function release(state) {
  Atomics.store(state, 0, 0)
  Atomics.notify(state, 0, 1) // 唤醒一个正在等待的线程
}
```

这里的 `while` 不能换成“先 `load` 检查、再 `store` 写入”：两步之间可能被别的线程插入，两个线程都读到 `0`、都以为自己拿到了锁。

纯自旋会持续占用 CPU，等待时间较长时应结合 `Atomics.wait()` 让线程真正休眠。但**主线程不能休眠**，`Atomics.wait()` 在主线程里会抛 `TypeError`。

```js
function acquireWithWait(state) {
  while (Atomics.compareExchange(state, 0, 0, 1) !== 0) {
    // 抢不到就休眠，最多等 100 毫秒再重试；只能在 Worker 线程里调用
    Atomics.wait(state, 0, 1, 100)
  }
}
```

`release` 里 `store` 必须在 `notify` 之前：`notify` 只负责唤醒，被唤醒的线程能读到正确的值靠的是 `store` 已完成（`Atomics` 的顺序保证）；反过来等待方可能被唤醒却读到旧值，又睡回去。

#### 7.7 同步模式：生产者-消费者

共享内存配合 `Atomics.wait()` / `notify()` 可以做一个不走 `postMessage` 的队列。下面用一段共享内存做简化的计数式队列：第 0 个位置存“已就绪的元素个数”，后面存数据。

```js
const shared = new Int32Array(new SharedArrayBuffer(1024 * 4))
const READY = 0 // 已就绪的元素个数
const DATA = 1 // 数据区起始位置

// 生产者：先写数据，再公布“多了一个”
function produce(value) {
  const count = Atomics.load(shared, READY)
  Atomics.store(shared, DATA + count, value)
  Atomics.add(shared, READY, 1)
  Atomics.notify(shared, READY, 1) // 叫醒一个正在等待的消费者
}

// 消费者（单消费者版本，只能在 Worker 线程里阻塞等待）
function consume() {
  while (Atomics.load(shared, READY) === 0) {
    Atomics.wait(shared, READY, 0) // 计数为 0 就休眠
  }
  const index = Atomics.sub(shared, READY, 1) // 取走一个，返回取走前的计数
  return Atomics.load(shared, DATA + index)
}
```

两个注意点：

- 生产者里“写数据”必须在“计数加一”**之前**，否则消费者可能先看到计数变成 1，再去读一个还没写好的位置。
- 上面是单消费者版本。多消费者同时等待时 `Atomics.load` 与 `Atomics.sub` 之间可能被插队，`sub` 返回负数就会读到错误位置；要用 `compareExchange` 循环重试，或用 `Atomics.add` 的返回值分配索引并做成环形缓冲。

#### 7.8 Atomics 方法一览与限制

[width(47,24,29)]

| 方法                                                      | 作用                       | 返回值                                 |
| --------------------------------------------------------- | -------------------------- | -------------------------------------- |
| `Atomics.load(ta, i)`                                     | 原子读                     | `ta[i]`                                |
| `Atomics.store(ta, i, v)`                                 | 原子写                     | 写入的值 `v`                           |
| `Atomics.exchange(ta, i, v)`                              | 原子替换                   | 替换前的旧值                           |
| `Atomics.compareExchange(ta, i, old, next)`               | 值等于 `old` 才写入 `next` | 写入前的旧值                           |
| `Atomics.add` / `sub` / `and` / `or` / `xor` `(ta, i, v)` | 原子加减、位运算           | 运算前的旧值                           |
| `Atomics.wait(ta, i, v, timeout?)`                        | 值等于 `v` 时休眠          | `'ok'` / `'not-equal'` / `'timed-out'` |
| `Atomics.waitAsync(ta, i, v, timeout?)`                   | 同上，但不阻塞线程         | `{ async, value }`                     |
| `Atomics.notify(ta, i, count?)`                           | 唤醒等待者                 | 实际唤醒的线程数                       |
| `Atomics.isLockFree(size)`                                | 该尺寸的操作是否天然无锁   | 布尔值                                 |

限制也要记住：

- 除 `isLockFree` 之外，参数必须是**基于 `SharedArrayBuffer` 的整型视图**（`Int8Array` 到 `BigUint64Array`）。传入普通 `ArrayBuffer` 上的视图或浮点视图（`Float32Array`、`Float64Array`）都会抛 `TypeError`。
- `wait` / `notify` 额外要求视图是 `Int32Array` 或 `BigInt64Array`，其他整型视图不行。
- 所有方法都**没有字节序参数**，一律按本机字节序读写；处理跨端序数据只能自己转换（见 3.5 节）。
- `wait` 不允许在主线程调用，会抛 `TypeError`；主线程需要等待时用 `waitAsync()`，它立即返回 `{ async: true, value: Promise }`，把阻塞变成异步。
- `Atomics` 保证的是**单个操作**的原子性，不是“一组操作整体原子”。跨多个位置的复合操作仍然需要锁，即上面 7.6 那种写法。
- 较新的引擎还引入了 `Atomics.pause()`，给自旋循环一个“让出 CPU”的提示，降低忙等功耗。它非常新，老环境没有，只能当优化而不能依赖。

## 8. 常见问题 (FAQ)

### 8.1 数据究竟存在哪？`ArrayBuffer` 和 `TypedArray` 谁才是“数组”？

- **数据都在 `ArrayBuffer` 里**，它只记录“有 N 个字节”，没有任何读写方法。
- `TypedArray` 是**视图**，自己不存数据，值来自 `view.buffer`。同一段内存可以叠多个视图，`v1[0] = 1` 会立刻在 `v2` 上体现（1.1 节的例子）。
- `new Uint8Array([1, 2, 3])` 隐式创建了底层 `ArrayBuffer`，可用 `ta.buffer` 拿到；此时 `ta.length` 和 `ta.byteLength` 都是 3，而 `new Float64Array(3)` 的 `length` 是 3、`byteLength` 是 24。

### 8.2 `new Int16Array(buffer, 1)` 为什么报错，而 `DataView` 却可以？

- `TypedArray` 要求 `byteOffset` 是**该类型字节数的整数倍**（`Int16Array` 要被 2 整除，`Float64Array` 要被 8 整除），否则抛 `RangeError`——这是硬件对未对齐访问的限制。
- `DataView` 的偏移可以是任意字节，所以只有它能解析“字段从第 5 个字节开始”这类不对齐结构。
- 想在任意偏移读 16 位整数，写 `new DataView(buffer).getUint16(5, false)`；`TypedArray` 没有等价写法，只能先换字节。

### 8.3 `DataView` 和 `TypedArray` 读同一段内存，结果为什么不一样？

- **字节序不同**。`TypedArray` 固定按本机字节序（绝大多数是小端）解释；`DataView` 的 `getUint16`、`getUint32` 等默认按**大端**解释，要小端必须显式传第二个参数 `true`。
- 换行时最容易出事：`dv.getUint16(1)` 和 `dv.getUint16(1, true)` 得到的是高低字节颠倒的两个值，漏掉 `true` 就会一路错下去。
- 判断本机字节序，除了第 4 节那段 IIFE，还有更短的写法：

```js
new Uint8Array(Uint16Array.of(1).buffer)[0] === 1
// true 表示小端：低位字节排在了前面
```

### 8.4 越界读写为什么不报错？怎么排查这类问题？

- TypedArray 的 `[i]` 读写越界是静默的：读得到 `undefined`，写入被丢弃。**不报错不代表写进去了**，按固定偏移解析数据时这是灾难性的。
- 对比之下，构造视图时的偏移/长度越界、`set()` 放不下都抛 `RangeError`；`subarray`、`slice`、`fill`、`copyWithin` 的下标是截断处理，同样不报错（见 2.5、2.6 节的表）。
- 排查时优先看三处：`length` 和 `byteLength` 是否弄混；视图是否带 `byteOffset`（下标相对视图，不是底层 buffer）；想要副本的地方是否误写成了 `subarray`。

### 8.5 `subarray` 和 `slice` 该用哪个？

- 要**共享**同一段内存（省内存、改一处两处都变）→ 用 `subarray`，它只新建一层视图。
- 要**独立**的副本（后续改动互不影响）→ 用 `slice`，它会复制字节。
- 两者参数完全相同（起始下标、结束下标，不含结束位），写错了也不报错，只会悄悄产生共享视图或多做一次复制，最容易埋 bug。

### 8.6 什么时候该用 TypedArray，什么时候该用普通数组？

- **用 TypedArray**：数值密集、类型统一、数据量大，或要跟二进制接口打交道（像素、音频采样、协议解析、WebAssembly 内存）。
- **用普通数组**：要存字符串或混合类型、长度频繁变化（`push` / `splice`）、要用 `JSON.stringify` 直接序列化。
- `JSON.stringify(new Uint8Array([1, 2]))` 得到 `{"0":1,"1":2}`，一个大整数下标的普通对象，不是数组字面量。要变成 `[1,2]` 得先 `Array.from` 或 `[...ta]`。

### 8.7 `SharedArrayBuffer` 为什么在我这儿用不了？

- 浏览器要求页面处于**跨源隔离**状态，需要服务器同时返回 `Cross-Origin-Opener-Policy: same-origin` 和 `Cross-Origin-Embedder-Policy: require-corp`（见 6.1 节）。
- 用 `self.crossOriginIsolated` 判断，返回 `false` 说明没生效。常见原因两个：响应头没加上，或页面加载了没声明 `Cross-Origin-Resource-Policy` 的跨源资源，`require-corp` 没通过校验。
- Node.js 不存在这个门槛，`new SharedArrayBuffer(1024)` 直接可用，所以同一份代码在 Node 里测试通过、搬进浏览器就挂，是这类问题的典型表现。

### 8.8 `Atomics.wait()` 为什么在主线程抛错？

- 休眠主线程等于页面卡死，浏览器直接禁止：在主线程里调用会抛 `TypeError`。
- 主线程要用 `Atomics.waitAsync()`，它立即返回 `{ async: true, value: Promise }`，Promise 在对应的 `notify()` 之后兑现，等待过程不阻塞渲染。
- 更省事的做法是分工：让 Worker 负责 `wait` / `notify`，主线程只做 `Atomics.store()` 和 `Atomics.load()`，主线程从不阻塞，也用不到 `waitAsync`。
