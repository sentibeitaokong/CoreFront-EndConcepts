<script setup>
import { ref } from 'vue'
const test = ref(false)
const test1 = ref(false)
</script>
<template>
  <vk-switch v-model="test"  />
  <vk-switch v-model="test1"  style="--vk-switch-on-color: #13ce66; --vk-switch-off-color: #ff4949;margin-left: 5px;"/>
</template>