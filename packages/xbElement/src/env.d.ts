// src/env.d.ts
/// <reference types="vite/client" />

export {}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@vue/runtime-dom' {
  interface HTMLAttributes {
    children?: any
  }

  interface ReservedProps {
    children?: any
  }
}

declare module 'vue/jsx-runtime' {
  namespace JSX {
    interface IntrinsicAttributes {
      children?: any
    }

    interface IntrinsicElements {
      button: any
      div: any
      li: any
      span: any
      ul: any
    }

    interface ElementChildrenAttribute {
      children: {}
    }
  }
}

declare global {
  namespace JSX {
    interface ElementChildrenAttribute {
      children: {}
    }
  }
}

// 如果需要导入其他资源
declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'
declare module '*.css'
declare module '*.scss'
