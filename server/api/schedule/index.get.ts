export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN | UserRole.USER);

  return prisma.scheduleItem.findMany();
});
