import schema from "#shared/schemas/admins/updateRoles";
import idSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "admins.update");

  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  // Check if the admin exists
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

  // Check that all provided role IDs exist and are not the participant role
  const newAssignedRoles = await prisma.role.findMany({
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

  if (newAssignedRoles.length !== data.roleIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Un ou plusieurs rôles sélectionnés n'existent pas.",
    });
  }

  // Check that a non super_admin is not trying to assign/revoke the super_admin role
  const superAdminRole = await prisma.role.findUnique({
    where: {key: "super_admin"},
    select: {id: true},
  });
  if (!superAdminRole) {
    throw createError({
      statusCode: 500,
      statusMessage: "Le rôle de super administrateur est introuvable dans la base de données.",
    });
  }

  const willHaveSuperAdminRole = newAssignedRoles.some((role) => role.id === superAdminRole.id);
  const currentlyHasSuperAdminRole = admin.user.roleAssignments.some((assignment) => assignment.roleId === superAdminRole.id);

  if (!isSuperAdmin(dbUser) && (willHaveSuperAdminRole || currentlyHasSuperAdminRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Vous n'avez pas la permission d'assigner ou de retirer le rôle de super administrateur.",
    });
  }

  // Check that the admin is not trying to remove their own super_admin role
  if (admin.userId === dbUser.id && currentlyHasSuperAdminRole && !willHaveSuperAdminRole) {
    throw createError({
      statusCode: 400,
      statusMessage: "Vous ne pouvez pas vous retirer le rôle de super administrateur.",
    });
  }

  // Check that there's still at least one super_admin after the update
  if (!willHaveSuperAdminRole && currentlyHasSuperAdminRole) {
    const otherSuperAdminsCount = await prisma.user.count({
      where: {
        roleAssignments: {
          some: {
            roleId: superAdminRole.id,
          },
        },
        id: {
          not: admin.userId,
        },
      },
    });
    if (otherSuperAdminsCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Il doit y avoir au moins un utilisateur avec le rôle de super administrateur.",
      });
    }
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
              data: newAssignedRoles
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
