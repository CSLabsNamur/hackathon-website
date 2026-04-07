import type * as v from "valibot";
import { roleBodySchema } from "./create";

const schema = roleBodySchema;

export default schema;
export type EditRoleSchema = v.InferOutput<typeof schema>;
