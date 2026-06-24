import {expect,test,describe} from 'vitest'
import {mount} from '@vue/test-utils'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import Icon from '../Icon/Icon.vue'
import Collapse from './Collapse.vue'
import CollapseItem from './CollapseItem.vue'
import { nextTick } from 'vue'

describe('Collapse', () => {
  test('basic Collapse', async () => {
      const wrapper = mount(Collapse, {
        props:{
          modelValue:['a'],
          accordion:true,
        },
        slots:{
          default:(
            <>
              <CollapseItem name="a" title="2222" disabled>
                <div>aaaaa</div>
              </CollapseItem>
              <CollapseItem name="b" title="333">
                  <div>aaaabbbb</div>
              </CollapseItem>
              <CollapseItem name="c" title="444" disabled>
                <div>aaaabbbb</div>
              </CollapseItem>
            </>
          )
        },
        //创建icon副本
        global:{
          stubs:['icon']
        },
        //组件插入到document.body中
        attachTo:document.body,
      })
      const headers=wrapper.findAll('.vk-collapse-item__header')
      const contents=wrapper.findAll('.vk-collapse-item__wrapper')
      //测试collapse headers和contents的长度是否为3
      expect(headers.length).toBe(3)
      expect(contents.length).toBe(3)
      //测试默认打开的collapseItem的header的内容是否为2222
      expect(headers[0]!.text()).toBe('2222')
      expect(contents[0]!.text()).toBe('aaaaa')
      expect(contents[0]!.isVisible()).toBeTruthy()
      expect(contents[1]!.isVisible()).toBeFalsy()

      //行为   点击第二个collapseItem
      await wrapper.findAll('.vk-collapse-item__header')[1]!.trigger('click')
      expect(contents[0]!.isVisible()).toBeFalsy()
      expect(contents[1]!.isVisible()).toBeTruthy()
      expect(contents[1]!.text()).toBe('aaaabbbb')
      expect(wrapper.emitted()).toHaveProperty('change')
      //继续点击第二个collapseItem  所有collapseItem都关上了
      await wrapper.findAll('.vk-collapse-item__header')[1]!.trigger('click')
      expect(contents[1]!.isVisible()).toBeFalsy()
      expect(contents[0]!.isVisible()).toBeFalsy()
      //判断两次点击事件 modelValue的值变化
      expect(wrapper.emitted('change')![0]).toEqual([['b']])
      expect(wrapper.emitted('change')![1]).toEqual([['']])

      //设置disabled    判断第三个collapseItem是否禁用
      expect(wrapper.findAll('.vk-collapse-item__header')[2]!.classes()).toContain("is-disabled")
      //点击第三个collapseItem
      await wrapper.findAll('.vk-collapse-item__header')[2]!.trigger('click')
      //第三个collapseItem在禁用状态无法展开，所以它的内容不可见
      expect(wrapper.findAll('.vk-collapse-item__wrapper')[2]!.isVisible()).toBeFalsy()
  })

})
