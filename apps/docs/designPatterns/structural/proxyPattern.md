# 代理模式

## 1. 核心概念与价值

代理模式并不改变原对象的功能，而是在原对象的外层封装了一层“**拦截器**”。它很像是明星的经纪人：粉丝（客户端）见不到本人，所有请求都要先过经纪人（代理）这一关，由他决定是直接转达、挡回去，还是攒一攒再一起处理。

[width(15,85)]

| 维度           | 描述                                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **核心意图**   | 控制对原对象的访问，并在访问前后增加自定义逻辑。                                                                                                                        |
| **关键角色**   | **抽象主题 (Subject)**：约定原对象与代理共同遵守的接口；**真实对象 (Real Subject)**：真正干活的被代理者；**代理 (Proxy)**：持有真实对象的引用，在转发前后插入控制逻辑。 |
| **主要优点**   | 1. 职责清晰：原对象只关注核心逻辑，代理关注控制逻辑；<br>2. 保护作用：防止对原对象的非法或频繁访问；<br>3. 性能优化：通过虚拟代理实现延迟加载。                         |
| **主要缺点**   | 1. 增加了系统的复杂度和代码行数；<br>2. 在某些高度敏感的场景下，可能会带来微小的性能损耗。                                                                              |
| **适用场景**   | 1. 需要拦截、控制对某对象的访问；<br>2. 开销大的对象希望延迟到真正用时再创建（虚拟代理）；<br>3. 需要叠加缓存、鉴权、日志、限流等横切逻辑。                             |
| **不适用场景** | 1. 访问控制本就简单，直接调用即可，加代理纯属绕路；<br>2. 对象本身很轻，多一层代理得不偿失。                                                                            |

## 2. 常见的代理类型与实现

在 JavaScript 中，代理模式的应用非常广泛，以下是几种最典型的变体：

### 2.1 虚拟代理 (Virtual Proxy)

**场景**：将开销很大的操作延迟到真正需要的时候执行。

**实例**：图片预加载。先显示一张 Loading 占位图，等图片下载完成后再替换。

```js
// 原对象：负责设置图片 src
const myImage = (function () {
  const imgNode = document.createElement('img')
  document.body.appendChild(imgNode)
  return {
    setSrc: function (src) {
      imgNode.src = src
    },
  }
})()

// 代理对象：负责预加载逻辑
const proxyImage = (function () {
  const img = new Image()
  img.onload = function () {
    myImage.setSrc(this.src) // 图片加载完后，再设置给原对象
  }
  return {
    setSrc: function (src) {
      myImage.setSrc('loading.gif') // 先显示占位图
      img.src = src
    },
  }
})()

proxyImage.setSrc('https://example.com/big-image.png')
```

### 2.2 缓存代理 (Cache Proxy)

**场景**：为耗时长的计算结果提供临时存储。

**实例**：计算斐波那契数列或复杂的计算器。

```js
// 原函数：计算乘积
const mult = function (...args) {
  console.log('开始计算...')
  return args.reduce((a, b) => a * b)
}

// 代理函数：增加缓存功能
const proxyMult = (function () {
  const cache = {}
  return function (...args) {
    const key = args.join(',')
    if (key in cache) return cache[key]
    return (cache[key] = mult.apply(this, args))
  }
})()

console.log(proxyMult(1, 2, 3)) // 输出: 开始计算... 6
console.log(proxyMult(1, 2, 3)) // 直接返回缓存结果 6
```

### 2.3 ES6 原生代理 (The `Proxy` Object)

现代 JavaScript 提供了一个内置的 `Proxy` 对象，这是实现代理模式的最标准、最强大的方式（也是 Vue 3 响应式原理的核心）。

[width(33,67)]

| 捕获器 (Trap)              | 描述                                           |
| -------------------------- | ---------------------------------------------- |
| `get(target, prop)`        | 拦截对象属性的读取。                           |
| `set(target, prop, value)` | 拦截对象属性的设置（常用于数据校验或响应式）。 |
| `has(target, prop)`        | 拦截 `in` 操作符。                             |

```js
const user = { name: 'Alice', age: 25 }

const proxyUser = new Proxy(user, {
  get(target, key) {
    console.log(`正在读取属性: ${key}`)
    return target[key]
  },
  set(target, key, value) {
    if (key === 'age' && value < 0) {
      throw new Error('年龄不能为负数')
    }
    target[key] = value
    return true
  },
})
```

## 3. 典型应用场景

代理在真实项目里几乎无处不在，它常常以“**包装**”“**中间层**”的姿态出现。

**高频场景：遇到这类需求，直接对号入座**

[width(23,15,62)]

| 场景                | 代理类型  | 关键手段                                              |
| :------------------ | :-------- | :---------------------------------------------------- |
| 图片 / 组件懒加载   | 虚拟代理  | `IntersectionObserver` 或图片 `onload`，先占位后替换  |
| Vue 3 响应式数据    | ES6 Proxy | `new Proxy(target, { get, set })` 拦截属性的读写      |
| 接口请求缓存 / 去重 | 缓存代理  | 以参数为 key 缓存 Promise，命中直接复用，避免重复请求 |
| 前端埋点、日志      | 转发代理  | 在调用前后插入上报，业务代码无感                      |
| Dev Server 跨域     | 转发代理  | Vite / webpack 的 `proxy` 把本地请求转给后端          |
| Node.js 中间件      | 转发代理  | Koa / Express 逐层包裹 `ctx`，统一鉴权与错误处理      |
| ORM 关联数据        | 虚拟代理  | 首次访问关系属性时才真正发查询（懒加载）              |
| 权限校验            | 保护代理  | 拦截敏感方法，校验身份通过才放行                      |

## 4. 关键语言特性与易错点

代理模式在 JS 里有两副面孔：**ES5 的“**手动包装函数**”** 和 **ES6 的 `Proxy`**。后者把“**拦截**”下沉到了语言层，能力远胜前者。

[width(44,56)]

| 语言特性 / API                               | 在这里的作用                                                            |
| :------------------------------------------- | :---------------------------------------------------------------------- |
| **`Proxy(target, handler)`**                 | 代理任意对象或函数，`target` 是被代理者，`handler` 决定拦截哪些操作。   |
| **`Reflect`**                                | 每个 trap 都有对应的 `Reflect` 方法，用于在拦截后“**放行**”到默认行为。 |
| **`get` / `set` / `has` / `deleteProperty`** | 拦截读取、赋值、`in` 与 `delete`，是响应式与校验的常用入口。            |
| **`ownKeys` / `getOwnPropertyDescriptor`**   | 拦截 `Object.keys`、`for...in` 等枚举行为。                             |
| **`apply` / `construct`**                    | 代理**函数**时，拦截调用与 `new`。                                      |
| **`receiver`**                               | trap 的第三个参数，代表“**谁在调我**”，处理继承和 `this` 绑定时要透传。 |

**容易踩的坑**：

- **`set` trap 必须返回 `true`**：严格模式下返回 `false` 或漏写 `return`，会抛 `TypeError`。
- **代理不等于原对象**：`proxy !== target`，用 `Map` 缓存时要想清楚键该用谁。
- **忘了透传 `receiver`**：写成 `Reflect.get(target, key)` 会丢参数，继承场景下 `this` 指向会出错。
- **拦不全想要的枚举行为**：只实现 `ownKeys` 可能还不够，`for...in` 需要配合 `getOwnPropertyDescriptor`。

面试常被追问：`Proxy` 相比 `Object.defineProperty` 强在哪 —— 见 6.2。

## 5. 模式对比

代理模式常与装饰器模式、适配器模式混淆，下表为您清晰辨析：

[width(15,85)]

| 模式           | 核心区别                                                   |
| -------------- | ---------------------------------------------------------- |
| **代理模式**   | **控制访问**。代理类和原类接口通常一致。代理人替你做决定。 |
| **装饰器模式** | **增强功能**。在不改变原对象的基础上，动态添加职责。       |
| **适配器模式** | **改变接口**。主要解决两个已有接口不兼容的问题。           |

## 6. 常见问题 (FAQ)

### 6.1 代理模式会影响性能吗？

在大多数前端应用场景下，性能损耗可以忽略不计。相反，**虚拟代理**（延迟加载）和**合并请求代理**（将多个细碎的请求合并发送）能显著提升应用的感知性能。

### 6.2 Vue 3 为什么要从 `Object.defineProperty` 切换到 `Proxy`？

因为 `Proxy` 是对整个对象的代理，可以拦截到对象属性的增加、删除，甚至是数组索引的修改。而 `Object.defineProperty` 只能拦截已有的属性，且无法监听数组长度的变化。

### 6.3 什么是保护代理 (Protection Proxy)？

它主要用于权限控制。例如，在一个社交应用中，只有好友关系的代理对象才允许访问受害者的私密信息。它在中间层做了一层身份或权限校验。

### 6.4 代理对象一定要和原对象接口完全一致吗？

虽然在理论上推荐一致，以便透明地替换。但在实际 JS 开发中，为了方便，代理对象有时会提供额外的管理方法（如手动清空缓存代理的缓存）。
