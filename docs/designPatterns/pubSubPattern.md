# 发布-订阅模式 (Pub-Sub)

## 1. 核心概念

发布-订阅模式是一种**消息范式**。在这种模式中，发送者（发布者）不会直接将消息发送给特定的接收者（订阅者），而是将消息分为不同的类别（主题/事件），由一个中间件（调度中心）统一管理。

| 角色 | 描述 |
|---|---|
| **发布者 (Publisher)** | 负责产生事件并通知调度中心。它不关心谁在听，只管发。 |
| **订阅者 (Subscriber)** | 向调度中心注册自己感兴趣的事件。当事件发生时，它负责执行回调逻辑。 |
| **调度中心 (Event Channel/Broker)** | 整个模式的核心。它维护订阅关系队列，负责接收发布者的消息并分发给对应的订阅者。 |

## 2. 核心价值：为什么需要它？

如果没有发布-订阅模式，组件 A 想通知组件 B 必须持有 B 的引用，这会导致代码高度耦合。

| 优势 | 解释 |
|---|---|
| **深度解耦** | 发布者和订阅者互不认识，甚至不知道对方的存在。它们只与调度中心交互。 |
| **多对多通信** | 一个发布者可以对应多个订阅者，一个订阅者也可以订阅多个发布者的消息。 |
| **灵活的时间调度** | 订阅者可以在任何时候注册，发布者也可以在任何时候发布，支持异步协作。 |

## 3. 模式实现：手写一个 EventBus

这是一个最经典的发布-订阅模式实现（也叫 EventEmitter）：

```javascript
class EventEmitter {
  constructor() {
    // 调度中心：存储事件名与回调函数的映射
    this.handlers = {};
  }

  // 订阅：向调度中心添加监听器
  on(eventName, cb) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(cb);
  }

  // 发布：调度中心通知所有相关的订阅者
  emit(eventName, ...args) {
    if (this.handlers[eventName]) {
      this.handlers[eventName].forEach(cb => cb(...args));
    }
  }

  // 取消订阅：移除特定的监听器
  off(eventName, cb) {
    const callbacks = this.handlers[eventName];
    if (callbacks) {
      const index = callbacks.indexOf(cb);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  // 只订阅一次：触发后自动销毁
  once(eventName, cb) {
    const wrapper = (...args) => {
      cb(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
  }
}

// 使用示例
const bus = new EventEmitter();
const sayHello = (name) => console.log(`Hello, ${name}!`);
bus.on('greet', sayHello);
bus.emit('greet', 'Alice'); // 输出: Hello, Alice!
```

## 4. 模式辨析：发布-订阅 vs 观察者模式 ⚖️

这是面试中最常被问到的“坑”。虽然它们很像，但有一个本质的区别：**是否有中间人。**

| 特性 | 观察者模式 (Observer) | 发布-订阅模式 (Pub-Sub) |
|---|---|---|
| **耦合度** | **直接耦合**。目标对象（Subject）知道观察者（Observer）的存在。 | **完全解耦**。通过调度中心交互，双方互不相识。 |
| **中间件** | 无。 | **有调度中心 (Broker)**。 |
| **通信方式** | 通常是同步的。 | 通常支持异步。 |
| **适用场景** | 内部状态关联（如 Vue 的响应式）。 | 跨模块、跨组件的大型通信。 |

## 5. 常见问题 (FAQ) 与坑点

### 5.1 发布-订阅模式会导致内存泄漏吗？
*   **答：绝对会，如果不注意的话。** 当你在一个长生命周期的对象（如全局 EventBus）中订阅了事件，但在组件销毁时**忘记调用 `off`**，那么回调函数会一直保留在内存中，且无法被垃圾回收。
*   **建议**：在 React 的 `useEffect` 的清理函数中，或 Vue 的 `beforeUnmount` 生命周期中，**务必手动取消订阅**。

### 5.2 过度使用发布-订阅会有什么后果？
*   **答：导致“数据流向”难以追踪。**
    *   如果一个项目里到处都是 `emit` 和 `on`，你会发现很难找到一段逻辑是谁触发的，又影响了谁。
    *   这会增加维护成本，让代码变成“意大利面条”。
*   **建议**：只有在组件层级非常深、或跨越不相关模块时才使用。普通的父子通信应优先使用 `props` 或 `slots`。

### 5.3 如何防止事件名冲突？
*   **答**：在大型项目中，多个模块可能不小心使用了相同的字符串作为事件名（如 `update`）。
*   **方案**：
    1.  使用**常量文件**统一管理事件名。
    2.  使用 **命名空间** 风格，如 `user:login:success`。
    3.  使用 ES6 的 **Symbol** 作为事件键名，确保绝对唯一。

### 5.4 发布者发布时，如果没有订阅者会怎样？
*   **答**：在标准的实现中，消息会直接消失，就像在空屋子里喊话没人听一样。如果业务需要“补发”逻辑，你需要额外实现一个“离线消息队列”来缓存这些消息。


