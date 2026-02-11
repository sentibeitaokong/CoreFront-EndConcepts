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
                // collapsed: false, // 初始状态为“展开”
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
                                collapsed: false, // 初始状态为“展开”
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
                // collapsed: false, // 初始状态为“展开”
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
                        collapsed: false, // 初始状态为“展开”
                        items: [
                            {
                                text: '数据类型扩展',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: false, // 初始状态为“展开”
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
                                collapsed: false, // 初始状态为“展开”
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
                                collapsed: false, // 初始状态为“展开”
                                items:[
                                    {text: '原型、原型链、继承', link: '/js/prototype'},
                                    {text: 'Class的基本语法', link: '/js/classBasic'},
                                    {text: 'Class的继承', link: '/js/classExtends'},
                                ]
                            },
                            {
                                text: '元编程',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: false, // 初始状态为“展开”
                                items:[
                                    {text: 'Symbol', link: '/js/symbol'},
                                    {text: 'Proxy', link: '/js/proxy'},
                                    {text: 'Reflect', link: '/js/reflect'},
                                ]
                            },
                            {
                                text: '模块化',
                                collapsible: true, // 允许折叠 (默认true，可省略)
                                collapsed: false, // 初始状态为“展开”
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
                        ]
                    },
                ]
            },
           /* {
                text: 'js设计模式',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: false, // 初始状态为“展开”
                items: [
                    {text: '设计模式', link: '/js/designPattern'},
                ]
            }*/
        ],
        socialLinks: [
            {icon: 'github', link: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts'}
        ]
    }
})
