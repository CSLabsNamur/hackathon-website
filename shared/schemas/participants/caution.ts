import * as v from "valibot";
import { CautionStatus } from "~~/server/prisma/generated/prisma/enums";

export default v.object({
  caution: v.enum(CautionStatus),
});
