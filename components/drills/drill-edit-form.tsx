"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadTeamMediaFromBrowser } from "@/lib/media/upload-client";

interface DrillEditFormProps {
  teamId: string;
  drill: {
    id: string;
    title: string;
    category: string;
    duration: number | null;
    players_min: number | null;
    players_max: number | null;
    equipment: string | null;
    description: string | null;
    coaching_points: string | null;
    image_url: string | null;
    video_url: string | null;
  };
  onUpdateDrill: (formData: FormData) => Promise<void>;
}

export function DrillEditForm({ teamId, drill, onUpdateDrill }: DrillEditFormProps) {
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

      await onUpdateDrill(formData);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Kunde inte uppdatera övningen.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <input type="hidden" name="drillId" value={drill.id} />
      <input name="title" required defaultValue={drill.title} placeholder="Titel" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="category" required defaultValue={drill.category} placeholder="Kategori" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="duration" type="number" min={1} max={120} defaultValue={drill.duration ?? ""} placeholder="Minuter" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="playersMin" type="number" min={1} max={30} defaultValue={drill.players_min ?? ""} placeholder="Min spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="playersMax" type="number" min={1} max={30} defaultValue={drill.players_max ?? ""} placeholder="Max spelare" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="equipment" defaultValue={drill.equipment ?? ""} placeholder="Material" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="imageUrl" defaultValue={drill.image_url ?? ""} placeholder="Bild-URL" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <input name="videoUrl" defaultValue={drill.video_url ?? ""} placeholder="Video-URL (.mp4)" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 text-foreground" />
      <textarea name="description" defaultValue={drill.description ?? ""} placeholder="Beskrivning" className="min-h-28 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground md:col-span-2" />
      <textarea name="coachingPoints" defaultValue={drill.coaching_points ?? ""} placeholder="Coaching points" className="min-h-28 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground md:col-span-2" />
      <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground" />
      <input name="videoFile" type="file" accept="video/mp4" className="h-11 rounded-lg border border-border bg-panel-elevated px-3 py-2 text-foreground" />
      <Button type="submit" disabled={submitting} className="md:col-span-2">{submitting ? "Sparar..." : "Spara ändringar"}</Button>
      {error ? <p className="text-sm text-red-300 md:col-span-2">{error}</p> : null}
    </form>
  );
}
