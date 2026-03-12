---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 组件的导入与导出 (Import & Export)

## 1. 核心概念与本质

在 React 的生态中，“组件”在物理层面上就是一个个独立的 JavaScript/TypeScript 文件。要想把散落在各个文件里的“砖块”拼装成完整的页面，我们必须依赖 **ES Modules (ESM)** 标准中的 `import` 和 `export` 语法。

这不仅关乎代码能不能跑起来，更关乎你的项目结构是否清晰、打包体积是否足够小（Tree Shaking 强依赖于它）。

| 导出方式 | 语法特征 | 使用场景与优势 |
| :--- | :--- | :--- |
| **默认导出 (Default Export)** | `export default xxx` | **最常见**。一个文件里**只能有一个**默认导出。适用于该文件只对外提供**一个主角**（如一个完整的页面组件、一个核心 UI 组件）的情况。 |
| **具名导出 (Named Export)** | `export function xxx` | 一个文件里**可以有无数个**具名导出。适用于该文件是一个“工具箱”或“全家桶”（如一堆辅助函数、一组配套的微小组件，如 `Card.Title`, `Card.Body`）。 |

## 2. 导出与导入的实战范式

### 2.1 默认导出与导入 (Default)

这是构建基础 UI 组件最推荐的模式。它的特点是：**导入时，你可以给它起任何你喜欢的名字。**

**导出端：**
```jsx
// src/components/PrimaryButton.jsx

// 1. 先定义，再在文件末尾导出 (推荐，看着清爽)
function PrimaryButton() {
  return <button>Click Me</button>;
}
export default PrimaryButton;

// 2. 或者在定义时直接导出 (更紧凑)
// export default function PrimaryButton() { ... }
```

**导入端：**
```jsx
// src/App.jsx

// 因为它是 default，导入时可以随便起名 (但为了维护性，强烈建议保持原名)
import PrimaryButton from './components/PrimaryButton';

// 甚至可以叫这个名字，完全合法但不推荐
// import MyCoolBtn from './components/PrimaryButton'; 

function App() {
  return <PrimaryButton />;
}
```

### 2.2 具名导出与导入 (Named)

当一个文件提供了多个协同工作的组件时（例如构建一个复杂的 `Form` 体系，包含 `Form`, `FormItem`, `FormLabel`）。

**导出端：**
```jsx
// src/components/FormComponents.jsx

// 必须在定义的组件前面加 export 关键字
export function Form() {
  return <form>...</form>;
}

export function FormInput() {
  return <input />;
}

// 注意：这里没有 export default !
```

**导入端：**
```jsx
// src/App.jsx

// 🚨 必须使用大括号 {}，且名字必须和导出时【一模一样】！
import { Form, FormInput } from './components/FormComponents';

// 如果发生命名冲突，可以使用 `as` 关键字重命名
// import { Form as MyForm } from './components/FormComponents';

function App() {
  return (
    <Form>
      <FormInput />
    </Form>
  );
}
```

### 2.3 混合导出 (Mixed)

一个文件可以**同时**拥有 1 个默认导出和多个具名导出。这在 React 官方库中极其常见（比如 `import React, { useState } from 'react'`）。

```jsx
// src/components/Profile.jsx
export function ProfileAvatar() { return <img />; } // 具名
export function ProfileBio() { return <p>...</p>; } // 具名

export default function Profile() {                 // 默认 (主角)
  return <div><ProfileAvatar /><ProfileBio /></div>;
}
```

```jsx
// 导入端：将默认导入放在大括号外面，具名导入放在大括号里面
import Profile, { ProfileAvatar } from './components/Profile';
```

## 3. 高阶架构技巧：桶文件 (Barrel Pattern / 统一出口)

当你的 `components` 目录下堆积了 50 个组件时，在别的页面里引入它们会极其痛苦，满屏都是密密麻麻的 `import`：
```jsx
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
// ... 灾难般的引入列表
```

**终极解法：使用 `index.js` 统一收口（Barrel Pattern）。**

在 `components` 文件夹下新建一个 `index.js`，它的唯一作用就是**把所有兄弟组件重新暴露出去**。

```jsx
// src/components/index.js (桶文件)

// 语法 A：引入别人的 default，并作为具名暴露出去
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';

// 语法 B：直接把别人所有的具名导出全部暴露出去
// export * from './Icons'; 
```

**现在，你的页面代码瞬间清爽了，且只需引入一次：**
```jsx
// src/pages/Home.jsx

// 🚨 注意：由于指向的是目录，Webpack/Vite 会自动去寻找该目录下的 index.js！
import { Button, Input, Modal } from '../../components';

function Home() {
  return <Button>提交</Button>;
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我到底该用 Default Export 还是 Named Export？
*   **答**：这是前端界极具争议的架构话题，但目前业界有明确的偏好趋势。
    *   **老派/官方文档风格**：推荐单个组件用 Default Export。理由是写起来省了 `{}`，看着像在引入一个完整的独立实体。
    *   **现代企业级/重构优化的趋势**：**越来越多的大厂开始全面拥抱 Named Export（具名导出），甚至完全抛弃 Default Export。**
    *   **为什么拥抱具名导出？**
        1. **强制命名一致性**：`export default` 允许导入时随便起名字，张三引入时叫 `import Btn`，李四引入时叫 `import MyBtn`，全局搜索时根本找不到谁用了这个组件，极其恶心。具名导出强制全局统一名字。
        2. **IDE 重构极度友好**：如果你用 VS Code 重命名了一个具名导出的组件，所有引用它的文件会自动更新名字。默认导出由于名字随便起，IDE 很难精准帮你自动重命名。
        3. **Tree-shaking 更安全**：具名导出在静态分析死代码时效率最高。

### 4.2 为什么我写了 `export default function()`，在别的地方引入时却报错 `does not contain a default export`？
*   **答**：这往往是由于文件的混用或打字失误引起的。
    *   **常见原因 1**：你确实忘了写 `default` 关键字。
    *   **常见原因 2（大坑）**：你使用了花括号去导入一个 `default` 导出的组件。
        *   **错误**：`import { MyComponent } from './MyComponent'`（花括号只会去寻找 `export function MyComponent` 的具名导出）。
        *   **正确**：`import MyComponent from './MyComponent'`（去掉花括号才是拿默认导出）。

### 4.3 `import React from 'react'`，现在 React 17/18 还需要写这句话吗？
*   **答**：**不再强制需要了。**
    *   **过去 (React 16 及以前)**：由于 JSX 的本质是 `React.createElement` 的语法糖。即便你在代码里没有直接用到 `React` 这个词，只要你写了 JSX，Babel 编译后就会强行调用 `React.createElement`。如果文件顶部没有 `import React`，程序直接报错 `React is not defined`。
    *   **现在 (React 17 的新 JSX 转换机制)**：现代编译器（如新版 Babel、Vite/esbuild、SWC）在底层实现了全新的转换逻辑。它们会在编译时**自动且悄悄地**帮你引入 `jsx-runtime` 来处理 JSX，彻底把你从每个文件都要写 `import React` 的体力劳动中解放了出来。*(除非你需要显式使用 `React.useState` 等具体的 API，但通常我们也是使用 `import { useState }` 解构引入的)*。

### 4.4 有些开源库的代码里写着 `export { Component as default }`，这是什么怪语法？
*   **答**：这通常出现在统一收口的 `index.js`（桶文件）中。
    *   它的意思是：我从别人那里拿到了一个名叫 `Component` 的具名变量，但我想把它当作我这个文件的**默认导出 (default)** 送给别人。
    *   同理，也经常见这种写法：`import * as React from 'react'`。这表示把 `react` 这个包里所有的具名导出，全部打包塞进一个叫做 `React` 的巨型对象中。这是兼容老旧 CommonJS 模块系统的常见 TS 兜底写法。
