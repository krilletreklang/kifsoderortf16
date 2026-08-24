import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/db/queries/dashboard";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { formatDate } from "@/lib/utils/date";

export default async function StatisticsPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return <EmptyState title="Ingen lagkoppling" description="Be en admin koppla ditt konto till laget för att se statistik." />;
  }

  const summary = await getDashboardSummary(membership.team_id);

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Lagstatistik</h2>
        <p className="mt-1 text-sm text-muted">Överblick över närvaro och matchtempo just nu.</p>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Närvaro senaste 30 dagar</p>
          <p className="mt-2 text-3xl text-foreground">{summary.monthlyAttendance}%</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Spelade matcher</p>
          <p className="mt-2 text-3xl text-foreground">{summary.playedMatches}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Kommande matcher</p>
          <p className="mt-2 text-3xl text-foreground">{summary.upcomingMatches}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Senaste resultat</p>
          <p className="mt-2 text-2xl text-foreground">
            {summary.latestResult ? `${summary.latestResult.goals_for}-${summary.latestResult.goals_against}` : "-"}
          </p>
          <p className="text-xs text-muted">{summary.latestResult ? summary.latestResult.opponent : "Ingen spelad match"}</p>
        </Card>
      </section>

      <Card>
        <h3 className="text-xl text-foreground">Närvaro per träningsdatum</h3>
        {summary.attendanceByWeek.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ingen närvarodata ännu.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {summary.attendanceByWeek.map((point) => (
              <li key={point.week} className="flex items-center justify-between rounded-lg border border-border bg-panel-elevated px-3 py-2">
                <span className="text-sm text-foreground">{formatDate(point.week)}</span>
                <span className="text-sm text-muted">{point.attendanceRate}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
