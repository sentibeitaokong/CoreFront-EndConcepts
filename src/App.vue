<template>
    <header style="display: inline-block">
      <Tooltip :trigger="trigger" ref="tooltipRef" placement="bottom" :close-delay="200" manual :open-delay="200">
        <img src="./assets/logo.svg" width="125" height="125" style="border: 1px solid gray" alt="" />
        <template #content>
          <h1>hello world</h1>
        </template>
      </Tooltip>
    </header>
  <main>
        <Dropdown
          :menu-options="menuOptions"
          :trigger="trigger"
          ref="tooltipRef"
          placement="left"
          :close-delay="200"
          :open-delay="200"
          @visible-change="e=>inlineConsole('visibleChange',e)"
          @select="e=>inlineConsole('select',e)"
        >
          <img src="./assets/logo.svg" width="125" height="125" style="border: 1px solid gray" alt="" />
        </Dropdown>
  </main>
  <!--  <header>-->
  <!--  </header>-->
<!--  <div>-->
        <div>
          <Collapse v-model="openValue" accordion>
            <CollapseItem name="a" title="2222" disabled>
              <div>aaaa</div>
            </CollapseItem>
            <CollapseItem name="b" title="333">
              <div>aaaa</div>
            </CollapseItem>
          </Collapse>
        </div>
        <div>

    <!--      <Button @click="open">Test Button</Button>-->
    <!--      <Button plain @click="close">Plain Button</Button>-->
    <!--      <Button round>Round Button</Button>-->
    <!--      <Button circle>VK</Button>-->
    <!--      <Button disabled>Disabled Button</Button><br /><br />-->
    <!--      <Button type="primary">Primary</Button>-->
    <!--      <Button type="success">Success</Button>-->
    <!--      <Button type="info">Info</Button>-->
    <!--      <Button type="warning">Warning</Button>-->
    <!--      <Button type="danger">Danger</Button><br /><br />-->
    <!--      <Button type="primary" plain>Primary</Button>-->
    <!--      <Button type="success" plain>Success</Button>-->
    <!--      <Button type="info" plain>Info</Button>-->
    <!--      <Button type="warning" plain>Warning</Button>-->
    <!--      <Button type="danger" plain>Danger</Button><br /><br />-->
    <!--      <Button size="large">Large</Button>-->
    <!--      <Button size="small">Small</Button><br /><br />-->
    <!--      <Button size="large" loading>Loading</Button>-->
          <Button size="large" :icon="faAddressCard">Icon</Button><br /><br />
    <!--    </div>-->
            <Icon :icon="faArrowUp" :size="size" type="danger"/>
        <Input v-model="test" type="text" placeholder="基础文本框，请输入" />
        <span>{{test}}</span>

    <br />
        <Switch active-text="off" inactive-text="on" active-value="right" inactive-value="wrong" v-model="value"></Switch>
        {{value}}

        <Select v-model="selectValue" :options="selectOptions" placeholder="请选择" filterable></Select>
        {{selectValue}}

        <footer style="width: 100%;">
          <Progress :strokeHeight="30" :percent="30"  type="info" :show-text="true"></Progress>
        </footer>
    <div>
      <Form :model="model" :rules="rules" ref="formRef">
        <FormItem label="the email" prop="email">
          <template #label="{ label }">
            <Button>{{ label }}</Button>
          </template>
          <Input type="text" v-model="model.email" />
        </FormItem>
        <FormItem label="the password" prop="password">
          <Input type="password" v-model="model.password" />
        </FormItem>
        <div>
          <Button type="primary" @click.prevent="submit">Submit</Button>
          <Button @click.prevent="reset">Reset</Button>
        </div>
      </Form>
      <p>
        form value:
        <span>{{ model }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from '@/components/Button/Button.vue'
import Collapse from '@/components/Collapse/Collapse.vue'
import CollapseItem from '@/components/Collapse/CollapseItem.vue'
import Dropdown from '@/components/Dropdown/Dropdown.vue'
// import Dropdown from '@/components/Dropdown/Dropdown.tsx'
import Icon from '@/components/Icon/Icon.vue'
import Message from '@/components/Message/Message.vue'
import Input from '@/components/Input/Input.vue'
import Switch from '@/components/Switch/Switch.vue'
import Select from '@/components/Select/Select.vue'
import Form, { type FormInstance, type FormRules } from '@/components/Form'
import { FormItem } from '@/components/Form'

import type { TooltipInstance } from '@/components/Tooltip/type.ts'
import type { UseFloatingOptions } from '@floating-ui/vue'
import { onMounted, reactive, ref } from 'vue'
import type { MenuOptions } from '@/components/Dropdown/types.ts'
import { h } from 'vue'
import { createMessage } from '@/components/Message/method.ts'
import type { SelectOption } from '@/components/Select/types.ts'
import Progress from '@/components/Progress/Progress.vue'
import {faAddressCard} from "@fortawesome/free-solid-svg-icons/faAddressCard";
import {faArrowUp} from "@fortawesome/free-solid-svg-icons/faArrowUp";

//collasp默认打开
const openValue = ref<string[]>(['a'])
//icon的size属性
const size = ref<any>('3x')
onMounted(() => {
  // createMessage({message:'hello message',duration:2000,showClose:true})
  // createMessage({message:'hello message',duration:0,type: 'success',showClose:true})
  // createMessage({message:'hello message',duration:0,type: 'error',showClose:true})
  // createMessage({message:'hello message',duration:1000,showClose:true})
  setTimeout(() => {
    // openValue.value = ['a', 'b']
    size.value = '2xl'
    // trigger.value='hover'
  }, 2000)
})

//tooltip测试
const tooltipRef = ref<TooltipInstance | null>(null)
const trigger = ref<any>('click')
const options: UseFloatingOptions = { placement: 'bottom' }
//打开tooltip
const open = () => {
  tooltipRef.value?.show()
}
//关闭tooltip
const close = () => {
  tooltipRef.value?.hide()
}

//测试dropdown
const menuOptions: MenuOptions[] = [
  { key: 1, label: h('b', 'this is bold') },
  { key: 2, label: 'item2', disabled: true },
  { key: 3, label: 'item3', divided: true },
  { key: 4, label: 'item4' },
]
const inlineConsole = (...args: any) => {
  console.log(...args)
}

//测试input输入框
const test = ref('test')

//测试switch
const value = ref('right')

//测试select
const selectOptions: SelectOption[] = [
  { value: '1', label: 'item1' },
  { value: '2', label: 'item2' },
  { value: '3', label: 'item3' },
  { value: '4', label: 'item4', disabled: true },
]
const customRender = (option: any) => {
  return h('div', { className: 'xyz' }, [h('b', option.label), h('span', option.value)])
}
const selectValue = ref('')

const handleFetch = (query) => {
  if (!query) return Promise.resolve([])
  return fetch(`https://api.github.com/search/repositories?q=${query}`)
    .then((res) => res.json())
    .then(({ items }) => {
      return items.slice(0, 10).map((item) => ({ label: item.name, value: item.node_id }))
    })
}

//测试form
const formRef=ref()
const model = reactive({
  email: '123',
  password: '234',
})
const rules: FormRules = {
  email: [
    {
      type: 'email',
      required: true,
      trigger: 'blur',
    },
  ],
  password: [
    {
      type: 'string',
      required: true,
      trigger: 'blur',
    },
  ],
}
const submit = async () => {
  try {
    await formRef.value?.validate()
    console.log('passed')
  }catch (e) {
    console.log('error',e)
  }
}
const reset=()=>{
  formRef.value?.resetFields()
}
</script>

<style>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  border: 1px solid green;
}
.vk-tooltip__popper {
  border: 1px solid red;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
.vk-select__menu-item,
.xyz {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
