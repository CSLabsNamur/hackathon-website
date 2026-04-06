import schema from "#shared/schemas/teams/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.update.own");

  const participant = await getParticipantForDbUser(dbUser);
  const team = participant.team;

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.update({
    where: {id: team?.id},
    data,
  });
});
