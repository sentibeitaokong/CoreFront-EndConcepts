---
outline: [2,3] # 这个页面将显示 h2 和 h3 标题
---

# Vite 核心配置与性能优化深度指南

## 1. 核心概念与底层原理

在 Webpack 统治前端多年的背景下，**Vite**（法语意为“快”）以破局者的姿态诞生。理解 Vite 的配置与优化，必须先彻底明白它与 Webpack 在底层架构上的**本质区别**。

| 核心差异点 | Webpack (Bundle-based) | Vite (ESM-based / Bundleless) |
| :--- | :--- | :--- |
| **开发环境启动原理** | **先全量打包，再启动服务。** 必须把所有文件抓取、解析、编译成一坨巨大的 Bundle 才能跑起来。项目越大，启动越慢。 | **先启动服务，再按需编译。** 直接利用浏览器原生支持的 ES Modules。浏览器请求哪个文件，Vite 就用 esbuild 实时编译哪个文件。无论项目多大，启动永远是毫秒级。 |
| **热更新 (HMR)** | 修改一个文件，可能导致整个依赖链重新打包。 | 修改一个文件，只需让浏览器重新请求该模块即可，HMR 速度不受项目体积影响。 |
| **底层引擎** | 使用 JavaScript 编写（慢）。 | 开发环境预构建使用 **Go 语言编写的 esbuild**（快 10-100 倍）。 |
| **生产环境构建** | Webpack 自己的打包体系。 | **Rollup**。因为在生产环境，为了极致的代码分割、Tree-shaking 和兼容性，传统的打包仍然是必要的。 |

## 2. Vite 核心基础配置实战

Vite 的配置以极简著称，通常位于根目录的 `vite.config.js` 或 `vite.config.ts`。

```js
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue'; // 或 @vitejs/plugin-react
import path from 'path';

// defineConfig 提供极佳的 TS 类型提示
export default defineConfig(({ command, mode }) => {
  // 根据当前工作目录中的 `mode` 加载 .env 文件
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 1. 基础路径 (类似 Webpack 的 publicPath)
    base: env.VITE_APP_BASE_URL || '/', 

    // 2. 插件体系 (Vite 插件高度兼容 Rollup 插件)
    plugins: [vue()],

    // 3. 模块解析
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '~': path.resolve(__dirname, './src/assets')
      },
      // 注意：Vite 强烈建议不要省略自定义组件的后缀名 (.vue / .jsx)
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'] 
    },

    // 4. 开发服务器配置
    server: {
      port: 3000,
      host: '0.0.0.0',    // 允许局域网访问
      open: true,
      cors: true,
      proxy: {            // 本地跨域代理
        '/api': {
          target: 'https://backend-api.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };
});
```

## 3. Vite 性能优化大杀器 (企业级调优)

由于 Vite 开发环境和生产环境的机制完全不同，我们的优化策略也必须分环境进行。

### 3.1 开发环境提速：精确控制 `optimizeDeps` (预构建)

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

### 3.2 生产环境瘦身：Rollup 分包策略 (ManualChunks)

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

### 3.3 生产环境瘦身：剔除 console 与 Gzip 压缩

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

## 4. 常见问题 (FAQ) 与避坑指南

### 4.1 为什么代码里写 `process.env.NODE_ENV` 突然报错了？怎么获取环境变量？
*   **答**：这是从 Webpack 迁移到 Vite 最常踩的坑。
    *   **原因**：Vite 抛弃了 Node.js 的 `process.env`，全面拥抱标准的 ESM 环境变量注入方式。
    *   **正确做法**：在业务代码中，必须使用 **`import.meta.env`** 来获取环境变量。例如 `import.meta.env.MODE`。
    *   **安全限制**：为了防止将数据库密码等私密变量打包进前端代码，Vite 强制规定：**只有以 `VITE_` 开头的环境变量才会被暴露给前端代码**。例如你在 `.env` 中写了 `SECRET_KEY=123`，前端是绝对拿不到的；必须改成 `VITE_SECRET_KEY=123`。

### 4.2 为什么引入了包含 `require` 语法的第三方包，浏览器直接报错 `require is not defined`？
*   **答**：
    *   **原因**：浏览器根本不认识 CommonJS 的 `require` 和 `module.exports`。Webpack 之所以能跑，是因为 Webpack 在打包时注入了大量的胶水代码模拟了 `require` 环境。而 Vite 开发环境直接把源码丢给浏览器，浏览器当然会报错。
    *   **解决方案**：
        1. 尽量寻找该包的 ESM 版本（通常带有 `-es` 后缀）。
        2. 如果该包只在某一个特殊逻辑中用到，尽量不要直接引，让 Vite 的 `optimizeDeps` 去处理它。
        3. 如果是自己写的本地文件，必须立刻将其重构为 `import/export` 语法。
        4. 借助插件：安装 `@originjs/vite-plugin-commonjs`，强行让 Vite 在开发时转换 CJS（不得已而为之的下策）。

### 4.3 `require.context` (批量导入文件) 在 Vite 里不能用了怎么办？
*   **答**：`require.context` 是 Webpack 独创的 API。在 Vite 中，你需要使用它的官方替代品：**`import.meta.glob`**。
    ```js
    // Vite 批量导入某个目录下的所有 vue 组件
    // eager: true 表示同步直接引入；不写 eager 则是按需懒加载 (返回 Promise)
    const modules = import.meta.glob('./components/*.vue', { eager: true });
    
    for (const path in modules) {
      console.log(path, modules[path].default);
    }
    ```

### 4.4 开发时感觉很快，为什么点开某个没访问过的路由页面，突然卡顿甚至整个页面刷新了？
*   **答**：这被称为**依赖预构建的“二次发现”问题**。
    *   **现象原理**：当你点击跳转到新路由时，Vite 实时编译该路由文件。突然发现里面 `import` 了一个之前从来没见过的巨大且深层的 CommonJS 第三方包（比如某个富文本编辑器）。
    *   此时，Vite 被迫中断当前的编译，紧急启动 esbuild 对这个新包进行“依赖预构建”。为了保证模块图的绝对正确，Vite 预构建完成后会**强制刷新整个浏览器页面**。
    *   **解决策略**：仔细观察控制台提示的重新构建的包名，将其手动加入到 `vite.config.js` 的 **`optimizeDeps.include`** 数组中。这样 Vite 在一开始启动时就会把它处理好，避免运行时的突然刷新。
