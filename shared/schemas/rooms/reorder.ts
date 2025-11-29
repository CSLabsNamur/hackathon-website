import * as v from "valibot";

export default v.array(v.object({
  id: v.string(),
  teams: v.array(v.string()),
}));
