import schema from "#shared/schemas/rooms/edit";
import * as v from "valibot";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "rooms.update");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.room.update({where: {id}, data});
});
