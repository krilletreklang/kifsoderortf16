import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/session";
import { getPlayerDetails } from "@/lib/db/queries/players";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { formatDate } from "@/lib/utils/date";

interface PlayerDetailsPageProps {
  params: Promise<{ id: string }>;
}

function attendanceLabel(status: "present" | "absent" | "late" | "unknown") {
  if (status === "present") return "Narvarande";
  if (status === "late") return "Sen";
  if (status === "absent") return "Frånvarande";
  return "Okänd";
}

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    notFound();
  }

  const { id } = await params;
  const player = await getPlayerDetails(membership.team_id, id);

  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-3xl text-foreground">
              {player.first_name} {player.last_name}
            </h2>
            <p className="text-sm text-muted">
              Tröja #{player.jersey_number ?? "-"} · {player.active ? "Aktiv" : "Inaktiv"}
            </p>
          </div>
          <div className="text-sm text-muted">Född: {player.birth_year ?? "-"}</div>
        </div>
        {player.notes ? <p className="mt-3 text-sm text-muted">{player.notes}</p> : null}
      </Card>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Träningar" value={`${player.trainings_total}`} />
        <StatCard label="Närvaro" value={`${player.attendance_percent}%`} />
        <StatCard label="Kallad" value={`${player.called_up_total}`} />
        <StatCard label="Spelad" value={`${player.participated_total}`} />
        <StatCard label="Starter" value={`${player.starts_total}`} />
        <StatCard label="Grönt kort" value={`${player.green_cards_total}`} />
        <StatCard label="Minuter" value={`${player.minutes_total}`} />
        <StatCard label="Snitt min/match" value={`${player.avg_minutes_per_match}`} />
        <StatCard label="Positioner" value={`${player.position_breakdown.length}`} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="text-2xl text-foreground">Positioner spelade</h3>
          {player.position_breakdown.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Ingen positionsdata registrerad ännu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {player.position_breakdown.map((item) => (
                <li key={item.position} className="flex items-center justify-between rounded-md bg-panel-elevated px-3 py-2 text-sm">
                  <span>{item.position}</span>
                  <span className="text-muted">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-2xl text-foreground">Senaste närvaro</h3>
          {player.recent_attendance.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Ingen närvaro registrerad ännu.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {player.recent_attendance.map((item) => (
                <li key={`${item.training_id}-${item.date}`} className="flex items-center justify-between rounded-md bg-panel-elevated px-3 py-2 text-sm">
                  <span>{formatDate(item.date)}</span>
                  <span className="text-muted">{attendanceLabel(item.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card>
        <h3 className="text-2xl text-foreground">Senaste matcher</h3>
        {player.recent_matches.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ingen matchdata registrerad ännu.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-2 py-2">Datum</th>
                  <th className="px-2 py-2">Motstand</th>
                  <th className="px-2 py-2">Kallad</th>
                  <th className="px-2 py-2">Spelad</th>
                  <th className="px-2 py-2">Start</th>
                  <th className="px-2 py-2">Minuter</th>
                </tr>
              </thead>
              <tbody>
                {player.recent_matches.map((item) => (
                  <tr key={item.match_id} className="border-b border-border/60">
                    <td className="px-2 py-3">{formatDate(item.date)}</td>
                    <td className="px-2 py-3">{item.opponent || "-"}</td>
                    <td className="px-2 py-3">{item.called_up ? "Ja" : "Nej"}</td>
                    <td className="px-2 py-3">{item.participated ? "Ja" : "Nej"}</td>
                    <td className="px-2 py-3">{item.starter ? "Ja" : "Nej"}</td>
                    <td className="px-2 py-3">{item.minutes_played}</td>
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
