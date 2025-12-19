import * as v from "valibot";

export default v.array(v.strictObject({
  id: v.string(),
  teams: v.array(v.string()),
}));
