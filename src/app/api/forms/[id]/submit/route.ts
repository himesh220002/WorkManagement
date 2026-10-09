import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Form, Task } from "@/models";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { answers = {}, respondentEmail = "", respondentName = "" } = body;

    let form: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      form = await Form.findById(id);
    }
    if (!form) {
      form = await Form.findOne({ templateId: id as any });
    }

    if (!form) {
      return NextResponse.json({ success: false, error: "Form not found" }, { status: 404 });
    }

    // Validate required questions
    for (const q of form.questions || []) {
      if (q.required && q.type !== "information_block") {
        const val = answers[q.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          return NextResponse.json(
            { success: false, error: `"${q.title.replace(/\s*\*$/, "")}" is required.` },
            { status: 400 }
          );
        }
      }
    }

    const submissionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    let createdTaskId: string | undefined = undefined;

    // Optional task generation if configured
    if (form.createTaskOnSubmission && form.companyId) {
      try {
        // Derive task name from question mapped to task_name or first short_text question
        let taskName = "";
        let taskDescription = "";
        let taskPriority = "Medium";
        let taskDueDate: Date | undefined = undefined;

        for (const q of form.questions || []) {
          const val = answers[q.id];
          if (!val) continue;

          if (q.taskProperty === "task_name" || (!taskName && q.type === "short_text")) {
            taskName = String(val);
          } else if (q.taskProperty === "description" || q.type === "long_text") {
            taskDescription += `${q.title}:\n${String(val)}\n\n`;
          } else if (q.taskProperty === "priority" || q.title.toLowerCase().includes("priority")) {
            const strVal = String(val).toLowerCase();
            if (strVal.includes("urgent") || strVal.includes("p1")) taskPriority = "Urgent";
            else if (strVal.includes("high") || strVal.includes("p2")) taskPriority = "High";
            else if (strVal.includes("low") || strVal.includes("p4")) taskPriority = "Low";
            else taskPriority = "Medium";
          } else if (q.type === "date" || q.taskProperty === "due_date") {
            const parsedDate = new Date(val);
            if (!isNaN(parsedDate.getTime())) taskDueDate = parsedDate;
          }
        }

        if (!taskName) {
          taskName = `${form.title} submission by ${respondentName || respondentEmail || "Guest"}`;
        }

        const newTask = await Task.create({
          companyId: form.companyId,
          name: taskName,
          description: taskDescription || `Generated from Form: ${form.title}`,
          priority: taskPriority,
          status: "Todo",
          dueDate: taskDueDate,
          module: "Form Intake",
        });

        createdTaskId = newTask._id.toString();
      } catch (taskErr) {
        console.warn("Failed to automatically spawn task from form submission:", taskErr);
      }
    }

    const submissionRecord = {
      id: submissionId,
      submittedAt: new Date(),
      respondentEmail,
      respondentName,
      answers,
      createdTaskId: createdTaskId || "",
    };

    if (!form.submissions) {
      form.submissions = [];
    }
    form.submissions.push(submissionRecord);
    await form.save();

    return NextResponse.json({
      success: true,
      message: "Form response submitted successfully!",
      submissionId,
      createdTaskId,
    });
  } catch (error: any) {
    console.error("POST /api/forms/[id]/submit error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit form response" },
      { status: 500 }
    );
  }
}
