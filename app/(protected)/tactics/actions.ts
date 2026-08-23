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

async function getMembership() {
  const user = await requireUser();
  return getPrimaryTeamMembership(user.id);
}

function normalizeName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createBoardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = createBoardSchema.safeParse({
    name: normalizeName(formData.get("name")),
    boardType: String(formData.get("boardType") ?? "custom"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const template = createBoardTemplate(parsed.data.boardType as BoardType);

  const { data } = await supabase
    .from("tactical_boards")
    .insert({
      team_id: membership.team_id,
      name: parsed.data.name,
      board_type: parsed.data.boardType,
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
