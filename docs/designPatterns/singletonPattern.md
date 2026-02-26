# 单例模式

## 1. 核心概念与价值

单例模式在 JavaScript 开发中无处不在。想象一下，如果你的应用中有多个“登录弹窗”实例或者多个“数据库连接池”，会导致资源浪费甚至逻辑混乱。

| 维度 | 描述 |
|---|---|
| **核心定义** | 限制一个类只能创建一个对象。如果实例已存在，则返回现有实例。 |
| **主要优点** | 1. 节约内存资源（避免重复创建）；<br>2. 避免对共享资源的多重占用；<br>3. 提供全局统一的访问入口。 |
| **主要缺点** | 1. 扩展性差（难以继承）；<br>2. 违背“单一职责原则”；<br>3. 在多线程环境（如 Web Workers）下需额外注意。 |

## 2. JavaScript 实现方案对比

在 JS 中实现单例有多种方式，从传统的闭包到现代的 ES6 类，各有千秋。

### 2.1 现代 ES6 类实现 (推荐)
利用类的 `static` 静态属性来存储实例。

```js
class Sun {
  constructor() {
    if (Sun.instance) {
      return Sun.instance; // 如果已存在，直接返回
    }
    this.name = "太阳";
    Sun.instance = this; // 存储实例
  }
}

const s1 = new Sun();
const s2 = new Sun();
console.log(s1 === s2); // true
```

### 2.2 闭包 + IIFE 实现 (经典)
利用立即执行函数（IIFE）创建私有作用域，外部无法直接修改实例。

```js
const Singleton = (function() {
  let instance;

  function createInstance() {
    return { name: "我是唯一的实例" };
  }

  return {
    getInstance: function() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const i1 = Singleton.getInstance();
const i2 = Singleton.getInstance();
console.log(i1 === i2); // true
```

### 2.3 ES Modules 实现 (最简单)
**这是目前工程化开发中最常用的“天然单例”。** ES 模块在第一次被 `import` 时执行并缓存，之后所有的 `import` 都会得到同一个对象。

```js
// store.js
class Store {
  constructor() { this.state = {}; }
}
export const store = new Store(); // 直接导出实例

// app.js
import { store } from './store.js';
```

## 3. 典型应用场景 

| 场景 | 说明 |
|---|---|
| **全局状态管理** | Redux 或 Vuex 的 Store 必须是单例，确保全局状态唯一。 |
| **遮罩层/弹窗** | 整个页面只需要一个 Loading 遮罩层，重复创建会闪烁或堆叠。 |
| **配置管理器** | 缓存从服务器读取的全局配置，避免每个组件都去读取一遍。 |
| **日志记录器** | 统一管理日志输出，保持日志序列的连续性。 |

## 4. 常见问题 (FAQ) 与坑点

### 4.1 单例模式和全局变量有什么区别？
*   **答**：这是最容易混淆的一点。全局变量（如 `window.myVar`）虽然也能全局访问，但它**不能保证唯一性**——别人随时可以覆盖它。而单例模式封装了创建逻辑，确保了**“想多建也建不了”**。单例提供了更好的封装和命名空间管理。

### 4.2 什么是“懒汉式”和“饿汉式”？
*   **饿汉式**：类加载时就立刻创建实例。优点是反应快，缺点是如果一直没用到，就浪费了内存。
*   **懒汉式**：只有在第一次调用 `getInstance()` 时才创建实例（按需创建）。JS 中大多数手动实现的单例都是懒汉式。

### 4.3 如何防止别人通过 `new` 关键词破坏单例？
*   **答**：在构造函数 `constructor` 中做判断（如上文 ES6 示例）。如果已经有实例，直接返回该实例；或者直接抛出错误强制要求使用 `getInstance()`。

### 4.4 单例模式会影响垃圾回收吗？
*   **答：是的，需要注意。** 因为单例通常被一个全局变量或静态属性持有，它在整个应用的生命周期内都不会被垃圾回收。如果你的单例中存储了巨大的数据结构且不再需要，可能会导致**内存泄漏**。


