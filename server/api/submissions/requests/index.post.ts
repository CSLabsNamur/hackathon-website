import { createSubmissionRequestSchema } from "#shared/schemas/submissions/requests/create";
import * as v from "valibot";
import type { SubmissionRequestCreateInput } from "~~/server/prisma/generated/prisma/models/SubmissionRequest";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const schema = createSubmissionRequestSchema(
    useRuntimeConfig(event).public.eventDateStart,
    useRuntimeConfig(event).public.eventDateEnd,
  );

  const data = await readValidatedBody(event, v.parser(schema));

  const payload: SubmissionRequestCreateInput = {
    type: data.type === "text" ? SubmissionType.TEXT : SubmissionType.FILE,
    multiple: data.type === "files",
    title: data.title,
    description: data.description,
    deadline: new Date(data.deadline),
    acceptedFormats: data.acceptedFormats,
    required: data.required ?? false,
  };

  return prisma.submissionRequest.create({data: payload});
});
