export interface ProgressProps {
  percent: number; // 0-100
  strokeHeight?: number;
  showText?: boolean;
  // styles?: React.CSSProperties;
  type?: 'primary'| 'success'| 'warning'| 'danger'| 'info'
}
