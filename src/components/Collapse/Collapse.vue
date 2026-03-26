<template>
  <div class="vk-collapse">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name:'Collapse'
})
import {collapseContextKey} from '@/components/Collapse/type.ts'
import { provide,watch,ref} from 'vue'
import type {CollapseProps,CollapseEmits,NameType} from '@/components/Collapse/type.ts'
const props = withDefaults(defineProps<CollapseProps>(),{
  modelValue:()=>['a']
})
const emit=defineEmits<CollapseEmits>()
const activeNames=ref<NameType[]>(props.modelValue)
watch(()=>props.modelValue,()=>{
  activeNames.value=props.modelValue
})
if(props.accordion&&activeNames.value.length>1){
  console.warn('accordion mode should only have one acitve item')
}
const handleItemClick=(item:NameType)=>{
  let  _activeNames=[...activeNames.value]
  if(props.accordion){
    _activeNames=[activeNames.value[0]==item?'':item]
    activeNames.value=_activeNames
  }else{
    const index=activeNames.value.indexOf(item)
    if(index>-1){
      _activeNames.splice(index,1)
    }else{
      _activeNames.push(item)
    }
    activeNames.value=_activeNames
  }
  emit('update:modelValue',_activeNames)
  emit('change',_activeNames)
}
provide(collapseContextKey,{
  activeNames,
  handleItemClick,
})
</script>

<style scoped></style>
