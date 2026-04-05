import * as v from "valibot";
import inviteSchema from "./invite";

const schema = v.pick(inviteSchema, ["roleIds"]);

export default schema;
export type UpdateAdminRolesSchema = v.InferOutput<typeof schema>;
