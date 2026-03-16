---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# **[`useId`](https://zh-hans.react.dev/reference/react/useId):无障碍属性与SSR完美水合的唯一标识符**

在现代 Web 开发中，为了保证良好的无障碍访问体验（Accessibility, a11y），我们需要通过 `id` 属性将 `<label>` 与 `<input>` 绑定，或者通过 `aria-describedby` 关联提示信息。然而，在组件化和服务器端渲染（SSR）的时代，如何优雅且安全地生成全局唯一的 ID 成为一个棘手的难题。

`useId` 正是 React 18 专门为解决“组件级唯一标识符”和“SSR 水合不匹配”而推出的专属 Hook。

## 1. 核心概念与基础语法

```js
const id = useId()
```

### 1.1 基本定义与应用场景

`useId` 是一个不需要任何参数的 Hook，它在每次组件挂载时，会返回一个**在整个 React 应用程序级别全局唯一**的字符串。

**核心应用场景**：为 HTML 元素的无障碍属性（如 `id`、`htmlFor`、`aria-labelledby`）提供稳定、唯一的绑定值。

```jsx
import { useId } from 'react';

function PasswordField() {
  // 1. 调用 useId 获取唯一标识符，例如 ":r0:"
  const passwordHintId = useId();

  return (
    <div>
      <label>
        密码:
        {/* 2. 将 input 的 aria-describedby 与提示信息的 id 进行硬绑定 */}
        <input type="password" aria-describedby={passwordHintId} />
      </label>
      {/* 屏幕阅读器在聚焦输入框时，会自动朗读出这段提示 */}
      <p id={passwordHintId}>密码必须包含至少 8 个字符及 1 个特殊符号。</p>
    </div>
  );
}
```

## 2. 核心进阶：解决 SSR 水合（Hydration）不匹配难题

在 React 18 之前，开发者为了保证同一个组件被多次复用时 ID 不冲突，通常会使用 `Math.random()` 或者外部库（如 `uuid`）来生成 ID。但在支持 SSR（如 Next.js, Remix）的项目中，这是极其致命的。

### 2.1 痛点场景：Hydration Mismatch（水合报错）

**痛点场景**：如果使用随机数，服务器端在生成 HTML 时会执行一次（比如算出 `id="0.123"`），当这段 HTML 发送到浏览器，React 客户端在接管（Hydration/水合）时又会执行一次代码（算出了 `id="0.456"`）。React 一对比发现客户端和服务器算出的 ID 不一样，就会在控制台抛出严重的红色警告，甚至导致视图渲染崩溃。

**解决原则**：**抛弃一切随机数和全局计数器，统一使用 `useId`。React 底层通过组件在树结构中的相对位置来生成这个 ID，从而保证它在服务器和客户端绝对一致！**

```jsx
// ❌ 错误示范 (水合噩梦)：千万不要在组件里用随机数生成 ID
function BadInput() {
  // 服务器算出 0.1，客户端算出 0.9，直接导致 Hydration 报错！
  const id = Math.random().toString(); 
  return <input id={id} />;
}

// ✅ 正确示范 (SSR 安全)：
function GoodInput() {
  // useId 保证了无论是服务器渲染还是客户端接管，生成的值完全一模一样
  const id = useId(); 
  return <input id={id} />;
}
```

## 3. 高阶进阶：多前缀/后缀复用优化

### 3.1 突破死穴：一个组件内需要多个 ID 怎么办？

**痛点场景**：假设你编写了一个复杂的“注册表单”组件，内部包含了“用户名”、“密码”、“确认密码”三个输入框。难道你需要调用三次 `useId()` 吗？虽然可以，但显得代码十分冗余。

**解决原则**：**在一个组件内部，你只需要调用一次 `useId()` 作为基础前缀，然后通过字符串模板为不同的元素拼接唯一的后缀即可。** 这样不仅性能更好，代码也更干净。

```jsx
import { useId } from 'react';

function RegistrationForm() {
  // ✅ 黄金法则：只生成一个基础 ID 作为“命名空间”
  const formId = useId();

  return (
    <form>
      <label htmlFor={`${formId}-username`}>用户名</label>
      <input id={`${formId}-username`} type="text" />

      <label htmlFor={`${formId}-password`}>密码</label>
      <input id={`${formId}-password`} type="password" />

      <label htmlFor={`${formId}-confirm`}>确认密码</label>
      <input id={`${formId}-confirm`} type="password" />
    </form>
  );
}
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 我可以用 `useId` 生成的值作为列表渲染时的 `key` 吗？
*   **答**：**绝对不行！这是最常见的新手灾难。**
    *   React 的 `key` 必须与**数据本身**的身份绑定（例如数据库里的 `user.id`）。
    *   `useId` 只是用来标识当前这次渲染中某个“坑位”的标记。如果你的列表数据发生了排序、插入或删除，组件虽然没变但数据换了位置，使用 `useId` 会导致 React 彻底混乱，产生极其诡异的渲染状态复用 Bug。
    *   **避坑方案**：列表渲染的 `key` 永远只能来自于你的数据（如 `item.id`）。如果没有 ID，宁可使用 `index`（仅限于不改变顺序的静态列表），也绝不能用 `useId`。

### 4.2 我可以用它生成的 ID 配合 `document.getElementById()` 来手动抓取 DOM 元素吗？
*   **答**：**强烈不建议。**
    *   React 是一个声明式的 UI 库。如果你需要访问原生的 DOM 节点（比如为了让它 `focus` 或测量它的尺寸），你应当使用 React 提供的 **`useRef`** Hook。
    *   此外，`useId` 生成的字符串通常包含冒号（例如 `:r0:`、`:r2a:`）。在 HTML 中，`id` 包含冒号是完全合法的；但在 CSS 选择器中（`querySelector`），冒号被视为伪类选择器。如果你非要用原生 JS 去抓取它，你还必须手动转义（写成 `document.querySelector('\\:r0\\:')`），极其痛苦。
    *   **避坑方案**：不要将 `useId` 用于任何 CSS 样式选择器或原生 DOM 查询。它生来就是专门服务于无障碍属性绑定的。

### 4.3 为什么我控制台打印出来的 ID 长得像 `:r1:`、`:r2a:` 这种带冒号的怪异字符串？
*   **答**：这是 React 为了保证局部唯一性和水合性能而设计的**内部编码格式**。
    *   这些字符代表了组件在 React 渲染树中的具体路径。带字母的格式通常出现在开启了并发特性（Suspense、useTransition）的分支中。
    *   **避坑方案**：永远不要去解析这个字符串，也不要依赖它的具体格式。把它当作一个黑盒字符串直接赋给属性即可。
