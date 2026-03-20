---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vite 核心配置与性能优化

## 1. 核心概念与底层原理

在 Webpack 统治前端多年的背景下，**Vite**（法语意为“快”）以破局者的姿态诞生。理解 Vite 的配置与优化，必须先彻底明白它与 Webpack 在底层架构上的**本质区别**。

| 核心差异点 | Webpack (Bundle-based) | Vite (ESM-based / Bundleless) |
| :--- | :--- | :--- |
| **开发环境启动原理** | **先全量打包，再启动服务。** 必须把所有文件抓取、解析、编译成一坨巨大的 Bundle 才能跑起来。项目越大，启动越慢。 | **先启动服务，再按需编译。** 直接利用浏览器原生支持的 ES Modules。浏览器请求哪个文件，Vite 就用 esbuild 实时编译哪个文件。无论项目多大，启动永远是毫秒级。 |
| **热更新 (HMR)** | 修改一个文件，可能导致整个依赖链重新打包。 | 修改一个文件，只需让浏览器重新请求该模块即可，HMR 速度不受项目体积影响。 |
| **底层引擎** | 使用 JavaScript 编写（慢）。 | 开发环境预构建使用 **Go 语言编写的 esbuild**（快 10-100 倍）。 |
| **生产环境构建** | Webpack 自己的打包体系。 | **Rollup**。因为在生产环境，为了极致的代码分割、Tree-shaking 和兼容性，传统的打包仍然是必要的。 |

## 2.Vite 凭什么这么快？

Vite（法语“快”的意思）之所以能在毫秒级启动，核心在于它在开发环境和生产环境采用了**两套完全不同的架构模型**。

### 2.1 开发服务器的“按需编译” (Native ESM)
*   **传统打包器 (Webpack/Rollup)**：冷启动时，必须抓取整个应用的代码，解析 AST，处理依赖关系，最终打包成一个或多个庞大的 Bundle（哪怕你只改了一行代码），然后才启动服务器。项目越大，启动越慢。
*   **Vite 模式 (No-Bundle)**：直接启动服务器！Vite 将应用代码交由浏览器接管。现代浏览器原生支持 `<script type="module">`，当浏览器解析到 `import './App.jsx'` 时，会主动向 Vite 发起 HTTP 请求。Vite 服务器拦截请求，**只在这个时候才对目标文件进行极其轻量的编译（如 JSX 转 JS）并返回**。
*   **本质**：这是一种**“懒加载”**的极致体现。不管项目有 100 个文件还是 10 万个文件，冷启动时间几乎是常数（因为只编译首页用到的那几个文件）。

### 2.2 依赖预构建 (Dependency Pre-bundling) 与 Esbuild
虽然业务代码可以按需编译，但 `node_modules` 里的第三方依赖不能直接扔给浏览器。
1.  **CommonJS/UMD 转换**：浏览器不支持 `require`，Vite 必须将旧规范的包转化为 ESM。
2.  **性能优化（减少 HTTP 请求）**：有些包（如 `lodash-es`）内部有多达 600 个内部模块的互相 `import`。如果让浏览器直接发请求，瞬间 600 个网络请求会让浏览器直接卡死。
*   **Esbuild 的降维打击**：Vite 在首次冷启动前，会使用用 **Go 语言**编写的 `Esbuild`（速度比 JS 编写的打包器快 10-100 倍）扫描所有的依赖，并将它们预先打包成单个或少数几个模块，缓存在 `node_modules/.vite` 中。

### 2.3 生产环境的稳健打包 (Rollup)
开发时用 ESM 非常快，但在生产环境如果依然保留成百上千个小文件的 HTTP 请求，会导致严重的网络性能问题（即使有 HTTP/2）。
因此，Vite 在生产环境（`vite build`）会无缝切换到 **Rollup** 进行打包。Rollup 在 Tree-shaking（摇树优化）、代码分割（Code Splitting）和 CSS 处理上拥有极其成熟的生态。

### 2.4 毫秒级的热更新 (HMR)
在 Webpack 中，修改一个文件可能会导致整个 Bundle 重新构建。在 Vite 中，HMR 是建立在原生 ESM 上的。当修改一个模块时，Vite 只需要**让浏览器重新请求这一个被修改的模块**，真正的 O(1) 复杂度。

## 3. Vite 核心基础配置实战

Vite 的配置以极简著称，通常位于根目录的 `vite.config.js` 或 `vite.config.ts`。

```js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // 或者 @vitejs/plugin-vue
import path from 'path';

// defineConfig 可以提供完整的类型提示
// 传入函数可以根据不同的命令(serve/build)和模式(development/production)返回不同配置
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  // 设置第三个参数为 '' 来加载所有环境变量，而不管是否有 `VITE_` 前缀。
  const env = loadEnv(mode, process.cwd(), '');

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
      port: 3000,      // 指定端口
      strictPort: true,// 设为 true 时如果端口被占用会直接退出，而不是自动尝试下一个端口
      open: true,      // 启动时自动在浏览器中打开
      cors: true,      // 允许跨域
      proxy: {         // 核心：开发环境的反向代理，解决跨域问题
        '/api': {
          target: 'http://backend-server.com',
          changeOrigin: true, // 将请求头中的 host 替换为 target
          rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径
        },
      },
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
          additionalData: `@import "@/styles/variables.scss";`
        }
      }
    }
  };
});
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
    exclude: ['my-local-custom-ui-lib']
  }
});
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
              return 'vue-core'; // vue 核心库
            }
            if (id.includes('echarts')) {
              return 'echarts';  // 图表库极其庞大，必须单独拆分
            }
            return 'vendors';    // 其他第三方库
          }
        }
      }
    }
  }
});
```

### 4.3 生产环境瘦身：剔除 console 与 Gzip 压缩

```js
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    // 开启 gzip 压缩，体积骤降，需 Nginx 配合 gzip_static on
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 大于 10kb 的文件才压缩
      algorithm: 'gzip',
      ext: '.gz',
    })
  ],
  build: {
    // 极速剔除 console 和 debugger
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
});
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 为什么代码里写 `process.env.NODE_ENV` 突然报错了？怎么获取环境变量？
*   **答**：这是从 Webpack 迁移到 Vite 最常踩的坑。
    *   **原因**：Vite 抛弃了 Node.js 的 `process.env`，全面拥抱标准的 ESM 环境变量注入方式。
    *   **正确做法**：在业务代码中，必须使用 **`import.meta.env`** 来获取环境变量。例如 `import.meta.env.MODE`。
    *   **安全限制**：为了防止将数据库密码等私密变量打包进前端代码，Vite 强制规定：**只有以 `VITE_` 开头的环境变量才会被暴露给前端代码**。例如你在 `.env` 中写了 `SECRET_KEY=123`，前端是绝对拿不到的；必须改成 `VITE_SECRET_KEY=123`。

### 5.2 为什么引入了包含 `require` 语法的第三方包，浏览器直接报错 `require is not defined`？
*   **答**：
    *   **原因**：浏览器根本不认识 CommonJS 的 `require` 和 `module.exports`。Webpack 之所以能跑，是因为 Webpack 在打包时注入了大量的胶水代码模拟了 `require` 环境。而 Vite 开发环境直接把源码丢给浏览器，浏览器当然会报错。
    *   **解决方案**：
        1. 尽量寻找该包的 ESM 版本（通常带有 `-es` 后缀）。
        2. 如果该包只在某一个特殊逻辑中用到，尽量不要直接引，让 Vite 的 `optimizeDeps` 去处理它。
        3. 如果是自己写的本地文件，必须立刻将其重构为 `import/export` 语法。
        4. 借助插件：安装 `@originjs/vite-plugin-commonjs`，强行让 Vite 在开发时转换 CJS（不得已而为之的下策）。

### 5.3 `require.context` (批量导入文件) 在 Vite 里不能用了怎么办？
*   **答**：`require.context` 是 Webpack 独创的 API。在 Vite 中，你需要使用它的官方替代品：**`import.meta.glob`**。
    ```js
    // Vite 批量导入某个目录下的所有 vue 组件
    // eager: true 表示同步直接引入；不写 eager 则是按需懒加载 (返回 Promise)
    const modules = import.meta.glob('./components/*.vue', { eager: true });
    
    for (const path in modules) {
      console.log(path, modules[path].default);
    }
    ```

### 5.4 开发时感觉很快，为什么点开某个没访问过的路由页面，突然卡顿甚至整个页面刷新了？
*   **答**：这被称为**依赖预构建的“二次发现”问题**。
    *   **现象原理**：当你点击跳转到新路由时，Vite 实时编译该路由文件。突然发现里面 `import` 了一个之前从来没见过的巨大且深层的 CommonJS 第三方包（比如某个富文本编辑器）。
    *   此时，Vite 被迫中断当前的编译，紧急启动 esbuild 对这个新包进行“依赖预构建”。为了保证模块图的绝对正确，Vite 预构建完成后会**强制刷新整个浏览器页面**。
    *   **解决策略**：仔细观察控制台提示的重新构建的包名，将其手动加入到 `vite.config.js` 的 **`optimizeDeps.include`** 数组中。这样 Vite 在一开始启动时就会把它处理好，避免运行时的突然刷新。
