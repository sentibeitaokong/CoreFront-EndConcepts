import { VNode } from 'vue';
import { createMessageProps } from './types.ts';
export declare const createMessage: (props: createMessageProps) => {
    id: string;
    vnode: VNode<import('vue').RendererNode, import('vue').RendererElement, {
        [key: string]: any;
    }>;
    vm: import('vue').ComponentInternalInstance;
    props: {
        id: string;
        zIndex: number;
        onDestory: () => void;
        type?: "success" | "info" | "warning" | "danger" | undefined;
        duration?: number | undefined;
        message: string | VNode;
        showClose?: boolean | undefined;
        offset?: number | undefined;
        transitionName?: string | undefined;
    };
    destory: () => void;
};
export declare const getLastBottomOffset: (id: string) => any;
export declare const closeAll: () => void;
