import schema from "#shared/schemas/teams/create";
import * as v from "valibot";
import { Prisma } from "~~/server/prisma/generated/prisma/browser";

/**
 * Create a new team and associate the current user as a member.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  const dbUser = await getDbUser(user);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload: Prisma.TeamCreateInput = {
    ...data,
    members: {
      connect: {
        userId: dbUser.id,
      },
    },
  };

  return prisma.team.create({data: payload});
});
