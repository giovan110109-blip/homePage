const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;
const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_TAG_RE = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g;

function toCleanString(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(CONTROL_CHARS_RE, "");
}

function sanitizePlainText(value, options = {}) {
  const { trim = true, collapseWhitespace = false } = options;

  let text = toCleanString(value);
  if (!text) {
    return "";
  }

  text = text
    .replace(SCRIPT_TAG_RE, "")
    .replace(STYLE_TAG_RE, "")
    .replace(HTML_COMMENT_RE, "")
    .replace(HTML_TAG_RE, "");

  if (collapseWhitespace) {
    text = text.replace(/\s+/g, " ");
  }

  return trim ? text.trim() : text;
}

function sanitizeIdentifier(value) {
  return sanitizePlainText(value, {
    trim: true,
    collapseWhitespace: true,
  });
}

function sanitizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) =>
      sanitizePlainText(value, {
        trim: true,
        collapseWhitespace: true,
      })
    )
    .filter(Boolean);
}

function normalizeHttpUrl(value, options = {}) {
  const { allowRelative = false } = options;
  const text = toCleanString(value).trim();

  if (!text) {
    return "";
  }

  if (allowRelative && text.startsWith("/")) {
    return text;
  }

  try {
    const parsed = new URL(text);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

module.exports = {
  sanitizePlainText,
  sanitizeIdentifier,
  sanitizeStringArray,
  normalizeHttpUrl,
};
