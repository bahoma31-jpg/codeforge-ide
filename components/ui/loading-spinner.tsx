import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export default function LoadingSpinner({
  size = 'md',
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={cn('animate-spin', sizeMap[size], className)} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
