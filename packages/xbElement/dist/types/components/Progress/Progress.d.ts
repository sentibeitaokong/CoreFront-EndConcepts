import { FunctionalComponent } from 'vue';
export interface ProgressProps {
    percent: number;
    strokeHeight?: number;
    showText?: boolean;
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
declare const Progress: FunctionalComponent<ProgressProps>;
export default Progress;
