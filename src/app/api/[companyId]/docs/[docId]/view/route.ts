import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, Document, Project } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { canViewDocument } from "@/server/auth/documentRbac";
import { generatePresignedDownloadUrl } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string; docId: string }> }
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { companyId, docId } = await params;

  if (!session.userId) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

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

  const doc = await Document.findById(docId);
  if (!doc) {
    return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
  }

  if (doc.companyId.toString() !== company._id.toString()) {
    return NextResponse.json({ success: false, error: "Tenant boundary violation" }, { status: 403 });
  }

  // Fetch project members if it's a project doc
  let assignedMemberIds: string[] | undefined = undefined;
  if (doc.category === "PROJECT" && doc.entityId) {
    const project = await Project.findById(doc.entityId).select("memberIds").lean();
    if (project) {
      assignedMemberIds = (project.memberIds || []).map((m: any) => m.toString());
    }
  }

  // RBAC validation
  const check = canViewDocument(session, {
    category: doc.category,
    entityId: doc.entityId ? doc.entityId.toString() : null,
    uploadedBy: doc.uploadedBy ? doc.uploadedBy.toString() : undefined,
    assignedProjectMemberIds: assignedMemberIds,
  });

  if (!check.allowed) {
    return NextResponse.json({ success: false, error: check.reason }, { status: 403 });
  }

  try {
    // Generate 60-second read-only presigned download/preview URL
    const { viewUrl, isMock } = await generatePresignedDownloadUrl(doc.s3Key, doc.originalName, 60);

    return NextResponse.json({
      success: true,
      data: {
        docId: doc._id,
        title: doc.title,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        category: doc.category,
        viewUrl,
        expiresInSeconds: 60,
        isMock,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate presigned download URL" },
      { status: 500 }
    );
  }
}
