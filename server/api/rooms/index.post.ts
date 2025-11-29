import schema from "#shared/schemas/rooms/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.room.create({data});
});
