import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Company, User } from "@/models";
import { signToken } from "@/server/auth/jwt";
import { CompanyStatus, UserRole, UserStatus } from "@/models/enums";
import { migrateCompanyToDedicatedDb } from "@/lib/tenantDb";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = await req.json();
    const { companyName, companyCode, subdomain, ownerName, email, password, industry } = body;

    if (!companyName || !ownerName || !email || !password) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedSlug = (subdomain || companyCode || companyName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Enforce memorable 6-character alphanumeric uppercase company code (e.g. ACME01, OMEGA1)
    let code: string;
    if (companyCode && companyCode.trim().length > 0) {
      code = companyCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length > 6) code = code.slice(0, 6);
      while (code.length < 6) {
        code += Math.floor(Math.random() * 10).toString();
      }
    } else {
      const prefix = (companyName || "CORP")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 3);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      code = prefix;
      while (code.length < 6) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = code.slice(0, 6);
    }

    // Check existing company
    const existingCompany = await Company.findOne({
      $or: [{ slug: normalizedSlug }, { companyCode: code }, { subdomain: normalizedSlug }],
    }).session(session);

    if (existingCompany) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, error: `Company with identifier '${code}' already exists` },
        { status: 409 }
      );
    }

    // Check existing user
    const existingUser = await User.findOne({ email: normalizedEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return NextResponse.json(
        { success: false, error: `Email '${normalizedEmail}' already registered` },
        { status: 409 }
      );
    }

    // 1. Create company in transaction
    const [company] = await Company.create(
      [
        {
          name: companyName.trim(),
          slug: normalizedSlug,
          subdomain: normalizedSlug,
          companyCode: code,
          industry: industry || "Technology",
          status: CompanyStatus.Active,
          settings: {
            currency: "USD",
            timezone: "UTC",
            workingDays: [1, 2, 3, 4, 5],
          },
        },
      ],
      { session }
    );

    // 2. Hash owner password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create owner in transaction
    const [owner] = await User.create(
      [
        {
          companyId: company._id,
          name: ownerName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: UserRole.Owner,
          status: UserStatus.Working,
          isActive: true,
          position: "Organization Founder & Owner",
          rank: "5",
          joinedDate: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Pre-initialize dedicated tenant database for this company
    try {
      await migrateCompanyToDedicatedDb(company.companyCode || code, company._id.toString());
    } catch (e) {
      console.warn("Could not pre-initialize dedicated tenant DB:", e);
    }

    // 4. Generate signed JWT token
    const token = signToken({
      userId: owner._id.toString(),
      companyId: company._id.toString(),
      companyCode: company.companyCode,
      role: UserRole.Owner,
      email: owner.email!,
      name: owner.name,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Company and Owner account registered successfully.",
        token,
        company: {
          id: company._id,
          name: company.name,
          code: company.companyCode,
          slug: company.slug,
        },
        user: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    response.cookies.set("demo_persona_role", "owner", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register company" },
      { status: 500 }
    );
  }
}
