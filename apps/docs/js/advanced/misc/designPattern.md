# JavaScript 设计模式

设计模式是对「反复出现的问题」的可复用解法的命名，描述的是**角色之间的关系**而非固定代码。GoF 的 23 个模式生于 Java/C++ 语境：Java 要靠抽象类 + 接口 + 继承树表达的结构，JS 一个对象字面量、一个函数、一次闭包就够。

读这一章带着两个问题：**这个模式解掉的是什么耦合？在 JS 里表达它的最小代价是多少？** 每个模式按「意图 / 结构 / 实现 / 适用场景 / 优缺点 / 与相近模式的区别」展开，第 11 节汇总共性问题，末尾 FAQ 讨论取舍。

更细的逐模式讲解见[《设计模式总结》](/designPatterns/summary/patternSummarize)。

[width(13,36,51)]

| 模式              | 一句话意图                     | JS 中的常见形态                            |
| ----------------- | ------------------------------ | ------------------------------------------ |
| 单例              | 保证全局只有一份实例           | 模块顶层导出的实例、闭包 + 惰性初始化      |
| 策略              | 让算法可以互相替换             | 对象映射表、`Map`、传入的比较器函数        |
| 工厂              | 把「创建」从「使用」里拆出来   | 返回对象的函数、注册表                     |
| 观察者 / 发布订阅 | 状态变化时通知依赖方           | `EventEmitter`、`addEventListener`、`mitt` |
| 代理              | 控制对目标对象的访问           | `Proxy`、getter、加载中的占位对象          |
| 装饰器            | 不改原对象地叠加功能           | 高阶函数、`@decorator`                     |
| 适配器            | 把不兼容的接口翻译成可用的接口 | `promisify`、字段映射                      |
| 职责链            | 让请求沿处理者链传递           | Koa/Express 中间件、多级审批               |
| 状态              | 把状态迁移变成对象自己的行为   | 状态表、有限状态机                         |
| 模板方法          | 父类定骨架，子类填步骤         | 抽象基类、传入钩子函数                     |

## 1. 单例模式

### 1.1 意图

保证一个类（或一份资源）在整个应用里**只有一个实例**，并提供全局访问点。重点不是「全局可见」而是**唯一性**：配置、连接池、日志器一旦有第二份，状态就不一致。

### 1.2 结构

- **Singleton（单例）**：收起创建入口，只暴露一个「取实例」的方法；第一次用到时才创建（惰性初始化）。
- **实例缓存的位置**决定单例的边界：挂构造函数、放闭包，或交给模块系统。

JS 没有 `private constructor`，「防止外部直接 `new`」只能靠约定、闭包或 `Proxy` 拦截——这是与 Java 单例最大的差别。

### 1.3 实现

最经典的写法——实例挂在构造函数上。

```js
function Singleton(name) {
  this.name = name
  this.instance = null
}
Singleton.prototype.getName = function () {
  console.log(this.name)
}
Singleton.getInstace = function (name) {
  if (!this.instance) {
    this.instance = new Singleton(name)
  }
  return this.instance
}
var a = Singleton.getInstace('sven1')
var b = Singleton.getInstace('sven2')
console.log(a === b)
```

三处要注意：

- `Singleton.getInstace` 是**静态方法**（拼写即 `getInstace`）：以它调用时 `this` 指向构造函数，判空用 `Singleton.instance`。
- 构造函数里的 `this.instance = null` 多余且误导：它给每个实例挂了个从没被读过的属性；承担「唯一」职责的是构造函数上的 `instance`。
- 输出 `true`；若改成对实例调用（`new Singleton(name).getInstace()`），`this` 变成实例，就会得到第二个实例。

写法一：class + 私有静态字段，实例缓存被真正封装：

```js
class ConfigStore {
  static #instance = null

  constructor() {
    if (ConfigStore.#instance) {
      return ConfigStore.#instance
    }
    this.cache = new Map()
    ConfigStore.#instance = this
  }

  static getInstance() {
    return ConfigStore.#instance ?? new ConfigStore()
  }
}

const config1 = ConfigStore.getInstance()
const config2 = ConfigStore.getInstance()
console.log(config1 === config2) // true
```

写法二：闭包 + IIFE，缓存与内部状态都在函数作用域里：

```js
const Counter = (function () {
  let instance = null

  function create() {
    let count = 0
    return {
      increment() {
        count += 1
        return count
      },
    }
  }

  return {
    getInstance() {
      if (instance === null) {
        instance = create()
      }
      return instance
    },
  }
})()

const counter1 = Counter.getInstance()
const counter2 = Counter.getInstance()
console.log(counter1 === counter2) // true
console.log(counter1.increment(), counter2.increment()) // 1 2
```

**私有状态靠的是闭包的作用域，而不是语言关键字**（`#` 私有字段 ES2022 才有）：`instance` 在外层作用域被两次 `getInstance()` 共享。

写法三：用 `Proxy` 拦截 `construct`，第二次 `new` 也拿不到新实例：

```js
function Database(name) {
  this.name = name
  this.connected = false
}

let cached = null

const DatabaseSingleton = new Proxy(Database, {
  construct(target, args, newTarget) {
    cached ??= Reflect.construct(target, args, newTarget)
    return cached
  },
})

const db1 = new DatabaseSingleton('primary')
const db2 = new DatabaseSingleton('replica')
console.log(db1 === db2) // true，第二次传入的参数被忽略
```

代价是参数被**静默忽略**——「用错」变成「不报错的用错」；更推荐第二次创建时直接抛错。

写法四：模块系统天然就是单例（见 11.3）。

```js
// config.js
class Config {
  constructor() {
    this.values = new Map()
  }
}

export default new Config()
```

```js
// main.js
import config from './config.js'
import sameConfig from './config.js'

console.log(config === sameConfig) // true
```

### 1.4 适用场景

- 全局配置、日志器、上报队列；有连接/句柄的资源：连接池、WebSocket、`IntersectionObserver`。
- 初始化昂贵的工具：正则、Schema；全局 UI 容器：Toast 挂载点、Modal 根节点。

判断标准不是「到处都要用」，而是**「有两份会出错」**。

### 1.5 优缺点

优点：

- **唯一性有保证**，共享资源的生命周期可控。
- **惰性初始化**，创建推迟到第一次使用，加快启动。
- 访问点统一，便于内部换成别的实现（配合依赖注入，见 12.1）。

缺点：

- **本质是全局状态**：谁都能改，影响范围不可见。
- **隐式依赖**：签名上看不出依赖单例，测试时也无法替换。
- **生命周期与模块绑定**，SSR、微前端、多副本下「唯一」可能不成立。

### 1.6 与相近模式的区别

- **vs 全局变量**：全局变量「谁都能写」，单例「谁都能读，但时机与份数由我控制」。
- **vs 静态类**：静态类只有方法没有实例状态；单例可带状态，也能被当普通对象传参。
- **vs 工厂模式**：工厂决定「创建什么」，单例决定「创建几次」；工厂内部缓存产物就能产出单例，反之不成立。
- **vs 模块模式**：ESM「只求值一次 + 缓存导出」本身就是单例机制，很多单例在 ESM 下退化成一行 `export default new X()`。

## 2. 策略模式

### 2.1 意图

定义一系列算法，各自封装并可以互相替换，让算法的变化独立于使用它的客户端。

说人话：把 `switch (level)` 的分支搬进一张表，用「查表 + 调用」代替「分支判断」。

### 2.2 结构

- **Context（上下文）**：持有策略引用并在合适时机调用，只认识「策略接口」。
- **Strategy（策略接口）**：约定的调用签名；JS 里就是一个函数签名或对象上的同名方法。
- **ConcreteStrategy（具体策略）**：一个个具体的算法。
- **选择权在客户端**：由调用方在运行期决定用哪一个，这是它与状态模式的根本区别（见 9.5）。

### 2.3 实现

最简形式是**对象映射表**——JS 不需要 Strategy 接口，键到函数就完成了「可替换」：

```js
var strategies = {
  S: function (salary) {
    return salary * 4
  },
  A: function (salary) {
    return salary * 3
  },
  B: function (salary) {
    return salary * 2
  },
}
var calculateBonus = function (level, salary) {
  return strategies[level](salary)
}
console.log(calculateBonus('S', 2000))
console.log(calculateBonus('A', 2000))
```

新增等级只需在 `strategies` 里加一个键，Context 一行都不用改——开闭原则。

用 `Map` 改写，补上「未知等级」的防御：

```js
const bonusStrategies = new Map([
  ['S', salary => salary * 4],
  ['A', salary => salary * 3],
  ['B', salary => salary * 2],
])

function calcBonus(level, salary) {
  const strategy = bonusStrategies.get(level)
  if (!strategy) {
    throw new RangeError(`未知的绩效等级：${level}`)
  }
  return strategy(salary)
}

console.log(calcBonus('S', 2000)) // 8000
```

`Map` 优于对象字面量：键可为任意类型、不受原型链干扰、有真实的 `size`。

策略**有状态**或**需要多个方法**时才值得升级成类：

```js
class SmsNotifier {
  constructor(account) {
    this.account = account
  }

  send(message) {
    return `[${this.account}] 短信：${message}`
  }
}

class EmailNotifier {
  constructor(address) {
    this.address = address
  }

  send(message) {
    return `[${this.address}] 邮件：${message}`
  }
}

class Notifier {
  constructor(strategy) {
    this.strategy = strategy
  }

  setStrategy(strategy) {
    this.strategy = strategy
  }

  notify(message) {
    return this.strategy.send(message)
  }
}

const notifier = new Notifier(new SmsNotifier('1069'))
console.log(notifier.notify('构建成功'))
notifier.setStrategy(new EmailNotifier('dev@example.com'))
console.log(notifier.notify('构建成功'))
```

规则校验是策略在前端最实用的形态：每条规则一个策略，签名统一为「参数 → 错误信息」：

```js
const rules = {
  required: (value, message) => (value === '' ? message : ''),
  minLength: (value, length, message) => (value.length < length ? message : ''),
  mobile: (value, message) => (/^1[3-9]\d{9}$/.test(value) ? '' : message),
}

function validate(value, validators) {
  for (const [name, ...args] of validators) {
    const error = rules[name](value, ...args)
    if (error) {
      return error
    }
  }
  return ''
}

console.log(
  validate('abc', [
    ['required', '不能为空'],
    ['minLength', 6, '至少 6 位'],
  ]),
)
```

**你每天都在用策略模式**：`Array.prototype.sort` 的比较函数、`Intl.NumberFormat` 的 formatter 都是把算法当参数传：

```js
const products = [
  { name: '键盘', price: 399 },
  { name: '显示器', price: 1299 },
  { name: '鼠标', price: 99 },
]

const byPrice = (a, b) => a.price - b.price
const byName = (a, b) => a.name.localeCompare(b.name)

const sortBy = (strategy, list) => [...list].sort(strategy)

console.log(sortBy(byPrice, products).map(item => item.name))
console.log(sortBy(byName, products).map(item => item.name))
```

### 2.4 适用场景

- 同一件事有多种算法，且**会在运行期切换**（排序、计价、压缩）；分支多，且每个分支体是一段完整逻辑。
- 算法可复用、可单独测试；需要把算法开放给调用方：比较器、序列化器、插件。

### 2.5 优缺点

优点：消除巨型分支；算法可独立替换与测试；新增算法不改 Context（开闭原则）。

缺点：多一层间接；策略多了会变成「另一张需要索引的表」；客户端必须了解各策略才能选对；策略与 Context 共享的数据只能靠参数传递。

### 2.6 与相近模式的区别

- **vs `if-else` / `switch`**：分支少而稳定时，分支语句更好读，别急着抽象（见 12.2）。
- **vs 状态模式**：状态自己决定切到哪，客户端只负责触发；策略之间互不知晓，选哪个由客户端定。**谁决定切换，就是哪个模式。**
- **vs 模板方法**：模板方法用继承固定算法骨架、把可变步骤留给子类（编译期）；策略用组合换掉整个算法（运行期）。**优先组合。**
- **vs 命令模式**：命令把「操作」封装成对象（可排队、可撤销、可记录），关心何时、以何种顺序执行；策略关心用哪种算法。

## 3. 工厂模式

### 3.1 意图

把对象的**创建**与**使用**分开：调用方只说「我要什么」，不关心「怎么造」。

按抽象程度分三档：

- **简单工厂**：一个函数按参数返回不同对象。不是 GoF 正式模式，但前端用得最多。
- **工厂方法**：定义创建对象的接口，让子类决定实例化哪一个类。
- **抽象工厂**：创建**一组相关产品**（产品族），并保证它们风格一致。

### 3.2 结构

- **Product（产品）**：被创建出来的对象；**Creator / Factory**：创建逻辑的持有者——简单工厂里是函数，工厂方法里是可继承的类，抽象工厂里是一组工厂方法。

### 3.3 实现

**简单工厂**——把 `switch` 换成映射表，新增角色只加一行：

```js
const creators = {
  admin: name => ({ name, permissions: ['read', 'write', 'delete'] }),
  editor: name => ({ name, permissions: ['read', 'write'] }),
  guest: name => ({ name, permissions: ['read'] }),
}

function createUser(role, name) {
  const create = creators[role]
  if (!create) {
    throw new RangeError(`未知角色：${role}`)
  }
  return create(name)
}

console.log(createUser('editor', 'sven'))
```

**注册表式工厂**——把「注册」开放出去，连工厂文件都不用改，插件系统常用：

```js
const registry = new Map()

function register(type, creator) {
  registry.set(type, creator)
}

function create(type, ...args) {
  const creator = registry.get(type)
  if (!creator) {
    throw new RangeError(`未注册的类型：${type}`)
  }
  return creator(...args)
}

register('json', text => JSON.parse(text))
register('csv', text => text.split('\n').map(line => line.split(',')))

console.log(create('csv', 'a,b\nc,d'))
```

**工厂方法**——把「造什么」下沉到子类，父类只负责流程：

```js
class Dialog {
  createButton() {
    throw new Error('子类必须实现 createButton')
  }

  render() {
    const button = this.createButton()
    return `渲染对话框，包含按钮：${button.label}`
  }
}

class WebDialog extends Dialog {
  createButton() {
    return { label: 'Web 按钮' }
  }
}

class MobileDialog extends Dialog {
  createButton() {
    return { label: '移动端按钮' }
  }
}

console.log(new WebDialog().render())
console.log(new MobileDialog().render())
```

**抽象工厂**——一次创建「一整套」风格一致的产品：

```js
class LightThemeFactory {
  createButton() {
    return { type: 'button', theme: 'light' }
  }

  createInput() {
    return { type: 'input', theme: 'light' }
  }
}

class DarkThemeFactory {
  createButton() {
    return { type: 'button', theme: 'dark' }
  }

  createInput() {
    return { type: 'input', theme: 'dark' }
  }
}

function renderUI(factory) {
  return [factory.createButton(), factory.createInput()]
}

console.log(renderUI(new DarkThemeFactory()))
```

抽象工厂约束的是「产品族一致性」：按钮和输入框不会一个浅色一个深色——简单工厂与工厂方法都不管。

### 3.4 适用场景

- 创建逻辑复杂：读配置、校验、补默认值、按环境切换；同一入口在浏览器/Node、测试/生产下造出不同实现。
- 需要屏蔽具体类：调用方不该 `import` 二十个具体类；需要整族产品配套的约束。

### 3.5 优缺点

优点：创建与使用解耦；生产逻辑收口（缓存、埋点、校验）；对调用方屏蔽实现细节；注册表形式符合开闭原则。

缺点：多一层间接，简单场景里是负担；工厂方法依赖继承，「每加一个产品就加一个类」；抽象工厂扩展产品**种类**时必须改动所有工厂。

### 3.6 与相近模式的区别

- **vs 直接 `new`**：只有一个实现、创建过程不会变时，`new` 是更好的选择。
- **vs 构造函数**：工厂返回的不一定是 `new` 出来的，也可以是对象字面量、缓存命中的旧对象、单例或异步结果。
- **vs 单例**：见 1.6。
- **vs 工厂方法与抽象工厂**：工厂方法解决「把某一个产品的创建延迟到子类」，抽象工厂解决「一族产品的创建」，后者通常由多个工厂方法拼成。

## 4. 观察者模式与发布订阅模式

### 4.1 意图

建立对象之间的**一对多依赖**：一个对象状态改变时，所有依赖它的对象都得到通知并自动更新；目的是**让发布者不需要知道谁在听**。

### 4.2 结构

- **观察者模式（Observer）**：Subject 直接维护观察者列表，双方互相知道对方（`subject.attach(observer)`）。
- **发布订阅模式（Publish/Subscribe）**：双方之间插入一个**调度中心**（事件总线）；发布者把事件丢给中心，订阅者向中心登记，互不认识。

### 4.3 实现

发布订阅的核心是事件总线，三处关键细节：`Set` 去重、`on` 返回取消函数、`emit` 遍历前复制一份。

```js
class EventBus {
  #listeners = new Map()

  on(type, handler) {
    if (!this.#listeners.has(type)) {
      this.#listeners.set(type, new Set())
    }
    this.#listeners.get(type).add(handler)
    return () => this.off(type, handler)
  }

  off(type, handler) {
    this.#listeners.get(type)?.delete(handler)
  }

  once(type, handler) {
    const wrapper = (...args) => {
      this.off(type, wrapper)
      handler(...args)
    }
    this.on(type, wrapper)
  }

  emit(type, ...args) {
    for (const handler of [...(this.#listeners.get(type) ?? [])]) {
      handler(...args)
    }
  }
}

const bus = new EventBus()
const unsubscribe = bus.on('build:done', payload =>
  console.log('收到', payload),
)
bus.once('build:done', () => console.log('只响一次'))

bus.emit('build:done', { ok: true })
unsubscribe()
bus.emit('build:done', { ok: true }) // once 的 handler 已自动摘除，无输出
```

三处细节：

- **用 `Set` 而不是数组**：同一函数注册两次只通知一次，`on` 是幂等的；代价是不能注册多次。
- **`on` 返回取消函数**：把「谁来清理」交给订阅方，是防内存泄漏最实用的约定（见 12.8）。
- **`emit` 遍历前复制一份**：handler 内部可能再 `on` / `off`，直接遍历原集合会漏触发甚至死循环。

观察者模式的直接实现——Subject 直接持有观察者引用。

```js
class Subject {
  constructor() {
    this.observers = []
  }

  attach(observer) {
    this.observers.push(observer)
  }

  detach(observer) {
    this.observers = this.observers.filter(item => item !== observer)
  }

  notify(data) {
    this.observers.forEach(observer => observer.update(data))
  }
}

class Logger {
  update(data) {
    console.log('记录日志：', JSON.stringify(data))
  }
}

class CacheCleaner {
  update(data) {
    console.log('收到变更，清理缓存：', data.key)
  }
}

const subject = new Subject()
subject.attach(new Logger())
subject.attach(new CacheCleaner())
subject.notify({ key: 'user:1', value: 'sven' })
```

这里的「接口」是**鸭子类型**的：Subject 只要求观察者有 `update` 方法（见 11.2）。

### 4.4 两者的区别

[width(13,42,45)]

| 维度     | 观察者模式                             | 发布订阅模式                                    |
| -------- | -------------------------------------- | ----------------------------------------------- |
| 耦合关系 | Subject 认识 Observer，持有其引用      | 双方只认识调度中心，互不认识                    |
| 通信方式 | 通常是同步的直接调用                   | 经中心转发，可以异步（微任务、下一帧、跨进程）  |
| 依赖方向 | 双向（Subject ↔ Observer）             | 单向（发布者 → 中心 ← 订阅者）                  |
| 抽象层次 | 对象之间的关系                         | 事件名（topic）驱动的通信机制                   |
| 典型代表 | `addEventListener`、`MutationObserver` | `EventEmitter`、`mitt`、`postMessage`、消息队列 |
| 主要风险 | 观察者持有 Subject 引用，容易一起泄漏  | 事件名成为隐式契约，链路不透明，难追踪          |

**一句话**：观察者是「对象之间的通知关系」，发布订阅是「架构层面的通信方式」——中间加一层中介，连「谁知道谁」也一起解耦。

### 4.5 适用场景与注意事项

- DOM 事件、组件通信、数据流订阅（`store.subscribe`）、埋点上报；`Promise` 就是一种「一次性的观察者」。
- 注意事项：
  - **不要承诺通知顺序**，也不要让一个 handler 依赖另一个的结果。
- **异常要隔离**：一个 handler 抛错不该影响其他 handler；重要的总线要给每个 handler 包 `try...catch`。
- **防泄漏**：长生命周期的总线持有短生命周期对象的回调，是对象图无法回收的经典成因，参见[《垃圾回收与内存泄漏》](/js/advanced/misc/gcMemoryLeak)。

### 4.6 优缺点

优点：发布者与订阅者解耦；一对多广播；订阅关系可动态增删。

缺点：事件流不透明，调试困难；事件名是隐式契约，改名容易漏改；容易形成「事件黑洞」式的隐式调用链；忘记取消订阅会泄漏。

### 4.7 与相近模式的区别

- **vs 中介者模式**：中介者封装的是**对象之间复杂的相互作用**（把多对多变成一对多），发布订阅是它的实现手段之一。
- **vs 职责链**：职责链沿链传递**直到被处理**，有明确的「下一个」；发布订阅广播给所有订阅者，不终止。
- **vs 响应式（`Proxy`）**：`Proxy` + 依赖收集是「自动化观察者」：读取时收集依赖、写入时触发更新，不再需要手动 `notify`（见 5.4）。

## 5. 代理模式

### 5.1 意图

为其他对象提供一个**代理**以控制对它的访问。关键在于**接口不变**：代理和真实对象对外长得一样，调用方感知不到多了一层。

### 5.2 结构

- **Subject（接口）**：代理与真实对象共同实现的接口，JS 里就是同名方法。
- **RealSubject**：真正干活的对象；**Proxy**：持有它的引用，在转发前后插入控制逻辑。

按用途分四类：**虚拟代理**（延迟创建/加载）、**缓存代理**（复用计算结果）、**保护代理**（权限校验）、**远程代理**（跨进程/网络调用）。

### 5.3 实现

**虚拟代理**：图片加载前先显示占位图。

```js
const myImage = (function () {
  const img = document.createElement('img')
  document.body.appendChild(img)

  return {
    setSrc(src) {
      img.src = src
    },
  }
})()

const proxyImage = (function () {
  const img = new Image()
  img.onload = function () {
    myImage.setSrc(this.src)
  }

  return {
    setSrc(src) {
      myImage.setSrc('loading.gif') // 先占位
      img.src = src // 真正去加载
    },
  }
})()

proxyImage.setSrc('photo.jpg')
```

两者接口完全一样（都是 `setSrc`），「先占位、加载好再换」被关在代理里。

**缓存代理**：缓存耗时的计算结果，两次 `fastAdd(1, 2)` 只真正计算一次：

```js
function memoize(fn) {
  const cache = new Map()
  return function memoized(...args) {
    const key = JSON.stringify(args)
    if (!cache.has(key)) {
      cache.set(key, fn.apply(this, args))
    }
    return cache.get(key)
  }
}

let calls = 0
const slowAdd = (a, b) => {
  calls += 1
  return a + b
}
const fastAdd = memoize(slowAdd)

console.log(fastAdd(1, 2), fastAdd(1, 2), calls) // 3 3 1
```

以 `JSON.stringify(args)` 为 key 有局限：顺序敏感，`undefined`、`Symbol`、循环引用都会失真；生产代码更常用受控策略。

**保护代理**：在转发之前做权限判断。

```js
const currentUser = { name: 'sven', isAdmin: false }
const account = { owner: 'sven', balance: 100 }

const safeAccount = new Proxy(account, {
  get(target, key, receiver) {
    if (key === 'balance' && !currentUser.isAdmin) {
      return '无权查看'
    }
    return Reflect.get(target, key, receiver)
  },
})

console.log(safeAccount.balance) // 无权查看
console.log(safeAccount.owner) // sven
```

### 5.4 `Proxy` / `Reflect` 带来的现代写法

`Proxy` 把「代理」变成**语言级拦截**：`get`、`set`、`has`、`apply`、`construct` 等陷阱覆盖对象的基本操作，不必逐个抄转发代码，Vue 3 因此弃用 `Object.defineProperty`。

`Reflect` 把对象内部方法（`[[Get]]`、`[[Set]]` 等）变成可调用函数，`Reflect.get(target, key, receiver)` 的 `receiver` 参数决定 getter 里的 `this`。**陷阱里的「默认行为」用 `Reflect` 同名方法**，不要手写 `target[key]`。

```js
const target = {
  _value: 0,
  get value() {
    return this._value
  },
}

const tracked = new Proxy(target, {
  get(obj, key, receiver) {
    console.log(`读取 ${String(key)}`)
    return Reflect.get(obj, key, receiver)
  },
  set(obj, key, value, receiver) {
    console.log(`写入 ${String(key)} = ${value}`)
    return Reflect.set(obj, key, value, receiver)
  },
})

console.log(tracked.value)
// 读取 value
// 读取 _value
// 0

tracked._value = 1 // 写入 _value = 1
```

`读取 value` 触发两次拦截，是因为 `receiver` 让 getter 里的 `this` 指向代理本身，`this._value` 又走了一次 `get` 陷阱——这正是 `Reflect` 传 `receiver` 的意义。

### 5.5 适用场景

- 虚拟代理：图片懒加载、大列表分片、按需初始化；缓存代理：记忆化、请求去重、`WeakMap` 缓存。
- 保护代理：字段级权限、只读视图、参数校验；拦截与观测：Vue 3 响应式、ORM 惰性加载、Mock、不可变数据写保护。

### 5.6 优缺点

优点：调用方无感知（接口不变）；访问控制、缓存、懒加载等横切逻辑与业务分离；`Proxy` 能拦截语言级操作，不需要目标对象配合。

缺点：多一层调用，`Proxy` 陷阱比直接属性访问慢，热路径要谨慎；调试时「对象看起来是另一个对象」；陷阱写漏会让 `this` 错位，拦截不可配置属性可能抛 `TypeError`。

### 5.7 与相近模式的区别

- **vs 装饰器模式**：都是「包一层且接口不变」，区别在目的——代理控制**访问**，装饰器**叠加功能**。实际项目中常混用，按意图命名即可。
- **vs 适配器模式**：适配器**改变**接口（把不兼容的签名翻译成兼容的），代理保持接口不变。
- **vs 外观模式**：外观把**多个**接口简化成**一个**；代理是**一对一**且接口相同。
- **vs 享元模式**：享元靠共享减少对象数量，代理靠转发控制访问；缓存代理内部常用到享元的思想。

## 6. 装饰器模式

### 6.1 意图

动态地给一个对象**添加职责**，不改变它本身的实现，也不靠继承穷举组合。装饰器可以一层层叠加，每层只关心一件事。

### 6.2 结构

- **Component**：被装饰的对象（JS 里常常是一个函数）；**Decorator**：持有它的引用并保持相同签名，在转发前后插入行为。
- **叠加顺序就是执行顺序**：`withTiming(withRetry(fn))` 与 `withRetry(withTiming(fn))` 语义完全不同。

### 6.3 实现

JS 里装饰器最自然的形态是**高阶函数**——接收函数，返回函数：

```js
function withTiming(fn) {
  return function timed(...args) {
    const start = performance.now()
    try {
      return fn.apply(this, args)
    } finally {
      const cost = performance.now() - start
      console.log(`${fn.name || 'anonymous'} 耗时 ${cost.toFixed(2)} ms`)
    }
  }
}

function withRetry(fn, times = 3) {
  return async function retried(...args) {
    let lastError
    for (let i = 0; i < times; i += 1) {
      try {
        return await fn.apply(this, args)
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  }
}

const request = withTiming(
  withRetry(async url => {
    const response = await fetch(url)
    return response.json()
  }),
)

request('/api/user').catch(error => console.error(error.message))
```

`withTiming(withRetry(fn))` 是「先重试，整体计时」，换个顺序则变成「每次尝试都计时」。**包装顺序即语义**，这是它与「直接改函数内部」最大的区别。

把「套装饰器」收成一个函数后，顺序更清楚：列表里**靠前的装饰器在最外层**。

```js
async function fetchUser(id) {
  const response = await fetch(`/api/user/${id}`)
  return response.json()
}

const decorate = (fn, ...decorators) =>
  decorators.reduceRight((wrapped, decorator) => decorator(wrapped), fn)

const loadUser = decorate(fetchUser, withRetry, withTiming)
```

TC39 的装饰器语法把「包一层」变成类的语法糖，适合给类、方法、访问器、字段声明式地附加能力；细节见[《装饰器》](/js/advanced/misc/decorator)。

```js
function logged(value, context) {
  if (context.kind !== 'method') {
    return value
  }
  return function (...args) {
    console.log(`调用 ${context.name}(${args.join(', ')})`)
    return value.apply(this, args)
  }
}

class Calculator {
  @logged
  add(a, b) {
    return a + b
  }
}

console.log(new Calculator().add(1, 2))
```

### 6.4 适用场景

- 横切关注点：日志、计时、重试、缓存、鉴权、埋点；组合数量会爆炸（日志 × 重试 × 缓存 × 熔断）时。
- 需要在运行期**动态组合**能力，而非编译期用继承固定；类的方法、字段要声明式附加元信息（`@observable`、ORM 的 `@Column`）。

### 6.5 优缺点

优点：比继承灵活（运行期增删、任意组合、没有类爆炸）；每个装饰器职责单一、可独立测试；不改动原对象，符合开闭原则。

缺点：层数多了调用栈变长、错误堆栈里全是包装函数；装饰器之间有顺序依赖；`name`、`length` 等元信息会丢失；与 `Proxy` 混用时 `this` 容易错位。

### 6.6 与相近模式的区别

- **vs 继承**：继承是编译期静态的「是什么」（is-a），只有一条继承链；装饰器运行期动态组合，可任意叠加。**能用组合就别用继承。**
- **vs 代理**：见 5.7。
- **vs 适配器**：装饰器前后接口不变，适配器改变接口。
- **vs 职责链**：装饰器每一层都会**执行**；职责链的请求通常在某一环被处理后就**停止**。

## 7. 适配器模式

### 7.1 意图

把一个类的接口**转换成客户端期望的接口**，让接口不兼容的两方能协作。它是**事后补救**的模式：两边接口都已定死，只解决「今天就得用」。

### 7.2 结构

- **Target**：客户端期望的接口；**Adaptee**：已有但接口不兼容的实现。
- **Adapter**：把 Target 的调用翻译成 Adaptee 听得懂的调用。

### 7.3 实现

**回调 → Promise**：把 Node 风格的 `(error, result)` 适配成 `Promise`：

```js
function legacyGetUser(id, callback) {
  setTimeout(() => callback(null, { id, name: 'sven' }), 0)
}

function getUser(id) {
  return new Promise((resolve, reject) => {
    legacyGetUser(id, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

getUser(1).then(user => console.log(user.name)) // sven
```

通用版就是 `promisify`：

```js
const promisify =
  fn =>
  (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (error, result) => (error ? reject(error) : resolve(result)))
    })

const readFile = promisify((path, callback) => {
  callback(null, `内容：${path}`)
})

readFile('a.txt').then(console.log) // 内容：a.txt
```

**数据格式适配**：后端字段名与组件约定不一致时，在**边界**处翻译一次：

```js
function adaptUser(raw) {
  return {
    id: raw.user_id,
    name: raw.user_name,
    avatar: raw.head_url,
    isVip: raw.vip_level > 0,
  }
}

const user = adaptUser({
  user_id: 1,
  user_name: 'sven',
  head_url: 'a.png',
  vip_level: 2,
})
console.log(user)
```

**参数适配**：给老接口补默认值、兼容两种调用形式，要点是「宽进严出」。

```js
function request(options) {
  const config = typeof options === 'string' ? { url: options } : options
  const defaults = { method: 'GET', timeout: 5000, headers: {} }
  return { ...defaults, ...config }
}

console.log(request('/api/user'))
console.log(request({ url: '/api/user', method: 'POST' }))
```

### 7.4 适用场景

- 接入第三方库、SDK，适配层收口，换库只改一处；老代码迁移：新模块按新接口写，适配器兼容旧调用方。
- 抹平浏览器 API 差异：`requestIdleCallback` 降级、`AbortController` 兼容层；前后端字段名、枚举值不一致，在 DTO 边界映射。

### 7.5 优缺点

优点：既有代码复用而不必重写；「不兼容」隔离在一个薄层里；替换底层实现只改适配器。

缺点：**它是补丁，不是设计**——适配器多了本身就说明接口有问题，属于技术债；多一层转换有性能与认知开销；适配逻辑带上业务含义后最难维护。

### 7.6 与相近模式的区别

- **vs 代理**：代理不改变接口，适配器必须改变接口。
- **vs 装饰器**：装饰器接口不变、目的是叠加功能；适配器接口改变、目的是兼容。
- **vs 外观模式**：外观是「简化」（多个复杂接口包成一个易用接口），适配器是「转换」（让两个已定死的接口对接）。

## 8. 职责链模式

### 8.1 意图

把请求沿处理者链传递，**直到有一个处理者处理它为止**。发送者不必知道谁处理、链上有谁，从而解耦「发请求」与「处理请求」。

### 8.2 结构

- **Handler**：处理请求的接口（约定同名方法，或就是一个函数）；**Successor**：指向下一个处理者的引用，不处理就转发。
- **链的组织方式**：可以用「对象 + next 指针」的经典链表，也可以直接用**数组 + 递归**（更函数式、更好测试）。

### 8.3 实现

经典链表形式：每个处理者自己决定「处理还是转发」，金额超出自己的权限就丢给下一个。

```js
class Approver {
  constructor(name, limit) {
    this.name = name
    this.limit = limit
    this.next = null
  }

  setNext(approver) {
    this.next = approver
    return approver
  }

  handle(amount) {
    if (amount <= this.limit) {
      return `${this.name} 批准了 ${amount} 元`
    }
    if (this.next === null) {
      return `${amount} 元超出所有审批人的权限，需要开会决定`
    }
    return this.next.handle(amount)
  }
}

const teamLead = new Approver('组长', 1000)
const manager = new Approver('经理', 5000)
const cto = new Approver('CTO', 20000)
teamLead.setNext(manager).setNext(cto)

console.log(teamLead.handle(800))
console.log(teamLead.handle(3000))
console.log(teamLead.handle(50000))
```

`setNext` 返回下一个节点，于是可以链式组装 `a.setNext(b).setNext(c)`。

数组 + 递归的形式更适合「中间件」：每一环都能选择**在前后各做点事**，也就是洋葱模型。

```js
function compose(middlewares) {
  return function run(context) {
    function dispatch(index) {
      const middleware = middlewares[index]
      if (!middleware) {
        return Promise.resolve(context)
      }
      return Promise.resolve(middleware(context, () => dispatch(index + 1)))
    }

    return dispatch(0)
  }
}

const runPipeline = compose([
  async (context, next) => {
    context.trace = ['解析参数']
    await next()
    context.trace.push('返回响应')
  },
  async (context, next) => {
    context.trace.push('校验权限')
    await next()
  },
  async context => {
    context.trace.push('执行业务')
  },
])

runPipeline({}).then(context => console.log(context.trace.join(' -> ')))
// 解析参数 -> 校验权限 -> 执行业务 -> 返回响应
```

**Koa / Express 的中间件就是这套结构**：同一份 `compose`，Express 用回调（`next()` 不带 `await`，难以支持「响应之后」的逻辑），Koa 用 `async/await`，于是有了完整的洋葱模型。

### 8.4 适用场景

- 多级审批、多级缓存、多级过滤（日志分级、敏感词过滤）、请求拦截器。
- 「谁能处理就谁处理，都不处理就兜底」的判定逻辑；处理顺序需在运行期动态调整（插件、中间件）。

### 8.5 优缺点

优点：发送者与处理者解耦；链的组成可动态增删；每个处理者职责单一，可独立测试。

缺点：请求可能**没有处理者**，必须有兜底，否则静默失败；链长时难调试；链的顺序是隐式约定，调序容易引发难查的 bug。

### 8.6 与相近模式的区别

- **vs 状态模式**：职责链的节点是「上下游」关系，请求单向流动；状态模式的「下一个状态」是对象内部的迁移，行为随状态改变。
- **vs 装饰器**：装饰器每一层都会执行；职责链在某一环处理后**可能提前终止**。
- **vs 策略模式**：策略是「选一个执行」，职责链是「可能依次尝试多个，直到成功」。

## 9. 状态模式

### 9.1 意图

允许对象在**内部状态改变时改变行为**，看起来像换了个类。价值在于：把「状态判断 + 行为」从 `switch` 搬进状态对象，并把**迁移规则**也收进去。

### 9.2 结构

- **Context**：持有当前状态，把行为委托给状态对象。
- **State**：状态接口，约定同名方法（如 `handle`）。
- **ConcreteState**：每个状态的行为，以及「下一个状态是谁」。

### 9.3 实现

红绿灯是最小的例子：状态对象既描述行为，也描述迁移。

```js
const lightStates = {
  green: {
    label: '绿灯',
    action: '通行',
    next: 'yellow',
  },
  yellow: {
    label: '黄灯',
    action: '减速',
    next: 'red',
  },
  red: {
    label: '红灯',
    action: '停止',
    next: 'green',
  },
}

class TrafficLight {
  constructor() {
    this.state = lightStates.green
  }

  change() {
    this.state = lightStates[this.state.next]
  }

  report() {
    return `${this.state.label}：${this.state.action}`
  }
}

const light = new TrafficLight()
console.log(light.report())
light.change()
console.log(light.report())
light.change()
console.log(light.report())
```

需要拒绝非法迁移时，把「允许的动作」放进状态表：

```js
const orderStates = {
  unpaid: { label: '待支付', transitions: { pay: 'paid', cancel: 'closed' } },
  paid: { label: '已支付', transitions: { ship: 'shipped', refund: 'closed' } },
  shipped: { label: '已发货', transitions: { confirm: 'finished' } },
  finished: { label: '已完成', transitions: {} },
  closed: { label: '已关闭', transitions: {} },
}

class Order {
  constructor() {
    this.state = orderStates.unpaid
  }

  get label() {
    return this.state.label
  }

  dispatch(action) {
    const nextKey = this.state.transitions[action]
    if (!nextKey) {
      throw new Error(`${this.state.label} 状态不支持「${action}」`)
    }
    this.state = orderStates[nextKey]
    return this.label
  }
}

const order = new Order()
console.log(order.dispatch('pay')) // 已支付
console.log(order.dispatch('ship')) // 已发货

try {
  order.dispatch('pay')
} catch (error) {
  console.log(error.message) // 已发货 状态不支持「pay」
}
```

「状态表 + 迁移表」就是有限状态机的数据化实现：状态图可打印、可测试、可可视化——这是它比散落的 `switch` 强的地方。

### 9.4 适用场景

- 行为随状态变化、状态超过三四个（订单、审批、播放器）；迁移规则复杂（谁能到谁、满足什么条件）需集中管理。
- 需要把状态行为抽出来独立测试。

### 9.5 与相近模式的区别

- **vs 策略模式**（最常被问）：结构几乎一样，区别在**谁决定切换**：
  - 策略：客户端从外部选择策略，策略之间互不认识，切换没有「进度」含义，可以来回换。
  - 状态：状态自己（或迁移表）决定下一个状态，切换由对象内部的事件触发，状态之间构成一张状态图。
  - 口诀：**能「换回去」的是策略，只能「往前走」的是状态。**
- **vs 职责链**：见 8.6。
- **vs 模板方法**：状态模式是运行期的行为替换，模板方法是继承期固定的流程骨架。

## 10. 模板方法模式

### 10.1 意图

在一个方法里定义算法的**骨架**，把某些步骤**延迟到子类**。父类控制流程，子类只填内容——即「好莱坞原则」：**别调用我们，我们会调用你**。

### 10.2 结构

- **AbstractClass**：`templateMethod`（骨架，子类不该覆写）+ 若干 `primitiveOperation`（子类实现）+ 可选的 `hook`（钩子）。
- 在 JS 里还有第二种实现：**把可变步骤作为参数传进来**，不继承（见 10.3）。

### 10.3 实现

继承版本：`run` 是骨架，`load` / `parse` / `save` 是步骤。

```js
class DataImporter {
  async run(source) {
    const raw = await this.load(source)
    const rows = this.parse(raw)
    const valid = this.validate(rows)
    await this.save(valid)
    return valid.length
  }

  async load() {
    throw new Error('子类必须实现 load')
  }

  parse(raw) {
    return raw
  }

  validate(rows) {
    return rows.filter(row => row !== null && row !== undefined)
  }

  async save(rows) {
    console.log(`已保存 ${rows.length} 条`)
  }
}

class CsvImporter extends DataImporter {
  async load(source) {
    return source.trim().split('\n')
  }

  parse(raw) {
    return raw.map(line => line.split(','))
  }
}

new CsvImporter().run('a,b\nc,d').then(count => console.log(count))
```

`parse` 和 `validate` 是钩子：父类给了默认实现，子类只覆盖需要变的。**骨架不变，变的是步骤**——流程只写一遍、顺序不被子类改乱。

函数版本（JS 里更常见的形态）：用参数代替继承，没有 `this`，也没有基类。

```js
function createImporter({ load, parse = raw => raw, save }) {
  return async function run(source) {
    const rows = parse(await load(source))
    await save(rows)
    return rows.length
  }
}

const importCsv = createImporter({
  load: source => source.trim().split('\n'),
  parse: lines => lines.map(line => line.split(',')),
  save: rows => console.log(`已保存 ${rows.length} 条`),
})

importCsv('a,b\nc,d').then(count => console.log(count))
```

两者能力相当，但函数版本**不必为复用流程建立继承关系**，也不会遇到「父类要求子类实现 `load`，而 JS 没有抽象方法」的尴尬。

### 10.4 适用场景

- 多个实现共享同一套流程、只有个别步骤不同：导入/导出、构建流水线、组件生命周期、脚手架。
- 流程的顺序本身就是重要约束，不允许子类打乱；框架设计经典手法——框架定骨架（Vue 生命周期、Webpack 插件钩子），使用者只填步骤。

### 10.5 优缺点

优点：流程复用、顺序受控；可变部分被隔离；钩子提供了可选的扩展点。

缺点：依赖继承，子类与父类强耦合（父类改骨架会波及全部子类）；受限于**单继承**；步骤多、层级深时要在父子类间来回跳——控制反转的代价。

### 10.6 与相近模式的区别

- **vs 策略模式**：模板方法用继承在**编译期**固定骨架、替换其中一部分步骤；策略用组合在**运行期**换掉整个算法。**优先策略/组合。**
- **vs 工厂方法**：工厂方法是模板方法的一个特例——骨架里留一个「创建对象」的步骤给子类实现。
- **vs 职责链**：模板方法的步骤是**全部按序执行**的；职责链是**找到处理者就停**。

## 11. JavaScript 语境下的共性问题

### 11.1 为什么 JS 里很多模式用函数与闭包而不是类

- **函数是一等公民**：模式的本体是「可替换的行为」，JS 里行为就是函数，一个函数参数就能表达 Java 里接口 + 实现类 + 工厂才能表达的东西。
- **闭包提供真正的私有状态**：`let count = 0` 写在函数作用域里，外部只能通过返回的方法访问。**组合比继承便宜**：`withA(withB(fn))` 不需要类层次和 `super`，叠加顺序一目了然。
- **但也别走极端**：需要**多个方法 + 自身状态 + 生命周期 + 可继承**时，类更清晰（状态对象、插件基类、需要 `instanceof` 的场景）。判断标准是「实体是否长期存在、有身份」，不是「写法更短」。

反面例子：把 Java 的抽象工厂原样搬来，得到 3 个接口 + 6 个实现类，而项目里只有一套实现。

### 11.2 鸭子类型与接口的缺失如何影响实现

JS 没有 `interface`，也没有编译期检查，于是模式的「接口」退化成**命名约定**：

- `observer.update(data)`：Subject 只认方法名 `update`。
- `strategy.send(message)` 或 `strategy(salary)`：Context 只认「有这个方法」或「可调用」。
- `thenable`：`await` 只要求对象有 `then` 方法——这就是语言层面承认的鸭子类型。

三个后果：

1. **约束靠文档和测试**，不靠编译器：方法名写错不在编译期报错，而是运行时 `TypeError: xxx is not a function`（见 12.7）。
2. **内建协议就是「隐式接口」**：`Symbol.iterator`、`then`、`toJSON` 都是鸭子类型——**复用语言已有协议而非发明新方法名**，对象就能被 `for...of`、`await`、`JSON.stringify` 直接消费。
3. **TypeScript 是在补这一层**：用 `interface` 描述角色能拿回编译期检查，但边界上的外部数据仍要运行时校验——`as` 是断言，不是转换。

运行时校验能把错误暴露在「组装阶段」，而不是等运行时才炸：

```js
const isObserver = value => value != null && typeof value.update === 'function'

function attachObserver(subject, observer) {
  if (!isObserver(observer)) {
    throw new TypeError('observer 需要实现 update 方法')
  }
  subject.observers.push(observer)
}

const subject = { observers: [] }
attachObserver(subject, { update: data => data })
console.log(subject.observers.length) // 1
```

### 11.3 模块系统（ESM）如何让单例、命名空间模式变形

**ESM 模块天然是单例**：同一个模块在同一份模块图里只会被求值一次，后续 `import` 拿到的是同一份导出绑定。

```js
// store.js
export const store = {
  state: { count: 0 },
  increment() {
    this.state.count += 1
  },
}
```

```js
// a.js
import { store } from './store.js'

store.increment()
```

```js
// b.js
import { store } from './store.js'

console.log(store.state.count) // a.js 执行过就是 1
```

于是单例模式在 ESM 下常退化成一行导出：不需要类、不需要 `getInstance`，唯一性由模块缓存保证。**命名空间模式**同样被模块取代——`export` 本身就是「只暴露我想暴露的」，命名冲突由模块作用域解决。

但要注意「模块单例」不等于「应用单例」：

- 同一份代码被打成两个 bundle、同一个包装了多个版本、微前端里两个子应用各加载一份，都会出现两个「单例」；所以要明确「唯一」的边界是**每份模块图唯一**还是**整个页面唯一**——后者只能挂到 `globalThis`，并接受随之而来的污染。
- SSR 里模块缓存是**进程级**的：多请求共享同一实例，可能是有意为之（连接池），也可能是事故（请求 A 的数据泄漏给请求 B）。

### 11.4 `Proxy` / `Reflect` 在现代 JS 里替代了哪些经典模式

`Proxy` 把「代理」从「手写同名方法齐全的对象」变成**语言级元编程能力**：拦截发生在属性访问层面，不需要目标对象配合，吃掉了好几个经典手法。

[width(23,34,43)]

| 经典模式 / 手法       | 传统实现                                                   | 现代替代                                           |
| --------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| 虚拟代理（懒加载）    | 手写同名方法，转发给真实对象                               | `get` 陷阱（首次访问时初始化）、getter             |
| 缓存代理              | 手写包装函数 + 缓存表                                      | `get` 陷阱 + `Map` / `WeakMap`                     |
| 保护代理              | 每个方法里手写权限判断                                     | `get` / `set` / `has` 陷阱统一拦截                 |
| 观察者 / 响应式       | 手动 `notify()`，或用 `Object.defineProperty` 逐个属性劫持 | `get` 收集依赖 + `set` 触发更新（Vue 3 的做法）    |
| 装饰器                | 写一个实现相同接口的包装类                                 | 不改接口时用 `Proxy` 包一层；改声明用 `@decorator` |
| 只读视图 / 不可变对象 | `Object.freeze` + 在每个方法里抛错                         | `set` / `deleteProperty` 陷阱抛错，或返回只读代理  |
| Mock / 桩对象         | 手写一个假实现                                             | `Proxy` 拦截未实现的方法并记录调用                 |
| 享元 / 对象池         | 手动维护池与借用关系                                       | 用 `WeakMap` 建立对象到元数据的关联                |

`Reflect` 的存在意义有三点：

1. **把内部方法变成函数**：`Reflect.get` / `set` / `has` / `construct` 让「默认行为」可显式调用，不必写绕过陷阱语义的 `target[key]`。
2. **`receiver` 参数**：让 getter 里的 `this` 指向调用者（通常是代理本身），这是「代理 + getter」正确工作的关键（见 5.4）。
3. **返回值语义更合理**：`Reflect.set` 返回布尔值，`Reflect.construct` 能正确处理 `new.target`。

代价：每个陷阱都要自己保证语言的不变量（不可配置/不可写属性、内部槽对象），漏一条就可能抛 `TypeError`；且有实打实的性能开销，热路径的属性访问会退化。

### 11.5 什么时候是「过度设计」

模式是**为变化付的保险费**：如果变化没有发生，保费就是纯亏损。

三条可以自查的判据：

1. **变化已经发生，或有明确的近期计划**。只有一个实现时，`IUserRepository` 里的 `I` 就是纯噪音。「三次法则」：同一模式第三次出现时再抽象。
2. **加的这一层能不能被独立替换或独立测试**。只把调用原样转发的抽象层没有存在理由；能换来「可替换」「可单独测试」「可插拔顺序」之一才有价值。
3. **抽象的名字在不在需求里**。业务说的是「下单」而不是「命令模式」。**模式的名字成了团队沟通的核心词汇，通常说明抽象过头了。**

几个具体的「过度设计」信号：

- 为一个只有一种实现的接口写了工厂 + 策略 + 适配器三层；出现 `// 以后可能支持 xxx` 的注释，而 xxx 至今没有出现。
- 为了「灵活性」把 10 行线性代码拆成 12 个文件，改一个需求要动 5 个文件；或事件总线满天飞，一个动作触发 7 个 handler，没人说得清顺序。
- 单例上挂了 30 个方法，变成了真正的「上帝对象」。

反过来，**该上模式的时候别犹豫**：当你第三次复制粘贴结构相同的代码、或一个 `switch` 的分支开始按周增长时，就是模式开始产生收益的时刻。

## 12. 常见问题 (FAQ)

### 12.1 单例为什么常被说是反模式？

- **单例本质是「有名字的全局可变状态」**：任何位置都能改、影响范围不可见；`function pay(order)` 的签名看不出它还依赖单例里的配置和连接。
- **它会破坏测试隔离**：用例 A 改了状态，用例 B 就失败，测试顺序开始影响结果。
- **「唯一」在真实环境经常不成立**：Web Worker、多进程、微前端多实例、SSR 多请求共享进程，都可能出现多份「单例」（见 11.3）。
- **结论不是「禁用」而是「控制边界」**：把单例当**有生命周期的资源容器**（连接池、配置、日志），而非「更方便的全局变量」；需要测试隔离时让使用方通过参数接收依赖。

```js
// 不推荐：函数内部直接取全局单例
function pay(order) {
  return config.get('payUrl') + order.id
}

// 推荐：依赖从参数进来，测试时想传什么传什么
function payWith(config, order) {
  return config.payUrl + order.id
}
```

### 12.2 策略模式和 `switch` / `if-else` 怎么选？

- **分支少（两三个）且稳定**：`switch` 更好读，能一眼看全所有分支，别动它。
- **分支多、会增长、每个分支是一段完整算法**：用策略——此时 `switch` 的问题是「每加一种情况都要回到同一个函数里改」。
- **策略不等于「消灭判断」**：`strategies[level]` 的查表本身就是一次判断，只是把判断留在 Context、算法体搬了出去。
- **形态怎么选**：算法只是一段计算时用对象映射或 `Map`；有状态、有多个方法、要复用构造参数时用类。
- **什么时候不该拆**：各分支共享大量局部变量时，拆成策略会让参数列表爆炸（把上下文对象整体传进去能缓解，但那又变成强耦合）。

### 12.3 观察者模式和发布订阅模式到底差在哪？

- **观察者**：被观察者**直接持有**观察者列表（`subject.attach(observer)`），是**对象之间的关系**模型。
- **发布订阅**：中间多一个**调度中心**（事件总线），双方只用事件名打交道，是**架构层面的通信机制**。
- **收益与代价**：发布订阅耦合更低（跨模块、可异步、可跨进程），代价是**事件名成了隐式契约**——「谁发的、谁在听、顺序如何」都不在代码里。
- **JS 里的对照**：`addEventListener`、`MutationObserver` 属于观察者；`EventEmitter`、`mitt`、消息队列属于发布订阅。
- **选择建议**：同一模块内、通知关系明确时用观察者（甚至直接回调）；需要跨模块解耦、异步投递时再引入事件总线，并**给事件名定规范**。

### 12.4 ESM 下还要不要单例模式？

- **大多数场景不需要手写单例**：模块缓存保证「一个模块只求值一次」，`export default new Store()` 就是单例（见 11.3）。
- **仍需要显式单例的三种情况**：惰性初始化（模块求值就建连接太早）、需要多份（多租户、两个连接池）、需要在测试里替换（留出重置或注入的口子）。
- **注意副作用**：模块顶层的 `new` 会在 `import` 时执行，拖慢启动、不利 tree-shaking；SSR 下模块缓存是进程级的，状态型单例会**跨请求串数据**。

### 12.5 什么时候算「过度设计」？

- **模式是为变化付的保费**：变化没发生，保费就是纯亏损（判据见 11.5）。
- **最直接的信号：给只有一种实现的接口起了名字**——`IUserService` 只有一个实现，`AbstractFactory` 只有一个子类。
- **第二个信号：注释里写着「以后可能支持 xxx」**，而 xxx 一直没来。
- **第三个信号：改动成本上升**：改一个字段要动 5 个文件、加一个字段要改 3 层接口，说明抽象没换来「可替换、可测试、可插拔」中的任何一项。
- **反过来的信号**：结构相同的代码出现第三次、`switch` 分支按周增长、同一个 bug 在多处重复修——**这才是该引入模式的时刻**。

### 12.6 代理、装饰器、适配器都是「包一层」，怎么区分？

- **代理**：接口**不变**，目的是**控制访问**（延迟、权限、缓存、远程）——回答「能不能进、什么时候进」。
- **装饰器**：接口**不变**，目的是**叠加功能**（日志、计时、重试）——回答「进去之后多做点什么」，且可以叠很多层。
- **适配器**：接口**改变**，目的是**让两边接上**（回调 → Promise、字段名映射）——回答「换个说法让对方听懂」。
- **一句话记忆**：**看接口有没有变、看包装的目的**；三者实现手法相同（持有引用 + 转发），差别在意图，可以混合但**命名要诚实**。

### 12.7 JS 没有接口，怎么保证策略、观察者的实现不写错？

- **约定方法名就是接口**：`update` / `handle` / `send` / 可调用，全凭鸭子类型（见 11.2）。
- **注册时做运行时校验**，把错误暴露在「组装阶段」而不是「运行阶段」：

```js
const strategies = new Map()

function registerStrategy(name, strategy) {
  if (typeof strategy !== 'function') {
    throw new TypeError(`策略 ${name} 必须是函数`)
  }
  strategies.set(name, strategy)
}

registerStrategy('S', salary => salary * 4)
console.log(strategies.size) // 1
```

- **优先复用内建协议**：返回 `Promise`（thenable）、实现 `Symbol.iterator`、提供 `toJSON`，对象就能被语言特性直接消费。
- **需要编译期保证就上 TypeScript**，用 `interface` 描述角色；但边界数据仍要运行时校验。

### 12.8 观察者、发布订阅的内存泄漏怎么处理？

- **成因**：长生命周期的 Subject（全局总线、单例 Store、DOM 节点）持有短生命周期对象（组件实例、闭包）的回调，对象图无法回收；组件销毁后回调仍触发，甚至操作已卸载的 DOM。
- **手段**：
- `on` 返回 `unsubscribe`，由订阅方负责清理（见 4.3）；`once` 在触发时自动摘除。
- 卸载时统一清理：`useEffect` 的返回函数、`AbortController` 的 `signal`，或把取消函数收进数组统一执行。
  - 只监听真正需要的事件，避免在渲染函数或循环里反复注册。
- **弱引用要谨慎**：`WeakRef` 与 `FinalizationRegistry` 能让监听器不阻止回收，但时机不确定，**不能用来保证正确性**，只适合缓存类场景。

```js
useEffect(() => {
  const unsubscribe = bus.on('resize', handleResize)
  return unsubscribe
}, [])
```
