# 中介者模式

## 1. 核心概念与价值

中介者模式将系统的通信模式从**“多对多”**简化为**“一对多”**。

| 维度 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **核心意图** | 减少对象之间的直接耦合，将复杂的联动逻辑集中管理。 | **机场塔台**。飞机之间不直接沟通，全都听塔台指挥。 |
| **主要优点** | 1. 极大地降低了类/组件之间的耦合；<br>2. 交互逻辑集中化，易于维护和修改；<br>3. 简化了对象的协议。 | **联合国**。各国不直接起冲突，通过联合国调停。 |
| **主要缺点** | 中介者对象可能会变得过于庞大和复杂（演变成“上帝对象”），难以维护。 | **过度集权**。如果塔台瘫痪，全机场都乱了。 |

## 2. 模式结构：从“网状”到“星型”

### 2.1 传统网状结构（混乱）
A 变了通知 B，B 变了影响 C，C 又可能去改 A。代码里充斥着 `this.parent.sibling.child...`。

### 2.2 中介者星型结构（清晰）
所有组件（同事类 Colleague）只与 **中介者 (Mediator)** 交流。中介者收到消息后，决定如何影响其他组件。

## 3. 代码实现示例：购物下单逻辑

假设一个购买页面，有“颜色选择”、“数量输入”、“剩余库存显示”和“提交按钮”。它们的逻辑高度联动。

```javascript
// 1. 中介者对象
const mediator = (function() {
  // 维护对所有组件的引用
  let colorSelect, numberInput, memorySelect, stockDisplay, submitBtn;

  return {
    // 初始化时注入组件
    setComponents: function({ color, number, memory, stock, button }) {
      colorSelect = color;
      numberInput = number;
      memorySelect = memory;
      stockDisplay = stock;
      submitBtn = button;
    },

    // 核心：所有联动逻辑都在这里！
    changed: function(obj) {
      const color = colorSelect.value;
      const num = numberInput.value;
      const memory = memorySelect.value;
      const stock = stockData[color][memory]; // 假设有库存数据

      if (obj === colorSelect || obj === memorySelect) {
        stockDisplay.innerHTML = stock;
      }

      if (num > stock) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = "库存不足";
      } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "加入购物车";
      }
    }
  };
})();

// 2. 组件类（同事类）：它们不互相认识，只认识中介者
class Component {
  constructor(name) {
    this.name = name;
    this.value = '';
  }
  change() {
    mediator.changed(this); // 发生变化时，只管告诉中介者
  }
}

// 3. 使用
const colorSel = new Component('color');
const numInp = new Component('number');
// ... 初始化逻辑
mediator.setComponents({ color: colorSel, number: numInp, ... });
```

## 4.  模式辨析：中介者 vs 发布-订阅 (Pub-Sub)

这两个模式非常像，都是为了解耦，但重点不同：

| 特性 | 发布-订阅模式 | 中介者模式 |
| :--- | :--- | :--- |
| **通信方向** | **多向**。发布者和订阅者通过调度中心自由交换消息。 | **双向**。组件发送消息给中介者，中介者指挥其他组件。 |
| **逻辑存储** | 调度中心不处理逻辑，只负责分发。 | **逻辑高度集中**。中介者内部包含复杂的业务规则。 |
| **解耦程度** | 极高。完全互不相识。 | 较高。但中介者必须了解所有组件的接口。 |
| **典型代表** | Vue 事件总线、Redux。 | **Vuex/Pinia (Actions 逻辑层)**。 |

## 5. 常见问题 (FAQ)

### 5.1 中介者模式在现代前端（Vue/React）中还有用吗？
*   **答：非常有用，但形式变了。**
    *   在传统的组件化开发中，如果你有大量的“父子/兄弟组件”传参和回调，那就是典型的网状结构。
    *   **Vuex / Redux / Pinia** 本质上就是中介者模式的演进。所有的组件状态都在 Store（中介者）中管理，组件只负责触发 Action（发送消息），Store 负责处理逻辑并分发状态更新。

### 5.2 什么时候不该使用中介者模式？
*   **答**：如果你的系统组件只有 3-5 个，且交互逻辑很简单。强行引入中介者会增加不必要的抽象层，导致代码变得晦涩难懂。**“中介者膨胀”** 是该模式最危险的后果。

### 5.3 如何解决中介者对象（Mediator）过大的问题？
*   **答**：**分而治之**。
    *   不要创建一个全局的、管天管地的巨大中介者。
    *   应该根据业务模块，创建多个**局部中介者**（类似于 Vuex 的 Modules）。每个模块的中介者只负责管理自己领地内的组件交互。

### 5.4 中介者模式能和观察者模式结合吗？
*   **答：可以，且经常结合。**
    *   组件作为“观察者”订阅中介者的消息；中介者监听组件的变动。这种结合能让代码更加灵活。

