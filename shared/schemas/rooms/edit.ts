import * as v from "valibot";
import schema from "#shared/schemas/rooms/create";

export default v.object({
  ...schema.entries,
  sequence: v.number(),
});
