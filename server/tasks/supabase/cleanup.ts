export default defineTask({
  meta: {
    name: "supabase:cleanup",
    description: "Retry pending Supabase storage and Auth deletions",
  },
  async run() {
    if (!await prisma.supabaseCleanupJob.count()) {
      return {result: {pending: 0}};
    }

    return {result: await processSupabaseCleanup(createSupabaseAdminClient())};
  },
});
