# JavaScript 模块化

JavaScript 模块化的演进史，不仅是一部前端技术从“**玩具脚本**”走向“**企业级工程**”的进化史，更是现代构建工具（Webpack、Vite、Rollup）底层架构的基石。彻底掌握模块化，是成为高级前端架构师不可或缺的硬核基本功。

## 1. 核心痛点与时代背景

在模块化规范诞生之前，前端开发面临着三大致命痛点：

- **全局污染与命名冲突：** 所有的 `<script>` 标签共享同一个 `window` 全局作用域，变量极易被意外覆盖，引发难以排查的“幽灵 Bug”。
- **依赖关系脆弱：** 脚本的加载顺序由 HTML 中的编写顺序决定。一旦底层工具库（如 jQuery）放在了业务代码之后，整个页面将直接崩溃，维护这种隐式的依赖拓扑图宛如走钢丝。
- **作用域真空：** 缺乏“**私有空间**”的概念，所有内部逻辑和临时变量都毫无保留地暴露给外部，毫无安全性与封装性可言。

## 2. 史前暗黑时代：野生模块化的探索

### 2.1 命名空间模式 (Namespace Pattern)

开发者尝试通过将变量和函数挂载到一个全局对象上来减少污染。

```javascript
var Utils = {}
Utils.formatDate = function (date) {
  /*...*/
}
Utils.version = '1.0.0'
```

- **缺陷：** 本质仍然是全局对象，外部可以轻易修改 `Utils.version = '2.0.0'`，毫无数据安全性。

### 2.2 IIFE（立即执行函数表达式）与闭包

这是模块化思想真正的启蒙。利用 JavaScript 的函数作用域（当时还没有块级作用域）来创建私有空间。

```javascript
const UserModule = (function () {
  // 私有变量，外部绝对无法直接访问
  let privateName = 'Alice'

  function privateMethod() {
    console.log(privateName)
  }

  // 返回暴露给外部的 API (闭包)
  return {
    getName: function () {
      return privateName
    },
    setName: function (newName) {
      privateName = newName
    },
  }
})()
```

> **架构意义：** 确立了 **“私有状态 + 暴露公有接口”** 的核心设计模式，这一思想贯穿了后续所有的模块化规范。

## 3. 服务端的破局者：CommonJS (CJS)

2009 年 Node.js 诞生，将 JavaScript 带入了服务端。服务端文件都在本地磁盘，急需一种**同步**的模块加载方案。CommonJS 应运而生，并统治了 Node.js 生态十余年。

### 3.1 核心语法与机制

- **导出：** `module.exports` 或 `exports`
- **导入：** `require()`

```javascript
// math.js
let count = 0
module.exports = {
  count,
  increment: () => count++,
}

// main.js
const math = require('./math.js')
```

### 3.2 底层运行原理（深度剖析）

- **同步运行时加载：** `require` 是一个同步函数。当代码执行到 `require` 时，Node.js 会暂停当前执行，去读取、编译并执行目标模块的代码，拿到返回的对象后再继续。
- **值拷贝（值的快照）：** 这是 CJS 最容易踩坑的地方。一旦模块被加载，它导出的就是一个普通的 JS 对象（深浅拷贝取决于导出的数据类型，通常是浅拷贝）。**模块内部后续的状态变化，不会反映在外部已导入的变量上。**
- **对象缓存：** 模块在第一次被 `require` 时会被执行并缓存。后续所有的 `require` 请求都会直接返回缓存的那个对象（即 `require.cache`），不会再次执行模块代码。

## 4. 浏览器端的妥协：AMD、CMD 与 UMD

在 ES Modules 出现前，浏览器端受限于网络延迟，无法使用 CommonJS 的“同步加载”（会导致页面假死），社区演化出了异步加载规范。

### 4.1 AMD (Asynchronous Module Definition) & RequireJS

- **核心思想：** **依赖前置，异步加载**。在定义模块时，必须一口气把所有依赖声明在最前面，RequireJS 会并行下载这些依赖，全部下载完成后再执行回调。

```javascript
define(['jquery', 'lodash'], function ($, _) {
  return {
    init: function () {
      $('body').show()
    },
  }
})
```

### 4.2 CMD (Common Module Definition) & Sea.js

- **核心思想：** **依赖就近，延迟执行**。由国内开发者玉伯提出，语法更贴近 CommonJS，只有当代码真正运行到 `require` 时，才会去执行该模块。

### 4.3 UMD (Universal Module Definition)

- **核心思想：** 终极缝合怪。它是一段环境嗅探样板代码，判断当前环境支持哪种规范，实现一套代码通吃 Node.js、AMD 和老式全局变量。曾经的开源库（如 React 15、Lodash）必备的输出格式。

## 5. 大一统时代：ES Modules (ESM)

在 ECMAScript 2015 (ES6) 标准中，JavaScript 终于迎来了官方的模块化方案，这是目前全平台（现代浏览器、Node.js 14+、所有前端构建工具）的绝对核心。

### 5.1 颠覆性的架构设计

> ESM 的设计哲学是：**静态编译，动态引用**。

- **静态编译分析：** `import` 和 `export` 必须处于模块的顶层词法作用域（不能放在 `if` 判断或函数里）。JS 引擎在**编译阶段**（代码真正运行之前）就能完全确定模块间的依赖拓扑图。
- **Live Bindings（动态只读引用）：** ESM 导出的**不是值的拷贝，而是指向被导出变量内存地址的隐式指针**。
- **只读特性：** 导入的变量在当前模块中是绝对只读的（常量），尝试重新赋值会导致运行时报错。

### 5.2 Live Bindings 底层验证

```javascript
// counter.mjs
export let count = 0
export function increment() {
  count++
}

// main.mjs
import { count, increment } from './counter.mjs'

console.log(count) // 输出: 0
increment()
console.log(count) // 输出: 1
// 🌟 核心差异：拿到了最新的值！如果是 CommonJS，这里依然是 0。

// count = 100; // ❌ TypeError: Assignment to constant variable.
```

## 6. 史诗级对决：CommonJS vs ES Modules

理解两者的差异，是排查现代工程编译 Bug、理解打包工具优化的关键：

| 维度                       | CommonJS (CJS)                            | ES Modules (ESM)                           |
| -------------------------- | ----------------------------------------- | ------------------------------------------ |
| **标准制定者**             | Node.js 社区规范                          | ECMAScript 官方语言标准                    |
| **加载与执行时机**         | **运行时**动态加载对象                    | **编译时**静态解析依赖图                   |
| **导出机制**               | 值的浅层拷贝 (快照)                       | 内存地址的动态引用 (Live Bindings)         |
| **`this` 指向**            | 当前模块的 `exports` 对象                 | 严格模式下永远是 `undefined`               |
| **动态导入支持**           | 天然支持（到处写 `require`）              | 需通过 `import()` 函数实现动态加载         |
| **循环依赖处理**           | 返回已执行的部分，易导致空对象或未定义    | 利用引用特性与变量提升安全处理（详见下文） |
| **对 Tree-Shaking 的支持** | 极难支持（因 `exports` 属性可被动态修改） | **原生完美支持**（得益于确定的静态AST树）  |

### 6.1 深度：循环依赖 (Circular Dependency) 应对机制

当模块 A 依赖 B，模块 B 又依赖 A 时：

- **CommonJS 的无奈：** CommonJS 是“**边加载、边执行、边缓存**”的动态同步模型，当 A 执行到一半去 `require(B)` 时，A 被挂起。B 执行时去 `require(A)`，此时 CJS 会从缓存中捞出 A **未执行完的半成品对象**（通常是一个空对象 `{}`）塞给 B。极易引发 `TypeError: x is not a function`。
- **ESM 的从容：** 因为 ESM 构建的是是“ **先解析、后链接内存、最后再执行**”的内存引用图谱，当产生循环引用时，如果在模块的顶层作用域（同步执行栈）直接去读取循环依赖引入的值，引擎在求值阶段（Evaluation）就会当场崩溃。“**规避死区**”的秘诀就在于不要去同步调用。把对外部依赖的读取，包裹在**函数**、**类方法**或**异步钩子**中，整个依赖网就可以完美建立并正常运行的，

## 7. 现代工程化视角的模块化

模块化规范直接催生了现代前端极速构建工具与极致代码优化的诞生。

### 7.1 Tree-Shaking（死代码消除）的底层逻辑

Tree-Shaking 这个词是由 Rollup 提出，并发扬光大的。
它的实现 100% 依赖于 ES Modules 的**静态特性**。由于构建工具（如 Webpack、Vite 底层的 esbuild）在不运行代码的情况下就能知道你引入了哪些模块的哪些方法，它就可以把那些导出了但从未被 `import` 过的代码安全地从最终产物中剔除（Drop），极大减小打包体积。

> **高级避坑：** 为了防止 Tree-Shaking 误删带有副作用的代码（比如一段单纯修改原型链或全局变量的 polyfill），工程化中引入了 `package.json` 中的 `"sideEffects": false` 字段，明确告诉打包工具：“我的包很纯净，放心删”。

### 7.2 Node.js 生态的阵痛与双模支持

当下的 Node.js 处于 CJS 到 ESM 的过渡期，最常见的地狱级报错莫过于：
`Error [ERR_REQUIRE_ESM]: require() of ES Module not supported.`

**互操作性铁律：**

- **ESM 可以无缝导入 CJS：** 在 `type: "module"` 下，可以使用 `import x from './cjs-module.cjs'`。Node.js 会自动将 `module.exports` 包装成默认导出。
- **CJS 绝对不能同步导入 ESM：** 因为 ESM 是异步编译解析的。如果你在 CommonJS 文件里必须用到一个纯 ESM 库，只能通过动态加载：`const pkg = await import('esm-package')`。

### 7.3 Vite 极速冷启动的秘密

Webpack 时代，为了处理 CJS 和 ESM 的混写，必须把所有文件合并打包（Bundle）成一个巨大的 JS。
Vite 的核心架构 **Bundleless**，则是直接把浏览器当做“**模块解析器**”。它利用现代浏览器对 `<script type="module">` 的原生支持，劫持浏览器的 `import` 请求，让本地服务器（esbuild）实现真正的**按需即时编译响应**，这也是为什么无论项目体积多大，Vite 都能瞬间启动的底层逻辑。
