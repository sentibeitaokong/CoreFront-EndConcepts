---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: 'Core Front-End Concepts'
  text: '前端核心知识体系'
  tagline: 从 Web 基础、浏览器原理、框架生态到工程化与源码实现，建立一张可持续扩展的前端能力地图。
  image:
    src: /img/vitepress.svg
    alt: Core Front-End Concepts
  actions:
    - theme: brand
      text: 开始阅读
      link: /intro
    - theme: alt
      text: Vue 源码
      link: /frameworks/vue/advanced/source-code/vueCatalog
    - theme: alt
      text: 工程化指南
      link: /frontEngineering/intro
    - theme: alt
      text: 组件库
      link: /frameworks/vue/components/quickStart

features:
  - icon:
      src: /img/knowledgeSystem.png
    title: Web 基础体系
    details: 覆盖 HTML 语义、CSS 布局与视觉、JavaScript 语言核心、TypeScript 类型系统和正则表达式。
    link: /intro

  - icon:
      src: /img/handleWriting.svg
    title: JavaScript 底层与手写
    details: 从执行上下文、作用域、原型链、异步机制到 Promise、Axios、继承和高阶函数手写。
    link: /js/hand-writing/promiseHandleWriting

  - icon:
      src: /img/frameworks.svg
    title: Vue / React 双框架
    details: 覆盖组件通信、路由、状态管理、Hooks、过渡动画、性能优化与框架设计思想。
    link: /frameworks/vue/basic/intro

  - icon:
      src: /img/elementPlus.png
    title: xb-element 组件库
    details: 通过 Button、Input、Select、Form、Tooltip、Message 等组件理解 API 设计、样式变量、类型声明与测试。
    link: /frameworks/vue/components/quickStart

  - icon:
      src: /img/Vue.png
    title: Vue 源码实现
    details: 以 reactivity、runtime-core、runtime-dom、compiler-core 拆解响应式、渲染器、调度器和编译器。
    link: /frameworks/vue/advanced/source-code/vueCatalog

  - icon:
      src: /img/networkSafety.png
    title: 网络、浏览器与安全
    details: 梳理 DNS、CDN、TCP/UDP、HTTP/HTTPS、缓存、渲染、跨域、XSS、CSRF、CSP 与鉴权安全方案。
    link: /networkAndBrowsers/fundamentals/osi

  - icon:
      src: /img/rocket.svg
    title: 性能优化与工程化
    details: 从 Core Web Vitals、首屏、资源加载、Bundle 分析到 Vite、Webpack、Monorepo、CI/CD 和监控体系。
    link: /performanceOptimization/coreWebVitals

  - icon:
      src: /img/algorithms.svg
    title: 算法与设计模式
    details: 用数据结构、算法思想和设计模式提升抽象建模能力，服务复杂业务与框架原理理解。
    link: /dataStructuresAndAlgorithms/data-structures/array
---
