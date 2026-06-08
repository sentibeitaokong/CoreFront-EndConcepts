module.exports = {
  // 继承官方推荐的 Angular 团队提交规范
  extends: ['@commitlint/config-conventional'],
  // 你可以在这里自定义规则，比如强制使用特定前缀，或修改最大长度
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复 bug
        'docs', // 文档修改
        'style', // 代码格式修改（不影响逻辑）
        'refactor', // 重构（既不修复 bug 也不增加新功能）
        'perf', // 性能优化
        'test', // 增加测试
        'chore', // 构建过程或辅助工具变动
        'revert', // 回滚某个 commit
        'build', // 打包产物修改
      ],
    ],
    'subject-case': [0], // 允许 subject 使用大写或小写（不强制限制）
  },
}
