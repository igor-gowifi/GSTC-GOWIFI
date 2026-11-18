import { createClient, type User } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSupabaseUserName(user: User): string {
  const names = [user.user_metadata?.name, user.user_metadata?.full_name, user.email];
  return names.find((name): name is string => typeof name === "string" && name.trim().length > 0)?.trim() || "";
}
