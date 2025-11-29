import { serverSupabaseUser } from "#supabase/server";
import { H3Event } from "h3";

export enum UserRole {
  ADMIN = 1 << 0,
  USER = 1 << 1,
}

export const requireAuth = async (event: H3Event, role: number) => {
  const user = await serverSupabaseUser(event);
  //if (!user) {
  //  throw createError({statusCode: 401, statusMessage: "Unauthorized"});
  //}
  return user;
};

export const getAuthParticipant = defineCachedFunction(async (sub: string) => {
  // Here you can fetch user details from your database if needed
  return prisma.participant.findUnique({where: {id: sub}});
}, {
  maxAge: 60 * 60, // 1 hour
  name: "sub-participant",
  getKey: (sub: string) => sub,
});
