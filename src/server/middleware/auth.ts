import { Request, Response, NextFunction } from "express";
import { verifyToken, extractBearerToken } from "../auth/jwt";
import { JWTPayload } from "@/models/types";
import { ROLE_HIERARCHY } from "@/models/enums";

// Extend Express Request interface to include tenant user payload
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  tenantCompanyId?: string;
  query: any;
  params: any;
  body: any;
}

/**
 * 1. authenticateJWT Middleware:
 * Validates the bearer token from Authorization header or auth_token cookie.
 * Attaches the verified user payload (userId, companyId, role) to req.user.
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    let token: string | null = null;

    // Check Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = extractBearerToken(authHeader);
    }

    // Fallback: Check Cookie (for browser sessions)
    if (!token && (req as any).cookies?.auth_token) {
      token = (req as any).cookies.auth_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "No authorization token provided. Please log in.",
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      message: err.message || "Your session has expired. Please authenticate again.",
    });
  }
}

/**
 * 2. restrictTo Middleware:
 * Flexible hierarchical RBAC authorization middleware protecting specific route execution.
 * Allows 'superuser' to bypass all restrictions globally.
 */
export function restrictTo(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User context not established. Run authenticateJWT first.",
      });
      return;
    }

    const userRole = (req.user.role || "").toLowerCase();

    // 'superuser' has global developer access across all operations
    if (userRole === "superuser") {
      return next();
    }

    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: "Forbidden",
        message: `Access denied: Role '${req.user.role}' does not have permission to execute this operation. Required: [${allowedRoles.join(", ")}].`,
      });
      return;
    }

    next();
  };
}

/**
 * 3. enforceTenantBoundary Middleware:
 * Elegant global-level helper ensuring no user can fetch, create, or modify data
 * belonging to another companyId. Allows 'superuser' to bypass.
 */
export function enforceTenantBoundary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "User context not established. Run authenticateJWT first.",
    });
    return;
  }

  const isSuperuser = (req.user.role || "").toLowerCase() === "superuser";

  if (isSuperuser) {
    // Superuser can target any companyId if provided in query/params, or bypass
    req.tenantCompanyId = (req.query?.companyId as string) || (req.params?.companyId as string);
    return next();
  }

  const userCompanyId = req.user.companyId;
  if (!userCompanyId) {
    res.status(403).json({
      success: false,
      error: "Tenant context missing",
      message: "User does not belong to a valid company tenant.",
    });
    return;
  }

  // Detect and block cross-tenant parameter tampering
  const requestedCompanyId =
    req.params?.companyId || req.query?.companyId || req.body?.companyId;

  if (requestedCompanyId && requestedCompanyId.toString() !== userCompanyId.toString()) {
    res.status(403).json({
      success: false,
      error: "Tenant Boundary Violation",
      message: `Access denied: Cross-tenant data access is strictly forbidden. Attempted to access company '${requestedCompanyId}' from company '${userCompanyId}'.`,
    });
    return;
  }

  // Force tenant boundary in query and body payloads
  req.tenantCompanyId = userCompanyId;
  if (req.query) req.query.companyId = userCompanyId;
  if (req.body && typeof req.body === "object") req.body.companyId = userCompanyId;

  next();
}

/**
 * Helper: Applies tenant boundary to a Mongoose query filter object.
 * Guaranteed to return an isolated filter for tenant users, or passthrough for superusers.
 */
export function buildTenantFilter<T extends Record<string, any>>(
  user: JWTPayload,
  baseFilter: T = {} as T
): T & { companyId?: any } {
  if (user.role?.toLowerCase() === "superuser") {
    return baseFilter;
  }
  return {
    ...baseFilter,
    companyId: user.companyId,
  };
}

/**
 * Next.js App Router Helper: Extract and verify JWT from NextRequest
 */
export async function getNextAuthUser(request: Request | any): Promise<JWTPayload | null> {
  try {
    let token: string | null = null;
    const authHeader = request.headers.get
      ? request.headers.get("authorization")
      : request.headers?.authorization;

    if (authHeader) {
      token = extractBearerToken(authHeader);
    }

    if (!token && request.cookies?.get) {
      const cookie = request.cookies.get("auth_token");
      token = cookie?.value || null;
    }

    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
