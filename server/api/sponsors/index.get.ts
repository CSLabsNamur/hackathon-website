import { serverSupabaseServiceRole } from "#supabase/server";
import { SPONSORS_BUCKET } from "#shared/utils/sponsorsFiles";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "sponsors.read");
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
