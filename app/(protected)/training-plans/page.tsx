import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/date";
import { addDrillToTrainingPlanAction, createTrainingPlanAction, deleteTrainingPlanAction, deleteTrainingPlanSectionAction } from "./actions";

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

  const { data: drills } = await supabase
    .from("drills")
    .select("id, title, category, duration, equipment")
    .eq("team_id", membership.team_id)
    .order("title", { ascending: true });

  const planIds = (plans ?? []).map((plan) => plan.id);
  const { data: sections } =
    planIds.length > 0
      ? await supabase
          .from("training_plan_sections")
          .select("id, training_plan_id, title, minutes, description, equipment, order_index")
          .in("training_plan_id", planIds)
          .order("order_index", { ascending: true })
      : { data: [] as Array<{ id: string; training_plan_id: string; title: string; minutes: number; description: string | null; equipment: string | null; order_index: number }> };

  const sectionsByPlan = new Map<string, Array<{ id: string; title: string; minutes: number; description: string | null; equipment: string | null }>>();
  for (const section of sections ?? []) {
    const current = sectionsByPlan.get(section.training_plan_id) ?? [];
    current.push({
      id: section.id,
      title: section.title,
      minutes: section.minutes,
      description: section.description,
      equipment: section.equipment,
    });
    sectionsByPlan.set(section.training_plan_id, current);
  }
  const hasPlans = (plans?.length ?? 0) > 0;
  const inputClassName =
    "h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card className="max-w-4xl">
        <details open={!hasPlans} className="group">
          <summary className="cursor-pointer list-none">
            <h2 className="text-2xl text-foreground">Ny träningsplan</h2>
            <p className="mt-1 text-sm text-muted">Skapa passupplägg med mål och total tid.</p>
          </summary>
          <form action={createTrainingPlanAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
            <div className="md:col-span-2">
              <label htmlFor="plan-title" className="mb-1 block text-sm text-muted">
                Rubrik
              </label>
              <input id="plan-title" name="title" required autoComplete="off" placeholder="Inför match…" className={inputClassName} />
            </div>
            <div>
              <label htmlFor="plan-date" className="mb-1 block text-sm text-muted">
                Datum
              </label>
              <input id="plan-date" name="date" type="date" className={inputClassName} />
            </div>
            <div>
              <label htmlFor="plan-total-minutes" className="mb-1 block text-sm text-muted">
                Total tid (min)
              </label>
              <input id="plan-total-minutes" name="totalMinutes" type="number" inputMode="numeric" min={0} max={180} placeholder="90…" className={inputClassName} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="plan-objective" className="mb-1 block text-sm text-muted">
                Mål med passet
              </label>
              <input id="plan-objective" name="objective" autoComplete="off" placeholder="Förberedelse inför helgens match…" className={inputClassName} />
            </div>
            <FormSubmitButton pendingText="Sparar plan…" className="md:col-span-2 md:justify-self-start">
              Spara plan
            </FormSubmitButton>
          </form>
        </details>
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
                <details open className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-base font-semibold text-foreground">{plan.title}</p>
                      <p className="text-xs text-muted">
                        {(plan.date ? formatDate(plan.date) : "Datum saknas")} · {plan.total_minutes ?? 0} min · {plan.objective ?? "Mål saknas"}
                      </p>
                    </div>
                    <span className="text-xs text-muted group-open:hidden">Visa detaljer</span>
                    <span className="hidden text-xs text-muted group-open:inline">Dölj detaljer</span>
                  </summary>

                  <div className="mt-3 space-y-3">
                    <div className="flex justify-end">
                      <form action={deleteTrainingPlanAction}>
                        <input type="hidden" name="planId" value={plan.id} />
                        <ConfirmSubmitButton
                          confirmMessage={`Ta bort planen "${plan.title}"?`}
                          pendingText="Tar bort…"
                          variant="secondary"
                          className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]"
                        >
                          Ta bort plan
                        </ConfirmSubmitButton>
                      </form>
                    </div>

                    <div className="rounded-md border border-border/60 bg-black/20 p-2">
                      <p className="mb-2 text-xs text-muted">Lägg till övning från biblioteket</p>
                      <form action={addDrillToTrainingPlanAction} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_150px_auto]">
                        <input type="hidden" name="planId" value={plan.id} />
                        <div>
                          <label htmlFor={`drill-select-${plan.id}`} className="mb-1 block text-xs text-muted">
                            Övning
                          </label>
                          <select
                            id={`drill-select-${plan.id}`}
                            name="drillId"
                            required
                            disabled={!drills || drills.length === 0}
                            className="h-9 w-full rounded-md border border-border bg-panel-elevated px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
                          >
                            {!drills || drills.length === 0 ? <option value="">Inga övningar skapade</option> : null}
                            {(drills ?? []).map((drill) => (
                              <option key={`${plan.id}-${drill.id}`} value={drill.id}>
                                {drill.title} · {drill.category} · {drill.duration ?? 0} min
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor={`minutes-override-${plan.id}`} className="mb-1 block text-xs text-muted">
                            Tid (min)
                          </label>
                          <input
                            id={`minutes-override-${plan.id}`}
                            name="minutesOverride"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={180}
                            autoComplete="off"
                            placeholder="Valfritt…"
                            className="h-9 w-full rounded-md border border-border bg-panel-elevated px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                          />
                        </div>
                        <FormSubmitButton pendingText="Lägger till…" variant="secondary" className="h-9 self-end px-3 text-xs" disabled={!drills || drills.length === 0}>
                          Lägg till
                        </FormSubmitButton>
                      </form>
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-muted">Övningar i planen</p>
                      {((sectionsByPlan.get(plan.id) ?? []).length === 0) ? (
                        <p className="text-xs text-muted">Inga övningar tillagda ännu.</p>
                      ) : (
                        <ul className="space-y-2">
                          {(sectionsByPlan.get(plan.id) ?? []).map((section, index) => (
                            <li key={section.id} className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-panel px-2 py-2">
                              <div className="min-w-0">
                                <p className="break-words text-sm font-medium text-foreground">{index + 1}. {section.title}</p>
                                <p className="text-xs text-muted">{section.minutes} min · {section.equipment ?? "Inget material"}</p>
                                {section.description ? <p className="break-words text-xs text-muted">{section.description}</p> : null}
                              </div>
                              <form action={deleteTrainingPlanSectionAction}>
                                <input type="hidden" name="sectionId" value={section.id} />
                                <ConfirmSubmitButton
                                  confirmMessage={`Ta bort övningen "${section.title}" från planen?`}
                                  pendingText="Tar bort…"
                                  variant="ghost"
                                  className="h-8 px-2 text-xs text-red-200"
                                >
                                  Ta bort
                                </ConfirmSubmitButton>
                              </form>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
