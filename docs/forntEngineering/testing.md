---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# 自动化测试 (Automated Testing)

## 1. 核心概念与测试金字塔

在现代前端工程化中，自动化测试是保障代码质量、赋予团队重构底气、实现 CI/CD 持续交付的**唯一物理防线**。没有自动化测试的重构，无异于蒙眼狂奔。

业界公认的测试策略是**“测试金字塔 (Testing Pyramid)”**。它将测试分为三个核心层级，越底层的测试运行越快、成本越低；越顶层的测试越接近真实用户、置信度越高。

| 测试层级 | 核心目标与特性 | 占整个项目的理想比例 | 典型工具 |
| :--- | :--- | :--- | :--- |
| **单元测试 (Unit Test)** | 测试极其独立的纯函数、Hooks、Vuex/Redux 状态或单一的基础 UI 组件。运行极快，排错极其精准。 | **70%** (基石) | `Vitest`, `Jest` |
| **集成测试 (Integration)** | 测试多个模块或组件组合在一起时的交互逻辑（如：组件+状态管理+Mock 路由）。 | **20%** (桥梁) | `Testing Library` |
| **端到端测试 (E2E Test)** | 打开真实的无头浏览器，像真实用户一样点击、输入、跳转。防范极其复杂的系统级崩溃。运行慢、维护成本高。 | **10%** (塔尖) | `Playwright`, `Cypress` |

## 2. 主流测试框架与生态链

### 2.1 测试运行器与断言库 (Test Runner & Assertion)
*   **Jest**：Facebook 出品。过去十年的前端测试霸主。开箱即用，自带断言库（`expect`）、Mock 机制和覆盖率报告。缺点是体积庞大，且在现代 ESM 环境下配置较繁琐。
*   [**Vitest**](https://cn.vitest.dev/guide/)：**当前世代的绝对首选**。由 Vite 团队打造，底层直接复用你项目里的 `vite.config.js`。启动速度极快（利用 esbuild），API 100% 兼容 Jest，是现代前端架构的标配。

### 2.2 DOM 与组件测试工具 (Component Testing)
*   **jsdom / happy-dom**：在 Node.js 终端里“伪造”一个浏览器 DOM 环境（因为 Node 原生没有 `window` 和 `document`），让测试脚本能跑起来。
*   **Testing Library**：(`@testing-library/vue` 或 `@testing-library/react`)。它的核心哲学是：**不要测试组件的内部实现细节（如 data/state），而是测试用户能看到的 DOM 表现。**

### 2.3 端到端测试 (E2E)
*   **Cypress**：提供极佳的可视化 UI 调试界面，开创了现代 E2E 测试的先河。
*   **Playwright**：微软出品的**新一代王者**。原生支持多标签页、iframes，跨浏览器（Chromium, WebKit, Firefox）并行测试能力极强，速度远超 Cypress。

## 3. [核心测试场景实战](https://github.com/sentibeitaokong/vitest)

### 3.1 单元测试：纯函数与 Mock (Vitest / Jest)

测试的核心是：给定输入，断言输出。遇到网络请求等不可控的外部依赖时，必须使用 **Mock (模拟)** 技术将其隔离。

```js
import { describe, it, expect, vi } from 'vitest';
import { calculateTotal, fetchUserData } from './utils.js';

// 1. 测试纯粹的业务计算逻辑 (最便宜、最该写的测试)
describe('calculateTotal', () => {
  it('应该正确计算包含税费的总价', () => {
    const price = 100;
    const taxRate = 0.1;
    // 断言 (Assertion)
    expect(calculateTotal(price, taxRate)).toBe(110);
  });
});

// 2. 测试包含异步网络请求的函数 (使用 Mock 拦截)
describe('fetchUserData', () => {
  it('应该能正确处理后端返回的用户数据', async () => {
    // 拦截全局的 fetch，强行返回伪造的假数据
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ id: 1, name: 'Alice' })
    });

    const user = await fetchUserData(1);
    
    // 断言函数是否被正确调用了 1 次
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // 断言返回值
    expect(user.name).toEqual('Alice');
  });
});
```

### 3.2 组件集成测试 (Testing Library)

模拟用户点击按钮，观察 DOM 结构是否发生变化。

```js
import { render, screen, fireEvent } from '@testing-library/vue';
import Counter from './Counter.vue';

describe('Counter.vue', () => {
  it('点击按钮后，数字应该加 1', async () => {
    // 1. 渲染组件到虚拟 DOM 中
    render(Counter);

    // 2. 查询 DOM 元素 (以用户的视角寻找屏幕上的文字)
    const button = screen.getByText('点击增加');
    const display = screen.getByTestId('count-value');

    expect(display.textContent).toBe('0'); // 初始状态

    // 3. 触发真实交互事件
    await fireEvent.click(button);

    // 4. 再次断言 DOM 更新后的状态
    expect(display.textContent).toBe('1');
  });
});
```

### 3.3 E2E 端到端测试 (Playwright)

完全黑盒测试，脱离代码层面，直接在无头浏览器中进行。

```js
import { test, expect } from '@playwright/test';

test('用户登录核心主流程', async ({ page }) => {
  // 1. 访问真实页面
  await page.goto('http://localhost:3000/login');

  // 2. 模拟用户输入
  await page.fill('input[name="username"]', 'admin');
  await page.fill('input[name="password"]', '123456');

  // 3. 模拟点击登录
  await page.click('button[type="submit"]');

  // 4. 断言：URL 是否跳转到了后台，屏幕上是否出现了欢迎词
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('欢迎回来, admin');
});
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 TDD (测试驱动开发) 这么火，前端业务开发必须用 TDD 吗？
*   **答**：**强烈不建议在 UI 业务层生搬硬套 TDD。**
    *   **TDD 原则**：先写测试用例（此时必定报错），再写业务代码让测试通过。
    *   **前端的痛点**：前端 UI 的长相、DOM 结构、甚至交互逻辑每天都在随着产品经理的心情变化。如果你在写 UI 前先写好测试，第二天需求一改，业务代码要改，测试代码要跟着全盘重写，维护成本极高，甚至会导致团队为了 KPI 写出无意义的垃圾测试。
    *   **最佳实践**：对**极其稳定且复用率极高的核心库**（如正则校验、时间格式化、复杂的 DP 算法、内部自研 UI 组件库的底层逻辑）使用 TDD；对变动频繁的页面级业务代码，只做**核心主链路的 E2E 测试**。

### 4.2 测试覆盖率 (Code Coverage) 必须达到 100% 吗？
*   **答**：**绝对不需要，这是一种严重的“数字内耗”。**
    *   当你把覆盖率从 0% 提升到 70% 时，你拦截了绝大多数致命 Bug，收益极大。
    *   但当你试图从 80% 提升到 100% 时，你往往需要花费数倍的时间去写极其变态的 Mock，仅仅为了触发某一个极低概率的 `if/catch` 分支。这种边缘测试极其脆弱（Brittle Tests），收益极低。
    *   **行业标准**：核心工具函数要求 90%+ 覆盖率；普通业务项目，整体语句覆盖率达到 **60% - 80%** 即可。

### 4.3 什么是“脆弱的测试 (Flaky Tests)”？如何解决 E2E 测试经常偶尔报错的问题？
*   **答**：Flaky Tests 是指**代码明明没变，但测试跑 10 次，会有 2 次莫名其妙失败**。这是 E2E 测试最让人崩溃的通病。
    *   **产生原因**：网络请求延迟波动、定时器（`setTimeout`）执行时间偏差、CSS 动画还没执行完程序就去点击了按钮。
    *   **避坑指南**：
        1. **绝对不要使用 `sleep(2000)`这种硬编码等待！** 必须使用框架提供的基于状态的等待等待机制（如 Playwright 的 `await page.waitForSelector('.loading-done')`）。
        2. 冻结时间：在测试包含日期逻辑或定时器的代码时，使用测试框架的虚拟时间（如 `vi.useFakeTimers()`）。
        3. 阻断外部不可控因素：对于非核心的第三方不可控网络（如请求外网埋点/广告接口），在 E2E 层面也应当进行拦截 Mock。

### 4.4 前端测试里 Mock 网络请求太痛苦了，有什么终极方案吗？
*   **答**：传统做法是使用 `jest.mock('axios')` 来拦截请求库，但这会导致测试代码里充斥着大量的底层实现细节，一旦哪天项目把 axios 换成了 fetch，所有的测试瞬间全挂。
    *   **终极方案是使用 MSW (Mock Service Worker)。**
    *   它在浏览器的网络层或 Node.js 的原生 Http 请求层进行物理拦截。你的业务代码和测试代码完全不需要知道自己被 Mock 了，只要向 `/api/user` 发请求，MSW 就会在底层拦截并返回假数据。这使得测试代码极其纯净，且与具体的请求库彻底解耦。
