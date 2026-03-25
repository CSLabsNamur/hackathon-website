export const DEFAULT_ACCEPTED_FORMATS_EXTS = [
  "pdf",
  "docx",
  "txt",
  "jpg",
  "png",
  "zip",
] as const;

export type AcceptedFormatExt = (typeof DEFAULT_ACCEPTED_FORMATS_EXTS)[number];

/**
 * Normalize an array of extensions:
 * - trims
 * - lowercases
 * - removes leading dots
 * - drops invalid tokens
 * - removes duplicates (keeps order)
 */
export const normalizeAcceptedFormats = (exts?: ReadonlyArray<string | null | undefined> | null): string[] => {
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
export const acceptedFormatsToHtmlAccept = (exts?: ReadonlyArray<string | null | undefined> | null): string => {
  const list = normalizeAcceptedFormats(exts);
  return list.map((e) => `.${e}`).join(",");
};

/**
 * Human label for UI.
 * Example: ["pdf","png"] -> "pdf, png"
 */
export const acceptedFormatsToLabel = (exts?: ReadonlyArray<string | null | undefined> | null): string | undefined => {
  const list = normalizeAcceptedFormats(exts);
  if (!list.length) return undefined;
  return list.join(", ");
};

export const sanitizeFilename = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);

export const isAllowedExt = (ext: string, acceptedExts: string[]): boolean => {
  if (acceptedExts.length === 0) return true;
  return acceptedExts.includes(ext.toLowerCase());
};
