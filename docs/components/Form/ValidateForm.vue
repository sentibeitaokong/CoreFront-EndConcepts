<script setup>
import { reactive, ref } from 'vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Form from '@/components/Form/Form.vue'
import FormItem from '@/components/Form/FormItem.vue'
import Input from '@/components/Input/Input.vue'
import Button from '@/components/Button/Button.vue'
import Switch from "@/components/Switch/Switch.vue";
import Select from "@/components/Select";
const formRef = ref()
const model = reactive({
  email: '',
  password: '',
  status:false,
})

const rules = {
  email: [{ type: 'string', required: true, trigger: 'blur' }],
  password: [{ type: 'string', required: true, trigger: 'blur'}],
}

const submit = async () => {
  try {
    await formRef.value.validate()
    console.log('passed!')
  } catch (e) {
    console.log('the error', e)
  }
}
const reset = () => {
  formRef.value.resetFields()
}
</script>

<template>
  <div>
    <Form ref="formRef" :model="model" :rules="rules">
      <FormItem label="the email" prop="email">
        <Input v-model="model.email" type="text"/>
      </FormItem>
      <FormItem label="the password" prop="password">
        <Input v-model="model.password" type="password" />
      </FormItem>
      <FormItem label="the status" prop="status">
        <Switch v-model="model.status"  type="status"/>
      </FormItem>
      <div :style="{ textAlign: 'center' }">
        <Button type="primary" @click.prevent="submit">Submit</Button>
        <Button @click.prevent="reset">Reset</Button>
      </div>
    </Form>
  </div>
</template>

<style></style>
