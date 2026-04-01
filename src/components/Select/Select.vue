<template>
  <div
    class="vk-select"
    :class="{ 'is-disabled': disabled }"
    @click="toggleDropdown"
    @mouseenter="states.mouseHover = true"
    @mouseleave="states.mouseHover = false"
  >
    <Tooltip
      placement="bottom-start"
      manual
      ref="tooltipRef"
      :popper-options="popperOptions"
      @click-outside="controlDropdown(false)"
    >
      <Input
        type="select"
        v-model="states.inputValue"
        :disabled="disabled"
        :placeholder="filteredPlaceholder"
        ref="inputRef"
        :readonly="!filterable || !isDropdownShow"
        @input="debounceOnFilter"
        @keydown="handleKeyDown"
      >
        <template #suffix>
          <Icon
            @click.stop="onClear"
            @mousedown.prevent="NOOP"
            icon="circle-xmark"
            class="vk-input__clear"
            v-if="showClearIcon"
          ></Icon>
          <Icon
            v-else
            icon="angle-down"
            class="header-angle"
            :class="{ 'is-active': isDropdownShow }"
          ></Icon>
        </template>
      </Input>
      <template #content>
        <div class="vk-select__loading" v-if="states.loading">
          <Icon icon="spinner" spin></Icon>
        </div>
        <div class="vk-select__noData" v-else-if="filterable && filterOptions.length === 0">
          no matching data
        </div>
        <ul class="vk-select__menu" v-else>
          <template v-for="(item, index) in filterOptions" :key="index">
            <li
              class="vk-select__menu-item"
              :class="{
                'is-disabled': item.disabled,
                'is-selected': states.selectedOption?.value === item.value,
                'is-highlightIndex': states.highlightIndex === index,
              }"
              :id="`select-item-${item.value}`"
              @click.stop="itemSelect(item)"
            >
              <RenderVnode :v-node="renderLabel ? renderLabel(item) : item.label"></RenderVnode>
            </li>
          </template>
        </ul>
      </template>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { size } from '@floating-ui/vue'
import type {
  SelectEmits,
  SelectProps,
  SelectOption,
  SelectStates,
} from '@/components/Select/types.ts'
import type { TooltipInstance } from '@/components/Tooltip/type.ts'
import type { InputInstance } from '@/components/Input/types.ts'
import { reactive, ref, watch } from 'vue'
import Tooltip from '../Tooltip/Tooltip.vue'
import Input from '../Input/Input.vue'
import Icon from '@/components/Icon'
import { computed } from 'vue'
import RenderVnode from '@/components/Common/RenderVnode.ts'
import { debounce, isFunction } from 'lodash-es'

defineOptions({
  name: 'VkSelect',
})

const {
  modelValue,
  placeholder = '',
  disabled,
  options = [],
  clearable = false,
  filterable,
  filterMethod,
  remote,
  remoteMethod,
} = defineProps<SelectProps>()
const emits = defineEmits<SelectEmits>()
const tooltipRef = ref<TooltipInstance>()
const inputRef = ref<InputInstance>()
const timeout = computed(() => (remote ? 300 : 0))
const findOption = (value: string) => {
  const option = options.find((item) => item.value === value)
  return option ? option : null
}
let  initialOption = findOption(modelValue)
watch(()=>modelValue,(newVal)=>{
    initialOption = findOption(newVal)
})
const isDropdownShow = ref(false)
const states = reactive<SelectStates>({
  inputValue: initialOption ? initialOption.label : '',
  selectedOption: initialOption,
  mouseHover: false,
  loading: false,
  highlightIndex: -1,
})
const popperOptions: any = {
  middleware: [
    size({
      apply({ rects, elements }) {
        Object.assign(elements.floating.style, {
          // rects.reference.width 就是你输入框的真实 DOM 宽度
          width: `${rects.reference.width}px`,
        })
      },
    }),
  ],
}
const showClearIcon = computed(() => {
  //hover上去 clearable为true
  //必须有选择项  Input值不能为空
  return clearable && states.mouseHover && states.selectedOption && states.inputValue.trim() !== ''
})
const onClear = () => {
  states.selectedOption = null
  states.inputValue = ''
  emits('clear')
  emits('change', '')
  emits('update:modelValue', '')
}
const NOOP = () => {}
const filterOptions = ref(options)
watch(
  () => options,
  (newVal) => {
    filterOptions.value = newVal
  },
)
const generateFilterOptions = async (searchVal: string) => {
  if (!filterable) {
    return
  }
  if (filterMethod && isFunction(filterMethod)) {
    filterOptions.value = filterMethod(searchVal)
  } else if (remote && remoteMethod && isFunction(remoteMethod)) {
    states.loading = true
    try {
      filterOptions.value = await remoteMethod(searchVal)
    } catch (e) {
      console.error(e)
      filterOptions.value = []
    } finally {
      states.loading = false
    }
  } else {
    filterOptions.value = options.filter((item) => item.label.includes(searchVal))
  }
  states.highlightIndex=-1
}
//默认选项的生成
const onFilter = () => {
  generateFilterOptions(states.inputValue)
}

const debounceOnFilter = debounce(() => {
  onFilter()
}, timeout.value)
const filteredPlaceholder = computed(() => {
  return filterable && states.selectedOption && isDropdownShow.value
    ? states.selectedOption.label
    : placeholder
})
const controlDropdown = (show: boolean) => {
  if (show) {
    //filter模式 之前选择过对应的值
    if (filterable && states.selectedOption) {
      states.inputValue = ''
    }
    tooltipRef.value!.show()
  } else {
    tooltipRef.value!.hide()
    //将filter模式之前选择的值回灌到输入框内
    if (filterable) {
      states.inputValue = states.selectedOption ? states.selectedOption.label : ''
    }
    states.highlightIndex=-1
  }
  isDropdownShow.value = show
  emits('visible-change', show)
}

const toggleDropdown = () => {
  if (disabled) {
    return
  }
  if (isDropdownShow.value) {
    controlDropdown(false)
  } else {
    controlDropdown(true)
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
      if(!isDropdownShow.value){
        toggleDropdown()
      }else{
        if(states.highlightIndex>-1&&filterOptions.value[states.highlightIndex]){
          itemSelect(filterOptions.value[states.highlightIndex]!)
        }else{
          controlDropdown(false)
        }
      }
      break
    case 'Escape':
      if (isDropdownShow.value) {
        controlDropdown(false)
      }
      break
    case 'ArrowUp':
      e.preventDefault()
      //state.highlightIndex=-1
      if (filterOptions.value.length > 0) {
        if (states.highlightIndex === -1||states.highlightIndex===0) {
          states.highlightIndex = filterOptions.value.length - 1
        } else {
          //move up
          states.highlightIndex--
        }
      }
      break
    case 'ArrowDown':
      e.preventDefault()
      //state.highlightIndex=-1
      if (filterOptions.value.length > 0) {
        if (states.highlightIndex === -1||states.highlightIndex===filterOptions.value.length-1) {
          states.highlightIndex = 0
        } else {
          //move down
          states.highlightIndex++
        }
      }
      break
    default:
      break
  }
}
const itemSelect = (e: SelectOption) => {
  if (e.disabled) {
    return
  }
  states.inputValue = e.label
  states.selectedOption = e
  emits('change', e.value)
  emits('update:modelValue', e.value)
  controlDropdown(false)
  inputRef.value!.ref.focus()
}
</script>

<style scoped></style>
