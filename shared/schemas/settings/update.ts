import * as v from "valibot";

const websiteSettingsSchema = v.strictObject({
  contactEmail: v.pipe(v.string(), v.nonEmpty("L'email de contact est requis."), v.email("L'email de contact n'est pas valide.")),
  bugReportEmail: v.pipe(v.string(), v.nonEmpty("L'email de support est requis."), v.email("L'email de support n'est pas valide.")),
  bugReportWebhookUrl: v.pipe(
    v.nullable(
      v.union([
        v.pipe(v.string(), v.url("L'URL n'est pas valide.")),
        v.literal(""),
      ]),
    ),
    v.transform((value) => value || null),
  ),
});

const eventSettingsSchema = v.pipe(v.strictObject({
    title: v.pipe(
      v.string(),
      v.nonEmpty("Le titre de l'événement est requis."),
      v.maxLength(100, "Le titre de l'événement ne peut pas dépasser 100 caractères."),
    ),
    slogan: v.pipe(v.string(), v.maxLength(160, "Le slogan ne peut pas dépasser 160 caractères.")),
    logoPath: v.pipe(
      v.nullable(
        v.pipe(
          v.string(),
          v.maxLength(180, "Le chemin du logo ne peut pas dépasser 180 caractères."),
          v.check((value) => {
            const path = value.trim();
            return path === "" || (/^[a-z0-9][a-z0-9._/-]*$/iu.test(path) && !path.includes(".."));
          }, "Le chemin du logo doit être un chemin Supabase valide."),
        ),
      ),
      v.transform((value) => typeof value === "string" && value.trim() === "" ? null : value),
    ),
    teaserEnabled: v.boolean(),
    startDate: v.pipe(
      v.string(),
      v.nonEmpty("La date de début est requise."),
      v.isoDateTime("La date de début doit être une date et heure valide."),
    ),
    endDate: v.pipe(
      v.string(),
      v.nonEmpty("La date de fin est requise."),
      v.isoDateTime("La date de fin doit être une date et heure valide."),
    ),
    registrationsStartDate: v.pipe(
      v.string(),
      v.nonEmpty("La date d'ouverture des inscriptions est requise."),
      v.isoDateTime("La date d'ouverture des inscriptions doit être une date et heure valide."),
    ),
    registrationsEndDate: v.pipe(
      v.string(),
      v.nonEmpty("La date de fermeture des inscriptions est requise."),
      v.isoDateTime("La date de fermeture des inscriptions doit être une date et heure valide."),
    ),
    registrationMode: v.picklist(Object.values(RegistrationMode)),
    cautionAmount: v.pipe(
      v.number(),
      v.integer("La caution doit être un nombre entier."),
      v.minValue(0, "La caution ne peut pas être négative."),
      v.maxValue(500, "La caution ne peut pas dépasser 500 €."),
    ),
    iban: v.pipe(
      v.nullable(
        v.pipe(v.string(), v.maxLength(64, "L'IBAN ne peut pas dépasser 64 caractères.")),
      ),
      v.transform((value) => typeof value === "string" && value.trim() === "" ? null : value),
    ),
    bic: v.pipe(
      v.nullable(
        v.pipe(v.string(), v.maxLength(32, "Le BIC ne peut pas dépasser 32 caractères.")),
      ),
      v.transform((value) => typeof value === "string" && value.trim() === "" ? null : value),
    ),
    locationName: v.pipe(
      v.string(),
      v.nonEmpty("Le nom du lieu est requis."),
      v.maxLength(120, "Le nom du lieu ne peut pas dépasser 120 caractères."),
    ),
    locationAddress: v.pipe(
      v.string(),
      v.nonEmpty("L'adresse du lieu est requise."),
      v.maxLength(200, "L'adresse du lieu ne peut pas dépasser 200 caractères."),
    ),
  }),
  v.forward(
    v.partialCheck(
      [["startDate"], ["endDate"]],
      (input) => new Date(input.startDate) < new Date(input.endDate),
      "La date de fin doit être après la date de début.",
    ),
    ["endDate"],
  ),
  v.forward(
    v.partialCheck(
      [["registrationsStartDate"], ["registrationsEndDate"]],
      (input) => new Date(input.registrationsStartDate) < new Date(input.registrationsEndDate),
      "La fermeture des inscriptions doit être après leur ouverture.",
    ),
    ["registrationsEndDate"],
  ));

const socialLinkSchema = v.pipe(
  v.strictObject({
    id: v.optional(v.string()),
    type: v.picklist(Object.values(SocialLinkType)),
    label: v.pipe(
      v.string(),
      v.maxLength(40, "Le libellé du lien ne peut pas dépasser 40 caractères."),
    ),
    icon: v.pipe(
      v.string(),
      v.maxLength(100, "L'icône du lien ne peut pas dépasser 100 caractères."),
    ),
    url: v.pipe(v.string(), v.nonEmpty("L'URL du lien est requise."), v.url("L'URL du lien n'est pas valide.")),
    visible: v.boolean(),
    sortOrder: v.pipe(
      v.number(),
      v.integer("L'ordre doit être un nombre entier."),
      v.minValue(0, "L'ordre ne peut pas être négatif."),
      v.maxValue(1000, "L'ordre ne peut pas dépasser 1000."),
    ),
  }),
  v.forward(
    v.partialCheck(
      [["type"], ["label"]],
      (input) => !isCustomSocialLinkType(input.type) || input.label.trim().length > 0,
      "Le libellé du lien est requis pour un lien personnalisé.",
    ),
    ["label"],
  ),
  v.forward(
    v.partialCheck(
      [["type"], ["icon"]],
      (input) => !isCustomSocialLinkType(input.type) || input.icon.trim().length > 0,
      "L'icône du lien est requise pour un lien personnalisé.",
    ),
    ["icon"],
  ),
  v.transform((link) => {
    const defaults = getDefaultSocialLinkValues(link.type);
    if (defaults) return normalizeSocialLinkValues(link);

    return {
      ...link,
      label: link.label.trim(),
      icon: link.icon.trim(),
    };
  }),
);

const socialLinksSchema = v.pipe(
  v.array(socialLinkSchema),
  v.maxLength(12, "Vous ne pouvez pas configurer plus de 12 liens sociaux."),
  v.checkItems(
    (item, index, array) => array.findIndex((entry) => entry.type === item.type) === index,
    "Un type de réseau social ne peut être configuré qu'une seule fois.",
  ),
);

const schema = v.strictObject({
  website: websiteSettingsSchema,
  event: eventSettingsSchema,
  socialLinks: socialLinksSchema,
});

export default schema;
export type UpdateSocialLinkSchema = v.InferOutput<typeof socialLinkSchema>;
export type UpdateEventSettingsSchema = v.InferOutput<typeof eventSettingsSchema>;
export type UpdateWebsiteSettingsSchema = v.InferOutput<typeof websiteSettingsSchema>;
export type UpdateSettingsSchema = v.InferOutput<typeof schema>;
