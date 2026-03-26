import type {VNode} from 'vue'
import type { TooltipProps } from '@/components/Tooltip/type.ts'


export interface DropDownProps extends TooltipProps{
  menuOptions:MenuOptions[];
  hideAfterClick?:boolean;
}

export interface MenuOptions{
  label:string|VNode;
  key:number|VNode|string;
  disabled?:boolean;
  divided?:boolean;
}

export interface DropDownEmits {
  (e:'visible-change',value:boolean):void
  (e:'select',value:MenuOptions):void
}

export interface DropDownInstance {
  show():void;
  hide():void;
}
