import * as v from "valibot";

const schema = v.strictObject({
  query: v.optional(v.pipe(
    v.string(),
    v.trim(),
  ), ""),
  limit: v.optional(v.pipe(
    v.union([
      v.string(),
      v.number(),
    ]),
    v.toNumber(),
    v.integer("La limite doit être un entier."),
    v.minValue(1, "La limite doit être d'au moins 1."),
    v.maxValue(ADMIN_SEARCH_MAX_LIMIT, `La limite ne peut pas dépasser ${ADMIN_SEARCH_MAX_LIMIT}.`),
  ), ADMIN_SEARCH_DEFAULT_LIMIT),
});

export default schema;
