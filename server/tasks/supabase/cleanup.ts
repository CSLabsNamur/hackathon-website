import { createClient } from "@supabase/supabase-js";

export default defineTask({
  meta: {
    name: "supabase:cleanup",
    description: "Retry pending Supabase storage and Auth deletions",
  },
  async run() {
    if (!await prisma.supabaseCleanupJob.count()) {
      return {
        result: {
          pending: 0,
        },
      };
    }

    const config = useRuntimeConfig();

    const supabase = createClient(config.public.supabase.url, config.supabase.secretKey || config.supabase.serviceKey, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    return {
      result: await processSupabaseCleanup(supabase),
    };
  },
});
