# TS 工程配置与类型声明

**核心本质**：`tsconfig.json` 是 TypeScript 的控制台，决定编译器如何“**看见**”代码；`.d.ts` 是类型世界的契约文件，为非 TS 资源补全描述；模块解析策略则是连接代码与类型文件的索引引擎。

**解决目标**：统一编译标准、隔离多环境配置、解决第三方资源类型缺失、实现代码的类型跳转与自动补全。

### 1. 核心概念与整体架构

`tsconfig.json` 是 TypeScript 项目的“**大脑**”与控制中心。如果一个目录下存在这个文件，就意味着该目录是 TypeScript 项目的根目录。它主要承担两大核心职责：

- **指定要编译的文件范围**（哪些文件归 TS 管，哪些不管）。
- **定义编译选项 (`compilerOptions`)**（TS 应该以多严格的标准检查代码，以及最终编译出什么样子的 JS）。

| 属性名                | 核心作用与描述                                                                    | 配置示例                            |
| :-------------------- | :-------------------------------------------------------------------------------- | :---------------------------------- |
| **`include`**         | 指定需要被 TypeScript 编译和检查的文件或文件夹的 glob 模式数组。                  | `["src/**/*", "env.d.ts"]`          |
| **`exclude`**         | 指定在 `include` 范围内，但需要被**刻意排除**的文件目录（如第三方库和产物目录）。 | `["node_modules", "dist"]`          |
| **`files`**           | 仅包含需要编译的单个文件列表（不支持 glob 模式），适用于极小型的项目。            | `["src/main.ts"]`                   |
| **`extends`**         | 继承另一个配置文件的基础配置，极大提高多包项目 (Monorepo) 配置的复用性。          | `"extends": "./tsconfig.base.json"` |
| **`compilerOptions`** | **最核心的区域**。控制编译器的各种具体行为（语法降级、严格模式、模块解析等）。    | 见下文详细解析                      |

### 2. compilerOptions 核心编译选项详解

`compilerOptions` 中的配置项多达上百个，但在实际工程中，我们只需要熟练掌握以下四大维度的核心配置即可。

#### 2.1 基础构建与目标环境 (Build & Target)

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

#### 2.2 严格模式与代码质量 (Strictness & Quality)

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

#### 2.3 模块解析与路径映射 (Module Resolution)

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

## 3. 类型声明与模块增强 (`.d.ts`)

`.d.ts` 文件**不含运行时代码**，仅提供类型描述。

### 3.1 资源模块增强

当导入 CSS、图片或 Vue 组件时，TS 不认识这些文件，需手动添加声明：

```ts
declare module '*.svg' {
  const src: string
  export default src
}
```

### 3.2 全局扩展

通过 `declare global` 在全局注入类型，例如扩展 `Window` 对象：

```ts
export {} // 必须包含 import/export 才能使用 declare global

declare global {
  interface Window {
    analytics?: { track(event: string): void }
  }
}
```

## 4. 现代工程化典型配置模板 (Vite + Vue3/React)

在现代构建工具体系中（如 Vite），TypeScript 通常剥离了“编译输出 JS”的工作，纯粹作为**静态类型检查器 (Linter)** 使用。

以下是一份标准的、适用于现代前端项目的 `tsconfig.json`：

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

## 5. 企业级项目最佳实践

### 5.1 配置拆分与继承

在企业级项目中，**永远不要试图用一个巨大的 `tsconfig.json` 管理整个项目**。

不同运行环境支持的全局变量、模块系统完全不同（例如 Node 环境有 `process`，浏览器有 `window`）。因此，最佳实践是采用“基础配置 + 按需扩展”的模式。

```text
project-root/
├── tsconfig.base.json    # 核心基础规范（全公司/全项目通用）
├── tsconfig.app.json     # 浏览器端业务代码配置
├── tsconfig.node.json    # Node.js 构建脚本配置
├── tsconfig.test.json    # 测试环境配置
└── tsconfig.json         # 根入口，用于在 IDE 中统合上述配置（使用 references）
```

### 5.2 企业级基础配置模板

这是整个项目的类型基石。请重点关注带有注释的核心字段：

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

#### 5.3 根目录缝合配置

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

**`package.json` 入口配置**：

```json
{
  "types": "./dist/index.d.ts", // 指向生成的声明文件入口
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  }
}
```
