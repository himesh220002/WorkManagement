import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, User } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { canUploadDocument } from "@/server/auth/documentRbac";
import { buildS3Key, generatePresignedUploadUrl, isAwsConfigured } from "@/lib/s3";
import { DocumentCategory } from "@/models/types";
import { validateDocumentFile } from "@/config/documentLimits";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { companyId } = await params;

  if (!session.userId) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  // Tenant Boundary Check: verify company exists and matches session (unless superuser)
  const company = await Company.findOne({
    $or: [{ _id: companyId.match(/^[0-9a-fA-F]{24}$/) ? companyId : null }, { companyCode: companyId.toUpperCase() }, { slug: companyId.toLowerCase() }],
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
  }

  if (session.role !== "superuser" && session.companyId && session.companyId.toString() !== company._id.toString()) {
    return NextResponse.json({ success: false, error: "Tenant boundary violation" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { category, entityId, fileName, mimeType, fileSize } = body;

    const validCategories: DocumentCategory[] = ["EMPLOYEE", "PROJECT", "SALES", "SALARY_FINANCE"];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Valid category is required: EMPLOYEE, PROJECT, SALES, or SALARY_FINANCE" },
        { status: 400 }
      );
    }

    if (!fileName || !mimeType) {
      return NextResponse.json({ success: false, error: "fileName and mimeType are required" }, { status: 400 });
    }

    // File size and extension restrictions validation
    const fileValidation = validateDocumentFile(category, Number(fileSize) || 0, fileName, mimeType);
    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, error: fileValidation.error }, { status: 400 });
    }

    // RBAC validation
    const check = canUploadDocument(session, category, entityId);
    if (!check.allowed) {
      return NextResponse.json({ success: false, error: check.reason }, { status: 403 });
    }

    // Build S3 Key
    const s3Key = buildS3Key(company._id.toString(), category, entityId, fileName);

    // Generate Presigned Upload URL (Valid for 5 minutes)
    const { uploadUrl, isMock } = await generatePresignedUploadUrl(s3Key, mimeType, 300);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        s3Key,
        expiresInSeconds: 300,
        isMock,
        instructions: isMock
          ? "AWS credentials not configured yet in .env (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME). Operating in local mock mode."
          : "Direct browser-to-S3 upload URL generated. Send PUT request with file binary.",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to generate presigned upload URL" }, { status: 500 });
  }
}
