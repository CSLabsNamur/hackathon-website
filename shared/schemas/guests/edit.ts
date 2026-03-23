import type * as v from "valibot";
import schema from "./create";

export default schema;
export type EditGuestSchema = v.InferOutput<typeof schema>;
