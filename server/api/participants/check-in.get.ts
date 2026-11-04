export default defineEventHandler(async (event) => {
  await requirePermission(event, "participants.check_in");

  return prisma.participant.findMany({
    select: {
      id: true,
      checkedInAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{user: {lastName: "asc"}}, {user: {firstName: "asc"}}, {id: "asc"}],
  });
});
