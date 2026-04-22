export function normalizeHttpUrl(
  value: string,
  options: { allowRelative?: boolean } = {},
): string {
  const { allowRelative = false } = options;
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  if (allowRelative && text.startsWith("/")) {
    return text;
  }

  try {
    const parsed = allowRelative
      ? new URL(text, window.location.origin)
      : new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

export function isSafeImageUrl(value: string, options?: { allowRelative?: boolean }): boolean {
  return Boolean(normalizeHttpUrl(value, options));
}
