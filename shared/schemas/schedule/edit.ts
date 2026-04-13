import schema from "#shared/schemas/schedule/create";
import type * as v from "valibot";

// The edit schema is the same as the create schema
export default schema;
export type EditScheduleItemInput = v.InferInput<typeof schema>;
export type EditScheduleItemSchema = v.InferOutput<typeof schema>;
