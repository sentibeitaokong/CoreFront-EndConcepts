<template>
  <vk-drop-down
      :menu-options="menuOptions"
      placement="bottom"
      ref="dropdownRef"
      manual
  >
    <vk-button @click="open">open</vk-button>
    <vk-button @click="close">close</vk-button>
  </vk-drop-down>
</template>

<script lang="ts" setup>
import type {MenuOptions} from 'xb-element/dist/types/components/Dropdown/types'
import {h, ref} from "vue";
import type {TooltipInstance} from "xb-element/dist/types/components/Tooltip/type";
const dropdownRef=ref<TooltipInstance>()
const menuOptions:MenuOptions[]=[
  { key: 1, label:h('b', 'this is bold') },
  { key: 2, label: 'item2', disabled: true },
  { key: 3, label: 'item3', divided: true },
  { key: 4, label: 'item4' }
]

const open=()=>{
  dropdownRef.value?.show()
}

const close=()=>{
  dropdownRef.value?.hide()
}
</script>

<style scoped>

</style>