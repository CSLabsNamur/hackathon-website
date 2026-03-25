import * as v from "valibot";
import { guestBodySchema, guestImageFileSchema } from "./create";

const schema = v.strictObject({
  ...guestBodySchema.entries,
  imageFile: v.optional(guestImageFileSchema),
});

export default schema;
export type EditGuestSchema = v.InferOutput<typeof schema>;
