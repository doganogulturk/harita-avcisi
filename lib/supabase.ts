import { createClient } from "@supabase/supabase-js";

/** Tabloların, view'lerin ve fonksiyonların durduğu şema (supabase/schema.sql). */
export const SUPABASE_SCHEMA = "do_harita_avcisi";

function createGameClient(url: string, publishableKey: string) {
  return createClient(url, publishableKey, { db: { schema: SUPABASE_SCHEMA } });
}

let client: ReturnType<typeof createGameClient> | undefined;

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  client ??= createGameClient(url, publishableKey);
  return client;
}
