import {describe,test,expect,vi, beforeEach, afterEach } from 'vitest'
import {mount} from '@vue/test-utils'
import Select from '@/components/Select/Select.vue'
import type {SelectOption} from '@/components/Select/types.ts'
import { nextTick } from 'vue'
const visibleChange=vi.fn()
describe('Select.vue', () => { // 开启 fake timers 以便测试 debounce (防抖) 相关的逻辑
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('基本展示', async () => {
    //测试select
    const selectOptions:SelectOption[]=[
      { value: '1', label:'item1' },
      { value: '2', label: 'item2' },
      { value: '3', label: 'item3', },
      { value: '4', label: 'item4',disabled:true }
    ]
    const wrapper=mount(Select,{
      props:{
        modelValue:'',
        options:selectOptions,
        placeholder:"请选择",
        onVisibleChange:visibleChange
      },
      global:{
        stubs:{
          'font-awesome-icon': true
        }
      }
    })
    const input=wrapper.find('input')
    const container=wrapper.find('.vk-select')
    expect(input.element.value).toBe('')
    console.log(wrapper.html())
    await container.trigger('click')
    await nextTick()
    expect(wrapper.find('font-awesome-icon-stub').attributes('icon')).toBe('angle-down')
    await input.setValue('1')
    expect(input.element.value).toBe('1')
    // expect(wrapper.find('vk-select__menu').exists()).toBeTruthy()
  })
})
