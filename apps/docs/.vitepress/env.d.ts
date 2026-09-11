// .vitepress/env.d.ts
/// <reference types="vite/client" />
// 强制告诉 TS：所有 .css 结尾的引入，都是合法的模块
declare module '*.css' {
  const content: string
  export default content
}

declare module 'rollup-plugin-visualizer' {
  export function visualizer(options?: Record<string, unknown>): any
}

// markdown-it-any-block 的 package.json 里 types 指向的文件不存在，且 exports 没有声明类型入口，
// TS 解析不到它自带的 .ts 声明，这里补一条环境声明（用法见 config.mts）
declare module 'markdown-it-any-block/node' {
  import type MarkdownIt from 'markdown-it'
  export function jsdom_init(options?: unknown): Promise<void>
  export const ab_mdit: MarkdownIt.PluginSimple
}
