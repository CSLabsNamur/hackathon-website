import * as v from "valibot";
import schema from "#shared/schemas/teams/join";

/**
 * Join a team as the current user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  const dbUser = await getDbUser(user);

  const data = await readValidatedBody(event, v.parser(schema));

  return prisma.team.update({
    where: {token: data.token},
    data: {
      members: {
        connect: {
          userId: dbUser.id,
        },
      },
    },
  });
});
