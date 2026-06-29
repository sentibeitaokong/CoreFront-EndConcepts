import { ssrRenderAttrs as t, ssrRenderStyle as s } from 'vue/server-renderer'
import { useSSRContext as e } from 'vue'
import { _ as k } from './plugin-vue_export-helper.CTtO9zSR.js'
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
      (i._sentryDebugIds[a] = 'deaa4351-4bf6-4760-88c2-bfb41a985f35'),
      (i._sentryDebugIdIdentifier =
        'sentry-dbid-deaa4351-4bf6-4760-88c2-bfb41a985f35'))
  } catch {}
})()
const $ = JSON.parse(
    '{"title":"","description":"","frontmatter":{},"headers":[],"relativePath":"js/hand-writing/inherit.md","filePath":"js/hand-writing/inherit.md","lastUpdated":1782271806000}',
  ),
  l = { name: 'js/hand-writing/inherit.md' }
function r(i, a, n, h, d, g, c, y) {
  a(`<div${t(h)}><h3 id="nativejs-inherit-js" tabindex="-1">NativeJs/inherit.js <a class="header-anchor" href="#nativejs-inherit-js" aria-label="Permalink to &quot;NativeJs/inherit.js&quot;">​</a></h3><div class="language-js vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">js</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//原型链继承   缺陷：引用类型的属性被所有实例共享  创建子实例无法向父实例传参</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*function Parent(){</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    this.name=&#39;kevin&#39;</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    this.age=[18,20]</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Parent.prototype.getName=function () {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    console.log(this.name,this.age)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">function Child(){</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Child.prototype=new Parent()*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*var child1=new Child()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">child1.age.push(19)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">child1.getName()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">var child2=new Child()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">child2.getName()*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//构造函数继承   缺陷：每次创建实例都会创建一次实例方法</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">function</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> Parent</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#E36209', '--shiki-dark': '#FFAB70' })}">age</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">  this</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">.name </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> age</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">  this</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">.age </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> [</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">18</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">, </span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">20</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">]</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">function</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> Child</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#E36209', '--shiki-dark': '#FFAB70' })}">name</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  Parent.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">call</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">this</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">, name)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">Child</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">.</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">prototype</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">.value </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}"> 1</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">var</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> child </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}"> new</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> Child</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;kevin&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">)</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">child.age.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">push</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#005CC5', '--shiki-dark': '#79B8FF' })}">19</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">var</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> child2 </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}"> new</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> Child</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;kevin&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">console.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">log</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(child.age, child2.age, child.value, child2.value)</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//组合继承    缺陷：会调用两次构造函数</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*function Parent(name) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    this.name=name</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Parent.prototype.getName=function () {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    console.log(this.name)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">function Child(name) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    Parent.call(this,name)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Child.prototype=new Parent()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Child.prototype.constructor=Child*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//原型式继承  缺陷：引用类型的属性被所有实例共享</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*function createObj(o) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    function fNOP() {</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    }</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    fNOP.prototype=o</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    return new fNOP()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//寄生式继承   缺陷：每次创建实例的时候都会创建一次继承</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">function</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}"> createObj</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#E36209', '--shiki-dark': '#FFAB70' })}">o</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">  var</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> clone </span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">=</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> Object.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">create</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(o)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  clone.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">getName</span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}"> =</span><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}"> function</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> () {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">    console.</span><span style="${s({ '--shiki-light': '#6F42C1', '--shiki-dark': '#B392F0' })}">log</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">(</span><span style="${s({ '--shiki-light': '#032F62', '--shiki-dark': '#9ECBFF' })}">&#39;hi&#39;</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">  }</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#D73A49', '--shiki-dark': '#F97583' })}">  return</span><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}"> clone</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#24292E', '--shiki-dark': '#E1E4E8' })}">}</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//寄生组合继承</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*function Parent(name){</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    this.name=name</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Parent.prototype.getName=function () {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    console.log(this.name)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">function Child(name){</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    Parent.call(this,name)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">var F=function () {</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">F.prototype=Parent.prototype</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Child.prototype=new F()</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">Child.prototype.constructor=Child*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*var child=new Child(&#39;kevin&#39;)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">child.getName()*/</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">//class继承</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">/*class Parent{</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    constructor(height) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">        this.height=height</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    }</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    getHeight(){</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">        console.log(this.height)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    }</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">class Child extends Parent{</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    constructor(name) {</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">        super(name);</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">    }</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">}</span></span>
<span class="line"></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">var child= new Child(&#39;18&#39;)</span></span>
<span class="line"><span style="${s({ '--shiki-light': '#6A737D', '--shiki-dark': '#6A737D' })}">child.getHeight()*/</span></span></code></pre></div></div>`)
}
const p = l.setup
l.setup = (i, a) => {
  const n = e()
  return (
    (n.modules || (n.modules = new Set())).add('js/hand-writing/inherit.md'),
    p ? p(i, a) : void 0
  )
}
const o = k(l, [['ssrRender', r]])
export { $ as __pageData, o as default }
//# sourceMappingURL=js_hand-writing_inherit.md.js.map
