import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { logoutAction } from "./actions";

export default async function ProtectedLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);

  const teamLabel = membership
    ? `${membership.teams.club_name} · ${membership.teams.name} · ${membership.role.toUpperCase()}`
    : "Ingen lagkoppling";

  return (
    <AppShell userEmail={user.email ?? "coach"} teamLabel={teamLabel} onLogout={logoutAction}>
      {membership ? (
        children
      ) : (
        <EmptyState
          title="Konto saknar lagkoppling"
          description="Be en admin att lagga till dig i team_members for att fa access till lagets data."
        />
      )}
    </AppShell>
  );
}
