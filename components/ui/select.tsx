"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode; onValueChange?: (value: string) => void }> = ({
  className,
  children,
  onValueChange,
  ...props
}) => (
  <select
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    onChange={(e) => onValueChange?.(e.target.value)}
    {...props}
  >
    {children}
  </select>
);

const SelectTrigger = Select;
const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = (props) => <option {...props} />;
const SelectValue: React.FC<{ placeholder?: string }> = () => null;

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };
