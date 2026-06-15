<template>
  <div
    class="vk-form-item"
    :class="{
      'is-error': validateStatus.state === 'error',
      'is-success': validateStatus.state === 'success',
      'is-loading': validateStatus.loading,
      'is-required': isRequired,
    }"
  >
    <label class="vk-form-item__label">
      <slot name="label" :label="label">{{ label }}</slot>
    </label>
    <div class="vk-form-item__content">
      <slot :validate="validate"></slot>
      <div class="vk-form-item__error-msg" v-if="validateStatus.state === 'error'">
        {{ validateStatus.errorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  FormItemProps,
  FormValueFailure,
  FormItemContext,
  ValidateStatusProp,
  FormItemInstance,
} from '@/components/Form/types.ts'
import { formContextKey, formItemContextKey } from '@/components/Form/types.ts'
import Schema from 'async-validator'
import { computed, inject, provide, reactive, onMounted, onUnmounted } from 'vue'
import { isNil } from 'lodash-es'

defineOptions({
  name: 'VkFormItem',
})
let initialValue: any = null
const { label, prop } = defineProps<FormItemProps>()
const formContext = inject(formContextKey)
const validateStatus: ValidateStatusProp = reactive({
  state: 'init',
  errorMsg: '',
  loading: false,
})
//取出每个Input框的值
const innerValue = computed(() => {
  const model = formContext?.model
  if (model && prop && !isNil(model[prop])) {
    return model[prop]
  } else {
    return null
  }
})

//取出每个input框的rules
const itemRules = computed(() => {
  const rules = formContext?.rules
  if (rules && prop && !isNil(rules[prop])) {
    return rules[prop]
  } else {
    return []
  }
})
const getTriggeredRules = (trigger?: string) => {
  const rules = itemRules.value
  if (rules) {
    return rules.filter((rule) => {
      if (!rule.trigger || !trigger) {
        return true
      }
      return rule.trigger && rule.trigger === trigger
    })
  } else {
    return []
  }
}
const isRequired = computed(() => {
  return itemRules.value.some((rule) => rule.required)
})
const validate = async (trigger?: string) => {
  const modelName = prop
  const triggerRules = getTriggeredRules(trigger)
  if (triggerRules.length === 0) {
    return true
  }
  if (modelName) {
    const validator = new Schema({
      [modelName]: triggerRules,
    })
    validateStatus.loading = true
    return validator
      .validate({ [modelName]: innerValue.value })
      .then((res) => {
        validateStatus.state = 'success'
        console.log(res)
      })
      .catch((error: FormValueFailure) => {
        const { errors } = error
        validateStatus.state = 'error'
        validateStatus.errorMsg = errors && errors.length > 0 ? errors[0]?.message || '' : ''
        return Promise.reject(error)
      })
      .finally(() => {
        validateStatus.loading = false
      })
  }
}
const clearValidate = () => {
  validateStatus.loading = false
  validateStatus.errorMsg = ''
  validateStatus.state = 'init'
}
const resetField = () => {
  clearValidate()
  const model = formContext?.model
  if (model && prop && !isNil(model[prop])) {
    model[prop] = initialValue
  }
}
const context: FormItemContext = {
  prop: prop || '',
  validate,
  resetField,
  clearValidate,
}
provide(formItemContextKey, context)
onMounted(() => {
  if (prop) {
    formContext?.addField(context)
    initialValue = innerValue.value
  }
})
onUnmounted(() => {
  formContext?.removeField(context)
})
defineExpose<FormItemInstance>({
  validateStatus,
  validate,
  resetField,
  clearValidate,
})
</script>

<style scoped></style>
