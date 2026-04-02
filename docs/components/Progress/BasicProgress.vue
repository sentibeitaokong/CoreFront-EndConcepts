<template>
  <div class="progress-container">
    <Progress :strokeHeight="15" :percent="30" type="primary"></Progress>
    <Progress :strokeHeight="18" :percent="40" type="warning"></Progress>
    <Progress :strokeHeight="22" :percent="50" type="success"></Progress>
    <Progress :strokeHeight="24" :percent="60" type="danger"></Progress>
    <Progress :strokeHeight="26" :percent="70" type="info"></Progress>
  </div>
</template>

<script setup lang="ts">
import Progress from "@/components/Progress/Progress.vue";
</script>

<style scoped>
.progress-container .vk-progress-bar{
  margin-bottom: 15px;
  max-width: 600px;
}
</style>