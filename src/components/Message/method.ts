import { h,  render, shallowReactive, type VNode } from 'vue'
import type { createMessageProps, MessageContext } from '@/components/Message/types.ts'
import MessageConstructor from "./Message.vue"
import useZIndex from '@/hooks/useZIndex.ts'

let seed=1
const instances:MessageContext[]=shallowReactive([])
const {nextIndex} = useZIndex()
export const createMessage=(props:createMessageProps)=>{
  const id=`message_${seed++}`
  const container=document.createElement('div')
  const destory=()=>{
    //删除数组中的实例
    const idx=instances.findIndex(item=>item.id===id)
    if(idx===-1){
      return
    }
    instances.splice(idx,1)
    render(null,container)
  }
  //手动调用删除，其实就是手动的调用组件中的visible的值
  //通过改变exposed里面暴露的visbile的值，message组件监听visible的值然后直接销毁
  const manualDestory=()=>{
    const instance=instances.find(item=>item.id===id)
    if(instance){
      instance.vm.exposed!.visible.value=false
    }
  }
  const newProps={
    ...props,
    id,
    zIndex:nextIndex(),
    onDestory:destory
  }
  const vnode:VNode=h(MessageConstructor,newProps)
  render(vnode,container)
  //非空断言操作符
  document.body.appendChild(container.firstElementChild!)
  //vnode内部实例
  const vm=vnode.component!
  //创建instance 放入intaces数组中
  const instance={
    id,
    vnode,
    vm,
    props:newProps,
    destory:manualDestory,
  }
  instances.push(instance)
  return instance
}

// //获取instances数组最后一项
// export const getLastInstance=()=>{
//   return instances.slice(instances.length-1)
// }

//获取instances数组最后一项距离屏幕顶部的高度
export const getLastBottomOffset=(id:string)=>{
  const idx=instances.findIndex(item=>item.id===id)
  if(idx<=0){
    return 0
  }else{
    const prev=instances[idx-1]
    return prev!.vm.exposed!.bottomOffset.value
  }
}

export const closeAll = () => {
  instances.forEach(instance => {
    instance.destory()
  })
}
