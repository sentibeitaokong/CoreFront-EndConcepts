export interface ProgressProps {
    percent: number;
    strokeHeight?: number;
    showText?: boolean;
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
