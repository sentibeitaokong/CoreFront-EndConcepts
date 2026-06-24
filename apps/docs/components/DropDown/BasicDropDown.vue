<template>
  <vk-drop-down
      :menu-options="menuOptions"
      placement="bottom"
  >
    Dropdown List
  </vk-drop-down>
</template>

<script lang="ts" setup>
import type {MenuOptions} from 'xb-element/dist/types/components/Dropdown/types'
import {h, ref} from "vue";
const menuOptions:MenuOptions[]=[
  { key: 1, label:h('b', 'this is bold') },
  { key: 2, label: 'item2', disabled: true },
  { key: 3, label: 'item3', divided: true },
  { key: 4, label: 'item4' }
]
</script>

<style scoped>

</style>