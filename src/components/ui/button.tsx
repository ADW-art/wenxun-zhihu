import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:text-text-disabled disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-action-primary text-text-inverse hover:bg-action-primary-hover active:bg-action-primary-active",
        secondary:
          "border border-border-default bg-surface-panel text-text-primary hover:bg-surface-subtle",
        ghost: "text-text-primary hover:bg-surface-subtle",
        danger: "bg-action-danger text-text-inverse hover:bg-action-danger-hover",
        accent: "bg-action-warning text-text-inverse hover:bg-action-warning-hover",
      },
      size: {
        default: "h-11",
        sm: "h-9 min-h-9 px-3 text-xs",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
