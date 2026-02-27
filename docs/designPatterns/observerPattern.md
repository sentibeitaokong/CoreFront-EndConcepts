# 观察者模式

## 1. 核心概念

观察者模式就像是一个“报社”和“订报人”的关系。报社（被观察者）不需要知道订报人（观察者）在做什么，只需要在有新报纸（状态改变）时，按照地址簿（名单）给所有人送一份即可。

**核心角色分配**

| 角色 | 描述 | 主要职责 |
| :--- | :--- | :--- |
| **目标对象 (Subject)** | 也叫“被观察者” (Observable)。它是数据的持有者。 | 1. 维护一份观察者列表；<br>2. 提供添加 (`attach`) 和删除 (`detach`) 观察者的方法；<br>3. 状态改变时调用 `notify` 方法。 |
| **观察者 (Observer)** | 依赖于目标对象的个体。 | 1. 注册到目标对象中；<br>2. 提供一个 `update` 接口，供目标对象在更新时调用。 |

## 2. 代码实现示例

在 JavaScript 中，我们通常使用 ES6 的类来实现这种结构。

```js
// 1. 定义目标对象 (Subject)
class Subject {
  constructor() {
    this.observers = []; // 存储观察者的数组
  }

  // 添加观察者
  add(observer) {
    this.observers.push(observer);
  }

  // 移除观察者
  remove(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  // 通知所有观察者
  notify(message) {
    this.observers.forEach(observer => {
      observer.update(message);
    });
  }
}

// 2. 定义观察者 (Observer)
class Observer {
  constructor(name) {
    this.name = name;
  }

  // 目标对象更新时调用的接口
  update(message) {
    console.log(`${this.name} 收到通知: ${message}`);
  }
}

// 3. 实战使用
const sub = new Subject();
const user1 = new Observer("张三");
const user2 = new Observer("李四");

sub.add(user1);
sub.add(user2);

sub.notify("今天的报纸送达了！"); 
// 输出: 
// 张三 收到通知: 今天的报纸送达了！
// 李四 收到通知: 今天的报纸送达了！
```

## 3. 模式辨析：观察者模式 vs 发布-订阅模式 ⚖️

这是 JS 开发中最容易混淆的一点。虽然它们都用于处理异步和解耦，但有着本质的区别：

| 特性 | 观察者模式 (Observer) | 发布-订阅模式 (Pub-Sub) |
| :--- | :--- | :--- |
| **耦合度** | **较高**。Subject 知道 Observer 的存在，并直接调用其方法。 | **极低**。双方完全不认识，全靠中间的“调度中心”传话。 |
| **中间层** | **无**。 | **有 (Event Channel/Broker)**。 |
| **通信方向** | 单向。Subject 通知 Observer。 | 双向/多向。通过调度中心自由交换。 |
| **典型代表** | **Vue 2 的响应式原理**。 | **Node.js 的 EventEmitter**, **Vue 的 EventBus**。 |

## 4. 常见问题 (FAQ)

### 4.1 观察者模式会导致内存泄漏吗？
*   **答：非常容易导致。**
    *   如果一个长生命周期的对象（如全局的 Subject）持有了许多短生命周期对象（如组件内部的 Observer）的引用，而组件销毁时没有调用 `remove` 方法，那么这些组件对象将永远无法被垃圾回收。
    *   **建议**：在组件销毁钩子（如 `beforeUnmount` 或 `useEffect` 的清理函数）中，**务必手动取消订阅**。

### 4.2 观察者模式一定是异步的吗？
*   **答：不一定。** 在我的代码示例中，它是同步遍历 `forEach` 并调用的。但在实际应用（如 DOM 事件或 Vue 异步更新队列）中，为了性能考虑，通常会将其包装成异步任务（通过 `Promise` 或 `nextTick`）。

### 4.3 如何解决观察者过多的性能问题？
*   **答**：如果一个 Subject 对应成千上万个 Observer，一次 `notify` 可能会导致页面卡顿。
    *   **方案一**：采用“分批通知”或节流/防抖处理。
    *   **方案二**：优化 `update` 逻辑，确保每个观察者只做最小量的必要计算。

### 4.4 什么时候该用观察者模式，而不是简单的回调函数？
*   **答**：当你的逻辑从“一对一”变成“一对多”时。
    *   如果你只是想在请求完成后做一件事，用 `Callback` 或 `Promise` 即可。
    *   如果你想在数据变动时，同时更新侧边栏、通知导航栏、记录日志、并刷新图表，那么**观察者模式**是保持代码整洁的唯一选择。
