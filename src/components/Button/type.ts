export type ButtonType='primary'| 'success'| 'warning'| 'danger'| 'info'  //按钮类型
export type ButtonSize='large'| 'small'| 'mini'              //按钮大小
export type NativeType='button'| 'submit'| 'reset'           //按钮功能

export  interface ButtonProps{
  type?:ButtonType                           //类型
  plain?:boolean                             //是否为朴素按钮
  size?:ButtonSize                           //大小
  round?:boolean                             //圆角
  circle?:boolean                            //圆形
  disabled?:boolean                          //禁用
  icon?:string                              //图标
  loading?:boolean                           //过渡
  nativeType?:NativeType                     //原生type功能
  autofocus?:boolean                         //自动对焦
}

//按钮本身
export interface ButtonInstance{
  ref:HTMLInputElement
}

//按钮事件
export interface ButtonEmits{
  (e:MouseEvent):void
}
