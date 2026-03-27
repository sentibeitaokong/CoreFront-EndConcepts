<template>
  <DropDown
      :menu-options="menuOptions"
      placement="bottom"
  >
    Dropdown List
  </DropDown>
</template>

<script lang="ts" setup>
import DropDown from "@/components/Dropdown/Dropdown.vue";
import type {MenuOptions} from '@/components/Dropdown/types.ts'
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