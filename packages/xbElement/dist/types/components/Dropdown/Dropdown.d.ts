import { PropType } from 'vue';
import { Placement, UseFloatingOptions } from '@floating-ui/vue';
import { MenuOptions } from './types.ts';
declare const _default: import('vue').DefineComponent<import('vue').ExtractPropTypes<{
    placement: {
        type: PropType<Placement>;
        default: string;
    };
    trigger: {
        type: PropType<"hover" | "click">;
        default: string;
    };
    transition: {
        type: StringConstructor;
        default: string;
    };
    openDelay: {
        type: NumberConstructor;
        default: number;
    };
    closeDelay: {
        type: NumberConstructor;
        default: number;
    };
    popperOptions: {
        type: PropType<UseFloatingOptions>;
    };
    menuOptions: {
        type: PropType<MenuOptions[]>;
        required: true;
    };
    hideAfterClick: {
        type: BooleanConstructor;
        default: boolean;
    };
    manual: {
        type: BooleanConstructor;
    };
}>, () => import("vue/jsx-runtime").JSX.Element, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, ("select" | "visible-change")[], "select" | "visible-change", import('vue').PublicProps, Readonly<import('vue').ExtractPropTypes<{
    placement: {
        type: PropType<Placement>;
        default: string;
    };
    trigger: {
        type: PropType<"hover" | "click">;
        default: string;
    };
    transition: {
        type: StringConstructor;
        default: string;
    };
    openDelay: {
        type: NumberConstructor;
        default: number;
    };
    closeDelay: {
        type: NumberConstructor;
        default: number;
    };
    popperOptions: {
        type: PropType<UseFloatingOptions>;
    };
    menuOptions: {
        type: PropType<MenuOptions[]>;
        required: true;
    };
    hideAfterClick: {
        type: BooleanConstructor;
        default: boolean;
    };
    manual: {
        type: BooleanConstructor;
    };
}>> & Readonly<{
    onSelect?: ((...args: any[]) => any) | undefined;
    "onVisible-change"?: ((...args: any[]) => any) | undefined;
}>, {
    transition: string;
    hideAfterClick: boolean;
    trigger: "hover" | "click";
    placement: Placement;
    manual: boolean;
    openDelay: number;
    closeDelay: number;
}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
export default _default;
