import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Whiteboard } from "@/models";
import { getCurrentSession, getTenantQueryFilter, UNASSIGNED_TENANT_ID } from "@/server/auth/session";
import { syncTenantWrite } from "@/lib/tenantDb";
import { ORG_CHART_NODES, ORG_CHART_EDGES } from "@/lib/whiteboardTemplates";
import mongoose from "mongoose";

import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    const metaOnly = req.nextUrl.searchParams.get("metaOnly") === "true";
    if (metaOnly && id && mongoose.Types.ObjectId.isValid(id)) {
      const meta: any = await Whiteboard.findById(id).select("_id updatedAt nodes").lean();
      if (meta) {
        return NextResponse.json({
          success: true,
          meta: {
            _id: String(meta._id),
            updatedAt: meta.updatedAt,
            nodesCount: Array.isArray(meta.nodes) ? meta.nodes.length : 0,
          },
        });
      }
    }

    if (id === "org-chart" || id === "default" || id === "default-org-chart") {
      const tenantFilter = getTenantQueryFilter(session);
      let existing: any = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      })
        .select("-passwordHash")
        .sort({ updatedAt: -1 })
        .lean();

      if (!existing) {
        existing = await Whiteboard.findOne({
          $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
        })
          .select("-passwordHash")
          .sort({ updatedAt: -1 })
          .lean();
      }

      if (existing) {
        return NextResponse.json({
          success: true,
          whiteboard: existing,
        });
      }

      return NextResponse.json({
        success: true,
        whiteboard: {
          _id: "default-org-chart",
          title: "Organizational Chart",
          templateId: "org-chart",
          isFavorite: true,
          backgroundColor: "#0D0E11",
          authorName: session.name || "Himesh S",
          authorInitials: "HS",
          isProtected: false,
          deleteRequiresPass: true,
          publicEdit: true,
          tempTokenPhrase: "839102",
          nodes: ORG_CHART_NODES,
          edges: ORG_CHART_EDGES,
          updatedAt: new Date(),
        },
      });
    }

    let board: any = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      board = await Whiteboard.findById(id).select("-passwordHash").lean();
    }

    if (!board) {
      const tenantFilter = getTenantQueryFilter(session);
      board = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      })
        .select("-passwordHash")
        .lean();
    }

    if (!board) {
      return NextResponse.json(
        { success: false, error: "Whiteboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      whiteboard: board,
    });
  } catch (error: any) {
    console.error("Failed to get whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve whiteboard" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    const body = await req.json();
    const {
      title,
      nodes,
      edges,
      isFavorite,
      description,
      backgroundColor,
      deleteRequiresPass,
      publicEdit,
      tempTokenPhrase,
      changePassword,
      currentPassword,
      newPassword,
      newSecurityType,
      editToken,
      passCode,
    } = body;

    let existing: any = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      existing = await Whiteboard.findById(id);
    } else {
      const tenantFilter = getTenantQueryFilter(session);
      existing = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [
          { templateId: "org-chart" },
          { title: title || "Organizational Chart" },
        ],
      });
    }

    const isCreator = Boolean(
      !existing ||
      (existing.authorId && session.userId && String(existing.authorId) === String(session.userId)) ||
      (existing.authorName && (session.name || session.email) && (
        existing.authorName.trim().toLowerCase() === (session.name || "").trim().toLowerCase() ||
        existing.authorName.trim().toLowerCase() === (session.email?.split("@")[0] || "").trim().toLowerCase()
      ))
    );

    // Block non-creators from altering security settings, checkboxes, or tokens
    const isModifyingSecurity = (
      deleteRequiresPass !== undefined ||
      publicEdit !== undefined ||
      tempTokenPhrase !== undefined ||
      Boolean(changePassword)
    );

    if (existing && !isCreator && isModifyingSecurity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only the whiteboard creator (${existing.authorName || "the creator"}) can alter security policies, edit permissions, or regenerate tokens.`,
        },
        { status: 403 }
      );
    }

    const updateFields: any = { updatedAt: new Date() };
    if (title !== undefined) updateFields.title = title;
    if (nodes !== undefined) updateFields.nodes = nodes;
    if (edges !== undefined) updateFields.edges = edges;
    if (isFavorite !== undefined) updateFields.isFavorite = isFavorite;
    if (description !== undefined) updateFields.description = description;
    if (backgroundColor !== undefined) updateFields.backgroundColor = backgroundColor;

    // Only allow updating security fields if creator
    if (isCreator) {
      if (deleteRequiresPass !== undefined) updateFields.deleteRequiresPass = Boolean(deleteRequiresPass);
      if (publicEdit !== undefined) updateFields.publicEdit = Boolean(publicEdit);
      if (tempTokenPhrase !== undefined && /^\d{6}$/.test(String(tempTokenPhrase).trim())) {
        updateFields.tempTokenPhrase = String(tempTokenPhrase).trim();
      }
    }

    // Check edit permission if publicEdit is false on existing board
    if (existing && existing.publicEdit === false && (nodes !== undefined || edges !== undefined)) {
      let hasValidToken = isCreator;

      if (!hasValidToken) {
        if (editToken && existing.tempTokenPhrase && editToken.trim() === existing.tempTokenPhrase.trim()) {
          hasValidToken = true;
        } else if (passCode && existing.passwordHash) {
          hasValidToken = await bcrypt.compare(passCode.trim(), existing.passwordHash);
        } else if (editToken && existing.passwordHash) {
          hasValidToken = await bcrypt.compare(editToken.trim(), existing.passwordHash);
        }

        if (!hasValidToken) {
          return NextResponse.json(
            {
              success: false,
              error: `Edit access restricted by ${existing.authorName || "the creator"}. Please ask them for the 6-digit approval token or master PIN.`,
            },
            { status: 403 }
          );
        }
      }
    }

    // Handle password change request (creator only)
    if (changePassword && newPassword) {
      if (!isCreator) {
        return NextResponse.json(
          { success: false, error: "Only the whiteboard creator can modify the security PIN or password" },
          { status: 403 }
        );
      }

      if (existing && existing.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            { success: false, error: "Current PIN/password is required to set a new password" },
            { status: 400 }
          );
        }
        const matchesCurrent = await bcrypt.compare(currentPassword.trim(), existing.passwordHash);
        if (!matchesCurrent) {
          return NextResponse.json(
            { success: false, error: "Current PIN or password is incorrect" },
            { status: 400 }
          );
        }
      }

      const cleanNewPass = String(newPassword).trim();
      const secType = newSecurityType || "pin";
      if (secType === "pin" && !/^\d{4}$/.test(cleanNewPass)) {
        return NextResponse.json(
          { success: false, error: "4-digit PIN must be exactly 4 numeric digits" },
          { status: 400 }
        );
      }
      if (secType === "password" && cleanNewPass.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      const salt = await bcrypt.genSalt(10);
      updateFields.passwordHash = await bcrypt.hash(cleanNewPass, salt);
      updateFields.isProtected = true;
      updateFields.securityType = secType;
    }

    let updatedBoard: any = null;

    if (existing) {
      if (
        Array.isArray(existing.nodes) &&
        existing.nodes.length >= 100 &&
        Array.isArray(nodes) &&
        nodes.length < existing.nodes.length - 10 &&
        !body.forceOverwrite
      ) {
        console.warn(
          `[PROTECTION] Blocked accidental node truncation for ${id}: DB has ${existing.nodes.length} nodes, incoming has ${nodes.length} nodes.`
        );
        delete updateFields.nodes;
        delete updateFields.edges;
      }

      updatedBoard = await Whiteboard.findByIdAndUpdate(
        existing._id,
        { $set: updateFields },
        { returnDocument: "after" }
      ).select("-passwordHash");
    }

    if (!updatedBoard && (id === "default-org-chart" || id === "org-chart" || id === "default")) {
      const resolvedCompanyId =
        session.companyId && mongoose.Types.ObjectId.isValid(session.companyId)
          ? new mongoose.Types.ObjectId(session.companyId)
          : UNASSIGNED_TENANT_ID;

      updatedBoard = await Whiteboard.create({
        companyId: resolvedCompanyId,
        title: title || "Organizational Chart",
        description: description || "",
        backgroundColor: backgroundColor || "#0D0E11",
        templateId: "org-chart",
        isFavorite: isFavorite ?? true,
        authorName: session.name || "User",
        isProtected: false,
        deleteRequiresPass: true,
        publicEdit: true,
        tempTokenPhrase: Math.floor(100000 + Math.random() * 900000).toString(),
        nodes: nodes || ORG_CHART_NODES,
        edges: edges || ORG_CHART_EDGES,
      });
    }

    if (updatedBoard) {
      await syncTenantWrite("Whiteboard", "update", updatedBoard, undefined, session.companyCode);
    }

    const safeObj = updatedBoard?.toObject ? updatedBoard.toObject() : updatedBoard;
    if (safeObj) delete safeObj.passwordHash;

    return NextResponse.json({
      success: true,
      whiteboard: safeObj,
    });
  } catch (error: any) {
    console.error("Failed to update whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save whiteboard" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();
    const { id } = await context.params;

    let targetBoard: any = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      targetBoard = await Whiteboard.findById(id);
    } else {
      const tenantFilter = getTenantQueryFilter(session);
      targetBoard = await Whiteboard.findOne({
        ...tenantFilter,
        $or: [{ templateId: "org-chart" }, { title: /Organizational/i }],
      });
    }

    if (!targetBoard) {
      return NextResponse.json(
        { success: false, error: "Whiteboard not found" },
        { status: 404 }
      );
    }

    // Verify deletion password if protected and deleteRequiresPass is true
    if (targetBoard.isProtected && targetBoard.deleteRequiresPass && targetBoard.passwordHash) {
      let providedPass = req.headers.get("x-whiteboard-pass") || "";
      try {
        const body = await req.json().catch(() => ({}));
        if (body?.password) providedPass = body.password;
      } catch {}

      if (!providedPass || providedPass.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Password or PIN is required to delete this whiteboard.",
            requiresPassword: true,
          },
          { status: 403 }
        );
      }

      const isMatch = await bcrypt.compare(providedPass.trim(), targetBoard.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          {
            success: false,
            error: "Incorrect PIN or password. Whiteboard deletion denied.",
            requiresPassword: true,
          },
          { status: 403 }
        );
      }
    }

    await Whiteboard.findByIdAndDelete(targetBoard._id);

    if (session.companyCode) {
      await syncTenantWrite("Whiteboard", "delete", { _id: targetBoard._id }, undefined, session.companyCode);
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("Failed to delete whiteboard:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete whiteboard" },
      { status: 500 }
    );
  }
}
