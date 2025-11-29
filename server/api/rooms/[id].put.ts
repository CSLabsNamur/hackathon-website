import schema from "#shared/schemas/rooms/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const id = getRouterParam(event, "id");

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.room.update({where: {id}, data});
});
