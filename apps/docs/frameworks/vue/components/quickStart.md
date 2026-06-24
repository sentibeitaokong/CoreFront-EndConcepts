# 安装

本节将介绍如何在项目中使用 `xb-element`。

## 使用包管理器

::: code-group

```shell [npm]
$  npm install xb-element --save
```

:::

如果你的网络环境不佳，推荐使用 [cnpm](https://github.com/cnpm/cnpm) 或使用 [npmmirror](https://npmmirror.com/)

```shell
npm config set registry https://registry.npmmirror.com
```

## 用法

如果你对打包后的文件大小不是很在乎，那么使用完整导入会更方便。

::: code-group

```ts [main.ts]
import { createApp } from 'vue'
import XBElement from 'xb-element'
import 'xb-element/dist/x-element.css'
import App from './App.vue'

const app = createApp(App)

app.use(XBElement)
app.mount('#app')
```

:::
