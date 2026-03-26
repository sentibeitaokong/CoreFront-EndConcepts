<template>
  <Transition
    :name="transitionName"
    @enter="updateHeight"
    @after-leave="destoryComponent"
  >
    <div
      v-show="visible"
      class="vk-message"
      :class="{
      [`vk-message--${type}`]:type,
      'is-close':showClose,
    }"
      :style="cssStyle"
      ref="messageRef"
      role="alert"
      @mouseenter="clearTimer"
      @mouseleave="startTimer"
    >
      <div class="vk-message__content">
        <slot>
          <RenderVnode :v-node="message" v-if="message"></RenderVnode>
        </slot>
      </div>
      <div class="vk-message__close" v-if="showClose">
        <Icon @click.stop="close" icon="xmark"></Icon>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { MessageProps } from '@/components/Message/types.ts'
import RenderVnode from '@/components/Common/RenderVnode.ts'
import Icon from '@/components/Icon'
import { onMounted,ref, computed } from 'vue'
import { getLastBottomOffset} from '@/components/Message/method.ts'
import useEventListener from '@/hooks/useEventListener.ts'

const { type='info',duration=3000,offset=30,transitionName='fade-up',onDestory,id,zIndex } = defineProps<MessageProps>()
const visible=ref(false)
const messageRef=ref<HTMLDivElement>()
//计算偏移高度
//这个div的高度
const height=ref(0)
//上一个实例底部的高度 第一个是0
const lastOffset=computed(()=>getLastBottomOffset(id))
//下一个实例的顶部的高度
const topOffset=computed(()=>offset+lastOffset.value)
//下一个实例的底部的高度
const bottomOffset=computed(()=>topOffset.value+height.value)
//创建实例的css样式
const cssStyle=computed(()=>({
  top:topOffset.value+'px',
  zIndex:zIndex
}))
let timer:any

function startTimer(){
  if(duration===0){
    return
  }
  timer=setTimeout(()=>{
    visible.value=false
  },duration)
}

function clearTimer(){
  clearTimeout(timer)
}

const close=()=>{
  visible.value=false
}
onMounted(async ()=>{
  visible.value=true
  startTimer()
})
function keydown(e:Event){
  const event=e as KeyboardEvent
  if(event.code==='Escape'){
    visible.value=false
  }
}
useEventListener(document,'keydown',keydown)
// watch(visible,(newVal)=>{
//   if(!newVal){
//     onDestory()
//   }
// })

function destoryComponent(){
  onDestory()
}
function updateHeight(){
  height.value=messageRef.value!.getBoundingClientRect().height
}

defineExpose({
  bottomOffset,
  visible
})
</script>

<style scoped>

</style>
