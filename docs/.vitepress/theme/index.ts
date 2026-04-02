// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'
import '../../../src/styles/index.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import './custom.css'
library.add(fas)

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    })
  },
  enhanceApp({ app, router, siteData }) {
      // 👇 注册一个自定义的高阶组件代替直接注册 ElementPlusContainer
      app.component('demo-preview', {
          // 1. 显式声明接收这三个“罪魁祸首”属性，这样它们就不会变成非 prop 属性往下透传了
          props: ['suffixName', 'absolutePath', 'relativePath'],

          // 2. 渲染真正的容器组件，并把剩余的有效属性(attrs)和插槽(slots)传给它
          setup(props, { attrs, slots }) {
              return () => h(ElementPlusContainer, attrs, slots)
          }
      })
  }
} satisfies Theme
