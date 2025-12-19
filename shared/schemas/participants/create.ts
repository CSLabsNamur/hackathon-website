import * as v from "valibot";

const schema = v.strictObject({
  firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
  lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
  email: v.pipe(v.string(), v.nonEmpty("L'email est requis"), v.email("L'email n'est pas valide")),
  githubAccount: v.optional(v.pipe(v.string(), v.minLength(3))),
  linkedInAccount: v.optional(v.pipe(v.string(), v.minLength(3))),
  school: v.optional(v.string()),
  diet: v.optional(v.string()),
  needs: v.optional(v.string()),
  curriculumVitae: v.optional(v.pipe(v.file(), v.mimeType(["application/pdf", "application/acrobat", "application/nappdf", "application/x-pdf", "image/pdf"], "Veuillez sélectionner un fichier PDF."), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))),
  // Have to coerce to boolean because form data are received as strings
  cautionAgreement: v.pipe(v.union([v.string(), v.boolean()]), v.toBoolean(), v.value(true, "Vous devez accepter de payer la caution pour vous inscrire")),
  codeOfConduct: v.pipe(v.union([v.string(), v.boolean()]), v.toBoolean(), v.value(true, "Vous devez accepter le code de conduite pour vous inscrire")),
  imageAgreement: v.optional(v.pipe(v.union([v.string(), v.boolean()]), v.toBoolean())),
  newsletter: v.optional(v.pipe(v.union([v.string(), v.boolean()]), v.toBoolean())),
  turnstileToken: v.pipe(v.string(), v.nonEmpty("La vérification anti-robot est requise")),
});

export default schema;
export type CreateParticipantSchema = v.InferOutput<typeof schema>;
