import schema from "#shared/schemas/participants/edit";
import * as v from "valibot";
import type { ParticipantUpdateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {authUser, dbUser} = await requirePermission(event, "participants.update.own");

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
  const oldUser = await prisma.user.findUniqueOrThrow({
    where: {id: dbUser.id},
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  try {
    const res = await supabase.auth.admin.updateUserById(authUser.sub, {
      email,
      user_metadata: {
        firstName,
        lastName,
      },
    });

    if (res.error) {
      throw res.error;
    }

    return prisma.participant.update({where: {userId: dbUser.id}, data: payload});
  } catch {
    // Try to rollback the email update in case of error
    try {
      await supabase.auth.admin.updateUserById(authUser.sub, {
        email: oldUser.email,
        user_metadata: {
          firstName: oldUser.firstName,
          lastName: oldUser.lastName,
        },
      });

      await prisma.participant.update({
        where: {userId: dbUser.id}, data: {
          user: {
            update: {
              firstName: oldUser.firstName,
              lastName: oldUser.lastName,
              email: oldUser.email,
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
      statusMessage: "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
    });
  }
});
