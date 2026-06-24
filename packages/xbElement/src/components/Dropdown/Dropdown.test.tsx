import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Dropdown from './Dropdown.vue'
import {h} from 'vue'
import type {MenuOptions} from '@/components/Dropdown/types.ts'
import {nextTick} from 'vue'
// vi.mock('@popperjs/core')
const onVisibleChange = vi.fn()
describe('Dropdown.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  test('basic Dropdown', async () => {
    //测试dropdown
    const menuOptions:MenuOptions[]=[
      { key: 1, label:h('b', 'this is bold') },
      { key: 2, label: 'item2', disabled: true },
      { key: 3, label: 'item3', divided: true },
      { key: 4, label: 'item4' }
    ]
    const wrapper = mount(() =>
        <div>
          <div id="outside"></div>
          <Dropdown menuOptions={menuOptions} trigger='click' onVisible-change={onVisibleChange} ref="tooltipRef" closeDelay={200}
          openDelay={200}>
            <button id="trigger">Trigger</button>
          </Dropdown>
        </div>
      , {
        attachTo: document.body
      })
    // 静态测试
    const triggerArea = wrapper.find('#trigger')
    expect(triggerArea.exists()).toBeTruthy()
    expect(wrapper.find('.vk-dropdown__menu').exists()).toBeFalsy()
    // console.log('before', wrapper.html())
    // 测试点击行为
    wrapper.get('#trigger').trigger('click')
    vi.runAllTimers()
    await nextTick()
    expect(wrapper.find('.vk-dropdown__menu').exists()).toBeTruthy()

    // //测试点击弹窗内容
    expect(wrapper.find('.divided-placeholder').exists()).toBeTruthy()
    expect(onVisibleChange).toHaveBeenCalledTimes(1)
    // console.log('after', wrapper.html())

    // //测试外层元素点击事件
    wrapper.get('#outside').trigger('click')
    // console.log(wrapper.emitted())
    vi.runAllTimers()
    await nextTick()
    // console.log(wrapper.html())
    expect(wrapper.find('.vk-dropdown__menu').exists()).toBeFalsy()
    expect(onVisibleChange).toHaveBeenLastCalledWith(false)
  })
})
