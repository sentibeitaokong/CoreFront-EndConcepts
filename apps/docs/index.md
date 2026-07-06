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
      link: /fronttEngineering/intro

features:
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
      src: /img/Vue.svg
    title: Vue 源码实现
    details: 以 reactivity、runtime-core、runtime-dom、compiler-core 拆解响应式、渲染器、调度器和编译器。
    link: /frameworks/vue/advanced/source-code/vueCatalog

  - icon:
      src: /img/algorithms.svg
    title: 算法与设计模式
    details: 用数据结构、算法思想和设计模式提升抽象建模能力，服务复杂业务与框架原理理解。
    link: /dataStructuresAndAlgorithms/data-structures/array
---
