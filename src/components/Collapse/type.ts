import type {Ref,InjectionKey} from 'vue'
export type NameType=string|number     //折叠面板激活面板属性类型

//激活面板接口
export interface CollapseProps{
  modelValue:NameType[]
  accordion?:boolean
}

//激活面板子项接口
export interface CollapseItemProps{
  name:NameType
  title?:string
  disabled?:boolean
}

//折叠面板的属性
export interface CollapseContext{
  activeNames:Ref<NameType[]>
  handleItemClick:(name:NameType)=>void
}

//折叠面板的事件接口
export interface  CollapseEmits{
  (e:'update:modelValue',values:NameType[]):void
  (e:'change',values:NameType[]):void
}

//provide提供折叠面板公共属性
export const collapseContextKey: InjectionKey<CollapseContext> = Symbol('collapseContextKey')
