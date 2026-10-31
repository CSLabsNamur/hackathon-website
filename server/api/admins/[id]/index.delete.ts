import * as v from "valibot";
import idSchema from "#shared/schemas/id";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "admins.delete");
  const {id} = await getValidatedRouterParams(event, v.parser(idSchema));

  const supabaseAuthId = await prisma.$transaction(async (db) => {
    const admin = await db.admin.findUnique({
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

    if (admin.userId === dbUser.id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Vous ne pouvez pas supprimer votre propre compte administrateur.",
      });
    }

    const targetIsSuperAdmin = admin.user.roleAssignments.some((assignment) => assignment.role.key === "super_admin");
    if (targetIsSuperAdmin && !isSuperAdmin(dbUser)) {
      throw createError({
        statusCode: 403,
        statusMessage: "Seul un super administrateur peut supprimer un super administrateur.",
      });
    }

    assertCanDelegatePermissions(dbUser,
      admin.user.roleAssignments.flatMap((assignment) => assignment.role.permissions.map(({permission}) => permission.key)),
      "Vous ne pouvez pas supprimer un administrateur qui possède des permissions que vous ne possédez pas.",
    );

    if (targetIsSuperAdmin) {
      const otherSuperAdmins = await db.admin.count({
        where: {userId: {not: admin.userId}, user: {roleAssignments: {some: {role: {key: "super_admin"}}}}},
      });
      if (otherSuperAdmins === 0) {
        throw createError({statusCode: 400, statusMessage: "Il doit rester au moins un super administrateur."});
      }
    }

    if (admin.user.supabaseAuthId) {
      await db.supabaseCleanupJob.create({data: {type: "AUTH_USER", target: admin.user.supabaseAuthId}});
    }
    await db.user.delete({where: {id: admin.userId}});
    return admin.user.supabaseAuthId;
  }, {isolationLevel: "Serializable"}).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      throw createError({
        statusCode: 409,
        statusMessage: "Les données ont changé. Rechargez la liste des administrateurs et réessayez.",
      });
    }
    throw error;
  });

  if (supabaseAuthId) {
    await invalidateUserAuthorization(supabaseAuthId);
    event.waitUntil(processSupabaseCleanup(serverSupabaseServiceRole(event), "GENERAL").catch((error) => {
      console.error("Erreur lors du nettoyage des comptes Supabase:", error);
    }));
  }

  return {success: true};
});
