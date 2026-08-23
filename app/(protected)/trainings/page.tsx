import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { getTrainingAttendanceModel, type AttendanceStatus } from "@/lib/db/queries/trainings";
import { formatDate, formatTime } from "@/lib/utils/date";
import { createTrainingAction, markAllPresentAction, setAttendanceAction } from "./actions";

function statusText(status: AttendanceStatus) {
  if (status === "present") return "Narvarande";
  if (status === "late") return "Sen";
  if (status === "absent") return "Frånvarande";
  return "Okänd";
}

const statuses: AttendanceStatus[] = ["present", "late", "absent", "unknown"];

export default async function TrainingsPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera träningar." />;
  }

  const model = await getTrainingAttendanceModel(membership.team_id);

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Skapa träning</h2>
        <p className="mt-1 text-sm text-muted">Planera nästa pass och registrera närvaro direkt i appen.</p>
        <form action={createTrainingAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <input name="date" type="date" required className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent" />
          <input name="startTime" type="time" required className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent" />
          <input name="endTime" type="time" required className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent" />
          <input name="location" placeholder="Plats" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2" />
          <input name="theme" placeholder="Tema" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent" />
          <input name="notes" placeholder="Anteckning" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-5" />
          <Button type="submit" className="w-full md:w-auto">
            Spara träning
          </Button>
        </form>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-foreground">Träningslista</h2>
            <span className="text-sm text-muted">{model.trainings.length} pass</span>
          </div>
          {model.trainings.length === 0 ? (
            <p className="text-sm text-muted">Inga träningar anlagda ännu.</p>
          ) : (
            <ul className="space-y-2">
              {model.trainings.map((training) => (
                <li key={training.id} className="rounded-lg border border-border bg-panel-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground">{formatDate(training.date)} · {formatTime(training.start_time)}-{formatTime(training.end_time)}</p>
                      <p className="text-xs text-muted">{training.location ?? "Plats saknas"} · {training.theme ?? "Tema saknas"}</p>
                    </div>
                    <div className="text-sm text-muted">{training.attendance_rate}%</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-foreground">Snabb närvaro</h2>
            {model.selected_training ? <span className="text-sm text-muted">{formatDate(model.selected_training.date)}</span> : null}
          </div>

          {!model.selected_training ? (
            <p className="text-sm text-muted">Skapa en träning för att registrera närvaro.</p>
          ) : model.players.length === 0 ? (
            <p className="text-sm text-muted">Lägg till spelare för att komma igång.</p>
          ) : (
            <div className="space-y-3">
              <form action={markAllPresentAction}>
                <input type="hidden" name="trainingId" value={model.selected_training.id} />
                <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                  Markera alla närvarande
                </Button>
              </form>

              <ul className="space-y-2">
                {model.players.map((player) => {
                  const status = model.attendance_by_player[player.id] ?? "unknown";

                  return (
                    <li key={player.id} className="rounded-lg border border-border bg-panel-elevated px-3 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm text-foreground">
                          {player.first_name} {player.last_name} {player.jersey_number ? `#${player.jersey_number}` : ""}
                        </p>
                        <span className="text-xs text-muted">{statusText(status)}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {statuses.map((choice) => {
                          const active = choice === status;
                          return (
                            <form key={choice} action={setAttendanceAction}>
                              <input type="hidden" name="trainingId" value={model.selected_training?.id} />
                              <input type="hidden" name="playerId" value={player.id} />
                              <input type="hidden" name="status" value={choice} />
                              <Button
                                type="submit"
                                variant={active ? "primary" : "secondary"}
                                className="h-9 w-full px-2 text-xs"
                              >
                                {statusText(choice)}
                              </Button>
                            </form>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
