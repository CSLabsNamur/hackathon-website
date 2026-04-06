import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import idParamSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";
import { getAuthUser } from "#server/utils/auth";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "participants.update.sensitive");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const {firstName, lastName, email, ...data} = await readValidatedBody(event, v.parser(schema));
  const payload: ParticipantUpdateInput = {
    ...data,
    user: {
      update: {
        firstName,
        lastName,
        email,
      },
    },
  };

  const supabase = serverSupabaseServiceRole(event);

  const oldParticipant = await prisma.participant.findUniqueOrThrow({where: {id}, include: {user: true}});

  const authUser = await getAuthUser(event, oldParticipant.user.email);
  const dbUser = await prisma.user.findUniqueOrThrow({where: {id: oldParticipant.userId}});

  try {
    await supabase.auth.admin.updateUserById(authUser.id, {
      email,
      user_metadata: {
        firstName,
        lastName,
      },
    });

    return prisma.participant.update({where: {userId: dbUser.id}, data: payload});
  } catch {
    // Try to rollback the email update in case of error
    try {
      await supabase.auth.admin.updateUserById(authUser.id, {
        email: oldParticipant.user.email,
        user_metadata: {
          firstName: oldParticipant.user.firstName,
          lastName: oldParticipant.user.lastName,
        },
      });

      await prisma.participant.update({
        where: {userId: dbUser.id}, data: {
          user: {
            update: {
              firstName: oldParticipant.user.firstName,
              lastName: oldParticipant.user.lastName,
              email: oldParticipant.user.email,
            },
          },
        },
      });
    } catch (rollbackError) {
      // If rollback fails, there's not much we can do, but we should log it
      console.error("Failed to rollback user update after an error occurred.", rollbackError);
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors de la mise à jour du participant.",
    });
  }
});
