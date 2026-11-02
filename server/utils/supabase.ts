import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const config = useRuntimeConfig();
  return createClient(config.public.supabase.url, config.supabase.secretKey || config.supabase.serviceKey, {
    auth: {persistSession: false, autoRefreshToken: false},
    global: {
      fetch: (url, options) => fetch(url, {...options, signal: AbortSignal.timeout(15000)}),
    },
  });
}
