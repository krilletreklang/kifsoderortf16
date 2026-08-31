import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { requireUser } from "@/lib/auth/session";
import { getPlayersOverview } from "@/lib/db/queries/players";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createPlayerAction, deletePlayerAction } from "./actions";

interface PlayersPageProps {
  searchParams: Promise<{ error?: string; created?: string }>;
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  const params = await searchParams;

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att se spelarregistret." />;
  }

  const players = await getPlayersOverview(membership.team_id);
  const created = params.created === "1";

  const errorText =
    params.error === "duplicate_jersey"
      ? "Tröjnummer används redan i laget. Välj ett annat nummer eller lämna fältet tomt."
      : params.error === "invalid_player"
        ? "Kontrollera att för- och efternamn är ifyllda korrekt."
        : params.error === "player_constraint"
          ? "Ogiltigt värde för spelare. Kontrollera tröjnummer och födelseår."
          : params.error === "player_save_failed"
            ? "Kunde inte spara spelaren. Försök igen."
            : null;

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Ny spelare</h2>
        <p className="mt-1 text-sm text-muted">Lägg till spelare i lagets register.</p>
        {created ? <p className="mt-2 text-sm text-green-300">Spelaren sparades.</p> : null}
        {errorText ? <p className="mt-2 text-sm text-red-300">{errorText}</p> : null}
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
          <FormSubmitButton pendingText="Sparar spelare..." className="w-full md:w-auto">Spara spelare</FormSubmitButton>
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
          <>
            <ul className="space-y-2 md:hidden">
              {players.map((player) => (
                <li key={`mobile-${player.id}`} className="rounded-lg border border-border bg-panel-elevated px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/players/${player.id}`} className="font-semibold text-foreground hover:text-accent">
                        {player.first_name} {player.last_name}
                      </Link>
                      <p className="text-xs text-muted">Tröja {player.jersey_number ?? "-"} · {player.active ? "Aktiv" : "Inaktiv"}</p>
                    </div>
                    <form action={deletePlayerAction}>
                      <input type="hidden" name="playerId" value={player.id} />
                      <FormSubmitButton pendingText="Tar bort..." variant="secondary" className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]">
                        Ta bort
                      </FormSubmitButton>
                    </form>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
                    <p>Närvaro: {player.attendance_percent}%</p>
                    <p>Matcher: {player.matches_total}</p>
                    <p>Kallad: {player.called_up_total}</p>
                    <p>Spelad: {player.participated_total}</p>
                    <p>Position: {player.common_position}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-2 py-2">Spelare</th>
                    <th className="px-2 py-2">Tröja</th>
                    <th className="px-2 py-2">Aktiv</th>
                    <th className="px-2 py-2">Närvaro</th>
                    <th className="px-2 py-2">Matcher</th>
                    <th className="px-2 py-2">Kallad</th>
                    <th className="px-2 py-2">Spelad</th>
                    <th className="px-2 py-2">Vanligaste pos</th>
                    <th className="px-2 py-2">Åtgärd</th>
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
                      <td className="px-2 py-3">{player.called_up_total}</td>
                      <td className="px-2 py-3">{player.participated_total}</td>
                      <td className="px-2 py-3">{player.common_position}</td>
                      <td className="px-2 py-3">
                        <form action={deletePlayerAction}>
                          <input type="hidden" name="playerId" value={player.id} />
                          <FormSubmitButton pendingText="Tar bort..." variant="secondary" className="h-8 px-2 text-xs text-red-200 hover:bg-[#3a1f1f]">
                            Ta bort
                          </FormSubmitButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
