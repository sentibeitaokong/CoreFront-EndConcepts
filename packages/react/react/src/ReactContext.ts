/**
 * ReactContext.ts —— createContext API 的实现
 *
 * 对外暴露 React.createContext(defaultValue)，返回一个 Context 对象。
 * Context 用于在组件树中跨层级传递数据，避免「逐层手动传 props」。
 *
 * 一个 Context 对象上的三个组成部分：
 * 1. context 本身（$$typeof = REACT_CONTEXT_TYPE）：
 *    - 既是值的容器（_currentValue），又充当 Consumer（context.Consumer === context）
 * 2. context.Provider（$$typeof = REACT_PROVIDER_TYPE）：
 *    - 作为 <Context.Provider value={v}> 的 element.type，
 *      协调阶段据此把 Fiber 标记为 ContextProvider
 * 3. context._currentValue：
 *    - 始终保存「当前生效」的值：默认是 defaultValue，
 *      进入 Provider 时被 pushProvide 覆盖，离开时被 popProvide 恢复
 *
 * 三种消费方式（对应 demo/pages/ContextPage2.jsx 中的示例）：
 * - useContext(context)                 —— 函数组件内调用
 * - <Context.Consumer>{v => ...}</...> —— render props 形式
 * - static contextType = context        —— 类组件通过 this.context 读取
 */

import type { ReactContext } from 'shared/ReactTypes'
import { REACT_CONTEXT_TYPE, REACT_PROVIDER_TYPE } from 'shared/ReactSymbols'

/**
 * 创建一个 Context 对象
 *
 * 初始化 _currentValue 为 defaultValue（无 Provider 包裹时的兜底值），
 * 然后构造 Provider 与 Consumer：
 * - Provider 是 { $$typeof: REACT_PROVIDER_TYPE, _context: context }，
 *   _context 指回 context，供 beginWork/completeWork 通过 type._context 找到 Context。
 * - Consumer 直接复用 context 本身（context.Consumer = context），
 *   因此 <Context.Consumer> 编译后 element.type 就是 context，
 *   协调阶段据此把 Fiber 标记为 ContextConsumer。
 *
 * @param defaultValue - 默认值：当消费者没有匹配到任何 Provider 时读到的值
 * @returns 一个可复用的 Context 对象
 */
export function createContext<T>(defaultValue: T): ReactContext<T> {
  // 先创建 Context 对象，Provider / Consumer 暂置 null（两步初始化）
  const context: ReactContext<T> = {
    $$typeof: REACT_CONTEXT_TYPE, // 标识这是一个 Context（而非普通元素）
    _currentValue: defaultValue, // 当前值，初始为默认值
    Provider: null, // 稍后赋值
    Consumer: null, // 稍后赋值
  }

  // Provider 元素类型：JSX <Context.Provider> 的 type
  context.Provider = {
    $$typeof: REACT_PROVIDER_TYPE, // 标识这是一个 Provider
    _context: context, // 指回 Context 本体
  }

  // Consumer 直接复用 context 本身，形成自引用
  // 好处：<Context.Consumer> 和 useContext 都可通过同一个对象定位到 _currentValue
  context.Consumer = context

  return context
}
