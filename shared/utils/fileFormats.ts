export const DEFAULT_ACCEPTED_FORMATS_EXTS = [
  "pdf",
  "docx",
  "txt",
  "jpg",
  "png",
  "zip",
];

export type AcceptedFormatExt = (typeof DEFAULT_ACCEPTED_FORMATS_EXTS)[number];

/**
 * Normalize an array of extensions:
 * - trims
 * - lowercases
 * - removes leading dots
 * - drops invalid tokens
 * - removes duplicates (keeps order)
 */
export const normalizeAcceptedFormats = (exts?: Array<string | null | undefined> | null): string[] => {
  if (!exts) return [];

  const cleaned = exts
    .map((e) => (e ?? "").trim().toLowerCase())
    .filter(Boolean)
    .map((e) => e.replace(/^\./, ""))
    .filter((e) => /^[a-z0-9]{1,10}$/i.test(e));

  return [...new Set(cleaned)];
};

/**
 * Convert normalized extensions to an HTML input `accept` attribute.
 * Example: ["pdf","png"] -> ".pdf,.png"
 */
export const acceptedFormatsToHtmlAccept = (exts?: string[] | null): string => {
  const list = normalizeAcceptedFormats(exts);
  return list.map((e) => `.${e}`).join(",");
};

/**
 * Human label for UI.
 * Example: ["pdf","png"] -> "pdf, png"
 */
export const acceptedFormatsToLabel = (exts?: string[] | null): string | undefined => {
  const list = normalizeAcceptedFormats(exts);
  if (!list.length) return undefined;
  return list.join(", ");
};

