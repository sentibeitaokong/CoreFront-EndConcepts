/*
 * 示例代码：arrayBuffer.md
 * 来源文档：apps/docs/js/advanced/misc/arrayBuffer.md
 * 由文档代码块原样提取。以下每个代码块均置于注释中，便于对照阅读；
 * 如需运行某段，可将其反注释后单独执行。
 */

// ===== 1.1 ArrayBuffer定义 =====
// const buf = new ArrayBuffer(32)

// ===== 1.1 ArrayBuffer定义 =====
// const buf = new ArrayBuffer(32)
// const dataView = new DataView(buf)
// dataView.getUint8(0) // 0

// ===== 1.1 ArrayBuffer定义 =====
// const buffer = new ArrayBuffer(12)
//
// const x1 = new Int32Array(buffer)
// x1[0] = 1
// const x2 = new Uint8Array(buffer)
// x2[0] = 2
//
// x1[0] // 2

// ===== 1.1 ArrayBuffer定义 =====
// const typedArray = new Uint8Array([0, 1, 2])
// typedArray.length // 3
//
// typedArray[0] = 5
// typedArray // [5, 1, 2]

// ===== 1.ArrayBuffer.prototype.byteLength =====
// const buffer = new ArrayBuffer(32)
// buffer.byteLength
// // 32

// ===== 1.ArrayBuffer.prototype.byteLength =====
// if (buffer.byteLength === n) {
//   // 成功
// } else {
//   // 失败
// }

// ===== 2. ArrayBuffer.prototype.slice() =====
// const buffer = new ArrayBuffer(8)
// const newBuffer = buffer.slice(0, 3)

// ===== 3. ArrayBuffer.isView() =====
// const buffer = new ArrayBuffer(8)
// ArrayBuffer.isView(buffer) // false
//
// const v = new Int32Array(buffer)
// ArrayBuffer.isView(v) // true

// ===== 2.2 构造函数 =====
// // 创建一个8字节的ArrayBuffer
// const b = new ArrayBuffer(8)
//
// // 创建一个指向b的Int32视图，开始于字节0，直到缓冲区的末尾
// const v1 = new Int32Array(b)
//
// // 创建一个指向b的Uint8视图，开始于字节2，直到缓冲区的末尾
// const v2 = new Uint8Array(b, 2)
//
// // 创建一个指向b的Int16视图，开始于字节2，长度为2
// const v3 = new Int16Array(b, 2, 2)

// ===== 2.2 构造函数 =====
// const buffer = new ArrayBuffer(8)
// const i16 = new Int16Array(buffer, 1)
// // Uncaught RangeError: start offset of Int16Array should be a multiple of 2

// ===== 2.2 构造函数 =====
// const f64a = new Float64Array(8)
// f64a[0] = 10
// f64a[1] = 20
// f64a[2] = f64a[0] + f64a[1]

// ===== 2.2 构造函数 =====
// const typedArray = new Int8Array(new Uint8Array(4))

// ===== 2.2 构造函数 =====
// const x = new Int8Array([1, 1])
// const y = new Int8Array(x)
// x[0] // 1
// y[0] // 1
//
// x[0] = 2
// y[0] // 1

// ===== 2.2 构造函数 =====
// const x = new Int8Array([1, 1])
// const y = new Int8Array(x.buffer)
// x[0] // 1
// y[0] // 1
//
// x[0] = 2
// y[0] // 2

// ===== 2.2 构造函数 =====
// const typedArray = new Uint8Array([1, 2, 3, 4])

// ===== 2.2 构造函数 =====
// const normalArray = [...typedArray]
// // or
// const normalArray = Array.from(typedArray)
// // or
// const normalArray = Array.prototype.slice.call(typedArray)

// ===== 2.3 TypedArray 数组方法 =====
// function concatenate(resultConstructor, ...arrays) {
//   let totalLength = 0
//   for (let arr of arrays) {
//     totalLength += arr.length
//   }
//   let result = new resultConstructor(totalLength)
//   let offset = 0
//   for (let arr of arrays) {
//     result.set(arr, offset)
//     offset += arr.length
//   }
//   return result
// }
//
// concatenate(Uint8Array, Uint8Array.of(1, 2), Uint8Array.of(3, 4))
// // Uint8Array [1, 2, 3, 4]

// ===== 2.3 TypedArray 数组方法 =====
// let ui8 = Uint8Array.of(0, 1, 2)
// for (let byte of ui8) {
//   console.log(byte)
// }
// // 0
// // 1
// // 2

// ===== 1. TypedArray.prototype.buffer =====
// const a = new Float32Array(64)
// const b = new Uint8Array(a.buffer)

// ===== 2. TypedArray.prototype.byteLength，TypedArray.prototype.byteOffset =====
// const b = new ArrayBuffer(8)
//
// const v1 = new Int32Array(b)
// const v2 = new Uint8Array(b, 2)
// const v3 = new Int16Array(b, 2, 2)
//
// v1.byteLength // 8
// v2.byteLength // 6
// v3.byteLength // 4
//
// v1.byteOffset // 0
// v2.byteOffset // 2
// v3.byteOffset // 2

// ===== 3.TypedArray.prototype.length =====
// const a = new Int16Array(8)
//
// a.length // 8
// a.byteLength // 16

// ===== 4. TypedArray.prototype.set() =====
// const a = new Uint8Array(8)
// const b = new Uint8Array(8)
//
// b.set(a)

// ===== 4. TypedArray.prototype.set() =====
// const a = new Uint16Array(8)
// const b = new Uint16Array(10)
//
// b.set(a, 2)

// ===== 5. TypedArray.prototype.subarray() =====
// const a = new Uint16Array(8)
// const b = a.subarray(2, 3)
//
// a.byteLength // 16
// b.byteLength // 2

// ===== 6. TypedArray.prototype.slice() =====
// let ui8 = Uint8Array.of(0, 1, 2)
// ui8.slice(-1)
// // Uint8Array [ 2 ]

// ===== 7. TypedArray.of() =====
// Float32Array.of(0.151, -8, 3.7)
// // Float32Array [ 0.151, -8, 3.7 ]

// ===== 7. TypedArray.of() =====
// // 方法一
// let tarr = new Uint8Array([1, 2, 3])
//
// // 方法二
// let tarr = Uint8Array.of(1, 2, 3)
//
// // 方法三
// let tarr = new Uint8Array(3)
// tarr[0] = 1
// tarr[1] = 2
// tarr[2] = 3

// ===== 8. TypedArray.from() =====
// Uint16Array.from([0, 1, 2])
// // Uint16Array [ 0, 1, 2 ]

// ===== 8. TypedArray.from() =====
// const ui16 = Uint16Array.from(Uint8Array.of(0, 1, 2))
// ui16 instanceof Uint16Array // true

// ===== 8. TypedArray.from() =====
// Int8Array.of(127, 126, 125).map(x => 2 * x)
// // Int8Array [ -2, -4, -6 ]
//
// Int16Array.from(Int8Array.of(127, 126, 125), x => 2 * x)
// // Int16Array [ 254, 252, 250 ]

// ===== 3. 复合视图 =====
// const buffer = new ArrayBuffer(24)
//
// const idView = new Uint32Array(buffer, 0, 1)
// const usernameView = new Uint8Array(buffer, 4, 16)
// const amountDueView = new Float32Array(buffer, 20, 1)

// ===== 3. 复合视图 [c] =====
// struct someStruct {
//   unsigned long id;
//   char username[16];
//   float amountDue;
// };

// ===== 3.1 字节序 =====
// const buffer = new ArrayBuffer(16)
// const int32View = new Int32Array(buffer)
//
// for (let i = 0; i < int32View.length; i++) {
//   int32View[i] = i * 2
// }

// ===== 3.1 字节序 =====
// const int16View = new Int16Array(buffer)
//
// for (let i = 0; i < int16View.length; i++) {
//   console.log('Entry ' + i + ': ' + int16View[i])
// }
// // Entry 0: 0
// // Entry 1: 0
// // Entry 2: 2
// // Entry 3: 0
// // Entry 4: 4
// // Entry 5: 0
// // Entry 6: 6
// // Entry 7: 0

// ===== 3.1 字节序 =====
// // 假定某段buffer包含如下字节 [0x02, 0x01, 0x03, 0x07]
// const buffer = new ArrayBuffer(4)
// const v1 = new Uint8Array(buffer)
// v1[0] = 2
// v1[1] = 1
// v1[2] = 3
// v1[3] = 7
//
// const uInt16View = new Uint16Array(buffer)
//
// // 计算机采用小端字节序
// // 所以头两个字节等于258
// if (uInt16View[0] === 258) {
//   console.log('OK') // "OK"
// }
//
// // 赋值运算
// uInt16View[0] = 255 // 字节变为[0xFF, 0x00, 0x03, 0x07]
// uInt16View[0] = 0xff05 // 字节变为[0x05, 0xFF, 0x03, 0x07]
// uInt16View[1] = 0x0210 // 字节变为[0x05, 0xFF, 0x10, 0x02]

// ===== 3.1 字节序 =====
// const BIG_ENDIAN = Symbol('BIG_ENDIAN')
// const LITTLE_ENDIAN = Symbol('LITTLE_ENDIAN')
//
// function getPlatformEndianness() {
//   let arr32 = Uint32Array.of(0x12345678)
//   let arr8 = new Uint8Array(arr32.buffer)
//   switch (arr8[0] * 0x1000000 + arr8[1] * 0x10000 + arr8[2] * 0x100 + arr8[3]) {
//     case 0x12345678:
//       return BIG_ENDIAN
//     case 0x78563412:
//       return LITTLE_ENDIAN
//     default:
//       throw new Error('Unknown endianness')
//   }
// }

// ===== 3.2 BYTES_PER_ELEMENT 属性 =====
// Int8Array.BYTES_PER_ELEMENT // 1
// Uint8Array.BYTES_PER_ELEMENT // 1
// Uint8ClampedArray.BYTES_PER_ELEMENT // 1
// Int16Array.BYTES_PER_ELEMENT // 2
// Uint16Array.BYTES_PER_ELEMENT // 2
// Int32Array.BYTES_PER_ELEMENT // 4
// Uint32Array.BYTES_PER_ELEMENT // 4
// Float32Array.BYTES_PER_ELEMENT // 4
// Float64Array.BYTES_PER_ELEMENT // 8

// ===== 3.3 ArrayBuffer 与字符串的互相转换 =====
// /**
//  * Convert ArrayBuffer/TypedArray to String via TextDecoder
//  *
//  * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
//  */
// function ab2str(
//   input: ArrayBuffer | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array,
//   outputEncoding: string = 'utf8',
// ): string {
//   const decoder = new TextDecoder(outputEncoding)
//   return decoder.decode(input)
// }
//
// /**
//  * Convert String to ArrayBuffer via TextEncoder
//  *
//  * @see https://developer.mozilla.org/zh-CN/docs/Web/API/TextEncoder
//  */
// function str2ab(input: string): ArrayBuffer {
//   const view = str2Uint8Array(input)
//   return view.buffer
// }
//
// /** Convert String to Uint8Array */
// function str2Uint8Array(input: string): Uint8Array {
//   const encoder = new TextEncoder()
//   const view = encoder.encode(input)
//   return view
// }

// ===== 3.4 溢出 =====
// const uint8 = new Uint8Array(1)
//
// uint8[0] = 256
// uint8[0] // 0
//
// uint8[0] = -1
// uint8[0] // 255

// ===== 3.4 溢出 =====
// 12 % 4 // 0
// 12 % 5 // 2

// ===== 3.4 溢出 =====
// const int8 = new Int8Array(1)
//
// int8[0] = 128
// int8[0] // -128
//
// int8[0] = -129
// int8[0] // 127

// ===== 3.4 溢出 =====
// const uint8c = new Uint8ClampedArray(1)
//
// uint8c[0] = 256
// uint8c[0] // 255
//
// uint8c[0] = -1
// uint8c[0] // 0

// ===== 4. DataView 视图 =====
// new DataView(ArrayBuffer buffer [, 字节起始位置 [, 长度]]);

// ===== 4. DataView 视图 =====
// const buffer = new ArrayBuffer(24)
// const dv = new DataView(buffer)

// ===== 4. DataView 视图 =====
// const buffer = new ArrayBuffer(24)
// const dv = new DataView(buffer)
//
// // 从第1个字节读取一个8位无符号整数
// const v1 = dv.getUint8(0)
//
// // 从第2个字节读取一个16位无符号整数
// const v2 = dv.getUint16(1)
//
// // 从第4个字节读取一个16位无符号整数
// const v3 = dv.getUint16(3)

// ===== 4. DataView 视图 =====
// // 小端字节序
// const v1 = dv.getUint16(1, true)
//
// // 大端字节序
// const v2 = dv.getUint16(3, false)
//
// // 大端字节序
// const v3 = dv.getUint16(3)

// ===== 4. DataView 视图 =====
// // 在第1个字节，以大端字节序写入值为25的32位整数
// dv.setInt32(0, 25, false)
//
// // 在第5个字节，以大端字节序写入值为25的32位整数
// dv.setInt32(4, 25)
//
// // 在第9个字节，以小端字节序写入值为2.5的32位浮点数
// dv.setFloat32(8, 2.5, true)

// ===== 4. DataView 视图 =====
// const littleEndian = (function () {
//   const buffer = new ArrayBuffer(2)
//   new DataView(buffer).setInt16(0, 256, true)
//   return new Int16Array(buffer)[0] === 256
// })()

// ===== 5.1 AJAX =====
// let xhr = new XMLHttpRequest()
// xhr.open('GET', someUrl)
// xhr.responseType = 'arraybuffer'
//
// xhr.onload = function () {
//   let arrayBuffer = xhr.response
//   // ···
// }
//
// xhr.send()

// ===== 5.1 AJAX =====
// xhr.onreadystatechange = function () {
//   if (req.readyState === 4) {
//     const arrayResponse = xhr.response
//     const dataView = new DataView(arrayResponse)
//     const ints = new Uint32Array(dataView.byteLength / 4)
//
//     xhrDiv.style.backgroundColor = '#00FF00'
//     xhrDiv.innerText = 'Array is ' + ints.length + 'uints long'
//   }
// }

// ===== 5.2 Canvas =====
// const canvas = document.getElementById('myCanvas')
// const ctx = canvas.getContext('2d')
//
// const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
// const uint8ClampedArray = imageData.data

// ===== 5.2 Canvas =====
// u8[i] = Math.min(255, Math.max(0, u8[i] * gamma))

// ===== 5.2 Canvas =====
// pixels[i] *= gamma

// ===== 5.3 WebSocket =====
// let socket = new WebSocket('ws://127.0.0.1:8081')
// socket.binaryType = 'arraybuffer'
//
// // Wait until socket is open
// socket.addEventListener('open', function (event) {
//   // Send binary data
//   const typedArray = new Uint8Array(4)
//   socket.send(typedArray.buffer)
// })
//
// // Receive binary data
// socket.addEventListener('message', function (event) {
//   const arrayBuffer = event.data
//   // ···
// })

// ===== 5.4 Fetch API =====
// fetch(url)
//   .then(function (response) {
//     return response.arrayBuffer()
//   })
//   .then(function (arrayBuffer) {
//     // ...
//   })

// ===== 5.5 File API =====
// const fileInput = document.getElementById('fileInput')
// const file = fileInput.files[0]
// const reader = new FileReader()
// reader.readAsArrayBuffer(file)
// reader.onload = function () {
//   const arrayBuffer = reader.result
//   // ···
// }

// ===== 5.5 File API =====
// const reader = new FileReader()
// reader.addEventListener('load', processimage, false)
// reader.readAsArrayBuffer(file)

// ===== 5.5 File API =====
// function processimage(e) {
//   const buffer = e.target.result
//   const datav = new DataView(buffer)
//   const bitmap = {}
//   // 具体的处理步骤
// }

// ===== 5.5 File API =====
// bitmap.fileheader = {}
// bitmap.fileheader.bfType = datav.getUint16(0, true)
// bitmap.fileheader.bfSize = datav.getUint32(2, true)
// bitmap.fileheader.bfReserved1 = datav.getUint16(6, true)
// bitmap.fileheader.bfReserved2 = datav.getUint16(8, true)
// bitmap.fileheader.bfOffBits = datav.getUint32(10, true)

// ===== 5.5 File API =====
// bitmap.infoheader = {}
// bitmap.infoheader.biSize = datav.getUint32(14, true)
// bitmap.infoheader.biWidth = datav.getUint32(18, true)
// bitmap.infoheader.biHeight = datav.getUint32(22, true)
// bitmap.infoheader.biPlanes = datav.getUint16(26, true)
// bitmap.infoheader.biBitCount = datav.getUint16(28, true)
// bitmap.infoheader.biCompression = datav.getUint32(30, true)
// bitmap.infoheader.biSizeImage = datav.getUint32(34, true)
// bitmap.infoheader.biXPelsPerMeter = datav.getUint32(38, true)
// bitmap.infoheader.biYPelsPerMeter = datav.getUint32(42, true)
// bitmap.infoheader.biClrUsed = datav.getUint32(46, true)
// bitmap.infoheader.biClrImportant = datav.getUint32(50, true)

// ===== 5.5 File API =====
// const start = bitmap.fileheader.bfOffBits
// bitmap.pixels = new Uint8Array(buffer, start)

// ===== 6. SharedArrayBuffer =====
// // 主线程
// const w = new Worker('myworker.js')

// ===== 6. SharedArrayBuffer =====
// // 主线程
// w.postMessage('hi')
// w.onmessage = function (ev) {
//   console.log(ev.data)
// }

// ===== 6. SharedArrayBuffer =====
// // Worker 线程
// onmessage = function (ev) {
//   console.log(ev.data)
//   postMessage('ho')
// }

// ===== 6. SharedArrayBuffer =====
// // 主线程
//
// // 新建 1KB 共享内存
// const sharedBuffer = new SharedArrayBuffer(1024)
//
// // 主线程将共享内存的地址发送出去
// w.postMessage(sharedBuffer)
//
// // 在共享内存上建立视图，供写入数据
// const sharedArray = new Int32Array(sharedBuffer)

// ===== 6. SharedArrayBuffer =====
// // Worker 线程
// onmessage = function (ev) {
//   // 主线程共享的数据，就是 1KB 的共享内存
//   const sharedBuffer = ev.data
//
//   // 在共享内存上建立视图，方便读写
//   const sharedArray = new Int32Array(sharedBuffer)
//
//   // ...
// }

// ===== 6. SharedArrayBuffer =====
// // 分配 10 万个 32 位整数占据的内存空间
// const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 100000)
//
// // 建立 32 位整数视图
// const ia = new Int32Array(sab) // ia.length == 100000
//
// // 新建一个质数生成器
// const primes = new PrimeGenerator()
//
// // 将 10 万个质数，写入这段内存空间
// for (let i = 0; i < ia.length; i++) ia[i] = primes.next()
//
// // 向 Worker 线程发送这段共享内存
// w.postMessage(ia)

// ===== 6. SharedArrayBuffer =====
// // Worker 线程
// let ia
// onmessage = function (ev) {
//   ia = ev.data
//   console.log(ia.length) // 100000
//   console.log(ia[37]) // 输出 163，因为这是第38个质数
// }

// ===== 7. Atomics 对象 =====
// // 主线程
// ia[42] = 314159 // 原先的值 191
// ia[37] = 123456 // 原先的值 163
//
// // Worker 线程
// console.log(ia[37])
// console.log(ia[42])
// // 可能的结果
// // 123456
// // 191

// ===== 7. Atomics 对象 =====
// // 主线程
// const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 100000)
// const ia = new Int32Array(sab)
//
// for (let i = 0; i < ia.length; i++) {
//   ia[i] = primes.next() // 将质数放入 ia
// }
//
// // worker 线程
// ia[112]++ // 错误
// Atomics.add(ia, 112, 1) // 正确

// ===== 7. Atomics 对象 =====
// Atomics.load(typedArray, index)
// Atomics.store(typedArray, index, value)

// ===== 7. Atomics 对象 =====
// // 主线程 main.js
// ia[42] = 314159 // 原先的值 191
// Atomics.store(ia, 37, 123456) // 原先的值是 163
//
// // Worker 线程 worker.js
// while (Atomics.load(ia, 37) == 163);
// console.log(ia[37]) // 123456
// console.log(ia[42]) // 314159

// ===== 7. Atomics 对象 =====
// // 主线程
// const worker = new Worker('worker.js')
// const length = 10
// const size = Int32Array.BYTES_PER_ELEMENT * length
// // 新建一段共享内存
// const sharedBuffer = new SharedArrayBuffer(size)
// const sharedArray = new Int32Array(sharedBuffer)
// for (let i = 0; i < 10; i++) {
//   // 向共享内存写入 10 个整数
//   Atomics.store(sharedArray, i, 0)
// }
// worker.postMessage(sharedBuffer)

// ===== 7. Atomics 对象 =====
// // worker.js
// self.addEventListener(
//   'message',
//   event => {
//     const sharedArray = new Int32Array(event.data)
//     for (let i = 0; i < 10; i++) {
//       const arrayValue = Atomics.load(sharedArray, i)
//       console.log(`The item at array index ${i} is ${arrayValue}`)
//     }
//   },
//   false,
// )

// ===== 7. Atomics 对象 =====
// // Worker 线程
// self.addEventListener(
//   'message',
//   event => {
//     const sharedArray = new Int32Array(event.data)
//     for (let i = 0; i < 10; i++) {
//       if (i % 2 === 0) {
//         const storedValue = Atomics.store(sharedArray, i, 1)
//         console.log(`The item at array index ${i} is now ${storedValue}`)
//       } else {
//         const exchangedValue = Atomics.exchange(sharedArray, i, 2)
//         console.log(`The item at array index ${i} was ${exchangedValue}, now 2`)
//       }
//     }
//   },
//   false,
// )

// ===== 7. Atomics 对象 =====
// // Worker 线程
// self.addEventListener(
//   'message',
//   event => {
//     const sharedArray = new Int32Array(event.data)
//     const arrayIndex = 0
//     const expectedStoredValue = 50
//     Atomics.wait(sharedArray, arrayIndex, expectedStoredValue)
//     console.log(Atomics.load(sharedArray, arrayIndex))
//   },
//   false,
// )

// ===== 7. Atomics 对象 =====
// // 主线程
// const newArrayValue = 100
// Atomics.store(sharedArray, 0, newArrayValue)
// const arrayIndex = 0
// const queuePos = 1
// Atomics.notify(sharedArray, arrayIndex, queuePos)

// ===== 7. Atomics 对象 =====
// Atomics.wait(sharedArray, index, value, timeout)

// ===== 7. Atomics 对象 =====
// Atomics.notify(sharedArray, index, count)

// ===== 7. Atomics 对象 =====
// // 主线程
// console.log(ia[37]) // 163
// Atomics.store(ia, 37, 123456)
// Atomics.notify(ia, 37, 1)
//
// // Worker 线程
// Atomics.wait(ia, 37, 163)
// console.log(ia[37]) // 123456

// ===== 7. Atomics 对象 =====
// Atomics.add(sharedArray, index, value)

// ===== 7. Atomics 对象 =====
// Atomics.sub(sharedArray, index, value)

// ===== 7. Atomics 对象 =====
// Atomics.and(sharedArray, index, value)

// ===== 7. Atomics 对象 =====
// Atomics.or(sharedArray, index, value)

// ===== 7. Atomics 对象 =====
// Atomics.xor(sharedArray, index, value)

