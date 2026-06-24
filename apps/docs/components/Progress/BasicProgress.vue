<template>
  <div class="progress-container">
    <vk-progress :strokeHeight="15" :percent="30" type="primary"></vk-progress>
    <vk-progress :strokeHeight="18" :percent="40" type="warning"></vk-progress>
    <vk-progress :strokeHeight="22" :percent="50" type="success"></vk-progress>
    <vk-progress :strokeHeight="24" :percent="60" type="danger"></vk-progress>
    <vk-progress :strokeHeight="26" :percent="70" type="info"></vk-progress>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.progress-container .vk-progress-bar{
  margin-bottom: 15px;
  max-width: 600px;
}
</style>