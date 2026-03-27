<template>
    <div class="tooltipContainer">
      <Tooltip content="I am an clickTooltip" :trigger="clickTrigger" placement="top">
        <Button>click</Button>
      </Tooltip>
      <Tooltip content="I am an hoverTooltip" :trigger="hoverTrigger" placement="top">
        <Button>Hover</Button>
      </Tooltip>
    </div>
</template>

<script lang="ts" setup>
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import Button from "@/components/Button";
import {ref} from "vue";

const clickTrigger = ref('click');
const hoverTrigger = ref('hover');
</script>

<style scoped>
.tooltipContainer {
  width: 200px;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>