---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 递归算法

## 1. 递归算法核心概览

递归（Recursion），通俗来说就是**“函数自己调用自己”**。它的核心思想是将一个极其复杂的大问题，层层拆解为结构相同、但规模更小的子问题，直到子问题简单到可以直接求解，然后再层层返回结果，最终拼凑出原问题的答案。

### 1.1 递归的核心两要素

编写任何递归函数，都必须严格包含以下两个部分，缺一不可：

| 核心要素 | 详细说明 | 代码体现示例 |
| :--- | :--- | :--- |
| **1. 终止条件 (Base Case)** | 递归的“刹车片”。必须有一个明确的条件，满足时不再继续调用自身，而是直接返回一个确定的值。否则会导致无限死循环。 | `if (n === 1) return 1;` |
| **2. 递推关系 (Recursive Case)** | 递归的“引擎”。将当前问题拆解为更小规模的同类问题，并进行自我调用，同时一定要**逼近终止条件**。 | `return n * factorial(n - 1);` |

## 2. 经典递归场景

为了深入理解，我们按照由浅入深的顺序，结合前端高频应用场景来剖析。

### 2.1 数学计算：阶乘 (Factorial)

最基础的递归演示。计算 `n!`（即 `n * (n-1) * ... * 1`）。

**示例**

```javascript
/**
 * 计算 n 的阶乘
 * @param {Number} n 
 * @returns {Number}
 */
function factorial(n) {
    // 1. 终止条件：当 n 为 1 或 0 时，阶乘为 1
    if (n === 1 || n === 0) {
        return 1; 
    }
    // 2. 递推关系：n! = n * (n-1)!
    return n * factorial(n - 1); 
}

console.log(factorial(5)); // 输出: 120 (5 * 4 * 3 * 2 * 1)
```

### 2.2 前端高频应用：数组扁平化 (Array Flattening)

在处理多维嵌套数组时（例如 `[1, [2, [3, 4]]]`），递归是将其展平为一维数组的最佳利器。

**示例**

```javascript
/**
 * 递归实现数组扁平化
 * @param {Array} arr 多维数组
 * @returns {Array} 一维数组
 */
function flattenArray(arr) {
    let result = [];
    
    for (let i = 0; i < arr.length; i++) {
        // 判断当前元素是否仍是数组
        if (Array.isArray(arr[i])) {
            // 是数组：递归展开它，并与当前结果拼接
            result = result.concat(flattenArray(arr[i]));
        } else {
            // 不是数组（终止条件隐式体现）：直接推入结果
            result.push(arr[i]);
        }
    }
    
    return result;
}

console.log(flattenArray([1, [2, [3, 4], 5], 6])); // 输出: [1, 2, 3, 4, 5, 6]
```

### 2.3 核心对象操作：完美深拷贝 (Deep Clone)

JavaScript 中引用类型的拷贝一直是痛点。利用递归遍历对象的所有层级结构，是实现深拷贝的核心。

**示例**

```javascript
/**
 * 递归实现完美的深拷贝
 * @param {Object} obj 要拷贝的对象
 * @param {WeakMap} hash 用于解决循环引用问题的哈希表
 */
function deepClone(obj, hash = new WeakMap()) {
    // 终止条件 1：如果不是对象或数组（即基本类型），直接返回
    if (obj === null || typeof obj !== 'object') return obj;
    // 终止条件 2：如果 Date 或 RegExp 对象，特殊处理
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    
    // 终止条件 3：解决循环引用（如果该对象已经被拷贝过，直接返回其引用）
    if (hash.has(obj)) return hash.get(obj);

    // 初始化拷贝后的新对象或数组
    let cloneObj = new obj.constructor();
    hash.set(obj, cloneObj); // 记录当前对象已经拷贝过

    // 递推关系：递归处理所有的属性
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloneObj[key] = deepClone(obj[key], hash);
        }
    }
    return cloneObj;
}
```

---

## 3. 递归的性能黑洞与高阶优化

递归虽然代码极其优雅简洁，但在 JavaScript 引擎中却存在两个致命的性能陷阱。

### 3.1 优化方案 A：记忆化缓存 (Memoization)

**陷阱：重叠子问题导致时间复杂度爆炸。**
以著名的斐波那契数列（Fibonacci：`1, 1, 2, 3, 5, 8...`）为例，纯粹的递归 `fib(n) = fib(n-1) + fib(n-2)` 会产生极其可怕的重复计算，时间复杂度高达 `O(2^n)`。计算 `fib(50)` 甚至会让浏览器直接崩溃。

**对策：** 引入缓存对象，将计算过的值存起来，下次直接读取。这直接将时间复杂度降为 `O(n)`。

**示例**

```javascript
/**
 * 使用闭包和缓存优化的斐波那契数列
 */
const fibonacciMemo = (function() {
    // 缓存对象，充当备忘录
    const memo = {}; 
    
    return function fib(n) {
        if (n <= 2) return 1; // 终止条件
        
        // 如果备忘录里有，直接返回（O(1) 查找）
        if (memo[n]) return memo[n]; 
        
        // 如果没有，计算后存入备忘录，再返回
        memo[n] = fib(n - 1) + fib(n - 2);
        return memo[n];
    }
})();

console.log(fibonacciMemo(50)); // 瞬间输出: 12586269025
```

### 3.2 优化方案 B：尾递归优化 (Tail Call Optimization - TCO)

**陷阱：调用栈溢出 (Stack Overflow)。**
JS 引擎在执行函数时，会往内存的“执行栈（Call Stack）”中推入栈帧。如果递归层数太深（一般超过 10000 层），内存就会被撑爆，抛出 `RangeError: Maximum call stack size exceeded`。

**对策：** 将递归调用放到函数的**最后一步**，并且**不要保留任何局部变量的计算**。这样引擎就可以重用当前栈帧，不再无脑压栈。

**示例**

```javascript
// ❌ 普通递归：返回阶段还需要进行乘法运算 (n * ...)，所以必须保留每一层的 n，导致一直压栈
function factorial(n) {
    if (n === 1) return 1;
    return n * factorial(n - 1); 
}

// ✅ 尾递归优化：将中间结果 (total) 放在参数中传递。最后一步纯粹只有函数调用本身。
function factorialTail(n, total = 1) {
    if (n === 1) return total;
    return factorialTail(n - 1, n * total); // 重点：没有外层计算了
}
```
*(注：目前主流浏览器中，只有 Safari 严格实现了 ES6 的尾调用优化，Chrome 和 Node.js 出于调试栈追踪的考虑，默认未开启或移除了 TCO。但掌握这种重构思维非常关键。)*

## 4. 常见问题深度剖析 (FAQ)

| 常见报错 / 疑问 | 产生原因深度解析 | 最终解决方案 |
| :--- | :--- | :--- |
| **报错：`RangeError: Maximum call stack size exceeded`** | 这就是著名的“栈溢出”。原因有二：一是忘记写“终止条件”导致无限死循环；二是数据量实在太大，递归层数超出了浏览器 V8 引擎限制的最大调用栈容量（通常在 10000 左右）。 | 1. 检查 `if` 终止条件逻辑。<br>2. 若确实数据量过大，请将**递归重构为 `while` / `for` 循环（迭代）**，或者自己手动维护一个数组来模拟栈（Stack）。 |
| **为什么深拷贝递归会报内存泄漏或死循环？** | 因为对象存在“循环引用”。例如 `obj.a = obj`，对象的一个属性指向了自己。普通的递归深拷贝会顺着这条线一直无限拷贝下去。 | 如同上面深拷贝代码所示，必须引入 `WeakMap`。每次拷贝对象前，先查一下 `WeakMap`，如果拷贝过，直接返回缓存的引用地址即可。 |
| **递归 和 迭代（循环），到底怎么选？** | 递归的优点是代码可读性极高，极度符合人类的数学思维；缺点是内存开销大（压栈），存在溢出风险。迭代的优点是性能极高，无栈溢出风险；缺点是处理树、图等非线性结构时，代码会极其臃肿复杂。 | **黄金法则：** 在处理线性结构（如单纯计算、一维数组）且层级很深时，优先用**迭代 (while/for)**。在处理非线性结构（如 DOM 树遍历、AST 解析、对象深拷贝）时，果断使用**递归**。 |