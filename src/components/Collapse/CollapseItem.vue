<template>
  <div
    class="vk-collapse-item"
    :class="{
      'is-disabled': disabled
    }"
  >
    <div class="vk-collapse-item__header"
         :class="{
            'is-active':isActive,
            'is-disabled':disabled
         }"
         :id="`vk-collapse-item-${name}`"
         @click="handleClick"
    >
      <slot name="title">{{title}}</slot>
      <Icon icon="angle-right" class="header-angle" />
    </div>
    <Transition name="slide" v-on="transitionEvents">
      <div
        class="vk-collapse-item__wrapper" v-show="isActive"
      >
        <div
          class="vk-collapse-item__content"
        >
          <slot></slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import Icon from '../Icon/Icon.vue'
import { computed} from 'vue'
import {inject} from 'vue'
import {collapseContextKey} from '@/components/Collapse/type.ts'
import type {CollapseItemProps} from '@/components/Collapse/type.ts'
defineOptions({
  name:'CollapseItem'
})
const props=defineProps<CollapseItemProps>()
const collapseItemContextKey=inject(collapseContextKey)

const isActive=computed(()=>collapseItemContextKey?.activeNames.value.includes(props.name))
const handleClick=()=>{
  if(props.disabled) return
  collapseItemContextKey?.handleItemClick(props.name)
}
const transitionEvents:Record<string, (el:HTMLElement)=>void> ={
  beforeEnter(el){
    el.style.height=`0px`
    el.style.overflow='hidden'
  },
  enter(el){
    el.style.height=`${el.scrollHeight}px`
  },
  afterEnter(el){
    el.style.height=''
    el.style.overflow=''
  },
  beforeLeave(el){
    el.style.height=`${el.scrollHeight}px`
    el.style.overflow='hidden'
  },
  leave(el){
    el.style.height=`0px`
  },
  afterLeave(el){
    el.style.height=''
    el.style.overflow=''
  }
}
</script>

<style scoped>

</style>
