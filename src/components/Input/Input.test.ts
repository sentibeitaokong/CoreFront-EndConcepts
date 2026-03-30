import {describe,test,expect} from 'vitest'
import {mount} from '@vue/test-utils'
import Input from './Input.vue'
describe('Input.vue', () => {
  test('基本展示', () => {
    //针对动态class，查看classes是否验证正确
    //针对v-if是否渲染正确的标签以及内容
    //针对slots，是否渲染对应的slots内容
    const wrapper=mount(Input,{
      props:{
        modelValue:'',
        type:'text',
        size:'small'
      },
      slots:{
        prefix:'prefix',
        prepend:'prepend',
        suffix:'suffix',
        append:'append',
      }
    })
    //测试class
    expect(wrapper.classes()).toContain('vk-input--small')
    expect(wrapper.classes()).toContain('is-prepend')
    expect(wrapper.classes()).toContain('is-prefix')
    expect(wrapper.classes()).toContain('is-suffix')
    expect(wrapper.classes()).toContain('is-append')

    //测试是否渲染特定节点
    expect(wrapper.find('input').exists()).toBeTruthy()
    expect(wrapper.get('input').attributes('type')).toBe('text')

    //测试插槽
    expect(wrapper.find('.vk-input__prepend').exists()).toBeTruthy()
    expect(wrapper.get('.vk-input__prepend').text()).toBe('prepend')
    expect(wrapper.find('.vk-input__prefix').exists()).toBeTruthy()
    expect(wrapper.get('.vk-input__prefix').text()).toBe('prefix')
    expect(wrapper.find('.vk-input__suffix').exists()).toBeTruthy()
    expect(wrapper.get('.vk-input__suffix').text()).toBe('suffix')
    expect(wrapper.find('.vk-input__append').exists()).toBeTruthy()
    expect(wrapper.get('.vk-input__append').text()).toBe('append')

    //测试textarea
    const wrapper2=mount(Input,{
      props:{
        modelValue:'',
        type:'textarea'
      }
    })
    expect(wrapper2.find('.vk-textarea__wrapper').exists()).toBeTruthy()
  })

  test('test v-model',async ()=>{
    const wrapper=mount(Input,{
      props:{
        type:'text',
        modelValue:'test',
        'onUpdate:modelValue':(e:string)=>wrapper.setProps({modelValue:e})
      }
    })

    //设置初始值
    const input=wrapper.get('input')
    expect(input.element.value).toBe('test')

    //更新值
    await input.setValue('update')
    expect(wrapper.props('modelValue')).toBe('update')
    expect(input.element.value).toBe('update')
    console.log('the events',wrapper.emitted())
    expect(wrapper.emitted()).toHaveProperty('input')
    expect(wrapper.emitted()).toHaveProperty('change')
    const inputEvent=wrapper.emitted('input')
    const changeEvent=wrapper.emitted('change')
    expect(inputEvent![0]).toEqual(['update'])
    expect(changeEvent![0]).toEqual(['update'])

    //v-model异步更新
    await wrapper.setProps({modelValue:'prop update'})
    expect(input.element.value).toBe('prop update')
  })

  test('test clear string',async ()=>{
    const wrapper=mount(Input,{
      props:{
        modelValue:'test',
        clearable:true,
        type:'text'
      },
      //模拟图标
      global:{
        stubs:{
          'font-awesome-icon': true
        }
      }
    })
    //未聚焦时不显示清空图标
    expect(wrapper.find('.vk-input__clear').exists()).toBeFalsy()
    const input=wrapper.get('input')
    await input.trigger('focus')
    expect(wrapper.emitted()).toHaveProperty('focus')
    //出现icon区域
    expect(wrapper.find('.vk-input__clear').exists()).toBeTruthy()
    //点击icon区域值变空且icon消失
    await wrapper.get('.vk-input__clear').trigger('click')
    expect(input.element.value).toBe('')
    //点击清空图标触发clear,change,input事件
    expect(wrapper.emitted()).toHaveProperty('clear')
    expect(wrapper.emitted()).toHaveProperty('input')
    expect(wrapper.emitted()).toHaveProperty('change')

    //测试input change事件
    const inputEvent=wrapper.emitted('input')
    const changeEvent=wrapper.emitted('change')
    expect(inputEvent![0]).toEqual([''])
    expect(changeEvent![0]).toEqual([''])
    await input.trigger('blur')
    expect(wrapper.emitted()).toHaveProperty('blur')
    expect(wrapper.find('.vk-input__clear').exists()).toBeFalsy()
  })

  test('test text password icon change',async ()=>{
    const wrapper=mount(Input,{
      props:{
        modelValue:'',
        showPassword:true,
        type:'text'
      },
      //模拟图标
      global:{
        stubs:{
          'font-awesome-icon': true
        }
      }
    })
    //当前值为空时不出现Icon
    expect(wrapper.find('.vk-input__password').exists()).toBeFalsy()
    const input=wrapper.get('input')
    expect(input.element.type).toBe('password')
    //  出现 Icon 区域，并且 Icon 为特点的图标
    await input.setValue('123')
    const eyeIcon = wrapper.find('font-awesome-icon-stub')
    expect(eyeIcon.exists()).toBeTruthy()
    expect(eyeIcon.attributes('icon')).toBe('eye-slash')
    //点击图标会切换图标，并且值会切换Input类型
    await eyeIcon.trigger('click')
    expect(input.element.type).toBe('text')
    expect(wrapper.find('font-awesome-icon-stub').attributes('icon')).toBe('eye')
  })
})
