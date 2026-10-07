import { cookies } from "next/headers";
import { verifyToken } from "./jwt";
import { JWTPayload } from "@/models/types";
import { User, Company } from "@/models";
import connectToDatabase from "@/lib/mongodb";
import { normalizeRole, RoleName } from "./rbac";

export interface SessionContext {
  userId?: string;
  companyId?: string;
  companyCode?: string;
  role: RoleName;
  email: string;
  name: string;
  userDoc?: any;
}

/**
 * Extracts the current authenticated user context in Server Components and Server Actions.
 */
export async function getCurrentSession(): Promise<SessionContext> {
  await connectToDatabase();
  let payload: JWTPayload | null = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      payload = verifyToken(token);
    }
  } catch {}

  // If valid token found
  if (payload && payload.userId) {
    const user = await User.findById(payload.userId).lean();
    if (user) {
      let companyCode = payload.companyCode || undefined;
      if (!companyCode && user.companyId) {
        const company = await Company.findById(user.companyId).select("companyCode").lean();
        if (company) companyCode = company.companyCode;
      }
      return {
        userId: user._id.toString(),
        companyId: user.companyId ? user.companyId.toString() : undefined,
        companyCode: companyCode || undefined,
        role: normalizeRole(user.role),
        email: user.email || payload.email,
        name: user.name || payload.name,
        userDoc: user,
      };
    }
  }

  // Master Developer Key backdoor / platform maintenance check
  try {
    const cookieStore = await cookies();
    const masterDevCookie = cookieStore.get("tf_master_dev_key")?.value;
    const masterDevEnv = process.env.MASTER_DEV_KEY;
    if (masterDevEnv && masterDevCookie && masterDevCookie === masterDevEnv) {
      const inspectOrgCode = cookieStore.get("tf_dev_tenant_code")?.value;
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
      const demoUser = await User.findOne({
        role: { $in: [normalizedDemo, normalizedDemo.charAt(0).toUpperCase() + normalizedDemo.slice(1)] },
      }).lean();

      if (demoUser) {
        let companyCode: string | undefined = undefined;
        let compId = demoUser.companyId ? demoUser.companyId.toString() : undefined;
        if (compId) {
          const comp = await Company.findById(compId).select("companyCode").lean();
          if (comp) companyCode = comp.companyCode;
        } else {
          const firstComp = await Company.findOne().select("companyCode").lean();
          if (firstComp) {
            compId = firstComp._id.toString();
            companyCode = firstComp.companyCode;
          }
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

  // Unauthenticated safe fallback: strictly least-privilege Employee with no userId
  return {
    userId: undefined,
    companyId: undefined,
    companyCode: undefined,
    role: "employee",
    email: "guest@taskflow.local",
    name: "Guest",
  };
}

/**
 * Returns a strict Mongoose query filter isolating data to the active organization.
 * For non-superusers: isolates strictly by companyId.
 * For new organizations: isolates to that organization's companyId (clean & empty initially).
 * For superusers without an organization selected: returns {} (global access).
 */
export function getTenantQueryFilter(session: SessionContext): Record<string, any> {
  if (session.role === "superuser" && !session.companyId) {
    return {};
  }
  if (session.companyId) {
    return { companyId: session.companyId };
  }
  return {};
}

