import jwt, { SignOptions } from "jsonwebtoken";
import { JWTPayload } from "@/models/types";

const JWT_SECRET: string =
  process.env.JWT_SECRET || "taskflow-super-secure-jwt-secret-key-2026";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Signs a production-grade JWT token with tenant and RBAC payload
 */
export function signToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresIn: string = JWT_EXPIRES_IN
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verifies and decodes a JWT token. Throws on signature mismatch or expiration.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Extracts a Bearer token from authorization headers or raw strings
 */
export function extractBearerToken(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }
  return authHeader;
}
