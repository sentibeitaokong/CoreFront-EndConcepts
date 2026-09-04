# 环境变量与环境配置

同一份代码要在开发、测试、预发、生产等不同环境运行，靠「硬编码」切换地址既繁琐又危险。环境变量让我们把「随环境变化的东西」从代码中抽离，实现**一次构建、多环境部署**或**按环境注入配置**。

**一句话理解**：**「环境变量 = 把环境相关的配置（接口地址、密钥、开关）从代码里剥离出来，交给运行时或构建时注入。」**

> 本文聚焦**环境变量机制本身**；多环境（DEV/QA/UAT/PROD）的架构设计见 [多环境与部署架构](/frontEngineering/ci-cd/deploymentEnvironments)。

## 1. 为什么需要环境变量

| 痛点                     | 环境变量的解法                        |
| ------------------------ | ------------------------------------- |
| 接口地址随环境变化       | 用 `VITE_API_BASE` 区分 dev/prod 地址 |
| 密钥写死在代码里         | 密钥放环境变量，**不提交进仓库**      |
| 不同环境功能开关         | 用 `VITE_FEATURE_FLAG` 控制特性开关   |
| 切换环境要改代码重新部署 | 改环境变量即可，无需动代码            |

## 2. 环境变量的两种注入时机

| 时机       | 机制                                           | 特点                                   | 典型工具                    |
| ---------- | ---------------------------------------------- | -------------------------------------- | --------------------------- |
| **构建时** | 打包时把变量**替换/内联**进 JS 代码            | 产物里「写死」，改值需重新构建         | Vite、Webpack、CRA、Next.js |
| **运行时** | 应用启动时从外部（`window`、服务端、容器）读取 | 同一份产物可在不同环境跑，**一次构建** | 运行时注入脚本、SSR、Docker |

前端最常用的是**构建时注入**（简单、可摇树），但**运行时注入**才能实现真正的「一次构建、随处部署」。

## 3. 前端如何读取环境变量

### 3.1 Vite 中的 `import.meta.env`

```javascript
// 内置变量
import.meta.env.DEV // 是否开发环境
import.meta.env.PROD // 是否生产环境
import.meta.env.MODE // 当前模式：development / production / staging
import.meta.env.BASE_URL // 部署基础路径（vite.config 的 base）

// 自定义变量（须 VITE_ 前缀）
import.meta.env.VITE_API_BASE
```

### 3.2 `.env` 文件与命名约定

Vite 约定从以下文件按优先级读取环境变量（**后者覆盖前者**）：

| 文件                | 作用                                     | 优先级 |
| ------------------- | ---------------------------------------- | ------ |
| `.env`              | 所有环境共享的基础变量                   | 最低   |
| `.env.local`        | 本地覆盖，**不提交**（放密钥）           | 高     |
| `.env.[mode]`       | 特定模式的变量（development/production） | 高     |
| `.env.[mode].local` | 特定模式 + 本地覆盖，**不提交**          | 最高   |

```bash
# .env.development
VITE_API_BASE=https://dev-api.example.com
VITE_ENABLE_MOCK=true

# .env.production
VITE_API_BASE=https://api.example.com
VITE_ENABLE_MOCK=false
```

> 约定：Vite 默认只暴露以 `VITE_` 前缀开头的变量给客户端代码，**非 `VITE_` 前缀的变量在客户端不可见**（白名单防泄漏机制）。

### 3.3 各构建工具对比

| 工具                    | 读取方式                              | 前缀约定       |
| ----------------------- | ------------------------------------- | -------------- |
| Vite                    | `import.meta.env.VITE_*`              | `VITE_`        |
| Webpack（DefinePlugin） | `process.env.XXX`（构建时替换）       | 无，需手动配置 |
| Create React App        | `process.env.REACT_APP_*`             | `REACT_APP_`   |
| Next.js                 | `process.env.NEXT_PUBLIC_*`（客户端） | `NEXT_PUBLIC_` |
| Vue CLI                 | `process.env.VUE_APP_*`               | `VUE_APP_`     |

## 4. 多环境配置实践

### 4.1 定义环境脚本

```json
{
  "scripts": {
    "dev": "vite",
    "build:test": "vite build --mode test",
    "build:prod": "vite build --mode production"
  }
}
```

对应文件：`.env.test`、`.env.production`。`--mode` 决定加载哪个环境文件。

### 4.2 统一导出，避免散落

```typescript
// src/env.ts —— 集中管理，类型安全
export const env = {
  apiBase: import.meta.env.VITE_API_BASE as string,
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
  isProd: import.meta.env.PROD,
}
```

### 4.3 为 `import.meta.env` 补全类型提示

新建 `src/env.d.ts`，让 TypeScript 智能提示所有自定义变量：

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_ENABLE_MOCK: string
  readonly VITE_FEATURE_FLAG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 5. 运行时注入（一次构建，随处部署）

构建时注入的产物把地址「写死」了，改环境必须重新打包。要真正「一次构建、多环境部署」，可在 `public/` 下放一个**运行时配置文件**，启动时动态读取：

```html
<!-- index.html 里先加载 config.js -->
<script src="/config.js"></script>
```

```javascript
// public/config.js —— 由部署脚本/容器在启动时按环境生成
window.__APP_CONFIG__ = {
  apiBase: 'https://api.example.com',
}
```

```javascript
// src/env.ts —— 优先读运行时配置，兜底用构建时变量
export const env = {
  apiBase: window.__APP_CONFIG__?.apiBase ?? import.meta.env.VITE_API_BASE,
}
```

这样同一份 dist 产物，部署到测试/生产环境时只需替换 `config.js` 内容。

## 6. 安全红线

- **环境变量 ≠ 保密箱**：前端环境变量会被打包进产物，**任何人可见**。真正的密钥（支付私钥、数据库密码）只能放后端。
- **`.env.local` / `.env.*.local` 必须加入 `.gitignore`**，绝不提交。
- **前端变量只放非敏感配置**：接口地址、功能开关、埋点 key（可公开的）可以放，用户级密钥不行。

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

## 7. 常见问题 (FAQ)

### 7.1 为什么我定义的变量在代码里是 `undefined`？

大概率是**前缀不对**。Vite 只暴露 `VITE_` 前缀变量；CRA 只暴露 `REACT_APP_` 前缀。检查变量名是否符合当前工具的约定。

### 7.2 修改了 `.env` 为什么没生效？

环境变量在**构建/启动时**读取，修改后需**重启 dev server** 或**重新构建**才能生效。

### 7.3 前端能安全地隐藏密钥吗？

**不能**。所有打进前端的变量（无论怎么混淆）最终都能被用户从产物中读到。涉及敏感操作的密钥，必须在后端服务端处理。

### 7.4 构建时注入 vs 运行时注入怎么选？

- 需要「一次构建、多环境部署」、或环境经常切换 → **运行时注入**（`config.js` + `window`）。
- 环境固定、追求简单与摇树优化 → **构建时注入**（`import.meta.env`）。

### 7.5 `.env` 里的布尔值为什么是字符串？

环境变量本质是字符串，`VITE_ENABLE_MOCK=true` 里的 `true` 是字符串 `"true"`。判断时要显式比较 `=== 'true'`，或统一在 `env.ts` 里做类型转换。

## 8. 总结

- 环境变量把「随环境变化的配置」从代码中剥离，分构建时注入与运行时注入。
- Vite 用 `import.meta.env.VITE_*` 读取，按 `--mode` 加载对应 `.env` 文件，`.local` 优先级最高且不提交。
- 一次构建多环境部署靠「运行时 `config.js` + `window`」实现。
- 安全红线：前端变量不保密，密钥放后端，`.env.*.local` 不进仓库。
