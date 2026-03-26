import { isRef, onMounted, onUnmounted, type Ref, unref, watch } from 'vue'

export default function useEventListener(
  target:Ref<EventTarget|null>|EventTarget,
  event:string,
  handler:(e:Event)=>any
) {
  if(isRef(target)){
    watch(target,(newVal, oldVal) => {
      oldVal?.removeEventListener(event,handler)
      newVal?.addEventListener(event,handler)
    })
  }else{
    onMounted(()=>{
      target?.addEventListener(event,handler)
    })
  }
  onUnmounted(()=>{
    unref(target)?.removeEventListener(event,handler)
  })
}
