import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ className, children }: CardProps) {
  return <section className={cn("rounded-xl border border-border bg-panel p-4", className)}>{children}</section>;
}
