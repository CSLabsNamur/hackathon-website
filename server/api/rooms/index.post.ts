import schema from "#shared/schemas/rooms/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  const lastSequence = await prisma.room.aggregate({
    _max: {
      sequence: true,
    },
  });

  const sequence = (lastSequence._max.sequence ?? 0) + 1;

  return prisma.room.create({data: {...data, sequence}});
});
