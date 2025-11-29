import schema from "#shared/schemas/participants/create";
import * as v from "valibot";
import { serverSupabaseClient } from "#supabase/server";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";

export default defineEventHandler(async (event) => {
  //await requireAuth(event, UserRole.ADMIN);

  const body = await readValidatedBody(event, v.parser(schema));

  const payload: Omit<typeof body, "curriculumVitae"> & { curriculumVitae?: string, caution: CautionStatus } = {
    ...body,
    curriculumVitae: undefined,
    caution: CautionStatus.NOT_PAID,
  };

  // Upload CV to Supabase Storage if provided
  if (body.curriculumVitae) {
    const supabase = await serverSupabaseClient(event);

    const file = body.curriculumVitae;
    const {data, error} = await supabase.storage
      .from("cvs")
      .upload(`${Date.now()}_${file.name}`, file);

    if (error) {
      throw new Error("Erreur lors du téléchargement du CV.");
    }

    // Replace the curriculumVitae field with the file path or URL
    payload.curriculumVitae = data.path;
  }

  return prisma.participant.create({data: payload});
});
