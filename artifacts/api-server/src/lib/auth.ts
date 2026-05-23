import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ── Configuration ─────────────────────────────────────────────────────────────
// Fall back to a hard-coded dev secret so the server can start without env
// configuration during local development. Production must supply SESSION_SECRET.
const JWT_SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12; // Work factor — higher is slower but more secure

// ── Types ─────────────────────────────────────────────────────────────────────

/** The data embedded inside every JWT issued by this server. */
export interface JwtPayload {
  userId: number;
  role: string;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Sign a JWT containing the given payload.
 * The token expires after {@link JWT_EXPIRES_IN}.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT string.
 * Throws a JsonWebTokenError if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// ── Password helpers ──────────────────────────────────────────────────────────

/**
 * Hash a plain-text password using bcrypt.
 * The resulting hash is safe to store in the database.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true only when the password matches the hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
