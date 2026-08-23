import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPlayersOverview } from "@/lib/db/queries/players";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createPlayerAction } from "./actions";

export default async function PlayersPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att se spelarregistret." />;
  }

  const players = await getPlayersOverview(membership.team_id);

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Ny spelare</h2>
        <p className="mt-1 text-sm text-muted">Lägg till spelare i lagets register.</p>
        <form action={createPlayerAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            name="firstName"
            required
            placeholder="Fornamn"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
          />
          <input
            name="lastName"
            required
            placeholder="Efternamn"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
          />
          <input
            name="jerseyNumber"
            type="number"
            min={1}
            max={99}
            placeholder="Tröja #"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
          />
          <input
            name="birthYear"
            type="number"
            min={1990}
            max={2035}
            placeholder="Född"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent"
          />
          <input
            name="notes"
            placeholder="Anteckning (valfritt)"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-5"
          />
          <Button type="submit" className="w-full md:w-auto">
            Spara spelare
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-foreground">Spelarregister</h2>
          <span className="text-sm text-muted">{players.length} spelare</span>
        </div>

        {players.length === 0 ? (
          <EmptyState title="Inga spelare anlagda" description="Lägg till första spelaren med formuläret ovan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-2 py-2">Spelare</th>
                  <th className="px-2 py-2">Tröja</th>
                  <th className="px-2 py-2">Aktiv</th>
                  <th className="px-2 py-2">Närvaro</th>
                  <th className="px-2 py-2">Matcher</th>
                  <th className="px-2 py-2">Starter</th>
                  <th className="px-2 py-2">Minuter</th>
                  <th className="px-2 py-2">Vanligaste pos</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b border-border/60 hover:bg-panel-elevated/60">
                    <td className="px-2 py-3">
                      <Link href={`/players/${player.id}`} className="font-semibold text-foreground hover:text-accent">
                        {player.first_name} {player.last_name}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-muted">{player.jersey_number ?? "-"}</td>
                    <td className="px-2 py-3">{player.active ? "Ja" : "Nej"}</td>
                    <td className="px-2 py-3">{player.attendance_percent}%</td>
                    <td className="px-2 py-3">{player.matches_total}</td>
                    <td className="px-2 py-3">{player.starts_total}</td>
                    <td className="px-2 py-3">{player.minutes_total}</td>
                    <td className="px-2 py-3">{player.common_position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
