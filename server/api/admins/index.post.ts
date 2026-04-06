import schema from "#shared/schemas/admins/invite";
import * as v from "valibot";
import renderAdminInvite from "~~/server/mail/generated/admin-invite";

export default defineEventHandler(async (event) => {
  const {dbUser} = await requirePermission(event, "admins.create");

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

  try {
    const {roleIds, ...userData} = data;
    const res = await prisma.admin.create({
      data: {
        user: {
          create: {
            ...userData,
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

    try {
      const {sendMail} = useNodeMailer();

      await sendMail({
        to: data.email,
        subject: "Vous avez été ajouté en tant qu'administrateur",
        html: renderAdminInvite(),
        replyTo: "event@cslabs.be",
      });
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: "L'administrateur a été créé, mais l'email n'a pas pu être envoyé.",
      });
    }
    return res;
  } catch {
    // Likely a unique constraint (email or userId) due to race condition.
    throw createError({statusCode: 400, statusMessage: "Impossible d'ajouter cet administrateur (déjà existant ?)"});
  }
});
