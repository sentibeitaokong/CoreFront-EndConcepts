import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base: '/CoreFront-EndConcepts/',
    title: "vitePress",
    description: "vitePress",
    cleanUrls: true,         //生成简洁的url
    themeConfig: {
        lastUpdated: {
            text: '最后更新于',      //自定义名称
            formatOptions: {
                dateStyle: 'full',
                timeStyle: 'medium'
            }
        },    //显示最后更新时间
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
            level: [2, 5],
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
                            {text: '变量声明', link: '/js/variables'},
                            {text: '执行上下文和执行栈', link: '/js/executionContextAndStack'},
                            {text: '作用域', link: '/js/lexicalScope'},
                            {text: '内存空间', link: '/js/memorySpace'},
                            {text: '基本引用类型', link: '/js/basicPrimitiveType'},
                        ]
                    },
                    {
                        text: '进阶',
                        collapsible: true, // 允许折叠 (默认true，可省略)
                        collapsed: false, // 初始状态为“展开”
                        items: [

                        ]
                    }
                ]
            }
        ],
        socialLinks: [
            {icon: 'github', link: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts'}
        ]
    }
})
