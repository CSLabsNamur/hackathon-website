import schema from "#shared/schemas/participants/create";
import * as v from "valibot";
import { serverSupabaseClient } from "#supabase/server";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { ParticipantCreateInput } from "~~/server/prisma/generated/prisma/models/Participant";

export default defineEventHandler(async (event) => {
  //const {public: {registrationsDateOpen, registrationsDateClose}} = useRuntimeConfig(event);

  //const now = dayjs();
  //if (!now.isBetween(registrationsDateOpen, registrationsDateClose)) {
  //  throw createError({statusCode: 403, statusMessage: "Les inscriptions sont fermées."});
  //}

  // Get the validated body, and extract fields that don't belong to ParticipantCreateInput
  const {
    firstName,
    lastName,
    email,
    curriculumVitae,
    turnstileToken,
    cautionAgreement,
    codeOfConduct,
    ...body
  } = await readValidatedBody(event, v.parser(schema));

  if (!await verifyTurnstileToken(turnstileToken, event)) {
    throw createError({statusCode: 400, statusMessage: "Échec de la vérification anti-bot."});
  }

  const payload: ParticipantCreateInput = {
    ...body,
    user: {
      create: {
        firstName,
        lastName,
        email,
      },
    },
    curriculumVitae: undefined,
    caution: CautionStatus.NOT_PAID,
  };

  // Upload CV to Supabase Storage if provided
  if (curriculumVitae) {
    const supabase = await serverSupabaseClient(event);

    const file = curriculumVitae;
    const {data, error} = await supabase.storage
      .from("cvs")
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) {
      throw new Error("Erreur lors du téléchargement du CV.");
    }

    // Replace the curriculum vitae field with the file path or URL
    payload.curriculumVitae = data.path;
  }

  return prisma.participant.create({data: payload});
});
