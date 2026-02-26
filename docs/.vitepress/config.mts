import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/CoreFront-EndConcepts/',
    title: "个人博客",
    description: "vitePress",
    head: [['link', { rel: 'icon', href: '/CoreFront-EndConcepts/myAddress.svg' }]], //要在页面 HTML 的 <head> 标签中呈现的其他元素
    cleanUrls: true,         //生成简洁的url
    themeConfig: {
        logo: '/blog.svg',  //导航栏上显示的 Logo，位于站点标题前
        /*markdown: {
            // Shiki 主题配置
            theme: {
                light: 'material-theme-lighter', // 亮色模式下的主题
                dark: 'material-theme-palenight' // 暗色模式下的主题
            }
        },*/
        /*lastUpdated: {
            text: '最后更新于',      //自定义名称
            formatOptions: {
                dateStyle: 'full',
                timeStyle: 'medium'
            }
        },*/    //显示最后更新时间
        editLink: {
            pattern: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },    //显示链接修改这个页面的github地址
        // carbonAds: {
        //     code: 'your-carbon-code',
        //     placement: 'your-carbon-placement'
        // },   //显示广告
        search: {
            provider: 'local'
        },
        /* search: {

             provider: 'algolia',
             options: {
                 appId: '...',
                 apiKey: '...',
                 indexName: '...',
                /!* askAi: {
                     assistantId: 'XXXYYY'
                 }*!/
             }
         },*/   //支持使用 Algolia DocSearch 搜索站点文档
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
                                text: '简体中文', link: (PageData) => {
                                    return false
                                }, activeMatch: `^/`
                            },
                        ],
                    }
                ]
            },
        ],

        sidebar: [
            {
                text: '简介',
                items: [
                    {text: '前端知识体系介绍', link: '/intro'},
                ]
            },
            {
                text: 'html',
                items: [
                    {
                        text: '基础',
                        collapsible: true, // 允许折叠 (默认true，可省略)
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
                        collapsible: true, // 允许折叠 (默认true，可省略)
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
                // collapsible: true, // 允许折叠 (默认true，可省略)
                // collapsed: true, // 初始状态为“展开”
                items: [
                    {
                        text: '基础',
                        collapsible: true, // 允许折叠 (默认true，可省略)
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
                        collapsible: true, // 允许折叠 (默认true，可省略)
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {
                                text: '视觉装饰',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
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
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
                                    {text: '多列布局', link: '/css/multiColumn'},
                                    {text: 'Table表格布局', link: '/css/tableLayout'},
                                    {text: 'Flex弹性布局', link: '/css/flexibleBox'},
                                    {text: 'Grid栅格布局', link: '/css/grid'},
                                ]
                            },
                            {
                                text: '动画与变换',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
                                    {text: '变换', link: '/css/transform'},
                                    {text: '过渡', link: '/css/transitions'},
                                    {text: '动画', link: '/css/animations'},
                                ]
                            },
                            {
                                text: '响应式设计',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
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
                // collapsible: true, // 允许折叠 (默认true，可省略)
                // collapsed: true, // 初始状态为“展开”
                items: [
                    {
                        text: '基础',
                        collapsible: true, // 允许折叠 (默认true，可省略)
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
                        collapsible: true, // 允许折叠 (默认true，可省略)
                        collapsed: true, // 初始状态为“展开”
                        items: [
                            {
                                text: '数据类型扩展',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
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
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
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
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
                                    {text: '原型、原型链、继承', link: '/js/prototype'},
                                    {text: 'Class的基本语法', link: '/js/classBasic'},
                                    {text: 'Class的继承', link: '/js/classExtends'},
                                ]
                            },
                            {
                                text: '元编程',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
                                    {text: 'Symbol', link: '/js/symbol'},
                                    {text: 'Proxy', link: '/js/proxy'},
                                    {text: 'Reflect', link: '/js/reflect'},
                                ]
                            },
                            {
                                text: '模块化',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: true, // 初始状态为“展开”
                                items:[
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
                        collapsible: true, // 允许折叠 (默认true，可省略)
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
                text: '设计模式',
                collapsible: true, // 允许折叠 (默认true，可省略)
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
                    {text: '核心原则', link: '/designPatterns/patternPrinciple'},
                    {text: '总结', link: '/designPatterns/patternSummarize'},
                ]
            },
            {
                text: 'Git',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: 'git命令', link: '/git/git'},
                ]
            },
            {
                text: '正则表达式',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: true, // 初始状态为“展开”
                items: [
                    {text: 'Regexp命令', link: '/regexp/regexp'},
                ]
            },
            {
                text: '网络协议与浏览器工作原理',
                collapsible: true, // 允许折叠 (默认true，可省略)
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
