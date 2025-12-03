export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  return prisma.admin.findMany({
    include: {
      user: true,
    },
  });
});
