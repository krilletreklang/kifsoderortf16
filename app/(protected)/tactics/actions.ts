"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";
import { createBoardTemplate } from "@/lib/tactics/templates";
import type { BoardType } from "@/types/tactics";

const boardTypeSchema = z.enum(["7v7", "9v9", "training", "custom"]);

const createBoardSchema = z.object({
  name: z.string().min(2).max(80),
  boardType: boardTypeSchema,
  imageUrl: z.string().url().nullable(),
  videoUrl: z.string().url().nullable(),
});

const boardIdSchema = z.object({
  boardId: z.string().uuid(),
});

const renameBoardSchema = z.object({
  boardId: z.string().uuid(),
  name: z.string().min(2).max(80),
});

const saveBoardSchema = z.object({
  boardId: z.string().uuid(),
  boardType: boardTypeSchema,
  data: z.string().min(2),
});

const clearBoardSchema = z.object({
  boardId: z.string().uuid(),
  boardType: boardTypeSchema,
});

const saveReferenceImageSchema = z.object({
  boardId: z.string().uuid(),
  imageUrl: z.string().url().nullable(),
  videoUrl: z.string().url().nullable(),
});

const deleteBoardSchema = z.object({
  boardId: z.string().uuid(),
});

async function getMembership() {
  const user = await requireUser();
  return getPrimaryTeamMembership(user.id);
}

function normalizeName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadReferenceImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  folder: "images" | "videos",
  file: File,
) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExt = (ext || "bin").toLowerCase();
  const path = `${teamId}/tactics/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${sanitizeFileName(safeExt)}`;

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

export async function createBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = createBoardSchema.safeParse({
    name: normalizeName(formData.get("name")),
    boardType: String(formData.get("boardType") ?? "custom"),
    imageUrl: nullableString(formData.get("imageUrl")),
    videoUrl: nullableString(formData.get("videoUrl")),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const template = createBoardTemplate(parsed.data.boardType as BoardType);
  let imageUrl = parsed.data.imageUrl;
  let videoUrl = parsed.data.videoUrl;

  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
      const uploaded = await uploadReferenceImage(supabase, membership.team_id, "images", imageFile);
      if (uploaded) {
        imageUrl = uploaded;
      }
    }
  }

  const videoFile = formData.get("videoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    if (videoFile.type === "video/mp4") {
      const uploaded = await uploadReferenceImage(supabase, membership.team_id, "videos", videoFile);
      if (uploaded) {
        videoUrl = uploaded;
      }
    }
  }

  const { data } = await supabase
    .from("tactical_boards")
    .insert({
      team_id: membership.team_id,
      name: parsed.data.name,
      board_type: parsed.data.boardType,
      reference_image_url: imageUrl,
      reference_video_url: videoUrl,
      data: template,
    })
    .select("id")
    .maybeSingle();

  revalidatePath("/tactics");

  if (data?.id) {
    redirect(`/tactics?boardId=${data.id}`);
  }

  redirect("/tactics");
}

export async function renameBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = renameBoardSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
    name: normalizeName(formData.get("name")),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("tactical_boards")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id);

  revalidatePath("/tactics");
  redirect(`/tactics?boardId=${parsed.data.boardId}`);
}

export async function saveBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = saveBoardSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
    boardType: String(formData.get("boardType") ?? "custom"),
    data: String(formData.get("data") ?? "{}"),
  });

  if (!parsed.success) {
    return;
  }

  let boardData: unknown;
  try {
    boardData = JSON.parse(parsed.data.data);
  } catch {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("tactical_boards")
    .update({
      board_type: parsed.data.boardType,
      data: boardData,
    })
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id);

  revalidatePath("/tactics");
  redirect(`/tactics?boardId=${parsed.data.boardId}`);
}

export async function duplicateBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = boardIdSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const { data: source } = await supabase
    .from("tactical_boards")
    .select("name, board_type, data")
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!source) {
    return;
  }

  const { data: created } = await supabase
    .from("tactical_boards")
    .insert({
      team_id: membership.team_id,
      name: `${source.name} (kopia)`,
      board_type: source.board_type,
      data: source.data,
    })
    .select("id")
    .maybeSingle();

  revalidatePath("/tactics");
  if (created?.id) {
    redirect(`/tactics?boardId=${created.id}`);
  }
  redirect("/tactics");
}

export async function clearBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = clearBoardSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
    boardType: String(formData.get("boardType") ?? "custom"),
  });

  if (!parsed.success) {
    return;
  }

  const template = createBoardTemplate(parsed.data.boardType as BoardType);
  const supabase = await createClient();

  await supabase
    .from("tactical_boards")
    .update({ data: template })
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id);

  revalidatePath("/tactics");
  redirect(`/tactics?boardId=${parsed.data.boardId}`);
}

export async function saveReferenceImageAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = saveReferenceImageSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
    imageUrl: nullableString(formData.get("imageUrl")),
    videoUrl: nullableString(formData.get("videoUrl")),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  let imageUrl = parsed.data.imageUrl;
  let videoUrl = parsed.data.videoUrl;

  const imageFile = formData.get("imageFile");
  if (imageFile instanceof File && imageFile.size > 0) {
    if (["image/png", "image/jpeg", "image/webp"].includes(imageFile.type)) {
      const uploaded = await uploadReferenceImage(supabase, membership.team_id, "images", imageFile);
      if (uploaded) {
        imageUrl = uploaded;
      }
    }
  }

  const videoFile = formData.get("videoFile");
  if (videoFile instanceof File && videoFile.size > 0) {
    if (videoFile.type === "video/mp4") {
      const uploaded = await uploadReferenceImage(supabase, membership.team_id, "videos", videoFile);
      if (uploaded) {
        videoUrl = uploaded;
      }
    }
  }

  await supabase
    .from("tactical_boards")
    .update({ reference_image_url: imageUrl, reference_video_url: videoUrl })
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id);

  revalidatePath("/tactics");
  redirect(`/tactics?boardId=${parsed.data.boardId}`);
}

export async function deleteBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = deleteBoardSchema.safeParse({
    boardId: String(formData.get("boardId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("tactical_boards")
    .delete()
    .eq("id", parsed.data.boardId)
    .eq("team_id", membership.team_id);

  revalidatePath("/tactics");
  redirect("/tactics");
}
