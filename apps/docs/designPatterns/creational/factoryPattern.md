# 工厂模式

## 1. 核心价值：为什么要用工厂？

**核心定义**：工厂模式用一个专门的“**创建者**”来集中管理对象的创建。调用者只告诉工厂自己要什么（一个标识符或配置），由工厂决定实例化哪个具体类、怎么初始化，再把成品返回。它属于**创建型模式**，也是前端日常最常用的模式之一。

**关键角色**：

- **产品 (Product)**：被创建对象的统一抽象（约定好都具备哪些方法）；
- **具体产品 (Concrete Product)**：真正 `new` 出来的各个类；
- **工厂 (Factory)**：唯一知道“**什么条件造什么产品**”的角色，把 `switch`、映射表或子类等分支逻辑全部收拢在这里。

[width(13,46,41)]

| 维度         | 直接实例化 (`new`)                         | 使用工厂模式                             |
| :----------- | :----------------------------------------- | :--------------------------------------- |
| **耦合度**   | 高。调用者必须知道具体类名及其构造参数。   | 低。调用者只需知道一个简单的标识符。     |
| **扩展性**   | 差。新增一种类型需要修改所有调用处的代码。 | 好。只需在工厂内部增加逻辑，调用方无感。 |
| **逻辑复用** | 重复。创建逻辑散落在项目各处。             | 集中。所有创建逻辑封装在工厂内部。       |

把上面的取舍再摊开看，决定“**用不用工厂**”主要看这几项：

[width(15,85)]

| 维度           | 说明                                                                                   |
| :------------- | :------------------------------------------------------------------------------------- |
| **主要优点**   | 1. 解耦创建与使用；<br>2. 创建逻辑集中，改一处即可；<br>3. 便于测试（Mock 工厂即可）。 |
| **主要缺点**   | 1. 多了一层抽象，简单场景反而显得啰嗦；<br>2. 简单工厂新增类型时仍需改动工厂本身。     |
| **适用场景**   | 需要按条件创建多种同类对象、创建逻辑复杂或会被复用、希望调用方与具体类解耦。           |
| **不适用场景** | 只创建固定的一个对象、创建逻辑只有一两行、未来几乎不会新增类型。                       |

## 2. 模式分类与实现

在 JavaScript 中，由于其灵活的特性，工厂模式通常分为 **简单工厂**、**工厂方法** 和 **抽象工厂**，抽象程度依次递增。

### 2.1 简单工厂 (Simple Factory) —— 最常用

这种模式通过一个单一的工厂类/函数，根据传入的参数返回不同类的实例。

```js
class Admin {
  constructor() {
    this.name = '管理员'
    this.auth = ['read', 'write', 'delete']
  }
}

class Editor {
  constructor() {
    this.name = '编辑'
    this.auth = ['read', 'write']
  }
}

class User {
  constructor() {
    this.name = '普通用户'
    this.auth = ['read']
  }
}

// 工厂类
class UserFactory {
  static create(role) {
    switch (role) {
      case 'admin':
        return new Admin()
      case 'editor':
        return new Editor()
      case 'user':
        return new User()
      default:
        throw new Error('无效的角色')
    }
  }
}

// 调用者：我想要个编辑，但我不用管 Editor 类怎么写的
const myUser = UserFactory.create('editor')
console.log(myUser.name) // 输出: 编辑
```

### 2.2 工厂方法 (Factory Method)

简单工厂的缺点是：一旦要增加新角色，就必须修改 `switch` 逻辑。**工厂方法**通过将创建过程延迟到子类中，实现了更好的扩展性。

```js
class Factory {
  create() {
    throw new Error('必须由子类实现')
  }
}

class AdminFactory extends Factory {
  create() {
    return new Admin()
  }
}

class UserFactory extends Factory {
  create() {
    return new User()
  }
}

// 增加新角色时，只需新建一个具体的工厂类，无需改动原有代码
```

### 2.3 抽象工厂 (Abstract Factory) —— 造“一族”产品

- **抽象产品**：约定一族里每样产品必须具备哪些方法（如 `Button`、`Input`）；
- **抽象工厂**：约定“**这一族里能造出哪几样产品**”，只声明 `createXxx()` 方法，把具体实现交给子类。

```js
// 1. 抽象产品：约定一族里每样产品必须实现的方法
class Button {
  render() {
    throw new Error('必须由子类实现')
  }
}

class Input {
  render() {
    throw new Error('必须由子类实现')
  }
}

// 2. 具体产品：暗色主题的一整套
class DarkButton extends Button {
  render() {
    return '<button class="btn-dark">按钮</button>'
  }
}

class DarkInput extends Input {
  render() {
    return '<input class="input-dark" />'
  }
}

// 3. 具体产品：亮色主题的一整套
class LightButton extends Button {
  render() {
    return '<button class="btn-light">按钮</button>'
  }
}

class LightInput extends Input {
  render() {
    return '<input class="input-light" />'
  }
}

// 4. 抽象工厂：只声明“这一族能造出哪几样产品”
class ThemeFactory {
  createButton() {
    throw new Error('必须由子类实现')
  }

  createInput() {
    throw new Error('必须由子类实现')
  }
}

// 5. 具体工厂：一个工厂负责一个产品族
class DarkThemeFactory extends ThemeFactory {
  createButton() {
    return new DarkButton()
  }

  createInput() {
    return new DarkInput()
  }
}

class LightThemeFactory extends ThemeFactory {
  createButton() {
    return new LightButton()
  }

  createInput() {
    return new LightInput()
  }
}

// 6. 调用方只依赖抽象工厂，切换整套主题只改传参
function renderPage(factory) {
  const button = factory.createButton()
  const input = factory.createInput()
  console.log(button.render() + input.render())
}

renderPage(new DarkThemeFactory())
renderPage(new LightThemeFactory())
```

[width(13,29,30,28)]

| 模式         | 一个工厂负责创建           | 新增“品牌 / 平台 / 角色”时 | 新增“一种产品”时             |
| :----------- | :------------------------- | :------------------------- | :--------------------------- |
| **简单工厂** | 按参数造出多种具体类型     | 要改工厂内部的 `switch`    | 要改工厂内部的 `switch`      |
| **工厂方法** | 造**一种**产品（由子类定） | 新增一个工厂子类           | 每个工厂子类都要实现新方法   |
| **抽象工厂** | 造**一族**（多种）产品     | 新增一个具体工厂类         | 抽象工厂和每个具体工厂都要改 |

## 3. 实战应用场景

[width(17,83)]

| 场景              | 说明                                                                                |
| :---------------- | :---------------------------------------------------------------------------------- |
| **UI 组件库**     | 根据配置参数生成不同类型的组件（如 `Button`, `Input`, `Select`）。                  |
| **API 请求封装**  | 根据不同的环境参数（Test, Staging, Production）创建具有不同 BaseURL 的请求实例。    |
| **游戏开发**      | 根据关卡配置生成不同等级的敌人（Enemy A, Enemy B, Boss）。                          |
| **数据解析**      | 根据文件后缀（`.csv`, `.json`, `.xml`）创建对应的解析器对象。                       |
| **React 元素**    | `React.createElement(type, props, children)` 就是简单工厂：传入类型，返回元素对象。 |
| **DOM 节点**      | `document.createElement('div')` 按标签名返回不同类型的元素节点。                    |
| **状态管理**      | `createStore()` / `configureStore()` 按配置装配出带不同中间件的 store。             |
| **测试假数据**    | `createUser(role)` 在测试里按角色快速造出结构一致的 Mock 数据。                     |
| **日志 / 通知器** | 按环境返回控制台、文件或远程上报等不同的 logger 实现。                              |

## 4. 关键语言特性与易错点

工厂模式在 JS 里主要靠下面这些机制落地，也是面试常被追问的点。

[width(23,38,39)]

| 特性 / 写法                      | 说明                                                             | 易错点                                                           |
| :------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------- |
| `static` 方法                    | 工厂方法通常声明为 `static`，无需实例即可调用。                  | 用普通方法写会强迫调用者先造一个工厂实例，多此一举。             |
| 对象映射表                       | 用 `{ admin: () => new Admin() }` 查表，比长 `switch` 更易扩展。 | 忘记对 `default` 兜底，会因返回 `undefined` 让后续报错难以定位。 |
| 工厂不一定要 `new`               | 也可以返回对象字面量、单例或缓存对象。                           | 想用 `instanceof` 判断返回值时，字面量对象会失去预期的原型。     |
| `Object.freeze`                  | 可将工厂产出的对象冻结成只读。                                   | 冻结后调用方再赋值会静默失败（非严格模式），产生难查的 Bug。     |
| `instanceof`                     | 常用来校验工厂返回的产品类型。                                   | 跨 `iframe` / realm 时判断会失效（原型来自不同全局环境）。       |
| 简单工厂 vs 工厂方法 vs 抽象工厂 | 三者抽象程度递增                                                 | 容易把“**工厂方法**”说成“**抽象工厂**”。                         |

## 5. 常见问题 (FAQ)

### 5.1 工厂模式和构造函数模式有什么区别？

构造函数模式（使用 `new`）是“**亲力亲为**”，你必须清楚地知道你要造什么。而工厂模式是“**代理下单**”，你告诉工厂你的需求，它返回给你一个符合标准的产品。

### 5.2 什么时候不该使用工厂模式？

如果你的对象创建逻辑极其简单（例如只是设置一两个属性），直接使用 `new` 或者对象字面量 `{}` 会更直接。**避免为了设计模式而增加代码的抽象复杂度。**

### 5.3 工厂模式会影响性能吗？

在 JavaScript 中，这种封装带来的性能损耗微乎其微。相比之下，它带来的**代码可维护性**和**测试便利性**（Mock 对象非常容易）的提升要重要得多。

### 5.4 什么是抽象工厂 (Abstract Factory)？

它是工厂模式的最高级形式。简单工厂是造“**手机**”，而抽象工厂是造“**一套产品生态**”（如：华为手机 + 华为耳机 + 华为电脑）。它通常用于处理具有多个产品等级结构的复杂系统。
