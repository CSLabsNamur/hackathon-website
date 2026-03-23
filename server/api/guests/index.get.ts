export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  return prisma.guest.findMany();
});
