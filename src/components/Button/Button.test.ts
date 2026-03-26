import {expect,test,describe} from 'vitest'
import {mount} from '@vue/test-utils'
import Button from './Button.vue'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import Icon from '../Icon/Icon.vue'

describe('Button', () => {
  //测试基础功能
  test('basic Button', async () => {
    const wrapper = mount(Button, {
      props:{
        type:'primary'
      },
      slots:{
        default:'button'
      }
    })
    expect(wrapper.classes()).toContain('vk-button--primary')
    expect(wrapper.get('button').text()).toBe('button')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })
  //测试禁用
  test('disabled', async () => {
    const wrapper = mount(Button, {
      props:{
        disabled:true
      },
      slots:{
        default:'disabled'
      }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    //找到button的dom，确认其disabled属性是否定义
    expect(wrapper.find('button').element.disabled).toBeDefined()
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('click')
  })
  //测试图标
  test('icon', () => {
    const wrapper = mount(Button, {
      props:{
        icon:'arrow-up'
      },
      slots:{
        default:'icon'
      },
      //FontAwesomeIcon替身
      global:{
        stubs:['FontAwesomeIcon']
      }
    })
    //查询FontAwesomeIcon组件是否存在，并且这个组件的icon为arrow-up
    expect(wrapper.findComponent(FontAwesomeIcon).exists()).toBeTruthy()
    expect(wrapper.findComponent(FontAwesomeIcon).attributes('icon')).toBe('arrow-up')
  })
  //测试loading
  test('loading', () => {
    const wrapper = mount(Button, {
      props:{
        loading:true
      },
      slots:{
        default:'loading'
      },
      //FontAwesomeIcon替身
      global:{
        stubs:['FontAwesomeIcon']
      }
    })
    //查询FontAwesomeIcon组件是否存在，并且这个组件的icon为spinner
    expect(wrapper.findComponent(FontAwesomeIcon).exists()).toBeTruthy()
    expect(wrapper.findComponent(FontAwesomeIcon).attributes('icon')).toBe('spinner')
    //找到button的dom元素判断其disabled属性是否为true
    expect(wrapper.find('button').element.disabled).toBeTruthy()
    //找到有disabled属性的dom
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
