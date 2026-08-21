import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: Variant;
}

const byVariant: Record<Variant, string> = {
  primary: "bg-accent text-black hover:bg-[#d8b54e]",
  secondary: "bg-panel-elevated text-foreground hover:bg-[#2a2a2a]",
  ghost: "bg-transparent text-foreground hover:bg-[#222222]",
};

export function Button({ className, children, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        byVariant[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
