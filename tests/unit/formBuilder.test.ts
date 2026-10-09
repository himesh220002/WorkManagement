import { describe, it, expect } from "vitest";
import { FORM_TEMPLATES, QUESTION_TYPE_MENU_ITEMS } from "@/lib/formTemplates";

describe("Form Builder & Templates Engine", () => {
  it("provides all 6 pre-built form templates including start from scratch", () => {
    expect(FORM_TEMPLATES).toHaveLength(6);

    const templateIds = FORM_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain("project-intake");
    expect(templateIds).toContain("feedback");
    expect(templateIds).toContain("order-form");
    expect(templateIds).toContain("job-application");
    expect(templateIds).toContain("it-requests");
    expect(templateIds).toContain("scratch");
  });

  it("verifies Project Intake template questions match requirement specification", () => {
    const intake = FORM_TEMPLATES.find((t) => t.id === "project-intake");
    expect(intake).toBeDefined();
    expect(intake?.name).toBe("Project Intake");
    expect(intake?.description).toContain("Let's get your project started!");

    const questions = intake?.questions || [];
    expect(questions.length).toBeGreaterThanOrEqual(5);

    // Question 1: Project Name
    const q1 = questions[0];
    expect(q1.title).toContain("Project Name");
    expect(q1.required).toBe(true);
    expect(q1.placeholder).toContain("Example: Data Optimization Project");

    // Question 2: Information Block (Layout)
    const q2 = questions[1];
    expect(q2.type).toBe("information_block");
    expect(q2.layoutContent).toContain("Give as many details as you can");

    // Question 3: Details about the project
    const q3 = questions[2];
    expect(q3.type).toBe("long_text");
    expect(q3.title).toContain("Details about the project");
    expect(q3.placeholder).toContain("Project goals, scope, task & Doc links");

    // Question 4: Priority of this project
    const q4 = questions[3];
    expect(q4.taskProperty).toBe("priority");
    expect(q4.options).toContain("Urgent");
    expect(q4.options).toContain("High");

    // Question 5: Attachments
    const q5 = questions[4];
    expect(q5.type).toBe("uploads");
    expect(q5.title).toContain("Attachments");
  });

  it("verifies + Add Question dropdown menu contains both Questions type and Layout categories", () => {
    const categories = new Set(QUESTION_TYPE_MENU_ITEMS.map((item) => item.category));
    expect(categories.has("Questions type")).toBe(true);
    expect(categories.has("Layout")).toBe(true);

    const questionTypes = QUESTION_TYPE_MENU_ITEMS.map((item) => item.type);
    expect(questionTypes).toContain("task_property");
    expect(questionTypes).toContain("short_text");
    expect(questionTypes).toContain("long_text");
    expect(questionTypes).toContain("date");
    expect(questionTypes).toContain("single_select");
    expect(questionTypes).toContain("multi_select");
    expect(questionTypes).toContain("contact_info");
    expect(questionTypes).toContain("people");
    expect(questionTypes).toContain("uploads");
    expect(questionTypes).toContain("number");
    expect(questionTypes).toContain("signature");
    expect(questionTypes).toContain("information_block");
  });

  it("verifies Task Property dropdown menu item contains detailed subproperties", () => {
    const taskProp = QUESTION_TYPE_MENU_ITEMS.find((item) => item.type === "task_property");
    expect(taskProp).toBeDefined();
    expect(taskProp?.hasSubmenu).toBe(true);

    const subTitles = taskProp?.subItems?.map((s) => s.title);
    expect(subTitles).toContain("Task Name");
    expect(subTitles).toContain("Description");
    expect(subTitles).toContain("Priority");
    expect(subTitles).toContain("Due Date");
    expect(subTitles).toContain("Assignee");
    expect(subTitles).toContain("Status");
    expect(subTitles).toContain("Tags");
  });

  it("verifies Contact info dropdown menu item contains contact subitems", () => {
    const contactItem = QUESTION_TYPE_MENU_ITEMS.find((item) => item.type === "contact_info");
    expect(contactItem).toBeDefined();
    expect(contactItem?.hasSubmenu).toBe(true);

    const contactSubItems = contactItem?.subItems?.map((s) => s.title);
    expect(contactSubItems).toContain("Email Address");
    expect(contactSubItems).toContain("Phone Number");
    expect(contactSubItems).toContain("Website URL");
  });
});
