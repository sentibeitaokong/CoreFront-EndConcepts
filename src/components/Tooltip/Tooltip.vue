<template>
  <div class="vk-tooltip" v-on="outEvents" ref="popperOutContainer">
    <div class="vk-tooltip__trigger" ref="triggerNode" v-on="events">
      <slot></slot>
    </div>
    <Transition :name="transition">
      <div class="vk-tooltip__popper" ref="overlayNode" v-if="isOpen" :style="floatingStyles">
        <slot name="content">
          {{ content }}
        </slot>
        <div ref="arrowRef" id="arrow" :class="`arrow-${basePlacement}`" :style="arrowStyles"></div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>

import type { TooltipProps, TooltipEmits, TooltipInstance } from '@/components/Tooltip/type.ts'
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useFloating, autoUpdate, arrow, offset, flip, shift, size } from '@floating-ui/vue'
import useClickOutside from '@/hooks/useClickOutside.ts'
import { debounce } from 'lodash-es'
defineOptions({
  name:'VkTooltip'
})
const {
  placement = 'right',
  trigger = 'click',
  transition = 'fade',
  openDelay = 0,
  closeDelay = 0,
  manual,
  popperOptions,
} = defineProps<TooltipProps>()

const popperChangeOptions = computed(() => {
  const middleware=[
    offset(10),
    shift({ padding: 8 }),
    // flip({
    //   // 可选配置：翻转的备选顺序，默认会自动寻找可用空间
    //   fallbackPlacements: ['bottom', 'right', 'left']
    // }),
    arrow({ element: arrowRef, padding: 4 })
  ]
  let middlewareFilter
  //合并middleware
  if(popperOptions?.middleware){
    middlewareFilter = [
      ...middleware,
      ...(Array.isArray(popperOptions?.middleware) ? popperOptions.middleware : [])
    ]
  }else{
    middlewareFilter=[...middleware]
  }
  return {
    placement: placement,
    whileElementsMounted: autoUpdate,
    ...popperOptions,
    middleware: middlewareFilter,
  }
})

const emits = defineEmits<TooltipEmits>()
const isOpen = ref<boolean | null>(false)
//定位的元素
const triggerNode = ref<HTMLElement>()
//相对定位的元素
const overlayNode = ref<HTMLElement>()
//添加点击外层的元素
const popperOutContainer = ref<HTMLElement>()
//
const arrowRef = ref<HTMLElement>()
//添加动态事件
let events: Record<string, any> = reactive({})
let outEvents: Record<string, any> = reactive({})
// ✅ 3. 调用 useFloating，传递 computed 引用，并解构出 finalPlacement
const { floatingStyles, middlewareData, placement: finalPlacement } = useFloating(
  triggerNode,
  overlayNode,
  popperChangeOptions.value // 直接传递 computed 引用
)

// ✅ 4. 定义依赖 finalPlacement 的 computed 属性
const basePlacement = computed(() => {
  // 使用 finalPlacement.value 而不是 props 里的 placement
  return finalPlacement.value.split('-')[0];
});

// 计算箭头的动态样式
const arrowStyles = computed(() => {
  // 从 middlewareData 中提取 arrow 的计算结果
  const arrowData = middlewareData.value.arrow;
  if (!arrowData) return {};

  const { x, y } = arrowData;

  // 核心逻辑：获取当前 placement 的“反向边”（Static Side）
  // 如果 Tooltip 在上方 (top)，箭头应该在 Tooltip 的底部 (bottom) 探出来
  const staticSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[basePlacement.value];
  return {
    left: x != null ? `${x}px` : '',
    top: y != null ? `${y}px` : '',
    right: '',
    bottom: '',
    // 将箭头向外推出其自身大小的一半（假设箭头是 8x8，这里就是 -4px）
    // 这使得箭头呈现“一半在 Tooltip 内，一半在 Tooltip 外”的视觉效果
    [staticSide]: '-4px',
  };
});

const open = () => {
  isOpen.value = true
  emits('visible-change', true)
}
const close = () => {
  isOpen.value = false
  emits('visible-change', false)
}

const openDebounce = debounce(open, openDelay)
const closeDebounce = debounce(close, closeDelay)

const openFinal = () => {
  closeDebounce.cancel()
  openDebounce()
}
const closeFinal = () => {
  openDebounce.cancel()
  closeDebounce()
}

const togglePopper = () => {
  if (isOpen.value) {
    closeFinal()
  } else {
    openFinal()
  }
}

const attachEvents = () => {
  if (trigger === 'hover') {
    events['mouseenter'] = openFinal
    outEvents['mouseleave'] = closeFinal
  } else if(trigger==='click') {
    events['click']=togglePopper
  }
}

useClickOutside(popperOutContainer, () => {
  if (isOpen.value && trigger === 'click' && !manual) {
    closeFinal()
  }
  if (isOpen.value) {
    emits('click-outside', true)
  }
})

//监听trigger事件是否修改，修改了就重新添加
watch(
  () => trigger,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      events = {}
      outEvents = {}
      attachEvents()
    }
  },
)

if (!manual) {
  attachEvents()
}
watch(() => manual, (isManual) => {
  if (isManual) {
    events = {}
    outEvents = {}
  } else {
    attachEvents()
  }
})


onUnmounted(() => {
  isOpen.value = false
})

defineExpose<TooltipInstance>({
  show: openFinal,
  hide: closeFinal,
})
</script>

<style scoped></style>
