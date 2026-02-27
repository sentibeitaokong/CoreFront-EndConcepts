# 模板方法模式

## 1. 核心概念与价值

模板方法模式是一种**基于继承**的代码复用技术，它在父类中封装了不变的部分，而将可变的部分交给子类去实现。

| 角色 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **抽象类 (Abstract Class)** | 定义了算法的**轮廓**（模板方法），并声明了一些抽象操作供子类实现。 | **考卷模板**。包含了所有题目，但没有写答案。 |
| **具体类 (Concrete Class)** | 实现父类中定义的抽象操作，完成特定业务逻辑。 | **学生填写的考卷**。题目（流程）一样，但答案（实现）不同。 |
| **钩子 (Hooks)** | 在父类中定义的、默认执行或返回特定值的方法，子类可以视情况决定是否覆盖。 | **附加题**。你可以选做，也可以不做。 |

## 2. 模式结构：在 JS 中的实现

虽然 JavaScript 原生没有 `abstract` 关键字，但我们通常通过在父类方法中抛出错误来模拟抽象方法。

**代码实现示例：制作饮品**

制作咖啡和茶的流程非常相似：`烧水 -> 冲泡 -> 倒进杯子 -> 加调料`。

```js
// 1. 抽象父类：定义算法骨架
class Beverage {
  // 模板方法：封装了固定算法步骤
  init() {
    this.boilWater();
    this.brew(); // 抽象
    this.pourInCup();
    this.addCondiments(); // 抽象
  }

  boilWater() { console.log("把水烧开"); }
  pourInCup() { console.log("倒进杯子"); }

  // 模拟抽象方法，强制子类实现
  brew() { throw new Error("子类必须重写 brew 方法"); }
  addCondiments() { throw new Error("子类必须重写 addCondiments 方法"); }
}

// 2. 具体类：实现特定步骤
class Coffee extends Beverage {
  brew() { console.log("用沸水冲泡咖啡"); }
  addCondiments() { console.log("加糖和牛奶"); }
}

class Tea extends Beverage {
  brew() { console.log("用 80 度水泡茶"); }
  addCondiments() { console.log("加柠檬"); }
}

// 3. 使用
const myCoffee = new Coffee();
myCoffee.init(); // 按照 Beverage 定义的步骤执行
```

## 3. 实战场景

| 场景 | 模板方法模式的应用 |
| :--- | :--- |
| **UI 组件生命周期** | React/Vue 的生命周期钩子（如 `mounted`, `updated`）就是典型的模板方法。框架定义了挂载流程，开发者通过实现这些钩子来插入自定义逻辑。 |
| **SDK/插件开发** | 定义一个基础请求类，规定好 `鉴权 -> 发送 -> 处理结果 -> 错误上报` 的流程，具体业务插件只需实现鉴权和处理逻辑。 |
| **自动化测试框架** | 定义 `setup -> test -> teardown` 流程，具体的测试脚本只需要填写中间的 `test` 部分。 |

## 4. 进阶：钩子 (Hooks) 的威力

钩子方法让子类能够对算法的某个步骤进行“有条件的控制”。

```js
class BeverageWithHook extends Beverage {
  async init() {
    this.boilWater();
    this.brew();
    this.pourInCup();
    // 只有钩子返回 true 时才执行加调料
    if (this.customerWantsCondiments()) {
      this.addCondiments();
    }
  }

  // 默认钩子：默认需要加调料
  customerWantsCondiments() { return true; }
}

class BlackCoffee extends BeverageWithHook {
  brew() { console.log("冲泡黑咖啡"); }
  addCondiments() { /* 实际上不会被调用 */ }
  // 覆盖钩子：黑咖啡不需要调料
  customerWantsCondiments() { return false; }
}
```

## 5. 常见问题 (FAQ)

### 5.1 模板方法模式和策略模式有什么区别？
*   **模板方法模式**：基于**继承**。父类控制大流程，子类填充细节。结构相对固定。
*   **策略模式**：基于**组合**。通过将不同的算法对象（策略）注入到环境类中，算法之间是完全平等的，且可以动态切换。
*   **直观区别**：模板方法是“做一件事的多个步骤”，策略模式是“做一件事的多种方法”。

### 5.2 JavaScript 这种灵活的语言，一定需要继承来实现吗？
*   **答：不一定。** 在 JS 中，我们也可以使用**高阶函数**来实现类似的逻辑，而不必非要写复杂的类继承。你可以写一个接收多个函数作为参数的 `pipe` 或 `compose` 函数，这在函数式编程中更常见。

### 5.3 “好莱坞原则”是什么？
*   **答**：模板方法模式体现了著名的**好莱坞原则 (Don't call us, we'll call you)**。子类不需要调用父类，而是父类（高层组件）在合适的时候去调用子类（低层组件）。这有助于防止系统出现“环形依赖”。

### 5.4 什么时候该使用该模式？
*   **答**：当你发现有多个类包含几乎相同的逻辑，且这些逻辑的顺序固定时。如果不使用模板方法，这些逻辑的维护会变得非常困难，因为一旦流程改变，你需要修改每一个子类。

