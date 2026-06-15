// https://vitepress.dev/guide/custom-theme
import { h, nextTick, onMounted, watch } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
// 引入 Fancybox 核心逻辑和样式
// import { Fancybox } from '@fancyapps/ui'
// import '@fancyapps/ui/dist/fancybox/fancybox.css'
// 引入 Viewer.js 和样式
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import './style.css'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import XElement from 'xb-element'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    app.use(XElement)
    if (typeof window !== 'undefined') {
      // 这样 Vite 会把它单独打包成一个异步 chunk，绝不阻塞首屏渲染 (FCP)
      import('xb-element/dist/x-element.css')
    }
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
  //Fancybox:图片放大库
  /* setup() {
          const route = useRoute()

          const initFancybox = () => {
              // 绑定所有的 Markdown 图片
              Fancybox.bind('.vp-doc img', {
                  // 开启滚轮缩放功能 (默认其实也是开启的)
                  wheel: 'zoom',
                  // 隐藏不需要的 UI 按钮 (保持 VitePress 的极简风格)
                  Toolbar: {
                      display: {
                          left: [],
                          middle: ['zoomIn', 'zoomOut', 'toggle1to1'],
                          right: ['close'],
                      },
                  },
                  // 移除多余的图片底部提示信息
                  Caption: false,
              })
          }

          onMounted(() => {
              initFancybox()
          })

          // 监听路由变化，切换页面后重新绑定
          watch(
              () => route.path,
              () => nextTick(() => initFancybox())
          )
      },*/
  setup() {
    const route = useRoute()
    let viewer: Viewer | null = null

    const initViewer = () => {
      // 销毁旧实例，防止内存泄漏
      if (viewer) {
        viewer.destroy()
      }

      // 获取当前页面的文章内容容器
      const docContainer = document.querySelector('.vp-doc')
      if (docContainer) {
        // Viewer.js 会自动寻找容器内的所有 img 标签并绑定事件
        viewer = new Viewer(docContainer as HTMLElement, {
          inline: false, // 模态框模式
          button: true, // 显示右上角关闭按钮
          navbar: false, // 隐藏底部的图库缩略图导航 (如果你只需单图放大)
          title: false, // 隐藏图片标题
          toolbar: true, // 显示底部工具栏 (包含放大/缩小/旋转等)
          tooltip: true, // 缩放时显示百分比提示
          movable: true, // 允许拖拽平移
          zoomable: true, // 允许滚轮缩放
        })
      }
    }

    onMounted(() => {
      initViewer()
    })

    watch(
      () => route.path,
      () => nextTick(() => initViewer()),
    )
  },
} satisfies Theme
