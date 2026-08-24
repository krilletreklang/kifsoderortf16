import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { getTrainingAttendanceModel, type AttendanceStatus } from "@/lib/db/queries/trainings";
import { formatDate, formatTime } from "@/lib/utils/date";
import { createTrainingAction, deleteTrainingAction, setAllAttendanceStatusAction, setAttendanceAction } from "./actions";

function statusText(status: AttendanceStatus) {
  if (status === "present") return "Närvarande";
  if (status === "late") return "Sen";
  if (status === "absent") return "Frånvarande";
  return "Okänd";
}

const statuses: AttendanceStatus[] = ["present", "late", "absent", "unknown"];

type AttendanceFilter = "all" | AttendanceStatus;

interface TrainingsPageProps {
  searchParams: Promise<{
    trainingId?: string;
    filter?: AttendanceFilter;
  }>;
}

export default async function TrainingsPage({ searchParams }: TrainingsPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  const params = await searchParams;

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera träningar." />;
  }

  const model = await getTrainingAttendanceModel(membership.team_id, {
    selectedTrainingId: params.trainingId,
  });

  const filter: AttendanceFilter = params.filter ?? "all";
  const visiblePlayers = model.players.filter((player) => {
    if (filter === "all") return true;
    const currentStatus = model.attendance_by_player[player.id] ?? "unknown";
    return currentStatus === filter;
  });

  return (
    <div className="space-y-4 pb-28 lg:space-y-6 lg:pb-6">
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
                <li key={training.id}>
                  <div
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      model.selected_training?.id === training.id
                        ? "border-accent bg-[#2a2415]"
                        : "border-border bg-panel-elevated hover:border-accent-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/trainings?trainingId=${training.id}&filter=${filter}`} className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{formatDate(training.date)} · {formatTime(training.start_time)}-{formatTime(training.end_time)}</p>
                        <p className="text-xs text-muted">{training.location ?? "Plats saknas"} · {training.theme ?? "Tema saknas"}</p>
                      </Link>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted">{training.attendance_rate}%</div>
                        <form action={deleteTrainingAction}>
                          <input type="hidden" name="trainingId" value={training.id} />
                          <Button type="submit" variant="secondary" className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]">
                            Ta bort
                          </Button>
                        </form>
                      </div>
                    </div>
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
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <Link
                  href={`/trainings?trainingId=${model.selected_training.id}&filter=all`}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs ${
                    filter === "all" ? "border-accent bg-accent text-black" : "border-border bg-panel-elevated text-foreground"
                  }`}
                >
                  Alla ({model.players.length})
                </Link>
                {statuses.map((choice) => (
                  <Link
                    key={choice}
                    href={`/trainings?trainingId=${model.selected_training?.id}&filter=${choice}`}
                    className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs ${
                      filter === choice
                        ? "border-accent bg-accent text-black"
                        : "border-border bg-panel-elevated text-foreground"
                    }`}
                  >
                    {statusText(choice)} ({model.status_counts[choice]})
                  </Link>
                ))}
              </div>

              <ul className="space-y-2">
                {visiblePlayers.map((player) => {
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
              {visiblePlayers.length === 0 ? <p className="text-sm text-muted">Ingen spelare matchar valt filter.</p> : null}
            </div>
          )}
        </Card>
      </section>

      {model.selected_training ? (
        <Card className="fixed inset-x-0 bottom-14 z-30 mx-2 border-accent/40 bg-panel-elevated/95 backdrop-blur lg:static lg:mx-0 lg:border-border lg:bg-panel lg:backdrop-blur-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Snabbval för hela träningen:</span>
            {statuses.map((choice) => (
              <form key={`bulk-${choice}`} action={setAllAttendanceStatusAction}>
                <input type="hidden" name="trainingId" value={model.selected_training?.id} />
                <input type="hidden" name="status" value={choice} />
                <Button type="submit" variant={choice === "present" ? "primary" : "secondary"} className="h-9 px-3 text-xs">
                  Alla {statusText(choice).toLowerCase()}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
