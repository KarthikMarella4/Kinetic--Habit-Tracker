import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/**
 * Create a Supabase client configured with the workspace header for RLS scoping.
 * Returns null if Supabase env vars are not configured.
 */
export function createSupabaseClient(workspaceId?: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  const headers: Record<string, string> = {};
  if (workspaceId && workspaceId.trim().length >= 6) {
    headers["x-workspace-id"] = workspaceId.trim();
  }

  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers,
    },
  });
}

/**
 * Extract and validate the workspace key from incoming API requests.
 */
export function getRequestWorkspaceId(headers: Headers): string | null {
  const raw = headers.get("x-workspace-id")?.trim();
  if (!raw || raw.length < 6) return null;
  return raw;
}
