<template>
  <div class="tooltip-base-box">
    <div class="row center">
      <Tooltip
          class="box-item"
          content="top prompts info"
          placement="top"
      >
        <Button style="width: 100%;">top</Button>
      </Tooltip>
    </div>
    <div class="row">
      <Tooltip class="box-item"  placement="left">
        <template #content>
          Left
          <br />
          prompts info
        </template>
        <Button style="width: 100%;">left</Button>
      </Tooltip>
      <Tooltip class="box-item"  placement="right">
        <template #content>
          Right
          <br />
          prompts info
        </template>
        <Button style="width: 100%;">right</Button>
      </Tooltip>
    </div>
    <div class="row center">
      <Tooltip
          class="box-item"
          content="Bottom Center prompts info"
          placement="bottom"
      >
        <Button style="width: 100%;">bottom</Button>
      </Tooltip>
    </div>
  </div>
</template>
<script setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";
</script>

<style>
.tooltip-base-box {
  width: 600px;
}
.tooltip-base-box .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tooltip-base-box .center {
  justify-content: center;
}
.tooltip-base-box .box-item {
  width: 90px;
  margin-top: 10px;
}
</style>
