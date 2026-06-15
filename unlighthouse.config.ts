export default {
  scanner: {
    // 🌟 核心优化 1：CI 环境下强烈建议将最大页面限制在 20-30 个，足够覆盖所有组件和关键页面
    maxRoutes: 25,
    // 🌟 核心优化 2：开启抽样，它会从各个分类目录里均匀抽取页面，而不是只扫前 25 个
    samples: 3,
  },
  puppeteerOptions: {
    // 🌟 核心优化 3：极重要！Linux 容器下禁用沙箱和共享内存限制，彻底防止 Chrome 僵死
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // 使用 /tmp 代替 /dev/shm，防止内存不够时卡死
      '--disable-gpu',
      '--js-flags="--max-old-space-size=1024"',
    ],
  },
  ci: {
    // 强制设置单页审计超时，防止单页卡死拖垮整个流程
    timeout: 30000,
    // budget: {
    //     // 🌟 性能红线：如果任何一个页面的性能总分低于 90分，脚本直接抛出 Error (exit code 1)！
    //     performance: 50,
    //     // 最佳实践得分不能低于 95分
    //     bestPractices: 50,
    // },
  },
}
