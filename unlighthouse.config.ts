export default {
  ci: {
    budget: {
      // 🌟 性能红线：如果任何一个页面的性能总分低于 90分，脚本直接抛出 Error (exit code 1)！
      performance: 50,
      // 最佳实践得分不能低于 95分
      bestPractices: 50,
    },
  },
  scanner: {
    // 默认是 mobile，如果你的项目主要是 PC 端（比如后台管理系统），必须改成 desktop
    device: 'desktop',
  },
}
