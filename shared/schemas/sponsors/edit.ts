import * as v from "valibot";
import { sponsorBodySchema, sponsorLogoFileSchema } from "./create";

const schema = v.strictObject({
  ...sponsorBodySchema.entries,
  logoFile: v.optional(sponsorLogoFileSchema),
});

export default schema;
export type EditSponsorSchema = v.InferOutput<typeof schema>;
