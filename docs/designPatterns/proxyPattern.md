# 代理模式

## 1. 核心概念与价值 

代理模式并不改变原对象的功能，而是在原对象的外层封装了一层“拦截器”。

| 维度 | 描述 |
|---|---|
| **核心意图** | 控制对原对象的访问，并在访问前后增加自定义逻辑。 |
| **主要优点** | 1. 职责清晰：原对象只关注核心逻辑，代理关注控制逻辑；<br>2. 保护作用：防止对原对象的非法或频繁访问；<br>3. 性能优化：通过虚拟代理实现延迟加载。 |
| **主要缺点** | 1. 增加了系统的复杂度和代码行数；<br>2. 在某些高度敏感的场景下，可能会带来微小的性能损耗。 |

## 2. 常见的代理类型与实现

在 JavaScript 中，代理模式的应用非常广泛，以下是几种最典型的变体：

### 2.1 虚拟代理 (Virtual Proxy)
**场景**：将开销很大的操作延迟到真正需要的时候执行。

**实例**：图片预加载。先显示一张 Loading 占位图，等图片下载完成后再替换。

```javascript
// 原对象：负责设置图片 src
const myImage = (function() {
  const imgNode = document.createElement('img');
  document.body.appendChild(imgNode);
  return {
    setSrc: function(src) {
      imgNode.src = src;
    }
  };
})();

// 代理对象：负责预加载逻辑
const proxyImage = (function() {
  const img = new Image();
  img.onload = function() {
    myImage.setSrc(this.src); // 图片加载完后，再设置给原对象
  };
  return {
    setSrc: function(src) {
      myImage.setSrc('loading.gif'); // 先显示占位图
      img.src = src;
    }
  };
})();

proxyImage.setSrc('https://example.com/big-image.png');
```

### 2.2 缓存代理 (Cache Proxy)
**场景**：为耗时长的计算结果提供临时存储。

**实例**：计算斐波那契数列或复杂的计算器。

```javascript
// 原函数：计算乘积
const mult = function(...args) {
  console.log('开始计算...');
  return args.reduce((a, b) => a * b);
};

// 代理函数：增加缓存功能
const proxyMult = (function() {
  const cache = {};
  return function(...args) {
    const key = args.join(',');
    if (key in cache) return cache[key];
    return cache[key] = mult.apply(this, args);
  };
})();

console.log(proxyMult(1, 2, 3)); // 输出: 开始计算... 6
console.log(proxyMult(1, 2, 3)); // 直接返回缓存结果 6
```

### 2.3 ES6 原生代理 (The `Proxy` Object)
现代 JavaScript 提供了一个内置的 `Proxy` 对象，这是实现代理模式的最标准、最强大的方式（也是 Vue 3 响应式原理的核心）。

| 捕获器 (Trap) | 描述 |
|---|---|
| `get(target, prop)` | 拦截对象属性的读取。 |
| `set(target, prop, value)` | 拦截对象属性的设置（常用于数据校验或响应式）。 |
| `has(target, prop)` | 拦截 `in` 操作符。 |

```javascript
const user = { name: 'Alice', age: 25 };

const proxyUser = new Proxy(user, {
  get(target, key) {
    console.log(`正在读取属性: ${key}`);
    return target[key];
  },
  set(target, key, value) {
    if (key === 'age' && value < 0) {
      throw new Error('年龄不能为负数');
    }
    target[key] = value;
    return true;
  }
});
```

## 3. 模式对比 

代理模式常与装饰器模式、适配器模式混淆，下表为您清晰辨析：

| 模式 | 核心区别 |
|---|---|
| **代理模式** | **控制访问**。代理类和原类接口通常一致。代理人替你做决定。 |
| **装饰器模式** | **增强功能**。在不改变原对象的基础上，动态添加职责。 |
| **适配器模式** | **改变接口**。主要解决两个已有接口不兼容的问题。 |

## 4. 常见问题 (FAQ) 

### 4.1 代理模式会影响性能吗？
*   **答**：在大多数前端应用场景下，性能损耗可以忽略不计。相反，**虚拟代理**（延迟加载）和**合并请求代理**（将多个细碎的请求合并发送）能显著提升应用的感知性能。

### 4.2 Vue 3 为什么要从 `Object.defineProperty` 切换到 `Proxy`？
*   **答**：因为 `Proxy` 是对整个对象的代理，可以拦截到对象属性的增加、删除，甚至是数组索引的修改。而 `Object.defineProperty` 只能拦截已有的属性，且无法监听数组长度的变化。

### 4.3 什么是保护代理 (Protection Proxy)？
*   **答**：它主要用于权限控制。例如，在一个社交应用中，只有好友关系的代理对象才允许访问受害者的私密信息。它在中间层做了一层身份或权限校验。

### 4.4 代理对象一定要和原对象接口完全一致吗？
*   **答**：虽然在理论上推荐一致，以便透明地替换。但在实际 JS 开发中，为了方便，代理对象有时会提供额外的管理方法（如手动清空缓存代理的缓存）。

