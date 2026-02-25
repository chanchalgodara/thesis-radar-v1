import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(url?: string, key?: string): SupabaseClient {
  if (_client) return _client;
  const supabaseUrl = url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = key || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  _client = createClient(supabaseUrl, supabaseKey);
  return _client;
}

export function initSupabase(url: string, key: string): SupabaseClient {
  _client = createClient(url, key);
  return _client;
}
