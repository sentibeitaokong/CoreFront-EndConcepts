---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# [Vite](https://cn.vitejs.dev/guide/) 核心配置与性能优化

## 1. 核心概念与底层原理

在 Webpack 统治前端多年的背景下，**Vite**（法语意为“快”）以破局者的姿态诞生。理解 Vite 的配置与优化，必须先彻底明白它与 Webpack 在底层架构上的**本质区别**。

| 核心差异点           | Webpack (Bundle-based)                                                                                          | Vite (ESM-based / Bundleless)                                                                                                                              |
| :------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **开发环境启动原理** | **先全量打包，再启动服务。** 必须把所有文件抓取、解析、编译成一坨巨大的 Bundle 才能跑起来。项目越大，启动越慢。 | **先启动服务，再按需编译。** 直接利用浏览器原生支持的 ES Modules。浏览器请求哪个文件，Vite 就用 esbuild 实时编译哪个文件。无论项目多大，启动永远是毫秒级。 |
| **热更新 (HMR)**     | 修改一个文件，可能导致整个依赖链重新打包。                                                                      | 修改一个文件，只需让浏览器重新请求该模块即可，HMR 速度不受项目体积影响。                                                                                   |
| **底层引擎**         | 使用 JavaScript 编写（慢）。                                                                                    | 开发环境预构建使用 **Go 语言编写的 esbuild**（快 10-100 倍）。                                                                                             |
| **生产环境构建**     | Webpack 自己的打包体系。                                                                                        | **Rollup**。因为在生产环境，为了极致的代码分割、Tree-shaking 和兼容性，传统的打包仍然是必要的。                                                            |

### 1.1 什么是 Bundleless（无包构建）？

在 Webpack 时代，当项目启动（`npm run dev`）时，构建工具必须从入口文件开始，构建完整的依赖图（Module Graph），并将所有的业务代码和第三方库转换、拼装成一个或几个巨大的 Bundle，最后才启动本地服务器。项目越大，冷启动和热更新（HMR）就越慢。

**Bundleless 的核心思想是：将模块解析的工作交还给浏览器。**

现代浏览器原生支持了 ES Modules (`<script type="module">`)。当浏览器遇到 `import` 时，它会自己向服务器发起 HTTP 请求获取模块。

Vite 在开发环境下的 Bundleless 流程如下：

- **秒级冷启动**：Vite 启动一个轻量级的开发服务器（基于 Connect），**不编译任何业务代码**，直接 ready。时间复杂度是 O(1)。
- **按需拦截与编译**：当浏览器解析到 `import { ref } from 'vue'` 或 `import App from './App.vue'` 时，会向 Vite 服务器发送 HTTP 请求。
- **即时转换（Transform）**：Vite 拦截到请求后，通过内部的插件流水线（Plugin Pipeline），**即时**将请求的文件编译成浏览器能看懂的原生 JavaScript，并返回。
- **极致的热更新**：修改某个文件时，Vite 只需要让浏览器重新请求这一个文件，而不需要像 Webpack 那样重新构建相关的整个依赖链。

### 1.2 vite实现原理

#### 1.2.1 基于原生 ESM 的按需编译服务 (Dev Server)

- **核心逻辑**：利用现代浏览器原生支持 `<script type="module">` 这一特性，将原本属于打包工具的“模块解析与抓取”工作，巧妙地转移给了浏览器。
- **请求拦截与转换**：底层通过 `connect` 启动本地开发服务器，实时拦截浏览器因 `import` 语句产生的 URL 请求。
- **即时编译 (JIT)**：在请求到达服务端时，Vite 会动态调用对应的插件流（Transform Plugin）完成代码的即时编译，随后以原生 ESM 格式将结果响应给浏览器。做到了“用到哪个文件，才编译哪个文件”。

#### 1.2.2 依赖预构建 (Deps Optimize)

- **格式兼容化**：由于前端生态中仍存在大量 CommonJS 或 UMD 格式的第三方包，Vite 利用 `esbuild` 将其统一转换为 ESM 格式，确保浏览器能够无缝解析。
- **请求合并降维**：借助 `esbuild` 的超强性能（Go 语言编写的多线程优势），将那些内部包含成百上千个相互引用的小模块的依赖库（例如 `lodash-es`），打包合并成单个或少量的模块，彻底消除了导致浏览器卡死的“请求瀑布流”问题。
- **状态追踪与持久化**：预构建产物被输出至 `node_modules/.vite` 目录，并同步生成 `metadata.json` 来持久化记录当前依赖树的 Hash 状态，避免重复构建。

#### 1.2.3 巧妙的强缓存与更新策略

- **最大化利用强缓存**：对于极少变动的第三方依赖模块，Vite 会通过响应头设置 HTTP `max-age` 强缓存策略，让浏览器直接从本地缓存读取资源，极大提升页面重载速度。
- **Hash Query 缓存失效**：在请求预打包模块的 URL 末尾，Vite 会附带基于 `metadata.json` 中记录的 Hash 值的 Query 参数（例如 `?v=xxxx`）。一旦依赖树发生变化（如 `package.json` 更新重新引发构建），Vite 只需改变这个 Query 值，即可轻松击穿浏览器旧缓存，触发精确的代码更新。

#### 1.2.4 统一的插件系统与生产构建一致性

- **双环境引擎切换**：虽然开发环境基于 ESM 实现了极速体验，但生产环境为了获得极致的 Tree-Shaking、代码分割和兼容性保障，Vite 依然选择调用 `Rollup` 进行传统的全量打包。
- **API 级兼容**：最精妙的设计在于，Vite 的自定义插件 API 深度兼容了 Rollup 的插件体系。这意味着开发者编写的绝大多数 Transform 代码，可以在开发环境（实时编译）和生产环境（全量打包）通用，从根本上抹平了不同构建引擎带来的“环境差异”。

#### 1.2.5 高效的模块热更新 (HMR)

- **文件系统监听**：服务端基于 `chokidar` 实时且精准地监听本地物理文件的增删改动作。
- **精准失效与 WebSocket 推送**：服务端与客户端（浏览器中注入的轻量级 HMR runtime）通过 `WebSocket` 保持长连接。当监听到文件变更时，Vite 会迅速计算出模块失效边界（HMR Boundary），并通过 WebSocket 向客户端发送更新指令。客户端仅需重新拉取受影响的极少部分模块代码并替换，实现了复杂度始终保持在 O(1) 级别的超快热更体验。

### 1.3 Vite 的完整生产构建过程 (Build Process)

在执行 `npm run build` 时，Vite **完全抛弃了 Bundleless，转向了传统的打包模式**。

为什么生产环境不能用 Bundleless？
因为嵌套的 `import` 会导致深层的网络请求瀑布（Network Waterfall），这在存在网络延迟的真实生产环境中是致命的。为了获得最佳的首屏加载性能、代码压缩和极致的 Tree-Shaking，必须进行打包。

Vite 的生产构建底层交给了 **Rollup**。其核心流程可以看作一个巨大的 AST（抽象语法树）处理流水线：

#### 1.3.1 解析入口 (Resolve)

Vite 通常以 `index.html` 作为入口。它内部使用了一个插件来解析 HTML，提取出里面所有的 `<script type="module" src="...">`，将这些外部脚本作为真正的构建入口传给 Rollup。

#### 1.3.2 构建模块图 (Module Graph Construction)

Rollup 从入口开始，递归解析每一个文件。对于每一个文件，都会依次触发 Vite 插件系统的核心生命周期钩子：

- **`resolveId`**：解析模块的绝对路径（比如将 `@/components/Button` 映射为 `/src/components/Button.vue`）。
- **`load`**：读取文件系统中的源码内容。
- **`transform`**：**这是最核心的环节**。源码在这里被转化为 AST，进行各种魔改。比如 `@vitejs/plugin-vue` 会在这里将 Vue 的单文件组件（SFC）拆解、编译，转译成 JS 渲染函数；Babel 或 Esbuild 也会在这里将 TypeScript 降级为 JavaScript。

#### 1.3.3 依赖分析与 Tree-Shaking

所有模块转换成标准的 ESM JS 代码后，Rollup 会分析整个依赖树中的静态 `import` 和 `export`，将没有被实际使用到的死代码（Dead Code）直接在内存中剔除。

#### 1.3.4 代码分割与优化 (Chunking & Optimization)

为了避免最终生成一个几十 MB 的 JS 文件，Vite 会进行代码分割（Code Splitting）：

- 通常会将 `node_modules` 中不变的依赖（如 Vue、Vue-Router）单独拆分为一个 `vendor.js`。
- 将异步引入的组件（`() => import('./views/Home.vue')`）拆分成独立的文件，实现按需加载。

#### 1.3.5 最终输出 (Generate)

通过压缩器（通常依然是 Esbuild，因为它比 Terser 快得多）压缩代码体积，混淆变量名，最后输出到 `dist` 目录，并注入到压缩后的 `index.html` 中。

### 1.4 完整流程图

![Logo](/img/vite.png)

## 2.Vite 凭什么这么快？

Vite（法语“快”的意思）之所以能在毫秒级启动，核心在于它在开发环境和生产环境采用了**两套完全不同的架构模型**。

### 2.1 开发服务器的“按需编译” (Native ESM)

- **传统打包器 (Webpack/Rollup)**：冷启动时，必须抓取整个应用的代码，解析 AST，处理依赖关系，最终打包成一个或多个庞大的 Bundle（哪怕你只改了一行代码），然后才启动服务器。项目越大，启动越慢。
- **Vite 模式 (No-Bundle)**：直接启动服务器！Vite 将应用代码交由浏览器接管。现代浏览器原生支持 `<script type="module">`，当浏览器解析到 `import './App.jsx'` 时，会主动向 Vite 发起 HTTP 请求。Vite 服务器拦截请求，**只在这个时候才对目标文件进行极其轻量的编译（如 JSX 转 JS）并返回**。
- **本质**：这是一种 **“懒加载”** 的极致体现。不管项目有 100 个文件还是 10 万个文件，冷启动时间几乎是常数（因为只编译首页用到的那几个文件）。

### 2.2 依赖预构建 (Dependency Pre-bundling) 与 Esbuild

虽然业务代码可以按需编译，但 `node_modules` 里的第三方依赖不能直接扔给浏览器。

- **CommonJS/UMD 转换**：浏览器不支持 `require`，Vite 必须将旧规范的包转化为 ESM。
- **性能优化（减少 HTTP 请求）**：有些包（如 `lodash-es`）内部有多达 600 个内部模块的互相 `import`。如果让浏览器直接发请求，瞬间 600 个网络请求会让浏览器直接卡死。
- **Esbuild 的降维打击**：Vite 在首次冷启动前，会使用用 **Go 语言**编写的 `Esbuild`（速度比 JS 编写的打包器快 10-100 倍）扫描所有的依赖，并将它们预先打包成单个或少数几个模块，缓存在 `node_modules/.vite` 中。

### 2.3 生产环境的稳健打包 (Rollup)

开发时用 ESM 非常快，但在生产环境如果依然保留成百上千个小文件的 HTTP 请求，会导致严重的网络性能问题（即使有 HTTP/2）。
因此，Vite 在生产环境（`vite build`）会无缝切换到 **Rollup** 进行打包。Rollup 在 Tree-shaking（摇树优化）、代码分割（Code Splitting）和 CSS 处理上拥有极其成熟的生态。

### 2.4 毫秒级的热更新 (HMR)

在 Webpack 中，修改一个文件可能会导致整个 Bundle 重新构建。在 Vite 中，HMR 是建立在原生 ESM 上的。当修改一个模块时，Vite 只需要**让浏览器重新请求这一个被修改的模块**，真正的 O(1) 复杂度。

## 3. Vite 核心基础配置实战

Vite 的配置以极简著称，通常位于根目录的 `vite.config.js` 或 `vite.config.ts`。

```js
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react' // 或者 @vitejs/plugin-vue
import path from 'path'

// defineConfig 可以提供完整的类型提示
// 传入函数可以根据不同的命令(serve/build)和模式(development/production)返回不同配置
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // ----------------- 基础配置 -----------------
    root: process.cwd(), // 项目根目录（index.html 所在位置）
    base: env.VITE_PUBLIC_PATH || '/', // 部署到生产环境的公共基础路径（非常重要！）
    publicDir: 'public', // 静态资源服务文件夹，打包时会原样复制到 dist

    // ----------------- 模块解析 -----------------
    resolve: {
      alias: {
        // 配置路径别名，配合 tsconfig.json 的 paths 使用
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
      },
      // 导入时想要省略的扩展名列表（不建议省略 .vue 和 .jsx，会影响 IDE 推断）
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    // ----------------- 开发服务器配置 -----------------
    server: {
      host: '0.0.0.0', // 监听所有地址，方便局域网和手机访问
      port: 3000, // 指定端口
      strictPort: true, // 设为 true 时如果端口被占用会直接退出，而不是自动尝试下一个端口
      open: true, // 启动时自动在浏览器中打开
      cors: true, // 允许跨域
      proxy: {
        // 核心：开发环境的反向代理，解决跨域问题
        '/api': {
          target: 'http://backend-server.com',
          changeOrigin: true, // 将请求头中的 host 替换为 target
          rewrite: path => path.replace(/^\/api/, ''), // 重写路径
        },
      },
    },
    //依赖预构建
    optimizeDeps: {
      include: ['lodash-es', 'vue'],
      exclude: ['@your-custom/library'],
    },

    // ----------------- 生产环境构建配置 (Rollup) -----------------
    build: {
      outDir: 'dist', // 指定输出路径
      assetsDir: 'assets', // 指定生成静态资源的存放路径
      sourcemap: false, // 生产环境关闭 sourcemap 以减小体积和防泄露源码
      target: 'es2015', // 浏览器兼容性目标
      minify: 'esbuild', // 默认使用 esbuild 极速压缩，也可选 'terser' (需额外安装)
      chunkSizeWarningLimit: 1000, // 消除单文件超过 500kb 的警告
      rollupOptions: {
        output: {
          // 核心性能优化：手动分包 (Manual Chunks)
          // 将第三方库与业务代码分离，利用浏览器缓存机制
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['antd', '@ant-design/icons'], // 或 'element-plus'
          },
        },
      },
    },

    // ----------------- 插件系统 -----------------
    plugins: [
      react(), // 提供 React JSX 编译和 Fast Refresh 支持
      // vue(),
      // AutoImport({ ... }), // Vue 生态常用的自动导入插件
    ],

    // ----------------- CSS 预处理器 -----------------
    css: {
      preprocessorOptions: {
        scss: {
          // 自动注入全局变量文件，不用每个文件手动 @import
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
  }
})
```

## 4. Vite 性能优化大杀器 (企业级调优)

由于 Vite 开发环境和生产环境的机制完全不同，我们的优化策略也必须分环境进行。

### 4.1 开发环境提速：精确控制 `optimizeDeps` (预构建)

**痛点**：Vite 是基于 ESM 的，但 `node_modules` 里有很多包依然是 CommonJS 规范（如 React）；且某些包包含成百上千个小文件（如 lodash-es）。如果不处理，浏览器会瞬间发起几千个 HTTP 请求，直接卡死。

**原理**：Vite 在首次启动时，会用 esbuild 把这些依赖提前抓取，转成单一的 ESM 模块并缓存起来。这就是**依赖预构建 (Pre-bundling)**。

```js
// vite.config.js
export default defineConfig({
  optimizeDeps: {
    // 强制预构建：当你动态 import 某个极深层级的依赖时，Vite 默认刚开始发现不了它。
    // 等跳到那个页面发现了，会触发重新预构建并导致页面刷新。
    // 把这类隐蔽的依赖写进 include，可以杜绝开发时的突然刷新。
    include: ['echarts', 'lodash-es', 'axios'],

    // 排除预构建：对于一些自己写的本地链接库，希望保持实时热更新，不让 Vite 缓存它
    exclude: ['my-local-custom-ui-lib'],
  },
})
```

### 4.2 生产环境瘦身：Rollup 分包策略 (ManualChunks)

默认情况下，Vite 生产打包会把所有的依赖全塞进一个 `index-[hash].js` 中，导致首屏加载极慢。我们必须利用底层的 `rollupOptions` 进行代码分割。

```js
// vite.config.js
export default defineConfig({
  build: {
    // 启用 esbuild 压缩，比 Terser 快数十倍
    minify: 'esbuild',

    rollupOptions: {
      output: {
        // 核心：静态资源分类归包
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]',

        // 核心：超大依赖强行剥离
        manualChunks(id) {
          // 将 node_modules 里的代码全部剥离到一个 vendors.js 中
          if (id.includes('node_modules')) {
            // 可以进一步细分：
            if (id.includes('vue') || id.includes('vue-router')) {
              return 'vue-core' // vue 核心库
            }
            if (id.includes('echarts')) {
              return 'echarts' // 图表库极其庞大，必须单独拆分
            }
            return 'vendors' // 其他第三方库
          }
        },
      },
    },
  },
})
```

### 4.3 生产环境瘦身：剔除 console 与 Gzip 压缩

```js
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    // 开启 gzip 压缩，体积骤降，需 Nginx 配合 gzip_static on
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 大于 10kb 的文件才压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
  ],
  build: {
    // 极速剔除 console 和 debugger
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
})
```

## 5. Vite 微内核架构

在现代软件工程中，**微内核架构（Microkernel Architecture）** 的核心思想是“机制与策略分离”：内核只保留最核心、最基础的调度能力（机制），而将所有的业务逻辑和功能扩展下放到独立的服务中（策略）。

当我们用微内核的视角来审视 Vite 时，会发现它的设计简直是这一哲学在前端工程化领域的完美复刻。

### 5.1 Vite 的微内核哲学模型

在 Vite 的世界里，系统被清晰地划分为“内核态”和“用户态（插件态）”：

- **内核态（Vite Core）：** Vite 的核心代码极其精简。它只负责三件事：
  - **启动一个基础的 HTTP/WebSocket 服务器**（提供宿主环境）。
  - **维护 Module Graph（模块依赖图谱）**（提供状态管理）。
  - **串联并调度生命周期钩子**（提供进程间通信 IPC 与执行总线）。
    _Vite 内核本身甚至不认识 Vue、React，也不懂如何编译 TypeScript 或 Less。_

- **用户态（Vite Plugins）：** 所有的功能，包括对 Vue SFC 的解析、对 TS 的降级、对 CSS 的处理、甚至对图片资源的加载，**统统作为独立的插件（Plugin）运行在内核之外**。

### 5.2 核心钩子解构：从微内核“系统调用”视角审视

Vite 的流水线本质上就是内核向外广播的“系统中断（Interrupts）”和“系统调用（System Calls）”。架构师必须深刻理解以下 5 个核心钩子在系统底层的真正含义。

#### 5.2.1 `resolveId` —— 地址空间映射 (Address Translation)

- **前端含义：** 拦截模块的 `import` 路径，决定这个模块最终去哪里寻找。
- **微内核视角：** 这相当于操作系统的**虚拟内存寻址（MMU）**或**文件系统路由**。
- **深度解构：**
  当业务代码发起 `import { ref } from 'vue'` 时，内核并不知道 `vue` 在哪。内核通过触发 `resolveId` 询问所有的插件：“谁能帮我解析这个地址？”。
  插件可以将其映射为物理硬盘上的绝对路径（如 `node_modules/...`），也可以将其映射为一个不存在的“虚拟地址”（如 `\0virtual:module`），从而实现**虚拟文件系统**的能力。

#### 5.2.2 `load` —— 硬件 I/O 抽象 (Virtual I/O)

- **前端含义：** 根据 `resolveId` 确定的路径，读取模块的内容。
- **微内核视角：** 相当于操作系统的**磁盘 I/O 驱动**。
- **深度解构：**
  内核本身不关心文件是怎么读出来的。默认情况下，内核会去读硬盘。但如果某个插件拦截了 `load` 钩子，它就可以直接在内存中生成一段字符串返回给内核。这种设计彻底**解耦了“模块”与“物理硬盘”的绑定关系**。你可以通过它把数据库里的一条记录，伪装成一个正常的 JS 模块加载进来。

#### 5.2.3 `transform` —— 指令集翻译 (Instruction Translation)

- **前端含义：** 接收模块的源码，并将其转换为浏览器能运行的 JS/CSS。
- **微内核视角：** 相当于虚拟机的**即时编译（JIT）**或**指令集翻译层**（如 Apple 的 Rosetta）。
- **深度解构：**
  这是插件做“微创手术”的核心战场。不管是 TypeScript、JSX 还是 Vue Template，在内核看来都是无法执行的“异构指令”。插件在此钩子中接管源码，利用 AST（抽象语法树）将其翻译为标准的 ECMAScript。这种设计让 Vite 内核具备了**无限的跨语言扩展能力**。

#### 5.2.4 `configureServer` —— 内核空间提权 (Kernel Space Extension)

- **前端含义：** 访问并配置 Vite 底层的开发服务器实例（Connect 实例）。
- **微内核视角：** 相当于编写**内核级驱动程序（Kernel Module）**，直接向内核注入中间件。
- **深度解构：**
  这是权限极高的一个钩子。通过它，插件不仅是在处理代码，而是直接干预了网络请求的分发协议。你可以挂载自定义的 API 路由（用于本地 Mock），也可以劫持 WebSocket 连接。这使得 Vite 不仅是一个打包工具，更是一个**高可扩展的网关服务器**。

#### 5.2.5 `handleHotUpdate` —— 进程间通信与中断处理 (IPC & Interrupts)

- **前端含义：** 拦截文件的热更新事件，决定客户端页面如何刷新。
- **微内核视角：** 相当于操作系统的**中断处理程序（Interrupt Handler）**与**消息总线（Message Bus）**。
- **深度解构：**
  当物理文件发生改变时（硬件中断），内核触发该钩子。插件作为“中断处理程序”，可以精确计算出受影响的模块边界（Boundary），然后决定：是静默吞掉这个中断、局部更新某个模块，还是向客户端发送自定义的 IPC 消息（通过 WebSocket），要求客户端执行特定的恢复逻辑。

### 5.3. 调度优先级：微内核的特权级别控制 (`enforce`)

在微内核中，如果有多个系统服务同时想处理一个请求，必须有严格的优先级管理。Vite 通过 `enforce` 属性实现了“特权环（Privilege Rings）”的设计：

| 特权级别            | 属性配置          | 架构作用                                                                                                        |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **Ring 0 (前置态)** | `enforce: 'pre'`  | **最高特权。** 强制在 Vite 内核默认行为和其他普通插件之前执行。通常用于抢占式的路径劫持（Babel 解析、宏替换）。 |
| **Ring 1 (用户态)** | 默认（不填）      | **标准特权。** 按注册顺序执行。大部分业务插件（如 Vue/React 解析器）运行在此级别。                              |
| **Ring 2 (后置态)** | `enforce: 'post'` | **收尾特权。** 等所有代码都被编译为纯净的标准 JS 后执行。专用于产物体积分析、无用代码剔除、生产环境混淆。       |

## 6. Vite 自定义插件**个性化打包构建需求**

在企业级前端工程化中，当标准的 Vite 配置和社区插件（如 `@vitejs/plugin-vue`）无法满足你极其特殊的业务场景时，**手写自定义插件就是架构师的终极武器**。
编写 Vite 自定义插件的核心逻辑，就是寻找 Vite 构建流水线上的“钩子（Hooks）”，并在恰当的时机拦截、读取或篡改数据,以下是常见的几种**个性化打包需求**：

### 6.1 全局环境变量的动态注入 (Build-time Injection)

**场景：** 你的业务代码需要在运行时获取当前的**打包时间**、**Git Commit Hash** 或**部署环境版本号**，用于展示在控制台或发给监控系统。你不想每次都手动去改 `.env` 文件。

**解决思路：** 利用 `config` 钩子，在 Vite 解析完配置后、真正开始构建前，动态修改配置中的 `define` 字段。

**实战代码：**

```typescript
import type { Plugin } from 'vite'
import { execSync } from 'child_process'

export function injectBuildInfoPlugin(): Plugin {
  return {
    name: 'vite-plugin-inject-build-info',
    // config 钩子允许你在 Vite 解析配置前，强行合并自定义配置
    config() {
      // 获取当前 Git 的最后一次提交 Hash
      const commitHash = execSync('git rev-parse --short HEAD')
        .toString()
        .trim()
      const buildTime = new Date().toLocaleString()

      return {
        // 利用 Vite (ESBuild) 的 define 功能，进行全局文本替换
        define: {
          __APP_VERSION__: JSON.stringify(commitHash),
          __BUILD_TIME__: JSON.stringify(buildTime),
        },
      }
    },
  }
}
```

**业务使用：** 在业务代码中直接写 `console.log(__APP_VERSION__)`，打包时会自动被替换为真实的字符串。

### 6.2 自定义文件类型的编译器 (Custom File Loader)

**场景：** 你的团队在写组件库文档，希望能直接在 Vue 文件中 `import doc from './readme.md'`，并且希望这个 Markdown 文件能直接被当成一个 Vue 组件渲染出来，而不是当作普通字符串。

**解决思路：** 利用 `transform` 钩子。当 Vite 遇到 `.md` 文件时，拦截它，用 Markdown 解析器把它变成 HTML，然后再强行包装成一个 Vue 组件的 JavaScript 代码。

**实战代码：**

```typescript
import type { Plugin } from 'vite'
import MarkdownIt from 'markdown-it'

export function markdownToVuePlugin(): Plugin {
  const md = new MarkdownIt()

  return {
    name: 'vite-plugin-md-to-vue',
    // 强制在 Vue 核心插件之前执行，否则 Vue 插件不认识 md 里的内容
    enforce: 'pre',

    transform(code, id) {
      // 只有遇到 .md 文件才拦截处理
      if (id.endsWith('.md')) {
        // 1. 将 Markdown 文本转换为 HTML 字符串
        const html = md.render(code)

        // 2. 将 HTML 强行包装成 Vue 组件的 render 函数结构
        const vueCode = `
          import { h, defineComponent } from 'vue';
          export default defineComponent({
            render() {
              // 使用 innerHTML 的方式渲染转换后的 Markdown
              return h('div', { innerHTML: ${JSON.stringify(html)} })
            }
          })
        `
        return {
          code: vueCode,
          map: null, // 简单示例省略 sourcemap
        }
      }
    },
  }
}
```

### 6.3 开发环境的极速本地 Mock (Dev Server Middleware)

**场景：** 后端接口还没开发完，前端需要调试页面。你不想在电脑上再单独起一个 Node/Express 服务，你希望 Vite 启动时自带一个 Mock 服务器拦截特定的 API 请求。

**解决思路：** 重点利用 Vite 独有的 `configureServer` 钩子。它可以拿到 Vite 底层 HTTP 服务器（Connect 实例）的最高控制权，允许你插入自定义的中间件。

**实战代码：**

```typescript
import type { Plugin } from 'vite'

export function localMockServerPlugin(): Plugin {
  return {
    name: 'vite-plugin-local-mock',
    // 仅在 serve (开发环境) 模式下应用此插件
    apply: 'serve',

    // 拦截开发服务器
    configureServer(server) {
      // 注入自定义中间件
      server.middlewares.use((req, res, next) => {
        // 拦截以 /api/mock 开头的请求
        if (req.url?.startsWith('/api/mock/user')) {
          res.setHeader('Content-Type', 'application/json')
          // 直接返回假数据，不再将请求转发到外网
          res.end(
            JSON.stringify({
              code: 200,
              data: { name: 'Vite Architect', role: 'admin' },
            }),
          )
          return
        }
        // 不是 mock 请求，放行给下一个中间件处理
        next()
      })
    },
  }
}
```

### 6.4 构建完成后的自动化任务 (Post-build Automation)

**场景：** 公司运维要求前端在执行完 `pnpm build` 后，必须把 `dist` 文件夹打成一个 `.zip` 压缩包，并且在控制台输出“打包成功，耗时 X 秒”的炫酷提示。

**解决思路：** 利用 Rollup 生命周期的终点钩子 `closeBundle`。当这个钩子触发时，意味着所有的文件都已经完完整整地写入了物理硬盘。

**实战代码：**

```typescript
import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver' // 需 npm install archiver -D

export function autoZipDistPlugin(): Plugin {
  let startTime = 0

  return {
    name: 'vite-plugin-auto-zip',
    apply: 'build', // 仅生产环境打包时运行

    buildStart() {
      startTime = Date.now()
    },

    // 整个打包流程彻底结束，文件已写入硬盘
    async closeBundle() {
      const distPath = path.resolve(process.cwd(), 'dist')
      const zipPath = path.resolve(process.cwd(), 'release.zip')

      // 创建输出流和 archiver 实例
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        const cost = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`\n🎉 [自动压缩] 打包完成！耗时: ${cost}s`)
        console.log(
          `📦 [自动压缩] 文件已生成: release.zip (${archive.pointer()} bytes)`,
        )
      })

      archive.pipe(output)
      // 将整个 dist 目录塞进压缩包
      archive.directory(distPath, false)
      await archive.finalize()
    },
  }
}
```

**写 Vite 插件的关键，在于在正确的时间做正确的事。**

- 如果你想改配置参数：找 `config` 或 `configResolved`。
- 如果你想拦截物理文件或造假文件：找 `resolveId` 和 `load`。
- 如果你想修改源码（宏替换/编译）：找 `transform`。
- 如果你想操作生成的产物文件：找 `generateBundle`（生成字典但还没写入）或 `closeBundle`（已经写入物理硬盘）。

## 7. 常见问题 (FAQ) 与避坑指南

### 7.1 为什么代码里写 `process.env.NODE_ENV` 突然报错了？怎么获取环境变量？

- **答**：这是从 Webpack 迁移到 Vite 最常踩的坑。
  - **原因**：Vite 抛弃了 Node.js 的 `process.env`，全面拥抱标准的 ESM 环境变量注入方式。
  - **正确做法**：在业务代码中，必须使用 **`import.meta.env`** 来获取环境变量。例如 `import.meta.env.MODE`。
  - **安全限制**：为了防止将数据库密码等私密变量打包进前端代码，Vite 强制规定：**只有以 `VITE_` 开头的环境变量才会被暴露给前端代码**。例如你在 `.env` 中写了 `SECRET_KEY=123`，前端是绝对拿不到的；必须改成 `VITE_SECRET_KEY=123`。

### 7.2 为什么引入了包含 `require` 语法的第三方包，浏览器直接报错 `require is not defined`？

- **答**：
  - **原因**：浏览器根本不认识 CommonJS 的 `require` 和 `module.exports`。Webpack 之所以能跑，是因为 Webpack 在打包时注入了大量的胶水代码模拟了 `require` 环境。而 Vite 开发环境直接把源码丢给浏览器，浏览器当然会报错。
  - **解决方案**：
    1. 尽量寻找该包的 ESM 版本（通常带有 `-es` 后缀）。
    2. 如果该包只在某一个特殊逻辑中用到，尽量不要直接引，让 Vite 的 `optimizeDeps` 去处理它。
    3. 如果是自己写的本地文件，必须立刻将其重构为 `import/export` 语法。
    4. 借助插件：安装 `@originjs/vite-plugin-commonjs`，强行让 Vite 在开发时转换 CJS（不得已而为之的下策）。

### 7.3 `require.context` (批量导入文件) 在 Vite 里不能用了怎么办？

- **答**：`require.context` 是 Webpack 独创的 API。在 Vite 中，你需要使用它的官方替代品：**`import.meta.glob`**。

  ```js
  // Vite 批量导入某个目录下的所有 vue 组件
  // eager: true 表示同步直接引入；不写 eager 则是按需懒加载 (返回 Promise)
  const modules = import.meta.glob('./components/*.vue', { eager: true })

  for (const path in modules) {
    console.log(path, modules[path].default)
  }
  ```

### 7.4 开发时感觉很快，为什么点开某个没访问过的路由页面，突然卡顿甚至整个页面刷新了？

- **答**：这被称为**依赖预构建的“二次发现”问题**。
  - **现象原理**：当你点击跳转到新路由时，Vite 实时编译该路由文件。突然发现里面 `import` 了一个之前从来没见过的巨大且深层的 CommonJS 第三方包（比如某个富文本编辑器）。
  - 此时，Vite 被迫中断当前的编译，紧急启动 esbuild 对这个新包进行“依赖预构建”。为了保证模块图的绝对正确，Vite 预构建完成后会**强制刷新整个浏览器页面**。
  - **解决策略**：仔细观察控制台提示的重新构建的包名，将其手动加入到 `vite.config.js` 的 **`optimizeDeps.include`** 数组中。这样 Vite 在一开始启动时就会把它处理好，避免运行时的突然刷新。

### 7.5 开发环境和生产环境使用两套不同的底层引擎，vite底层具体是怎么保证两端的一致性和稳定性的？

#### 1. 最核心的魔法：实现一个“Rollup 插件容器 (Plugin Container)”

这是 Vite 解决两端差异的“撒手锏”。
由于生产环境用的是 Rollup，Vite 希望开发者只写一套 Rollup 风格的插件。但在开发环境下（esbuild + Koa/Connect Server），根本没有 Rollup 在运行。
怎么办？**Vite 在自己的开发服务器内部，用代码硬写了一个模拟的 Rollup 运行环境（Plugin Container）**。
当浏览器在开发模式下请求一个文件时，Vite 的服务器会拦截请求，并按照 Rollup 的生命周期 API 规范，依次调用插件的 `resolveId`、`load`、`transform` 等钩子。

- **结果**：你写的一个 Rollup 插件，在生产环境由原生的 Rollup 调用；在开发环境，由 Vite 的模拟容器“骗”它在执行。两端输入输出的数据结构完全一致。

#### 2. 生产环境中，esbuild 依然在出大力

很多人误以为“开发用 esbuild，生产纯用 Rollup”。其实不然。
在生产环境进行 Rollup 打包时，Rollup 本身只负责**依赖分析、Chunk 拆分和构建图流转**。而在最耗时的**单文件代码编译**（把 TypeScript 编译成 JS，把 JSX 编译成 JS）和**代码压缩**（Minify）环节，Vite 依然悄悄地把这些脏活交给了 esbuild。

- **结果**：因为两端的 TS/JSX 编译和压缩核心都使用了同一套 esbuild 引擎，极大地消除了因 Babel/Terser 与 esbuild 编译策略不同而产生的运行时差异。

#### 3. 高度统一的配置源与默认预设 (One Config to Rule Them All)

传统 Webpack 时代，我们经常要维护 `webpack.dev.js` 和 `webpack.prod.js` 两个差异巨大的配置文件。
Vite 强制所有的环境共享同一个 `vite.config.ts`。在这个配置里：

- CSS 预处理器行为（PostCSS）
- 路径别名解析（Alias）
- 环境变量注入（Define）
  这些影响代码执行逻辑的基础设施，Vite 内部都做了严格的对齐，确保 esbuild 的解析路径和 Rollup 的解析路径是同一套正则和映射规则。

#### 4. 显式的环境逃生舱（Escape Hatches）

尽管 Vite 做了 99% 的抹平工作，但开发（按需流式）和生产（全量打包）在物理形态上终究不同。有些插件确实只能在特定环境下运行（比如开发环境的全局错误弹窗插件，生产环境的 Gzip 压缩插件）。
为此，Vite 提供了一个优雅的兜底方案 —— 插件属性 `apply`。

```javascript
export default function myPlugin() {
  return {
    name: 'my-plugin',
    apply: 'build', // 显式声明：这个插件只在生产环境 (Rollup) 运行
    // apply: 'serve' 则表示只在开发环境运行
    transform(code) {
      /* ... */
    },
  }
}
```
