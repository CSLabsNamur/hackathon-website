import schema from "#shared/schemas/schedule/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.scheduleItem.create({data});
});
