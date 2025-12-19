import * as v from "valibot";
import schema from "#shared/schemas/rooms/create";

export default v.strictObject({
  ...schema.entries,
  sequence: v.number(),
});
