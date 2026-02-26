# 策略模式

## 1. 核心概念与价值

策略模式的定义是：**定义一系列算法，把它们一个个封装起来，并且使它们可以相互替换。**

它的核心目的在于将**算法的使用**（逻辑判断）与**算法的实现**（具体代码）分离开来。

| 维度 | 描述 |
|---|---|
| **核心思想** | 既然逻辑判断会变，就把变的部分抽离出来，变成独立的“策略”。 |
| **主要优点** | 1. 完美遵循“开闭原则”（对扩展开放，对修改关闭）；<br>2. 消除臃肿的 `if-else` 分支；<br>3. 算法可以自由组合和复用。 |
| **主要缺点** | 1. 会增加代码中的对象/类数量；<br>2. 调用者必须了解所有策略的区别，才能选出合适的。 |

## 2. 模式结构：从“臃肿”到“优雅” 🛠️

让我们通过一个经典的 **“年终奖计算”** 案例来看策略模式的进化。

### 2.1 传统写法（反面教材）
随着等级增加，这段代码会无限膨胀，极难维护。
```js
function calculateBonus(level, salary) {
  if (level === 'S') return salary * 4;
  if (level === 'A') return salary * 3;
  if (level === 'B') return salary * 2;
  // ... 后面还有几十个 else if
}
```

### 2.2 策略模式写法（JS 风格推荐）
由于 JavaScript 中函数是“一等公民”，我们通常不需要像 Java 那样写复杂的类结构，直接用**对象映射**即可。

```js
// 1. 定义策略对象（算法实现）
const bonusStrategies = {
  "S": (salary) => salary * 4,
  "A": (salary) => salary * 3,
  "B": (salary) => salary * 2,
  "C": (salary) => salary * 1
};

// 2. 环境类/函数（算法使用）
const getBonus = (level, salary) => {
  // 如果找不到对应策略，可以提供默认值
  return bonusStrategies[level] ? bonusStrategies[level](salary) : 0;
};

console.log(getBonus("S", 10000)); // 40000
```

## 3. 实战场景：表单校验

这是前端开发中最能体现策略模式威力的场景。

```js
// 策略组：定义校验规则
const strategies = {
  isNonEmpty: (value, errorMsg) => {
    if (value === '') return errorMsg;
  },
  minLength: (value, length, errorMsg) => {
    if (value.length < length) return errorMsg;
  },
  isMobile: (value, errorMsg) => {
    if (!/(^1[3|5|8][0-9]{9}$)/.test(value)) return errorMsg;
  }
};

// 调用：
const validator = (type, value, ...args) => {
  return strategies[type](value, ...args);
};

console.log(validator('minLength', 'abc', 6, '用户名不能少于6位')); 
// 输出: "用户名不能少于6位"
```

## 4. 常见问题 (FAQ) 与深度思考

### 4.1 策略模式和“对象配置”有什么区别？
*   **答**：本质上，在 JS 中它们非常相似。但策略模式强调的是**“行为”的替换**。对象配置通常存储的是静态数据，而策略模式存储的是**可执行的算法或逻辑**。它能让你的代码从“怎么做”变成“该用谁做”。

### 4.2 策略过多导致对象庞大怎么办？
*   **答**：如果策略对象非常多，可以考虑**按模块拆分**，或者在需要时才动态加载。在现代前端工程中，可以将不同的策略写在不同的文件中，通过 `import` 汇总。

### 4.3 策略模式和状态模式（State Pattern）很像，如何区分？
*   **答**：这是最容易混淆的一对。
    *   **策略模式**：不同的策略之间是**平等、平行**的。你（调用者）主动选择用 A 还是用 B（例如：计算运费，你选顺丰还是圆通）。
    *   **状态模式**：状态之间通常有**内部的联系和转换**。对象在内部根据条件自动切换状态（例如：电梯的“上升”、“下降”、“停止”状态）。

### 4.4 什么时候不应该使用策略模式？
*   **答**：如果你的判断逻辑非常简单，且几乎永远不会变（例如只有 2 个简单的分支），那么直接写 `if-else` 反而更清晰。**不要为了设计模式而设计模式**，避免过度封装。

