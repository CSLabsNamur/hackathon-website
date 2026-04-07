export default defineEventHandler(async (event) => {
  const {dbUser} = await requireOrganizerAccess(event);

  const admin = await prisma.admin.findUnique({
    where: {userId: dbUser.id},
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
    throw createError({statusCode: 403, statusMessage: "Forbidden"});
  }

  return {
    ...admin,
    authorization: {
      roleKeys: getGrantedRoleKeys(dbUser),
      permissionKeys: getGrantedPermissionKeys(dbUser),
    },
  };
});
