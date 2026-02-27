# 栈 (Stack)

## 1. 核心概念与特性

栈是一种**受限的线性表**。它就像是一摞叠在一起的盘子，或者一个只有一个口的细长瓶子。

![Logo](/stack.png)

| 特性 | 描述 |
| :--- | :--- |
| **核心规则** | **LIFO (Last In, First Out) —— 后进先出**。 |
| **操作限制** | 你只能在栈的**同一端**（通常称为**栈顶 Top**）进行插入和删除操作。栈的另一端叫做**栈底 (Bottom)**，通常是封闭的、不可操作的。 |
| **生活比喻** | 1. 餐厅里叠放的盘子，只能从最上面拿，洗好的盘子也只能放在最上面。<br>2. 枪膛里压入的子弹，最后压入的子弹最先被射出。 |
| **时间复杂度** | 插入(Push) 和 删除(Pop) 都是 $O(1)$，因为只操作栈顶。查找特定元素是 $O(n)$。 |

## 2. 使用 JS 数组模拟栈 

JavaScript 原生没有提供名为 `Stack` 的内置对象，但由于 JS 的 `Array` 对象非常灵活，它天生就自带了模拟栈操作的方法。

**核心方法映射：**
*   **入栈 (Push)**：对应数组的 `push()`。
*   **出栈 (Pop)**：对应数组的 `pop()`。

为了代码的严谨性、封装性和面向对象思想，我们通常会用一个 Class 来封装这个数组，使其只暴露符合栈特性的 API，从而防止外部通过索引随意修改中间的数据（这破坏了栈的规则）。

**栈的 Class 封装实现**
```js
class Stack {
  constructor() {
    this.items = []; // 使用数组作为底层数据结构
  }

  // 1. 入栈：将元素压入栈顶
  push(element) {
    this.items.push(element);
  }

  // 2. 出栈：移除并返回栈顶元素
  pop() {
    if (this.isEmpty()) return undefined; // 处理空栈情况
    return this.items.pop();
  }

  // 3. 窥视：只返回栈顶元素，不移除它
  peek() {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }

  // 4. 判空：栈是否为空
  isEmpty() {
    return this.items.length === 0;
  }

  // 5. 大小：返回栈内元素个数
  size() {
    return this.items.length;
  }

  // 6. 清空栈
  clear() {
    this.items = [];
  }
}

// === 测试演示 ===
const myStack = new Stack();
myStack.push(10);
myStack.push(20);
myStack.push(30);

console.log(myStack.peek());  // 30 (只看一眼，不拿走)
console.log(myStack.pop());   // 30 (拿走并返回)
console.log(myStack.size());  // 2 (还剩两个)
console.log(myStack.isEmpty()); // false
```

## 3. 栈的经典应用场景

为什么我们需要这种“受限”的数据结构？因为它在特定的场景下简直是神器。

### 3.1 浏览器的历史记录（前进/后退）
如果你浏览了页面 A -> B -> C。
*   你其实是把 A、B、C 依次**入栈**。当前页面是栈顶的 C。
*   当你点击“后退”时，C **出栈**，此时栈顶变成了 B，你就回到了页面 B。

### 3.2 函数调用栈 (Call Stack)
这是 JavaScript 引擎（如 V8）底层执行代码的核心机制。
*   当你调用函数 A 时，A 入栈；A 内部调用了函数 B，B 入栈。
*   只有当 B 执行完毕（`return`），B 才出栈；然后 A 继续执行直到结束并出栈。如果递归调用没有出口，就会导致**栈溢出 (Stack Overflow)**。

### 3.3 编辑器的“撤销”操作 (Undo)
每次你输入一段文字或做一个操作，这个动作被封装成对象**入栈**。当你按 `Ctrl+Z` 时，把栈顶的动作**出栈**并执行反向操作。

## 4. 常见问题 (FAQ) 与算法面试题 

### 4.1 为什么不用数组的 `unshift()` 和 `shift()` 来模拟栈？
*   **答：性能问题。**
    *   `push()` 和 `pop()` 操作数组的尾部，不影响其他元素的位置，时间复杂度是 **$O(1)$**。
    *   `unshift()`（头部插入）和 `shift()`（头部删除）会导致数组中其后的**所有元素**的索引都要重新计算并向后/向前移动一位，时间复杂度是 **$O(n)$**。对于大量数据，性能差异巨大。

### 4.2 经典面试题：利用栈实现“十进制转任意进制”
这是最基础的栈算法应用。核心逻辑是：不断除以目标进制数，将余数压入栈中，最后依次弹出栈顶元素，即为转换后的结果。

```js
function baseConverter(decNumber, base) {
  const remStack = new Stack();
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let number = decNumber;
  let rem;
  let baseString = '';

  if (base < 2 || base > 36) return '';

  while (number > 0) {
    rem = Math.floor(number % base); // 获取余数
    remStack.push(rem);              // 余数入栈
    number = Math.floor(number / base); // 更新被除数
  }

  // 依次出栈拼接
  while (!remStack.isEmpty()) {
    baseString += digits[remStack.pop()]; 
  }

  return baseString;
}

console.log(baseConverter(100345, 2)); // 二进制: 11000011111111001
console.log(baseConverter(100345, 16)); // 十六进制: 187F9
```

### 4.3 经典面试题：括号有效性匹配 (LeetCode 20)
给定一个只包括 `'('`，`')'`，`'{'`，`'}'`，`'['`，`']'` 的字符串，判断字符串是否有效。（例如 `"{[]}"` 有效，`"([)]"` 无效）。
*   **解法核心**：遇到左括号就**入栈**；遇到右括号，就看它是否和当前**栈顶**的左括号匹配。匹配则弹出栈顶继续，不匹配则无效。如果最后栈为空，说明全部匹配成功。

```js
const isValid_v2 = function(s) {
    if (s.length % 2 !== 0) return false;
    const stack = [];
    for (let char of s) {
        if (char === '(') {
            stack.push(')');
        } else if (char === '{') {
            stack.push('}');
        } else if (char === '[') {
            stack.push(']');
        } else {
            // 如果是右括号
            // 1. 栈如果为空，说明没有对应的左括号，匹配失败
            // 2. 如果弹出的栈顶元素不是当前的右括号，匹配失败
            if (stack.length === 0 || stack.pop() !== char) {
                return false;
            }
        }
    }
    return stack.length === 0;
};
```

### 4.4 上面用数组封装的 Stack 类，`items` 属性不是可以被外部直接访问吗？怎么真正实现私有化？
*   **答**：是的，在上面的 ES6 Class 写法中，外部仍然可以通过 `myStack.items.push()` 破坏规则。
*   **解决方案**：
    1.  **ES2022 私有属性**：使用 `#` 前缀，如 `#items = [];`。这是目前官方最推荐的真正私有化写法。
    2.  **WeakMap 或 闭包**：在旧环境中使用 `WeakMap` 来保存私有属性，或者使用闭包返回对象。


