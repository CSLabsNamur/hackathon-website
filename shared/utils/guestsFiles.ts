export const GUESTS_BUCKET = "guests";

export const MAX_GUEST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_GUEST_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_GUEST_IMAGE_EXTS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;
