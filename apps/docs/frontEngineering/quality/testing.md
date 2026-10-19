---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# 自动化测试 (Automated Testing)

## 1. 核心概念与测试金字塔

在现代前端工程化中，自动化测试是保障代码质量、赋予团队重构底气、实现 CI/CD 持续交付的**唯一物理防线**。没有自动化测试的重构，无异于蒙眼狂奔。

业界公认的测试策略是 “**测试金字塔 (Testing Pyramid)**”。它将测试分为三个核心层级，越底层的测试运行越快、成本越低；越顶层的测试越接近真实用户、置信度越高。

[width(18,43,15,24)]

| 测试层级                   | 核心目标与特性                                                                                       | 占整个项目的理想比例 | 典型工具                |
| :------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------- | :---------------------- |
| **单元测试 (Unit Test)**   | 测试极其独立的纯函数、Hooks、Vuex/Redux 状态或单一的基础 UI 组件。运行极快，排错极其精准。           | **70%** (基石)       | `Vitest`, `Jest`        |
| **集成测试 (Integration)** | 测试多个模块或组件组合在一起时的交互逻辑（如：组件+状态管理+Mock 路由）。                            | **20%** (桥梁)       | `Testing Library`       |
| **端到端测试 (E2E Test)**  | 打开真实的无头浏览器，像真实用户一样点击、输入、跳转。防范极其复杂的系统级崩溃。运行慢、维护成本高。 | **10%** (塔尖)       | `Playwright`, `Cypress` |

## 2. 主流测试框架与生态链

### 2.1 测试运行器与断言库 (Test Runner & Assertion)

- **Jest**：Facebook 出品。过去十年的前端测试霸主。开箱即用，自带断言库（`expect`）、Mock 机制和覆盖率报告。缺点是体积庞大，且在现代 ESM 环境下配置较繁琐。
- [**Vitest**](https://cn.vitest.dev/guide/)：**当前世代的绝对首选**。由 Vite 团队打造，底层直接复用你项目里的 `vite.config.js`。启动速度极快（利用 esbuild），API 100% 兼容 Jest，是现代前端架构的标配。

### 2.2 DOM 与组件测试工具 (Component Testing)

- **jsdom / happy-dom**：在 Node.js 终端里“**伪造**”一个浏览器 DOM 环境（因为 Node 原生没有 `window` 和 `document`），让测试脚本能跑起来。
- **Testing Library**：(`@testing-library/vue` 或 `@testing-library/react`)。它的核心哲学是：**不要测试组件的内部实现细节（如 data/state），而是测试用户能看到的 DOM 表现。**

### 2.3 端到端测试 (E2E)

- **Cypress**：提供极佳的可视化 UI 调试界面，开创了现代 E2E 测试的先河。
- **Playwright**：微软出品的**新一代王者**。原生支持多标签页、iframes，跨浏览器（Chromium, WebKit, Firefox）并行测试能力极强，速度远超 Cypress。

## 3. 核心测试场景实战

### 3.1 单元测试：纯函数与 Mock (Vitest / Jest)

测试的核心是:给定输入,断言输出。遇到网络请求等不可控的外部依赖时,必须使用**Mock (模拟)** 技术将其隔离。

:::code-group

```js [src/utils.js]
export function calculateTotal(price, taxRate) {
  return price * (1 + taxRate)
}

export async function fetchUserData(id) {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`)
  }
  return response.json()
}
```

```js [src/utils.test.js]
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateTotal, fetchUserData } from './utils'

// 1. 测试纯粹的业务计算逻辑 (最便宜、最该写的测试)
describe('calculateTotal', () => {
  it('应该正确计算包含税费的总价', () => {
    const price = 100
    const taxRate = 0.1

    // 断言 (Assertion)
    expect(calculateTotal(price, taxRate)).toBe(110)
  })
})

// 2. 测试包含异步网络请求的函数 (使用 Mock 拦截)
describe('fetchUserData', () => {
  afterEach(() => {
    // 每个用例结束后还原被替换的全局对象，避免用例之间互相污染
    vi.unstubAllGlobals()
  })

  it('应该能正确处理后端返回的用户数据', async () => {
    // 用 stubGlobal 替换全局 fetch，强行返回伪造的假数据
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Alice' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = await fetchUserData(1)

    // 断言请求地址与调用次数
    expect(fetchMock).toHaveBeenCalledWith('/api/users/1')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // 断言返回值
    expect(user).toEqual({ id: 1, name: 'Alice' })
  })

  it('接口失败时应该抛出错误', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    )

    await expect(fetchUserData(1)).rejects.toThrow('请求失败: 500')
  })
})
```

:::

### 3.2 组件集成测试 (Testing Library)

模拟用户点击按钮，观察 DOM 结构是否发生变化。

:::code-group

```js [vitest.config.js]
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 组件测试需要 DOM 环境，jsdom / happy-dom 二选一
    environment: 'jsdom',
  },
})
```

```vue [src/components/Counter.vue]
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button type="button" @click="count++">点击增加</button>
  <span data-testid="count-value">{{ count }}</span>
</template>
```

```js [src/components/Counter.test.js]
import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import Counter from './Counter.vue'

describe('Counter.vue', () => {
  afterEach(() => {
    // 卸载上一个用例渲染的组件，避免 DOM 在用例之间累积
    cleanup()
  })

  it('点击按钮后，数字应该加 1', async () => {
    // 1. 渲染组件到虚拟 DOM 中
    render(Counter)

    // 2. 查询 DOM 元素 (以用户的视角寻找屏幕上的元素)
    const button = screen.getByRole('button', { name: '点击增加' })
    const display = screen.getByTestId('count-value')

    expect(display.textContent).toBe('0') // 初始状态

    // 3. 触发真实交互事件
    await fireEvent.click(button)

    // 4. 再次断言 DOM 更新后的状态
    expect(display.textContent).toBe('1')
  })
})
```

:::

### 3.3 E2E 端到端测试 (Playwright)

完全黑盒测试，脱离代码层面，直接在无头浏览器中进行。

:::code-group

```js [playwright.config.js]
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    ...devices['Desktop Chrome'],
  },
  // 测试前自动拉起 dev server；本地已启动时直接复用
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

```js [tests/e2e/login.spec.js]
import { expect, test } from '@playwright/test'

test('用户登录核心主流程', async ({ page }) => {
  // 1. 访问真实页面（baseURL 已在配置里指定）
  await page.goto('/login')

  // 2. 模拟用户输入
  await page.fill('input[name="username"]', 'admin')
  await page.fill('input[name="password"]', '123456')

  // 3. 模拟点击登录
  await page.click('button[type="submit"]')

  // 4. 断言：URL 是否跳转到了后台，屏幕上是否出现了欢迎词
  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    '欢迎回来, admin',
  )
})
```

:::

### 3.4 高频 API 速查

[width(46,54)]

| API                                    | 作用                                             |
| -------------------------------------- | ------------------------------------------------ |
| `describe(name, fn)`                   | 定义一组相关测试的套件                           |
| `it(name, fn)` / `test(name, fn)`      | 定义单条测试用例，`it` 与 `test` 等价            |
| `expect(value)`                        | 创建断言，后接连缀匹配器                         |
| `beforeEach` / `afterEach`             | 每条用例前后执行，常用于重置 Mock、清理 DOM      |
| `beforeAll` / `afterAll`               | 整个套件前后各执行一次                           |
| `vi.fn()` / `jest.fn()`                | 创建 Mock 函数，可断言调用次数与入参             |
| `vi.mock(path)`                        | 模块级 Mock，拦截整个模块的导入                  |
| `vi.spyOn(obj, method)`                | 只监听/替换对象上的某个方法，保留其余实现        |
| `vi.useFakeTimers()`                   | 接管定时器，配合 `vi.advanceTimersByTime()` 快进 |
| `expect(x).toBe()`                     | 严格相等（`Object.is`），适合原始值              |
| `expect(x).toEqual()`                  | 递归深比较，适合对象/数组                        |
| `expect(fn).toHaveBeenCalledWith(...)` | 断言 Mock 以指定参数被调用                       |

**组件测试（Testing Library）**

[width(27,73)]

| API                   | 作用                                               |
| --------------------- | -------------------------------------------------- |
| `render(ui)`          | 把组件渲染到虚拟 DOM 中，返回查询方法              |
| `screen`              | 全局查询对象，优先用它而不是从 `render` 返回值解构 |
| `screen.getByRole`    | 按无障碍角色查询，最贴近用户视角，首选             |
| `screen.getByText`    | 按可见文本查询                                     |
| `fireEvent.click(el)` | 触发原生事件（更推荐贴近真实交互的 `userEvent`）   |
| `waitFor(fn)`         | 轮询等待断言成立，用于异步更新                     |
| `findByText(...)`     | `getBy` 系列的异步版本，内部自动 `waitFor`         |

**E2E（Playwright）**

[width(38,62)]

| API                              | 作用                                   |
| -------------------------------- | -------------------------------------- |
| `page.goto(url)`                 | 导航到指定页面                         |
| `page.locator(sel)`              | 创建定位器（惰性求值，可复用、可链式） |
| `page.getByRole` / `getByLabel`  | 语义化定位，比 CSS 选择器更稳          |
| `locator.fill(text)` / `click()` | 填表、点击等交互动作                   |
| `expect(locator).toBeVisible()`  | Playwright 特有的自动重试断言          |
| `expect(page).toHaveURL(url)`    | 断言当前 URL，常用于验证跳转           |
| `page.waitForResponse(...)`      | 等待某个网络响应，替代硬编码 `sleep`   |

### 3.5 高频落地场景

- **纯函数与工具库**：日期格式化、权限判断、金额计算这类高频复用的 utils 必写单测，改一行就有回归保护。
- **组件交互逻辑**：用 Testing Library 测“**点了按钮数字 +1**”“**表单校验提示出现**”，只断言用户可见的 DOM，不碰内部 state。
- **核心业务主流程 E2E**：登录 → 下单 → 支付这类不能出错的主链路，用 Playwright 在真实浏览器里跑一遍，作为发布前最后一道闸。
- **Mock 网络请求**：单测/组件测试里用 `vi.fn()` 伪造 `fetch`，E2E 里用 MSW 在网络层拦截，彻底摆脱对真实后端的依赖。
- **CI 中跑测试**：`pnpm test --coverage` 接入流水线，覆盖率跌破阈值或有用例失败就阻断合并。
- **重构兜底**：动底层算法或状态管理之前先补齐测试，用绿色测试保证重构不引入新 Bug。

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 TDD (测试驱动开发) 这么火，前端业务开发必须用 TDD 吗？

**强烈不建议在 UI 业务层生搬硬套 TDD。**

- **TDD 原则**：先写测试用例（此时必定报错），再写业务代码让测试通过。
- **前端的痛点**：前端 UI 的长相、DOM 结构、甚至交互逻辑每天都在随着产品经理的心情变化。如果你在写 UI 前先写好测试，第二天需求一改，业务代码要改，测试代码要跟着全盘重写，维护成本极高，甚至会导致团队为了 KPI 写出无意义的垃圾测试。
- **最佳实践**：对**极其稳定且复用率极高的核心库**（如正则校验、时间格式化、复杂的 DP 算法、内部自研 UI 组件库的底层逻辑）使用 TDD；对变动频繁的页面级业务代码，只做**核心主链路的 E2E 测试**。

### 4.2 测试覆盖率 (Code Coverage) 必须达到 100% 吗？

**绝对不需要，这是一种严重的“数字内耗”。**

- 当你把覆盖率从 0% 提升到 70% 时，你拦截了绝大多数致命 Bug，收益极大。
- 但当你试图从 80% 提升到 100% 时，你往往需要花费数倍的时间去写极其变态的 Mock，仅仅为了触发某一个极低概率的 `if/catch` 分支。这种边缘测试极其脆弱（Brittle Tests），收益极低。
- **行业标准**：核心工具函数要求 90%+ 覆盖率；普通业务项目，整体语句覆盖率达到 **60% - 80%** 即可。

### 4.3 什么是“**脆弱的测试 (Flaky Tests)**”？如何解决 E2E 测试经常偶尔报错的问题？

Flaky Tests 是指**代码明明没变，但测试跑 10 次，会有 2 次莫名其妙失败**。这是 E2E 测试最让人崩溃的通病。

- **产生原因**：网络请求延迟波动、定时器（`setTimeout`）执行时间偏差、CSS 动画还没执行完程序就去点击了按钮。
- **避坑指南**：
  - **绝对不要使用 `sleep(2000)`这种硬编码等待！** 必须使用框架提供的基于状态的等待等待机制（如 Playwright 的 `await page.waitForSelector('.loading-done')`）。
  - 冻结时间：在测试包含日期逻辑或定时器的代码时，使用测试框架的虚拟时间（如 `vi.useFakeTimers()`）。
  - 阻断外部不可控因素：对于非核心的第三方不可控网络（如请求外网埋点/广告接口），在 E2E 层面也应当进行拦截 Mock。

### 4.4 前端测试里 Mock 网络请求太痛苦了，有什么终极方案吗？

传统做法是使用 `jest.mock('axios')` 来拦截请求库，但这会导致测试代码里充斥着大量的底层实现细节，一旦哪天项目把 axios 换成了 fetch，所有的测试瞬间全挂。

- **终极方案是使用 MSW (Mock Service Worker)。**
- 它在浏览器的网络层或 Node.js 的原生 Http 请求层进行物理拦截。你的业务代码和测试代码完全不需要知道自己被 Mock 了，只要向 `/api/user` 发请求，MSW 就会在底层拦截并返回假数据。这使得测试代码极其纯净，且与具体的请求库彻底解耦。

### 4.5 `it` 和 `test` 有什么区别？该用哪个？

在 Vitest / Jest 里两者**完全等价**，只是命名风格不同（`it` 读起来像英文句子“**it should…**”）。团队内统一即可，功能上没有任何差异。

- 真正需要区分的是 `it.only` / `it.skip` / `it.todo` 这类修饰符，用来临时聚焦或跳过用例。
- 注意 `only` 别误提交：它会让其余用例全部被忽略，CI 上看着一片绿实则什么都没跑。

### 4.6 `toBe` 和 `toEqual` 到底该用哪个？

- `toBe`用`Object.is`严格比较，只适合原始值(数字、字符串、布尔、`null`/`undefined`)和引用相等。
- `toEqual` 做递归深比较，适合对象、数组。断言 `{ a: 1 }` 用 `toBe` 会因引用不同而失败，必须用 `toEqual`。
- 更严格的 `toStrictEqual` 会在 `toEqual` 基础上额外检查 `undefined` 属性与类实例，断言复杂对象时更可靠。

### 4.7 组件测试里，用 `getByTestId` 还是 `getByRole`？

优先 `getByRole`，其次 `getByLabelText` / `getByText`，最后才 `getByTestId`。

- `getByRole` 按无障碍角色（button、textbox、heading）查询，最贴近用户和读屏软件的真实感知，也顺带保证了组件的可访问性。
- `getByTestId` 依赖额外加的 `data-testid`，好处是稳定、不受文案改动影响，适合难以用语义定位的元素；但滥用会让测试脱离“**用户视角**”的初衷。

### 4.8 单测全绿，上线还是出 Bug，问题出在哪？

最常见的原因是**测试写的是实现细节，而不是用户行为**。

- 断言 DOM 结构、内部 state、私有方法这类实现细节，重构时要么测试被迫跟着改（形同虚设），要么测试仍绿但行为已经坏了。
- 解法是遵循 Testing Library 的哲学：**像用户一样查询和交互**，只断言用户能看到的输出；再给核心主链路补一层 E2E，覆盖单测无法触达的集成场景。
