import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Company, Document, Project } from "@/models";
import { getCurrentSession } from "@/server/auth/session";
import { canViewDocument, canUploadDocument } from "@/server/auth/documentRbac";
import { DocumentCategory } from "@/models/types";
import { deleteS3Object } from "@/lib/s3";
import { invalidateCachePrefix } from "@/lib/cache";

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
    const { category, subType, entityId, title, originalName, mimeType, fileSize, s3Key } = body;

    if (!category || !title || !originalName || !mimeType || !s3Key) {
      return NextResponse.json(
        { success: false, error: "category, title, originalName, mimeType, and s3Key are required" },
        { status: 400 }
      );
    }

    // RBAC check
    const check = canUploadDocument(session, category as DocumentCategory, entityId);
    if (!check.allowed) {
      return NextResponse.json({ success: false, error: check.reason }, { status: 403 });
    }

    const doc = await Document.create({
      companyId: company._id,
      category,
      subType: subType?.trim() || "",
      entityId: entityId || null,
      title: title.trim(),
      originalName: originalName.trim(),
      mimeType,
      fileSize: Number(fileSize) || 0,
      s3Key,
      uploadedBy: session.userId,
    });

    // Invalidate document cache on mutation
    invalidateCachePrefix("tenant_docs:");

    return NextResponse.json({
      success: true,
      message: "Document metadata successfully recorded",
      data: doc,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to record document metadata" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { companyId } = await params;

  if (!session.userId) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const company = await Company.findOne({
    $or: [{ _id: companyId.match(/^[0-9a-fA-F]{24}$/) ? companyId : null }, { companyCode: companyId.toUpperCase() }, { slug: companyId.toLowerCase() }],
  });

  if (!company) {
    return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
  }

  if (session.role !== "superuser" && session.companyId && session.companyId.toString() !== company._id.toString()) {
    return NextResponse.json({ success: false, error: "Tenant boundary violation" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const categoryParam = searchParams.get("category");
  const entityId = searchParams.get("entityId");
  const subType = searchParams.get("subType");

  const query: any = { companyId: company._id };
  if (categoryParam && categoryParam !== "ALL") query.category = categoryParam;
  if (entityId && entityId !== "ALL") query.entityId = entityId;
  if (subType && subType !== "ALL") query.subType = subType;

  try {
    const rawDocs = await Document.find(query)
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // Cache project member IDs if project docs exist
    const projectMemberCache = new Map<string, string[]>();
    const projectIds = rawDocs.filter((d: any) => d.category === "PROJECT" && d.entityId).map((d: any) => d.entityId);
    if (projectIds.length > 0) {
      const projects = await Project.find({ _id: { $in: projectIds } }).select("memberIds").lean();
      projects.forEach((p: any) => {
        projectMemberCache.set(p._id.toString(), (p.memberIds || []).map((m: any) => m.toString()));
      });
    }

    // Filter results through RBAC
    const filteredDocs = rawDocs.filter((doc: any) => {
      const check = canViewDocument(session, {
        category: doc.category,
        entityId: doc.entityId ? doc.entityId.toString() : null,
        uploadedBy: doc.uploadedBy ? (doc.uploadedBy._id || doc.uploadedBy).toString() : undefined,
        assignedProjectMemberIds: doc.entityId ? projectMemberCache.get(doc.entityId.toString()) : undefined,
      });
      return check.allowed;
    });

    return NextResponse.json(
      {
        success: true,
        count: filteredDocs.length,
        data: filteredDocs,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to list documents" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { companyId } = await params;

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

  try {
    const body = await req.json();
    const { docId, action } = body;

    if (!docId || !action) {
      return NextResponse.json({ success: false, error: "docId and action ('archive' | 'restore') are required" }, { status: 400 });
    }

    const doc = await Document.findOne({ _id: docId, companyId: company._id });
    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    if (action === "archive") {
      doc.isArchived = true;
      doc.archivedAt = new Date();
      doc.archivedBy = session.userId as any;
      await doc.save();

      // Invalidate document cache on archive
      invalidateCachePrefix("tenant_docs:");

      return NextResponse.json({
        success: true,
        message: `'${doc.title}' has been moved to the Archive folder. Active workspace is clean.`,
        data: doc,
      });
    } else if (action === "restore") {
      doc.isArchived = false;
      doc.archivedAt = null;
      doc.archivedBy = null;
      await doc.save();

      // Invalidate document cache on restore
      invalidateCachePrefix("tenant_docs:");

      return NextResponse.json({
        success: true,
        message: `'${doc.title}' has been restored to the active workspace.`,
        data: doc,
      });
    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Use 'archive' or 'restore'." }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to update document status" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  await connectToDatabase();
  const session = await getCurrentSession();
  const { companyId } = await params;

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

  // Strictly check that only Owner, Manager, or Superuser can delete
  const isManagerOrOwner = ["superuser", "owner", "manager"].includes(session.role);
  if (!isManagerOrOwner) {
    return NextResponse.json(
      {
        success: false,
        error: "Permission denied. Only organization Owner or Managers are authorized to delete documents. Standard members can use the Archive option.",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("docId");
  const scope = searchParams.get("scope") || "vault_only"; // "both" | "vault_only"

  if (!docId) {
    return NextResponse.json({ success: false, error: "docId is required" }, { status: 400 });
  }

  try {
    const doc = await Document.findOne({ _id: docId, companyId: company._id });
    if (!doc) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    if (scope === "both") {
      // Delete permanently from AWS S3 storage
      await deleteS3Object(doc.s3Key);
      // Delete metadata from MongoDB
      await Document.deleteOne({ _id: doc._id });

      // Invalidate document cache on delete
      invalidateCachePrefix("tenant_docs:");

      return NextResponse.json({
        success: true,
        scope: "both",
        message: `'${doc.title}' permanently purged from both TaskFlow Vault and AWS S3 storage.`,
      });
    } else {
      // Delete metadata from MongoDB only (preserves AWS S3 object)
      await Document.deleteOne({ _id: doc._id });

      // Invalidate document cache on delete
      invalidateCachePrefix("tenant_docs:");

      return NextResponse.json({
        success: true,
        scope: "vault_only",
        message: `'${doc.title}' removed from Vault. Binary file remains safely archived in AWS S3.`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to delete document" }, { status: 500 });
  }
}
