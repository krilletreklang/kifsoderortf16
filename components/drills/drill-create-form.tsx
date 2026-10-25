"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadTeamMediaFromBrowser } from "@/lib/media/upload-client";

interface DrillCreateFormProps {
  teamId: string;
  onCreateDrill: (formData: FormData) => Promise<void>;
}

export function DrillCreateForm({ teamId, onCreateDrill }: DrillCreateFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);

      const imageFile = formData.get("imageFile");
      if (imageFile instanceof File && imageFile.size > 0) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
          throw new Error("Bild måste vara PNG, JPG eller WEBP.");
        }
        const imageUrl = await uploadTeamMediaFromBrowser(teamId, "drills/images", imageFile);
        formData.set("imageUrl", imageUrl);
      }

      const videoFile = formData.get("videoFile");
      if (videoFile instanceof File && videoFile.size > 0) {
        if (videoFile.type !== "video/mp4") {
          throw new Error("Video måste vara .mp4.");
        }
        const videoUrl = await uploadTeamMediaFromBrowser(teamId, "drills/videos", videoFile);
        formData.set("videoUrl", videoUrl);
      }

      formData.delete("imageFile");
      formData.delete("videoFile");

      await onCreateDrill(formData);
      event.currentTarget.reset();
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Kunde inte ladda upp media.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
      <div className="md:col-span-2">
        <label htmlFor="drill-title" className="mb-1 block text-sm text-muted">
          Titel
        </label>
        <input id="drill-title" name="title" required autoComplete="off" placeholder="Kvadraten…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div>
        <label htmlFor="drill-category" className="mb-1 block text-sm text-muted">
          Kategori
        </label>
        <input id="drill-category" name="category" required autoComplete="off" placeholder="Passningsspel…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div>
        <label htmlFor="drill-duration" className="mb-1 block text-sm text-muted">
          Minuter
        </label>
        <input id="drill-duration" name="duration" type="number" inputMode="numeric" min={1} max={120} placeholder="10…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div>
        <label htmlFor="drill-players-min" className="mb-1 block text-sm text-muted">
          Min spelare
        </label>
        <input id="drill-players-min" name="playersMin" type="number" inputMode="numeric" min={1} max={30} placeholder="5…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div>
        <label htmlFor="drill-players-max" className="mb-1 block text-sm text-muted">
          Max spelare
        </label>
        <input id="drill-players-max" name="playersMax" type="number" inputMode="numeric" min={1} max={30} placeholder="12…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div className="md:col-span-5">
        <label htmlFor="drill-equipment" className="mb-1 block text-sm text-muted">
          Material
        </label>
        <input id="drill-equipment" name="equipment" autoComplete="off" placeholder="Koner & västar…" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div className="md:col-span-3">
        <label htmlFor="drill-video-url" className="mb-1 block text-sm text-muted">
          Video-URL (.mp4)
        </label>
        <input id="drill-video-url" name="videoUrl" autoComplete="off" placeholder="https://…/video.mp4" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div className="md:col-span-3">
        <label htmlFor="drill-image-url" className="mb-1 block text-sm text-muted">
          Bild-URL
        </label>
        <input id="drill-image-url" name="imageUrl" autoComplete="off" placeholder="https://…/bild.webp" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div className="md:col-span-3">
        <label htmlFor="drill-video-file" className="mb-1 block text-sm text-muted">
          Ladda upp video (.mp4)
        </label>
        <input id="drill-video-file" name="videoFile" type="file" accept="video/mp4" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <div className="md:col-span-3">
        <label htmlFor="drill-image-file" className="mb-1 block text-sm text-muted">
          Ladda upp bild
        </label>
        <input id="drill-image-file" name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-11 w-full rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" />
      </div>
      <Button type="submit" disabled={submitting} className="md:col-span-2 md:justify-self-start">
        {submitting ? "Laddar upp…" : "Spara övning"}
      </Button>
      {error ? <p aria-live="polite" className="text-sm text-red-300 md:col-span-6">{error}</p> : null}
    </form>
  );
}
