import { createSubmissionRequestSchema } from "#shared/schemas/submissions/requests/edit";
import * as v from "valibot";
import { SubmissionType } from "~~/server/prisma/generated/prisma/enums";


export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);
  const id = getRouterParam(event, "id");

  // Get runtime config from event context (server-side)
  const config = useRuntimeConfig(event);
  const schema = createSubmissionRequestSchema(config.public.eventDateStart, config.public.eventDateEnd);

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
    type: data.type === "files" ? SubmissionType.FILE : SubmissionType.TEXT,
    multiple: data.type === "files",
  };

  return prisma.submissionRequest.update({where: {id}, data: payload});
});
