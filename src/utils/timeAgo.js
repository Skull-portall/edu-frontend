/**
 * Returns a human-readable "time ago" string from a date value.
 * e.g. "just now", "5m ago", "2h ago", "3d ago", "Nov 20"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  if (!date) return "";

  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  // Fall back to a short date string
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
