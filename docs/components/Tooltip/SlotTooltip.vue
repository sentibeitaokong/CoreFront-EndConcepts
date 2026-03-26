<template>
  <div class="tooltip-base-box">
    <Tooltip class="box-item"  placement="left">
      <template #content>
        Left
        <br />
        prompts info
      </template>
      <Button style="width: 100%;">left</Button>
    </Tooltip>
  </div>
</template>
<script setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";
</script>

<style>

</style>
