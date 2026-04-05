import schema from "#shared/schemas/roles/edit";
import idSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "roles.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  const role = await prisma.role.findUnique({
    where: {id},
    select: {
      id: true,
      system: true,
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

  // Since DB is the source of truth for permissions, we need to check that all provided permission keys exist before creating the role.
  const permissions = await prisma.permission.findMany({
    where: {
      key: {
        in: [...new Set(data.permissionKeys)],
      },
    },
    select: {
      id: true,
    },
  });

  if (permissions.length !== data.permissionKeys.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Une ou plusieurs permissions n'existent pas dans le catalogue.",
    });
  }

  const {permissionKeys, ...roleData} = data;

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: {
          roleId: id,
        },
      });

      return tx.role.update({
        where: {
          id,
        },
        data: {
          ...roleData,
          permissions: {
            createMany: {
              data: permissions.map((permission) => ({
                permissionId: permission.id,
              })),
            },
          },
        },
      });
    });
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de modifier ce rôle (clé déjà utilisée ?).",
    });
  }
});
