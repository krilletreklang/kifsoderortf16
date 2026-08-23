"use server";

import { revalidatePath } from "next/cache";
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

  const parsed = createMatchSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
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
