export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "participants.read.own");

  const participant = await prisma.participant.findUnique({
    where: {userId: dbUser.id},
    include: {
      team: {
        include: {
          members: {
            select: {
              id: true,
              githubAccount: true,
              linkedInAccount: true,
              school: true,
              caution: true,
              curriculumVitae: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
              submissions: {
                select: {
                  id: true,
                  requestId: true,
                },
              },
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
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }

  return {
    ...participant,
    authorization: {
      roleKeys: getGrantedRoleKeys(dbUser),
      permissionKeys: getGrantedPermissionKeys(dbUser),
    },
  };
});
