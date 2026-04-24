import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "coral" | "mint";
type Size = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-clinic-500 text-white hover:bg-clinic-600 active:bg-clinic-700 shadow-soft",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 shadow-card",
  ghost: "bg-transparent text-ink-800 hover:bg-ink-100",
  coral: "bg-coral-500 text-white hover:bg-coral-700 shadow-soft",
  mint: "bg-mint-500 text-white hover:bg-mint-700 shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-4 text-[15px] rounded-2xl",
  lg: "h-14 px-6 text-base rounded-2xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition",
        "disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
