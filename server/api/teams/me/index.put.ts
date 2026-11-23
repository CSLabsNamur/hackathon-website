import schema from "#shared/schemas/teams/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.update.own");

  const data = await readValidatedBody(event, v.parser(schema));

  return updateOwnTeam(dbUser.id, data);
});
