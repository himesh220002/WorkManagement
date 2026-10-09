import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { SavedPerson } from "@/models";
import { getCurrentSession } from "@/server/auth/session";

const INITIAL_SAVED_PERSONS = [
  {
    personUserId: "m-marcus",
    personName: "Marcus Chen",
    personEmail: "marcus.chen@company.io",
    personRole: "Product Manager",
    personDepartment: "Product",
    personAvatar: "MC",
    mentionCount: 5,
  },
  {
    personUserId: "m-elena",
    personName: "Elena Rostova",
    personEmail: "elena.rostova@company.io",
    personRole: "Principal Cloud Engineer",
    personDepartment: "Cloud Infra",
    personAvatar: "ER",
    mentionCount: 4,
  },
  {
    personUserId: "m-sarah",
    personName: "Sarah Jenkins",
    personEmail: "sarah.jenkins@company.io",
    personRole: "VP of Engineering",
    personDepartment: "Executive",
    personAvatar: "SJ",
    mentionCount: 3,
  },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (!session.userId || session.isGuest) {
      return NextResponse.json({
        success: true,
        savedPersons: INITIAL_SAVED_PERSONS,
        isGuest: true,
      });
    }

    let saved = await SavedPerson.find({ ownerUserId: session.userId })
      .sort({ mentionCount: -1, lastMentionedAt: -1 })
      .lean();

    if (!saved || saved.length === 0) {
      // Seed default saved collaborators for new users
      try {
        const seeded = await Promise.all(
          INITIAL_SAVED_PERSONS.map((p) =>
            SavedPerson.create({
              companyId: session.companyId,
              ownerUserId: session.userId,
              personUserId: p.personUserId,
              personName: p.personName,
              personEmail: p.personEmail,
              personRole: p.personRole,
              personDepartment: p.personDepartment,
              personAvatar: p.personAvatar,
              mentionCount: p.mentionCount,
              lastMentionedAt: new Date(),
            })
          )
        );
        return NextResponse.json({
          success: true,
          savedPersons: seeded,
        });
      } catch {
        return NextResponse.json({
          success: true,
          savedPersons: INITIAL_SAVED_PERSONS,
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedPersons: saved,
    });
  } catch (error: any) {
    console.error("Failed to fetch saved persons:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch saved persons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getCurrentSession();

    if (!session.userId || session.isGuest) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { personUserId, personName, personEmail, personRole, personDepartment, action = "add" } = body;

    if (!personUserId || !personName) {
      return NextResponse.json(
        { success: false, error: "personUserId and personName are required" },
        { status: 400 }
      );
    }

    if (action === "remove") {
      await SavedPerson.deleteOne({
        ownerUserId: session.userId,
        personUserId,
      });
      return NextResponse.json({ success: true, removed: true });
    }

    const initials = personName
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const saved = await SavedPerson.findOneAndUpdate(
      {
        ownerUserId: session.userId,
        personUserId,
      },
      {
        companyId: session.companyId,
        ownerUserId: session.userId,
        personUserId,
        personName,
        personEmail: personEmail || "",
        personRole: personRole || "Team Member",
        personDepartment: personDepartment || "General",
        personAvatar: initials,
        $inc: { mentionCount: 1 },
        $set: { lastMentionedAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      savedPerson: saved,
    });
  } catch (error: any) {
    console.error("Failed to update saved person:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update saved person" },
      { status: 500 }
    );
  }
}
