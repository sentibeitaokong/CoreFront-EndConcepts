import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
export type ButtonType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type ButtonSize = 'large' | 'small' | 'mini';
export type NativeType = 'button' | 'submit' | 'reset';
export interface ButtonProps {
    type?: ButtonType;
    plain?: boolean;
    size?: ButtonSize;
    round?: boolean;
    circle?: boolean;
    disabled?: boolean;
    icon?: object | Array<string> | string | IconDefinition;
    loading?: boolean;
    nativeType?: NativeType;
    autofocus?: boolean;
}
export interface ButtonInstance {
    ref: HTMLInputElement;
}
export interface ButtonEmits {
    (e: MouseEvent): void;
}
