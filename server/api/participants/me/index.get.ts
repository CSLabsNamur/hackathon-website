export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.read.own");

  const participant = await prisma.participant.findUnique({
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
          files: true,
        },
      },
      user: true,
    },
  });

  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant not found"});
  }

  return {
    ...participant,
    authorization: {
      roleKeys: getGrantedRoleKeys(dbUser),
      permissionKeys: getGrantedPermissionKeys(dbUser),
    },
  };
});
