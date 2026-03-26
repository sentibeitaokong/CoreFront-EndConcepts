import { computed, ref } from 'vue'

const zIndex = ref(0)
const useZIndex = (initialValue=2000) => {
  const initialZIndex=ref(initialValue)
  const currentIndex = computed(() => zIndex.value + initialZIndex.value)
  const nextIndex = ()=>{
    zIndex.value++
    return currentIndex.value
  }
  return {
    currentIndex,
    nextIndex,
    initialZIndex
  }
}

export default useZIndex
