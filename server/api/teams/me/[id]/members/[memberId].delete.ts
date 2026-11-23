import * as v from "valibot";
import idSchema from "#shared/schemas/id";

const paramsSchema = v.object({...idSchema.entries, memberId: idSchema.entries.id});

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "teams.members.remove.own");
  const {id, memberId} = await getValidatedRouterParams(event, v.parser(paramsSchema));

  await removeOwnTeamMember(dbUser.id, id, memberId);
  return {success: true};
});
