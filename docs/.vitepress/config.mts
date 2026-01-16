import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    base:'/CoreFront-EndConcepts/',
    title: "个人博客",
    description: "个人博客",
    cleanUrls:true,         //生成简洁的url
    themeConfig: {
        lastUpdated:{
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
        lightModeSwitchTitle:'切换到白天主题',    //用于自定义悬停时显示的浅色模式开关标题。
        darkModeSwitchTitle:'切换到黑夜主题',     //用于自定义悬停时显示的深色模式开关标题。
        langMenuLabel:'切换语言',
        i18nRouting:true,           //i18n
        //目录导航标题和层级
        outline:{
            level:[2,4],
            label:'页面导航'
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
                            { text: '简体中文', link:(PageData)=>{return false},activeMatch: `^/` },
                        ],
                    }
                ]
            },
        ],

        sidebar: [
            {
                text: '简介',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: false, // 初始状态为“展开”
                items: [
                    {text: '前端知识体系介绍', link: '/intro'},
                ]
            },
            {
                text: 'html',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: false, // 初始状态为“展开”
                items: [
                    {text: 'html5新特性', link: '/html/html5NewFeatures'},
                ]
            },
            {
                text: 'css',
                collapsible: true, // 允许折叠 (默认true，可省略)
                collapsed: false, // 初始状态为“展开”
                items: [
                    {text: '选择器', link: '/css/selectors'},
                    {text: '盒模型', link: '/css/boxModel'},
                    {text: '继承', link: '/css/inheritance'},
                    {text: 'Flex弹性布局', link: '/css/flexibleBox'},
                    {text: 'Grid栅格布局', link: '/css/grid'},
                ]
            }
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/sentibeitaokong/CoreFront-EndConcepts' }
        ]
    }
})
