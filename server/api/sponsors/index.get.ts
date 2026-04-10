import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event);
  const sponsors = await prisma.sponsor.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return sponsors.map((sponsor) => ({
    ...sponsor,
    logo: supabase.storage.from(SPONSORS_BUCKET).getPublicUrl(sponsor.logo).data.publicUrl,
  }));
});
