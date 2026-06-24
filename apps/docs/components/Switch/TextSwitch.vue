<script setup>
import { ref } from 'vue'
const test = ref(false)
</script>
<template>
  <vk-switch v-model="test" activeText="ON" inactiveText="OFF"/>
</template>