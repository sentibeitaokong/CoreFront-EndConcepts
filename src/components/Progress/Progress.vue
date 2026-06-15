<template>
  <div class="vk-progress-bar">
    <div class="vk-progress-bar-outer"
         :style="{'height':strokeHeight+'px' }">
      <div
        class="vk-progress-bar-inner"
        :class="{
          [`vk-color-${type}`]: type,
        }"
        :style="{'width': percent+'%'}">
        <span class="vk-inner-text" v-if="showText">{{percent}}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name:'VkProgress'
})
import type {ProgressProps} from '@/components/Progress/type.ts'

const {strokeHeight=15,percent,type='info',showText=false}=defineProps<ProgressProps>()
</script>

<style scoped>

</style>
