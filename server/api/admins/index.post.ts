import schema from "#shared/schemas/admins/invite";
import * as v from "valibot";
import renderAdminInvite from "~~/server/mail/generated/admin-invite";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const data = await readValidatedBody(event, v.parser(schema));

  // We only want CSLabs SSO addresses
  if (!data.email.endsWith("@cslabs.be")) {
    throw createError({statusCode: 400, statusMessage: "L'email doit se terminer par @cslabs.be"});
  }

  const existingUser = await prisma.user.findUnique({where: {email: data.email}});

  if (existingUser) {
    throw createError({statusCode: 400, statusMessage: "Cet email existe déjà dans la base de données.."});
  }

  try {
    const res = await prisma.admin.create({
      data: {
        user: {
          create: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: {user: true},
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
  } catch {
    // Likely a unique constraint (email or userId) due to race condition.
    throw createError({statusCode: 400, statusMessage: "Impossible d'ajouter cet administrateur (déjà existant ?)"});
  }
});
