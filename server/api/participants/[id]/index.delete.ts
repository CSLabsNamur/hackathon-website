import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { CautionStatus } from "#server/prisma/generated/prisma/enums";
import { isSuperAdmin } from "#server/utils/ability";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const supabase = serverSupabaseServiceRole(event);

  const participant = await prisma.participant.findUnique({
    where: {id},
    include: {
      user: true,
      submissions: {
        include: {
          files: true,
          request: true,
        },
      },
    },
  });

  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable."});
  }

  if (participant.caution === CautionStatus.PAID && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Impossible de supprimer un participant dont la caution est payée sans le rôle super administrateur.",
    });
  }

  try {
    await prisma.$transaction([
      prisma.participant.delete({where: {id}}),
      prisma.user.delete({where: {id: participant.userId}}),
    ]);
  } catch (e) {
    console.error("Erreur lors de la suppression du participant et de l'utilisateur:", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la suppression du participant.",
    });
  }

  // Delete any submission files
  for (const submission of participant.submissions.filter(s => s.request.type === SubmissionType.FILE)) {
    const res = await supabase.storage.from("submissions").remove(submission.files.map(f => f.path));
    if (res.error) {
      console.error("Erreur lors de la suppression des fichiers de soumission:", res.error);
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la suppression des fichiers de soumission.",
      });
    }
  }

  // Delete any CV files
  if (participant.curriculumVitae) {
    const res = await supabase.storage.from("cvs").remove([participant.curriculumVitae]);
    if (res.error) {
      console.error("Erreur lors de la suppression du CV:", res.error);
      throw createError({
        statusCode: 500,
        statusMessage: "Erreur lors de la suppression du CV.",
      });
    }
  }

  // Delete the user from Supabase Auth
  const authUser = await getAuthUser(event, participant.user.email);
  const res = await supabase.auth.admin.deleteUser(authUser.id);
  if (res.error) {
    console.error("Erreur lors de la suppression de l'utilisateur dans Supabase Auth:", res.error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la suppression de l'utilisateur.",
    });
  }

  return {success: true, message: "Participant supprimé avec succès."};
});
