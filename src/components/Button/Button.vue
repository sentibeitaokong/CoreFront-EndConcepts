<template>
  <button
    ref="buttonRef"
    class="vk-button"
    :class="{
      [`vk-button--${type}`]:type,
      [`vk-button--${size}`]:size,
      'is-circle':circle,
      'is-plain':plain,
      'is-round':round,
      'is-loading':loading,
      'is-disabled':disabled,
    }"
    :disabled="disabled||loading"
    :autofocus="autofocus"
    :nativeType="nativeType"
  >
    <Icon icon="spinner" spin v-if="loading" />
    <Icon :icon="icon" v-if="icon" />
    <span>
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import type {ButtonProps,ButtonInstance} from "@/components/Button/type.ts";
import {ref} from 'vue'
defineOptions({
  name:'VkButton'
})
withDefaults(defineProps<ButtonProps>(),{
  nativeType:'button'
})
const buttonRef = ref<ButtonInstance>()
defineExpose({
  ref:buttonRef
})
</script>

<style scoped>

</style>
