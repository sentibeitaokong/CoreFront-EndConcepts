import { InputProps } from './types.ts';
declare var __VLS_1: {}, __VLS_3: {}, __VLS_5: {}, __VLS_28: {};
type __VLS_Slots = {} & {
    prepend?: (props: typeof __VLS_1) => any;
} & {
    prefix?: (props: typeof __VLS_3) => any;
} & {
    suffix?: (props: typeof __VLS_5) => any;
} & {
    append?: (props: typeof __VLS_28) => any;
};
declare const __VLS_base: import('vue').DefineComponent<InputProps, {
    ref: import('vue').Ref<HTMLInputElement | undefined, HTMLInputElement | undefined>;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {} & {
    input: (value: string) => any;
    clear: () => any;
    "update:modelValue": (value: string) => any;
    change: (value: string) => any;
    blur: (value: FocusEvent) => any;
    focus: (value: FocusEvent) => any;
}, string, import('vue').PublicProps, Readonly<InputProps> & Readonly<{
    onInput?: ((value: string) => any) | undefined;
    onClear?: (() => any) | undefined;
    "onUpdate:modelValue"?: ((value: string) => any) | undefined;
    onChange?: ((value: string) => any) | undefined;
    onBlur?: ((value: FocusEvent) => any) | undefined;
    onFocus?: ((value: FocusEvent) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
