import schema from "#shared/schemas/roles/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

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

  try {
    return await prisma.role.create({
      data: {
        ...data,
        permissions: {
          createMany: {
            data: permissions.map((permission) => ({
              permissionId: permission.id,
            })),
          },
        },
      },
    });
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de créer ce rôle (clé déjà utilisée ?).",
    });
  }
});
