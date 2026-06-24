<template>
  <vk-tooltip content="I am an tooltip" manual ref="tooltipRef" placement="right">
    <vk-button @click="open">open</vk-button>
    <vk-button @click="close">close</vk-button>
  </vk-tooltip>
</template>

<script lang="ts" setup>
import type {TooltipInstance} from "xb-element/dist/types/components/Tooltip/type";
import {ref} from "vue";

const tooltipRef=ref<TooltipInstance>()
const open=()=>{
  tooltipRef.value?.show()
}

const close=()=>{
  tooltipRef.value?.hide()
}
</script>

<style>

</style>