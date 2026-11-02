import schema from "#shared/schemas/admins/invite";
import * as v from "valibot";
import renderAdminInvite from "~~/server/mail/generated/admin-invite";
import { randomUUID } from "node:crypto";

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

  const supabase = createSupabaseAdminClient();

  const userData = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
  };

  const createdAuthUserId = randomUUID();
  const cleanupJob = await prepareSupabaseCreation({type: "AUTH_USER", target: createdAuthUserId});

  let result;
  try {
    const authUser = await supabase.auth.admin.createUser({
      id: createdAuthUserId,
      email: userData.email,
      email_confirm: true,
      user_metadata: {
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });

    if (authUser.error || !authUser.data.user) {
      throw createError({statusCode: 400, statusMessage: "Impossible de créer le compte d'authentification pour cet administrateur."});
    }

    result = await prisma.$transaction(async (db) => {
      await finishSupabaseCreation(db, [cleanupJob.id]);
      const admin = await db.admin.create({
        data: {
          user: {
            create: {
              ...userData,
              supabaseAuthId: createdAuthUserId,
              roleAssignments: {
                createMany: {
                  data: roles.map((role) => ({roleId: role.id})),
                },
              },
            },
          },
        },
      });

      const emailJob = await enqueueEmail({
        type: "admin_invite",
        recipient: data.email,
        subject: "Vous avez été ajouté en tant qu'administrateur",
        html: renderAdminInvite(),
        replyTo: settings.website.contactEmail,
      }, db);
      return {admin, emailJobId: emailJob.id};
    });
  } catch {
    await retrySupabaseCleanup([cleanupJob.id]).catch((error) => {
      console.error("Impossible de planifier le nettoyage du compte administrateur :", error);
    });
    event.waitUntil(processSupabaseCleanup(supabase, "GENERAL").catch((error) => {
      console.error("Erreur lors du nettoyage du compte administrateur :", error);
    }));
    throw createError({
      statusCode: 400,
      statusMessage: "Impossible d'ajouter cet administrateur ou de planifier son email d'invitation.",
    });
  }

  let emailWarning: string | undefined;

  try {
    const emailResult = await processEmailOutboxNow(result.emailJobId);
    if (emailResult.failed > 0) {
      emailWarning = "L'administrateur a été créé, mais l'email d'invitation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
      console.warn("L'email d'invitation administrateur est planifié pour une nouvelle tentative.", {
        emailJobId: result.emailJobId,
        email: data.email,
      });
    }
  } catch (error) {
    emailWarning = "L'administrateur a été créé, mais l'email d'invitation n'a pas pu être envoyé immédiatement. Nous réessaierons automatiquement dans quelques minutes.";
    console.error("Erreur lors de l'envoi immédiat de l'email d'invitation administrateur :", error);
  }

  return {
    ...result.admin,
    emailWarning,
  };
});
