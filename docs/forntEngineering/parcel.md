# [`Parcel`](https://parceljs.org/): 极速零配置构建工具

## 1. 什么是 Parcel？

Parcel 是一个 **零配置（Zero Configuration）** 的 Web 应用打包构建工具。它的设计哲学是提供极致的开箱即用体验，开发者无需编写和维护复杂的配置文件（如 `webpack.config.js`），即可获得一个功能强大且性能优越的构建系统。

你只需告诉 Parcel 你的**入口**文件（通常是一个 HTML 文件），它会自动分析依赖、转换代码、打包资源，并提供一个带有**热模块替换**（`HMR`）功能的开发服务器。

## 2. Parcel 的核心概念

### 2.1 零配置 (Zero Configuration)

这是 Parcel 最核心、最吸引人的特性。当你运行 Parcel 时，它会自动执行以下操作，无需任何手动配置：

*   **自动资源转换**：Parcel 会根据文件扩展名自动使用相应的转换器。例如，遇到 `.scss` 文件会自动用 Sass 编译，遇到 `.ts` 文件会自动用 TypeScript 编译，遇到包含现代 JavaScript 语法的 `.js` 文件会自动用 Babel 转换。
*   **自动安装依赖**：如果在代码中引入了一个尚未安装的 npm 包（如 `import React from 'react'`)，Parcel 在开发模式下会自动检测并帮你安装它。
*   **自动代码拆分**：通过动态 `import()` 语法，Parcel 可以自动将你的代码拆分成多个包（Bundles），实现按需加载，优化应用的初始加载速度。
*   **自动开启开发服务器**：运行 `parcel index.html` 会立即启动一个本地开发服务器。
*   **自动开启热模块替换 (HMR)**：开发服务器默认启用了 HMR，当你修改代码（JS, CSS 等）时，无需刷新整个页面，更改会实时应用到浏览器中。

### 2.2 入口文件 (Entry Points)

与许多打包工具要求 JavaScript 作为入口文件不同，Parcel 推荐使用 **HTML 文件作为入口**。

这是一个非常强大且直观的模式。Parcel 会从 HTML 文件开始，解析其中引用的所有资源，如：
*   `<script src="./main.js"></script>`
*   `<link rel="stylesheet" href="./styles.css">`
*   `<img src="./hero.png">`
*   CSS 中的 `url(...)`

然后，它会递归地分析这些资源内部的依赖（例如，JS 文件中的 `import`），最终构建出一个完整的依赖关系图。

### 2.3 资源与转换器 (Assets & Transformers)

在 Parcel 的世界里，**一切皆资源（Asset）**。JavaScript, CSS, HTML, 图片, 字体, Sass, TypeScript, Vue, React (JSX) 等文件都是资源。

Parcel 通过一个插件化的 **转换器（Transformer）** 系统来处理这些资源。当 Parcel 遇到一个文件时，它会：
1.  根据文件名（如 `.scss`）匹配一个或多个转换器。
2.  使用匹配到的转换器（如 `parcel-transformer-sass`）对文件内容进行处理（如将 Sass 编译成 CSS）。
3.  分析转换后文件中的依赖关系。
4.  重复此过程，直到所有依赖都被处理完毕。

### 2.4 开发模式 (Development)

通过运行 `parcel serve <入口文件>` 或 `parcel <入口文件>` 启动。
*   **极速的开发服务器**：内置一个功能完备的服务器。
*   **热模块替换 (HMR)**：代码保存后，浏览器能立即看到更新，且通常不会丢失当前应用的状态。
*   **友好的错误报告**：当代码出现语法错误时，Parcel 会在浏览器和命令行中提供高亮、清晰的错误提示。

### 2.5 生产模式 (Production)

通过运行 `parcel build <入口文件>` 启动。Parcel 会自动为生产环境启用一系列优化：
*   **代码压缩 (Minification)**：使用 Terser 压缩 JavaScript，使用 `cssnano` 压缩 CSS，压缩 HTML。
*   **Tree Shaking**：自动移除 JavaScript 中未被使用的代码（dead code），减小打包体积。
*   **代码拆分 (Code Splitting)**：基于动态 `import()` 自动进行。
*   **内容哈希 (Content Hashing)**：为输出的文件名添加哈希值（如 `main.a1b2c3d4.js`），以实现浏览器的长期缓存，只有文件内容改变时哈希才会改变。
*   **浏览器目标 (Targets)**：Parcel 会根据项目根目录下的 `browserslist` 字段（在 `package.json` 中）或 `.browserslistrc` 文件，自动将代码转换为兼容目标浏览器的语法。

### 2.6 扩展性 (Configuration When Needed)

虽然 Parcel 是零配置的，但它仍然提供了清晰的扩展方式。当默认行为不满足需求时，可以通过在项目根目录创建 `.parcelrc` 文件来定制转换器、优化器等插件。

例如，要添加 PostCSS 插件，你只需安装 `autoprefixer` 和 `postcss`，然后在项目根目录创建一个 `postcss.config.js` 文件即可，Parcel 会自动检测并使用它。

### 2.7  基础结构与极简命令

你不需要编写任何 `webpack.config.js` 或 `vite.config.js`，只需要准备最基础的 Web 结构。

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Parcel 实战</title>
  <!-- 直接引入 SCSS，Parcel 会自动帮你下载 sass 编译器并处理 -->
  <link rel="stylesheet" href="./style.scss">
</head>
<body>
  <div id="app"></div>
  <!-- 直接引入 TS 或 JS，Parcel 会自动处理编译 -->
  <script type="module" src="./index.ts"></script>
</body>
</html>
```

```json
// package.json
{
  "name": "parcel-demo",
  "scripts": {
    // 开发环境：启动自带热更新 (HMR) 的开发服务器
    "start": "parcel src/index.html",
    // 生产环境：开启代码压缩、Tree Shaking、Content Hash 并输出到 dist 目录
    "build": "parcel build src/index.html"
  }
}
```

## 3. 核心进阶：现代前端框架实战 (React + TypeScript)

**痛点场景**：搭建一个 React + TypeScript 的项目，如果使用传统的构建工具，你需要手动配置 `babel-loader`、`ts-loader`、`@babel/preset-react` 等数十行配置，一旦版本不兼容就会报出满屏红字。

**解决原则**：**将一切交给 Parcel 的自动推断引擎。你只需书写现代代码，缺少的依赖 Parcel 会在后台自动为你 `npm install`。**

```tsx
// ❌ 错误示范 (传统工具链思维)：
// 试图去寻找 parcel.config.js 来配置 JSX 的解析规则，这在 Parcel 中完全是多此一举。

// ✅ 黄金法则 (Parcel 的极简美学)：
// 1. 直接编写你的 src/App.tsx
import { createRoot } from 'react-dom/client';

function App() {
  return <h1>Hello, Parcel with React & TS!</h1>;
}

const root = createRoot(document.getElementById('app'));
root.render(<App />);

// 2. 在 index.html 中引入：
// <script type="module" src="./App.tsx"></script>
// 3. 运行 npm start。Parcel 发现是 .tsx，会自动使用内置的 SWC 极速编译 JSX 和 TS，无需任何配置！
```

## 4. 高阶进阶：库 (Library) 的打包与多端输出

除了打包 Web 应用，Parcel 2 非常适合用来打包准备发布到 npm 的工具库或组件库。

**突破死穴：通过 `package.json` 声明 Targets**

**痛点场景**：为了让你的 npm 包既能运行在 Node.js 中（CommonJS），又能被现代打包工具做到 Tree Shaking（ES Module），你通常需要引入 Rollup 并配置多个复杂的输出插件。

**解决原则**：**利用 Parcel 的 `Targets` 机制。在 `package.json` 中声明你期望的输出格式，Parcel 会自动生成多份构建产物。**

```json
{
  "name": "my-awesome-lib",
  "version": "1.0.0",
  // ✅ 黄金法则 1：指定你的源码入口 (不要再用 build src/index.ts 命令了)
  "source": "src/index.ts",
  
  // ✅ 黄金法则 2：声明 CommonJS 的输出路径
  "main": "dist/main.js",
  
  // ✅ 黄金法则 3：声明 ES Module 的输出路径
  "module": "dist/module.js",
  
  // ✅ 黄金法则 4：声明 TypeScript 类型声明文件的输出路径 (Parcel 会自动生成 .d.ts)
  "types": "dist/types.d.ts",

  "scripts": {
    // ✅ 黄金法则 5：此时直接运行 parcel build 即可，它会读取上面的配置并同时输出三份文件！
    "build": "parcel build"
  }
}
```

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 开发时如何配置跨域代理 (Proxy) 解决跨域报错？
*   **答**：**使用 `.proxyrc` 文件。**
    *   在项目根目录创建一个 `.proxyrc` 或 `.proxyrc.json` 文件。Parcel 内置了 `http-proxy-middleware`。
    *   **避坑方案**：
        ```json
        {
          "/api": {
            "target": "http://localhost:8080",
            "pathRewrite": {
              "^/api": ""
            }
          }
        }
        ```
        这样所有发往 `/api` 的请求就会被自动代理到后端服务，完美解决开发期的 CORS 问题。

### 5.2 为什么我改了代码，浏览器刷新了，但页面效果没变？好像卡在了旧版本？
*   **答**：**这是由于 Parcel 激进的磁盘缓存机制 (Caching) 导致的偶发性 Bug。**
    *   为了实现极速的二次启动，Parcel 会在根目录生成一个 `.parcel-cache` 文件夹。当某些特殊配置文件改变或发生异常中断时，缓存可能会失效/错乱。
    *   **避坑方案**：直接删除项目根目录下的 `.parcel-cache` 文件夹，然后重新运行 `npm start` 即可恢复正常。建议在 `.gitignore` 中加入 `.parcel-cache`。

### 5.3 我的项目里有一些不用编译的静态资源（比如 favicon.ico、大型 PDF），如何原封不动地复制到 dist 目录？
*   **答**：**使用 `@parcel/reporter-static-files-copy` 插件配合 `.parcelrc`。**
    *   默认情况下，Parcel 只会打包被 HTML/JS/CSS 显式引用的文件。对于需要静态拷贝的文件，需要扩展 Parcel 的行为。
    *   **避坑方案**：
        1. 安装依赖：`npm install -D @parcel/reporter-static-files-copy`
        2. 在根目录创建 `.parcelrc` 文件，扩展 reporters：
        ```json
        {
          "extends": ["@parcel/config-default"],
          "reporters":  ["...", "@parcel/reporter-static-files-copy"]
        }
        ```
        3. 在 `package.json` 中配置静态目录（例如将 `public` 文件夹原样拷贝）：
        ```json
        "staticFiles": {
          "staticPath": "public",
          "staticOutDir": ""
        }
        ```

### 5.4 "零配置" 是不是意味着完全不能配置？

**不是。** "零配置" 指的是 **开箱即用**，对于绝大多数常见场景，你不需要任何配置。但当你需要深度定制时，Parcel 提供了强大的插件 API 和配置文件（`.parcelrc`）。

例如，你需要为 Babel 添加一个特定的插件，你可以创建一个 `babel.config.json` 文件；需要配置 PostCSS，可以创建 `postcss.config.js`。Parcel 会自动发现并尊重这些配置文件。

### 5.5 Parcel 和 Webpack 有什么区别？

这是一个非常常见的问题。

| 特性 | Parcel | Webpack |
| :--- | :--- | :--- |
| **配置** | **零配置**，开箱即用 | **高度可配置**，需要编写 `webpack.config.js`，学习曲线陡峭 |
| **易用性** | 非常简单，适合新手和快速原型开发 | 复杂，但提供了无与伦比的灵活性和控制力 |
| **构建速度** | **极快**，利用多核处理和缓存系统 | 速度较慢（尤其是在冷启动时），但 Webpack 5 有了很大改进 |
| **入口文件** | 推荐使用 **HTML** 作为入口，更直观 | 通常使用 **JavaScript** 作为入口 |
| **生态系统** | 插件较少，但核心功能都已内置 | **极其庞大**，几乎所有你能想到的功能都有对应的 loader 或 plugin |
| **适用场景** | 中小型项目、静态网站、快速原型、库打包 | 大型、复杂、需要深度定制构建流程的企业级项目 |

**总结**：选择 Parcel 意味着你相信它的默认最佳实践，并希望快速投入开发；选择 Webpack 意味着你希望对构建过程的每一个细节都有完全的控制权。

### 5.6 如何在 Parcel 中使用环境变量？

Parcel 内置了对 `.env` 文件的支持，并且会自动注入 `process.env.NODE_ENV`。

1.  在项目根目录创建 `.env` 文件：
    ```
    API_KEY=your_secret_key
    BASE_URL=https://api.example.com
    ```
2.  在你的 JavaScript 代码中直接访问：
    ```javascript
    console.log(process.env.API_KEY);
    ```
**重要**：默认情况下，出于安全考虑，只有以 `PARCEL_` 开头的环境变量会被注入到前端代码中。如果你想暴露其他变量，需要在 `package.json` 中明确指定：
```json
// package.json
"targets": {
  "default": {
    "context": "browser",
    "includeNodeModules": true,
    "publicUrl": "./",
    "env": {
      "include": ["API_KEY"]
    }
  }
}
```

### 5.7 为什么我的图片或资源路径在生产构建后失效了？

**问题描述**：在开发时一切正常，但 `parcel build` 之后，部署到服务器上的网站找不到图片。

**原因**：这通常与 **`publicUrl`** 配置和 **路径写法** 有关。Parcel 在构建时会重写文件路径。

**解决方案**：
*   **使用相对路径**：确保你的路径是相对于当前文件的，例如 `./images/logo.png`。
*   **使用绝对路径 (从根目录)**：如果你的资源在 `public` 或 `static` 目录下，并希望路径从根开始，使用 `/` 开头的路径，例如 `/images/logo.png`。
*   **配置 `publicUrl`**：在 `package.json` 的 `targets` 中，`publicUrl` 决定了最终 HTML 文件中资源路径的前缀。默认是 `./`。如果你将网站部署到子目录（如 `www.example.com/my-app/`），你需要将其设置为 `/my-app/`。
