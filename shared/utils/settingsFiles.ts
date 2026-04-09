export const EVENT_ASSETS_BUCKET = "event-assets";

export const MAX_EVENT_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_EVENT_LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ACCEPTED_EVENT_LOGO_EXTS = [
  "png",
  "jpg",
  "jpeg",
  "webp",
] as const;
