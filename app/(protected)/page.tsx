import { AttendanceSummaryChart } from "@/components/dashboard/attendance-summary-chart";
import { NextMatchCard } from "@/components/dashboard/next-match-card";
import { NextTrainingCard } from "@/components/dashboard/next-training-card";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/db/queries/dashboard";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";

export default async function DashboardPage() {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  if (!membership) {
    return null;
  }

  const summary = await getDashboardSummary(membership.team_id);

  return (
    <div className="space-y-4 lg:space-y-6">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <NextTrainingCard training={summary.nextTraining} />
        <NextMatchCard match={summary.nextMatch} />
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Närvaro denna månad" value={`${summary.monthlyAttendance}%`} />
        <StatCard label="Matcher spelade" value={`${summary.playedMatches}`} />
        <StatCard label="Matcher kommande" value={`${summary.upcomingMatches}`} />
        <StatCard
          label="Senaste resultat"
          value={summary.latestResult ? `${summary.latestResult.goals_for}-${summary.latestResult.goals_against}` : "-"}
          helper={summary.latestResult ? `vs ${summary.latestResult.opponent}` : "Ingen avslutad match"}
        />
      </section>

      <section>
        <AttendanceSummaryChart data={summary.attendanceByWeek} />
      </section>
    </div>
  );
}
