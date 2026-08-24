import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getMatchesOverview } from "@/lib/db/queries/matches";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { formatDate, formatTime } from "@/lib/utils/date";
import { createMatchAction, deleteMatchAction } from "./actions";

function homeAwayText(value: "home" | "away") {
  return value === "home" ? "Hemma" : "Borta";
}

export default async function MatchesPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera matcher." />;
  }

  const matches = await getMatchesOverview(membership.team_id);
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = matches.filter((match) => match.date >= today && match.status !== "cancelled");
  const played = matches.filter((match) => match.date < today || match.status === "completed");

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Skapa match</h2>
        <p className="mt-1 text-sm text-muted">Planera matcher, kalla spelare och följ minuter över tid.</p>
        <form action={createMatchAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-7">
          <input name="date" type="date" required className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="startTime" type="time" required className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="opponent" required placeholder="Motstånd" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-2" />
          <select name="homeAway" defaultValue="home" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground">
            <option value="home">Hemma</option>
            <option value="away">Borta</option>
          </select>
          <input name="location" placeholder="Plats" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <select name="matchType" defaultValue="friendly" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground">
            <option value="league">Serie</option>
            <option value="friendly">Träningsmatch</option>
            <option value="cup">Cup</option>
            <option value="tournament">Turnering</option>
            <option value="training_game">Internmatch</option>
          </select>
          <input name="notes" placeholder="Anteckning" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-5" />
          <Button type="submit" className="w-full md:w-auto">Spara match</Button>
        </form>
      </Card>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl text-foreground">Kommande matcher</h2>
            <span className="text-sm text-muted">{upcoming.length}</span>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Inga kommande matcher planerade.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((match) => (
                <li key={match.id}>
                  <div className="rounded-lg border border-border bg-panel-elevated px-3 py-3 hover:border-accent-soft">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/matches/${match.id}`} className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{formatDate(match.date)} · {formatTime(match.start_time)}</p>
                        <p className="text-base font-semibold text-foreground">vs {match.opponent}</p>
                        <p className="text-xs text-muted">{homeAwayText(match.home_away)} · {match.location ?? "Plats saknas"}</p>
                      </Link>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted">
                          <p>Kallade: {match.called_count}</p>
                          <p>Spelade: {match.participated_count}</p>
                        </div>
                        <form action={deleteMatchAction}>
                          <input type="hidden" name="matchId" value={match.id} />
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
            <h2 className="text-2xl text-foreground">Tidigare matcher</h2>
            <span className="text-sm text-muted">{played.length}</span>
          </div>
          {played.length === 0 ? (
            <p className="text-sm text-muted">Inga tidigare matcher ännu.</p>
          ) : (
            <ul className="space-y-2">
              {played.map((match) => (
                <li key={match.id}>
                  <div className="rounded-lg border border-border bg-panel-elevated px-3 py-3 hover:border-accent-soft">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/matches/${match.id}`} className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{formatDate(match.date)} · {formatTime(match.start_time)}</p>
                        <p className="text-base font-semibold text-foreground">vs {match.opponent}</p>
                        <p className="text-xs text-muted">{homeAwayText(match.home_away)} · {match.location ?? "Plats saknas"}</p>
                      </Link>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          {match.goals_for !== null && match.goals_against !== null ? (
                            <p className="text-lg font-semibold text-foreground">{match.goals_for}-{match.goals_against}</p>
                          ) : (
                            <p className="text-xs text-muted">Inget resultat</p>
                          )}
                          <p className="text-xs text-muted">{match.status === "completed" ? "Spelad" : match.status === "cancelled" ? "Inställd" : "Planerad"}</p>
                        </div>
                        <form action={deleteMatchAction}>
                          <input type="hidden" name="matchId" value={match.id} />
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
      </section>
    </div>
  );
}
