import schema from "#shared/schemas/rooms/reorder";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = data.map((item, index) => ({id: item.id, teams: item.teams, sequence: index + 1}));

  return prisma.$transaction(payload.map((item) => prisma.room.update({
    where: {id: item.id},
    data: {
      teams: {
        set: item.teams.map((teamId) => ({id: teamId})),
      },
      sequence: item.sequence,
    },
  })));
});
