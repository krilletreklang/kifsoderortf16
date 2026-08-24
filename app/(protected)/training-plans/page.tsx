import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/date";
import { createTrainingPlanAction, deleteTrainingPlanAction } from "./actions";

export default async function TrainingPlansPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera träningsplaner." />;
  }

  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("training_plans")
    .select("id, title, date, total_minutes, objective")
    .eq("team_id", membership.team_id)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Ny träningsplan</h2>
        <p className="mt-1 text-sm text-muted">Skapa passupplägg med mål och total tid.</p>
        <form action={createTrainingPlanAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <input name="title" required placeholder="Rubrik" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-2" />
          <input name="date" type="date" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="totalMinutes" type="number" min={0} max={180} placeholder="Total min" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="objective" placeholder="Mål med passet" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-2" />
          <Button type="submit">Spara plan</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-foreground">Träningsplaner</h2>
          <span className="text-sm text-muted">{plans?.length ?? 0} planer</span>
        </div>
        {!plans || plans.length === 0 ? (
          <p className="text-sm text-muted">Inga träningsplaner ännu.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((plan) => (
              <li key={plan.id} className="rounded-lg border border-border bg-panel-elevated px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{plan.title}</p>
                    <p className="text-xs text-muted">
                      {(plan.date ? formatDate(plan.date) : "Datum saknas")} · {plan.total_minutes ?? 0} min · {plan.objective ?? "Mål saknas"}
                    </p>
                  </div>
                  <form action={deleteTrainingPlanAction}>
                    <input type="hidden" name="planId" value={plan.id} />
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
