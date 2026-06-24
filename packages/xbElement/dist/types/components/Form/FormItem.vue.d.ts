import { FormItemProps, FormItemInstance } from './types.ts';
declare var __VLS_1: {
    label: string;
}, __VLS_3: {
    validate: (trigger?: string) => Promise<true | void>;
};
type __VLS_Slots = {} & {
    label?: (props: typeof __VLS_1) => any;
} & {
    default?: (props: typeof __VLS_3) => any;
};
declare const __VLS_base: import('vue').DefineComponent<FormItemProps, FormItemInstance, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').PublicProps, Readonly<FormItemProps> & Readonly<{}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, false, {}, any>;
declare const __VLS_export: __VLS_WithSlots<typeof __VLS_base, __VLS_Slots>;
declare const _default: typeof __VLS_export;
export default _default;
type __VLS_WithSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
