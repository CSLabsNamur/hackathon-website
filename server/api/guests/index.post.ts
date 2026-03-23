import * as v from "valibot";
import schema from "#shared/schemas/guests/create";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.guest.create({data});
});
