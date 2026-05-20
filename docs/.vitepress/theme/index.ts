// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import mediumZoom from 'medium-zoom'
import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import './style.css'
import Layout from './Layout.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import XElement from 'xb-element/dist/es/x-element'
import 'xb-element/dist/x-element.css'
import './custom.css'

library.add(fas)

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app, router, siteData }) {
    app.use(XElement)
    // 👇 注册一个自定义的高阶组件代替直接注册 ElementPlusContainer
    app.component('demo-preview', {
      // 1. 显式声明接收这三个“罪魁祸首”属性，这样它们就不会变成非 prop 属性往下透传了
      props: ['suffixName', 'absolutePath', 'relativePath'],

      // 2. 渲染真正的容器组件，并把剩余的有效属性(attrs)和插槽(slots)传给它
      setup(props, { attrs, slots }) {
        return () => h(ElementPlusContainer, attrs, slots)
      },
    })
  },
  setup() {
    const route = useRoute()

    const initZoom = () => {
      // 为所有 markdown 内容中的图片添加缩放功能
      // .vp-doc 是 VitePress 默认包裹 markdown 内容的 class
      mediumZoom('.vp-doc img', {
        // 1. 遮罩层背景色 (支持 rgba 半透明或 VitePress 的 CSS 变量)
        background: 'var(--vp-c-bg)',

        // 2. 放大后图片与屏幕边缘的间距 (默认是 0，加上边距会更美观)
        margin: 0,

        // 3. 滚动多少像素后自动关闭放大效果 (默认是 40)
        scrollOffset: 40,
      })
    }

    onMounted(() => {
      initZoom()
    })

    // 监听路由变化，确保切换页面后新渲染的图片也能被放大
    watch(
      () => route.path,
      () => nextTick(() => initZoom()),
    )
  },
} satisfies Theme
