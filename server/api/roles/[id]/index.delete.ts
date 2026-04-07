import * as v from "valibot";
import idSchema from "#shared/schemas/id";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "roles.delete");

  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  const role = await prisma.role.findUnique({
    where: {id},
    select: {
      id: true,
      system: true,
      _count: {
        select: {
          assignments: true,
        },
      },
      permissions: {
        select: {
          permission: {
            select: {
              key: true,
            },
          },
        },
      },
    },
  });

  if (!role) {
    throw createError({statusCode: 404, statusMessage: "Rôle introuvable."});
  }

  if (role.system) {
    throw createError({
      statusCode: 400,
      statusMessage: "Les rôles système ne peuvent pas être supprimés.",
    });
  }

  assertCanDelegatePermissions(
    dbUser,
    role.permissions.map((rolePermission) => rolePermission.permission.key),
    "Vous ne pouvez pas supprimer un rôle qui contient des permissions que vous ne possédez pas.",
  );

  if (role._count.assignments > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ce rôle est encore assigné à un ou plusieurs utilisateurs.",
    });
  }

  await prisma.role.delete({where: {id}});
});
