import type { DbUser } from "../../shared/utils/types";
import type { H3Event } from "h3";
import { serverSupabaseServiceRole } from "#supabase/server";

export const getParticipantForDbUser = async (dbUser: DbUser) => {
  try {
    return await prisma.participant.findUniqueOrThrow({
      where: {userId: dbUser.id},
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        submissions: {
          include: {
            request: true,
          },
        },
        user: true,
      },
    });
  } catch {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }
};

export async function getAuthUser(event: H3Event, email: string) {
  const supabase = serverSupabaseServiceRole(event);

  const authUserList = await supabase.auth.admin.listUsers({
    perPage: 999,
  });
  if (authUserList.error) {
    throw createError({statusCode: 500, message: "Erreur lors de la récupération des utilisateurs."});
  }

  const authUser = authUserList.data.users.find(u => u.email === email);
  if (!authUser) {
    throw createError({statusCode: 404, message: "Utilisateur introuvable."});
  }

  return authUser;
}
