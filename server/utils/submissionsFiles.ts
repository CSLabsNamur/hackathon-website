import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileTypeFromFile } from "file-type";

export const SUBMISSIONS_BUCKET = "submissions";

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

export async function detectSubmissionFileType(filepath: string, originalName: string) {
  const detected = await fileTypeFromFile(filepath);
  if (detected) return detected;
  if (!originalName.toLowerCase().endsWith(".txt")) return null;

  try {
    new TextDecoder("utf-8", {fatal: true}).decode(await readFile(filepath));
    return {ext: "txt", mime: "text/plain"};
  } catch {
    return null;
  }
}
