import prisma from "../../server/utils/prisma";
import { currentEdition, nextEdition } from "./event";
import { getEventRolloverPreview } from "../../server/utils/eventArchives";

export async function resetEventDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || process.env.DATABASE_URL !== url || !new URL(url).pathname.endsWith("_test")) {
    throw new Error("Use TEST_DATABASE_URL with a disposable database whose name ends in _test.");
  }

  await prisma.$transaction([
    prisma.eventArchive.deleteMany(),
    prisma.supabaseCleanupJob.deleteMany(),
    prisma.emailOutbox.deleteMany(),
    prisma.submissionRequest.deleteMany(),
    prisma.user.deleteMany(),
    prisma.team.deleteMany(),
    prisma.guest.deleteMany(),
    prisma.sponsor.deleteMany(),
    prisma.scheduleItem.deleteMany(),
    prisma.room.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.websiteSettings.deleteMany(),
    prisma.eventSettings.deleteMany(),
    prisma.socialLink.deleteMany(),
  ]);
  await prisma.eventSettings.create({
    data: {
      ...currentEdition,
      slogan: "Créer ensemble",
      logoPath: "logos/2026.png",
      iban: "BE68539007547034",
      bic: "GKCCBEBB",
      cautionAmount: 30,
      registrationMode: "OPEN",
    },
  });
}

export async function prepareRollover() {
  const preview = await getEventRolloverPreview();
  return {
    ...nextEdition,
    editionId: preview.event.editionId,
    revision: preview.revision,
    confirmation: preview.event.title,
  };
}

export async function seedReusableData() {
  await prisma.websiteSettings.create({data: {contactEmail: "event@cslabs.be"}});
  await prisma.socialLink.create({data: {type: "GITHUB", label: "GitHub", url: "https://github.com/CSLabsNamur"}});
  await prisma.room.create({data: {id: "room", name: "Auditoire", sequence: 1}});
  await prisma.permission.create({
    data: {
      id: "settings-permission",
      key: "settings.update",
      group: "settings",
      name: "Paramètres",
    },
  });
  await prisma.role.create({data: {id: "staff-role", key: "super_admin", name: "Super administrateur"}});
  await prisma.rolePermission.create({data: {roleId: "staff-role", permissionId: "settings-permission"}});
  await prisma.user.create({
    data: {
      id: "staff",
      email: "staff@cslabs.be",
      firstName: "Staff",
      lastName: "Member",
      supabaseAuthId: "staff-auth",
    },
  });
  await prisma.admin.create({data: {userId: "staff"}});
  await prisma.userRoleAssignment.create({data: {userId: "staff", roleId: "staff-role"}});
}

export async function seedParticipantData() {
  await prisma.role.create({data: {id: "participant-role", key: "participant", name: "Participant"}});
  await prisma.user.create({
    data: {
      id: "participant-user",
      email: "private@cslabs.be",
      firstName: "PRIVATE_FIRST",
      lastName: "PRIVATE_LAST",
      supabaseAuthId: "participant-auth",
    },
  });
  await prisma.userRoleAssignment.create({data: {userId: "participant-user", roleId: "participant-role"}});
  await prisma.team.create({data: {id: "team", name: "PRIVATE_TEAM", description: "PRIVATE_IDEA"}});
  await prisma.participant.create({
    data: {
      id: "participant",
      userId: "participant-user",
      teamId: "team",
      curriculumVitae: "participant/private-cv.pdf",
      imageAgreement: true,
      caution: "REFUNDED",
      diet: "PRIVATE_DIET",
      needs: "PRIVATE_NEEDS",
    },
  });
  await prisma.submissionRequest.create({
    data: {
      id: "request",
      title: "Rendu final",
      type: "FILE",
      deadline: new Date(currentEdition.endDate),
    },
  });
  await prisma.submission.create({
    data: {
      id: "submission",
      requestId: "request",
      participantId: "participant",
      content: "PRIVATE_SUBMISSION",
    },
  });
  await prisma.submissionFile.create({
    data: {
      submissionId: "submission",
      bucket: "submissions",
      path: "participant/private.zip",
      originalName: "PRIVATE_FILENAME",
      mimeType: "application/zip",
      size: 123,
      sha256: "private-hash",
    },
  });
  await prisma.emailOutbox.create({
    data: {
      type: "registration",
      recipient: "private@cslabs.be",
      subject: "Bienvenue",
      html: "PRIVATE_EMAIL",
    },
  });
}

export async function seedEventContent() {
  await prisma.guest.create({data: {name: "PRIVATE_GUEST", type: "JURY", quantity: 3, imageUrl: "guests/private.png"}});
  await prisma.sponsor.create({
    data: {
      name: "Sponsor",
      description: {type: "doc", content: []},
      url: "https://cslabs.be",
      logo: "sponsor/logo.png",
    },
  });
  await prisma.scheduleItem.create({
    data: {
      title: "Accueil",
      description: "Ouverture",
      dateString: "Vendredi",
      startTime: new Date(currentEdition.startDate),
      endTime: new Date("2026-03-27T10:00:00Z"),
    },
  });
}
