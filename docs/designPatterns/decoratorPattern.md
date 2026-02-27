# 装饰器模式

## 1. 核心概念与价值

装饰器模式就像是给手机“贴膜”或“加手机壳”：手机的核心功能（打电话、上网）没变，但增加了额外的属性（防摔、好看）。

| 维度 | 描述 |
|---|---|
| **核心定义** | 动态地给一个对象添加一些额外的职责。就增加功能来说，装饰器模式比生成子类更为灵活。 |
| **主要优点** | 1. 灵活性高：可以在运行时选择如何包装对象；<br>2. 职责分离：核心业务逻辑和辅助逻辑（如日志、校验）彻底解耦；<br>3. 组合性强：可以通过多个装饰器嵌套，实现功能的累加。 |
| **主要缺点** | 1. 产生大量的小类/小函数，增加系统复杂度；<br>2. 多层嵌套后，如果调试不当，排查问题的路径会变长。 |

## 2. JavaScript 实现方案 

在 JS 中，装饰器有两种常见的实现方式：**传统的包装函数（高阶函数）** 和 **现代的 `@` 语法（Stage 3 提案）**。

### 2.1 传统实现：包装函数 (推荐用于普通逻辑)
这种方式本质上是利用了闭包和高阶函数。

```js
// 1. 原始对象：普通咖啡
class Coffee {
  cost() { return 10; }
}

// 2. 装饰器：加奶
function withMilk(coffee) {
  const originalCost = coffee.cost();
  coffee.cost = function() {
    return originalCost + 5; // 增加 5 元
  };
  return coffee;
}

// 3. 装饰器：加糖
function withSugar(coffee) {
  const originalCost = coffee.cost();
  coffee.cost = function() {
    return originalCost + 2; // 增加 2 元
  };
  return coffee;
}

// 使用：自由组合功能
let myCoffee = new Coffee();
myCoffee = withMilk(myCoffee);
myCoffee = withSugar(myCoffee);
console.log(myCoffee.cost()); // 输出: 17
```

### 2.2 现代实现：`@Decorator` 语法 (推荐用于类和方法)
*注：目前该语法处于 Stage 3 提案阶段，在生产环境中通常需要 Babel 或 TypeScript 支持。*

```js
// 定义一个装饰器：记录日志
function log(target, name, descriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args) {
    console.log(`正在执行方法: ${name}，参数: ${args}`);
    return original.apply(this, args);
  };
  return descriptor;
}

class Calculator {
  @log
  add(a, b) {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3); // 输出: 正在执行方法: add，参数: 2, 3
```

## 3. 实战场景

装饰器模式在前端工程化中几乎随处可见：

| 场景 | 说明 |
|---|---|
| **权限控制** | 在进入页面组件前，用装饰器检查当前用户是否有权访问。 |
| **埋点与统计** | 在点击按钮或进入页面时，自动发送统计数据，而不侵入业务代码。 |
| **数据校验** | 为表单提交方法添加装饰器，先校验数据，校验不通过则拦截执行。 |
| **高阶组件 (HOC)** | React 中的 HOC 本质上就是组件层面的装饰器模式。 |

## 4. 模式对比 

装饰器模式常与代理模式混淆，下表为您清晰辨析：

| 模式 | 核心区别 | 形象比喻 |
|---|---|---|
| **装饰器模式** | **增强功能**。侧重于给原对象增加额外的职责。 | 手机加了个挂绳。 |
| **代理模式** | **控制访问**。侧重于在中间层做过滤、拦截或延迟执行。 | 手机的前台秘书代接。 |
| **适配器模式** | **接口转换**。解决接口不兼容问题。 | 手机的转接头（Type-C 转 3.5mm）。 |

## 5. 常见问题 (FAQ) 

### 5.1 `@decorator` 语法现在能在浏览器里直接跑吗？
*   **答**：**不能直接跑**。虽然处于 Stage 3 提案，但主流浏览器尚未完全原生支持。你需要使用 **Babel**（插件 `@babel/plugin-proposal-decorators`）或 **TypeScript** 将其编译为普通的 JS 语法。

### 5.2 装饰器模式和类继承相比，什么时候该选谁？
*   **答**：如果你的功能是**横向扩展**的（比如多个不相关的类都需要“日志”功能），选装饰器模式。如果你的功能是**纵向演化**的（比如“鸟” -> “麻雀”），且有严格的父子关系，选继承。**“多用组合，少用继承”**是现代设计的核心理念。

### 5.3 一个方法可以被多个装饰器装饰吗？
*   **答**：**可以**。执行顺序通常是“自上而下”进入，“自下而上”执行完返回。就像剥洋葱一样，最上面的装饰器是最外层。

### 5.4 装饰器可以改变方法的参数吗？
*   **答**：**可以**。通过修改 `descriptor.value` 里的 `apply(this, modifiedArgs)`，你可以拦截并修改传入原方法的参数，这在参数预处理或标准化场景中非常有用。


