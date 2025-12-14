import * as v from "valibot";

const schema = v.object({
  firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
  lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
  email: v.pipe(v.string(), v.nonEmpty("L'email est requis"), v.email("L'email n'est pas valide")),
  githubAccount: v.optional(v.pipe(v.string(), v.minLength(3))),
  linkedInAccount: v.optional(v.pipe(v.string(), v.minLength(3))),
  school: v.optional(v.picklist(["UNamur", "Henallux", "HEAJ", "UCLouvain", "ULiège", "UMons", "ULB", "Hors Belgique", "Autre"], "Le choix n'est pas valide")),
  diet: v.optional(v.picklist(["Végétarien", "Vegan", "Sans gluten", "Halal", "Kasher", "Autre"], "Le choix n'est pas valide")),
  needs: v.optional(v.string()),
  curriculumVitae: v.optional(v.pipe(v.file(), v.mimeType(["application/pdf"], "Veuillez sélectionner un fichier PDF."), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))),
  cautionAgreement: v.pipe(v.boolean(), v.value(true, "Vous devez accepter de payer la caution pour vous inscrire")),
  codeOfConduct: v.pipe(v.boolean(), v.value(true, "Vous devez accepter le code de conduite pour vous inscrire")),
  imageAgreement: v.optional(v.boolean(), false),
  newsletter: v.optional(v.boolean()),
});

export default schema;
export type CreateParticipantSchema = v.InferOutput<typeof schema>;
