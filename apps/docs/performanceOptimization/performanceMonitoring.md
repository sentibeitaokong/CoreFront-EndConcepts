# 性能监控与持续治理

**核心本质**：性能监控绝非单次跑分的静态切片，而是构建涵盖“**精准捕获、根因追踪、灰度验证、防退化卡点**”的自动化工程闭环。脱离线上真实 RUM（Real User Monitoring）数据的优化，极易沦为开发者在高端设备与极速网络下的“**本地自嗨**”。

**治理准则**：**实验室数据定基线，真实用户数据判生死。** 性能预算必须作为硬性 SLA 嵌入 CI/CD 流水线，以机制对抗人性，杜绝代码库的“**慢性劣化**”。

## 1. 监控指标的立体分层

将海量监控数据按决策生命周期分层，过滤信息噪音：

- **核心体验层 (Core Web Vitals)**：LCP（加载痛点）、INP（交互卡顿）、CLS（视觉跳动），直接反映终端用户的真实体感。
- **工程诊断层 (Diagnostics)**：Long Task 长任务（主线程阻塞）、Resource 瀑布流、JS Error Rate、Vite/Rollup Bundle 产物核心包体积。提供精确到代码行的排障线索。
- **链路追踪层 (Tracing)**：首屏 TTFB 耗时、BFF 层/微服务 API 响应时长、资源 CDN 命中率。横跨前后端定位全链路瓶颈。
- **业务水位层 (Business Impact)**：跳出率 (Bounce Rate)、核心路径转化率。用以向业务方量化性能优化的商业 ROI。
- **发布溯源指标**：Release 版本号、构建批次、灰度标签。精准定界。

## 2. RUM 真实用户监控

RUM 是性能治理的最终裁决者。现代前端基建（如深度集成的 Sentry 体系）不仅需要采集指标，更要采集**上下文**。

```javascript
import { onLCP, onINP, onCLS } from 'web-vitals'

// 企业级上报封装：防抖、批量与关联上下文
const reportVital = metric => {
  const payload = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    element: metric.entries[0]?.target?.tagName, // 触发劣化的元凶 DOM
    route: window.location.pathname,
    release: import.meta.env.VITE_APP_VERSION, // 强绑定构建版本
    traceId: window.__TRACE_ID__, // 贯穿前后端的日志追踪 ID
  }

  // 优先使用 sendBeacon，保证页面卸载时不丢失数据
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/telemetry/vitals', JSON.stringify(payload))
  }
}

;[onLCP, onINP, onCLS].forEach(fn => fn(reportVital))
```

**高价值多维切片分析：**

- **设备与网络分布**：识别长尾用户的真实环境（如 3G 弱网、低端 Android 机型）。
- **页面路由级聚合**：打平 SPA 架构的单页切换数据，精准定位退化的具体业务模块。
- **发布版本回归**：新老版本 P75 数据自动化大盘对比，快速锁定引发退化的灰度批次。

## 3. 实验室监控：防御性的研发前置卡点

实验室环境剥离了现实噪音，专用于持续集成阶段的阻断与基线回归。

- **Unlighthouse 全站巡检**：针对多路由应用，在本地或 CI 环境批量扫描站点地图，快速输出全站 Lighthouse 视图，消灭性能盲区。
- **Lighthouse CI 卡点**：深度集成至 GitHub Actions 或 GitLab CI，针对核心链路（首页、支付页）设定阈值跑分。
- **Bundle 产物体积哨兵**：在打包工具（如 Vite/Rollup）中配置 `rollup-plugin-visualizer` 等分析插件，设定 `maxAssetSize` 与 `maxEntrypointSize`，一旦依赖膨胀即构建失败。
- **DevTools 火焰图深度剖析**：利用 Performance 面板深挖 VNode 频繁 Diff 导致的 Long Task，以及 Layout Thrashing（强制同步布局）。

## 4. 性能预算与流水线集成

缺乏预算机制的优化必然面临退化。预算规则必须以 JSON/YAML 格式沉淀为代码库的一部分，并与 PR (Pull Request) 强绑定。

```json
{
  "ci": {
    "budgets": [
      {
        "path": "/*",
        "metrics": {
          "lcp": 2500,
          "inp": 200,
          "cls": 0.1
        },
        "resourceSizes": [
          { "resourceType": "script", "budget": 150 },
          { "resourceType": "third-party", "budget": 50 }
        ]
      }
    ]
  }
}
```

- **红线阻断 (Hard Blocking)**：核心主干代码合并时，一旦核心 JS 产物超标或关键页面 LCP 退化超过 10%，直接 Fail Pipeline。
- **温和告警 (Soft Warning)**：非核心指标的轻微退化，通过企业微信或 Slack 推送通知，并自动生成优化排期 Issue。
- **版本基线 (Baseline Diff)**：不看绝对值，强制对比 `Current Release` 与 `Previous Stable` 的 P75 差距。

## 5. 性能异动排查

面对大盘监控异动，严禁盲目“**试错式优化**”，需严格遵循降维拆解流程：

- **圈定影响爆炸半径**：首先确认是全局基建恶化（如 CDN 节点故障、基础库发版），还是单一业务路由慢，亦或特定设备系统兼容异常。
- **切片拆解核心指标**：例如 LCP 飙高，必须拆解为：`TTFB (后端响应)` -> `Load Delay (网络连接)` -> `Load Time (资源下载)` -> `Render Delay (主线程阻塞)`，锁定具体耗时黑洞。
- **关联追踪异常**：性能暴跌往往伴随运行时崩溃。将 INP 卡顿数据与同时段的 JS Error 或接口 5xx/4xx 报错率进行联合排查。
- **灰度桶验证 (A/B Testing)**：任何底层引擎或构建层面的重大性能重构，必须进行严格的分桶验证，通过统计学显著性确认优化成果，而非仅看均值。

## 6. 告警治理与降噪哲学

无效告警是对团队心智的消耗，必须构建高信噪比的报警策略。

- **废弃均值，死守 P-分位**：绝对不要看平均值（均值会被极好或极差的数据严重稀释）。核心盯防 **P75**（大盘及格线）与 **P90**（长尾体验）。
- **持续性窗口阈值**：避免因短时网络抖动触发“**狼来了**”。设定如“**连续 3 个 5 分钟时间窗口 P75 LCP > 3000ms**”才触发 P1 级电话告警。
- **优先级矩阵**：按业务核心链路分配权重，交易链路的红线告警直达高管，周边支持型页面的告警仅作日报汇总。

## 7. 核心度量指标

| 核心指标         | 观测目标与含义             | 优化达标线 |
| ---------------- | -------------------------- | ---------- |
| **LCP P75**      | 真实用户首屏主体内容速度。 | < 2.5s     |
| **INP P75**      | 真实用户交互响应速度。     | < 200ms    |
| **CLS P75**      | 页面视觉稳定性。           | < 0.1      |
| **Error Rate**   | JS 错误是否影响体验。      | 持续压低   |
| **Budget Drift** | 性能预算是否持续退化。     | 发布前阻断 |
