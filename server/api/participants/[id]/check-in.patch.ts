import * as v from "valibot";
import schema from "#shared/schemas/participants/checkIn";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "participants.check_in");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));
  const {checkedIn} = await readValidatedBody(event, v.parser(schema));

  return setParticipantCheckIn(id, checkedIn);
});
