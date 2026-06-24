<template>
    <div class="tooltipContainer">
      <vk-tooltip content="I am an clickvk-tooltip" :trigger="clickTrigger" placement="top">
        <vk-button>click</vk-button>
      </vk-tooltip>
      <vk-tooltip content="I am an hovervk-tooltip" :trigger="hoverTrigger" placement="top">
        <vk-button>Hover</vk-button>
      </vk-tooltip>
    </div>
</template>

<script lang="ts" setup>
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