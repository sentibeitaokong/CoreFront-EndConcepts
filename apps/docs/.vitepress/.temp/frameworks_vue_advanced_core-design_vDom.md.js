import { ssrRenderAttrs as h, ssrRenderStyle as s } from 'vue/server-renderer'
import { useSSRContext as d } from 'vue'
import { _ as r } from './plugin-vue_export-helper.CTtO9zSR.js'
;(function () {
  try {
    var i =
      typeof window < 'u'
        ? window
        : typeof global < 'u'
          ? global
          : typeof globalThis < 'u'
            ? globalThis
            : typeof self < 'u'
              ? self
              : {}
    i.SENTRY_RELEASE = { id: '63d551497be1158ac55eeefaf1dec4a9182e3c76' }
    var a = new i.Error().stack
    a &&
      ((i._sentryDebugIds = i._sentryDebugIds || {}),
      (i._sentryDebugIds[a] = 'bebb37b0-d00c-4926-8a82-94d4a4bbcd44'),
      (i._sentryDebugIdIdentifier =
        'sentry-dbid-bebb37b0-d00c-4926-8a82-94d4a4bbcd44'))
  } catch {}
})()
const D = JSON.parse(
    '{"title":"虚拟 DOM","description":"","frontmatter":{},"headers":[],"relativePath":"frameworks/vue/advanced/core-design/vDom.md","filePath":"frameworks/vue/advanced/core-design/vDom.md","lastUpdated":1782271806000}',
  ),
  e = { name: 'frameworks/vue/advanced/core-design/vDom.md' }
function p(i, a, t, l, k, o, E, g) {
  a(`<div${h(l)}><h1 id="虚拟-dom" tabindex="-1">虚拟 DOM <a class="header-anchor" href="#虚拟-dom" aria-label="Permalink to &quot;虚拟 DOM&quot;">​</a></h1><p>虚拟 DOM（Virtual DOM，VDOM）是 Vue 核心架构的重要组成部分。尽管 Vue 3 在编译时进行了大量优化（静态提升、Block 树、PatchFlags 等），但它依然保留了虚拟 DOM。</p><h2 id="_1-什么是虚拟-dom" tabindex="-1">1. 什么是虚拟 DOM？ <a class="header-anchor" href="#_1-什么是虚拟-dom" aria-label="Permalink to &quot;1. 什么是虚拟 DOM？&quot;">​</a></h2><p>虚拟 DOM 是用 JavaScript 对象（VNode）来描述真实 DOM 结构的一种编程概念。它通常包含节点类型、属性、子节点等信息。Vue 的渲染流程如下：</p><ol><li>组件执行 <code>render</code> 函数，生成新的虚拟 DOM 树。</li><li>将新树与上一次渲染的旧树进行 <strong>diff</strong>，计算出最小化的变更。</li><li>将这些变更批量应用到真实 DOM 上。</li></ol><p><strong>示例：</strong></p><div class="language-html vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">html</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">&lt;!--html--&gt;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&lt;</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">ul</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> id</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">=</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&quot;list&quot;</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> class</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">=</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&quot;container&quot;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  &lt;</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">li</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;苹果&lt;/</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">li</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  &lt;</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">li</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;香蕉&lt;/</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">li</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&lt;/</span><span style="${s({ '--shiki-light': '#22863A', '--shiki-dark': '#85E89D' })}">ul</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">&gt;</span></span></code></pre></div><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">// 对应虚拟dom</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">{</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">  tag</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">: </span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;ul&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">,</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">  props</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">: {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">    id</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">: </span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;list&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">,</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">    class</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">: </span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;container&#39;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  },</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">  children</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">: [</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">    {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      tag: </span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;li&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">,</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      props: {},</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      children: [</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;苹果&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">]</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">    },</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">    {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      tag: </span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;li&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">,</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      props: {},</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">      children: [</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;香蕉&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">]</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">    }</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  ]</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">}</span></span></code></pre></div><h2 id="_2-vue-3-为什么需要虚拟-dom" tabindex="-1">2. Vue 3 为什么需要虚拟 DOM？ <a class="header-anchor" href="#_2-vue-3-为什么需要虚拟-dom" aria-label="Permalink to &quot;2. Vue 3 为什么需要虚拟 DOM？&quot;">​</a></h2><h3 id="_2-1-声明式-ui-的必然要求" tabindex="-1">2.1 声明式 UI 的必然要求 <a class="header-anchor" href="#_2-1-声明式-ui-的必然要求" aria-label="Permalink to &quot;2.1 声明式 UI 的必然要求&quot;">​</a></h3><p>Vue 本质是<strong>声明式框架</strong>：开发者描述“状态与 UI 的映射关系”，而不是命令式地“创建元素、设置属性、更新文本”。虚拟 DOM 是实现声明式渲染的通用模型：</p><ul><li>开发者只需编写 <code>render</code> 函数或模板，返回 VNode。</li><li>框架负责将 VNode 转换为真实 DOM，并在状态变化时重新生成 VNode 并对比更新。</li></ul><p>如果没有虚拟 DOM，框架就需要在每次更新时精确知道如何修改真实 DOM——这等价于要求开发者编写命令式代码，违背了 Vue 的设计哲学。</p><h3 id="_2-2-跨平台能力" tabindex="-1">2.2 跨平台能力 <a class="header-anchor" href="#_2-2-跨平台能力" aria-label="Permalink to &quot;2.2 跨平台能力&quot;">​</a></h3><p>虚拟 DOM 将“对 DOM 的操作”抽象为“对 VNode 的操作”，使得 Vue 可以轻松实现跨平台渲染：</p><ul><li><strong>Web 平台</strong>：使用 <code>@vue/runtime-dom</code>，将 VNode 渲染为浏览器 DOM。</li><li><strong>移动端</strong>：通过 <code>@vue/runtime-native</code> 或 Weex，渲染为原生 UI 组件。</li><li><strong>Canvas / WebGL</strong>：可自定义渲染器，将 VNode 绘制到画布上。</li><li><strong>服务端渲染 (SSR)</strong>：在 Node.js 中生成 VNode 并序列化为 HTML 字符串。</li></ul><p>如果没有虚拟 DOM 这一中间层，每个平台都需要重写整个渲染逻辑，成本极高。</p><h3 id="_2-3-保证性能下限-简化开发" tabindex="-1">2.3 保证性能下限，简化开发 <a class="header-anchor" href="#_2-3-保证性能下限-简化开发" aria-label="Permalink to &quot;2.3 保证性能下限，简化开发&quot;">​</a></h3><p>直接操作 DOM 虽然理论上性能最优，但要求开发者具备极高的优化能力。大部分开发者很难写出比虚拟 DOM diff 更高效的 DOM 更新代码。虚拟 DOM 提供了一致的、可预测的性能表现：</p><ul><li>在大多数场景下，虚拟 DOM diff 的开销远小于手动操作 DOM 的复杂逻辑。</li><li>对于频繁更新的场景，虚拟 DOM 可以批量应用变更，避免布局抖动（layout thrashing）。</li></ul><h3 id="_2-4-与响应式系统的自然协作" tabindex="-1">2.4 与响应式系统的自然协作 <a class="header-anchor" href="#_2-4-与响应式系统的自然协作" aria-label="Permalink to &quot;2.4 与响应式系统的自然协作&quot;">​</a></h3><p>Vue 的响应式系统负责追踪状态变化，并在变化时触发更新。虚拟 DOM 作为“更新执行者”，完美匹配响应式模型：</p><ul><li>状态变化 → 触发组件渲染 effect → 重新执行 <code>render</code> 生成新 VNode → diff + patch。</li><li>开发者无需关心更新粒度，Vue 自动完成最小化更新。</li></ul><h2 id="_3-vue-3-对虚拟-dom-的编译时优化" tabindex="-1">3. Vue 3 对虚拟 DOM 的编译时优化 <a class="header-anchor" href="#_3-vue-3-对虚拟-dom-的编译时优化" aria-label="Permalink to &quot;3. Vue 3 对虚拟 DOM 的编译时优化&quot;">​</a></h2><p>虽然保留虚拟 DOM，但 Vue 3 通过编译时优化大幅减少了运行时 diff 的工作量，解决了传统虚拟 DOM 性能较差的痛点。</p><table tabindex="0"><thead><tr><th>优化技术</th><th>作用</th></tr></thead><tbody><tr><td><strong>静态提升</strong></td><td>将不变的 VNode 提升到渲染函数外部，多次渲染复用同一对象，避免重复创建。</td></tr><tr><td><strong>PatchFlags</strong></td><td>为动态节点标记更新类型（如 TEXT、CLASS、STYLE），diff 时只检查标志位，无需深度比较属性。</td></tr><tr><td><strong>Block 树</strong></td><td>收集动态子节点到数组，更新时直接遍历该数组进行靶向更新，跳过静态子树。</td></tr><tr><td><strong>缓存内联函数</strong></td><td>缓存事件处理函数，避免子组件因 props 变化而重渲染。</td></tr></tbody></table><h2 id="_4-为什么不彻底放弃虚拟-dom-像-svelte-那样" tabindex="-1">4. 为什么不彻底放弃虚拟 DOM（像 Svelte 那样）？ <a class="header-anchor" href="#_4-为什么不彻底放弃虚拟-dom-像-svelte-那样" aria-label="Permalink to &quot;4. 为什么不彻底放弃虚拟 DOM（像 Svelte 那样）？&quot;">​</a></h2><p>Svelte 采用纯编译时策略，将模板编译为直接操作 DOM 的命令式代码，运行时不需要虚拟 DOM。这种策略性能极佳，运行时体积小，但牺牲了一定的灵活性：</p><ul><li><strong>动态组件</strong>：递归组件、动态切换组件等需要运行时支持，实现复杂。</li><li><strong>跨平台</strong>：每个平台需要编写独立的编译器后端，无法共享渲染逻辑。</li><li><strong>开发体验</strong>：一些高级特性（如 JSX、运行时模板编译）难以支持。</li></ul><p>Vue 选择保留虚拟 DOM，是在<strong>性能、灵活性、跨平台能力、开发体验</strong>之间取得的平衡。对于绝大多数应用，虚拟 DOM 的性能已经足够优秀，而灵活性带来的价值更高。</p><h2 id="_5-虚拟-dom-的实际性能表现" tabindex="-1">5. 虚拟 DOM 的实际性能表现 <a class="header-anchor" href="#_5-虚拟-dom-的实际性能表现" aria-label="Permalink to &quot;5. 虚拟 DOM 的实际性能表现&quot;">​</a></h2><p>根据多项基准测试（如 js-framework-benchmark），Vue 3 的虚拟 DOM 实现表现优异：</p><ul><li>在大量静态内容 + 少量动态绑定的场景（如博客文章页），静态提升使得虚拟 DOM 几乎零开销。</li><li>在频繁更新的交互组件中，Block 树 + PatchFlags 使得 diff 成本与动态节点数量成正比，而非整棵树的大小。</li><li>相比 Vue 2，Vue 3 的更新性能提升约 1.3～2 倍，内存占用更低。</li></ul><h2 id="_6-总结" tabindex="-1">6. 总结 <a class="header-anchor" href="#_6-总结" aria-label="Permalink to &quot;6. 总结&quot;">​</a></h2><table tabindex="0"><thead><tr><th>原因</th><th>说明</th></tr></thead><tbody><tr><td><strong>声明式 UI 模型</strong></td><td>虚拟 DOM 是实现声明式渲染的自然抽象，开发者无需关心具体更新步骤。</td></tr><tr><td><strong>跨平台渲染</strong></td><td>通过不同的渲染器，同一套虚拟 DOM 可以输出到 Web、Native、Canvas 等。</td></tr><tr><td><strong>性能下限保障</strong></td><td>虚拟 DOM diff 提供了可预测的性能表现，避免开发者误用导致性能问题。</td></tr><tr><td><strong>与响应式系统协作</strong></td><td>响应式系统触发更新，虚拟 DOM 执行更新，职责分离清晰。</td></tr><tr><td><strong>编译时优化加持</strong></td><td>Vue 3 的静态提升、Block 树等优化解决了传统虚拟 DOM 的性能瓶颈。</td></tr><tr><td><strong>灵活性与开发体验</strong></td><td>支持 JSX、运行时模板编译、动态组件等高级特性，保持框架的渐进式特性。</td></tr></tbody></table></div>`)
}
const n = e.setup
e.setup = (i, a) => {
  const t = d()
  return (
    (t.modules || (t.modules = new Set())).add(
      'frameworks/vue/advanced/core-design/vDom.md',
    ),
    n ? n(i, a) : void 0
  )
}
const b = r(e, [['ssrRender', p]])
export { D as __pageData, b as default }
//# sourceMappingURL=frameworks_vue_advanced_core-design_vDom.md.js.map
