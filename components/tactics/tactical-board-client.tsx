"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { uploadTeamMediaFromBrowser } from "@/lib/media/upload-client";
import type { TacticsBoardRecord, TacticsRosterPlayer } from "@/types/tactics";

interface TacticalBoardClientProps {
  teamId: string;
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
  teamId,
  boards,
  selectedBoardId,
  onCreateBoard,
  onRenameBoard,
  onSaveReferenceImage,
  onDeleteBoard,
}: TacticalBoardClientProps) {
  const router = useRouter();
  const selected = selectedBoardId ? boards.find((board) => board.id === selectedBoardId) : boards[0];
  const [creating, setCreating] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [boardSearch, setBoardSearch] = useState("");
  const filteredBoards = boards.filter((board) => board.name.toLocaleLowerCase().includes(boardSearch.trim().toLocaleLowerCase()));
  const inputClassName =
    "h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60";

  async function uploadTacticsMedia(
    formData: FormData,
    options: { allowMissingBoardId: boolean },
  ) {
    const imageFile = formData.get("imageFile");
    if (imageFile instanceof File && imageFile.size > 0) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
        throw new Error("Bild måste vara PNG, JPG eller WEBP.");
      }
      const imageUrl = await uploadTeamMediaFromBrowser(teamId, "tactics/images", imageFile);
      formData.set("imageUrl", imageUrl);
    }

    const videoFile = formData.get("videoFile");
    if (videoFile instanceof File && videoFile.size > 0) {
      if (videoFile.type !== "video/mp4") {
        throw new Error("Video måste vara .mp4.");
      }
      const videoUrl = await uploadTeamMediaFromBrowser(teamId, "tactics/videos", videoFile);
      formData.set("videoUrl", videoUrl);
    }

    formData.delete("imageFile");
    formData.delete("videoFile");

    if (!options.allowMissingBoardId) {
      const boardId = formData.get("boardId");
      if (!boardId || String(boardId).length === 0) {
        throw new Error("Ingen vald media-post att uppdatera.");
      }
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    setCreating(true);
    try {
      const formData = new FormData(event.currentTarget);
      await uploadTacticsMedia(formData, { allowMissingBoardId: true });
      await onCreateBoard(formData);
      router.refresh();
      event.currentTarget.reset();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Kunde inte ladda upp media.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    setSavingMedia(true);
    try {
      const formData = new FormData(event.currentTarget);
      await uploadTacticsMedia(formData, { allowMissingBoardId: false });
      await onSaveReferenceImage(formData);
      router.refresh();
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Kunde inte uppdatera media.");
    } finally {
      setSavingMedia(false);
    }
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card className="max-w-4xl">
        <details open={boards.length === 0} className="group">
          <summary className="cursor-pointer list-none">
            <h2 className="text-2xl text-foreground">Ny taktikmedia</h2>
            <p className="mt-1 text-sm text-muted">Ladda upp bilder och mp4-klipp till laget och visa dem direkt i mobilen.</p>
          </summary>
          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="create-board-name" className="mb-1 block text-sm text-muted">
                Rubrik
              </label>
              <input
                id="create-board-name"
                name="name"
                required
                autoComplete="off"
                placeholder="Uppspelsvariant vänster…"
                className={`${inputClassName} w-full`}
              />
            </div>
            <input type="hidden" name="boardType" value="custom" />
            <div>
              <label htmlFor="create-board-image-url" className="mb-1 block text-sm text-muted">
                Bild-URL
              </label>
              <input id="create-board-image-url" name="imageUrl" autoComplete="off" placeholder="https://…/bild.webp" className={`${inputClassName} w-full`} />
            </div>
            <div>
              <label htmlFor="create-board-video-url" className="mb-1 block text-sm text-muted">
                Video-URL (.mp4)
              </label>
              <input id="create-board-video-url" name="videoUrl" autoComplete="off" placeholder="https://…/video.mp4" className={`${inputClassName} w-full`} />
            </div>
            <div>
              <label htmlFor="create-board-image-file" className="mb-1 block text-sm text-muted">
                Ladda upp bild
              </label>
              <input id="create-board-image-file" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className={`${inputClassName} w-full py-2`} />
            </div>
            <div>
              <label htmlFor="create-board-video-file" className="mb-1 block text-sm text-muted">
                Ladda upp video (.mp4)
              </label>
              <input id="create-board-video-file" name="videoFile" type="file" accept="video/mp4" className={`${inputClassName} w-full py-2`} />
            </div>
            <Button type="submit" disabled={creating} className="md:col-span-2 md:justify-self-start">
              {creating ? "Laddar upp…" : "Ladda upp media"}
            </Button>
            {uploadError ? <p aria-live="polite" className="text-sm text-red-300 md:col-span-2">{uploadError}</p> : null}
          </form>
        </details>
      </Card>

      {boards.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Ingen taktikmedia uppladdad ännu.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <Card className="lg:sticky lg:top-6">
            <h2 className="text-xl text-foreground">Bibliotek</h2>
            <p className="mt-1 text-sm text-muted">{boards.length} uppladdningar</p>
            <div className="mt-3">
              <label htmlFor="board-search" className="mb-1 block text-sm text-muted">
                Sök media
              </label>
              <input
                id="board-search"
                value={boardSearch}
                onChange={(event) => setBoardSearch(event.target.value)}
                autoComplete="off"
                placeholder="Sök på namn…"
                className={`${inputClassName} w-full`}
              />
            </div>

            <div className="mt-3 flex max-h-[44svh] flex-wrap gap-2 overflow-y-auto pr-1">
              {filteredBoards.length === 0 ? (
                <p className="text-sm text-muted">Ingen media matchar sökningen.</p>
              ) : (
                filteredBoards.map((board) => {
                  const active = selected?.id === board.id;
                  return (
                    <Link
                      key={board.id}
                      href={`/tactics?boardId=${board.id}`}
                      className={`rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                        active ? "border-accent bg-accent text-black" : "border-border bg-panel-elevated text-foreground"
                      }`}
                    >
                      {board.name}
                    </Link>
                  );
                })
              )}
            </div>
          </Card>

          {selected ? (
            <Card className="max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl text-foreground">{selected.name}</h2>
                <form action={onDeleteBoard}>
                  <input type="hidden" name="boardId" value={selected.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Ta bort mediet "${selected.name}"?`}
                    pendingText="Tar bort…"
                    variant="secondary"
                    className="h-9 px-3 text-xs text-red-200 hover:bg-[#3a1f1f]"
                  >
                    Ta bort media
                  </ConfirmSubmitButton>
                </form>
              </div>

              <form action={onRenameBoard} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                <input type="hidden" name="boardId" value={selected.id} />
                <div>
                  <label htmlFor={`selected-name-${selected.id}`} className="mb-1 block text-sm text-muted">
                    Rubrik
                  </label>
                  <input
                    id={`selected-name-${selected.id}`}
                    name="name"
                    defaultValue={selected.name}
                    className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
                <FormSubmitButton pendingText="Sparar…" successText="Sparat" variant="secondary" className="h-10 self-end">
                  Spara rubrik
                </FormSubmitButton>
              </form>

              <form onSubmit={handleSaveMedia} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input type="hidden" name="boardId" value={selected.id} />
                <div>
                  <label htmlFor={`selected-image-url-${selected.id}`} className="mb-1 block text-sm text-muted">
                    Bild-URL
                  </label>
                  <input
                    id={`selected-image-url-${selected.id}`}
                    name="imageUrl"
                    defaultValue={selected.reference_image_url ?? ""}
                    autoComplete="off"
                    placeholder="https://…/bild.webp"
                    className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
                <div>
                  <label htmlFor={`selected-video-url-${selected.id}`} className="mb-1 block text-sm text-muted">
                    Video-URL (.mp4)
                  </label>
                  <input
                    id={`selected-video-url-${selected.id}`}
                    name="videoUrl"
                    defaultValue={selected.reference_video_url ?? ""}
                    autoComplete="off"
                    placeholder="https://…/video.mp4"
                    className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
                <div>
                  <label htmlFor={`selected-image-file-${selected.id}`} className="mb-1 block text-sm text-muted">
                    Ladda upp bild
                  </label>
                  <input id={`selected-image-file-${selected.id}`} name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
                </div>
                <div>
                  <label htmlFor={`selected-video-file-${selected.id}`} className="mb-1 block text-sm text-muted">
                    Ladda upp video (.mp4)
                  </label>
                  <input id={`selected-video-file-${selected.id}`} name="videoFile" type="file" accept="video/mp4" className="h-10 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
                </div>
                <Button type="submit" disabled={savingMedia} variant="secondary" className="md:col-span-2">
                  {savingMedia ? "Sparar media…" : "Spara media"}
                </Button>
                {uploadError ? <p aria-live="polite" className="text-sm text-red-300 md:col-span-2">{uploadError}</p> : null}
              </form>

              <form action={onSaveReferenceImage} className="mt-2">
                <input type="hidden" name="boardId" value={selected.id} />
                <input type="hidden" name="imageUrl" value="" />
                <input type="hidden" name="videoUrl" value="" />
                <ConfirmSubmitButton
                  confirmMessage={`Rensa bild och video för "${selected.name}"?`}
                  pendingText="Rensar…"
                  variant="ghost"
                  className="h-9 px-2 text-xs"
                >
                  Rensa bild och video
                </ConfirmSubmitButton>
              </form>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {selected.reference_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.reference_image_url}
                    alt={selected.name}
                    width={960}
                    height={540}
                    loading="lazy"
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
          ) : (
            <Card>
              <p className="text-sm text-muted">Välj media i biblioteket för att redigera innehållet.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
