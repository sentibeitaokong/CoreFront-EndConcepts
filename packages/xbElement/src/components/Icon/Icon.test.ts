import Icon from "./Icon.vue";
import {test,expect,describe} from 'vitest'
import {mount} from '@vue/test-utils'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

describe('Icon.vue', () => {
  test('icon',()=>{
    const wrapper = mount(Icon, {
      props:{
        color:'red',
        type:'primary',
        icon:'arrow-up'
      },
      //FontAwesomeIcon替身
      global:{
        stubs:['FontAwesomeIcon']
      }
    })
    expect(wrapper.findComponent(FontAwesomeIcon).exists()).toBeTruthy()
    expect(wrapper.findComponent(FontAwesomeIcon).attributes('icon')).toBe('arrow-up')
    expect(wrapper.find('.vk-icon').classes()).toContain('vk-icon--primary')
    expect(wrapper.find('.vk-icon').attributes('style')).toContain('red')
  })
})
