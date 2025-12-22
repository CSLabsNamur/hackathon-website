import type * as v from "valibot";
import schema from "#shared/schemas/teams/create";

// The edit schema is the same as the create schema
export default schema;

export type EditTeamSchema = v.InferOutput<typeof schema>;
