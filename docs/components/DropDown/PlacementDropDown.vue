<template>
  <div class="dropdown-base-box">
    <div class="row center">
      <vk-drop-down
          class="box-item"
          :menu-options="menuOptions"
          placement="top"
      >
        <vk-button style="width: 100%;">top</vk-button>
      </vk-drop-down>
    </div>
    <div class="row">
      <vk-drop-down class="box-item"  :menu-options="menuOptions" placement="left">
        <vk-button style="width: 100%;">left</vk-button>
      </vk-drop-down>
      <vk-drop-down class="box-item"  :menu-options="menuOptions"  placement="right">
        <vk-button style="width: 100%;">right</vk-button>
      </vk-drop-down>
    </div>
    <div class="row center">
      <vk-drop-down
          class="box-item"
          :menu-options="menuOptions"
          placement="bottom"
      >
        <vk-button style="width: 100%;">bottom</vk-button>
      </vk-drop-down>
    </div>
  </div>
</template>
<script setup lang="ts">
import type {MenuOptions} from 'xb-element/dist/types/components/Dropdown/types'
import {h, ref} from "vue";

const menuOptions:MenuOptions[]=[
  { key: 1, label:h('b', 'this is bold') },
  { key: 2, label: 'item2', disabled: true },
  { key: 3, label: 'item3', divided: true },
  { key: 4, label: 'item4' }
]
</script>

<style>
.dropdown-base-box {
  width: 600px;
}
.dropdown-base-box .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dropdown-base-box .center {
  justify-content: center;
}
.dropdown-base-box .box-item {
  width: 90px;
  margin-top: 10px;
}
</style>
