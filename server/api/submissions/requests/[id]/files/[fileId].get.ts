import * as v from "valibot";
import { submissionFileParamsSchema } from "#shared/schemas/submissions/files/params";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "submissions.read.own");
  const {id, fileId} = await getValidatedRouterParams(event, v.parser(submissionFileParamsSchema));

  const file = await prisma.submissionFile.findFirst({
    where: {
      id: fileId,
      bucket: SUBMISSIONS_BUCKET,
      submission: {
        requestId: id,
        skipped: false,
        OR: [
          {
            request: {type: SubmissionType.FILE, teamRequest: false},
            participant: {userId: dbUser.id},
          },
          {
            request: {type: SubmissionType.FILE, teamRequest: true},
            participant: {team: {members: {some: {userId: dbUser.id}}}},
          },
        ],
      },
    },
    select: {path: true},
  });
  if (!file) throw createError({statusCode: 404, statusMessage: "Fichier introuvable."});

  const supabase = serverSupabaseServiceRole(event);
  const {data, error} = await supabase.storage.from(SUBMISSIONS_BUCKET).download(file.path);
  if (error || !data) {
    throw createError({statusCode: 502, statusMessage: "Impossible de télécharger le fichier."});
  }

  setResponseHeaders(event, {
    "Cache-Control": "private, no-store",
    "Content-Disposition": "attachment",
    "Content-Type": "application/octet-stream",
  });
  return sendStream(event, data.stream());
});
