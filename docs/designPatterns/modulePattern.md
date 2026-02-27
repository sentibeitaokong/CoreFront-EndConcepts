# 模块模式

## 1. 核心概念 

模块模式的核心意图是：**将逻辑相关的代码封装在一个独立单元中，隐藏内部状态和实现细节，仅向外部暴露必要的接口。**

| 维度 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **核心机制** | 利用**闭包**来创建私有作用域。 | **带门禁的办公室**。内部员工（私有变量）在里面工作，外界只能通过前台（返回的对象）进行交流。 |
| **主要优点** | 1. **封装性**：保护内部数据不被外部随意修改；<br>2. **命名空间管理**：减少全局变量的使用；<br>3. **可维护性**：模块间解耦，方便独立开发测试。 | |
| **主要缺点** | 1. 无法为私有成员编写单元测试；<br>2. 扩展私有成员比较困难；<br>3. 可能会造成内存占用（因为闭包）。 | |

## 2. 模式实现：从传统到现代

### 2.1 经典模块模式 (基于 IIFE 和闭包)
这是最经典的形式，即使在今天的一些老旧代码库或插件开发中依然可见。

```js
const CounterModule = (function() {
  // 1. 私有变量
  let count = 0;

  // 2. 私有方法
  function log(msg) {
    console.log(`[Counter]: ${msg}`);
  }

  // 3. 返回公共接口 (暴露给外界)
  return {
    increment: function() {
      count++;
      log(`增加后值为 ${count}`);
    },
    getCount: function() {
      return count;
    }
  };
})();

CounterModule.increment(); // [Counter]: 增加后值为 1
console.log(CounterModule.count); // undefined (无法访问私有变量)
```

### 2.2 现代模块化 (ES Modules)
在 ES6 之后，JavaScript 终于有了官方原生的模块系统。这已经成为了目前工程化开发的**行业标准**。

```js
// math.js
let privateValue = 10; // 默认就是模块私有的

export function add(a, b) {
  return a + b;
}

export const version = "1.0.0";

// main.js
import { add, version } from './math.js';
```

## 3. 模块模式的变体

### 3.1 揭示模块模式 (Revealing Module Pattern)
这种变体让公共接口的定义更加清晰，它在内部先定义好所有函数，最后在 return 对象中只写引用。

```js
const myModule = (function() {
  let name = 'Alice';
  function getName() { return name; }
  function setName(val) { name = val; }

  // 这里的映射关系一目了然
  return {
    readName: getName,
    updateName: setName
  };
})();
```

## 4. 常见问题 (FAQ)

### 4.1 模块模式和单例模式有什么区别？
*   **答**：模块模式通常**就是**以单例的形式存在的（尤其是通过 IIFE 实现的）。它们的目标是一致的：创建一个唯一的、封装好的全局访问点。但在现代 ES 模块中，你可以导出一个类，从而允许创建多个实例。

### 4.2 模块模式会导致内存泄漏吗？
*   **答：有可能。** 由于模块内部的私有变量是通过闭包被持有的，只要该模块对象没有被销毁，这些变量就会一直占用内存。
*   **注意**：在单页应用 (SPA) 中，如果你在模块中存储了大量数据且不再需要，建议手动置空（`null`）或提供清理方法。

### 4.3 如何解决“循环依赖”问题？
*   **答**：循环依赖（A 依赖 B，B 依赖 A）是模块化开发中的噩梦。
    *   **解决方案**：1. 重构代码，将共有逻辑提取到第三个模块 C 中；2. 使用异步加载（动态 import）；3. 在函数内部进行 `require`（仅限 CommonJS）。

### 4.4 ES Modules (ESM) 和 CommonJS (CJS) 有什么区别？
这是面试高频题：
*   **CommonJS**：Node.js 默认标准。**运行时加载**，同步导出，导出的是值的**拷贝**。
*   **ES Modules**：浏览器和现代前端标准。**编译时加载**（静态分析），导出的是值的**引用**（符号绑定）。

### 4.5 为什么现代开发不再手动写 IIFE 模块了？
*   **答**：因为有了 **Webpack、Vite** 等构建工具。你可以直接写最直观的 ES 模块语法，工具会自动帮你完成封装、混淆、压缩和跨浏览器兼容处理。

