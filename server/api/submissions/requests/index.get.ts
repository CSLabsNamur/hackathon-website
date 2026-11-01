import { defineEventHandler } from "h3";
import { canUsePermission, requirePermission } from "../../../utils/ability";
import prisma from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, "submissionRequests.read");

  if (canUsePermission(context.ability, "participants.read")) {
    return prisma.submissionRequest.findMany({
      include: {
        _count: {select: {submissions: true}},
        submissions: {
          include: {
            files: true,
          },
        },
      },
    });
  }

  const requests = await prisma.submissionRequest.findMany({include: {_count: {select: {submissions: true}}}});

  return requests.map((request) => ({
    ...request,
    submissions: [],
  }));
});
