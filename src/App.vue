<template>
<!--  <header style="display: inline-block">-->
<!--    <Tooltip :trigger="trigger" ref="tooltipRef" placement="left" :close-delay="200" manual :open-delay="200">-->
<!--      <img src="./assets/logo.svg" width="125" height="125" style="border: 1px solid gray" alt="" />-->
<!--      <template #content>-->
<!--        <h1>hello world</h1>-->
<!--      </template>-->
<!--    </Tooltip>-->
<!--  </header>-->
<!--  <main>-->
<!--    <Dropdown-->
<!--      :menu-options="menuOptions"-->
<!--      :trigger="trigger"-->
<!--      ref="tooltipRef"-->
<!--      placement="left"-->
<!--      :close-delay="200"-->
<!--      :open-delay="200"-->
<!--      manual-->
<!--      @visible-change="e=>inlineConsole('visibleChange',e)"-->
<!--      @select="e=>inlineConsole('select',e)"-->
<!--    >-->
<!--      <img src="./assets/logo.svg" width="125" height="125" style="border: 1px solid gray" alt="" />-->
<!--    </Dropdown>-->
<!--  </main>-->
<!--  <header>-->
<!--    <Message message="hello Message" :duration="0"  show-close></Message>-->
<!--  </header>-->
  <div>

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

      <Button @click="open">Test Button</Button>
      <Button plain @click="close">Plain Button</Button>
      <Button round>Round Button</Button>
      <Button circle>VK</Button>
      <Button disabled>Disabled Button</Button><br /><br />
      <Button type="primary">Primary</Button>
      <Button type="success">Success</Button>
      <Button type="info">Info</Button>
      <Button type="warning">Warning</Button>
      <Button type="danger">Danger</Button><br /><br />
      <Button type="primary" plain>Primary</Button>
      <Button type="success" plain>Success</Button>
      <Button type="info" plain>Info</Button>
      <Button type="warning" plain>Warning</Button>
      <Button type="danger" plain>Danger</Button><br /><br />
      <Button size="large">Large</Button>
      <Button size="small">Small</Button><br /><br />
      <Button size="large" loading>Loading</Button>
      <Button size="large" icon="address-card">Icon</Button><br /><br />
    </div>
        <Icon icon="arrow-up" :size="size" type="danger"/>
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

import type {TooltipInstance} from '@/components/Tooltip/type.ts'
import type { UseFloatingOptions } from '@floating-ui/vue'
import { onMounted, ref } from 'vue'
import type {MenuOptions} from '@/components/Dropdown/types.ts'
import { h } from 'vue'
import {createMessage} from '@/components/Message/method.ts'

//collasp默认打开
const openValue = ref<string[]>(['a'])
//icon的size属性
const size = ref<any>('3x')
onMounted(() => {
  createMessage({message:'hello message',duration:2000,showClose:true})
  createMessage({message:'hello message',duration:0,type: 'success',showClose:true})
  createMessage({message:'hello message',duration:0,type: 'danger',showClose:true})
  // createMessage({message:'hello message',duration:1000,showClose:true})
  setTimeout(()=>{
    // openValue.value = ['a', 'b']
    size.value = '2xl'
    // trigger.value='hover'
  },2000)
})

//tooltip测试
const tooltipRef = ref<TooltipInstance | null>(null)
const trigger = ref<any>('click')
const options:UseFloatingOptions={placement:'bottom'}
//打开tooltip
const open=()=>{
  tooltipRef.value?.show()
}
//关闭tooltip
const close=()=>{
  tooltipRef.value?.hide()
}

//测试dropdown
const menuOptions:MenuOptions[]=[
  { key: 1, label:h('b', 'this is bold') },
  { key: 2, label: 'item2', disabled: true },
  { key: 3, label: 'item3', divided: true },
  { key: 4, label: 'item4' }
]
const inlineConsole=(...args:any)=>{
  console.log(...args)
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
</style>
