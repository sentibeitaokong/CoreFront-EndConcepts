<script setup>
import { ref } from 'vue'
const test = ref('1')
const options = [
  { label: 'option1', value: '1' },
  { label: 'option2', value: '2' },
  { label: 'option3', value: '3' },
  { label: 'option4', value: '4' }
]
</script>
<template>
  <vk-select v-model="test" placeholder="可清空选择器，请选择" :options="options" clearable />
</template>
