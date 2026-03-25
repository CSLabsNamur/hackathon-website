export const SPONSORS_BUCKET = "sponsors";

export const MAX_SPONSOR_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_SPONSOR_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_SPONSOR_LOGO_EXTS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;
