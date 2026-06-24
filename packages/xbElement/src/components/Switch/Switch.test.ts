import {describe,test,expect} from 'vitest'
import {mount} from '@vue/test-utils'
import Switch from './Switch.vue'
describe('Input.vue', () => {
  test('基本展示', async () => {
    const wrapper=mount(Switch,{
      props:{
        modelValue:'Right',
        activeText:'Off',
        inactiveText:'On',
        activeValue:'Right',
        inactiveValue:'Wrong',
      }
    })
    //默认选中
    expect(wrapper.get('.vk-switch').classes()).toContain('is-checked')
    expect(wrapper.find('.vk-switch__core').exists()).toBeTruthy()
    expect(wrapper.find('.vk-switch__core-inner-text').text()).toBe('Off')
    await wrapper.find('input').trigger('click')
    //点击后未选中
    expect(wrapper.find('.vk-switch__core').exists()).toBeTruthy()
    expect(wrapper.find('.vk-switch__core-inner-text').text()).toBe('On')
  })
})
