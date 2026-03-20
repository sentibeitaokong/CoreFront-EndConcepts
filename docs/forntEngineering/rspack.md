---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# [Rspack](https://www.rspack.dev/zh/guide/start/introduction) 核心配置详解 (Rust-based Webpack Alternative)

## 1. 核心概念与特性

**Rspack** 是由字节跳动开发并开源的基于 Rust 的高性能 Web 构建工具。它的核心设计哲学是：**在提供与 Webpack 极其相似的 API 和生态兼容性的同时，带来 10 倍到 100 倍的构建速度提升。**

如果说 Vite 是通过“Bundleless (不打包)”绕过了性能瓶颈，那么 Rspack 则是通过“Rust 多核并发计算”正面击碎了打包性能瓶颈。

| 核心特性 | 深度解析与工程价值 |
| :--- | :--- |
| **极致性能 (Rust 底层)** | 核心模块由 Rust 编写，天生支持多线程并发编译。无论是冷启动还是 HMR（热更新），在巨型项目中都能达到毫秒级响应。 |
| **高度兼容 Webpack** | Rspack 实现了绝大多数 Webpack 的 API 规范。你可以直接无缝复用绝大多数已有的 Webpack Loaders (如 `less-loader`) 和 Plugins。 |
| **开箱即用的内置能力** | Rspack 内置了由 Rust 编写的 SWC (处理 TS/JSX) 和原生 CSS 处理机制。这意味着你**不再需要**安装臃肿的 Babel、`css-loader` 或 `MiniCssExtractPlugin`。 |
| **模块联邦 (Module Federation)** | 提供了一等公民级别的 Module Federation 支持，是构建大型微前端架构的极佳选择。 |

## 2. 核心配置深度拆解

Rspack 的配置文件通常命名为 `rspack.config.js`。如果你熟悉 Webpack，你会发现它的结构几乎一模一样，但**配置量大幅减少**，因为很多底层脏活被 Rspack 内部消化了。

| 配置属性 | 作用描述 | Rspack 的开箱即用优势 |
| :--- | :--- | :--- |
| **`entry`** | **入口**：告诉 Rspack 从哪个文件开始打包。 | 与 Webpack 一致，支持单入口和多入口。 |
| **`output`** | **出口**：打包后的文件叫什么，存放在哪。 | 默认原生支持各种 hash 命名策略和目录清理。 |
| **`resolve`** | **解析**：配置文件路径别名和后缀自动补全。 | 与 Webpack 完全一致。 |
| **`module`** | **模块转换**：告诉 Rspack 遇到不同文件该怎么办。 | **极大简化！** 原生支持 CSS/CSS Modules；内置 swc-loader 极速处理 TS/JSX。 |
| **`plugins`** | **插件**：执行自动化任务（如生成 HTML）。 | 官方提供内置的 `HtmlRspackPlugin`，无需额外安装第三方包。 |

### 2.1 现代 Rspack 标准配置模板 (React + TS + Less 示例)

```js
// rspack.config.js
const path = require('path');
const rspack = require('@rspack/core'); // 引入 rspack 核心包

module.exports = {
  // 1. 基础入口与出口 (与 Webpack 完全一致)
  entry: {
    main: './src/index.tsx'
  }, 
  // 2. 出口配置
  output: {
      // 必须是绝对路径
      path: path.resolve(__dirname, 'dist'),
      // [name] 对应 entry 中的 key (即 main)
      // [contenthash:8] 根据文件内容生成 8 位哈希值，用于清除浏览器缓存
      filename: '[name].[contenthash:8].js',
      clean: true, // 每次打包前自动清空 dist 目录
  },
  // 3. 模块解析配置
  resolve: {
      // 导入以下文件时可以省略后缀名
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      // 配置路径别名，使用 @ 代替 src 绝对路径
      alias: {
          '@': path.resolve(__dirname, 'src')
      }
  },
  // 3. 模块转换 (Rule 配置大幅简化)
  module: {
    rules: [
      {
        // 处理 JS/TS/JSX/TSX 文件
        test: /\.(j|t)sx?$/,
        exclude: /node_modules/, // 排除第三方库，提升编译速度
        // 🚀 杀手锏：使用 Rspack 内置的 swc-loader 替代 babel-loader 和 ts-loader
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: { react: { runtime: 'automatic' } } // 支持 React 17+ 新 JSX 转换
            },
            env: { targets: 'Chrome >= 80' } // 类似 babel-preset-env 的语法降级
          }
        }
      },
      {
        test: /\.less$/,
        // 🚀 杀手锏：Rspack 原生支持 CSS！
        // 不需要 style-loader, css-loader, MiniCssExtractPlugin！
        // 只需要用 less-loader 把 less 转成 css，剩下的 Rspack 会自动处理(包括生产环境的物理抽离)
        type: 'css', 
        use: ['less-loader']
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        // 完全继承 Webpack 5 的 Asset Modules
        type: 'asset/resource' 
      }
    ]
  },

  // 4. 插件体系
  plugins: [
    // 使用 HtmlRspackPlugin 替代 HtmlWebpackPlugin
    new rspack.HtmlRspackPlugin({
      template: './index.html'
    })
  ],

  // 5. 优化配置
  optimization: {
    minimizer: [
      // 使用内置的 SWC 压缩器替代 Terser，速度极快
      new rspack.SwcJsMinimizerRspackPlugin(),
      new rspack.LightningCssMinimizerRspackPlugin() // 极速 CSS 压缩
    ],
    splitChunks: {
      chunks: 'all' // 代码分割策略与 Webpack 完全一致
    }
  }
};
```

### 2.2 本地开发服务器 (DevServer) 基础配置

在本地开发时，我们需要启动一个服务器，支持页面自动刷新、热模块替换（HMR）以及解决接口跨域问题。Rspack 的 `devServer` 配置与 Webpack Dev Server 几乎 100% 兼容。

```js
module.exports = {
  // ...前面的基础配置
  
  // 仅在开发环境启用的 SourceMap，方便在 F12 控制台定位报错源码
  devtool: 'eval-cheap-module-source-map',

  devServer: {
    port: 3000,         // 指定本地服务端口号
    open: true,         // 启动后自动在浏览器中打开页面
    hot: true,          // 开启热模块替换 (HMR)，修改代码后局部更新，不刷新整个页面
    compress: true,     // 开启 gzip 压缩，加快本地加载速度
    
    // 解决单页应用 (SPA) 在 History 路由模式下，刷新页面报 404 的问题
    historyApiFallback: true, 

    // 配置接口代理，解决本地开发跨域问题
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // 实际后端接口地址
        changeOrigin: true,              // 欺骗服务器，修改请求头中的 host 为 target
        pathRewrite: { '^/api': '' }     // 将请求路径中的 /api 前缀抹掉
      }
    }
  }
};
```

## 3. 生产环境性能优化配置实战

在生产环境中，我们需要的是**体积最小化**。这通常涉及代码压缩和物理抽离。

### 3.1 极速内置压缩 (Minification)

在传统的 Webpack 项目中，`TerserPlugin`（压缩 JS）和 `CssMinimizerPlugin`（压缩 CSS）是拖慢生产环境构建速度的绝对罪魁祸首。
Rspack 在内部集成了基于 Rust 的强力压缩引擎（SWC 和 Lightning CSS），你只需要使用官方提供的内置插件，即可实现**10倍以上的压缩提速**。

```js
// rspack.config.js (生产环境配置)
const rspack = require('@rspack/core');

module.exports = {
  mode: 'production',
  // ... 其他配置
  
  optimization: {
    minimize: true, // 开启压缩
    minimizer: [
      // 1. JS 极速压缩：替代 TerserPlugin
      new rspack.SwcJsMinimizerRspackPlugin({
        compress: {
          drop_console: true, // 生产环境自动移除 console.log
          passes: 2           // 优化通道次数，次数越多压缩率越高，但略微耗时
        }
      }),
      // 2. CSS 极速压缩：替代 CssMinimizerPlugin (底层使用 Mozilla 的 Lightning CSS)
      new rspack.LightningCssMinimizerRspackPlugin()
    ]
  }
};
```

### 3.2 极致的代码分割 (Code Splitting)

将所有代码打进一个大包会导致首屏白屏。Rspack 的 `splitChunks` 配置 API 与 Webpack 5 完全保持一致。

```js
module.exports = {
  // ...
  optimization: {
    splitChunks: {
      chunks: 'all', // 对所有类型的引入(同步和 import()异步)进行分割
      maxInitialRequests: 5, // 首屏允许的最大并发请求数
      minSize: 20000,        // 大于 20kb 的模块才值得拆分
      
      cacheGroups: {
        // 将 React/Vue 等前端核心框架单独抽出，充分利用长期缓存
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|vue)[\\/]/,
          name: 'framework',
          priority: 20, // 优先级最高
        },
        // 将剩余的所有第三方库打入 vendors 包
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        // 将被多个页面复用的公共业务代码抽出
        commons: {
          name: 'commons',
          minChunks: 2, 
          priority: 5,
        }
      }
    },
    // 保护由于文件名变动导致的 vendor 缓存失效
    runtimeChunk: 'single' 
  }
};
```

## 4. 微前端基石：模块联邦 (Module Federation) 支持

**模块联邦 (Module Federation, 简称 MF)** 是 Webpack 5 推出的一项革命性技术，它允许不同的独立构建之间在运行时动态地共享模块。**Rspack 对 MF 提供了一等公民级别的原生支持，且 API 100% 兼容 Webpack。**

这也是字节跳动等巨型企业选择研发 Rspack 的核心原因之一：Vite 在微前端领域的表现并不尽如人意，而 Rspack 完美继承了 MF 的强大能力，同时赋予了它闪电般的构建速度。

### 4.1 模块联邦实战配置

假设我们有两个独立的项目：`Host`（基座应用）和 `Remote`（微应用）。`Remote` 想暴露出一个 `Button` 组件给 `Host` 使用。

**1. 远程应用 (Remote) 配置：暴露组件**
```js
// remote/rspack.config.js
const { ModuleFederationPlugin } = require('@rspack/core').container;

module.exports = {
  // ... 基础配置
  plugins: [
    new ModuleFederationPlugin({
      name: 'remote_app',       // 远程应用的唯一名称
      filename: 'remoteEntry.js', // 暴露给外部加载的清单文件
      // 声明对外暴露的模块
      exposes: {
        './Button': './src/components/Button.jsx', 
      },
      // 声明依赖共享，避免 Host 和 Remote 重复加载两份 React 导致崩溃
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true }
      }
    })
  ]
};
```

**2. 基座应用 (Host) 配置：消费组件**
```js
// host/rspack.config.js
const { ModuleFederationPlugin } = require('@rspack/core').container;

module.exports = {
  // ... 基础配置
  plugins: [
    new ModuleFederationPlugin({
      name: 'host_app',
      // 声明要从哪些远端加载资源
      remotes: {
        // remote_app 是对方定义的 name，后面的 URL 是对方服务的地址
        remoteApp: 'remote_app@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true }
      }
    })
  ]
};
```
在 Host 的业务代码中，只需动态导入即可使用跨项目的组件：
`const RemoteButton = React.lazy(() => import('remoteApp/Button'));`

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 经典面试题：既然 Vite 那么快，为什么字节还要去造一个 Rspack？它们怎么选？
*   **答**：这是底层架构理念的区别。
    *   **Vite 的局限**：Vite 在开发环境使用 `ESM + Bundleless`。对于几百个文件的中小型项目极其丝滑。但字节内部有成千上万个模块的**史诗级巨型项目**，如果用 Vite，浏览器在刷新时瞬间发起上万个 HTTP 请求，会导致浏览器网络层直接崩溃（请求瀑布流）。且 Vite 开发环境（不打包）和生产环境（Rollup 打包）机制不同，容易产生“开发好好的，上线全挂了”的隐患。
    *   **Rspack 的破局**：Rspack 和 Webpack 一样，坚持 **Bundle-based (必须打包)**。它保证了开发和生产环境产物行为的一致性，同时利用 Rust 暴力拉升了打包速度。
    *   **选型建议**：中小型项目、Vue 生态优先选 **Vite**；巨型企业级项目、极其沉重的 Webpack 历史老项目迁移、微前端（Module Federation）重度用户优先选 **Rspack**。

### 5.2 我有一个很老的 Webpack 项目，可以直接把 `webpack` 命令换成 `rspack` 吗？
*   **答**：**不能做到 100% 零成本一键切换，但迁移成本极低。**
    *   **兼容部分**：核心的 `entry`, `output`, `resolve`, 以及绝大多数标准的 Loader（如 `less-loader`, `vue-loader`）都是直接兼容的。
    *   **需要修改的部分**：
        1. 必须移除 Babel 相关的 loader，替换为 `builtin:swc-loader`。
        2. 必须移除 `MiniCssExtractPlugin`，改为使用 `type: 'css'`。
        3. 必须移除 `HtmlWebpackPlugin`，替换为官方提供的 `@rspack/html-rspack-plugin`。
        4. 某些利用了极度底层的 Webpack 钩子手写的自定义 Plugin，可能需要重新适配。

### 5.3 我的老项目深度依赖 Babel 自己写的一些特定 AST 插件（如按需注入埋点），Rspack 支持吗？
*   **答**：**面临两难选择。**
    *   Rspack 底层使用 SWC (Rust) 进行语法转换，它**不认识** JS 写的 Babel 插件。
    *   **妥协方案**：你依然可以在 Rspack 中配置使用 `babel-loader`。Rspack 也是兼容的！但代价是，代码转换工作又回到了 JS 单线程中，你会**丧失 Rspack 带来的大部分性能提升**。
    *   **终极方案**：使用 Rust / WASM 重写你的定制化 Babel 插件并接入 SWC 体系（学习成本较高）。

### 5.4 Rspack 的 `builtin` 属性为什么在最新的文档里找不到了？
*   **答**：**历史演进遗留问题。**
    *   在 Rspack 早期版本（0.x），团队试图通过一个巨大的 `builtins` 对象来包揽所有的功能（如 html 压缩、css 提取），从而区别于 Webpack。
    *   但随着版本迭代，为了实现**对 Webpack 终极完美的兼容**，Rspack 团队在接近 1.0 版本时转变了方向。他们废弃了 `builtins` 顶层配置，转而鼓励使用更加 Webpack-native 的方式：即通过 `module.rules` 中的 `builtin:swc-loader` 和各种原生的 `RspackPlugin` 来配置。编写现代 Rspack 配置时，请**坚决拥抱 Webpack 的心智模型**。

### 5.5 为什么 Rspack 不需要安装 `css-loader` 和 `style-loader`？
*   **答**：这是 Rspack 相较于 Webpack 的巨大体验提升。
    *   **Webpack 痛点**：Webpack 本质上只懂 JS。要把 CSS 塞进页面，必须经过 `css-loader`（解析 CSS 语法）和 `style-loader`（生成 `<style>` 标签插入 DOM）这两道繁琐的工序。
    *   **Rspack 优势**：Rspack 在其 Rust 底层直接将 CSS 设计为**一等公民**。当你配置 `type: 'css'` 时，Rspack 内部会自动处理 CSS 的导入、热更新，甚至在生产环境（`mode: 'production'`）下自动将 CSS 物理抽离为单独的 `.css` 文件。这一切都无需任何外挂 Loader 和 Plugin。

### 5.6 如果 Rspack 默认只用 `builtin:swc-loader`，那遇到老旧浏览器的兼容性要求怎么办？
*   **答**：`swc-loader` 完全具备类似于 Babel 的语法降级能力。
    *   你只需在 `swc-loader` 的 `options` 中配置 `env: { targets: "..." }` 属性。
    ```js
    use: {
      loader: 'builtin:swc-loader',
      options: {
        env: {
          // 根据 Browserslist 规范指定你需要兼容的浏览器版本
          targets: "> 0.25%, not dead, IE 11" 
        }
      }
    }
    ```
    *   配置后，SWC 引擎在编译时会自动将高阶的 ES6+ 语法安全地降级转换为目标浏览器认识的老旧语法。

### 5.7 Rspack 既然原生支持 CSS，为什么有时还需要配置 PostCSS？
*   **答**：Rspack 的原生 CSS 支持（`type: 'css'`）主要负责 CSS 模块的引入、HMR 热更新以及物理提取打包。
    *   **它的盲区**：原生功能目前无法执行复杂的 CSS 降级转换（比如自动添加浏览器前缀 `-webkit-`），也无法处理像 Tailwind CSS 这种基于编译的原子化样式框架。
    *   **应对策略**：如果你需要处理兼容性前缀或使用 Tailwind，你仍然需要在 Rspack 中配置传统的 `postcss-loader`，并传入相应的 PostCSS 插件。

### 5.8 为什么开启了 `SwcJsMinimizerRspackPlugin`，我的代码依然没有被压缩？
*   **答**：
    *   **原理**：在 Webpack/Rspack 的架构设计中，压缩插件是挂载在 `optimization.minimizer` 数组中的。但是，这个数组里的插件**只会在 `optimization.minimize` 为 `true` 时才会被触发执行**。
    *   **避坑指南**：很多开发者只配置了插件，却忘记了打开总开关。必须确保 `mode: 'production'`（这会自动开启 minimize）或者显式声明 `minimize: true`。

### 5.9 在微前端 Module Federation 中，`shared: { singleton: true }` 到底有什么用？
*   **答**：这是微前端架构中极其关键的防崩溃配置。
    *   **痛点**：假设你的基座应用自带了一份 `React v18`，它动态加载了一个微应用，微应用里也打包了一份 `React v18`。当微应用渲染时，页面上同时存在两个 React 实例的上下文。由于 React 的底层机制限制（特别是 Hooks），跨实例的状态共享会瞬间导致程序抛出红色致命错误。
    *   **作用**：配置 `singleton: true` 会强制 Rspack 在运行时进行仲裁。如果基座已经加载了 React，微应用就会**放弃使用自己的 React**，直接共享并挂载到基座的 React 实例上。这保证了全局上下文的绝对纯净和单一。


