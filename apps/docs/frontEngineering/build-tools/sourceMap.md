# Source Map

Source Map 是连接“生产压缩代码”和“开发源码”的调试索引。前端构建会经历 TypeScript 编译、Vue/React 转换、Babel/SWC 降级、压缩混淆、代码合并等步骤，浏览器真正执行的代码通常已经不再像源码。Source Map 的职责就是告诉调试器：生成代码中的某一行某一列，对应源码中的哪个文件、哪一行、哪一列、哪个符号名。

## 1. 为什么需要 Source Map

生产环境报错通常长这样：

```txt
TypeError: Cannot read properties of undefined
  at a (assets/index-8f3a2c1d.js:1:43892)
```

没有 Source Map 时，`index-8f3a2c1d.js:1:43892` 只能指向压缩后的单行文件，很难定位真实源码。上传 Source Map 到 Sentry、Datadog、Bugsnag 等平台后，错误栈可以还原为：

```txt
src/pages/order/OrderDetail.vue:128:17
```

这就是 Source Map 在工程化中的核心价值。

## 2. Source Map 文件结构

一个标准 `.map` 文件本质是 JSON：

```json
{
  "version": 3,
  "file": "index.js",
  "sources": ["../src/index.ts"],
  "sourcesContent": ["const msg: string = 'hello'"],
  "names": ["msg"],
  "mappings": "AAAA,MAAMA,IAAY,OAAO"
}
```

关键字段含义：

| 字段             | 作用                                 |
| ---------------- | ------------------------------------ |
| `version`        | Source Map 规范版本，当前常见为 3    |
| `file`           | 对应的生成文件                       |
| `sources`        | 原始源码文件路径列表                 |
| `sourcesContent` | 原始源码内容，可选                   |
| `names`          | 被映射的变量名、函数名等符号         |
| `mappings`       | 压缩后的映射表，是 Source Map 的核心 |

`mappings` 使用 VLQ 编码压缩位置信息，避免映射文件过大。它记录的不是完整绝对值，而是相对上一个位置的增量，因此同样的信息可以用更短字符串表示。

## 3. 映射链路如何生成

现代构建通常不是一步完成：

```txt
TypeScript / Vue SFC
  -> esbuild / SWC / Babel
  -> Rollup / Webpack 合并模块
  -> Terser / esbuild 压缩
  -> dist assets
```

每一步转换都可能产生自己的 Source Map。后续工具需要把上一步的 map 作为输入，继续合并生成新的 map，最终形成从生产代码到原始源码的完整映射链。

如果中间某个插件丢失 map，最终定位就会断层。典型表现是错误只能还原到编译后的中间文件，而不是 `.vue`、`.tsx` 或原始 `.ts` 文件。

## 4. Source Map 的引用方式

生成文件底部通常会有一行注释：

```js
//# sourceMappingURL=index.js.map
```

浏览器 DevTools 看到这行后，会尝试加载旁边的 `.map` 文件。也可以通过 HTTP Header 指定：

```txt
SourceMap: /assets/index.js.map
```

生产环境如果公开 `.map` 文件，任何用户都可能看到还原后的源码。因此企业项目通常选择：

- 构建时生成 Source Map。
- CI 上传到错误监控平台。
- 上传成功后删除产物目录里的 `.map` 文件。
- 线上只保留压缩后的 JS，不公开源码映射。

## 5. 常见 Source Map 类型

不同工具对 `sourcemap` 配置命名略有差异，但核心取舍一致。

| 类型                   | 特点                                 | 适用场景                            |
| ---------------------- | ------------------------------------ | ----------------------------------- |
| `source-map`           | 独立 `.map` 文件，定位精准           | 生产上传监控平台                    |
| `inline-source-map`    | map 以内联 base64 放入 JS            | 本地调试，不适合生产                |
| `hidden-source-map`    | 生成 `.map` 但不在 JS 中写引用注释   | 生产上传 Sentry，避免浏览器主动拉取 |
| `nosources-source-map` | 不包含源码内容，只包含路径和位置信息 | 需要隐藏源码内容的生产环境          |
| `cheap-source-map`     | 通常只映射行，不映射列               | 开发环境提速                        |
| `eval-source-map`      | 使用 eval 包裹模块，重建速度快       | Webpack 开发环境                    |

## 6. Vite / Rollup 配置

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    sourcemap: true,
  },
})
```

如果产物要上传到监控平台但不希望浏览器自动发现 Source Map，可以结合插件或上传流程删除 `.map`，也可以根据工具能力使用隐藏映射策略。

```ts
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    sentryVitePlugin({
      org: 'acme',
      project: 'web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: 'dist/**/*.map',
      },
    }),
  ],
})
```

## 7. Webpack 配置

```js
module.exports = {
  mode: 'production',
  devtool: 'source-map',
}
```

常见选择：

```js
module.exports = {
  devtool:
    process.env.NODE_ENV === 'production'
      ? 'hidden-source-map'
      : 'eval-cheap-module-source-map',
}
```

开发环境优先构建速度和调试体验，生产环境优先错误还原和源码安全。

## 8. 生产环境最佳实践

### 8.1 不把 Source Map 暴露给公网

错误做法：

```nginx
location /assets/ {
  root /usr/share/nginx/html;
}
```

如果 `dist/assets` 中包含 `.map`，这会让用户直接访问到源码映射。

更稳妥的方式是在 CI 上传后删除：

```bash
pnpm build
pnpm sentry:sourcemaps
find dist -name "*.map" -delete
```

### 8.2 保持 release 标识一致

监控平台需要知道“这次报错属于哪个发布版本”。构建、上传 Source Map、部署产物时应使用同一个 release id，例如 Git SHA：

```bash
export RELEASE_VERSION=$(git rev-parse --short HEAD)
pnpm build
```

应用初始化时也要把同一个 release 传给监控 SDK，否则平台可能找不到对应 Source Map。

### 8.3 不在 Source Map 中写入敏感信息

Source Map 可能包含 `sourcesContent`，也就是完整源码。不要在前端源码中硬编码密钥、内网地址、测试账号、私有 token。即使 `.map` 不公开，监控平台和制品系统中仍可能长期保存这些文件。

## 9. 常见问题

### 9.1 为什么上传了 Source Map 仍然无法还原？

优先检查三件事：

- 线上 JS 文件名和上传的 `.map` 是否匹配。
- release / dist / commit id 是否一致。
- 构建后是否又经过 CDN、压缩平台或二次处理，导致线上代码与 `.map` 不再对应。

### 9.2 为什么定位到了错误的行？

通常是某个转换插件没有正确传递 Source Map，或生产压缩阶段没有合并上游 map。自定义 Babel、Rollup、Vite 插件时，如果修改了代码，必须返回对应 map，不能只返回 code。

### 9.3 Source Map 会不会影响线上性能？

只生成但不让浏览器加载时，不会影响用户运行性能。它会增加构建产物体积和上传耗时，但用户下载的 JS/CSS 不会因为旁边存在 `.map` 文件而变慢。
