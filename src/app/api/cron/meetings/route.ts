import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { Meeting } from "@/models/meeting";
import { syncTenantWrite } from "@/lib/tenantDb";

/**
 * Automated Cron Job for Meeting Lifecycle & Recurring Auto-Scheduler Rollovers.
 * Can be triggered via AWS EventBridge Scheduler, AWS Lambda, Vercel Cron, or manual curl:
 *
 *   curl -X POST "https://taskpms.cyphertech.online/api/cron/meetings" \
 *        -H "Authorization: Bearer <CRON_SECRET>"
 */
export async function GET(req: NextRequest) {
  return handleMeetingLifecycle(req);
}

export async function POST(req: NextRequest) {
  return handleMeetingLifecycle(req);
}

async function handleMeetingLifecycle(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "default_snapshot_secret";

  if (authHeader !== `Bearer ${expectedSecret}` && querySecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized: Invalid CRON_SECRET" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();

    // Find active scheduled or in-progress meetings
    const activeMeetings = await Meeting.find({
      status: { $in: ["Scheduled", "In Progress"] },
    });

    let completedCount = 0;
    let rolledOverCount = 0;

    for (const m of activeMeetings) {
      const scheduledTime = new Date(m.scheduledAt).getTime();
      const durationMs = (m.durationMinutes || 45) * 60 * 1000;
      const meetingEndTime = new Date(scheduledTime + durationMs);

      // Has this meeting session already passed?
      if (now > meetingEndTime) {
        if (m.isRecurring) {
          // --- RECURRING AUTO-SCHEDULER ROLLOVER ---
          // Google Meet, Discord voice channels, Slack, and Zoom meeting links
          // are reused across recurring series. We advance the scheduledAt date
          // to the next cadence interval so the schedule stays alive automatically.
          const nextDate = new Date(m.scheduledAt);

          switch (m.recurrenceCadence) {
            case "daily":
              // Next business day (skipping weekends if set to weekdays)
              nextDate.setDate(nextDate.getDate() + 1);
              if (m.recurrenceDayOfWeek === "Weekdays") {
                if (nextDate.getDay() === 6) nextDate.setDate(nextDate.getDate() + 2); // Sat -> Mon
                if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1); // Sun -> Mon
              }
              break;

            case "weekly":
              nextDate.setDate(nextDate.getDate() + 7);
              break;

            case "biweekly":
              nextDate.setDate(nextDate.getDate() + 14);
              break;

            case "monthly":
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;

            default:
              nextDate.setDate(nextDate.getDate() + 7);
              break;
          }

          // Update to next scheduled session, keeping the valid link active
          await Meeting.findByIdAndUpdate(m._id, {
            $set: {
              scheduledAt: nextDate,
              status: "Scheduled",
            },
          });

          rolledOverCount++;
        } else {
          // --- ONE-TIME MEETING EXPIRATION ---
          // Mark as Completed and archive the session
          await Meeting.findByIdAndUpdate(m._id, {
            $set: {
              status: "Completed",
            },
          });

          completedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      totalEvaluated: activeMeetings.length,
      oneTimeMeetingsCompleted: completedCount,
      recurringCadencesRolledOver: rolledOverCount,
      message: `Processed ${activeMeetings.length} meetings. Completed ${completedCount} passed sessions and rolled over ${rolledOverCount} recurring auto-cadences.`,
    });
  } catch (error: any) {
    console.error("Meeting cron lifecycle error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process meeting lifecycle cron." },
      { status: 500 }
    );
  }
}
