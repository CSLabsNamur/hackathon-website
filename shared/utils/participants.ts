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

const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/;
const LINKEDIN_USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])$/;

function normalizeSocialHandle(value: string) {
  const normalized = value.trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  return normalized || undefined;
}

export function getParticipantCautionReference(participant: ParticipantName) {
  return `Caution Hackathon ${participant.lastName.toUpperCase()} ${participant.firstName}`;
}

export function normalizeParticipantGithubAccount(value: string) {
  const normalized = normalizeSocialHandle(value);

  if (!normalized) return undefined;

  const url = tryParseUrl(normalized);
  if (url && ["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) {
    return url.pathname.split("/").filter(Boolean)[0];
  }

  return normalized;
}

export function normalizeParticipantLinkedInAccount(value: string) {
  const normalized = normalizeSocialHandle(value);

  if (!normalized) return undefined;

  const url = tryParseUrl(normalized);
  if (url) {
    const hostname = url.hostname.toLowerCase();
    if (hostname === "linkedin.com" || hostname.endsWith(".linkedin.com")) {
      const segments = url.pathname.split("/").filter(Boolean);

      if (segments[0] === "in" || segments[0] === "pub") {
        return segments[1] || undefined;
      }
    }
  }

  return normalized;
}

export function isValidParticipantGithubAccount(value: string) {
  return GITHUB_USERNAME_REGEX.test(value);
}

export function isValidParticipantLinkedInAccount(value: string) {
  return LINKEDIN_USERNAME_REGEX.test(value);
}

export function getParticipantGithubUrl(value: string) {
  const normalized = normalizeParticipantGithubAccount(value);
  return normalized && isValidParticipantGithubAccount(normalized) ? `https://github.com/${normalized}` : null;
}

export function getParticipantLinkedInUrl(value: string) {
  const normalized = normalizeParticipantLinkedInAccount(value);
  return normalized && isValidParticipantLinkedInAccount(normalized) ? `https://www.linkedin.com/in/${normalized}` : null;
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
