import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Tooltip from './Tooltip.vue'
import {nextTick} from 'vue'
// vi.mock('@popperjs/core')
const onVisibleChange = vi.fn()
describe('Tooltip.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  test('basic tooltip', async () => {
    const wrapper = mount(() =>
        <div>
          <div id="outside"></div>
          <Tooltip content="hello tooltip" trigger='click' onVisible-change={onVisibleChange} ref="tooltipRef">
            <button id="trigger">Trigger</button>
          </Tooltip>
        </div>
      , {
        attachTo: document.body
      })
    // 静态测试
    const triggerArea = wrapper.find('#trigger')
    expect(triggerArea.exists()).toBeTruthy()
    expect(wrapper.find('.vk-tooltip__popper').exists()).toBeFalsy()
    // console.log('before', wrapper.html())
    // 测试点击行为
    wrapper.get('#trigger').trigger('click')
    vi.runAllTimers()
    await nextTick()
    expect(wrapper.find('.vk-tooltip__popper').exists()).toBeTruthy()

    //测试点击弹窗内容
    expect(wrapper.get('.vk-tooltip__popper').text()).toBe('hello tooltip')
    expect(onVisibleChange).toHaveBeenCalledTimes(1)
    // console.log('after', wrapper.html())

    //测试外层元素点击事件
    wrapper.get('#outside').trigger('click')
    // console.log(wrapper.emitted())
    vi.runAllTimers()
    await nextTick()
    // console.log(wrapper.html())
    expect(wrapper.find('.vk-tooltip__popper').exists()).toBeFalsy()
    expect(onVisibleChange).toHaveBeenLastCalledWith(false)
  })
})
