import { DropDownProps, DropDownInstance, MenuOptions } from './types.ts';
declare var __VLS_11: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_11) => any;
};
declare const __VLS_base: import('vue').DefineComponent<DropDownProps, DropDownInstance, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {} & {
    select: (value: MenuOptions) => any;
    "visible-change": (value: boolean) => any;
}, string, import('vue').PublicProps, Readonly<DropDownProps> & Readonly<{
    onSelect?: ((value: MenuOptions) => any) | undefined;
    "onVisible-change"?: ((value: boolean) => any) | undefined;
}>, {
    hideAfterClick: boolean;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
