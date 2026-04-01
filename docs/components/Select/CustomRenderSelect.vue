<script setup>
import { ref, h } from 'vue'
import Select from '@/components/Select/Select.vue'
const test = ref('')
const options = [
  { label: 'option1', value: '1' },
  { label: 'option2', value: '2' },
  { label: 'option3', value: '3' },
  { label: 'option4', value: '4' }
]
const customRender = (option) => {
  return h('div', { className: 'xyz' }, [h('b', option.label), h('span', option.value)])
}
</script>
<template>
  <Select
    v-model="test"
    placeholder="基础选择器，请选择"
    :options="options"
    :render-label="customRender"
  />
</template>
<style>
.vk-select__menu-item,
.xyz {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>
