import { LogOut } from "lucide-react";
import { ClubLogo } from "@/components/ui/club-logo";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

interface TopbarProps {
  title: string;
  subtitle: string;
  userEmail: string;
  onLogout: () => Promise<void>;
}

export function Topbar({ title, subtitle, userEmail, onLogout }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ClubLogo className="h-10 w-11 shrink-0 md:h-12 md:w-14" imageClassName="object-cover" fallbackText="KIF" />
          <div className="min-w-0">
            <p className="hidden truncate text-xs uppercase tracking-wide text-muted sm:block">{subtitle}</p>
            <h1 className="truncate text-xl leading-none text-foreground md:text-3xl">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{userEmail}</p>
          <form action={onLogout}>
            <FormSubmitButton pendingText="Loggar ut..." variant="secondary" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </FormSubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}
