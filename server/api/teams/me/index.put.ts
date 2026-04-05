import schema from "#shared/schemas/teams/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {user} = await requirePermission(event, "teams.update.own");

  const participant = await getParticipant(user);
  const team = participant.team;

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.update({
    where: {id: team?.id},
    data,
  });
});
