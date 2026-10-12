# 栈 (Stack)

## 1. 核心概念与特性

栈是一种**受限的线性表**。它就像是一摞叠在一起的盘子，或者一个只有一个口的细长瓶子。

![栈的 LIFO 后进先出结构示意图](/img/stack.png)

[width(15,85)]

| 特性           | 描述                                                                                                                          |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **核心规则**   | **LIFO (Last In, First Out) —— 后进先出**。                                                                                   |
| **操作限制**   | 你只能在栈的**同一端**（通常称为**栈顶 Top**）进行插入和删除操作。栈的另一端叫做**栈底 (Bottom)**，通常是封闭的、不可操作的。 |
| **生活比喻**   | 1. 餐厅里叠放的盘子，只能从最上面拿，洗好的盘子也只能放在最上面。<br>2. 枪膛里压入的子弹，最后压入的子弹最先被射出。          |
| **时间复杂度** | 插入(Push) 和 删除(Pop) 都是 $O(1)$，因为只操作栈顶。查找特定元素是 $O(n)$。                                                  |
| **核心操作**   | `push`（入栈）、`pop`（出栈）、`peek` / `top`（只读栈顶）、`isEmpty`（判空）、`size`（元素个数）。                            |
| **空间复杂度** | $O(n)$，需要与元素个数等量的额外空间。                                                                                        |
| **实现方式**   | 数组（尾部增删）或链表（头插头删）都可以。两者 `push` / `pop` 都是 $O(1)$，链表版本还不受扩容影响。                           |

## 2. 使用 JS 数组模拟栈

JavaScript 原生没有提供名为 `Stack` 的内置对象，但由于 JS 的 `Array` 对象非常灵活，它天生就自带了**模拟栈操作**的方法。

```js
class Stack {
  constructor() {
    this.items = [] // 使用数组作为底层数据结构
  }

  // 1. 入栈：将元素压入栈顶
  push(element) {
    this.items.push(element)
  }

  // 2. 出栈：移除并返回栈顶元素
  pop() {
    if (this.isEmpty()) return undefined // 处理空栈情况
    return this.items.pop()
  }

  // 3. 窥视：只返回栈顶元素，不移除它
  peek() {
    if (this.isEmpty()) return undefined
    return this.items[this.items.length - 1]
  }

  // 4. 判空：栈是否为空
  isEmpty() {
    return this.items.length === 0
  }

  // 5. 大小：返回栈内元素个数
  size() {
    return this.items.length
  }

  // 6. 清空栈
  clear() {
    this.items = []
  }
}

// === 测试演示 ===
const myStack = new Stack()
myStack.push(10)
myStack.push(20)
myStack.push(30)

console.log(myStack.peek()) // 30 (只看一眼，不拿走)
console.log(myStack.pop()) // 30 (拿走并返回)
console.log(myStack.size()) // 2 (还剩两个)
console.log(myStack.isEmpty()) // false
```

## 3. 栈的经典应用场景

为什么我们需要这种“**受限**”的数据结构？因为它在特定的场景下简直是神器。

### 3.1 浏览器的历史记录（前进/后退）

如果你浏览了页面 A -> B -> C。

- 你其实是把 A、B、C 依次**入栈**。当前页面是栈顶的 C。
- 当你点击“**后退**”时，C **出栈**，此时栈顶变成了 B，你就回到了页面 B。

### 3.2 函数调用栈与执行上下文栈 (Call Stack)

这是 JavaScript 引擎（如 V8）底层执行代码的核心机制。栈里存放的每一项，称为一个**执行上下文**。

- 当你调用函数 A 时，A 的执行上下文入栈；A 内部调用了函数 B，B 的上下文再入栈。
- 只有当 B 执行完毕（`return`），B 才出栈；然后 A 继续执行直到结束并出栈。
- 栈的容量是有限的。递归调用没有出口时，上下文只进不出，最终就会抛出 `RangeError: Maximum call stack size exceeded`，这就是常说的**栈溢出 (Stack Overflow)**。
- 所以「把递归改写成迭代」能规避深度过大的问题——循环不会新增栈帧。

```js
function a() {
  b()
}
function b() {
  c()
}
function c() {
  throw new Error('看看调用栈')
}
a()
// Error 的 stack 属性会依次打印 c → b → a，正是调用栈的实时快照
```

### 3.3 编辑器的“**撤销**”操作 (Undo)

每次你输入一段文字或做一个操作，这个动作被封装成对象**入栈**。当你按 `Ctrl+Z` 时，把栈顶的动作**出栈**并执行反向操作。`redo` 则是再准备一个栈：撤销时把动作从 `undo` 栈弹出、压入 `redo` 栈，重做时反过来即可。

### 3.4 单调栈 (Monotonic Stack)

单调栈是栈在算法面试里最高频的变体：栈内元素始终保持**单调递增或递减**。新元素入栈前，先弹出所有破坏单调性的栈顶元素——每个元素最多进栈一次、出栈一次，所以整体是 $O(n)$。

**经典题：每日温度 (LeetCode 739)** —— 给出每天的温度，求每一天要等几天才会出现更高的温度。

```js
function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0)
  const stack = [] // 存放【索引】，对应温度保持单调递减

  for (let i = 0; i < temperatures.length; i++) {
    // 当前温度比栈顶索引对应的温度高，说明栈顶那天等到了更暖的一天
    while (
      stack.length > 0 &&
      temperatures[i] > temperatures[stack[stack.length - 1]]
    ) {
      const prev = stack.pop()
      res[prev] = i - prev
    }
    stack.push(i)
  }
  return res
}

console.log(dailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73]))
// [1, 1, 4, 2, 1, 1, 0, 0]
```

同类型的还有「柱状图中最大的矩形」「接雨水」；用栈做「表达式求值 / 逆波兰表达式」「最小栈」也都是高频考点。

> [!IMPORTANT]
> 单调栈里通常存的是**索引**而不是值，因为题目往往需要计算下标之间的距离（如“**等几天**”），只存值就拿不到位置信息了。

## 4. 常见问题 (FAQ) 与算法面试题

### 4.1 为什么不用数组的 `unshift()` 和 `shift()` 来模拟栈？

**性能问题。**

- `push()` 和 `pop()` 操作数组的尾部，不影响其他元素的位置，时间复杂度是 **$O(1)$**。
- `unshift()`（头部插入）和 `shift()`（头部删除）会导致数组中其后的**所有元素**的索引都要重新计算并向后/向前移动一位，时间复杂度是 **$O(n)$**。对于大量数据，性能差异巨大。

### 4.2 经典面试题：利用栈实现“**十进制转任意进制**”

这是最基础的栈算法应用。核心逻辑是：不断除以目标进制数，将余数压入栈中，最后依次弹出栈顶元素，即为转换后的结果。

```js
function baseConverter(decNumber, base) {
  const remStack = new Stack()
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let number = decNumber
  let rem
  let baseString = ''

  if (base < 2 || base > 36) return ''

  while (number > 0) {
    rem = Math.floor(number % base) // 获取余数
    remStack.push(rem) // 余数入栈
    number = Math.floor(number / base) // 更新被除数
  }

  // 依次出栈拼接
  while (!remStack.isEmpty()) {
    baseString += digits[remStack.pop()]
  }

  return baseString
}

console.log(baseConverter(100345, 2)) // 二进制: 11000011111111001
console.log(baseConverter(100345, 16)) // 十六进制: 187F9
```

### 4.3 经典面试题：括号有效性匹配 (LeetCode 20)

给定一个只包括 `'('`，`')'`，`'{'`，`'}'`，`'['`，`']'` 的字符串，判断字符串是否有效。（例如 `"{[]}"` 有效，`"([)]"` 无效）。

- **解法核心**：遇到左括号就**入栈**；遇到右括号，就看它是否和当前**栈顶**的左括号匹配。匹配则弹出栈顶继续，不匹配则无效。如果最后栈为空，说明全部匹配成功。

```js
const isValid_v2 = function (s) {
  if (s.length % 2 !== 0) return false
  const stack = []
  for (let char of s) {
    if (char === '(') {
      stack.push(')')
    } else if (char === '{') {
      stack.push('}')
    } else if (char === '[') {
      stack.push(']')
    } else {
      // 如果是右括号
      // 1. 栈如果为空，说明没有对应的左括号，匹配失败
      // 2. 如果弹出的栈顶元素不是当前的右括号，匹配失败
      if (stack.length === 0 || stack.pop() !== char) {
        return false
      }
    }
  }
  return stack.length === 0
}
```

### 4.4 上面用数组封装的 Stack 类，`items` 属性不是可以被外部直接访问吗？怎么真正实现私有化？

是的，在上面的 ES6 Class 写法中，外部仍然可以通过 `myStack.items.push()` 破坏规则。

- **解决方案**：
  - **ES2022 私有属性**：使用 `#` 前缀，如 `#items = [];`。这是目前官方最推荐的真正私有化写法。
  - **WeakMap 或 闭包**：在旧环境中使用 `WeakMap` 来保存私有属性，或者使用闭包返回对象。

### 4.5 如何用两个栈实现一个队列？(LeetCode 232)

- **思路**：准备「入栈 `inStack`」和「出栈 `outStack`」。入队一律压入 `inStack`；出队时如果 `outStack` 为空，就把 `inStack` 里的元素**全部倒过去**——顺序被反转两次，正好变成 FIFO。
- **关键点**：每个元素最多被搬运一次，所以均摊时间复杂度仍是 $O(1)$。

```js
class MyQueue {
  constructor() {
    this.inStack = []
    this.outStack = []
  }

  push(x) {
    this.inStack.push(x)
  }

  // 出队时若 outStack 为空，先把 inStack 全部倒过去
  #transfer() {
    if (this.outStack.length === 0) {
      while (this.inStack.length > 0) {
        this.outStack.push(this.inStack.pop())
      }
    }
  }

  pop() {
    this.#transfer()
    return this.outStack.pop()
  }

  peek() {
    this.#transfer()
    return this.outStack[this.outStack.length - 1]
  }

  empty() {
    return this.inStack.length === 0 && this.outStack.length === 0
  }
}
```

### 4.6 如何设计一个「最小栈」？(LeetCode 155)

要求 `push`、`pop`、`top`、`getMin` 四个操作都是 $O(1)$。

- **核心技巧**：用一个**辅助栈**同步记录「当前最小值」。每次 `push` 时，辅助栈压入 `Math.min(新值, 原最小值)`；`pop` 时两个栈一起弹出。这样辅助栈顶永远是当前栈内的最小值。

```js
class MinStack {
  constructor() {
    this.stack = []
    this.minStack = [] // 辅助栈，栈顶始终是当前最小值
  }

  push(val) {
    this.stack.push(val)
    const min = this.minStack.length === 0 ? val : Math.min(val, this.getMin())
    this.minStack.push(min)
  }

  pop() {
    this.minStack.pop()
    return this.stack.pop()
  }

  top() {
    return this.stack[this.stack.length - 1]
  }

  getMin() {
    return this.minStack[this.minStack.length - 1]
  }
}
```

### 4.7 前端项目中哪里真的用到了栈？

除了刷算法题，栈在真实前端代码里随处可见：

[width(25,75)]

| 场景                  | 说明                                                                |
| :-------------------- | :------------------------------------------------------------------ |
| JS 引擎的调用栈       | 函数调用、`try/catch` 拿到的 `error.stack` 都基于它。               |
| 路由历史管理          | Vue Router / React Router 的 history 用栈实现前进、后退。           |
| 模板 / 表达式编译     | Vue 编译模板、Babel 解析 JS，都在做「标签配对」，嵌套结构靠栈处理。 |
| AST / DOM 树的遍历    | 手写非递归 DFS 时，用显式栈代替递归的调用栈。                       |
| 撤销 / 重做           | 编辑器的 `undo` / `redo` 用两个栈互相倒。                           |
| 括号 / 标签合法性校验 | 富文本、模板字符串、CSS 解析中检查闭合。                            |

### 4.8 递归和栈是什么关系？

**递归本质上就是让语言替你维护一个栈。** 每进入一层递归，引擎就把参数、局部变量、返回地址打包成一个**栈帧**压入调用栈，返回时再弹出。

- 所以「递归能做的，用显式栈 + 循环都能做」，区别只是栈由谁维护：递归写法简洁但可能爆栈，显式栈不会爆栈但代码更长。
- 这也解释了递归为什么有空间开销：递归深度为 $n$ 时，仅调用栈就要占用 $O(n)$ 的额外空间。
