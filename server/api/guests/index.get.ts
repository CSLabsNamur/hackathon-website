import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "guests.read");

  const supabase = serverSupabaseServiceRole(event);
  const guests = await prisma.guest.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return guests.map((guest) => ({
    ...guest,
    imageUrl: guest.imageUrl
      ? supabase.storage.from(GUESTS_BUCKET).getPublicUrl(guest.imageUrl).data.publicUrl
      : null,
  }));
});
