import crypto from "node:crypto";

export const SUBMISSIONS_BUCKET = "submissions";

export const MAX_SUBMISSION_FILE_SIZE = 5 * 1024 * 1024; // 5MB (kept in sync with nuxt-security requestSizeLimiter)

export const isAllowedExt = (ext: string, acceptedExts: string[]): boolean => {
  if (acceptedExts.length === 0) return true;
  return acceptedExts.includes(ext.toLowerCase());
};

export const sha256File = async (filePath: string): Promise<string> => {
  const hash = crypto.createHash("sha256");
  const stream = (await import("node:fs")).createReadStream(filePath);
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (d) => hash.update(d));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
  return hash.digest("hex");
};

export const sanitizeFilename = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
