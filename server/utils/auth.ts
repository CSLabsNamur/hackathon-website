import type { JwtPayload } from "@supabase/supabase-js";

export const getParticipant = async (user: JwtPayload) => {
  const dbUser = await getDbUser(user);
  try {
    return prisma.participant.findUniqueOrThrow({
      where: {userId: dbUser.id},
      include: {
        team: {include: {members: {include: {user: true}}}},
        submissions: {include: {request: true}},
        user: true,
      },
    });
  } catch {
    throw createError({statusCode: 404, statusMessage: "Participant not found"});
  }
};

export const getDbUser = defineCachedFunction(async (user: JwtPayload) => {
  try {
    return prisma.user.findUniqueOrThrow({where: {email: user.email!}});
  } catch {
    throw createError({statusCode: 404, statusMessage: "User not found"});
  }
}, {
  maxAge: 60 * 60, // 1 hour
  name: "sub-user",
  getKey: (user: JwtPayload) => user.email!,
});
