import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, Document } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { canUploadDocument } from "@/server/auth/documentRbac";
import { buildS3Key, uploadFileToS3 } from "@/lib/s3";
import { DocumentCategory } from "@/models/types";
import { validateDocumentFile } from "@/config/documentLimits";
import { invalidateCachePrefix } from "@/lib/cache";

export const dynamic = "force-dynamic";

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

  // Tenant Boundary Check
  const company = await Company.findOne({
    $or: [
      { _id: companyId.match(/^[0-9a-fA-F]{24}$/) ? companyId : null },
      { companyCode: companyId.toUpperCase() },
      { slug: companyId.toLowerCase() },
    ],
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
  }

  if (session.role !== "superuser" && session.companyId && session.companyId.toString() !== company._id.toString()) {
    return NextResponse.json({ success: false, error: "Tenant boundary violation" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as DocumentCategory | null;
    const subType = (formData.get("subType") as string) || "";
    const entityId = (formData.get("entityId") as string) || null;
    const title = (formData.get("title") as string) || "";

    if (!file) {
      return NextResponse.json({ success: false, error: "File binary is required" }, { status: 400 });
    }

    const validCategories: DocumentCategory[] = ["EMPLOYEE", "PROJECT", "SALES", "SALARY_FINANCE"];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Valid category is required: EMPLOYEE, PROJECT, SALES, or SALARY_FINANCE" },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json({ success: false, error: "Document title is required" }, { status: 400 });
    }

    // Validate size and file extension
    const fileValidation = validateDocumentFile(category, file.size, file.name, file.type);
    if (!fileValidation.valid) {
      return NextResponse.json({ success: false, error: fileValidation.error }, { status: 400 });
    }

    // RBAC check
    const check = canUploadDocument(session, category, entityId);
    if (!check.allowed) {
      return NextResponse.json({ success: false, error: check.reason }, { status: 403 });
    }

    // Build S3 Key
    const s3Key = buildS3Key(company._id.toString(), category, entityId, file.name);

    // Stream / Upload to S3 directly via backend IAM credentials
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await uploadFileToS3(s3Key, fileBuffer, file.type || "application/octet-stream");

    // Save metadata record in MongoDB
    const doc = await Document.create({
      companyId: company._id,
      category,
      subType: subType.trim(),
      entityId: entityId || null,
      title: title.trim(),
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      s3Key,
      uploadedBy: session.userId,
    });

    invalidateCachePrefix("tenant_docs:");

    return NextResponse.json({
      success: true,
      message: "Document uploaded and metadata recorded successfully",
      data: doc,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Server upload failed" },
      { status: 500 }
    );
  }
}
