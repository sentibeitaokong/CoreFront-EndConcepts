# 职责链模式

## 1. 核心概念与价值

职责链模式的定义是：**使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间的耦合关系。将这些对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。**

| 维度 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **核心意图** | 将请求的发送者和一组接收者（处理者）解耦。 | **公司报销审批**。组长批不了找经理，经理批不了找总监。 |
| **主要优点** | 1. 降低耦合度：发送者不需要知道链的具体结构；<br>2. 灵活性高：可以动态地改变链的顺序或增加节点；<br>3. 符合开闭原则。 | **接力赛跑**。每个运动员只需关注接棒和传棒，不需要知道终点在哪。 |
| **主要缺点** | 1. 不能保证请求一定被处理（如果链条走完都没人接）；<br>2. 链条过长时，性能会有一定损耗；<br>3. 调试困难。 | |

## 2. 模式结构：角色分配 

在职责链模式中，通常包含以下角色：

| 角色 | 描述 |
| :--- | :--- |
| **Handler (处理者/抽象类)** | 定义一个处理请求的接口，并持有下一个处理者的引用（`nextHandler`）。 |
| **Concrete Handler (具体处理者)** | 实现具体的处理逻辑。如果自己能处理则处理；否则将请求转发给下一个节点。 |
| **Client (客户端)** | 组装链条并向链的第一个节点提交请求。 |

## 3. 代码实现示例：电商订单折扣逻辑

假设我们有一个购物系统，根据用户充值的金额给予不同的优惠券。

### 3.1 传统写法 (if-else 嵌套)
这种写法非常死板，一旦增加一种会员等级，就要改动整个大函数。
```js
const order = (type, amount) => {
  if (type === 'vip500') { /* 处理逻辑 */ }
  else if (type === 'vip200') { /* 处理逻辑 */ }
  else { /* 普通逻辑 */ }
};
```

### 3.2 职责链模式写法 (优雅解耦)

```js
// 1. 定义具体的处理逻辑
const order500 = function(type, amount) {
  if (type === 1 && amount >= 500) {
    console.log("500元定金预购，得到100元优惠券");
  } else {
    return 'nextSuccessor'; // 我处理不了，交给下一个
  }
};

const order200 = function(type, amount) {
  if (type === 2 && amount >= 200) {
    console.log("200元定金预购，得到50元优惠券");
  } else {
    return 'nextSuccessor';
  }
};

const orderNormal = function(type, amount) {
  console.log("普通购买，无优惠券");
};

// 2. 职责链构造器
class Chain {
  constructor(fn) {
    this.fn = fn;
    this.successor = null;
  }
  // 指定下一个节点
  setNextSuccessor(successor) {
    return this.successor = successor;
  }
  // 执行
  passRequest(...args) {
    const ret = this.fn.apply(this, args);
    if (ret === 'nextSuccessor') {
      return this.successor && this.successor.passRequest.apply(this.successor, args);
    }
    return ret;
  }
}

// 3. 组装链条
const chainOrder500 = new Chain(order500);
const chainOrder200 = new Chain(order200);
const chainOrderNormal = new Chain(orderNormal);

chainOrder500.setNextSuccessor(chainOrder200);
chainOrder200.setNextSuccessor(chainOrderNormal);

// 使用
chainOrder500.passRequest(1, 500); // 500元定金预购...
chainOrder500.passRequest(2, 200); // 200元定金预购...
chainOrder500.passRequest(3, 100); // 普通购买...
```

## 4. 实战场景

| 场景 | 说明 |
| :--- | :--- |
| **中间件 (Middleware)** | **Express/Koa 的核心。** 请求经过一系列中间件，每个中间件可以选择处理响应、修改请求、或调用 `next()` 交给下一个。 |
| **表单校验** | 将不同的校验规则（必填、长度、邮箱格式）连成链，任何一个失败就中断并报错。 |
| **DOM 事件冒泡** | 本质上也是职责链。事件从内层元素向外层传递，直到被某个 `event.stopPropagation()` 截断。 |
| **多级审批流** | 根据报销金额，自动流转到对应的负责人。 |

## 5. 常见问题 (FAQ)

### 5.1 职责链模式和装饰器模式有什么区别？
*   **答**：
    *   **职责链模式**：重点在“**传递**”。目的是找到**一个**合适的人处理请求，处理完通常就结束了（或者按顺序走完）。
    *   **装饰器模式**：重点在“**增强**”。目的是在不改变接口的情况下，给对象叠加多个功能，所有装饰器通常都会执行。

### 5.2 如果链条走完了还没人处理怎么办？
*   **答**：这叫“请求掉落”。在设计职责链时，通常建议在链的**末尾**增加一个“保底节点（Default Handler）”，用于处理所有无法被处理的请求（如报错提示或默认行为），以保证系统的稳健性。

### 5.3 职责链太长会影响性能吗？
*   **答**：会有一点影响，因为每个节点都需要进行逻辑判断。但在绝大多数 Web 应用中，这种损耗微乎其微。如果性能极其敏感，可以考虑使用“中介者模式”将逻辑集中。

### 5.4 在 JavaScript 中如何实现更现代的职责链？
*   **答**：可以参考 **AOP (面向切面编程)** 的思想。通过给函数原型添加 `after` 方法，可以非常优雅地组合函数，而不需要显式创建 `Chain` 类：
    ```js
    Function.prototype.after = function(fn) {
      const self = this;
      return function(...args) {
        const ret = self.apply(this, args);
        if (ret === 'nextSuccessor') return fn.apply(this, args);
        return ret;
      }
    };
    const order = order500.after(order200).after(orderNormal);
    order(1, 500);
    ```
