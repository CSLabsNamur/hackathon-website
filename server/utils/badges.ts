import PDFDocument from "pdfkit";
import qr from "qrcode";
import type { Prisma } from "#server/prisma/generated/prisma/browser";

type Participant = Prisma.ParticipantGetPayload<{
  include: {
    user: true
  }
}>

function cmToPoints(cm: number): number {
  return cm * 28.3465;
}


async function createBadgePage(doc: PDFKit.PDFDocument, participant: Participant, size: [number, number]) {
  doc.addPage({size, margin: 0});

  const qrcode = await qr.toBuffer(participant.userId);
  const qrcodeSize = size[1] / 1.5;
  doc.image(qrcode, 15, size[1] - qrcodeSize - 5, {width: qrcodeSize, height: qrcodeSize});

  const logoSize = size[1] / 1.25;
  doc.image("./public/images/logo.png", size[0] - logoSize - 15, 5, {width: logoSize});

  doc.fontSize(20).text(participant.user.firstName, 15, size[1] - qrcodeSize - 20, {
    width: 128,
    align: "left",
  });
  doc.fontSize(20).text("Participant", size[0] - logoSize - 15, logoSize, {
    width: 128,
    align: "center",
  });
}

export async function renderParticipantsBadges(participants: Participant[]): Promise<PDFKit.PDFDocument> {
  const size: [number, number] = [cmToPoints(10), cmToPoints(5)];

  const doc = new PDFDocument({
    size,
    margin: 0,
    autoFirstPage: false,
  });

  for (const participant of participants) {
    await createBadgePage(doc, participant, size);
  }

  doc.end();

  return doc;
}
