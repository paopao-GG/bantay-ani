import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm",
      "placeholder:text-muted focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-brand/40",
      className,
    )}
    {...rest}
  />
));
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...rest }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-muted uppercase tracking-wider",
      className,
    )}
    {...rest}
  />
));
Label.displayName = "Label";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...rest }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-9 rounded-lg border border-border bg-surface px-3 text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
      className,
    )}
    {...rest}
  >
    {children}
  </select>
));
Select.displayName = "Select";
