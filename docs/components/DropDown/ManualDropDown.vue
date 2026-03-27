<template>
  <Dropdown
      :menu-options="menuOptions"
      placement="bottom"
      ref="dropdownRef"
      manual
  >
    <Button @click="open">open</Button>
    <Button @click="close">close</Button>
  </Dropdown>
</template>

<script lang="ts" setup>
import Dropdown from "@/components/Dropdown/Dropdown.vue";
import type {MenuOptions} from '@/components/Dropdown/types.ts'
import Button from "@/components/Button";
import {h, ref} from "vue";
import {TooltipInstance} from "@/components/Tooltip/type";
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