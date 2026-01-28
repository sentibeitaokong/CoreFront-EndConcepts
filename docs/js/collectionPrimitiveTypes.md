---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# javascript **集合引用类型**

1.  **索引集合 (Indexed Collections)**: `Array`, `TypedArray`
2.  **键值集合 (Keyed Collections)**: `Map`, `Set`, `WeakMap`, `WeakSet`
3.  **传统结构**: `Object`

## 1. Array (数组)

*   **定义**：数组是一个**有序**的列表，用于存储多个值。
*   **类型**：在 javascript 中，数组本质上是特殊的**对象** (`typeof [] === 'object'`)。
*   **特性**：
    1.  **动态大小**：不需要预先指定长度，随时可以增删。
    2.  **混合类型**：同一个数组可以存储不同类型的数据（数字、字符串、对象、函数等）。
    3.  **零基索引**：索引从 `0` 开始。

### 1.1 创建数组的方式

| 方式 | 代码示例 | 说明 |
| :--- | :--- | :--- |
| **字面量 (推荐)** | `const arr = [1, 2, 3];` | 最简洁，性能最好。 |
| **构造函数** | `const arr = new Array(1, 2);` | **坑**：`new Array(3)` 会创建长度为3的空数组，而不是 `[3]`。 |
| **Array.of** | `const arr = Array.of(3);` | 修复了构造函数的坑，结果为 `[3]`。 |
| **Array.from** | `Array.from('hello');` | 将**类数组**或**可迭代对象**（如字符串、Set、Arguments）转为真数组。 |

### 1.2 属性 (Properties)

*   **`length`**:
    *   获取数组长度：`arr.length`
    *   **可写性**：**修改 `length` 会改变数组！**
        ```js
        const arr = [1, 2, 3, 4, 5];
        arr.length = 2;
        console.log(arr); // [1, 2] (截断了)
        arr.length = 0;   // (清空数组的常用技巧)
        ```
### 1.3 [核心 API 速查表](https://web.nodejavascript.cn/en-us/docs/web/javascript/reference/global_objects/array/)
这是 javascript 中 **Array (数组)** 的详细技术文档。数组是 javascript 中最核心、使用频率最高的数据结构之一。

#### 1. 增删改 (Mutator Methods) - ⚠️ **会改变原数组**

| 方法 | 描述 | 返回值 | 示例 |
| :--- | :--- | :--- | :--- |
| **`push()`** | 在**末尾**添加元素 | 新数组的长度 | `arr.push(4)` |
| **`pop()`** | 删除**末尾**元素 | 被删除的元素 | `arr.pop()` |
| **`unshift()`** | 在**开头**添加元素 | 新数组的长度 | `arr.unshift(0)` |
| **`shift()`** | 删除**开头**元素 | 被删除的元素 | `arr.shift()` |
| **`splice()`** | **万能方法**：增/删/改 | 被删除元素组成的数组 | `arr.splice(1, 1, 'new')` (从索引1删1个，插入'new') |
| **`sort()`** | 排序 | 排序后的数组引用 | ⚠️ 默认按字符串排序。需传入函数 `(a,b) => a-b` |
| **`reverse()`** | 反转顺序 | 反转后的数组引用 | `arr.reverse()` |
| **`fill()`** | 用静态值填充 | 数组本身 | `new Array(3).fill(0)` -> `[0,0,0]` |

#### 2. 访问与查询 (Accessor Methods) - ✅ **返回新结果，不改原数组**

| 方法 | 描述 | 示例 |
| :--- | :--- | :--- |
| **`concat()`** | 合并多个数组 | `arr1.concat(arr2)` |
| **`slice()`** | 截取子数组 (左闭右开) | `arr.slice(1, 3)` (含索引1，不含3) |
| **`join()`** | 数组转字符串 | `arr.join('-')` -> `"1-2-3"` |
| **`indexOf()`** | 查找元素索引 (不存在返 -1) | `arr.indexOf('a')` |
| **`includes()`** | 是否包含元素 (ES7) | `arr.includes('a')` (能正确判断 `NaN`) |
| **`flat()`** | 拍平多维数组 (ES2019) | `[1, [2, 3]].flat()` -> `[1, 2, 3]` |

#### 3. 迭代与高阶函数 (Iteration Methods)

| 方法 | 作用 | 返回值 | 说明 |
| :--- | :--- | :--- | :--- |
| **`forEach()`** | 遍历 | `undefined` | 无法使用 `break` 跳出循环。 |
| **`map()`** | 映射 | **新数组** | 对每一项运行函数，返回处理后的结果。 |
| **`filter()`** | 过滤 | **新数组** | 保留回调函数返回 `true` 的项。 |
| **`find()`** | 查找 | 元素 / `undefined` | 返回**第一个**符合条件的元素。 |
| **`findIndex()`**| 查找下标 | 索引 / `-1` | 返回**第一个**符合条件的索引。 |
| **`some()`** | 存在性检测 | `Boolean` | **只要有一个**符合条件就返回 true。 |
| **`every()`** | 全员检测 | `Boolean` | **所有元素**都符合条件才返回 true。 |
| **`reduce()`** | 累加/归并 | **任意值** | 最强大的方法，将数组缩减为一个值。 |

**`reduce` 示例：计算总和**
```js
const nums = [1, 2, 3, 4];
const sum = nums.reduce((acc, current) => acc + current, 0); 
// 0 是初始值，acc 是累加器
// 结果: 10
```
### 1.4  ES2022+ 新特性

*   **`at(index)`**: 支持负数索引。
    ```js
    const arr = ['a', 'b', 'c'];
    console.log(arr.at(-1)); // 'c' (获取最后一个元素)
    ```
*   **`findLast()` / `findLastIndex()`**: 从后往前查找。
*   **`toSorted()`, `toReversed()`, `toSpliced()`**:
    *   对应 `sort`, `reverse`, `splice` 的**不改变原数组**版本。它们会返回一个新的数组。

### 1.5  常见面试题与避坑指南

#### Q1: 如何判断一个变量是数组？
```js
// ✅ 最佳方案
Array.isArray(obj); 

// ❌ 旧方案 (不可靠，跨 iframe 会失效)
obj instanceof Array; 

// ✅ 备用方案 (原理级)
Object.prototype.toString.call(obj) === '[object Array]';
```

#### Q2: 如何去重？
```js
const arr = [1, 2, 2, 3, 3];

// ✅ 方案一：使用 Set (最快)
const unique = [...new Set(arr)];

// 方案二：使用 filter
const unique2 = arr.filter((item, index) => arr.indexOf(item) === index);
```

#### Q3: `map` 和 `forEach` 的区别？
*   `forEach` 只是单纯循环，没有返回值（返回 `undefined`），用于执行副作用（如打印日志、写入数据库）。
*   `map` 会根据回调函数的返回值生成一个**新数组**，原数组不变。

#### Q4: 空位 (Sparse Array) 问题
```js
const arr = [1, , 3]; // 长度为 3，中间是空位 (empty slot)

arr.forEach(i => console.log(i)); // 输出 1, 3 (forEach 跳过空位)
arr.map(i => i * 2);              // [2, empty, 6] (map 保留空位)
arr.join('-');                    // "1--3" (空位被视为空字符串)
```
**建议**：尽量避免创建稀疏数组，可以使用 `Array.from({length: 3})` 来创建初始化的数组。

#### Q5: 数组也是引用类型
```js
const a = [1, 2];
const b = a; 
b.push(3);
console.log(a); // [1, 2, 3] -> a 也变了，因为 b 和 a 指向内存中同一个地址。
```
若要复制数组（浅拷贝），请使用 `const b = [...a]` 或 `const b = a.slice()`。

## 2. TypedArray (定型数组)

TypedArray 不是一个名为 `TypedArray` 的构造函数，而是一组**视图类**的总称(如 `Int8Array`, `Float32Array` 等),用于处理二进制数据的类数组对象，底层基于 `ArrayBuffer`。

### 2.1 核心概念

它由两部分组成：
1.  **ArrayBuffer (缓冲区)**: 这是内存中实际存储原始二进制数据的“仓库”。它是一块连续的内存，我们**不能直接操作**它。
2.  **View (视图)**: 即 TypedArray。它是操作 ArrayBuffer 的“窗口”或“镜头”。它规定了这块内存应该被解读成什么数据类型（是 8 位整数，还是 32 位浮点数？）。

**关系图解**：
`[ 00000000 | 11111111 ]` -> **ArrayBuffer** (16 bits)
`[    0     |    255   ]` -> **Uint8Array** (把它看作 2 个 8 位无符号整数)
`[        255         ]` -> **Uint16Array** (把它看作 1 个 16 位无符号整数)


### 2.2 视图类型列表

| 构造函数名称 | 数据类型 | 字节大小 (Bytes) | 描述 | 取值范围 |
| :--- | :--- | :--- | :--- | :--- |
| **`Int8Array`** | 8-bit int | 1 | 8位有符号整数 | -128 ~ 127 |
| **`Uint8Array`** | 8-bit unsigned int | 1 | 8位无符号整数 (常用于字节流) | 0 ~ 255 |
| **`Uint8ClampedArray`** | 8-bit unsigned int | 1 | **Canvas 专用** (溢出时截断而非取模) | 0 ~ 255 |
| **`Int16Array`** | 16-bit int | 2 | 16位有符号整数 | -32768 ~ 32767 |
| **`Uint16Array`** | 16-bit unsigned int | 2 | 16位无符号整数 | 0 ~ 65535 |
| **`Int32Array`** | 32-bit int | 4 | 32位有符号整数 | 约 -21亿 ~ 21亿 |
| **`Uint32Array`** | 32-bit unsigned int | 4 | 32位无符号整数 | 0 ~ 约 42亿 |
| **`Float32Array`** | 32-bit float | 4 | **WebGL 标准**浮点数 | 约 7 位小数精度 |
| **`Float64Array`** | 64-bit float | 8 | 双精度浮点数 (同普通 javascript Number) | 约 16 位小数精度 |
| **`BigInt64Array`** | 64-bit bigint | 8 | 64位有符号大整数 | (需用 `10n` 语法) |
| **`BigUint64Array`** | 64-bit unsigned bigint | 8 | 64位无符号大整数 | (需用 `10n` 语法) |

### 2.3 创建方式

#### 1. 通过长度创建 (分配新内存)
```js
// 创建一个包含 16 个元素的 32 位整数数组
// 占用内存 = 16 * 4 bytes = 64 bytes
const i32 = new Int32Array(16); 
// 默认所有元素初始化为 0
```

#### 2. 通过数组/可迭代对象创建
```js
const u8 = new Uint8Array([1, 2, 3]);
const fromSet = new Float32Array(new Set([1.1, 2.2]));
```

#### 3. 通过 TypedArray 复制
```js
const x = new Int8Array([10, 20]);
const y = new Int8Array(x); // 复制数据，创建新的内存块
```

#### 3.4 **基于 ArrayBuffer 创建视图** (最重要)
这是实现“多视图共享同一块内存”的方式。
```js
const buffer = new ArrayBuffer(16); // 16 字节的内存

// 视图1: 把这 16 字节看作 4 个 32 位整数
const view1 = new Int32Array(buffer); 

// 视图2: 把这 16 字节看作 16 个 8 位整数
const view2 = new Uint8Array(buffer);

view1[0] = 1; // 修改第一个 32 位整数
console.log(view2[0]); // 1 (底层的字节变了，所有视图都能看到变化)
```

### 2.4 属性与方法

TypedArray 拥有普通数组的大部分方法，但有几个关键区别：
1.  **长度不可变**：一旦创建，不能改变大小。
2.  **无增删方法**：没有 `push`, `pop`, `splice`, `shift`, `unshift`。

### 2.4 [核心 API](https://web.nodejavascript.cn/en-us/docs/web/javascript/reference/global_objects/typedarray/)
TypedArray数组是在 ES6 中为了高效处理**二进制数据**（如 WebGL 纹理、Canvas 像素数据、音频处理、文件 I/O）而引入的核心 API。


#### 1. 实例属性
*   `buffer`: 返回引用的 ArrayBuffer。
*   `byteLength`: 占用的字节长度 (只读)。
*   `byteOffset`: 偏移量 (只读)。
*   `length`: 元素个数 (只读)。

#### 2. 核心方法
*   **`set(array, offset)`**:
    高效地将一个数组（或 TypedArray）的值写入当前 TypedArray。
    ```js
    const arr = new Uint8Array(10);
    arr.set([1, 2, 3], 2); // 从索引 2 开始写入
    // arr 变成 [0, 0, 1, 2, 3, 0, 0, 0, 0, 0]
    ```

*   **`subarray(begin, end)`**:
    创建一个新的视图，**共享同一块内存**（这是与 `slice` 的区别，`slice` 会复制数据）。
    ```js
    const a = new Int8Array([1, 2, 3, 4]);
    const sub = a.subarray(0, 2); // 指向 [1, 2] 的视图
    sub[0] = 99;
    console.log(a[0]); // 99 (因为内存是共享的)
    ```

*   **常规迭代方法**:
    `map`, `filter`, `reduce`, `forEach`, `find`, `some`, `every`, `sort`, `reverse`, `join`, `fill` 等均可用。
    *注意：`map`, `filter` 等返回新数组的方法会返回相同类型的 TypedArray。*

### 2.5 常见问题与陷阱

#### Q1: 溢出与截断 (Overflow behavior)
这是最容易出 Bug 的地方。

*   **常规 TypedArray (如 `Uint8Array`)**: 执行 **模运算 (Modulo arithmetic)**。
    ```js
    const uint8 = new Uint8Array(1);
    uint8[0] = 256; // 256 % 256 = 0
    uint8[0] = -1;  // 等同于 255 (二进制补码解释为无符号)
    ```

*   **ClampedArray (如 `Uint8ClampedArray`)**: 执行 **饱和运算 (Saturation)**。
    通常用于 Canvas 图像处理，防止颜色数值错乱。
    ```js
    const clamped = new Uint8ClampedArray(1);
    clamped[0] = 256; // 超过最大值 -> 锁定在 255
    clamped[0] = -10; // 低于最小值 -> 锁定在 0
    clamped[0] = 10.6; // 自动四舍五入 -> 11 (普通 Uint8Array 是向下取整)
    ```

#### Q2: 字节序 (Endianness) 是什么？
当用多字节视图（如 `Int32`）读取内存时，字节的排列顺序（大端序或小端序）取决于 CPU 架构。
*   大多数现代 PC/手机 是**小端序 (Little-Endian)**（低位字节在低地址）。
*   网络传输通常用**大端序 (Big-Endian)**。
*   **解决方案**: 如果需要精确控制字节序读取（例如解析二进制文件头），请使用 **`DataView`**，而不要直接用 `Int32Array`。

#### Q3: 为什么 TypedArray 比普通数组快？
1.  **内存连续**：跳过链表式查找，直接指针偏移。
2.  **类型固定**：javascript 引擎不需要在运行时检查每个元素的类型（是字符串还是数字？），直接按机器码执行运算。

#### Q4: 与普通数组的转换
```js
// TypedArray -> Array
const typed = new Uint8Array([1, 2, 3]);
const normal = [...typed]; // 或者 Array.from(typed)

// Array -> TypedArray
const typed2 = new Uint8Array(normal);
```

## 3. Object (对象)
javascript 中的几乎所有事物都是对象。理解对象，就是理解 javascript 的核心。

### 3.1 **核心概念**
对象 (Object) 是一个由**键值对 (key-value pairs)** 组成的无序集合。它像一个容器，用来封装和组织相关的数据（属性）和功能（方法）。
*   **键 (Key)**: 必须是字符串或 `Symbol`。如果使用非字符串，会被自动转换。
*   **值 (Value)**: 可以是任何 javascript 数据类型，包括另一个对象。

#### **1. 什么是对象？**
对象 (Object) 是一个由**键值对 (key-value pairs)** 组成的无序集合。它像一个容器，用来封装和组织相关的数据（属性）和功能（方法）。
*   **键 (Key)**: 必须是字符串或 `Symbol`。如果使用非字符串，会被自动转换。
*   **值 (Value)**: 可以是任何 javascript 数据类型，包括另一个对象。

#### **2. 创建对象**
1.  **对象字面量 (Object Literal)** - **最常用**
    ```js
    const person = {
      name: "Alice",
      age: 30,
      "is-developer": true, // 键包含特殊字符时，用引号包裹
      greet() { // ES6 方法简写
        console.log(`Hello, I'm ${this.name}`);
      }
    };
    ```

2.  **构造函数 (Constructor)**
    ```js
    const car = new Object();
    car.make = "Toyota";
    car.model = "Camry";
    ```

#### **3. 属性的访问、修改与删除 (CRUD)**

*   **读取 (Read)**
    *   **点符号 (Dot Notation)**: `person.name` (推荐，更简洁)
    *   **方括号符号 (Bracket Notation)**: `person['age']`
        *   **必须使用方括号的场景**:
            1.  键是包含特殊字符的字符串: `person['is-developer']`
            2.  键是一个变量: `const prop = 'name'; console.log(person[prop]);`

*   **创建/更新 (Create/Update)**
    ```js
    person.city = "New York"; // 添加新属性
    person.age = 31;         // 更新现有属性
    ```

*   **删除 (Delete)**
    ```js
    delete person.age;
    ```

#### **4. 对象迭代**
遍历对象自身的、可枚举的属性。

| 方法 | 描述 | 示例 |
| :--- | :--- | :--- |
| **`for...in`** (旧方式) | 遍历对象及其**原型链**上所有可枚举的属性。**通常需要配合 `hasOwnProperty` 使用**。 | `for (const key in obj) { if (obj.hasOwnProperty(key)) { ... } }` |
| **`Object.keys(obj)`** | 返回一个包含所有**自身**可枚举属性**键**的数组。 | `['name', 'age']` |
| **`Object.values(obj)`**| 返回一个包含所有**自身**可枚举属性**值**的数组。 | `['Alice', 30]` |
| **`Object.entries(obj)`**| 返回一个包含所有**自身**可枚举属性 `[key, value]` 数组的数组。 | `[['name', 'Alice'], ['age', 30]]` |

**现代推荐的遍历方式**:
```js
// 遍历键
for (const key of Object.keys(person)) {
  console.log(key, person[key]);
}

// 遍历值
for (const value of Object.values(person)) {
  console.log(value);
}

// 同时遍历键和值 (最佳实践)
for (const [key, value] of Object.entries(person)) {
  console.log(`${key}: ${value}`);
}
```

### **3.2 [`Object` 静态 API](https://web.nodejavascript.cn/en-us/docs/web/javascript/reference/global_objects/object/) 详解**

这些方法直接通过 `Object` 构造函数调用。

| 方法 | 描述 |
| :--- | :--- |
| `Object.assign(target, ...sources)` | 将一个或多个源对象的所有**可枚举自身属性**进行**浅拷贝**到目标对象 `target`。**会改变 `target`**。 |
| `Object.create(proto, [propertiesObject])` | 创建一个新对象，其原型 (`__proto__`) 指向 `proto`。可用于实现继承。 |
| `Object.defineProperty(obj, prop, descriptor)` | 在一个对象上定义一个新属性，或修改一个现有属性，并返回此对象。用于精确控制属性特性（如 `enumerable`, `writable`, `configurable`）。 |
| `Object.entries(obj)` | 返回 `[key, value]` 键值对数组。 |
| `Object.keys(obj)` | 返回 `key` 数组。 |
| `Object.values(obj)` | 返回 `value` 数组。 |
| `Object.fromEntries(iterable)` | `Object.entries()` 的逆操作，将一个 `[key, value]` 键值对的可迭代对象（如 `Map`, `Array`）转换回一个对象。 |
| `Object.freeze(obj)` | **冻结**一个对象。冻结后的对象不能添加、删除、修改属性。**注意：这是浅冻结**。 |
| `Object.isFrozen(obj)` | 判断一个对象是否被冻结。 |
| `Object.seal(obj)` | **密封**一个对象。密封后的对象不能添加、删除属性，但可以修改现有属性的值。 |
| `Object.isSealed(obj)` | 判断一个对象是否被密封。 |
| `Object.is(value1, value2)` | 比较两个值是否**完全相同**。比 `===` 更精确，能正确处理 `NaN === NaN` (为 `true`) 和 `+0 === -0` (为 `false`)。 |
| `Object.getPrototypeOf(obj)` | 返回指定对象的原型。 |
| `obj.hasOwnProperty(prop)` | **实例方法**。判断 `prop` 是否为 `obj` 的**自身属性**（非继承自原型链）。 |

### **3.3 常见问题与陷阱 (FAQ) - 极其重要**

#### **1. 浅拷贝 vs 深拷贝 (The #1 Problem)**
*   **问题**: 我复制了一个对象，修改副本的嵌套属性时，为什么原始对象也变了？
*   **原因**: 你执行的是**浅拷贝**。像 `...` (扩展语法) 和 `Object.assign` 都只复制对象的第一层。如果属性值本身也是一个对象，那么你只复制了这个嵌套对象的**内存地址**。
    ```js
    const original = { name: "A", details: { score: 100 } };
    const shallowCopy = { ...original }; // 浅拷贝

    shallowCopy.details.score = 0; // 试图只修改副本
    console.log(original.details.score); // 0 (出乎意料！原始对象也被修改了！)
    ```
*   **解决方案**:
    *   **深拷贝 - 推荐**: `const deepCopy = structuredClone(original);` (现代浏览器和 Node.javascript v17+ 内置，性能好，支持多种类型)。
    *   **深拷贝 - 常用但有缺陷**: `const deepCopy = javascriptON.parse(javascriptON.stringify(original));` (简单，但会丢失 `undefined`、函数、`Symbol`，且无法处理循环引用)。
    *   **深拷贝 - 库方案**: 使用 Lodash 的 `_.cloneDeep()`，功能最全。

#### **2. `const` 声明的对象为什么还能修改？**
*   **原因**: `const` 保证的是**变量绑定的内存地址不变**，而不是保证该地址指向的数据内容不变。
    ```js
    const user = { name: "Bob" };
    user.age = 40; // 合法，因为 user 变量指向的内存地址没变
    // user = {}; // TypeError，因为这试图让 user 指向一个新地址
    ```

#### **3. 为什么 `{}` === `{}` 是 `false`？**
*   **原因**: `===` 比较引用类型时，比较的是**内存地址**。每次使用 `{}` 字面量，都会在内存中创建一个全新的、地址不同的对象。

#### **4. `this` 的指向问题**
*   **问题**: 在对象的方法中，`this` 为什么有时候不是指向对象本身？
*   **原因**: `this` 的值取决于**函数的调用方式**，而非定义位置。
    *   **作为方法调用**: `person.greet()` -> `this` 指向 `person`。
    *   **作为普通函数调用**: `const fn = person.greet; fn();` -> `this` 指向 `window` (非严格模式) 或 `undefined` (严格模式)。
    *   **箭头函数**: 箭头函数没有自己的 `this`，它会捕获其定义时所在**词法作用域**的 `this`。

#### **5. `for...in` 循环的陷阱**
*   **问题**: `for...in` 遍历出了我没有定义过的属性。
*   **原因**: 它会遍历对象**及其原型链**上所有可枚举的属性。
*   **解决方案**: 使用 `hasOwnProperty` 进行过滤，或者直接使用现代的 `Object.keys()` / `Object.entries()`。

#### **6. 用对象作为对象的键**
*   **问题**: 我想用一个对象 `keyObj` 作为另一个对象 `myMap` 的键，但结果出错了。
*   **原因**: 对象的键会被强制转换为字符串。任何对象转换成字符串，默认结果都是 `"[object Object]"`。
    ```js
    const keyObj1 = { id: 1 };
    const keyObj2 = { id: 2 };
    const myMap = {};

    myMap[keyObj1] = "Value 1";
    myMap[keyObj2] = "Value 2"; // "Value 1" 被覆盖了！

    console.log(myMap); // { '[object Object]': 'Value 2' }
    ```
*   **解决方案**: **使用 `Map`！** `Map` 是专门为此设计的，它允许任何类型的值作为键。

#### **7. `Object` vs `Map`：如何选择？**
*   **用 `Object`**: 当你需要一个简单的、有固定结构的记录，其键都是字符串或 Symbol，并且需要方便地进行 javascriptON 序列化。
*   **用 `Map`**: 当你需要一个纯粹的“字典”或“哈希表”，特别是当键的类型不确定、需要频繁增删、或者需要保证插入顺序时。


## 4. Map (映射)
`Map` 是一个强大的、真正的键值对集合。它解决了 `Object` 作为“字典”使用时的诸多限制，是现代 javascript 中处理“映射”关系的首选。

### **4.1 核心特性**

*   **任意类型的键 (Key)**: 这是 `Map` 与 `Object` 最根本的区别。`Map` 的键可以是任何 javascript 值，包括 `Object`, `Array`, `Function`, `null` 等。
*   **保持插入顺序**: `Map` 会记住键值对的插入顺序。当你遍历 `Map`时，它会按照你 `set` 值的顺序进行。
*   **高效的 `size` 属性**: 你可以随时通过 `.size` 属性获取 `Map` 中键值对的确切数量，而无需手动计算。
*   **专为迭代设计**: `Map` 与 `for...of` 循环和 `forEach` 方法完美集成。
*   **无原型链污染**: `Map` 是一个纯粹的哈希结构，不会像 `Object` 那样有原型链继承带来的潜在冲突。

### **4.2 创建 `Map`**

#### **1. 创建一个空 `Map`**

```js
const myMap = new Map();
```

#### **2.2 在创建时初始化**

`Map` 构造函数接受一个**可迭代对象**作为参数，该对象中的每个元素都应该是一个包含两个元素 `[key, value]` 的数组。

```js
// 使用二维数组初始化
const initialData = [
  ['key1', 'value1'],
  [123, 'this is a number key'],
  [{ id: 1 }, 'this is an object key']
];

const myMap = new Map(initialData);

console.log(myMap.get(123)); // "this is a number key"
```

---

### **4.3 核心 API：实例属性与方法**

#### **1. 属性**

| 属性 | 描述 | 示例 |
| :--- | :--- | :--- |
| `size` | 返回 `Map` 实例中键值对的数量。 | `const map = new Map([['a',1], ['b',2]]); console.log(map.size); // 2` |

#### **2. 核心方法**

| 方法 | 描述 | 返回值 | 示例 |
| :--- | :--- | :--- | :--- |
| `set(key, value)` | **添加或更新**一个键值对。如果 `key` 已存在，则其 `value` 会被更新。 | `Map` 对象本身，**支持链式调用**。 | `map.set('a', 1).set('b', 2);` |
| `get(key)` | **读取**指定 `key` 对应的 `value`。 | 找到的 `value`，如果 `key` 不存在，则返回 **`undefined`**。 | `map.get('a'); // 1` |
| `has(key)` | **检查**是否存在指定的 `key`。 | `boolean` (`true` 或 `false`) | `map.has('a'); // true` |
| `delete(key)` | **删除**指定的键值对。 | 如果成功删除，返回 `true`；如果 `key` 不存在，返回 `false`。 | `map.delete('a'); // true` |
| `clear()` | **清空** `Map` 中所有的键值对。 | `undefined` | `map.clear();` |

```js
const userActivity = new Map();

// 使用 set (支持链式调用)
userActivity.set('user1', 'online').set('user2', 'away');
console.log(userActivity.size); // 2

// 使用 get
console.log(userActivity.get('user1')); // "online"
console.log(userActivity.get('user3')); // undefined

// 使用 has
console.log(userActivity.has('user2')); // true
console.log(userActivity.has('user3')); // false

// 使用 delete
const wasDeleted = userActivity.delete('user2');
console.log(wasDeleted); // true
console.log(userActivity.size); // 1

// 使用 clear
userActivity.clear();
console.log(userActivity.size); // 0
```

####  3. 迭代方法

`Map` 提供了多种方法来遍历其内容，并且它们都**遵循插入顺序**。

##### **1. `forEach()` 方法**

`map.forEach((value, key, map) => { ... });`

*   **注意回调函数的参数顺序**: `(value, key)`，这与 `Array.forEach` 的 `(element, index)` 思想类似，但对 `Map` 来说，`value` 通常比 `key` 更受关注。

```js
const roles = new Map([
  ['alice', 'admin'],
  ['bob', 'editor']
]);

roles.forEach((role, user) => {
  console.log(`${user}'s role is ${role}`);
});
// 输出:
// "alice's role is admin"
// "bob's role is editor"
```

##### **2. `for...of` 循环 (推荐)**

`for...of` 是遍历 `Map` 最自然、最常用的方式。

```js
// 默认遍历 entries [key, value]
for (const [key, value] of roles) {
  console.log(`${key}: ${value}`);
}
```

##### **3. 迭代器方法**

这些方法返回一个**可迭代对象 (Iterator)**，你可以用 `for...of` 或 `...` (扩展语法) 来消费它。

| 方法 | 描述 | 示例 `[...map.method()]` |
| :--- | :--- | :--- |
| `keys()` | 返回一个包含所有 **`key`** 的迭代器。 | `['alice', 'bob']` |
| `values()` | 返回一个包含所有 **`value`** 的迭代器。 | `['admin', 'editor']` |
| `entries()` | 返回一个包含所有 **`[key, value]`** 数组的迭代器。**`for...of` 循环默认使用的就是这个迭代器**。 | `[['alice', 'admin'], ['bob', 'editor']]` |

**示例:**
```js
const permissions = new Map([
  ['admin', ['create', 'read', 'update', 'delete']],
  ['editor', ['create', 'read', 'update']]
]);

// 遍历 keys
for (const role of permissions.keys()) {
  console.log(role); // 'admin', 'editor'
}

// 遍历 values
for (const access of permissions.values()) {
  console.log(access); // ['create', ...], ['create', ...]
}

// 使用扩展语法将迭代器转换为数组
const allRoles = [...permissions.keys()]; // ['admin', 'editor']
const allAccessLevels = [...permissions.values()];
```

---

### **4.4 `Map` 与 `Object` 的转换**

#### **1. `Map` -> `Object`**
**注意**: 只有当 `Map` 的所有 `key` 都是字符串或 `Symbol` 时，这种转换才有意义。

```js
const map = new Map([
  ['name', 'Alice'],
  ['age', 30]
]);

// 使用 Object.fromEntries() (ES2019+) - 推荐
const obj = Object.fromEntries(map);
// obj is { name: 'Alice', age: 30 }
```

#### **2. `Object` -> `Map`**

```js
const obj = {
  name: 'Bob',
  city: 'London'
};

// 使用 Object.entries()
const map = new Map(Object.entries(obj));
// map is Map(2) { 'name' => 'Bob', 'city' => 'London' }
```

### **4.5 常见问题 (FAQ) 与最佳实践**

*   **Q1: 什么时候应该用 `Map` 而不是 `Object`?**
    *   当你的**键不是字符串或 `Symbol`** 时，**必须**用 `Map`。
    *   当你的数据需要**频繁地添加和删除**键值对时，`Map` 通常有更好的性能。
    *   当你需要**保证元素的顺序**与插入时一致时，用 `Map`。
    *   当你需要一个纯粹的、不带任何原型属性的“哈希”结构时，用 `Map`。

*   **Q2: `Map` 的键是如何判断是否相等的？**

    `Map` 使用 “Same-value-zero” 算法。它和 `===` (严格相等) 基本一样，但有一个关键区别：**`NaN` 被认为与 `NaN` 相等**。
    ```js
    const map = new Map();
    map.set(NaN, 'Value for NaN');
    console.log(map.get(NaN)); // 'Value for NaN'

    let objKey = {};
    map.set(objKey, 'Value');
    console.log(map.get(objKey)); // 'Value'
    console.log(map.get({})); // undefined (因为这是一个新的对象，地址不同)
    ```

*   **Q3: 如何将 `Map` 序列化为 javascriptON？**
   
    `javascriptON.stringify` **不能**直接正确地序列化 `Map`。你需要先将其转换为 `Array` 或 `Object`。
    ```js
    const map = new Map([['a', 1], ['b', 2]]);
    
    // 转换为数组
    const javascriptonStrFromArray = javascriptON.stringify([...map]); // "[["a",1],["b",2]]"

    // 转换为对象
    const javascriptonStrFromObject = javascriptON.stringify(Object.fromEntries(map)); // "{"a":1,"b":2}"
    ```

## 5. Set (集合)
`Set` 是一个**值的集合**，其中的每个值都必须是**唯一的**。它是一个简单而强大的工具，尤其擅长处理唯一性和集合运算。

### **5.1 核心特性**
*   **值的唯一性 (Uniqueness)**: 这是 `Set` 最核心的特性。任何重复的值在尝试添加时都会被自动忽略。
*   **任意类型的值**: `Set` 中的值可以是任何 javascript 数据类型，包括基本类型和引用类型。
*   **保持插入顺序**: `Set` 会记住值的插入顺序。当你遍历 `Set` 时，它会按照你 `add` 值的顺序进行。
*   **无索引**: `Set` 不是一个索引集合，你不能像数组那样通过 `set[0]` 来访问元素。
*   **专为集合运算设计**: `Set` 的 API 和特性使其非常适合执行交集、并集、差集等集合操作。

### **5.2 创建 `Set`**

#### **1. 创建一个空 `Set`**

```js
const mySet = new Set();
```

#### **2. 在创建时初始化**

`Set` 构造函数接受一个**可迭代对象**（如 `Array`, `String`, `Map` 等）作为参数，并会自动提取其中的元素，并去除重复项。

```js
// 使用数组初始化 (最常见)
const arrayWithDuplicates = [1, 2, 3, 3, 'a', 'a', {id: 1}];
const mySet = new Set(arrayWithDuplicates);

console.log(mySet); // Set(5) { 1, 2, 3, 'a', { id: 1 } }

// 使用字符串初始化
const charSet = new Set('hello');
console.log(charSet); // Set(4) { 'h', 'e', 'l', 'o' }
```
> **注意**: `new Set([{id: 1}, {id: 1}])` 会包含两个对象，因为它们是两个独立的引用，内存地址不同。

### **5.3 核心 API：实例属性与方法**

#### **1. 属性**

| 属性 | 描述 | 示例 |
| :--- | :--- | :--- |
| `size` | 返回 `Set` 实例中值的数量。 | `const set = new Set([1, 2, 3]); console.log(set.size); // 3` |

#### **2. 核心方法**

| 方法 | 描述 | 返回值 | 示例 |
| :--- | :--- | :--- | :--- |
| `add(value)` | **添加**一个新值。如果该值已存在，则不执行任何操作。 | `Set` 对象本身，**支持链式调用**。 | `set.add(1).add(2);` |
| `has(value)` | **检查**是否存在指定的值。 | `boolean` (`true` 或 `false`) | `set.has(1); // true` |
| `delete(value)` | **删除**指定的值。 | 如果成功删除，返回 `true`；如果 `value` 不存在，返回 `false`。 | `set.delete(1); // true` |
| `clear()` | **清空** `Set` 中所有的值。 | `undefined` | `set.clear();` |

```js
const userTags = new Set();

// 使用 add (支持链式调用)
userTags.add('javascript').add('Frontend');
console.log(userTags.size); // 2

// 再次添加重复值，会被忽略
userTags.add('javascript');
console.log(userTags.size); // 2

// 使用 has
console.log(userTags.has('javascript')); // true
console.log(userTags.has('Backend'));    // false

// 使用 delete
const wasDeleted = userTags.delete('Frontend');
console.log(wasDeleted); // true
console.log(userTags.size); // 1

// 使用 clear
userTags.clear();
console.log(userTags.size); // 0
```

#### 3. 迭代方法

`Set` 提供了多种方法来遍历其内容，并且它们都**遵循插入顺序**。

##### **1. `forEach()` 方法**

`set.forEach((value, value2, set) => { ... });`

*   **奇特的参数**: 为了与 `Map` 的 API 保持一致，`Set` 的 `forEach` 回调函数也接受三个参数 `(value, key, collection)`。但在 `Set` 中，**`key` 和 `value` 是完全相同的**，因为 `Set` 没有键的概念。

```js
const letters = new Set(['a', 'b', 'c']);

letters.forEach((value, key, set) => {
  console.log(`value: ${value}, key: ${key}`);
});
// 输出:
// "value: a, key: a"
// "value: b, key: b"
// "value: c, key: c"
```

##### **2. `for...of` 循环 (最佳实践)**

`for...of` 是遍历 `Set` 最自然、最简洁的方式。

```js
for (const letter of letters) {
  console.log(letter); // 'a', 'b', 'c'
}
```

##### **3. 迭代器方法**

这些方法返回一个**可迭代对象 (Iterator)**。

| 方法 | 描述 |
| :--- | :--- |
| `values()` | 返回一个包含 `Set` 中所有 **`value`** 的迭代器。 |
| `keys()` | **`keys()` 是 `values()` 的别名**，行为完全相同。提供此方法是为了与 `Map` 的 API 保持一致。 |
| `entries()` | 返回一个包含所有 **`[value, value]`** 数组的迭代器。同样，提供此方法也是为了与 `Map` 保持 API 兼容性。 |

**示例:**
```js
const numbers = new Set([10, 20, 30]);

// keys() 和 values() 行为相同
for (const value of numbers.values()) {
  console.log(value); // 10, 20, 30
}

// entries()
for (const entry of numbers.entries()) {
  console.log(entry); // [10, 10], [20, 20], [30, 30]
}

// 使用扩展语法将迭代器转换为数组
const numArray = [...numbers]; // [10, 20, 30]
```

### **5.4 常见问题 (FAQ) 与最佳实践**

*   **Q1: `Set` 最核心的用途是什么？**
    *   **A: 数组去重。** 这是 `Set` 最广为人知且最高效的用途。
    ```js
    const arrayWithDuplicates = [1, 'a', 2, 1, 'b', 'a', 3];
    const uniqueArray = [...new Set(arrayWithDuplicates)]; 
    // uniqueArray is [1, "a", 2, "b", 3]
    ```

*   **Q2: `Set` 的值是如何判断是否唯一的？**
    *   `Set` 使用 “Same-value-zero” 算法。它和 `===` (严格相等) 基本一样，但有一个关键区别：**`NaN` 被认为与 `NaN` 相等**，因此一个 `Set` 中只能有一个 `NaN`。
    ```js
    const mySet = new Set();
    mySet.add(NaN);
    mySet.add(NaN);
    console.log(mySet.size); // 1 
    ```
    对于对象，比较的仍然是**内存地址**。
    ```js
    const objavascriptet = new Set();
    objavascriptet.add({ id: 1 });
    objavascriptet.add({ id: 1 });
    console.log(objavascriptet.size); // 2 (因为这是两个独立的对象)
    ```

*   **Q3: 如何执行集合运算（交集、并集、差集）？**
    *   `Set` 没有内置这些方法，但可以非常容易地通过 `Array` 的辅助方法实现。

    **1. 并集 (Union)**
    ```js
    const setA = new Set([1, 2, 3]);
    const setB = new Set([3, 4, 5]);
    const union = new Set([...setA, ...setB]); // Set { 1, 2, 3, 4, 5 }
    ```

    **2. 交集 (Intersection)**
    ```js
    const intersection = new Set([...setA].filter(x => setB.has(x))); // Set { 3 }
    ```

    **3. 差集 (Difference)** (A 中有，但 B 中没有)
    ```js
    const difference = new Set([...setA].filter(x => !setB.has(x))); // Set { 1, 2 }
    ```

*   **Q4: `Array` 和 `Set` 之间如何转换？**
    *   **`Array` -> `Set`**: `const mySet = new Set(myArray);`
    *   **`Set` -> `Array`**: `const myArray = [...mySet];` 或 `const myArray = Array.from(mySet);`

*   **Q5: 为什么我需要 `Set`？数组的 `includes` 方法不能检查唯一性吗？**
    * 对于大量数据，`Set.has()` 的性能远高于 `Array.includes()`。`Set` 内部使用哈希表实现，其 `has()` 操作的时间复杂度接近 O(1)；而 `Array.includes()` 需要遍历数组，时间复杂度为 O(n)。在处理成千上万个元素时，性能差异会非常明显。

## 6. WeakMap & WeakSet (弱引用集合)
`WeakMap` 和 `WeakSet` 的“Weak”（弱）指的是其对所持有的对象的**弱引用 (Weak Reference)**,专为**内存管理**设计的集合。

### **6.1 核心概念：弱引用与垃圾回收**

在理解 API 之前，必须先理解这个概念，否则它们的行为将令人困惑。

*   **强引用 (Strong Reference)**: `Map` 和 `Set` 使用的是强引用。只要一个 `Map` 或 `Set` 实例中还存在对一个对象的引用，那么即使程序中所有其他地方都不再使用该对象，垃圾回收器也**不会**回收它。这个对象会一直“活”在内存中，直到你从 `Map`/`Set` 中显式 `delete()` 它。

*   **弱引用 (Weak Reference)**: `WeakMap` 和 `WeakSet` 使用的是弱引用。一个对象被 `WeakMap` 或 `WeakSet` 引用，**并不会**阻止垃圾回收器回收它。如果一个对象在程序中唯一的引用就来自于 `WeakMap` 或 `WeakSet`，那么垃圾回收器在下次运行时，**会忽略这个弱引用，并安全地回收该对象**。该键值对（或值）会自动从弱集合中消失。

**弱引用的直接后果**:
1.  **键/值必须是对象**: 只有对象才能被垃圾回收。`string`, `number` 等基本类型不会被回收，因此它们不能作为 `WeakMap` 的键或 `WeakSet` 的值。
2.  **不可枚举/不可迭代**: 因为集合中的对象可能在任何时候被垃圾回收器移除，所以无法获取一个可靠的、完整的成员列表。这意味着**没有 `forEach`, `keys`, `values`, `entries`, `size`**。

### **6.2 `WeakMap` API 详解**

**用途**: 主要用于将**额外的数据**与一个**外部对象**关联起来，而**不阻止**该对象被垃圾回收。这在实现“私有”属性或缓存计算结果时非常有用。

#### **1. API 概览**

| 方法 | 描述 | 关键约束 |
| :--- | :--- | :--- |
| `set(key, value)` | 添加或更新一个键值对。 | **`key` 必须是一个对象**。 |
| `get(key)` | 读取指定 `key` 对应的 `value`。 | **`key` 必须是一个对象**。 |
| `has(key)` | 检查是否存在指定的 `key`。 | **`key` 必须是一个对象**。 |
| `delete(key)` | 删除指定的键值对。 | **`key` 必须是一个对象**。 |

**没有的 API**: `size`, `clear()`, `forEach()`, `keys()`, `values()`, `entries()`。

#### **2. 模拟私有属性**

```js
const privateData = new WeakMap();

class Person {
  constructor(name, age) {
    this.name = name; // public data
    
    // Store private data in the WeakMap
    privateData.set(this, { 
      secretAge: age,
      secretId: Math.random()
    });
  }
  
  // Public method to reveal some private data
  revealAge() {
    const privates = privateData.get(this);
    if (privates) {
      console.log(`(Shhh, my real age is ${privates.secretAge})`);
    }
  }
}

let alice = new Person("Alice", 30);
alice.revealAge(); // (Shhh, my real age is 30)

// You cannot access privateData from the outside
console.log(privateData.get(alice).secretId); // This is possible, but hides the data from direct access on the instance

// Now, let's see the garbage collection in action
alice = null; 

// 当 `alice` 变量被设置为 null 后，`Person` 实例不再有任何强引用。
// 垃圾回收器下次运行时，会回收这个实例。
// 同时，privateData 中与之关联的键值对也会被自动移除，不会造成内存泄漏。
```

### **6.3 `WeakSet` API 详解**

**用途**: 主要用于**追踪**一组**对象**，例如，标记某些对象是否已被处理，而**不阻止**这些对象被垃圾回收。

#### **1. API 概览**

| 方法 | 描述 | 关键约束 |
| :--- | :--- | :--- |
| `add(value)` | 添加一个新值。 | **`value` 必须是一个对象**。 |
| `has(value)` | 检查是否存在指定的值。 | **`value` 必须是一个对象**。 |
| `delete(value)` | 删除指定的值。 | **`value` 必须是一个对象**。 |

**没有的 API**: `size`, `clear()`, `forEach()`, `values()` 等所有迭代相关方法。

#### **2. 追踪 DOM 节点**
这是一个非常经典的用例，可以防止在 DOM 节点被移除后发生内存泄漏。

```html
<button id="btn1">Button 1</button>
<button id="btn2">Button 2</button>
```

```js
const clickedNodes = new WeakSet();
const btn1 = document.getElementById('btn1');
const btn2 = document.getElementById('btn2');

function processClick(event) {
  const node = event.currentTarget;
  
  if (clickedNodes.has(node)) {
    console.log("This node has already been processed.");
    return;
  }
  
  console.log("Processing this node for the first time...");
  clickedNodes.add(node);
}

btn1.addEventListener('click', processClick);
btn2.addEventListener('click', processClick);

// 假设一段时间后，我们从 DOM 中移除了 btn2
// btn2.remove();

// 当 btn2 从 DOM 中被移除，并且没有其他 JavaScript 变量引用它时，
// 垃圾回收器会回收这个 DOM 节点对象。
// 同时，clickedNodes 中对 btn2 的弱引用也会自动消失，内存被释放。
// 如果用的是普通 Set，即使 DOM 节点被移除，Set 依然会持有它的引用，导致内存泄漏。
```

### **6.4 常见问题 (FAQ)**

*   **Q1: 为什么我不能用字符串或数字作为 `WeakMap` 的键？**
    *   因为 `WeakMap` 的核心是与**垃圾回收**挂钩。基本类型（如字符串、数字）是不可变的，它们不会像对象那样被“回收”，所以弱引用对它们没有意义。

*   **Q2: 为什么没有 `size` 属性或 `forEach` 方法？**
    *   因为弱集合的内容是**不确定**的。垃圾回收的发生时机并不受 JavaScript 代码直接控制。在你的代码两次访问之间，集合中的某个对象可能已经被回收了。因此，提供一个“当前大小”或一个完整的成员列表是没有意义的，因为这个信息可能在返回的瞬间就已经过时了。

*   **Q3: 什么时候我应该用 `WeakMap`/`WeakSet`？**
    *   当你的**键/值本身是一个你无法控制其生命周期的对象**时。
        *   **`WeakMap`**:
            *   **缓存**: 缓存一个对象的计算结果。当对象被销毁时，缓存也自动清除。
            *   **附加数据**: 为 DOM 节点、或来自第三方库的对象附加额外信息，而不用担心内存泄漏。
        *   **`WeakSet`**:
            *   **对象追踪**: 标记一组对象是否已处理、是否可见、是否有效等，当对象消失时，标记也自动消失。

## 7. 总结对比表

| 特性 | Array | Object | Map | Set | WeakMap/Set |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **键类型** | 整数下标 | String/Symbol | **任意** | (仅存储值) | **必须是对象** |
| **有序性** | ✅ | ❌ (不完全) | ✅ | ✅ | ❌ |
| **可遍历** | ✅ | ✅ (需转换) | ✅ | ✅ | ❌ |
| **垃圾回收**| 强引用 | 强引用 | 强引用 | 强引用 | **弱引用** |
| **典型用途**| 列表/栈/队列 | 配置/javascriptON/字典 | 复杂键/频繁增删 | 去重/集合运算 | 防止内存泄漏 |