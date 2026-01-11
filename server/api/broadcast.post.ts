import * as v from "valibot";
import schema from "#shared/schemas/broadcasts/create";
import renderBroadcast from "~~/server/mail/generated/broadcast";
import formidable from "formidable";
import fs from "node:fs";

export default defineEventHandler(async (event) => {
  await requireAuth(event, UserRole.ADMIN);

  const [bodyRaw, files] = await formidable({
    allowEmptyFiles: false,
    keepExtensions: true,
    maxFiles: 10,
    maxFileSize: 5 * 1024 * 1024,
    multiples: true,
  }).parse(event.node.req);

  const bodyFlat = Object.fromEntries(Object.entries(bodyRaw ?? {}).map(([key, value]) => {
    if (Array.isArray(value)) return [key, value[0]];
    return [key, value];
  }));

  const data = v.parse(schema, bodyFlat);

  const fileList = (files.attachments ?? []) as formidable.File[];

  // Check files
  for (const f of fileList) {
    // AV scan
    const scanner = await clamscan;
    if (scanner) {
      const scan = await scanner.scanFile(f.filepath);
      if (scan.isInfected) {
        throw createError({statusCode: 400, statusMessage: "Le fichier est infecté par un virus."});
      }
    } else {
      console.warn("[submissions] ClamAV unavailable; skipping virus scan.");
    }
  }

  const recipients: string[] = [];

  switch (data.recipients) {
    case "Participants": {
      const participants = await prisma.participant.findMany({select: {user: {select: {email: true}}}});
      recipients.push(...participants.map(p => p.user.email));
      break;
    }
    case "Organisateurs": {
      const admins = await prisma.admin.findMany({select: {user: {select: {email: true}}}});
      recipients.push(...admins.map(a => a.user.email));
      break;
    }
    case "Formations": {
      const formations = await prisma.participant.findMany({
        where: {newsletter: true},
        select: {user: {select: {email: true}}},
      });
      recipients.push(...formations.map(f => f.user.email));
      break;
    }
    case "Tous": {
      const users = await prisma.user.findMany({select: {email: true}});
      recipients.push(...users.map(u => u.email));
      break;
    }
  }

  try {
    const {sendMail} = useNodeMailer();

    await sendMail({
      bcc: recipients,
      subject: data.title,
      attachments: fileList.map(f => ({
        filename: f.originalFilename || "attachment",
        content: fs.readFileSync(f.filepath),
      })),
      html: renderBroadcast({
        title: data.title,
        body: data.message,
      }),
      replyTo: "event@cslabs.be",
    });
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: "Erreur lors de l'envoi de l'annonce.",
    });
  } finally {
    try {
      for (const f of fileList) {
        fs.unlinkSync(f.filepath);
      }
    } catch { /* empty */
    }
  }
});
