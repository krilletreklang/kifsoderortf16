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
      <input name="title" required placeholder="Titel" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-2" />
      <input name="category" required placeholder="Kategori" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="duration" type="number" min={1} max={120} placeholder="Minuter" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="playersMin" type="number" min={1} max={30} placeholder="Min spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="playersMax" type="number" min={1} max={30} placeholder="Max spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="equipment" placeholder="Material" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-5" />
      <input name="videoUrl" placeholder="Video-URL (.mp4)" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-3" />
      <input name="imageUrl" placeholder="Bild-URL (taktikbild)" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground md:col-span-3" />
      <input name="videoFile" type="file" accept="video/mp4" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground md:col-span-3" />
      <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground md:col-span-3" />
      <Button type="submit" disabled={submitting}>{submitting ? "Laddar upp..." : "Spara övning"}</Button>
      {error ? <p className="text-sm text-red-300 md:col-span-6">{error}</p> : null}
    </form>
  );
}
