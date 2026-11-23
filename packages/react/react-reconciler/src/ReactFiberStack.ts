/**
 * ReactFiberStack.ts —— Fiber 值栈（Value Stack）实现
 *
 * 在 React 的 Render 阶段（beginWork / completeWork 的深度优先遍历）中，
 * 需要一种机制来「临时覆盖」某些全局状态，并在离开对应子树后「恢复」原值。
 *
 * 典型场景就是 Context：
 *   <Context.Provider value={A}>        ← 进入时把 context._currentValue 覆盖为 A
 *     <Context.Provider value={B}>      ← 嵌套：进入时覆盖为 B
 *       ...
 *     </Context.Provider>               ← 离开时恢复为 A
 *   </Context.Provider>                 ← 离开时恢复为默认值
 *
 * 由于 beginWork 是「递」（向下深入）、completeWork 是「归」（向上回溯），
 * Provider 的覆盖发生在 beginWork，恢复发生在 completeWork，
 * 二者天然满足「后进先出」的栈式顺序，因此用栈来保存旧值是最自然的选择。
 *
 * 设计要点：
 * 1. StackCursor —— 一个可变的「游标」包装器，内部持有 current 值。
 *    真实 React 使用这种游标而非直接读写全局变量，是为了支持
 *    「可中断渲染」：当渲染被中断再恢复时，可以通过游标快速定位状态。
 * 2. 本文件只提供一个全局 valueStack + index，配合任意个 cursor 使用。
 *    由于只有一个栈，push/pop 必须严格成对、按相同顺序执行，
 *    否则游标的 current 值会错乱。
 */

/** 游标类型：一个持有当前值的可变包装对象 */
export type StackCursor<T> = { current: T }

/**
 * 值栈 —— 保存被覆盖前的旧值。
 *
 * 使用一个共享数组 + index 指针模拟栈：
 * - push：index 自增后把旧值写入 valueStack[index]
 * - pop ：从 valueStack[index] 读出旧值并回填游标，然后 index 自减
 *
 * 之所以不用数组自带的 push/pop 方法，是因为那些方法会动态增删数组，
 * 而这里只需要一个「位置指针」来回移动，复用固定数组空间更高效。
 */
const valueStack: Array<any> = []

/**
 * 栈顶指针 —— 初始为 -1，表示空栈。
 * 每次 push 自增、每次 pop 自减，始终指向最后入栈的元素下标。
 */
let index = -1

/**
 * 创建一个游标，并设置其初始值
 *
 * @param defaultValue - 游标的初始 current 值
 * @returns 新建的 StackCursor 游标
 */
export function createCursor<T>(defaultValue: T): StackCursor<T> {
  return { current: defaultValue }
}

/**
 * 入栈并覆盖游标值
 *
 * 把游标当前的 current 值保存到栈里（供 pop 恢复），
 * 然后把游标的 current 覆盖为新值。
 *
 * 注意：这里保存的「旧值」是游标本身的 current，而非外部传入的 value。
 * value 是要覆盖上去的新值。这样嵌套 push 时，栈里保存的是每一层的
 * 上一层游标值，pop 时逐层还原。
 *
 * @param cursor - 要被覆盖的游标
 * @param value  - 覆盖上去的新值
 */
export function push<T>(cursor: StackCursor<T>, value: T) {
  index++
  valueStack[index] = cursor.current // 保存游标旧值到栈顶
  cursor.current = value // 覆盖游标为传入的新值
}

/**
 * 出栈并恢复游标值
 *
 * 从栈顶读出上一次保存的旧值，回填到游标的 current，
 * 同时把栈顶置空（释放引用）并让 index 自减。
 *
 * 若栈已空（index < 0，即 pop 次数多于 push 次数），
 * 直接返回，避免越界访问。
 *
 * @param cursor - 要被恢复的游标
 */
export function pop<T>(cursor: StackCursor<T>) {
  if (index < 0) {
    // 空栈保护：没有可恢复的值，直接返回
    return
  }
  cursor.current = valueStack[index] // 用栈顶旧值回填游标
  valueStack[index] = null // 释放栈顶引用，避免内存泄漏
  index-- // 栈顶指针下移
}
