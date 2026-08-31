"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import type { TacticsBoardRecord, TacticsRosterPlayer } from "@/types/tactics";

interface TacticalBoardClientProps {
  boards: TacticsBoardRecord[];
  roster: TacticsRosterPlayer[];
  selectedBoardId?: string;
  onCreateBoard: (formData: FormData) => Promise<void>;
  onRenameBoard: (formData: FormData) => Promise<void>;
  onSaveBoard: (formData: FormData) => Promise<void>;
  onDuplicateBoard: (formData: FormData) => Promise<void>;
  onClearBoard: (formData: FormData) => Promise<void>;
  onSaveReferenceImage: (formData: FormData) => Promise<void>;
  onDeleteBoard: (formData: FormData) => Promise<void>;
}

export function TacticalBoardClient({
  boards,
  selectedBoardId,
  onCreateBoard,
  onRenameBoard,
  onSaveReferenceImage,
  onDeleteBoard,
}: TacticalBoardClientProps) {
  const selected = selectedBoardId ? boards.find((board) => board.id === selectedBoardId) : boards[0];

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <h2 className="text-2xl text-foreground">Taktikmedia</h2>
        <p className="mt-1 text-sm text-muted">Ladda upp bilder och mp4-klipp till laget och visa dem direkt i mobilen.</p>
        <form action={onCreateBoard} encType="multipart/form-data" className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Rubrik, t.ex. Uppspelsvariant vänster"
            className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground outline-none focus:border-accent md:col-span-2"
          />
          <input type="hidden" name="boardType" value="custom" />
          <input name="imageUrl" placeholder="Bild-URL (valfritt)" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="videoUrl" placeholder="Video-URL .mp4 (valfritt)" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
          <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground" />
          <input name="videoFile" type="file" accept="video/mp4" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground" />
          <FormSubmitButton pendingText="Laddar upp..." successText="Sparat" className="md:col-span-2">Ladda upp media</FormSubmitButton>
        </form>
      </Card>

      {boards.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Ingen taktikmedia uppladdad ännu.</p>
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap gap-2">
              {boards.map((board) => {
                const active = selected?.id === board.id;
                return (
                  <Link
                    key={board.id}
                    href={`/tactics?boardId=${board.id}`}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      active ? "border-accent bg-accent text-black" : "border-border bg-panel-elevated text-foreground"
                    }`}
                  >
                    {board.name}
                  </Link>
                );
              })}
            </div>
          </Card>

          {selected ? (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl text-foreground">{selected.name}</h3>
                <form action={onDeleteBoard}>
                  <input type="hidden" name="boardId" value={selected.id} />
                  <FormSubmitButton pendingText="Tar bort..." variant="secondary" className="h-9 px-3 text-xs text-red-200 hover:bg-[#3a1f1f]">
                    Ta bort media
                  </FormSubmitButton>
                </form>
              </div>

              <form action={onRenameBoard} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="boardId" value={selected.id} />
                <input
                  name="name"
                  defaultValue={selected.name}
                  className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground"
                />
                <FormSubmitButton pendingText="Sparar..." successText="Sparat" variant="secondary" className="h-10">Spara rubrik</FormSubmitButton>
              </form>

              <form action={onSaveReferenceImage} encType="multipart/form-data" className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input type="hidden" name="boardId" value={selected.id} />
                <input
                  name="imageUrl"
                  defaultValue={selected.reference_image_url ?? ""}
                  placeholder="Bild-URL (valfritt)"
                  className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground"
                />
                <input
                  name="videoUrl"
                  defaultValue={selected.reference_video_url ?? ""}
                  placeholder="Video-URL .mp4 (valfritt)"
                  className="h-10 rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground"
                />
                <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground" />
                <input name="videoFile" type="file" accept="video/mp4" className="h-10 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground" />
                <FormSubmitButton pendingText="Sparar media..." successText="Sparat" variant="secondary" className="md:col-span-2">
                  Spara media
                </FormSubmitButton>
              </form>

              <form action={onSaveReferenceImage} className="mt-2">
                <input type="hidden" name="boardId" value={selected.id} />
                <input type="hidden" name="imageUrl" value="" />
                <input type="hidden" name="videoUrl" value="" />
                <FormSubmitButton pendingText="Rensar..." variant="ghost" className="h-9 px-2 text-xs">Rensa bild och video</FormSubmitButton>
              </form>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {selected.reference_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.reference_image_url}
                    alt={selected.name}
                    className="max-h-[60svh] w-full rounded-lg border border-border object-contain"
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Ingen bild uppladdad</div>
                )}

                {selected.reference_video_url ? (
                  <video controls preload="metadata" className="max-h-[60svh] w-full rounded-lg border border-border bg-black/20">
                    <source src={selected.reference_video_url} type="video/mp4" />
                  </video>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted">Ingen video uppladdad</div>
                )}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
