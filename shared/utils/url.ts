export function tryParseUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:\/\//iu.test(normalized) ? normalized : `https://${normalized}`;

  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}
