import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/auth";

// ── Type augmentation ─────────────────────────────────────────────────────────
// Extends the Express Request interface so route handlers can access req.user
// after the requireAuth or optionalAuth middleware has run.
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware: require a valid Bearer JWT.
 *
 * Reads the Authorization header, verifies the token, and attaches the decoded
 * payload to req.user. Responds with 401 if the header is missing or the token
 * is invalid/expired.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Strip the "Bearer " prefix to get the raw token string
  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    // verifyToken throws for expired, tampered, or malformed tokens
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Middleware: attach user identity when a Bearer JWT is present, but do not
 * reject requests that arrive without one.
 *
 * Useful for public endpoints that return richer data for authenticated users
 * (e.g. showing whether the current user has already liked an article).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(authHeader.slice(7));
    } catch {
      // Silently ignore invalid tokens — the route will treat this as anonymous
    }
  }

  next();
}

/**
 * Middleware factory: require that the authenticated user holds one of the
 * specified roles.
 *
 * Must be placed after requireAuth in the middleware chain — it assumes
 * req.user is already populated.
 *
 * @param roles - One or more accepted role strings (e.g. "editor", "journalist")
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
