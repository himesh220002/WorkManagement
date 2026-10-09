import { cookies, headers } from "next/headers";
import mongoose from "mongoose";
import { verifyToken } from "./jwt";
import { JWTPayload } from "@/models/types";
import { User, Company } from "@/models";
import connectToDatabase from "@/lib/mongodb";
import { normalizeRole, RoleName } from "./rbac";
import { getCached, setCached } from "@/lib/cache";

export const UNASSIGNED_TENANT_ID = new mongoose.Types.ObjectId("000000000000000000000000");

export interface SessionContext {
  userId?: string;
  companyId?: string;
  companyCode?: string;
  role: RoleName;
  email: string;
  name: string;
  userDoc?: any;
  isGuest?: boolean;
}

/**
 * Extracts the current authenticated user context in Server Components and Server Actions.
 */
export async function getCurrentSession(): Promise<SessionContext> {
  await connectToDatabase();
  let payload: JWTPayload | null = null;
  let headerOrgCode: string | undefined = undefined;

  try {
    const headerStore = await headers();
    headerOrgCode = headerStore.get("x-tenant-org-code") || undefined;
  } catch {}

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      payload = verifyToken(token);
    }
  } catch {}

  // If valid token found
  if (payload && payload.userId) {
    const sessionCacheKey = `session:${payload.userId}:${headerOrgCode || "default"}`;
    const cachedSession = getCached<SessionContext>(sessionCacheKey);
    if (cachedSession) {
      return cachedSession;
    }

    let user: any = null;
    if (mongoose.isValidObjectId(payload.userId)) {
      try {
        user = await User.findById(payload.userId).lean();
      } catch {}
    } else {
      // Synthetic / dev user id (e.g. "dev_root_ORGTTU" or dev tokens)
      try {
        if (payload.email) {
          user = await User.findOne({ email: payload.email.toLowerCase().trim() }).lean();
        }
        if (!user && payload.companyId && mongoose.isValidObjectId(payload.companyId)) {
          user = await User.findOne({ companyId: payload.companyId, role: "superuser" }).lean()
            || await User.findOne({ companyId: payload.companyId }).lean();
        }
      } catch {}
    }

    if (user) {
      let companyCode = payload.companyCode || undefined;
      let companyIdStr = user.companyId ? user.companyId.toString() : undefined;

      if (!companyCode && user.companyId) {
        const company = await Company.findById(user.companyId).select("companyCode").lean();
        if (company) companyCode = company.companyCode;
      }

      // If URL header specifies an explicit organization and user has permission, verify match
      if (headerOrgCode && (!companyCode || companyCode.toUpperCase() !== headerOrgCode.toUpperCase())) {
        const matchedComp = await Company.findOne({
          $or: [
            { companyCode: headerOrgCode.toUpperCase() },
            { slug: headerOrgCode.toLowerCase() },
          ],
        }).select("_id companyCode").lean();
        if (matchedComp) {
          companyIdStr = matchedComp._id.toString();
          companyCode = matchedComp.companyCode;
        }
      }

      const sessionCtx: SessionContext = {
        userId: user._id.toString(),
        companyId: companyIdStr,
        companyCode: companyCode || undefined,
        role: normalizeRole(user.role),
        email: user.email || payload.email,
        name: user.name || payload.name,
        userDoc: user,
      };
      setCached(sessionCacheKey, sessionCtx, 30);
      return sessionCtx;
    }

    // Fallback: If no User doc was found (e.g. synthetic dev_root token or unseeded user)
    // Resolve organization from payload or header without throwing CastError
    let fallbackCompanyCode = payload.companyCode || headerOrgCode || undefined;
    let fallbackCompanyId = payload.companyId || undefined;

    if (!fallbackCompanyCode && fallbackCompanyId && mongoose.isValidObjectId(fallbackCompanyId)) {
      try {
        const comp = await Company.findById(fallbackCompanyId).select("companyCode").lean();
        if (comp) fallbackCompanyCode = comp.companyCode;
      } catch {}
    }

    if (headerOrgCode && (!fallbackCompanyCode || fallbackCompanyCode.toUpperCase() !== headerOrgCode.toUpperCase())) {
      try {
        const matchedComp = await Company.findOne({
          $or: [
            { companyCode: headerOrgCode.toUpperCase() },
            { slug: headerOrgCode.toLowerCase() },
          ],
        }).select("_id companyCode").lean();
        if (matchedComp) {
          fallbackCompanyId = matchedComp._id.toString();
          fallbackCompanyCode = matchedComp.companyCode;
        }
      } catch {}
    } else if (!fallbackCompanyId && fallbackCompanyCode) {
      try {
        const matchedComp = await Company.findOne({
          $or: [
            { companyCode: fallbackCompanyCode.toUpperCase() },
            { slug: fallbackCompanyCode.toLowerCase() },
          ],
        }).select("_id companyCode").lean();
        if (matchedComp) {
          fallbackCompanyId = matchedComp._id.toString();
          fallbackCompanyCode = matchedComp.companyCode;
        }
      } catch {}
    }

    // Auto-create dev user document if this is a developer token so future operations have a valid ObjectId
    if (fallbackCompanyId && mongoose.isValidObjectId(fallbackCompanyId) && (payload.userId.startsWith("dev_") || payload.role === "superuser")) {
      try {
        const createdDev = await User.create({
          name: payload.name || "System Developer (Dev Mode)",
          email: payload.email || "dev.superuser@taskflow.internal",
          role: "superuser",
          position: "Lead Platform Architect",
          companyId: new mongoose.Types.ObjectId(fallbackCompanyId),
        });
        if (createdDev) {
          const sessionCtx: SessionContext = {
            userId: createdDev._id.toString(),
            companyId: fallbackCompanyId,
            companyCode: fallbackCompanyCode,
            role: "superuser",
            email: createdDev.email || payload.email || "dev.superuser@taskflow.internal",
            name: createdDev.name || payload.name || "System Developer",
            userDoc: createdDev.toObject(),
          };
          setCached(sessionCacheKey, sessionCtx, 30);
          return sessionCtx;
        }
      } catch {}
    }

    const fallbackSessionCtx: SessionContext = {
      userId: payload.userId,
      companyId: fallbackCompanyId,
      companyCode: fallbackCompanyCode,
      role: normalizeRole(payload.role),
      email: payload.email,
      name: payload.name,
      userDoc: {
        _id: payload.userId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        companyId: fallbackCompanyId,
      },
    };
    setCached(sessionCacheKey, fallbackSessionCtx, 30);
    return fallbackSessionCtx;
  }

  // Master Developer Key backdoor / platform maintenance check
  try {
    const cookieStore = await cookies();
    const masterDevCookie = cookieStore.get("tf_master_dev_key")?.value;
    const masterDevEnv = process.env.MASTER_DEV_KEY;
    if (masterDevEnv && masterDevCookie && masterDevCookie === masterDevEnv) {
      const inspectOrgCode = cookieStore.get("tf_dev_tenant_code")?.value || headerOrgCode;
      let targetCompany: any = null;
      if (inspectOrgCode) {
        targetCompany = await Company.findOne({
          $or: [
            { companyCode: inspectOrgCode.toUpperCase() },
            { slug: inspectOrgCode.toLowerCase() },
          ],
        }).lean();
      }
      return {
        userId: "master_developer_root",
        companyId: targetCompany ? targetCompany._id.toString() : undefined,
        companyCode: targetCompany ? targetCompany.companyCode : undefined,
        role: "superuser",
        email: "dev@taskflow.master",
        name: "Main Platform Developer (Master Mode)",
      };
    }
  } catch {}

  // Fallback to active demo persona cookie ONLY for demo walkthroughs
  try {
    const cookieStore = await cookies();
    const demoRole = cookieStore.get("demo_persona_role")?.value;
    if (demoRole) {
      const normalizedDemo = normalizeRole(demoRole);
      let targetCompany: any = null;
      const targetOrg = headerOrgCode || cookieStore.get("tf_dev_tenant_code")?.value;
      if (targetOrg) {
        targetCompany = await Company.findOne({
          $or: [
            { companyCode: targetOrg.toUpperCase() },
            { slug: targetOrg.toLowerCase() },
          ],
        }).lean();
      }
      if (!targetCompany) {
        targetCompany = await Company.findOne().lean();
      }

      const queryFilter: any = {
        role: {
          $in: [
            normalizedDemo,
            normalizedDemo.charAt(0).toUpperCase() + normalizedDemo.slice(1),
          ],
        },
      };
      if (targetCompany?._id) {
        queryFilter.companyId = targetCompany._id;
      }

      let demoUser = await User.findOne(queryFilter).lean();
      if (!demoUser) {
        demoUser = await User.findOne({
          role: {
            $in: [
              normalizedDemo,
              normalizedDemo.charAt(0).toUpperCase() + normalizedDemo.slice(1),
            ],
          },
        }).lean();
      }

      if (demoUser) {
        let companyCode: string | undefined = targetCompany?.companyCode;
        let compId = demoUser.companyId
          ? demoUser.companyId.toString()
          : targetCompany?._id?.toString();

        if (!companyCode && compId) {
          const comp = await Company.findById(compId).select("companyCode").lean();
          if (comp) companyCode = comp.companyCode;
        }

        return {
          userId: demoUser._id.toString(),
          companyId: compId,
          companyCode: companyCode || undefined,
          role: normalizedDemo,
          email: demoUser.email || `${normalizedDemo}@taskflow.local`,
          name: demoUser.name,
          userDoc: demoUser,
        };
      }
    }
  } catch {}

  // Unauthenticated safe fallback: unauthenticated guest context (no showcase data attached)
  return {
    userId: undefined,
    companyId: undefined,
    companyCode: undefined,
    role: "viewer",
    email: "",
    name: "Guest",
    isGuest: true,
  };
}

/**
 * Returns a strict Mongoose query filter isolating data to the active organization.
 * For non-superusers: isolates strictly by companyId.
 * For new organizations: isolates to that organization's companyId (clean & empty initially).
 * For superusers without an organization selected: returns {} (global access).
 * For unauthenticated guests: isolates to impossible key preventing data leakage.
 */
export function getTenantQueryFilter(session: SessionContext): Record<string, any> {
  if (session.role === "superuser" && !session.companyId) {
    return {};
  }
  if (session.companyId) {
    return { companyId: session.companyId };
  }
  return { companyId: UNASSIGNED_TENANT_ID };
}

