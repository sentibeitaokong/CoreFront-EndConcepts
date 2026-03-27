<template>
  <div class="dropdownContainer">
    <DropDown
        :menu-options="menuOptions"
        placement="bottom"
        :trigger="clickTrigger"
    >
      <Button>click</Button>
    </DropDown>
    <DropDown
        :menu-options="menuOptions"
        placement="bottom"
        :trigger="hoverTrigger"
    >
      <Button>Hover</Button>
    </DropDown>
  </div>
</template>

<script lang="ts" setup>
import DropDown from '@/components/DropDown/DropDown.vue'
import Button from "@/components/Button";
const clickTrigger = ref('click');
const hoverTrigger = ref('hover');
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
.dropdownContainer {
  width: 200px;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>