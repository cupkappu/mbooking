'use client';

interface ProgressBarProps {
  value: number;
  max?: number;
  status?: 'normal' | 'warning' | 'exceeded';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  status = 'normal',
  showLabel = false,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getStatusColor = () => {
    switch (status) {
      case 'exceeded':
        return 'bg-destructive';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-primary';
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return 'h-1';
      case 'md': return 'h-2';
      case 'lg': return 'h-3';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-secondary rounded-full overflow-hidden ${getHeight()}`}>
        <div
          className={`${getHeight()} ${getStatusColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs mt-1">
          <span>{percentage.toFixed(1)}%</span>
          <span className="text-muted-foreground">
            {value} / {max}
          </span>
        </div>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  status?: 'normal' | 'warning' | 'exceeded';
  showLabel?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  status = 'normal',
  showLabel = true,
  className = '',
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getStatusColor = () => {
    switch (status) {
      case 'exceeded':
        return 'stroke-destructive';
      case 'warning':
        return 'stroke-yellow-500';
      default:
        return 'stroke-primary';
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getStatusColor()} transition-all duration-300`}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold">{percentage.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
