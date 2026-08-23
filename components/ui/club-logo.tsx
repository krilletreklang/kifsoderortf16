"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface ClubLogoProps {
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  fallbackText?: string;
}

export function ClubLogo({
  className,
  imageClassName,
  fallbackClassName,
  fallbackText = "KIF",
}: ClubLogoProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-black", className)}>
      {!hasError ? (
        <Image
          src="/kif-soderort-logo.png"
          alt="KIF Söderort logotyp"
          fill
          sizes="(max-width: 768px) 120px, 180px"
          className={cn("object-contain", imageClassName)}
          onError={() => setHasError(true)}
          priority
        />
      ) : null}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center text-xs font-semibold text-accent",
          hasError ? "opacity-100" : "opacity-0",
          fallbackClassName,
        )}
      >
        {fallbackText}
      </span>
    </div>
  );
}
