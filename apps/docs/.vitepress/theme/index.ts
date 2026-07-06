// https://vitepress.dev/guide/custom-theme
import { h, nextTick, onMounted, watch, defineComponent } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
// 引入 Fancybox 核心逻辑和样式
// import { Fancybox } from '@fancyapps/ui'
// import '@fancyapps/ui/dist/fancybox/fancybox.css'
import type Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import './style.css'
import { ElementPlusContainer } from '@vitepress-demo-preview/component'
import '@vitepress-demo-preview/component/dist/style.css'
import XElement from 'xb-element'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.use(XElement)
    if (typeof window !== 'undefined') {
      // 这样 Vite 会把它单独打包成一个异步 chunk，绝不阻塞首屏渲染 (FCP)
      import('xb-element/dist/x-element.css')
      if (import.meta.env.PROD) {
        const initSentry = () => {
          void import('@sentry/vue').then(Sentry => {
            Sentry.init({
              app,
              dsn: 'https://b288271c3fd985d21205cbd7e36e3a43@o4511569356718080.ingest.us.sentry.io/4511569367269376',
              integrations: [Sentry.browserTracingIntegration()],
              tracesSampleRate: 0.02,
              replaysSessionSampleRate: 0,
              replaysOnErrorSampleRate: 0,
            })
          })
        }

        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(initSentry, { timeout: 3000 })
        } else {
          window.setTimeout(initSentry, 3000)
        }
      } else {
        console.info('Sentry disabled in development')
      }
    }
    // 👇 注册一个自定义的高阶组件代替直接注册 ElementPlusContainer
    app.component(
      'demo-preview',
      defineComponent({
        name: 'DemoPreview',
        // 1. 改为对象声明，让 TS 能够精确推导 props 类型
        props: {
          suffixName: { type: String, default: '' },
          absolutePath: { type: String, default: '' },
          relativePath: { type: String, default: '' },
        },

        // 2. 此时 props 已经被完美推导，不再是 any
        setup(props, { attrs, slots }) {
          return () => {
            // 3. 使用 as any 断言 attrs，绕过 h 函数极其严格的泛型校验
            // 因为 attrs 本身就是透传属性，我们在运行时保证它的安全即可
            return h(ElementPlusContainer, attrs as any, slots)
          }
        },
      }),
    )
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
    let ViewerConstructor: typeof Viewer | null = null

    const initViewer = async () => {
      // 销毁旧实例，防止内存泄漏
      if (viewer) {
        viewer.destroy()
        viewer = null
      }

      // 获取当前页面的文章内容容器
      const docContainer = document.querySelector('.vp-doc')
      if (docContainer) {
        ViewerConstructor ??= (await import('viewerjs')).default
        // Viewer.js 会自动寻找容器内的所有 img 标签并绑定事件
        viewer = new ViewerConstructor(docContainer as HTMLElement, {
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
      const lazyInitViewer = () => {
        void initViewer()
      }

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(lazyInitViewer, { timeout: 2000 })
      } else {
        window.setTimeout(lazyInitViewer, 1000)
      }
    })

    watch(
      () => route.path,
      () => nextTick(() => void initViewer()),
    )
  },
} satisfies Theme
