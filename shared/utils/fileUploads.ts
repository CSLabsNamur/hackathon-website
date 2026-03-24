export const sanitizeFilename = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);

export const isAllowedExt = (ext: string, acceptedExts: string[]): boolean => {
  if (acceptedExts.length === 0) return true;
  return acceptedExts.includes(ext.toLowerCase());
};
