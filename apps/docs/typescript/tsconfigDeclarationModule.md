# TS 工程配置与类型声明

**核心本质**：`tsconfig.json` 是 TypeScript 的控制台，决定编译器如何“**看见**”代码；`.d.ts` 是类型世界的契约文件，为非 TS 资源补全描述；模块解析策略则是连接代码与类型文件的索引引擎。

**解决目标**：统一编译标准、隔离多环境配置、解决第三方资源类型缺失、实现代码的类型跳转与自动补全。

**一句话理解**：**“`tsconfig.json` 决定编译器怎么查，`.d.ts` 决定查不到时补什么，两者合起来才让编辑器和 CI 真正‘认识’你的代码。”**

## 1. 核心概念与整体架构

### 1.1 tsconfig.json 的定位与查找规则

`tsconfig.json` 是 TypeScript 项目的“**大脑**”与控制中心。如果一个目录下存在这个文件，就意味着该目录是 TypeScript 项目的根目录。它主要承担两大核心职责：

- **指定要编译的文件范围**（哪些文件归 TS 管，哪些不管）。
- **定义编译选项 (`compilerOptions`)**（TS 应该以多严格的标准检查代码，以及最终编译出什么样子的 JS）。

`tsc` 本身不认识“**项目**”，它只认识**配置文件**，所以先搞清它怎么找到配置：

- **不带参数运行 `tsc`**：从**当前工作目录**开始逐级向上找最近的 `tsconfig.json`，找到就用它；一路找到根都没有，就退化成“**编译当前目录下所有 TS 文件 + 全部默认配置**”。
- **`tsc -p <路径>`**：显式指定配置文件（`-p` 也可以只给目录，此时读该目录下的 `tsconfig.json`）。CI 里务必写死，不要依赖 cwd。
- **编辑器不受 cwd 影响**：VS Code / WebStorm 按“**当前文件往上找到的第一份 tsconfig**”决定规则。所以 Monorepo 里同一份文件在 `packages/a` 和 `packages/b` 下报错不同，是正常现象，不是编辑器抽风。
- **`tsc --showConfig`**：打印继承、默认值全部合并完之后的**最终配置**。排查“**我明明配了却不生效**”的第一手段。

```bash
# 只看合并结果，不编译
tsc -p ./apps/web --showConfig

# 看这份配置实际管了哪些文件（排查 include 写错最有效）
tsc -p ./apps/web --listFilesOnly
```

### 1.2 顶层字段速查

[width(23,44,33)]

| 属性名                | 核心作用与描述                                                                                         | 配置示例                               |
| :-------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------- |
| **`include`**         | 指定需要被 TypeScript 编译和检查的文件或文件夹的 glob 模式数组。                                       | `["src/**/*", "env.d.ts"]`             |
| **`exclude`**         | 指定在 `include` 范围内，但需要被**刻意排除**的文件目录（如第三方库和产物目录）。                      | `["node_modules", "dist"]`             |
| **`files`**           | 仅包含需要编译的单个文件列表（不支持 glob 模式），适用于极小型的项目。                                 | `["src/main.ts"]`                      |
| **`extends`**         | 继承另一个配置文件的基础配置，极大提高多包项目 (Monorepo) 配置的复用性。                               | `"extends": "./tsconfig.base.json"`    |
| **`references`**      | 声明本项目依赖的其他子项目（Project References），让编译器按依赖拓扑依次检查，是 Monorepo 增量的基础。 | `[{ "path": "./tsconfig.node.json" }]` |
| **`compilerOptions`** | **最核心的区域**。控制编译器的各种具体行为（语法降级、严格模式、模块解析等）。                         | 见下文详细解析                         |

**`include` / `files` 都不写时**，默认把配置所在目录下的**所有** TS / TSX / `.d.ts` 文件都纳入进来（实测行为），所以在大型目录下无意漏写 `include` 会让类型检查莫名其妙地变慢。

### 1.3 配置的合并优先级

从低到高共三层，**同名项永远由更高层覆盖**：

- **TS 内置默认值**（`--showConfig` 会把它们全都展开给你看）。
- **`tsconfig.json` 自身**，其中 `extends` 链内部再叠一层（子配置覆盖父配置）。
- **命令行参数**——临时排查时非常顺手：

```bash
# 临时关掉严格模式，确认某个报错是不是规则太严导致的
tsc -p ./tsconfig.json --noEmit --strict false
```

## 2. compilerOptions 核心编译选项详解

`compilerOptions` 中的配置项多达上百个，但实际工程里真正需要熟练掌握的是下面这几组：**目标环境**（2.1）、**严格检查**（2.2 – 2.5）、**模块解析**（2.3）、**产物与构建**（2.6 – 2.7）。其余高频开关收在 2.8 的速查表里，需要时再查。

### 2.1 基础构建与目标环境 (Build & Target)

决定了你的 TypeScript 代码最终会被“**翻译**”成什么年代的 JavaScript。

```json
{
  "compilerOptions": {
    // 1. 语法降级目标：将 TS 编译为哪个版本的 JS 语法（如把箭头函数转为普通函数）
    // 现代浏览器项目通常设为 "ES2015" 或 "ESNext"，老旧项目设为 "ES5"
    "target": "ES2015",

    // 2. 模块系统：决定编译后的代码使用哪种模块化规范
    // 前端通常使用 "ESNext" (保留 import/export)，Node.js 项目常使用 "CommonJS"
    "module": "ESNext",

    // 3. 内置类型库引入：告诉 TS 你的代码运行在什么环境中
    // 比如填入 "DOM"，TS 才会认识 document.getElementById，否则会报错
    "lib": ["DOM", "DOM.Iterable", "ESNext"],

    // 4. 产物输出目录：编译后的 JS 文件存放在哪里
    // 注意：如果使用 Vite/Webpack 打包，通常由打包工具接管，TS 就不需要配置 outDir 了
    "outDir": "./dist",

    // 5. 不输出文件：极其重要的现代配置！
    // 在 Vite 等现代工程中，esbuild 负责极速编译 JS，TS 编译器只负责“纯类型检查”。开启此项，TS 报错时就不会生成没用的 JS 文件。
    "noEmit": true
  }
}
```

**`target` / `lib` / `module` 三者的分工**：

[width(13,34,53)]

| 配置项   | 决定“产物长什么样”                                        | 决定“类型系统认识什么”                                          |
| :------- | :-------------------------------------------------------- | :-------------------------------------------------------------- |
| `target` | 产物 JS 的语法版本（是否降级箭头函数、可选链、类字段）    | **不写 `lib` 时，由它推导默认的库类型**（默认还会带上 `DOM`）   |
| `lib`    | ❌ 完全不影响产物                                         | 能认识哪些内置全局类型：`Promise`、`Map`、`document` 都来自这里 |
| `module` | 产物的模块格式（`ESNext` 保留 `import`，`CommonJS` 改写） | 影响 `import` / `export` 会被如何解析与保留                     |

所以“`Promise` 报 `Cannot find name`”这类问题，**改 `lib` 而不是改 `target`**——`target` 只负责代码长什么样，管不了类型存不存在。

### 2.2 严格模式与代码质量 (Strictness & Quality)

这是 TypeScript 灵魂所在。建议新项目**永远无脑开启** `strict: true`。

```json
{
  "compilerOptions": {
    // 1. 严格模式总开关：一键开启所有严格的类型检查机制
    "strict": true,

    // 以下是 strict 包含的具体子规则（通常不需要单独写，除非你想在总开关外单独关闭某个）：

    // 2. 不允许隐式的 any：变量如果没有声明类型且无法推导，直接报错
    "noImplicitAny": true,

    // 3. 严格的空值检查：极其重要！防止 Cannot read property of undefined 报错
    // 开启后，string 类型的变量绝对不能被赋值为 null 或 undefined
    "strictNullChecks": true,

    // 4. 严格绑定 this：防止 this 指向丢失引发的错误
    "noImplicitThis": true,

    // --- 以下是不包含在 strict 中，但极力推荐开启的额外质量检查 ---

    // 5. 检查未使用的局部变量：帮助清理死代码
    "noUnusedLocals": true,

    // 6. 函数里所有的分支都必须有明确的 return 返回值
    "noImplicitReturns": true
  }
}
```

**`strictNullChecks` 是所有严格检查的地基**：`strict` 里的其余开关、以及后面要讲的 `noUncheckedIndexedAccess`，很多都**依赖它才有意义**。实战中遇到“**我明明开了某个严格开关却没效果**”，第一个要确认的就是它有没有被关掉。

### 2.3 模块解析与路径映射 (Module Resolution)

这部分配置直接影响到代码里 `import` 语句的寻找逻辑。

```json
{
  "compilerOptions": {
    // 1. 模块解析策略：现代前端工程（特别是用到第三方 npm 包时），必须设为 "node" 或最新的 "bundler"
    "moduleResolution": "node",

    // 2. 允许导入 .json 文件，并提供类型推导
    "resolveJsonModule": true,

    // 3. 核心：解决 CommonJS 和 ES Modules 导入兼容性问题
    // 开启后，允许使用 `import React from 'react'` 而不是 `import * as React from 'react'`
    "esModuleInterop": true,

    // 4. 隔离模块：对于 Babel, Vite(esbuild) 等单文件编译工具是必须的，确保文件能被安全地独立编译
    "isolatedModules": true,

    // 5. 路径别名 (Path Mapping) 极其常用！
    // 让 TS 认识你在 Webpack/Vite 中配置的 `@/` 别名，提供跳转和代码提示
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "components/*": ["src/components/*"]
    }
  }
}
```

**`moduleResolution` 到底选哪个**：

[width(16,28,56)]

| 策略                  | 用在哪                                             | 关键行为与限制                                                                                        |
| :-------------------- | :------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `classic`             | 上古配置，**不要用**                               | 已废弃的 TS 原生解析算法，只在极老的 `module: "amd"` 场景下才会被默认选中。                           |
| `node`（即 Node10）   | 只能跑在 CommonJS 下的老 Node 工程                 | 认识目录、`package.json` 的 `main`；**不读 `exports` 字段**，所以现代包的双格式入口它会找错。         |
| `node16` / `nodenext` | 产物真的要交给 Node 跑（Node 服务、CLI、npm 库）   | 严格模拟 Node 的真实规则：读 `exports` 与 `type`，**ESM 文件的相对导入必须写扩展名**（写 `./b.js`）。 |
| `bundler`             | Vite / Webpack / Rollup 打包的前端工程（**首选**） | 读 `exports` 与 `imports`，且**允许省略扩展名**；但只能配 `module: "preserve"` 或 ES2015 以上的模块。 |

### 2.4 `strict` 家族的完整清单

`"strict": true` 是一键开启，但它究竟开了什么？下面这张表值得对照着看一遍——**中间那些开关默认是关的，却是真实项目里最容易出问题的地方**。

[width(37,45,18)]

| 开关                               | 作用                                                              | 是否含在 `strict` |
| :--------------------------------- | :---------------------------------------------------------------- | :---------------- |
| **`noImplicitAny`**                | 禁止隐式 `any`，无法推导时必须显式标注                            | ✅ 包含           |
| **`strictNullChecks`**             | `null` / `undefined` 不能赋给其他类型，根治空指针                 | ✅ 包含           |
| **`strictFunctionTypes`**          | 函数参数按**逆变**检查（见 [泛型](/typescript/generics) 第 8 节） | ✅ 包含           |
| **`strictBindCallApply`**          | 校验 `call` / `apply` / `bind` 的参数类型                         | ✅ 包含           |
| **`strictPropertyInitialization`** | 类属性必须在构造函数里完成初始化                                  | ✅ 包含           |
| **`strictBuiltinIteratorReturn`**  | 内置迭代器（如 `[].entries()`）的返回值类型更精确                 | ✅ 包含           |
| **`noImplicitThis`**               | `this` 类型不明确时报错                                           | ✅ 包含           |
| **`useUnknownInCatchVariables`**   | `catch (e)` 里的 `e` 自动是 `unknown` 而不是 `any`                | ✅ 包含           |
| **`alwaysStrict`**                 | 产物中强制加上 `"use strict"`                                     | ✅ 包含           |
| **`noUncheckedIndexedAccess`**     | 索引访问的返回值自动带上 `undefined` ⚠️                           | ❌ **不含**       |
| **`exactOptionalPropertyTypes`**   | 严格区分 `?:` 和 `\| undefined` ⚠️                                | ❌ **不含**       |
| **`noImplicitOverride`**           | 重写父类成员必须显式写 `override` ⚠️                              | ❌ **不含**       |

**最常见的误判**：以为开了 `strict` 就万事大吉。实际上 `noUncheckedIndexedAccess` 这条**最该开**的开关并不在 `strict` 里，而它恰恰能拦住最高频的一类运行时崩溃。

### 2.5 现代工程强烈建议追加的开关

```json
{
  "compilerOptions": {
    // 1. 原样保留 import/export 语法，并强制"仅类型导入"必须写成 import type
    //    开完后 import { User } 会被原样保留到产物中，import type 才保证被擦除
    "verbatimModuleSyntax": true,

    // 2. 索引访问的结果自动加上 undefined，逼你对每次取值判空
    //    不开：const first = arr[0] 的类型是 string
    //    开了：const first = arr[0] 的类型是 string | undefined
    "noUncheckedIndexedAccess": true,

    // 3. 严格区分 { a?: string } 与 { a: string | undefined }
    //    开启后，{ timeout: undefined } 不再被允许赋给 { timeout?: number }
    "exactOptionalPropertyTypes": true,

    // 4. 重写父类成员必须显式写 override，防止父类改名后子类悄悄失联
    "noImplicitOverride": true,

    // 5. 只自动加载指定的全局类型包，避免 @types/* 全量注入污染全局
    //    注意：一旦显式写了 types，未列出的 @types 包就不会被自动加载
    "types": ["vite/client", "node"]
  }
}
```

**`noUncheckedIndexedAccess` 为什么值得单独说**：

```ts
const list: string[] = ['a', 'b']
const item = list[10] // 数组越界，运行时是 undefined
item.toUpperCase() // 不开开关时编译通过，运行时崩溃
```

开启后 `item` 的类型变成 `string | undefined`，编译器会强制你处理越界情况（报 `error TS2532: Object is possibly 'undefined'`）。
另外有一条**前置条件**（实测）：`noUncheckedIndexedAccess` 依赖 `strictNullChecks`。如果 `strict` 没开，`undefined` 会被当成所有类型的子类型，这个开关**等于没开**——不会报任何错。

**`types` 的坑**：很多人发现 `process.env` 报错，以为是没装 `@types/node`，实际是 `types` 数组里漏了 `"node"`。反过来，如果你的全局类型莫名多出一堆不相干的东西，也先检查这里。

### 2.6 输出产物与增量构建 (Emit & Incremental)

只做类型检查的工程可以跳过这一节；但只要涉及“**TS 自己产出文件**”（发 npm 包、Node 服务、Monorepo 增量构建），下面几个开关就是必答题。

```jsonc
{
  "compilerOptions": {
    "outDir": "dist", // 产物目录
    "rootDir": "src", // 源码根目录，决定 dist 内部的目录结构
    "declaration": true, // 顺带产出 .d.ts 声明文件
    "sourceMap": true, // 产出 sourcemap
    "incremental": true, // 记下上次的检查结果，下次只重查变动过的文件
    "tsBuildInfoFile": "node_modules/.tmp/ts.tsbuildinfo", // 缓存文件放哪儿
  },
}
```

### 2.7 类字段与装饰器 (Class Fields & Decorators)

```jsonc
{
  "compilerOptions": {
    // 让类字段遵循最新 ECMAScript 语义（用 defineProperty 初始化）
    "useDefineForClassFields": true,

    // 老式装饰器（TS 5.0 之前的标准），只有老框架才需要
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
}
```

### 2.8 其余高频开关速查

[width(26,40,34)]

| 开关                                   | 作用                                            | 什么时候需要                                                                   |
| :------------------------------------- | :---------------------------------------------- | :----------------------------------------------------------------------------- |
| **`skipLibCheck`**                     | 跳过**所有 `.d.ts`** 的语义检查（不只是第三方） | 几乎必开                                                                       |
| **`allowJs`** / **`checkJs`**          | 允许纳入 `.js` 文件 / 连 `.js` 一起检查类型     | 老项目渐进式迁移                                                               |
| **`forceConsistentCasingInFileNames`** | 强制文件名大小写一致                            | 多人协作（macOS 不区分大小写，CI 却区分）                                      |
| **`noEmitOnError`**                    | 只要报错就不产出任何文件                        | 增量构建、避免半成品产物被消费                                                 |
| **`allowImportingTsExtensions`**       | 允许 `import './b.ts'` 直接写 `.ts` 扩展名      | Vite 项目；**必须配 `noEmit` 或 `emitDeclarationOnly`**，否则报 `error TS5096` |
| **`jsx`** / **`jsxImportSource`**      | 指定 JSX 的处理方式与运行时来源                 | React 用 `react-jsx`；Vue 用 `preserve` + `vue`                                |
| **`noErrorTruncation`**                | 报错信息里的长类型不再被 `...` 省略             | 排查复杂泛型报错                                                               |

## 3. 类型声明与模块增强 (`.d.ts`)

`.d.ts` 文件**不含运行时代码**，仅提供类型描述——它是写给类型检查器的“**说明书**”，运行时会被完全忽略。

### 3.1 `.d.ts` 的三种来源

[width(18,41,41)]

| 来源                      | 谁写的                              | 怎么进入你的类型系统                              |
| :------------------------ | :---------------------------------- | :------------------------------------------------ |
| **手写的声明文件**        | 你自己                              | 被 `include` / `files` 覆盖到才会加载             |
| **包自带的声明**          | 库作者（`package.json` 里声明入口） | `import` 那个包时自动带出来                       |
| **社区类型包 `@types/*`** | DefinitelyTyped 社区                | 默认自动加载 `node_modules/@types` 下的**全部**包 |

**判断一个 `.d.ts` 是“全局脚本”还是“模块”**，是读懂后面所有内容的前提，规则只有一条：**看它有没有顶层的 `import` / `export`**。

- 有 → 它是**模块**，里面的声明默认**不会**污染全局，且 `declare global` 合法。
- 没有 → 它是**全局脚本**，里面的 `declare` 直接挂在全局作用域上，但 `declare global` 会报错。

### 3.2 资源模块声明（shim）

当导入 CSS、图片或 Vue 组件时，TS 不认识这些文件，需手动添加声明：

```ts
declare module '*.svg' {
  const src: string
  export default src
}
```

### 3.3 全局扩展

通过 `declare global` 在全局注入类型，例如扩展 `Window` 对象：

```ts
export {} // 必须包含 import/export 才能使用 declare global

declare global {
  interface Window {
    analytics?: { track(event: string): void }
  }
}
```

如果漏掉了那句 `export {}`，文件会被当成全局脚本，编译器会直接报错（实测）：

```txt
error TS2669: Augmentations for the global scope can only be
directly nested in external modules or ambient module declarations.
```

### 3.4 模块增强：给第三方库“打补丁”

想给已有的库补一个属性或字段类型时，用模块增强。它**必须写在模块文件里**，且是**合并**而不是覆盖：

```ts
// 顶层 import 把本文件标记为“模块”，这是增强生效的前提
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}
```

**对照实验（实测）**，两条规则的差别非常关键：

- 写在模块文件里 → 原库的声明**完好保留**，新加的字段能被识别。✅ 这是增强。
- 写在**没有** `import` / `export` 的 script 文件里 → 原库的声明被**整个顶掉**，只剩下你写的那点内容（原来 `Foo.a` 会直接消失）。❌ 这不是增强，是“重新声明”。

**硬性限制**：模块增强里只能写声明，不能出现 `export` / `export default`，否则报 `error TS2666`。

### 3.5 `declare` 家族语法速查

[width(35,65)]

| 写法                            | 用途                                                                              |
| :------------------------------ | :-------------------------------------------------------------------------------- |
| `declare const` / `let` / `var` | 声明全局变量，如 `declare const __DEV__: boolean`                                 |
| `declare function`              | 声明全局函数                                                                      |
| `declare class`                 | 声明类的结构（不含实现）                                                          |
| `declare namespace`             | 声明命名空间，常用于描述“函数对象上的静态成员”                                    |
| `declare module 'x'`            | script 文件里 = **新建**一个模块声明；module 文件里 = **增强**已有模块            |
| `declare global`                | 在 **module 文件**里扩展全局作用域                                                |
| `declare enum`                  | 声明一个环境枚举（只描述形状，产物里不存在）                                      |
| `export =`                      | 给 CommonJS 的 `module.exports` 写类型（如 `declare const lib: X; export = lib`） |
| `export as namespace X`         | UMD 场景：声明“这个包同时挂了一个全局变量 X”                                      |

### 3.6 三斜线指令与 `@types`

```ts
/// <reference types="node" />
/// <reference path="./custom.d.ts" />
```

- `/// <reference types="..." />` 只作用于**当前这一个文件**，等价于给这个文件单独打开某个全局类型包；要全局生效，还是应该写在 `tsconfig.json` 的 `types` 里。
- 现在还在用它的典型场景：一个 `.d.ts` 需要引用另一份声明，但**不能加 `import`**（加了就不再是全局脚本了）。这时三斜线指令是唯一不破坏“脚本”语义的写法。
- `@types/*` 是社区维护的类型包（DefinitelyTyped）。**不写 `types` 时，`@types` 下的所有包都会被自动加载**；写了 `types` 就只加载列出的那些。

## 4. 现代工程化典型配置模板 (Vite + Vue3/React)

在现代构建工具体系中（如 Vite），TypeScript 通常剥离了“**编译输出 JS**”的工作，纯粹作为**静态类型检查器 (Linter)** 使用。

```json
{
  "compilerOptions": {
    // 指定编译后的 JavaScript 目标版本为最新标准。
    "target": "ESNext",

    // 强制 Class（类）的字段遵循最新的 ECMAScript 规范行为。
    "useDefineForClassFields": true,

    // 告诉 TS 注入哪些环境的内置类型提示。
    // 包含最新 JS 语法（ESNext）、浏览器全局变量（DOM，如 window/document）以及 DOM 集合的迭代器。
    "lib": ["ESNext", "DOM", "DOM.Iterable"],

    // 指定代码使用的模块化系统为最新的 ES Modules 规范（即使用 import 和 export）。
    "module": "ESNext",

    // 它把“寻找模块”的权力完全交给打包工具，完美支持 package.json 中的 exports 字段。
    "moduleResolution": "bundler",

    // 允许直接通过 import 导入 .json 文件，并且 TS 会自动推导出 JSON 内部的属性类型。
    "resolveJsonModule": true,

    // 【Vite 必备】强制要求每个文件都能被独立编译。
    // 因为 Vite 底层的 esbuild 是单文件编译的，不认识跨文件的类型上下文。开启后能防止你写出 esbuild 无法处理的代码。
    "isolatedModules": true,

    // 抹平 ES Modules 和 CommonJS 规范之间的差异。
    // 允许你用 import React from 'react' 的优雅方式，去引入老旧的 CommonJS 模块。
    "esModuleInterop": true,

    // 跳过对 node_modules 里的第三方库的类型检查，极大提升编译速度！
    // 企业级项目必备，防止被庞大且规范不一的第三方库卡死。
    "skipLibCheck": true,

    // Vite 环境专属：只做类型检查，不输出产物（不生成 .js 文件）。
    "noEmit": true,

    // 开启 TypeScript 所有的严格模式选项（例如禁止隐式 any、强制检查 null/undefined）。
    "strict": true,

    // 遇到 JSX 语法时，TS 保持原样不作转换（Vue 项目通常交给底层的 Babel/插件处理）。
    // React 项目可以设为 "react-jsx"，让 TS 直接处理。
    "jsx": "preserve",

    // 解析非绝对路径时的基准目录，"." 代表项目根目录。
    "baseUrl": ".",

    // 配置路径别名，让 TS 认识 '@/xxx' 指向的是 'src/xxx'。
    // 注意：这只是为了让 TS 不报错并提供代码提示，实际打包找文件仍需要在 vite.config 中配置 resolve.alias。
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.1 `env.d.ts`

让 TS 认识 Vite 注入的运行时能力（`import.meta.env`、`*.svg?url` 之类的后缀查询）：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

没有`/// <reference types="vite/client" />`这行，`import.meta.env.VITE_API_BASE`这些内置字段也会报错。

### 4.2 把 `tsc` 换成 `vue-tsc`

`tsc` 不认识 `.vue`，`import Comp from './Comp.vue'` 只会得到 `error TS2307: Cannot find module './Comp.vue'`。老模板用 `shims-vue.d.ts` 应付：

```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

但 `DefineComponent<{}, {}, any>` 里那个 `any` 是**真的把检查关掉**：prop 拼错也照过，且**零输出**。正确做法是让 `vue-tsc` 接管——它在 `tsc` 外套一层 Volar，把每个 `.vue` 拆成虚拟 TS 文件（`<script setup>` 编译成组件类型、`<template>` 里的表达式一并进来）再交给 `tsc` 检查：

```json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit",
    "type-check:monorepo": "vue-tsc -b --noEmit"
  }
}
```

[width(30,70)]

| 命令               | 对 `.vue` 的处理                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `tsc`，无 shim     | `error TS2307`，找不到 `./Comp.vue` 的类型声明                                                                        |
| `tsc`，有 shim     | 通过，但 prop 拼错也不报——**静默失明**                                                                                |
| `vue-tsc`，有 shim | 报出真实类型错误（`error TS2769: No overload matches this call.`，提示里能看到 `$props: { readonly title: string }`） |
| `vue-tsc`，无 shim | 与上一行逐字相同                                                                                                      |

`vue-tsc` 接管后 `shims-vue.d.ts` **应该删掉**——有它没它检查结果**逐字相同**，留着只给人「这里被 `any` 兜底」的错觉。另外纯 TS 的包（如 `packages/utils`）继续用 `tsc` 即可，且 `include` 必须含 `src/**/*.vue`，漏了就看不到这些文件。

## 5. 企业级项目最佳实践

### 5.1 配置拆分与继承

在企业级项目中，**永远不要试图用一个巨大的 `tsconfig.json` 管理整个项目**。

不同运行环境支持的全局变量、模块系统完全不同（例如 Node 环境有 `process`，浏览器有 `window`）。因此，最佳实践是采用“**基础配置 + 按需扩展**”的模式。

```markdown
project-root/
├── tsconfig.base.json # 核心基础规范（全公司/全项目通用）
├── tsconfig.app.json # 浏览器端业务代码配置
├── tsconfig.node.json # Node.js 构建脚本配置
├── tsconfig.test.json # 测试环境配置
└── tsconfig.json # 根入口，用于在 IDE 中统合上述配置（使用 references）
```

**`extends` 的三条规则**，写拆分配置之前必须记住（均经实测验证）：

[width(43,57)]

| 规则                                         | 具体表现                                                                                                |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| **`include` / `exclude` / `files` 整体替换** | 子配置里写 `include` 会**完全覆盖**父配置的，不会自动合并——这是“**子配置突然什么都编译不到**”的头号原因 |
| 相对路径以“**定义它的那个文件**”为基准       | base 里写 `include: ["src"]`，指的是 **base 旁边**的 `src`，而不是最终入口文件旁边的 `src`              |
| **`compilerOptions` 逐项浅合并**             | 子配置没写的项保留父配置的值                                                                            |

拿不准的时候，用 `tsc -p <子配置> --showConfig` 打印最终结果，比对着配置文件猜快得多。

**`extends` 的值**可以是相对路径、绝对路径、包名（如本仓库用到的 `@vue/tsconfig/tsconfig.dom.json`），TS 5.0 起还支持**数组**——按顺序叠加，后者覆盖前者：

```jsonc
{
  "extends": ["@tsconfig/strictest/tsconfig.json", "./tsconfig.overrides.json"],
}
```

### 5.2 企业级基础配置模板

:::code-group

```json [tsconfig.base.json]
{
  "compilerOptions": {
    /* ---------------- 基础运行环境 ---------------- */
    "target": "ES2022", // 编译输出的现代 JavaScript 版本
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    /* ---------------- 模块解析策略 (核心性能区) ---------------- */
    "module": "ESNext", // 采用现代 ESM 模块规范
    // "bundler" 是 TS 5.0+ 针对现代构建工具 (Vite, Webpack, Rollup) 的最佳实践
    // 它允许更灵活的导入方式，且完全交由打包工具去处理模块寻址
    "moduleResolution": "bundler",

    // 强制隔离模块。企业级项目通常使用 esbuild/swc 进行极速编译，它们无法跨文件分析类型。
    // 开启此项可以确保你的 TS 代码是"安全可被单文件转译"的。
    "isolatedModules": true,
    "resolveJsonModule": true, // 允许直接 import json 文件

    // 企业级必备性能优化：只做类型检查，不输出代码！
    // 真正的打包转译工作交给 Vite/esbuild/Babel 等更快的底层工具
    "noEmit": true,

    // 极大提升冷启动和类型检查速度。直接跳过庞大的 node_modules 的类型推导。
    "skipLibCheck": true,

    /* ---------------- 严格的质量门禁 ---------------- */
    "strict": true, // 开启严格模式 (包含 strictNullChecks, noImplicitAny 等)
    "noUnusedLocals": true, // 禁止未使用的局部变量
    "noUnusedParameters": true, // 禁止未使用的函数参数
    "noFallthroughCasesInSwitch": true, // 防止 Switch 语句贯穿忘写 break
    "exactOptionalPropertyTypes": true, // 更严谨的可选属性检查 (防止意外赋值 undefined)
    "noUncheckedIndexedAccess": true, // 访问数组或对象索引时，强制要求检查 undefined (极高安全性)

    /* ---------------- 互操作性与规范 ---------------- */
    "esModuleInterop": true, // 允许 default import 非 ESM 模块 (如 import React from 'react')
    "allowSyntheticDefaultImports": true, //允许合成默认导入
    "forceConsistentCasingInFileNames": true, // 强制文件名大小写一致 (防 Windows/Mac 协同大小写踩坑)

    /* ---------------- 路径别名 ---------------- */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

:::

### 5.3 派生环境配置实战

基于上面的基础配置，我们可以为不同环境建立特定的沙箱。

#### 5.3.1 业务代码配置

只关注 `src` 目录下的业务代码，只包含浏览器环境的全局变量。

:::code-group

```json [tsconfig.app.json]
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
    // 如果是 React 项目，加入 JSX 支持
    // "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "exclude": ["src/**/*.test.ts", "src/**/*.spec.ts"]
}
```

:::

#### 5.3.2 构建脚本配置

专供 Vite、Webpack 等 Node.js 环境下的配置文件使用。

:::code-group

```json [tsconfig.node.json]
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "composite": true, // 配合项目引用使用
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"] // 注入 Node.js 的全局类型 (如 process, Buffer)
  },
  "include": ["vite.config.ts", "vitest.config.ts", "scripts/**/*.ts"]
}
```

:::

#### 5.3.3 根目录缝合配置

使用 **Project References (项目引用)** 将它们在 IDE 层面缝合起来，这样 VS Code 就能聪明地知道哪个文件该用哪套规则。

:::code-group

```json [tsconfig.json]
{
  // 根配置文件不需要包含任何实际代码
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

:::

### 5.4 把类型检查接进流水线

**先记住一条铁律**：`vite build` 只负责打包，**不做类型检查**（esbuild 只是把类型“**擦掉**”）。类型错误必须靠单独一条命令拦住：

```json
{
  "scripts": {
    "type-check": "vue-tsc --noEmit",
    "type-check:monorepo": "vue-tsc -b --noEmit",
    "docs:build": "vitepress build apps/docs"
  }
}
```

- **单包工程**用 `--noEmit` 即可；**Monorepo** 用 `-b`，它会按 `references` 的拓扑顺序依次检查。
- **本地提速**：配合 `incremental: true`，第二次以后只重查改动过的文件。
- **提交/CI 门禁**：本地交给 `lint-staged` + husky（见本仓库 `.husky/pre-commit`），CI 上再完整跑一遍 `type-check`。本地图快、CI 图全，两者不冲突。

## 6. Monorepo 架构的终极形态

如果你的企业项目是一个 Monorepo（比如使用 Turborepo 或 pnpm workspace），项目拆分成了多个包（如 `@company/ui`, `@company/utils`, `@company/web`）。

必须启用 `composite: true` 和跨包引用，这是打破 TypeScript 单核编译瓶颈、实现**增量编译**的核心技术。

**底层包 (`packages/utils/tsconfig.json`)**：必须开启 `composite` 和 `declaration`。

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true, // 核心：允许其他项目引用我
    "declaration": true, // 核心：生成 .d.ts 文件
    "declarationMap": true, // 让 IDE 可以直接跳转到源码而不是类型文件
    "outDir": "dist",
  },
  "include": ["src"],
}
```

**上层业务 (`apps/web/tsconfig.json`)**：通过 `references` 建立依赖拓扑。

```jsonc
{
  "extends": "../../tsconfig.base.json",
  "references": [
    // 告诉 TS，我在依赖这个兄弟包，请先检查并编译它
    { "path": "../../packages/utils" },
  ],
}
```

**构建命令要用 `-b`**，它才会读懂 `references` 并做增量：

```bash
tsc -b                  # 按依赖拓扑，只重建过期的项目
tsc -b --watch          # 监听模式
tsc -b --clean          # 清理所有被引用项目的产物
tsc -b --force          # 无视缓存，强制全量重建
```

## 7. 类型发布与库构建

发布 npm 包时，TS 需要生成 `.d.ts` 声明文件供调用方使用。

```jsonc
{
  "compilerOptions": {
    "declaration": true, // 生成声明文件
    "declarationMap": true, // 支持跳转到源码，而不是声明文件
    "emitDeclarationOnly": true, // 只生成声明文件，JS 转译交给 Babel/Rollup
    "outDir": "dist",
  },
}
```

`emitDeclarationOnly` **必须配 `declaration`（或 `composite`）**，否则直接报错（实测）：

```txt
error TS5069: Option 'emitDeclarationOnly' cannot be specified without
specifying option 'declaration' or option 'composite'.
```

**`package.json` 入口配置**：

```json
{
  "types": "./dist/index.d.ts", // 指向生成的声明文件入口
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```

- **`exports` 里的 `types` 条件必须排在 `import` / `require` 前面**。条件是从上往下匹配的，`types` 放到后面会被 JS 入口抢先命中，调用方就只剩 `any`。
- **双格式发布**（同时给 ESM 和 CJS）时，声明文件也要成对：`dist/index.d.mts` 配 ESM 入口、`dist/index.d.cts` 配 CJS 入口，并在 `exports` 里各自挂到对应的 `types` 条件上。
- **`files` 白名单**要写全：`dist` 该发，`src` 和 `.tsbuildinfo` 不该发。注意 `declarationMap` 的跳转依赖源码，真要发源码时得连 `src` 一起放进白名单。

## 8. tsc 命令行与性能诊断

`tsc` 不只有“**编译**”这一个用法，排查问题时下面这些参数比读配置文件管用得多：

[width(38,62)]

| 命令                         | 用途                                                             |
| :--------------------------- | :--------------------------------------------------------------- |
| `tsc --noEmit`               | 只检查、不产出文件，CI 里最常用的一条                            |
| `tsc -p <路径>`              | 指定配置文件（路径给目录时读该目录下的 `tsconfig.json`）         |
| `tsc -b`                     | 按项目引用拓扑增量构建，Monorepo 必备                            |
| `tsc --watch`                | 监听文件变化，增量重查                                           |
| `tsc --showConfig`           | 打印继承与默认值合并后的**最终配置**，排查继承问题的第一手段     |
| `tsc --listFilesOnly`        | 列出参与编译的文件，排查 `include` / `exclude` 写错              |
| `tsc --extendedDiagnostics`  | 输出各阶段耗时统计，回答“为什么类型检查这么慢”                   |
| `tsc --generateTrace <目录>` | 生成性能 trace 文件，可在 Chrome 的 `about:tracing` 里可视化分析 |
| `tsc --noErrorTruncation`    | 长类型不被 `...` 省略，排查复杂泛型报错时必开                    |

## 9. 常见问题 (FAQ)

### 9.1 `noEmit: true` 都不输出代码了，为什么还要写 `tsconfig.json`？

**原因**：现代工程里 TS 已经退化为**纯静态类型检查器**，真正的转译交给 Vite/esbuild/swc。

`noEmit` 关掉的是“**输出 JS**”这个动作，但**类型检查规则、`strict` 系列开关、`paths` 别名、`include` 范围**全部还靠这份配置说话。没有它，编辑器不知道该按哪套规则检查你。

### 9.2 `skipLibCheck: true` 会不会漏掉类型错误？和 `strict` 冲突吗？

**不冲突**——这两个开关管的是两件事：`strict` 管你的**代码**检查得严不严，`skipLibCheck` 管要不要对 **`.d.ts` 声明文件**做语义检查。
**但“一个都不会少报”这个说法要打个折**（实测）：`skipLibCheck` 跳过的是**所有 `.d.ts`**，并不只限于 `node_modules` 里的。所以：

- 你自己 **`.ts`** 代码里的错误，一条都不会少报。✅
- 你自己**手写的 `.d.ts`** 里的错误（比如 `declare global` 里两个同名属性类型不一致，`error TS2717`），会**被一起跳过**。⚠️

收益很直接：极大提升冷启动和类型检查速度。代价是当两个依赖的声明互相矛盾时编译器不会替你报错——真遇到诡异现象，临时关掉它来定位即可。

所以“**开了 `strict` 同时开 `skipLibCheck`**”是完全正常的组合，也是绝大多数项目的选择。

### 9.3 `isolatedModules` 和 `verbatimModuleSyntax` 有什么区别？

两者都在解决“**单文件转译**”场景下的问题，但管的事情不同：

- **`isolatedModules`** 保证每个文件**能独立编译**，拦住那些必须跨文件分析才成立的写法。最典型的命中（实测）是**类型的再导出**：`export { T } from './t'` 里的 `T` 是类型时会直接报错，必须写成 `export type { T } from './t'`。
- **`verbatimModuleSyntax`** 保证 `import` / `export` 语句**原样保留**到产物里，同时强制“**仅类型导入**”必须显式写成 `import type`。

```ts
// 开了 verbatimModuleSyntax 后，import 语句不再由编译器“猜”要不要保留：
import { User } from './types' // 原样保留在产物里（所以 User 必须真的是个值）
import type { User } from './types' // 保证被完全擦除
```

实测中它最硬的约束是：**混在一起导入类型和值时直接报错**，逼你拆开写：

```txt
error TS1484: 'T' is a type and must be imported using a type-only
import when 'verbatimModuleSyntax' is enabled.
```

**为什么现代项目两个都要开**：企业级项目通常用 esbuild/swc 做极速编译，它们**单文件转译，无法跨文件分析类型**。不开 `isolatedModules` 的话，本地 `tsc` 检查一切正常，打包产物却可能在运行时报错；不开 `verbatimModuleSyntax`，编译器只能靠猜来判断一个导入会不会留下运行时痕迹。

### 9.4 `paths` 别名、`types` 都配了，为什么还是“找不到”？

这是两个不同层面的“**找不到**”，放在一起对照着排查：

- **别名 `@/` 编辑器认识，构建却报找不到模块**

  `paths` 只是**给类型检查器看的**，它不改变运行时的模块解析规则，打包工具也不认这份映射。**解法**：必须在构建工具里再配一份等价别名——Vite / Webpack 用 `resolve.alias`，Node 场景用 `tsconfig-paths`。两处要同步维护，改一处漏一处就是这个症状。

- **`process.env` 报错、`describe` 找不到**

  这类是全局类型包没被加载。两个配置分工不同：

  - **`typeRoots`**：告诉编译器**去哪里找**类型包（默认 `node_modules/@types`），通常不需要改。
  - **`types`**：告诉编译器**只加载哪些**全局类型包。

  有两个反直觉的行为要记住（实测）：

  - 一旦**显式写了 `types`**，未列出的 `@types/*` 包**就不再自动加载**了——没写 `"node"` 就一定拿不到 Node 的全局类型。
  - 不写 `types` 时，`node_modules/@types` 下的**所有**包都会被自动加载，这可能让全局命名空间被意外污染。写 `"types": []` 就是彻底关掉自动加载。

### 9.5 `.d.ts` 里的 `declare module` 为什么没生效？

- 文件是否真的被 `include` 覆盖了？只放在 `src` 外的目录里，TS 根本不会加载它。
- 通配符声明（`declare module '*.svg'`）**必须写在没有任何顶层 `import` / `export` 的文件里**；一旦这个文件变成了模块，它就失效了。
- 全局扩展（如 `declare global { interface Window { ... } }`）反过来——**必须写在模块文件**里；如果这个 `.d.ts` 里没有任何 `import` / `export`，它会被当成全局脚本，`declare global` 会报 `error TS2669`。
- 想改造已有的库，用的是**模块增强**，也必须写在模块文件里。

### 9.6 Monorepo 里 `composite` 和 `references` 到底解决什么问题？

**解决的是增量构建与跨包类型联动**。

`composite: true` 让子包生成 `.d.ts` 与构建信息文件，`references` 则在根配置里声明包之间的依赖关系。这样编译器不必每次全量重算，只重编改动过的包；同时 IDE 能正确认出“**这个包依赖那个包**”，跳转和提示都正常。

### 9.7 包发布到 npm 后，别人 `import` 进去为什么没有类型提示？

**原因**：运行时 JS 里没有任何类型信息，调用方只能靠随包发布的 `.d.ts` 声明文件。

**解法**：开启 `declaration: true` 生成声明文件，并在 `package.json` 里把入口指对——`"types"` 字段指向 `./dist/index.d.ts`，`exports` 里的 `types` 条件要**排在 `import` 前面**，否则解析时会被 JS 入口抢先。

### 9.8 我只想加一条严格规则，为什么编辑器没反应？

按可能性从高到低排查：

- **配置根本没被这个文件用到**。跑一次 `tsc -p <配置> --listFilesOnly`，确认目标文件在列表里。
- **改的是被 `extends` 的父配置，但子配置把它覆盖了**。用 `--showConfig` 看最终值——它显示的是合并后的真相。
- **依赖 `strictNullChecks` 的规则没生效**。像 `noUncheckedIndexedAccess` 这类开关，在 `strictNullChecks` 关闭时**完全不产生任何报错**（实测）。
- **编辑器缓存**。VS Code 用 `TypeScript: Restart TS Server`；命令行下则删掉 `incremental` 生成的陈旧 `.tsbuildinfo` 再重跑一次确认。
