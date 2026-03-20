---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# [Webpack](https://webpack.docschina.org/concepts/) (静态模块打包器)

## 1. 核心概念与特性

**Webpack** 是现代 JavaScript 应用程序的**静态模块打包器 (Static Module Bundler)**。当 Webpack 处理应用程序时，它会在内部从一个或多个入口点构建一个**依赖图 (Dependency Graph)**，然后将项目所需的每一个模块组合成一个或多个 **bundles**（通常只有一个），它们均为可直接在浏览器中运行的静态资源。

| 配置域 | 核心职责 | 常用子属性 |
| :--- | :--- | :--- |
| **`entry`** | **指定入口**：告诉 Webpack 从哪个文件开始构建依赖图。 | 单入口(String)、多入口(Object) |
| **`output`** | **指定出口**：控制编译后物理文件的输出路径和命名规则。 | `path`, `filename`, `publicPath`, `clean` |
| **`resolve`** | **模块解析**：配置寻找模块的规则，让代码里的 `import` 更简洁。 | `alias`, `extensions`, `modules` |
| **`module`** | **资源转换**：定义针对不同类型文件（CSS/图片/TS）的 Loader 翻译规则。 | `rules`, `test`, `use`, `exclude` |
| **`plugins`** | **插件扩展**：贯穿整个构建生命周期，执行自动化宏观任务。 | `HtmlWebpackPlugin`, `DefinePlugin` 等 |
| **`devServer`** | **本地服务**：配置开发环境的本地 HTTP 服务器及热更新。 | `port`, `proxy`, `hot`, `historyApiFallback` |

## 2. Webpack 核心配置与实战

### 2.1 Entry (入口配置)

`entry` 支持多种数据类型，以适应单页应用 (SPA) 和多页应用 (MPA)。

```js
module.exports = {
  // 1. 字符串：最简单的单页应用 (SPA)
  // entry: './src/main.js', 

  // 2. 数组：将多个毫无关联的文件打包进同一个 chunk，通常用于引入全局垫片 (Polyfill)
  // entry: ['./src/main.js', './src/polyfill.js'],

  // 3. 对象：最正规、最常用的多页应用 (MPA) 或代码分割写法
  entry: {
    app: './src/main.js',          // 业务代码主入口
    admin: './src/admin.js',       // 后台管理主入口
  }
};
```

### 2.2 Output (出口配置)

控制打包产物的形态。**必须结合 Node.js 的 `path` 模块使用绝对路径。**

```js
const path = require('path');

module.exports = {
  output: {
    // 1. 输出目录的绝对路径
    path: path.resolve(__dirname, 'dist'),

    // 2. 输出文件的名称。[name] 对应 entry 中的 key，[contenthash] 用于长缓存
    filename: 'js/[name].[contenthash:8].js',

    // 3. 极其重要：指定 HTML 中引入这些资源时的公共 URL 前缀
    // 如果部署在根目录，用 '/'；如果部署在 CDN，写 CDN 绝对地址
    publicPath: '/',

    // 4. 打包前自动清空 path 指定的目录 (Webpack 5 原生支持，替代 clean-webpack-plugin)
    clean: true 
  }
};
```

### 2.3 Resolve (解析配置)

优化 Webpack 查找模块的逻辑，既能提升开发体验，又能加快构建速度。

```js
const path = require('path');

module.exports = {
  resolve: {
    // 1. 配置路径别名：开发中最常用的技巧
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'assets': path.resolve(__dirname, 'src/assets')
      // 使用示例：import Button from 'components/Button'
    },

    // 2. 省略文件后缀名：按数组顺序依次尝试补全查找
    extensions: ['.js', '.vue', '.json', '.ts'],

    // 3. 告诉 Webpack 解析第三方模块时只去指定的目录找，减少向上级目录的层层遍历
    modules: [path.resolve(__dirname, 'node_modules')]
  }
};
```

### 2.4 Module & Rules (加载器规则)

通过配置 `rules`，让 Webpack 认识并处理非 JS 的静态资源。

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  module: {
    rules: [
      // 处理 JS/TS：使用 Babel 降级语法
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/, // 必须排除，否则编译极慢
        use: ['babel-loader']
      },
      // 处理样式：Sass/Less
      {
        test: /\.(scss|sass)$/,
        // 执行顺序是后进先出 (LIFO)：sass -> css -> MiniCssExtract
        use: [
          MiniCssExtractPlugin.loader, // 生产环境抽取为单独 CSS 文件 (开发环境可替换为 'style-loader')
          'css-loader',                // 解析 @import 和 url()
          'sass-loader'                // 将 Sass 编译为 CSS
        ]
      },
      // 处理图片/字体 (Webpack 5 Asset Modules)
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/i,
        type: 'asset', // 自动在 asset/resource (文件) 和 asset/inline (Base64) 之间选择
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024 // 10KB 以下转为 Base64，减少 HTTP 请求
          }
        },
        generator: {
          filename: 'img/[name].[hash:8][ext]' // 输出目录和命名
        }
      }
    ]
  }
};
```

### 2.5 常用 Plugins (核心插件配置)

插件用于执行更广泛的构建任务。

```js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

module.exports = {
  plugins: [
    // 1. 自动生成 HTML，并自动注入编译后的 JS 和 CSS 引用
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      inject: 'body', // 将 script 标签注入到 body 底部
      minify: { collapseWhitespace: true } // 压缩 HTML
    }),

    // 2. 将 CSS 提取为独立的物理文件
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css'
    }),

    // 3. 注入全局环境变量 (业务代码中可直接访问 process.env.BASE_URL)
    new webpack.DefinePlugin({
      'process.env.BASE_URL': JSON.stringify('https://api.example.com'),
      '__VUE_OPTIONS_API__': true // Vue3 特有特性开关
    })
  ]
};
```

### 2.6 DevServer (开发服务器配置)

提升本地开发效率的神器。

```js
module.exports = {
  devServer: {
    port: 3000,           // 指定端口号
    host: '0.0.0.0',      // 设为 0.0.0.0 可允许局域网内其他设备通过 IP 访问
    open: true,           // 编译完成后自动打开浏览器
    hot: true,            // 开启热模块替换 (HMR)，局部更新代码不刷新整个页面
    compress: true,       // 启用 gzip 压缩，加快本地资源加载
    
    // 解决单页应用 (SPA) history 路由模式下的刷新 404 问题
    historyApiFallback: true, 

    // 配置本地代理，完美解决本地开发跨域问题
    proxy: {
      '/api': {
        target: 'http://production-server.com', // 目标真实后端接口
        changeOrigin: true,                     // 欺骗服务器，修改请求头中的 Host 为 target
        pathRewrite: { '^/api': '' }            // 将 URL 中的 '/api' 前缀抹除
      }
    }
  }
};
```

### 2.7 典型基础配置文件

在项目根目录下通常会有一个 `webpack.config.js` 文件，它是基于 Node.js CommonJS 规范导出的一个配置对象。

```js
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // 自动生成 HTML 并引入 bundle
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 将 CSS 抽离为单独的文件

module.exports = {
  // 1. 模式：生产环境会自动开启代码压缩和 Tree-shaking
  mode: 'production', 

  // 2. 入口：从这里开始顺藤摸瓜找依赖
  entry: './src/index.js', 

  // 3. 出口：打包产物的去向
  output: {
    // 必须是绝对路径
    path: path.resolve(__dirname, 'dist'), 
    // 使用 contenthash 利用浏览器长缓存，文件内容不变则 hash 不变
    filename: 'js/[name].[contenthash:8].js', 
    clean: true // 每次打包前自动清空 dist 目录 (Webpack 5 新特性)
  }, 
  // 4. 解析配置
  resolve: {
      alias: { '@': path.resolve(__dirname, 'src') }, // 配置 @ 指向 src 目录
      extensions: ['.js', '.vue', '.json'] // 导入这些文件时可省略后缀
  },
  // 5. 模块转换规则 (Loaders)
  module: {
    rules: [
      {
        test: /\.js$/,          // 匹配 .js 文件
        exclude: /node_modules/, // 排除第三方依赖，提升编译速度
        use: {
          loader: 'babel-loader', // 接入 Babel 将 ES6+ 降级为 ES5
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.(css|less)$/,  // 匹配样式文件
        // Loader 的执行顺序是：从右向左，从下向上！
        // less-loader(转CSS) -> css-loader(解析CSS引用) -> MiniCssExtractPlugin(抽离为文件)
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        // Webpack 5 内置了资源模块(Asset Modules)，无需再安装 file-loader 或 url-loader
        type: 'asset', 
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 小于 8kb 的图片会被转成 Base64 内联到 JS 中
          }
        }
      }
    ]
  },

  // 6. 插件扩展
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // 指定 HTML 模板
      title: 'Webpack App'
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css' // 抽离出的 CSS 文件名
    })
  ]
};
```

## 3. 核心性能优化方案

Webpack 的优化可以明确划分为两个方向：**让打包速度更快（开发体验）** 和 **让打包体积更小（用户体验）**。


| 优化维度 | 核心目标 | 常用优化策略大纲 |
| :--- | :--- | :--- |
| **构建速度优化 (Build Time)** | 降低 `npm run dev` 和 `npm run build` 的耗时，提升 CI/CD 效率。 | 持久化缓存、多进程打包、缩小 Loader 搜索范围、替换更快的底层编译器 (esbuild/swc)。 |
| **产物加载优化 (Bundle Size)** | 减小最终输出文件的体积，提高浏览器首屏渲染速度 (FCP/TTI)。 | 代码分割 (SplitChunks)、摇树优化 (Tree Shaking)、路由懒加载、资源物理压缩 (Gzip/Brotli)。 |


### 3.1 构建速度优化 (提升开发与部署效率)

#### 1. Webpack 5 杀手锏：持久化缓存 (Persistent Cache)
在 Webpack 5 之前，开发者常利用 `hard-source-webpack-plugin` 来做缓存，极易引发玄学 Bug。Webpack 5 引入了原生文件系统缓存，**能将二次构建速度提升 90% 以上**。

```js
// webpack.config.js
module.exports = {
  cache: {
    type: 'filesystem', // 开启物理文件系统缓存，默认存放在 node_modules/.cache/webpack
    buildDependencies: {
      // 极其重要：当构建配置文件本身发生改变时，强制使得缓存失效
      config: [__filename] 
    }
  }
};
```

#### 2. 开启多进程构建 (Thread Loader)
JavaScript 是单线程的，而 Babel 转换 AST 是极其消耗 CPU 的 CPU-Intensive 任务。利用 `thread-loader` 可以将耗时的 Loader 任务分发给 Node.js 的多个 Worker 进程并发执行。

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/, // 第一步：绝对不要去处理 node_modules
        use: [
          {
            loader: 'thread-loader',
            options: { workers: 3 } // 开启 3 个工作进程 (通常设为 CPU 核心数 - 1)
          },
          'babel-loader' // babel-loader 的工作会被分发到工作进程中
        ]
      }
    ]
  }
};
```

#### 3. 拥抱下一代编译器 (esbuild-loader / swc-loader)
如果你觉得 Babel 还是太慢，可以使用 Go 或 Rust 编写的编译器来彻底替换 `babel-loader` 和 `TerserPlugin`，实现降维打击。

```js
// 使用 esbuild-loader 替换 babel-loader
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'esbuild-loader',
          options: { target: 'es2015' } // 极速编译并降级到 ES2015
        }
      }
    ]
  }
};
```

### 3.2 产物体积与加载优化 (提升首屏性能)

这是前端架构师的核心 KPI，决定了用户打开网页的速度。

#### 1. 极致的代码分割 (Code Splitting - SplitChunksPlugin)
默认情况下，Webpack 会把所有代码打进一个巨大的 `main.js` 里。我们需要利用 `splitChunks` 将几乎不怎么变动的第三方库（React、Vue、Lodash）单独剥离出来，利用浏览器的并发下载和强缓存。

```js
// webpack.prod.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all', // 对同步和异步引入的模块都进行分割
      minSize: 20000, // 只有超过 20kb 的模块才值得被单独抽离
      cacheGroups: {
        // 核心层：将基础框架抽离，优先级最高
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|vue|vue-router)[\\/]/,
          name: 'framework',
          priority: 20,
        },
        // 兜底层：将剩余的其他 node_modules 库打包成 vendors
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        // 业务公共层：将项目中被多个页面复用 2 次以上的业务组件抽离
        commons: {
          name: 'commons',
          minChunks: 2, 
          priority: 5,
          reuseExistingChunk: true // 如果该 chunk 已被打包，则直接复用
        }
      }
    }
  }
};
```

#### 2. 路由懒加载 (按需加载)
配合前端框架（Vue/React）的动态导入语法 `import()`，Webpack 会自动将这些页面组件切分为独立的 chunk。只有用户点击跳转到该页面时，浏览器才会发起 HTTP 请求下载对应 JS。

```js
// React 路由懒加载示例
import React, { Suspense, lazy } from 'react';
// Webpack 遇到 import() 时，会自动将其打包为一个单独的文件
const UserProfile = lazy(() => import('./views/UserProfile'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile />
    </Suspense>
  );
}
```

#### 3. 开启 Gzip 物理压缩
不仅要用 Terser 去除空格和注释，还要在构建时直接生成 `.gz` 文件。Nginx 服务器直接返回 `.gz` 文件，可将传输体积骤降 70% 左右，极大缓解带宽压力。

```js
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/, // 需要压缩的文件正则
      threshold: 10240, // 文件体积 > 10kb 才进行压缩 (太小压缩反而会变大)
      minRatio: 0.8     // 压缩后体积必须低于原体积 80% 才保留
    })
  ]
};
```

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 Loader 和 Plugin 的本质区别是什么？
这是 Webpack 面试中最核心、必考的问题。
*   **答**：
    *   **职责层面**：`Loader` 是“翻译官/转换器”，它工作在模块加载层面，专注于对某种特定类型的文件（如 CSS、Vue、图片）进行内容转换。`Plugin` 是“监听器/扩展器”，它工作在 Webpack 的整个生命周期中，可以执行范围更广的任务（如打包优化、注入环境变量、自动生成 HTML）。
    *   **配置层面**：Loader 在 `module.rules` 中配置，通常以数组形式存在。Plugin 在 `plugins` 数组中配置，通常需要 `new` 一个该插件的实例并传入配置参数。

### 4.2 彻底搞懂 Hash、Chunkhash 和 Contenthash 的区别？
我们在配置 output 文件名时，常常为了解决浏览器强缓存问题而加上 hash 值。这三者有极大的区别：
*   **答**：
    *   **`hash`**：与**整个项目的构建（Compilation）**相关。只要项目里有任何一个文件被修改，整个项目所有打包出来的文件的 hash 都会改变。**（致命缺点：导致未修改的第三方库缓存全部失效）**。
    *   **`chunkhash`**：与 **Webpack 打包的 chunk** 相关。只要同一个入口（Entry）对应的 chunk 内容改变，该 chunk 的 hash 就会变。**（缺点：如果 JS 里引入了 CSS，JS 改了，CSS 虽然没改，但由于同属一个 chunk，CSS 的 hash 也会变）**。
    *   **`contenthash`**：**（最优解）** 根据**文件自身的内容**计算出 hash。只有文件内容真的变了，hash 才会变。对于提取出来的 CSS 和 JS，通常全部使用 `contenthash`。

### 4.3 Webpack 构建速度太慢，有哪些核心的性能优化手段？
*   **答**：
    1.  **缩小搜索范围**：配置 Loader 的 `include` 或 `exclude`（如 `exclude: /node_modules/`），避免 Babel 费时费力去编译第三方库。设置 `resolve.alias` 别名，减少模块寻址时间。
    2.  **开启持久化缓存 (Webpack 5 杀手锏)**：Webpack 5 内置了物理缓存机制。配置 `cache: { type: 'filesystem' }`，二次构建速度将有十倍以上的跨越式提升（取代了过去繁琐的 `hard-source-webpack-plugin`）。
    3.  **多进程/多线程构建**：对于极其耗时的 Babel 转换，使用 `thread-loader` 将任务分发给多个 Node.js 工作进程并发执行（小项目不建议，因为开启线程本身也有开销）。

### 4.4 为什么我的 Tree-shaking 没有生效？
Tree-shaking 是指摇掉代码中没有用到的死代码。如果它失效了，通常是以下原因：
*   **答**：
    1.  **没有使用 ES Modules (ESM)**：Tree-shaking 的底层原理依赖于 ESM 的静态分析特性（`import/export`）。如果在 Babel 配置中，不小心把模块编译成了 CommonJS（例如 `@babel/preset-env` 中的 `modules: 'commonjs'`），静态分析就会失效，Tree-shaking 彻底瘫痪。
    2.  **副作用 (Side Effects) 阻挠**：Webpack 不敢随意删除看起来没被引用的代码，因为它怕这段代码有“副作用”（比如它偷偷向全局 `window` 注入了变量，或者它是一个纯粹用来引入全局样式的 `import './style.css'`）。
    3.  **解决方案**：在项目的 `package.json` 中配置 `"sideEffects": false`，明确告诉 Webpack 这个项目里的模块都是纯净的，放心大胆地删。如果要保留样式文件，配置为 `"sideEffects": ["*.css", "*.less"]`。


### 4.5 如何精准定位是哪一步拖慢了 Webpack 的打包速度，又是哪个包导致了体积过大？
*   **答**：在做性能优化前，**切忌盲目猜测**，必须依赖分析工具。
    *   **体积分析 (Bundle Size)**：使用 `webpack-bundle-analyzer` 插件。它会在构建完成后打开一个可视化网页，用矩形树图清晰地展示每一个文件的体积占比。你一眼就能看出是不是不小心把整个 `echarts` 或 `moment.js` 全量打包进去了。
    *   **速度分析 (Build Speed)**：使用 `speed-measure-webpack-plugin`。它会精确测算并打印出每一个 Loader 和 Plugin 的执行耗时，帮你揪出构建过程中的“性能刺客”。

### 4.6 `thread-loader` (多进程) 是不是只要配了就一定会变快？
*   **答**：**绝对不是，有时反而会变慢！**
    *   **原因**：Node.js 开启工作进程（Worker）以及在主进程与子进程之间进行跨进程通信（IPC），本身是有极大性能开销的（大概需要 600ms 的启动时间）。
    *   **避坑指南**：对于小型项目，或者处理极少量文件的 Loader 规则上，开启多线程的消耗远远大于收益，会导致构建更慢。只有针对**超大型项目的 Babel 转换、Terser 压缩等极度消耗 CPU 的操作**，才建议开启。

### 4.7 什么是 Runtime Chunk？为什么优化长期缓存必须抽离它？
*   **答**：
    *   **背景**：Webpack 打包后，会生成一段管理模块间依赖关系和加载逻辑的底层引导代码，这就是 Runtime 代码。
    *   **痛点**：如果你修改了 `app.js` 的业务代码，它的 chunkhash 会变。因为 `app.js` 的名字变了，记录所有模块映射关系的 Runtime 代码也会跟着变。如果 Runtime 代码恰好被打包在了 `vendors.js`（第三方库）中，就会导致哪怕第三方库一行没改，`vendors.js` 的 hash 也会被迫改变，从而导致用户浏览器中的巨大的 Vendors 缓存无辜失效。
    *   **解决方案**：在 `optimization` 中配置 `runtimeChunk: 'single'`。强行把这段极其微小但频繁变动的 Runtime 逻辑剥离成一个独立的 `runtime.js` 文件，从而彻底保护 `vendors.js` 的长期缓存。

