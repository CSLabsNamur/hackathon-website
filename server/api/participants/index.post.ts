import schema, { type CreateParticipantSchema } from "#shared/schemas/participants/create";
import * as v from "valibot";
import { serverSupabaseClient } from "#supabase/server";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type {
  UserCreateInput,
  UserCreateNestedOneWithoutParticipantInput,
} from "~~/server/prisma/generated/prisma/models/User";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {firstName, lastName, email, curriculumVitae, ...body} = await readValidatedBody(event, v.parser(schema));

  const payload: Omit<CreateParticipantSchema, "curriculumVitae" | keyof UserCreateInput> & {
    user: UserCreateNestedOneWithoutParticipantInput,
    curriculumVitae?: string,
    caution: CautionStatus
  } = {
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
