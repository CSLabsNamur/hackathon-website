import schema from "#shared/schemas/admins/updateRoles";
import idSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requirePermission(event, "admins.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  const admin = await prisma.admin.findUnique({
    where: {id},
    include: {
      user: {
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  if (!admin) {
    throw createError({statusCode: 404, statusMessage: "Administrateur introuvable."});
  }

  const organizerRoles = await prisma.role.findMany({
    where: {
      id: {
        in: data.roleIds,
      },
      key: {
        not: "participant",
      },
    },
    select: {
      id: true,
    },
  });

  if (organizerRoles.length !== data.roleIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Un ou plusieurs rôles sélectionnés n'existent pas.",
    });
  }

  const participantRoleIds = admin.user.roleAssignments
    .filter((assignment) => assignment.role.key === "participant")
    .map((assignment) => assignment.roleId);

  return prisma.admin.update({
    where: {id},
    data: {
      user: {
        update: {
          roleAssignments: {
            deleteMany: participantRoleIds.length > 0 ? {roleId: {notIn: participantRoleIds}} : {},
            createMany: {
              data: organizerRoles
                .map((role) => role.id)
                .map((roleId) => ({roleId})),
              skipDuplicates: true,
            },
          },
        },
      },
    },
  });
});
