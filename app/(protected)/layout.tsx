import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { logoutAction } from "./actions";

function normalizeClubName(name: string) {
  return name.replace(/SODERORT/gi, "SÖDERORT").replace(/Soderort/g, "Söderort");
}

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  const teamLabel = membership
    ? `${normalizeClubName(membership.teams.club_name)} · ${membership.teams.name} · ${membership.role.toUpperCase()}`
    : "Ingen lagkoppling";

  return (
    <AppShell userEmail={user.email ?? "coach"} teamLabel={teamLabel} onLogout={logoutAction}>
      {membership ? (
        children
      ) : (
        <EmptyState
          title="Konto saknar lagkoppling"
          description="Be en admin att lägga till dig i team_members för att få access till lagets data."
        />
      )}
    </AppShell>
  );
}
