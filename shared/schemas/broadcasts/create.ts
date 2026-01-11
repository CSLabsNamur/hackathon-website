import * as v from "valibot";

const schema = v.object({
  recipients: v.picklist(["Participants", "Organisateurs", "Formations", "Tous"]),
  title: v.pipe(v.string(), v.minWords("fr", 1, "Le titre doit contenir au moins 1 mot"), v.maxLength(250, "Le titre est trop long (max 250 caractères)")),
  message: v.pipe(v.string(), v.minWords("fr", 5, "Le message doit contenir au moins 5 mots"), v.maxLength(20000, "Le message est trop long (max 20000 caractères)")),
  attachments: v.optional(v.pipe(v.array(v.pipe(v.file(), v.maxSize(1024 * 1024 * 5, "Le fichier est trop volumineux (max 5MB)"))), v.maxLength(10, "Vous ne pouvez pas télécharger plus de 10 fichiers"))),
});

export default schema;
export type CreateBroadcastSchema = v.InferOutput<typeof schema>;
