import type { Placement, UseFloatingOptions } from '@floating-ui/vue'

export interface TooltipProps {
    content?: string;
    trigger?: 'hover'|'click';
    placement?:Placement;
    manual?: boolean;
    popperOptions?:UseFloatingOptions|undefined;
    transition?:string;
    openDelay?:number;
    closeDelay?:number;
}

export interface TooltipEmits {
  (e:'visible-change',value:boolean):void
  (e: 'click-outside', value: boolean) : void;
}

export interface TooltipInstance {
  show():void;
  hide():void;
}
