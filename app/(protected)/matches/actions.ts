"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPrimaryTeamMembership } from "@/lib/db/queries/teams";
import { createClient } from "@/lib/supabase/server";

const createMatchSchema = z.object({
  date: z.string().min(10),
  startTime: z.string().min(4),
  opponent: z.string().min(2),
  homeAway: z.enum(["home", "away"]),
  location: z.string().nullable(),
  matchType: z.string().min(2),
  notes: z.string().nullable(),
});

const toggleSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  value: z.enum(["true", "false"]),
});

const minutesSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  minutes: z.coerce.number().int().min(0).max(120),
});

const resultSchema = z.object({
  matchId: z.string().uuid(),
  goalsFor: z.coerce.number().int().min(0).nullable(),
  goalsAgainst: z.coerce.number().int().min(0).nullable(),
  status: z.enum(["planned", "completed", "cancelled"]),
});

const deleteMatchSchema = z.object({
  matchId: z.string().uuid(),
});

const greenCardSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid().nullable(),
});

function nullableString(value: FormDataEntryValue | null): string | null {
  if (!value) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function nullableNumber(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

async function getMembership() {
  const user = await requireUser();
  return getPrimaryTeamMembership(user.id);
}

async function ensureMatchRow(
  matchId: string,
  playerId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data } = await supabase
    .from("match_players")
    .select("id")
    .eq("match_id", matchId)
    .eq("player_id", playerId)
    .maybeSingle();

  if (!data) {
    await supabase.from("match_players").insert({
      match_id: matchId,
      player_id: playerId,
      called_up: false,
      participated: false,
      starter: false,
      minutes_played: 0,
    });
  }
}

export async function createMatchAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const normalizedTime = normalizeTimeInput(formData.get("startTime"));
  if (!normalizedTime) {
    redirect("/matches?error=invalid_time");
  }

  const parsed = createMatchSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    startTime: normalizedTime,
    opponent: String(formData.get("opponent") ?? "").trim(),
    homeAway: String(formData.get("homeAway") ?? "home"),
    location: nullableString(formData.get("location")),
    matchType: String(formData.get("matchType") ?? "friendly").trim(),
    notes: nullableString(formData.get("notes")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("matches").insert({
    team_id: membership.team_id,
    date: parsed.data.date,
    start_time: parsed.data.startTime,
    opponent: parsed.data.opponent,
    home_away: parsed.data.homeAway,
    location: parsed.data.location,
    match_type: parsed.data.matchType,
    notes: parsed.data.notes,
    status: "planned",
  });

  revalidatePath("/matches");
  revalidatePath("/");
  redirect("/matches");
}

export async function toggleCalledUpAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = toggleSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
    value: String(formData.get("value") ?? "false"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await ensureMatchRow(parsed.data.matchId, parsed.data.playerId, supabase);

  const calledUp = parsed.data.value === "true";
  await supabase
    .from("match_players")
    .update({ called_up: calledUp, starter: calledUp ? undefined : false })
    .eq("match_id", parsed.data.matchId)
    .eq("player_id", parsed.data.playerId);

  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/matches");
}

export async function toggleStarterAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = toggleSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
    value: String(formData.get("value") ?? "false"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await ensureMatchRow(parsed.data.matchId, parsed.data.playerId, supabase);

  const starter = parsed.data.value === "true";
  await supabase
    .from("match_players")
    .update({ starter, called_up: starter ? true : undefined })
    .eq("match_id", parsed.data.matchId)
    .eq("player_id", parsed.data.playerId);

  revalidatePath(`/matches/${parsed.data.matchId}`);
}

export async function toggleParticipatedAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = toggleSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
    value: String(formData.get("value") ?? "false"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await ensureMatchRow(parsed.data.matchId, parsed.data.playerId, supabase);

  const participated = parsed.data.value === "true";
  await supabase
    .from("match_players")
    .update({ participated, called_up: participated ? true : undefined })
    .eq("match_id", parsed.data.matchId)
    .eq("player_id", parsed.data.playerId);

  revalidatePath(`/matches/${parsed.data.matchId}`);
}

export async function setMinutesAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = minutesSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    playerId: String(formData.get("playerId") ?? ""),
    minutes: String(formData.get("minutes") ?? "0"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await ensureMatchRow(parsed.data.matchId, parsed.data.playerId, supabase);

  await supabase
    .from("match_players")
    .update({ minutes_played: parsed.data.minutes, called_up: true, participated: parsed.data.minutes > 0 })
    .eq("match_id", parsed.data.matchId)
    .eq("player_id", parsed.data.playerId);

  revalidatePath(`/matches/${parsed.data.matchId}`);
}

export async function saveResultAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = resultSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    goalsFor: nullableNumber(formData.get("goalsFor")),
    goalsAgainst: nullableNumber(formData.get("goalsAgainst")),
    status: String(formData.get("status") ?? "planned"),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("matches")
    .update({
      goals_for: parsed.data.goalsFor,
      goals_against: parsed.data.goalsAgainst,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.matchId)
    .eq("team_id", membership.team_id);

  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/matches");
  revalidatePath("/");
}

export async function deleteMatchAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = deleteMatchSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
  });

  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("matches")
    .delete()
    .eq("id", parsed.data.matchId)
    .eq("team_id", membership.team_id);

  revalidatePath("/matches");
  revalidatePath("/");
}

export async function saveGreenCardAction(formData: FormData) {
  const membership = await getMembership();
  if (!membership) return;

  const parsed = greenCardSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    playerId: nullableString(formData.get("playerId")),
  });

  if (!parsed.success) return;

  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("id", parsed.data.matchId)
    .eq("team_id", membership.team_id)
    .maybeSingle();

  if (!match) return;

  if (!parsed.data.playerId) {
    await supabase.from("match_green_cards").delete().eq("match_id", parsed.data.matchId);
  } else {
    const { data: player } = await supabase
      .from("players")
      .select("id")
      .eq("id", parsed.data.playerId)
      .eq("team_id", membership.team_id)
      .maybeSingle();

    if (!player) return;

    await supabase.from("match_green_cards").upsert(
      {
        match_id: parsed.data.matchId,
        player_id: parsed.data.playerId,
      },
      { onConflict: "match_id" },
    );
  }

  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/statistics");
}
