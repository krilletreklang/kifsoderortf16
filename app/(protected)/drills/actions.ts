"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createDrillSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  duration: z.coerce.number().int().min(1).max(120).nullable(),
  playersMin: z.coerce.number().int().min(1).max(30).nullable(),
  playersMax: z.coerce.number().int().min(1).max(30).nullable(),
  equipment: z.string().nullable(),
  videoUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
});

const deleteDrillSchema = z.object({
  drillId: z.string().uuid(),
});

const updateDrillSchema = z.object({
  drillId: z.string().uuid(),
  title: z.string().min(2),
  category: z.string().min(2),
  duration: z.coerce.number().int().min(1).max(120).nullable(),
  playersMin: z.coerce.number().int().min(1).max(30).nullable(),
  playersMax: z.coerce.number().int().min(1).max(30).nullable(),
  equipment: z.string().nullable(),
  description: z.string().nullable(),
  coachingPoints: z.string().nullable(),
  videoUrl: z.string().url().nullable(),
  imageUrl: z.string().url().nullable(),
});

function nullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadTeamMediaFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  folder: "drills/videos" | "drills/images",
  file: File,
) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExt = (ext || "bin").toLowerCase();
  const path = `${teamId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sanitizeFileName(safeExt)}`;

  const { error } = await supabase.storage.from("team-media").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    return null;
  }

  const { data } = supabase.storage.from("team-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function createDrillAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = createDrillSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    duration: nullableNumber(formData.get("duration")),
    playersMin: nullableNumber(formData.get("playersMin")),
    playersMax: nullableNumber(formData.get("playersMax")),
    equipment: nullableString(formData.get("equipment")),
    videoUrl: nullableString(formData.get("videoUrl")),
    imageUrl: nullableString(formData.get("imageUrl")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  let videoUrl = parsed.data.videoUrl;
  let imageUrl = parsed.data.imageUrl;

  const videoFile = formData.get("videoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    if (videoFile.type === "video/mp4") {
      const uploaded = await uploadTeamMediaFile(supabase, membership.team_id, "drills/videos", videoFile);
      if (uploaded) {
        videoUrl = uploaded;
      }
    }
  }

  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
      const uploaded = await uploadTeamMediaFile(supabase, membership.team_id, "drills/images", imageFile);
      if (uploaded) {
        imageUrl = uploaded;
      }
    }
  }

  await supabase.from("drills").insert({
    team_id: membership.team_id,
    title: parsed.data.title,
    category: parsed.data.category,
    duration: parsed.data.duration,
    players_min: parsed.data.playersMin,
    players_max: parsed.data.playersMax,
    equipment: parsed.data.equipment,
    video_url: videoUrl,
    image_url: imageUrl,
  });

  revalidatePath("/drills");
}

export async function deleteDrillAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deleteDrillSchema.safeParse({
    drillId: String(formData.get("drillId") ?? ""),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("drills")
    .delete()
    .eq("id", parsed.data.drillId)
    .eq("team_id", membership.team_id);

  revalidatePath("/drills");
}

export async function updateDrillAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = updateDrillSchema.safeParse({
    drillId: String(formData.get("drillId") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    duration: nullableNumber(formData.get("duration")),
    playersMin: nullableNumber(formData.get("playersMin")),
    playersMax: nullableNumber(formData.get("playersMax")),
    equipment: nullableString(formData.get("equipment")),
    description: nullableString(formData.get("description")),
    coachingPoints: nullableString(formData.get("coachingPoints")),
    videoUrl: nullableString(formData.get("videoUrl")),
    imageUrl: nullableString(formData.get("imageUrl")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();

  await supabase
    .from("drills")
    .update({
      title: parsed.data.title,
      category: parsed.data.category,
      duration: parsed.data.duration,
      players_min: parsed.data.playersMin,
      players_max: parsed.data.playersMax,
      equipment: parsed.data.equipment,
      description: parsed.data.description,
      coaching_points: parsed.data.coachingPoints,
      video_url: parsed.data.videoUrl,
      image_url: parsed.data.imageUrl,
    })
    .eq("id", parsed.data.drillId)
    .eq("team_id", membership.team_id);

  revalidatePath("/drills");
  revalidatePath(`/drills/${parsed.data.drillId}`);
}
