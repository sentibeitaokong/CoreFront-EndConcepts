<template>
  <div class="dropdownContainer">
    <vk-drop-down
        :menu-options="menuOptions"
        placement="bottom"
        :open-delay="500"
        :close-delay="200"
    >
      <vk-button>click</vk-button>
    </vk-drop-down>
  </div>
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
.dropdownContainer {
  width: 200px;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>