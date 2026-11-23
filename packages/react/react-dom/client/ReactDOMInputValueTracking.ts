/**
 * ReactDOMInputValueTracking.ts —— 表单值追踪（ChangeEventPlugin 简化版）
 *
 * 背景：React 的 onChange 并不是原生 change 事件的一一映射。
 * 对于文本输入框，用户每敲一个字都应该触发 onChange；而原生 change
 * 往往要等到失焦才触发。反过来，同一次「值变化」又可能同时产生
 * input 和 change 两个原生事件，如果不做处理，用户的 onChange 会被调用两次。
 *
 * 解决思路（与 React 的 inputValueTracking 相同）：
 * 为每个表单元素记录「上一次分发过的值」，事件到来时先比较：
 * - 值没变 → 说明这次原生事件是重复通知，直接跳过；
 * - 值变了 → 更新记录并正常分发。
 *
 * 对不同控件，「值」的定义不同：
 * - checkbox / radio：用 checked（value 在切换时不变）
 * - 其他 input / textarea / select：用 value
 *
 * 文件选择框（<input type="file">）不会触发 input 事件，只有 change；
 * 首次 change 时 WeakMap 中还没有记录，因此一定会被分发。
 */

/**
 * 每个表单元素上一次分发时的值
 *
 * 使用 WeakMap：元素被移除后条目随 GC 回收，不会造成内存泄漏。
 */
const trackedValues: WeakMap<Element, string | boolean> = new WeakMap()

/**
 * 判断本次事件是否真的改变了表单值
 *
 * @param target - 原生事件的 target
 * @returns true  → 值发生了变化（或目标不是表单元素），应该分发 onChange
 *          false → 与上次相同，重复通知，应跳过
 */
export function updateValueIfChanged(target: EventTarget | null): boolean {
  if (target === null || typeof (target as Element).tagName !== 'string') {
    return true
  }

  const node = target as HTMLInputElement
  const tagName = node.tagName.toLowerCase()
  let currentValue: string | boolean

  if (tagName === 'input') {
    const type = (node.type || '').toLowerCase()
    currentValue =
      type === 'checkbox' || type === 'radio' ? node.checked : node.value
  } else if (tagName === 'select' || tagName === 'textarea') {
    currentValue = (node as any).value
  } else {
    // 非表单元素：不做去重
    return true
  }

  const lastValue = trackedValues.get(node)
  trackedValues.set(node, currentValue)

  return lastValue !== currentValue
}
