export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, "participants.read");
  const includeSensitive = canUsePermission(context.ability, "participants.read.sensitive");

  const participants = await prisma.participant.findMany({
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
          files: includeSensitive,
        },
      },
      user: true,
    },
  });

  if (includeSensitive) {
    return participants;
  }

  return participants.map((participant) => ({
    ...participant,
    diet: null,
    needs: null,
    curriculumVitae: null,
    submissions: participant.submissions.map((submission) => ({
      ...submission,
      files: [],
    })),
  }));
});
