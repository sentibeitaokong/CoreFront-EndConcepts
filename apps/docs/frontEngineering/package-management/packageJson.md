---
outline: [2, 3] # 这个页面将显示 h2 和 h3 标题
---

# package.json 工程化

在现代前端与 Node.js 工程化的宏大版图中，如果说 Webpack/Vite 是流水线的“**引擎**”，TypeScript 是保证质量的“**法律**”，那么 `package.json` 就是整个工程的“**DNA 与宪法**”。

它不仅仅是一个记录包名的静态 JSON 文件,而是决定了**依赖拓扑结构、模块寻址策略、任务调度生命周期以及跨环境兼容性**的底层控制中心。彻底读懂 `package.json`，是跨越基础开发、迈向工程化架构师的关键一步。

## 1. 核心痛点与时代背景

在 npm（Node Package Manager）与 `package.json` 规范诞生之前，JavaScript 世界的依赖管理是一场纯粹的灾难：

- **手工复制时代：** 开发者需要去各个官网下载 jQuery、Lodash 的压缩包，手动拖入项目的 `vendor` 文件夹。
- **版本黑洞：** 没有任何文件记录当前项目使用的是哪个版本的库。半年后如果需要升级，没人知道会引发什么毁灭性的连锁崩溃。
- **依赖传递真空：** 如果你的项目依赖包 A，而包 A 又依赖包 B，你需要手动把 A 和 B 都下载下来并严格按照顺序引入。

## 2. 身份标识与语义化版本 (Metadata & SemVer)

一个合法的 npm 包，必须拥有身份标识和明确的版本号。

### 2.1 核心元数据

- **`name`：** 包的唯一标识符。在企业级开发中，通常结合 Scope（作用域）使用，如 `@xbElement/button`，这能有效避免命名冲突，并方便配置私有镜像源。
- **`version`：** 严格遵循 **SemVer（语义化版本控制规范）**。
- **`private`：** 设为 `true` 是一道**绝对的物理防线**，防止企业内部的业务项目被意外执行 `npm publish` 泄露到公网。

### 2.2 SemVer 语义化版本体系

版本号格式为：`主版本号(Major).次版本号(Minor).修订号(Patch)`

- **Major（破坏性更新）：** 做了不兼容的 API 修改（如 Vue 2 升级 Vue 3）。
- **Minor（功能性更新）：** 向下兼容地新增了功能。
- **Patch（补丁更新）：** 向下兼容地修复了 Bug。

**依赖版本声明的魔法符号：**

- `"vue": "^3.2.0"`：**（最常见）** 锁定主版本。允许安装 `3.x.x` 中的最新版本，但绝不会自动升级到 `4.0.0`。
- `"vue": "~3.2.0"`：锁定次版本。允许安装 `3.2.x` 中的最新版本，但绝不会升级到 `3.3.0`。
- `"vue": "3.2.0"`：**（强锁定）** 必须且只能安装这个精确版本。

### 2.3 发布与工具链约束

[width(14,36,50)]

| 字段                 | 作用                                               | 高频用法与避坑                                       |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| **`types`**          | TypeScript 类型声明入口，指向 `.d.ts`              | 与 `main` / `exports` 配合，缺失则调用方无提示       |
| **`files`**          | 发布到 npm 的文件白名单（数组）                    | 只填 `dist`，避免把 `src`、测试、配置一起上传        |
| **`sideEffects`**    | 告诉打包器哪些文件有副作用，`false` 表示可安全摇树 | 含独立 CSS 时绝不能设 `false`，要写成 `["**/*.css"]` |
| **`packageManager`** | 声明项目使用的包管理器及版本（Corepack 依据）      | 如 `"pnpm@9.0.0"`，强制团队统一                      |
| **`engines`**        | 声明 Node / 包管理器版本要求                       | 配合 `.npmrc` 的 `engine-strict=true` 才会真正拦截   |
| **`browserslist`**   | 声明目标浏览器范围，供 Autoprefixer / Babel 读取   | 与构建产物的兼容性直接挂钩，不要随意删               |

## 3. 依赖管理体系 (Dependencies)

在企业级架构中，乱装依赖是导致项目“**体积爆炸**”和“**本地跑得通，线上部署报错**”的罪魁祸首。理解依赖分类是架构师的基本功。

[width(17,28,22,33)]

| 字段名称                   | 定位与生命周期                                                                        | 典型代表                                                 | 架构师避坑指南                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **`dependencies`**         | **生产运行时依赖**。最终会打包进产物，或在 Node.js 服务端运行时必须调用的代码。       | `vue`, `react`, `axios`, `lodash`                        | 开发纯前端项目（经过 Vite 打包）时，无论放 dependencies 还是 devDependencies 最终产物都一样。但**如果是开发 npm 供他人使用，千万别放错！** |
| **`devDependencies`**      | **开发与构建期依赖**。仅在本地开发和 CI/CD 编译时需要，绝对不应出现在最终生产环境中。 | `vite`, `typescript`, `eslint`, `vitest`                 | 上线前在服务器执行 `npm install --production` 会自动忽略该目录，极大加快部署速度。                                                         |
| **`peerDependencies`**     | **同级宿主依赖**。你开发的包不自带该依赖，而是要求宿主环境必须提供特定版本的依赖。    | 开发 Vite 插件需指定 `vite`；开发 Vue 组件库需指定 `vue` | 解决 “**单例模式崩溃**” 的核心武器。如果你的组件库自带了 Vue，业务系统也装了 Vue，运行时会出现两个 Vue 实例，导致响应式彻底失效。          |
| **`optionalDependencies`** | **可选依赖**。即使安装失败，也不会阻塞整个项目的 `npm install` 进程。                 | `fsevents` (仅 macOS 系统需要的底层监听库)               | 多用于跨平台底层 C++ 绑定的优雅降级。                                                                                                      |

## 4. 模块化与入口解析机制

这部分直接与 JavaScript 模块化（CJS vs ESM）的底层逻辑挂钩。Node.js 和构建工具就是通过这些字段来决定“**去哪里找你的代码**”。

### 4.1 模块系统分水岭：`type` 字段

Node.js 面临着 CJS 与 ESM 互操作的巨大历史包袱。

- **默认行为：** 如果不写，Node.js 默认将项目下所有`.js`文件视为CommonJS(`require/module.exports`)。
- **拥抱现代：** 设置 `"type": "module"`。这会强制 Node.js 将所有 `.js` 文件按原生 ES Modules 解析。如果此时还需要写 CJS，必须显式将文件后缀改为 `.cjs`。

### 4.2 历史遗留入口：`main` 与 `module`

> 早期，由于只有 CommonJS，一切都很简单。后来为了兼容构建工具，增加了 `module`。

[width(23,13,21,43)]

| 字段                             | 产物格式     | 谁读它                        | 说明                                                                                                                    |
| :------------------------------- | :----------- | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **`"main": "dist/index.js"`**    | **CommonJS** | Node.js、早期的 Webpack       | 最古老、最标准的入口。                                                                                                  |
| **`"module": "dist/index.mjs"`** | **ESM**      | Webpack / Vite 等现代打包工具 | **非官方规范**，由 Rollup 提出；打包器会**优先读取这个 ESM 入口**以实现完美的 Tree-Shaking，但 Node.js 原生并不认识它。 |

### 4.3 终极形态：`"exports"` 字段 (Node 12+)

> 随着 ESM 成为官方标准，`"exports"` 字段带来了破坏性的革命，它不仅控制入口，还控制了**模块的物理访问权限**。

- **多环境条件导出 (Conditional Exports)：** 根据使用者的环境（是 Node 还是浏览器？是 `require` 还是 `import`？），自动分发不同的代码产物。
- **内部文件封装 (Encapsulation)：** 以前，别人可以通过 `import 'lib/src/internal.js'` 强行读取你未公开的源码。有了 `"exports"`，没有被显式导出的文件，外部**绝对无法访问**（报错 `ERR_PACKAGE_PATH_NOT_EXPORTED`）。

```json
{
  "name": "my-ui-lib",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.mjs", // 当使用 import myLib 时走这里
      "require": "./dist/index.cjs", // 当使用 require('myLib') 时走这里
      "types": "./dist/index.d.ts" // 告诉 TS 编译器类型文件在哪
    },
    "./button": "./dist/components/button.js" // 允许细粒度引入 import { Btn } from 'my-ui-lib/button'
  }
}
```

## 5. 任务编排与生命周期 (Scripts)

在前端工程化体系中,`package.json`里的`scripts`字段扮演着“**中央控制台**”**或**“**自动化任务编排引擎**”的角色。

### 5.1 `scripts` 字段的核心作用

`scripts` 本质上是一个**命令别名（Alias）字典**。它的主要作用是将冗长、复杂、难以记忆的终端命令，封装成简短且语义化的快捷键。

```json
"scripts": {
  "dev": "vite --port 8080 --open",
  "build": "vue-tsc --noEmit && vite build",
  "lint": "eslint src/**/*.{ts,vue} --fix"
}

```

- **统一团队心智：** 无论底层是用 Webpack、Vite 还是 Rollup，团队成员只需要肌肉记忆般地敲下 `pnpm dev` 或 `npm run build`，极大地降低了沟通和协作成本。
- **环境隔离：** 强制项目使用内部安装的工具版本，而不是开发者电脑上的全局版本。

### 5.2 深度解密：为什么 `pnpm dev` 能把项目跑起来？

从敲下 `pnpm dev` 到 Vite 真正跑起来，中间要穿过 **Shell → Node（pnpm）→ 子 Shell → Node（Vite）** 四层进程，并完成一次软链穿透。

#### 5.2.1 Shell 唤醒与指令捕获 (OS & Shell Level)

- **环境寻址：** 终端把`pnpm`当主命令、`dev`当参数，沿`$PATH`从左到右找到全局安装的`pnpm`可执行文件。
- **启动 pnpm 进程：** 该脚本头部声明了 Node 环境，系统据此启动一个 Node 进程来运行 pnpm 源码，控制权正式交接给 pnpm。

#### 5.2.2 配置解析与生命周期编排 (Manifest Parsing)

pnpm 启动后先确定当前的工作上下文：

- **向上寻址：** 从当前目录逐层向上找 `package.json`（以及 `pnpm-workspace.yaml`，用于判断是否处于 Monorepo）。
- **解析脚本映射：** 读取 `scripts` 字段，拿到 `"dev": "vite"` 这条映射。
- **挂前置钩子：** 执行 `vite` 前先检查是否声明了 `"predev"`，存在则插到执行队列最前端。

#### 5.2.3 环境变量劫持与子 Shell 衍生 (PATH Hijacking)

这是“**不用全局安装 Vite 也能跑**”的根本原因。

- **衍生子 Shell：** pnpm 不直接在终端里执行命令，而是用 `child_process` 衍生一个**子 Shell 进程**，继承当前的环境变量。
- **环境劫持：** 启动子 Shell 前，把项目根目录的 `node_modules/.bin` 绝对路径（Monorepo 下还会带上根目录的 `.bin`）**拼到子 Shell `$PATH` 的最前方**。
  - **原环境 `$PATH`：** `/usr/local/bin:/usr/bin:/bin`
  - **被劫持后 `$PATH`：** `/你的项目路径/node_modules/.bin:/usr/local/bin:/usr/bin:/bin`
- **命中本地版本：** 子 Shell 执行 `vite` 时，最先扫到的就是项目自己装的那份。

#### 5.2.4 物理与虚拟的交织-软链穿透 (Symlink Resolution)

`node_modules/.bin/vite` 并不是真的可执行文件，而是一个**软链接**，跟着它要走三层：

- **第一层：** `.bin/vite` → `node_modules/vite/bin/vite.js`。
- **第二层：** `node_modules/vite` 本身又是软链，被导向 pnpm 的虚拟存储：`node_modules/.pnpm/vite@x.x.x/node_modules/vite/bin/vite.js`。
- **第三层：** 虚拟存储里的这个文件是**硬链接**，指向全局 store（如 `~/.local/share/pnpm/store`）里唯一的物理实体。

#### 5.2.5 Shebang 唤醒与进程派生 (Process Spawning)

触达真实的 `vite.js` 后，内核还要知道用什么来运行这段文本。

- **读 Shebang：** 文件第一行是 `#!/usr/bin/env node`，意思是“**去环境变量里找一个叫 `node` 的程序来执行我**”。
- **启动 Vite 进程：** 于是再起一个 Node 进程，这次跑的不再是 pnpm，而是 Vite 核心引擎，本地开发服务器随之开始监听端口。

#### 5.2.6 IPC 通道与信号透传 (Signal & Stream Piping)

Vite 在子进程里跑起来了，还要和你的终端接上。

- **三根管道：** pnpm 衍生 Vite 时建立 `stdin` / `stdout` / `stderr`，你看到的 `Vite ready in 300ms` 就是从 `stdout` 泵回来再渲染到屏幕上的。
- **信号透传：** 按下 `Ctrl + C` 时，内核把 `SIGINT` 发给最外层的 pnpm；pnpm 不立刻退出，而是把它**向下透传**给 Vite，让 Vite 先断开 WebSocket、释放端口，Vite 退出后 pnpm 才退出，把干净的终端还给你。

#### 5.2.7 完整流程图

![Logo](/img/viteFlow.png)

### 5.3 `node_modules/.bin` 里面到底装了什么？

你可能会好奇，`node_modules/.bin` 目录下的 `vite` 文件是怎么来的？

这要归功于 `package.json` 的另一个字段：**`bin`**。
当你执行 `pnpm install vite` 时，pnpm 会去读取 Vite 源码里的 `package.json`，发现里面写着：

```json
// vite 源码中的 package.json
"bin": {
  "vite": "bin/vite.js"
}

```

此时，pnpm 就会在你的项目的 `node_modules/.bin/` 目录下，创建一个名为 `vite` 的**软链接（Symlink）**（在 Windows 下会生成 `.cmd` 或 `.ps1` 脚本），指向 Vite 源码中真实的 `bin/vite.js` 执行文件。

> **架构师视角：**
> 这种机制实现了完美的 “**依赖隔离**”。你的 A 项目可以用 Vite 4，B 项目可以用 Vite 5。因为它们各自执行的是自己 `node_modules/.bin/` 下的版本，永远不会冲突。彻底终结了“**必须全局安装某个工具才能运行**”的刀耕火种时代。

### 5.4 `scripts` 的进阶高级玩法

作为一个中枢系统，`scripts` 还有很多高级特性被广泛应用于 CI/CD 流水线中：

#### 5.4.1 生命周期钩子 (Lifecycle Hooks)

npm 原生支持任务的前置与后置拦截。只要你在命令前加上 `pre` 或 `post`：

```json
{
  "scripts": {
    "prepare": "husky install",
    "prebuild": "rm -rf dist", // 在运行 npm run build 之前，会自动且强制先执行它（常用于清理上一次的 dist 目录）
    "build": "vite build",
    "postbuild": "node deploy.js" // build 执行成功后，会自动接着执行它（常用于上传 sourcemap 到 Sentry 等监控平台）
  }
}
```

当团队成员 `git clone` 项目并在本地执行 `npm install` 完毕后，`prepare` 钩子会**自动且必定**触发。Husky 正是利用这一机制，神不知鬼不觉地为每个开发者自动植入了 Git 提交规范拦截器。

#### 5.4.2 参数透传

如果 `package.json` 中写了 `"dev": "vite"`，而你今天想临时换个端口启动，不需要去改配置文件。
可以使用 `--` 将参数透传给底层的命令：

```bash
# 这等同于执行 vite --port 3000
pnpm dev --port 3000
```

### 5.5 高频 scripts 范式

一个中大型项目里，`scripts` 通常会沉淀成一套固定的命名约定，便于团队与 CI 统一调用：

- **`dev`：** 启动本地开发服务器（带 HMR）。
- **`build`：** 生产构建，常与类型检查串联：`vue-tsc --noEmit && vite build`。
- **`preview`：** 本地预览 `build` 产物，验证打包结果。
- **`lint` / `lint:fix`：** 代码与样式规范检查，CI 中跑 `lint`、本地用 `lint:fix`。
- **`typecheck`：** 把类型检查单独抽出，方便 CI 与编辑器复用。
- **`test` / `test:unit` / `test:e2e`：** 按粒度拆分，CI 里可并行执行互不阻塞。
- **`clean`：** 清理 `dist`、缓存等产物，配合 `prebuild` 钩子自动执行。

## 6. 企业级架构实战：Monorepo 与环境锁定

当系统庞大到需要拆分为多个包在同一个 Git 仓库中管理时，`package.json` 提供了核心支持。

### 6.1 工作区声明 (`workspaces`)

原生支持 Monorepo 架构，将多个子包软链接到一起，实现极速互相调用与依赖提升（Hoisting）：

```json
"workspaces": [
  "packages/*",
  "applications/*"
]

```

### 6.2 发布访问控制 (`publishConfig`)

在企业内网中发布内部组件库时，防止将其发布到公共镜像源：

```json
"publishConfig": {
  "registry": "https://npm.your-company.com/", // 强制指定私有源
  "access": "restricted"                       // 禁止公共访问
}

```

### 6.3 运行环境强校验 (`engines`)

保证整个团队的底层执行环境绝对一致，防止“**在我的电脑上能跑**”的诡异问题：

```json
"engines": {
  "node": ">=18.12.0",
  "pnpm": ">=8.0.0"
}

```

配合 `.npmrc` 中的 `engine-strict=true`，如果团队成员使用了错误的 Node 版本，连 `npm install` 都无法执行。

## 7. 常见问题 (FAQ) 与高级避坑指南

### 7.1 什么是“**依赖地狱 (Dependency Hell)**”，如何强制重写底层依赖？

- **场景：** 你的项目依赖库 A，库 A 依赖了存在致命安全漏洞的库 `lodash@3.0.0`，但库 A 的作者已经跑路不再更新了。
- **破局方案 (Resolutions / Overrides)：**
  在 `package.json` 根目录配置强制重写规则，包管理器在解析依赖树时，会强行将所有底层深埋的漏洞版本替换为你指定的安全版本。

```json
// npm 写法
"overrides": {
  "lodash": "^4.17.21"
}

// yarn / pnpm 写法
"resolutions": {
  "lodash": "^4.17.21"
}

```

### 7.2 既然有了 `package.json`，为什么还需要 `package-lock.json` 或 `pnpm-lock.yaml`？

`package.json` 里的 `^` 号意味着每次别人 `npm install` 时，底层的版本其实是不确定的。

- **锁文件的存在意义**：它不仅记录了项目直接依赖的**绝对精准版本号**，还记录了“**依赖的依赖**”的精准版本及其对应文件的哈希摘要（integrity）。
- **架构铁律**：`lock` 文件必须被提交进 Git 仓库。它保证了张三、李四和云端 CI 部署服务器下载下来的数百个依赖包的**每一个字节都绝对一致**。

### 7.3 什么是“**幻影依赖**”（Phantom Dependencies）？

- **现象**：你的 `package.json` 里根本没有安装 `axios`，但你的代码里写了 `import axios from 'axios'` 居然能正常运行和打包！
- **原因**：历史设计缺陷。老版 npm 采用“**扁平化**”提升结构。你安装了 A，A 依赖了 `axios`。npm 会把 `axios` 提取到顶层 `node_modules` 下。于是你的业务代码“**非法越权**”访问到了它。
- **隐患**：一旦哪天包 A 升级了，去掉了对 `axios` 的依赖，你的项目将在没有任何预警的情况下线上爆炸。
- **解药**：使用 **`pnpm`**。其独特的符号链接（Symlink）架构在物理层面上实施了严格的包访问隔离，彻底消灭了幻影依赖。

### 7.4 `main`、`module`、`exports` 到底该配哪个？

三者面向不同消费者：`main` 是 CJS 入口（Node 与老工具），`module` 是 ESM 入口（仅打包工具识别），`exports` 是 Node 12+ 的官方入口路由，能按 `import` / `require` 条件分发。现代库推荐以 `exports` 为准，同时保留 `main` / `module` 作为兼容兜底。

### 7.5 `packageManager` 字段和 `.npmrc` 有什么区别？

`packageManager` 声明的是“**本项目用哪个包管理器、哪个版本**”，Corepack 会据此自动切换并校验（写错版本时命令直接失败）；`.npmrc` 负责更细的仓库地址、镜像源、`engine-strict` 等配置。前者管“**用谁**”，后者管“**怎么用**”。

### 7.6 `sideEffects: false` 写了之后样式丢了，为什么？

因为 CSS 通常通过 `import './x.css'` 引入，这类导入本身只产生副作用、没有导出。一旦声明 `false`，打包器会认为整个模块可安全删除，把样式一并摇掉。含样式的库必须写成 `"sideEffects": ["**/*.css"]` 来保留。

### 7.7 `scripts` 里的 `pre` / `post` 钩子在哪几个生命周期会触发？

npm 会为 `scripts` 中的每个命令自动挂载 `pre<name>` 与 `post<name>`：执行 `npm run build` 前先跑 `prebuild`、成功后跑 `postbuild`。此外 `prepare` 在本地 `npm install` 之后以及发布之前都会触发（Husky 安装就靠它），`prepublishOnly` 则只在发布前触发。

### 7.8 `exports` 里的条件顺序有讲究吗？

有，且顺序敏感。Node.js 与打包器会自上而下匹配第一个命中的条件，所以 `types` 必须排在 `import` / `require` 之前，`import` / `require` 也要按更具体的优先，`default` 永远放最后兜底。顺序写反会导致类型提示丢失或加载到错误的产物。
