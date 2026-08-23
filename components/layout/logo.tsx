import { ClubLogo } from "@/components/ui/club-logo";

export function Logo() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-panel-elevated p-3">
      <ClubLogo className="h-12 w-16" imageClassName="object-cover" fallbackText="KIF" />
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">KIF Söderort</p>
        <p className="text-2xl leading-none text-foreground">F16 Coach</p>
      </div>
    </div>
  );
}
