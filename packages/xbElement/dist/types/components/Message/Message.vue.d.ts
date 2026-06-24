import { MessageProps } from './types.ts';
declare var __VLS_9: {};
type __VLS_Slots = {} & {
    default?: (props: typeof __VLS_9) => any;
};
declare const __VLS_base: import('vue').DefineComponent<MessageProps, {
    bottomOffset: import('vue').ComputedRef<any>;
    visible: import('vue').Ref<boolean, boolean>;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<MessageProps> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
