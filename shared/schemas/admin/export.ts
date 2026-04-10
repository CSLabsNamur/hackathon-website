import * as v from "valibot";

export const adminExportResourceParamsSchema = v.object({
  resource: v.picklist([...ADMIN_EXPORT_RESOURCES], "Ressource invalide."),
});

export const adminExportBodySchema = v.strictObject({
  format: v.picklist([...ADMIN_EXPORT_FORMATS], "Format invalide."),
  columnIds: v.optional(v.array(v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, "Les colonnes sélectionnées sont invalides."),
  )), []),
});

export type AdminExportResourceParams = v.InferOutput<typeof adminExportResourceParamsSchema>;
export type AdminExportBody = v.InferOutput<typeof adminExportBodySchema>;
