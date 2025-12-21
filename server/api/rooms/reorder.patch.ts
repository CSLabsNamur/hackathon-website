import schema from "#shared/schemas/rooms/reorder";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = data.map((item, index) => ({id: item.id, teams: item.teams, sequence: index + 1}));

  return prisma.$transaction(async (tx) => {
    // First, bump all sequences by 1000 to avoid unique constraint conflicts
    await Promise.all(
      payload.map((item) => tx.room.update({
        where: {id: item.id},
        data: {
          sequence: item.sequence + 1000,
        },
      })),
    );

    // Then, set the correct sequences and teams
    await Promise.all(
      payload.map((item) => tx.room.update({
        where: {id: item.id},
        data: {
          teams: {
            set: item.teams.map((teamId) => ({id: teamId})),
          },
          sequence: item.sequence,
        },
      })),
    );
  });
});
