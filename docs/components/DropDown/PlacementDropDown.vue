<template>
  <div class="dropdown-base-box">
    <div class="row center">
      <DropDown
          class="box-item"
          :menu-options="menuOptions"
          placement="top"
      >
        <Button style="width: 100%;">top</Button>
      </DropDown>
    </div>
    <div class="row">
      <DropDown class="box-item"  :menu-options="menuOptions" placement="left">
        <Button style="width: 100%;">left</Button>
      </DropDown>
      <DropDown class="box-item"  :menu-options="menuOptions"  placement="right">
        <Button style="width: 100%;">right</Button>
      </DropDown>
    </div>
    <div class="row center">
      <DropDown
          class="box-item"
          :menu-options="menuOptions"
          placement="bottom"
      >
        <Button style="width: 100%;">bottom</Button>
      </DropDown>
    </div>
  </div>
</template>
<script setup lang="ts">
import Dropdown from "@/components/Dropdown/Dropdown";
import Button from "@/components/Button"
import type {MenuOptions} from "@/components/Dropdown/types";
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
