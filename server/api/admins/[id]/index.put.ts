import schema from "#shared/schemas/admins/edit";
import idParamSchema from "#shared/schemas/id";
import * as v from "valibot";
import { serverSupabaseServiceRole } from "#supabase/server";

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

  if (!admin.user.supabaseAuthId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Le compte d'authentification de l'administrateur n'est pas lié. Exécutez le script de backfill.",
    });
  }

  const existingUser = await prisma.user.findUnique({where: {email: data.email}, select: {id: true}});
  if (existingUser && existingUser.id !== admin.userId) {
    throw createError({statusCode: 400, statusMessage: "Cet email existe déjà dans la base de données."});
  }

  const supabase = serverSupabaseServiceRole(event);
  const authUpdate = await supabase.auth.admin.updateUserById(admin.user.supabaseAuthId, {
    email: data.email,
    user_metadata: {
      firstName: data.firstName,
      lastName: data.lastName,
    },
  });

  if (authUpdate.error) {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de mettre à jour le compte d'authentification de cet administrateur.",
    });
  }

  let updatedAdmin;
  try {
    updatedAdmin = await prisma.admin.update({
      where: {id},
      data: {
        user: {
          update: data,
        },
      },
    });
  } catch {
    try {
      const rollback = await supabase.auth.admin.updateUserById(admin.user.supabaseAuthId, {
        email: admin.user.email,
        user_metadata: {
          firstName: admin.user.firstName,
          lastName: admin.user.lastName,
        },
      });
      if (rollback.error) {
        console.error("Erreur lors de la restauration du compte d'authentification de l'administrateur :", rollback.error);
      }
    } catch (rollbackError) {
      console.error("Erreur lors de la restauration du compte d'authentification de l'administrateur :", rollbackError);
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Une erreur est survenue lors de la mise à jour de l'administrateur.",
    });
  }

  await invalidateUserAuthorization(admin.user.supabaseAuthId);
  return updatedAdmin;
});
