/**
 * Centralized, defensive env parsing.
 *
 * Why this exists: `parseInt(process.env.JWT_EXPIRES_IN || "3600", 10)` returns
 * `NaN` for any non-numeric value (e.g. "1h", "3600s", trailing whitespace).
 * Cookie `maxAge: NaN` then silently degrades to a session cookie on most
 * runtimes, which is a hard-to-spot regression. This module fails closed:
 * malformed numeric env vars fall back to the documented default, and a
 * single warning is logged in dev.
 */

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const trimmed = raw.trim();
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n <= 0 || String(n) !== trimmed) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[config] ${name}=${JSON.stringify(raw)} is not a positive integer. Falling back to ${fallback}.`
      );
    }
    return fallback;
  }
  return n;
}

/** Access-token lifetime in seconds. Used for the `accessToken` cookie maxAge
 *  and the `expiresIn` field returned in auth responses. */
export const JWT_EXPIRES_IN_SECONDS = intEnv("JWT_EXPIRES_IN", 3600);

/** Refresh-token lifetime in seconds. Default 7 days. */
export const REFRESH_TOKEN_EXPIRES_IN_SECONDS = intEnv(
  "REFRESH_TOKEN_EXPIRES_IN",
  60 * 60 * 24 * 7
);
