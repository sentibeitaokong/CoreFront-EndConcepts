<template>
  <div class="progress-container">
    <div>
      <Progress :strokeHeight="15" :percent="30" type="primary"></Progress>
    </div>
    <div>
      <Progress :strokeHeight="18" :percent="40" type="warning"></Progress>
    </div>
    <div>
      <Progress :strokeHeight="22" :percent="50" type="success"></Progress>
    </div>
    <div>
      <Progress :strokeHeight="24" :percent="60" type="danger"></Progress>
    </div>
    <div>
      <Progress :strokeHeight="26" :percent="70" type="info"></Progress>
    </div>
  </div>
</template>

<script setup lang="ts">
import Progress from "@/components/Progress/Progress.vue";
defineOptions({
  inheritAttrs:false
})
</script>

<style scoped>
.progress-container .vk-progress-bar{
  margin-bottom: 15px;
  max-width: 600px;
}
</style>