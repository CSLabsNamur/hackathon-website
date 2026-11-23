import * as v from "valibot";
import schema from "#shared/schemas/teams/join";

/**
 * Join a team as the current user.
 */
export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.join");

  const data = await readValidatedBody(event, v.parser(schema));

  return joinTeam(dbUser.id, data.token);
});
