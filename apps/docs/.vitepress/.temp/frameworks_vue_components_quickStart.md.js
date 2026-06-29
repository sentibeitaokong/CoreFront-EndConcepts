import { ssrRenderAttrs as l, ssrRenderStyle as s } from 'vue/server-renderer'
import { useSSRContext as h } from 'vue'
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
      (i._sentryDebugIds[a] = 'bf725ba9-7a2f-418a-9182-fa74d0600f0f'),
      (i._sentryDebugIdIdentifier =
        'sentry-dbid-bf725ba9-7a2f-418a-9182-fa74d0600f0f'))
  } catch {}
})()
const y = JSON.parse(
    '{"title":"安装","description":"","frontmatter":{},"headers":[],"relativePath":"frameworks/vue/components/quickStart.md","filePath":"frameworks/vue/components/quickStart.md","lastUpdated":1782271806000}',
  ),
  t = { name: 'frameworks/vue/components/quickStart.md' }
function d(i, a, e, p, k, o, c, g) {
  a(`<div${l(p)}><h1 id="安装" tabindex="-1">安装 <a class="header-anchor" href="#安装" aria-label="Permalink to &quot;安装&quot;">​</a></h1><p>本节将介绍如何在项目中使用 <code>xb-element</code>。</p><h2 id="使用包管理器" tabindex="-1">使用包管理器 <a class="header-anchor" href="#使用包管理器" aria-label="Permalink to &quot;使用包管理器&quot;">​</a></h2><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-UGbHl" id="tab-NuEkM80" checked><label data-title="npm" for="tab-NuEkM80">npm</label></div><div class="blocks"><div class="language-shell vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">$</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">  npm</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> install</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> xb-element</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}"> --save</span></span></code></pre></div></div></div><p>如果你的网络环境不佳，推荐使用 <a href="https://github.com/cnpm/cnpm" target="_blank" rel="noreferrer">cnpm</a> 或使用 <a href="https://npmmirror.com/" target="_blank" rel="noreferrer">npmmirror</a></p><div class="language-shell vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">shell</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">npm</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> config</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> set</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> registry</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> https://registry.npmmirror.com</span></span></code></pre></div><h2 id="用法" tabindex="-1">用法 <a class="header-anchor" href="#用法" aria-label="Permalink to &quot;用法&quot;">​</a></h2><p>如果你对打包后的文件大小不是很在乎，那么使用完整导入会更方便。</p><div class="vp-code-group vp-adaptive-theme"><div class="tabs"><input type="radio" name="group-MNIw0" id="tab-cf7lMmm" checked><label data-title="main.ts" for="tab-cf7lMmm">main.ts</label></div><div class="blocks"><div class="language-ts vp-adaptive-theme active"><button title="Copy Code" class="copy"></button><span class="lang">ts</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">import</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> { createApp } </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">from</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> &#39;vue&#39;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">import</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> XBElement </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">from</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> &#39;xb-element&#39;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">import</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> &#39;xb-element/dist/x-element.css&#39;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">import</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> App </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">from</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}"> &#39;./App.vue&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">const</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}"> app</span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}"> =</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> createApp</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(App)</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">app.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">use</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(XBElement)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">app.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">mount</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;#app&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">)</span></span></code></pre></div></div></div></div>`)
}
const n = t.setup
t.setup = (i, a) => {
  const e = h()
  return (
    (e.modules || (e.modules = new Set())).add(
      'frameworks/vue/components/quickStart.md',
    ),
    n ? n(i, a) : void 0
  )
}
const E = r(t, [['ssrRender', d]])
export { y as __pageData, E as default }
//# sourceMappingURL=frameworks_vue_components_quickStart.md.js.map
