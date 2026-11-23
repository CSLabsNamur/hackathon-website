import * as v from "valibot";
import idSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.delete.own");
  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  await disbandOwnTeam(dbUser.id, id);
  return {success: true};
});
