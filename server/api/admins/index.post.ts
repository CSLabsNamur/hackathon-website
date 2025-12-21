import schema from "#shared/schemas/admins/invite";
import * as v from "valibot";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const {email} = await readValidatedBody(event, v.parser(schema));

  // We only want CSLabs SSO addresses
  if (!email.endsWith("@cslabs.be")) {
    throw createError({statusCode: 400, statusMessage: "L'email doit se terminer par @cslabs.be"});
  }

  const existingUser = await prisma.user.findUnique({where: {email}});

  if (existingUser) {
    throw createError({statusCode: 400, statusMessage: "Cet email existe déjà dans la base de données.."});
  }

  try {
    return await prisma.admin.create({
      data: {
        user: {
          create: {
            email,
            firstName: "Admin",
            lastName: "CSLabs",
          },
        },
      },
      include: {user: true},
    });
  } catch {
    // Likely a unique constraint (email or userId) due to race condition.
    throw createError({statusCode: 400, statusMessage: "Impossible d'ajouter cet administrateur (déjà existant ?)"});
  }
});
