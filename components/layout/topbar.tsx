import { LogOut } from "lucide-react";
import { ClubLogo } from "@/components/ui/club-logo";
import { Button } from "@/components/ui/button";

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
          <ClubLogo className="h-12 w-14 shrink-0" imageClassName="object-cover" fallbackText="KIF" />
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{subtitle}</p>
            <h1 className="text-3xl leading-none text-foreground">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-muted sm:block">{userEmail}</p>
          <form action={onLogout}>
            <Button type="submit" variant="secondary" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logga ut
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
