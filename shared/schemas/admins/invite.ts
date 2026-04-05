import * as v from "valibot";

const schema = v.strictObject({
  firstName: v.pipe(v.string(), v.nonEmpty("Le prénom est requis")),
  lastName: v.pipe(v.string(), v.nonEmpty("Le nom est requis")),
  email: v.pipe(
    v.string(),
    v.nonEmpty("L'email est requis"),
    v.email("L'email n'est pas valide"),
    v.transform((email) => email.trim().toLowerCase()),
    v.endsWith("@cslabs.be", "L'email doit se terminer par @cslabs.be"),
  ),
  roleIds: v.pipe(
    v.array(v.pipe(v.string(), v.nonEmpty("Un identifiant de rôle est invalide."))),
    v.minLength(1, "Au moins un rôle est requis."),
    v.check(
      (roleIds) => new Set(roleIds).size === roleIds.length,
      "Un rôle ne peut pas être sélectionné plusieurs fois.",
    ),
  ),
});

export default schema;
export type InviteAdminSchema = v.InferOutput<typeof schema>;
