import schema from "#shared/schemas/roles/create";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "roles.create");

  const data = await readValidatedBody(event, v.parser(schema));

  assertCanDelegatePermissions(dbUser, data.permissionKeys);

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
    return await prisma.role.create({
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
  } catch (e) {
    console.error("Error creating role:", e);
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de créer ce rôle (clé déjà utilisée ?).",
    });
  }
});
