"use client";

import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-panel-elevated p-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border bg-black">
        <Image
          src="/kif-soderort-logo.png"
          alt="KIF Soderort logotyp"
          fill
          sizes="40px"
          className="object-contain"
          onError={(event) => {
            const target = event.currentTarget;
            target.style.display = "none";
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-accent">KIF</span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">KIF Soderort</p>
        <p className="text-2xl leading-none text-foreground">F16 Coach</p>
      </div>
    </div>
  );
}
