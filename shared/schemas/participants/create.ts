import * as v from "valibot";

export const participantGithubAccountSchema = v.optional(v.pipe(
  v.string(),
  v.transform((value) => normalizeParticipantGithubAccount(value)),
  v.check((value) => value === undefined || isValidParticipantGithubAccount(value), "Le profil GitHub n'est pas valide."),
));

export const participantLinkedInAccountSchema = v.optional(v.pipe(
  v.string(),
  v.transform((value) => normalizeParticipantLinkedInAccount(value)),
  v.check((value) => value === undefined || isValidParticipantLinkedInAccount(value), "Le profil LinkedIn n'est pas valide."),
));

const schema = v.strictObject({
  firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
  lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
  email: v.pipe(v.string(), v.nonEmpty("L'email est requis"), v.email("L'email n'est pas valide")),
  githubAccount: participantGithubAccountSchema,
  linkedInAccount: participantLinkedInAccountSchema,
  school: v.optional(v.string()),
  diet: v.optional(v.string()),
  needs: v.optional(v.string()),
  curriculumVitae: v.optional(v.pipe(v.file(), v.mimeType(["application/pdf", "application/acrobat", "application/nappdf", "application/x-pdf", "image/pdf"], "Veuillez sélectionner un fichier PDF."), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))),
  // Have to coerce to boolean because form data are received as strings
  cautionAgreement: v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"), v.value(true, "Vous devez accepter de payer la caution pour vous inscrire")),
  codeOfConduct: v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"), v.value(true, "Vous devez accepter le code de conduite pour vous inscrire")),
  imageAgreement: v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"), v.value(true, "Vous devez accepter l'utilisation des photos pour vous inscrire")),
  newsletter: v.optional(v.pipe(v.union([v.boolean(), v.literal("true"), v.literal("false")]), v.transform((x) => x === true || x === "true"))),
  turnstileToken: v.pipe(v.string(), v.nonEmpty("La vérification anti-robot est requise")),
});

export default schema;
export type CreateParticipantSchema = v.InferOutput<typeof schema>;
