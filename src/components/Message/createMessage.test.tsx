import { describe, test, expect } from 'vitest'
import { nextTick } from 'vue'
import { closeAll, createMessage } from '@/components/Message/method.ts'

//等待动画效果结束
export const rAF = async () => {
  return new Promise((res) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        res(null)
        await nextTick()
      })
    })
  })
}
function getTopValue(element: Element) {
  const styles = window.getComputedStyle(element)
  const topValue = styles.getPropertyValue('top')
  return Number.parseFloat(topValue)
}
describe('createMessage', () => {
  test('调用方法应该创建对应的 Message 组件', async () => {
    const instance = createMessage({ message: 'hello message', duration: 2000 })
    await rAF()
    expect(document.querySelector('.vk-message')).toBeTruthy()
    instance.destory()
    await rAF()
    expect(document.querySelector('.vk-message')).toBeFalsy()
  })
  test('多次调用方法应该创建多个实例', async () => {
    createMessage({ message: 'hello message', duration: 2000 })
    createMessage({ message: 'hello message2', duration: 2000 })
    await rAF()
    expect(document.querySelectorAll('.vk-message').length).toBe(2)
    closeAll()
    await rAF()
    expect(document.querySelectorAll('.vk-message').length).toBe(0)
    expect(document.querySelector('.vk-message')).toBeFalsy()
  })
  test('创建多个实例应该设置正确的 offset', async () => {
    createMessage({ message: 'hello message', duration: 0, offset: 100 })
    createMessage({ message: 'hello message2', duration: 0, offset: 50 })
    await rAF()
    expect(document.querySelectorAll('.vk-message').length).toBe(2)
    const elements = document.querySelectorAll('.vk-message')
    // https://github.com/jsdom/jsdom/issues/1590
    // 在JS-dom 中，对应的 height 返回为零
    const FirstElementTop = getTopValue(elements[0] as Element)
    const secondElementTop = getTopValue(elements[1] as Element)
    expect(FirstElementTop).toBe(100)
    expect(secondElementTop).toBe(150)
  })
})
