import {
  ssrRenderAttrs as L,
  ssrRenderSlot as g,
  ssrInterpolate as N,
  ssrRenderAttr as K,
  ssrRenderList as Y,
  ssrRenderComponent as h,
  ssrRenderVNode as ae,
  ssrRenderClass as Pe,
  renderToString as Rs,
} from 'vue/server-renderer'
import {
  getCurrentInstance as st,
  hasInjectionContext as Ja,
  inject as me,
  watch as X,
  getCurrentScope as Ns,
  onScopeDispose as Ms,
  onMounted as Z,
  nextTick as Ve,
  isRef as Bs,
  toValue as q,
  toRef as Hs,
  readonly as ot,
  customRef as js,
  ref as R,
  shallowRef as ee,
  watchEffect as ve,
  computed as w,
  unref as m,
  reactive as Ze,
  onUnmounted as pe,
  markRaw as Fe,
  defineComponent as P,
  h as Re,
  mergeProps as x,
  useSSRContext as S,
  watchPostEffect as lt,
  onUpdated as Ds,
  resolveComponent as ge,
  createVNode as _,
  resolveDynamicComponent as te,
  withCtx as y,
  renderSlot as $,
  createTextVNode as ye,
  toDisplayString as se,
  openBlock as G,
  createBlock as U,
  createCommentVNode as ne,
  Fragment as it,
  renderList as rt,
  defineAsyncComponent as Fs,
  provide as Qa,
  toHandlers as Os,
  withKeys as Ws,
  onBeforeUnmount as zs,
  useSlots as Gs,
  createSSRApp as Us,
} from 'vue'
import { _ as V } from './plugin-vue_export-helper.CTtO9zSR.js'
import qs from 'viewerjs'
import { ElementPlusContainer as Ks } from '@vitepress-demo-preview/component'
import { D as Xs } from './x-element.BmDdUxFP.js'
import * as Oe from '@sentry/vue'
import '@fortawesome/vue-fontawesome'
import '@floating-ui/vue'
;(function () {
  try {
    var e =
      typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof globalThis < 'u'
            ? globalThis
            : typeof self < 'u'
              ? self
              : {}
    e.SENTRY_RELEASE = { id: '63d551497be1158ac55eeefaf1dec4a9182e3c76' }
    var n = new e.Error().stack
    n &&
      ((e._sentryDebugIds = e._sentryDebugIds || {}),
      (e._sentryDebugIds[n] = 'f40cb722-5835-4d21-8b47-c8069f135b5e'),
      (e._sentryDebugIdIdentifier =
        'sentry-dbid-f40cb722-5835-4d21-8b47-c8069f135b5e'))
  } catch {}
})()
function et(e) {
  return Array.isArray(e)
    ? e.map(et)
    : typeof e == 'object' && e !== null
      ? Object.keys(e).reduce((n, t) => ((n[t] = et(e[t])), n), {})
      : typeof e == 'string' && e.startsWith('_vp-fn_')
        ? new Function(`return ${e.slice(7)}`)()
        : e
}
const Ys = et(
  JSON.parse(
    '{"lang":"zh-CN","dir":"ltr","title":"寻北","description":"vitePress","base":"/CoreFront-EndConcepts/","head":[],"router":{"prefetchLinks":true},"appearance":true,"themeConfig":{"logo":{"src":"/img/blog.svg","width":24,"height":24,"alt":"CoreFront-EndConcepts Logo"},"lastUpdated":{"text":"最后更新于","formatOptions":{"dateStyle":"full","timeStyle":"medium"}},"editLink":{"pattern":"https://github.com/sentibeitaokong/CoreFront-EndConcepts/edit/main/docs/:path","text":"为此页提供修改建议"},"search":{"provider":"algolia","options":{"appId":"LQ0ZTS4SKC","apiKey":"a0e5fa8638d3a3bebe5de3cb0fdd01da","indexName":"CoreFront-EndConcepts","placeholder":"搜索文档","translations":{"button":{"buttonText":"搜索文档","buttonAriaLabel":"搜索文档"},"modal":{"searchBox":{"resetButtonTitle":"清除查询条件","resetButtonAriaLabel":"清除查询条件","cancelButtonText":"取消","cancelButtonAriaLabel":"取消"},"startScreen":{"recentSearchesTitle":"搜索历史","noRecentSearchesText":"没有搜索历史","saveRecentSearchButtonTitle":"保存至搜索历史","removeRecentSearchButtonTitle":"从搜索历史中移除","favoriteSearchesTitle":"收藏","removeFavoriteSearchButtonTitle":"从收藏中移除"},"errorScreen":{"titleText":"无法获取结果","helpText":"你可能需要检查你的网络连接"},"footer":{"selectText":"选择","navigateText":"切换","closeText":"关闭","searchByText":"搜索提供者"},"noResultsScreen":{"noResultsText":"无法找到相关结果","suggestedQueryText":"你可以尝试查询","reportMissingResultsText":"你认为该查询应该有结果？","reportMissingResultsLinkText":"点击反馈"}}}}},"lightModeSwitchTitle":"切换到白天主题","darkModeSwitchTitle":"切换到黑夜主题","langMenuLabel":"切换语言","i18nRouting":true,"outline":{"level":[2,4],"label":"页面导航"},"docFooter":{"prev":"上一页：","next":"下一页："},"nav":[{"text":"简介","link":"/intro"},{"text":"切换语言","items":[{"items":[{"text":"简体中文","link":"","activeMatch":"^/"}]}]}],"sidebar":[{"text":"简介","collapsed":true,"items":[{"text":"前端知识体系介绍","link":"/intro"}]},{"text":"html","collapsed":true,"items":[{"text":"基础","collapsed":true,"items":[{"text":"基础结构","link":"/html/basic/htmlBasicStructure"},{"text":"常用标签","link":"/html/basic/commonTags"},{"text":"Dom元素","link":"/html/basic/domAttributes"},{"text":"Dom事件流","link":"/html/basic/domEvents"},{"text":"异步脚本加载","link":"/html/basic/asyncScript"},{"text":"ajax请求","link":"/html/basic/ajax"}]},{"text":"进阶","collapsed":true,"items":[{"text":"语义化标签","link":"/html/advanced/semanticHtml"},{"text":"多媒体元素","link":"/html/advanced/multimediaElements"},{"text":"增强表单","link":"/html/advanced/enhancedForms"},{"text":"Canvas和Svg","link":"/html/advanced/canvasAndsvg"},{"text":"地理位置","link":"/html/advanced/geolocation"},{"text":"Web存储","link":"/html/advanced/webStorage"},{"text":"WebWorkers","link":"/html/advanced/webWorkers"},{"text":"WebSockets","link":"/html/advanced/webSockets"},{"text":"history路由","link":"/html/advanced/history"},{"text":"拖放","link":"/html/advanced/dragAndDrop"},{"text":"自定义数据属性","link":"/html/advanced/dataAttributes"}]}]},{"text":"css","collapsed":true,"items":[{"text":"基础","collapsed":true,"items":[{"text":"选择器","link":"/css/basic/selectors"},{"text":"继承","link":"/css/basic/inheritance"},{"text":"盒模型","link":"/css/basic/boxModel"},{"text":"文档流","link":"/css/basic/documentFlow"},{"text":"定位","link":"/css/basic/position"},{"text":"浮动","link":"/css/basic/float"}]},{"text":"进阶","collapsed":true,"items":[{"text":"视觉装饰","collapsed":true,"items":[{"text":"圆角","link":"/css/advanced/visual-decoration/borderRadius"},{"text":"阴影","link":"/css/advanced/visual-decoration/boxShadow"},{"text":"渐变","link":"/css/advanced/visual-decoration/gradients"},{"text":"背景增强","link":"/css/advanced/visual-decoration/backgroundEnhancement"},{"text":"文字效果","link":"/css/advanced/visual-decoration/textEffects"},{"text":"颜色","link":"/css/advanced/visual-decoration/colors"}]},{"text":"现代布局系统","collapsed":true,"items":[{"text":"多列布局","link":"/css/advanced/layout/multiColumn"},{"text":"Table表格布局","link":"/css/advanced/layout/tableLayout"},{"text":"Flex弹性布局","link":"/css/advanced/layout/flexibleBox"},{"text":"Grid栅格布局","link":"/css/advanced/layout/grid"}]},{"text":"动画与变换","collapsed":true,"items":[{"text":"变换","link":"/css/advanced/animation-transform/transform"},{"text":"过渡","link":"/css/advanced/animation-transform/transitions"},{"text":"动画","link":"/css/advanced/animation-transform/animations"}]},{"text":"响应式设计","collapsed":true,"items":[{"text":"媒体查询","link":"/css/advanced/responsive/mediaQueries"},{"text":"单位","link":"/css/advanced/responsive/units"}]},{"text":"工程化治理","collapsed":true,"items":[{"text":"变量","link":"/css/advanced/project/variables"},{"text":"级联层","link":"/css/advanced/project/cascadeLayer"},{"text":"容器查询","link":"/css/advanced/project/containerQueries"}]}]}]},{"text":"js","collapsed":true,"items":[{"text":"基础","collapsed":true,"items":[{"text":"数据类型","link":"/js/basic/eightTypes"},{"text":"变量声明","link":"/js/basic/variablesDeclare"},{"text":"变量解构赋值","link":"/js/basic/variablesDestructuring"},{"text":"执行上下文和执行栈","link":"/js/basic/executionContextAndStack"},{"text":"作用域","link":"/js/basic/lexicalScope"},{"text":"内存空间","link":"/js/basic/memorySpace"},{"text":"基本引用类型","link":"/js/basic/basicPrimitiveType"},{"text":"原始值包装类型","link":"/js/basic/primitiveWrapperTypes"},{"text":"集合引用类型","link":"/js/basic/collectionPrimitiveTypes"},{"text":"函数基础","link":"/js/basic/basicFunction"},{"text":"闭包","link":"/js/basic/closure"},{"text":"This全面解析","link":"/js/basic/this"},{"text":"深浅拷贝原理","link":"/js/basic/copy"},{"text":"JSON序列化","link":"/js/basic/jsonSerialize"}]},{"text":"进阶","collapsed":true,"items":[{"text":"数据类型扩展","collapsed":true,"items":[{"text":"字符串的扩展","link":"/js/advanced/data-types/string"},{"text":"正则的扩展","link":"/js/advanced/data-types/regExp"},{"text":"数值的扩展","link":"/js/advanced/data-types/number"},{"text":"函数的扩展","link":"/js/advanced/data-types/function"},{"text":"数组的扩展","link":"/js/advanced/data-types/array"},{"text":"对象的扩展","link":"/js/advanced/data-types/object"},{"text":"运算符的扩展","link":"/js/advanced/data-types/operator"},{"text":"Set和Map数据结构","link":"/js/advanced/data-types/setAndmap"}]},{"text":"事件循环和异步","collapsed":true,"items":[{"text":"Promise对象","link":"/js/advanced/async/promise"},{"text":"Iterator(遍历器)","link":"/js/advanced/async/iterator"},{"text":"Generator函数的语法","link":"/js/advanced/async/generator"},{"text":"Generator函数的异步应用","link":"/js/advanced/async/generatorApply"},{"text":"async函数","link":"/js/advanced/async/async"},{"text":"任务队列和事件循环","link":"/js/advanced/async/eventLoop"}]},{"text":"类与继承","collapsed":true,"items":[{"text":"原型、原型链、继承","link":"/js/advanced/class-inheritance/prototype"},{"text":"Class的基本语法","link":"/js/advanced/class-inheritance/classBasic"},{"text":"Class的继承","link":"/js/advanced/class-inheritance/classExtends"}]},{"text":"元编程","collapsed":true,"items":[{"text":"Symbol","link":"/js/advanced/metaprogramming/symbol"},{"text":"Proxy","link":"/js/advanced/metaprogramming/proxy"},{"text":"Reflect","link":"/js/advanced/metaprogramming/reflect"}]},{"text":"模块化","collapsed":true,"items":[{"text":"Module的语法","link":"/js/advanced/modules/module"},{"text":"Module的加载实现","link":"/js/advanced/modules/compareModule"}]},{"text":"严格模式","link":"/js/advanced/misc/strict"},{"text":"性能优化","link":"/js/advanced/misc/optimize"},{"text":"ArrayBuffer","link":"/js/advanced/misc/arrayBuffer"}]},{"text":"深入函数手写","collapsed":true,"items":[{"text":"数组方法","link":"/js/hand-writing/arrayHandleWriting"},{"text":"对象方法","link":"/js/hand-writing/objectHandleWriting"},{"text":"Function原型方法","link":"/js/hand-writing/functionHandleWriting"},{"text":"常用全局方法","link":"/js/hand-writing/globalMethods"},{"text":"高阶函数","link":"/js/hand-writing/highLevelFunction"},{"text":"promise手写","link":"/js/hand-writing/promiseHandleWriting"},{"text":"axios手写","link":"/js/hand-writing/axiosHandleWriting"}]}]},{"text":"前端框架","collapsed":true,"items":[{"text":"Vue","collapsed":true,"items":[{"text":"基础","collapsed":true,"items":[{"text":"简介","link":"/frameworks/vue/basic/intro"},{"text":"模板语法","link":"/frameworks/vue/basic/templateSyntax"},{"text":"响应式状态","link":"/frameworks/vue/basic/reactivityFundamentals"},{"text":"响应式状态派生","link":"/frameworks/vue/basic/computedAndWatch"},{"text":"模板引用","link":"/frameworks/vue/basic/templateRefs"},{"text":"生命周期","link":"/frameworks/vue/basic/lifecycleHooks"},{"text":"组件通信","link":"/frameworks/vue/basic/componentCommunication"},{"text":"异步组件","link":"/frameworks/vue/basic/asyncComponents"},{"text":"组合式函数","link":"/frameworks/vue/basic/customHooks"},{"text":"自定义指令","link":"/frameworks/vue/basic/customDirectives"},{"text":"自定义Ref","link":"/frameworks/vue/basic/customRef"},{"text":"插件","link":"/frameworks/vue/basic/plugins"},{"text":"过渡","link":"/frameworks/vue/basic/transition"},{"text":"列表过渡","link":"/frameworks/vue/basic/transitionGroup"},{"text":"组件缓存","link":"/frameworks/vue/basic/keepAlive"},{"text":"Teleport","link":"/frameworks/vue/basic/teleport"},{"text":"异步依赖边界管理器","link":"/frameworks/vue/basic/suspense"},{"text":"路由","link":"/frameworks/vue/basic/vueRouter"},{"text":"pinia","link":"/frameworks/vue/basic/pinia"},{"text":"TS与组合式API","link":"/frameworks/vue/basic/composablesTs"},{"text":"同构渲染","link":"/frameworks/vue/basic/isomorphicRendering"},{"text":"环境配置和打包","link":"/frameworks/vue/basic/buildTools"}]},{"text":"进阶","collapsed":true,"items":[{"text":"Vue 核心设计原理与基础概念","collapsed":true,"items":[{"text":"命令式编程与声明式编程","link":"/frameworks/vue/advanced/core-design/imperativeAndDeclarative"},{"text":"编译时和运行时","link":"/frameworks/vue/advanced/core-design/compileAndRun"},{"text":"响应式副作用 (effect)","link":"/frameworks/vue/advanced/core-design/slideEffect"},{"text":"TreeShaking","link":"/frameworks/vue/advanced/core-design/treeShaking"},{"text":"TypeScript支持","link":"/frameworks/vue/advanced/core-design/typescriptSupport"},{"text":"声明式UI","link":"/frameworks/vue/advanced/core-design/declarativeUI"},{"text":"虚拟 DOM","link":"/frameworks/vue/advanced/core-design/vDom"},{"text":"编译器","link":"/frameworks/vue/advanced/core-design/compiler"},{"text":"渲染器","link":"/frameworks/vue/advanced/core-design/renderer"},{"text":"组件的本质：状态与渲染","link":"/frameworks/vue/advanced/core-design/componentEssence"}]},{"text":"从源码看本质：Vue 3 响应式系统、编译器与渲染器","collapsed":true,"items":[{"text":"Vue 3 源码目录结构","link":"/frameworks/vue/advanced/source-code/vueCatalog"},{"text":"响应式系统演进","link":"/frameworks/vue/advanced/source-code/reactivityUpdate"},{"text":"响应式系统核心","collapsed":true,"items":[{"text":"reactive","link":"/frameworks/vue/advanced/source-code/reactivity-core/reactive"},{"text":"ref","link":"/frameworks/vue/advanced/source-code/reactivity-core/ref"},{"text":"computed","link":"/frameworks/vue/advanced/source-code/reactivity-core/computed"},{"text":"watch","link":"/frameworks/vue/advanced/source-code/reactivity-core/watch"},{"text":"watchEffect","link":"/frameworks/vue/advanced/source-code/reactivity-core/watchEffect"}]},{"text":"调度与异步更新","collapsed":true,"items":[{"text":"scheduler","link":"/frameworks/vue/advanced/source-code/scheduler/scheduler"},{"text":"nextTick","link":"/frameworks/vue/advanced/source-code/scheduler/nextTick"}]},{"text":"依赖注入","link":"/frameworks/vue/advanced/source-code/provideAndInject"},{"text":"虚拟 DOM 与渲染器","collapsed":true,"items":[{"text":"vnode","link":"/frameworks/vue/advanced/source-code/renderer/vnode"},{"text":"createRenderer","link":"/frameworks/vue/advanced/source-code/renderer/createRenderer"},{"text":"nodeOps","link":"/frameworks/vue/advanced/source-code/renderer/nodeOps"},{"text":"processElement","link":"/frameworks/vue/advanced/source-code/renderer/processElement"},{"text":"processText","link":"/frameworks/vue/advanced/source-code/renderer/processText"},{"text":"processCommentNode","link":"/frameworks/vue/advanced/source-code/renderer/processCommentNode"},{"text":"processFragment","link":"/frameworks/vue/advanced/source-code/renderer/processFragment"},{"text":"processComponent","link":"/frameworks/vue/advanced/source-code/renderer/processComponent"}]},{"text":"Diff 算法演进","link":"/frameworks/vue/advanced/source-code/patchKeyedChildren"},{"text":"Vue 3 特殊组件揭秘","collapsed":true,"items":[{"text":"异步组件","link":"/frameworks/vue/advanced/source-code/special-components/defineAsyncComponent"},{"text":"组件缓存","link":"/frameworks/vue/advanced/source-code/special-components/keepAliveComponent"},{"text":"Teleport组件","link":"/frameworks/vue/advanced/source-code/special-components/teleportComponent"},{"text":"Transition组件","link":"/frameworks/vue/advanced/source-code/special-components/transitionComponent"}]},{"text":"Vue 3 编译器核心技术解析","collapsed":true,"items":[{"text":"编译器核心技术概览","link":"/frameworks/vue/advanced/source-code/compiler/compilerInfo"},{"text":"解析阶段","link":"/frameworks/vue/advanced/source-code/compiler/parser"},{"text":"转换/优化阶段","link":"/frameworks/vue/advanced/source-code/compiler/transform"},{"text":"代码生成阶段","link":"/frameworks/vue/advanced/source-code/compiler/codegen"}]}]}]},{"text":"自定义组件库","collapsed":true,"items":[{"text":"快速开始","link":"/frameworks/vue/components/quickStart"},{"text":"Button 按钮","link":"/frameworks/vue/components/button"},{"text":"Progress 进度条","link":"/frameworks/vue/components/progress"},{"text":"Collapse 折叠面板","link":"/frameworks/vue/components/collapse"},{"text":"Tooltip 文字提示","link":"/frameworks/vue/components/tooltip"},{"text":"Dropdown 下拉菜单","link":"/frameworks/vue/components/dropdown"},{"text":"Message 消息提示","link":"/frameworks/vue/components/message"},{"text":"Input 输入框","link":"/frameworks/vue/components/input"},{"text":"Switch 开关","link":"/frameworks/vue/components/switch"},{"text":"Select 选择器","link":"/frameworks/vue/components/select"},{"text":"Form 表单","link":"/frameworks/vue/components/form"}]}]},{"text":"React","collapsed":true,"items":[{"text":"基础","collapsed":true,"items":[{"text":"简介","link":"/frameworks/react/basic/intro"},{"text":"JSX语法","link":"/frameworks/react/basic/jsx"},{"text":"元素渲染","link":"/frameworks/react/basic/elementRendering"},{"text":"事件处理","link":"/frameworks/react/basic/handlingEvents"},{"text":"条件渲染","link":"/frameworks/react/basic/conditionalRendering"},{"text":"列表渲染","link":"/frameworks/react/basic/listRendering"},{"text":"state和生命周期","link":"/frameworks/react/basic/stateAndLifecycle"},{"text":"组件和props","link":"/frameworks/react/basic/componentAndProps"},{"text":"组件的导入和导出","link":"/frameworks/react/basic/importAndExport"},{"text":"组件通信","link":"/frameworks/react/basic/componentCommunication"},{"text":"表单","link":"/frameworks/react/basic/form"},{"text":"性能优化","link":"/frameworks/react/basic/performanceOptimization"},{"text":"高阶组件","link":"/frameworks/react/basic/hoc"},{"text":"CSS样式工程化","link":"/frameworks/react/basic/style"},{"text":"动画","link":"/frameworks/react/basic/reactTransitionGroup"},{"text":"Portals","link":"/frameworks/react/basic/portals"},{"text":"Redux和中间件","link":"/frameworks/react/basic/react_redux"},{"text":"路由","link":"/frameworks/react/basic/react_router"},{"text":"Hooks","collapsed":true,"items":[{"text":"useState","link":"/frameworks/react/basic/hooks/useState"},{"text":"useReducer","link":"/frameworks/react/basic/hooks/useReducer"},{"text":"useEffect","link":"/frameworks/react/basic/hooks/useEffect"},{"text":"useEffectEvent","link":"/frameworks/react/basic/hooks/useEffectEvent"},{"text":"useLayoutEffect","link":"/frameworks/react/basic/hooks/useLayoutEffect"},{"text":"useContext","link":"/frameworks/react/basic/hooks/useContext"},{"text":"useCallback","link":"/frameworks/react/basic/hooks/useCallback"},{"text":"useMemo","link":"/frameworks/react/basic/hooks/useMemo"},{"text":"useRef","link":"/frameworks/react/basic/hooks/useRef"},{"text":"useImperativeHandle","link":"/frameworks/react/basic/hooks/useImperativeHandle"},{"text":"useActionState","link":"/frameworks/react/basic/hooks/useActionState"},{"text":"useDebugValue","link":"/frameworks/react/basic/hooks/useDebugValue"},{"text":"useDeferredValue","link":"/frameworks/react/basic/hooks/useDeferredValue"},{"text":"useTransition","link":"/frameworks/react/basic/hooks/useTransition"},{"text":"useId","link":"/frameworks/react/basic/hooks/useId"},{"text":"useInsertionEffect","link":"/frameworks/react/basic/hooks/useInsertionEffect"},{"text":"useOptimistic","link":"/frameworks/react/basic/hooks/useOptimistic"},{"text":"useSyncExternalStore","link":"/frameworks/react/basic/hooks/useSyncExternalStore"},{"text":"useFormStatus","link":"/frameworks/react/basic/hooks/useFormStatus"}]},{"text":"自定义Hooks","link":"/frameworks/react/basic/customHook"},{"text":"环境配置和打包","link":"/frameworks/react/basic/buildTools"},{"text":"React注意点","link":"/frameworks/react/basic/importantInfo"}]},{"text":"进阶","collapsed":true,"items":[]}]}]},{"text":"Git","collapsed":true,"items":[{"text":"git命令","link":"/git/git"}]},{"text":"正则表达式","collapsed":true,"items":[{"text":"Regexp命令","link":"/regexp/regexp"}]},{"text":"Typescript","collapsed":true,"items":[{"text":"核心语法","link":"/typescript/typescript"}]},{"text":"前端工程化","collapsed":true,"items":[{"text":"简介","link":"/frontEngineering/intro"},{"text":"模块化与组件化开发","collapsed":true,"items":[{"text":"js模块化","link":"/frontEngineering/module-component/javascriptModules"},{"text":"css工程化","link":"/frontEngineering/module-component/cssProject"},{"text":"组件化思维","link":"/frontEngineering/module-component/modules"}]},{"text":"常用工具介绍","link":"/frontEngineering/engineerTools"},{"text":"包管理器与依赖管理","collapsed":true,"items":[{"text":"包管理器","link":"/frontEngineering/package-management/packageManagers"},{"text":"依赖管理","link":"/frontEngineering/package-management/packageJson"}]},{"text":"构建工具","collapsed":true,"items":[{"text":"综合构建与打包","collapsed":true,"items":[{"text":"Webpack","link":"/frontEngineering/build-tools/bundlers/webpack"},{"text":"vite","link":"/frontEngineering/build-tools/bundlers/vite"},{"text":"Rspack","link":"/frontEngineering/build-tools/bundlers/rspack"},{"text":"Turbopack","link":"/frontEngineering/build-tools/bundlers/turbopack"},{"text":"gulp","link":"/frontEngineering/build-tools/bundlers/gulp"},{"text":"parcel","link":"/frontEngineering/build-tools/bundlers/parcel"}]},{"text":"底层编译与打包引擎","link":"/frontEngineering/build-tools/compilers/codeCompilers"},{"text":"类库独立打包","collapsed":true,"items":[{"text":"tsup","link":"/frontEngineering/build-tools/library-bundling/tsup"},{"text":"Rollup","link":"/frontEngineering/build-tools/library-bundling/rollup"}]}]},{"text":"代码规范与质量控制","link":"/frontEngineering/quality/linters"},{"text":"错误处理","link":"/frontEngineering/quality/errorHandling"},{"text":"自动化测试","link":"/frontEngineering/quality/testing"},{"text":"CI/CD 与持续部署","collapsed":true,"items":[{"text":"CI/CD 工具","link":"/frontEngineering/ci-cd/ci-cd"},{"text":"部署环境","link":"/frontEngineering/ci-cd/deploymentEnvironments"}]},{"text":"异常捕获与性能监控","link":"/frontEngineering/quality/performanceMonitoring"},{"text":"架构演进:Monorepo与微前端","collapsed":true,"items":[{"text":"Monorepo（单体仓库）","link":"/frontEngineering/architecture/monorepo"}]}]},{"text":"设计模式与架构模式","collapsed":true,"items":[{"text":"单例模式","link":"/designPatterns/creational/singletonPattern"},{"text":"工厂模式","link":"/designPatterns/creational/factoryPattern"},{"text":"构造器模式","link":"/designPatterns/creational/constructorPattern"},{"text":"原型模式","link":"/designPatterns/creational/prototypePattern"},{"text":"策略模式","link":"/designPatterns/behavioral/strategyPattern"},{"text":"状态模式","link":"/designPatterns/behavioral/statePattern"},{"text":"模块模式","link":"/designPatterns/behavioral/modulePattern"},{"text":"代理模式","link":"/designPatterns/structural/proxyPattern"},{"text":"装饰器模式","link":"/designPatterns/structural/decoratorPattern"},{"text":"适配器模式","link":"/designPatterns/structural/adapterPattern"},{"text":"迭代器模式","link":"/designPatterns/behavioral/iteratorPattern"},{"text":"发布订阅模式","link":"/designPatterns/behavioral/pubSubPattern"},{"text":"观察者模式","link":"/designPatterns/behavioral/observerPattern"},{"text":"中介者模式","link":"/designPatterns/behavioral/mediatorPattern"},{"text":"外观模式","link":"/designPatterns/structural/facadePattern"},{"text":"命令模式","link":"/designPatterns/behavioral/commandPattern"},{"text":"组合模式","link":"/designPatterns/structural/compositePattern"},{"text":"享元模式","link":"/designPatterns/structural/flyweightPattern"},{"text":"模板方法模式","link":"/designPatterns/behavioral/templateMethodPattern"},{"text":"职责链模式","link":"/designPatterns/behavioral/chainofResponsibilityPattern"},{"text":"MVC模式","link":"/designPatterns/architecture/MVC"},{"text":"MVVM模式","link":"/designPatterns/architecture/MVVM"},{"text":"核心原则","link":"/designPatterns/summary/patternPrinciple"},{"text":"总结","link":"/designPatterns/summary/patternSummarize"}]},{"text":"数据结构和算法","collapsed":true,"items":[{"text":"数据结构","collapsed":true,"items":[{"text":"数组","link":"/dataStructuresAndAlgorithms/data-structures/array"},{"text":"栈","link":"/dataStructuresAndAlgorithms/data-structures/stack"},{"text":"队列","link":"/dataStructuresAndAlgorithms/data-structures/queue"},{"text":"链表","link":"/dataStructuresAndAlgorithms/data-structures/linkedList"},{"text":"集合","link":"/dataStructuresAndAlgorithms/data-structures/set"},{"text":"字典","link":"/dataStructuresAndAlgorithms/data-structures/map"},{"text":"树","link":"/dataStructuresAndAlgorithms/data-structures/tree"},{"text":"堆","link":"/dataStructuresAndAlgorithms/data-structures/heap"},{"text":"图","link":"/dataStructuresAndAlgorithms/data-structures/graph"},{"text":"哈希表","link":"/dataStructuresAndAlgorithms/data-structures/hashTable"}]},{"text":"算法","collapsed":true,"items":[{"text":"排序算法","link":"/dataStructuresAndAlgorithms/algorithms/sortAlgorithms"},{"text":"查找算法","link":"/dataStructuresAndAlgorithms/algorithms/searchAlgorithms"},{"text":"递归算法","link":"/dataStructuresAndAlgorithms/algorithms/recursionAlgorithms"},{"text":"动态规划","link":"/dataStructuresAndAlgorithms/algorithms/dynamicProgramming"},{"text":"贪心算法","link":"/dataStructuresAndAlgorithms/algorithms/greedyAlgorithms"},{"text":"回溯算法","link":"/dataStructuresAndAlgorithms/algorithms/backTrackingAlgorithms"},{"text":"广度优先遍历","link":"/dataStructuresAndAlgorithms/algorithms/BFS"},{"text":"深度优先遍历","link":"/dataStructuresAndAlgorithms/algorithms/DFS"},{"text":"双指针","link":"/dataStructuresAndAlgorithms/algorithms/twoPointers"},{"text":"滑动窗口","link":"/dataStructuresAndAlgorithms/algorithms/slideWindow"},{"text":"算法复杂度","link":"/dataStructuresAndAlgorithms/algorithms/algorithmComplexity"}]}]},{"text":"网络协议与浏览器工作原理","collapsed":true,"items":[{"text":"Http协议","link":"/networkAndBrowsers/protocols/http"},{"text":"Https协议","link":"/networkAndBrowsers/protocols/https"},{"text":"tcp协议","link":"/networkAndBrowsers/protocols/tcp"},{"text":"udp协议","link":"/networkAndBrowsers/protocols/udp"},{"text":"ip协议","link":"/networkAndBrowsers/protocols/ip"},{"text":"Http常见报文头","link":"/networkAndBrowsers/protocols/headers"},{"text":"DNS解析","link":"/networkAndBrowsers/protocols/dns"},{"text":"CDN加速原理","link":"/networkAndBrowsers/protocols/cdn"},{"text":"浏览器缓存机制","link":"/networkAndBrowsers/browser/browserCache"},{"text":"浏览器渲染机制","link":"/networkAndBrowsers/browser/renderingProcess"},{"text":"进程和线程","link":"/networkAndBrowsers/process-model/processAndThread"},{"text":"OSI七层模型","link":"/networkAndBrowsers/protocols/osi"}]},{"text":"Web 安全体系","collapsed":true,"items":[{"text":"XSS 与 CSRF","link":"/webSecurity/csrfAndXss"},{"text":"跨域与同源策略","link":"/webSecurity/crossOrigin"},{"text":"CORS","link":"/webSecurity/cors"}]}],"socialLinks":[{"icon":"github","link":"https://github.com/sentibeitaokong/CoreFront-EndConcepts"}]},"locales":{},"scrollOffset":134,"cleanUrls":true}',
  ),
)
function Za(e) {
  return Ns() ? (Ms(e), !0) : !1
}
const We = new WeakMap(),
  Js = (...e) => {
    var n
    const t = e[0],
      a = (n = st()) == null ? void 0 : n.proxy
    if (a == null && !Ja())
      throw new Error('injectLocal must be called in setup')
    return a && We.has(a) && t in We.get(a) ? We.get(a)[t] : me(...e)
  },
  es = typeof window < 'u' && typeof document < 'u'
typeof WorkerGlobalScope < 'u' && globalThis instanceof WorkerGlobalScope
const Qs = Object.prototype.toString,
  Zs = e => Qs.call(e) === '[object Object]',
  fe = () => {},
  Cn = eo()
function eo() {
  var e, n
  return (
    es &&
    ((e = window == null ? void 0 : window.navigator) == null
      ? void 0
      : e.userAgent) &&
    (/iP(?:ad|hone|od)/.test(window.navigator.userAgent) ||
      (((n = window == null ? void 0 : window.navigator) == null
        ? void 0
        : n.maxTouchPoints) > 2 &&
        /iPad|Macintosh/.test(
          window == null ? void 0 : window.navigator.userAgent,
        )))
  )
}
function ct(e, n) {
  function t(...a) {
    return new Promise((s, i) => {
      Promise.resolve(
        e(() => n.apply(this, a), { fn: n, thisArg: this, args: a }),
      )
        .then(s)
        .catch(i)
    })
  }
  return t
}
const ts = e => e()
function to(e, n = {}) {
  let t,
    a,
    s = fe
  const i = o => {
    ;(clearTimeout(o), s(), (s = fe))
  }
  let r
  return o => {
    const c = q(e),
      d = q(n.maxWait)
    return (
      t && i(t),
      c <= 0 || (d !== void 0 && d <= 0)
        ? (a && (i(a), (a = null)), Promise.resolve(o()))
        : new Promise((u, k) => {
            ;((s = n.rejectOnCancel ? k : u),
              (r = o),
              d &&
                !a &&
                (a = setTimeout(() => {
                  ;(t && i(t), (a = null), u(r()))
                }, d)),
              (t = setTimeout(() => {
                ;(a && i(a), (a = null), u(o()))
              }, c)))
          })
    )
  }
}
function no(...e) {
  let n = 0,
    t,
    a = !0,
    s = fe,
    i,
    r,
    l,
    o,
    c
  !Bs(e[0]) && typeof e[0] == 'object'
    ? ({
        delay: r,
        trailing: l = !0,
        leading: o = !0,
        rejectOnCancel: c = !1,
      } = e[0])
    : ([r, l = !0, o = !0, c = !1] = e)
  const d = () => {
    t && (clearTimeout(t), (t = void 0), s(), (s = fe))
  }
  return k => {
    const v = q(r),
      f = Date.now() - n,
      p = () => (i = k())
    return (
      d(),
      v <= 0
        ? ((n = Date.now()), p())
        : (f > v && (o || !a)
            ? ((n = Date.now()), p())
            : l &&
              (i = new Promise((b, C) => {
                ;((s = c ? C : b),
                  (t = setTimeout(
                    () => {
                      ;((n = Date.now()), (a = !0), b(p()), d())
                    },
                    Math.max(0, v - f),
                  )))
              })),
          !o && !t && (t = setTimeout(() => (a = !0), v)),
          (a = !1),
          i)
    )
  }
}
function ao(e = ts, n = {}) {
  const { initialState: t = 'active' } = n,
    a = dt(t === 'active')
  function s() {
    a.value = !1
  }
  function i() {
    a.value = !0
  }
  const r = (...l) => {
    a.value && e(...l)
  }
  return { isActive: ot(a), pause: s, resume: i, eventFilter: r }
}
function An(e) {
  return e.endsWith('rem') ? Number.parseFloat(e) * 16 : Number.parseFloat(e)
}
function so(e) {
  return st()
}
function ze(e) {
  return Array.isArray(e) ? e : [e]
}
function dt(...e) {
  if (e.length !== 1) return Hs(...e)
  const n = e[0]
  return typeof n == 'function' ? ot(js(() => ({ get: n, set: fe }))) : R(n)
}
function oo(e, n = 200, t = {}) {
  return ct(to(n, t), e)
}
function lo(e, n = 200, t = !1, a = !0, s = !1) {
  return ct(no(n, t, a, s), e)
}
function io(e, n, t = {}) {
  const { eventFilter: a = ts, ...s } = t
  return X(e, ct(a, n), s)
}
function ro(e, n, t = {}) {
  const { eventFilter: a, initialState: s = 'active', ...i } = t,
    {
      eventFilter: r,
      pause: l,
      resume: o,
      isActive: c,
    } = ao(a, { initialState: s })
  return {
    stop: io(e, n, { ...i, eventFilter: r }),
    pause: l,
    resume: o,
    isActive: c,
  }
}
function Be(e, n = !0, t) {
  so() ? Z(e, t) : n ? e() : Ve(e)
}
function co(e, n, t) {
  return X(e, n, { ...t, immediate: !0 })
}
const oe = es ? window : void 0
function ut(e) {
  var n
  const t = q(e)
  return (n = t == null ? void 0 : t.$el) != null ? n : t
}
function le(...e) {
  const n = [],
    t = () => {
      ;(n.forEach(l => l()), (n.length = 0))
    },
    a = (l, o, c, d) => (
      l.addEventListener(o, c, d),
      () => l.removeEventListener(o, c, d)
    ),
    s = w(() => {
      const l = ze(q(e[0])).filter(o => o != null)
      return l.every(o => typeof o != 'string') ? l : void 0
    }),
    i = co(
      () => {
        var l, o
        return [
          (o = (l = s.value) == null ? void 0 : l.map(c => ut(c))) != null
            ? o
            : [oe].filter(c => c != null),
          ze(q(s.value ? e[1] : e[0])),
          ze(m(s.value ? e[2] : e[1])),
          q(s.value ? e[3] : e[2]),
        ]
      },
      ([l, o, c, d]) => {
        if (
          (t(),
          !(l != null && l.length) ||
            !(o != null && o.length) ||
            !(c != null && c.length))
        )
          return
        const u = Zs(d) ? { ...d } : d
        n.push(...l.flatMap(k => o.flatMap(v => c.map(f => a(k, v, f, u)))))
      },
      { flush: 'post' },
    ),
    r = () => {
      ;(i(), t())
    }
  return (Za(t), r)
}
function uo() {
  const e = ee(!1),
    n = st()
  return (
    n &&
      Z(() => {
        e.value = !0
      }, n),
    e
  )
}
function fo(e) {
  const n = uo()
  return w(() => (n.value, !!e()))
}
function mo(e) {
  return typeof e == 'function'
    ? e
    : typeof e == 'string'
      ? n => n.key === e
      : Array.isArray(e)
        ? n => e.includes(n.key)
        : () => !0
}
function vo(...e) {
  let n,
    t,
    a = {}
  e.length === 3
    ? ((n = e[0]), (t = e[1]), (a = e[2]))
    : e.length === 2
      ? typeof e[1] == 'object'
        ? ((n = !0), (t = e[0]), (a = e[1]))
        : ((n = e[0]), (t = e[1]))
      : ((n = !0), (t = e[0]))
  const {
      target: s = oe,
      eventName: i = 'keydown',
      passive: r = !1,
      dedupe: l = !1,
    } = a,
    o = mo(n)
  return le(
    s,
    i,
    d => {
      ;(d.repeat && q(l)) || (o(d) && t(d))
    },
    r,
  )
}
const po = Symbol('vueuse-ssr-width')
function go() {
  const e = Ja() ? Js(po, null) : null
  return typeof e == 'number' ? e : void 0
}
function xe(e, n = {}) {
  const { window: t = oe, ssrWidth: a = go() } = n,
    s = fo(() => t && 'matchMedia' in t && typeof t.matchMedia == 'function'),
    i = ee(typeof a == 'number'),
    r = ee(),
    l = ee(!1),
    o = c => {
      l.value = c.matches
    }
  return (
    ve(() => {
      if (i.value) {
        i.value = !s.value
        const c = q(e).split(',')
        l.value = c.some(d => {
          const u = d.includes('not all'),
            k = d.match(/\(\s*min-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/),
            v = d.match(/\(\s*max-width:\s*(-?\d+(?:\.\d*)?[a-z]+\s*)\)/)
          let f = !!(k || v)
          return (
            k && f && (f = a >= An(k[1])),
            v && f && (f = a <= An(v[1])),
            u ? !f : f
          )
        })
        return
      }
      s.value && ((r.value = t.matchMedia(q(e))), (l.value = r.value.matches))
    }),
    le(r, 'change', o, { passive: !0 }),
    w(() => l.value)
  )
}
const Ce =
    typeof globalThis < 'u'
      ? globalThis
      : typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof self < 'u'
            ? self
            : {},
  Ae = '__vueuse_ssr_handlers__',
  bo = ko()
function ko() {
  return (Ae in Ce || (Ce[Ae] = Ce[Ae] || {}), Ce[Ae])
}
function ns(e, n) {
  return bo[e] || n
}
function as(e) {
  return xe('(prefers-color-scheme: dark)', e)
}
function ho(e) {
  return e == null
    ? 'any'
    : e instanceof Set
      ? 'set'
      : e instanceof Map
        ? 'map'
        : e instanceof Date
          ? 'date'
          : typeof e == 'boolean'
            ? 'boolean'
            : typeof e == 'string'
              ? 'string'
              : typeof e == 'object'
                ? 'object'
                : Number.isNaN(e)
                  ? 'any'
                  : 'number'
}
const yo = {
    boolean: { read: e => e === 'true', write: e => String(e) },
    object: { read: e => JSON.parse(e), write: e => JSON.stringify(e) },
    number: { read: e => Number.parseFloat(e), write: e => String(e) },
    any: { read: e => e, write: e => String(e) },
    string: { read: e => e, write: e => String(e) },
    map: {
      read: e => new Map(JSON.parse(e)),
      write: e => JSON.stringify(Array.from(e.entries())),
    },
    set: {
      read: e => new Set(JSON.parse(e)),
      write: e => JSON.stringify(Array.from(e)),
    },
    date: { read: e => new Date(e), write: e => e.toISOString() },
  },
  Tn = 'vueuse-storage'
function $o(e, n, t, a = {}) {
  var s
  const {
      flush: i = 'pre',
      deep: r = !0,
      listenToStorageChanges: l = !0,
      writeDefaults: o = !0,
      mergeDefaults: c = !1,
      shallow: d,
      window: u = oe,
      eventFilter: k,
      onError: v = A => {
        console.error(A)
      },
      initOnMounted: f,
    } = a,
    p = (d ? ee : R)(typeof n == 'function' ? n() : n),
    b = w(() => q(e))
  if (!t)
    try {
      t = ns('getDefaultStorage', () => {
        var A
        return (A = oe) == null ? void 0 : A.localStorage
      })()
    } catch (A) {
      v(A)
    }
  if (!t) return p
  const C = q(n),
    I = ho(C),
    z = (s = a.serializer) != null ? s : yo[I],
    { pause: M, resume: F } = ro(p, () => T(p.value), {
      flush: i,
      deep: r,
      eventFilter: k,
    })
  ;(X(b, () => H(), { flush: i }),
    u &&
      l &&
      Be(() => {
        ;(t instanceof Storage
          ? le(u, 'storage', H, { passive: !0 })
          : le(u, Tn, J),
          f && H())
      }),
    f || H())
  function B(A, D) {
    if (u) {
      const j = { key: b.value, oldValue: A, newValue: D, storageArea: t }
      u.dispatchEvent(
        t instanceof Storage
          ? new StorageEvent('storage', j)
          : new CustomEvent(Tn, { detail: j }),
      )
    }
  }
  function T(A) {
    try {
      const D = t.getItem(b.value)
      if (A == null) (B(D, null), t.removeItem(b.value))
      else {
        const j = z.write(A)
        D !== j && (t.setItem(b.value, j), B(D, j))
      }
    } catch (D) {
      v(D)
    }
  }
  function W(A) {
    const D = A ? A.newValue : t.getItem(b.value)
    if (D == null) return (o && C != null && t.setItem(b.value, z.write(C)), C)
    if (!A && c) {
      const j = z.read(D)
      return typeof c == 'function'
        ? c(j, C)
        : I === 'object' && !Array.isArray(j)
          ? { ...C, ...j }
          : j
    } else return typeof D != 'string' ? D : z.read(D)
  }
  function H(A) {
    if (!(A && A.storageArea !== t)) {
      if (A && A.key == null) {
        p.value = C
        return
      }
      if (!(A && A.key !== b.value)) {
        M()
        try {
          ;(A == null ? void 0 : A.newValue) !== z.write(p.value) &&
            (p.value = W(A))
        } catch (D) {
          v(D)
        } finally {
          A ? Ve(F) : F()
        }
      }
    }
  }
  function J(A) {
    H(A.detail)
  }
  return p
}
const xo =
  '*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}'
function wo(e = {}) {
  const {
      selector: n = 'html',
      attribute: t = 'class',
      initialValue: a = 'auto',
      window: s = oe,
      storage: i,
      storageKey: r = 'vueuse-color-scheme',
      listenToStorageChanges: l = !0,
      storageRef: o,
      emitAuto: c,
      disableTransition: d = !0,
    } = e,
    u = { auto: '', light: 'light', dark: 'dark', ...(e.modes || {}) },
    k = as({ window: s }),
    v = w(() => (k.value ? 'dark' : 'light')),
    f =
      o ||
      (r == null
        ? dt(a)
        : $o(r, a, i, { window: s, listenToStorageChanges: l })),
    p = w(() => (f.value === 'auto' ? v.value : f.value)),
    b = ns('updateHTMLAttrs', (M, F, B) => {
      const T =
        typeof M == 'string'
          ? s == null
            ? void 0
            : s.document.querySelector(M)
          : ut(M)
      if (!T) return
      const W = new Set(),
        H = new Set()
      let J = null
      if (F === 'class') {
        const D = B.split(/\s/g)
        Object.values(u)
          .flatMap(j => (j || '').split(/\s/g))
          .filter(Boolean)
          .forEach(j => {
            D.includes(j) ? W.add(j) : H.add(j)
          })
      } else J = { key: F, value: B }
      if (W.size === 0 && H.size === 0 && J === null) return
      let A
      d &&
        ((A = s.document.createElement('style')),
        A.appendChild(document.createTextNode(xo)),
        s.document.head.appendChild(A))
      for (const D of W) T.classList.add(D)
      for (const D of H) T.classList.remove(D)
      ;(J && T.setAttribute(J.key, J.value),
        d && (s.getComputedStyle(A).opacity, document.head.removeChild(A)))
    })
  function C(M) {
    var F
    b(n, t, (F = u[M]) != null ? F : M)
  }
  function I(M) {
    e.onChanged ? e.onChanged(M, C) : C(M)
  }
  ;(X(p, I, { flush: 'post', immediate: !0 }), Be(() => I(p.value)))
  const z = w({
    get() {
      return c ? f.value : p.value
    },
    set(M) {
      f.value = M
    },
  })
  return Object.assign(z, { store: f, system: v, state: p })
}
function So(e = {}) {
  const { valueDark: n = 'dark', valueLight: t = '' } = e,
    a = wo({
      ...e,
      onChanged: (r, l) => {
        var o
        e.onChanged
          ? (o = e.onChanged) == null || o.call(e, r === 'dark', l, r)
          : l(r)
      },
      modes: { dark: n, light: t },
    }),
    s = w(() => a.system.value)
  return w({
    get() {
      return a.value === 'dark'
    },
    set(r) {
      const l = r ? 'dark' : 'light'
      s.value === l ? (a.value = 'auto') : (a.value = l)
    },
  })
}
function Ge(e) {
  return typeof Window < 'u' && e instanceof Window
    ? e.document.documentElement
    : typeof Document < 'u' && e instanceof Document
      ? e.documentElement
      : e
}
const _n = 1
function Po(e, n = {}) {
  const {
      throttle: t = 0,
      idle: a = 200,
      onStop: s = fe,
      onScroll: i = fe,
      offset: r = { left: 0, right: 0, top: 0, bottom: 0 },
      eventListenerOptions: l = { capture: !1, passive: !0 },
      behavior: o = 'auto',
      window: c = oe,
      onError: d = T => {
        console.error(T)
      },
    } = n,
    u = ee(0),
    k = ee(0),
    v = w({
      get() {
        return u.value
      },
      set(T) {
        p(T, void 0)
      },
    }),
    f = w({
      get() {
        return k.value
      },
      set(T) {
        p(void 0, T)
      },
    })
  function p(T, W) {
    var H, J, A, D
    if (!c) return
    const j = q(e)
    if (!j) return
    ;(A = j instanceof Document ? c.document.body : j) == null ||
      A.scrollTo({
        top: (H = q(W)) != null ? H : f.value,
        left: (J = q(T)) != null ? J : v.value,
        behavior: q(o),
      })
    const re =
      ((D = j == null ? void 0 : j.document) == null
        ? void 0
        : D.documentElement) ||
      (j == null ? void 0 : j.documentElement) ||
      j
    ;(v != null && (u.value = re.scrollLeft),
      f != null && (k.value = re.scrollTop))
  }
  const b = ee(!1),
    C = Ze({ left: !0, right: !1, top: !0, bottom: !1 }),
    I = Ze({ left: !1, right: !1, top: !1, bottom: !1 }),
    z = T => {
      b.value &&
        ((b.value = !1),
        (I.left = !1),
        (I.right = !1),
        (I.top = !1),
        (I.bottom = !1),
        s(T))
    },
    M = oo(z, t + a),
    F = T => {
      var W
      if (!c) return
      const H =
          ((W = T == null ? void 0 : T.document) == null
            ? void 0
            : W.documentElement) ||
          (T == null ? void 0 : T.documentElement) ||
          ut(T),
        { display: J, flexDirection: A, direction: D } = getComputedStyle(H),
        j = D === 'rtl' ? -1 : 1,
        re = H.scrollLeft
      ;((I.left = re < u.value), (I.right = re > u.value))
      const Sn = Math.abs(re * j) <= (r.left || 0),
        Pn =
          Math.abs(re * j) + H.clientWidth >=
          H.scrollWidth - (r.right || 0) - _n
      ;(J === 'flex' && A === 'row-reverse'
        ? ((C.left = Pn), (C.right = Sn))
        : ((C.left = Sn), (C.right = Pn)),
        (u.value = re))
      let ue = H.scrollTop
      ;(T === c.document && !ue && (ue = c.document.body.scrollTop),
        (I.top = ue < k.value),
        (I.bottom = ue > k.value))
      const Vn = Math.abs(ue) <= (r.top || 0),
        Ln =
          Math.abs(ue) + H.clientHeight >= H.scrollHeight - (r.bottom || 0) - _n
      ;(J === 'flex' && A === 'column-reverse'
        ? ((C.top = Ln), (C.bottom = Vn))
        : ((C.top = Vn), (C.bottom = Ln)),
        (k.value = ue))
    },
    B = T => {
      var W
      if (!c) return
      const H = (W = T.target.documentElement) != null ? W : T.target
      ;(F(H), (b.value = !0), M(T), i(T))
    }
  return (
    le(e, 'scroll', t ? lo(B, t, !0, !1) : B, l),
    Be(() => {
      try {
        const T = q(e)
        if (!T) return
        F(T)
      } catch (T) {
        d(T)
      }
    }),
    le(e, 'scrollend', z, l),
    {
      x: v,
      y: f,
      isScrolling: b,
      arrivedState: C,
      directions: I,
      measure() {
        const T = q(e)
        c && T && F(T)
      },
    }
  )
}
function ss(e) {
  const n = window.getComputedStyle(e)
  if (
    n.overflowX === 'scroll' ||
    n.overflowY === 'scroll' ||
    (n.overflowX === 'auto' && e.clientWidth < e.scrollWidth) ||
    (n.overflowY === 'auto' && e.clientHeight < e.scrollHeight)
  )
    return !0
  {
    const t = e.parentNode
    return !t || t.tagName === 'BODY' ? !1 : ss(t)
  }
}
function Vo(e) {
  const n = e || window.event,
    t = n.target
  return ss(t)
    ? !1
    : n.touches.length > 1
      ? !0
      : (n.preventDefault && n.preventDefault(), !1)
}
const Ue = new WeakMap()
function os(e, n = !1) {
  const t = ee(n)
  let a = null,
    s = ''
  X(
    dt(e),
    l => {
      const o = Ge(q(l))
      if (o) {
        const c = o
        if (
          (Ue.get(c) || Ue.set(c, c.style.overflow),
          c.style.overflow !== 'hidden' && (s = c.style.overflow),
          c.style.overflow === 'hidden')
        )
          return (t.value = !0)
        if (t.value) return (c.style.overflow = 'hidden')
      }
    },
    { immediate: !0 },
  )
  const i = () => {
      const l = Ge(q(e))
      !l ||
        t.value ||
        (Cn &&
          (a = le(
            l,
            'touchmove',
            o => {
              Vo(o)
            },
            { passive: !1 },
          )),
        (l.style.overflow = 'hidden'),
        (t.value = !0))
    },
    r = () => {
      const l = Ge(q(e))
      !l ||
        !t.value ||
        (Cn && (a == null || a()),
        (l.style.overflow = s),
        Ue.delete(l),
        (t.value = !1))
    }
  return (
    Za(r),
    w({
      get() {
        return t.value
      },
      set(l) {
        l ? i() : r()
      },
    })
  )
}
function ls(e = {}) {
  const { window: n = oe, ...t } = e
  return Po(n, t)
}
function Lo(e = {}) {
  const {
      window: n = oe,
      initialWidth: t = Number.POSITIVE_INFINITY,
      initialHeight: a = Number.POSITIVE_INFINITY,
      listenOrientation: s = !0,
      includeScrollbar: i = !0,
      type: r = 'inner',
    } = e,
    l = ee(t),
    o = ee(a),
    c = () => {
      if (n)
        if (r === 'outer') ((l.value = n.outerWidth), (o.value = n.outerHeight))
        else if (r === 'visual' && n.visualViewport) {
          const { width: u, height: k, scale: v } = n.visualViewport
          ;((l.value = Math.round(u * v)), (o.value = Math.round(k * v)))
        } else
          i
            ? ((l.value = n.innerWidth), (o.value = n.innerHeight))
            : ((l.value = n.document.documentElement.clientWidth),
              (o.value = n.document.documentElement.clientHeight))
    }
  ;(c(), Be(c))
  const d = { passive: !0 }
  if (
    (le('resize', c, d),
    n &&
      r === 'visual' &&
      n.visualViewport &&
      le(n.visualViewport, 'resize', c, d),
    s)
  ) {
    const u = xe('(orientation: portrait)')
    X(u, () => c())
  }
  return { width: l, height: o }
}
const qe = {},
  He = /^(?:[a-z]+:|\/\/)/i,
  Co = 'vitepress-theme-appearance',
  Ao = /#.*$/,
  To = /[?#].*$/,
  _o = /(?:(^|\/)index)?\.(?:md|html)$/,
  O = typeof document < 'u',
  is = {
    relativePath: '404.md',
    filePath: '',
    title: '404',
    description: 'Not Found',
    headers: [],
    frontmatter: { sidebar: !1, layout: 'page' },
    lastUpdated: 0,
    isNotFound: !0,
  }
function de(e, n, t = !1) {
  if (n === void 0) return !1
  if (((e = En(`/${e}`)), t)) return new RegExp(n).test(e)
  if (En(n) !== e) return !1
  const a = n.match(Ao)
  return a ? (O ? location.hash : '') === a[0] : !0
}
function En(e) {
  return decodeURI(e).replace(To, '').replace(_o, '$1')
}
function rs(e) {
  return He.test(e)
}
function Eo(e, n) {
  return (
    Object.keys((e == null ? void 0 : e.locales) || {}).find(
      t => t !== 'root' && !rs(t) && de(n, `/${t}/`, !0),
    ) || 'root'
  )
}
function Io(e, n) {
  var a, s, i, r, l, o, c
  const t = Eo(e, n)
  return Object.assign({}, e, {
    localeIndex: t,
    lang: ((a = e.locales[t]) == null ? void 0 : a.lang) ?? e.lang,
    dir: ((s = e.locales[t]) == null ? void 0 : s.dir) ?? e.dir,
    title: ((i = e.locales[t]) == null ? void 0 : i.title) ?? e.title,
    titleTemplate:
      ((r = e.locales[t]) == null ? void 0 : r.titleTemplate) ??
      e.titleTemplate,
    description:
      ((l = e.locales[t]) == null ? void 0 : l.description) ?? e.description,
    head: ds(e.head, ((o = e.locales[t]) == null ? void 0 : o.head) ?? []),
    themeConfig: {
      ...e.themeConfig,
      ...((c = e.locales[t]) == null ? void 0 : c.themeConfig),
    },
  })
}
function cs(e, n) {
  const t = n.title || e.title,
    a = n.titleTemplate ?? e.titleTemplate
  if (typeof a == 'string' && a.includes(':title'))
    return a.replace(/:title/g, t)
  const s = Ro(e.title, a)
  return t === s.slice(3) ? t : `${t}${s}`
}
function Ro(e, n) {
  return n === !1
    ? ''
    : n === !0 || n === void 0
      ? ` | ${e}`
      : e === n
        ? ''
        : ` | ${n}`
}
function No(e, n) {
  const [t, a] = n
  if (t !== 'meta') return !1
  const s = Object.entries(a)[0]
  return s == null ? !1 : e.some(([i, r]) => i === t && r[s[0]] === s[1])
}
function ds(e, n) {
  return [...e.filter(t => !No(n, t)), ...n]
}
const Mo = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g,
  Bo = /^[a-z]:/i
function In(e) {
  const n = Bo.exec(e),
    t = n ? n[0] : ''
  return (
    t +
    e
      .slice(t.length)
      .replace(Mo, '_')
      .replace(/(^|\/)_+(?=[^/]*$)/, '$1')
  )
}
const Ke = new Set()
function us(e) {
  var t
  if (Ke.size === 0) {
    const a =
      (typeof process == 'object' &&
        ((t = process.env) == null ? void 0 : t.VITE_EXTRA_EXTENSIONS)) ||
      (qe == null ? void 0 : qe.VITE_EXTRA_EXTENSIONS) ||
      ''
    ;(
      '3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,crl,css,csv,dll,doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,yaml,yml,zip' +
      (a && typeof a == 'string' ? ',' + a : '')
    )
      .split(',')
      .forEach(s => Ke.add(s))
  }
  const n = e.split('.').pop()
  return n == null || !Ke.has(n.toLowerCase())
}
const fs = Symbol(),
  ce = ee(Ys)
function Ho(e) {
  const n = w(() => Io(ce.value, e.data.relativePath)),
    t = n.value.appearance,
    a =
      t === 'force-dark'
        ? R(!0)
        : t === 'force-auto'
          ? as()
          : t
            ? So({
                storageKey: Co,
                initialValue: () => (t === 'dark' ? 'dark' : 'auto'),
                ...(typeof t == 'object' ? t : {}),
              })
            : R(!1),
    s = R(O ? location.hash : '')
  return (
    O &&
      window.addEventListener('hashchange', () => {
        s.value = location.hash
      }),
    X(
      () => e.data,
      () => {
        s.value = O ? location.hash : ''
      },
    ),
    {
      site: n,
      theme: w(() => n.value.themeConfig),
      page: w(() => e.data),
      frontmatter: w(() => e.data.frontmatter),
      params: w(() => e.data.params),
      lang: w(() => n.value.lang),
      dir: w(() => e.data.frontmatter.dir || n.value.dir),
      localeIndex: w(() => n.value.localeIndex || 'root'),
      title: w(() => cs(n.value, e.data)),
      description: w(() => e.data.description || n.value.description),
      isDark: a,
      hash: w(() => s.value),
    }
  )
}
function ft() {
  const e = me(fs)
  if (!e) throw new Error('vitepress data not properly injected in app')
  return e
}
function jo(e, n) {
  return `${e}${n}`.replace(/\/+/g, '/')
}
function we(e) {
  return He.test(e) || !e.startsWith('/') ? e : jo(ce.value.base, e)
}
function ms(e) {
  let n = e.replace(/\.html$/, '')
  if (((n = decodeURIComponent(n)), (n = n.replace(/\/$/, '/index')), O)) {
    const t = '/CoreFront-EndConcepts/'
    n = In(n.slice(t.length).replace(/\//g, '_') || 'index') + '.md'
    let a = __VP_HASH_MAP__[n.toLowerCase()]
    if (
      (a ||
        ((n = n.endsWith('_index.md')
          ? n.slice(0, -9) + '.md'
          : n.slice(0, -3) + '_index.md'),
        (a = __VP_HASH_MAP__[n.toLowerCase()])),
      !a)
    )
      return null
    n = `${t}assets/${n}.${a}.js`
  } else n = `./${In(n.slice(1).replace(/\//g, '_'))}.md.js`
  return n
}
let Ee = []
function je(e) {
  ;(Ee.push(e),
    pe(() => {
      Ee = Ee.filter(n => n !== e)
    }))
}
function vs() {
  let e = ce.value.scrollOffset,
    n = 0,
    t = 24
  if (
    (typeof e == 'object' &&
      'padding' in e &&
      ((t = e.padding), (e = e.selector)),
    typeof e == 'number')
  )
    n = e
  else if (typeof e == 'string') n = Rn(e, t)
  else if (Array.isArray(e))
    for (const a of e) {
      const s = Rn(a, t)
      if (s) {
        n = s
        break
      }
    }
  return n
}
function Rn(e, n) {
  const t = document.querySelector(e)
  if (!t) return 0
  const a = t.getBoundingClientRect().bottom
  return a < 0 ? 0 : a + n
}
const ps = Symbol(),
  gs = 'http://a.com',
  Do = () => ({ path: '/', component: null, data: is })
function Fo(e, n) {
  const t = Ze(Do()),
    a = { route: t, go: s }
  async function s(l = O ? location.href : '/') {
    var o, c
    ;((l = Xe(l)),
      (await ((o = a.onBeforeRouteChange) == null ? void 0 : o.call(a, l))) !==
        !1 &&
        (O &&
          l !== Xe(location.href) &&
          (history.replaceState({ scrollPosition: window.scrollY }, ''),
          history.pushState({}, '', l)),
        await r(l),
        await ((c = a.onAfterRouteChange ?? a.onAfterRouteChanged) == null
          ? void 0
          : c(l))))
  }
  let i = null
  async function r(l, o = 0, c = !1) {
    var k, v
    if (
      (await ((k = a.onBeforePageLoad) == null ? void 0 : k.call(a, l))) === !1
    )
      return
    const d = new URL(l, gs),
      u = (i = d.pathname)
    try {
      let f = await e(u)
      if (!f) throw new Error(`Page not found: ${u}`)
      if (i === u) {
        i = null
        const { default: p, __pageData: b } = f
        if (!p) throw new Error(`Invalid route component: ${p}`)
        ;(await ((v = a.onAfterPageLoad) == null ? void 0 : v.call(a, l)),
          (t.path = O ? u : we(u)),
          (t.component = Fe(p)),
          (t.data = Fe(b)),
          O &&
            Ve(() => {
              let C =
                ce.value.base +
                b.relativePath.replace(/(?:(^|\/)index)?\.md$/, '$1')
              if (
                (!ce.value.cleanUrls && !C.endsWith('/') && (C += '.html'),
                C !== d.pathname &&
                  ((d.pathname = C),
                  (l = C + d.search + d.hash),
                  history.replaceState({}, '', l)),
                d.hash && !o)
              ) {
                let I = null
                try {
                  I = document.getElementById(
                    decodeURIComponent(d.hash).slice(1),
                  )
                } catch (z) {
                  console.warn(z)
                }
                if (I) {
                  Nn(I, d.hash)
                  return
                }
              }
              window.scrollTo(0, o)
            }))
      }
    } catch (f) {
      if (
        (!/fetch|Page not found/.test(f.message) &&
          !/^\/404(\.html|\/)?$/.test(l) &&
          console.error(f),
        !c)
      )
        try {
          const p = await fetch(ce.value.base + 'hashmap.json')
          ;((window.__VP_HASH_MAP__ = await p.json()), await r(l, o, !0))
          return
        } catch {}
      if (i === u) {
        ;((i = null),
          (t.path = O ? u : we(u)),
          (t.component = n ? Fe(n) : null))
        const p = O
          ? u
              .replace(/(^|\/)$/, '$1index')
              .replace(/(\.html)?$/, '.md')
              .replace(/^\//, '')
          : '404.md'
        t.data = { ...is, relativePath: p }
      }
    }
  }
  return (
    O &&
      (history.state === null && history.replaceState({}, ''),
      window.addEventListener(
        'click',
        l => {
          if (
            l.defaultPrevented ||
            !(l.target instanceof Element) ||
            l.target.closest('button') ||
            l.button !== 0 ||
            l.ctrlKey ||
            l.shiftKey ||
            l.altKey ||
            l.metaKey
          )
            return
          const o = l.target.closest('a')
          if (
            !o ||
            o.closest('.vp-raw') ||
            o.hasAttribute('download') ||
            o.hasAttribute('target')
          )
            return
          const c =
            o.getAttribute('href') ??
            (o instanceof SVGAElement ? o.getAttribute('xlink:href') : null)
          if (c == null) return
          const {
              href: d,
              origin: u,
              pathname: k,
              hash: v,
              search: f,
            } = new URL(c, o.baseURI),
            p = new URL(location.href)
          u === p.origin &&
            us(k) &&
            (l.preventDefault(),
            k === p.pathname && f === p.search
              ? (v !== p.hash &&
                  (history.pushState({}, '', d),
                  window.dispatchEvent(
                    new HashChangeEvent('hashchange', {
                      oldURL: p.href,
                      newURL: d,
                    }),
                  )),
                v
                  ? Nn(o, v, o.classList.contains('header-anchor'))
                  : window.scrollTo(0, 0))
              : s(d))
        },
        { capture: !0 },
      ),
      window.addEventListener('popstate', async l => {
        var c
        if (l.state === null) return
        const o = Xe(location.href)
        ;(await r(o, (l.state && l.state.scrollPosition) || 0),
          await ((c = a.onAfterRouteChange ?? a.onAfterRouteChanged) == null
            ? void 0
            : c(o)))
      }),
      window.addEventListener('hashchange', l => {
        l.preventDefault()
      })),
    a
  )
}
function Oo() {
  const e = me(ps)
  if (!e) throw new Error('useRouter() is called without provider.')
  return e
}
function be() {
  return Oo().route
}
function Nn(e, n, t = !1) {
  let a = null
  try {
    a = e.classList.contains('header-anchor')
      ? e
      : document.getElementById(decodeURIComponent(n).slice(1))
  } catch (s) {
    console.warn(s)
  }
  if (a) {
    let s = function () {
      !t || Math.abs(r - window.scrollY) > window.innerHeight
        ? window.scrollTo(0, r)
        : window.scrollTo({ left: 0, top: r, behavior: 'smooth' })
    }
    const i = parseInt(window.getComputedStyle(a).paddingTop, 10),
      r = window.scrollY + a.getBoundingClientRect().top - vs() + i
    requestAnimationFrame(s)
  }
}
function Xe(e) {
  const n = new URL(e, gs)
  return (
    (n.pathname = n.pathname.replace(/(^|\/)index(\.html)?$/, '$1')),
    ce.value.cleanUrls
      ? (n.pathname = n.pathname.replace(/\.html$/, ''))
      : !n.pathname.endsWith('/') &&
        !n.pathname.endsWith('.html') &&
        (n.pathname += '.html'),
    n.pathname + n.search + n.hash
  )
}
const Te = () => Ee.forEach(e => e()),
  Wo = P({
    name: 'VitePressContent',
    props: { as: { type: [Object, String], default: 'div' } },
    setup(e) {
      const n = be(),
        { frontmatter: t, site: a } = ft()
      return (
        X(t, Te, { deep: !0, flush: 'post' }),
        () =>
          Re(
            e.as,
            a.value.contentProps ?? { style: { position: 'relative' } },
            [
              n.component
                ? Re(n.component, {
                    onVnodeMounted: Te,
                    onVnodeUpdated: Te,
                    onVnodeUnmounted: Te,
                  })
                : '404 Page Not Found',
            ],
          )
      )
    },
  }),
  mt = P({
    __name: 'VPBadge',
    __ssrInlineRender: !0,
    props: { text: {}, type: { default: 'tip' } },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(`<span${L(x({ class: ['VPBadge', e.type] }, s))}>`),
          g(
            n.$slots,
            'default',
            {},
            () => {
              t(`${N(e.text)}`)
            },
            t,
            a,
          ),
          t('</span>'))
      }
    },
  }),
  Mn = mt.setup
mt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPBadge.vue',
    ),
    Mn ? Mn(e, n) : void 0
  )
}
const vt = P({
    __name: 'VPBackdrop',
    __ssrInlineRender: !0,
    props: { show: { type: Boolean } },
    setup(e) {
      return (n, t, a, s) => {
        e.show
          ? t(`<div${L(x({ class: 'VPBackdrop' }, s))} data-v-cc158f89></div>`)
          : t('<!---->')
      }
    },
  }),
  Bn = vt.setup
vt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPBackdrop.vue',
    ),
    Bn ? Bn(e, n) : void 0
  )
}
const zo = V(vt, [['__scopeId', 'data-v-cc158f89']]),
  E = ft
function bs(e, n) {
  let t,
    a = !1
  return () => {
    ;(t && clearTimeout(t),
      a
        ? (t = setTimeout(e, n))
        : (e(), (a = !0) && setTimeout(() => (a = !1), n)))
  }
}
function tt(e) {
  return e.startsWith('/') ? e : `/${e}`
}
function pt(e) {
  const {
    pathname: n,
    search: t,
    hash: a,
    protocol: s,
  } = new URL(e, 'http://a.com')
  if (rs(e) || e.startsWith('#') || !s.startsWith('http') || !us(n)) return e
  const { site: i } = E(),
    r =
      n.endsWith('/') || n.endsWith('.html')
        ? e
        : e.replace(
            /(?:(^\.+)\/)?.*$/,
            `$1${n.replace(/(\.md)?$/, i.value.cleanUrls ? '' : '.html')}${t}${a}`,
          )
  return we(r)
}
function Le({ correspondingLink: e = !1 } = {}) {
  const { site: n, localeIndex: t, page: a, theme: s, hash: i } = E(),
    r = w(() => {
      var o, c
      return {
        label: (o = n.value.locales[t.value]) == null ? void 0 : o.label,
        link:
          ((c = n.value.locales[t.value]) == null ? void 0 : c.link) ||
          (t.value === 'root' ? '/' : `/${t.value}/`),
      }
    })
  return {
    localeLinks: w(() =>
      Object.entries(n.value.locales).flatMap(([o, c]) =>
        r.value.label === c.label
          ? []
          : {
              text: c.label,
              link:
                Go(
                  c.link || (o === 'root' ? '/' : `/${o}/`),
                  s.value.i18nRouting !== !1 && e,
                  a.value.relativePath.slice(r.value.link.length - 1),
                  !n.value.cleanUrls,
                ) + i.value,
            },
      ),
    ),
    currentLang: r,
  }
}
function Go(e, n, t, a) {
  return n
    ? e.replace(/\/$/, '') +
        tt(
          t
            .replace(/(^|\/)index\.md$/, '$1')
            .replace(/\.md$/, a ? '.html' : ''),
        )
    : e
}
const gt = P({
    __name: 'NotFound',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E(),
        { currentLang: t } = Le()
      return (a, s, i, r) => {
        var l, o, c, d, u
        s(
          `<div${L(x({ class: 'NotFound' }, r))} data-v-c40f06f2><p class="code" data-v-c40f06f2>${N(((l = m(n).notFound) == null ? void 0 : l.code) ?? '404')}</p><h1 class="title" data-v-c40f06f2>${N(((o = m(n).notFound) == null ? void 0 : o.title) ?? 'PAGE NOT FOUND')}</h1><div class="divider" data-v-c40f06f2></div><blockquote class="quote" data-v-c40f06f2>${N(((c = m(n).notFound) == null ? void 0 : c.quote) ?? "But if you don't change your direction, and if you keep looking, you may end up where you are heading.")}</blockquote><div class="action" data-v-c40f06f2><a class="link"${K('href', m(we)(m(t).link))}${K('aria-label', ((d = m(n).notFound) == null ? void 0 : d.linkLabel) ?? 'go to home')} data-v-c40f06f2>${N(((u = m(n).notFound) == null ? void 0 : u.linkText) ?? 'Take me home')}</a></div></div>`,
        )
      }
    },
  }),
  Hn = gt.setup
gt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/NotFound.vue',
    ),
    Hn ? Hn(e, n) : void 0
  )
}
const Uo = V(gt, [['__scopeId', 'data-v-c40f06f2']])
function ks(e, n) {
  if (Array.isArray(e)) return Ie(e)
  if (e == null) return []
  n = tt(n)
  const t = Object.keys(e)
      .sort((s, i) => i.split('/').length - s.split('/').length)
      .find(s => n.startsWith(tt(s))),
    a = t ? e[t] : []
  return Array.isArray(a) ? Ie(a) : Ie(a.items, a.base)
}
function qo(e) {
  const n = []
  let t = 0
  for (const a in e) {
    const s = e[a]
    if (s.items) {
      t = n.push(s)
      continue
    }
    ;(n[t] || n.push({ items: [] }), n[t].items.push(s))
  }
  return n
}
function Ko(e) {
  const n = []
  function t(a) {
    for (const s of a)
      (s.text &&
        s.link &&
        n.push({ text: s.text, link: s.link, docFooterText: s.docFooterText }),
        s.items && t(s.items))
  }
  return (t(e), n)
}
function nt(e, n) {
  return Array.isArray(n)
    ? n.some(t => nt(e, t))
    : de(e, n.link)
      ? !0
      : n.items
        ? nt(e, n.items)
        : !1
}
function Ie(e, n) {
  return [...e].map(t => {
    const a = { ...t },
      s = a.base || n
    return (
      s && a.link && (a.link = s + a.link),
      a.items && (a.items = Ie(a.items, s)),
      a
    )
  })
}
function ie() {
  const { frontmatter: e, page: n, theme: t } = E(),
    a = xe('(min-width: 960px)'),
    s = R(!1),
    i = w(() => {
      const p = t.value.sidebar,
        b = n.value.relativePath
      return p ? ks(p, b) : []
    }),
    r = R(i.value)
  X(i, (p, b) => {
    JSON.stringify(p) !== JSON.stringify(b) && (r.value = i.value)
  })
  const l = w(
      () =>
        e.value.sidebar !== !1 &&
        r.value.length > 0 &&
        e.value.layout !== 'home',
    ),
    o = w(() =>
      c
        ? e.value.aside == null
          ? t.value.aside === 'left'
          : e.value.aside === 'left'
        : !1,
    ),
    c = w(() =>
      e.value.layout === 'home'
        ? !1
        : e.value.aside != null
          ? !!e.value.aside
          : t.value.aside !== !1,
    ),
    d = w(() => l.value && a.value),
    u = w(() => (l.value ? qo(r.value) : []))
  function k() {
    s.value = !0
  }
  function v() {
    s.value = !1
  }
  function f() {
    s.value ? v() : k()
  }
  return {
    isOpen: s,
    sidebar: r,
    sidebarGroups: u,
    hasSidebar: l,
    hasAside: c,
    leftAside: o,
    isSidebarEnabled: d,
    open: k,
    close: v,
    toggle: f,
  }
}
function Xo(e, n) {
  let t
  ;(ve(() => {
    t = e.value ? document.activeElement : void 0
  }),
    Z(() => {
      window.addEventListener('keyup', a)
    }),
    pe(() => {
      window.removeEventListener('keyup', a)
    }))
  function a(s) {
    s.key === 'Escape' && e.value && (n(), t == null || t.focus())
  }
}
function Yo(e) {
  const { page: n, hash: t } = E(),
    a = R(!1),
    s = w(() => e.value.collapsed != null),
    i = w(() => !!e.value.link),
    r = R(!1),
    l = () => {
      r.value = de(n.value.relativePath, e.value.link)
    }
  ;(X([n, e, t], l), Z(l))
  const o = w(() =>
      r.value
        ? !0
        : e.value.items
          ? nt(n.value.relativePath, e.value.items)
          : !1,
    ),
    c = w(() => !!(e.value.items && e.value.items.length))
  ;(ve(() => {
    a.value = !!(s.value && e.value.collapsed)
  }),
    lt(() => {
      ;(r.value || o.value) && (a.value = !1)
    }))
  function d() {
    s.value && (a.value = !a.value)
  }
  return {
    collapsed: a,
    collapsible: s,
    isLink: i,
    isActiveLink: r,
    hasActiveLink: o,
    hasChildren: c,
    toggle: d,
  }
}
function Jo() {
  const { hasSidebar: e } = ie(),
    n = xe('(min-width: 960px)'),
    t = xe('(min-width: 1280px)')
  return {
    isAsideEnabled: w(() =>
      !t.value && !n.value ? !1 : e.value ? t.value : n.value,
    ),
  }
}
const Qo = /\b(?:VPBadge|header-anchor|footnote-ref|ignore-header)\b/,
  at = []
function hs(e) {
  return (
    (typeof e.outline == 'object' &&
      !Array.isArray(e.outline) &&
      e.outline.label) ||
    e.outlineTitle ||
    'On this page'
  )
}
function bt(e) {
  const n = [...document.querySelectorAll('.VPDoc :where(h1,h2,h3,h4,h5,h6)')]
    .filter(t => t.id && t.hasChildNodes())
    .map(t => {
      const a = Number(t.tagName[1])
      return { element: t, title: Zo(t), link: '#' + t.id, level: a }
    })
  return el(n, e)
}
function Zo(e) {
  let n = ''
  for (const t of e.childNodes)
    if (t.nodeType === 1) {
      if (Qo.test(t.className)) continue
      n += t.textContent
    } else t.nodeType === 3 && (n += t.textContent)
  return n.trim()
}
function el(e, n) {
  if (n === !1) return []
  const t = (typeof n == 'object' && !Array.isArray(n) ? n.level : n) || 2,
    [a, s] = typeof t == 'number' ? [t, t] : t === 'deep' ? [2, 6] : t
  return al(e, a, s)
}
function tl(e, n) {
  const { isAsideEnabled: t } = Jo(),
    a = bs(i, 100)
  let s = null
  ;(Z(() => {
    ;(requestAnimationFrame(i), window.addEventListener('scroll', a))
  }),
    Ds(() => {
      r(location.hash)
    }),
    pe(() => {
      window.removeEventListener('scroll', a)
    }))
  function i() {
    if (!t.value) return
    const l = window.scrollY,
      o = window.innerHeight,
      c = document.body.offsetHeight,
      d = Math.abs(l + o - c) < 1,
      u = at
        .map(({ element: v, link: f }) => ({ link: f, top: nl(v) }))
        .filter(({ top: v }) => !Number.isNaN(v))
        .sort((v, f) => v.top - f.top)
    if (!u.length) {
      r(null)
      return
    }
    if (l < 1) {
      r(null)
      return
    }
    if (d) {
      r(u[u.length - 1].link)
      return
    }
    let k = null
    for (const { link: v, top: f } of u) {
      if (f > l + vs() + 4) break
      k = v
    }
    r(k)
  }
  function r(l) {
    ;(s && s.classList.remove('active'),
      l == null
        ? (s = null)
        : (s = e.value.querySelector(`a[href="${decodeURIComponent(l)}"]`)))
    const o = s
    o
      ? (o.classList.add('active'),
        (n.value.style.top = o.offsetTop + 39 + 'px'),
        (n.value.style.opacity = '1'))
      : ((n.value.style.top = '33px'), (n.value.style.opacity = '0'))
  }
}
function nl(e) {
  let n = 0
  for (; e !== document.body; ) {
    if (e === null) return NaN
    ;((n += e.offsetTop), (e = e.offsetParent))
  }
  return n
}
function al(e, n, t) {
  at.length = 0
  const a = [],
    s = []
  return (
    e.forEach(i => {
      const r = { ...i, children: [] }
      let l = s[s.length - 1]
      for (; l && l.level >= r.level; ) (s.pop(), (l = s[s.length - 1]))
      if (
        r.element.classList.contains('ignore-header') ||
        (l && 'shouldIgnore' in l)
      ) {
        s.push({ level: r.level, shouldIgnore: !0 })
        return
      }
      r.level > t ||
        r.level < n ||
        (at.push({ element: r.element, link: r.link }),
        l ? l.children.push(r) : a.push(r),
        s.push(r))
    }),
    a
  )
}
const kt = P({
    __name: 'VPDocOutlineItem',
    __ssrInlineRender: !0,
    props: { headers: {}, root: { type: Boolean } },
    setup(e) {
      return (n, t, a, s) => {
        const i = ge('VPDocOutlineItem', !0)
        ;(t(
          `<ul${L(x({ class: ['VPDocOutlineItem', e.root ? 'root' : 'nested'] }, s))} data-v-292bc266><!--[-->`,
        ),
          Y(e.headers, ({ children: r, link: l, title: o }) => {
            ;(t(
              `<li data-v-292bc266><a class="outline-link"${K('href', l)}${K('title', o)} data-v-292bc266>${N(o)}</a>`,
            ),
              r != null && r.length
                ? t(h(i, { headers: r }, null, a))
                : t('<!---->'),
              t('</li>'))
          }),
          t('<!--]--></ul>'))
      }
    },
  }),
  jn = kt.setup
kt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocOutlineItem.vue',
    ),
    jn ? jn(e, n) : void 0
  )
}
const ys = V(kt, [['__scopeId', 'data-v-292bc266']]),
  ht = P({
    __name: 'VPDocAsideOutline',
    __ssrInlineRender: !0,
    setup(e) {
      const { frontmatter: n, theme: t } = E(),
        a = ee([])
      je(() => {
        a.value = bt(n.value.outline ?? t.value.outline)
      })
      const s = R(),
        i = R()
      return (
        tl(s, i),
        (r, l, o, c) => {
          ;(l(
            `<nav${L(x({ 'aria-labelledby': 'doc-outline-aria-label', class: ['VPDocAsideOutline', { 'has-outline': a.value.length > 0 }], ref_key: 'container', ref: s }, c))} data-v-0e42ea4b><div class="content" data-v-0e42ea4b><div class="outline-marker" data-v-0e42ea4b></div><div aria-level="2" class="outline-title" id="doc-outline-aria-label" role="heading" data-v-0e42ea4b>${N(m(hs)(m(t)))}</div>`,
          ),
            l(h(ys, { headers: a.value, root: !0 }, null, o)),
            l('</div></nav>'))
        }
      )
    },
  }),
  Dn = ht.setup
ht.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideOutline.vue',
    ),
    Dn ? Dn(e, n) : void 0
  )
}
const sl = V(ht, [['__scopeId', 'data-v-0e42ea4b']]),
  yt = P({
    __name: 'VPDocAsideCarbonAds',
    __ssrInlineRender: !0,
    props: { carbonAds: {} },
    setup(e) {
      const n = () => null
      return (t, a, s, i) => {
        ;(a(`<div${L(x({ class: 'VPDocAsideCarbonAds' }, i))}>`),
          a(h(m(n), { 'carbon-ads': e.carbonAds }, null, s)),
          a('</div>'))
      }
    },
  }),
  Fn = yt.setup
yt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideCarbonAds.vue',
    ),
    Fn ? Fn(e, n) : void 0
  )
}
const $t = P({
    __name: 'VPDocAside',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E()
      return (t, a, s, i) => {
        ;(a(`<div${L(x({ class: 'VPDocAside' }, i))} data-v-6628e1bd>`),
          g(t.$slots, 'aside-top', {}, null, a, s),
          g(t.$slots, 'aside-outline-before', {}, null, a, s),
          a(h(sl, null, null, s)),
          g(t.$slots, 'aside-outline-after', {}, null, a, s),
          a('<div class="spacer" data-v-6628e1bd></div>'),
          g(t.$slots, 'aside-ads-before', {}, null, a, s),
          m(n).carbonAds
            ? a(h(yt, { 'carbon-ads': m(n).carbonAds }, null, s))
            : a('<!---->'),
          g(t.$slots, 'aside-ads-after', {}, null, a, s),
          g(t.$slots, 'aside-bottom', {}, null, a, s),
          a('</div>'))
      }
    },
  }),
  On = $t.setup
$t.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocAside.vue',
    ),
    On ? On(e, n) : void 0
  )
}
const ol = V($t, [['__scopeId', 'data-v-6628e1bd']])
function ll() {
  const { theme: e, page: n } = E()
  return w(() => {
    const { text: t = 'Edit this page', pattern: a = '' } =
      e.value.editLink || {}
    let s
    return (
      typeof a == 'function'
        ? (s = a(n.value))
        : (s = a.replace(/:path/g, n.value.filePath)),
      { url: s, text: t }
    )
  })
}
function il() {
  const { page: e, theme: n, frontmatter: t } = E()
  return w(() => {
    var c, d, u, k, v, f, p, b
    const a = ks(n.value.sidebar, e.value.relativePath),
      s = Ko(a),
      i = rl(s, C => C.link.replace(/[?#].*$/, '')),
      r = i.findIndex(C => de(e.value.relativePath, C.link)),
      l =
        (((c = n.value.docFooter) == null ? void 0 : c.prev) === !1 &&
          !t.value.prev) ||
        t.value.prev === !1,
      o =
        (((d = n.value.docFooter) == null ? void 0 : d.next) === !1 &&
          !t.value.next) ||
        t.value.next === !1
    return {
      prev: l
        ? void 0
        : {
            text:
              (typeof t.value.prev == 'string'
                ? t.value.prev
                : typeof t.value.prev == 'object'
                  ? t.value.prev.text
                  : void 0) ??
              ((u = i[r - 1]) == null ? void 0 : u.docFooterText) ??
              ((k = i[r - 1]) == null ? void 0 : k.text),
            link:
              (typeof t.value.prev == 'object' ? t.value.prev.link : void 0) ??
              ((v = i[r - 1]) == null ? void 0 : v.link),
          },
      next: o
        ? void 0
        : {
            text:
              (typeof t.value.next == 'string'
                ? t.value.next
                : typeof t.value.next == 'object'
                  ? t.value.next.text
                  : void 0) ??
              ((f = i[r + 1]) == null ? void 0 : f.docFooterText) ??
              ((p = i[r + 1]) == null ? void 0 : p.text),
            link:
              (typeof t.value.next == 'object' ? t.value.next.link : void 0) ??
              ((b = i[r + 1]) == null ? void 0 : b.link),
          },
    }
  })
}
function rl(e, n) {
  const t = new Set()
  return e.filter(a => {
    const s = n(a)
    return t.has(s) ? !1 : t.add(s)
  })
}
const Q = P({
    __name: 'VPLink',
    __ssrInlineRender: !0,
    props: {
      tag: {},
      href: {},
      noIcon: { type: Boolean },
      target: {},
      rel: {},
    },
    setup(e) {
      const n = e,
        t = w(() => n.tag ?? (n.href ? 'a' : 'span')),
        a = w(() => (n.href && He.test(n.href)) || n.target === '_blank')
      return (s, i, r, l) => {
        ae(
          i,
          _(
            te(t.value),
            x(
              {
                class: [
                  'VPLink',
                  {
                    link: e.href,
                    'vp-external-link-icon': a.value,
                    'no-icon': e.noIcon,
                  },
                ],
                href: e.href ? m(pt)(e.href) : void 0,
                target: e.target ?? (a.value ? '_blank' : void 0),
                rel: e.rel ?? (a.value ? 'noreferrer' : void 0),
              },
              l,
            ),
            {
              default: y((o, c, d, u) => {
                if (c) g(s.$slots, 'default', {}, null, c, d, u)
                else return [$(s.$slots, 'default')]
              }),
              _: 3,
            },
          ),
          r,
        )
      }
    },
  }),
  Wn = Q.setup
Q.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPLink.vue',
    ),
    Wn ? Wn(e, n) : void 0
  )
}
const xt = P({
    __name: 'VPDocFooterLastUpdated',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n, page: t, lang: a } = E(),
        s = w(() => new Date(t.value.lastUpdated)),
        i = w(() => s.value.toISOString()),
        r = R('')
      return (
        Z(() => {
          ve(() => {
            var l, o, c
            r.value = new Intl.DateTimeFormat(
              (o =
                (l = n.value.lastUpdated) == null ? void 0 : l.formatOptions) !=
                null && o.forceLocale
                ? a.value
                : void 0,
              ((c = n.value.lastUpdated) == null
                ? void 0
                : c.formatOptions) ?? {
                dateStyle: 'short',
                timeStyle: 'short',
              },
            ).format(s.value)
          })
        }),
        (l, o, c, d) => {
          var u
          o(
            `<p${L(x({ class: 'VPLastUpdated' }, d))} data-v-721336c6>${N(((u = m(n).lastUpdated) == null ? void 0 : u.text) || m(n).lastUpdatedText || 'Last updated')}: <time${K('datetime', i.value)} data-v-721336c6>${N(r.value)}</time></p>`,
          )
        }
      )
    },
  }),
  zn = xt.setup
xt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocFooterLastUpdated.vue',
    ),
    zn ? zn(e, n) : void 0
  )
}
const cl = V(xt, [['__scopeId', 'data-v-721336c6']]),
  wt = P({
    __name: 'VPDocFooter',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n, page: t, frontmatter: a } = E(),
        s = ll(),
        i = il(),
        r = w(() => n.value.editLink && a.value.editLink !== !1),
        l = w(() => t.value.lastUpdated),
        o = w(() => r.value || l.value || i.value.prev || i.value.next)
      return (c, d, u, k) => {
        var v, f, p, b
        o.value
          ? (d(`<footer${L(x({ class: 'VPDocFooter' }, k))} data-v-7a202674>`),
            g(c.$slots, 'doc-footer-before', {}, null, d, u),
            r.value || l.value
              ? (d('<div class="edit-info" data-v-7a202674>'),
                r.value
                  ? (d('<div class="edit-link" data-v-7a202674>'),
                    d(
                      h(
                        Q,
                        {
                          class: 'edit-link-button',
                          href: m(s).url,
                          'no-icon': !0,
                        },
                        {
                          default: y((C, I, z, M) => {
                            if (I)
                              I(
                                `<span class="vpi-square-pen edit-link-icon" data-v-7a202674${M}></span> ${N(m(s).text)}`,
                              )
                            else
                              return [
                                _('span', {
                                  class: 'vpi-square-pen edit-link-icon',
                                }),
                                ye(' ' + se(m(s).text), 1),
                              ]
                          }),
                          _: 1,
                        },
                        u,
                      ),
                    ),
                    d('</div>'))
                  : d('<!---->'),
                l.value
                  ? (d('<div class="last-updated" data-v-7a202674>'),
                    d(h(cl, null, null, u)),
                    d('</div>'))
                  : d('<!---->'),
                d('</div>'))
              : d('<!---->'),
            ((v = m(i).prev) != null && v.link) ||
            ((f = m(i).next) != null && f.link)
              ? (d(
                  '<nav class="prev-next" aria-labelledby="doc-footer-aria-label" data-v-7a202674><span class="visually-hidden" id="doc-footer-aria-label" data-v-7a202674>Pager</span><div class="pager" data-v-7a202674>',
                ),
                (p = m(i).prev) != null && p.link
                  ? d(
                      h(
                        Q,
                        { class: 'pager-link prev', href: m(i).prev.link },
                        {
                          default: y((C, I, z, M) => {
                            var F, B
                            if (I)
                              I(
                                `<span class="desc" data-v-7a202674${M}>${(((F = m(n).docFooter) == null ? void 0 : F.prev) || 'Previous page') ?? ''}</span><span class="title" data-v-7a202674${M}>${m(i).prev.text ?? ''}</span>`,
                              )
                            else
                              return [
                                _(
                                  'span',
                                  {
                                    class: 'desc',
                                    innerHTML:
                                      ((B = m(n).docFooter) == null
                                        ? void 0
                                        : B.prev) || 'Previous page',
                                  },
                                  null,
                                  8,
                                  ['innerHTML'],
                                ),
                                _(
                                  'span',
                                  { class: 'title', innerHTML: m(i).prev.text },
                                  null,
                                  8,
                                  ['innerHTML'],
                                ),
                              ]
                          }),
                          _: 1,
                        },
                        u,
                      ),
                    )
                  : d('<!---->'),
                d('</div><div class="pager" data-v-7a202674>'),
                (b = m(i).next) != null && b.link
                  ? d(
                      h(
                        Q,
                        { class: 'pager-link next', href: m(i).next.link },
                        {
                          default: y((C, I, z, M) => {
                            var F, B
                            if (I)
                              I(
                                `<span class="desc" data-v-7a202674${M}>${(((F = m(n).docFooter) == null ? void 0 : F.next) || 'Next page') ?? ''}</span><span class="title" data-v-7a202674${M}>${m(i).next.text ?? ''}</span>`,
                              )
                            else
                              return [
                                _(
                                  'span',
                                  {
                                    class: 'desc',
                                    innerHTML:
                                      ((B = m(n).docFooter) == null
                                        ? void 0
                                        : B.next) || 'Next page',
                                  },
                                  null,
                                  8,
                                  ['innerHTML'],
                                ),
                                _(
                                  'span',
                                  { class: 'title', innerHTML: m(i).next.text },
                                  null,
                                  8,
                                  ['innerHTML'],
                                ),
                              ]
                          }),
                          _: 1,
                        },
                        u,
                      ),
                    )
                  : d('<!---->'),
                d('</div></nav>'))
              : d('<!---->'),
            d('</footer>'))
          : d('<!---->')
      }
    },
  }),
  Gn = wt.setup
wt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocFooter.vue',
    ),
    Gn ? Gn(e, n) : void 0
  )
}
const dl = V(wt, [['__scopeId', 'data-v-7a202674']]),
  St = P({
    __name: 'VPDoc',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E(),
        t = be(),
        { hasSidebar: a, hasAside: s, leftAside: i } = ie(),
        r = w(() => t.path.replace(/[./]+/g, '_').replace(/_html$/, ''))
      return (l, o, c, d) => {
        const u = ge('Content')
        ;(o(
          `<div${L(x({ class: ['VPDoc', { 'has-sidebar': m(a), 'has-aside': m(s) }] }, d))} data-v-0387b6a5>`,
        ),
          g(l.$slots, 'doc-top', {}, null, o, c),
          o('<div class="container" data-v-0387b6a5>'),
          m(s)
            ? (o(
                `<div class="${Pe([{ 'left-aside': m(i) }, 'aside'])}" data-v-0387b6a5><div class="aside-curtain" data-v-0387b6a5></div><div class="aside-container" data-v-0387b6a5><div class="aside-content" data-v-0387b6a5>`,
              ),
              o(
                h(
                  ol,
                  null,
                  {
                    'aside-top': y((k, v, f, p) => {
                      if (v) g(l.$slots, 'aside-top', {}, null, v, f, p)
                      else return [$(l.$slots, 'aside-top', {}, void 0, !0)]
                    }),
                    'aside-bottom': y((k, v, f, p) => {
                      if (v) g(l.$slots, 'aside-bottom', {}, null, v, f, p)
                      else return [$(l.$slots, 'aside-bottom', {}, void 0, !0)]
                    }),
                    'aside-outline-before': y((k, v, f, p) => {
                      if (v)
                        g(l.$slots, 'aside-outline-before', {}, null, v, f, p)
                      else
                        return [
                          $(l.$slots, 'aside-outline-before', {}, void 0, !0),
                        ]
                    }),
                    'aside-outline-after': y((k, v, f, p) => {
                      if (v)
                        g(l.$slots, 'aside-outline-after', {}, null, v, f, p)
                      else
                        return [
                          $(l.$slots, 'aside-outline-after', {}, void 0, !0),
                        ]
                    }),
                    'aside-ads-before': y((k, v, f, p) => {
                      if (v) g(l.$slots, 'aside-ads-before', {}, null, v, f, p)
                      else
                        return [$(l.$slots, 'aside-ads-before', {}, void 0, !0)]
                    }),
                    'aside-ads-after': y((k, v, f, p) => {
                      if (v) g(l.$slots, 'aside-ads-after', {}, null, v, f, p)
                      else
                        return [$(l.$slots, 'aside-ads-after', {}, void 0, !0)]
                    }),
                    _: 3,
                  },
                  c,
                ),
              ),
              o('</div></div></div>'))
            : o('<!---->'),
          o(
            '<div class="content" data-v-0387b6a5><div class="content-container" data-v-0387b6a5>',
          ),
          g(l.$slots, 'doc-before', {}, null, o, c),
          o('<main class="main" data-v-0387b6a5>'),
          o(
            h(
              u,
              {
                class: [
                  'vp-doc',
                  [
                    r.value,
                    m(n).externalLinkIcon && 'external-link-icon-enabled',
                  ],
                ],
              },
              null,
              c,
            ),
          ),
          o('</main>'),
          o(
            h(
              dl,
              null,
              {
                'doc-footer-before': y((k, v, f, p) => {
                  if (v) g(l.$slots, 'doc-footer-before', {}, null, v, f, p)
                  else return [$(l.$slots, 'doc-footer-before', {}, void 0, !0)]
                }),
                _: 3,
              },
              c,
            ),
          ),
          g(l.$slots, 'doc-after', {}, null, o, c),
          o('</div></div></div>'),
          g(l.$slots, 'doc-bottom', {}, null, o, c),
          o('</div>'))
      }
    },
  }),
  Un = St.setup
St.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDoc.vue',
    ),
    Un ? Un(e, n) : void 0
  )
}
const ul = V(St, [['__scopeId', 'data-v-0387b6a5']]),
  Pt = P({
    __name: 'VPButton',
    __ssrInlineRender: !0,
    props: {
      tag: {},
      size: { default: 'medium' },
      theme: { default: 'brand' },
      text: {},
      href: {},
      target: {},
      rel: {},
    },
    setup(e) {
      const n = e,
        t = w(() => n.href && He.test(n.href)),
        a = w(() => n.tag || (n.href ? 'a' : 'button'))
      return (s, i, r, l) => {
        ae(
          i,
          _(
            te(a.value),
            x(
              {
                class: ['VPButton', [e.size, e.theme]],
                href: e.href ? m(pt)(e.href) : void 0,
                target: n.target ?? (t.value ? '_blank' : void 0),
                rel: n.rel ?? (t.value ? 'noreferrer' : void 0),
              },
              l,
            ),
            {
              default: y((o, c, d, u) => {
                if (c) c(`${N(e.text)}`)
                else return [ye(se(e.text), 1)]
              }),
              _: 1,
            },
          ),
          r,
        )
      }
    },
  }),
  qn = Pt.setup
Pt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPButton.vue',
    ),
    qn ? qn(e, n) : void 0
  )
}
const $s = V(Pt, [['__scopeId', 'data-v-96bf1d7c']]),
  Vt = P({
    inheritAttrs: !1,
    __name: 'VPImage',
    __ssrInlineRender: !0,
    props: { image: {}, alt: {} },
    setup(e) {
      return (n, t, a, s) => {
        const i = ge('VPImage', !0)
        e.image
          ? (t('<!--[-->'),
            typeof e.image == 'string' || 'src' in e.image
              ? t(
                  `<img${L(x({ class: 'VPImage' }, typeof e.image == 'string' ? n.$attrs : { ...e.image, ...n.$attrs }, { src: m(we)(typeof e.image == 'string' ? e.image : e.image.src), alt: e.alt ?? (typeof e.image == 'string' ? '' : e.image.alt || '') }))} data-v-6f399521>`,
                )
              : (t('<!--[-->'),
                t(
                  h(
                    i,
                    x(
                      { class: 'dark', image: e.image.dark, alt: e.image.alt },
                      n.$attrs,
                    ),
                    null,
                    a,
                  ),
                ),
                t(
                  h(
                    i,
                    x(
                      {
                        class: 'light',
                        image: e.image.light,
                        alt: e.image.alt,
                      },
                      n.$attrs,
                    ),
                    null,
                    a,
                  ),
                ),
                t('<!--]-->')),
            t('<!--]-->'))
          : t('<!---->')
      }
    },
  }),
  Kn = Vt.setup
Vt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPImage.vue',
    ),
    Kn ? Kn(e, n) : void 0
  )
}
const ke = V(Vt, [['__scopeId', 'data-v-6f399521']]),
  Lt = P({
    __name: 'VPHero',
    __ssrInlineRender: !0,
    props: { name: {}, text: {}, tagline: {}, image: {}, actions: {} },
    setup(e) {
      const n = me('hero-image-slot-exists')
      return (t, a, s, i) => {
        ;(a(
          `<div${L(x({ class: ['VPHero', { 'has-image': e.image || m(n) }] }, i))} data-v-982f9dd7><div class="container" data-v-982f9dd7><div class="main" data-v-982f9dd7>`,
        ),
          g(t.$slots, 'home-hero-info-before', {}, null, a, s),
          g(
            t.$slots,
            'home-hero-info',
            {},
            () => {
              ;(a('<h1 class="heading" data-v-982f9dd7>'),
                e.name
                  ? a(
                      `<span class="name clip" data-v-982f9dd7>${e.name ?? ''}</span>`,
                    )
                  : a('<!---->'),
                e.text
                  ? a(
                      `<span class="text" data-v-982f9dd7>${e.text ?? ''}</span>`,
                    )
                  : a('<!---->'),
                a('</h1>'),
                e.tagline
                  ? a(
                      `<p class="tagline" data-v-982f9dd7>${e.tagline ?? ''}</p>`,
                    )
                  : a('<!---->'))
            },
            a,
            s,
          ),
          g(t.$slots, 'home-hero-info-after', {}, null, a, s),
          e.actions
            ? (a('<div class="actions" data-v-982f9dd7><!--[-->'),
              Y(e.actions, r => {
                ;(a('<div class="action" data-v-982f9dd7>'),
                  a(
                    h(
                      $s,
                      {
                        tag: 'a',
                        size: 'medium',
                        theme: r.theme,
                        text: r.text,
                        href: r.link,
                        target: r.target,
                        rel: r.rel,
                      },
                      null,
                      s,
                    ),
                  ),
                  a('</div>'))
              }),
              a('<!--]--></div>'))
            : a('<!---->'),
          g(t.$slots, 'home-hero-actions-after', {}, null, a, s),
          a('</div>'),
          e.image || m(n)
            ? (a(
                '<div class="image" data-v-982f9dd7><div class="image-container" data-v-982f9dd7><div class="image-bg" data-v-982f9dd7></div>',
              ),
              g(
                t.$slots,
                'home-hero-image',
                {},
                () => {
                  e.image
                    ? a(h(ke, { class: 'image-src', image: e.image }, null, s))
                    : a('<!---->')
                },
                a,
                s,
              ),
              a('</div></div>'))
            : a('<!---->'),
          a('</div></div>'))
      }
    },
  }),
  Xn = Lt.setup
Lt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHero.vue',
    ),
    Xn ? Xn(e, n) : void 0
  )
}
const fl = V(Lt, [['__scopeId', 'data-v-982f9dd7']]),
  Ct = P({
    __name: 'VPHomeHero',
    __ssrInlineRender: !0,
    setup(e) {
      const { frontmatter: n } = E()
      return (t, a, s, i) => {
        m(n).hero
          ? a(
              h(
                fl,
                x(
                  {
                    class: 'VPHomeHero',
                    name: m(n).hero.name,
                    text: m(n).hero.text,
                    tagline: m(n).hero.tagline,
                    image: m(n).hero.image,
                    actions: m(n).hero.actions,
                  },
                  i,
                ),
                {
                  'home-hero-info-before': y((r, l, o, c) => {
                    if (l)
                      g(t.$slots, 'home-hero-info-before', {}, null, l, o, c)
                    else return [$(t.$slots, 'home-hero-info-before')]
                  }),
                  'home-hero-info': y((r, l, o, c) => {
                    if (l) g(t.$slots, 'home-hero-info', {}, null, l, o, c)
                    else return [$(t.$slots, 'home-hero-info')]
                  }),
                  'home-hero-info-after': y((r, l, o, c) => {
                    if (l)
                      g(t.$slots, 'home-hero-info-after', {}, null, l, o, c)
                    else return [$(t.$slots, 'home-hero-info-after')]
                  }),
                  'home-hero-actions-after': y((r, l, o, c) => {
                    if (l)
                      g(t.$slots, 'home-hero-actions-after', {}, null, l, o, c)
                    else return [$(t.$slots, 'home-hero-actions-after')]
                  }),
                  'home-hero-image': y((r, l, o, c) => {
                    if (l) g(t.$slots, 'home-hero-image', {}, null, l, o, c)
                    else return [$(t.$slots, 'home-hero-image')]
                  }),
                  _: 3,
                },
                s,
              ),
            )
          : a('<!---->')
      }
    },
  }),
  Yn = Ct.setup
Ct.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHomeHero.vue',
    ),
    Yn ? Yn(e, n) : void 0
  )
}
const At = P({
    __name: 'VPFeature',
    __ssrInlineRender: !0,
    props: {
      icon: {},
      title: {},
      details: {},
      link: {},
      linkText: {},
      rel: {},
      target: {},
    },
    setup(e) {
      return (n, t, a, s) => {
        t(
          h(
            Q,
            x(
              {
                class: 'VPFeature',
                href: e.link,
                rel: e.rel,
                target: e.target,
                'no-icon': !0,
                tag: e.link ? 'a' : 'div',
              },
              s,
            ),
            {
              default: y((i, r, l, o) => {
                if (r)
                  (r(`<article class="box" data-v-08e25fa2${o}>`),
                    typeof e.icon == 'object' && e.icon.wrap
                      ? (r(`<div class="icon" data-v-08e25fa2${o}>`),
                        r(
                          h(
                            ke,
                            {
                              image: e.icon,
                              alt: e.icon.alt,
                              height: e.icon.height || 48,
                              width: e.icon.width || 48,
                            },
                            null,
                            l,
                            o,
                          ),
                        ),
                        r('</div>'))
                      : typeof e.icon == 'object'
                        ? r(
                            h(
                              ke,
                              {
                                image: e.icon,
                                alt: e.icon.alt,
                                height: e.icon.height || 48,
                                width: e.icon.width || 48,
                              },
                              null,
                              l,
                              o,
                            ),
                          )
                        : e.icon
                          ? r(
                              `<div class="icon" data-v-08e25fa2${o}>${e.icon ?? ''}</div>`,
                            )
                          : r('<!---->'),
                    r(
                      `<h2 class="title" data-v-08e25fa2${o}>${e.title ?? ''}</h2>`,
                    ),
                    e.details
                      ? r(
                          `<p class="details" data-v-08e25fa2${o}>${e.details ?? ''}</p>`,
                        )
                      : r('<!---->'),
                    e.linkText
                      ? r(
                          `<div class="link-text" data-v-08e25fa2${o}><p class="link-text-value" data-v-08e25fa2${o}>${N(e.linkText)} <span class="vpi-arrow-right link-text-icon" data-v-08e25fa2${o}></span></p></div>`,
                        )
                      : r('<!---->'),
                    r('</article>'))
                else
                  return [
                    _('article', { class: 'box' }, [
                      typeof e.icon == 'object' && e.icon.wrap
                        ? (G(),
                          U('div', { key: 0, class: 'icon' }, [
                            _(
                              ke,
                              {
                                image: e.icon,
                                alt: e.icon.alt,
                                height: e.icon.height || 48,
                                width: e.icon.width || 48,
                              },
                              null,
                              8,
                              ['image', 'alt', 'height', 'width'],
                            ),
                          ]))
                        : typeof e.icon == 'object'
                          ? (G(),
                            U(
                              ke,
                              {
                                key: 1,
                                image: e.icon,
                                alt: e.icon.alt,
                                height: e.icon.height || 48,
                                width: e.icon.width || 48,
                              },
                              null,
                              8,
                              ['image', 'alt', 'height', 'width'],
                            ))
                          : e.icon
                            ? (G(),
                              U(
                                'div',
                                { key: 2, class: 'icon', innerHTML: e.icon },
                                null,
                                8,
                                ['innerHTML'],
                              ))
                            : ne('', !0),
                      _('h2', { class: 'title', innerHTML: e.title }, null, 8, [
                        'innerHTML',
                      ]),
                      e.details
                        ? (G(),
                          U(
                            'p',
                            { key: 3, class: 'details', innerHTML: e.details },
                            null,
                            8,
                            ['innerHTML'],
                          ))
                        : ne('', !0),
                      e.linkText
                        ? (G(),
                          U('div', { key: 4, class: 'link-text' }, [
                            _('p', { class: 'link-text-value' }, [
                              ye(se(e.linkText) + ' ', 1),
                              _('span', {
                                class: 'vpi-arrow-right link-text-icon',
                              }),
                            ]),
                          ]))
                        : ne('', !0),
                    ]),
                  ]
              }),
              _: 1,
            },
            a,
          ),
        )
      }
    },
  }),
  Jn = At.setup
At.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPFeature.vue',
    ),
    Jn ? Jn(e, n) : void 0
  )
}
const ml = V(At, [['__scopeId', 'data-v-08e25fa2']]),
  Tt = P({
    __name: 'VPFeatures',
    __ssrInlineRender: !0,
    props: { features: {} },
    setup(e) {
      const n = e,
        t = w(() => {
          const a = n.features.length
          if (a) {
            if (a === 2) return 'grid-2'
            if (a === 3) return 'grid-3'
            if (a % 3 === 0) return 'grid-6'
            if (a > 3) return 'grid-4'
          } else return
        })
      return (a, s, i, r) => {
        e.features
          ? (s(
              `<div${L(x({ class: 'VPFeatures' }, r))} data-v-38604488><div class="container" data-v-38604488><div class="items" data-v-38604488><!--[-->`,
            ),
            Y(e.features, l => {
              ;(s(`<div class="${Pe([[t.value], 'item'])}" data-v-38604488>`),
                s(
                  h(
                    ml,
                    {
                      icon: l.icon,
                      title: l.title,
                      details: l.details,
                      link: l.link,
                      'link-text': l.linkText,
                      rel: l.rel,
                      target: l.target,
                    },
                    null,
                    i,
                  ),
                ),
                s('</div>'))
            }),
            s('<!--]--></div></div></div>'))
          : s('<!---->')
      }
    },
  }),
  Qn = Tt.setup
Tt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPFeatures.vue',
    ),
    Qn ? Qn(e, n) : void 0
  )
}
const vl = V(Tt, [['__scopeId', 'data-v-38604488']]),
  _t = P({
    __name: 'VPHomeFeatures',
    __ssrInlineRender: !0,
    setup(e) {
      const { frontmatter: n } = E()
      return (t, a, s, i) => {
        m(n).features
          ? a(
              h(
                vl,
                x({ class: 'VPHomeFeatures', features: m(n).features }, i),
                null,
                s,
              ),
            )
          : a('<!---->')
      }
    },
  }),
  Zn = _t.setup
_t.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHomeFeatures.vue',
    ),
    Zn ? Zn(e, n) : void 0
  )
}
const Et = P({
    __name: 'VPHomeContent',
    __ssrInlineRender: !0,
    setup(e) {
      const { width: n } = Lo({ initialWidth: 0, includeScrollbar: !1 })
      return (t, a, s, i) => {
        ;(a(
          `<div${L(x({ class: 'vp-doc container', style: m(n) ? { '--vp-offset': `calc(50% - ${m(n) / 2}px)` } : {} }, i))} data-v-55e42a89>`,
        ),
          g(t.$slots, 'default', {}, null, a, s),
          a('</div>'))
      }
    },
  }),
  ea = Et.setup
Et.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHomeContent.vue',
    ),
    ea ? ea(e, n) : void 0
  )
}
const pl = V(Et, [['__scopeId', 'data-v-55e42a89']]),
  It = P({
    __name: 'VPHome',
    __ssrInlineRender: !0,
    setup(e) {
      const { frontmatter: n, theme: t } = E()
      return (a, s, i, r) => {
        const l = ge('Content')
        ;(s(
          `<div${L(x({ class: ['VPHome', { 'external-link-icon-enabled': m(t).externalLinkIcon }] }, r))} data-v-579af4c5>`,
        ),
          g(a.$slots, 'home-hero-before', {}, null, s, i),
          s(
            h(
              Ct,
              null,
              {
                'home-hero-info-before': y((o, c, d, u) => {
                  if (c) g(a.$slots, 'home-hero-info-before', {}, null, c, d, u)
                  else
                    return [
                      $(a.$slots, 'home-hero-info-before', {}, void 0, !0),
                    ]
                }),
                'home-hero-info': y((o, c, d, u) => {
                  if (c) g(a.$slots, 'home-hero-info', {}, null, c, d, u)
                  else return [$(a.$slots, 'home-hero-info', {}, void 0, !0)]
                }),
                'home-hero-info-after': y((o, c, d, u) => {
                  if (c) g(a.$slots, 'home-hero-info-after', {}, null, c, d, u)
                  else
                    return [$(a.$slots, 'home-hero-info-after', {}, void 0, !0)]
                }),
                'home-hero-actions-after': y((o, c, d, u) => {
                  if (c)
                    g(a.$slots, 'home-hero-actions-after', {}, null, c, d, u)
                  else
                    return [
                      $(a.$slots, 'home-hero-actions-after', {}, void 0, !0),
                    ]
                }),
                'home-hero-image': y((o, c, d, u) => {
                  if (c) g(a.$slots, 'home-hero-image', {}, null, c, d, u)
                  else return [$(a.$slots, 'home-hero-image', {}, void 0, !0)]
                }),
                _: 3,
              },
              i,
            ),
          ),
          g(a.$slots, 'home-hero-after', {}, null, s, i),
          g(a.$slots, 'home-features-before', {}, null, s, i),
          s(h(_t, null, null, i)),
          g(a.$slots, 'home-features-after', {}, null, s, i),
          m(n).markdownStyles !== !1
            ? s(
                h(
                  pl,
                  null,
                  {
                    default: y((o, c, d, u) => {
                      if (c) c(h(l, null, null, d, u))
                      else return [_(l)]
                    }),
                    _: 1,
                  },
                  i,
                ),
              )
            : s(h(l, null, null, i)),
          s('</div>'))
      }
    },
  }),
  ta = It.setup
It.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHome.vue',
    ),
    ta ? ta(e, n) : void 0
  )
}
const gl = V(It, [['__scopeId', 'data-v-579af4c5']]),
  Rt = {}
function bl(e, n, t, a) {
  const s = ge('Content')
  ;(n(`<div${L(x({ class: 'VPPage' }, a))}>`),
    g(e.$slots, 'page-top', {}, null, n, t),
    n(h(s, null, null, t)),
    g(e.$slots, 'page-bottom', {}, null, n, t),
    n('</div>'))
}
const na = Rt.setup
Rt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPPage.vue',
    ),
    na ? na(e, n) : void 0
  )
}
const kl = V(Rt, [['ssrRender', bl]]),
  Nt = P({
    __name: 'VPContent',
    __ssrInlineRender: !0,
    setup(e) {
      const { page: n, frontmatter: t } = E(),
        { hasSidebar: a } = ie()
      return (s, i, r, l) => {
        ;(i(
          `<div${L(x({ class: ['VPContent', { 'has-sidebar': m(a), 'is-home': m(t).layout === 'home' }], id: 'VPContent' }, l))} data-v-2235e3cb>`,
        ),
          m(n).isNotFound
            ? g(
                s.$slots,
                'not-found',
                {},
                () => {
                  i(h(Uo, null, null, r))
                },
                i,
                r,
              )
            : m(t).layout === 'page'
              ? i(
                  h(
                    kl,
                    null,
                    {
                      'page-top': y((o, c, d, u) => {
                        if (c) g(s.$slots, 'page-top', {}, null, c, d, u)
                        else return [$(s.$slots, 'page-top', {}, void 0, !0)]
                      }),
                      'page-bottom': y((o, c, d, u) => {
                        if (c) g(s.$slots, 'page-bottom', {}, null, c, d, u)
                        else return [$(s.$slots, 'page-bottom', {}, void 0, !0)]
                      }),
                      _: 3,
                    },
                    r,
                  ),
                )
              : m(t).layout === 'home'
                ? i(
                    h(
                      gl,
                      null,
                      {
                        'home-hero-before': y((o, c, d, u) => {
                          if (c)
                            g(s.$slots, 'home-hero-before', {}, null, c, d, u)
                          else
                            return [
                              $(s.$slots, 'home-hero-before', {}, void 0, !0),
                            ]
                        }),
                        'home-hero-info-before': y((o, c, d, u) => {
                          if (c)
                            g(
                              s.$slots,
                              'home-hero-info-before',
                              {},
                              null,
                              c,
                              d,
                              u,
                            )
                          else
                            return [
                              $(
                                s.$slots,
                                'home-hero-info-before',
                                {},
                                void 0,
                                !0,
                              ),
                            ]
                        }),
                        'home-hero-info': y((o, c, d, u) => {
                          if (c)
                            g(s.$slots, 'home-hero-info', {}, null, c, d, u)
                          else
                            return [
                              $(s.$slots, 'home-hero-info', {}, void 0, !0),
                            ]
                        }),
                        'home-hero-info-after': y((o, c, d, u) => {
                          if (c)
                            g(
                              s.$slots,
                              'home-hero-info-after',
                              {},
                              null,
                              c,
                              d,
                              u,
                            )
                          else
                            return [
                              $(
                                s.$slots,
                                'home-hero-info-after',
                                {},
                                void 0,
                                !0,
                              ),
                            ]
                        }),
                        'home-hero-actions-after': y((o, c, d, u) => {
                          if (c)
                            g(
                              s.$slots,
                              'home-hero-actions-after',
                              {},
                              null,
                              c,
                              d,
                              u,
                            )
                          else
                            return [
                              $(
                                s.$slots,
                                'home-hero-actions-after',
                                {},
                                void 0,
                                !0,
                              ),
                            ]
                        }),
                        'home-hero-image': y((o, c, d, u) => {
                          if (c)
                            g(s.$slots, 'home-hero-image', {}, null, c, d, u)
                          else
                            return [
                              $(s.$slots, 'home-hero-image', {}, void 0, !0),
                            ]
                        }),
                        'home-hero-after': y((o, c, d, u) => {
                          if (c)
                            g(s.$slots, 'home-hero-after', {}, null, c, d, u)
                          else
                            return [
                              $(s.$slots, 'home-hero-after', {}, void 0, !0),
                            ]
                        }),
                        'home-features-before': y((o, c, d, u) => {
                          if (c)
                            g(
                              s.$slots,
                              'home-features-before',
                              {},
                              null,
                              c,
                              d,
                              u,
                            )
                          else
                            return [
                              $(
                                s.$slots,
                                'home-features-before',
                                {},
                                void 0,
                                !0,
                              ),
                            ]
                        }),
                        'home-features-after': y((o, c, d, u) => {
                          if (c)
                            g(
                              s.$slots,
                              'home-features-after',
                              {},
                              null,
                              c,
                              d,
                              u,
                            )
                          else
                            return [
                              $(
                                s.$slots,
                                'home-features-after',
                                {},
                                void 0,
                                !0,
                              ),
                            ]
                        }),
                        _: 3,
                      },
                      r,
                    ),
                  )
                : m(t).layout && m(t).layout !== 'doc'
                  ? ae(i, _(te(m(t).layout), null, null), r)
                  : i(
                      h(
                        ul,
                        null,
                        {
                          'doc-top': y((o, c, d, u) => {
                            if (c) g(s.$slots, 'doc-top', {}, null, c, d, u)
                            else return [$(s.$slots, 'doc-top', {}, void 0, !0)]
                          }),
                          'doc-bottom': y((o, c, d, u) => {
                            if (c) g(s.$slots, 'doc-bottom', {}, null, c, d, u)
                            else
                              return [$(s.$slots, 'doc-bottom', {}, void 0, !0)]
                          }),
                          'doc-footer-before': y((o, c, d, u) => {
                            if (c)
                              g(
                                s.$slots,
                                'doc-footer-before',
                                {},
                                null,
                                c,
                                d,
                                u,
                              )
                            else
                              return [
                                $(
                                  s.$slots,
                                  'doc-footer-before',
                                  {},
                                  void 0,
                                  !0,
                                ),
                              ]
                          }),
                          'doc-before': y((o, c, d, u) => {
                            if (c) g(s.$slots, 'doc-before', {}, null, c, d, u)
                            else
                              return [$(s.$slots, 'doc-before', {}, void 0, !0)]
                          }),
                          'doc-after': y((o, c, d, u) => {
                            if (c) g(s.$slots, 'doc-after', {}, null, c, d, u)
                            else
                              return [$(s.$slots, 'doc-after', {}, void 0, !0)]
                          }),
                          'aside-top': y((o, c, d, u) => {
                            if (c) g(s.$slots, 'aside-top', {}, null, c, d, u)
                            else
                              return [$(s.$slots, 'aside-top', {}, void 0, !0)]
                          }),
                          'aside-outline-before': y((o, c, d, u) => {
                            if (c)
                              g(
                                s.$slots,
                                'aside-outline-before',
                                {},
                                null,
                                c,
                                d,
                                u,
                              )
                            else
                              return [
                                $(
                                  s.$slots,
                                  'aside-outline-before',
                                  {},
                                  void 0,
                                  !0,
                                ),
                              ]
                          }),
                          'aside-outline-after': y((o, c, d, u) => {
                            if (c)
                              g(
                                s.$slots,
                                'aside-outline-after',
                                {},
                                null,
                                c,
                                d,
                                u,
                              )
                            else
                              return [
                                $(
                                  s.$slots,
                                  'aside-outline-after',
                                  {},
                                  void 0,
                                  !0,
                                ),
                              ]
                          }),
                          'aside-ads-before': y((o, c, d, u) => {
                            if (c)
                              g(s.$slots, 'aside-ads-before', {}, null, c, d, u)
                            else
                              return [
                                $(s.$slots, 'aside-ads-before', {}, void 0, !0),
                              ]
                          }),
                          'aside-ads-after': y((o, c, d, u) => {
                            if (c)
                              g(s.$slots, 'aside-ads-after', {}, null, c, d, u)
                            else
                              return [
                                $(s.$slots, 'aside-ads-after', {}, void 0, !0),
                              ]
                          }),
                          'aside-bottom': y((o, c, d, u) => {
                            if (c)
                              g(s.$slots, 'aside-bottom', {}, null, c, d, u)
                            else
                              return [
                                $(s.$slots, 'aside-bottom', {}, void 0, !0),
                              ]
                          }),
                          _: 3,
                        },
                        r,
                      ),
                    ),
          i('</div>'))
      }
    },
  }),
  aa = Nt.setup
Nt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPContent.vue',
    ),
    aa ? aa(e, n) : void 0
  )
}
const hl = V(Nt, [['__scopeId', 'data-v-2235e3cb']]),
  Mt = P({
    __name: 'VPFooter',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n, frontmatter: t } = E(),
        { hasSidebar: a } = ie()
      return (s, i, r, l) => {
        m(n).footer && m(t).footer !== !1
          ? (i(
              `<footer${L(x({ class: ['VPFooter', { 'has-sidebar': m(a) }] }, l))} data-v-1670a69e><div class="container" data-v-1670a69e>`,
            ),
            m(n).footer.message
              ? i(
                  `<p class="message" data-v-1670a69e>${m(n).footer.message ?? ''}</p>`,
                )
              : i('<!---->'),
            m(n).footer.copyright
              ? i(
                  `<p class="copyright" data-v-1670a69e>${m(n).footer.copyright ?? ''}</p>`,
                )
              : i('<!---->'),
            i('</div></footer>'))
          : i('<!---->')
      }
    },
  }),
  sa = Mt.setup
Mt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPFooter.vue',
    ),
    sa ? sa(e, n) : void 0
  )
}
const yl = V(Mt, [['__scopeId', 'data-v-1670a69e']])
function $l() {
  const { theme: e, frontmatter: n } = E(),
    t = ee([]),
    a = w(() => t.value.length > 0)
  return (
    je(() => {
      t.value = bt(n.value.outline ?? e.value.outline)
    }),
    { headers: t, hasLocalNav: a }
  )
}
const Bt = P({
    __name: 'VPLocalNavOutlineDropdown',
    __ssrInlineRender: !0,
    props: { headers: {}, navHeight: {} },
    setup(e) {
      const { theme: n } = E(),
        t = R(!1),
        a = R(0),
        s = R()
      R()
      function i(r) {
        var l
        ;((l = s.value) != null && l.contains(r.target)) || (t.value = !1)
      }
      return (
        X(t, r => {
          if (r) {
            document.addEventListener('click', i)
            return
          }
          document.removeEventListener('click', i)
        }),
        vo('Escape', () => {
          t.value = !1
        }),
        je(() => {
          t.value = !1
        }),
        (r, l, o, c) => {
          ;(l(
            `<div${L(x({ class: 'VPLocalNavOutlineDropdown', style: { '--vp-vh': a.value + 'px' }, ref_key: 'main', ref: s }, c))} data-v-650ae44c>`,
          ),
            e.headers.length > 0
              ? l(
                  `<button class="${Pe({ open: t.value })}" data-v-650ae44c><span class="menu-text" data-v-650ae44c>${N(m(hs)(m(n)))}</span><span class="vpi-chevron-right icon" data-v-650ae44c></span></button>`,
                )
              : l(
                  `<button data-v-650ae44c>${N(m(n).returnToTopLabel || 'Return to top')}</button>`,
                ),
            t.value
              ? (l(
                  `<div class="items" data-v-650ae44c><div class="header" data-v-650ae44c><a class="top-link" href="#" data-v-650ae44c>${N(m(n).returnToTopLabel || 'Return to top')}</a></div><div class="outline" data-v-650ae44c>`,
                ),
                l(h(ys, { headers: e.headers }, null, o)),
                l('</div></div>'))
              : l('<!---->'),
            l('</div>'))
        }
      )
    },
  }),
  oa = Bt.setup
Bt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPLocalNavOutlineDropdown.vue',
    ),
    oa ? oa(e, n) : void 0
  )
}
const xl = V(Bt, [['__scopeId', 'data-v-650ae44c']]),
  Ht = P({
    __name: 'VPLocalNav',
    __ssrInlineRender: !0,
    props: { open: { type: Boolean } },
    emits: ['open-menu'],
    setup(e) {
      const { theme: n, frontmatter: t } = E(),
        { hasSidebar: a } = ie(),
        { headers: s } = $l(),
        { y: i } = ls(),
        r = R(0)
      ;(Z(() => {
        r.value = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            '--vp-nav-height',
          ),
        )
      }),
        je(() => {
          s.value = bt(t.value.outline ?? n.value.outline)
        }))
      const l = w(() => s.value.length === 0),
        o = w(() => l.value && !a.value),
        c = w(() => ({
          VPLocalNav: !0,
          'has-sidebar': a.value,
          empty: l.value,
          fixed: o.value,
        }))
      return (d, u, k, v) => {
        m(t).layout !== 'home' && (!o.value || m(i) >= r.value)
          ? (u(
              `<div${L(x({ class: c.value }, v))} data-v-c001fee0><div class="container" data-v-c001fee0>`,
            ),
            m(a)
              ? u(
                  `<button class="menu"${K('aria-expanded', e.open)} aria-controls="VPSidebarNav" data-v-c001fee0><span class="vpi-align-left menu-icon" data-v-c001fee0></span><span class="menu-text" data-v-c001fee0>${N(m(n).sidebarMenuLabel || 'Menu')}</span></button>`,
                )
              : u('<!---->'),
            u(h(xl, { headers: m(s), navHeight: r.value }, null, k)),
            u('</div></div>'))
          : u('<!---->')
      }
    },
  }),
  la = Ht.setup
Ht.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPLocalNav.vue',
    ),
    la ? la(e, n) : void 0
  )
}
const wl = V(Ht, [['__scopeId', 'data-v-c001fee0']])
function Sl() {
  const e = R(!1)
  function n() {
    ;((e.value = !0), window.addEventListener('resize', s))
  }
  function t() {
    ;((e.value = !1), window.removeEventListener('resize', s))
  }
  function a() {
    e.value ? t() : n()
  }
  function s() {
    window.outerWidth >= 768 && t()
  }
  const i = be()
  return (
    X(() => i.path, t),
    { isScreenOpen: e, openScreen: n, closeScreen: t, toggleScreen: a }
  )
}
const jt = {}
function Pl(e, n, t, a) {
  ;(n(
    `<button${L(x({ class: 'VPSwitch', type: 'button', role: 'switch' }, a))} data-v-0b56005d><span class="check" data-v-0b56005d>`,
  ),
    e.$slots.default
      ? (n('<span class="icon" data-v-0b56005d>'),
        g(e.$slots, 'default', {}, null, n, t),
        n('</span>'))
      : n('<!---->'),
    n('</span></button>'))
}
const ia = jt.setup
jt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSwitch.vue',
    ),
    ia ? ia(e, n) : void 0
  )
}
const Vl = V(jt, [
    ['ssrRender', Pl],
    ['__scopeId', 'data-v-0b56005d'],
  ]),
  Dt = P({
    __name: 'VPSwitchAppearance',
    __ssrInlineRender: !0,
    setup(e) {
      const { isDark: n, theme: t } = E(),
        a = me('toggle-appearance', () => {
          n.value = !n.value
        }),
        s = R('')
      return (
        lt(() => {
          s.value = n.value
            ? t.value.lightModeSwitchTitle || 'Switch to light theme'
            : t.value.darkModeSwitchTitle || 'Switch to dark theme'
        }),
        (i, r, l, o) => {
          r(
            h(
              Vl,
              x(
                {
                  title: s.value,
                  class: 'VPSwitchAppearance',
                  'aria-checked': m(n),
                  onClick: m(a),
                },
                o,
              ),
              {
                default: y((c, d, u, k) => {
                  if (d)
                    d(
                      `<span class="vpi-sun sun" data-v-f59099a3${k}></span><span class="vpi-moon moon" data-v-f59099a3${k}></span>`,
                    )
                  else
                    return [
                      _('span', { class: 'vpi-sun sun' }),
                      _('span', { class: 'vpi-moon moon' }),
                    ]
                }),
                _: 1,
              },
              l,
            ),
          )
        }
      )
    },
  }),
  ra = Dt.setup
Dt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSwitchAppearance.vue',
    ),
    ra ? ra(e, n) : void 0
  )
}
const Ne = V(Dt, [['__scopeId', 'data-v-f59099a3']]),
  Ft = P({
    __name: 'VPNavBarAppearance',
    __ssrInlineRender: !0,
    setup(e) {
      const { site: n } = E()
      return (t, a, s, i) => {
        m(n).appearance &&
        m(n).appearance !== 'force-dark' &&
        m(n).appearance !== 'force-auto'
          ? (a(
              `<div${L(x({ class: 'VPNavBarAppearance' }, i))} data-v-0c94f6b9>`,
            ),
            a(h(Ne, null, null, s)),
            a('</div>'))
          : a('<!---->')
      }
    },
  }),
  ca = Ft.setup
Ft.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarAppearance.vue',
    ),
    ca ? ca(e, n) : void 0
  )
}
const Ll = V(Ft, [['__scopeId', 'data-v-0c94f6b9']]),
  Ot = R()
let xs = !1,
  Ye = 0
function Cl(e) {
  const n = R(!1)
  if (O) {
    ;(!xs && Al(), Ye++)
    const t = X(Ot, a => {
      var s, i, r
      a === e.el.value || ((s = e.el.value) != null && s.contains(a))
        ? ((n.value = !0), (i = e.onFocus) == null || i.call(e))
        : ((n.value = !1), (r = e.onBlur) == null || r.call(e))
    })
    pe(() => {
      ;(t(), Ye--, Ye || Tl())
    })
  }
  return ot(n)
}
function Al() {
  ;(document.addEventListener('focusin', ws),
    (xs = !0),
    (Ot.value = document.activeElement))
}
function Tl() {
  document.removeEventListener('focusin', ws)
}
function ws() {
  Ot.value = document.activeElement
}
const Wt = P({
    __name: 'VPMenuLink',
    __ssrInlineRender: !0,
    props: { item: {} },
    setup(e) {
      const { page: n } = E()
      return (t, a, s, i) => {
        ;(a(`<div${L(x({ class: 'VPMenuLink' }, i))} data-v-807d2446>`),
          a(
            h(
              Q,
              {
                class: {
                  active: m(de)(
                    m(n).relativePath,
                    e.item.activeMatch || e.item.link,
                    !!e.item.activeMatch,
                  ),
                },
                href: e.item.link,
                target: e.item.target,
                rel: e.item.rel,
                'no-icon': e.item.noIcon,
              },
              {
                default: y((r, l, o, c) => {
                  if (l)
                    l(`<span data-v-807d2446${c}>${e.item.text ?? ''}</span>`)
                  else
                    return [
                      _('span', { innerHTML: e.item.text }, null, 8, [
                        'innerHTML',
                      ]),
                    ]
                }),
                _: 1,
              },
              s,
            ),
          ),
          a('</div>'))
      }
    },
  }),
  da = Wt.setup
Wt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPMenuLink.vue',
    ),
    da ? da(e, n) : void 0
  )
}
const $e = V(Wt, [['__scopeId', 'data-v-807d2446']]),
  zt = P({
    __name: 'VPMenuGroup',
    __ssrInlineRender: !0,
    props: { text: {}, items: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(`<div${L(x({ class: 'VPMenuGroup' }, s))} data-v-70a929c0>`),
          e.text
            ? t(`<p class="title" data-v-70a929c0>${N(e.text)}</p>`)
            : t('<!---->'),
          t('<!--[-->'),
          Y(e.items, i => {
            ;(t('<!--[-->'),
              'link' in i ? t(h($e, { item: i }, null, a)) : t('<!---->'),
              t('<!--]-->'))
          }),
          t('<!--]--></div>'))
      }
    },
  }),
  ua = zt.setup
zt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPMenuGroup.vue',
    ),
    ua ? ua(e, n) : void 0
  )
}
const _l = V(zt, [['__scopeId', 'data-v-70a929c0']]),
  Gt = P({
    __name: 'VPMenu',
    __ssrInlineRender: !0,
    props: { items: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(`<div${L(x({ class: 'VPMenu' }, s))} data-v-7be883a1>`),
          e.items
            ? (t('<div class="items" data-v-7be883a1><!--[-->'),
              Y(e.items, i => {
                ;(t('<!--[-->'),
                  'link' in i
                    ? t(h($e, { item: i }, null, a))
                    : 'component' in i
                      ? ae(
                          t,
                          _(te(i.component), x({ ref_for: !0 }, i.props), null),
                          a,
                        )
                      : t(h(_l, { text: i.text, items: i.items }, null, a)),
                  t('<!--]-->'))
              }),
              t('<!--]--></div>'))
            : t('<!---->'),
          g(n.$slots, 'default', {}, null, t, a),
          t('</div>'))
      }
    },
  }),
  fa = Gt.setup
Gt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPMenu.vue',
    ),
    fa ? fa(e, n) : void 0
  )
}
const El = V(Gt, [['__scopeId', 'data-v-7be883a1']]),
  Ut = P({
    __name: 'VPFlyout',
    __ssrInlineRender: !0,
    props: { icon: {}, button: {}, label: {}, items: {} },
    setup(e) {
      const n = R(!1),
        t = R()
      Cl({ el: t, onBlur: a })
      function a() {
        n.value = !1
      }
      return (s, i, r, l) => {
        ;(i(
          `<div${L(x({ class: 'VPFlyout', ref_key: 'el', ref: t }, l))} data-v-11ac87ca><button type="button" class="button" aria-haspopup="true"${K('aria-expanded', n.value)}${K('aria-label', e.label)} data-v-11ac87ca>`,
        ),
          e.button || e.icon
            ? (i('<span class="text" data-v-11ac87ca>'),
              e.icon
                ? i(
                    `<span class="${Pe([e.icon, 'option-icon'])}" data-v-11ac87ca></span>`,
                  )
                : i('<!---->'),
              e.button
                ? i(`<span data-v-11ac87ca>${e.button ?? ''}</span>`)
                : i('<!---->'),
              i(
                '<span class="vpi-chevron-down text-icon" data-v-11ac87ca></span></span>',
              ))
            : i(
                '<span class="vpi-more-horizontal icon" data-v-11ac87ca></span>',
              ),
          i('</button><div class="menu" data-v-11ac87ca>'),
          i(
            h(
              El,
              { items: e.items },
              {
                default: y((o, c, d, u) => {
                  if (c) g(s.$slots, 'default', {}, null, c, d, u)
                  else return [$(s.$slots, 'default', {}, void 0, !0)]
                }),
                _: 3,
              },
              r,
            ),
          ),
          i('</div></div>'))
      }
    },
  }),
  ma = Ut.setup
Ut.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPFlyout.vue',
    ),
    ma ? ma(e, n) : void 0
  )
}
const qt = V(Ut, [['__scopeId', 'data-v-11ac87ca']]),
  Kt = P({
    __name: 'VPSocialLink',
    __ssrInlineRender: !0,
    props: { icon: {}, link: {}, ariaLabel: {} },
    setup(e) {
      var s
      const n = e,
        t = R()
      Z(async () => {
        var r
        await Ve()
        const i = (r = t.value) == null ? void 0 : r.children[0]
        i instanceof HTMLElement &&
          i.className.startsWith('vpi-social-') &&
          (getComputedStyle(i).maskImage ||
            getComputedStyle(i).webkitMaskImage) === 'none' &&
          i.style.setProperty(
            '--icon',
            `url('https://api.iconify.design/simple-icons/${n.icon}.svg')`,
          )
      })
      const a = w(() =>
        typeof n.icon == 'object'
          ? n.icon.svg
          : `<span class="vpi-social-${n.icon}"></span>`,
      )
      return (
        typeof n.icon == 'string' &&
          ((s = S()) == null || s.vpSocialIcons.add(n.icon)),
        (i, r, l, o) => {
          r(
            `<a${L(x({ ref_key: 'el', ref: t, class: 'VPSocialLink no-icon', href: e.link, 'aria-label': e.ariaLabel ?? (typeof e.icon == 'string' ? e.icon : ''), target: '_blank', rel: 'noopener' }, o))} data-v-c11e9492>${a.value ?? ''}</a>`,
          )
        }
      )
    },
  }),
  va = Kt.setup
Kt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSocialLink.vue',
    ),
    va ? va(e, n) : void 0
  )
}
const Il = V(Kt, [['__scopeId', 'data-v-c11e9492']]),
  Xt = P({
    __name: 'VPSocialLinks',
    __ssrInlineRender: !0,
    props: { links: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(
          `<div${L(x({ class: 'VPSocialLinks' }, s))} data-v-56736d1b><!--[-->`,
        ),
          Y(e.links, ({ link: i, icon: r, ariaLabel: l }) => {
            t(h(Il, { key: i, icon: r, link: i, ariaLabel: l }, null, a))
          }),
          t('<!--]--></div>'))
      }
    },
  }),
  pa = Xt.setup
Xt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSocialLinks.vue',
    ),
    pa ? pa(e, n) : void 0
  )
}
const Se = V(Xt, [['__scopeId', 'data-v-56736d1b']]),
  Yt = P({
    __name: 'VPNavBarExtra',
    __ssrInlineRender: !0,
    setup(e) {
      const { site: n, theme: t } = E(),
        { localeLinks: a, currentLang: s } = Le({ correspondingLink: !0 }),
        i = w(
          () =>
            (a.value.length && s.value.label) ||
            n.value.appearance ||
            t.value.socialLinks,
        )
      return (r, l, o, c) => {
        i.value
          ? l(
              h(
                qt,
                x({ class: 'VPNavBarExtra', label: 'extra navigation' }, c),
                {
                  default: y((d, u, k, v) => {
                    if (u)
                      (m(a).length && m(s).label
                        ? (u(
                            `<div class="group translations" data-v-cdeacafd${v}><p class="trans-title" data-v-cdeacafd${v}>${N(m(s).label)}</p><!--[-->`,
                          ),
                          Y(m(a), f => {
                            u(h($e, { item: f }, null, k, v))
                          }),
                          u('<!--]--></div>'))
                        : u('<!---->'),
                        m(n).appearance &&
                        m(n).appearance !== 'force-dark' &&
                        m(n).appearance !== 'force-auto'
                          ? (u(
                              `<div class="group" data-v-cdeacafd${v}><div class="item appearance" data-v-cdeacafd${v}><p class="label" data-v-cdeacafd${v}>${N(m(t).darkModeSwitchLabel || 'Appearance')}</p><div class="appearance-action" data-v-cdeacafd${v}>`,
                            ),
                            u(h(Ne, null, null, k, v)),
                            u('</div></div></div>'))
                          : u('<!---->'),
                        m(t).socialLinks
                          ? (u(
                              `<div class="group" data-v-cdeacafd${v}><div class="item social-links" data-v-cdeacafd${v}>`,
                            ),
                            u(
                              h(
                                Se,
                                {
                                  class: 'social-links-list',
                                  links: m(t).socialLinks,
                                },
                                null,
                                k,
                                v,
                              ),
                            ),
                            u('</div></div>'))
                          : u('<!---->'))
                    else
                      return [
                        m(a).length && m(s).label
                          ? (G(),
                            U('div', { key: 0, class: 'group translations' }, [
                              _(
                                'p',
                                { class: 'trans-title' },
                                se(m(s).label),
                                1,
                              ),
                              (G(!0),
                              U(
                                it,
                                null,
                                rt(
                                  m(a),
                                  f => (
                                    G(),
                                    U($e, { key: f.link, item: f }, null, 8, [
                                      'item',
                                    ])
                                  ),
                                ),
                                128,
                              )),
                            ]))
                          : ne('', !0),
                        m(n).appearance &&
                        m(n).appearance !== 'force-dark' &&
                        m(n).appearance !== 'force-auto'
                          ? (G(),
                            U('div', { key: 1, class: 'group' }, [
                              _('div', { class: 'item appearance' }, [
                                _(
                                  'p',
                                  { class: 'label' },
                                  se(m(t).darkModeSwitchLabel || 'Appearance'),
                                  1,
                                ),
                                _('div', { class: 'appearance-action' }, [
                                  _(Ne),
                                ]),
                              ]),
                            ]))
                          : ne('', !0),
                        m(t).socialLinks
                          ? (G(),
                            U('div', { key: 2, class: 'group' }, [
                              _('div', { class: 'item social-links' }, [
                                _(
                                  Se,
                                  {
                                    class: 'social-links-list',
                                    links: m(t).socialLinks,
                                  },
                                  null,
                                  8,
                                  ['links'],
                                ),
                              ]),
                            ]))
                          : ne('', !0),
                      ]
                  }),
                  _: 1,
                },
                o,
              ),
            )
          : l('<!---->')
      }
    },
  }),
  ga = Yt.setup
Yt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarExtra.vue',
    ),
    ga ? ga(e, n) : void 0
  )
}
const Rl = V(Yt, [['__scopeId', 'data-v-cdeacafd']]),
  Jt = P({
    __name: 'VPNavBarHamburger',
    __ssrInlineRender: !0,
    props: { active: { type: Boolean } },
    emits: ['click'],
    setup(e) {
      return (n, t, a, s) => {
        t(
          `<button${L(x({ type: 'button', class: ['VPNavBarHamburger', { active: e.active }], 'aria-label': 'mobile navigation', 'aria-expanded': e.active, 'aria-controls': 'VPNavScreen' }, s))} data-v-dae42413><span class="container" data-v-dae42413><span class="top" data-v-dae42413></span><span class="middle" data-v-dae42413></span><span class="bottom" data-v-dae42413></span></span></button>`,
        )
      }
    },
  }),
  ba = Jt.setup
Jt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarHamburger.vue',
    ),
    ba ? ba(e, n) : void 0
  )
}
const Nl = V(Jt, [['__scopeId', 'data-v-dae42413']]),
  Qt = P({
    __name: 'VPNavBarMenuLink',
    __ssrInlineRender: !0,
    props: { item: {} },
    setup(e) {
      const { page: n } = E()
      return (t, a, s, i) => {
        a(
          h(
            Q,
            x(
              {
                class: {
                  VPNavBarMenuLink: !0,
                  active: m(de)(
                    m(n).relativePath,
                    e.item.activeMatch || e.item.link,
                    !!e.item.activeMatch,
                  ),
                },
                href: e.item.link,
                target: e.item.target,
                rel: e.item.rel,
                'no-icon': e.item.noIcon,
                tabindex: '0',
              },
              i,
            ),
            {
              default: y((r, l, o, c) => {
                if (l)
                  l(`<span data-v-456577f8${c}>${e.item.text ?? ''}</span>`)
                else
                  return [
                    _('span', { innerHTML: e.item.text }, null, 8, [
                      'innerHTML',
                    ]),
                  ]
              }),
              _: 1,
            },
            s,
          ),
        )
      }
    },
  }),
  ka = Qt.setup
Qt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue',
    ),
    ka ? ka(e, n) : void 0
  )
}
const Ml = V(Qt, [['__scopeId', 'data-v-456577f8']]),
  Zt = P({
    __name: 'VPNavBarMenuGroup',
    __ssrInlineRender: !0,
    props: { item: {} },
    setup(e) {
      const n = e,
        { page: t } = E(),
        a = i =>
          'component' in i
            ? !1
            : 'link' in i
              ? de(t.value.relativePath, i.link, !!n.item.activeMatch)
              : i.items.some(a),
        s = w(() => a(n.item))
      return (i, r, l, o) => {
        r(
          h(
            qt,
            x(
              {
                class: {
                  VPNavBarMenuGroup: !0,
                  active:
                    m(de)(
                      m(t).relativePath,
                      e.item.activeMatch,
                      !!e.item.activeMatch,
                    ) || s.value,
                },
                button: e.item.text,
                items: e.item.items,
              },
              o,
            ),
            null,
            l,
          ),
        )
      }
    },
  }),
  ha = Zt.setup
Zt.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue',
    ),
    ha ? ha(e, n) : void 0
  )
}
const en = P({
    __name: 'VPNavBarMenu',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E()
      return (t, a, s, i) => {
        m(n).nav
          ? (a(
              `<nav${L(x({ 'aria-labelledby': 'main-nav-aria-label', class: 'VPNavBarMenu' }, i))} data-v-d530eef9><span id="main-nav-aria-label" class="visually-hidden" data-v-d530eef9> Main Navigation </span><!--[-->`,
            ),
            Y(m(n).nav, r => {
              ;(a('<!--[-->'),
                'link' in r
                  ? a(h(Ml, { item: r }, null, s))
                  : 'component' in r
                    ? ae(
                        a,
                        _(te(r.component), x({ ref_for: !0 }, r.props), null),
                        s,
                      )
                    : a(h(Zt, { item: r }, null, s)),
                a('<!--]-->'))
            }),
            a('<!--]--></nav>'))
          : a('<!---->')
      }
    },
  }),
  ya = en.setup
en.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarMenu.vue',
    ),
    ya ? ya(e, n) : void 0
  )
}
const Bl = V(en, [['__scopeId', 'data-v-d530eef9']])
function Hl(e) {
  const { localeIndex: n, theme: t } = E()
  function a(s) {
    var f, p, b
    const i = s.split('.'),
      r = (f = t.value.search) == null ? void 0 : f.options,
      l = r && typeof r == 'object',
      o =
        (l &&
          ((b = (p = r.locales) == null ? void 0 : p[n.value]) == null
            ? void 0
            : b.translations)) ||
        null,
      c = (l && r.translations) || null
    let d = o,
      u = c,
      k = e
    const v = i.pop()
    for (const C of i) {
      let I = null
      const z = k == null ? void 0 : k[C]
      z && (I = k = z)
      const M = u == null ? void 0 : u[C]
      M && (I = u = M)
      const F = d == null ? void 0 : d[C]
      ;(F && (I = d = F), z || (k = I), M || (u = I), F || (d = I))
    }
    return (
      (d == null ? void 0 : d[v]) ??
      (u == null ? void 0 : u[v]) ??
      (k == null ? void 0 : k[v]) ??
      ''
    )
  }
  return a
}
const Me = P({
    __name: 'VPNavBarSearchButton',
    __ssrInlineRender: !0,
    setup(e) {
      const t = Hl({
        button: { buttonText: 'Search', buttonAriaLabel: 'Search' },
      })
      return (a, s, i, r) => {
        s(
          `<button${L(x({ type: 'button', class: 'DocSearch DocSearch-Button', 'aria-label': m(t)('button.buttonAriaLabel') }, r))}><span class="DocSearch-Button-Container"><span class="vp-icon DocSearch-Search-Icon"></span><span class="DocSearch-Button-Placeholder">${N(m(t)('button.buttonText'))}</span></span><span class="DocSearch-Button-Keys"><kbd class="DocSearch-Button-Key"></kbd><kbd class="DocSearch-Button-Key">K</kbd></span></button>`,
        )
      }
    },
  }),
  $a = Me.setup
Me.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSearchButton.vue',
    ),
    $a ? $a(e, n) : void 0
  )
}
const tn = P({
    __name: 'VPNavBarSearch',
    __ssrInlineRender: !0,
    setup(e) {
      const n = () => null,
        t = Fs(() => import('./VPAlgoliaSearchBox.BvScPYl5.js')),
        { theme: a } = E(),
        s = R(!1),
        i = R(!1),
        r = () => {
          const k = 'VPAlgoliaPreconnect'
          ;(window.requestIdleCallback || setTimeout)(() => {
            var p
            const f = document.createElement('link')
            ;((f.id = k),
              (f.rel = 'preconnect'),
              (f.href = `https://${(((p = a.value.search) == null ? void 0 : p.options) ?? a.value.algolia).appId}-dsn.algolia.net`),
              (f.crossOrigin = ''),
              document.head.appendChild(f))
          })
        }
      Z(() => {
        r()
        const k = f => {
            ;((f.key.toLowerCase() === 'k' && (f.metaKey || f.ctrlKey)) ||
              (!c(f) && f.key === '/')) &&
              (f.preventDefault(), l(), v())
          },
          v = () => {
            window.removeEventListener('keydown', k)
          }
        ;(window.addEventListener('keydown', k), pe(v))
      })
      function l() {
        s.value || ((s.value = !0), setTimeout(o, 16))
      }
      function o() {
        const k = new Event('keydown')
        ;((k.key = 'k'),
          (k.metaKey = !0),
          window.dispatchEvent(k),
          setTimeout(() => {
            document.querySelector('.DocSearch-Modal') || o()
          }, 16))
      }
      function c(k) {
        const v = k.target,
          f = v.tagName
        return (
          v.isContentEditable ||
          f === 'INPUT' ||
          f === 'SELECT' ||
          f === 'TEXTAREA'
        )
      }
      const d = R(!1),
        u = 'algolia'
      return (k, v, f, p) => {
        var b
        ;(v(`<div${L(x({ class: 'VPNavBarSearch' }, p))}>`),
          m(u) === 'local'
            ? (v('<!--[-->'),
              d.value
                ? v(h(m(n), { onClose: C => (d.value = !1) }, null, f))
                : v('<!---->'),
              v('<div id="local-search">'),
              v(h(Me, { onClick: C => (d.value = !0) }, null, f)),
              v('</div><!--]-->'))
            : m(u) === 'algolia'
              ? (v('<!--[-->'),
                s.value
                  ? v(
                      h(
                        m(t),
                        {
                          algolia:
                            ((b = m(a).search) == null ? void 0 : b.options) ??
                            m(a).algolia,
                          onVnodeBeforeMount: C => (i.value = !0),
                        },
                        null,
                        f,
                      ),
                    )
                  : v('<!---->'),
                i.value
                  ? v('<!---->')
                  : (v('<div id="docsearch">'),
                    v(h(Me, { onClick: l }, null, f)),
                    v('</div>')),
                v('<!--]-->'))
              : v('<!---->'),
          v('</div>'))
      }
    },
  }),
  xa = tn.setup
tn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSearch.vue',
    ),
    xa ? xa(e, n) : void 0
  )
}
const nn = P({
    __name: 'VPNavBarSocialLinks',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E()
      return (t, a, s, i) => {
        m(n).socialLinks
          ? a(
              h(
                Se,
                x({ class: 'VPNavBarSocialLinks', links: m(n).socialLinks }, i),
                null,
                s,
              ),
            )
          : a('<!---->')
      }
    },
  }),
  wa = nn.setup
nn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarSocialLinks.vue',
    ),
    wa ? wa(e, n) : void 0
  )
}
const jl = V(nn, [['__scopeId', 'data-v-4b45c2ff']]),
  an = P({
    __name: 'VPNavBarTitle',
    __ssrInlineRender: !0,
    setup(e) {
      const { site: n, theme: t } = E(),
        { hasSidebar: a } = ie(),
        { currentLang: s } = Le(),
        i = w(() => {
          var o
          return typeof t.value.logoLink == 'string'
            ? t.value.logoLink
            : (o = t.value.logoLink) == null
              ? void 0
              : o.link
        }),
        r = w(() => {
          var o
          return typeof t.value.logoLink == 'string' ||
            (o = t.value.logoLink) == null
            ? void 0
            : o.rel
        }),
        l = w(() => {
          var o
          return typeof t.value.logoLink == 'string' ||
            (o = t.value.logoLink) == null
            ? void 0
            : o.target
        })
      return (o, c, d, u) => {
        ;(c(
          `<div${L(x({ class: ['VPNavBarTitle', { 'has-sidebar': m(a) }] }, u))} data-v-f7dbfb8e><a class="title"${K('href', i.value ?? m(pt)(m(s).link))}${K('rel', r.value)}${K('target', l.value)} data-v-f7dbfb8e>`,
        ),
          g(o.$slots, 'nav-bar-title-before', {}, null, c, d),
          m(t).logo
            ? c(h(ke, { class: 'logo', image: m(t).logo }, null, d))
            : c('<!---->'),
          m(t).siteTitle
            ? c(`<span data-v-f7dbfb8e>${m(t).siteTitle ?? ''}</span>`)
            : m(t).siteTitle === void 0
              ? c(`<span data-v-f7dbfb8e>${N(m(n).title)}</span>`)
              : c('<!---->'),
          g(o.$slots, 'nav-bar-title-after', {}, null, c, d),
          c('</a></div>'))
      }
    },
  }),
  Sa = an.setup
an.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarTitle.vue',
    ),
    Sa ? Sa(e, n) : void 0
  )
}
const Dl = V(an, [['__scopeId', 'data-v-f7dbfb8e']]),
  sn = P({
    __name: 'VPNavBarTranslations',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E(),
        { localeLinks: t, currentLang: a } = Le({ correspondingLink: !0 })
      return (s, i, r, l) => {
        m(t).length && m(a).label
          ? i(
              h(
                qt,
                x(
                  {
                    class: 'VPNavBarTranslations',
                    icon: 'vpi-languages',
                    label: m(n).langMenuLabel || 'Change language',
                  },
                  l,
                ),
                {
                  default: y((o, c, d, u) => {
                    if (c)
                      (c(
                        `<div class="items" data-v-15110f75${u}><p class="title" data-v-15110f75${u}>${N(m(a).label)}</p><!--[-->`,
                      ),
                        Y(m(t), k => {
                          c(h($e, { item: k }, null, d, u))
                        }),
                        c('<!--]--></div>'))
                    else
                      return [
                        _('div', { class: 'items' }, [
                          _('p', { class: 'title' }, se(m(a).label), 1),
                          (G(!0),
                          U(
                            it,
                            null,
                            rt(
                              m(t),
                              k => (
                                G(),
                                U($e, { key: k.link, item: k }, null, 8, [
                                  'item',
                                ])
                              ),
                            ),
                            128,
                          )),
                        ]),
                      ]
                  }),
                  _: 1,
                },
                r,
              ),
            )
          : i('<!---->')
      }
    },
  }),
  Pa = sn.setup
sn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBarTranslations.vue',
    ),
    Pa ? Pa(e, n) : void 0
  )
}
const Fl = V(sn, [['__scopeId', 'data-v-15110f75']]),
  on = P({
    __name: 'VPNavBar',
    __ssrInlineRender: !0,
    props: { isScreenOpen: { type: Boolean } },
    emits: ['toggle-screen'],
    setup(e) {
      const n = e,
        { y: t } = ls(),
        { hasSidebar: a } = ie(),
        { frontmatter: s } = E(),
        i = R({})
      return (
        lt(() => {
          i.value = {
            'has-sidebar': a.value,
            home: s.value.layout === 'home',
            top: t.value === 0,
            'screen-open': n.isScreenOpen,
          }
        }),
        (r, l, o, c) => {
          ;(l(
            `<div${L(x({ class: ['VPNavBar', i.value] }, c))} data-v-03f5f98a><div class="wrapper" data-v-03f5f98a><div class="container" data-v-03f5f98a><div class="title" data-v-03f5f98a>`,
          ),
            l(
              h(
                Dl,
                null,
                {
                  'nav-bar-title-before': y((d, u, k, v) => {
                    if (u)
                      g(r.$slots, 'nav-bar-title-before', {}, null, u, k, v)
                    else
                      return [
                        $(r.$slots, 'nav-bar-title-before', {}, void 0, !0),
                      ]
                  }),
                  'nav-bar-title-after': y((d, u, k, v) => {
                    if (u) g(r.$slots, 'nav-bar-title-after', {}, null, u, k, v)
                    else
                      return [
                        $(r.$slots, 'nav-bar-title-after', {}, void 0, !0),
                      ]
                  }),
                  _: 3,
                },
                o,
              ),
            ),
            l(
              '</div><div class="content" data-v-03f5f98a><div class="content-body" data-v-03f5f98a>',
            ),
            g(r.$slots, 'nav-bar-content-before', {}, null, l, o),
            l(h(tn, { class: 'search' }, null, o)),
            l(h(Bl, { class: 'menu' }, null, o)),
            l(h(Fl, { class: 'translations' }, null, o)),
            l(h(Ll, { class: 'appearance' }, null, o)),
            l(h(jl, { class: 'social-links' }, null, o)),
            l(h(Rl, { class: 'extra' }, null, o)),
            g(r.$slots, 'nav-bar-content-after', {}, null, l, o),
            l(
              h(
                Nl,
                {
                  class: 'hamburger',
                  active: e.isScreenOpen,
                  onClick: d => r.$emit('toggle-screen'),
                },
                null,
                o,
              ),
            ),
            l(
              '</div></div></div></div><div class="divider" data-v-03f5f98a><div class="divider-line" data-v-03f5f98a></div></div></div>',
            ))
        }
      )
    },
  }),
  Va = on.setup
on.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavBar.vue',
    ),
    Va ? Va(e, n) : void 0
  )
}
const Ol = V(on, [['__scopeId', 'data-v-03f5f98a']]),
  ln = P({
    __name: 'VPNavScreenAppearance',
    __ssrInlineRender: !0,
    setup(e) {
      const { site: n, theme: t } = E()
      return (a, s, i, r) => {
        m(n).appearance &&
        m(n).appearance !== 'force-dark' &&
        m(n).appearance !== 'force-auto'
          ? (s(
              `<div${L(x({ class: 'VPNavScreenAppearance' }, r))} data-v-725729c0><p class="text" data-v-725729c0>${N(m(t).darkModeSwitchLabel || 'Appearance')}</p>`,
            ),
            s(h(Ne, null, null, i)),
            s('</div>'))
          : s('<!---->')
      }
    },
  }),
  La = ln.setup
ln.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenAppearance.vue',
    ),
    La ? La(e, n) : void 0
  )
}
const Wl = V(ln, [['__scopeId', 'data-v-725729c0']]),
  rn = P({
    __name: 'VPNavScreenMenuLink',
    __ssrInlineRender: !0,
    props: { item: {} },
    setup(e) {
      const n = me('close-screen')
      return (t, a, s, i) => {
        a(
          h(
            Q,
            x(
              {
                class: 'VPNavScreenMenuLink',
                href: e.item.link,
                target: e.item.target,
                rel: e.item.rel,
                'no-icon': e.item.noIcon,
                onClick: m(n),
              },
              i,
            ),
            {
              default: y((r, l, o, c) => {
                if (l)
                  l(`<span data-v-86559462${c}>${e.item.text ?? ''}</span>`)
                else
                  return [
                    _('span', { innerHTML: e.item.text }, null, 8, [
                      'innerHTML',
                    ]),
                  ]
              }),
              _: 1,
            },
            s,
          ),
        )
      }
    },
  }),
  Ca = rn.setup
rn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuLink.vue',
    ),
    Ca ? Ca(e, n) : void 0
  )
}
const zl = V(rn, [['__scopeId', 'data-v-86559462']]),
  cn = P({
    __name: 'VPNavScreenMenuGroupLink',
    __ssrInlineRender: !0,
    props: { item: {} },
    setup(e) {
      const n = me('close-screen')
      return (t, a, s, i) => {
        a(
          h(
            Q,
            x(
              {
                class: 'VPNavScreenMenuGroupLink',
                href: e.item.link,
                target: e.item.target,
                rel: e.item.rel,
                'no-icon': e.item.noIcon,
                onClick: m(n),
              },
              i,
            ),
            {
              default: y((r, l, o, c) => {
                if (l)
                  l(`<span data-v-f5226c2f${c}>${e.item.text ?? ''}</span>`)
                else
                  return [
                    _('span', { innerHTML: e.item.text }, null, 8, [
                      'innerHTML',
                    ]),
                  ]
              }),
              _: 1,
            },
            s,
          ),
        )
      }
    },
  }),
  Aa = cn.setup
cn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroupLink.vue',
    ),
    Aa ? Aa(e, n) : void 0
  )
}
const Ss = V(cn, [['__scopeId', 'data-v-f5226c2f']]),
  dn = P({
    __name: 'VPNavScreenMenuGroupSection',
    __ssrInlineRender: !0,
    props: { text: {}, items: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(
          `<div${L(x({ class: 'VPNavScreenMenuGroupSection' }, s))} data-v-e203d086>`,
        ),
          e.text
            ? t(`<p class="title" data-v-e203d086>${N(e.text)}</p>`)
            : t('<!---->'),
          t('<!--[-->'),
          Y(e.items, i => {
            t(h(Ss, { key: i.text, item: i }, null, a))
          }),
          t('<!--]--></div>'))
      }
    },
  }),
  Ta = dn.setup
dn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroupSection.vue',
    ),
    Ta ? Ta(e, n) : void 0
  )
}
const Gl = V(dn, [['__scopeId', 'data-v-e203d086']]),
  un = P({
    __name: 'VPNavScreenMenuGroup',
    __ssrInlineRender: !0,
    props: { text: {}, items: {} },
    setup(e) {
      const n = e,
        t = R(!1),
        a = w(() => `NavScreenGroup-${n.text.replace(' ', '-').toLowerCase()}`)
      return (s, i, r, l) => {
        ;(i(
          `<div${L(x({ class: ['VPNavScreenMenuGroup', { open: t.value }] }, l))} data-v-c8558e85><button class="button"${K('aria-controls', a.value)}${K('aria-expanded', t.value)} data-v-c8558e85><span class="button-text" data-v-c8558e85>${e.text ?? ''}</span><span class="vpi-plus button-icon" data-v-c8558e85></span></button><div${K('id', a.value)} class="items" data-v-c8558e85><!--[-->`,
        ),
          Y(e.items, o => {
            ;(i('<!--[-->'),
              'link' in o
                ? (i('<div class="item" data-v-c8558e85>'),
                  i(h(Ss, { item: o }, null, r)),
                  i('</div>'))
                : 'component' in o
                  ? (i('<div class="item" data-v-c8558e85>'),
                    ae(
                      i,
                      _(
                        te(o.component),
                        x({ ref_for: !0 }, o.props, { 'screen-menu': '' }),
                        null,
                      ),
                      r,
                    ),
                    i('</div>'))
                  : (i('<div class="group" data-v-c8558e85>'),
                    i(h(Gl, { text: o.text, items: o.items }, null, r)),
                    i('</div>')),
              i('<!--]-->'))
          }),
          i('<!--]--></div></div>'))
      }
    },
  }),
  _a = un.setup
un.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenuGroup.vue',
    ),
    _a ? _a(e, n) : void 0
  )
}
const Ul = V(un, [['__scopeId', 'data-v-c8558e85']]),
  fn = P({
    __name: 'VPNavScreenMenu',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E()
      return (t, a, s, i) => {
        m(n).nav
          ? (a(`<nav${L(x({ class: 'VPNavScreenMenu' }, i))}><!--[-->`),
            Y(m(n).nav, r => {
              ;(a('<!--[-->'),
                'link' in r
                  ? a(h(zl, { item: r }, null, s))
                  : 'component' in r
                    ? ae(
                        a,
                        _(
                          te(r.component),
                          x({ ref_for: !0 }, r.props, { 'screen-menu': '' }),
                          null,
                        ),
                        s,
                      )
                    : a(h(Ul, { text: r.text || '', items: r.items }, null, s)),
                a('<!--]-->'))
            }),
            a('<!--]--></nav>'))
          : a('<!---->')
      }
    },
  }),
  Ea = fn.setup
fn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenMenu.vue',
    ),
    Ea ? Ea(e, n) : void 0
  )
}
const mn = P({
    __name: 'VPNavScreenSocialLinks',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E()
      return (t, a, s, i) => {
        m(n).socialLinks
          ? a(
              h(
                Se,
                x(
                  { class: 'VPNavScreenSocialLinks', links: m(n).socialLinks },
                  i,
                ),
                null,
                s,
              ),
            )
          : a('<!---->')
      }
    },
  }),
  Ia = mn.setup
mn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenSocialLinks.vue',
    ),
    Ia ? Ia(e, n) : void 0
  )
}
const vn = P({
    __name: 'VPNavScreenTranslations',
    __ssrInlineRender: !0,
    setup(e) {
      const { localeLinks: n, currentLang: t } = Le({ correspondingLink: !0 }),
        a = R(!1)
      return (s, i, r, l) => {
        m(n).length && m(t).label
          ? (i(
              `<div${L(x({ class: ['VPNavScreenTranslations', { open: a.value }] }, l))} data-v-3b0dc24c><button class="title" data-v-3b0dc24c><span class="vpi-languages icon lang" data-v-3b0dc24c></span> ${N(m(t).label)} <span class="vpi-chevron-down icon chevron" data-v-3b0dc24c></span></button><ul class="list" data-v-3b0dc24c><!--[-->`,
            ),
            Y(m(n), o => {
              ;(i('<li class="item" data-v-3b0dc24c>'),
                i(
                  h(
                    Q,
                    { class: 'link', href: o.link },
                    {
                      default: y((c, d, u, k) => {
                        if (d) d(`${N(o.text)}`)
                        else return [ye(se(o.text), 1)]
                      }),
                      _: 2,
                    },
                    r,
                  ),
                ),
                i('</li>'))
            }),
            i('<!--]--></ul></div>'))
          : i('<!---->')
      }
    },
  }),
  Ra = vn.setup
vn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreenTranslations.vue',
    ),
    Ra ? Ra(e, n) : void 0
  )
}
const ql = V(vn, [['__scopeId', 'data-v-3b0dc24c']]),
  pn = P({
    __name: 'VPNavScreen',
    __ssrInlineRender: !0,
    props: { open: { type: Boolean } },
    setup(e) {
      const n = R(null)
      return (
        os(O ? document.body : null),
        (t, a, s, i) => {
          e.open
            ? (a(
                `<div${L(x({ class: 'VPNavScreen', ref_key: 'screen', ref: n, id: 'VPNavScreen' }, i))} data-v-843889b5><div class="container" data-v-843889b5>`,
              ),
              g(t.$slots, 'nav-screen-content-before', {}, null, a, s),
              a(h(fn, { class: 'menu' }, null, s)),
              a(h(ql, { class: 'translations' }, null, s)),
              a(h(Wl, { class: 'appearance' }, null, s)),
              a(h(mn, { class: 'social-links' }, null, s)),
              g(t.$slots, 'nav-screen-content-after', {}, null, a, s),
              a('</div></div>'))
            : a('<!---->')
        }
      )
    },
  }),
  Na = pn.setup
pn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNavScreen.vue',
    ),
    Na ? Na(e, n) : void 0
  )
}
const Kl = V(pn, [['__scopeId', 'data-v-843889b5']]),
  gn = P({
    __name: 'VPNav',
    __ssrInlineRender: !0,
    setup(e) {
      const { isScreenOpen: n, closeScreen: t, toggleScreen: a } = Sl(),
        { frontmatter: s } = E(),
        i = w(() => s.value.navbar !== !1)
      return (
        Qa('close-screen', t),
        ve(() => {
          O && document.documentElement.classList.toggle('hide-nav', !i.value)
        }),
        (r, l, o, c) => {
          i.value
            ? (l(`<header${L(x({ class: 'VPNav' }, c))} data-v-13f6b81c>`),
              l(
                h(
                  Ol,
                  { 'is-screen-open': m(n), onToggleScreen: m(a) },
                  {
                    'nav-bar-title-before': y((d, u, k, v) => {
                      if (u)
                        g(r.$slots, 'nav-bar-title-before', {}, null, u, k, v)
                      else
                        return [
                          $(r.$slots, 'nav-bar-title-before', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-title-after': y((d, u, k, v) => {
                      if (u)
                        g(r.$slots, 'nav-bar-title-after', {}, null, u, k, v)
                      else
                        return [
                          $(r.$slots, 'nav-bar-title-after', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-content-before': y((d, u, k, v) => {
                      if (u)
                        g(r.$slots, 'nav-bar-content-before', {}, null, u, k, v)
                      else
                        return [
                          $(r.$slots, 'nav-bar-content-before', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-content-after': y((d, u, k, v) => {
                      if (u)
                        g(r.$slots, 'nav-bar-content-after', {}, null, u, k, v)
                      else
                        return [
                          $(r.$slots, 'nav-bar-content-after', {}, void 0, !0),
                        ]
                    }),
                    _: 3,
                  },
                  o,
                ),
              ),
              l(
                h(
                  Kl,
                  { open: m(n) },
                  {
                    'nav-screen-content-before': y((d, u, k, v) => {
                      if (u)
                        g(
                          r.$slots,
                          'nav-screen-content-before',
                          {},
                          null,
                          u,
                          k,
                          v,
                        )
                      else
                        return [
                          $(
                            r.$slots,
                            'nav-screen-content-before',
                            {},
                            void 0,
                            !0,
                          ),
                        ]
                    }),
                    'nav-screen-content-after': y((d, u, k, v) => {
                      if (u)
                        g(
                          r.$slots,
                          'nav-screen-content-after',
                          {},
                          null,
                          u,
                          k,
                          v,
                        )
                      else
                        return [
                          $(
                            r.$slots,
                            'nav-screen-content-after',
                            {},
                            void 0,
                            !0,
                          ),
                        ]
                    }),
                    _: 3,
                  },
                  o,
                ),
              ),
              l('</header>'))
            : l('<!---->')
        }
      )
    },
  }),
  Ma = gn.setup
gn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPNav.vue',
    ),
    Ma ? Ma(e, n) : void 0
  )
}
const Xl = V(gn, [['__scopeId', 'data-v-13f6b81c']]),
  bn = P({
    __name: 'VPSidebarItem',
    __ssrInlineRender: !0,
    props: { item: {}, depth: {} },
    setup(e) {
      const n = e,
        {
          collapsed: t,
          collapsible: a,
          isLink: s,
          isActiveLink: i,
          hasActiveLink: r,
          hasChildren: l,
          toggle: o,
        } = Yo(w(() => n.item)),
        c = w(() => (l.value ? 'section' : 'div')),
        d = w(() => (s.value ? 'a' : 'div')),
        u = w(() =>
          l.value ? (n.depth + 2 === 7 ? 'p' : `h${n.depth + 2}`) : 'p',
        ),
        k = w(() => (s.value ? void 0 : 'button')),
        v = w(() => [
          [`level-${n.depth}`],
          { collapsible: a.value },
          { collapsed: t.value },
          { 'is-link': s.value },
          { 'is-active': i.value },
          { 'has-active': r.value },
        ])
      function f(b) {
        ;('key' in b && b.key !== 'Enter') || (!n.item.link && o())
      }
      function p() {
        n.item.link && o()
      }
      return (b, C, I, z) => {
        const M = ge('VPSidebarItem', !0)
        ae(
          C,
          _(te(c.value), x({ class: ['VPSidebarItem', v.value] }, z), {
            default: y((F, B, T, W) => {
              if (B)
                (e.item.text
                  ? (B(
                      `<div class="item"${K('role', k.value)}${K('tabindex', e.item.items && 0)} data-v-0abff789${W}><div class="indicator" data-v-0abff789${W}></div>`,
                    ),
                    e.item.link
                      ? B(
                          h(
                            Q,
                            {
                              tag: d.value,
                              class: 'link',
                              href: e.item.link,
                              rel: e.item.rel,
                              target: e.item.target,
                            },
                            {
                              default: y((H, J, A, D) => {
                                if (J)
                                  ae(
                                    J,
                                    _(te(u.value), { class: 'text' }, null),
                                    A,
                                    D,
                                  )
                                else
                                  return [
                                    (G(),
                                    U(
                                      te(u.value),
                                      { class: 'text', innerHTML: e.item.text },
                                      null,
                                      8,
                                      ['innerHTML'],
                                    )),
                                  ]
                              }),
                              _: 1,
                            },
                            T,
                            W,
                          ),
                        )
                      : ae(B, _(te(u.value), { class: 'text' }, null), T, W),
                    e.item.collapsed != null &&
                    e.item.items &&
                    e.item.items.length
                      ? B(
                          `<div class="caret" role="button" aria-label="toggle section" tabindex="0" data-v-0abff789${W}><span class="vpi-chevron-right caret-icon" data-v-0abff789${W}></span></div>`,
                        )
                      : B('<!---->'),
                    B('</div>'))
                  : B('<!---->'),
                  e.item.items && e.item.items.length
                    ? (B(`<div class="items" data-v-0abff789${W}>`),
                      e.depth < 5
                        ? (B('<!--[-->'),
                          Y(e.item.items, H => {
                            B(
                              h(
                                M,
                                { key: H.text, item: H, depth: e.depth + 1 },
                                null,
                                T,
                                W,
                              ),
                            )
                          }),
                          B('<!--]-->'))
                        : B('<!---->'),
                      B('</div>'))
                    : B('<!---->'))
              else
                return [
                  e.item.text
                    ? (G(),
                      U(
                        'div',
                        x(
                          { key: 0, class: 'item', role: k.value },
                          Os(e.item.items ? { click: f, keydown: f } : {}, !0),
                          { tabindex: e.item.items && 0 },
                        ),
                        [
                          _('div', { class: 'indicator' }),
                          e.item.link
                            ? (G(),
                              U(
                                Q,
                                {
                                  key: 0,
                                  tag: d.value,
                                  class: 'link',
                                  href: e.item.link,
                                  rel: e.item.rel,
                                  target: e.item.target,
                                },
                                {
                                  default: y(() => [
                                    (G(),
                                    U(
                                      te(u.value),
                                      { class: 'text', innerHTML: e.item.text },
                                      null,
                                      8,
                                      ['innerHTML'],
                                    )),
                                  ]),
                                  _: 1,
                                },
                                8,
                                ['tag', 'href', 'rel', 'target'],
                              ))
                            : (G(),
                              U(
                                te(u.value),
                                {
                                  key: 1,
                                  class: 'text',
                                  innerHTML: e.item.text,
                                },
                                null,
                                8,
                                ['innerHTML'],
                              )),
                          e.item.collapsed != null &&
                          e.item.items &&
                          e.item.items.length
                            ? (G(),
                              U(
                                'div',
                                {
                                  key: 2,
                                  class: 'caret',
                                  role: 'button',
                                  'aria-label': 'toggle section',
                                  onClick: p,
                                  onKeydown: Ws(p, ['enter']),
                                  tabindex: '0',
                                },
                                [
                                  _('span', {
                                    class: 'vpi-chevron-right caret-icon',
                                  }),
                                ],
                                32,
                              ))
                            : ne('', !0),
                        ],
                        16,
                        ['role', 'tabindex'],
                      ))
                    : ne('', !0),
                  e.item.items && e.item.items.length
                    ? (G(),
                      U('div', { key: 1, class: 'items' }, [
                        e.depth < 5
                          ? (G(!0),
                            U(
                              it,
                              { key: 0 },
                              rt(
                                e.item.items,
                                H => (
                                  G(),
                                  U(
                                    M,
                                    {
                                      key: H.text,
                                      item: H,
                                      depth: e.depth + 1,
                                    },
                                    null,
                                    8,
                                    ['item', 'depth'],
                                  )
                                ),
                              ),
                              128,
                            ))
                          : ne('', !0),
                      ]))
                    : ne('', !0),
                ]
            }),
            _: 1,
          }),
          I,
        )
      }
    },
  }),
  Ba = bn.setup
bn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSidebarItem.vue',
    ),
    Ba ? Ba(e, n) : void 0
  )
}
const Yl = V(bn, [['__scopeId', 'data-v-0abff789']]),
  kn = P({
    __name: 'VPSidebarGroup',
    __ssrInlineRender: !0,
    props: { items: {} },
    setup(e) {
      const n = R(!0)
      let t = null
      return (
        Z(() => {
          t = setTimeout(() => {
            ;((t = null), (n.value = !1))
          }, 300)
        }),
        zs(() => {
          t != null && (clearTimeout(t), (t = null))
        }),
        (a, s, i, r) => {
          ;(s('<!--[-->'),
            Y(e.items, l => {
              ;(s(
                `<div class="${Pe([{ 'no-transition': n.value }, 'group'])}" data-v-fd414674>`,
              ),
                s(h(Yl, { item: l, depth: 0 }, null, i)),
                s('</div>'))
            }),
            s('<!--]-->'))
        }
      )
    },
  }),
  Ha = kn.setup
kn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSidebarGroup.vue',
    ),
    Ha ? Ha(e, n) : void 0
  )
}
const Jl = V(kn, [['__scopeId', 'data-v-fd414674']]),
  hn = P({
    __name: 'VPSidebar',
    __ssrInlineRender: !0,
    props: { open: { type: Boolean } },
    setup(e) {
      const { sidebarGroups: n, hasSidebar: t } = ie(),
        a = e,
        s = R(null),
        i = os(O ? document.body : null)
      X(
        [a, s],
        () => {
          var l
          a.open
            ? ((i.value = !0), (l = s.value) == null || l.focus())
            : (i.value = !1)
        },
        { immediate: !0, flush: 'post' },
      )
      const r = R(0)
      return (
        X(
          n,
          () => {
            r.value += 1
          },
          { deep: !0 },
        ),
        (l, o, c, d) => {
          m(t)
            ? (o(
                `<aside${L(x({ class: ['VPSidebar', { open: e.open }], ref_key: 'navEl', ref: s }, d))} data-v-4c78a0d3><div class="curtain" data-v-4c78a0d3></div><nav class="nav" id="VPSidebarNav" aria-labelledby="sidebar-aria-label" tabindex="-1" data-v-4c78a0d3><span class="visually-hidden" id="sidebar-aria-label" data-v-4c78a0d3> Sidebar Navigation </span>`,
              ),
              g(l.$slots, 'sidebar-nav-before', {}, null, o, c),
              o(h(Jl, { items: m(n), key: r.value }, null, c)),
              g(l.$slots, 'sidebar-nav-after', {}, null, o, c),
              o('</nav></aside>'))
            : o('<!---->')
        }
      )
    },
  }),
  ja = hn.setup
hn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSidebar.vue',
    ),
    ja ? ja(e, n) : void 0
  )
}
const Ql = V(hn, [['__scopeId', 'data-v-4c78a0d3']]),
  yn = P({
    __name: 'VPSkipLink',
    __ssrInlineRender: !0,
    setup(e) {
      const { theme: n } = E(),
        t = be(),
        a = R()
      return (
        X(
          () => t.path,
          () => a.value.focus(),
        ),
        (s, i, r, l) => {
          i(
            `<!--[--><span tabindex="-1" data-v-0906c062></span><a href="#VPContent" class="VPSkipLink visually-hidden" data-v-0906c062>${N(m(n).skipToContentLabel || 'Skip to content')}</a><!--]-->`,
          )
        }
      )
    },
  }),
  Da = yn.setup
yn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSkipLink.vue',
    ),
    Da ? Da(e, n) : void 0
  )
}
const Zl = V(yn, [['__scopeId', 'data-v-0906c062']]),
  $n = P({
    __name: 'Layout',
    __ssrInlineRender: !0,
    setup(e) {
      const { isOpen: n, open: t, close: a } = ie(),
        s = be()
      ;(X(() => s.path, a), Xo(n, a))
      const { frontmatter: i } = E(),
        r = Gs(),
        l = w(() => !!r['home-hero-image'])
      return (
        Qa('hero-image-slot-exists', l),
        (o, c, d, u) => {
          const k = ge('Content')
          m(i).layout !== !1
            ? (c(
                `<div${L(x({ class: ['Layout', m(i).pageClass] }, u))} data-v-4a266b85>`,
              ),
              g(o.$slots, 'layout-top', {}, null, c, d),
              c(h(Zl, null, null, d)),
              c(
                h(
                  zo,
                  { class: 'backdrop', show: m(n), onClick: m(a) },
                  null,
                  d,
                ),
              ),
              c(
                h(
                  Xl,
                  null,
                  {
                    'nav-bar-title-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'nav-bar-title-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'nav-bar-title-before', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-title-after': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'nav-bar-title-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'nav-bar-title-after', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-content-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'nav-bar-content-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'nav-bar-content-before', {}, void 0, !0),
                        ]
                    }),
                    'nav-bar-content-after': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'nav-bar-content-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'nav-bar-content-after', {}, void 0, !0),
                        ]
                    }),
                    'nav-screen-content-before': y((v, f, p, b) => {
                      if (f)
                        g(
                          o.$slots,
                          'nav-screen-content-before',
                          {},
                          null,
                          f,
                          p,
                          b,
                        )
                      else
                        return [
                          $(
                            o.$slots,
                            'nav-screen-content-before',
                            {},
                            void 0,
                            !0,
                          ),
                        ]
                    }),
                    'nav-screen-content-after': y((v, f, p, b) => {
                      if (f)
                        g(
                          o.$slots,
                          'nav-screen-content-after',
                          {},
                          null,
                          f,
                          p,
                          b,
                        )
                      else
                        return [
                          $(
                            o.$slots,
                            'nav-screen-content-after',
                            {},
                            void 0,
                            !0,
                          ),
                        ]
                    }),
                    _: 3,
                  },
                  d,
                ),
              ),
              c(h(wl, { open: m(n), onOpenMenu: m(t) }, null, d)),
              c(
                h(
                  Ql,
                  { open: m(n) },
                  {
                    'sidebar-nav-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'sidebar-nav-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'sidebar-nav-before', {}, void 0, !0),
                        ]
                    }),
                    'sidebar-nav-after': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'sidebar-nav-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'sidebar-nav-after', {}, void 0, !0),
                        ]
                    }),
                    _: 3,
                  },
                  d,
                ),
              ),
              c(
                h(
                  hl,
                  null,
                  {
                    'page-top': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'page-top', {}, null, f, p, b)
                      else return [$(o.$slots, 'page-top', {}, void 0, !0)]
                    }),
                    'page-bottom': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'page-bottom', {}, null, f, p, b)
                      else return [$(o.$slots, 'page-bottom', {}, void 0, !0)]
                    }),
                    'not-found': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'not-found', {}, null, f, p, b)
                      else return [$(o.$slots, 'not-found', {}, void 0, !0)]
                    }),
                    'home-hero-before': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'home-hero-before', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'home-hero-before', {}, void 0, !0)]
                    }),
                    'home-hero-info-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'home-hero-info-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'home-hero-info-before', {}, void 0, !0),
                        ]
                    }),
                    'home-hero-info': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'home-hero-info', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'home-hero-info', {}, void 0, !0)]
                    }),
                    'home-hero-info-after': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'home-hero-info-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'home-hero-info-after', {}, void 0, !0),
                        ]
                    }),
                    'home-hero-actions-after': y((v, f, p, b) => {
                      if (f)
                        g(
                          o.$slots,
                          'home-hero-actions-after',
                          {},
                          null,
                          f,
                          p,
                          b,
                        )
                      else
                        return [
                          $(
                            o.$slots,
                            'home-hero-actions-after',
                            {},
                            void 0,
                            !0,
                          ),
                        ]
                    }),
                    'home-hero-image': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'home-hero-image', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'home-hero-image', {}, void 0, !0)]
                    }),
                    'home-hero-after': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'home-hero-after', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'home-hero-after', {}, void 0, !0)]
                    }),
                    'home-features-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'home-features-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'home-features-before', {}, void 0, !0),
                        ]
                    }),
                    'home-features-after': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'home-features-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'home-features-after', {}, void 0, !0),
                        ]
                    }),
                    'doc-footer-before': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'doc-footer-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'doc-footer-before', {}, void 0, !0),
                        ]
                    }),
                    'doc-before': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'doc-before', {}, null, f, p, b)
                      else return [$(o.$slots, 'doc-before', {}, void 0, !0)]
                    }),
                    'doc-after': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'doc-after', {}, null, f, p, b)
                      else return [$(o.$slots, 'doc-after', {}, void 0, !0)]
                    }),
                    'doc-top': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'doc-top', {}, null, f, p, b)
                      else return [$(o.$slots, 'doc-top', {}, void 0, !0)]
                    }),
                    'doc-bottom': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'doc-bottom', {}, null, f, p, b)
                      else return [$(o.$slots, 'doc-bottom', {}, void 0, !0)]
                    }),
                    'aside-top': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'aside-top', {}, null, f, p, b)
                      else return [$(o.$slots, 'aside-top', {}, void 0, !0)]
                    }),
                    'aside-bottom': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'aside-bottom', {}, null, f, p, b)
                      else return [$(o.$slots, 'aside-bottom', {}, void 0, !0)]
                    }),
                    'aside-outline-before': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'aside-outline-before', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'aside-outline-before', {}, void 0, !0),
                        ]
                    }),
                    'aside-outline-after': y((v, f, p, b) => {
                      if (f)
                        g(o.$slots, 'aside-outline-after', {}, null, f, p, b)
                      else
                        return [
                          $(o.$slots, 'aside-outline-after', {}, void 0, !0),
                        ]
                    }),
                    'aside-ads-before': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'aside-ads-before', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'aside-ads-before', {}, void 0, !0)]
                    }),
                    'aside-ads-after': y((v, f, p, b) => {
                      if (f) g(o.$slots, 'aside-ads-after', {}, null, f, p, b)
                      else
                        return [$(o.$slots, 'aside-ads-after', {}, void 0, !0)]
                    }),
                    _: 3,
                  },
                  d,
                ),
              ),
              c(h(yl, null, null, d)),
              g(o.$slots, 'layout-bottom', {}, null, c, d),
              c('</div>'))
            : c(h(k, u, null, d))
        }
      )
    },
  }),
  Fa = $n.setup
$n.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/Layout.vue',
    ),
    Fa ? Fa(e, n) : void 0
  )
}
const ei = V($n, [['__scopeId', 'data-v-4a266b85']]),
  ti = {
    xmini: [[0, 2]],
    mini: [],
    small: [
      [920, 6],
      [768, 5],
      [640, 4],
      [480, 3],
      [0, 2],
    ],
    medium: [
      [960, 5],
      [832, 4],
      [640, 3],
      [480, 2],
    ],
    big: [
      [832, 3],
      [640, 2],
    ],
  }
function ni({ el: e, size: n = 'medium' }) {
  const t = bs(a, 100)
  ;(Z(() => {
    ;(a(), window.addEventListener('resize', t))
  }),
    pe(() => {
      window.removeEventListener('resize', t)
    }))
  function a() {
    ai(e.value, n)
  }
}
function ai(e, n) {
  const t = e.children.length,
    a = e.querySelectorAll('.vp-sponsor-grid-item:not(.empty)').length,
    s = si(e, n, a)
  li(e, s, t, a)
}
function si(e, n, t) {
  const a = ti[n],
    s = window.innerWidth
  let i = 1
  return (
    a.some(([r, l]) => {
      if (s >= r) return ((i = t < l ? t : l), !0)
    }),
    oi(e, i),
    i
  )
}
function oi(e, n) {
  e.dataset.vpGrid = String(n)
}
function li(e, n, t, a) {
  const s = t - a,
    i = a % n,
    r = i === 0 ? i : n - i
  ii(e, r - s)
}
function ii(e, n) {
  n !== 0 && (n > 0 ? ri(e, n) : ci(e, n * -1))
}
function ri(e, n) {
  for (let t = 0; t < n; t++) {
    const a = document.createElement('div')
    ;(a.classList.add('vp-sponsor-grid-item', 'empty'), e.append(a))
  }
}
function ci(e, n) {
  for (let t = 0; t < n; t++) e.removeChild(e.lastElementChild)
}
const xn = P({
    __name: 'VPSponsorsGrid',
    __ssrInlineRender: !0,
    props: { size: { default: 'medium' }, data: {} },
    setup(e) {
      const n = e,
        t = R(null)
      return (
        ni({ el: t, size: n.size }),
        (a, s, i, r) => {
          ;(s(
            `<div${L(x({ class: ['VPSponsorsGrid vp-sponsor-grid', [e.size]], ref_key: 'el', ref: t }, r))}><!--[-->`,
          ),
            Y(e.data, l => {
              s(
                `<div class="vp-sponsor-grid-item"><a class="vp-sponsor-grid-link"${K('href', l.url)} target="_blank" rel="sponsored noopener"><article class="vp-sponsor-grid-box"><h4 class="visually-hidden">${N(l.name)}</h4><img class="vp-sponsor-grid-image"${K('src', l.img)}${K('alt', l.name)}></article></a></div>`,
              )
            }),
            s('<!--]--></div>'))
        }
      )
    },
  }),
  Oa = xn.setup
xn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSponsorsGrid.vue',
    ),
    Oa ? Oa(e, n) : void 0
  )
}
const De = P({
    __name: 'VPSponsors',
    __ssrInlineRender: !0,
    props: { mode: { default: 'normal' }, tier: {}, size: {}, data: {} },
    setup(e) {
      const n = e,
        t = w(() =>
          n.data.some(s => 'items' in s)
            ? n.data
            : [{ tier: n.tier, size: n.size, items: n.data }],
        )
      return (a, s, i, r) => {
        ;(s(
          `<div${L(x({ class: ['VPSponsors vp-sponsor', [e.mode]] }, r))}><!--[-->`,
        ),
          Y(t.value, (l, o) => {
            ;(s('<section class="vp-sponsor-section">'),
              l.tier
                ? s(`<h3 class="vp-sponsor-tier">${N(l.tier)}</h3>`)
                : s('<!---->'),
              s(h(xn, { size: l.size, data: l.items }, null, i)),
              s('</section>'))
          }),
          s('<!--]--></div>'))
      }
    },
  }),
  Wa = De.setup
De.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPSponsors.vue',
    ),
    Wa ? Wa(e, n) : void 0
  )
}
const Ps = P({
    __name: 'VPDocAsideSponsors',
    __ssrInlineRender: !0,
    props: { tier: {}, size: {}, data: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(`<div${L(x({ class: 'VPDocAsideSponsors' }, s))}>`),
          t(
            h(
              De,
              { mode: 'aside', tier: e.tier, size: e.size, data: e.data },
              null,
              a,
            ),
          ),
          t('</div>'))
      }
    },
  }),
  za = Ps.setup
Ps.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPDocAsideSponsors.vue',
    ),
    za ? za(e, n) : void 0
  )
}
const Vs = P({
    __name: 'VPHomeSponsors',
    __ssrInlineRender: !0,
    props: {
      message: {},
      actionText: { default: 'Become a sponsor' },
      actionLink: {},
      data: {},
    },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(
          `<section${L(x({ class: 'VPHomeSponsors' }, s))} data-v-25d53fd4><div class="container" data-v-25d53fd4><div class="header" data-v-25d53fd4><div class="love" data-v-25d53fd4><span class="vpi-heart icon" data-v-25d53fd4></span></div>`,
        ),
          e.message
            ? t(`<h2 class="message" data-v-25d53fd4>${N(e.message)}</h2>`)
            : t('<!---->'),
          t('</div><div class="sponsors" data-v-25d53fd4>'),
          t(h(De, { data: e.data }, null, a)),
          t('</div>'),
          e.actionLink
            ? (t('<div class="action" data-v-25d53fd4>'),
              t(
                h(
                  $s,
                  { theme: 'sponsor', text: e.actionText, href: e.actionLink },
                  null,
                  a,
                ),
              ),
              t('</div>'))
            : t('<!---->'),
          t('</div></section>'))
      }
    },
  }),
  Ga = Vs.setup
Vs.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPHomeSponsors.vue',
    ),
    Ga ? Ga(e, n) : void 0
  )
}
const wn = P({
    __name: 'VPTeamMembersItem',
    __ssrInlineRender: !0,
    props: { size: { default: 'medium' }, member: {} },
    setup(e) {
      return (n, t, a, s) => {
        ;(t(
          `<article${L(x({ class: ['VPTeamMembersItem', [e.size]] }, s))} data-v-e7da5787><div class="profile" data-v-e7da5787><figure class="avatar" data-v-e7da5787><img class="avatar-img"${K('src', e.member.avatar)}${K('alt', e.member.name)} data-v-e7da5787></figure><div class="data" data-v-e7da5787><h1 class="name" data-v-e7da5787>${N(e.member.name)}</h1>`,
        ),
          e.member.title || e.member.org
            ? (t('<p class="affiliation" data-v-e7da5787>'),
              e.member.title
                ? t(
                    `<span class="title" data-v-e7da5787>${N(e.member.title)}</span>`,
                  )
                : t('<!---->'),
              e.member.title && e.member.org
                ? t('<span class="at" data-v-e7da5787> @ </span>')
                : t('<!---->'),
              e.member.org
                ? t(
                    h(
                      Q,
                      {
                        class: ['org', { link: e.member.orgLink }],
                        href: e.member.orgLink,
                        'no-icon': '',
                      },
                      {
                        default: y((i, r, l, o) => {
                          if (r) r(`${N(e.member.org)}`)
                          else return [ye(se(e.member.org), 1)]
                        }),
                        _: 1,
                      },
                      a,
                    ),
                  )
                : t('<!---->'),
              t('</p>'))
            : t('<!---->'),
          e.member.desc
            ? t(`<p class="desc" data-v-e7da5787>${e.member.desc ?? ''}</p>`)
            : t('<!---->'),
          e.member.links
            ? (t('<div class="links" data-v-e7da5787>'),
              t(h(Se, { links: e.member.links }, null, a)),
              t('</div>'))
            : t('<!---->'),
          t('</div></div>'),
          e.member.sponsor
            ? (t('<div class="sp" data-v-e7da5787>'),
              t(
                h(
                  Q,
                  { class: 'sp-link', href: e.member.sponsor, 'no-icon': '' },
                  {
                    default: y((i, r, l, o) => {
                      if (r)
                        r(
                          `<span class="vpi-heart sp-icon" data-v-e7da5787${o}></span> ${N(e.member.actionText || 'Sponsor')}`,
                        )
                      else
                        return [
                          _('span', { class: 'vpi-heart sp-icon' }),
                          ye(' ' + se(e.member.actionText || 'Sponsor'), 1),
                        ]
                    }),
                    _: 1,
                  },
                  a,
                ),
              ),
              t('</div>'))
            : t('<!---->'),
          t('</article>'))
      }
    },
  }),
  Ua = wn.setup
wn.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPTeamMembersItem.vue',
    ),
    Ua ? Ua(e, n) : void 0
  )
}
const di = V(wn, [['__scopeId', 'data-v-e7da5787']]),
  Ls = P({
    __name: 'VPTeamMembers',
    __ssrInlineRender: !0,
    props: { size: { default: 'medium' }, members: {} },
    setup(e) {
      const n = e,
        t = w(() => [n.size, `count-${n.members.length}`])
      return (a, s, i, r) => {
        ;(s(
          `<div${L(x({ class: ['VPTeamMembers', t.value] }, r))} data-v-c17eaa63><div class="container" data-v-c17eaa63><!--[-->`,
        ),
          Y(e.members, l => {
            ;(s('<div class="item" data-v-c17eaa63>'),
              s(h(di, { size: e.size, member: l }, null, i)),
              s('</div>'))
          }),
          s('<!--]--></div></div>'))
      }
    },
  }),
  qa = Ls.setup
Ls.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPTeamMembers.vue',
    ),
    qa ? qa(e, n) : void 0
  )
}
const Cs = {},
  Ka = Cs.setup
Cs.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPTeamPage.vue',
    ),
    Ka ? Ka(e, n) : void 0
  )
}
const As = {},
  Xa = As.setup
As.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPTeamPageSection.vue',
    ),
    Xa ? Xa(e, n) : void 0
  )
}
const Ts = {},
  Ya = Ts.setup
Ts.setup = (e, n) => {
  const t = S()
  return (
    (t.modules || (t.modules = new Set())).add(
      '../../node_modules/.pnpm/vitepress@1.6.4_@algolia+client-search@5.53.0_@types+node@24.13.2_async-validator@4.2.5_7814c80c32fef42abcd14e70994ddcdc/node_modules/vitepress/dist/client/theme-default/components/VPTeamPageTitle.vue',
    ),
    Ya ? Ya(e, n) : void 0
  )
}
const ui = {
    Layout: ei,
    enhanceApp: ({ app: e }) => {
      e.component('Badge', mt)
    },
  },
  fi = {
    extends: ui,
    enhanceApp({ app: e }) {
      ;(e.use(Xs),
        typeof window < 'u' &&
          (Promise.resolve({}),
          console.log('🚀 生产环境，Sentry 性能监控已启动'),
          Oe.init({
            app: e,
            dsn: 'https://b288271c3fd985d21205cbd7e36e3a43@o4511569356718080.ingest.us.sentry.io/4511569367269376',
            integrations: [
              Oe.browserTracingIntegration(),
              Oe.replayIntegration(),
            ],
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 1,
          })),
        e.component(
          'demo-preview',
          P({
            name: 'DemoPreview',
            props: {
              suffixName: { type: String, default: '' },
              absolutePath: { type: String, default: '' },
              relativePath: { type: String, default: '' },
            },
            setup(n, { attrs: t, slots: a }) {
              return () => Re(Ks, t, a)
            },
          }),
        ))
    },
    setup() {
      const e = be()
      let n = null
      const t = () => {
        n && n.destroy()
        const a = document.querySelector('.vp-doc')
        a &&
          (n = new qs(a, {
            inline: !1,
            button: !0,
            navbar: !1,
            title: !1,
            toolbar: !0,
            tooltip: !0,
            movable: !0,
            zoomable: !0,
          }))
      }
      ;(Z(() => {
        t()
      }),
        X(
          () => e.path,
          () => Ve(() => t()),
        ))
    },
  },
  mi = P({
    setup(e, { slots: n }) {
      const t = R(!1)
      return (
        Z(() => {
          t.value = !0
        }),
        () => (t.value && n.default ? n.default() : null)
      )
    },
  })
function vi() {
  O &&
    window.addEventListener('click', e => {
      var t
      const n = e.target
      if (n.matches('.vp-code-group input')) {
        const a = (t = n.parentElement) == null ? void 0 : t.parentElement
        if (!a) return
        const s = Array.from(a.querySelectorAll('input')).indexOf(n)
        if (s < 0) return
        const i = a.querySelector('.blocks')
        if (!i) return
        const r = Array.from(i.children).find(c =>
          c.classList.contains('active'),
        )
        if (!r) return
        const l = i.children[s]
        if (!l || r === l) return
        ;(r.classList.remove('active'), l.classList.add('active'))
        const o = a == null ? void 0 : a.querySelector(`label[for="${n.id}"]`)
        o == null || o.scrollIntoView({ block: 'nearest' })
      }
    })
}
function pi() {
  if (O) {
    const e = new WeakMap()
    window.addEventListener('click', n => {
      var a
      const t = n.target
      if (t.matches('div[class*="language-"] > button.copy')) {
        const s = t.parentElement,
          i = (a = t.nextElementSibling) == null ? void 0 : a.nextElementSibling
        if (!s || !i) return
        const r = /language-(shellscript|shell|bash|sh|zsh)/.test(s.className),
          l = ['.vp-copy-ignore', '.diff.remove'],
          o = i.cloneNode(!0)
        o.querySelectorAll(l.join(',')).forEach(d => d.remove())
        let c = o.textContent || ''
        ;(r && (c = c.replace(/^ *(\$|>) /gm, '').trim()),
          gi(c).then(() => {
            ;(t.classList.add('copied'), clearTimeout(e.get(t)))
            const d = setTimeout(() => {
              ;(t.classList.remove('copied'), t.blur(), e.delete(t))
            }, 2e3)
            e.set(t, d)
          }))
      }
    })
  }
}
async function gi(e) {
  try {
    return navigator.clipboard.writeText(e)
  } catch {
    const n = document.createElement('textarea'),
      t = document.activeElement
    ;((n.value = e),
      n.setAttribute('readonly', ''),
      (n.style.contain = 'strict'),
      (n.style.position = 'absolute'),
      (n.style.left = '-9999px'),
      (n.style.fontSize = '12pt'))
    const a = document.getSelection(),
      s = a ? a.rangeCount > 0 && a.getRangeAt(0) : null
    ;(document.body.appendChild(n),
      n.select(),
      (n.selectionStart = 0),
      (n.selectionEnd = e.length),
      document.execCommand('copy'),
      document.body.removeChild(n),
      s && (a.removeAllRanges(), a.addRange(s)),
      t && t.focus())
  }
}
function bi(e, n) {
  let t = !0,
    a = []
  const s = i => {
    if (t) {
      ;((t = !1),
        i.forEach(l => {
          const o = Je(l)
          for (const c of document.head.children)
            if (c.isEqualNode(o)) {
              a.push(c)
              return
            }
        }))
      return
    }
    const r = i.map(Je)
    ;(a.forEach((l, o) => {
      const c = r.findIndex(d =>
        d == null ? void 0 : d.isEqualNode(l ?? null),
      )
      c !== -1 ? delete r[c] : (l == null || l.remove(), delete a[o])
    }),
      r.forEach(l => l && document.head.appendChild(l)),
      (a = [...a, ...r].filter(Boolean)))
  }
  ve(() => {
    const i = e.data,
      r = n.value,
      l = i && i.description,
      o = (i && i.frontmatter.head) || [],
      c = cs(r, i)
    c !== document.title && (document.title = c)
    const d = l || r.description
    let u = document.querySelector('meta[name=description]')
    ;(u
      ? u.getAttribute('content') !== d && u.setAttribute('content', d)
      : Je(['meta', { name: 'description', content: d }]),
      s(ds(r.head, hi(o))))
  })
}
function Je([e, n, t]) {
  const a = document.createElement(e)
  for (const s in n) a.setAttribute(s, n[s])
  return (
    t && (a.innerHTML = t),
    e === 'script' && n.async == null && (a.async = !1),
    a
  )
}
function ki(e) {
  return e[0] === 'meta' && e[1] && e[1].name === 'description'
}
function hi(e) {
  return e.filter(n => !ki(n))
}
const Qe = new Set(),
  _s = () => document.createElement('link'),
  yi = e => {
    const n = _s()
    ;((n.rel = 'prefetch'), (n.href = e), document.head.appendChild(n))
  },
  $i = e => {
    const n = new XMLHttpRequest()
    ;(n.open('GET', e, (n.withCredentials = !0)), n.send())
  }
let _e
const xi =
  O &&
  (_e = _s()) &&
  _e.relList &&
  _e.relList.supports &&
  _e.relList.supports('prefetch')
    ? yi
    : $i
function wi() {
  if (!O || !window.IntersectionObserver) return
  let e
  if ((e = navigator.connection) && (e.saveData || /2g/.test(e.effectiveType)))
    return
  const n = window.requestIdleCallback || setTimeout
  let t = null
  const a = () => {
    ;(t && t.disconnect(),
      (t = new IntersectionObserver(i => {
        i.forEach(r => {
          if (r.isIntersecting) {
            const l = r.target
            t.unobserve(l)
            const { pathname: o } = l
            if (!Qe.has(o)) {
              Qe.add(o)
              const c = ms(o)
              c && xi(c)
            }
          }
        })
      })),
      n(() => {
        document.querySelectorAll('#app a').forEach(i => {
          const { hostname: r, pathname: l } = new URL(
              i.href instanceof SVGAnimatedString ? i.href.animVal : i.href,
              i.baseURI,
            ),
            o = l.match(/\.\w+$/)
          ;(o && o[0] !== '.html') ||
            (i.target !== '_blank' &&
              r === location.hostname &&
              (l !== location.pathname ? t.observe(i) : Qe.add(l)))
        })
      }))
  }
  Z(a)
  const s = be()
  ;(X(() => s.path, a),
    pe(() => {
      t && t.disconnect()
    }))
}
function Es(e) {
  if (e.extends) {
    const n = Es(e.extends)
    return {
      ...n,
      ...e,
      async enhanceApp(t) {
        ;(n.enhanceApp && (await n.enhanceApp(t)),
          e.enhanceApp && (await e.enhanceApp(t)))
      },
    }
  }
  return e
}
const he = Es(fi),
  Si = P({
    name: 'VitePressApp',
    setup() {
      const { site: e, lang: n, dir: t } = ft()
      return (
        Z(() => {
          ve(() => {
            ;((document.documentElement.lang = n.value),
              (document.documentElement.dir = t.value))
          })
        }),
        e.value.router.prefetchLinks && wi(),
        pi(),
        vi(),
        he.setup && he.setup(),
        () => Re(he.Layout)
      )
    },
  })
async function Is() {
  globalThis.__VITEPRESS__ = !0
  const e = Vi(),
    n = Pi()
  n.provide(ps, e)
  const t = Ho(e.route)
  return (
    n.provide(fs, t),
    n.component('Content', Wo),
    n.component('ClientOnly', mi),
    Object.defineProperties(n.config.globalProperties, {
      $frontmatter: {
        get() {
          return t.frontmatter.value
        },
      },
      $params: {
        get() {
          return t.page.value.params
        },
      },
    }),
    he.enhanceApp && (await he.enhanceApp({ app: n, router: e, siteData: ce })),
    { app: n, router: e, data: t }
  )
}
function Pi() {
  return Us(Si)
}
function Vi() {
  let e = O
  return Fo(n => {
    let t = ms(n),
      a = null
    return (
      t && (e && (t = t.replace(/\.js$/, '.lean.js')), (a = import(t))),
      O && (e = !1),
      a
    )
  }, he.NotFound)
}
O &&
  Is().then(({ app: e, router: n, data: t }) => {
    n.go().then(() => {
      ;(bi(n.route, t.site), e.mount('#app'))
    })
  })
async function Ni(e) {
  const { app: n, router: t } = await Is()
  await t.go(e)
  const a = { content: '', vpSocialIcons: new Set() }
  return ((a.content = await Rs(n, a)), a)
}
export { be as a, E as b, Ni as render, Oo as u }
//# sourceMappingURL=app.js.map
