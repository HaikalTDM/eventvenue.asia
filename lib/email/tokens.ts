import { randomBytes, createHash } from "crypto";

/**
 * Cryptographic helpers for one-time-use tokens (email verification,
 * password reset). The raw token is sent to the user; only the hash is
 * stored in the database, mirroring the standard pattern for password reset
 * tokens. A leaked DB therefore cannot be used to verify or reset accounts.
 */

export interface IssuedToken {
  /** URL-safe token to embed in the email link. */
  token: string;
  /** SHA-256 hash to store in the DB. */
  tokenHash: string;
}

export function issueToken(byteLength = 32): IssuedToken {
  const buf = randomBytes(byteLength);
  const token = buf.toString("base64url");
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
