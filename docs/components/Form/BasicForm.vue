<script setup>
import { reactive, ref } from 'vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
const formRef = ref()
const model = reactive({
  email: '',
  password: '',
  status:false,
  activity:''
})
const options = [
  { label: '唱', value: '1' },
  { label: '跳', value: '2' },
  { label: 'Rap', value: '3' },
  { label: '打篮球', value: '4' }
]
const submit = async () => {
  console.log('submit')
}
const reset = () => {
  console.log('reset')
}
</script>

<template>
  <div>
    <vk-form ref="formRef" :model="model">
      <vk-form-item label="the email" prop="email">
        <vk-input v-model="model.email" type="text"/>
      </vk-form-item>
      <vk-form-item label="the password" prop="password">
        <vk-input v-model="model.password" type="password" />
      </vk-form-item>
      <vk-form-item label="the status" prop="status">
        <vk-switch v-model="model.status"  type="status"/>
      </vk-form-item>
      <vk-form-item label="the activity" prop="activity">
        <vk-select v-model="model.activity" placeholder="选择活动" :options="options" />
      </vk-form-item>
      <div :style="{ textAlign: 'center' }">
        <vk-button type="primary" @click.prevent="submit">Submit</vk-button>
        <vk-button @click.prevent="reset">Reset</vk-button>
      </div>
    </vk-form>
  </div>
</template>

<style></style>
