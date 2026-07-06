import type {DefaultTheme, UserConfigFn} from 'vitepress'
import {componentPreview, containerPreview} from '@vitepress-demo-preview/plugin'
import lightbox from "vitepress-plugin-lightbox";
import {withMermaid} from 'vitepress-plugin-mermaid'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import {fileURLToPath, URL} from 'node:url'
import {loadEnv} from 'vite'
import {sentryVitePlugin} from "@sentry/vite-plugin"
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'
//监控打包体积
import {visualizer} from 'rollup-plugin-visualizer';

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTruthyFlag = (value: string | undefined) => {
    return value === 'true' || value === '1'
}

// https://vitepress.dev/reference/site-config
const config: UserConfigFn<DefaultTheme.Config> = ({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')
    // 兼容本地读取 env 文件和 CI/CD 读取系统变量
    const sentryToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN
    const isProduction = mode === 'production'
    const enableAnalyze = isTruthyFlag(env.BUNDLE_ANALYZE)
    const enableSentryUpload =
        (env.SENTRY_UPLOAD === 'true' || process.env.SENTRY_UPLOAD === 'true') && Boolean(sentryToken)

    return withMermaid({
        lang: 'zh-CN',
        sitemap: {
            hostname: 'https://sentibeitaokong.github.io'
        },
        vite: {
            plugins: [
                //图片压缩
                /*ViteImageOptimizer({
                     // 核心防坑 1：必须开启 includePublic！
                     // 因为你的图片采用的是 ![logo](/logo.png) 的绝对路径写法，它们存放在 docs/public 目录下。
                     // 默认情况下 Vite 会忽略该目录，开启此项会在最后一刻拦截并压缩 public 里的资产。
                     includePublic: true,

                     // 核心防坑 2：开启日志显示
                     // 配合重定向命令（如 pnpm run docs:build > log.txt）可以查看被吞掉的压缩体积
                     logStats: enableAnalyze,

                     // 3. 针对不同图片格式的有损/无损压缩精细微调
                     png: {
                         quality: 80, // PNG 默认是无损的，设置 quality 会触发有损色板量化，体积能瞬间暴减 70%
                     },
                     jpeg: {
                         quality: 80, // 80 质量是肉眼无损与体积的最佳平衡点
                     },
                     jpg: {
                         quality: 80,
                     },
                     webp: {
                         lossless: false, // 明确关闭完全无损模式，采用高效的有损算法
                         quality: 80,
                     },
                     // SVG 矢量图防破损配置
                     svg: {
                         multipass: false,
                         plugins: [
                             'preset-default',
                             {
                                 name: 'removeViewBox' as const,
                                 active: false
                             }
                         ],
                     },
                 }) as any,*/
                // 建议放到插件数组的最后
                ...(enableAnalyze
                    ? [
                        visualizer({
                            filename: 'stats.html', // 默认生成在项目根目录
                            open: false, // 打包完成后自动在浏览器打开报告
                            gzipSize: true, // 企业级配置：显示 gzip 压缩后的真实体积（更具参考价值）
                            brotliSize: true // 显示 br 压缩后的体积
                        }),
                    ]
                    : []),
                ...(isProduction && enableSentryUpload
                    ? [
                        sentryVitePlugin({
                            org: "xubei",
                            project: "xunbei-project",
                            // 从加载好的 env 对象中读取 Token
                            authToken: sentryToken,
                            // 关闭 Sentry 插件自身的遥测日志
                            telemetry: false,
                            sourcemaps: {
                                filesToDeleteAfterUpload: path.resolve(__dirname, 'dist/**/*.map'),
                            },
                        }),
                    ]
                    : []),
            ],
            build: {
                minify: 'esbuild',
                sourcemap: enableSentryUpload,
                chunkSizeWarningLimit: 1000,
                rollupOptions: {}
            },
            ssr: {
                external: [
                    '@fortawesome/fontawesome-svg-core',
                    '@fortawesome/vue-fontawesome',
                    '@fortawesome/free-solid-svg-icons',
                ],
                // 🌟 强行让 Vite 处理 xb-element，利用 Vite 的后缀补全机制绕过 Node.js 的死板规则！
                noExternal: ['xb-element']
            },
            optimizeDeps: {
                include: [
                    'lodash-es',
                    'viewerjs',
                    'dayjs',
                    'mermaid',
                    'xb-element' // 建议把自研库也加进来预构建
                ],
                // 防止 Vite 去预构建庞大的 SVG 图标树
                exclude: [
                    '@fortawesome/fontawesome-svg-core',
                    '@fortawesome/free-solid-svg-icons',
                    '@fortawesome/vue-fontawesome'
                ]
            },
            resolve: {
                alias: {
                    '@': fileURLToPath(new URL('../../src', import.meta.url)),
                    // 当代码中尝试引入这个被禁止的路径时
                    // 直接强行将其映射到真实的物理文件路径上
                    // 注意：这里的相对路径('../../node_modules/...')需要根据你的项目结构调整
                    // 确保它能正确指向你的 node_modules 目录
                    'xb-element/dist/es/x-element': path.resolve(__dirname, '../../../packages/xbElement/dist/es/x-element.js')
                },
            },
        },
        mermaid: {
            startOnLoad: false,
            securityLevel: 'loose',
        },
        mermaidPlugin: {
            class: 'mermaid',
        },
        base: '/CoreFront-EndConcepts/',
        title: "寻北",
        description: "vitePress",
        head: [
            //性能优化：预连接，预加载
            ['link', {rel: 'preconnect', href: 'https://lq0zts4skc-dsn.algolia.net', crossorigin: ''}],
            ['link', {rel: 'icon', href: '/CoreFront-EndConcepts/img/myAddress.svg'}],
            ['link', {
                rel: 'preload',
                href: '/CoreFront-EndConcepts/img/vitepress.svg',
                as: 'image',
                fetchpriority: 'high'
            }],
            ['meta', {name: 'docsearch:lang', content: 'zh-CN'}],
        ], //要在页面 HTML 的 <head> 标签中呈现的其他元素
        cleanUrls: true,         //生成简洁的url
        // 🚨 2. 必须配置 markdown 字段
        markdown: {
            config(md: any) {
                // 注册插件，让 VitePress 认识 :::preview 和 <preview>
                md.use(containerPreview)
                md.use(componentPreview)
                md.use(lightbox, {});      //图片放大
                md.use(taskLists, {enabled: true})  //任务列表
                md.use(footnote)        //论文索引
            }
        },
        themeConfig: {
            /*   markdown: {
                   // Shiki 主题配置
                   theme: {
                       light: 'material-theme-lighter', // 亮色模式下的主题
                       dark: 'material-theme-palenight' // 暗色模式下的主题
                   }
               },*/
            logo: {
                src: '/img/blog.svg',
                width: 24,   // 明确告诉浏览器宽度
                height: 24,  // 明确告诉浏览器高度
                alt: 'CoreFront-EndConcepts Logo' // 顺手把无障碍 alt 属性补上，Lighthouse 还会给你加分！
            },
            lastUpdated: {
                text: '最后更新于',      //自定义名称
                formatOptions: {
                    dateStyle: 'full',
                    timeStyle: 'medium'
                }
            },    //显示最后更新时间
            editLink: {
                pattern: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts/edit/main/docs/:path',
                text: '为此页提供修改建议'
            },    //显示链接修改这个页面的github地址
            // carbonAds: {
            //     code: 'your-carbon-code',
            //     placement: 'your-carbon-placement'
            // },   //显示广告
            search: {
                provider: 'algolia',
                options: {
                    appId: 'LQ0ZTS4SKC',
                    apiKey: 'a0e5fa8638d3a3bebe5de3cb0fdd01da',
                    indexName: 'CoreFront-EndConcepts',
                    placeholder: '搜索文档',
                    translations: {
                        button: {
                            buttonText: '搜索文档',
                            buttonAriaLabel: '搜索文档'
                        },
                        modal: {
                            searchBox: {
                                resetButtonTitle: '清除查询条件',
                                resetButtonAriaLabel: '清除查询条件',
                                cancelButtonText: '取消',
                                cancelButtonAriaLabel: '取消'
                            },
                            startScreen: {
                                recentSearchesTitle: '搜索历史',
                                noRecentSearchesText: '没有搜索历史',
                                saveRecentSearchButtonTitle: '保存至搜索历史',
                                removeRecentSearchButtonTitle: '从搜索历史中移除',
                                favoriteSearchesTitle: '收藏',
                                removeFavoriteSearchButtonTitle: '从收藏中移除'
                            },
                            errorScreen: {
                                titleText: '无法获取结果',
                                helpText: '你可能需要检查你的网络连接'
                            },
                            footer: {
                                selectText: '选择',
                                navigateText: '切换',
                                closeText: '关闭',
                                searchByText: '搜索提供者'
                            },
                            noResultsScreen: {
                                noResultsText: '无法找到相关结果',
                                suggestedQueryText: '你可以尝试查询',
                                reportMissingResultsText: '你认为该查询应该有结果？',
                                reportMissingResultsLinkText: '点击反馈'
                            },
                        }
                    }
                }
            },//支持使用 Algolia DocSearch 搜索站点文档
            lightModeSwitchTitle: '切换到白天主题',    //用于自定义悬停时显示的浅色模式开关标题。
            darkModeSwitchTitle: '切换到黑夜主题',     //用于自定义悬停时显示的深色模式开关标题。
            langMenuLabel: '切换语言',
            i18nRouting: true,           //i18n
            //目录导航标题和层级
            outline: {
                level: [2, 4],
                label: '页面导航'
            },
            // 修改页面底部导航链接的文本
            docFooter: {
                prev: '上一页：', // 修改“上一篇”按钮的引导文本
                next: '下一页：'  // 修改“下一篇”按钮的引导文本
            },
            nav: [
                {text: '简介', link: '/intro'},
                {
                    text: '切换语言',
                    items: [
                        {
                            // 该部分的标题
                            items: [
                                {
                                    text: '简体中文',
                                    link: '',
                                    activeMatch: `^/`
                                },
                            ],
                        }
                    ]
                },
            ],

            sidebar: [
                {
                    text: '简介',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: '前端知识体系介绍', link: '/intro'},
                    ]
                },
                {
                    text: 'html',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: '基础',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '基础结构', link: '/html/basic/htmlBasicStructure'},
                                {text: '常用标签', link: '/html/basic/commonTags'},
                                {text: 'Dom元素', link: '/html/basic/domAttributes'},
                                {text: 'Dom事件流', link: '/html/basic/domEvents'},
                                {text: '异步脚本加载', link: '/html/basic/asyncScript'},
                                {text: 'ajax请求', link: '/html/basic/ajax'},
                            ]
                        },
                        {
                            text: '进阶',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '语义化标签', link: '/html/advanced/semanticHtml'},
                                {text: '多媒体元素', link: '/html/advanced/multimediaElements'},
                                {text: '增强表单', link: '/html/advanced/enhancedForms'},
                                {text: 'Canvas和Svg', link: '/html/advanced/canvasAndsvg'},
                                {text: '地理位置', link: '/html/advanced/geolocation'},
                                {text: 'Web存储', link: '/html/advanced/webStorage'},
                                {text: 'WebWorkers', link: '/html/advanced/webWorkers'},
                                {text: 'WebSockets', link: '/html/advanced/webSockets'},
                                // {text: 'HTML5新特性', link: '/html/advanced/html5NewFeatures'},
                                {text: 'history路由', link: '/html/advanced/history'},
                                {text: '拖放', link: '/html/advanced/dragAndDrop'},
                                {text: '自定义数据属性', link: '/html/advanced/dataAttributes'},
                            ]
                        },
                    ]
                },
                {
                    text: 'css',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: '基础',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '选择器', link: '/css/basic/selectors'},
                                {text: '继承', link: '/css/basic/inheritance'},
                                {text: '盒模型', link: '/css/basic/boxModel'},
                                {text: '文档流', link: '/css/basic/documentFlow'},
                                {text: '定位', link: '/css/basic/position'},
                                {text: '浮动', link: '/css/basic/float'},
                            ]
                        },
                        {
                            text: '进阶',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: '视觉装饰',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '圆角', link: '/css/advanced/visual-decoration/borderRadius'},
                                        {text: '阴影', link: '/css/advanced/visual-decoration/boxShadow'},
                                        {text: '渐变', link: '/css/advanced/visual-decoration/gradients'},
                                        {
                                            text: '背景增强',
                                            link: '/css/advanced/visual-decoration/backgroundEnhancement'
                                        },
                                        {text: '文字效果', link: '/css/advanced/visual-decoration/textEffects'},
                                        {text: '颜色', link: '/css/advanced/visual-decoration/colors'},
                                    ]
                                },
                                {
                                    text: '现代布局系统',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '多列布局', link: '/css/advanced/layout/multiColumn'},
                                        {text: 'Table表格布局', link: '/css/advanced/layout/tableLayout'},
                                        {text: 'Flex弹性布局', link: '/css/advanced/layout/flexibleBox'},
                                        {text: 'Grid栅格布局', link: '/css/advanced/layout/grid'},
                                    ]
                                },
                                {
                                    text: '动画与变换',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '变换', link: '/css/advanced/animation-transform/transform'},
                                        {text: '过渡', link: '/css/advanced/animation-transform/transitions'},
                                        {text: '动画', link: '/css/advanced/animation-transform/animations'},
                                    ]
                                },
                                {
                                    text: '响应式设计',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '媒体查询', link: '/css/advanced/responsive/mediaQueries'},
                                        {text: '单位', link: '/css/advanced/responsive/units'},
                                    ]
                                },
                                {
                                    text: '工程化治理',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '变量', link: '/css/advanced/project/variables'},
                                        {text: '级联层', link: '/css/advanced/project/cascadeLayer'},
                                        {text: '容器查询', link: '/css/advanced/project/containerQueries'},
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    text: 'js',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: '基础',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '数据类型', link: '/js/basic/eightTypes'},
                                {text: '变量声明', link: '/js/basic/variablesDeclare'},
                                {text: '变量解构赋值', link: '/js/basic/variablesDestructuring'},
                                {text: '执行上下文和执行栈', link: '/js/basic/executionContextAndStack'},
                                {text: '作用域', link: '/js/basic/lexicalScope'},
                                {text: '内存空间', link: '/js/basic/memorySpace'},
                                {text: '基本引用类型', link: '/js/basic/basicPrimitiveType'},
                                {text: '原始值包装类型', link: '/js/basic/primitiveWrapperTypes'},
                                {text: '集合引用类型', link: '/js/basic/collectionPrimitiveTypes'},
                                {text: '函数基础', link: '/js/basic/basicFunction'},
                                {text: '闭包', link: '/js/basic/closure'},
                                {text: 'This全面解析', link: '/js/basic/this'},
                                // {text: '相等性判断', link: '/js/basic/equal'},
                                {text: '深浅拷贝原理', link: '/js/basic/copy'},
                                {text: 'JSON序列化', link: '/js/basic/jsonSerialize'},
                            ]
                        },
                        {
                            text: '进阶',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: '数据类型扩展',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '字符串的扩展', link: '/js/advanced/data-types/string'},
                                        {text: '正则的扩展', link: '/js/advanced/data-types/regExp'},
                                        {text: '数值的扩展', link: '/js/advanced/data-types/number'},
                                        {text: '函数的扩展', link: '/js/advanced/data-types/function'},
                                        {text: '数组的扩展', link: '/js/advanced/data-types/array'},
                                        {text: '对象的扩展', link: '/js/advanced/data-types/object'},
                                        {text: '运算符的扩展', link: '/js/advanced/data-types/operator'},
                                        {text: 'Set和Map数据结构', link: '/js/advanced/data-types/setAndmap'},
                                    ]
                                },
                                {
                                    text: '事件循环和异步',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: 'Promise对象', link: '/js/advanced/async/promise'},
                                        {text: 'Iterator(遍历器)', link: '/js/advanced/async/iterator'},
                                        {text: 'Generator函数的语法', link: '/js/advanced/async/generator'},
                                        {text: 'Generator函数的异步应用', link: '/js/advanced/async/generatorApply'},
                                        {text: 'async函数', link: '/js/advanced/async/async'},
                                        {text: '任务队列和事件循环', link: '/js/advanced/async/eventLoop'},
                                    ]
                                },
                                {
                                    text: '类与继承',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '原型、原型链、继承', link: '/js/advanced/class-inheritance/prototype'},
                                        {text: 'Class的基本语法', link: '/js/advanced/class-inheritance/classBasic'},
                                        {text: 'Class的继承', link: '/js/advanced/class-inheritance/classExtends'},
                                    ]
                                },
                                {
                                    text: '元编程',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: 'Symbol', link: '/js/advanced/metaprogramming/symbol'},
                                        {text: 'Proxy', link: '/js/advanced/metaprogramming/proxy'},
                                        {text: 'Reflect', link: '/js/advanced/metaprogramming/reflect'},
                                    ]
                                },
                                {
                                    text: '模块化',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: 'Module的语法', link: '/js/advanced/modules/module'},
                                        {text: 'Module的加载实现', link: '/js/advanced/modules/compareModule'},
                                    ]
                                },
                                {text: '严格模式', link: '/js/advanced/misc/strict'},
                                {text: 'ArrayBuffer', link: '/js/advanced/misc/arrayBuffer'},
                                // {text: 'Decorator(装饰器)', link: '/js/advanced/misc/decorator'},
                                // {text: '设计模式', link: '/js/advanced/misc/designPattern'},
                            ]
                        },
                        {
                            text: '深入函数手写',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '数组方法', link: '/js/hand-writing/arrayHandleWriting'},
                                {text: '对象方法', link: '/js/hand-writing/objectHandleWriting'},
                                {text: 'Function原型方法', link: '/js/hand-writing/functionHandleWriting'},
                                // {text: '继承', link: '/js/hand-writing/inherit'},
                                {text: '常用全局方法', link: '/js/hand-writing/globalMethods'},
                                {text: '高阶函数', link: '/js/hand-writing/highLevelFunction'},
                                {text: 'promise手写', link: '/js/hand-writing/promiseHandleWriting'},
                                {text: 'axios手写', link: '/js/hand-writing/axiosHandleWriting'},
                            ]
                        },
                    ]
                },
                {
                    text: 'Typescript',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: '类型基础', link: '/typescript/basicTypes'},
                        {text: '泛型', link: '/typescript/generics'},
                        {text: '类型收窄', link: '/typescript/narrowing'},
                        {text: '高级类型', link: '/typescript/advancedTypes'},
                        {text: '工具类型', link: '/typescript/utilityTypes'},
                        {text: '类型体操', link: '/typescript/typeChallenges'},
                        {text: 'TS 工程配置', link: '/typescript/tsconfigDeclarationModule'},
                    ]
                },
                {
                    text: '正则表达式',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: 'Regexp命令', link: '/regexp/regexp'},
                    ]
                },
                {
                    text: '网络协议与浏览器工作原理',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: '网络协议',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: 'Http协议', link: '/networkAndBrowsers/protocols/http'},
                                {text: 'Https协议', link: '/networkAndBrowsers/protocols/https'},
                                {text: 'tcp协议', link: '/networkAndBrowsers/protocols/tcp'},
                                {text: 'udp协议', link: '/networkAndBrowsers/protocols/udp'},
                                {text: 'ip协议', link: '/networkAndBrowsers/protocols/ip'},
                                {text: 'Http常见报文头', link: '/networkAndBrowsers/protocols/headers'},
                                {text: 'DNS解析', link: '/networkAndBrowsers/protocols/dns'},
                                {text: 'CDN加速原理', link: '/networkAndBrowsers/protocols/cdn'},
                                {text: 'OSI七层模型', link: '/networkAndBrowsers/protocols/osi'},
                            ]
                        },
                        {
                            text: '浏览器运行机制',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '浏览器缓存机制', link: '/networkAndBrowsers/browser/browserCache'},
                                {text: '浏览器渲染机制', link: '/networkAndBrowsers/browser/renderingProcess'},
                                {text: 'Performance API 性能观测', link: '/networkAndBrowsers/browser/performanceApi'},
                                {text: 'PWA 与 Service Worker 缓存', link: '/networkAndBrowsers/browser/serviceWorkerPwa'},
                                {text: 'Web Components', link: '/networkAndBrowsers/browser/webComponents'},
                            ]
                        },
                        {
                            text: '进程模型',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '进程和线程', link: '/networkAndBrowsers/process-model/processAndThread'},
                            ]
                        },
                    ]
                },
                {
                    text: 'Web 安全体系',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: 'XSS 与 CSRF', link: '/webSecurity/csrfAndXss'},
                        {text: '跨域与同源策略', link: '/webSecurity/crossOrigin'},
                        {text: 'CORS', link: '/webSecurity/cors'},
                        {text: 'CSP、SRI 与 HSTS', link: '/webSecurity/cspSriHsts'},
                        {text: 'ClickJacking 与 SameSite Cookie', link: '/webSecurity/clickJackingSameSite'},
                        {text: 'JWT / Cookie / Session', link: '/webSecurity/authStorageTradeoff'},
                        {text: 'OAuth2 / OIDC', link: '/webSecurity/oauthOidc'},
                        {text: '敏感信息与供应链安全', link: '/webSecurity/sensitiveInfoSupplyChain'},
                        {text: '企业级鉴权与安全方案', link: '/webSecurity/enterpriseAuthSecurity'},
                    ]
                },
                {
                    text: '前端框架',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: 'Vue',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: '基础',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '简介', link: '/frameworks/vue/basic/intro'},
                                        {text: '模板语法', link: '/frameworks/vue/basic/templateSyntax'},
                                        {text: '响应式状态', link: '/frameworks/vue/basic/reactivityFundamentals'},
                                        {text: '响应式状态派生', link: '/frameworks/vue/basic/computedAndWatch'},
                                        {text: '模板引用', link: '/frameworks/vue/basic/templateRefs'},
                                        {text: '生命周期', link: '/frameworks/vue/basic/lifecycleHooks'},
                                        {text: '组件通信', link: '/frameworks/vue/basic/componentCommunication'},
                                        {text: '异步组件', link: '/frameworks/vue/basic/asyncComponents'},
                                        {text: '组合式函数', link: '/frameworks/vue/basic/customHooks'},
                                        {text: '自定义指令', link: '/frameworks/vue/basic/customDirectives'},
                                        {text: '自定义Ref', link: '/frameworks/vue/basic/customRef'},
                                        {text: '插件', link: '/frameworks/vue/basic/plugins'},
                                        {text: '过渡', link: '/frameworks/vue/basic/transition'},
                                        {text: '列表过渡', link: '/frameworks/vue/basic/transitionGroup'},
                                        {text: '组件缓存', link: '/frameworks/vue/basic/keepAlive'},
                                        {text: 'Teleport', link: '/frameworks/vue/basic/teleport'},
                                        {text: '异步依赖边界管理器', link: '/frameworks/vue/basic/suspense'},
                                        {text: '路由', link: '/frameworks/vue/basic/vueRouter'},
                                        {text: 'pinia', link: '/frameworks/vue/basic/pinia'},
                                        {text: 'TS与组合式API', link: '/frameworks/vue/basic/composablesTs'},
                                        {text: '同构渲染', link: '/frameworks/vue/basic/isomorphicRendering'},
                                        {text: '环境配置和打包', link: '/frameworks/vue/basic/buildTools'},
                                    ]
                                },
                                {
                                    text: '进阶',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {
                                            text: 'Vue 核心设计原理与基础概念',
                                            collapsed: true, // 初始状态为“展开”
                                            items: [
                                                {
                                                    text: '命令式编程与声明式编程',
                                                    link: '/frameworks/vue/advanced/core-design/imperativeAndDeclarative'
                                                },
                                                {
                                                    text: '编译时和运行时',
                                                    link: '/frameworks/vue/advanced/core-design/compileAndRun'
                                                },
                                                {
                                                    text: '响应式副作用 (effect)',
                                                    link: '/frameworks/vue/advanced/core-design/slideEffect'
                                                },
                                                {
                                                    text: 'TreeShaking',
                                                    link: '/frameworks/vue/advanced/core-design/treeShaking'
                                                },
                                                {
                                                    text: 'TypeScript支持',
                                                    link: '/frameworks/vue/advanced/core-design/typescriptSupport'
                                                },
                                                {
                                                    text: '声明式UI',
                                                    link: '/frameworks/vue/advanced/core-design/declarativeUI'
                                                },
                                                {text: '虚拟 DOM', link: '/frameworks/vue/advanced/core-design/vDom'},
                                                {text: '编译器', link: '/frameworks/vue/advanced/core-design/compiler'},
                                                {text: '渲染器', link: '/frameworks/vue/advanced/core-design/renderer'},
                                                {
                                                    text: '组件的本质：状态与渲染',
                                                    link: '/frameworks/vue/advanced/core-design/componentEssence'
                                                },
                                            ]
                                        },
                                        {
                                            text: '从源码看本质：Vue 3 响应式系统、编译器与渲染器',
                                            collapsed: true, // 初始状态为“展开”
                                            items: [
                                                {
                                                    text: 'Vue 3 源码目录结构',
                                                    link: '/frameworks/vue/advanced/source-code/vueCatalog'
                                                },
                                                {
                                                    text: '响应式系统演进',
                                                    link: '/frameworks/vue/advanced/source-code/reactivityUpdate'
                                                },
                                                {
                                                    text: '响应式系统核心',
                                                    collapsed: true, // 初始状态为“展开”
                                                    items: [
                                                        {
                                                            text: 'reactive',
                                                            link: '/frameworks/vue/advanced/source-code/reactivity-core/reactive'
                                                        },
                                                        {
                                                            text: 'ref',
                                                            link: '/frameworks/vue/advanced/source-code/reactivity-core/ref'
                                                        },
                                                        {
                                                            text: 'computed',
                                                            link: '/frameworks/vue/advanced/source-code/reactivity-core/computed'
                                                        },
                                                        {
                                                            text: 'watch',
                                                            link: '/frameworks/vue/advanced/source-code/reactivity-core/watch'
                                                        },
                                                        {
                                                            text: 'watchEffect',
                                                            link: '/frameworks/vue/advanced/source-code/reactivity-core/watchEffect'
                                                        },
                                                    ]
                                                },
                                                {
                                                    text: '调度与异步更新',
                                                    collapsed: true, // 初始状态为“展开”
                                                    items: [
                                                        {
                                                            text: 'scheduler',
                                                            link: '/frameworks/vue/advanced/source-code/scheduler/scheduler'
                                                        },
                                                        {
                                                            text: 'nextTick',
                                                            link: '/frameworks/vue/advanced/source-code/scheduler/nextTick'
                                                        },
                                                    ]
                                                },
                                                {
                                                    text: '依赖注入',
                                                    link: '/frameworks/vue/advanced/source-code/provideAndInject'
                                                },
                                                {
                                                    text: '虚拟 DOM 与渲染器',
                                                    collapsed: true, // 初始状态为“展开”
                                                    items: [
                                                        {
                                                            text: 'vnode',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/vnode'
                                                        },
                                                        {
                                                            text: 'createRenderer',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/createRenderer'
                                                        },
                                                        {
                                                            text: 'nodeOps',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/nodeOps'
                                                        },
                                                        {
                                                            text: 'processElement',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/processElement'
                                                        },
                                                        {
                                                            text: 'processText',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/processText'
                                                        },
                                                        {
                                                            text: 'processCommentNode',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/processCommentNode'
                                                        },
                                                        {
                                                            text: 'processFragment',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/processFragment'
                                                        },
                                                        {
                                                            text: 'processComponent',
                                                            link: '/frameworks/vue/advanced/source-code/renderer/processComponent'
                                                        },
                                                    ]
                                                },
                                                {
                                                    text: 'Diff 算法演进',
                                                    link: '/frameworks/vue/advanced/source-code/patchKeyedChildren'
                                                },
                                                {
                                                    text: 'Vue 3 特殊组件揭秘',
                                                    collapsed: true, // 初始状态为“展开”
                                                    items: [
                                                        {
                                                            text: '异步组件',
                                                            link: '/frameworks/vue/advanced/source-code/special-components/defineAsyncComponent'
                                                        },
                                                        {
                                                            text: '组件缓存',
                                                            link: '/frameworks/vue/advanced/source-code/special-components/keepAliveComponent'
                                                        },
                                                        {
                                                            text: 'Teleport组件',
                                                            link: '/frameworks/vue/advanced/source-code/special-components/teleportComponent'
                                                        },
                                                        {
                                                            text: 'Transition组件',
                                                            link: '/frameworks/vue/advanced/source-code/special-components/transitionComponent'
                                                        },
                                                    ]
                                                },
                                                {
                                                    text: 'Vue 3 编译器核心技术解析',
                                                    collapsed: true, // 初始状态为“展开”
                                                    items: [
                                                        {
                                                            text: '编译器核心技术概览',
                                                            link: '/frameworks/vue/advanced/source-code/compiler/compilerInfo'
                                                        },
                                                        {
                                                            text: '解析阶段',
                                                            link: '/frameworks/vue/advanced/source-code/compiler/parser'
                                                        },
                                                        {
                                                            text: '转换/优化阶段',
                                                            link: '/frameworks/vue/advanced/source-code/compiler/transform'
                                                        },
                                                        {
                                                            text: '代码生成阶段',
                                                            link: '/frameworks/vue/advanced/source-code/compiler/codegen'
                                                        },
                                                    ]
                                                },
                                            ]
                                        },
                                    ]
                                },
                                {
                                    text: '自定义组件库',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '快速开始', link: '/frameworks/vue/components/quickStart'},
                                        {text: 'Button 按钮', link: '/frameworks/vue/components/button'},
                                        {text: 'Progress 进度条', link: '/frameworks/vue/components/progress'},
                                        {text: 'Collapse 折叠面板', link: '/frameworks/vue/components/collapse'},
                                        {text: 'Tooltip 文字提示', link: '/frameworks/vue/components/tooltip'},
                                        {text: 'Dropdown 下拉菜单', link: '/frameworks/vue/components/dropdown'},
                                        {text: 'Message 消息提示', link: '/frameworks/vue/components/message'},
                                        {text: 'Input 输入框', link: '/frameworks/vue/components/input'},
                                        {text: 'Switch 开关', link: '/frameworks/vue/components/switch'},
                                        {text: 'Select 选择器', link: '/frameworks/vue/components/select'},
                                        {text: 'Form 表单', link: '/frameworks/vue/components/form'},
                                    ]
                                }
                            ]
                        },
                        {
                            text: 'React',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: '基础',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '简介', link: '/frameworks/react/basic/intro'},
                                        {text: 'JSX语法', link: '/frameworks/react/basic/jsx'},
                                        {text: '元素渲染', link: '/frameworks/react/basic/elementRendering'},
                                        {text: '事件处理', link: '/frameworks/react/basic/handlingEvents'},
                                        {text: '条件渲染', link: '/frameworks/react/basic/conditionalRendering'},
                                        {text: '列表渲染', link: '/frameworks/react/basic/listRendering'},
                                        {text: 'state和生命周期', link: '/frameworks/react/basic/stateAndLifecycle'},
                                        {text: '组件和props', link: '/frameworks/react/basic/componentAndProps'},
                                        {text: '组件的导入和导出', link: '/frameworks/react/basic/importAndExport'},
                                        {text: '组件通信', link: '/frameworks/react/basic/componentCommunication'},
                                        {text: '表单', link: '/frameworks/react/basic/form'},
                                        {text: '性能优化', link: '/frameworks/react/basic/performanceOptimization'},
                                        {text: '高阶组件', link: '/frameworks/react/basic/hoc'},
                                        {text: 'CSS样式工程化', link: '/frameworks/react/basic/style'},
                                        {text: '动画', link: '/frameworks/react/basic/reactTransitionGroup'},
                                        {text: 'Portals', link: '/frameworks/react/basic/portals'},
                                        {text: 'Redux和中间件', link: '/frameworks/react/basic/react_redux'},
                                        {text: '路由', link: '/frameworks/react/basic/react_router'},
                                        {
                                            text: 'Hooks',
                                            collapsed: true, // 初始状态为“展开”
                                            items: [
                                                {text: 'useState', link: '/frameworks/react/basic/hooks/useState'},
                                                {text: 'useReducer', link: '/frameworks/react/basic/hooks/useReducer'},
                                                {text: 'useEffect', link: '/frameworks/react/basic/hooks/useEffect'},
                                                {
                                                    text: 'useEffectEvent',
                                                    link: '/frameworks/react/basic/hooks/useEffectEvent'
                                                },
                                                {
                                                    text: 'useLayoutEffect',
                                                    link: '/frameworks/react/basic/hooks/useLayoutEffect'
                                                },
                                                {text: 'useContext', link: '/frameworks/react/basic/hooks/useContext'},
                                                {
                                                    text: 'useCallback',
                                                    link: '/frameworks/react/basic/hooks/useCallback'
                                                },
                                                {text: 'useMemo', link: '/frameworks/react/basic/hooks/useMemo'},
                                                {text: 'useRef', link: '/frameworks/react/basic/hooks/useRef'},
                                                {
                                                    text: 'useImperativeHandle',
                                                    link: '/frameworks/react/basic/hooks/useImperativeHandle'
                                                },
                                                {
                                                    text: 'useActionState',
                                                    link: '/frameworks/react/basic/hooks/useActionState'
                                                },
                                                {
                                                    text: 'useDebugValue',
                                                    link: '/frameworks/react/basic/hooks/useDebugValue'
                                                },
                                                {
                                                    text: 'useDeferredValue',
                                                    link: '/frameworks/react/basic/hooks/useDeferredValue'
                                                },
                                                {
                                                    text: 'useTransition',
                                                    link: '/frameworks/react/basic/hooks/useTransition'
                                                },
                                                {text: 'useId', link: '/frameworks/react/basic/hooks/useId'},
                                                {
                                                    text: 'useInsertionEffect',
                                                    link: '/frameworks/react/basic/hooks/useInsertionEffect'
                                                },
                                                {
                                                    text: 'useOptimistic',
                                                    link: '/frameworks/react/basic/hooks/useOptimistic'
                                                },
                                                {
                                                    text: 'useSyncExternalStore',
                                                    link: '/frameworks/react/basic/hooks/useSyncExternalStore'
                                                },
                                                {
                                                    text: 'useFormStatus',
                                                    link: '/frameworks/react/basic/hooks/useFormStatus'
                                                },
                                            ]
                                        },
                                        {text: '自定义Hooks', link: '/frameworks/react/basic/customHook'},
                                        {text: '环境配置和打包', link: '/frameworks/react/basic/buildTools'},
                                        {text: 'React注意点', link: '/frameworks/react/basic/importantInfo'},
                                    ]
                                },
                                {
                                    text: '进阶',
                                    collapsed: true, // 初始状态为“展开”
                                    items: []
                                },
                            ]
                        },
                    ]
                },
                {
                    text: '前端工程化',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: '简介', link: '/frontEngineering/intro'},
                        {
                            text: '模块化与组件化开发',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: 'js模块化', link: '/frontEngineering/module-component/javascriptModules'},
                                {text: 'css工程化', link: '/frontEngineering/module-component/cssProject'},
                                {text: '组件化思维', link: '/frontEngineering/module-component/modules'},
                            ]
                        },
                        {text: '常用工具介绍', link: '/frontEngineering/engineerTools'},
                        {
                            text: '包与依赖管理',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '包管理器', link: '/frontEngineering/package-management/packageManagers'},
                                {text: 'package.json', link: '/frontEngineering/package-management/packageJson'},
                                {
                                    text: 'npm 发布',
                                    link: '/frontEngineering/package-management/npmPublishChangesets'
                                },
                            ]
                        },
                        {
                            text: '构建与打包',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: '构建工具',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: 'Webpack', link: '/frontEngineering/build-tools/bundlers/webpack'},
                                        {text: 'Vite', link: '/frontEngineering/build-tools/bundlers/vite'},
                                        {text: 'Rspack', link: '/frontEngineering/build-tools/bundlers/rspack'},
                                        {text: 'Turbopack', link: '/frontEngineering/build-tools/bundlers/turbopack'},
                                        {text: 'Gulp', link: '/frontEngineering/build-tools/bundlers/gulp'},
                                        {text: 'Parcel', link: '/frontEngineering/build-tools/bundlers/parcel'},
                                    ]
                                },
                                {
                                    text: '产物构建优化',
                                    link: '/frontEngineering/build-tools/bundleOptimization'
                                },
                                {
                                    text: '编译与打包引擎',
                                    link: '/frontEngineering/build-tools/compilers/codeCompilers'
                                },
                                {
                                    text: 'Source Map',
                                    link: '/frontEngineering/build-tools/sourceMap'
                                },
                                {
                                    text: '类库打包',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: 'tsup', link: '/frontEngineering/build-tools/library-bundling/tsup'},
                                        {text: 'Rollup', link: '/frontEngineering/build-tools/library-bundling/rollup'},
                                    ]
                                },
                            ]
                        },
                        {
                            text: '质量与测试',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '代码规范', link: '/frontEngineering/quality/linters'},
                                {text: '错误处理', link: '/frontEngineering/quality/errorHandling'},
                                {text: '自动化测试', link: '/frontEngineering/quality/testing'},
                                {text: '异常与性能监控', link: '/frontEngineering/quality/performanceMonitoring'},
                            ]
                        },
                        {
                            text: 'CI/CD 与部署',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: 'CI/CD 工具', link: '/frontEngineering/ci-cd/ci-cd'},
                                {text: '多环境与部署架构', link: '/frontEngineering/ci-cd/deploymentEnvironments'},
                            ]
                        },
                        {
                            text: '架构演进',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {
                                    text: 'Monorepo',
                                    collapsed: true, // 初始状态为“展开”
                                    items: [
                                        {text: '单体仓库', link: '/frontEngineering/architecture/monorepo'},
                                        {
                                            text: '任务缓存与版本策略',
                                            link: '/frontEngineering/architecture/monorepoTasksVersioning'
                                        },
                                    ]
                                },

                            ]
                        },

                    ]
                },
                {
                    text: '性能优化',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: 'Core Web Vitals', link: '/performanceOptimization/coreWebVitals'},
                        {text: '首屏优化', link: '/performanceOptimization/firstScreen'},
                        {text: '资源加载优化', link: '/performanceOptimization/resourceLoading'},
                        {text: '图片优化', link: '/performanceOptimization/imageOptimization'},
                        {text: 'JS 优化', link: '/performanceOptimization/jsExecution'},
                        {text: 'CSS 优化', link: '/performanceOptimization/cssPerformance'},
                        {text: '虚拟列表', link: '/performanceOptimization/virtualList'},
                        {text: 'Bundle 优化', link: '/performanceOptimization/bundleAnalysis'},
                        {text: '性能监控', link: '/performanceOptimization/performanceMonitoring'},
                    ]
                },
                {
                    text: 'Git',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: 'git命令', link: '/git/git'},
                    ]
                },
                {
                    text: '设计模式与架构模式',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {text: '单例模式', link: '/designPatterns/creational/singletonPattern'},
                        {text: '工厂模式', link: '/designPatterns/creational/factoryPattern'},
                        {text: '构造器模式', link: '/designPatterns/creational/constructorPattern'},
                        {text: '原型模式', link: '/designPatterns/creational/prototypePattern'},
                        {text: '策略模式', link: '/designPatterns/behavioral/strategyPattern'},
                        {text: '状态模式', link: '/designPatterns/behavioral/statePattern'},
                        {text: '模块模式', link: '/designPatterns/behavioral/modulePattern'},
                        {text: '代理模式', link: '/designPatterns/structural/proxyPattern'},
                        {text: '装饰器模式', link: '/designPatterns/structural/decoratorPattern'},
                        {text: '适配器模式', link: '/designPatterns/structural/adapterPattern'},
                        {text: '迭代器模式', link: '/designPatterns/behavioral/iteratorPattern'},
                        {text: '发布订阅模式', link: '/designPatterns/behavioral/pubSubPattern'},
                        {text: '观察者模式', link: '/designPatterns/behavioral/observerPattern'},
                        {text: '中介者模式', link: '/designPatterns/behavioral/mediatorPattern'},
                        {text: '外观模式', link: '/designPatterns/structural/facadePattern'},
                        {text: '命令模式', link: '/designPatterns/behavioral/commandPattern'},
                        {text: '组合模式', link: '/designPatterns/structural/compositePattern'},
                        {text: '享元模式', link: '/designPatterns/structural/flyweightPattern'},
                        {text: '模板方法模式', link: '/designPatterns/behavioral/templateMethodPattern'},
                        {text: '职责链模式', link: '/designPatterns/behavioral/chainofResponsibilityPattern'},
                        {text: 'MVC模式', link: '/designPatterns/architecture/MVC'},
                        {text: 'MVVM模式', link: '/designPatterns/architecture/MVVM'},
                        {text: '核心原则', link: '/designPatterns/summary/patternPrinciple'},
                        {text: '总结', link: '/designPatterns/summary/patternSummarize'},
                    ]
                },
                {
                    text: '数据结构和算法',
                    collapsed: true, // 初始状态为“展开”
                    items: [
                        {
                            text: '数据结构',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '数组', link: '/dataStructuresAndAlgorithms/data-structures/array'},
                                {text: '栈', link: '/dataStructuresAndAlgorithms/data-structures/stack'},
                                {text: '队列', link: '/dataStructuresAndAlgorithms/data-structures/queue'},
                                {text: '链表', link: '/dataStructuresAndAlgorithms/data-structures/linkedList'},
                                {text: '集合', link: '/dataStructuresAndAlgorithms/data-structures/set'},
                                {text: '字典', link: '/dataStructuresAndAlgorithms/data-structures/map'},
                                {text: '树', link: '/dataStructuresAndAlgorithms/data-structures/tree'},
                                {text: '堆', link: '/dataStructuresAndAlgorithms/data-structures/heap'},
                                {text: '图', link: '/dataStructuresAndAlgorithms/data-structures/graph'},
                                {text: '哈希表', link: '/dataStructuresAndAlgorithms/data-structures/hashTable'},
                            ]
                        },
                        {
                            text: '算法',
                            collapsed: true, // 初始状态为“展开”
                            items: [
                                {text: '排序算法', link: '/dataStructuresAndAlgorithms/algorithms/sortAlgorithms'},
                                {text: '查找算法', link: '/dataStructuresAndAlgorithms/algorithms/searchAlgorithms'},
                                {text: '递归算法', link: '/dataStructuresAndAlgorithms/algorithms/recursionAlgorithms'},
                                {text: '动态规划', link: '/dataStructuresAndAlgorithms/algorithms/dynamicProgramming'},
                                {text: '贪心算法', link: '/dataStructuresAndAlgorithms/algorithms/greedyAlgorithms'},
                                {
                                    text: '回溯算法',
                                    link: '/dataStructuresAndAlgorithms/algorithms/backTrackingAlgorithms'
                                },
                                {text: '广度优先遍历', link: '/dataStructuresAndAlgorithms/algorithms/BFS'},
                                {text: '深度优先遍历', link: '/dataStructuresAndAlgorithms/algorithms/DFS'},
                                {text: '双指针', link: '/dataStructuresAndAlgorithms/algorithms/twoPointers'},
                                {text: '滑动窗口', link: '/dataStructuresAndAlgorithms/algorithms/slideWindow'},
                                {
                                    text: '算法复杂度',
                                    link: '/dataStructuresAndAlgorithms/algorithms/algorithmComplexity'
                                },
                            ]
                        },
                    ]
                },
            ],
            socialLinks: [
                {icon: 'github', link: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts'}
            ]
        }
    })
}

export default config
