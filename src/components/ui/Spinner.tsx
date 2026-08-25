import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-slate-500">
      <Loader2
        className={cn('animate-spin text-[#1E3A5F]', sizeStyles[size], className)}
      />
      {label && <p className="text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
};
