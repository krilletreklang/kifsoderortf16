"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createTrainingSchema = z.object({
  date: z.string().min(10),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  location: z.string().nullable(),
  theme: z.string().nullable(),
  notes: z.string().nullable(),
});

const setAttendanceSchema = z.object({
  trainingId: z.string().uuid(),
  playerId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "unknown"]),
});

const setAllAttendanceSchema = z.object({
  trainingId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "unknown"]),
});

const deleteTrainingSchema = z.object({
  trainingId: z.string().uuid(),
});

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeTimeInput(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "")
    .trim()
    .replace(".", ":")
    .replace("：", ":");

  const match = /^(\d{1,2}):([0-5]\d)$/.exec(raw);
  if (!match) return null;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null;

  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export async function createTrainingAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const normalizedStart = normalizeTimeInput(formData.get("startTime"));
  const normalizedEnd = normalizeTimeInput(formData.get("endTime"));

  if (!normalizedStart || !normalizedEnd) {
    redirect("/trainings?error=invalid_time");
  }

  if (normalizedEnd <= normalizedStart) {
    redirect("/trainings?error=end_before_start");
  }

  const parsed = createTrainingSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    startTime: normalizedStart,
    endTime: normalizedEnd,
    location: nullableString(formData.get("location")),
    theme: nullableString(formData.get("theme")),
    notes: nullableString(formData.get("notes")),
  });

  if (!parsed.success) {
    redirect("/trainings?error=invalid_training");
    return;
  }

  const supabase = await createClient();
  await supabase.from("trainings").insert({
    team_id: membership.team_id,
    date: parsed.data.date,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    location: parsed.data.location,
    theme: parsed.data.theme,
    notes: parsed.data.notes,
  });

  revalidatePath("/trainings");
  revalidatePath("/");
  redirect("/trainings");
}

export async function setAttendanceAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = setAttendanceSchema.safeParse({
    trainingId: String(formData.get("trainingId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
    status: String(formData.get("status") ?? "unknown"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();

  const { data: training } = await supabase
    .from("trainings")
    .select("id")
    .eq("id", parsed.data.trainingId)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!training) {
    return;
  }

  await supabase.from("training_attendance").upsert(
    {
      training_id: parsed.data.trainingId,
      player_id: parsed.data.playerId,
      status: parsed.data.status,
    },
    { onConflict: "training_id,player_id" },
  );

  revalidatePath("/trainings");
  revalidatePath("/");
}

export async function markAllPresentAction(formData: FormData) {
  formData.set("status", "present");
  return setAllAttendanceStatusAction(formData);
}

export async function setAllAttendanceStatusAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = setAllAttendanceSchema.safeParse({
    trainingId: String(formData.get("trainingId") ?? ""),
    status: String(formData.get("status") ?? "present"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();

  const { data: training } = await supabase
    .from("trainings")
    .select("id")
    .eq("id", parsed.data.trainingId)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!training) {
    return;
  }

  const { data: players } = await supabase.from("players").select("id").eq("team_id", membership.team_id).eq("active", true);

  if (!players || players.length === 0) {
    return;
  }

  await supabase.from("training_attendance").upsert(
    players.map((player) => ({
      training_id: parsed.data.trainingId,
      player_id: player.id,
      status: parsed.data.status,
    })),
    { onConflict: "training_id,player_id" },
  );

  revalidatePath("/trainings");
  revalidatePath("/");
}

export async function deleteTrainingAction(formData: FormData) {
  const user = await requireUser();
  const membership = await getPrimaryTeamMembership(user.id);
  if (!membership) return;

  const parsed = deleteTrainingSchema.safeParse({
    trainingId: String(formData.get("trainingId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("trainings")
    .delete()
    .eq("id", parsed.data.trainingId)
    .eq("team_id", membership.team_id);

  revalidatePath("/trainings");
  revalidatePath("/");
}
