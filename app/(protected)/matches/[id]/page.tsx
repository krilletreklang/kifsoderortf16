import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getMatchDetail } from "@/lib/db/queries/matches";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { formatDate, formatTime } from "@/lib/utils/date";
import {
  saveResultAction,
  setMinutesAction,
  toggleCalledUpAction,
  toggleParticipatedAction,
  toggleStarterAction,
} from "../actions";

interface MatchDetailsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ suggested?: string }>;
}

function homeAwayText(value: "home" | "away") {
  return value === "home" ? "Hemma" : "Borta";
}

export default async function MatchDetailsPage({ params, searchParams }: MatchDetailsPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att hantera matcher." />;
  }

  const { id } = await params;
  const sp = await searchParams;
  const suggestedCount = Number.isFinite(Number(sp.suggested)) ? Math.max(1, Number(sp.suggested)) : 10;

  const detail = await getMatchDetail(membership.team_id, id, suggestedCount);
  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{detail.match.match_type}</p>
            <h2 className="text-2xl text-foreground md:text-3xl">vs {detail.match.opponent}</h2>
            <p className="mt-1 text-sm text-muted">
              {formatDate(detail.match.date)} · {formatTime(detail.match.start_time)} · {homeAwayText(detail.match.home_away)}
            </p>
            <p className="text-sm text-muted">{detail.match.location ?? "Plats saknas"}</p>
          </div>
          <Link href={`/tactics?source=match&matchId=${detail.match.id}`} className="rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm text-foreground">
            Öppna i taktiktavla
          </Link>
        </div>

        <form action={saveResultAction} className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          <input type="hidden" name="matchId" value={detail.match.id} />
          <input name="goalsFor" type="number" min={0} defaultValue={detail.match.goals_for ?? ""} placeholder="Mål fram" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground" />
          <input name="goalsAgainst" type="number" min={0} defaultValue={detail.match.goals_against ?? ""} placeholder="Mål bak" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground" />
          <select name="status" defaultValue={detail.match.status} className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground md:col-span-2">
            <option value="planned">Planerad</option>
            <option value="completed">Spelad</option>
            <option value="cancelled">Inställd</option>
          </select>
          <Button type="submit" variant="secondary" className="h-10 md:col-span-2">Spara matchresultat</Button>
        </form>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl text-foreground">Matchuttagning</h3>
          <p className="text-sm text-muted">Kallade: {detail.summary.called_up_count} / {detail.summary.suggested_count}</p>
        </div>

        <form method="get" className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="suggested" className="text-sm text-muted">Föreslå lagstorlek</label>
          <input id="suggested" name="suggested" type="number" min={1} max={20} defaultValue={detail.summary.suggested_count} className="h-9 w-24 rounded-md border border-border bg-panel-elevated px-2 text-sm text-foreground" />
          <Button type="submit" className="h-9 px-3 text-xs">Föreslå lag</Button>
        </form>

        <ul className="mt-3 space-y-3 md:hidden">
          {detail.players.map((player) => (
            <li key={`mobile-${player.player_id}`} className={`rounded-lg border border-border bg-panel-elevated px-3 py-3 ${player.recommended ? "ring-1 ring-accent/70" : ""}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {player.first_name} {player.last_name} {player.jersey_number ? `#${player.jersey_number}` : ""}
                </p>
                <span className="text-xs text-muted">{player.attendance_percent}% närvaro</span>
              </div>
              <p className="text-xs text-muted">{player.reason}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                <p>Matcher 5: {player.recent_matches_played}</p>
                <p>Totalt: {player.total_matches_played}</p>
                <p>Minuter: {player.minutes_total}</p>
                <p>Senast: {player.last_played_date ? formatDate(player.last_played_date) : "-"}</p>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <form action={toggleCalledUpAction}>
                  <input type="hidden" name="matchId" value={detail.match.id} />
                  <input type="hidden" name="playerId" value={player.player_id} />
                  <input type="hidden" name="value" value={player.called_up ? "false" : "true"} />
                  <Button type="submit" variant={player.called_up ? "primary" : "secondary"} className="h-8 w-full px-2 text-xs">
                    {player.called_up ? "Kallad" : "Kalla"}
                  </Button>
                </form>
                <form action={toggleStarterAction}>
                  <input type="hidden" name="matchId" value={detail.match.id} />
                  <input type="hidden" name="playerId" value={player.player_id} />
                  <input type="hidden" name="value" value={player.starter ? "false" : "true"} />
                  <Button type="submit" variant={player.starter ? "primary" : "secondary"} className="h-8 w-full px-2 text-xs">
                    {player.starter ? "Startar" : "Bänk"}
                  </Button>
                </form>
                <form action={toggleParticipatedAction}>
                  <input type="hidden" name="matchId" value={detail.match.id} />
                  <input type="hidden" name="playerId" value={player.player_id} />
                  <input type="hidden" name="value" value={player.participated ? "false" : "true"} />
                  <Button type="submit" variant={player.participated ? "primary" : "secondary"} className="h-8 w-full px-2 text-xs">
                    {player.participated ? "Spelar" : "Ej"}
                  </Button>
                </form>
              </div>

              <form action={setMinutesAction} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="matchId" value={detail.match.id} />
                <input type="hidden" name="playerId" value={player.player_id} />
                <input name="minutes" type="number" min={0} max={120} defaultValue={player.minutes_played} className="h-8 w-20 rounded-md border border-border bg-panel-elevated px-2 text-xs text-foreground" />
                <Button type="submit" variant="secondary" className="h-8 px-3 text-xs">Spara min</Button>
              </form>
            </li>
          ))}
        </ul>

        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="px-2 py-2">Spelare</th>
                <th className="px-2 py-2">Matcher senaste 5</th>
                <th className="px-2 py-2">Matcher totalt</th>
                <th className="px-2 py-2">Senast spelad</th>
                <th className="px-2 py-2">Minuter</th>
                <th className="px-2 py-2">Närvaro</th>
                <th className="px-2 py-2">Varför föreslagen</th>
                <th className="px-2 py-2">Kallad</th>
                <th className="px-2 py-2">Starter</th>
                <th className="px-2 py-2">Spelade</th>
                <th className="px-2 py-2">Minuter i match</th>
              </tr>
            </thead>
            <tbody>
              {detail.players.map((player) => (
                <tr key={player.player_id} className={`border-b border-border/60 ${player.recommended ? "bg-[#2b2411]" : ""}`}>
                  <td className="px-2 py-3 font-semibold text-foreground">
                    {player.first_name} {player.last_name} {player.jersey_number ? `#${player.jersey_number}` : ""}
                  </td>
                  <td className="px-2 py-3">{player.recent_matches_played}</td>
                  <td className="px-2 py-3">{player.total_matches_played}</td>
                  <td className="px-2 py-3 text-muted">{player.last_played_date ? formatDate(player.last_played_date) : "-"}</td>
                  <td className="px-2 py-3">{player.minutes_total}</td>
                  <td className="px-2 py-3">{player.attendance_percent}%</td>
                  <td className="px-2 py-3 text-muted">{player.reason}</td>
                  <td className="px-2 py-3">
                    <form action={toggleCalledUpAction}>
                      <input type="hidden" name="matchId" value={detail.match.id} />
                      <input type="hidden" name="playerId" value={player.player_id} />
                      <input type="hidden" name="value" value={player.called_up ? "false" : "true"} />
                      <Button type="submit" variant={player.called_up ? "primary" : "secondary"} className="h-8 px-2 text-xs">
                        {player.called_up ? "Kallad" : "Kalla"}
                      </Button>
                    </form>
                  </td>
                  <td className="px-2 py-3">
                    <form action={toggleStarterAction}>
                      <input type="hidden" name="matchId" value={detail.match.id} />
                      <input type="hidden" name="playerId" value={player.player_id} />
                      <input type="hidden" name="value" value={player.starter ? "false" : "true"} />
                      <Button type="submit" variant={player.starter ? "primary" : "secondary"} className="h-8 px-2 text-xs">
                        {player.starter ? "Startar" : "Bänk"}
                      </Button>
                    </form>
                  </td>
                  <td className="px-2 py-3">
                    <form action={toggleParticipatedAction}>
                      <input type="hidden" name="matchId" value={detail.match.id} />
                      <input type="hidden" name="playerId" value={player.player_id} />
                      <input type="hidden" name="value" value={player.participated ? "false" : "true"} />
                      <Button type="submit" variant={player.participated ? "primary" : "secondary"} className="h-8 px-2 text-xs">
                        {player.participated ? "Spelar" : "Ej"}
                      </Button>
                    </form>
                  </td>
                  <td className="px-2 py-3">
                    <form action={setMinutesAction} className="flex items-center gap-1">
                      <input type="hidden" name="matchId" value={detail.match.id} />
                      <input type="hidden" name="playerId" value={player.player_id} />
                      <input name="minutes" type="number" min={0} max={120} defaultValue={player.minutes_played} className="h-8 w-16 rounded-md border border-border bg-panel-elevated px-2 text-xs text-foreground" />
                      <Button type="submit" variant="secondary" className="h-8 px-2 text-xs">Spara</Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
