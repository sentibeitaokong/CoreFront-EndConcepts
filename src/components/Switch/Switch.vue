<template>
  <div
      @click="switchValue"
      class="vk-switch"
      :class="{
      [`vk-switch--${size}`]: size,
      'is-disabled': disabled,
      'is-checked': checked,
    }"
  >
    <input
        class="vk-switch__input"
        type="checkbox"
        role="switch"
        ref="input"
        :name="name"
        :disabled="disabled"
        @keydown.enter="switchValue"
    />
    <div class="vk-switch__core">
      <div class="vk-switch__core-inner">
        <span class="vk-switch__core-inner-text" v-if="activeText||inactiveText">
          {{ checked ? activeText : inactiveText }}
        </span>
      </div>
      <div class="vk-switch__core-action"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {SwitchEmits, SwitchProps} from '@/components/Switch/types.ts'
import {ref, computed, onMounted, watch, useAttrs} from 'vue'

defineOptions({
  name: 'VkSwitch',
  // inheritAttrs: false,
})
// const attrs = useAttrs()
const emits = defineEmits<SwitchEmits>()
const {
  activeText,
  inactiveText,
  modelValue,
  disabled,
  activeValue = true,
  inactiveValue = false
} = defineProps<SwitchProps>()
const innerValue = ref(modelValue)
//判断是否选中
const checked = computed(() => innerValue.value === activeValue)
const input = ref<HTMLInputElement>()
const switchValue = () => {
  if (disabled) {
    return
  }
  const newValue = checked.value ? inactiveValue : activeValue
  innerValue.value = newValue
  emits("change", newValue)
  emits("update:modelValue", newValue)
}

onMounted(() => {
  input.value!.checked = checked.value
})

watch(checked, (val) => {
  input.value!.checked = val
})

watch(() => modelValue, (newVal) => {
  innerValue.value = newVal
})
</script>

<style scoped></style>
