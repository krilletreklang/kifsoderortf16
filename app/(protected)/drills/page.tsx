import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";
import { createDrillAction, deleteDrillAction } from "./actions";

export default async function DrillsPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera övningar." />;
  }

  const supabase = await createClient();
  const { data: drills } = await supabase
    .from("drills")
    .select("id, title, category, duration, players_min, players_max, equipment")
    .eq("team_id", membership.team_id)
    .order("title", { ascending: true });

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Ny övning</h2>
        <p className="mt-1 text-sm text-muted">Bygg upp ert övningsbibliotek med rätt nivå och material.</p>
        <form action={createDrillAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <input name="title" required placeholder="Titel" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-2" />
          <input name="category" required placeholder="Kategori" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="duration" type="number" min={1} max={120} placeholder="Minuter" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="playersMin" type="number" min={1} max={30} placeholder="Min spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="playersMax" type="number" min={1} max={30} placeholder="Max spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="equipment" placeholder="Material" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-5" />
          <Button type="submit">Spara övning</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-foreground">Övningsbibliotek</h2>
          <span className="text-sm text-muted">{drills?.length ?? 0} övningar</span>
        </div>
        {!drills || drills.length === 0 ? (
          <p className="text-sm text-muted">Inga övningar skapade ännu.</p>
        ) : (
          <ul className="space-y-2">
            {drills.map((drill) => (
              <li key={drill.id} className="rounded-lg border border-border bg-panel-elevated px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{drill.title}</p>
                    <p className="text-xs text-muted">
                      {drill.category} · {drill.duration ?? "-"} min · {drill.players_min ?? "-"}-{drill.players_max ?? "-"} spelare · {drill.equipment ?? "Inget material"}
                    </p>
                  </div>
                  <form action={deleteDrillAction}>
                    <input type="hidden" name="drillId" value={drill.id} />
                    <Button type="submit" variant="secondary" className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]">
                      Ta bort
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
