# 职责链模式

## 1. 核心概念与价值

职责链模式的定义是：**使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间的耦合关系。将这些对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。**

[width(13,55,32)]

| 维度           | 描述                                                                                                                                       | 形象比喻                                                         |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **核心意图**   | 将请求的发送者和一组接收者（处理者）解耦。                                                                                                 | **公司报销审批**。组长批不了找经理，经理批不了找总监。           |
| **关键角色**   | `Handler`（抽象处理者，持有下一个节点的引用）、`ConcreteHandler`（具体处理者）、`Client`（组装链条并提交请求）。                           | **流水线**：每个工位只做自己那道工序，做不了就传给下一站。       |
| **主要优点**   | 1. 降低耦合度：发送者不需要知道链的具体结构；<br>2. 灵活性高：可以动态地改变链的顺序或增加节点；<br>3. 符合开闭原则。                      | **接力赛跑**。每个运动员只需关注接棒和传棒，不需要知道终点在哪。 |
| **主要缺点**   | 1. 不能保证请求一定被处理（如果链条走完都没人接）；<br>2. 链条过长时，性能会有一定损耗；<br>3. 调试困难。                                  |                                                                  |
| **适用场景**   | 1. 多个对象都可能处理同一请求，但由谁处理要到运行时才知道；<br>2. 需要动态增删、调整处理顺序；<br>3. 处理逻辑要能独立扩展。                | **客服工单流转**：一线 → 二线 → 专家。                           |
| **不适用场景** | 1. 请求几乎总由固定对象处理（用 `if-else` 或策略模式更直接）；<br>2. 链非常长且对性能敏感；<br>3. 必须保证请求一定被处理，又不设保底节点。 |                                                                  |

## 2. 模式结构：角色分配

在职责链模式中，通常包含以下角色：

[width(22,78)]

| 角色                              | 描述                                                                   |
| :-------------------------------- | :--------------------------------------------------------------------- |
| **Handler (处理者/抽象类)**       | 定义一个处理请求的接口，并持有下一个处理者的引用（`nextHandler`）。    |
| **Concrete Handler (具体处理者)** | 实现具体的处理逻辑。如果自己能处理则处理；否则将请求转发给下一个节点。 |
| **Client (客户端)**               | 组装链条并向链的第一个节点提交请求。                                   |

## 3. 代码实现示例：电商订单折扣逻辑

假设我们有一个购物系统，根据用户充值的金额给予不同的优惠券。

### 3.1 传统写法 (if-else 嵌套)

这种写法非常死板，一旦增加一种会员等级，就要改动整个大函数。

```js
const order = (type, amount) => {
  if (type === 'vip500') {
    /* 处理逻辑 */
  } else if (type === 'vip200') {
    /* 处理逻辑 */
  } else {
    /* 普通逻辑 */
  }
}
```

### 3.2 职责链模式写法 (优雅解耦)

```js
// 1. 定义具体的处理逻辑
const order500 = function (type, amount) {
  if (type === 1 && amount >= 500) {
    console.log('500元定金预购，得到100元优惠券')
  } else {
    return 'nextSuccessor' // 我处理不了，交给下一个
  }
}

const order200 = function (type, amount) {
  if (type === 2 && amount >= 200) {
    console.log('200元定金预购，得到50元优惠券')
  } else {
    return 'nextSuccessor'
  }
}

const orderNormal = function (type, amount) {
  console.log('普通购买，无优惠券')
}

// 2. 职责链构造器
class Chain {
  constructor(fn) {
    this.fn = fn
    this.successor = null
  }
  // 指定下一个节点
  setNextSuccessor(successor) {
    return (this.successor = successor)
  }
  // 执行
  passRequest(...args) {
    const ret = this.fn.apply(this, args)
    if (ret === 'nextSuccessor') {
      return (
        this.successor && this.successor.passRequest.apply(this.successor, args)
      )
    }
    return ret
  }
}

// 3. 组装链条
const chainOrder500 = new Chain(order500)
const chainOrder200 = new Chain(order200)
const chainOrderNormal = new Chain(orderNormal)

chainOrder500.setNextSuccessor(chainOrder200)
chainOrder200.setNextSuccessor(chainOrderNormal)

// 使用
chainOrder500.passRequest(1, 500) // 500元定金预购...
chainOrder500.passRequest(2, 200) // 200元定金预购...
chainOrder500.passRequest(3, 100) // 普通购买...
```

### 3.3 函数式写法：用数组组装链条

节点较多时，可以省掉 `Chain` 类，把处理函数放进数组，用一个递归函数依次驱动：

```js
const chain =
  (...handlers) =>
  (...args) => {
    const run = index => {
      if (index >= handlers.length) return undefined // 保底：无人处理
      const ret = handlers[index](...args)
      return ret === 'nextSuccessor' ? run(index + 1) : ret
    }
    return run(0)
  }

const order = chain(order500, order200, orderNormal)
order(1, 500) // 500元定金预购...
order(3, 100) // 普通购买...
```

## 4. 实战场景

[width(18,82)]

| 场景                    | 说明                                                                                                              |
| :---------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **中间件 (Middleware)** | **Express/Koa 的核心。** 请求经过一系列中间件，每个中间件可以选择处理响应、修改请求、或调用 `next()` 交给下一个。 |
| **表单校验**            | 将不同的校验规则（必填、长度、邮箱格式）连成链，任何一个失败就中断并报错。                                        |
| **DOM 事件冒泡**        | 本质上也是职责链。事件从内层元素向外层传递，直到被某个 `event.stopPropagation()` 截断。                           |
| **多级审批流**          | 根据报销金额，自动流转到对应的负责人。                                                                            |
| **Axios 拦截器**        | `interceptors.request/response.use()` 把请求、响应、错误处理串成链，每个拦截器决定放行还是中断（抛错）。          |
| **Redux 中间件**        | `applyMiddleware` 把多个中间件组合成一条 `dispatch` 链，`next(action)` 就是“**交给下一个**”。                     |
| **Koa 洋葱模型**        | `await next()` 让请求穿透到最内层再逐层返回，是职责链与递归回溯的典型结合。                                       |

在 JS 里落地职责链，几乎离不开下面这几个语言点与易错点：

- **`next()` 约定**：Express / Koa / Redux 都用显式调用 `next()` 表示“**放行给下一个**”，而不是靠返回值判断。
- **`async/await`**：异步链条必须 `await next()`，否则会出现“**穿透不过去**”或重复执行。
- **函数组合**：无状态的链条可以直接用 `reduce` / `compose` 把多个纯函数串起来，无需显式 `Chain` 类。
- **`event.stopPropagation()`**：浏览器事件冒泡天然是一条职责链，调用它相当于“**我在这一环截断**”。
- **易错点**：忘记处理“**请求掉落**”（链尾没人处理），以及 `next()` 被调用多次导致同一请求重复处理。

## 5. 常见问题 (FAQ)

### 5.1 职责链模式和装饰器模式有什么区别？

- **职责链模式**：重点在“**传递**”。目的是找到**一个**合适的人处理请求，处理完通常就结束了（或者按顺序走完）。
- **装饰器模式**：重点在“**增强**”。目的是在不改变接口的情况下，给对象叠加多个功能，所有装饰器通常都会执行。

### 5.2 如果链条走完了还没人处理怎么办？

这叫“**请求掉落**”。在设计职责链时，通常建议在链的**末尾**增加一个“**保底节点（Default Handler）**”，用于处理所有无法被处理的请求（如报错提示或默认行为），以保证系统的稳健性。

### 5.3 职责链太长会影响性能吗？

会有一点影响，因为每个节点都需要进行逻辑判断。但在绝大多数 Web 应用中，这种损耗微乎其微。如果性能极其敏感，可以考虑使用“**中介者模式**”将逻辑集中。

### 5.4 在 JavaScript 中如何实现更现代的职责链？

可以参考 **AOP (面向切面编程)** 的思想：节点就是普通函数，把「**处理不了就交给下一个**」这件事抽成一个组合子，就不必再显式造 `Chain` 类。

```js
const order500 = (type, amount) => {
  if (type === 1 && amount >= 500) {
    console.log('500元定金预购，得到100元优惠券')
    return
  }
  return 'nextSuccessor'
}

const order200 = (type, amount) => {
  if (type === 2 && amount >= 200) {
    console.log('200元定金预购，得到50元优惠券')
    return
  }
  return 'nextSuccessor'
}

const orderNormal = (type, amount) => {
  console.log('普通购买，无优惠券') // 链尾保底节点，不返回 nextSuccessor
}

// ① 挂在 Function.prototype 上：写法最省事，但改的是全局原型
Function.prototype.after = function (fn) {
  const self = this
  return function (...args) {
    const ret = self.apply(this, args)
    return ret === 'nextSuccessor' ? fn.apply(this, args) : ret
  }
}
const orderA = order500.after(order200).after(orderNormal)

// ② 推荐：写成独立的组合子，再用 reduce 串链，不污染任何内置对象
const chainAfter = (f, g) =>
  function (...args) {
    const ret = f(...args)
    return ret === 'nextSuccessor' ? g(...args) : ret
  }
const orderB = [order500, order200, orderNormal].reduce(chainAfter)

orderA(1, 500) // 500元定金预购，得到100元优惠券
orderB(2, 200) // 200元定金预购，得到50元优惠券
orderB(3, 100) // 普通购买，无优惠券
```
