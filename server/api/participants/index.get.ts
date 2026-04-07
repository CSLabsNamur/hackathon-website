export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, "participants.read");
  const includeSensitive = canUsePermission(context.ability, "participants.read.sensitive");

  const participants = await prisma.participant.findMany({
    select: {
      id: true,
      userId: true,
      githubAccount: true,
      linkedInAccount: true,
      school: true,
      caution: true,
      teamId: true,
      curriculumVitae: true,
      createdAt: true,
      updatedAt: true,
      ...(includeSensitive
        ? {
          diet: true,
          needs: true,
          imageAgreement: true,
          newsletter: true,
        }
        : {}),
      team: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              id: true,
              caution: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
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

  if (includeSensitive) {
    return participants;
  }

  return participants.map((participant) => ({
    ...participant,
    diet: null,
    needs: null,
    imageAgreement: null,
    newsletter: null,
  }));
});
