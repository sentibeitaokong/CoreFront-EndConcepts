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
