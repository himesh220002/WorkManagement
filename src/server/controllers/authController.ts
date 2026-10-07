import { Request, Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Company, User } from "@/models";
import { signToken } from "../auth/jwt";
import { CompanyStatus, UserRole, UserStatus } from "@/models/enums";

/**
 * 1. signupCompany Controller:
 * Executes an atomic database transaction creating both the Company entry
 * and the initial User profile with the 'owner' role.
 * Signs and returns a JWT containing { userId, companyId, role: 'owner' }.
 */
export async function signupCompany(req: Request, res: Response): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      companyName,
      companyCode,
      subdomain,
      ownerName,
      email,
      password,
      industry,
    } = req.body;

    // Validation
    if (!companyName || !ownerName || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "companyName, ownerName, email, and password are required.",
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedSlug = (subdomain || companyCode || companyName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const code = (companyCode || normalizedSlug).toUpperCase().trim();

    // Check for existing company with slug/subdomain/code
    const existingCompany = await Company.findOne({
      $or: [{ slug: normalizedSlug }, { companyCode: code }, { subdomain: normalizedSlug }],
    }).session(session);

    if (existingCompany) {
      res.status(409).json({
        success: false,
        error: "Company already exists",
        message: `Company with identifier '${code}' is already registered.`,
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check if user email already exists globally
    const existingUser = await User.findOne({ email: normalizedEmail }).session(session);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: "Email already in use",
        message: `An account with email '${normalizedEmail}' already exists.`,
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // 1. Create Company within the atomic transaction
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

    // 3. Create initial Owner user profile within transaction
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

    // Commit atomic transaction
    await session.commitTransaction();
    session.endSession();

    // 4. Generate signed JWT containing userId, companyId, and role
    const token = signToken({
      userId: owner._id.toString(),
      companyId: company._id.toString(),
      role: UserRole.Owner,
      email: owner.email!,
      name: owner.name,
    });

    res.status(201).json({
      success: true,
      message: "Company and Owner account created successfully.",
      data: {
        token,
        company: {
          id: company._id,
          name: company.name,
          slug: company.slug,
          companyCode: company.companyCode,
          status: company.status,
        },
        user: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role,
        },
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      error: "Signup failed",
      message: error.message || "Internal server error during company registration.",
    });
  }
}

/**
 * 2. loginUser Controller:
 * Verifies standard email/password credentials and company association.
 * Returns a signed JWT with { userId, companyId, role }.
 * Supports superuser developer global login.
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, companyCode } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Missing credentials",
        message: "Email and password are required.",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly select passwordHash
    const userQuery: any = { email: normalizedEmail };
    const user = await User.findOne(userQuery).select("+passwordHash");

    if (!user) {
      res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Invalid email or password.",
      });
      return;
    }

    // Verify account active status
    if (user.isActive === false || user.status === "Dropped") {
      res.status(403).json({
        success: false,
        error: "Account suspended",
        message: "This account has been deactivated. Please contact your organization owner.",
      });
      return;
    }

    // Verify password hash with bcrypt
    const isPasswordValid =
      typeof (user as any).comparePassword === "function"
        ? await (user as any).comparePassword(password)
        : await bcrypt.compare(password, (user as any).passwordHash || "");

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Invalid email or password.",
      });
      return;
    }

    // Check company status for non-superusers
    let companyData: any = null;
    const isSuperuser = (user.role || "").toLowerCase() === "superuser";

    if (!isSuperuser && user.companyId) {
      companyData = await Company.findById(user.companyId);
      if (companyData && companyData.status === "Suspended") {
        res.status(403).json({
          success: false,
          error: "Organization suspended",
          message: "Your organization account is currently suspended. Please contact support.",
        });
        return;
      }

      // If user specified a companyCode, verify it matches
      if (companyCode) {
        const targetCode = companyCode.trim().toUpperCase();
        if (
          companyData?.companyCode?.toUpperCase() !== targetCode &&
          companyData?.slug?.toLowerCase() !== companyCode.toLowerCase()
        ) {
          res.status(403).json({
            success: false,
            error: "Company mismatch",
            message: `User is not a member of organization code '${companyCode}'.`,
          });
          return;
        }
      }
    }

    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      companyId: user.companyId ? user.companyId.toString() : null,
      role: user.role || UserRole.Employee,
      email: user.email!,
      name: user.name,
    });

    res.status(200).json({
      success: true,
      message: "Authentication successful.",
      data: {
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
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Login error",
      message: error.message || "An unexpected error occurred during login.",
    });
  }
}

/**
 * 3. registerUserWithInvite Controller:
 * Invites or registers new team members under a verified companyId with designated RBAC role.
 */
export async function registerUserWithInvite(req: Request, res: Response): Promise<void> {
  try {
    const { companyId, name, email, password, role, position } = req.body;

    if (!companyId || !name || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "companyId, name, email, and password are required.",
      });
      return;
    }

    const company = await Company.findById(companyId);
    if (!company || company.status !== CompanyStatus.Active) {
      res.status(404).json({
        success: false,
        error: "Invalid company",
        message: "The specified company tenant does not exist or is inactive.",
      });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        error: "Email exists",
        message: `User with email '${normalizedEmail}' is already registered.`,
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Validate designated role
    const assignedRole = [
      UserRole.Owner,
      UserRole.Manager,
      UserRole.TeamLead,
      UserRole.Employee,
    ].includes(role)
      ? role
      : UserRole.Employee;

    const newUser = await User.create({
      companyId: company._id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      position: position || "Specialist",
      status: UserStatus.Working,
      isActive: true,
      rank: assignedRole === UserRole.Manager ? "3" : assignedRole === UserRole.TeamLead ? "2" : "1",
      joinedDate: new Date(),
    });

    const token = signToken({
      userId: newUser._id.toString(),
      companyId: company._id.toString(),
      role: assignedRole,
      email: newUser.email!,
      name: newUser.name,
    });

    res.status(201).json({
      success: true,
      message: `User successfully registered under company ${company.name}.`,
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          companyId: company._id,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Invitation registration error",
      message: error.message || "Failed to register user.",
    });
  }
}
