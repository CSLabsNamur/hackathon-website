import * as v from "valibot";
import schema from "~~/shared/schemas/submissions/create";
import idParamSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const id = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const dbUser = await getDbUser(user);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
    content: data.content ?? null,
    request: {connect: {id}},
    participant: {connect: {userId: dbUser.id}},
  };

  return prisma.submission.upsert({
    where: {
      requestId_participantId: {
        requestId: id,
        participantId: dbUser.id,
      },
    },
    create: payload,
    update: payload,
  });
});
