import { editSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const id = getRouterParam(event, "id");

  // Get runtime config from event context (server-side)
  const config = useRuntimeConfig(event);
  const schema = editSubmissionRequestSchema(config.public.eventDateStart, config.public.eventDateEnd);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
  };

  return prisma.submissionRequest.update({where: {id}, data: payload});
});
