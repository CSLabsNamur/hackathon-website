import schema from "#shared/schemas/teams/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const userTeam = await prisma.participant.findUnique({where: {id: user.sub}}).team();

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.update({
    where: {id: userTeam?.id},
    data,
  });
});
