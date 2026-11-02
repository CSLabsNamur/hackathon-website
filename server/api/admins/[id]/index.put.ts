import schema from "#shared/schemas/admins/edit";
import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "admins.update");
  const {id} = await getValidatedRouterParams(event, v.parser(idParamSchema));

  const data = await readValidatedBody(event, v.parser(schema));

  const admin = await prisma.admin.findUnique({
    where: {id},
    include: {
      user: {
        include: {
          roleAssignments: {
            include: {
              role: {
                include: {permissions: {include: {permission: true}}},
              },
            },
          },
        },
      },
    },
  });

  if (!admin) {
    throw createError({statusCode: 404, statusMessage: "Administrateur introuvable."});
  }

  assertCanDelegatePermissions(
    dbUser,
    admin.user.roleAssignments.flatMap((assignment) => assignment.role.permissions.map((rolePermission) => rolePermission.permission.key)),
    "Vous ne pouvez pas modifier un administrateur qui possède des permissions que vous ne possédez pas.",
  );

  const targetIsSuperAdmin = admin.user.roleAssignments.some((assignment) => assignment.role.key === "super_admin");
  if (targetIsSuperAdmin && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Seul un super administrateur peut modifier un super administrateur.",
    });
  }

  const existingUser = await prisma.user.findUnique({where: {email: data.email}, select: {id: true}});
  if (existingUser && existingUser.id !== admin.userId) {
    throw createError({statusCode: 400, statusMessage: "Cet email existe déjà dans la base de données."});
  }

  const supabase = createSupabaseAdminClient();
  const syncJob = await prepareAuthSync(admin.userId);

  try {
    await updateAuthProfile(supabase, syncJob.supabaseAuthId, data);

    const updatedAdmin = await prisma.$transaction(async (db) => {
      await finishAuthSync(db, syncJob);
      return db.admin.update({where: {id}, data: {user: {update: data}}});
    });

    await invalidateUserAuthorization(syncJob.supabaseAuthId);
    return updatedAdmin;
  } catch (error) {
    await retryAuthSync(syncJob, error);
    throw createError({statusCode: 500, statusMessage: "Impossible de modifier le profil. La synchronisation du compte sera réessayée."});
  }
});
