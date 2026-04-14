import qr from "qrcode";

type ParticipantName = {
  firstName: string;
  lastName: string;
}

type ParticipantCautionPaymentSettings = {
  amount: number;
  iban: string;
  bic: string;
};

export function getParticipantCautionReference(participant: ParticipantName) {
  return `Caution Hackathon ${participant.lastName.toUpperCase()} ${participant.firstName}`;
}

export async function generateEpcQrcode(participant: ParticipantName, settings: ParticipantCautionPaymentSettings) {
  const payload = `BCD
002
1
SCT
${settings.bic}
CSLabs
${settings.iban.replaceAll(" ", "")}
EUR${settings.amount.toFixed(2)}
DEP0

${getParticipantCautionReference(participant)}`;

  return qr.toDataURL(payload);
}
