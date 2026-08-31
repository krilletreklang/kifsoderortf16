import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { DrillEditForm } from "@/components/drills/drill-edit-form";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";
import { deleteDrillAction, updateDrillAction } from "../actions";

interface DrillDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function DrillDetailsPage({ params }: DrillDetailsPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    notFound();
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: drill } = await supabase
    .from("drills")
    .select("id, title, category, duration, players_min, players_max, equipment, description, coaching_points, image_url, video_url")
    .eq("id", id)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!drill) {
    notFound();
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl text-foreground md:text-3xl">{drill.title}</h2>
            <p className="text-sm text-muted">
              {drill.category} · {drill.duration ?? "-"} min · {drill.players_min ?? "-"}-{drill.players_max ?? "-"} spelare
            </p>
          </div>
          <Link href="/drills" className="rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground">
            Tillbaka
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {drill.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={drill.image_url} alt={drill.title} className="max-h-[70svh] w-full rounded-lg border border-border object-contain" />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Ingen bild uppladdad</div>
          )}

          {drill.video_url ? (
            <video controls preload="metadata" className="max-h-[70svh] w-full rounded-lg border border-border bg-black/20">
              <source src={drill.video_url} type="video/mp4" />
            </video>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Ingen video uppladdad</div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="text-xl text-foreground">Redigera övning</h3>
        <p className="mt-1 text-sm text-muted">Uppdatera innehåll, bild och video för övningen.</p>
        <div className="mt-4">
          <DrillEditForm teamId={membership.team_id} drill={drill} onUpdateDrill={updateDrillAction} />
        </div>
      </Card>

      <Card>
        <h3 className="text-xl text-foreground">Ta bort övning</h3>
        <p className="mt-1 text-sm text-muted">Detta tar bort övningen från biblioteket och från val i framtida planering.</p>
        <form action={deleteDrillAction} className="mt-3">
          <input type="hidden" name="drillId" value={drill.id} />
          <FormSubmitButton pendingText="Tar bort..." variant="secondary" className="text-red-200 hover:bg-[#3a1f1f]">
            Ta bort övning
          </FormSubmitButton>
        </form>
      </Card>
    </div>
  );
}
