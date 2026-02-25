'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative inline-flex">{children}</div>
);

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, ...props }, ref) => (
  <button ref={ref} className={cn('inline-flex', className)} {...props} />
));
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
