---
outline: [2, 3]
---

# 前端核心知识体系 (Core Front-End Concepts)

`Core Front-End Concepts` 是一个基于 VitePress 的前端知识库与实践仓库。当前项目聚焦 Web 基础、JavaScript/TypeScript、浏览器与网络、安全、性能优化、Vue/React、工程化、设计模式、数据结构与算法，并通过 `packages/vue`、`packages/xbElement`、`packages/js`、`packages/html` 提供对应的源码实践。

## 1. 项目结构

| 模块路径             | 定位            | 主要内容                                                                                               |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `apps/docs`          | 文档站          | VitePress 文档，覆盖前端基础、框架、工程化、安全、性能、算法与设计模式。                               |
| `packages/vue`       | mini Vue 实现   | 响应式、运行时、渲染器、组件、调度器、编译器等 Vue 核心机制实践。                                      |
| `packages/xbElement` | Vue 组件库      | Button、Input、Select、Switch、Collapse、Message、Tooltip、Form、Progress、Dropdown 等组件实现与测试。 |
| `packages/js`        | JavaScript 实践 | Promise、执行上下文、函数、对象、数组、高阶函数、Web Worker、PWA 等示例。                              |
| `packages/html`      | Web 平台示例    | HTML/CSS/Web API、Canvas、SVG、路由、存储、WebSocket、Worker、PWA 等原生示例。                         |

## 2. Web 基础

### 2.1 HTML 与 Web API

- [HTML 基本结构](/html/basic/htmlBasicStructure)：文档结构、基础标签与页面骨架。
- [常用标签](/html/basic/commonTags)：语义标签、表格、表单、媒体等常用元素。
- [DOM 属性](/html/basic/domAttributes)：DOM 属性、节点属性与常见操作。
- [DOM 事件](/html/basic/domEvents)：事件模型、事件流、事件委托与事件对象。
- [Ajax](/html/basic/ajax)：XHR、Fetch 与异步请求基础。
- [async/defer 脚本](/html/basic/asyncScript)：脚本加载顺序与渲染阻塞。
- [HTML5 新特性](/html/advanced/html5NewFeatures)：语义化标签和现代浏览器 API。
- [语义化 HTML](/html/advanced/semanticHtml)：结构语义、可访问性和 SEO 基础。
- [Web Storage](/html/advanced/webStorage)：localStorage、sessionStorage 与存储边界。
- [History API](/html/advanced/history)：前端路由依赖的浏览器历史记录能力。
- [Web Workers](/html/advanced/webWorkers)：主线程之外的计算任务处理。
- [WebSocket](/html/advanced/webSockets)：浏览器实时通信基础。
- [Canvas 与 SVG](/html/advanced/canvasAndsvg)：位图绘制与矢量图形能力。
- [拖拽](/html/advanced/dragAndDrop)：Drag and Drop API 与交互处理。
- [地理位置](/html/advanced/geolocation)：Geolocation API 使用与权限。

### 2.2 CSS 基础与进阶

- [选择器](/css/basic/selectors)：选择器类型、权重和匹配规则。
- [继承](/css/basic/inheritance)：继承属性、默认值和层叠规则。
- [盒模型](/css/basic/boxModel)：标准盒模型、怪异盒模型与尺寸计算。
- [文档流](/css/basic/documentFlow)：普通流、脱离文档流与布局影响。
- [定位](/css/basic/position)：static、relative、absolute、fixed、sticky。
- [浮动](/css/basic/float)：浮动布局、清除浮动和历史布局方案。
- [Flex 布局](/css/advanced/layout/flexibleBox)：弹性容器、主轴交叉轴与响应式布局。
- [Grid 布局](/css/advanced/layout/grid)：二维网格、轨道、区域和自动布局。
- [表格布局](/css/advanced/layout/tableLayout)：表格渲染模型与列宽控制。
- [多列布局](/css/advanced/layout/multiColumn)：文本分栏与阅读型排版。
- [媒体查询](/css/advanced/responsive/mediaQueries)：断点、设备适配和响应式规则。
- [响应式单位](/css/advanced/responsive/units)：px、em、rem、vw、vh 等单位选择。
- [容器查询](/css/advanced/project/containerQueries)：基于容器尺寸的组件级响应式。
- [CSS 变量](/css/advanced/project/variables)：自定义属性与主题能力。
- [级联层](/css/advanced/project/cascadeLayer)：样式优先级治理。
- [颜色](/css/advanced/visual-decoration/colors)、[渐变](/css/advanced/visual-decoration/gradients)、[阴影](/css/advanced/visual-decoration/boxShadow)、[文本效果](/css/advanced/visual-decoration/textEffects)：视觉表现基础。
- [Transform](/css/advanced/animation-transform/transform)、[Transition](/css/advanced/animation-transform/transitions)、[Animation](/css/advanced/animation-transform/animations)：变换与动画。

### 2.3 JavaScript 基础

- [基础数据类型](/js/basic/basicPrimitiveType)：原始类型与基础认知。
- [八种数据类型](/js/basic/eightTypes)：JS 类型体系总览。
- [包装类型](/js/basic/primitiveWrapperTypes)：原始值与包装对象。
- [变量声明](/js/basic/variablesDeclare)：var、let、const 与作用域差异。
- [解构赋值](/js/basic/variablesDestructuring)：数组、对象解构与默认值。
- [相等判断](/js/basic/equal)：`==`、`===`、`Object.is` 与隐式转换。
- [内存空间](/js/basic/memorySpace)：栈、堆与引用关系。
- [执行上下文与调用栈](/js/basic/executionContextAndStack)：执行上下文、变量对象和栈模型。
- [词法作用域](/js/basic/lexicalScope)：作用域链和标识符解析。
- [闭包](/js/basic/closure)：闭包形成、用途和内存影响。
- [this](/js/basic/this)：调用位置、绑定规则和箭头函数。
- [函数基础](/js/basic/basicFunction)：函数声明、表达式与调用。
- [拷贝](/js/basic/copy)：浅拷贝、深拷贝与引用问题。
- [JSON 序列化](/js/basic/jsonSerialize)：序列化规则和边界。

## 3. JavaScript 进阶与手写

### 3.1 数据类型与元编程

- [数组](/js/advanced/data-types/array)：数组方法和数据操作。
- [对象](/js/advanced/data-types/object)：对象属性、描述符与操作。
- [函数](/js/advanced/data-types/function)：函数对象、调用和组合。
- [字符串](/js/advanced/data-types/string)：字符串常用能力。
- [数字](/js/advanced/data-types/number)：数值类型与精度问题。
- [Set 与 Map](/js/advanced/data-types/setAndmap)：集合、映射与去重。
- [正则对象](/js/advanced/data-types/regExp)：RegExp 对象与匹配。
- [运算符](/js/advanced/data-types/operator)：常见运算符与表达式规则。
- [Proxy](/js/advanced/metaprogramming/proxy)：代理拦截与对象操作定制。
- [Reflect](/js/advanced/metaprogramming/reflect)：反射 API 与 Proxy 配合。
- [Symbol](/js/advanced/metaprogramming/symbol)：唯一值、内置 Symbol 与协议扩展。

### 3.2 异步、模块与继承

- [Promise](/js/advanced/async/promise)：状态机、链式调用与异步组合。
- [Async/Await](/js/advanced/async/async)：异步流程同步化表达。
- [Event Loop](/js/advanced/async/eventLoop)：宏任务、微任务与浏览器调度。
- [Iterator](/js/advanced/async/iterator)：迭代协议与可迭代对象。
- [Generator](/js/advanced/async/generator)：生成器函数与状态暂停。
- [Generator 应用](/js/advanced/async/generatorApply)：生成器在异步流程中的使用。
- [模块化](/js/advanced/modules/module)：模块规范、导入导出与作用域。
- [模块方案对比](/js/advanced/modules/compareModule)：不同模块系统的差异。
- [原型](/js/advanced/class-inheritance/prototype)：原型对象与原型链。
- [Class 基础](/js/advanced/class-inheritance/classBasic)：类语法与实例关系。
- [Class 继承](/js/advanced/class-inheritance/classExtends)：extends、super 与继承链。

### 3.3 手写实现

- [Promise 手写](/js/hand-writing/promiseHandleWriting)：Promise/A+ 核心机制实现。
- [数组方法手写](/js/hand-writing/arrayHandleWriting)：常用数组 API 的实现思路。
- [对象方法手写](/js/hand-writing/objectHandleWriting)：对象相关方法与工具函数。
- [函数方法手写](/js/hand-writing/functionHandleWriting)：call、apply、bind 等函数能力。
- [继承手写](/js/hand-writing/inherit)：原型继承、组合继承和寄生组合继承。
- [高阶函数](/js/hand-writing/highLevelFunction)：柯里化、防抖、节流等函数增强。
- [全局方法](/js/hand-writing/globalMethods)：常见全局 API 实现。
- [Axios 手写](/js/hand-writing/axiosHandleWriting)：请求库核心流程模拟。

## 4. TypeScript 与正则

- [TypeScript 基础类型](/typescript/basicTypes)：基础类型、数组、元组、枚举等。
- [泛型](/typescript/generics)：泛型函数、泛型接口与约束。
- [类型收窄](/typescript/narrowing)：类型保护、断言和控制流分析。
- [高级类型](/typescript/advancedTypes)：联合、交叉、条件、映射等类型能力。
- [工具类型](/typescript/utilityTypes)：内置工具类型及使用场景。
- [类型挑战](/typescript/typeChallenges)：类型体操与复杂类型推导。
- [tsconfig、声明文件与模块](/typescript/tsconfigDeclarationModule)：工程配置、声明文件和模块解析。
- [正则表达式](/regexp/regexp)：字符、分组、断言、量词、回溯与实战匹配。

## 5. 浏览器、网络与缓存

### 5.1 网络基础

- [OSI 模型](/networkAndBrowsers/fundamentals/osi)：网络分层和职责边界。
- [IP](/networkAndBrowsers/fundamentals/ip)：IP 地址、路由和网络层基础。
- [DNS](/networkAndBrowsers/fundamentals/dns)：域名解析流程与缓存。
- [CDN](/networkAndBrowsers/fundamentals/cdn)：内容分发和边缘节点。
- [TCP](/networkAndBrowsers/transport/tcp)：连接、可靠传输和拥塞控制。
- [UDP](/networkAndBrowsers/transport/udp)：无连接传输与适用场景。
- [HTTP](/networkAndBrowsers/http/http)：请求响应、版本演进和状态码。
- [HTTP Headers](/networkAndBrowsers/http/headers)：缓存、内容协商、安全相关头。
- [HTTPS](/networkAndBrowsers/http/https)：TLS、证书与加密通信。
- [实时通信](/networkAndBrowsers/realtime/realtimeCommunication)：WebSocket 等实时方案。

### 5.2 浏览器运行态

- [进程与线程](/networkAndBrowsers/process-model/processAndThread)：浏览器进程模型和线程职责。
- [浏览器渲染流程](/networkAndBrowsers/browser/renderingProcess)：解析、样式、布局、绘制与合成。
- [Performance API](/networkAndBrowsers/browser/performanceApi)：性能数据采集和指标分析。
- [Web Components](/networkAndBrowsers/browser/webComponents)：自定义元素、Shadow DOM 与组件封装。

### 5.3 缓存与请求治理

- [浏览器缓存](/networkAndBrowsers/caching/browserCache)：强缓存、协商缓存与缓存策略。
- [前端缓存策略](/networkAndBrowsers/caching/frontendCacheStrategy)：静态资源、接口数据和本地缓存设计。
- [Service Worker 与 PWA](/networkAndBrowsers/caching/serviceWorkerPwa)：离线缓存和请求代理。
- [API 风格](/networkAndBrowsers/api/apiStyles)：REST、GraphQL、RPC 等接口风格。
- [请求治理](/networkAndBrowsers/api/requestGovernance)：超时、重试、取消、并发和幂等处理。

## 6. Web 安全

- [CSRF 与 XSS](/webSecurity/csrfAndXss)：常见攻击方式和防御策略。
- [CORS](/webSecurity/cors)：跨域资源共享与预检请求。
- [跨源安全](/webSecurity/crossOrigin)：同源策略、跨源隔离和安全边界。
- [CSP、SRI、HSTS](/webSecurity/cspSriHsts)：内容安全策略、资源完整性和强制 HTTPS。
- [点击劫持与 SameSite](/webSecurity/clickJackingSameSite)：iframe 风险和 Cookie 防护。
- [认证存储取舍](/webSecurity/authStorageTradeoff)：Token、Cookie、本地存储的安全权衡。
- [OAuth/OIDC](/webSecurity/oauthOidc)：授权码、PKCE 与身份认证流程。
- [企业级认证安全](/webSecurity/enterpriseAuthSecurity)：前端认证、权限和风控方案。
- [敏感信息与供应链](/webSecurity/sensitiveInfoSupplyChain)：信息泄露、依赖风险和构建安全。

## 7. 性能优化

- [Core Web Vitals](/performanceOptimization/coreWebVitals)：LCP、INP、CLS 等用户体验指标。
- [首屏优化](/performanceOptimization/firstScreen)：关键渲染路径、首屏资源和加载体验。
- [资源加载优化](/performanceOptimization/resourceLoading)：预加载、懒加载、优先级与网络调度。
- [图片优化](/performanceOptimization/imageOptimization)：格式、尺寸、懒加载和响应式图片。
- [CSS 性能](/performanceOptimization/cssPerformance)：选择器、布局、重绘重排与合成层。
- [JS 执行优化](/performanceOptimization/jsExecution)：长任务、主线程阻塞和任务拆分。
- [虚拟列表](/performanceOptimization/virtualList)：大列表渲染与窗口化。
- [Bundle 分析](/performanceOptimization/bundleAnalysis)：依赖体积、代码拆分和 Tree Shaking。
- [性能监控](/performanceOptimization/performanceMonitoring)：指标采集、上报和性能闭环。

## 8. Vue、React 与组件库

### 8.1 Vue 基础

- [Vue 介绍](/frameworks/vue/basic/intro)：Vue 基础概念和生态入口。
- [模板语法](/frameworks/vue/basic/templateSyntax)：模板表达式、指令和渲染规则。
- [响应式基础](/frameworks/vue/basic/reactivityFundamentals)：ref、reactive 与响应式使用。
- [计算属性与 Watch](/frameworks/vue/basic/computedAndWatch)：派生状态和副作用监听。
- [生命周期](/frameworks/vue/basic/lifecycleHooks)：组件挂载、更新和卸载阶段。
- [组件通信](/frameworks/vue/basic/componentCommunication)：Props、Emits、Slots、Provide/Inject。
- [Vue Router](/frameworks/vue/basic/vueRouter)：路由配置、导航和页面组织。
- [Pinia](/frameworks/vue/basic/pinia)：状态管理与 Store 组织。
- [组合式函数](/frameworks/vue/basic/customHooks)：逻辑复用和组合式 API。
- [TypeScript 组合式实践](/frameworks/vue/basic/composablesTs)：Vue 与 TS 的组合使用。
- [插件](/frameworks/vue/basic/plugins)、[自定义指令](/frameworks/vue/basic/customDirectives)、[模板引用](/frameworks/vue/basic/templateRefs)：Vue 扩展能力。
- [KeepAlive](/frameworks/vue/basic/keepAlive)、[Teleport](/frameworks/vue/basic/teleport)、[Suspense](/frameworks/vue/basic/suspense)、[异步组件](/frameworks/vue/basic/asyncComponents)：内置高级能力。

### 8.2 Vue 源码与核心设计

- [Vue 源码目录](/frameworks/vue/advanced/source-code/vueCatalog)：源码学习入口。
- [响应式 reactive](/frameworks/vue/advanced/source-code/reactivity-core/reactive)、[ref](/frameworks/vue/advanced/source-code/reactivity-core/ref)、[computed](/frameworks/vue/advanced/source-code/reactivity-core/computed)、[watch](/frameworks/vue/advanced/source-code/reactivity-core/watch)、[watchEffect](/frameworks/vue/advanced/source-code/reactivity-core/watchEffect)：响应式核心实现。
- [VNode](/frameworks/vue/advanced/source-code/renderer/vnode)、[createRenderer](/frameworks/vue/advanced/source-code/renderer/createRenderer)、[processElement](/frameworks/vue/advanced/source-code/renderer/processElement)、[processComponent](/frameworks/vue/advanced/source-code/renderer/processComponent)：渲染器核心流程。
- [Diff：patchKeyedChildren](/frameworks/vue/advanced/source-code/patchKeyedChildren)： keyed children 更新策略。
- [调度器](/frameworks/vue/advanced/source-code/scheduler/scheduler)、[nextTick](/frameworks/vue/advanced/source-code/scheduler/nextTick)：任务队列与异步更新。
- [编译器总览](/frameworks/vue/advanced/source-code/compiler/compilerInfo)、[Parser](/frameworks/vue/advanced/source-code/compiler/parser)、[Transform](/frameworks/vue/advanced/source-code/compiler/transform)、[Codegen](/frameworks/vue/advanced/source-code/compiler/codegen)：模板编译流程。
- [Teleport](/frameworks/vue/advanced/source-code/special-components/teleportComponent)、[KeepAlive](/frameworks/vue/advanced/source-code/special-components/keepAliveComponent)、[Transition](/frameworks/vue/advanced/source-code/special-components/transitionComponent)、[defineAsyncComponent](/frameworks/vue/advanced/source-code/special-components/defineAsyncComponent)：特殊组件实现。
- [声明式 UI](/frameworks/vue/advanced/core-design/declarativeUI)、[虚拟 DOM](/frameworks/vue/advanced/core-design/vDom)、[渲染器](/frameworks/vue/advanced/core-design/renderer)、[编译器](/frameworks/vue/advanced/core-design/compiler)、[Tree Shaking](/frameworks/vue/advanced/core-design/treeShaking)：Vue 核心设计思想。

### 8.3 React 基础

- [React 介绍](/frameworks/react/basic/intro)：React 基础概念入口。
- [JSX](/frameworks/react/basic/jsx)：JSX 语法与渲染表达。
- [元素渲染](/frameworks/react/basic/elementRendering)：React 元素和更新。
- [组件与 Props](/frameworks/react/basic/componentAndProps)：组件抽象和参数传递。
- [State 与生命周期](/frameworks/react/basic/stateAndLifecycle)：状态和生命周期心智模型。
- [事件处理](/frameworks/react/basic/handlingEvents)：合成事件与事件绑定。
- [条件渲染](/frameworks/react/basic/conditionalRendering)、[列表渲染](/frameworks/react/basic/listRendering)、[表单](/frameworks/react/basic/form)：常见 UI 逻辑。
- [组件通信](/frameworks/react/basic/componentCommunication)：父子通信、插槽式组合和上下文。
- [React Router](/frameworks/react/basic/reactRouter)：路由和导航。
- [React Redux](/frameworks/react/basic/reactRedux)：全局状态管理。
- [性能优化](/frameworks/react/basic/performanceOptimization)：memo、缓存和渲染优化。
- [Hooks](/frameworks/react/basic/hooks/useState)：useState、useEffect、useMemo、useCallback、useReducer、useRef 等 Hook 文档入口。

### 8.4 xb-element 组件库

- [快速开始](/frameworks/vue/components/quickStart)：组件库安装、引入和使用入口。
- [Button](/frameworks/vue/components/button)、[Input](/frameworks/vue/components/input)、[Select](/frameworks/vue/components/select)、[Switch](/frameworks/vue/components/switch)：基础输入与选择组件。
- [Collapse](/frameworks/vue/components/collapse)、[Dropdown](/frameworks/vue/components/dropdown)：内容组织与菜单组件。
- [Tooltip](/frameworks/vue/components/tooltip)、[Message](/frameworks/vue/components/message)、[Progress](/frameworks/vue/components/progress)：反馈与展示组件。
- [Form](/frameworks/vue/components/form)：表单、校验和字段组织。

## 9. 前端工程化

- [工程化导览](/frontEngineering/intro)：当前工程化文档入口。
- [工程工具](/frontEngineering/engineerTools)：常用前端工程工具链。
- [Monorepo](/frontEngineering/architecture/monorepo)：多包仓库组织方式。
- [Monorepo 任务与版本](/frontEngineering/architecture/monorepoTasksVersioning)：任务编排、版本管理和发布流程。
- [模块化](/frontEngineering/module-component/modules)：模块系统总览。
- [JavaScript 模块](/frontEngineering/module-component/javascriptModules)：CJS、ESM 等 JS 模块机制。
- [CSS 工程化](/frontEngineering/module-component/cssProject)：样式模块化与工程组织。
- [包管理器](/frontEngineering/package-management/packageManagers)：npm、pnpm、yarn 等包管理方案。
- [package.json](/frontEngineering/package-management/packageJson)：包配置字段和依赖管理。
- [npm 发布与 Changesets](/frontEngineering/package-management/npmPublishChangesets)：包发布、版本和变更日志。
- [代码质量工具](/frontEngineering/quality/linters)：Lint、格式化和规范约束。
- [测试](/frontEngineering/quality/testing)：单元测试、组件测试和测试策略。
- [错误处理](/frontEngineering/quality/errorHandling)：异常捕获、降级和上报。
- [工程化性能监控](/frontEngineering/quality/performanceMonitoring)：监控方案和指标采集。
- [Vite](/frontEngineering/build-tools/bundlers/vite)、[Webpack](/frontEngineering/build-tools/bundlers/webpack)、[Rspack](/frontEngineering/build-tools/bundlers/rspack)、[Rollup](/frontEngineering/build-tools/library-bundling/rollup)、[Tsup](/frontEngineering/build-tools/library-bundling/tsup)：构建工具与库打包。
- [Bundle 优化](/frontEngineering/build-tools/bundleOptimization)：产物分析与优化。
- [Source Map](/frontEngineering/build-tools/sourceMap)：源码映射和线上问题定位。
- [CI/CD](/frontEngineering/ci-cd/ciCd)、[部署环境](/frontEngineering/ci-cd/deploymentEnvironments)：自动化交付与环境治理。

## 10. 设计模式、数据结构与算法

### 10.1 设计模式

- [设计模式总结](/designPatterns/summary/patternSummarize)：模式分类和整体脉络。
- [设计原则](/designPatterns/summary/patternPrinciple)：SOLID 等常见原则。
- [MVC](/designPatterns/architecture/MVC)、[MVVM](/designPatterns/architecture/MVVM)：前端架构模式。
- [构造器模式](/designPatterns/creational/constructorPattern)、[工厂模式](/designPatterns/creational/factoryPattern)、[单例模式](/designPatterns/creational/singletonPattern)、[原型模式](/designPatterns/creational/prototypePattern)：创建型模式。
- [适配器](/designPatterns/structural/adapterPattern)、[装饰器](/designPatterns/structural/decoratorPattern)、[代理](/designPatterns/structural/proxyPattern)、[外观](/designPatterns/structural/facadePattern)、[组合](/designPatterns/structural/compositePattern)、[享元](/designPatterns/structural/flyweightPattern)：结构型模式。
- [观察者](/designPatterns/behavioral/observerPattern)、[发布订阅](/designPatterns/behavioral/pubSubPattern)、[策略](/designPatterns/behavioral/strategyPattern)、[状态](/designPatterns/behavioral/statePattern)、[命令](/designPatterns/behavioral/commandPattern)、[迭代器](/designPatterns/behavioral/iteratorPattern)：行为型模式。

### 10.2 数据结构与算法

- [数组](/dataStructuresAndAlgorithms/data-structures/array)、[链表](/dataStructuresAndAlgorithms/data-structures/linkedList)、[栈](/dataStructuresAndAlgorithms/data-structures/stack)、[队列](/dataStructuresAndAlgorithms/data-structures/queue)：线性结构。
- [哈希表](/dataStructuresAndAlgorithms/data-structures/hashTable)、[集合](/dataStructuresAndAlgorithms/data-structures/set)、[Map](/dataStructuresAndAlgorithms/data-structures/map)：映射与集合结构。
- [树](/dataStructuresAndAlgorithms/data-structures/tree)、[堆](/dataStructuresAndAlgorithms/data-structures/heap)、[图](/dataStructuresAndAlgorithms/data-structures/graph)：非线性结构。
- [复杂度分析](/dataStructuresAndAlgorithms/algorithms/algorithmComplexity)：时间复杂度与空间复杂度。
- [排序](/dataStructuresAndAlgorithms/algorithms/sortAlgorithms)、[搜索](/dataStructuresAndAlgorithms/algorithms/searchAlgorithms)：基础算法。
- [BFS](/dataStructuresAndAlgorithms/algorithms/BFS)、[DFS](/dataStructuresAndAlgorithms/algorithms/DFS)、[递归](/dataStructuresAndAlgorithms/algorithms/recursionAlgorithms)、[回溯](/dataStructuresAndAlgorithms/algorithms/backTrackingAlgorithms)：遍历与搜索策略。
- [双指针](/dataStructuresAndAlgorithms/algorithms/twoPointers)、[滑动窗口](/dataStructuresAndAlgorithms/algorithms/slideWindow)、[贪心](/dataStructuresAndAlgorithms/algorithms/greedyAlgorithms)、[动态规划](/dataStructuresAndAlgorithms/algorithms/dynamicProgramming)：高频算法思想。

## 11. 推荐学习路径

- Web 基础：先阅读 [HTML 基本结构](/html/basic/htmlBasicStructure)、[盒模型](/css/basic/boxModel)、[执行上下文与调用栈](/js/basic/executionContextAndStack)、[闭包](/js/basic/closure)、[this](/js/basic/this)。
- JS 进阶：继续阅读 [原型](/js/advanced/class-inheritance/prototype)、[Promise](/js/advanced/async/promise)、[Event Loop](/js/advanced/async/eventLoop)、[Promise 手写](/js/hand-writing/promiseHandleWriting)。
- 浏览器与网络：阅读 [浏览器渲染流程](/networkAndBrowsers/browser/renderingProcess)、[HTTP](/networkAndBrowsers/http/http)、[浏览器缓存](/networkAndBrowsers/caching/browserCache)、[Performance API](/networkAndBrowsers/browser/performanceApi)。
- 框架应用：选择 [Vue 介绍](/frameworks/vue/basic/intro) 或 [React 介绍](/frameworks/react/basic/intro) 进入框架基础，再补齐路由、状态管理和组件通信。
- Vue 源码：从 [Vue 源码目录](/frameworks/vue/advanced/source-code/vueCatalog) 进入，按响应式、渲染器、调度器、编译器顺序阅读。
- 工程化与性能：阅读 [工程化导览](/frontEngineering/intro)、[Vite](/frontEngineering/build-tools/bundlers/vite)、[Monorepo](/frontEngineering/architecture/monorepo)、[Core Web Vitals](/performanceOptimization/coreWebVitals)、[Bundle 分析](/performanceOptimization/bundleAnalysis)。
- 抽象能力：阅读 [设计模式总结](/designPatterns/summary/patternSummarize)、[复杂度分析](/dataStructuresAndAlgorithms/algorithms/algorithmComplexity)、[树](/dataStructuresAndAlgorithms/data-structures/tree)、[动态规划](/dataStructuresAndAlgorithms/algorithms/dynamicProgramming)。

## 12. 实践入口

- 组件库源码：`packages/xbElement`
- mini Vue 源码：`packages/vue`
- JS 手写示例：`packages/js`
- HTML/Web API 示例：`packages/html`
- 文档站入口：[首页](/) / [工程化导览](/frontEngineering/intro) / [Vue 源码目录](/frameworks/vue/advanced/source-code/vueCatalog) / [组件库快速开始](/frameworks/vue/components/quickStart)
