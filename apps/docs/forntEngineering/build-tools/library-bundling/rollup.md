# [Rollup](https://rollup.nodejs.cn/) (下一代 ES 模块打包器)

## 1. Rollup的作用和设计动机

### 1.1 为什么选择 Rollup？

在前端构建工具的生态中，有一句著名的行话：**“App 用 Webpack/Vite，库（Library）用 Rollup。”**

- **极致的 Tree-Shaking**：Rollup 是原生基于 ES 模块（ESM）设计的，它的静态分析能力极强，能完美剔除没有用到的代码，产物体积极其小巧。
- **纯净的产物**：Webpack 打包后会注入大量自己的模块加载引导代码（`__webpack_require__` 等），而 Rollup 打包出来的代码几乎和手写的一样干净。
- **多格式输出支持**：一套源码，可以同时打包出 ESM、CommonJS、UMD、IIFE 等多种格式，完美兼容 Node.js 和所有现代/老旧浏览器环境。

### 1.2 核心概念与配置全景

Rollup 的设计哲学是 **“小即是美”**。它的核心配置文件（通常是 `rollup.config.js`）导出一个对象或对象数组。

| 核心配置项   | 英文名称        | 核心职责与工程意义                                                                           |
| :----------- | :-------------- | :------------------------------------------------------------------------------------------- |
| **入口**     | **`input`**     | 定义打包的起点。可以是单个字符串、数组或对象（用于多入口和代码分割）。                       |
| **出口**     | **`output`**    | （极其重要）定义打包产物的结构、格式（ESM/CJS/UMD）、存放路径、变量命名以及分包策略。        |
| **外部依赖** | **`external`**  | 告诉 Rollup 哪些模块是“外部的”。这些模块**不会被打包进最终产物中**，而是保留 `import` 语句。 |
| **插件体系** | **`plugins`**   | 扩展 Rollup 能力的唯一途径。用于处理非 JS 文件、解析 Node 模块、转译 TS/Babel 等。           |
| **摇树优化** | **`treeshake`** | （高级）细粒度控制 Rollup 的静态分析算法。默认开启，通常不需要手动修改。                     |

### 1.3 基础使用

**初始化项目**

```bash
mkdir my-rollup-lib && cd my-rollup-lib
npm init -y
npm install rollup --save-dev
```

**在根目录创建 `rollup.config.js`**

:::code-group

```javascript [rollup.config.js]
// rollup.config.js
export default {
  // 1. 入口文件
  input: 'src/index.js',

  // 2. 输出配置 (可以是一个对象，也可以是数组输出多份)
  output: {
    file: 'dist/bundle.js', // 输出路径
    format: 'es', // 输出格式 (es, cjs, umd, iife)
    name: 'MyLib', // 当 format 为 umd 或 iife 时，挂载在 window 上的全局变量名
    sourcemap: true, // 开启源码映射，方便调试
  },
}
```

:::

_在 `package.json` 中配置运行脚本：_

:::code-group

```json [package.json]
"scripts": {
  "build": "rollup -c" // -c 表示使用默认的 rollup.config.js
}
```

:::

## 2. 核心配置深度拆解

Rollup 的配置文件通常命名为 `rollup.config.js`（或 `.mjs`）。它的结构比 Webpack 简单得多，最核心的属性只有 `input`、`output`、`plugins` 和 `external`。

### 2.1 `input` 与 `external` (源头与剔除)

`external` 是开发类库时最关键的配置，它支持字符串数组、正则表达式或函数。

```js
// rollup.config.js
export default {
  // 1. input: 单入口
  input: 'src/main.js',

  // 1. input: 多入口 (对象形式，有利于后续保持目录结构)
  // input: {
  //   index: 'src/index.js',
  //   utils: 'src/utils.js'
  // },

  // 2. external: 将第三方依赖剥离，防止将 React/Vue 源码打包进你的组件库
  external: [
    'react',
    'react-dom',
    // 使用正则：忽略所有的 lodash 子模块引入 (如 lodash/map)
    /^lodash\/.*/,
    // 终极杀招：把 package.json 中的 dependencies 全设为外部依赖
    // ...Object.keys(require('./package.json').dependencies)
  ],

  output: {
    /* ... */
  },
}
```

### 2.2 `output` 核心属性详解 (产物控制)

Rollup 的 `output` 可以是一个对象（输出一种格式），也可以是一个数组（同时输出多种格式）。

```js
export default {
  input: 'src/index.js',
  output: [
    {
      // 1. 产物路径 (单文件输出)
      file: 'dist/bundle.cjs.js',

      // 2. 模块格式 (极度重要)
      // 'es': ES Module (给 Vite/Webpack 使用)
      // 'cjs': CommonJS (给 Node.js 使用)
      // 'iife': 立即执行函数 (通过 <script> 标签直接引入浏览器)
      // 'umd': 兼容前三者 (支持 AMD, CJS, 全局变量)
      format: 'cjs',

      // 3. 生成 Source Map 方便调试
      sourcemap: true,

      // 4. 清理旧注释并生成文件头注释
      banner: '/* My Library v1.0.0 */',
    },
    {
      file: 'dist/bundle.umd.js',
      format: 'umd',

      // 5. name: 当 format 为 iife 或 umd 时必须配置！
      // 决定了你的库在全局 window 对象上的变量名 (如 window.$ 或 window.Vue)
      name: 'MyUtils',

      // 6. globals: 与 external 配合使用，仅针对 iife/umd 格式
      // 告诉 Rollup："由于我把 react 设为了外部依赖，在浏览器环境(UMD)下，
      // 请去全局 window.React 变量上去寻找它"
      globals: {
        react: 'React',
        lodash: '_',
      },
    },
  ],
}
```

## 3. 插件系统：构建钩子、输出钩子与上下文机制

Rollup 的插件系统是其实现模块化打包、摇树优化（Tree-shaking）以及性能卓越的关键。它采用了一种基于“**钩子函数**”的发布-订阅模式，将构建流程解耦。理解插件系统，本质上就是理解 Rollup 如何在构建的各个时间点，将控制权交给插件进行干预。

### 3.1 插件调度策略：First, Sequential, Parallel

为了与构建过程交互，你的插件对象包括“钩子”。钩子是在构建的各个阶段调用的函数。钩子可以影响构建的运行方式，提供关于构建的信息，或在构建完成后修改构建。有不同种类的钩子：

- **`async` (异步) / `sync` (同步)：** 决定该钩子是否可以返回一个 Promise。
- **`first` (熔断型)：** 如果有多个插件，只要有一个插件返回了非 `null/undefined` 的值，后续插件的该钩子就不再执行。（例如 `resolveId`，找到了路径就不往下找了）。
- **`sequential` (串行传递)：** 多个插件按先后顺序执行，前一个插件的输出会作为后一个插件的输入。（例如 `transform`，代码一层一层剥洋葱）。
- **`parallel` (并行)：** 所有插件同时执行，互不干扰。（例如 `buildStart`）。

### 3.2 插件架构的核心：生命周期钩子

Rollup 的生命周期被划分为两个完全隔离的阶段：**构建阶段（Build Phase）** 和 **输出阶段（Output Phase）**。

#### 3.2.1 构建钩子（Build Hooks）

构建阶段的目的是构建内存中的模块依赖图。插件在此阶段主要负责模块的解析、加载和内容转译。

- **`options(options)`**: 插件配置的入口。用于修改传给 `rollup.rollup()` 的初始配置。
- **`buildStart(options)`**: 构建过程正式启动。适合在此处进行前置检查、初始化异步资源或启动辅助进程。
- **`resolveId(source, importer)`** (熔断钩子): 核心解析钩子。当遇到 `import` 语句时，Rollup 调用此钩子。如果你返回了一个路径字符串，Rollup 将以此路径进行后续加载；若返回 `null`，则由后续插件继续处理。
- **`load(id)`**(熔断钩子): 源码加载。根据 `resolveId` 的 ID 读取文件内容。这是实现虚拟模块（Virtual Modules）的黄金位置。
- **`transform(code, id)`** (管道钩子): 转换钩子。这是开发转译器（如 Babel, TypeScript, Vue SFC 编译）的主战场。所有插件依次处理同一段代码。
- **`moduleParsed(async, parallel)`**: 当一个模块的代码被 Rollup 完全解析为 AST 后触发。你可以在这里读取该模块的元数据。
- **`resolveDynamicImport(async, first)`**: 专门用来拦截 `import('xxx')` 动态导入的寻址逻辑。
- **`buildEnd(async, parallel)`**: 构建阶段结束。如果是打包出错导致结束，会带上 `error` 参数。

#### 3.2.2 输出钩子（Output Hooks）

输出阶段的目标是根据构建出的依赖图，进行代码合并、优化，并将最终产物写入磁盘。

- **`outputOptions(sync, sequential)`**: 替换或操作输出配置。
- **`renderStart(outputOptions, inputOptions)`**: 开始渲染产物。
- **`banner` / `footer` / `intro` / `outro`** `(async, parallel)`: 往生成的 Chunk 代码的头部、尾部或内部开头/结尾注入纯文本注释（如版权声明）。
- **`renderDynamicImport(sync, first)`**: 自定义动态导入代码的生成方式。
- **`augmentChunkHash(sync, sequential)`**: 如果你希望更改某个 Chunk 的 Hash 值，可以在这里提供一个自定义字符串。
- **`resolveFileUrl` / `resolveImportMeta``(sync, first)`**: 处理代码中的 `import.meta.url` 和 `import.meta.xxx` 属性。
- **`renderChunk(code, chunk, options)`**: 针对每一个生成的 Chunk 执行处理。适合在此处进行代码压缩（Minification）或注入特定代码片段。
- **`generateBundle(options, bundle, isWrite)`**: 产物渲染完毕、准备落盘前触发。可以在此处获取最终所有的产物对象（`bundle`），动态添加新的 CSS 或 JSON 文件，甚至删除不需要的产物。
- **`writeBundle(options, bundle)`**: 所有文件成功写入硬盘后触发，适合执行后置清理。
- **`closeBundle(async, parallel)`**: Rollup 进程彻底关闭时触发。清理内存和定时器的最佳位置。

### 3.3 插件上下文（Plugin Context）详解

在钩子函数内部，`this` 指向的是一个 `PluginContext` 对象。它提供了 Rollup 暴露出的各种底层能力，是开发插件的“**武器库**”：

#### 3.3.1 产物与文件发射 (File Emission)

这组 API 掌控着 Rollup 最终的物理输出，允许插件在构建流程中无中生有地创建新文件。

- **`this.emitFile(emittedFile)`**: 允许插件动态生成产物。它可以向构建队列中注入一段动态 JS 执行块（Chunk）或纯静态资源（Asset）。调用后不会立刻返回最终文件名，而是返回一个内部凭证 `referenceId`。
- **`this.getFileName(referenceId)`**: 凭证兑换器。利用 `emitFile` 返回的 `referenceId`，在产物即将写盘的阶段（如 `generateBundle` 钩子），向 Rollup 索要最终带 Hash 值的真实文件名，常用于动态替换 HTML 中的静态资源路径。
- **`this.setAssetSource(referenceId, source)`**: 延迟内容注入器。允许插件在构建早期通过 `emitFile` 预留一个文件占位符，直到产物生成的最后阶段才计算并注入真实的物理内容（例如等待所有模块分析完毕后，汇总生成的 Manifest 字典）。

#### 3.3.2 模块图谱与依赖解析 (Module & Resolution)

这组 API 是插件与 Rollup 核心数据结构（ModuleGraph）进行对话的桥梁，用于分析代码之间的血脉关系。

- **`this.resolve(source, importer, options?)`**: 主动调用 Rollup 的路径解析算法，帮助插件在代码分析阶段提前定位其他模块。例如将 `import 'vue'` 转化为真实的电脑物理绝对路径，并自动触发其他插件的 `resolveId` 逻辑。
- **`this.load(options)`**: 强制预加载指定模块。指示 Rollup 强行将其拉入当前的解析流水线中，提前触发该文件的 AST 解析和依赖图谱构建，常用于突破按需加载的物理限制。
- **`this.getModuleInfo(moduleId)`**: 获取指定模块的底层元数据。它能精确查出该绝对路径文件被谁引用了（`importers`）、是否通过 `import()` 动态引入（`dynamicallyImportedBy`），以及是否含有阻碍 Tree-Shaking 的副作用代码（`moduleSideEffects`）。
- **`this.getModuleIds()`**: 依赖遍历器。返回一个迭代器，包含当前整个项目中所有已经被引擎成功解析、并纳入 ModuleGraph 的文件绝对路径集合。

#### 3.3.3 诊断与日志拦截 (Diagnostics & Logging)

架构师级别的错误处理规范，确保所有的异常提示都能与 Rollup 自身的报错保持极致的统一。

- **`this.error(error, position?)`**: 规范化致命错误处理。一旦触发将强制熔断整个打包进程。如果在第二个参数传入行号或 AST 节点索引，Rollup 会在终端完美打印出带有高亮代码帧（Code Frame）的错误日志。
- **`this.warn(warning, position?)`**: 规范化警告处理。向终端输出黄色提示信息，但允许构建流水线继续运转。同样支持传入 `position` 实现精准的代码定位。

#### 3.3.4 AST 算力与底层引擎 (AST & Engine)

压榨性能的核心接口，避免插件重复造轮子。

- **`this.parse(code, acornOptions?)`**: 调用 Rollup 内置的 Acorn 解析器，将源码转化为 AST。通过复用引擎，无需在插件内引入庞大的 AST 解析库，极大降低内存损耗和多重 AST 解析的时间成本。
- **`this.getCombinedSourcemap()`**: 映射溯源器。仅在 `transform` 钩子中可用，用于获取当前文件经过前面所有插件层层转换后，累积合并出来的终极 SourceMap。这对于编写需要精准还原代码位置的复杂转换插件至关重要。

#### 3.3.5 缓存、环境感知与边界突破 (Cache, Meta & Edge)

用于处理边界 Case，或者进行极端的性能调优。

- **`this.addWatchFile(id)`**: 监听域扩充器。强制 Rollup 的底层 Chokidar 将那些**不属于 JS 模块图谱的文件**（如 `.env` 配置、外部 HTML 模板、特定的 JSON Schema）纳入实时监控。一旦这些文件变动，立刻唤醒重新构建。
- **`this.cache`**: 插件级的持久化缓存接口。提供 `set`、`get`、`delete` 方法，允许插件将极其耗时的计算结果（如网络请求响应、重型 AST 遍历结果）缓存到本地，在下次执行 `npm run build` 时直接复用。
- **`this.meta`**: 环境探针。返回一个包含 `rollupVersion` 和 `watchMode`（当前是否开启了监听模式）的对象。使得插件能够针对不同的 Rollup 版本做出向下兼容，或在 Watch 模式下主动跳过某些耗时的压缩逻辑。

### 3.4 生产级插件案例

如果在构建一套成体系的前端工程（例如高度定制化的组件库或高安全性的金融级中后台系统）时，通常会遇到配置分离、源码篡改安全和产物监控三大痛点。
这个插件就是为了在 Rollup/Vite 的流水线中一次性解决这三个问题而设计的，它主要扮演了以下三个核心角色：

- **扮演“环境伪装者”：虚拟模块注入**
- **扮演“精密主刀医生”：外科手术级的代码篡改**
- **扮演“产物安检员”：自动化的体积与依赖监控**

:::code-group

```typescript [rollup-pulgin-enterprise-master.ts]
//生成一个极其严谨的“安检放行函数”，用来决定当前的文件到底该不该被你的插件处理。
import { createFilter } from '@rollup/pluginutils'
//MagicString作用：在极度复杂的源码篡改过程中，保持原始索引稳定，并完美生成 SourceMap”的微型库
//所有的操作（增加、删除、修改），永远只认“原始代码的初始索引”，可以在原始代码的初始索引的基础上改动源码，而不用担心会影响后面源码的索引
import MagicString from 'magic-string'
// 引入轻量级 AST 遍历工具
import { walk } from 'estree-walker'

// 1. 严谨的入参类型定义
export interface EnterprisePluginOptions {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  injectEnv?: Record<string, string> //注入环境变量
  version?: string // 允许外部传入需要注入的版本号
}

export default function enterpriseMasterPlugin(
  options: EnterprisePluginOptions = {},
): Plugin {
  // 工业基建 1：精准的路径过滤器，避免误伤 node_modules 或静态资源
  const filter = createFilter(
    options.include || ['**/*.js', '**/*.ts', '**/*.vue'],
    options.exclude || 'node_modules/**',
  )
  //虚拟模块
  const VIRTUAL_MODULE_ID = 'virtual:app-context'
  const RESOLVED_VIRTUAL_ID = '\0' + VIRTUAL_MODULE_ID
  //版本
  const targetVersion = options.version || '1.0.0'

  return {
    name: 'rollup-plugin-enterprise-master',

    // 阶段一：模块图谱构建 (Build Phase)
    //拦截了代码里对 virtual:app-context 这个假路径的引入请求。
    //它不让打包工具去硬盘上找这个文件，而是在内存里凭空捏造了一段包含了环境变量的 JS 代码喂给业务逻辑。

    // 1. 寻址守门员：处理虚拟模块
    resolveId(source) {
      if (source === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_ID
      }
      return null
    },

    // 2. 源码装载器：凭空捏造虚拟模块的代码
    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        const envData = options.injectEnv || { mode: 'production' }
        return `export const AppContext = ${JSON.stringify(envData)};`
      }
      //注入虚拟模块的代码，如下：
      //export const AppContext = {"mode":"production","apiUrl":"https://api.xunbei.com/v1","buildTime":"2026-06-12T09:00:00.000Z"};
      return null
    },

    // 3. 核心转换器：AST 级别精准篡改,把代码里的（ __VERSION__）标记替换成真实的 1.0.0
    transform(code, id) {
      //没有匹配的文件，直接返回
      if (!filter(id)) return null
      // 性能前置防御：无特征直接放行
      if (!code.includes('__VERSION__')) return null

      // 企业级操作 1：使用底层上下文复用 AST 解析
      const ast = this.parse(code)
      const magicString = new MagicString(code)
      let hasReplacements = false

      // 遍历整棵抽象语法树
      walk(ast, {
        enter(node: any, parent: any) {
          if (node.type === 'Identifier' && node.name === '__VERSION__') {
            // 边界防御：绝不破坏对象属性键值对
            if (parent && parent.type === 'Property' && parent.key === node)
              return
            // 边界防御：绝不破坏变量声明本身
            if (
              parent &&
              parent.type === 'VariableDeclarator' &&
              parent.id === node
            )
              return

            // 安全重写并标记变更
            magicString.overwrite(node.start, node.end, `"${targetVersion}"`)
            hasReplacements = true
          }
        },
      })

      if (!hasReplacements) return null

      // 必须返回携带 SourceMap 的结果以保证调试链路完整
      return {
        code: magicString.toString(),
        map: magicString.generateMap({ hires: true }), //hires: true：是否生成高分辨率的字符级映射（现代前端必备）
      }
    },

    // 阶段二：产物生成与发射 (Output Phase)
    //在打包流程的最后一刻（generateBundle），它像海关安检一样，把所有即将输出的 .js、.css 文件全部扫描一遍。计算出每个文件的体积，
    //并逆向梳理出每个 Chunk 包含了哪些模块依赖，最终生成一份详细的 .build-metrics.json 报告。

    // 4. 产物收尾器：自动化拦截并生成监控报告
    generateBundle(outputOptions, bundle) {
      const report = {
        buildTime: new Date().toISOString(),
        totalSizeKB: 0,
        chunks: [] as any[],
        assets: [] as any[],
      }

      // 企业级操作 2：深层遍历分析 Bundle 字典，提取产物元数据
      for (const [fileName, output] of Object.entries(bundle)) {
        //可执行代码块
        if (output.type === 'chunk') {
          const sizeKB = Number((output.code.length / 1024).toFixed(2))
          report.totalSizeKB += sizeKB

          report.chunks.push({
            name: fileName,
            sizeKB: sizeKB, //监控包体积膨胀的直接数据源。
            isEntry: output.isEntry, //标记这是否是 index.html 直接引用的主入口文件（通常是最重要的，它的体积直接决定了首屏白屏时间）
            isDynamic: output.isDynamicEntry, //标记这个文件是不是通过按需加载（import('./xxx.js')）分裂出来的小包。
            // 抽取内部模块依赖树
            dependencies: Object.keys(output.modules), //output.modules 是一个对象，记录了哪些原始源码文件被塞进了这个最终的 Chunk 里。
          })
        }
        //静态资源
        else if (output.type === 'asset') {
          //sset 资源的形态是不固定的。
          // 如果这是一个经过抽取生成的 .css 文件或 .svg 文件，它的 output.source 是一段纯文本字符串 (string)。
          // 否则是二进制文件，必须使用 .byteLength 才能准确计算出二进制文件的真实字节大小。
          const sourceLength =
            typeof output.source === 'string'
              ? output.source.length
              : output.source.byteLength

          const sizeKB = Number((sourceLength / 1024).toFixed(2))
          report.totalSizeKB += sizeKB

          report.assets.push({
            name: fileName,
            sizeKB: sizeKB,
          })
        }
      }

      // 动态向硬盘队列中发射隐藏的分析报告文件
      this.emitFile({
        type: 'asset',
        fileName: '.build-metrics.json',
        source: JSON.stringify(report, null, 2),
      })
      console.log(`\n📦 产物分析报告已生成: dist/.build-metrics.json`)
    },
  }
}
```

```js [rollup.config.js]
import enterpriseMasterPlugin from './plugins/enterprise-master'

// 假设我们通过命令行参数获知当前是在打生产环境的包
const isProd = process.env.NODE_ENV === 'production'

export default {
  // ... 其他配置
  plugins: [
    enterpriseMasterPlugin({
      // 核心：在这里把外部数据通过 injectEnv 传给插件
      injectEnv: {
        mode: isProd ? 'production' : 'development',
        apiUrl: isProd
          ? 'https://api.xunbei.com/v1'
          : 'http://localhost:3000/api',
        buildTime: new Date().toISOString(),
      },
    }),
  ],
}
```

```js [api/request.js]
// 完全不需要关心目前是线上还是测试环境，直接引入虚拟模块,就像它真的存在于硬盘上一样！
// 就可以获取到插件里面虚拟模块注入的外部数据
import { AppContext } from 'virtual:app-context'

console.log('当前打包时间:', AppContext.buildTime)

// 直接使用注入的 API 地址初始化 Axios
const axiosInstance = axios.create({
  baseURL: AppContext.apiUrl,
  timeout: 5000,
})
```

:::

## 4. 企业级组件库打包架构指南 (Rollup 标准版)

在现代前端工程化中，虽然应用层开发多趋向于 Vite / Webpack，但对于底层基建、需要精细控制产物格式、追求极致 Tree-Shaking 的组件库而言，**Rollup 依然是不可替代的黄金准则**。

### 4.1 架构核心原则（The Core Philosophy）

在动手写配置前，架构师必须明确组件库打包的三大铁律：

- **依赖外置 (External)：** 绝对不能将宿主环境已有的依赖（如 `vue`, `react`, `lodash`）打包进产物，否则会导致包体积臃肿及多实例冲突。
- **多态输出 (Multi-format)：** 产物必须同时提供 `ESM`（供现代打包工具进行 Tree-Shaking）和 `CJS`（兼容老旧 Node/SSR 环境）。
- **类型完备 (DTS)：** 必须提供精准且干净的 `.d.ts` 类型声明文件。

### 4.2 工程初始化与依赖阵列

我们推荐使用 `pnpm` 作为包管理器，天然支持 `Monorepo` 且能避免幽灵依赖。

```bash
mkdir enterprise-ui && cd enterprise-ui
pnpm init
```

安装 `Rollup` 及其核心战术插件组：

```bash
# 1. 核心打包引擎与节点解析
pnpm add -D rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs

# 2. TypeScript 与 Vue 支持
pnpm add -D typescript rollup-plugin-typescript2 rollup-plugin-vue vue

# 4. 样式处理流水线 (支持 SCSS, 自动前缀, 压缩)
pnpm add -D rollup-plugin-postcss postcss autoprefixer cssnano sass

# 4. 代码压缩与类型文件统合
pnpm add -D @rollup/plugin-terser rollup-plugin-dts

# 5. 宿主依赖 (只在开发时需要，标记为 peerDependencies)
pnpm add -D vue
```

### 4.3 确立源码结构

源码目录的设计直接决定了组件库后期的可扩展性。采用“组件与样式分离”的范式：

```text
enterprise-ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   │   ├── src/
│   │   │   │   └── Button.vue     # 核心逻辑与 DOM 结构
│   │   │   ├── style/
│   │   │   │   └── index.scss     # 组件专属样式
│   │   │   └── index.ts           # 组件独立注册入口 (支持按需引入)
│   │   └── index.ts               # 所有组件统一出口
│   ├── styles/
│   │   ├── variables.scss         # 全局 CSS 变量 (Tokens)
│   │   └── index.scss             # 统一样式总闸
│   ├── utils/                     # 内部工具函数
│   └── index.ts                   # 📦 全局安装与全量导出总闸
├── rollup.config.js               # 核心构建引擎配置
├── tsconfig.json                  # TS 配置
└── package.json                   # 产物路由表

```

### 4.4 编写核心构建引擎 (`rollup.config.js`)

在项目根目录创建该文件。我们需要执行两套构建任务：一套用于**代码打包**，一套用于**类型声明 (.d.ts) 合并**。

```javascript
import resolve from '@rollup/plugin-node-resolve' //告诉 Rollup 如何去 node_modules 里找第三方包。
import commonjs from '@rollup/plugin-commonjs' //把传统的 CommonJS 包转换成 ESM，让 Rollup 能处理它们。
import vue from 'rollup-plugin-vue' //专属的 Vue 3 单文件组件（SFC）编译器
import typescript from 'rollup-plugin-typescript2' //将 TypeScript (.ts) 编译为 JavaScript (.js)。
import postcss from 'rollup-plugin-postcss' //强大的 CSS/样式处理流水线。
import terser from '@rollup/plugin-terser' //极其强悍的代码压缩和混淆工具。
import dts from 'rollup-plugin-dts' //将零散的 TypeScript 类型声明合并为单一文件。
import fs from 'fs' //Node.js 内置的文件系统模块，用于读写本地文件。

// 动态读取 package.json，自动将 dependencies 和 peerDependencies 设为外部依赖
const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
)
const external = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.dependencies || {}),
]

// 基础插件队列
const basePlugins = [
  resolve({ extensions: ['.vue', '.ts', '.js'] }),
  commonjs(),
  vue({
    target: 'browser', //明确告诉 Vue 编译器，这份代码最终是在浏览器环境中运行的。
    preprocessStyles: true, //将样式预处理的权力“外包”出去。
  }),
  typescript({
    useTsconfigDeclarationDir: true, //强制插件尊重项目根目录 tsconfig.json 里配置的 declarationDir（类型文件输出目录）路径。
    tsconfigOverride: { compilerOptions: { declaration: true } }, //无论用户根目录的 tsconfig.json 是怎么写的，都在这里强行覆盖，开启 declaration: true。
  }),
  postcss({
    extract: 'dist/index.css', // 提取为独立的 CSS 文件
    minimize: true,
    use: ['sass'], //开启底层的 Sass/SCSS 编译器
    plugins: [require('autoprefixer')(), require('cssnano')()],
  }),
]

export default [
  // 1. 全量构建：输出 ESM 和 CJS 格式
  {
    input: 'src/index.ts',
    external, // 绝不打包 vue 等外部依赖
    output: [
      {
        format: 'es',
        file: pkg.module, // 指向 dist/index.esm.js
        sourcemap: true,
      },
      {
        format: 'cjs',
        file: pkg.main, // 指向 dist/index.cjs.js
        exports: 'named',
        sourcemap: true,
      },
    ],
    plugins: [
      ...basePlugins,
      terser(), // 生产级代码混淆与压缩
    ],
  },

  // 2. 类型定义墙：统合全库 TypeScript 声明
  {
    input: 'src/index.ts',
    external: [/\.css$/, /\.scss$/], // 忽略样式文件
    plugins: [dts()],
    output: {
      format: 'es',
      file: pkg.types, // 指向 dist/index.d.ts
    },
  },
]
```

### 4.5 配置产物路由与 Tree-Shaking 命脉 (`package.json`)

这是组件库开发中最容易踩坑的地方。`package.json` 不仅仅是依赖管理，它更是现代构建工具（Vite/Webpack）的**寻址路由表**。

:::code-group

```json [packgae.json]
{
  "name": "enterprise-ui",
  "version": "1.0.0",
  "description": "企业级可扩展组件基座",
  "type": "module",

  // 1. 传统入口字段
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",

  // 2. 现代化入口路由 (Node 12+ 引入，Vite/Webpack5 强依赖此字段)
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js"
    },
    // 允许使用者直接引入样式: import 'enterprise-ui/dist/index.css'
    "./dist/*": "./dist/*"
  },

  // 3. 发布白名单 上传npm包
  "files": ["dist", "README.md"],

  // 4. 依赖护城河
  "peerDependencies": {
    "vue": ">=3.2.0"
  },

  // 5. 核心防坑：副作用声明 (保证样式不被 Tree-Shaking 误删)
  "sideEffects": ["dist/*", "*.css", "*.scss"],

  "scripts": {
    "build": "rollup -c",
    "clean": "rm -rf dist"
  }
}
```

:::

### 4.6 组件暴露规范 (以 Button 为例)

为了让组件既支持 `app.use(EnterpriseUI)` 全局注册，又支持 `import { Button } }` 局部注册，我们需要统一暴露规范。

:::code-group

```typescript [src/components/Button/index.ts]
import type { App } from 'vue'
import Button from './src/Button.vue'

// 挂载 install 方法
Button.install = function (app: App) {
  app.component(Button.name || 'EntButton', Button)
}

export default Button
```

```typescript [src/index.ts]
import type { App } from 'vue'
import Button from './components/Button'

// 1. 具名导出，支持按需引入
export { Button }

// 2. 默认导出，支持全局全量安装
const components = [Button]
export default {
  install(app: App) {
    components.forEach(comp => {
      app.use(comp)
    })
  },
}
```

:::

### 4.7 构建与发布工作流

#### 4.7.1 **执行构建**

```bash
pnpm run clean
pnpm run build
```

#### 4.7.2 **产物完整性人工审查**

打开生成的 `dist`（或 `lib`）目录，您必须肉眼确认以下四类文件是否存在：

- ESM 产物：如 `index.mjs` 或 `index.es.js`（现代构建工具按需引入的核心）。
- CJS 产物：如 `index.cjs` 或 `index.cjs.js`（兼容老旧 Node 环境）。
- 样式文件：如 `style.css` 或 `index.css`（确保组件样式未丢失）。
- 类型文件：如 `index.d.ts`（确保使用者能获得完美的 TypeScript 提示）。

#### 4.7.3 **本地联调测试**

在发布 npm 之前，务必在本地的另一个业务项目中执行 `pnpm link <path-to-enterprise-ui>`，实际引入并观察：

- 样式是否正常加载？
- TypeScript 类型提示是否正常弹出？
- 产物包大小是否符合预期？

#### 4.7.4 **终极发布**

**1. 登录 NPM 账号**
如果您还没登录，需要在终端执行：

```bash
npm login

```

_注意：如果您平时使用了淘宝镜像（如 cnpm 或通过 nrm 切换了源），必须先将源切换回 npm 官方源！_

```bash
npm config set registry https://registry.npmjs.org/

```

**2. 执行发布命令**
在组件库根目录执行：

```bash
npm publish

```

_如果您的包名带有作用域（例如 `@your-org/ui-lib`），npm 默认会将其视为私有包并拒绝发布。如果是开源库，需要追加参数：_

```bash
npm publish --access public
```

**3. 线上验证**
发布成功后，静待几分钟。打开 `https://unpkg.com/您的包名` 或 `https://jsdelivr.net/npm/您的包名`，检查线上的 CDN 目录结构是否与您本地的 `dist` 完全一致。至此，您的组件库正式走向世界！

## 5. 常见问题 (FAQ) 与避坑指南

### 5.1 经典面试题：Webpack 和 Rollup 到底该怎么选？

- **答**：行业内有一句公认的黄金准则：**"App 选 Webpack (Vite)，Library 选 Rollup"**。
  - **开发业务应用 (App)**：你需要处理极其复杂的路由、海量的图片/CSS、代码分割，以及极其依赖开发时的热更新 (HMR)。这些是 Webpack 和 Vite 的绝对强项，Rollup 处理这些会非常吃力。
  - **开发类库 (Library)**：比如写一个 Vue 组件库、一个工具函数包。你的代码最终会被别人 `npm install` 并用 Webpack/Vite 再次打包。你需要的仅仅是极其干净的、支持按需引入的纯 JS 产物。这时候如果用 Webpack，产物里塞满的闭包函数会恶心死使用者，**Rollup 才是绝对的王者**。

### 5.2 为什么 Rollup 提示 `Unresolved dependencies` (找不到 npm 包)？

- **答**：
  - **原因**：与 Webpack 默认会去 `node_modules` 里找包不同，Rollup 默认情况下**极其“清高”**。它只认识像 `import { a } from './utils.js'` 这种相对路径。如果你写了 `import _ from 'lodash'`，它根本不知道去哪找，会将其视作外部依赖并抛出警告。
  - **避坑指南**：必须安装并配置官方插件 `@rollup/plugin-node-resolve`。它赋予了 Rollup 像 Node.js 一样去 `node_modules` 目录下寻址的能力。

### 5.3 为什么引入了 npm 包后，Rollup 报错 `Does not export xyz` 或报语法错误？

- **答**：
  - **原因**：Rollup 只支持 ES Modules (即 `import/export`)。但是 `node_modules` 里面的历史遗留包，大约有 70% 是使用 CommonJS (`require/module.exports`) 导出的（比如老版本的 React）。Rollup 拿到这些代码直接懵了。
  - **避坑指南**：必须紧接着 resolve 插件之后，配置 `@rollup/plugin-commonjs` 插件。它的唯一作用就是将第三方库底层的 CommonJS 语法动态转换为 ESM 语法，从而让 Rollup 能继续愉快地进行 Tree-shaking 静态分析。

### 5.4 `external` 属性到底有多重要？如果不配置会引发什么灾难？

- **答**：在类库开发中，它是**生死攸关**的属性。
  - 假设你开发了一个 React 组件库，你依赖了 `react`。如果你不把 `'react'` 加入 `external` 数组，Rollup 会非常敬业地**把整个 React 的源码打包进你的组件库产物中**！
  - **灾难后果**：
    1. 你的组件库体积直接暴增几百 KB。
    2. 当别人安装你的组件库时，别人自己的项目里有一个 React，你的库里也夹带了一个私货 React。由于 React 的底层机制限制，**如果同一个页面运行着两个不同实例的 React，会导致严重的不可预知 Bug（如 Hooks 报错崩溃）**。
  - **正解**：将所有在 `package.json` 的 `peerDependencies` 中的包，全部声明在 `external` 数组中。告诉 Rollup：“别管它，假定运行环境中已经存在这个包了”。

### 5.5 `output.file` 和 `output.dir` 有什么区别？什么时候用哪个？

- **答**：
  - **`file`**：用于输出**单一**文件。如果你的 `input` 只有一个起点，且代码中没有任何动态导入（`import()`），Rollup 默认会把所有代码打包进这一个文件中，此时必须使用 `file`。
  - **`dir`**：用于输出**目录**。只要你的配置涉及了**多入口 (Multiple inputs)** 或者**代码分割 (Code splitting 动态导入)**，Rollup 会产出多个 chunk 文件，此时配置 `file` 会直接报错，必须配置 `dir` 指定输出文件夹。

### 5.6 开发 UMD 格式时，控制台疯狂警告 `Missing global variable name` 是怎么回事？

- **答**：
  - **原因**：UMD 和 IIFE 格式旨在直接运行在浏览器中。如果你配置了 `external: ['react']`，Rollup 知道不打包 React，但浏览器运行时根本没有 `require` 或 `import` 机制，它怎么去找到 React 呢？它只能去全局变量 `window` 上找。
  - **解决方案**：必须在 `output` 中配置 `globals` 映射对象。比如 `globals: { react: 'React' }`。这句话的意思是：将代码中引入的 `react` 模块，映射并替换为浏览器全局变量 `window.React`。如果不配，Rollup 就会抛出上述警告，且你的库在浏览器里会报错崩溃。

### 5.7 `output.exports` 属性是干什么用的？为什么有时候会报 "mixed exports" 警告？

- **答**：这主要发生在你将包含 ES6 `export default` 的代码打包成 CommonJS (`cjs`) 格式时。
  - **背景**：ES Modules 允许同时存在**具名导出** (`export const a`) 和**默认导出** (`export default b`)。但在 Node.js 的 CommonJS 中，只有单一的 `module.exports`。
  - **警告原因**：Rollup 不知道该如何完美地将混合导出映射到 `module.exports` 上。如果它强行映射，可能会改变代码的使用方式（比如使用者必须写 `require('lib').default` 才能拿到默认导出）。
  - **解决方案**：显式配置 `output: { exports: 'named' }`。这告诉 Rollup：“我知道有混合导出，请把它们统一挂载为 `module.exports.xxx` 和 `module.exports.default`”。或者重构你的源码，尽量只使用具名导出。

### 5.8 为什么我的 Rollup 连 CSS 和图片都打包不了？

- **答**：
  - **理念差异**：Webpack 认为“万物皆模块”，而 Rollup 坚持“我就是一个纯粹的 JavaScript 打包器”。它原生在解析阶段完全不认识 `.css` 或 `.png` 等静态资源。
  - **避坑指南**：如果你在开发组件库时必须引入 CSS，你需要安装并配置相关的 Rollup 插件（如 `rollup-plugin-postcss`）。但这其实并不是 Rollup 的强项。现代组件库（如 VueUse 或某些 React 库）往往建议**将 CSS 和 JS 分离编译**（例如用 Gulp 单独处理 Less/Sass），以保持 JS 逻辑包的绝对纯净。
