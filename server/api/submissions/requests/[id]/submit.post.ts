import * as v from "valibot";
import schema from "~~/shared/schemas/submissions/create";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const id = getRouterParam(event, "id")!;

  const dbUser = await getDbUser(user);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
    content: data.content ?? null,
    request: {connect: {id}},
    participant: {connect: {userId: dbUser.id}},
  };

  return prisma.submission.create({data: payload});
});
