import type { ParticipantPublicProfile } from "#shared/utils/types";
import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await createAbilityForRequest(event);

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const participant = await prisma.participant.findUnique({
    where: {id},
    select: {
      id: true,
      school: true,
      curriculumVitae: true,
      githubAccount: true,
      linkedInAccount: true,
      team: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!participant) {
    throw createError({statusCode: 404, statusMessage: "Participant introuvable"});
  }

  return participant satisfies ParticipantPublicProfile;
});
