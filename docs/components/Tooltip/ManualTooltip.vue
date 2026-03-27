<template>
  <Tooltip content="I am an tooltip" manual ref="tooltipRef" placement="right">
    <Button @click="open">open</Button>
    <Button @click="close">close</Button>
  </Tooltip>
</template>

<script lang="ts" setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";
import {TooltipInstance} from "@/components/Tooltip/type";
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