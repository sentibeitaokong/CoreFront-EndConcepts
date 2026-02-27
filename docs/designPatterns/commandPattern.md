# 命令模式

## 1. 核心概念与角色

命令模式的精髓在于：**将“发起请求的对象”与“执行请求的对象”彻底解耦。**

**四个核心角色**

| 角色 | 描述 | 形象比喻 |
| :--- | :--- | :--- |
| **命令 (Command)** | 定义执行操作的接口，通常包含 `execute` 和 `undo` 方法。 | **点菜单**。上面写着要做的菜。 |
| **接受者 (Receiver)** | 真正执行业务逻辑的对象。它知道如何完成请求。 | **厨师**。真正炒菜的人。 |
| **调用者 (Invoker)** | 负责触发命令，但不关心命令的具体实现和执行者。 | **服务员**。负责下单，但不关心菜是怎么炒的。 |
| **客户端 (Client)** | 创建具体的命令对象，并设置其接收者。 | **顾客**。点菜并指定给哪个厨师（如果有的话）。 |

## 2. 代码实现示例：简易文本编辑器

在这个例子中，我们将实现“加粗”操作，并支持**撤销 (Undo)** 功能。

```js
// 1. 接受者 (Receiver)：具体的业务逻辑
class Editor {
  constructor() { this.content = ""; }
  append(text) { 
    this.content += text;
    console.log("当前内容:", this.content);
  }
  deleteLast(length) {
    this.content = this.content.slice(0, -length);
    console.log("撤销后内容:", this.content);
  }
}

// 2. 命令类 (Command)
class AppendCommand {
  constructor(editor, text) {
    this.editor = editor;
    this.text = text;
  }
  execute() {
    this.editor.append(this.text);
  }
  undo() {
    this.editor.deleteLast(this.text.length);
  }
}

// 3. 调用者 (Invoker)：管理命令
class CommandManager {
  constructor() {
    this.history = []; // 命令历史栈，用于撤销
  }
  execute(command) {
    command.execute();
    this.history.push(command);
  }
  undo() {
    const command = this.history.pop();
    if (command) command.undo();
  }
}

// 4. 客户端 (Client) 使用
const myEditor = new Editor();
const manager = new CommandManager();

const cmd1 = new AppendCommand(myEditor, "Hello ");
const cmd2 = new AppendCommand(myEditor, "World!");

manager.execute(cmd1); // 当前内容: Hello 
manager.execute(cmd2); // 当前内容: Hello World!
manager.undo();        // 撤销后内容: Hello 
```

## 3. 实战场景

| 场景 | 说明 |
| :--- | :--- |
| **撤销/重做 (Undo/Redo)** | 这是命令模式最经典的应用。通过保存命令对象栈，可以轻松回溯。 |
| **宏命令 (Macro Command)** | 将多个命令组合成一个“宏”。执行一个宏命令，就会依次执行内部的所有子命令（如 PS 的“动作”）。 |
| **队列请求 / 延迟执行** | 命令被封装成对象后，可以放入队列中排队执行，或者在特定时间点触发。 |
| **GUI 菜单与按钮** | 一个通用的按钮组件不应该绑定具体的逻辑。它只需要持有一个命令对象，在点击时调用 `command.execute()` 即可。 |


## 4. 模式优缺点分析 

**优点**
1.  **极度解耦**：调用者完全不需要了解接受者的接口。
2.  **扩展性极强**：增加新命令无需修改现有代码，符合“开闭原则”。
3.  **功能丰富**：原生支持复合命令（宏）、回滚操作、操作日志。

**缺点**
1.  **代码量增加**：每一个简单的操作都需要定义一个命令类，对于小型项目可能显得“过度设计”。
2.  **类膨胀**：如果系统操作非常多，会产生大量的具体命令类。

## 5. 常见问题 (FAQ)

### 5.1 命令模式和简单的“回调函数”有什么区别？
*   **答**：回调函数是过程式的。而命令模式是**面向对象**的。
    *   **回调**：我给你一个函数，你到时候跑一下。
    *   **命令模式**：我给你一个**包含状态**的对象。这个对象不仅能跑，还能**撤销**，能被**存储**到数据库，能被**序列化**。如果需要“撤销”或“宏”，必须用命令模式。

### 5.2 在 JavaScript 中，非要写 `class` 吗？
*   **答：不一定。** JavaScript 函数是一等公民，你可以用闭包来模拟命令模式：
    ```js
    function createCommand(receiver, action) {
      return {
        execute: () => receiver[action](),
        undo: () => receiver.reverse[action]()
      }
    }
    ```
    这种方式更轻量，但在处理复杂的撤销逻辑和状态管理时，显式的类结构往往更易维护。

### 5.3 如何实现“重做 (Redo)”功能？
*   **答**：你需要**两个栈**。
    1.  执行命令时，压入 `historyStack`。
    2.  撤销（Undo）时，从 `historyStack` 弹出，执行 `undo()`，并压入 `redoStack`。
    3.  重做（Redo）时，从 `redoStack` 弹出，执行 `execute()`，并重新压入 `historyStack`。

### 5.4 什么时候不应该使用命令模式？
*   **答**：如果你的应用只是简单的 CRUD（增删改查），且不需要撤销功能。如果直接调用方法就能清晰表达意图，强行引入命令模式只会让逻辑变得支离破碎。


