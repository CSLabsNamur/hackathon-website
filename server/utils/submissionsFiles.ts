import crypto from "node:crypto";

export const SUBMISSIONS_BUCKET = "submissions";

export const MAX_SUBMISSION_FILE_SIZE = 5 * 1024 * 1024; // 5MB (kept in sync with nuxt-security requestSizeLimiter)

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
