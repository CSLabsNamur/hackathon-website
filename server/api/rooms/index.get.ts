export default defineEventHandler(async (event) => {
  await requirePermission(event, "rooms.read");

  return prisma.room.findMany({include: {teams: true}, orderBy: {sequence: "asc"}});
});
