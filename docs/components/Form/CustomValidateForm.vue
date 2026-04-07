<script setup>
import { reactive, ref } from 'vue'
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
const formRef = ref()
const model = reactive({
  email: '',
  password: '',
  confirmPwd: '',
  status:false,
})


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

const checkPassword = (rule,value,callback) => {
  if (!value) {
    return callback(new Error('Please input the age'))
  }else{
    if(model.password!==value){
      return callback('密码输入不一致')
    }else{
      return callback()
    }
  }
}
const rules = {
  email: [{ type: 'string', required: true, trigger: 'blur' }],
  password: [{ type: 'string', required: true, trigger: 'blur'}],
  confirmPwd: [{ type: 'string', required: true, trigger: 'blur'}, {
    validator: checkPassword,
    trigger: 'blur',
    message: '两个密码必须相同'
  }],
}
</script>

<template>
  <div>
    <vk-form ref="formRef" :model="model" :rules="rules">
      <vk-form-item label="the email" prop="email">
        <vk-input v-model="model.email" type="text"/>
      </vk-form-item>
      <vk-form-item label="the password" prop="password">
        <vk-input v-model="model.password" type="password" />
      </vk-form-item>
      <vk-form-item label="the confirmPwd" prop="confirmPwd">
        <vk-input v-model="model.confirmPwd" type="password" />
      </vk-form-item>
      <vk-form-item label="the status" prop="status">
        <vk-switch v-model="model.status"  type="status"/>
      </vk-form-item>
      <div :style="{ textAlign: 'center' }">
        <vk-button type="primary" @click.prevent="submit">Submit</vk-button>
        <vk-button @click.prevent="reset">Reset</vk-button>
      </div>
    </vk-form>
  </div>
</template>

<style></style>
