# 工厂模式

## 1. 核心价值：为什么要用工厂？

| 维度 | 直接实例化 (`new`) | 使用工厂模式 |
| :--- | :--- | :--- |
| **耦合度** | 高。调用者必须知道具体类名及其构造参数。 | 低。调用者只需知道一个简单的标识符。 |
| **扩展性** | 差。新增一种类型需要修改所有调用处的代码。 | 好。只需在工厂内部增加逻辑，调用方无感。 |
| **逻辑复用** | 重复。创建逻辑散落在项目各处。 | 集中。所有创建逻辑封装在工厂内部。 |

## 2. 模式分类与实现

在 JavaScript 中，由于其灵活的特性，工厂模式通常分为 **简单工厂** 和 **工厂方法**。

### 2.1 简单工厂 (Simple Factory) —— 最常用
这种模式通过一个单一的工厂类/函数，根据传入的参数返回不同类的实例。

**实战场景：用户权限系统**
```javascript
class Admin {
  constructor() { this.name = "管理员"; this.auth = ["read", "write", "delete"]; }
}

class Editor {
  constructor() { this.name = "编辑"; this.auth = ["read", "write"]; }
}

class User {
  constructor() { this.name = "普通用户"; this.auth = ["read"]; }
}

// 工厂类
class UserFactory {
  static create(role) {
    switch (role) {
      case 'admin': return new Admin();
      case 'editor': return new Editor();
      case 'user': return new User();
      default: throw new Error('无效的角色');
    }
  }
}

// 调用者：我想要个编辑，但我不用管 Editor 类怎么写的
const myUser = UserFactory.create('editor');
console.log(myUser.name); // 输出: 编辑
```

### 2.2 工厂方法 (Factory Method)
简单工厂的缺点是：一旦要增加新角色，就必须修改 `switch` 逻辑。**工厂方法**通过将创建过程延迟到子类中，实现了更好的扩展性。

```javascript
class Factory {
  create() { throw new Error('必须由子类实现'); }
}

class AdminFactory extends Factory {
  create() { return new Admin(); }
}

class UserFactory extends Factory {
  create() { return new User(); }
}

// 增加新角色时，只需新建一个具体的工厂类，无需改动原有代码
```

## 3. 实战应用场景 

| 场景 | 说明 |
| :--- | :--- |
| **UI 组件库** | 根据配置参数生成不同类型的组件（如 `Button`, `Input`, `Select`）。 |
| **API 请求封装** | 根据不同的环境参数（Test, Staging, Production）创建具有不同 BaseURL 的请求实例。 |
| **游戏开发** | 根据关卡配置生成不同等级的敌人（Enemy A, Enemy B, Boss）。 |
| **数据解析** | 根据文件后缀（`.csv`, `.json`, `.xml`）创建对应的解析器对象。 |

## 4. 常见问题 (FAQ)

### 4.1 工厂模式和构造函数模式有什么区别？
*   **答**：构造函数模式（使用 `new`）是“亲力亲为”，你必须清楚地知道你要造什么。而工厂模式是“代理下单”，你告诉工厂你的需求，它返回给你一个符合标准的产品。

### 4.2 什么时候不该使用工厂模式？
*   **答**：如果你的对象创建逻辑极其简单（例如只是设置一两个属性），直接使用 `new` 或者对象字面量 `{}` 会更直接。**避免为了设计模式而增加代码的抽象复杂度。**

### 4.3 工厂模式会影响性能吗？
*   **答**：在 JavaScript 中，这种封装带来的性能损耗微乎其微。相比之下，它带来的**代码可维护性**和**测试便利性**（Mock 对象非常容易）的提升要重要得多。

### 4.4 什么是抽象工厂 (Abstract Factory)？
*   **答**：它是工厂模式的最高级形式。简单工厂是造“手机”，而抽象工厂是造“一套产品生态”（如：华为手机 + 华为耳机 + 华为电脑）。它通常用于处理具有多个产品等级结构的复杂系统。


