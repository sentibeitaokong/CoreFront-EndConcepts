<script setup>
import { ref } from 'vue'
import Select from '@/components/Select/Select.vue'
const test = ref('1')
const options = [
  { label: 'option1', value: '1' },
  { label: 'option2', value: '2' },
  { label: 'option3', value: '3' },
  { label: 'option4', value: '4' }
]

</script>
<template>
  <Select v-model="test" placeholder="基础选择器，请选择" :options="options" disabled />
</template>
