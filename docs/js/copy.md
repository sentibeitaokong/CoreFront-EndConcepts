---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---
# JavaScript **赋值、浅拷贝与深拷贝**

**JavaScript 的两种数据类型及其存储方式,这三者的区别，本质上就是对“引用类型”进行操作时的不同行为。**
*   **原始类型 (Primitive Types)**: `String`, `Number`, `Boolean`, `null`, `undefined`, `Symbol`, `BigInt`。
    *   **存储**: 值直接存储在**栈 (Stack)** 内存中。
    *   **行为**: 变量持有的是**值的本身**。

*   **引用类型 (Reference Types)**: `Object`, `Array`, `Function`, `Map`, `Set` 等。
    *   **存储**: 数据本身（对象）存储在**堆 (Heap)** 内存中，而变量持有的是一个指向该数据的**内存地址（引用）**。
    *   **行为**: 变量持有的是一个“指针”。

## **1. 赋值 (Assignment)**

**定义**: 当我们将一个变量赋值给另一个变量时，我们复制的是变量**持有**的内容。

**行为**:
*   **对于原始类型**: 复制的是**值本身**。赋值后，两个变量完全独立，互不影响。
*   **对于引用类型**: 复制的是**内存地址**。赋值后，两个变量指向**同一个**堆内存中的对象。

**结论**: 赋值操作**永远不会**产生新的对象或数组。它只是创建了另一个指向**同一事物**的“标签”或“指针”。

**原始类型赋值:**
```js
let a = 100;
let b = a; // b 得到了 100 这个值的副本

b = 200; // 修改 b
console.log(a); // 100 (a 完全不受影响)
```

**引用类型赋值:**
```js
let objA = { name: 'Alice' };
let objB = objA; // objB 得到了 objA 持有的内存地址

objB.name = 'Bob'; // 通过 objB 修改了堆内存中的对象
console.log(objA.name); // 'Bob' (objA 也受到了影响，因为它们指向同一个对象)
```

**内存图示 (引用类型赋值):**
```
    Stack(栈)                    Heap(堆)
    -----------------        -----------------------------
    objA  (addr123) ------>  | { name: 'Alice' }           |
                             | (被修改为 'Bob')            |
    objB  (addr123) ------>  |                             |
    -----------------        -----------------------------
```
*   对**引用类型**进行**`赋址`**操作，两个变量指向同一个对象，改变变量 objB 之后会影响变量objA，哪怕改变的只是对象 objB 中的基本类型数据
*   通常在开发中并不希望改变变量 a 之后会影响到变量 b，这时就需要用到**`浅拷贝`**和**`深拷贝`**。

## **2. 浅拷贝 (Shallow Copy)**

**定义**: 浅拷贝会**创建一个新的对象或数组**，然后将原始对象/数组的**第一层**属性/元素复制到新创建的对象/数组中。

**行为**:
*   如果第一层的属性值是**原始类型**，就复制**值**。
*   如果第一层的属性值是**引用类型**，就复制其**内存地址**。

**结论**: 浅拷贝只在**顶层**是独立的。其内部嵌套的引用类型，在新旧对象之间**仍然是共享的**。

### **2.1 `Object.assign()`**
Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
```js
let a = {
    name: "javascript",
    book: {
        title: "You Don't Know JS",
        price: "45"
    }
}
let b = Object.assign({}, a);
console.log(b);
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "45"}
// } 

a.name = "change";
a.book.price = "55";
console.log(a);
// {
// 	name: "change",
// 	book: {title: "You Don't Know JS", price: "55"}
// } 

console.log(b);
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "55"}
// } 
```

### **2.2 `Spread`**(展开语法) 
```js
let a = {
    name: "javascript",
    book: {
        title: "You Don't Know JS",
        price: "45"
    }
}
let b = {...a};
console.log(b);
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "45"}
// } 

a.name = "change";
a.book.price = "55";
console.log(a);
// {
// 	name: "change",
// 	book: {title: "You Don't Know JS", price: "55"}
// } 

console.log(b);
// {
// 	name: "javascript",
// 	book: {title: "You Don't Know JS", price: "55"}
// } 
```
### **2.3 `Array.prototype.slice()`和`Array.prototype.concat()`**
```js
let a = [0, "1", [2, 3]];
//let b = a.concat();
let b = a.slice(1);
console.log(b);
// ["1", [2, 3]]

a[1] = "99";
a[2][0] = 4;
console.log(a);
// [0, "99", [4, 3]]

console.log(b);
//  ["1", [4, 3]]
```

## **3. 深拷贝 (Deep Copy)**

**定义**: 深拷贝会**创建一个完全独立的新对象或数组**，并且会**递归地**复制原始对象/数组的所有层级的属性/元素。

**行为**:无论嵌套多少层，所有引用类型都会被重新创建，而不是只复制地址。

**结论**: 深拷贝后，新旧对象**完全隔离**，互不影响。

### **3.1 [`JSON.parse(JSON.stringify(obj))`](/js/jsonSerialize)**

这是最广为人知、最简单的深拷贝方法。它巧妙地利用了 `JSON` 的两个方法，将 JavaScript 对象转换为 JSON 字符串，然后再解析回新的 JavaScript 对象。

#### **优点**
*   **极其简单**: 一行代码即可实现，非常直观。
*   **浏览器和 Node.js 环境原生支持**: 无需任何外部库。
*   **处理 JSON 安全的数据类型**: 能完美处理 `Object`, `Array`, `String`, `Number`, `Boolean`, `null`。

#### **缺陷**
这种方法并非万能，它的“不安全”之处在于 `JSON` 格式本身的限制：

1.  **丢失或转换特定类型**:
    *   **`undefined`**: 属性值如果是 `undefined`，该键值对会**直接丢失**。
    *   **`Symbol`**: 属性键或值如果是 `Symbol`，该键值对会**直接丢失**。
    *   **`Function`**: 属性值如果是函数，该键值对会**直接丢失**。
2.  **错误处理特殊对象**:
    *   **`Date`**: `Date` 对象会被转换为其 `toISOString()` 格式的**字符串**，而不是一个新的 `Date` 对象。
    *   **`RegExp`**, **`Error`**: 会被转换为空对象 `{}`。
    *   **`NaN`**, **`Infinity`**, **`-Infinity`**: 会被转换为 `null`。
3.  **无法处理循环引用**: 如果对象存在循环引用（一个对象内部的属性直接或间接引用了自身），`JSON.stringify` 会抛出 `TypeError: Converting circular structure to JSON` 错误。

```js
const original = {
  num: 1,
  str: 'hello',
  undef: undefined,
  func: () => {},
  date: new Date(),
  regex: /a/g,
  sub: { a: 1 }
};

const copied = JSON.parse(JSON.stringify(original));

console.log(copied);
/*
Output:
{
  "num": 1,
  "str": "hello",
  "date": "2023-10-27T...", // 变成了字符串！
  "regex": {},             // 变成了空对象！
  "sub": { "a": 1 }
}
// func 和 undef 属性直接消失了！
*/
```

#### **适用场景**
*   当你**非常确定**要拷贝的数据是**纯粹的、JSON 安全的**（例如，从后端 API 获取的、不包含复杂类型的 JSON 数据）。
*   需要快速实现，且不关心上述缺陷时。

---

### **3.2 `structuredClone(obj)` (现代最佳实践)**

这是一个由 Web API 提供的**全局函数**，专门用于深拷贝。它在现代浏览器和 Node.js v17+ 中可用。

#### **优点**
*   **原生 API，为深拷贝而生**: 这是官方推荐的、最现代的解决方案。
*   **性能优秀**: 底层由 C++ 实现，通常比手写的 JavaScript 递归快得多。
*   **支持循环引用**: 能正确处理循环引用的对象，不会报错。
*   **支持多种复杂数据类型**: 远超 `JSON` 方法，能正确处理 `Date`, `RegExp`, `Map`, `Set`, `Blob`, `File`, `ArrayBuffer`, `ImageData` 等。

#### **缺点/限制**
*   **不能拷贝函数 (Function)**: 尝试拷贝包含函数的对象会抛出 `DataCloneError`。这是设计上决定的，因为函数的拷贝行为非常复杂（例如，需要保留其闭包作用域）。
*   **不能拷贝 DOM 节点**: 会抛出 `DataCloneError`。
*   **不会拷贝原型链**: 新创建的对象 `__proto__` 会指向 `Object.prototype`，会丢失原始对象的原型。
*   **属性描述符不会被拷贝**: 像 `getters`, `setters` 或 `writable: false` 等属性特性会丢失。

#### **代码示例**
```js
const original = {
  date: new Date(),
  regex: /a/g,
  map: new Map([['a', 1]]),
  set: new Set([1, 2]),
  details: { nested: true }
};
original.circular = original; // 循环引用

const copied = structuredClone(original);

console.log(copied.date instanceof Date); // true
console.log(copied.map.get('a'));        // 1
console.log(copied.details === original.details); // false
console.log(copied.circular === copied); // true (循环引用被正确处理)
```

#### **适用场景**
*   **绝大多数需要深拷贝的场景**。
*   当你需要处理 `Date`, `Map`, `Set` 等复杂数据结构时。
*   当数据可能存在循环引用时。
*   **只要你不需要拷贝函数，就应该首选 `structuredClone`**。

---

### **3.3 Lodash `_.cloneDeep()`**

*   **优点**:
    *   **功能最强大、最完善**: 被认为是 JavaScript 深拷贝的“黄金标准”。
    *   **处理类型极其广泛**: 能正确处理函数、`Symbol`、DOM 节点（在某种程度上）、原型链、属性描述符等各种边缘情况。
    *   **性能优异**: 内部实现经过高度优化。
*   **缺点**:
    *   需要引入一个外部库，增加了项目的体积。

```js
// 需要先安装 lodash: npm install lodash
const _ = require('lodash');

const original = {
  func: () => console.log('hello'),
  // ... 其他各种复杂类型
};

const copied = _.cloneDeep(original);

copied.func(); // 'hello' (函数也被拷贝了)
```

#### **适用场景**
*   **任何复杂的生产环境项目**。
*   当你不确定数据结构，或需要处理函数等 `structuredClone` 不支持的类型时。
*   追求最高稳定性和最少 bug 时。

**总结：如何选择？**

| 方法 | 推荐指数 | 优点 | 缺点 |
| :--- | :--- | :--- | :--- |
| **`structuredClone()`** | ★★★★★ | **原生、快、支持循环引用和多种类型** | **不能拷贝函数**、有兼容性要求 |
| **Lodash `_.cloneDeep()`**| ★★★★★ | **功能最全、最稳定** | 需要引入库，增加体积 |
| **`JSON.parse(JSON.stringify())`**| ★★☆☆☆ | 简单快捷 | **缺陷多，坑也多，不推荐用于复杂数据** |

## **4. 总结**

| 操作 | 创建新对象/数组? | 顶层属性/元素 | 嵌套的引用类型 |
| :--- | :--- | :--- | :--- |
| **赋值** | **否** | 共享 (同一对象) | 共享 (同一对象) |
| **浅拷贝** | **是** | 独立 | **共享** |
| **深拷贝** | **是** | 独立 | **独立** |
