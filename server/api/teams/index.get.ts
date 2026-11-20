export default defineEventHandler(async (event) => {
  await requirePermission(event, "teams.read");

  if (getQuery(event).view === "admin") {
    await requireOrganizerAccess(event);
    return prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            caution: true,
            user: {select: {id: true, firstName: true, lastName: true}},
          },
        },
        room: true,
      },
    });
  }

  return prisma.team.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      room: {select: {name: true}},
      members: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });
});
