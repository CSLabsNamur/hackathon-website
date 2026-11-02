import * as v from "valibot";
import inviteSchema from "./invite";

const schema = v.omit(inviteSchema, ["roleIds"]);

export default schema;
export type EditAdminSchema = v.InferOutput<typeof schema>;
