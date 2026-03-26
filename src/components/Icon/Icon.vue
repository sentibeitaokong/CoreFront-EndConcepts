<template>
  <i class="vk-icon" :class="{[`vk-icon--${type}`] : type }" v-bind="$attrs" :style="customColors">
    <font-awesome-icon v-bind="filterProps"></font-awesome-icon>
  </i>
</template>

<script setup lang="ts">
//筛选出选定对象属性以外的属性
import {omit} from 'lodash-es'
import type { IconProps } from './type'
import { computed } from 'vue'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
defineOptions({
  name:'VkIcon',
  inheritAttrs:false
})
//拿到所有props
const props = defineProps<IconProps>()
//筛选出color和type以外的所有props
const filterProps=computed(()=>{
  return omit(props,['color','type'])
})
//设置颜色
const customColors=computed(()=>{
  return props.color?{color:props.color}:{}
})


</script>

<style scoped>

</style>
