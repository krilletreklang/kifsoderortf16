import { TacticalBoardClient } from "@/components/tactics/tactical-board-client";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getTacticsPageData } from "@/lib/db/queries/tactics";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { clearBoardAction, createBoardAction, deleteBoardAction, duplicateBoardAction, renameBoardAction, saveBoardAction, saveReferenceImageAction } from "./actions";

interface TacticsPageProps {
  searchParams: Promise<{
    boardId?: string;
  }>;
}

export default async function TacticsPage({ searchParams }: TacticsPageProps) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  const params = await searchParams;

  if (!membership) {
    return (
      <EmptyState
        title="Ingen lagkoppling"
        description="Be en admin koppla ditt konto till laget för att använda taktiktavlan."
      />
    );
  }

  const { boards, roster } = await getTacticsPageData(membership.team_id);

  return (
    <TacticalBoardClient
      key={params.boardId ?? boards[0]?.id ?? "no-board"}
      boards={boards}
      roster={roster}
      selectedBoardId={params.boardId}
      onCreateBoard={createBoardAction}
      onRenameBoard={renameBoardAction}
      onSaveBoard={saveBoardAction}
      onDuplicateBoard={duplicateBoardAction}
      onClearBoard={clearBoardAction}
      onSaveReferenceImage={saveReferenceImageAction}
      onDeleteBoard={deleteBoardAction}
    />
  );
}
