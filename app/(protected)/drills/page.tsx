import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DrillCreateForm } from "@/components/drills/drill-create-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
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
    .select("id, title, category, duration, players_min, players_max, equipment, video_url, image_url")
    .eq("team_id", membership.team_id)
    .order("title", { ascending: true });

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Ny övning</h2>
        <p className="mt-1 text-sm text-muted">Bygg upp ert övningsbibliotek med rätt nivå och material.</p>
        <DrillCreateForm teamId={membership.team_id} onCreateDrill={createDrillAction} />
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
                    <Link href={`/drills/${drill.id}`} className="text-base font-semibold text-foreground hover:text-accent">
                      {drill.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {drill.category} · {drill.duration ?? "-"} min · {drill.players_min ?? "-"}-{drill.players_max ?? "-"} spelare · {drill.equipment ?? "Inget material"}
                    </p>
                    {drill.video_url ? (
                      <video controls preload="metadata" className="mt-2 max-h-44 w-full max-w-md rounded-md border border-border bg-black/30">
                        <source src={drill.video_url} type="video/mp4" />
                      </video>
                    ) : null}
                    {drill.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={drill.image_url} alt={`Taktikbild för ${drill.title}`} className="mt-2 max-h-52 w-full max-w-md rounded-md border border-border object-contain bg-black/20" />
                    ) : null}
                    <Link href={`/drills/${drill.id}`} className="mt-2 inline-block text-xs text-accent hover:underline">
                      Öppna och redigera
                    </Link>
                  </div>
                  <form action={deleteDrillAction}>
                    <input type="hidden" name="drillId" value={drill.id} />
                    <FormSubmitButton pendingText="Tar bort..." variant="secondary" className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]">
                      Ta bort
                    </FormSubmitButton>
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
