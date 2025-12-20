import schema from "#shared/schemas/participants/create";
import * as v from "valibot";
import { serverSupabaseServiceRole } from "#supabase/server";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";
import type { ParticipantCreateInput } from "~~/server/prisma/generated/prisma/models/Participant";
import formidable from "formidable";
import { fileTypeFromFile } from "file-type";
import registrationMailTemplate from "~~/server/mail/templates/registration";
import fs from "fs";

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_CV_MIME_TYPES = ["application/pdf", "application/acrobat", "application/nappdf", "application/x-pdf", "image/pdf"];

export default defineEventHandler(async (event) => {
  const {public: {registrationsDateOpen, registrationsDateClose}} = useRuntimeConfig(event);

  const now = dayjs();
  if (!now.isBetween(registrationsDateOpen, registrationsDateClose)) {
    throw createError({statusCode: 403, statusMessage: "Les inscriptions sont fermées."});
  }

  // We do not process file uploads directly because we need to do checks before saving everything
  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: 5 * 1024 * 1024,
    multiples: false,
  }).parse(event.node.req);

  if (!bodyRaw) {
    throw createError({statusCode: 400, statusMessage: "Données de formulaire invalides."});
  }

  const curriculumVitae = files.curriculumVitae?.[0];

  if (curriculumVitae) {
    const fileType = await fileTypeFromFile(curriculumVitae.filepath);
    if (!fileType || curriculumVitae.size > MAX_CV_SIZE || !ACCEPTED_CV_MIME_TYPES.includes(fileType.mime) || fileType.ext !== "pdf") {
      throw createError({statusCode: 400, statusMessage: "Le fichier CV est invalide."});
    }
    // AV Scan
    const scan = await (await clamscan).scanFile(curriculumVitae.filepath);
    if (scan.isInfected) {
      throw createError({statusCode: 400, statusMessage: "Le fichier CV est infecté par un virus."});
    }
  }

  const bodyFlat = Object.fromEntries(Object.entries(bodyRaw).map(([key, value]) => {
    if (Array.isArray(value)) {
      return [key, value[0]];
    } else {
      return [key, value];
    }
  }));

  // Get the validated body, and extract fields that don't belong to ParticipantCreateInput
  // TODO: Use v.safeParser throughout the project to handle validation errors
  const {
    firstName,
    lastName,
    email,
    turnstileToken,
    cautionAgreement,
    codeOfConduct,
    ...body
  } = v.parse(schema, bodyFlat);

  if (!await verifyTurnstileToken(turnstileToken, event)) {
    throw createError({statusCode: 400, statusMessage: "Échec de la vérification anti-bot."});
  }

  // Check if the user already exists
  if (await prisma.user.count({where: {email}}) > 0) {
    throw createError({statusCode: 400, statusMessage: "Un utilisateur avec cet email existe déjà."});
  }

  // Prepare the payload for creating the participant
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
    const supabase = serverSupabaseServiceRole(event);

    const {data, error} = await supabase.storage
      .from("cvs")
      .upload(`${firstName + lastName}_${curriculumVitae.originalFilename}`, curriculumVitae.filepath ? fs.createReadStream(curriculumVitae.filepath) : "", {
        cacheControl: "3600",
        upsert: false,
        contentType: curriculumVitae.mimetype || undefined,
      });

    if (error) {
      throw createError({statusCode: 500, statusMessage: "Erreur lors du téléchargement du CV."});
    }

    payload.curriculumVitae = data.fullPath;
  }

  try {
    await prisma.participant.create({data: payload});
  } catch (e) {
    if (curriculumVitae) {
      // Clean up uploaded CV in case of error
      const supabase = serverSupabaseServiceRole(event);
      const {error} = await supabase.storage.from("cvs").remove([`${firstName + lastName}_${curriculumVitae.originalFilename}`]);
      if (error) {
        console.error("Erreur lors de la suppression du CV après échec de la création du participant :", error);
      }
    }
    throw createError({statusCode: 500, statusMessage: "Erreur lors de la création du participant."});
  }

  // Send confirmation email
  try {
    const {sendMail} = useNodeMailer();

    await sendMail({
      to: email,
      subject: "Confirmation d'inscription au Hackathon du CSLabs",
      html: registrationMailTemplate,
      replyTo: "event@cslabs.be",
    });
  } catch (e) {
    throw createError({
      statusCode: 500,
      statusMessage: "Inscription enregistrée, mais erreur lors de l'envoi de l'email de confirmation.",
    });
  }

  return {success: true, message: "Inscription enregistrée avec succès."};
});
