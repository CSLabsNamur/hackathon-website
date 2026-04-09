import schema from "#shared/schemas/admins/invite";
import * as v from "valibot";
import renderAdminInvite from "~~/server/mail/generated/admin-invite";
import { serverSupabaseServiceRole } from "#supabase/server";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "admins.create");
  const settings = await getPublicSettings(event);

  const data = await readValidatedBody(event, v.parser(schema));

  // We only want CSLabs SSO addresses
  if (!data.email.endsWith("@cslabs.be")) {
    throw createError({statusCode: 400, statusMessage: "L'email doit se terminer par @cslabs.be"});
  }

  const existingUser = await prisma.user.findUnique({where: {email: data.email}});

  if (existingUser) {
    throw createError({statusCode: 400, statusMessage: "Cet email existe déjà dans la base de données.."});
  }

  const roles = await prisma.role.findMany({
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
      key: true,
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

  if (roles.length !== data.roleIds.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Un ou plusieurs rôles sélectionnés n'existent pas ou ne peuvent pas être assignés à un administrateur.",
    });
  }

  assertCanDelegatePermissions(
    dbUser,
    roles.flatMap((role) => role.permissions.map((rolePermission) => rolePermission.permission.key)),
    "Vous ne pouvez pas assigner un rôle qui contient des permissions que vous ne possédez pas.",
  );

  if (roles.some((role) => role.key === "super_admin") && !isSuperAdmin(dbUser)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Vous n'avez pas la permission d'assigner le rôle de super administrateur.",
    });
  }

  const supabase = serverSupabaseServiceRole(event);

  const userData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  };

  const authUser = await supabase.auth.admin.createUser({
    email: userData.email,
    email_confirm: true,
    user_metadata: {
      firstName: userData.firstName,
      lastName: userData.lastName,
    },
  });

  if (authUser.error || !authUser.data.user) {
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible de créer le compte d'authentification pour cet administrateur.",
    });
  }

  const createdAuthUserId = authUser.data.user.id;

  let res;
  let createdDbUserId: string | undefined;
  let inviteEmailJobId: string | undefined;
  try {
    res = await prisma.admin.create({
      data: {
        user: {
          create: {
            ...userData,
            supabaseAuthId: createdAuthUserId,
            roleAssignments: {
              createMany: {
                data: roles.map((role) => ({
                  roleId: role.id,
                })),
              },
            },
          },
        },
      },
    });
    createdDbUserId = res.userId;

    const inviteEmailJob = await enqueueEmail({
      type: "admin_invite",
      recipient: data.email,
      subject: "Vous avez été ajouté en tant qu'administrateur",
      html: renderAdminInvite(),
      replyTo: settings.website.contactEmail,
    });
    inviteEmailJobId = inviteEmailJob.id;
  } catch {
    if (createdDbUserId) {
      try {
        await prisma.user.delete({
          where: {
            id: createdDbUserId,
          },
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'administrateur après échec de création de l'email d'invitation :", error);
      }
    }
    const {error} = await supabase.auth.admin.deleteUser(createdAuthUserId);
    if (error) {
      console.error("Erreur lors de la suppression du compte d'authentification après échec de la création de l'administrateur :", error);
    }
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible d'ajouter cet administrateur ou de planifier son email d'invitation.",
    });
  }

  let emailWarning: string | undefined;

  if (inviteEmailJobId) {
    try {
      const emailResult = await processEmailOutboxNow(inviteEmailJobId);
      if (emailResult.failed > 0) {
        emailWarning = "L'administrateur a été créé, mais l'email d'invitation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
        console.warn("L'email d'invitation administrateur est planifié pour une nouvelle tentative.", {
          emailJobId: inviteEmailJobId,
          email: data.email,
        });
      }
    } catch (error) {
      emailWarning = "L'administrateur a été créé, mais l'email d'invitation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
      console.error("Erreur lors de l'envoi immédiat de l'email d'invitation administrateur :", error);
    }
  }

  return {
    ...res,
    emailWarning,
  };
});
