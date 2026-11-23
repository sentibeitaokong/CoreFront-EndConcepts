// 共享类型定义 —— React 核心类型

// 源码位置信息
export type Source = {
  fileName: string
  lineNumber: number
}

export type ReactElement = {
  $$typeof: any // 元素类型标识（Symbol），用于安全校验
  type: any // 组件类型：函数/类/字符串标签名
  key: any // diff 算法中标识身份的 key
  ref: any // ref 引用
  props: any // 组件属性
  _owner: any // 创建该元素的父 Fiber（内部使用）
}

export type ReactNode = ReactElement | ReactText | ReactFragment

export type ReactEmpty = null | void | boolean

export type ReactFragment = ReactEmpty | Iterable<ReactNode>

export type ReactNodeList = ReactEmpty | ReactNode

export type ReactText = string | number

/**
 * Context 对象类型 —— React.createContext() 返回的对象
 *
 * 一个 Context 对象同时充当三个角色：
 * 1. 值的容器：_currentValue 保存「当前生效」的值（Provider 覆盖 / 默认值）
 * 2. Consumer：context.Consumer 就是 context 本身（可作 <Context.Consumer> 使用）
 * 3. Provider 的持有者：context.Provider 是带 $$typeof 的 Provider 元素类型
 *
 * 字段说明：
 * - $$typeof     ：REACT_CONTEXT_TYPE 符号，用于在协调阶段识别「这是一个 Context」
 * - Consumer     ：context 本身（自引用），因此 <Context.Consumer> 编译后 type 就是 context
 * - Provider     ：Provider 元素类型，其 _context 指回 context 本身
 * - _currentValue：当前值。默认为 defaultValue，进入 Provider 时被覆盖，离开时恢复
 *
 * Provider / Consumer 在 createContext 中先置 null，再赋值，因此类型上允许为 null。
 */
export type ReactContext<T> = {
  $$typeof: symbol | number
  Consumer: ReactContext<T> | null
  Provider: ReactConsumerType<T> | null
  _currentValue: T
}

/**
 * Provider 元素类型 —— 挂在 context.Provider 上
 *
 * JSX 中 <Context.Provider value={...}> 编译后，element.type 就是该对象，
 * 协调阶段据此把 Fiber 标记为 ContextProvider（见 createFiberFormTypeAndProps）。
 *
 * - $$typeof：REACT_PROVIDER_TYPE 符号，用于识别「这是 Provider」
 * - _context：指回它所属的 Context 对象，beginWork/completeWork 据此读写 _currentValue
 */
export type ReactConsumerType<T> = {
  $$typeof: symbol | number
  _context: ReactContext<T>
}
