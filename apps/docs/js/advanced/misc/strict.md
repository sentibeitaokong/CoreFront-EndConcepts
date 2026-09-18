# JavaScript **严格模式 (Strict Mode)**

严格模式是 ES5 引入的运行模式：**消除不安全的特性**、**把静默失败的错误抛出**、**修复引擎怪异行为**、**禁用令人困惑的语法**，让语义更严格。

> 一句话：严格模式**不增加任何新能力**，只做减法——把“**能跑但结果说不清**”的写法变成“**要么明确报错，要么语义确定**”。

## **1. 什么是严格模式？**

严格模式 (`"use strict";`) 是限制性更强的 JavaScript 变体，目标是：

- **消除不合理、不严谨的特性**：减少错误率。
- **纠正引擎的不安全操作**：如防止意外创建全局变量。
- **提高引擎的优化空间**：提升运行速度。
- **为未来版本做好铺垫**：禁止未来可能成为关键字的标识符。

### **1.1 设计背景：一次“带开关”的语言修复**

严格模式在 ES5（2009 年）落地，是**受限变体（restricted variant）**：既清理历史包袱，又**不能破坏已有的网页**（网页脚本没有版本号）。它有三个性质：

- **选择性（opt-in）**：不写指令就维持旧语义。
- **分阶段生效**：分**早期错误**（解析阶段抛 `SyntaxError`）与**运行时行为改变**两类。
- **不可退出**：进入后嵌套函数**只能继续严格**，没有任何指令能“**回到**”非严格模式；例外是间接 `eval` 和 `new Function`。

### **1.2 严格模式不是什么**

别把它当成“**安全模式**”：

- **它不是沙箱**：照样能读写 `window` / `globalThis` 和 `document`；隔离不受信任的代码请用 iframe `sandbox`、Worker 或服务端沙箱。
- **它不是安全边界**：`with` 被禁是因为它让作用域无法静态分析、拖慢优化，不是因为“不安全”。
- **它不能控制别人的代码**：第三方库是否严格由库自己决定，你无法从外部替它开启（全局写指令反而会连累它）。
- **它不是类型检查**：它只约束语言语义；类型检查是 TypeScript / Flow 的事。

### **1.3 两类约束：早期错误与运行时错误**

排查时先分清这三类：

- **早期错误（Early Errors）**：`with`、重复形参名、八进制字面量、保留字作标识符、`delete 变量名`、给 `eval` / `arguments` 赋值……都是 **`SyntaxError`**，整段脚本（或函数）一步都执行不到。
- **运行时错误（Runtime Errors）**：给未声明变量赋值（`ReferenceError`）、给只读属性赋值、删除不可配置属性、访问 `arguments.callee`（后三者都是 `TypeError`）——执行到那一行才报错。
- **语义变化（不报错，结果不同）**：`this` 绑定、`arguments` 与形参脱钩、`eval` 的作用域隔离。这类最危险，因为它不提醒你。

> 经验法则：**脚本整个不执行**看第一类；**跑到某处才炸**看第二类；**结果对不上但不报错**看第三类。

## **2. 如何启用严格模式？**

### **2.1 在全局作用域启用**

在脚本文件的**最顶部**添加 `"use strict";`，整个文件的代码都进入严格模式。

- **影响范围**: 整个脚本文件中的所有代码。
- **注意**: 多文件打包合并、其中一个未启用时可能出意外行为，因此**不推荐全局启用**。

```js
// script.js
'use strict'
// 整个文件的代码都运行在严格模式下

function foo() {
  // ...
}
```

“**影响范围**”有两个边界：

- 它只影响**同一个 `<script>` 标签**（或同一模块/文件）内的代码，不影响其他 `<script>`，也不影响 `onclick="..."` 内联处理器（它们永远是非严格边界）。
- 反过来，它会**连累同一边界里的所有代码**，包括 `require` 进来的旧库：旧库若依赖隐式全局变量会立刻抛 `ReferenceError`，报错位置却在第三方代码里。

```html
<!-- 每个 <script> 是独立的边界，互不影响 -->
<script>
  'use strict'
  // 只有这个标签里的代码是严格模式
</script>

<script>
  // 另一个标签仍然是非严格模式
  window.anotherFlag = true
</script>
```

这种“**一荣俱荣、一损俱损**”的耦合，让**现代项目几乎不再全局启用**：用 ESM（自动严格），或退到函数级。

### **2.2 在函数作用域启用**

在函数体的**最顶部**添加 `"use strict";`。

- **影响范围**: 只有该函数及其内部嵌套的函数（未显式启停严格模式时）以严格模式运行。
- **推荐**: 这是**更安全**的方式：影响范围限定在特定函数内，避免与未严格代码冲突。

```js
function myFunction() {
  'use strict'
  // myFunction 内部的代码运行在严格模式下
  // 嵌套函数也会继承严格模式，除非它自己禁用（不推荐）
  function nestedFunction() {
    // ...
  }
}

// 外部代码不受影响，运行在非严格模式下
```

严格模式**只能向内继承、不能向外扩散**，也不能被关闭：

```js
'use strict'

function outer() {
  // 这里没有任何指令可以退回非严格模式
  function inner() {
    // 依然处于严格模式
    console.log(this) // undefined
  }
  inner()
}

outer()
```

### **2.3 `'use strict'` 的位置陷阱**

`'use strict'` 看起来像“**指令**”，是因为它是规范里的**指令序言（Directive Prologue）**——脚本或函数体最开头“**只由字符串字面量构成的表达式语句**”；不在此位置就只是无用字符串，**不报错、不提示、静默失效**：

- **前面已经有语句**（常见于把指令写在 `require` 之后）：

```js
// ❌ 失效：它前面已经有语句，不再属于指令序言
// const fs = require('fs')
// 'use strict' // 只是一句普通的字符串表达式，什么也不会发生
```

```js
// ✅ 正确：指令写在所有语句之前
'use strict'
const fs = require('fs')
```

> 注释和空行**不算**语句，写在指令前不影响生效；BOM 也允许出现在最前面。

- **加了括号、拼接或转义**：`('use strict')`、`'use strict' + ''` 或转义某个字母，都**不是**指令——**源码文本**必须精确等于 `"use strict"` 或 `'use strict'`，且全小写。
- **文件拼接（concat）**：合并后只有位于**结果最开头**的指令有效，后面文件里的通通降级成普通字符串；拼接还可能制造语法错误：

```js
// a.js（末尾故意不写分号）
const a = 1
```

```js
// b.js
'use strict'
```

> 直接拼接后第一行成了 `const a = 1 'use strict'`，一个 `SyntaxError`。

- **被包进 IIFE / 包装函数**：打包器把文件塞进函数后，指令变成**那个函数体的指令**，只覆盖该文件自己的代码（通常正是想要的）；多个文件被合并进**同一个**函数体时，只有第一条有效。
- **压缩器删掉它**：terser、esbuild 默认保留，但老工具和激进配置会把“**没用到的字符串字面量**”当垃圾优化掉——**不要把严格模式是否生效寄托在压缩配置上**。

反直觉的一点：严格模式**不需要也不应该做特性检测**——老引擎里它只是一句无副作用的字符串，代码安静地按非严格模式跑。代价是你**永远不能假设它生效**，所以新代码应依靠 ESM / class 这类语法级保证。

### **2.4 自动处于严格模式的环境**

最常见的情况是：**你根本没写过 `'use strict'`，却一直在严格模式下写代码**。

- **ES Modules**：带 `import` / `export` 的文件，模块体整体自动严格。
- **class 内部**：类体、方法、取值器/设值器、字段初始化器、静态块全部自动严格。所以类方法里的 `this` 丢掉时是 `undefined` 而非全局对象——React 类组件里那个著名的“`this` 是 undefined”报错，根源就在这里。
- **TypeScript**：`alwaysStrict`（`strict: true` 时默认开启）让 TS 按严格模式解析源码，并在 CommonJS 产物顶部写入指令。
- **构建产物**：Vite / webpack 对 ESM 的处理天然严格；Vue 单文件组件、React 组件在现代工具链里都是模块。

```js
class Counter {
  constructor() {
    this.count = 0
  }

  increment() {
    // class 内部自动严格模式：this 不会被替换成全局对象
    this.count += 1
    return this.count
  }
}

const counter = new Counter()
const { increment } = counter // 把方法“摘”下来
// increment() // TypeError: Cannot read properties of undefined (reading 'count')
```

## **3. 严格模式带来的主要变化**

严格模式通过以下规则改变 JavaScript 的行为：

### **3.1 消除不安全的特性**

#### 3.1.1 **不允许使用 `with` 语句**

`with` 会创建自己的作用域，变量难以追溯，也影响性能优化。

```js
'use strict'
// with ({a: 1}) { console.log(a); } // SyntaxError
```

`with` 是**早期错误**：只要出现在严格模式代码里，整段脚本/函数连解析都过不了。被禁的原因：**作用域无法静态分析**（`with (obj) { foo() }` 里的 `foo` 来自 `obj` 还是外层只有运行到那一刻才知道，引擎只能放弃变量的静态定位与内联）和**可读性灾难**。替代方案是解构或显式前缀：

```js
const options = { host: 'localhost', port: 8080 }

// ✅ 用解构替代 with
const { host, port } = options
console.log(host, port) // localhost 8080
```

#### 3.1.2 **不允许使用 `arguments.caller` 和 `arguments.callee`**

严格模式下**访问** `arguments.callee` 会抛 `TypeError`（历史上部分实现直接报语法错误）。它有性能问题（让函数**无法被安全地内联和重命名**）和安全隐患（泄露调用者信息），替代方案是**具名函数表达式（NFE）**——名字只在函数体内部可见、可用于递归

```js
// ✅ 具名函数表达式：函数体内部用 fact 递归
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1)
}

console.log(factorial(5)) // 120
```

这个“**内部可见、外部不可见**”的名字绑定在严格模式下是**只读**的：`fact = null` 抛 `TypeError`，非严格模式下静默失败。

#### 3.1.3 **不允许把 `eval` / `arguments` 用作形参或变量名**

它们是受限标识符。

### **3.2 抛出以前静默失败的错误**

这一类价值最高：把“**悄悄做错事**”变成“**当场报错**”。非严格模式下它们全部静默失败，bug 会带着错误的数据继续跑，等到很远处才炸。

#### 3.2.1 **不允许意外创建全局变量**

给未声明的变量赋值不再隐式创建全局变量，而是抛 `ReferenceError`。

```js
'use strict'
// x = 10; // ReferenceError: x is not defined
```

注意区分“**读**”和“**写**”：读未声明变量**两种模式**都抛 `ReferenceError`，只有**赋值**在非严格模式下会隐式创建全局变量——它是内存泄漏、命名冲突、测试互相污染的常见源头，参见 [变量声明](/js/basic/variablesDeclare) 与 [内存空间](/js/basic/memorySpace)。

#### 3.2.2 **对只读属性赋值会抛出 `TypeError`**

```js
'use strict'
const obj = {}
Object.defineProperty(obj, 'prop', { value: 1, writable: false })
// obj.prop = 2; // TypeError
```

“**只读**”的来源有好几种，严格模式下一律抛 `TypeError`：常量 (`const`)、不可配置 / 不可写属性、只有 `getter` 没有 `setter` 的访问器属性、`Object.freeze()` / `Object.seal()` 之后的属性，以及原始值包装对象的属性（如字符串的 `length`）。

```js
'use strict'

const frozen = Object.freeze({ name: 'x' })
// frozen.name = 'y' // TypeError: Cannot assign to read only property 'name'

const text = 'hello'
// text.length = 99 // TypeError: Cannot assign to read only property 'length'

console.log(frozen.name, text.length) // x 5
```

#### 3.2.3 **对不可扩展对象添加属性会抛出 `TypeError`**

```js
'use strict'
const obj = {}
Object.preventExtensions(obj)
// obj.newProp = 1; // TypeError
```

三个防护级别的区别在**禁止的范围**：`preventExtensions` 不能**新增**（已有属性可改可删）；`seal` 再加不能删除，但**可以修改**；`freeze` 不能新增、删除、修改。

```js
'use strict'

const sealed = Object.seal({})
// sealed.a = 1 // TypeError: Cannot add property a, object is not extensible

console.log(Object.isSealed(sealed)) // true
```

#### 3.2.4 **删除不可配置属性会抛出 `TypeError`**

```js
'use strict'
// delete Object.prototype; // TypeError (在严格模式下)
```

关于 `delete`，分清三种情况：**可配置属性**（`delete obj.a`）任何模式下都合法、返回 `true`；**不可配置属性**（`delete Object.prototype`、数组的 `length`）严格模式抛 **`TypeError`**，非严格模式静默返回 `false`；**变量名 / 函数名 / 形参**（`delete x`）严格模式是 **`SyntaxError`**，非严格模式静默返回 `false`。

```js
'use strict'

const obj = { a: 1 }
console.log(delete obj.a) // true：可配置属性任何模式下都能删

// 以下两种写法在严格模式下的报错类型不同（这里是注释，真实代码会抛错）：
// delete obj    // SyntaxError：不能删除变量名（早期错误）
// delete Object.prototype // TypeError：不可配置属性（运行时错误）
```

另外 `delete arr[0]` 虽合法，却只把元素挖成**空洞（empty）**，长度不变；删元素应该用 `splice()`。

### **3.3 修复一些 JS 引擎的怪异行为**

#### 3.3.1 **`this` 绑定**

- **普通函数调用**: 非严格模式下独立调用（如 `myFunction()`）的 `this` 指向**全局对象 (`window`)**；严格模式下绑定到 `undefined`。
- **`call()`, `apply()`, `bind()`**: `thisArg` 为 `null` / `undefined` 时 `this` 原样绑定，非严格模式则会自动转成全局对象。

```js
function showThis() {
  'use strict'
  console.log(this)
}
showThis() // undefined
showThis.call(null) // null
```

关键机制是 **`this` 替换（This Substitution）**：非严格模式做两层“**兜底**”——`undefined` / `null` 换成全局对象、原始值包装成对象，严格模式**原样保留**。

#### 3.3.2 **`arguments` 对象的行为**

- 非严格模式下 `arguments` 的元素与命名参数**同步**（改 `arguments[i]` 会改对应参数，反之亦然）；严格模式下二者**完全解耦**，互不影响。

```js
function foo(a) {
  'use strict'
  a = 2
  console.log(arguments[0]) // 1 (解耦)
}
foo(1)
```

这个“**同步映射**”是非严格模式独有的历史设计，与默认参数、rest 参数等新语法天然冲突（有默认值时映射本就会失效），因此在严格模式里被移除。

#### 3.3.3 **函数参数名不能重复**

```js
'use strict'
// function foo(a, a) { } // SyntaxError
```

重复形参在非严格模式里允许，但谁生效取决于引擎实现和是否使用默认值，属于“**看着像 bug、其实是合法代码**”的典型；严格模式下是**早期错误**。箭头函数、对象/类的方法简写，以及任何带默认参数、rest 参数、解构参数的函数，**在任何模式下**都禁止重复形参。

### **3.4 禁用令人困惑的语法**

#### 3.4.1 **不允许使用八进制字面量**

`0123` 会被视为错误。

```js
'use strict'
// const num = 0123; // SyntaxError
```

为什么连这个都禁？`0123` 看似十进制的一百二十三，实际值是 **83**（`1×64 + 2×8 + 3`），这种“**看错一位、结果差几十倍**”的坑不值得保留；`08`、`09` 在各年代引擎里行为也不一致，一并被禁。

正确写法是 ES6 的显式前缀，**严格模式下同样合法**：

```js
'use strict'

const octal = 0o123 // 显式八进制：83
const hex = 0x53 // 十六进制：83
const binary = 0b1010011 // 二进制：83

console.log(octal, hex, binary) // 83 83 83
console.log(parseInt('123', 8)) // 83：用 API 表达“按八进制解析”的意图
```

字符串里的八进制转义（`'\1'`、`'\012'`）同样是 `SyntaxError`，改用 `'\x01'` 十六进制写法。

#### 3.4.2 **不允许将 `eval` 字符串中的变量引入到当前作用域**

`eval` 作用域独立。

```js
'use strict'
// eval("var x = 1;"); console.log(x); // ReferenceError
```

非严格模式里的 `eval` 直接在**调用者的变量环境**里执行，`var` 声明会污染外层作用域；严格模式把它关进独立作用域。

#### 3.4.3 **不允许将 `eval` 和 `arguments` 作为变量名或函数名**

它们是关键字。

更准确的说法是**受限标识符**：不能作变量名、函数名、形参名、catch 参数名，也不能作为赋值或自增的目标（`eval = 1`、`arguments++` 都是 `SyntaxError`），但作为**属性名**合法：

```js
'use strict'

const obj = { eval: 1, arguments: 2 } // ✅ 属性名不受限制
console.log(obj.eval, obj.arguments) // 1 2

// 以下都是 SyntaxError（早期错误），这里只做文字说明：
// var eval = 1
// function arguments() {}
// eval = 1
```

#### 3.4.4 **严格模式保留字不能用作标识符**

`implements`、`interface`、`package`、`private`、`protected`、`public`、`static`、`let`、`yield` 在严格模式代码中不能用作变量名、函数名或形参名（`enum` 在任何模式下都是保留字）。

这是“**为未来 JavaScript 版本做好铺垫**”的体现：`let` / `class` / `import` 要安全落地，就得先让这些词在老代码里不能用作标识符。它们**作为属性名或字符串**照旧可用（`obj.private`、`obj['let']`）；ES Modules 里 `await` 也是保留字。

### **3.5 非严格模式 vs 严格模式：行为对照**

[width(36,31,33)]

| 场景                                   | 非严格模式                | 严格模式                         |
| -------------------------------------- | ------------------------- | -------------------------------- |
| 给未声明变量赋值 `x = 1`               | 隐式创建全局变量          | `ReferenceError`                 |
| 独立调用函数时的 `this`                | 全局对象                  | `undefined`                      |
| `fn.call(null)` / `fn.call(undefined)` | `this` 被替换为全局对象   | `this` 保持 `null` / `undefined` |
| `fn.call(1)` 传入原始值                | `this` 包装成 Number 对象 | `this` 保持原始值 `1`            |
| `arguments` 与形参                     | 双向同步（映射）          | 完全脱钩                         |
| 访问 `arguments.callee`                | 可用                      | `TypeError`                      |
| 具名函数表达式内部的名字被赋值         | 静默失败                  | `TypeError`                      |
| 重复的形参名                           | 允许（谁生效看实现）      | `SyntaxError`（早期错误）        |
| `with` 语句                            | 可用                      | `SyntaxError`（早期错误）        |
| 八进制字面量 `0123`                    | 按八进制解析为 83         | `SyntaxError`（早期错误）        |
| `delete 变量名`                        | 静默返回 `false`          | `SyntaxError`（早期错误）        |
| 删除不可配置属性                       | 静默返回 `false`          | `TypeError`                      |
| 给只读 / 不可写属性赋值                | 静默失败                  | `TypeError`                      |
| 给不可扩展对象新增属性                 | 静默失败                  | `TypeError`                      |
| `eval` 中声明的 `var`                  | 泄漏到外层函数作用域      | 只存在于 `eval` 内部             |
| 给 `eval` / `arguments` 赋值           | 允许（覆盖同名变量）      | `SyntaxError`（早期错误）        |

## **4. 深入理解：`this` 的绑定**

严格模式对 `this` 的改动最容易“**撞到**”。`this` 的确定分两步：**先按调用方式算出 `thisArg`**（默认 / 隐式 / 显式 / `new` 绑定，见 [this](/js/basic/this)），**再做 this 替换**；严格模式的差别只在第二步：

- 非严格模式：`undefined` / `null` → 替换成全局对象；原始值 → 用 `ToObject` 包装成对应对象。
- 严格模式：**原样保留**。

```js
function sloppyFn() {
  return this
}

function strictFn() {
  'use strict'
  return this
}

console.log(strictFn()) // undefined：独立调用不再兜底成全局对象
console.log(sloppyFn() === globalThis) // true：被替换成全局对象
console.log(strictFn.call(1)) // 1：原始值原样保留
console.log(typeof sloppyFn.call(1)) // object：被包装成 Number 对象
```

一条极易被误解的规则：**严格与否取决于“被调用的那个函数”，与调用它的代码是否严格无关**——非严格函数即使用严格代码调用，`this` 照样被替换成全局对象；严格函数也不会因为调用者宽松而获得兜底。

```js
function sloppy() {
  return this === globalThis
}

function caller() {
  'use strict'
  // 调用者严格，但 sloppy 自己不是严格函数，this 依旧被替换成全局对象
  return sloppy()
}

console.log(caller()) // true
```

丢掉 `this` 时两种模式差异极大，这是严格模式最有价值的报错之一：

```js
'use strict'

const user = {
  name: '小明',
  greet() {
    return `你好，我是 ${this.name}`
  },
}

console.log(user.greet()) // 你好，我是 小明

const greet = user.greet // 把方法“摘”下来，调用时不再有接收者
// greet() // TypeError: Cannot read properties of undefined (reading 'name')

const bound = user.greet.bind(user) // ✅ 用 bind 固定 this
console.log(bound()) // 你好，我是 小明
```

对比非严格模式：同样的 `greet()` 不报错，而是把属性挂到全局对象上（`this.name` 变成 `window.name`），程序带着错误状态继续跑。**报错比幻觉好**，这正是严格模式的设计哲学。

```js
// 非严格模式：不报错，但悄悄污染了全局对象
function setTitle() {
  this.title = 'hello' // 等价于 window.title = 'hello'
}

setTitle()
// window.title === 'hello'：bug 被藏起来了
```

其他几个实际影响：

- **类方法与回调里的 `this`**：类方法天然严格，当回调传递时 `this` 是 `undefined`；`setTimeout(fn)`、事件监听器、`forEach` 的回调都以“独立调用”执行，严格模式下同样是 `undefined`。
- **箭头函数不受影响**：它没有自己的 `this`，捕获的是定义位置的词法 `this`。

## **5. 深入理解：`arguments`、`eval` 与作用域**

### **5.1 `arguments` 与形参的脱钩**

非严格模式下 `arguments` 是“**映射型对象**”，与形参是**同一份数据的两个视图**，读写互相影响；严格模式下二者彻底分家。

```js
function strictFoo(a) {
  'use strict'
  arguments[0] = 99
  console.log(a) // 1：改 arguments 不影响形参
}
strictFoo(1)

function sloppyFoo(a) {
  arguments[0] = 99
  console.log(a) // 99：非严格模式下二者同步
}
sloppyFoo(1)
```

脱钩的实际影响：

- **参数就是参数**：形参的值只由调用决定，不会因为别处读了 `arguments` 而被改回来，行为更容易推理。
- **`arguments` 依然是类数组对象**：`arguments.length`、`arguments[0]` 照常可用，只是不再与形参关联，也没有 `callee` / `caller`。
- **它不是数组**：没有 `map` / `filter`，转换要用 `Array.from(arguments)` 或 `[...arguments]`；现代代码更推荐 **rest 参数**：

```js
'use strict'

function sum(...nums) {
  return nums.reduce((total, n) => total + n, 0)
}
console.log(sum(1, 2, 3)) // 6：rest 参数是真正的数组

function legacySum() {
  return Array.from(arguments).reduce((total, n) => total + n, 0)
}
console.log(legacySum(1, 2, 3)) // 6：老代码的写法仍然可用
```

- **箭头函数没有自己的 `arguments`**：它读取外层函数的 `arguments`，严格模式下同样成立。

### **5.2 `eval` 的作用域隔离**

先澄清一个误解：**严格模式不会让 `eval` 变安全，只是让它变“干净”**，区别在于两种调用方式：

- **直接 `eval`**（`eval(code)`）：在调用者的作用域里执行，**继承调用者的严格性**；严格模式下它有独立的变量环境，其中的 `var` / 函数声明不会泄漏到外层。
- **间接 `eval`**（`(0, eval)(code)`、`const e = eval; e(code)`）：**永远在全局作用域执行**，严格与否只看代码自身开头有没有指令，与调用者是否严格无关。

```js
'use strict'

function strictScope() {
  // 严格模式下 eval 有自己独立的变量环境，var 不会泄漏到外层
  eval('var leaked = 1;')
  // console.log(leaked) // ReferenceError: leaked is not defined
}

function sloppyScope() {
  eval('var leaked = 1;')
  console.log(leaked) // 1：非严格模式下泄漏成了本函数的局部变量
}

strictScope()
sloppyScope()
```

同样的规则也适用于 `new Function(...)`：函数体默认在**非严格模式**下创建和执行，除非自己写了指令。经典用法是拿它当 `globalThis` 的兜底：

```js
'use strict'

// new Function 的函数体默认非严格，与调用方是否严格无关
const getGlobal = new Function('return this')
console.log(getGlobal() === globalThis) // true

// 除非函数体自己写了指令
const getStrictThis = new Function("'use strict'; return this")
console.log(getStrictThis()) // undefined
```

实战建议：**新代码不要用 `eval`**：解析 JSON 用 `JSON.parse()`，按名字取属性用 `obj[key]`，动态生成函数优先用配置 + 查表。`eval` 让压缩器无法重命名变量，也让读者无法静态追踪变量来源，代价远大于便利。

## **6. 性能与兼容性**

### **6.1 严格模式会让代码变快吗？**

结论：**它移除的是阻碍优化的东西，而不是自动提供优化**。

- 它禁止了 `with`、`arguments` 映射、`eval` 污染外层作用域这些“**引擎无法静态分析**”的结构，少了这些，引擎更容易做变量定位、内联和逃逸分析。
- 真正拖慢速度的往往是**非严格模式里的写法**：用了 `with` 或 `arguments.callee` 的函数，历史上常直接掉出优化队列。
- 但现代引擎（V8 / SpiderMonkey / JavaScriptCore）对两种模式都做了大量优化，“**严格模式快 x%**”通常落在噪声范围内。

所以：**为了正确性才使用严格模式，不要为了性能**——性能有问题先看算法复杂度、数据结构与 I/O。

### **6.2 兼容性**

- **引擎支持**：ES5（2009）起所有主流引擎都支持；Node.js 各版本都支持；IE10+ 支持，IE9 只是部分支持。
- **优雅降级**：老引擎会把指令当普通字符串忽略，代码照常运行（只是非严格）。这保证兼容性，但也意味着**严格模式不是你能假定的前提**，要靠 ESM / class 这类语法级保证。
- **构建链**：ESM 产物天然严格；打包器内联模块时指令会落在对应的函数体里。
- **不要用它做隔离**：严格模式不提供任何安全边界。

### **6.3 迁移老代码时的典型报错**

给旧代码加严格模式，第一波错误几乎总是这几类：

[width(41,26,33)]

| 报错                                                             | 触发原因                                           | 处理方式                                            |
| ---------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `ReferenceError: xxx is not defined`                             | 隐式全局变量：漏写 `var` / `let` / `const`         | 补上声明，而不是加 `window.` 前缀把它“**合法化**”   |
| `TypeError: Cannot assign to read only property`                 | 误写冻结对象、`const` 对象属性、只有 getter 的字段 | 查清写入点：需要可变就别 `freeze`，或改成构造新对象 |
| `SyntaxError: Strict mode code may not include a with statement` | 用了 `with`：早期错误，整段代码都不执行            | 用解构替代                                          |
| `SyntaxError: Octal literals are not allowed in strict mode`     | 老代码里的 `0123` 或 `'\012'`                      | 改成 `0o123`、`'\x01'` 这类显式写法                 |
| `TypeError: Cannot read properties of undefined`                 | 丢掉 `this` 的函数调用终于暴露了                   | `bind`、箭头函数字段，或在传入处包一层              |

错误处理机制参见 [错误处理](/js/advanced/misc/errorHandling)。

## **7. 方案对比**

严格模式只是“**让运行时更严格**”的一种手段，实际项目里通常和下面这些方案配合使用：

[width(30,13,33,24)]

| 方案                              | 作用范围          | 主要作用                                               | 局限                                 |
| --------------------------------- | ----------------- | ------------------------------------------------------ | ------------------------------------ |
| `'use strict'` 指令               | 所在脚本 / 函数体 | 运行时语义收紧（早期错误 + 运行时错误 + 语义变化）     | 只作用于所在边界，拼接或压缩容易失效 |
| ES Modules（`import` / `export`） | 模块体            | 自动严格，无需指令；还带来独立作用域与静态依赖分析     | 需要构建链或运行时支持 ESM           |
| class 语法                        | 类体              | 类体与方法自动严格                                     | 只覆盖类内部                         |
| TypeScript `alwaysStrict`         | 编译期 + 产物     | 编译期按严格模式解析，CommonJS 产物写入 `"use strict"` | 只影响 TS 编译出的代码               |
| TypeScript `strict` 家族          | 编译期            | 类型层面的严格检查（`strictNullChecks` 等）            | 与运行时严格模式是两件事             |
| ESLint（`strict`、`no-undef` 等） | 静态分析          | 写代码时就拦住隐式全局、`with` 等写法                  | 只覆盖被 lint 的文件，管不到运行时   |
| 沙箱（iframe sandbox / Worker）   | 隔离的执行环境    | 真正的隔离与安全边界                                   | 重量级，且不是严格模式的替代品       |

- **TypeScript 的 `strict` 与运行时严格模式无关**：`strict: true` 打开的是 `strictNullChecks`、`noImplicitAny` 这类**类型检查**开关，负责“**按严格模式解析并输出指令**”的是 `alwaysStrict`（`strict: true` 时默认开启）——只依赖类型检查而关掉它，产物可能并不在严格模式下运行。
- **ESLint 管的是你写的时候，严格模式管的是跑的时候**。它能提前警告隐式全局变量，但绕过 lint 的代码（生成、动态拼接、第三方脚本）只有严格模式能在运行时兜底。

## **8. 总结**

- 严格模式是 ES5 引入的**受限变体**：不新增能力，只把“**说不清的旧行为**”换成“**明确的报错或确定的语义**”。
- 三类改动：**早期错误**（`with`、重复形参、八进制、保留字）、**运行时错误**（未声明赋值、只读属性、不可配置属性）、**语义变化**（`this` 不做替换、`arguments` 脱钩、`eval` 作用域隔离）。
- 启用方式有全局和函数级两种，**函数级更安全**；现代做法则是**什么都不写**——ESM 和 class 内部自动严格。位置陷阱最容易踩：指令必须是脚本/函数体**最开头的字符串字面量表达式语句**，前面有语句、加了括号、拼接或压缩之后都可能**静默失效**。
- 它**不是沙箱**、**不影响箭头函数的 `this`**、**不能捕获所有错误**、**也不保证性能提升**；新代码默认工作在严格模式下，老代码逐模块迁移，把严格模式当成“免费的错误探测器”。

## **9. 常见问题与最佳实践 (FAQ)**

### 9.1 为什么推荐在函数内部启用严格模式，而不是全局？

- 全局启用会影响整个脚本文件的所有代码，依赖的旧第三方库、未兼容严格模式的旧代码都可能因此报错；函数内启用可以**限定影响范围**，逐步改造。
- 更彻底的是**连指令都不写**：改用 ES Modules，模块自己就是严格模式。

### 9.2 严格模式下 `this` 为什么变成 `undefined`？箭头函数受影响吗？

- 因为严格模式**取消了 `this` 替换**：非严格模式下 `undefined` / `null` 会被兜底成全局对象、原始值会被包装成对象，严格模式下全部**原样保留**，目的是让“**调用者忘了给接收者**”**立刻暴露**成 `TypeError`。
- 决定严格与否的是**被调用的那个函数**，与调用它的代码是否严格无关。箭头函数**不受影响**：它的 `this` 是**词法绑定**，总是捕获定义位置的 `this`。

```js
function makeGetter() {
  'use strict'
  // 箭头函数没有自己的 this，捕获的是这里的 this（严格模式下为 undefined）
  return () => this
}

const getThis = makeGetter()
console.log(getThis()) // undefined
console.log(getThis.call({ a: 1 })) // undefined：call 改变不了箭头函数的 this
```

### 9.3 为什么代码拼接或压缩后 `'use strict'` 会失效？

- 因为指令只在**所处边界的最开头**有效：多个文件拼接后只有合并结果最开头的那条生效，后面文件里的降级成普通字符串（**不报错、不提示**）；打包器把文件包进 IIFE 时，作用范围变成**那个函数体**，多个文件塞进同一函数体时只有第一条有效。压缩器配置也可能把它当无用字符串删掉。
- 结论：**不要依赖字符串来保证严格模式**，用 ESM / class 这类语法级保证。

### 9.4 ESM 或 class 内部还需要手写 `'use strict'` 吗？

- **不需要**。ES Modules 内部的代码**默认自动运行在严格模式下**，无需手动添加 `"use strict";`；class 的类体（含方法、取值器、字段初始化、静态块）同样自动严格。
- 注意它们的严格性只覆盖自己——模块之外、类之外的代码该怎样还怎样。

### 9.5 TypeScript 项目里还需要关心严格模式吗？

- **需要，但要分清两件事**：`strict: true` 打开的是 `strictNullChecks`、`noImplicitAny` 这类**类型检查**开关，负责运行时严格模式的是 `alwaysStrict`（`strict: true` 时默认开启）——关掉它，类型检查再严产物也可能不严格。
- TS 不会阻止你给冻结对象赋值（需要 `readonly` 或类型声明配合），严格模式会。

### 9.6 `delete` 在什么时候会报错？

- **删除变量名 / 函数名 / 形参**：严格模式下是 **`SyntaxError`**（早期错误，整段代码都跑不起来）。
- **删除不可配置属性**（如 `Object.prototype`、数组的 `length`）：运行时 **`TypeError`**；非严格模式静默返回 `false`。
- **删除普通的可配置属性**：任何模式都合法，返回 `true`。另外 `delete arr[0]` 只留空洞、不改长度，删元素应该用 `splice()`。

### 9.7 严格模式能阻止我意外使用 `var` 声明全局变量吗？

- **不能**。`"use strict"; var x = 10;` 仍然会在当前作用域（函数或全局）声明 `x`；它阻止的是**未声明直接赋值**导致的全局变量：`x = 10;`。
- 顺带区分：读取未声明变量两种模式都抛 `ReferenceError`，只有**赋值**在非严格模式下会隐式创建全局变量。

### 9.8 严格模式能捕获所有错误吗？

- **不能**。它只捕获那些在非严格模式下会被静默忽略或导致意外行为的特定错误，捕获不了所有运行时错误（如 `ReferenceError`, `TypeError`），这些仍需 `try...catch` 或全局错误处理。
- 它也**不做类型检查**，类型不匹配、`undefined` 属性访问要靠 TypeScript 和测试。
