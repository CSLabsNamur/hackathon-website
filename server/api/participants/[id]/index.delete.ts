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

  if (!participant.user.supabaseAuthId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Le compte d'authentification du participant n'est pas lié correctement.",
    });
  }

  const submissionFilePaths = participant.submissions.flatMap((submission) => submission.files.map((file) => file.path));

  // Delete any submission files
  if (submissionFilePaths.length > 0) {
    const res = await supabase.storage.from(SUBMISSIONS_BUCKET).remove(submissionFilePaths);
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

  try {
    await prisma.$transaction([
      prisma.submission.deleteMany({
        where: {
          participantId: participant.id,
        },
      }),
      prisma.user.delete({where: {id: participant.userId}}),
    ]);
  } catch (e) {
    console.error("Erreur lors de la suppression du participant et de l'utilisateur:", e);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la suppression du participant.",
    });
  }

  // Delete the user from Supabase Auth
  const res = await supabase.auth.admin.deleteUser(participant.user.supabaseAuthId);
  if (res.error) {
    console.error("Erreur lors de la suppression de l'utilisateur dans Supabase Auth:", res.error);
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de la suppression de l'utilisateur.",
    });
  }

  return {success: true, message: "Participant supprimé avec succès."};
});
