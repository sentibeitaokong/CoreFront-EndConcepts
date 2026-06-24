import { computed, defineComponent,ref,Fragment} from 'vue'
import type {PropType} from 'vue'
import type {Placement,UseFloatingOptions} from '@floating-ui/vue'
import type {MenuOptions} from '@/components/Dropdown/types.ts'
import Tooltip from '../Tooltip/Tooltip.vue'
import type {TooltipInstance} from '@/components/Tooltip/type.ts'

export default defineComponent({
  name:'VkDropDown',
  props:{
    placement: {
      type: String as PropType<Placement>,
      default: 'bottom'
    },
    trigger: {
      type: String as PropType<'hover' | 'click'>,
      default: 'hover'
    },
    transition: {
      type: String,
      default: 'fade'
    },
    openDelay: {
      type: Number,
      default: 0
    },
    closeDelay: {
      type: Number,
      default: 0,
    },
    popperOptions: {
      type: Object as PropType<UseFloatingOptions>,
    },
    menuOptions: {
      type: Array as PropType<MenuOptions[]>,
      required: true
    },
    hideAfterClick: {
      type: Boolean,
      default: true
    },
    manual: {
      type: Boolean
    }
  },
  emits:['visible-change','select'],
  setup(props,{slots,expose,emit}){
    const TooltipRef=ref<TooltipInstance|undefined>()
    const visibleChange = (e: boolean) => {
      emit('visible-change', e)
    }
    const itemClick = (e: MenuOptions) => {
      if (e.disabled) {
        return
      }
      emit('select', e)
      if(props.hideAfterClick){
        TooltipRef.value?.hide()
      }
    }
    const options=computed(()=>{
      return props.menuOptions.map((item)=>{
        return (
          <Fragment key={item.key as any}>
            {item.divided ? <li role="separator" class="divided-placeholder"></li> : ''}
              <li
              onClick={()=> itemClick(item)}
              class={{ 'vk-dropdown__item':true,'is-disabled': item.disabled, 'is-divided': item.divided }}
              id={`dropdown-item-${item.key}`}
              >
                {item.label}
              </li>
          </Fragment>
        )
      })
    })
    expose({
      show: ()=>TooltipRef.value?.show(),
      hide: ()=>TooltipRef.value?.hide(),
    })
    return ()=>(
      <div class="vk-dropdown">
        <Tooltip
        placement={props.placement}
        trigger={props.trigger}
        closeDelay={props.closeDelay}
        open-delay={props.openDelay}
        popper-options={props.popperOptions}
        ref={TooltipRef}
        onVisible-change={visibleChange}
        >
          {{
            default:()=>slots.default&&slots.default(),
            content:()=>(
              <ul class="vk-dropdown__menu">
                {options.value}
              </ul>
            )
          }}
        </Tooltip>
      </div>
    )
  }
})
