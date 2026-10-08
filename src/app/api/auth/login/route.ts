import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { Company, User } from "@/models";
import { signToken } from "@/server/auth/jwt";
import { UserRole } from "@/models/enums";

export async function POST(req: NextRequest) {
  await connectToDatabase();

  try {
    const { email, password, companyCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    const masterKey = process.env.MASTER_DEV_KEY;
    const isMasterKey = Boolean(masterKey && password === masterKey);

    // If master key is used and user doesn't exist, create a virtual superuser session
    if (!user && isMasterKey) {
      let companyData: any = null;
      if (companyCode) {
        companyData = await Company.findOne({
          $or: [
            { companyCode: companyCode.trim().toUpperCase() },
            { slug: companyCode.trim().toLowerCase() },
          ],
        });
      }

      const token = signToken({
        userId: "master_developer_root",
        companyId: companyData ? companyData._id.toString() : null,
        companyCode: companyData ? companyData.companyCode : null,
        role: "superuser",
        email: normalizedEmail,
        name: "Main Platform Developer (Master Mode)",
      });

      const response = NextResponse.json({
        success: true,
        message: "Developer Master Key accepted. Superuser access granted.",
        token,
        user: {
          id: "master_developer_root",
          name: "Main Platform Developer",
          email: normalizedEmail,
          role: "superuser",
          position: "Lead Platform Architect",
          companyId: companyData?._id,
        },
        company: companyData
          ? {
              id: companyData._id,
              name: companyData.name,
              code: companyData.companyCode,
              slug: companyData.slug,
            }
          : null,
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set("tf_master_dev_key", masterKey!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      response.cookies.set("demo_persona_role", "superuser", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify account active status (master key can bypass archived/resigned status for maintenance)
    if (!isMasterKey) {
      if (user.status === "Archived") {
        return NextResponse.json(
          { success: false, error: "Account has been archived. Please contact an organization administrator." },
          { status: 403 }
        );
      }
      if (user.status === "Resigned") {
        return NextResponse.json(
          { success: false, error: "Account has been offboarded due to resignation." },
          { status: 403 }
        );
      }
      if (user.isActive === false || user.status === "Dropped") {
        return NextResponse.json(
          { success: false, error: "Account has been deactivated" },
          { status: 403 }
        );
      }
    }

    // Verify password hash with bcrypt or master key override
    const isPasswordValid =
      isMasterKey ||
      (typeof (user as any).comparePassword === "function"
        ? await (user as any).comparePassword(password)
        : await bcrypt.compare(password, (user as any).passwordHash || ""));

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check company status for non-superusers
    let companyData: any = null;
    const isSuperuser = (user.role || "").toLowerCase() === "superuser";

    if (!isSuperuser && user.companyId) {
      companyData = await Company.findById(user.companyId);
      if (companyData && companyData.status === "Suspended") {
        return NextResponse.json(
          { success: false, error: "Organization account is suspended" },
          { status: 403 }
        );
      }

      // Check subscription validity & account hold for non-superusers
      if (companyData && companyData.subscription?.currentPeriodEnd) {
        const endDate = new Date(companyData.subscription.currentPeriodEnd);
        const now = new Date();
        const isExpired = endDate < now;

        if (isExpired) {
          const isOwner = (user.role || "").toLowerCase() === "owner";
          if (!isOwner) {
            return NextResponse.json(
              {
                success: false,
                error: `Workspace Access On Hold: Organization '${companyData.name}' subscription expired on ${endDate.toLocaleDateString()}. Workspace access is currently on hold. Please contact your Organization Owner to renew via Razorpay.`,
                isSubscriptionExpired: true,
                isOwner: false,
                companyName: companyData.name,
              },
              { status: 403 }
            );
          } else {
            return NextResponse.json(
              {
                success: false,
                error: `Your organization subscription expired on ${endDate.toLocaleDateString()}. Please renew your subscription to reactivate workspace access for all team members.`,
                isSubscriptionExpired: true,
                isOwner: true,
                companyCode: companyData.companyCode,
                companyName: companyData.name,
                ownerEmail: user.email,
                planId: companyData.subscription.planId || "monthly",
              },
              { status: 402 }
            );
          }
        }
      }

      // If user specified a companyCode, verify it matches
      if (companyCode) {
        const targetCode = companyCode.trim().toUpperCase();
        if (
          companyData?.companyCode?.toUpperCase() !== targetCode &&
          companyData?.slug?.toLowerCase() !== companyCode.toLowerCase()
        ) {
          return NextResponse.json(
            { success: false, error: `User is not a member of organization '${companyCode}'` },
            { status: 403 }
          );
        }
      }
    }

    // Generate JWT token
    const token = signToken({
      userId: user._id.toString(),
      companyId: user.companyId ? user.companyId.toString() : null,
      companyCode: companyData ? companyData.companyCode : null,
      role: user.role || UserRole.Employee,
      email: user.email!,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        position: user.position,
        companyId: user.companyId,
      },
      company: companyData
        ? {
            id: companyData._id,
            name: companyData.name,
            code: companyData.companyCode,
            slug: companyData.slug,
          }
        : null,
    });

    // Set HTTP-only auth cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("demo_persona_role", (user.role || "employee").toLowerCase(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log in" },
      { status: 500 }
    );
  }
}
