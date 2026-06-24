import { TooltipProps, TooltipInstance } from './type.ts';
declare var __VLS_1: {}, __VLS_9: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_1) => any;
} & {
    content?: (props: typeof __VLS_9) => any;
};
declare const __VLS_base: import('vue').DefineComponent<TooltipProps, TooltipInstance, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {} & {
    "visible-change": (value: boolean) => any;
    "click-outside": (value: boolean) => any;
}, string, import('vue').PublicProps, Readonly<TooltipProps> & Readonly<{
    "onVisible-change"?: ((value: boolean) => any) | undefined;
    "onClick-outside"?: ((value: boolean) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
