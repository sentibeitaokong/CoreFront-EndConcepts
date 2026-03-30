<template>
  <div
    class="vk-input"
    :class="{
      [`vk-input--${type}`]: type,
      [`vk-input--${size}`]: size,
      'is-disabled': disabled,
      'is-prepend': $slots.prepend,
      'is-append': $slots.append,
      'is-suffix': $slots.suffix,
      'is-prefix': $slots.prefix,
      'is-focus':isFocus
    }"
  >
    <!-- input   -->
    <template v-if="type !== 'textarea'">
      <!--    prepend slots    -->
      <div v-if="$slots.prepend" class="vk-input__prepend">
        <slot name="prepend"></slot>
      </div>
      <!--   input container     -->
      <div class="vk-input__wrapper">
        <!--    prefix slots    -->
        <div v-if="$slots.prefix" class="vk-input__prefix">
          <slot name="prefix"></slot>
        </div>
        <!--    input content    -->
        <input
          v-model="innerValue"
          v-bind="attrs"
          ref="inputRef"
          class="vk-input__inner"
          :disabled="disabled"
          :readonly="readonly"
          :autocomplete="autocomplete"
          :placeholder="placeholder"
          :autoFocus="autoFocus"
          :form="form"
          @input="handleInput"
          @change="handleChange"
          @focus="handleFocus"
          @blur="handleBlur"
          :type="showPassword?(passwordVisible?'text':'password'):type"
        />
        <!--    suffix slots    -->
        <div v-if="$slots.suffix || showClear ||showPassword" class="vk-input__suffix" @click="keepFocuse">
          <slot name="suffix"></slot>
          <Icon
            icon="circle-xmark"
            v-if="showClear"
            class="vk-input__clear"
            @click="clear"
            @mousedown.prevent="NOOP"
          ></Icon>
          <Icon
            icon="eye"
            v-if="showPasswordArea&&passwordVisible"
            class="vk-input__password"
            @click="togglePasswordVisible"
          ></Icon>
          <Icon
            icon="eye-slash"
            v-if="showPasswordArea&&!passwordVisible"
            class="vk-input__password"
            @click="togglePasswordVisible"
          ></Icon>
        </div>
      </div>
      <!--    append slots    -->
      <div v-if="$slots.append" class="vk-input__append">
        <slot name="append"></slot>
      </div>
    </template>
    <!-- textarea   -->
    <template v-else>
      <textarea
        class="vk-textarea__wrapper"
        v-bind="attrs"
        ref="inputRef"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        :autoFocus="autoFocus"
        :form="form"
        v-model="innerValue"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
      ></textarea>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { InputProps,InputEmits } from '@/components/Input/types.ts'
import { computed, nextTick, ref, useAttrs,watch } from 'vue';
import Icon from '@/components/Icon'
defineOptions({
  name: 'VkInput',
  inheritAttrs: false,
})
const { type = 'text',autocomplete='false',modelValue,clearable,disabled,showPassword,placeholder,autoFocus,readonly,form } = defineProps<InputProps>()
const emits=defineEmits<InputEmits>()
const innerValue=ref(modelValue)
const isFocus=ref(false)
const passwordVisible=ref(false)
const attrs=useAttrs()
const inputRef=ref<HTMLInputElement>()

const showClear=computed(()=>clearable&&!disabled&&!!innerValue.value&&isFocus.value)
const showPasswordArea=computed(()=>showPassword&&!disabled&&!!innerValue.value)
const togglePasswordVisible=()=>{
  passwordVisible.value=!passwordVisible.value
}
const keepFocuse=async ()=>{
  await nextTick()
  inputRef.value?.focus()
}
const handleInput=()=>{
  emits('update:modelValue',innerValue.value)
  emits('input',innerValue.value)
}
const handleChange=()=>{
  emits('change',innerValue.value)
}
const handleFocus=(event:FocusEvent)=>{
  isFocus.value=true
  emits('focus',event)
}
const handleBlur=(event:FocusEvent)=>{
  isFocus.value=false
  emits('blur',event)
}
const clear=()=>{
  innerValue.value=''
  emits('update:modelValue','')
  emits('input','')
  emits('change','')
  emits('clear')
}

//空函数不触发任何操作
const NOOP=()=>{

}
//当modelValue改变时，innerValue值也得变，需要用watch监听
watch(()=>modelValue,(newVal)=>{
  innerValue.value=newVal
})
defineExpose({
  ref:inputRef
})
</script>

<style scoped></style>
