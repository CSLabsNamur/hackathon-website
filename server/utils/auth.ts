import { serverSupabaseUser } from "#supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";
import type { H3Event } from "h3";

export enum UserRole {
  ADMIN = 1 << 0,
  USER = 1 << 1,
}

export const requireAuth = async (event: H3Event, role: number) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  }
  const userRole = user.user_metadata?.role as "admin" | "participant";
  if (
    (role & UserRole.ADMIN && userRole === "admin") ||
    (role & UserRole.USER && userRole === "participant")
  ) {
    return user;
  }
  throw createError({statusCode: 403, statusMessage: "Forbidden"});
};

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
