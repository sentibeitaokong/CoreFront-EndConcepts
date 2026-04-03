<template>
  <form class="vk-form">
    <slot></slot>
  </form>
</template>

<script setup lang="ts">
import type {
  FormContext,
  FormInstance,
  FormItemContext,
  FormProps,
  FormValueFailure,
} from '@/components/Form/types.ts'
import { formContextKey } from '@/components/Form/types.ts'
import { provide } from 'vue'
import type { ValidateFieldsError } from 'async-validator'

defineOptions({
  name: 'VkForm',
})
const { model, rules } = defineProps<FormProps>()
const fields: FormItemContext[] = []
const addField: FormContext['addField'] = (field) => {
  fields.push(field)
}
const removeField: FormContext['removeField'] = (field) => {
  if (field.prop) {
    fields.splice(fields.indexOf(field), 1)
  }
}
provide(formContextKey, { model, rules, addField, removeField })

const validate = async () => {
  let validationErrors: ValidateFieldsError = {}
  for (const field of fields) {
    try {
      await field.validate('')
    } catch (e) {
      const error = e as FormValueFailure
      validationErrors = {
        ...validationErrors,
        ...error.fields,
      }
    }
  }
  if (Object.keys(validationErrors).length === 0) {
    return true
  }
  return Promise.reject(validationErrors)
}
const resetFields = (keys: string[]=[]) => {
  const filterArr= keys.length > 0 ? fields.filter(field => keys.includes(field.prop)) : fields
  filterArr.forEach(field => field.resetField())
}

const clearValidate = (keys: string[]=[]) => {
  const filterArr= keys.length > 0 ? fields.filter(field => keys.includes(field.prop)) : fields
  filterArr.forEach(field => field.clearValidate())
}
defineExpose<FormInstance>({
  validate,
  clearValidate,
  resetFields
})
</script>

<style scoped></style>
