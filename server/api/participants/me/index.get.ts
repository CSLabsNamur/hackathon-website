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
                  request: {
                    select: {
                      teamRequest: true,
                    },
                  },
                },
              },
            },
          },
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

  const accessibleSubmissions = await getAccessibleSubmissionsForParticipant({
    id: participant.id,
    team: participant.team
      ? {
        id: participant.team.id,
        members: participant.team.members.map((member) => ({id: member.id})),
      }
      : null,
  });

  return {
    ...participant,
    submissions: accessibleSubmissions,
    authorization: {
      roleKeys: getGrantedRoleKeys(dbUser),
      permissionKeys: getGrantedPermissionKeys(dbUser),
    },
  };
});
