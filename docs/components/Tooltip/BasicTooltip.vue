<template>
  <div class="tooltip-base-box">
    <div class="row center">
      <vk-tooltip
          class="box-item"
          content="top prompts info"
          placement="top"
      >
        <vk-button style="width: 100%;">top</vk-button>
      </vk-tooltip>
    </div>
    <div class="row">
      <vk-tooltip class="box-item"  placement="left">
        <template #content>
          Left
          <br />
          prompts info
        </template>
        <vk-button style="width: 100%;">left</vk-button>
      </vk-tooltip>
      <vk-tooltip class="box-item"  placement="right">
        <template #content>
          Right
          <br />
          prompts info
        </template>
        <vk-button style="width: 100%;">right</vk-button>
      </vk-tooltip>
    </div>
    <div class="row center">
      <vk-tooltip
          class="box-item"
          content="Bottom Center prompts info"
          placement="bottom"
      >
        <vk-button style="width: 100%;">bottom</vk-button>
      </vk-tooltip>
    </div>
  </div>
</template>
<script setup>
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
