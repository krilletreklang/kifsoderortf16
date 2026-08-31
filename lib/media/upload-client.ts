"use client";

import { createClient } from "@/lib/supabase/client";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadTeamMediaFromBrowser(
  teamId: string,
  folder: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeExt = sanitizeFileName((ext || "bin").toLowerCase());
  const path = `${teamId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const { error } = await supabase.storage.from("team-media").upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) {
    throw new Error(error.message || "Upload failed");
  }

  const { data } = supabase.storage.from("team-media").getPublicUrl(path);
  return data.publicUrl;
}
