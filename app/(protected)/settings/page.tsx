import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { clearTeamDataAction } from "./actions";

export default async function SettingsPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att använda inställningar." />;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Inställningar</h2>
        <p className="mt-1 text-sm text-muted">
          Här kan du hantera laget och rensa bort seedad testdata innan ni går live.
        </p>
      </Card>

      <Card>
        <h3 className="text-xl text-foreground">Rensa lagdata</h3>
        <p className="mt-2 text-sm text-muted">
          Tar bort spelare, träningar, matcher, övningar, träningsplaner och taktiktavlor för aktuellt lag.
          Teamet och coach-kopplingar behålls.
        </p>
        <form action={clearTeamDataAction} className="mt-4">
          <Button type="submit" variant="secondary" className="text-red-200 hover:bg-[#3a1f1f]">
            Rensa all lagdata
          </Button>
        </form>
      </Card>
    </div>
  );
}
