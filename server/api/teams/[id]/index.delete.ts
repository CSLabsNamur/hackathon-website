import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "teams.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const team = await prisma.team.findUnique({
    where: {id},
    select: {
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  if (!team) {
    throw createError({statusCode: 404, message: "Team introuvable."});
  }

  if (team._count.members > 0) {
    throw createError({statusCode: 400, message: "Impossible de supprimer une équipe qui a des membres."});
  }

  return prisma.team.delete({where: {id}});
});
