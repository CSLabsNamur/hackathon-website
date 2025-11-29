import * as v from "valibot";

// This schema is for submission content, which is dynamic based on the request type
// We'll validate it inline since it depends on props that don't exist in a server context
const schema = v.object({
  content: v.optional(v.any()), // Accept any content type for now
});

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);
  const id = getRouterParam(event, "id")!;

  const data = await readValidatedBody(event, v.parser(schema));

  const payload = {
    ...data,
    content: data.content ? JSON.stringify(data.content) : null,
    request: {connect: {id}},
    // TODO: Remove optional chaining once auth is guaranteed
    participant: {connect: {id: user?.sub}},
  };

  return prisma.submission.create({data: payload});
});
