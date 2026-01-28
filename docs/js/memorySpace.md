# js内存空间(js MemorySpace)

在 js 中，内存主要分为两部分：**栈内存 (Stack)** 和 **堆内存 (Heap)**。

## 1. **栈内存 (Stack)**

栈内存是一种线性数据结构，遵循**后进先出 (LIFO)** 的原则。它主要用于存储**原始数据类型**的值和**函数调用的上下文**。

| 特性 | 描述 |
| --- | --- |
| **存储类型** | 存储原始数据类型（`Number`, `String`, `Boolean`, `Null`, `Undefined`, `Symbol`, `BigInt`）。这些类型的数据大小固定，空间较小。 |
| **访问方式** | 按值访问。 |
| **分配与释放** | 由系统自动分配和释放，例如函数调用结束时，其对应的栈帧就会被销毁。 |
| **效率** | 运行效率高。 |

## 2. **堆内存 (Heap)**

堆内存则用于存储**引用数据类型**，也就是对象。这些值的大小不固定，可以动态调整。

| 特性 | 描述 |
| --- | --- |
| **存储类型** | 存储引用数据类型，如 `Object`, `Array`, `Function` 等。 |
| **访问方式** | 按引用访问。当访问一个引用类型的变量时，首先从栈中读取该对象的内存地址，然后通过这个地址在堆中找到对应的对象。 |
| **分配与释放** | 动态分配内存，大小不固定。 垃圾回收器会自动管理内存的释放。 |
| **效率** | 访问速度相对较慢。 |

## 3. **数据类型的存储方式**

理解了栈和堆，我们再来看看不同数据类型在内存中是如何存储的：

*   **原始数据类型**: 变量和值都存储在**栈内存**中。 当你将一个原始类型的变量赋给另一个变量时，实际上是创建了该值的一个副本。

*   **引用数据类型**: 变量名（作为引用，即内存地址）存储在**栈内存**中，而对象本身则存储在**堆内存**中。 当你将一个引用类型的变量赋给另一个变量时，复制的是内存地址，两个变量将指向堆内存中的同一个对象。

| 代码 | 内存分配 |
| :--- | :--- |
| `let a = 10;` | 变量 `a` 和值 `10` 都存储在**栈**中。 |
| `let b = 'hello';` | 变量 `b` 和值 `'hello'` 都存储在**栈**中。 |
| `let obj1 = { name: 'Alice' };` | 变量 `obj1` (内存地址) 存在**栈**中，对象 `{ name: 'Alice' }` 存在**堆**中。 |
| `let obj2 = obj1;` | `obj2` 存在**栈**中，它复制了 `obj1` 的内存地址，因此它们指向**堆**中的同一个对象。 |

```js
var a = 20;
var b = a;
b = 30;

// 这时a的值是多少？
// 20   // [!code highlight] 
```

```js
var a = { name: '前端开发' }
var b = a;
b.name = '进阶';

// 这时a.name的值是多少
// '进阶' // [!code highlight] 
```

```js
var a = { name: '前端开发' }
var b = a;
a = null;

// 这时b的值是多少
// { name: '前端开发' }   // [!code highlight]  
```

## 4. 内存空间管理
js的内存生命周期是

* **1、分配你所需要的内存**
* **2、使用分配到的内存（读、写）**
* **3、不需要时将其释放、归还**

js有`自动垃圾收集机制`，最常用的是通过`标记清除`的算法来找到哪些对象是不再继续使用的，使用a = null其实仅仅只是做了一个释放引用的操作，让 a 原本对应的值失去引用，脱离执行环境，这个值会在下一次垃圾收集器执行操作时被找到并`释放`。

在`局部作用域`中，当函数执行完毕，局部变量也就没有存在的必要了，因此垃圾收集器很容易做出判断并回收。但是全局变量什么时候需要自动释放内存空间则很难判断，因此在开发中，需要尽量避免使用全局变量。
```js
var a = {n: 1};
var b = a;
a.x = a = {n: 2};

a.x 	// 这时 a.x 的值是多少
b.x 	// 这时 b.x 的值是多少
//   undefined   // [!code highlight]
//   {n:2}      // [!code highlight]
```

![Logo](/memorySpace.png)

## 5. 内存回收机制

js 有自动垃圾收集机制，垃圾收集器会每隔一段时间就执行一次释放操作，找出那些不再继续使用的值，然后释放其占用的内存。

### 5.1 局部变量和全局变量的销毁

*   **局部变量**：在局部作用域中，当函数执行完毕，局部变量也就没有存在的必要了，因此垃圾收集器很容易做出判断并回收。
*   **全局变量**：全局变量什么时候需要自动释放内存空间则很难判断，所以在开发中应尽量**避免**使用全局变量。

### 5.2 V8 引擎与堆内存

以 Google 的 V8 引擎为例，V8 引擎中所有的 JS 对象都是通过**堆**来进行内存分配的。

*   **初始分配**：当声明变量并赋值时，V8 引擎就会在堆内存中为这个变量分配空间。
*   **继续申请**：当已申请的内存不足以存储这个变量时，V8 引擎就会继续申请内存，直到堆的大小达到了 V8 引擎的内存上限为止。

### 5.3 V8 引擎的分代管理

V8 引擎对堆内存中的 JS 对象进行**分代管理**：

*   **新生代**：存放存活周期较短的 JS 对象，如临时变量、字符串等。
*   **老生代**：存放经过多次垃圾回收仍然存活、存活周期较长的对象，如主控制器、服务器对象等。


## 6. 垃圾回收算法

对垃圾回收算法来说，核心思想就是如何判断内存已经不再使用。常用的垃圾回收算法有下面两种：

*   **引用计数（现代浏览器不再使用）**
*   **标记清除（常用）**

### 6.1 引用计数

引用计数算法定义“内存不再使用”的标准很简单，就是看一个对象是否有指向它的**引用**。如果没有其他对象指向它了，说明该对象已经不再需要了。

```js
// 创建一个对象person，他有两个指向属性age和name的引用
var person = {
    age: 12,
    name: 'aaaa'
};

person.name = null; // 虽然name设置为null，但因为person对象还有指向name的引用，因此name不会回收

var p = person; 
person = 1;         // 原来的person对象被赋值为1，但因为有新引用p指向原person对象，因此它不会被回收

p = null;           // 原person对象已经没有引用，很快会被回收
```

引用计数有一个致命的问题，那就是**循环引用**。 如果两个对象相互引用，尽管它们已不再使用，但是垃圾回收器不会进行回收，最终可能会导致内存泄露。

```js
function cycle() {
    var o1 = {};
    var o2 = {};
    o1.a = o2;
    o2.a = o1; 

    return "cycle reference!";
}

cycle();
```

`cycle` 函数执行完成之后，对象 `o1` 和 `o2` 实际上已经不再需要了，但根据引用计数的原则，它们之间的相互引用依然存在，因此这部分内存不会被回收。所以现代浏览器**不再使用**这个算法。

但是，旧版的 IE 依旧使用此算法。

```js
var div = document.createElement("div");
div.onclick = function() {
    console.log("click");
};
```

上面的写法很常见，但是这个例子就是一个循环引用。变量 `div` 有事件处理函数的引用，同时事件处理函数也有 `div` 的引用（因为 `div` 变量可在函数内被访问），所以循环引用就出现了。

### 6.2 标记清除（常用）

标记清除算法将“不再使用的对象”定义为“**无法到达的对象**”。即从根部（在 JS 中就是全局对象）出发，定时扫描内存中的对象，凡是能从根部到达的对象，都**保留**。那些从根部出发无法触及到的对象被标记为**不再使用**，稍后进行回收。

无法触及的对象包含了没有引用的对象这个概念，但反之未必成立。 使用标记清除，上面循环引用的例子就可以被正确地垃圾回收处理了。 现在对于主流浏览器来说，只需要切断需要回收的对象与根部的联系即可。最常见的内存泄露一般都与 DOM 元素绑定有关：

```js
email.message = document.createElement("div");
displayList.appendChild(email.message);

// 稍后从displayList中清除DOM元素
displayList.removeAllChildren();
```
在上面代码中，`div` 元素已经从 DOM 树中清除，但是该 `div` 元素还绑定在 `email` 对象中。所以，如果 `email` 对象存在，那么该 `div` 元素就会一直保存在内存中。

## 7.常见的 JavaScript 内存泄漏场景及处理方法

以下是一些在 JavaScript 开发中最常见的内存泄漏场景，以及如何避免和修复它们。

### 7.1 意外的全局变量

**原因**：
在 JavaScript 中，如果你在函数内部忘记使用 `let`、`const` 或 `var` 来声明变量，这个变量就会被创建在全局对象上（在浏览器中是 `window` 对象）。全局变量的生命周期与页面的生命周期相同，除非被显式移除，否则垃圾回收器无法回收它们。

**示例代码 (泄漏):**
```js
function createLeak() {
    // a 没有被声明，因此会被创建为 window.a
    a = new Array(1000000).join('*'); 
}
createLeak();
// 函数执行后，变量 a 依然存在于 window 上，占用大量内存。
```

**✅ 处理方法**：
始终使用 `let`、`const` 或 `var` 来声明变量，以确保它们在正确的作用域内。启用**严格模式 (`'use strict'`)** 也是一个好习惯，因为它会在你试图创建意外的全局变量时抛出错误。

**修复后代码:**
```js
'use strict';
function createLeakFixed() {
    let a = new Array(1000000).join('*');
    // 函数执行完毕后，变量 a 会被自动销毁。
}
createLeakFixed();
```

### 7.2 被遗忘的定时器或回调函数

**原因**：
`setTimeout`、`setInterval`、`requestAnimationFrame` 等定时器，或者事件监听器 `addEventListener`，如果它们内部引用了外部对象，而你又没有在适当的时候清除它们，那么这些外部对象将永远不会被回收。

**示例代码 (泄漏):**
```js
function startTimer() {
    let largeObject = { data: new Array(1000000).join('x') };

    // setInterval 会一直持有对 largeObject 的引用
    setInterval(() => {
        // 即使我们不再需要 largeObject，它也无法被回收
        console.log(largeObject.data.length); 
    }, 1000);
}
startTimer();
```

**✅ 处理方法**：
在定时器或回调完成其任务后，或者在组件销毁、页面卸载等生命周期结束时，务必手动清除它们。

**修复后代码:**
```js
function startTimerFixed() {
    let largeObject = { data: new Array(1000000).join('x') };
    
    const intervalId = setInterval(() => {
        console.log(largeObject.data.length);
    }, 1000);

    // 假设在未来的某个时间点，我们不再需要这个定时器
    setTimeout(() => {
        clearInterval(intervalId); // 清除定时器
        largeObject = null;       // 显式释放引用
        console.log('Timer cleared, memory released.');
    }, 5000);
}
startTimerFixed();
```

### 7.3 脱离 DOM 的元素引用 (Detached DOM)

**原因**：
当你用 JavaScript 从 DOM 中移除了一个元素，但代码中仍然保留着对这个元素的引用时，就会发生内存泄漏。这个 DOM 元素虽然在页面上看不到了，但它和它的所有子节点都无法被垃圾回收器释放。

**示例代码 (泄漏):**
```html
<div id="container">
    <button id="leakyButton">Click Me</button>
</div>
```
```js
// 在一个变量中保存了对按钮的引用
const leakyButtonRef = document.getElementById('leakyButton');

// 从 DOM 中移除了按钮的父节点
document.getElementById('container').remove();

// 此时，虽然页面上已经看不到按钮了，
// 但由于 leakyButtonRef 依然持有对它的引用，
// 这个按钮元素及其关联的事件监听器等都无法被回收。
console.log(leakyButtonRef); // 依然可以访问
```

**✅ 处理方法**：
当 DOM 元素被移除后，确保代码中所有对它的引用也都被清除。

**修复后代码:**
```js
let leakyButtonRef = document.getElementById('leakyButton');
// ... 添加事件监听等操作 ...

// 当不再需要时
document.getElementById('container').remove();
leakyButtonRef = null; // 手动解除引用
```

### 7.4 闭包 (Closures)

**原因**：
闭包的强大之处在于它可以“记住”其创建时所在的作用域。但如果不当使用，就可能导致内存泄漏。如果一个闭包的作用域中引用了一个大对象，而这个闭包又被长期持有（例如，被赋给一个全局变量或作为事件监听器），那么这个大对象也无法被回收。

**示例代码 (泄漏):**
```js
function createClosure() {
    // 一个大对象
    const largeData = new Array(1000000).join('y');

    // 返回一个闭包，这个闭包隐式地持有了对 largeData 的引用
    return function() {
        return largeData; 
    };
}

// globalClosure 持有了闭包，因此 largeData 无法被释放
const globalClosure = createClosure(); 

// 即使我们不再直接使用 globalClosure，内存也已被占用
```

**✅ 处理方法**：
仔细审视你的闭包，确保它们没有无意中捕获到不再需要的大对象。如果闭包只需要对象中的某个值，而不是整个对象，那么应该只传递那个值。

**修复后代码:**
```js
function createClosureFixed() {
    const largeData = new Array(1000000).join('y');
    const specificValue = largeData.length; // 只获取需要的值

    // 闭包现在只引用了一个小的数字，而不是整个大字符串
    return function() {
        return specificValue;
    };
}

const globalClosureFixed = createClosureFixed();
```

