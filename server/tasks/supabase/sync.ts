export default defineTask({
  meta: {
    name: "supabase:sync",
    description: "Retry pending Supabase Auth profile synchronization",
  },
  async run() {
    if (!await prisma.authSyncJob.count()) {
      return {result: {processed: 0, failed: 0, pending: 0}};
    }

    return {result: await processAuthSyncJobs(createSupabaseAdminClient())};
  },
});
