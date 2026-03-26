<template>
  <div class="vk-dropdown">
    <Tooltip
      :placement="placement"
      :trigger="trigger"
      :close-delay="closeDelay"
      :open-delay="openDelay"
      :popper-options="popperOptions"
      :manual="manual"
      ref="TooltipRef"
      @visible-change="visibleChange"
    >
      <slot> </slot>
      <template #content>
        <ul class="vk-dropdown__menu">
          <template v-for="item in menuOptions" :key="item.key">
            <li v-if="item.divided" role="separator" class="divided-placeholder"></li>
            <li
              @click="($event) => itemClick(item)"
              class="vk-dropdown__item"
              :class="{ 'is-disabled': item.disabled, 'is-divided': item.divided }"
              :id="`dropdown-item-${item.key}`"
            >
              <RenderVnode :v-node="item.label"></RenderVnode>
            </li>
          </template>
        </ul>
      </template>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import type {
  DropDownProps,
  DropDownInstance,
  DropDownEmits,
  MenuOptions,
} from '@/components/Dropdown/types.ts'
import Tooltip from '@/components/Tooltip/Tooltip.vue'
import { type Ref, ref } from 'vue'
import type { TooltipInstance } from '@/components/Tooltip/type.ts'
import RenderVnode from '@/components/Common/RenderVnode.ts'

defineOptions({
  name:'VkDropDown'
})
const { hideAfterClick=true } = defineProps<DropDownProps>()
const emits = defineEmits<DropDownEmits>()
const TooltipRef = ref() as Ref<TooltipInstance>
const visibleChange = (e: boolean) => {
  emits('visible-change', e)
}
const itemClick = (e: MenuOptions) => {
  if (e.disabled) {
    return
  }
  emits('select', e)
  if(hideAfterClick){
    TooltipRef.value?.hide()
  }
}

defineExpose<DropDownInstance>({
  show: ()=>TooltipRef.value?.show(),
  hide: ()=>TooltipRef.value?.hide(),
})
</script>

<style scoped></style>
