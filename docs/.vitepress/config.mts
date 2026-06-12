import {defineConfig} from 'vitepress'
import {componentPreview, containerPreview} from '@vitepress-demo-preview/plugin'
import lightbox from "vitepress-plugin-lightbox";
import {fileURLToPath, URL} from 'node:url'
// import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitepress.dev/reference/site-config
export default defineConfig({
    lang: 'zh-CN',
    //  加上这一块，专门写给爬虫看的！
    head: [
        ['meta', { name: 'docsearch:language', content: 'zh-CN' }]
    ],
    vite: {
        //图片压缩
        /*plugins:[
            ViteImageOptimizer({
                // 核心防坑 1：必须开启 includePublic！
                // 因为你的图片采用的是 ![logo](/logo.png) 的绝对路径写法，它们存放在 docs/public 目录下。
                // 默认情况下 Vite 会忽略该目录，开启此项会在最后一刻拦截并压缩 public 里的资产。
                includePublic: true,

                // 核心防坑 2：开启日志显示
                // 配合重定向命令（如 pnpm run docs:build > log.txt）可以查看被吞掉的压缩体积
                logStats: true,

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
            }) as any
        ],*/

        build: {
            minify: 'esbuild',
            sourcemap: false,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {}
        },
        ssr: {
            external: [
                '@fortawesome/fontawesome-svg-core',
                '@fortawesome/vue-fontawesome',
                '@fortawesome/free-solid-svg-icons',
                '@fortawesome/free-regular-svg-icons',
                '@fortawesome/free-brands-svg-icons'
            ],
            // 🌟 强行让 Vite 处理 xb-element，利用 Vite 的后缀补全机制绕过 Node.js 的死板规则！
            noExternal: ['xb-element']
        },
        optimizeDeps: {
            include: [
                'lodash-es',
                'viewerjs',
                'xb-element' // 建议把自研库也加进来预构建
            ],
            // 防止 Vite 去预构建庞大的 SVG 图标树
            exclude: [
                '@fortawesome/fontawesome-svg-core',
                '@fortawesome/free-solid-svg-icons'
            ]
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('../../src', import.meta.url)),
                // 当代码中尝试引入这个被禁止的路径时
                find: 'xb-element/dist/es/x-element',
                // 直接强行将其映射到真实的物理文件路径上
                // 注意：这里的相对路径('../../node_modules/...')需要根据你的项目结构调整
                // 确保它能正确指向你的 node_modules 目录
                replacement: path.resolve(__dirname, '../../node_modules/xb-element/dist/es/x-element.js')
            },
        },
    },
    base: '/CoreFront-EndConcepts/',
    title: "寻北",
    description: "vitePress",
    head: [['link', {rel: 'icon', href: '/CoreFront-EndConcepts/img/myAddress.svg'}]], //要在页面 HTML 的 <head> 标签中呈现的其他元素
    cleanUrls: true,         //生成简洁的url
    // 🚨 2. 必须配置 markdown 字段
    markdown: {
        config(md) {
            // 注册插件，让 VitePress 认识 :::preview 和 <preview>
            md.use(containerPreview)
            md.use(componentPreview)
            md.use(lightbox, {});
        }
    },
    themeConfig: {
        logo: '/img/blog.svg',  //导航栏上显示的 Logo，位于站点标题前

        /*   markdown: {
               // Shiki 主题配置
               theme: {
                   light: 'material-theme-lighter', // 亮色模式下的主题
                   dark: 'material-theme-palenight' // 暗色模式下的主题
               }
           },*/
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
                apiKey: 'a0e5fa8638d3a3bebe5de3cb0fdd01da', //注意：这里一定要用 Search-Only 的那个！
                indexName: 'CoreFront-EndConcepts',       // 比如 vue3-blog-index，必须和 docsearch.json 里的一模一样
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
                            {text: '基础结构', link: '/html/htmlBasicStructure'},
                            {text: '常用标签', link: '/html/commonTags'},
                            {text: 'Dom元素', link: '/html/domAttributes'},
                            {text: 'Dom事件流', link: '/html/domEvents'},
                            {text: '异步脚本加载', link: '/html/asyncScript'},
                            {text: 'ajax请求', link: '/html/ajax'},
                        ]
                    },
                    {
                        text: '进阶',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: '语义化标签', link: '/html/semanticHtml'},
                            {text: '多媒体元素', link: '/html/multimediaElements'},
                            {text: '增强表单', link: '/html/enhancedForms'},
                            {text: 'Canvas和Svg', link: '/html/canvasAndsvg'},
                            {text: '地理位置', link: '/html/geolocation'},
                            {text: 'Web存储', link: '/html/webStorage'},
                            {text: 'WebWorkers', link: '/html/webWorkers'},
                            {text: 'WebSockets', link: '/html/webSockets'},
                            {text: 'history路由', link: '/html/history'},
                            {text: '拖放', link: '/html/dragAndDrop'},
                            {text: '自定义数据属性', link: '/html/dataAttributes'},
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
                            {text: '选择器', link: '/css/selectors'},
                            {text: '继承', link: '/css/inheritance'},
                            {text: '盒模型', link: '/css/boxModel'},
                            {text: '文档流', link: '/css/documentFlow'},
                            {text: '定位', link: '/css/position'},
                            {text: '浮动', link: '/css/float'},
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
                                    {text: '圆角', link: '/css/borderRadius'},
                                    {text: '阴影', link: '/css/boxShadow'},
                                    {text: '渐变', link: '/css/gradients'},
                                    {text: '背景增强', link: '/css/backgroundEnhancement'},
                                    {text: '文字效果', link: '/css/textEffects'},
                                    {text: '颜色', link: '/css/colors'},
                                ]
                            },
                            {
                                text: '现代布局系统',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: '多列布局', link: '/css/multiColumn'},
                                    {text: 'Table表格布局', link: '/css/tableLayout'},
                                    {text: 'Flex弹性布局', link: '/css/flexibleBox'},
                                    {text: 'Grid栅格布局', link: '/css/grid'},
                                ]
                            },
                            {
                                text: '动画与变换',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: '变换', link: '/css/transform'},
                                    {text: '过渡', link: '/css/transitions'},
                                    {text: '动画', link: '/css/animations'},
                                ]
                            },
                            {
                                text: '响应式设计',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: '媒体查询', link: '/css/mediaQueries'},
                                    {text: '单位', link: '/css/units'},
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
                            {text: '数据类型', link: '/js/eightTypes'},
                            {text: '变量声明', link: '/js/variablesDeclare'},
                            {text: '变量解构赋值', link: '/js/variablesDestructuring'},
                            {text: '执行上下文和执行栈', link: '/js/executionContextAndStack'},
                            {text: '作用域', link: '/js/lexicalScope'},
                            {text: '内存空间', link: '/js/memorySpace'},
                            {text: '基本引用类型', link: '/js/basicPrimitiveType'},
                            {text: '集合引用类型', link: '/js/collectionPrimitiveTypes'},
                            {text: '函数基础', link: '/js/basicFunction'},
                            {text: '闭包', link: '/js/closure'},
                            {text: 'This全面解析', link: '/js/this'},
                            {text: '深浅拷贝原理', link: '/js/copy'},
                            {text: 'JSON序列化', link: '/js/jsonSerialize'},
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
                                    {text: '字符串的扩展', link: '/js/string'},
                                    {text: '正则的扩展', link: '/js/regExp'},
                                    {text: '数值的扩展', link: '/js/number'},
                                    {text: '函数的扩展', link: '/js/function'},
                                    {text: '数组的扩展', link: '/js/array'},
                                    {text: '对象的扩展', link: '/js/object'},
                                    {text: '运算符的扩展', link: '/js/operator'},
                                    {text: 'Set和Map数据结构', link: '/js/setAndmap'},
                                ]
                            },
                            {
                                text: '事件循环和异步',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: 'Promise对象', link: '/js/promise'},
                                    {text: 'Iterator(遍历器)', link: '/js/iterator'},
                                    {text: 'Generator函数的语法', link: '/js/generator'},
                                    {text: 'Generator函数的异步应用', link: '/js/generatorApply'},
                                    {text: 'async函数', link: '/js/async'},
                                    {text: '任务队列和事件循环', link: '/js/eventLoop'},
                                ]
                            },
                            {
                                text: '类与继承',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: '原型、原型链、继承', link: '/js/prototype'},
                                    {text: 'Class的基本语法', link: '/js/classBasic'},
                                    {text: 'Class的继承', link: '/js/classExtends'},
                                ]
                            },
                            {
                                text: '元编程',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: 'Symbol', link: '/js/symbol'},
                                    {text: 'Proxy', link: '/js/proxy'},
                                    {text: 'Reflect', link: '/js/reflect'},
                                ]
                            },
                            {
                                text: '模块化',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: 'Module的语法', link: '/js/module'},
                                    {text: 'Module的加载实现', link: '/js/compareModule'},
                                ]
                            },
                            {text: '严格模式', link: '/js/strict'},
                            {text: '跨域', link: '/js/crossOrigin'},
                            {text: '错误处理', link: '/js/errorHandling'},
                            {text: '性能优化', link: '/js/optimize'},
                            {text: 'ArrayBuffer', link: '/js/arrayBuffer'},
                            // {text: 'Decorator(装饰器)', link: '/js/decorator'},
                        ]
                    },
                    {
                        text: '深入函数手写',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: '数组方法', link: '/js/arrayHandleWriting'},
                            {text: '对象方法', link: '/js/objectHandleWriting'},
                            {text: 'Function原型方法', link: '/js/functionHandleWriting'},
                            // {text: '继承', link: '/js/inherit'},
                            {text: '常用全局方法', link: '/js/globalMethods'},
                            {text: '高阶函数', link: '/js/highLevelFunction'},
                            {text: 'promise手写', link: '/js/promiseHandleWriting'},
                            {text: 'axios手写', link: '/js/axiosHandleWriting'},
                        ]
                    },
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
                                    {text: '简介', link: '/frameworks/vue/intro'},
                                    {text: '模板语法', link: '/frameworks/vue/templateSyntax'},
                                    {text: '响应式状态', link: '/frameworks/vue/reactivityFundamentals'},
                                    {text: '响应式状态派生', link: '/frameworks/vue/computedAndWatch'},
                                    {text: '模板引用', link: '/frameworks/vue/templateRefs'},
                                    {text: '生命周期', link: '/frameworks/vue/lifecycleHooks'},
                                    {text: '组件通信', link: '/frameworks/vue/componentCommunication'},
                                    {text: '异步组件', link: '/frameworks/vue/asyncComponents'},
                                    {text: '组合式函数', link: '/frameworks/vue/customHooks'},
                                    {text: '自定义指令', link: '/frameworks/vue/customDirectives'},
                                    {text: '自定义Ref', link: '/frameworks/vue/customRef'},
                                    {text: '插件', link: '/frameworks/vue/plugins'},
                                    {text: '过渡', link: '/frameworks/vue/transition'},
                                    {text: '列表过渡', link: '/frameworks/vue/transitionGroup'},
                                    {text: '组件缓存', link: '/frameworks/vue/keepAlive'},
                                    {text: 'Teleport', link: '/frameworks/vue/teleport'},
                                    {text: '异步依赖边界管理器', link: '/frameworks/vue/suspense'},
                                    {text: '路由', link: '/frameworks/vue/vueRouter'},
                                    {text: 'pinia', link: '/frameworks/vue/pinia'},
                                    {text: 'TS与组合式API', link: '/frameworks/vue/composablesTs'},
                                    {text: '同构渲染', link: '/frameworks/vue/isomorphicRendering'},
                                    {text: '环境配置和打包', link: '/frameworks/vue/buildTools'},
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
                                                link: '/frameworks/vue/imperativeAndDeclarative'
                                            },
                                            {text: '编译时和运行时', link: '/frameworks/vue/compileAndRun'},
                                            {text: '响应式副作用 (effect)', link: '/frameworks/vue/slideEffect'},
                                            {text: 'TreeShaking', link: '/frameworks/vue/treeShaking'},
                                            {text: 'TypeScript支持', link: '/frameworks/vue/typescriptSupport'},
                                            {text: '声明式UI', link: '/frameworks/vue/declarativeUI'},
                                            {text: '虚拟 DOM', link: '/frameworks/vue/vDom'},
                                            {text: '编译器', link: '/frameworks/vue/compiler'},
                                            {text: '渲染器', link: '/frameworks/vue/renderer'},
                                            {text: '组件的本质：状态与渲染', link: '/frameworks/vue/componentEssence'},
                                        ]
                                    },
                                    {
                                        text: '从源码看本质：Vue 3 响应式系统、编译器与渲染器',
                                        collapsed: true, // 初始状态为“展开”
                                        items: [
                                            {text: 'Vue 3 源码目录结构', link: '/frameworks/vue/vueCatalog'},
                                            {text: '响应式系统演进', link: '/frameworks/vue/reactivityUpdate'},
                                            {
                                                text: '响应式系统核心',
                                                collapsed: true, // 初始状态为“展开”
                                                items: [
                                                    {text: 'reactive', link: '/frameworks/vue/reactive'},
                                                    {text: 'ref', link: '/frameworks/vue/ref'},
                                                    {text: 'computed', link: '/frameworks/vue/computed'},
                                                    {text: 'watch', link: '/frameworks/vue/watch'},
                                                    {text: 'watchEffect', link: '/frameworks/vue/watchEffect'},
                                                ]
                                            },
                                            {
                                                text: '调度与异步更新',
                                                collapsed: true, // 初始状态为“展开”
                                                items: [
                                                    {text: 'scheduler', link: '/frameworks/vue/scheduler'},
                                                    {text: 'nextTick', link: '/frameworks/vue/nextTick'},
                                                ]
                                            },
                                            {text: '依赖注入', link: '/frameworks/vue/provideAndInject'},
                                            {
                                                text: '虚拟 DOM 与渲染器',
                                                collapsed: true, // 初始状态为“展开”
                                                items: [
                                                    {text: 'vnode', link: '/frameworks/vue/vnode'},
                                                    {text: 'createRenderer', link: '/frameworks/vue/createRenderer'},
                                                    {text: 'nodeOps', link: '/frameworks/vue/nodeOps'},
                                                    {text: 'processElement', link: '/frameworks/vue/processElement'},
                                                    {text: 'processText', link: '/frameworks/vue/processText'},
                                                    {
                                                        text: 'processCommentNode',
                                                        link: '/frameworks/vue/processCommentNode'
                                                    },
                                                    {text: 'processFragment', link: '/frameworks/vue/processFragment'},
                                                    {
                                                        text: 'processComponent',
                                                        link: '/frameworks/vue/processComponent'
                                                    },
                                                ]
                                            },
                                            {text: 'Diff 算法演进', link: '/frameworks/vue/patchKeyedChildren'},
                                            {
                                                text: 'Vue 3 特殊组件揭秘',
                                                collapsed: true, // 初始状态为“展开”
                                                items: [
                                                    {text: '异步组件', link: '/frameworks/vue/defineAsyncComponent'},
                                                    {text: '组件缓存', link: '/frameworks/vue/keepAliveComponent'},
                                                    {text: 'Teleport组件', link: '/frameworks/vue/teleportComponent'},
                                                    {
                                                        text: 'Transition组件',
                                                        link: '/frameworks/vue/transitionComponent'
                                                    },
                                                ]
                                            },
                                            {
                                                text: 'Vue 3 编译器核心技术解析',
                                                collapsed: true, // 初始状态为“展开”
                                                items: [
                                                    {text: '编译器核心技术概览', link: '/frameworks/vue/compilerInfo'},
                                                    {text: '解析阶段', link: '/frameworks/vue/parser'},
                                                    {text: '转换/优化阶段', link: '/frameworks/vue/transform'},
                                                    {text: '代码生成阶段', link: '/frameworks/vue/codegen'},
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
                                    {text: '快速开始', link: '/frameworks/vue/quickStart'},
                                    {text: 'Button 按钮', link: '/frameworks/vue/button'},
                                    {text: 'Progress 进度条', link: '/frameworks/vue/progress'},
                                    {text: 'Collapse 折叠面板', link: '/frameworks/vue/collapse'},
                                    {text: 'Tooltip 文字提示', link: '/frameworks/vue/tooltip'},
                                    {text: 'Dropdown 下拉菜单', link: '/frameworks/vue/dropdown'},
                                    {text: 'Message 消息提示', link: '/frameworks/vue/message'},
                                    {text: 'Input 输入框', link: '/frameworks/vue/input'},
                                    {text: 'Switch 开关', link: '/frameworks/vue/switch'},
                                    {text: 'Select 选择器', link: '/frameworks/vue/select'},
                                    {text: 'Form 表单', link: '/frameworks/vue/form'},
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
                                    {text: '简介', link: '/frameworks/react/intro'},
                                    {text: 'JSX语法', link: '/frameworks/react/jsx'},
                                    {text: '元素渲染', link: '/frameworks/react/elementRendering'},
                                    {text: '事件处理', link: '/frameworks/react/handlingEvents'},
                                    {text: '条件渲染', link: '/frameworks/react/conditionalRendering'},
                                    {text: '列表渲染', link: '/frameworks/react/listRendering'},
                                    {text: 'state和生命周期', link: '/frameworks/react/stateAndLifecycle'},
                                    {text: '组件和props', link: '/frameworks/react/componentAndProps'},
                                    {text: '组件的导入和导出', link: '/frameworks/react/importAndExport'},
                                    {text: '组件通信', link: '/frameworks/react/componentCommunication'},
                                    {text: '表单', link: '/frameworks/react/form'},
                                    {text: '性能优化', link: '/frameworks/react/performanceOptimization'},
                                    {text: '高阶组件', link: '/frameworks/react/hoc'},
                                    {text: 'CSS样式工程化', link: '/frameworks/react/style'},
                                    {text: '动画', link: '/frameworks/react/reactTransitionGroup'},
                                    {text: 'Portals', link: '/frameworks/react/portals'},
                                    {text: 'Redux和中间件', link: '/frameworks/react/react_redux'},
                                    {text: '路由', link: '/frameworks/react/react_router'},
                                    {
                                        text: 'Hooks',
                                        collapsed: true, // 初始状态为“展开”
                                        items: [
                                            {text: 'useState', link: '/frameworks/react/useState'},
                                            {text: 'useReducer', link: '/frameworks/react/useReducer'},
                                            {text: 'useEffect', link: '/frameworks/react/useEffect'},
                                            {text: 'useEffectEvent', link: '/frameworks/react/useEffectEvent'},
                                            {text: 'useLayoutEffect', link: '/frameworks/react/useLayoutEffect'},
                                            {text: 'useContext', link: '/frameworks/react/useContext'},
                                            {text: 'useCallback', link: '/frameworks/react/useCallback'},
                                            {text: 'useMemo', link: '/frameworks/react/useMemo'},
                                            {text: 'useRef', link: '/frameworks/react/useRef'},
                                            {
                                                text: 'useImperativeHandle',
                                                link: '/frameworks/react/useImperativeHandle'
                                            },
                                            {text: 'useActionState', link: '/frameworks/react/useActionState'},
                                            {text: 'useDebugValue', link: '/frameworks/react/useDebugValue'},
                                            {text: 'useDeferredValue', link: '/frameworks/react/useDeferredValue'},
                                            {text: 'useTransition', link: '/frameworks/react/useTransition'},
                                            {text: 'useId', link: '/frameworks/react/useId'},
                                            {text: 'useInsertionEffect', link: '/frameworks/react/useInsertionEffect'},
                                            {text: 'useOptimistic', link: '/frameworks/react/useOptimistic'},
                                            {
                                                text: 'useSyncExternalStore',
                                                link: '/frameworks/react/useSyncExternalStore'
                                            },
                                            {text: 'useFormStatus', link: '/frameworks/react/useFormStatus'},
                                        ]
                                    },
                                    {text: '自定义Hooks', link: '/frameworks/react/customHook'},
                                    {text: '环境配置和打包', link: '/frameworks/react/buildTools'},
                                    {text: 'React注意点', link: '/frameworks/react/importantInfo'},
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
                text: 'Git',
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: 'git命令', link: '/git/git'},
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
                text: 'Typescript',
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: '核心语法', link: '/typescript/typescript'},
                ]
            },
            {
                text: '前端工程化',
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: '简介', link: '/forntEngineering/intro'},
                    {
                        text: '模块化与组件化开发',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: 'js模块化', link: '/forntEngineering/javascriptModules'},
                            {text: 'css工程化', link: '/forntEngineering/cssProject'},
                            {text: '组件化思维', link: '/forntEngineering/modules'},
                        ]
                    },
                    {text: '常用工具介绍', link: '/forntEngineering/engineerTools'},
                    {
                        text: '包管理器与依赖管理',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: '包管理器', link: '/forntEngineering/packageManagers'},
                            {text: '依赖管理', link: '/forntEngineering/packageJson.md'},
                        ]
                    },
                    {
                        text: '构建工具',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {
                                text: '综合构建与打包',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: 'Webpack', link: '/forntEngineering/webpack'},
                                    {text: 'vite', link: '/forntEngineering/vite'},
                                    {text: 'Rspack', link: '/forntEngineering/rspack'},
                                    {text: 'Turbopack', link: '/forntEngineering/turbopack'},
                                    {text: 'gulp', link: '/forntEngineering/gulp'},
                                    {text: 'parcel', link: '/forntEngineering/parcel'},
                                ]
                            },
                            {text: '底层编译与打包引擎', link: '/forntEngineering/codeCompilers'},
                            {
                                text: '类库独立打包',
                                collapsed: true, // 初始状态为“展开”
                                items: [
                                    {text: 'tsup', link: '/forntEngineering/tsup'},
                                    {text: 'Rollup', link: '/forntEngineering/rollup'},
                                ]
                            },
                        ]
                    },
                    {text: '代码规范与质量控制', link: '/forntEngineering/linters'},
                    {text: '自动化测试', link: '/forntEngineering/testing'},
                    {
                        text: 'CI/CD 与持续部署',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: 'CI/CD 工具', link: '/forntEngineering/ci-cd'},
                            {text: '部署环境', link: '/forntEngineering/deploymentEnvironments'},
                        ]
                    },
                    {text: '异常捕获与性能监控', link: '/forntEngineering/performanceMonitoring'},
                    {
                        text: '架构演进:Monorepo与微前端',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: 'Monorepo（单体仓库）', link: '/forntEngineering/monorepo'},
                        ]
                    },

                ]
            },
            {
                text: '设计模式与架构模式',
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: '单例模式', link: '/designPatterns/singletonPattern'},
                    {text: '工厂模式', link: '/designPatterns/factoryPattern'},
                    {text: '构造器模式', link: '/designPatterns/constructorPattern'},
                    {text: '原型模式', link: '/designPatterns/prototypePattern'},
                    {text: '策略模式', link: '/designPatterns/strategyPattern'},
                    {text: '状态模式', link: '/designPatterns/statePattern'},
                    {text: '模块模式', link: '/designPatterns/modulePattern'},
                    {text: '代理模式', link: '/designPatterns/proxyPattern'},
                    {text: '装饰器模式', link: '/designPatterns/decoratorPattern'},
                    {text: '适配器模式', link: '/designPatterns/adapterPattern'},
                    {text: '迭代器模式', link: '/designPatterns/iteratorPattern'},
                    {text: '发布订阅模式', link: '/designPatterns/pubSubPattern'},
                    {text: '观察者模式', link: '/designPatterns/observerPattern'},
                    {text: '中介者模式', link: '/designPatterns/mediatorPattern'},
                    {text: '外观模式', link: '/designPatterns/facadePattern'},
                    {text: '命令模式', link: '/designPatterns/commandPattern'},
                    {text: '组合模式', link: '/designPatterns/compositePattern'},
                    {text: '享元模式', link: '/designPatterns/flyweightPattern'},
                    {text: '模板方法模式', link: '/designPatterns/templateMethodPattern'},
                    {text: '职责链模式', link: '/designPatterns/chainofResponsibilityPattern'},
                    {text: 'MVC模式', link: '/designPatterns/MVC'},
                    {text: 'MVVM模式', link: '/designPatterns/MVVM'},
                    {text: '核心原则', link: '/designPatterns/patternPrinciple'},
                    {text: '总结', link: '/designPatterns/patternSummarize'},
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
                            {text: '数组', link: '/dataStructuresAndAlgorithms/array'},
                            {text: '栈', link: '/dataStructuresAndAlgorithms/stack'},
                            {text: '队列', link: '/dataStructuresAndAlgorithms/queue'},
                            {text: '链表', link: '/dataStructuresAndAlgorithms/linkedList'},
                            {text: '集合', link: '/dataStructuresAndAlgorithms/set'},
                            {text: '字典', link: '/dataStructuresAndAlgorithms/map'},
                            {text: '树', link: '/dataStructuresAndAlgorithms/tree'},
                            {text: '堆', link: '/dataStructuresAndAlgorithms/heap'},
                            {text: '图', link: '/dataStructuresAndAlgorithms/graph'},
                            {text: '哈希表', link: '/dataStructuresAndAlgorithms/hashTable'},
                        ]
                    },
                    {
                        text: '算法',
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {text: '排序算法', link: '/dataStructuresAndAlgorithms/sortAlgorithms'},
                            {text: '查找算法', link: '/dataStructuresAndAlgorithms/searchAlgorithms'},
                            {text: '递归算法', link: '/dataStructuresAndAlgorithms/recursionAlgorithms'},
                            {text: '动态规划', link: '/dataStructuresAndAlgorithms/dynamicProgramming'},
                            {text: '贪心算法', link: '/dataStructuresAndAlgorithms/greedyAlgorithms'},
                            {text: '回溯算法', link: '/dataStructuresAndAlgorithms/backTrackingAlgorithms'},
                            {text: '广度优先遍历', link: '/dataStructuresAndAlgorithms/BFS'},
                            {text: '深度优先遍历', link: '/dataStructuresAndAlgorithms/DFS'},
                            {text: '双指针', link: '/dataStructuresAndAlgorithms/twoPointers'},
                            {text: '滑动窗口', link: '/dataStructuresAndAlgorithms/slideWindow'},
                            {text: '算法复杂度', link: '/dataStructuresAndAlgorithms/algorithmComplexity'},
                        ]
                    },
                ]
            },
            {
                text: '网络协议与浏览器工作原理',
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: 'Http协议', link: '/networkAndBrowsers/http'},
                    {text: 'Https协议', link: '/networkAndBrowsers/https'},
                    {text: 'tcp协议', link: '/networkAndBrowsers/tcp'},
                    {text: 'udp协议', link: '/networkAndBrowsers/udp'},
                    {text: 'ip协议', link: '/networkAndBrowsers/ip'},
                    {text: 'Http常见报文头', link: '/networkAndBrowsers/headers'},
                    {text: 'DNS解析', link: '/networkAndBrowsers/dns'},
                    {text: 'CDN加速原理', link: '/networkAndBrowsers/cdn'},
                    {text: '浏览器缓存机制', link: '/networkAndBrowsers/browserCache'},
                    {text: '浏览器渲染机制', link: '/networkAndBrowsers/renderingProcess'},
                    {text: 'csrf和xss防御方式', link: '/networkAndBrowsers/csrfAndXss'},
                    {text: '进程和线程', link: '/networkAndBrowsers/processAndThread'},
                    {text: 'OSI七层模型', link: '/networkAndBrowsers/osi'},
                ]
            },

        ],
        socialLinks: [
            {icon: 'github', link: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts'}
        ]
    }
})
