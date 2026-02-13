/**
 * Sanitize user input by stripping HTML tags and dangerous characters.
 * Prevents XSS attacks when user content is stored in DB and rendered.
 */

// Strip all HTML tags from a string
const stripHtml = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove <script> blocks
    .replace(/<[^>]*>/g, "") // Remove all remaining HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove inline event handlers (onclick=, onerror=, etc.)
    .trim();
};

// Encode HTML entities to prevent XSS when content is rendered
const escapeHtml = (str) => {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};

/**
 * Sanitize a string for safe storage.
 * Uses HTML stripping (not encoding) since we store plain text, not HTML.
 */
const sanitize = (str) => {
  if (typeof str !== "string") return str;
  return stripHtml(str);
};

export { sanitize, stripHtml, escapeHtml };
